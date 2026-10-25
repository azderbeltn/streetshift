// App state. Live mode: scenario edits are SpacetimeDB reducers and results arrive by subscription
// (the /sim server recomputes on every edit). Local mode (SpacetimeDB unavailable or
// USE_MOCK_SPACETIME=true): edits stay in the browser and results come from POST /scenario/run.
import { useSyncExternalStore } from "react";
import { DbConnection, tables } from "./module_bindings";
import { api, fromRunResult, type ScenarioInput, type SegMetric, type Summary } from "./api";

export type Presence = { id: string; name: string; color: string; lng: number; lat: number; tool: string; me: boolean };
export type Edit = { kind: "floors" | "land_use" | "park" | "param"; targetId: string; value: string };
export type HearingMsg = { id: string; speaker: string; role: string; text: string; at: number; lookups: { source: string; text: string; score: number }[]; retrievalMs: number };

export type State = {
  mode: "connecting" | "live" | "local";
  area: string; corridorId: string; scenarioId: string;
  closed: Set<string>; addedSeating: boolean; programming: "none" | "light" | "heavy";
  edits: Map<string, Edit>;
  summary: Summary | null; seg: Map<string, SegMetric>; biz: Map<string, number>;
  computing: boolean; revision: number;
  presence: Presence[];
  hearing: HearingMsg[];
};

const NAMES = ["Planner Ada", "Planner Jane", "Planner Robert", "Planner Lewis", "Planner Enrique", "Planner Janette"];
const COLORS = ["#7c9cff", "#ff5fa2", "#3ee08f", "#ffb547", "#4cc3ff", "#c58cff"];
const me = (() => {
  let i = 0;
  try { i = Number(localStorage.getItem("ss_me") ?? Math.floor(Math.random() * NAMES.length)); localStorage.setItem("ss_me", String(i)); } catch { /* private mode */ }
  return { name: NAMES[i % NAMES.length], color: COLORS[i % COLORS.length] };
})();

// Deep links from the ASI:One Analyst: /?area=astoria&corridor=ditmars
const qs = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
const startArea = qs.get("area") ?? "hayes_valley", startCorridor = qs.get("corridor") ?? (qs.get("area") ? "" : "hayes");
let state: State = {
  mode: "connecting", area: startArea, corridorId: startCorridor || "hayes", scenarioId: `${startArea}:${startCorridor || "hayes"}`,
  closed: new Set(), addedSeating: true, programming: "light", edits: new Map(),
  summary: null, seg: new Map(), biz: new Map(), computing: false, revision: 0, presence: [], hearing: [],
};
const listeners = new Set<() => void>();
function set(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach((l) => l()); }
export function getState() { return state; }
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => sel(state));
}

export function scenarioInput(s: State = state): ScenarioInput {
  const segmentMods: ScenarioInput["segmentMods"] = {}, businessMods: ScenarioInput["businessMods"] = {}, assumptions: Record<string, number> = {};
  for (const e of s.edits.values()) {
    if (e.kind === "floors") (segmentMods[e.targetId] ??= {}).extraResidents = Number(e.value) || 0;
    if (e.kind === "park") (segmentMods[e.targetId] ??= {}).park = true;
    if (e.kind === "land_use") businessMods[e.targetId] = { category: e.value };
    if (e.kind === "param") assumptions[e.targetId] = Number(e.value);
  }
  return { area: s.area, corridorId: s.corridorId, closedSegmentIds: [...s.closed], addedSeating: s.addedSeating, programming: s.programming, segmentMods, businessMods, assumptions };
}

// ---------------- live (SpacetimeDB) ----------------
let conn: DbConnection | null = null;

function syncFromDb() {
  if (!conn) return;
  const id = state.scenarioId;
  const sc = conn.db.scenario.id.find(id);
  const closed = new Set([...conn.db.closedSegment.iter()].filter((c) => c.scenarioId === id).map((c) => c.segmentId));
  const edits = new Map<string, Edit>();
  for (const e of conn.db.scenarioEdit.iter()) if (e.scenarioId === id) edits.set(`${e.kind}:${e.targetId}`, { kind: e.kind as Edit["kind"], targetId: e.targetId, value: e.value });
  const r = conn.db.scenarioResult.scenarioId.find(id);
  const seg = new Map<string, SegMetric>();
  for (const m of conn.db.segmentMetric.iter()) if (m.scenarioId === id) seg.set(m.segmentId, m);
  const biz = new Map<string, number>();
  for (const m of conn.db.businessMetric.iter()) if (m.scenarioId === id) biz.set(m.businessId, m.changePct);
  const myId = conn.identity?.toHexString();
  const presence: Presence[] = [...conn.db.presence.iter()].filter((p) => p.online && p.scenarioId === id).map((p) => ({
    id: p.identity.toHexString(), name: p.name, color: p.color, lng: p.lng, lat: p.lat, tool: p.tool, me: p.identity.toHexString() === myId }));
  const hearing: HearingMsg[] = [...conn.db.hearingTurn.iter()].filter((m) => m.scenarioId === id)
    .map((m) => ({ id: String(m.id), speaker: m.speaker, role: m.role, text: m.text, at: Number(m.createdAt.microsSinceUnixEpoch / 1000n), lookups: m.lookups, retrievalMs: m.retrievalMs }))
    .sort((a, b) => a.at - b.at);
  const revision = sc?.revision ?? 0;
  set({
    closed, edits, seg, biz, presence, hearing, revision,
    addedSeating: sc?.addedSeating ?? state.addedSeating, programming: (sc?.programming as State["programming"]) ?? state.programming,
    summary: r ? ({ ...r } as unknown as Summary) : null,
    computing: !!sc && (!r || r.revision < revision),
  });
}

let syncQueued = false;
function queueSync() { if (syncQueued) return; syncQueued = true; requestAnimationFrame(() => { syncQueued = false; syncFromDb(); }); }

export function connect() {
  // DEMO_MODE / no SpacetimeDB: everything runs against the local sim (works without internet).
  if (import.meta.env.USE_MOCK_SPACETIME === "true" || import.meta.env.DEMO_MODE === "true") { set({ mode: "local" }); runLocal(); return; }
  const uri = (import.meta.env.SPACETIMEDB_URI || "https://maincloud.spacetimedb.com").replace(/^http/, "ws");
  const db = import.meta.env.SPACETIMEDB_DB_NAME || "streetshift-qf01o";
  let token: string | undefined;
  try { token = localStorage.getItem("ss_stdb_token") ?? undefined; } catch { /* ignore */ }
  const fallback = setTimeout(() => { if (state.mode === "connecting") { set({ mode: "local" }); runLocal(); } }, 6000);
  conn = DbConnection.builder()
    .withUri(uri).withDatabaseName(db).withToken(token).withAutomaticReconnect()
    .onConnect((c, _identity, tok) => {
      try { localStorage.setItem("ss_stdb_token", tok); } catch { /* ignore */ }
      c.subscriptionBuilder().onApplied(() => {
        clearTimeout(fallback);
        set({ mode: "live" });
        ensureScenario();
        syncFromDb();
      }).subscribe([tables.scenario, tables.closedSegment, tables.scenarioEdit, tables.scenarioResult, tables.segmentMetric, tables.businessMetric, tables.presence, tables.hearingTurn]);
    })
    .onConnectError(() => { clearTimeout(fallback); set({ mode: "local" }); runLocal(); })
    .build();
  for (const t of [conn.db.scenario, conn.db.closedSegment, conn.db.scenarioEdit, conn.db.scenarioResult, conn.db.segmentMetric, conn.db.businessMetric, conn.db.presence, conn.db.hearingTurn] as any[]) {
    t.onInsert(queueSync); t.onDelete(queueSync); t.onUpdate?.(queueSync);
  }
}

function ensureScenario() {
  if (conn && state.mode === "live") conn.reducers.ensureScenario({ id: state.scenarioId, area: state.area, corridorId: state.corridorId });
}

// ---------------- local fallback ----------------
let localTimer: ReturnType<typeof setTimeout> | undefined;
function runLocal() {
  clearTimeout(localTimer);
  set({ computing: true });
  localTimer = setTimeout(async () => {
    try {
      const r = fromRunResult(await api.run(scenarioInput()));
      set({ summary: r.summary, seg: r.seg, biz: r.biz, computing: false });
    } catch (e) { console.error(e); set({ computing: false }); }
  }, 80);
}

// ---------------- actions ----------------
export const actions = {
  selectCorridor(area: string, corridorId: string) {
    set({ area, corridorId, scenarioId: `${area}:${corridorId}`, closed: new Set(), edits: new Map(), summary: null, seg: new Map(), biz: new Map(), hearing: [] });
    if (state.mode === "live") { ensureScenario(); syncFromDb(); } else if (state.mode === "local") runLocal();
  },
  setClosed(segmentIds: string[], closed: boolean) {
    if (state.mode === "live" && conn) {
      for (const segmentId of segmentIds) conn.reducers.setSegmentClosed({ scenarioId: state.scenarioId, segmentId, closed });
      const next = new Set(state.closed); for (const s of segmentIds) closed ? next.add(s) : next.delete(s);
      set({ closed: next, computing: true }); // optimistic
    } else {
      const next = new Set(state.closed); for (const s of segmentIds) closed ? next.add(s) : next.delete(s);
      set({ closed: next }); runLocal();
    }
  },
  setOptions(addedSeating: boolean, programming: State["programming"]) {
    if (state.mode === "live" && conn) { conn.reducers.setOptions({ scenarioId: state.scenarioId, addedSeating, programming }); set({ addedSeating, programming, computing: true }); }
    else { set({ addedSeating, programming }); runLocal(); }
  },
  setEdit(kind: Edit["kind"], targetId: string, value: string) {
    if (state.mode === "live" && conn) { conn.reducers.setEdit({ scenarioId: state.scenarioId, kind, targetId, value }); set({ computing: true }); }
    else {
      const edits = new Map(state.edits); const k = `${kind}:${targetId}`;
      if (value === "") edits.delete(k); else edits.set(k, { kind, targetId, value });
      set({ edits }); runLocal();
    }
  },
  clear() {
    if (state.mode === "live" && conn) { conn.reducers.clearScenario({ scenarioId: state.scenarioId }); set({ computing: true }); }
    else { set({ closed: new Set(), edits: new Map() }); runLocal(); }
  },
  presence(lng: number, lat: number, tool: string) {
    if (state.mode === "live" && conn) conn.reducers.updatePresence({ name: me.name, color: me.color, scenarioId: state.scenarioId, lng, lat, tool });
  },
  postHearing(speaker: string, role: string, text: string) {
    if (state.mode === "live" && conn) conn.reducers.postHearingMessage({ scenarioId: state.scenarioId, speaker, role, text });
    else set({ hearing: [...state.hearing, { id: String(Date.now()), speaker, role, text, at: Date.now(), lookups: [], retrievalMs: 0 }] });
  },
  setLocalHearing(h: HearingMsg[]) { if (state.mode !== "live") set({ hearing: h }); },
  clearHearing() {
    if (state.mode === "live" && conn) conn.reducers.clearHearing({ scenarioId: state.scenarioId });
    else set({ hearing: [] });
  },
};
export const myself = me;
