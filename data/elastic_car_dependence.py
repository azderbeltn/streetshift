"""Compute carDependence (0-1) per business from its reviews with an Elastic hybrid query, then write it
back into sim/assets/<area>/businesses.json, data/processed/business_meta_<area>.json and the
`businesses` index.

    uv run python elastic_car_dependence.py --calibrate      # show the matched reviews + scores
    uv run python elastic_car_dependence.py                  # all areas with data

Formula:
  1. Car mention = a review that (a) matches the car vocabulary CAR_TERMS with BM25 on reviews.text (recall)
     AND (b) scores >= TAU on a `semantic` query (Jina embeddings on reviews.content) for CAR_QUERY
     (precision: drops "Astoria Park", "drive off customers", "used car dealership", "drove the experience").
     Calibration on Astoria (evidence in data/elastic_verification.md): pure semantic scores couldn't separate
     "nice spot" from "parking spot", and the Jina reranker scored short generic reviews ("Bad experience")
     as high as real parking reviews, so neither alone was usable; BM25-gated semantic >= 0.575 was.
  2. m_i = car mentions among business i's reviews; n_i = its reviews with text.
     (Computed with one query per area, so the Jina query embedding is made once per area.)
  3. Smoothed share  s_i = (m_i + ALPHA * p) / (n_i + ALPHA), with p = pooled share over every review in
     every area and ALPHA = 5 (additive smoothing so a business with 2 reviews can't jump to 0 or 1).
  4. carDependence_i = min(1, s_i / s_95), s_95 = 95th percentile of s over all businesses.
     So 1.0 = "reviews talk about parking/driving as much as the top 5% of businesses". This is a
     RELATIVE review signal, not a measured share of customers who drive.
"""

import argparse
import json
import statistics
import sys
import time

from elasticsearch import helpers

from elastic_common import BUSINESSES, REVIEWS, ROOT, es

ASSETS = ROOT / "sim" / "assets"
PROCESSED = ROOT / "data" / "processed"
AREAS = ["astoria", "park_slope", "chinatown", "koreatown", "prospect_heights", "hayes_valley"]
CAR_QUERY = "Is it easy or hard to park a car here? Parking lot, street parking, garage, driving here by car, traffic."
CAR_TERMS = "parking parked drive drove driving car cars traffic garage valet parqueo estacionamiento"
TAU = 0.575  # semantic score threshold, chosen with --calibrate (see module docstring)
ALPHA = 5.0


def car_query(flt):
    return {"bool": {"filter": flt + [{"match": {"text": CAR_TERMS}}],
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


def car_mentions_in_area(client, area, tau):
    """ONE query per area (one query embedding): BM25-gated semantic search, count hits >= tau per business."""
    resp = with_retry(lambda: client.search(index=REVIEWS, query=car_query([{"term": {"area": area}}]),
                                            size=10000, source=["business_id"]))
    counts = {}
    for h in resp["hits"]["hits"]:
        if h["_score"] >= tau:
            bid = h["_source"]["business_id"]
            counts[bid] = counts.get(bid, 0) + 1
    return counts


def main():
    p = argparse.ArgumentParser()
    p.add_argument("areas", nargs="*")
    p.add_argument("--calibrate", action="store_true")
    p.add_argument("--tau", type=float, default=TAU)
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
        counts = car_mentions_in_area(client, area, a.tau)
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
                      "carDependenceMethod": {"query": CAR_QUERY, "terms": CAR_TERMS, "tau": a.tau, "alpha": ALPHA,
                                              "prior": round(prior, 5), "s95": round(s95, 5)}})
        mp.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
        ok, err = helpers.bulk(client, ({"_op_type": "update", "_index": BUSINESSES, "_id": bid,
                                         "doc": {"car_dependence": car[bid], "car_mentions": stats[bid][2]}}
                                        for bid in meta), raise_on_error=False)
        top = sorted(biz, key=lambda b: -b["carDependence"])[:5]
        print(f"  {area}: updated {ok} docs{' (' + str(len(err)) + ' errors)' if err else ''}; top: "
              + "; ".join(f"{b['name']} ({b['category']}) {b['carDependence']}" for b in top))
    client.indices.refresh(index=BUSINESSES)
    return 0


if __name__ == "__main__":
    sys.exit(main())
