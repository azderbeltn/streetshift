"""Compute carDependence (0-1) per business from its reviews with Elastic (semantic retrieval + Jina
reranker), then write it back into sim/assets/<area>/businesses.json, data/processed/business_meta_<area>.json
and the `businesses` index.

    uv run python elastic_car_dependence.py --calibrate      # show score distribution, pick the threshold
    uv run python elastic_car_dependence.py                  # all areas with data

Formula:
  1. For business i, ONE search over its reviews: a `semantic` query on reviews.content (Jina embeddings)
     with CAR_QUERY, re-scored by the `text_similarity_reranker` retriever (Jina reranker, found with
     GET _inference/rerank) against RERANK_TEXT. Calibration on Astoria (data/elastic_verification.md)
     showed raw semantic scores can't separate "nice spot" from "parking spot", while reranker scores
     >= TAU (1.11) are almost all genuinely about parking/driving/traffic.
  2. m_i = number of its reviews with reranker score >= TAU; n_i = number of its reviews with text.
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

from elasticsearch import helpers

from elastic_common import BUSINESSES, REVIEWS, ROOT, es, find_reranker

ASSETS = ROOT / "sim" / "assets"
PROCESSED = ROOT / "data" / "processed"
AREAS = ["astoria", "park_slope", "chinatown", "koreatown", "prospect_heights", "hayes_valley"]
CAR_QUERY = "Is it easy or hard to park a car here? Parking lot, street parking, garage, driving here by car, traffic."
RERANK_TEXT = "The review talks about parking, driving a car to get here, or traffic."
TAU = 1.11  # reranker score threshold, chosen with --calibrate (see module docstring)
ALPHA = 5.0
KW = ("park", "drive", "drove", "car ", "cars", "traffic", "garage", "valet", " lot")


def retriever(reranker, flt, window):
    sem = {"standard": {"query": {"bool": {"filter": flt, "must": {"semantic": {"field": "content", "query": CAR_QUERY}}}}}}
    return {"text_similarity_reranker": {"retriever": sem, "field": "text", "inference_id": reranker,
                                         "inference_text": RERANK_TEXT, "rank_window_size": window}}


def calibrate(client, size=200):
    reranker = find_reranker(client)
    resp = client.search(index=REVIEWS, retriever=retriever(reranker, [], size), size=size,
                         source=["business_name", "text"])
    for rank, h in enumerate(resp["hits"]["hits"]):
        t = h["_source"]["text"].replace("\n", " ")
        flag = "KW" if any(k in t.lower() for k in KW) else "  "
        print(f"{rank:3d} {h['_score']:.4f} {flag} {h['_source']['business_name'][:28]:28s} {t[:110]}")
    print(f"reranker {reranker}; total reviews {client.count(index=REVIEWS)['count']}")


def score_business(client, reranker, bid, n):
    resp = client.search(index=REVIEWS, retriever=retriever(reranker, [{"term": {"business_id": bid}}], max(n, 1)),
                         size=max(n, 1), source=False)
    return [h["_score"] for h in resp["hits"]["hits"]]


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
    reranker = find_reranker(client)
    if not reranker:
        raise SystemExit("no rerank inference endpoint found")

    # 1-2: counts per business
    stats = {}
    for area in areas:
        revs = json.loads((PROCESSED / f"reviews_{area}.json").read_text(encoding="utf-8"))
        n_by = {}
        for r in revs:
            n_by[r["businessId"]] = n_by.get(r["businessId"], 0) + 1
        for b in json.loads((ASSETS / area / "businesses.json").read_text(encoding="utf-8")):
            n = n_by.get(b["id"], 0)
            m = sum(1 for s in score_business(client, reranker, b["id"], n) if s >= a.tau) if n else 0
            stats[b["id"]] = (area, n, m)
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
                      "carDependenceMethod": {"query": CAR_QUERY, "rerankText": RERANK_TEXT, "reranker": reranker, "tau": a.tau, "alpha": ALPHA,
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
