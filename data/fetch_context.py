"""Census population/households and NYC count locations for each area.

Per area, writes sim/assets/<area>/context.json:
  census: block groups intersecting the area circle (ACS 2024 5-year B01003 population,
          B11001 households), with the share of each block group's land inside the circle,
          and area-weighted totals used to size the simulated population.
  counts: for each corridor, NYC Bi-Annual Pedestrian Count locations (cqsj-cfgu) and
          Automated Traffic Volume Count locations (7ym2-wayt) within 500 m, with mean volumes.
          Empty lists mean "no count data here" -> the sim must estimate and flag.
Run:  uv run python fetch_context.py [area ...]
"""
import json
import os
import statistics
import sys
from collections import defaultdict
from pathlib import Path

import requests
from dotenv import load_dotenv
from pyproj import Transformer
from shapely.geometry import Point, shape
from shapely.ops import transform

from corridors import AREAS

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "sim" / "assets"
CACHE = Path(__file__).resolve().parent / "cache" / "context"
CACHE.mkdir(parents=True, exist_ok=True)
load_dotenv(ROOT / ".env")

CENSUS_KEY = os.environ.get("CENSUS_API_KEY", "")
NYC_TOKEN = os.environ.get("NYC_OPEN_DATA_APP_TOKEN", "")
ACS = "https://api.census.gov/data/2024/acs/acs5"
TIGER = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_ACS2024/MapServer/10/query"
NYC = "https://data.cityofnewyork.us/resource"
COUNT_RADIUS_M = 500
BORO = {"astoria": "Queens", "park_slope": "Brooklyn", "prospect_heights": "Brooklyn",
        "chinatown": "Manhattan", "koreatown": "Manhattan"}


def get_json(url, params=None, headers=None, cache_key=None):
    if cache_key:
        f = CACHE / f"{cache_key}.json"
        if f.exists():
            return json.loads(f.read_text(encoding="utf-8"))
    r = requests.get(url, params=params, headers=headers, timeout=120)
    r.raise_for_status()
    data = r.json()
    if cache_key:
        f.write_text(json.dumps(data), encoding="utf-8")
    return data


def local_proj(lat, lng):
    """Azimuthal equidistant projection centred on the area, in metres."""
    crs = f"+proj=aeqd +lat_0={lat} +lon_0={lng} +units=m"
    fwd = Transformer.from_crs("EPSG:4326", crs, always_xy=True).transform
    return fwd


def census_for(area: str) -> dict:
    cfg = AREAS[area]
    lat, lng = cfg["center"]
    fwd = local_proj(lat, lng)
    circle = Point(0, 0).buffer(cfg["radius_m"])
    gj = get_json(TIGER, {
        "geometry": f"{lng},{lat}", "geometryType": "esriGeometryPoint", "inSR": 4326,
        "spatialRel": "esriSpatialRelIntersects", "distance": cfg["radius_m"], "units": "esriSRUnit_Meter",
        "outFields": "GEOID,STATE,COUNTY,TRACT,BLKGRP,AREALAND", "returnGeometry": "true",
        "outSR": 4326, "f": "geojson"}, cache_key=f"tiger_{area}")
    acs = get_json(ACS, {"get": "NAME,B01003_001E,B11001_001E", "for": "block group:*",
                         "in": f"state:{cfg['state']} county:{cfg['county']} tract:*", "key": CENSUS_KEY},
                   cache_key=f"acs_{cfg['state']}{cfg['county']}")
    head, rows = acs[0], acs[1:]
    idx = {h: i for i, h in enumerate(head)}
    by_geoid = {r[idx["state"]] + r[idx["county"]] + r[idx["tract"]] + r[idx["block group"]]: r for r in rows}

    bgs, pop_w, hh_w = [], 0.0, 0.0
    for feat in gj["features"]:
        geoid = feat["properties"]["GEOID"]
        r = by_geoid.get(geoid)
        geom = transform(fwd, shape(feat["geometry"]))
        share = geom.intersection(circle).area / geom.area if geom.area else 0.0
        pop = int(r[idx["B01003_001E"]]) if r and int(r[idx["B01003_001E"]]) >= 0 else None
        hh = int(r[idx["B11001_001E"]]) if r and int(r[idx["B11001_001E"]]) >= 0 else None
        if pop is not None:
            pop_w += pop * share
        if hh is not None:
            hh_w += hh * share
        bgs.append({"geoid": geoid, "population": pop, "households": hh, "shareInCircle": round(share, 3)})
    return {"source": "ACS 2024 5-year (B01003_001E, B11001_001E); TIGERweb ACS2024 block groups",
            "radiusM": cfg["radius_m"], "blockGroups": bgs,
            "populationInCircle": round(pop_w), "householdsInCircle": round(hh_w)}


def nyc(dataset, params, cache_key):
    return get_json(f"{NYC}/{dataset}.json", params, {"X-App-Token": NYC_TOKEN} if NYC_TOKEN else None, cache_key)


def ped_counts(lat, lng, key):
    rows = nyc("cqsj-cfgu", {"$where": f"within_circle(the_geom, {lat}, {lng}, {COUNT_RADIUS_M})", "$limit": 50},
               f"ped_{key}")
    out = []
    for r in rows:
        vals = []
        for k, v in r.items():
            if k[:3] in ("may", "sep", "oct", "jun") and any(t in k for t in ("_am", "_pm", "_md")):
                try:
                    vals.append(float(v))
                except (TypeError, ValueError):
                    pass
        out.append({"loc": r.get("loc"), "street": r.get("street_nam"), "from": r.get("from_stree"),
                    "to": r.get("to_street"), "coords": r.get("the_geom", {}).get("coordinates"),
                    "meanPeriodCount": round(statistics.mean(vals), 1) if vals else None, "nPeriods": len(vals)})
    return out


def traffic_locations(boro):
    """All ATR count locations in a borough (grouped), reprojected from EPSG:2263."""
    rows = nyc("7ym2-wayt", {"$select": "segmentid,wktgeom,street,fromst,tost,count(*) as n",
                             "$group": "segmentid,wktgeom,street,fromst,tost",
                             "$where": f"boro='{boro}'", "$limit": 50000}, f"atr_locs_{boro}")
    to_ll = Transformer.from_crs("EPSG:2263", "EPSG:4326", always_xy=True).transform
    locs = []
    for r in rows:
        w = r.get("wktgeom", "")
        if not w.startswith("POINT"):
            continue
        x, y = map(float, w[w.index("(") + 1:w.index(")")].split())
        lng, lat = to_ll(x, y)
        locs.append({**r, "lng": lng, "lat": lat})
    return locs


def traffic_volume(segmentid, key):
    """Mean 15-minute volume per direction and the years observed, for one ATR segment."""
    rows = nyc("7ym2-wayt", {"$select": "yr,direction,avg(vol) as v,count(*) as n",
                             "$group": "yr,direction", "$where": f"segmentid='{segmentid}'", "$limit": 500},
               f"atr_vol_{key}_{segmentid}")
    if not rows:
        return None
    per_dir = defaultdict(list)
    for r in rows:
        per_dir[r["direction"]].append(float(r["v"]))
    return {"years": sorted({int(r["yr"]) for r in rows}),
            "meanVolPer15MinByDirection": {d: round(statistics.mean(v), 1) for d, v in per_dir.items()},
            "meanHourlyTwoWay": round(sum(statistics.mean(v) for v in per_dir.values()) * 4, 1)}


def counts_for(area: str, network: dict) -> dict:
    if AREAS[area]["city"] != "NYC":
        return {"note": "No NYC counts outside NYC; SF has no ped/vehicle counts for Hayes St "
                        "(docs/corridor-candidates.md). Volumes are estimated and flagged."}
    segs = {s["id"]: s for s in network["segments"]}
    locs = traffic_locations(BORO[area])
    out = {}
    for cid, c in network["corridors"].items():
        pts = [pt for sid in c["segmentIds"] for pt in segs[sid]["coords"]]
        lng = sum(p[0] for p in pts) / len(pts)
        lat = sum(p[1] for p in pts) / len(pts)
        fwd = local_proj(lat, lng)
        near = []
        for loc in locs:
            x, y = fwd(loc["lng"], loc["lat"])
            d = (x * x + y * y) ** 0.5
            if d <= COUNT_RADIUS_M:
                near.append((d, loc))
        near.sort(key=lambda t: t[0])
        atr = []
        for d, loc in near[:8]:
            atr.append({"segmentid": loc["segmentid"], "street": loc["street"], "from": loc["fromst"],
                        "to": loc["tost"], "distanceM": round(d), "lng": round(loc["lng"], 6),
                        "lat": round(loc["lat"], 6), "volume": traffic_volume(loc["segmentid"], area)})
        out[cid] = {"midpoint": [round(lng, 6), round(lat, 6)],
                    "pedestrianCounts": ped_counts(lat, lng, cid), "trafficCounts": atr}
    return out


def main(areas):
    print(f"{'area':<18}{'BGs':>5}{'pop(circle)':>13}{'hh(circle)':>12}  counts within 500 m (ped / traffic locations)")
    for area in areas:
        f = ASSETS / area / "network.json"
        if not f.exists():
            print(f"{area:<18} skipped: no network.json yet")
            continue
        network = json.loads(f.read_text(encoding="utf-8"))
        ctx = {"area": area, "census": census_for(area), "counts": counts_for(area, network)}
        (ASSETS / area / "context.json").write_text(json.dumps(ctx, indent=1), encoding="utf-8")
        c = ctx["census"]
        cov = "; ".join(f"{k}: {len(v['pedestrianCounts'])}/{len(v['trafficCounts'])}"
                        for k, v in ctx["counts"].items() if isinstance(v, dict) and "pedestrianCounts" in v) \
            or ctx["counts"].get("note", "")[:60]
        print(f"{area:<18}{len(c['blockGroups']):>5}{c['populationInCircle']:>13,}{c['householdsInCircle']:>12,}  {cov}")


if __name__ == "__main__":
    main(sys.argv[1:] or list(AREAS))
