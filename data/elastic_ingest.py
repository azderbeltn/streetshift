"""Index StreetShift businesses and reviews into Elastic Cloud Serverless.

    uv run python elastic_ingest.py                # all areas that have data
    uv run python elastic_ingest.py astoria --recreate

Follows the starter's ingest.py (docs/elastic-starter/paper-scout/ingest.py):
- check the embedding inference endpoint exists before naming it in the mapping, else fall back to the
  cluster's default semantic_text model;
- keep a plain `text` field for BM25 + reranking, and a separate `semantic_text` field that Elastic
  chunks and embeds with Jina at index time (no embedding pipeline);
- explicit `_id` on every doc so re-running overwrites instead of duplicating;
- modest bulk batches because embeddings are computed during bulk.

Inputs (written by build_businesses.py): sim/assets/<area>/businesses.json,
data/processed/business_meta_<area>.json, data/processed/reviews_<area>.json.
"""

import argparse
import json
import sys
import time
from pathlib import Path

from elasticsearch import helpers

from elastic_common import BUSINESSES, EMBEDDING_ID, REVIEWS, ROOT, es, usable_embedding_id

ASSETS = ROOT / "sim" / "assets"
PROCESSED = ROOT / "data" / "processed"
AREAS = ["astoria", "park_slope", "chinatown", "koreatown", "prospect_heights", "hayes_valley"]


def semantic_field(client) -> dict:
    semantic = {"type": "semantic_text"}
    iid = usable_embedding_id(client)
    if iid:
        semantic["inference_id"] = iid
    else:
        print(f"{EMBEDDING_ID} and fallbacks unusable, using this cluster's default semantic_text model")
    return semantic


def create_indexes(client, recreate: bool):
    if all(client.indices.exists(index=n) for n in (BUSINESSES, REVIEWS)) and not recreate:
        print("Indexes exist, adding to them (use --recreate to start fresh)")
        return
    semantic = semantic_field(client)
    specs = {
        BUSINESSES: {
            "_meta": {"description": "Real businesses (Google Maps via Apify) around StreetShift corridors: "
                                     "NYC 2020 Open Streets, their control corridors, and Hayes St SF. "
                                     "car_dependence is 0-1 from review signals about parking/driving."},
            "properties": {
                "business_id": {"type": "keyword"},
                "name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
                "category": {"type": "keyword"},
                "categories": {"type": "keyword"},
                "area": {"type": "keyword"},
                "city": {"type": "keyword"},
                "corridor_id": {"type": "keyword"},
                "segment_id": {"type": "keyword"},
                "address": {"type": "text"},
                "location": {"type": "geo_point"},
                "rating": {"type": "float"},
                "review_count": {"type": "integer"},
                "permanently_closed": {"type": "boolean"},
                "car_dependence": {"type": "float"},
                "car_mentions": {"type": "integer"},
                "reviews_scraped": {"type": "integer"},
                "description": {"type": "text"},
                "profile": semantic,
                "url": {"type": "keyword", "index": False},
            },
        },
        REVIEWS: {
            "_meta": {"description": "Dated Google Maps reviews of businesses near StreetShift corridors. "
                                     "text = BM25 field, content = semantic_text (Jina). Newest ~60 per business."},
            "properties": {
                "review_id": {"type": "keyword"},
                "business_id": {"type": "keyword"},
                "business_name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
                "category": {"type": "keyword"},
                "area": {"type": "keyword"},
                "city": {"type": "keyword"},
                "corridor_id": {"type": "keyword"},
                "text": {"type": "text"},
                "content": semantic,
                "published_at": {"type": "date"},
                "rating": {"type": "float"},
            },
        },
    }
    for name, mappings in specs.items():
        if client.indices.exists(index=name):
            if not recreate:
                print(f"Index '{name}' exists, adding to it (use --recreate to start fresh)")
                continue
            client.indices.delete(index=name)
        meta = mappings.pop("_meta")
        client.indices.create(index=name, mappings={"_meta": meta, **mappings})
        print(f"Created index '{name}' (semantic: {semantic})")


def shared_business_ids() -> set[str]:
    """Businesses that fall inside two areas' search circles (e.g. 3 between park_slope and prospect_heights).
    Their docs get area-scoped _ids ("<area>:<id>") so one area's copy doesn't overwrite the other's."""
    seen, shared = set(), set()
    for area in AREAS:
        bp = ASSETS / area / "businesses.json"
        if bp.exists():
            ids = {b["id"] for b in json.loads(bp.read_text(encoding="utf-8"))}
            shared |= seen & ids
            seen |= ids
    return shared


SHARED = shared_business_ids()


def doc_id(area: str, business_id: str, own_id: str) -> str:
    return f"{area}:{own_id}" if business_id in SHARED else own_id


def business_docs(area: str):
    biz = json.loads((ASSETS / area / "businesses.json").read_text(encoding="utf-8"))
    meta = json.loads((PROCESSED / f"business_meta_{area}.json").read_text(encoding="utf-8"))
    for b in biz:
        m = meta.get(b["id"], {})
        text = " | ".join(x for x in [b["name"], b["category"], ", ".join(m.get("categories") or []),
                                      m.get("address") or "", m.get("description") or ""] if x)
        yield {
            "_index": BUSINESSES, "_id": doc_id(area, b["id"], b["id"]),
            "business_id": b["id"], "name": b["name"], "category": b["category"],
            "categories": m.get("categories") or [], "area": area, "city": m.get("city"),
            "corridor_id": m.get("corridorId"), "segment_id": b["segmentId"],
            "address": m.get("address"), "location": {"lat": b["lat"], "lon": b["lng"]},
            "rating": b["rating"], "review_count": b["reviewCount"],
            "permanently_closed": m.get("permanentlyClosed"),
            "car_dependence": m.get("carDependence"), "car_mentions": m.get("carMentions"),
            "reviews_scraped": m.get("reviewsScraped"), "description": m.get("description"),
            "profile": text, "url": m.get("url"),
        }


def review_docs(area: str):
    for r in json.loads((PROCESSED / f"reviews_{area}.json").read_text(encoding="utf-8")):
        yield {
            "_index": REVIEWS, "_id": doc_id(area, r["businessId"], r["reviewId"]),
            "review_id": r["reviewId"], "business_id": r["businessId"], "business_name": r["businessName"],
            "category": r["category"], "area": area, "city": r["city"], "corridor_id": r["corridorId"],
            "text": r["text"], "content": r["text"], "published_at": r["publishedAtDate"],
            "rating": r["rating"],
        }


def bulk(client, docs, batch, tries=10):
    """Bulk with retry: on the free Serverless trial Jina returns 429 (quota refills within seconds), so
    docs rejected with 429 are re-sent after a pause instead of being dropped."""
    docs = list(docs)
    by_id = {d["_id"]: d for d in docs}
    total_ok, pending = 0, docs
    for i in range(tries):
        ok, errors = helpers.bulk(client.options(request_timeout=300), pending, chunk_size=batch,
                                  raise_on_error=False)
        total_ok += ok
        retry = [by_id[e["index"]["_id"]] for e in errors if e.get("index", {}).get("status") == 429]
        hard = [e for e in errors if e.get("index", {}).get("status") != 429]
        if hard or not retry:
            return total_ok, hard + [{"index": {"_id": d["_id"], "status": 429}} for d in retry]
        print(f"    {len(retry)} docs rate-limited (429), retrying in {15 * (i + 1)}s")
        time.sleep(15 * (i + 1))
        pending = retry
    return total_ok, [{"index": {"_id": d["_id"], "status": 429}} for d in pending]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("areas", nargs="*")
    p.add_argument("--recreate", action="store_true")
    p.add_argument("--batch", type=int, default=50)
    p.add_argument("--businesses-only", action="store_true")
    p.add_argument("--missing-only", action="store_true", help="only send reviews not yet in the index")
    a = p.parse_args()
    client = es()
    create_indexes(client, a.recreate)
    areas = a.areas or [x for x in AREAS if (PROCESSED / f"reviews_{x}.json").exists()]
    if SHARED:  # drop un-scoped copies of shared businesses/reviews left by runs before area-scoped ids
        rev_ids = [r["reviewId"] for x in AREAS if (PROCESSED / f"reviews_{x}.json").exists()
                   for r in json.loads((PROCESSED / f"reviews_{x}.json").read_text(encoding="utf-8"))
                   if r["businessId"] in SHARED]
        for idx, ids in ((BUSINESSES, sorted(SHARED)), (REVIEWS, sorted(set(rev_ids)))):
            r = client.delete_by_query(index=idx, query={"ids": {"values": ids}}, conflicts="proceed", refresh=True)
            if r.get("deleted"):
                print(f"  removed {r['deleted']} un-scoped shared docs from '{idx}'")
    for area in areas:
        ok, err = bulk(client, business_docs(area), a.batch)
        print(f"  {area}: businesses indexed {ok}" + (f" ({len(err)} errors: {err[0]})" if err else ""))
        if a.businesses_only:
            continue
        docs = review_docs(area)
        if a.missing_only:  # don't re-embed reviews that are already indexed (saves Jina quota)
            have = {h["_id"] for h in helpers.scan(client, index=REVIEWS, query={"query": {"term": {"area": area}}},
                                                   _source=False)}
            docs = [d for d in docs if d["_id"] not in have]
            print(f"  {area}: {len(have)} reviews already indexed, sending {len(docs)}")
        ok, err = bulk(client, docs, a.batch)
        print(f"  {area}: reviews indexed {ok}" + (f" ({len(err)} errors: {err[0]})" if err else ""))
    client.indices.refresh(index=f"{BUSINESSES},{REVIEWS}")
    print(f"Done. {client.count(index=BUSINESSES)['count']} businesses, "
          f"{client.count(index=REVIEWS)['count']} reviews")
    return 0


if __name__ == "__main__":
    sys.exit(main())
