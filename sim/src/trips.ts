// Animated trips for deck.gl TripsLayer: {path: [[lng,lat],...], timestamps: [...]} per agent.
// Cars come from the traffic model's sampled OD trips (rerouted around closures); pedestrians
// random-walk the OSM walk network weighted by modelled foot traffic and linger on pedestrianized
// blocks. Crowd size scales with the Census population of the area.
import { type Network, shortestPath, rng, haversineM } from "./network.ts";
import { trafficBaseline } from "./traffic.ts";
import { loadContext } from "./economy.ts";

export type Trip = { path: [number, number][]; timestamps: number[]; kind?: "linger" | "walk"; visitor?: boolean };
export type TripsPayload = { loopSeconds: number; cars: Trip[]; peds: Trip[]; agents: { cars: number; peds: number; populationInCircle: number | null } };

const LOOP = 600; // seconds of simulated time per animation loop
const r6 = (x: number) => Math.round(x * 1e6) / 1e6;
/** Copy of a trip one loop earlier, so trips running past the loop end also show after it wraps. */
const shifted = (t: Trip): Trip => ({ ...t, timestamps: t.timestamps.map((x) => Math.round((x - LOOP) * 10) / 10) });

function edgeCoords(net: Network, ei: number): [number, number][] {
  const e = net.edges[ei];
  const c = net.segById.get(e.segmentId)!.coords;
  const u = net.nodes[e.u];
  return haversineM(c[0], u) <= haversineM(c[c.length - 1], u) ? c : [...c].reverse();
}

function timed(points: [number, number][], speedMps: number, start: number, pauses?: Map<number, number>): Trip {
  const path: [number, number][] = [], ts: number[] = [];
  let t = start;
  points.forEach((p, i) => {
    if (i > 0) t += haversineM(points[i - 1], p) / speedMps;
    path.push([r6(p[0]), r6(p[1])]); ts.push(Math.round(t * 10) / 10);
    const hold = pauses?.get(i);
    if (hold) { t += hold; path.push([r6(p[0]), r6(p[1])]); ts.push(Math.round(t * 10) / 10); }
  });
  return { path, timestamps: ts };
}

/** Walk edge -> modelled pedestrians/hour of the nearest drive segment (within 30 m). */
const walkWeightCache = new Map<string, { nearest: (string | null)[] }>();
function walkNearest(net: Network) {
  const hit = walkWeightCache.get(net.area);
  if (hit) return hit;
  const mids = net.segments.map((s) => ({ id: s.id, p: s.coords[Math.floor(s.coords.length / 2)], coords: s.coords }));
  const nearest = net.walkEdges.map((w) => {
    const m = w.coords[Math.floor(w.coords.length / 2)];
    let best: string | null = null, bd = 30;
    for (const s of mids) {
      if (Math.abs(s.p[1] - m[1]) > 0.002 || Math.abs(s.p[0] - m[0]) > 0.003) continue;
      for (const c of s.coords) { const d = haversineM(c, m); if (d < bd) { bd = d; best = s.id; } }
    }
    return best;
  });
  const v = { nearest };
  walkWeightCache.set(net.area, v);
  return v;
}

export function buildTrips(net: Network, closedSegmentIds: string[], pedAt: (segmentId: string) => number, seed = 7): TripsPayload {
  const rand = rng(seed);
  const closed = new Set<number>();
  for (const sid of closedSegmentIds) for (const ei of net.edgesBySeg.get(sid) ?? []) closed.add(ei);
  const closedSeg = new Set(closedSegmentIds);
  const pop: number | null = loadContext(net.area)?.census?.populationInCircle ?? null;

  // Cars: a sample of the traffic model's trips; affected ones rerouted around the closure.
  const base = trafficBaseline(net);
  const nCars = Math.min(450, Math.max(150, Math.round((base.trips.length * base.vehPerSampleTrip) / 20)));
  const cars: Trip[] = [];
  for (let i = 0; i < base.trips.length && cars.length < nCars; i += Math.max(1, Math.floor(base.trips.length / nCars))) {
    const t = base.trips[i];
    const path = t.path.some((ei) => closed.has(ei)) ? shortestPath(net, t.o, t.d, (ei) => (closed.has(ei) ? Infinity : net.edges[ei].travelTimeS)) : t.path;
    if (!path?.length) continue;
    const pts: [number, number][] = [];
    for (const ei of path) { const c = edgeCoords(net, ei); pts.push(...(pts.length ? c.slice(1) : c)); }
    const car = timed(pts, 7 + rand() * 4, rand() * LOOP);
    cars.push(car);
    if (car.timestamps[car.timestamps.length - 1] > LOOP) cars.push(shifted(car));
  }

  // Pedestrians: random walks weighted by modelled foot traffic.
  const { nearest } = walkNearest(net);
  const adj = new Map<string, number[]>();
  net.walkEdges.forEach((w, i) => {
    (adj.get(w.u) ?? adj.set(w.u, []).get(w.u)!).push(i);
    (adj.get(w.v) ?? adj.set(w.v, []).get(w.v)!).push(i);
  });
  // A pedestrianized block draws people in (destination effect), beyond its modelled through-flow.
  const weight = (i: number) => { const s = nearest[i]; return s ? Math.max(20, pedAt(s)) * (closedSeg.has(s) ? 3 : 1) : 25; };
  const nodes = [...adj.keys()];
  const nodeW = nodes.map((n) => adj.get(n)!.reduce((a, i) => a + weight(i), 0));
  const totW = nodeW.reduce((a, b) => a + b, 0);
  const pickNode = () => { let r = rand() * totW; for (let i = 0; i < nodes.length; i++) { r -= nodeW[i]; if (r <= 0) return nodes[i]; } return nodes[0]; };
  const nPeds = Math.min(900, Math.max(300, Math.round((pop ?? 40000) / 110)));
  // Plaza visitors: people who come to the pedestrianized block itself and stay a while. Their number
  // scales with modelled foot traffic on the closed block (a share of passers-by who stop).
  const closedWalk = net.walkEdges.map((_, i) => i).filter((i) => nearest[i] && closedSeg.has(nearest[i]!));
  const nVisitors = closedWalk.length ? Math.min(160, Math.max(20, Math.round(closedSegmentIds.reduce((a, s) => a + pedAt(s), 0) * 0.12))) : 0;
  const peds: Trip[] = [];
  for (let k = 0; k < nPeds + nVisitors; k++) {
    const visitor = k >= nPeds;
    const startEdge = visitor ? net.walkEdges[closedWalk[Math.floor(rand() * closedWalk.length)]] : null;
    let at = startEdge ? (rand() < 0.5 ? startEdge.u : startEdge.v) : pickNode();
    const pts: [number, number][] = [net.walkNodes[at]];
    const pauses = new Map<number, number>();
    let walked = 0, lingered = false;
    if (startEdge) {
      // Arrive, find a seat at one of a few spots along the block, stay 1-5 minutes.
      const spot = startEdge.coords[Math.floor(rand() * startEdge.coords.length)];
      const j = Math.floor(rand() * 6);
      pts.push([spot[0] + ((j % 3) - 1) * 0.00005, spot[1] + (Math.floor(j / 3) - 0.5) * 0.00004]);
      pauses.set(pts.length - 1, 60 + rand() * 240); lingered = true;
      pts.push(net.walkNodes[at]);
    }
    const target = 250 + rand() * 650;
    let prev = -1;
    while (walked < target) {
      const opts = (adj.get(at) ?? []).filter((i) => i !== prev);
      if (!opts.length) break;
      const ws = opts.map(weight), tw = ws.reduce((a, b) => a + b, 0);
      let r = rand() * tw, pick = opts[0];
      for (let j = 0; j < opts.length; j++) { r -= ws[j]; if (r <= 0) { pick = opts[j]; break; } }
      const w = net.walkEdges[pick];
      const forward = w.u === at;
      const c = forward ? w.coords : [...w.coords].reverse();
      pts.push(...c.slice(1));
      walked += w.lengthM; prev = pick; at = forward ? w.v : w.u;
      // On a pedestrianized block people stop: sit, chat, browse.
      const s = nearest[pick];
      if (s && closedSeg.has(s) && rand() < 0.85) {
        // Sit at one of the seating spots spaced ~15 m along the block, so people share space.
        const spot = w.coords[Math.floor(rand() * w.coords.length)];
        const k = Math.floor(rand() * 4);
        const sp: [number, number] = [spot[0] + (k - 1.5) * 0.00006, spot[1] + ((k % 2) - 0.5) * 0.00004];
        pts.push(sp, pts[pts.length - 1]);
        pauses.set(pts.length - 2, 60 + rand() * 260); lingered = true;
      }
      else if (rand() < 0.06) pauses.set(pts.length - 1, 10 + rand() * 30);
    }
    if (pts.length < 2) continue;
    const trip = timed(pts, 1.1 + rand() * 0.4, rand() * LOOP, pauses);
    trip.kind = lingered ? "linger" : "walk";
    if (visitor) trip.visitor = true;
    peds.push(trip);
    if (trip.timestamps[trip.timestamps.length - 1] > LOOP) peds.push(shifted(trip));
  }
  return { loopSeconds: LOOP, cars, peds, agents: { cars: nCars, peds: nPeds + nVisitors, populationInCircle: pop } };
}
