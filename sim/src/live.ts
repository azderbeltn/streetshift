// Live loop: subscribe to scenario edits in SpacetimeDB, recompute, publish results back.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DbConnection, tables } from "./module_bindings/index.ts";
import { runScenario, type ScenarioRequest } from "./model.ts";

const TOKEN_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", ".spacetime_token");

export type LiveStatus = { connected: boolean; identity?: string; lastPublish?: { scenarioId: string; revision: number; ms: number }; error?: string };
export const liveStatus: LiveStatus = { connected: false };

export function startLive(): DbConnection | null {
  if (process.env.USE_MOCK_SPACETIME === "true") { liveStatus.error = "USE_MOCK_SPACETIME=true"; return null; }
  const uri = (process.env.SPACETIMEDB_URI ?? "https://maincloud.spacetimedb.com").replace(/^http/, "ws");
  const db = process.env.SPACETIMEDB_DB_NAME ?? "streetshift-qf01o";
  const pending = new Map<string, ReturnType<typeof setTimeout>>();

  const recompute = (conn: DbConnection, scenarioId: string) => {
    const s = conn.db.scenario.id.find(scenarioId);
    if (!s) return;
    const closed = [...conn.db.closedSegment.iter()].filter((c) => c.scenarioId === scenarioId).map((c) => c.segmentId);
    const edits = [...conn.db.scenarioEdit.iter()].filter((e) => e.scenarioId === scenarioId);
    const req: ScenarioRequest = { area: s.area, corridorId: s.corridorId || undefined, closedSegmentIds: closed,
      addedSeating: s.addedSeating, programming: s.programming as ScenarioRequest["programming"], segmentMods: {}, businessMods: {} };
    for (const e of edits) {
      if (e.kind === "floors") (req.segmentMods![e.targetId] ??= {}).extraResidents = Number(e.value) || 0;
      if (e.kind === "park") (req.segmentMods![e.targetId] ??= {}).park = true;
      if (e.kind === "land_use") req.businessMods![e.targetId] = { category: e.value };
      if (e.kind === "param") (req.assumptions ??= {})[e.targetId] = Number(e.value);
    }
    let r;
    try { r = runScenario(req); } catch (err) { liveStatus.error = String(err); return; }
    const m = r.metrics;
    const segs = Object.keys({ ...r.segmentLoads, ...r.segmentPed }).map((segmentId) => ({
      segmentId, baseCar: r.segmentLoads[segmentId]?.base ?? 0, afterCar: r.segmentLoads[segmentId]?.after ?? 0,
      loadPct: r.segmentLoads[segmentId]?.pct ?? 0, basePed: r.segmentPed[segmentId]?.base ?? 0, afterPed: r.segmentPed[segmentId]?.after ?? 0,
    }));
    conn.reducers.publishResults({
      scenarioId, revision: s.revision, elapsedMs: r.elapsedMs, verdict: m.interaction.verdict, lingerIndex: m.interaction.lingerIndex,
      conversationsPerHour: r.connection.conversationsPerHour, conversationsLo: r.connection.range.conversationsPerHour[0], conversationsHi: r.connection.range.conversationsPerHour[1],
      lingerMinutes: r.connection.lingerMinutes, newConnectionsPerDay: r.connection.newConnectionsPerDay,
      newConnectionsLo: r.connection.range.newConnectionsPerDay[0], newConnectionsHi: r.connection.range.newConnectionsPerDay[1], peoplePresent: r.connection.peoplePresent,
      revenueChangePct: m.economy.totalRevenueChangePct, revenueLo: m.economy.range[0], revenueHi: m.economy.range[1],
      addedVehicleHours: m.traffic.addedVehicleHours, vehicleHoursLo: m.traffic.range[0], vehicleHoursHi: m.traffic.range[1], reroutedVehPerHour: r.traffic.reroutedVehPerHour,
      beforeConversationsPerHour: r.baseline.interaction.encountersPerHour, beforeLingerMinutes: r.baseline.interaction.dwellMinutes,
      beforeNewConnectionsPerDay: r.baseline.interaction.newConnectionsPerDay, beforeLingerIndex: r.baseline.interaction.lingerIndex,
      flags: r.flags.join(" | "), segments: segs, businesses: m.economy.perBusiness,
    });
    liveStatus.lastPublish = { scenarioId, revision: s.revision, ms: r.elapsedMs };
  };
  const schedule = (conn: DbConnection, id: string) => {
    clearTimeout(pending.get(id));
    pending.set(id, setTimeout(() => { pending.delete(id); recompute(conn, id); }, 120));
  };

  const conn = DbConnection.builder()
    .withUri(uri)
    .withDatabaseName(db)
    .withToken(existsSync(TOKEN_FILE) ? readFileSync(TOKEN_FILE, "utf8").trim() : undefined)
    .withAutomaticReconnect()
    .onConnect((c, identity, token) => {
      writeFileSync(TOKEN_FILE, token);
      liveStatus.connected = true; liveStatus.identity = identity.toHexString();
      c.subscriptionBuilder()
        .onApplied(() => console.log(`[live] subscribed to ${db}: ${[...c.db.scenario.iter()].length} scenarios`))
        .subscribe([tables.scenario, tables.closedSegment, tables.scenarioEdit]);
    })
    .onDisconnect(() => { liveStatus.connected = false; })
    .onConnectError((_c, err) => { liveStatus.error = String(err); console.error("[live] connect error", err); })
    .build();

  conn.db.scenario.onInsert((_ctx, s) => schedule(conn, s.id));
  conn.db.scenario.onUpdate((_ctx, a, b) => { if (a.revision !== b.revision) schedule(conn, b.id); });
  return conn;
}
