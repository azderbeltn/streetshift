"""Scrape businesses + popular times + dated reviews around each corridor with Apify.

    uv run python scrape_apify.py astoria            # one area
    uv run python scrape_apify.py astoria --dry-run  # print the input + cost estimate, no API call
    uv run python scrape_apify.py --all

Actor: compass/crawler-google-places (docs/apify.md). Search area = the union of one circle per
corridor in the area (treated + control): the circle is centred on the corridor's segments and its
radius reaches the farthest corridor vertex plus BUFFER_M. The union goes to the Actor as a GeoJSON
Polygon/MultiPolygon in `customGeolocation` ([lng, lat] order), so both corridors are scraped in ONE
run and overlapping places are never paid for twice.

Every run is cached to data/raw/apify/<area>.json (input, run stats, items). If the cache exists the
API is never called again. Cost per area is logged to data/raw/apify/usage.json.
"""

import argparse
import json
import math
import os
import sys
import time
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv
from pyproj import Transformer
from shapely.geometry import MultiPolygon, Point, mapping
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
RAW = ROOT / "data" / "raw" / "apify"
ASSETS = ROOT / "sim" / "assets"
ACTOR = "compass/crawler-google-places"

AREAS = ["astoria", "park_slope", "chinatown", "koreatown", "prospect_heights", "hayes_valley"]
BUFFER_M = 300
MAX_PLACES = 150            # cap per area (CLAUDE.md task brief)
SEARCH_TERMS = ["restaurant", "cafe", "bar", "bakery", "store", "salon"]
PER_SEARCH = 30             # 6 terms x 30 = 180 candidates, cut to MAX_PLACES by max_items
MAX_REVIEWS = 60
MAX_CHARGE_USD = Decimal("6.50")  # hard stop per area (est. 150*(0.004+0.002) + 9000*0.0005 = $5.40)


def corridor_area(area: str, only: str | None = None, buffer_m: float = BUFFER_M):
    """Union of per-corridor circles (lng/lat polygon) + a description of each circle."""
    net = json.loads((ASSETS / area / "network.json").read_text(encoding="utf-8"))
    segs = {s["id"]: s for s in net["segments"]}
    lng0, lat0 = net["center"]
    aeqd = f"+proj=aeqd +lat_0={lat0} +lon_0={lng0} +units=m +datum=WGS84"
    fwd = Transformer.from_crs("EPSG:4326", aeqd, always_xy=True).transform
    inv = Transformer.from_crs(aeqd, "EPSG:4326", always_xy=True).transform
    circles, info = [], {}
    for cid, c in net["corridors"].items():
        if only and cid != only:
            continue
        pts = [fwd(x, y) for sid in c["segmentIds"] for x, y in segs[sid]["coords"]]
        if not pts:
            print(f"  ! corridor {cid} has no segments, skipped")
            continue
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        r = max(math.hypot(x - cx, y - cy) for x, y in pts) + buffer_m
        circles.append(Point(cx, cy).buffer(r, quad_segs=12))
        clng, clat = inv(cx, cy)
        info[cid] = {"center": [round(clng, 6), round(clat, 6)], "radiusM": round(r, 1), "role": c["role"]}
    geom = transform(inv, unary_union(circles)).simplify(0.00002)
    gj = mapping(geom)
    # GeoJSON wants plain lists and closed rings
    gj = json.loads(json.dumps(gj))
    return gj, info


def run_area(area: str, dry_run: bool = False, only: str | None = None, max_places: int = MAX_PLACES,
             buffer_m: float = BUFFER_M) -> dict | None:
    """only=<corridorId>: supplemental scrape of one corridor's circle (cached as <area>__<corridor>.json)."""
    key = f"{area}__{only}" if only else area
    cache = RAW / f"{key}.json"
    if cache.exists():
        d = json.loads(cache.read_text(encoding="utf-8"))
        print(f"[{area}] cached ({len(d['items'])} items) -> {cache}, skipping API call")
        return d
    if not (ASSETS / area / "network.json").exists():
        print(f"[{area}] network.json not built yet, skipping")
        return None
    geo, circles = corridor_area(area, only, buffer_m)
    per_search = PER_SEARCH if not only else -(-max_places // len(SEARCH_TERMS)) + 5
    run_input = {
        "searchStringsArray": SEARCH_TERMS,
        "customGeolocation": geo,
        "maxCrawledPlacesPerSearch": per_search,
        "language": "en",
        "scrapePlaceDetailPage": True,       # needed for popularTimesHistogram
        "maxReviews": MAX_REVIEWS,
        "reviewsSort": "newest",
        "scrapeReviewsPersonalData": False,  # we never need reviewer identities
        "skipClosedPlaces": False,           # closed places matter for a 2020 backtest
        "maxImages": 0,
        "maxQuestions": 0,
    }
    print(f"[{area}] circles: {json.dumps(circles)}")
    print(f"[{area}] geometry {geo['type']}, est. max cost "
          f"${max_places * 0.006 + max_places * MAX_REVIEWS * 0.0005:.2f}, hard cap ${MAX_CHARGE_USD}")
    if dry_run:
        print(json.dumps(run_input)[:1500])
        return None
    if os.environ.get("USE_MOCK_APIFY", "false").lower() == "true":
        print(f"[{area}] USE_MOCK_APIFY=true, not calling Apify")
        return None

    from apify_client import ApifyClient

    client = ApifyClient(os.environ["APIFY_TOKEN"])
    t0 = time.time()
    run = client.actor(ACTOR).call(run_input=run_input, max_items=max_places,
                                   max_total_charge_usd=MAX_CHARGE_USD, logger=None)
    if run is None:
        raise RuntimeError("Actor call returned no run")
    items = list(client.dataset(run.default_dataset_id).iterate_items())
    full = client.run(run.id).get()
    rd = full.model_dump(mode="json") if hasattr(full, "model_dump") else dict(full)
    usage = {
        "area": area, "runId": rd.get("id"), "status": rd.get("status"),
        "items": len(items), "seconds": round(time.time() - t0, 1),
        "usageTotalUsd": rd.get("usage_total_usd"),
        "chargedEventCounts": rd.get("charged_event_counts"),
        "startedAt": rd.get("started_at"),
    }
    out = {"area": area, "onlyCorridor": only, "actor": ACTOR, "input": run_input, "circles": circles,
           "run": usage, "items": items}
    RAW.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    log = RAW / "usage.json"
    hist = json.loads(log.read_text(encoding="utf-8")) if log.exists() else {}
    hist[key] = usage
    hist["_totalUsd"] = round(sum(v.get("usageTotalUsd") or 0 for k, v in hist.items() if not k.startswith("_")), 4)
    log.write_text(json.dumps(hist, indent=2), encoding="utf-8")
    print(f"[{area}] {usage['status']}: {len(items)} items, ${usage['usageTotalUsd']} "
          f"in {usage['seconds']}s (running total ${hist['_totalUsd']})")
    return out


def summarize(d: dict):
    items = d["items"]
    n = len(items)
    pt = sum(1 for i in items if i.get("popularTimesHistogram"))
    revs = [r for i in items for r in (i.get("reviews") or [])]
    dates = sorted(r["publishedAtDate"] for r in revs if r.get("publishedAtDate"))
    cats = {}
    for i in items:
        cats[i.get("categoryName")] = cats.get(i.get("categoryName"), 0) + 1
    print(f"  places {n}, unique placeIds {len({i.get('placeId') for i in items})}, "
          f"with popular times {pt} ({100 * pt / max(n, 1):.0f}%), reviews {len(revs)}"
          f" (with text {sum(1 for r in revs if r.get('text'))})")
    if dates:
        print(f"  review dates {dates[0][:10]} .. {dates[-1][:10]}")
    print("  top categories:", sorted(cats.items(), key=lambda kv: -kv[1])[:10])


def main():
    p = argparse.ArgumentParser()
    p.add_argument("areas", nargs="*")
    p.add_argument("--all", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--corridor", help="supplemental scrape of just this corridor's circle")
    p.add_argument("--max-places", type=int, default=MAX_PLACES)
    p.add_argument("--buffer", type=float, default=BUFFER_M, help="circle buffer beyond the corridor (m)")
    a = p.parse_args()
    areas = AREAS if a.all else a.areas
    if not areas:
        p.error("name an area or pass --all")
    for area in areas:
        d = run_area(area, a.dry_run, a.corridor, a.max_places, a.buffer)
        if d:
            summarize(d)
    return 0


if __name__ == "__main__":
    sys.exit(main())
