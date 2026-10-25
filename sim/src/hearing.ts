// Simulated public hearing. Four Claude-powered stakeholder characters argue about the current
// scenario, each grounded in facts it looks up first: Moss (persistent `streetshift-facts` index,
// sub-10 ms in-memory hybrid search, plus a per-hearing session index that remembers what was said)
// with Elastic hybrid search as fallback. Turns (with their lookups) go to SpacetimeDB so every
// viewer sees the hearing live.
//
// Characters are fictional composites, not real business owners or residents.
import { MossClient, type SessionIndex } from "@moss-js/moss";
import { runScenario, type ScenarioRequest } from "./model.ts";
import { loadNetwork } from "./network.ts";
import { loadBusinesses } from "./economy.ts";
import { claude } from "./claude.ts";
import { search } from "./search.ts";
import { liveConn } from "./live.ts";

export type Lookup = { source: string; text: string; score: number };
export type Turn = { speaker: string; role: string; text: string; lookups: Lookup[]; retrievalMs: number };

const INDEX = process.env.MOSS_INDEX ?? "streetshift-facts";
let moss: MossClient | null = null;
let mossReady: Promise<boolean> | null = null;
const sessions = new Map<string, SessionIndex>();
const local = new Map<string, Turn[]>(); // fallback transcript when SpacetimeDB is unavailable

const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms} ms`)), ms))]);

let mossLoaded = false;
let mossSkipUntil = 0; // after a slow load, use Elastic for a while instead of waiting again
/** True once the persistent index is in memory. Never blocks a hearing for more than 10 s: if the
 *  load is slow we fall back to Elastic and switch to Moss as soon as the load completes. */
function ensureMoss(): Promise<boolean> {
  if (mossLoaded) return Promise.resolve(true);
  if (!mossReady) {
    if (process.env.USE_MOCK_MOSS === "true" || !process.env.MOSS_PROJECT_ID) mossReady = Promise.resolve(false);
    else {
      moss = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!);
      mossReady = moss.loadIndex(INDEX).then(() => { mossLoaded = true; console.log(`[hearing] Moss index ${INDEX} loaded`); return true; })
        .catch((e) => { console.error("[hearing] Moss load failed, using Elastic:", String(e).slice(0, 160)); mossReady = null; return false; });
    }
  }
  if (Date.now() < mossSkipUntil) return Promise.resolve(false);
  return withTimeout(mossReady, 10000, "Moss loadIndex").catch(() => { mossSkipUntil = Date.now() + 120_000; return false; });
}
export function warmHearing() { void ensureMoss(); }

async function session(scenarioId: string): Promise<SessionIndex | null> {
  if (!(await ensureMoss()) || !moss) return null;
  const k = `hearing-${scenarioId.replace(/[^a-z0-9-]/gi, "-")}`;
  if (!sessions.has(k)) sessions.set(k, await withTimeout(moss.session(k), 8000, "Moss session"));
  return sessions.get(k)!;
}

/** Look up facts: Moss persistent index (filtered to the area) + this hearing's session memory. */
async function lookup(scenarioId: string, area: string, q: string): Promise<{ lookups: Lookup[]; ms: number }> {
  const t0 = performance.now();
  const out: Lookup[] = [];
  if (await ensureMoss()) {
    try {
      const r: any = await withTimeout(moss!.query(INDEX, q, { topK: 4, alpha: 0.6, filter: { field: "area", condition: { $eq: area } } } as any), 5000, "Moss query");
      for (const d of r.docs ?? []) out.push({ source: "Moss · facts", text: d.text, score: Math.round(d.score * 1000) / 1000 });
      const s = await session(scenarioId);
      if (s) {
        const rs: any = await withTimeout(s.query(q, { topK: 2, alpha: 0.7 } as any), 5000, "Moss session query");
        for (const d of rs.docs ?? []) out.push({ source: "Moss · this hearing", text: d.text, score: Math.round(d.score * 1000) / 1000 });
      }
    } catch (e) { console.error("[hearing] Moss query failed:", String(e).slice(0, 160)); }
  }
  if (!out.length) {
    const r = await search(q, area);
    for (const h of r.hits.slice(0, 4)) out.push({ source: `Elastic · ${r.mode}`, text: `${h.name} (${h.category}): "${h.snippet ?? ""}"`, score: Math.round((h.score ?? 0) * 1000) / 1000 });
  }
  return { lookups: out, ms: Math.round((performance.now() - t0) * 10) / 10 };
}

async function remember(scenarioId: string, id: string, text: string) {
  try { const s = await session(scenarioId); if (s) await withTimeout(s.addDocs([{ id, text }]), 8000, "Moss addDocs"); } catch { /* memory is best-effort */ }
}

function post(scenarioId: string, t: Turn) {
  if (liveConn) liveConn.reducers.postHearingTurn({ scenarioId, ...t });
  else (local.get(scenarioId) ?? local.set(scenarioId, []).get(scenarioId)!).push(t);
}
export function localTranscript(scenarioId: string) { return local.get(scenarioId) ?? []; }

type Character = { key: string; name: string; role: string; persona: string; query: (ctx: Ctx) => string };
type Ctx = { street: string; overflow: string; area: string };

export const CHARACTERS: Character[] = [
  { key: "cafe", name: "Maya", role: "Café owner on the block", query: (c) => `cafe restaurant outdoor seating customers ${c.street}`,
    persona: "You run a small café on the street being closed. You care about foot traffic, outdoor seating, deliveries and the regulars who drive in. You are hopeful but anxious about rent." },
  { key: "commuter", name: "Dev", role: "Commuter who drives through", query: (c) => `parking traffic driving hard to park ${c.street}`,
    persona: "You drive through this neighbourhood to work. You care about added travel time, which streets get jammed, and parking. You are skeptical but fair." },
  { key: "resident", name: "Rosa", role: "Resident on an overflow street", query: (c) => `noise traffic residential ${c.overflow}`,
    persona: "You live on the street that would absorb rerouted cars. You care about noise, safety and cut-through traffic, and you want the city to protect your block too." },
  { key: "parent", name: "Sam", role: "Parent who walks kids to school", query: (c) => `family kids playground park walking ${c.street}`,
    persona: "You walk two kids to school past this street. You care about safety, places to sit and play, and meeting neighbours. You lean in favour if crossings stay safe." },
];

const sgn = (x: number) => `${x > 0 ? "+" : ""}${x}`;

function facts(r: ReturnType<typeof runScenario>, ctx: Ctx, req: ScenarioRequest) {
  const m = r.metrics, c = r.connection, b = r.baseline.interaction;
  const names = new Map(loadBusinesses(req.area).map((x) => [x.id, x.name]));
  const ranked = [...m.economy.perBusiness].sort((x, y) => y.changePct - x.changePct);
  const fmt = (xs: typeof ranked) => xs.map((x) => `${names.get(x.businessId)} ${sgn(x.changePct)}%`).join(", ") || "none";
  const winners = fmt(ranked.filter((x) => x.changePct > 2).slice(0, 3)), losers = fmt(ranked.filter((x) => x.changePct < -2).slice(-3).reverse());
  return [
    `Scenario: ${ctx.street} closed to cars${r.flags.length ? "" : ""}.`,
    `Connection (model output, not validated): ${m.interaction.verdict}; conversations ${b.encountersPerHour} -> ${c.conversationsPerHour}/h (range ${c.range.conversationsPerHour.join("-")}); lingering ${b.dwellMinutes} -> ${c.lingerMinutes} min; new connections ~${c.newConnectionsPerDay}/day.`,
    `Economy: revenue of the businesses affected changes by ${sgn(m.economy.totalRevenueChangePct)}% on average (a ${m.economy.totalRevenueChangePct >= 0 ? "GAIN" : "LOSS"}; range ${sgn(m.economy.range[0])}% to ${sgn(m.economy.range[1])}%). Biggest winners: ${winners}. Biggest losers: ${losers}.`,
    `Traffic: +${m.traffic.addedVehicleHours} vehicle-hours/day (range ${m.traffic.range.join("-")}), ${r.traffic.reroutedVehPerHour} cars rerouted per peak hour; busiest overflow street: ${ctx.overflow}.`,
  ].join("\n");
}

function context(req: ScenarioRequest, r: ReturnType<typeof runScenario>): Ctx {
  const net = loadNetwork(req.area);
  const street = net.segById.get(req.closedSegmentIds[0])?.name ?? "the street";
  const top = r.metrics.traffic.overflowSegments[0];
  return { street, overflow: top ? net.segById.get(top.segmentId)?.name ?? "a nearby street" : "nearby streets", area: req.area };
}

const STYLE = "Read the signs on numbers carefully (a + is a gain). Speak in first person, 2-3 sentences, plain spoken, like at a city council public comment. Use at most one number, only from the facts or lookups given. If you reference a business, only use one named in the lookups. Never claim to be a real person or owner of a real business. React to what earlier speakers said.";

async function speak(scenarioId: string, ch: Character, ctx: Ctx, scenarioFacts: string, transcript: string[], extra?: string): Promise<Turn> {
  const q = extra ? `${extra} ${ch.query(ctx)}` : ch.query(ctx);
  const { lookups, ms } = await lookup(scenarioId, ctx.area, q);
  const text = (await claude(
    `You are ${ch.name}, ${ch.role.toLowerCase()} near ${ctx.street} (${ctx.area.replace("_", " ")}). ${ch.persona} ${STYLE}`,
    [`SIMULATION FACTS\n${scenarioFacts}`, `WHAT YOU LOOKED UP\n${lookups.map((l) => `- ${l.text}`).join("\n") || "- nothing found"}`,
      `HEARING SO FAR\n${transcript.slice(-6).join("\n") || "(you speak first)"}`, extra ? `QUESTION FOR YOU: ${extra}\nAnswer it directly.` : "Give your public comment."].join("\n\n"),
    { maxTokens: 2000, fast: !!extra })) ?? `${ch.name} has no comment right now (Claude not configured).`;
  const turn = { speaker: ch.name, role: ch.role, text: text.trim(), lookups: lookups.slice(0, 5), retrievalMs: ms };
  post(scenarioId, turn);
  void remember(scenarioId, `${Date.now()}-${ch.key}`, `${ch.name} (${ch.role}) said: ${turn.text}`);
  return turn;
}

/** Run a two-round hearing on the scenario; turns are posted as they are produced. */
export async function startHearing(scenarioId: string, req: ScenarioRequest, rounds = 2) {
  const r = runScenario(req);
  const ctx = context(req, r);
  const scenarioFacts = facts(r, ctx, req);
  void remember(scenarioId, `facts-${Date.now()}`, scenarioFacts);
  post(scenarioId, { speaker: "Chair", role: "Hearing chair", text: `This hearing will consider closing ${ctx.street} to cars. The simulation says: ${r.metrics.interaction.verdict.replace("_", " ").toLowerCase()} for public life (conversations ${r.baseline.interaction.encountersPerHour} → ${r.connection.conversationsPerHour} per hour), ${sgn(r.metrics.economy.totalRevenueChangePct)}% revenue for affected businesses, +${r.metrics.traffic.addedVehicleHours} vehicle-hours of delay a day. Public comment is open.`, lookups: [], retrievalMs: 0 });
  const transcript: string[] = [];
  for (let k = 0; k < rounds; k++) {
    for (const ch of CHARACTERS) {
      const t = await speak(scenarioId, ch, ctx, scenarioFacts, transcript);
      transcript.push(`${t.speaker} (${t.role}): ${t.text}`);
    }
  }
  return { turns: transcript.length };
}

/** A judge's question to one character (typed, or transcribed from voice). Uses the fast model. */
export async function askCharacter(scenarioId: string, req: ScenarioRequest, characterKey: string, question: string, history: string[] = []) {
  const ch = CHARACTERS.find((c) => c.key === characterKey) ?? CHARACTERS[0];
  const r = runScenario(req);
  const ctx = context(req, r);
  post(scenarioId, { speaker: "Judge", role: `Question for ${ch.name}`, text: question, lookups: [], retrievalMs: 0 });
  void remember(scenarioId, `${Date.now()}-q`, `The judge asked ${ch.name}: ${question}`);
  return speak(scenarioId, ch, ctx, facts(r, ctx, req), history, question);
}
