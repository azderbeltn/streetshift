import { useEffect, useRef } from "react";
import { Map as MLMap, setWorkerUrl, type MapGeoJSONFeature } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapLibreOverlay } from "@deck.gl/maplibre";
import { PathLayer, ColumnLayer, ArcLayer, LineLayer, ScatterplotLayer, PolygonLayer } from "@deck.gl/layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import type { Business, NetworkPayload, SegMetric, Trip, TripsPayload } from "./api";
import type { Presence } from "./store";

setWorkerUrl(workerUrl);

const DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";
const FALLBACK_STYLE = import.meta.env.MAP_STYLE_URL || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";
/** Last resort when no tile server is reachable: dark background; roads and buildings come from our own data. */
const OFFLINE_STYLE: any = { version: 8, sources: {}, layers: [{ id: "bg", type: "background", paint: { "background-color": "#070a10" } }] };
const FORCE_OFFLINE = typeof location !== "undefined" && new URLSearchParams(location.search).has("offline");
export type OfflineBuilding = { id: string; polygon: [number, number][]; height: number; estimated: boolean };
const SPEED = 5; // simulated seconds per real second

// Additive blending for glowing trails (luma.gl 9 parameters, docs/frontend.md).
const GLOW = { blend: true, blendColorOperation: "add", blendColorSrcFactor: "src-alpha", blendColorDstFactor: "one",
  blendAlphaOperation: "add", blendAlphaSrcFactor: "one", blendAlphaDstFactor: "one-minus-src-alpha", depthWriteEnabled: false } as any;

type RGBA = [number, number, number, number];
const CAR: RGBA = [76, 195, 255, 230];
const PED: RGBA = [255, 181, 71, 235];
const PINK: RGBA = [255, 95, 162, 220];
const GREEN: RGBA = [62, 224, 143, 255];

function loadColor(pct: number): RGBA {
  // blue -> orange -> red as load increase grows
  const t = Math.max(0, Math.min(1, pct / 120));
  if (t < 0.5) { const k = t / 0.5; return [Math.round(76 + (255 - 76) * k), Math.round(195 + (150 - 195) * k), Math.round(255 + (40 - 255) * k), 235]; }
  const k = (t - 0.5) / 0.5; return [255, Math.round(150 - 110 * k), Math.round(40 + 20 * k), 245];
}
const ROAD: Record<string, [RGBA, number]> = {
  primary: [[84, 112, 160, 190], 3], secondary: [[76, 102, 146, 180], 2.6], tertiary: [[68, 92, 132, 170], 2.2],
  residential: [[56, 74, 104, 150], 1.6], pedestrian: [[90, 80, 60, 120], 1.6], default: [[48, 62, 86, 100], 1.4],
};
const road = (hw: string) => ROAD[hw] ?? ROAD[hw?.replace("_link", "")] ?? ROAD.default;

export type Pick =
  | { kind: "segment"; id: string; x: number; y: number }
  | { kind: "business"; id: string; x: number; y: number }
  | { kind: "person"; person: PersonInfo; x: number; y: number }
  | { kind: "building"; feature: MapGeoJSONFeature; lngLat: [number, number]; x: number; y: number }
  | { kind: "none"; lngLat: [number, number]; x: number; y: number };

export type FloorBlock = { key: string; polygon: [number, number][][]; height: number };
export type PersonInfo = { index: number; visitor: boolean; lingeredMin: number; walkedM: number; talkedWith: number; heading: Business | null; talkingNow: boolean };

const metres = (a: [number, number], b: [number, number]) => {
  const dx = (b[0] - a[0]) * 111320 * Math.cos((a[1] * Math.PI) / 180), dy = (b[1] - a[1]) * 110540;
  return Math.sqrt(dx * dx + dy * dy);
};

type Props = {
  network: NetworkPayload | null; businesses: Business[]; closed: Set<string>; seg: Map<string, SegMetric>; biz: Map<string, number>;
  trips: TripsPayload | null; pedShare: number; showBefore: boolean; floors: FloorBlock[]; presence: Presence[];
  onPick: (p: Pick) => void; onHover: (h: { kind: "segment" | "business"; id: string; x: number; y: number } | null) => void;
  onFeed: (text: string) => void; onPointer: (lngLat: [number, number]) => void; onConnections: (n: number) => void;
  preferBuildings?: boolean;
  offlineBuildings: OfflineBuilding[];
  onBasemap?: (b: "tiles" | "fallback" | "offline") => void;
};

type Pause = { t0: number; t1: number; pos: [number, number]; trip: number };

function pausesOf(peds: Trip[]): Pause[] {
  const out: Pause[] = [];
  peds.forEach((p, ti) => {
    for (let i = 0; i + 1 < p.path.length; i++) {
      const a = p.path[i], b = p.path[i + 1];
      if (a[0] === b[0] && a[1] === b[1] && p.timestamps[i + 1] - p.timestamps[i] > 8) out.push({ t0: p.timestamps[i], t1: p.timestamps[i + 1], pos: a, trip: ti });
    }
  });
  return out;
}

function posAt(trip: Trip, t: number): [number, number] | null {
  const ts = trip.timestamps;
  if (t < ts[0] || t > ts[ts.length - 1]) return null;
  let lo = 0, hi = ts.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
  const k = ts[hi] === ts[lo] ? 0 : (t - ts[lo]) / (ts[hi] - ts[lo]);
  const a = trip.path[lo], b = trip.path[hi];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}

export default function MapView(props: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const overlayRef = useRef<MapLibreOverlay | null>(null);
  const p = useRef(props); p.current = props;
  const lastInteract = useRef(performance.now());
  const pausesRef = useRef<Pause[]>([]);
  const talkRef = useRef<{ key: string; a: [number, number]; b: [number, number]; ta: number; tb: number }[]>([]);
  const bondsRef = useRef<Map<string, [number, number]>>(new Map()); // pair key -> [tripA, tripB]
  const lastFeed = useRef(0);
  const offlineRef = useRef(false);

  useEffect(() => { pausesRef.current = pausesOf(props.trips?.peds ?? []); talkRef.current = []; bondsRef.current = new Map(); }, [props.trips]);

  // Init map once.
  useEffect(() => {
    const map = new MLMap({ container: el.current!, style: FORCE_OFFLINE ? OFFLINE_STYLE : DARK_STYLE, center: [-122.4237, 37.7768], zoom: 16.2, pitch: 52, bearing: -20, maxPitch: 70, attributionControl: { compact: true } });
    mapRef.current = map;
    let styled = false;
    const addBuildings = () => {
      if (map.getLayer("ss-buildings")) return;
      const src = Object.entries(map.getStyle().sources).find(([, s]: any) => s.type === "vector")?.[0];
      if (!src) return;
      // Dim the flat building layer and add a dark 3D extrusion (OpenFreeMap `building` source-layer).
      for (const l of map.getStyle().layers) if ((l as any)["source-layer"] === "building" && l.type === "fill") map.setLayoutProperty(l.id, "visibility", "none");
      map.addLayer({ id: "ss-buildings", type: "fill-extrusion", source: src, "source-layer": "building", minzoom: 13,
        paint: { "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "render_height"], 8], 0, "#11151d", 40, "#1a2030", 120, "#232b3f"],
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.88 } });
    };
    // Basemap tiers: OpenFreeMap -> Carto -> offline (our own OSM buildings + roads via deck.gl).
    let tier: "tiles" | "fallback" | "offline" = FORCE_OFFLINE ? "offline" : "tiles";
    offlineRef.current = tier === "offline";
    const goOffline = () => { if (tier === "offline") return; tier = "offline"; offlineRef.current = true; map.setStyle(OFFLINE_STYLE); p.current.onBasemap?.("offline"); };
    const goFallback = () => {
      if (tier !== "tiles") return goOffline();
      tier = "fallback"; map.setStyle(FALLBACK_STYLE); p.current.onBasemap?.("fallback");
      setTimeout(() => { if (!styled) goOffline(); }, 8000);
    };
    map.on("style.load", () => { styled = tier !== "offline"; addBuildings(); });
    const fb = setTimeout(() => { if (!styled) goFallback(); }, 8000);
    map.on("error", (e: any) => { if (!styled && String(e?.error?.message ?? "").match(/style|fetch|load/i)) { clearTimeout(fb); goFallback(); } });
    if (FORCE_OFFLINE) p.current.onBasemap?.("offline");

    (window as any).__map = map; // for scripted UI tests (web/scripts/tour.mjs)
    const PICKABLE = ["talk-dots", "businesses", "peds", "segments", "offline-buildings"];
    const deckPick = (x: number, y: number) => overlayRef.current?.pickObject({ x, y, radius: 5, layerIds: PICKABLE }) ?? null;
    const personFrom = (trip: Trip, x: number, y: number): Pick | null => {
      const peds = p.current.trips?.peds; if (!peds) return null;
      const index = peds.indexOf(trip);
      let lingered = 0, walked = 0;
      for (let i = 0; i + 1 < trip.path.length; i++) {
        const same = trip.path[i][0] === trip.path[i + 1][0] && trip.path[i][1] === trip.path[i + 1][1];
        if (same) lingered += trip.timestamps[i + 1] - trip.timestamps[i]; else walked += metres(trip.path[i], trip.path[i + 1]);
      }
      const end = trip.path[trip.path.length - 1];
      let heading: Business | null = null, bd = 80;
      for (const b of p.current.businesses) { const d = metres(end, [b.lng, b.lat]); if (d < bd) { bd = d; heading = b; } }
      const bonds = [...bondsRef.current.values()].filter(([a, b]) => a === index || b === index).length;
      const talkingNow = talkRef.current.some((t) => t.key.split("-").map(Number).includes(index));
      return { kind: "person", x, y, person: { index, visitor: !!trip.visitor, lingeredMin: lingered / 60, walkedM: walked, talkedWith: bonds, heading, talkingNow } };
    };
    // Picking is driven by MapLibre's own events + deck.pickObject (robust in interleaved mode).
    map.on("click", (e) => {
      lastInteract.current = performance.now();
      const { x, y } = e.point, ll = e.lngLat.toArray() as [number, number];
      const offlineHit = offlineRef.current ? overlayRef.current?.pickObject({ x: e.point.x, y: e.point.y, radius: 2, layerIds: ["offline-buildings"] }) : null;
      const buildings: any[] = offlineHit?.object
        ? [{ geometry: { type: "Polygon", coordinates: [offlineHit.object.polygon] }, properties: { render_height: offlineHit.object.height } }]
        : map.getLayer("ss-buildings") ? map.queryRenderedFeatures(e.point, { layers: ["ss-buildings"] }) : [];
      // With the "Add floors" tool, a building under the cursor wins over the street on top of it.
      if (p.current.preferBuildings && buildings.length) return p.current.onPick({ kind: "building", feature: buildings[0], lngLat: ll, x, y });
      const info = deckPick(x, y);
      const id = info?.layer?.id === "offline-buildings" ? undefined : info?.layer?.id;
      if (id === "talk-dots" && p.current.trips) { const pk = personFrom(p.current.trips.peds[info!.object.trip], x, y); if (pk) return p.current.onPick(pk); }
      if (id === "businesses") return p.current.onPick({ kind: "business", id: info!.object.id, x, y });
      if (id === "peds") { const pk = personFrom(info!.object as Trip, x, y); if (pk) return p.current.onPick(pk); }
      if (id === "segments") return p.current.onPick({ kind: "segment", id: info!.object.id, x, y });
      if (buildings.length) return p.current.onPick({ kind: "building", feature: buildings[0], lngLat: ll, x, y });
      p.current.onPick({ kind: "none", lngLat: ll, x, y });
    });
    let lastMove = 0;
    map.on("mousemove", (e) => {
      p.current.onPointer(e.lngLat.toArray() as [number, number]);
      const now = performance.now(); if (now - lastMove < 50) return; lastMove = now;
      const info = deckPick(e.point.x, e.point.y);
      const id = info?.layer?.id;
      map.getCanvas().style.cursor = info ? "pointer" : "";
      if (id === "segments" || id === "businesses") p.current.onHover({ kind: id === "segments" ? "segment" : "business", id: info!.object.id, x: e.point.x, y: e.point.y });
      else p.current.onHover(null);
    });
    const makeOverlay = () => new MapLibreOverlay({ interleaved: true, layers: [] });
    // Per docs/frontend.md: add the overlay once the map has loaded.
    map.once("load", () => { const o = makeOverlay(); map.addControl(o as any); overlayRef.current = o; (window as any).__deck = o; });
    for (const ev of ["mousedown", "wheel", "touchstart", "dragstart"]) map.on(ev as any, () => { lastInteract.current = performance.now(); });

    let raf = 0, lastTalk = 0;
    const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const q = p.current;
      const loopLen = q.trips?.loopSeconds ?? 600;
      const t = (((now - t0) / 1000) * SPEED) % loopLen;
      if (now - lastInteract.current > 9000 && !map.isMoving()) map.setBearing(map.getBearing() + 0.012);
      // Conversations: people paused near each other right now.
      if (now - lastTalk > 400) { lastTalk = now; updateTalks(t); }
      overlayRef.current?.setProps({ layers: layers(t, now) });
    };
    const updateTalks = (t: number) => {
      const q = p.current;
      const active = pausesRef.current.filter((x) => x.t0 <= t && t <= x.t1);
      const grid = new Map<string, Pause[]>();
      for (const a of active) { const k = `${Math.round(a.pos[0] / 0.00025)}:${Math.round(a.pos[1] / 0.0002)}`; (grid.get(k) ?? grid.set(k, []).get(k)!).push(a); }
      const talks: typeof talkRef.current = [];
      for (const g of grid.values()) {
        for (let i = 0; i + 1 < g.length && talks.length < 80; i += 2) {
          const a = g[i], b = g[i + 1];
          const key = a.trip < b.trip ? `${a.trip}-${b.trip}` : `${b.trip}-${a.trip}`;
          // Spread the pair a few metres apart so the arc reads.
          talks.push({ key, a: [a.pos[0] - 0.00004, a.pos[1]], b: [b.pos[0] + 0.00004, b.pos[1] + 0.00002], ta: a.trip, tb: b.trip });
          if (!bondsRef.current.has(key)) {
            bondsRef.current.set(key, [a.trip, b.trip]);
            const nowMs = performance.now();
            if (nowMs - lastFeed.current > 2200) {
              lastFeed.current = nowMs;
              let best: Business | null = null, bd = 1e9;
              for (const bz of q.businesses) { const d = (bz.lng - a.pos[0]) ** 2 + ((bz.lat - a.pos[1]) * 1.3) ** 2; if (d < bd) { bd = d; best = bz; } }
              const where = best && Math.sqrt(bd) < 0.0006 ? `outside ${best.name}` : "on the street";
              q.onFeed(`2 people started talking ${where}`);
            }
          }
        }
      }
      talkRef.current = talks;
      (window as any).__ss = { talks: talks.length, bonds: bondsRef.current.size, pauses: pausesRef.current.length, t: Math.round(t), dots: talks.slice(0, 5).map((d) => d.a) };
      q.onConnections(bondsRef.current.size);
    };
    const layers = (t: number, now: number) => {
      const q = p.current;
      const net = q.network;
      const closed = q.showBefore ? new Set<string>() : q.closed;
      const pulse = 0.5 + 0.5 * Math.sin(now / 380);
      // Time of day: keep a stable, evenly spread share of people (golden-ratio sampling).
      const peds = q.trips ? q.trips.peds.filter((_, i) => (i * 0.6180339) % 1 < q.pedShare) : [];
      const closedSegs = net ? net.segments.filter((s) => closed.has(s.id)) : [];
      const bonds = q.trips ? [...bondsRef.current.values()].slice(-160).map(([a, b]) => [posAt(q.trips!.peds[a], t), posAt(q.trips!.peds[b], t)]).filter(([a, b]) => a && b) as [number, number][][] : [];
      return [
        ...(offlineRef.current ? [new PolygonLayer({
          id: "offline-buildings", data: q.offlineBuildings, extruded: true, pickable: true,
          getPolygon: (d: OfflineBuilding) => d.polygon, getElevation: (d: OfflineBuilding) => d.height,
          getFillColor: (d: OfflineBuilding) => { const k = Math.min(1, d.height / 120); return [17 + 18 * k, 21 + 22 * k, 29 + 34 * k, 235]; },
          getLineColor: [40, 50, 70, 160], material: { ambient: 0.5, diffuse: 0.6 } as any,
        })] : []),
        new PathLayer({
          id: "segments", data: net?.segments ?? [], pickable: true, autoHighlight: true, highlightColor: [255, 255, 255, 110],
          getPath: (s: any) => s.coords, capRounded: true, jointRounded: true, widthUnits: "meters", widthMinPixels: 1.2,
          getWidth: (s: any) => (closed.has(s.id) ? 7 : road(s.highway)[1] * 2.2),
          getColor: (s: any) => {
            if (closed.has(s.id)) return GREEN;
            const m = q.showBefore ? undefined : q.seg.get(s.id);
            if (m && m.loadPct > 8 && m.afterCar - m.baseCar > 15) return loadColor(m.loadPct);
            return road(s.highway)[0];
          },
          updateTriggers: { getColor: [closed, q.seg, q.showBefore], getWidth: [closed] },
          transitions: { getColor: 600 },
        }),
        new PathLayer({
          id: "closed-glow", data: closedSegs, getPath: (s: any) => s.coords, widthUnits: "meters", capRounded: true,
          getWidth: 14 + 10 * pulse, getColor: [62, 224, 143, Math.round(40 + 50 * pulse)], parameters: GLOW,
          updateTriggers: { getWidth: pulse, getColor: pulse },
        }),
        new TripsLayer({
          id: "cars", data: q.trips?.cars ?? [], getPath: (d: Trip) => d.path, getTimestamps: (d: Trip) => d.timestamps,
          getColor: CAR, widthMinPixels: 3, widthUnits: "meters", getWidth: 3.2, trailLength: 34, fadeTrail: true, currentTime: t,
          capRounded: true, jointRounded: true, parameters: GLOW,
        }),
        new TripsLayer({
          id: "peds", data: peds, pickable: true, autoHighlight: true, highlightColor: [255, 255, 255, 255], getPath: (d: Trip) => d.path, getTimestamps: (d: Trip) => d.timestamps,
          getColor: (d: Trip) => (d.kind === "linger" && !q.showBefore ? [255, 196, 110, 250] : PED), widthMinPixels: 2.6, widthUnits: "meters", getWidth: 2.2,
          trailLength: 60, fadeTrail: true, currentTime: t, capRounded: true, jointRounded: true, parameters: GLOW,
        }),
        new LineLayer({ id: "bonds", data: bonds, getSourcePosition: (d: any) => d[0], getTargetPosition: (d: any) => d[1], getColor: [255, 95, 162, 38], getWidth: 1, parameters: GLOW }),
        new ArcLayer({
          id: "talks", data: talkRef.current, getSourcePosition: (d: any) => d.a, getTargetPosition: (d: any) => d.b,
          getSourceColor: PINK, getTargetColor: [255, 160, 205, 220], getHeight: 2.2, getWidth: 2.2, widthMinPixels: 1.5, parameters: GLOW,
        }),
        new ScatterplotLayer({
          id: "talk-dots", data: talkRef.current.flatMap((d) => [{ p: d.a, trip: d.ta }, { p: d.b, trip: d.tb }]), getPosition: (d: any) => d.p, radiusUnits: "meters",
          pickable: true, radiusMinPixels: 3, getRadius: 1.6 + 0.6 * pulse, getFillColor: [255, 120, 180, 230], parameters: GLOW, updateTriggers: { getRadius: pulse },
        }),
        new PolygonLayer({
          id: "floors", data: q.floors, extruded: true, getPolygon: (d: FloorBlock) => d.polygon, getElevation: (d: FloorBlock) => d.height,
          getFillColor: [124, 156, 255, 120], getLineColor: [160, 185, 255, 200], material: { ambient: 0.6 } as any,
        }),
        new ColumnLayer({
          id: "businesses", data: q.businesses, pickable: true, autoHighlight: true, highlightColor: [255, 255, 255, 160],
          diskResolution: 12, radius: 1.8, extruded: true, elevationScale: 1, getPosition: (b: Business) => [b.lng, b.lat],
          getElevation: (b: Business) => {
            const base = 2 + 4 * Math.log10(10 + (b.reviewCount ?? 0));
            const ch = q.showBefore ? 0 : q.biz.get(b.id) ?? 0;
            return base * (1 + Math.max(-0.8, ch / 100));
          },
          getFillColor: (b: Business) => {
            const ch = q.showBefore ? 0 : q.biz.get(b.id) ?? 0;
            if (ch > 2) return [62, 224, 143, 235];
            if (ch < -2) return [255, 92, 92, 235];
            return [96, 190, 210, 150];
          },
          updateTriggers: { getElevation: [q.biz, q.showBefore], getFillColor: [q.biz, q.showBefore] },
          transitions: { getElevation: 900, getFillColor: 600 },
        }),
        new ScatterplotLayer({
          id: "presence", data: q.presence.filter((x) => !x.me), getPosition: (d: Presence) => [d.lng, d.lat], radiusUnits: "pixels",
          getRadius: 6, stroked: true, getLineColor: [0, 0, 0, 200], lineWidthMinPixels: 1.5,
          getFillColor: (d: Presence) => { const h = d.color.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255]; },
        }),
      ];
    };
    loop();
    return () => { cancelAnimationFrame(raf); map.remove(); };
  }, []);

  // Fly to the selected area.
  useEffect(() => {
    const map = mapRef.current; const net = props.network;
    if (!map || !net) return;
    const ids = new Set(Object.values(net.corridors).filter((c) => c.role !== "control").flatMap((c) => c.segmentIds));
    const pts = net.segments.filter((s) => ids.has(s.id)).flatMap((s) => s.coords);
    const c = pts.length ? [pts.reduce((a, q) => a + q[0], 0) / pts.length, pts.reduce((a, q) => a + q[1], 0) / pts.length] as [number, number] : net.center;
    map.flyTo({ center: c, zoom: 16.4, pitch: 54, bearing: -25, duration: 2200 });
  }, [props.network]);

  return <div ref={el} className="map" />;
}

