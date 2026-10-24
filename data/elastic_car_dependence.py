"""Compute carDependence (0-1) per business from its reviews with an Elastic hybrid query, then write it
back into sim/assets/<area>/businesses.json, data/processed/business_meta_<area>.json and the
`businesses` index.

    uv run python elastic_car_dependence.py --calibrate      # show the matched reviews + scores
    uv run python elastic_car_dependence.py                  # all areas with data

Formula:
  1. Car mention = a review that (a) matches the car vocabulary CAR_TERMS with BM25 on reviews.text
     ("park" alone is NOT in the list: it matched "Park Slope", "Prospect Park", "Bryant Park"; nor is
     "garage": "garage doors"), minus NOT_CAR_PHRASES and French-language reviews ("car" = "because"), AND (b) scores >= TAU on a `semantic` query for CAR_QUERY over reviews.content.
  2. m_i = car mentions among business i's reviews; n_i = its reviews with text.
     (Computed with one query per area, so the query embedding is made once per area.)
  3. Smoothed share  s_i = (m_i + ALPHA * p) / (n_i + ALPHA), with p = pooled share over every review in
     every area and ALPHA = 5 (additive smoothing so a business with 2 reviews can't jump to 0 or 1).
  4. carDependence_i = min(1, s_i / s_95), s_95 = 95th percentile of s over all businesses.
     So 1.0 = "reviews talk about parking/driving as much as the top 5% of businesses". This is a
     RELATIVE review signal, not a measured share of customers who drive.
Calibration history (evidence in data/elastic_verification.md):
  - Pure semantic scores couldn't separate "nice spot" from "parking spot"; the Jina reranker scored short
    generic reviews ("Bad experience") as high as real parking reviews. So the BM25 car-vocabulary gate does
    most of the work, and the semantic score is a sanity filter.
  - Jina v5-small (first run): TAU 0.575. After Jina hit its free-trial cap (HTTP 402) the reviews index was
    rebuilt on multilingual-e5-small, whose scores are compressed (0.87-0.93 for every BM25 hit in Astoria,
    true and false alike), so TAU = 0.88 keeps essentially every BM25 hit; precision comes from the
    vocabulary + NOT_CAR_PHRASES. Spot check on Astoria: ~39/43 hits genuinely about parking/driving.
"""

import argparse
import json
import re
import statistics
import sys
import time

from elasticsearch import helpers

from elastic_common import BUSINESSES, REVIEWS, ROOT, es
from elastic_ingest import doc_id

ASSETS = ROOT / "sim" / "assets"
PROCESSED = ROOT / "data" / "processed"
AREAS = ["astoria", "park_slope", "chinatown", "koreatown", "prospect_heights", "hayes_valley"]
CAR_QUERY = "Is it easy or hard to park a car here? Parking lot, street parking, garage, driving here by car, traffic."
CAR_TERMS = "parking parked drive drove driving car cars traffic valet parqueo estacionamiento"
# French "car" means "because": reviews whose originalLanguage is French are not counted.
SKIP_LANGUAGES = {"fr"}
TAU = 0.88  # semantic score threshold for multilingual-e5-small (see module docstring)
NOT_CAR_PHRASES = ["foot traffic", "car dealership"]
ALPHA = 5.0


def car_query(flt):
    return {"bool": {"filter": flt + [{"match": {"text": CAR_TERMS}}],
                     "must_not": [{"match_phrase": {"text": p}} for p in NOT_CAR_PHRASES],
                     "must": {"semantic": {"field": "content", "query": CAR_QUERY}}}}


def calibrate(client, size=200):
    resp = client.search(index=REVIEWS, query=car_query([]), size=size, source=["business_name", "text", "area"])
    print(f"BM25-gated reviews: {resp['hits']['total']}")
    for rank, h in enumerate(resp["hits"]["hits"]):
        t = h["_source"]["text"].replace("\n", " ")
        mark = ">=TAU" if h["_score"] >= TAU else "     "
        print(f"{rank:3d} {h['_score']:.4f} {mark} {h['_source']['area']:12s} {h['_source']['business_name'][:24]:24s} {t[:110]}")


def with_retry(fn, tries=8):
    """Jina on the free Serverless trial returns 429 when the per-minute quota is used up; wait it out."""
    for i in range(tries):
        try:
            return fn()
        except Exception as e:
            if "429" not in str(e) or i == tries - 1:
                raise
            time.sleep(10 * (i + 1))


def car_mentions_in_area(client, area, tau, skip_ids=frozenset()):
    """ONE query per area (one query embedding): BM25-gated semantic search, count hits >= tau per business."""
    resp = with_retry(lambda: client.search(index=REVIEWS, query=car_query([{"term": {"area": area}}]),
                                            size=10000, source=["business_id"]))
    counts = {}
    for h in resp["hits"]["hits"]:
        if h["_score"] >= tau and h["_id"] not in skip_ids:
            bid = h["_source"]["business_id"]
            counts[bid] = counts.get(bid, 0) + 1
    return counts


def local_car_mentions(revs):
    """Interim fallback (--local): the same BM25 vocabulary gate applied to the local review JSON with a
    standard-analyzer-like tokenizer, no semantic filter. Used only while the index is being rebuilt; the
    Elastic run overwrites these values."""
    terms = set(CAR_TERMS.split())
    counts = {}
    for r in revs:
        if r.get("language") in SKIP_LANGUAGES:
            continue
        t = r["text"].lower()
        if any(ph in t for ph in NOT_CAR_PHRASES):
            continue
        if terms & set(re.findall(r"[^\W\d_]+", t)):
            counts[r["businessId"]] = counts.get(r["businessId"], 0) + 1
    return counts


def main():
    p = argparse.ArgumentParser()
    p.add_argument("areas", nargs="*")
    p.add_argument("--calibrate", action="store_true")
    p.add_argument("--tau", type=float, default=TAU)
    p.add_argument("--local", action="store_true", help="interim: vocabulary gate on local JSON, no index writes")
    a = p.parse_args()
    client = es()
    if a.calibrate:
        calibrate(client)
        return 0
    if a.tau <= 0:
        raise SystemExit("set --tau (run --calibrate first)")
    areas = a.areas or [x for x in AREAS if (PROCESSED / f"reviews_{x}.json").exists()]

    # 1-2: counts per business
    stats = {}
    for area in areas:
        revs = json.loads((PROCESSED / f"reviews_{area}.json").read_text(encoding="utf-8"))
        n_by = {}
        for r in revs:
            n_by[r["businessId"]] = n_by.get(r["businessId"], 0) + 1
        skip = frozenset(r["reviewId"] for r in revs if r.get("language") in SKIP_LANGUAGES)
        counts = local_car_mentions(revs) if a.local else car_mentions_in_area(client, area, a.tau, skip)
        for b in json.loads((ASSETS / area / "businesses.json").read_text(encoding="utf-8")):
            stats[b["id"]] = (area, n_by.get(b["id"], 0), counts.get(b["id"], 0))
        print(f"  {area}: scored {sum(1 for v in stats.values() if v[0] == area)} businesses")

    # 3-4: smoothing + relative scaling
    N = sum(n for _, n, _ in stats.values())
    M = sum(m for _, _, m in stats.values())
    prior = M / N if N else 0.0
    smoothed = {bid: (m + ALPHA * prior) / (n + ALPHA) for bid, (_, n, m) in stats.items()}
    vals = sorted(smoothed.values())
    s95 = vals[int(0.95 * (len(vals) - 1))] if vals else 1.0
    s95 = s95 or 1.0
    car = {bid: round(min(1.0, s / s95), 3) for bid, s in smoothed.items()}
    print(f"pooled share p={prior:.4f} ({M}/{N} reviews >= tau {a.tau}), s95={s95:.4f}, "
          f"median carDependence={statistics.median(car.values()):.3f}")

    for area in areas:
        bp = ASSETS / area / "businesses.json"
        biz = json.loads(bp.read_text(encoding="utf-8"))
        for b in biz:
            b["carDependence"] = car[b["id"]]
        bp.write_text(json.dumps(biz, ensure_ascii=False), encoding="utf-8")
        mp = PROCESSED / f"business_meta_{area}.json"
        meta = json.loads(mp.read_text(encoding="utf-8"))
        for bid, m in meta.items():
            _, n, k = stats[bid]
            m.update({"carDependence": car[bid], "carMentions": k, "reviewsWithText": n,
                      "carDependenceMethod": {"mode": "local-interim" if a.local else "elastic", "query": CAR_QUERY, "terms": CAR_TERMS, "tau": a.tau, "alpha": ALPHA,
                                              "prior": round(prior, 5), "s95": round(s95, 5)}})
        mp.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
        if a.local:
            ok, err = 0, []
        else:
          ok, err = helpers.bulk(client, ({"_op_type": "update", "_index": BUSINESSES, "_id": doc_id(area, bid, bid),
                                         "doc": {"car_dependence": car[bid], "car_mentions": stats[bid][2]}}
                                        for bid in meta), raise_on_error=False)
        top = sorted(biz, key=lambda b: -b["carDependence"])[:5]
        print(f"  {area}: mean carDependence {statistics.mean(b['carDependence'] for b in biz):.3f}, "
              f"car mentions {sum(stats[b['id']][2] for b in biz)}")
        print(f"  {area}: updated {ok} docs{' (' + str(len(err)) + ' errors)' if err else ''}; top: "
              + "; ".join(f"{b['name']} ({b['category']}) {b['carDependence']}" for b in top))
    if not a.local:
        client.indices.refresh(index=BUSINESSES)
    return 0


if __name__ == "__main__":
    sys.exit(main())
