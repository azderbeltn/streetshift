"""OSM building footprints + heights around each corridor, for the offline map (DEMO_MODE or when
the vector-tile basemap can't load). Height: `height` tag, else `building:levels` x 3.2 m, else 10 m
(flagged `estimated`).

Writes sim/assets/<area>/buildings.json: [{id, polygon: [[lng,lat],...], height, estimated}]
Run:  uv run python fetch_buildings.py [area ...]
"""
import json
import os
import re
import sys
from pathlib import Path

import osmnx as ox
from shapely.geometry import MultiPolygon, Polygon

from corridors import AREAS

ROOT = Path(__file__).resolve().parent.parent
ox.settings.use_cache = True
ox.settings.cache_folder = str(Path(__file__).resolve().parent / "cache" / "osmnx")
ox.settings.log_console = False
ox.settings.overpass_url = os.environ.get("OVERPASS_URL", "https://maps.mail.ru/osm/tools/overpass/api")
ox.settings.overpass_rate_limit = False
ox.settings.requests_timeout = 300
RADIUS_M = 700
LEVEL_M = 3.2


def num(v):
    if v is None or (isinstance(v, float) and v != v):
        return None
    m = re.match(r"^\s*([\d.]+)", str(v))
    return float(m.group(1)) if m else None


def build(area: str) -> int:
    net = json.loads((ROOT / "sim" / "assets" / area / "network.json").read_text(encoding="utf-8"))
    ids = [s for c in net["corridors"].values() for s in c["segmentIds"]]
    seg = {s["id"]: s for s in net["segments"]}
    pts = [p for s in ids for p in seg[s]["coords"]]
    lng = sum(p[0] for p in pts) / len(pts)
    lat = sum(p[1] for p in pts) / len(pts)
    gdf = ox.features_from_point((lat, lng), tags={"building": True}, dist=RADIUS_M)
    out = []
    for idx, row in gdf.iterrows():
        geom = row.geometry
        polys = list(geom.geoms) if isinstance(geom, MultiPolygon) else [geom] if isinstance(geom, Polygon) else []
        h = num(row.get("height"))
        est = False
        if h is None:
            lv = num(row.get("building:levels"))
            h, est = (lv * LEVEL_M, False) if lv else (10.0, True)
        for k, poly in enumerate(polys):
            ring = [[round(x, 6), round(y, 6)] for x, y in poly.exterior.coords]
            out.append({"id": f"{idx[1]}-{k}", "polygon": ring, "height": round(h, 1), "estimated": est})
    (ROOT / "sim" / "assets" / area / "buildings.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    return len(out)


if __name__ == "__main__":
    for a in sys.argv[1:] or list(AREAS):
        try:
            print(f"{a:<18} {build(a):>6} buildings")
        except Exception as e:
            print(f"{a:<18} FAILED: {type(e).__name__}: {str(e)[:120]}")
