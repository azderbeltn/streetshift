// C. Traffic: baseline car trips, closure rerouting, BPR congestion, added vehicle-hours.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ASSETS, type Network, shortestPath, rng, haversineM } from "./network.ts";
import { P, type Level } from "./params.ts";

export type TrafficBaseline = {
  trips: { o: string; d: string; path: number[] }[];
  sampleFlow: Float64Array; // sample trips per directed edge
  vehPerSampleTrip: number; // calibrated: peak-hour vehicles represented by one sample trip
  calibration: { method: "counts" | "defaults"; nCountEdges: number; scale: number; note: string };
  capacity: Float64Array; // veh/h per directed edge
};

export type TrafficResult = {
  addedVehicleHours: number; // per day
  overflowSegments: { segmentId: string; loadIncreasePct: number }[];
  segmentLoads: Record<string, { base: number; after: number; pct: number }>;
  reroutedTrips: number; unreachableTrips: number; peakVolumeScale: number;
  estimated: boolean;
};

const baselines = new Map<string, TrafficBaseline>();

function classVal<T>(table: Record<string, T>, hw: string): T { return table[hw] ?? table[hw.replace("_link", "")] ?? table.default; }

function perDirectionLanes(net: Network, ei: number): number {
  const e = net.edges[ei];
  const seg = net.segById.get(e.segmentId)!;
  const twoWay = (net.edgesBySeg.get(e.segmentId) ?? []).some((j) => net.edges[j].u === e.v && net.edges[j].v === e.u);
  return Math.max(1, twoWay ? Math.round(seg.lanes / 2) : seg.lanes);
}

/** Normalise street names so NYC ATR "21 AVE" matches OSM "21st Avenue". */
export function normStreet(s: string): string {
  const x = s.toUpperCase().replace(/[.,]/g, " ").replace(/\b(\d+)(ST|ND|RD|TH)\b/g, "$1")
    .replace(/\bAVENUE\b|\bAV\b/g, "AVE").replace(/\bSTREET\b/g, "ST").replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bROAD\b/g, "RD").replace(/\bPLACE\b/g, "PL").replace(/\bEAST\b/g, "E").replace(/\bWEST\b/g, "W");
  return x.replace(/\s+/g, " ").trim();
}

/** Map NYC ATR count locations (context.json) onto a same-named directed edge within 120 m. */
function countEdges(net: Network): { ei: number; vph: number; street: string }[] {
  const f = join(ASSETS, net.area, "context.json");
  if (!existsSync(f)) return [];
  const ctx = JSON.parse(readFileSync(f, "utf8"));
  const seen = new Map<string, { lng: number; lat: number; vph: number; street: string }>();
  for (const c of Object.values<any>(ctx.counts ?? {})) {
    for (const t of c.trafficCounts ?? []) {
      if (!t.volume || seen.has(t.segmentid)) continue;
      const dirs = Object.values<number>(t.volume.meanVolPer15MinByDirection);
      // meanVolPer15Min is an all-day average for one direction; convert to a peak hour with the K-factor.
      const avgHourly = (dirs.reduce((a, b) => a + b, 0) / dirs.length) * 4;
      // ATR "street" looks like "W/B 21 AVE @ 33 ST": the counted street is before the "@".
      const street = normStreet(String(t.street).replace(/^[NSEW]\/B\s+/, "").split("@")[0]);
      seen.set(t.segmentid, { lng: t.lng, lat: t.lat, vph: avgHourly * P.traffic.peakHourShareOfDaily.mid * 24, street });
    }
  }
  const out: { ei: number; vph: number; street: string }[] = [];
  for (const c of seen.values()) {
    let best = -1, bestD = 120;
    for (const s of net.segments) {
      if (normStreet(s.name) !== c.street) continue;
      for (const pt of s.coords) {
        const d = haversineM(pt, [c.lng, c.lat]);
        if (d < bestD) { bestD = d; best = net.edgesBySeg.get(s.id)![0]; }
      }
    }
    if (best >= 0) out.push({ ei: best, vph: c.vph, street: c.street });
  }
  return out;
}

export function trafficBaseline(net: Network): TrafficBaseline {
  const hit = baselines.get(net.area);
  if (hit) return hit;
  const rand = rng(1337);
  const R = 1500;
  const nodeIds = Object.keys(net.nodes);
  // Trip-end weights: arterial nodes and nodes near the area boundary (through traffic) weigh more.
  const w = nodeIds.map((n) => {
    let m = 0;
    for (const ei of net.out.get(n) ?? []) m = Math.max(m, classVal<number>(P.traffic.arterialOriginWeight.value, net.edges[ei].highway));
    const edge = haversineM(net.nodes[n], net.center) > 0.8 * R ? 3 : 1;
    return m * edge;
  });
  const total = w.reduce((a, b) => a + b, 0);
  const pick = () => { let r = rand() * total; for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return nodeIds[i]; } return nodeIds[nodeIds.length - 1]; };

  const free = (ei: number) => net.edges[ei].travelTimeS;
  const trips: TrafficBaseline["trips"] = [];
  const sampleFlow = new Float64Array(net.edges.length);
  let tries = 0;
  while (trips.length < P.traffic.sampleTrips.value && tries++ < P.traffic.sampleTrips.value * 4) {
    const o = pick(), d = pick();
    if (o === d || haversineM(net.nodes[o], net.nodes[d]) < 500) continue;
    const path = shortestPath(net, o, d, free);
    if (!path || !path.length) continue;
    trips.push({ o, d, path });
    for (const ei of path) sampleFlow[ei]++;
  }

  const capacity = new Float64Array(net.edges.length);
  net.edges.forEach((e, i) => { capacity[i] = perDirectionLanes(net, i) * classVal<number>(P.traffic.laneCapacityVph.value, e.highway); });

  // Calibrate: one sample trip = `scale` vehicles/hour, matched to NYC counts where they exist.
  const counted = countEdges(net).filter((c) => sampleFlow[c.ei] >= 3);
  let scale: number, method: "counts" | "defaults", note: string;
  const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  if (counted.length >= 2) {
    // Ratio of sums: robust to tiny sample flows on minor counted streets.
    scale = counted.reduce((a, c) => a + c.vph, 0) / counted.reduce((a, c) => a + sampleFlow[c.ei], 0);
    method = "counts"; note = `scaled to ${counted.length} NYC Automated Traffic Volume Count locations (7ym2-wayt)`;
  } else {
    const ratios: number[] = [];
    net.edges.forEach((e, i) => {
      if (sampleFlow[i] > 0 && ["primary", "secondary"].includes(e.highway)) ratios.push(classVal<number>(P.traffic.defaultPeakHourVolumeVph.value, e.highway) / 2 / sampleFlow[i]);
    });
    scale = ratios.length ? median(ratios) : 1;
    method = "defaults"; note = "no usable count data: scaled to default volumes by road class (estimated)";
  }
  // Guard: the sampled OD pattern can over-concentrate on one through route relative to the
  // counted streets. Cities don't run their baseline peak above capacity, so cap the scale so the
  // 98th-percentile edge sits at V/C <= 0.9.
  const vc = net.edges.map((_, i) => (sampleFlow[i] * scale) / capacity[i]).filter((x) => x > 0).sort((a, b) => a - b);
  const p98 = vc[Math.floor(vc.length * 0.98)] ?? 0;
  if (p98 > 0.9) { scale *= 0.9 / p98; note += `; capped so 98th-pct baseline V/C = 0.9 (was ${p98.toFixed(2)})`; }
  // Method of successive averages: re-route a shrinking share of trips on congested times so the
  // baseline is already congestion-aware (otherwise rerouting after a closure looks like a saving).
  for (let k = 1; k <= 4; k++) {
    const T = net.edges.map((e, i) => bpr(e.travelTimeS, sampleFlow[i] * scale, capacity[i], "mid"));
    for (let j = 0; j < trips.length; j++) {
      if (rand() > 1 / (k + 1)) continue;
      const t = trips[j];
      const p = shortestPath(net, t.o, t.d, (ei) => T[ei]);
      if (!p) continue;
      for (const ei of t.path) sampleFlow[ei]--;
      for (const ei of p) sampleFlow[ei]++;
      t.path = p;
    }
  }
  const b: TrafficBaseline = { trips, sampleFlow, vehPerSampleTrip: scale, calibration: { method, nCountEdges: counted.length, scale, note }, capacity };
  baselines.set(net.area, b);
  return b;
}

function bpr(t0: number, v: number, c: number, level: Level): number {
  return t0 * (1 + P.traffic.bprAlpha[level] * Math.pow(v / Math.max(c, 1), P.traffic.bprBeta[level]));
}

/** Penalty for a trip whose destination becomes unreachable by car (park and walk, or abandon). */
const UNREACHABLE_PENALTY_S = 180;

export function runTraffic(net: Network, closedSegmentIds: string[], level: Level): TrafficResult {
  const base = trafficBaseline(net);
  const closed = new Set<number>();
  for (const sid of closedSegmentIds) for (const ei of net.edgesBySeg.get(sid) ?? []) closed.add(ei);
  // Run at a representative closure-hour volume; level shifts the peak-hour share (demand).
  const demand = P.traffic.peakHourShareOfDaily[level] / P.traffic.peakHourShareOfDaily.mid;
  const s = base.vehPerSampleTrip * demand * (P.traffic.demandScale?.value ?? 1);
  const V0 = Float64Array.from(base.sampleFlow, (f) => f * s);

  const affected = base.trips.filter((t) => t.path.some((ei) => closed.has(ei)));
  // Reassign the affected trips against congested times, in two passes so later trips see the
  // load added by earlier ones (incremental assignment). Run it twice - once with the closure and
  // once without - and count only the difference, so congestion relief from simply re-optimising
  // those trips is never mistaken for a benefit of the closure.
  const reassign = (blocked: Set<number>) => {
    const V = Float64Array.from(V0);
    for (const t of affected) for (const ei of t.path) V[ei] -= s;
    let unreach = 0;
    const half = Math.ceil(affected.length / 2);
    for (const [lo, hi] of [[0, half], [half, affected.length]]) {
      const T = net.edges.map((e, i) => (blocked.has(i) ? Infinity : bpr(e.travelTimeS, V[i], base.capacity[i], level)));
      for (const t of affected.slice(lo, hi)) {
        const p = shortestPath(net, t.o, t.d, (ei) => T[ei]);
        if (!p) { unreach++; continue; }
        for (const ei of p) V[ei] += s;
      }
    }
    let vh = 0;
    for (let i = 0; i < net.edges.length; i++) if (!blocked.has(i)) vh += V[i] * bpr(net.edges[i].travelTimeS, V[i], base.capacity[i], level);
    return { V, vh, unreach };
  };
  const ref = affected.length ? reassign(new Set()) : { V: V0, vh: 0, unreach: 0 };
  const after = affected.length ? reassign(closed) : { V: V0, vh: 0, unreach: 0 };
  const V1 = after.V, unreachable = after.unreach;
  const addedPerHour = (after.vh - ref.vh + unreachable * s * UNREACHABLE_PENALTY_S) / 3600;
  const addedVehicleHours = Math.max(0, addedPerHour) * P.traffic.closureHoursPerDay.value;

  const segBase = new Map<string, number>(), segAfter = new Map<string, number>();
  net.edges.forEach((e, i) => {
    segBase.set(e.segmentId, (segBase.get(e.segmentId) ?? 0) + V0[i]);
    segAfter.set(e.segmentId, (segAfter.get(e.segmentId) ?? 0) + (closed.has(i) ? 0 : V1[i]));
  });
  const segmentLoads: TrafficResult["segmentLoads"] = {};
  const overflow: { segmentId: string; loadIncreasePct: number }[] = [];
  for (const [sid, b0] of segBase) {
    const a = segAfter.get(sid) ?? 0;
    const pct = b0 > 1 ? ((a - b0) / b0) * 100 : a > 1 ? 100 : 0;
    if (Math.abs(a - b0) > 1 || closedSegmentIds.includes(sid)) segmentLoads[sid] = { base: Math.round(b0), after: Math.round(a), pct: Math.round(pct) };
    if (!closedSegmentIds.includes(sid) && pct > 10 && a - b0 > 25) overflow.push({ segmentId: sid, loadIncreasePct: Math.round(pct) });
  }
  overflow.sort((x, y) => y.loadIncreasePct - x.loadIncreasePct);
  return {
    addedVehicleHours: Math.round(addedVehicleHours * 10) / 10,
    overflowSegments: overflow.slice(0, 15), segmentLoads,
    reroutedTrips: Math.round(affected.length * s), unreachableTrips: Math.round(unreachable * s),
    peakVolumeScale: s, estimated: base.calibration.method !== "counts",
  };
}
