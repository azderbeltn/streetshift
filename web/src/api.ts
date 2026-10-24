// HTTP client for the /sim API, plus the shared result shape used by both live (SpacetimeDB)
// and local (direct HTTP) modes.

export const SIM_URL = `http://localhost:${import.meta.env.SIM_PORT || "8787"}`;

export type Segment = { id: string; name: string; coords: [number, number][]; highway: string; lengthM: number };
export type Corridor = { id: string; name: string; role: "treated" | "control" | "forward"; pair: string | null; segmentIds: string[]; lengthM: number };
export type NetworkPayload = { area: string; center: [number, number]; corridors: Record<string, Corridor>; segments: Segment[] };
export type Business = { id: string; name: string; category: string; lng: number; lat: number; rating: number | null; reviewCount: number | null;
  popularTimes: number[][] | null; carDependence: number; segmentId: string; group?: string };
export type AreaSummary = { area: string; city: string; center: [number, number]; businesses: number; populationInCircle: number | null;
  householdsInCircle: number | null; corridors: (Corridor & { id: string })[] };
export type Trip = { path: [number, number][]; timestamps: number[]; kind?: "linger" | "walk" };
export type TripsPayload = { loopSeconds: number; cars: Trip[]; peds: Trip[]; agents: { cars: number; peds: number; populationInCircle: number | null } };

/** Same fields as the SpacetimeDB `scenario_result` row. */
export type Summary = {
  revision: number; elapsedMs: number; verdict: string; lingerIndex: number;
  conversationsPerHour: number; conversationsLo: number; conversationsHi: number; lingerMinutes: number;
  newConnectionsPerDay: number; newConnectionsLo: number; newConnectionsHi: number; peoplePresent: number;
  revenueChangePct: number; revenueLo: number; revenueHi: number;
  addedVehicleHours: number; vehicleHoursLo: number; vehicleHoursHi: number; reroutedVehPerHour: number;
  beforeConversationsPerHour: number; beforeLingerMinutes: number; beforeNewConnectionsPerDay: number; beforeLingerIndex: number;
  flags: string;
};
export type SegMetric = { segmentId: string; baseCar: number; afterCar: number; loadPct: number; basePed: number; afterPed: number };

export type ScenarioInput = {
  area: string; corridorId?: string; closedSegmentIds: string[]; addedSeating: boolean; programming: "none" | "light" | "heavy";
  segmentMods?: Record<string, { extraResidents?: number; park?: boolean }>; businessMods?: Record<string, { category: string }>;
};

async function j<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(SIM_URL + path, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}

export const api = {
  areas: () => j<AreaSummary[]>("/areas"),
  network: (area: string) => j<NetworkPayload>(`/areas/${area}/network`),
  businesses: (area: string) => j<Business[]>(`/areas/${area}/businesses`),
  trips: (s: ScenarioInput) => j<TripsPayload>("/scenario/trips", s),
  run: (s: ScenarioInput) => j<any>("/scenario/run", s),
  search: (q: string, area?: string) => j<{ hits: SearchHit[]; mode: string }>(`/search?q=${encodeURIComponent(q)}${area ? `&area=${area}` : ""}`),
  backtest: () => j<any>("/backtest/results"),
  merchantReport: (area: string, businessId: string, s: ScenarioInput) => j<any>("/report/merchant", { ...s, area, businessId }),
};

export type SearchHit = { businessId?: string; name: string; category?: string; snippet?: string; score?: number; lng?: number; lat?: number; area?: string };

/** Convert a /scenario/run RunResult to the live Summary + segment metrics (local/mock mode). */
export function fromRunResult(r: any): { summary: Summary; seg: Map<string, SegMetric>; biz: Map<string, number> } {
  const m = r.metrics;
  const summary: Summary = {
    revision: 0, elapsedMs: r.elapsedMs, verdict: m.interaction.verdict, lingerIndex: m.interaction.lingerIndex,
    conversationsPerHour: r.connection.conversationsPerHour, conversationsLo: r.connection.range.conversationsPerHour[0], conversationsHi: r.connection.range.conversationsPerHour[1],
    lingerMinutes: r.connection.lingerMinutes, newConnectionsPerDay: r.connection.newConnectionsPerDay,
    newConnectionsLo: r.connection.range.newConnectionsPerDay[0], newConnectionsHi: r.connection.range.newConnectionsPerDay[1], peoplePresent: r.connection.peoplePresent,
    revenueChangePct: m.economy.totalRevenueChangePct, revenueLo: m.economy.range[0], revenueHi: m.economy.range[1],
    addedVehicleHours: m.traffic.addedVehicleHours, vehicleHoursLo: m.traffic.range[0], vehicleHoursHi: m.traffic.range[1], reroutedVehPerHour: r.traffic.reroutedVehPerHour,
    beforeConversationsPerHour: r.baseline.interaction.encountersPerHour, beforeLingerMinutes: r.baseline.interaction.dwellMinutes,
    beforeNewConnectionsPerDay: r.baseline.interaction.newConnectionsPerDay, beforeLingerIndex: r.baseline.interaction.lingerIndex,
    flags: r.flags.join(" | "),
  };
  const seg = new Map<string, SegMetric>();
  for (const id of new Set([...Object.keys(r.segmentLoads), ...Object.keys(r.segmentPed)])) {
    const l = r.segmentLoads[id], p = r.segmentPed[id];
    seg.set(id, { segmentId: id, baseCar: l?.base ?? 0, afterCar: l?.after ?? 0, loadPct: l?.pct ?? 0, basePed: p?.base ?? 0, afterPed: p?.after ?? 0 });
  }
  const biz = new Map<string, number>(m.economy.perBusiness.map((b: any) => [b.businessId, b.changePct]));
  return { summary, seg, biz };
}
