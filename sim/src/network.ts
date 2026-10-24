// Road network loading and shortest-path routing over sim/assets/<area>/network.json
// (built by data/build_graphs.py).
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

export type Edge = {
  idx: number; u: string; v: string; segmentId: string;
  lengthM: number; travelTimeS: number; speedKph: number; highway: string;
};

export type SegmentInfo = {
  id: string; name: string; coords: [number, number][]; lanes: number;
  baselineCarVolume: number | null; baselinePedVolume: number | null;
  highway: string; lengthM: number;
};

export type CorridorInfo = { name: string; role: "treated" | "control" | "forward"; pair: string | null; segmentIds: string[]; lengthM: number };

export type WalkEdge = { u: string; v: string; lengthM: number; name: string | null; coords: [number, number][] };

export type Network = {
  area: string; city: "NYC" | "SF" | "BERKELEY"; center: [number, number];
  nodes: Record<string, [number, number]>;
  edges: Edge[];
  segments: SegmentInfo[];
  segById: Map<string, SegmentInfo>;
  edgesBySeg: Map<string, number[]>;
  out: Map<string, number[]>; // node -> outgoing edge idx
  corridors: Record<string, CorridorInfo>;
  walkNodes: Record<string, [number, number]>;
  walkEdges: WalkEdge[];
};

const cache = new Map<string, Network>();

export function listAreas(): string[] {
  return ["astoria", "park_slope", "chinatown", "koreatown", "prospect_heights", "hayes_valley"]
    .filter((a) => existsSync(join(ASSETS, a, "network.json")));
}

export function loadNetwork(area: string): Network {
  const hit = cache.get(area);
  if (hit) return hit;
  const raw = JSON.parse(readFileSync(join(ASSETS, area, "network.json"), "utf8"));
  const edges: Edge[] = raw.edges.map((e: Omit<Edge, "idx">, idx: number) => ({ ...e, idx, highway: e.highway ?? "unclassified" }));
  const out = new Map<string, number[]>();
  const edgesBySeg = new Map<string, number[]>();
  for (const e of edges) {
    (out.get(e.u) ?? out.set(e.u, []).get(e.u)!).push(e.idx);
    (edgesBySeg.get(e.segmentId) ?? edgesBySeg.set(e.segmentId, []).get(e.segmentId)!).push(e.idx);
  }
  const segments: SegmentInfo[] = raw.segments;
  const net: Network = {
    area, city: raw.city, center: raw.center, nodes: raw.nodes, edges, segments,
    segById: new Map(segments.map((s) => [s.id, s])), edgesBySeg, out, corridors: raw.corridors,
    walkNodes: raw.walkNodes, walkEdges: raw.walkEdges,
  };
  cache.set(area, net);
  return net;
}

/** Binary min-heap keyed by number. */
class Heap {
  private k: number[] = []; private v: string[] = [];
  get size() { return this.k.length; }
  push(key: number, val: string) {
    const k = this.k, v = this.v; k.push(key); v.push(val);
    let i = k.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= k[i]) break; [k[p], k[i]] = [k[i], k[p]]; [v[p], v[i]] = [v[i], v[p]]; i = p; }
  }
  pop(): [number, string] {
    const k = this.k, v = this.v; const top: [number, string] = [k[0], v[0]];
    const lk = k.pop()!, lv = v.pop()!;
    if (k.length) {
      k[0] = lk; v[0] = lv; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < k.length && k[l] < k[m]) m = l;
        if (r < k.length && k[r] < k[m]) m = r;
        if (m === i) break;
        [k[m], k[i]] = [k[i], k[m]]; [v[m], v[i]] = [v[i], v[m]]; i = m;
      }
    }
    return top;
  }
}

/**
 * Dijkstra from `src` to `dst`; returns the edge indices of the path or null if unreachable.
 * `cost(edgeIdx)` gives the edge weight (seconds); Infinity means closed.
 */
export function shortestPath(net: Network, src: string, dst: string, cost: (e: number) => number): number[] | null {
  if (src === dst) return [];
  const dist = new Map<string, number>([[src, 0]]);
  const via = new Map<string, number>();
  const heap = new Heap(); heap.push(0, src);
  while (heap.size) {
    const [d, n] = heap.pop();
    if (n === dst) break;
    if (d > (dist.get(n) ?? Infinity)) continue;
    for (const ei of net.out.get(n) ?? []) {
      const w = cost(ei);
      if (!isFinite(w)) continue;
      const nd = d + w, to = net.edges[ei].v;
      if (nd < (dist.get(to) ?? Infinity)) { dist.set(to, nd); via.set(to, ei); heap.push(nd, to); }
    }
  }
  if (!via.has(dst)) return null;
  const path: number[] = [];
  for (let n = dst; n !== src; ) { const ei = via.get(n)!; path.push(ei); n = net.edges[ei].u; }
  return path.reverse();
}

/** Deterministic PRNG (mulberry32) so every scenario run is reproducible. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toR, dLng = (b[0] - a[0]) * toR;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * toR) * Math.cos(b[1] * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
