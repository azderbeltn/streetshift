"""Hybrid search over StreetShift reviews/businesses: BM25 + semantic (Jina), fused with RRF, then
reranked by a cross-encoder when the project has one (pattern from the starter's app.py).

    uv run python elastic_search.py "outdoor seating" --area astoria
    uv run python elastic_search.py "parking is impossible" --index reviews --corridor ditmars
    uv run python elastic_search.py "korean bbq" --index businesses
"""

import argparse
import json
import sys

from elastic_common import BUSINESSES, REVIEWS, es, find_reranker

FIELDS = {  # (BM25 fields, semantic field, rerank text field, _source)
    REVIEWS: (["text", "business_name^2"], "content", "text",
              ["business_id", "business_name", "category", "corridor_id", "area", "text", "published_at", "rating"]),
    BUSINESSES: (["name^3", "category^2", "categories", "description", "address"], "profile", "profile",
                 ["business_id", "name", "category", "corridor_id", "area", "rating", "review_count", "car_dependence"]),
}


def filters(area=None, corridor=None, business_id=None):
    f = []
    if area:
        f.append({"term": {"area": area}})
    if corridor:
        f.append({"term": {"corridor_id": corridor}})
    if business_id:
        f.append({"term": {"business_id": business_id}})
    return f


def hybrid_retriever(q, index, flt, reranker):
    bm25, sem, rr_field, _ = FIELDS[index]
    keyword = {"bool": {"must": {"multi_match": {"query": q, "fields": bm25}}, "filter": flt}}
    semantic = {"bool": {"must": {"semantic": {"field": sem, "query": q}}, "filter": flt}}
    rrf = {"rrf": {"retrievers": [{"standard": {"query": keyword}}, {"standard": {"query": semantic}}],
                   "rank_window_size": 50}}
    if not reranker:
        return rrf
    return {"text_similarity_reranker": {"retriever": rrf, "field": rr_field, "inference_id": reranker,
                                         "inference_text": q, "rank_window_size": 20}}


def hybrid_search(q, index=REVIEWS, size=10, area=None, corridor=None, business_id=None, client=None):
    """Returns (hits, mode). Falls back to plain RRF if the reranker errors (as the starter does)."""
    client = client or es()
    flt = filters(area, corridor, business_id)
    reranker = find_reranker(client)
    source = FIELDS[index][3]
    ret = hybrid_retriever(q, index, flt, reranker)
    try:
        resp = client.search(index=index, retriever=ret, size=size, source=source)
        mode = f"rrf+rerank({reranker})" if reranker else "rrf"
    except Exception as e:  # reranker unavailable -> plain RRF
        print(f"  (rerank failed: {str(e)[:120]}; falling back to RRF)", file=sys.stderr)
        ret = ret.get("text_similarity_reranker", {}).get("retriever", ret)
        resp = client.search(index=index, retriever=ret, size=size, source=source)
        mode = "rrf"
    hits = [{"_id": h["_id"], "_score": h["_score"], **h["_source"]} for h in resp["hits"]["hits"]]
    return hits, mode


def main():
    p = argparse.ArgumentParser()
    p.add_argument("query")
    p.add_argument("--index", default=REVIEWS, choices=[REVIEWS, BUSINESSES])
    p.add_argument("--area")
    p.add_argument("--corridor")
    p.add_argument("--size", type=int, default=8)
    p.add_argument("--json", action="store_true")
    a = p.parse_args()
    hits, mode = hybrid_search(a.query, a.index, a.size, a.area, a.corridor)
    if a.json:
        print(json.dumps({"mode": mode, "hits": hits}, ensure_ascii=False, indent=2))
        return 0
    print(f"{len(hits)} hits for {a.query!r} on {a.index} [{mode}]")
    for h in hits:
        if a.index == REVIEWS:
            print(f"  {h['_score']:.3f}  {h['business_name']} ({h['category']}, {h.get('corridor_id')}) "
                  f"{(h.get('published_at') or '')[:10]}  \"{(h['text'] or '')[:140]}\"")
        else:
            print(f"  {h['_score']:.3f}  {h['name']} ({h['category']}, {h.get('corridor_id')}) "
                  f"rating {h.get('rating')} car {h.get('car_dependence')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
