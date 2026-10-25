"""Build the persistent Moss cloud index of StreetShift facts (one index, filter by `area`).

Documents: one fact card per business (category, street, rating, car-dependence, busiest hour),
up to 3 short review snippets per business (newest first), and one context card per corridor
(Census population/households, nearby count coverage). Built once; serving processes (the hearing
in /sim, the voice agent) only load it. The Moss free tier allows 3 indexes, hence one shared index.

Run:  uv run python moss_ingest.py [--recreate]
"""
import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from moss import DocumentInfo, MossClient

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
INDEX = os.environ.get("MOSS_INDEX", "streetshift-facts")
AREAS = ["hayes_valley", "astoria", "park_slope", "chinatown", "koreatown", "prospect_heights"]
DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def clip(s: str, n: int) -> str:
    s = " ".join((s or "").split())
    return s if len(s) <= n else s[: n - 1].rsplit(" ", 1)[0] + "…"


def docs_for(area: str) -> list[DocumentInfo]:
    a = ROOT / "sim" / "assets" / area
    net = json.loads((a / "network.json").read_text(encoding="utf-8"))
    biz = json.loads((a / "businesses.json").read_text(encoding="utf-8"))
    ctx = json.loads((a / "context.json").read_text(encoding="utf-8"))
    seg_name = {s["id"]: s["name"] for s in net["segments"]}
    reviews = {}
    rf = ROOT / "data" / "processed" / f"reviews_{area}.json"
    if rf.exists():
        for r in json.loads(rf.read_text(encoding="utf-8")):
            reviews.setdefault(r.get("businessId") or r.get("business_id"), []).append(r)
    out = []
    for b in biz:
        busiest = ""
        if b.get("popularTimes"):
            d, h = max(((d, h) for d in range(7) for h in range(24)), key=lambda x: b["popularTimes"][x[0]][x[1]])
            busiest = f" Busiest around {h}:00 on {DAYS[d]}s (Google popular times)."
        text = (f"{b['name']} is a {b['category'].lower()} on {seg_name.get(b['segmentId'], 'the corridor')} in {area.replace('_', ' ')}. "
                f"Rated {b['rating']} from {b['reviewCount']} Google reviews. "
                f"Car-dependence score {b['carDependence']:.2f} (share of reviews about parking or driving, 0-1).{busiest}")
        meta = {"area": area, "kind": "business", "businessId": b["id"], "name": b["name"], "category": b["category"]}
        out.append(DocumentInfo(id=f"{area}:biz:{b['id']}", text=text, metadata=meta))
        revs = sorted(reviews.get(b["id"], []), key=lambda r: r.get("publishedAtDate") or r.get("published_at") or "", reverse=True)
        k = 0
        for r in revs:
            t = r.get("text") or ""
            if len(t) < 40:
                continue
            date = (r.get("publishedAtDate") or r.get("published_at") or "")[:10]
            out.append(DocumentInfo(id=f"{area}:rev:{b['id']}:{k}", text=f"Review of {b['name']} ({date}): \"{clip(t, 280)}\"",
                                    metadata={**meta, "kind": "review", "date": date}))
            k += 1
            if k == 3:
                break
    c = ctx["census"]
    for cid, cor in net["corridors"].items():
        counts = ctx["counts"].get(cid, {}) if isinstance(ctx.get("counts"), dict) else {}
        ped = counts.get("pedestrianCounts", []) if isinstance(counts, dict) else []
        out.append(DocumentInfo(id=f"{area}:corridor:{cid}", text=(
            f"{cor['name']} ({cor['role']} corridor in {area.replace('_', ' ')}) is {round(cor['lengthM'])} m long across {len(cor['segmentIds'])} blocks. "
            f"About {c['populationInCircle']:,} people in {c['householdsInCircle']:,} households live within 1.5 km (US Census ACS 2024 5-year). "
            + (f"NYC DOT pedestrian count nearby: {ped[0]['street']} ~{ped[0]['hourlyPreCovid'].get('pm')} people/hour weekday evenings (2015-2019)." if ped and ped[0].get("hourlyPreCovid", {}).get("pm") else "No pedestrian count station within 500 m; volumes are modelled.")),
            metadata={"area": area, "kind": "corridor", "corridorId": cid}))
    return out


async def main():
    client = MossClient(os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"])
    docs = [d for area in AREAS for d in docs_for(area)]
    print(f"{len(docs)} documents for index {INDEX!r}")
    existing = {i.name for i in await client.list_indexes()}
    if INDEX in existing:
        if "--recreate" not in sys.argv:
            print("index exists; pass --recreate to rebuild. Upserting docs instead.")
            await client.add_docs(INDEX, docs)
        else:
            await client.delete_index(INDEX)
            await client.create_index(INDEX, docs, "moss-minilm")
    else:
        await client.create_index(INDEX, docs, "moss-minilm")
    await client.load_index(INDEX)
    from moss import QueryOptions
    for q in ["outdoor seating cafe Hayes Street", "hard to find parking"]:
        res = await client.query(INDEX, q, QueryOptions(top_k=3, alpha=0.6, filters={"area": "hayes_valley"}))
        print(f"\nquery {q!r} ({getattr(res, 'time_taken_ms', '?')} ms):")
        for d in res.docs:
            print(f"  {d.score:.3f}  {d.text[:120]}")


if __name__ == "__main__":
    asyncio.run(main())
