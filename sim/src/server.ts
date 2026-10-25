// StreetShift simulation HTTP API (+ the SpacetimeDB live loop).
//   GET  /health
//   GET  /areas                       areas, corridors, business counts
//   GET  /areas/:area/network         segments (id, name, coords, highway) + corridors, for the map
//   GET  /areas/:area/businesses      contract Business[] with model group
//   POST /scenario/run                ScenarioRequest -> RunResult (Metrics + extras), < 5 s
//   POST /scenario/trips              ScenarioRequest -> TripsLayer payload
//   POST /backtest/predict            {area, treatedId, controlId} -> predicted gap (no ground truth here)
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { listAreas, loadNetwork } from "./network.ts";
import { loadBusinesses, loadContext, runEconomy } from "./economy.ts";
import { runScenario, predictGap, type ScenarioRequest } from "./model.ts";
import { runTraffic } from "./traffic.ts";
import { buildTrips } from "./trips.ts";
import { startLive, liveStatus } from "./live.ts";
import { search } from "./search.ts";
import { merchantReport } from "./report.ts";
import { KNOBS, withAssumptions } from "./assumptions.ts";
import { CHARACTERS, askCharacter, localTranscript, startHearing, warmHearing } from "./hearing.ts";

const envFile = join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);
const PORT = Number(process.env.SIM_PORT ?? 8787);

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function areaSummary(area: string) {
  const net = loadNetwork(area);
  const ctx = loadContext(area);
  return { area, city: net.city, center: net.center, businesses: loadBusinesses(area).length,
    populationInCircle: ctx?.census?.populationInCircle ?? null, householdsInCircle: ctx?.census?.householdsInCircle ?? null,
    corridors: Object.entries(net.corridors).map(([id, c]) => ({ id, ...c })) };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://x");
    const parts = url.pathname.split("/").filter(Boolean);
    if (req.method === "OPTIONS") return send(res, 204, {});
    if (req.method === "GET" && url.pathname === "/health") return send(res, 200, { ok: true, areas: listAreas(), live: liveStatus });
    if (req.method === "GET" && url.pathname === "/areas") return send(res, 200, listAreas().map(areaSummary));
    if (req.method === "GET" && url.pathname === "/assumptions") return send(res, 200, KNOBS);
    if (req.method === "GET" && parts[0] === "areas" && parts[2] === "network") {
      const net = loadNetwork(parts[1]);
      return send(res, 200, { area: net.area, center: net.center, corridors: net.corridors,
        segments: net.segments.map((s) => ({ id: s.id, name: s.name, coords: s.coords, highway: s.highway, lengthM: s.lengthM })) });
    }
    if (req.method === "GET" && parts[0] === "areas" && parts[2] === "businesses") return send(res, 200, loadBusinesses(parts[1]));
    if (req.method === "GET" && parts[0] === "areas" && parts[2] === "buildings") {
      // OSM footprints for the offline basemap (data/fetch_buildings.py).
      const f = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", parts[1], "buildings.json");
      return send(res, 200, existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : []);
    }
    if (req.method === "POST" && url.pathname === "/scenario/run") {
      const body: ScenarioRequest = await readJson(req);
      return send(res, 200, runScenario(body));
    }
    if (req.method === "POST" && url.pathname === "/scenario/trips") {
      const body: ScenarioRequest = await readJson(req);
      const net = loadNetwork(body.area);
      const s = { closedSegmentIds: body.closedSegmentIds ?? [], addedSeating: !!body.addedSeating, programming: body.programming ?? "none", segmentMods: body.segmentMods, businessMods: body.businessMods };
      return send(res, 200, withAssumptions(body.assumptions, () => {
        const econ = runEconomy(net, loadBusinesses(body.area), s, runTraffic(net, s.closedSegmentIds, "mid"), "mid");
        return buildTrips(net, s.closedSegmentIds, econ.pedAt);
      }));
    }
    if (req.method === "GET" && url.pathname === "/backtest/results") {
      // Output of validation/score.ts (predictions + scores). /sim never reads ground_truth.json itself.
      const f = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "validation", "backtest_results.json");
      if (!existsSync(f)) return send(res, 404, { error: "run validation/score.ts first" });
      const v1 = join(dirname(f), "backtest_results_v1.json");
      return send(res, 200, { ...JSON.parse(readFileSync(f, "utf8")), v1Summary: existsSync(v1) ? JSON.parse(readFileSync(v1, "utf8")).summary : null });
    }
    if (req.method === "GET" && url.pathname === "/search") {
      return send(res, 200, await search(url.searchParams.get("q") ?? "", url.searchParams.get("area") ?? undefined));
    }
    if (req.method === "POST" && url.pathname === "/report/merchant") {
      const b = await readJson(req);
      return send(res, 200, await withAssumptions(b.assumptions, () => merchantReport(b)));
    }
    if (req.method === "GET" && url.pathname === "/hearing/characters") return send(res, 200, CHARACTERS.map(({ key, name, role }) => ({ key, name, role })));
    if (req.method === "GET" && url.pathname === "/hearing/local") return send(res, 200, localTranscript(url.searchParams.get("scenarioId") ?? ""));
    if (req.method === "POST" && url.pathname === "/hearing/start") {
      const b = await readJson(req);
      // Runs in the background; turns stream to SpacetimeDB (hearing_turn) as they are produced.
      void withAssumptions(b.assumptions, () => startHearing(b.scenarioId, b)).catch((e) => console.error("[hearing]", e));
      return send(res, 202, { started: true });
    }
    if (req.method === "POST" && url.pathname === "/hearing/ask") {
      const b = await readJson(req);
      return send(res, 200, await withAssumptions(b.assumptions, () => askCharacter(b.scenarioId, b, b.character, b.question, b.history ?? [])));
    }
    if (req.method === "POST" && url.pathname === "/backtest/predict") {
      const b = await readJson(req);
      return send(res, 200, predictGap(b.treatedId, b.controlId, b.area, b.programming ?? "light"));
    }
    send(res, 404, { error: "not found" });
  } catch (err) {
    send(res, 400, { error: String(err instanceof Error ? err.message : err) });
  }
});

server.listen(PORT, () => {
  console.log(`[sim] http://localhost:${PORT}  areas: ${listAreas().join(", ")}`);
  warmHearing();
  if (process.argv.includes("--no-live")) return;
  startLive();
});
