"""Download OSM road graphs for every area and locate each corridor's segments.

Outputs, per area, sim/assets/<area>/network.json:
  - segments: contract `Segment` (undirected, id "<minNode>_<maxNode>") plus routing extras
  - edges: directed edges for routing (u, v, segmentId, lengthM, travelTimeS, highway)
  - nodes: {id: [lng, lat]}
  - walkEdges: pedestrian network (smaller radius) for crowd trips
  - corridors: {corridorId: [segmentId, ...]}
Run:  uv run python build_graphs.py [area ...]
"""
import json
import os
import re
import sys
from pathlib import Path

import networkx as nx
import osmnx as ox

from corridors import AREAS, CORRIDORS

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "sim" / "assets"
ox.settings.use_cache = True
ox.settings.cache_folder = str(Path(__file__).resolve().parent / "cache" / "osmnx")
ox.settings.log_console = False
# overpass-api.de times out from the venue network; the mail.ru mirror works. Override with OVERPASS_URL.
ox.settings.overpass_url = os.environ.get("OVERPASS_URL", "https://maps.mail.ru/osm/tools/overpass/api")
ox.settings.overpass_rate_limit = False  # the mirror's /status endpoint returns 504
ox.settings.requests_timeout = 300

WALK_RADIUS_M = 900


def names(data) -> list[str]:
    n = data.get("name")
    if n is None:
        return []
    return n if isinstance(n, list) else [n]


def lanes_of(data) -> int:
    v = data.get("lanes")
    if isinstance(v, list):
        v = v[0]
    try:
        return max(1, int(float(v)))
    except (TypeError, ValueError):
        return 1  # OSM has no lane tag; 1 per direction is the conservative default


def seg_id(u, v) -> str:
    a, b = sorted((int(u), int(v)))
    return f"{a}_{b}"


def edge_coords(G, u, v, data) -> list[list[float]]:
    if "geometry" in data:
        return [[round(x, 6), round(y, 6)] for x, y in data["geometry"].coords]
    return [[round(G.nodes[u]["x"], 6), round(G.nodes[u]["y"], 6)],
            [round(G.nodes[v]["x"], 6), round(G.nodes[v]["y"], 6)]]


def find_corridor(G, street: str, cross_a: str, cross_b: str) -> list[tuple[int, int]]:
    """Path along `street` between its intersections with cross_a and cross_b."""
    rs, ra, rb = (re.compile(p, re.I) for p in (street, cross_a, cross_b))
    U = G.to_undirected()
    street_nodes, a_nodes, b_nodes = set(), set(), set()
    sub = nx.Graph()
    for u, v, d in U.edges(data=True):
        ns = names(d)
        if any(rs.search(n) for n in ns):
            street_nodes |= {u, v}
            w = d.get("length", 1.0)
            if not sub.has_edge(u, v) or sub[u][v]["length"] > w:
                sub.add_edge(u, v, length=w)
        if any(ra.search(n) for n in ns):
            a_nodes |= {u, v}
        if any(rb.search(n) for n in ns):
            b_nodes |= {u, v}
    A, B = a_nodes & street_nodes, b_nodes & street_nodes
    if not A or not B:
        raise ValueError(f"no intersection found: {street} x {cross_a if not A else cross_b}")
    best = None
    for a in A:
        lengths, paths = nx.single_source_dijkstra(sub, a, weight="length")
        for b in B:
            if b in lengths and b != a and (best is None or lengths[b] > best[0]):
                # Longest of the shortest paths between candidate nodes: intersections with
                # divided roads have several nodes; we want the full block span.
                best = (lengths[b], paths[b])
    if best is None:
        raise ValueError(f"{street}: cross streets not connected along the street")
    p = best[1]
    return list(zip(p[:-1], p[1:]))


def build_area(area: str) -> dict:
    cfg = AREAS[area]
    lat, lng = cfg["center"]
    if cfg.get("include_pedestrian"):
        from osmnx import _overpass
        flt = [_overpass._get_network_filter("drive"), '["highway"~"^(pedestrian|living_street)$"]["area"!~"yes"]']
        G = ox.graph_from_point((lat, lng), dist=cfg["radius_m"], custom_filter=flt, simplify=True)
        G = ox.add_edge_speeds(G, hwy_speeds={"pedestrian": 5, "living_street": 8})
    else:
        G = ox.graph_from_point((lat, lng), dist=cfg["radius_m"], network_type="drive", simplify=True)
        G = ox.add_edge_speeds(G)
    G = ox.add_edge_travel_times(G)
    W = ox.graph_from_point((lat, lng), dist=WALK_RADIUS_M, network_type="walk", simplify=True)

    nodes = {str(n): [round(d["x"], 6), round(d["y"], 6)] for n, d in G.nodes(data=True)}
    segments, edges = {}, []
    for u, v, k, d in G.edges(keys=True, data=True):
        sid = seg_id(u, v)
        hw = d.get("highway")
        hw = hw[0] if isinstance(hw, list) else hw
        edges.append({"u": str(u), "v": str(v), "segmentId": sid, "lengthM": round(d["length"], 1),
                      "travelTimeS": round(d["travel_time"], 2), "speedKph": round(d["speed_kph"], 1),
                      "highway": hw})
        if sid not in segments:
            segments[sid] = {"id": sid, "name": (names(d) or [hw or "unnamed"])[0],
                             "coords": edge_coords(G, u, v, d), "lanes": lanes_of(d),
                             "baselineCarVolume": None, "baselinePedVolume": None,
                             "highway": hw, "lengthM": round(d["length"], 1)}

    walk_nodes = {str(n): [round(d["x"], 6), round(d["y"], 6)] for n, d in W.nodes(data=True)}
    walk_edges = []
    seen = set()
    for u, v, d in W.edges(data=True):
        key = tuple(sorted((u, v)))
        if key in seen:
            continue
        seen.add(key)
        walk_edges.append({"u": str(u), "v": str(v), "lengthM": round(d["length"], 1),
                           "name": (names(d) or [None])[0], "coords": edge_coords(W, u, v, d)})

    corridors = {}
    for c in (c for c in CORRIDORS if c["area"] == area):
        sids = []
        for street, a, b in c["legs"]:
            for u, v in find_corridor(G, street, a, b):
                sid = seg_id(u, v)
                if sid not in sids:
                    sids.append(sid)
        corridors[c["id"]] = {"name": c["name"], "role": c["role"], "pair": c["pair"], "segmentIds": sids,
                              "lengthM": round(sum(segments[s]["lengthM"] for s in sids), 1)}

    out = {"area": area, "city": cfg["city"], "center": [lng, lat], "radiusM": cfg["radius_m"],
           "nodes": nodes, "edges": edges, "segments": list(segments.values()),
           "walkNodes": walk_nodes, "walkEdges": walk_edges, "corridors": corridors,
           "source": "OpenStreetMap via OSMnx " + ox.__version__}
    d = ASSETS / area
    d.mkdir(parents=True, exist_ok=True)
    (d / "network.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    return out


def main(areas: list[str]) -> int:
    print(f"{'area':<18}{'nodes':>7}{'edges':>7}{'segs':>6}{'walkE':>7}  corridors (segments, length m)")
    failed = 0
    for area in areas:
        try:
            o = build_area(area)
            cs = ", ".join(f"{k}={len(v['segmentIds'])}/{v['lengthM']:.0f}m" for k, v in o["corridors"].items())
            print(f"{area:<18}{len(o['nodes']):>7}{len(o['edges']):>7}{len(o['segments']):>6}{len(o['walkEdges']):>7}  {cs}")
        except Exception as e:  # report and continue with other areas
            failed += 1
            print(f"{area:<18} FAILED: {type(e).__name__}: {e}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:] or list(AREAS)))
