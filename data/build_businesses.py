"""Convert cached Apify Google Maps results into contract `Business` records + review files.

    uv run python build_businesses.py astoria
    uv run python build_businesses.py --all

Inputs:  data/raw/apify/<area>.json and <area>__<corridor>.json (scrape_apify.py), sim/assets/<area>/network.json
Outputs: sim/assets/<area>/businesses.json          contract Business[] (validated vs contracts/schemas/Business.json)
         data/processed/business_meta_<area>.json   extras the contract has no room for (placeId, corridorId,
                                                    address, categories, closed flag, url, car-dependence stats)
         data/processed/reviews_<area>.json         [{reviewId, businessId, businessName, category, area, city,
                                                      corridorId, text, publishedAtDate, rating}]

Mapping notes:
- id = Google placeId (dedupe key).
- popularTimes = [7][24] occupancy 0-100, day index 0 = Sunday ... 6 = Saturday (JS Date.getDay order),
  from `popularTimesHistogram` = {"Su": [{"hour": h, "occupancyPercent": p}, ...], "Mo": ...}
  (structure verified against the cached astoria run). Hours Google doesn't list -> 0 (closed / no data
  for that hour); a business with no histogram at all -> null.
- segmentId = nearest segment of the street named in the business's address (within 120 m), else the
  nearest drive segment (local metric projection). Address matching stops corner shops on W 32nd St
  being assigned to the avenue they happen to be closest to.
- corridorId = nearest corridor whose segments are within CORRIDOR_MAX_M, else null.
- carDependence: 0 placeholder here; elastic_car_dependence.py fills it from review signals. Existing
  values are preserved when this script is re-run.
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator
from pyproj import Transformer
from shapely import STRtree
from shapely.geometry import LineString, Point

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "apify"
ASSETS = ROOT / "sim" / "assets"
PROCESSED = ROOT / "data" / "processed"
SCHEMA = json.loads((ROOT / "contracts" / "schemas" / "Business.json").read_text(encoding="utf-8"))
AREAS = ["astoria", "park_slope", "chinatown", "koreatown", "prospect_heights", "hayes_valley"]
DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
CORRIDOR_MAX_M = 300



ADDRESS_MATCH_M = 120
_ABBR = [(r"\bAVENUE\b|\bAV\b", "AVE"), (r"\bSTREET\b", "ST"), (r"\bBOULEVARD\b", "BLVD"), (r"\bROAD\b", "RD"),
         (r"\bPLACE\b", "PL"), (r"\bEAST\b", "E"), (r"\bWEST\b", "W"), (r"\bNORTH\b", "N"), (r"\bSOUTH\b", "S")]


def norm_street(s: str | None) -> str:
    """Same normalisation as sim/src/traffic.ts normStreet: "West 32nd Street" -> "W 32 ST"."""
    import re
    x = re.sub(r"[.,]", " ", (s or "").upper())
    x = re.sub(r"\b(\d+)(ST|ND|RD|TH)\b", r"\1", x)
    for pat, rep in _ABBR:
        x = re.sub(pat, rep, x)
    return " ".join(x.split())


def address_street(addr: str | None) -> str | None:
    """'55 W 35th St, New York, NY 10001' -> 'W 35 ST'; '1250 Broadway, ...' -> 'BROADWAY'."""
    import re
    if not addr:
        return None
    first = addr.split(",")[0].strip()
    m = re.match(r"^[\dA-Za-z\-]*\d[\dA-Za-z\-]*\s+(.+)$", first)  # drop the house number
    return norm_street(m.group(1)) if m else None



def popular_times(hist):
    if not hist or not isinstance(hist, dict):
        return None
    grid = [[0] * 24 for _ in range(7)]
    seen = False
    for di, day in enumerate(DAYS):
        for e in hist.get(day) or []:
            h, p = e.get("hour"), e.get("occupancyPercent")
            if isinstance(h, int) and 0 <= h < 24 and isinstance(p, (int, float)):
                grid[di][h] = max(0, min(100, p))
                seen = True
    return grid if seen else None

def review_id(place_id, r):
    rid = r.get("reviewId")
    if rid:
        return rid
    key = f"{place_id}|{r.get('publishedAtDate')}|{(r.get('text') or '')[:200]}"
    return hashlib.sha1(key.encode("utf-8")).hexdigest()


def build(area: str) -> dict | None:
    raw_p = RAW / f"{area}.json"
    if not raw_p.exists():
        print(f"[{area}] no raw Apify cache, skipping")
        return None
    items = json.loads(raw_p.read_text(encoding="utf-8"))["items"]
    for extra in sorted(RAW.glob(f"{area}__*.json")):  # supplemental per-corridor scrapes
        items += json.loads(extra.read_text(encoding="utf-8"))["items"]
    net = json.loads((ASSETS / area / "network.json").read_text(encoding="utf-8"))
    lng0, lat0 = net["center"]
    fwd = Transformer.from_crs("EPSG:4326", f"+proj=aeqd +lat_0={lat0} +lon_0={lng0} +units=m +datum=WGS84",
                               always_xy=True).transform
    seg_ids, lines = [], []
    for s in net["segments"]:
        seg_ids.append(s["id"])
        lines.append(LineString([fwd(x, y) for x, y in s["coords"]]))
    tree = STRtree(lines)
    seg_norm = [norm_street(s["name"]) for s in net["segments"]]
    seg_idx = {sid: i for i, sid in enumerate(seg_ids)}
    corridors = {cid: [lines[seg_idx[s]] for s in c["segmentIds"] if s in seg_idx]
                 for cid, c in net["corridors"].items()}

    out_path = ASSETS / area / "businesses.json"
    prev = {}
    if out_path.exists():
        prev = {b["id"]: b for b in json.loads(out_path.read_text(encoding="utf-8"))}
    meta_path = PROCESSED / f"business_meta_{area}.json"
    prev_meta = json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}

    businesses, meta, reviews, seen = [], {}, [], set()
    skipped = {"duplicate": 0, "no_location": 0, "no_name": 0}
    for it in items:
        pid = it.get("placeId")
        if not pid or pid in seen:
            skipped["duplicate"] += 1
            continue
        loc = it.get("location") or {}
        if loc.get("lat") is None or loc.get("lng") is None:
            skipped["no_location"] += 1
            continue
        if not it.get("title"):
            skipped["no_name"] += 1
            continue
        seen.add(pid)
        p = Point(fwd(loc["lng"], loc["lat"]))
        ni = int(tree.query_nearest(p)[0])
        street = address_street(it.get("address"))
        if street:
            same = [i for i, n in enumerate(seg_norm) if n == street and lines[i].distance(p) <= ADDRESS_MATCH_M]
            if same:
                ni = min(same, key=lambda i: lines[i].distance(p))
        dists = {cid: min(l.distance(p) for l in ls) for cid, ls in corridors.items() if ls}
        cid = min(dists, key=dists.get) if dists else None
        if cid is not None and dists[cid] > CORRIDOR_MAX_M:
            cid = None
        old = prev.get(pid)
        b = {
            "id": pid,
            "name": it["title"],
            "category": it.get("categoryName") or ((it.get("categories") or [None])[0]) or "unknown",
            "lng": loc["lng"], "lat": loc["lat"],
            "rating": it.get("totalScore"),
            "reviewCount": it.get("reviewsCount"),
            "popularTimes": popular_times(it.get("popularTimesHistogram")),
            "carDependence": old["carDependence"] if old else 0,
            "segmentId": seg_ids[ni],
        }
        businesses.append(b)
        revs = [r for r in (it.get("reviews") or []) if r.get("publishedAtDate")]
        m = dict(prev_meta.get(pid, {}))
        m.update({
            "placeId": pid, "area": area, "city": net.get("city"), "corridorId": cid,
            "corridorDistanceM": round(dists[cid], 1) if cid else None,
            "segmentDistanceM": round(lines[ni].distance(p), 1),
            "address": it.get("address"), "categories": it.get("categories") or [],
            "permanentlyClosed": it.get("permanentlyClosed"), "temporarilyClosed": it.get("temporarilyClosed"),
            "url": it.get("url"), "description": it.get("description"), "price": it.get("price"),
            "reviewsScraped": len(revs),
        })
        meta[pid] = m
        for r in revs:
            text = r.get("text") or r.get("textTranslated")
            if not text:
                continue  # star-only ratings carry no searchable signal
            reviews.append({
                "reviewId": review_id(pid, r), "businessId": pid, "businessName": b["name"],
                "category": b["category"], "area": area, "city": net.get("city"), "corridorId": cid,
                "text": text, "publishedAtDate": r["publishedAtDate"], "rating": r.get("stars"),
                "language": r.get("originalLanguage"),
            })

    v = Draft202012Validator(SCHEMA)
    bad = [(b["id"], e.message) for b in businesses for e in v.iter_errors(b)]
    if bad:
        raise SystemExit(f"[{area}] {len(bad)} schema errors, first: {bad[0]}")
    PROCESSED.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(businesses, ensure_ascii=False), encoding="utf-8")
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    (PROCESSED / f"reviews_{area}.json").write_text(json.dumps(reviews, ensure_ascii=False), encoding="utf-8")

    n = len(businesses)
    per_corr = {}
    for m in meta.values():
        per_corr[m["corridorId"]] = per_corr.get(m["corridorId"], 0) + 1
    dates = sorted(r["publishedAtDate"] for r in reviews)
    summary = {"area": area, "businesses": n, "schemaValid": True,
               "withPopularTimes": sum(1 for b in businesses if b["popularTimes"]),
               "withRating": sum(1 for b in businesses if b["rating"] is not None),
               "reviews": len(reviews), "reviewDates": [dates[0][:10], dates[-1][:10]] if dates else None,
               "perCorridor": per_corr, "skipped": skipped}
    print(json.dumps(summary))
    return summary


def main():
    p = argparse.ArgumentParser()
    p.add_argument("areas", nargs="*")
    p.add_argument("--all", action="store_true")
    a = p.parse_args()
    for area in (AREAS if a.all else a.areas):
        build(area)
    return 0


if __name__ == "__main__":
    sys.exit(main())
