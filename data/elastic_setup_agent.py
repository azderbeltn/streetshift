"""Create the StreetShift Agent Builder tools, the corridor-brief Workflow and the agents.

    uv run python elastic_setup_agent.py

Follows the starter's setup_agent.py (docs/elastic-starter/paper-scout/setup_agent.py): output index +
timestamp pipeline, upsert the workflow and take its id, inject it into the workflow tool, upsert tools
(GET then PUT-without-id/type/name, else POST), upsert agents, smoke test. Safe to re-run.

Recursion guard (docs/elastic.md, Part D caution): the workflow's ai.agent step uses
`streetshift-brief-writer`, an agent that has NO workflow tool. Only `streetshift-analyst` can call the
workflow, and the workflow never calls the analyst.
"""

import sys
from pathlib import Path

from elastic_common import AGENT_ID, BRIEFS, BUSINESSES, KIBANA_URL, REVIEWS, es, kibana

WORKFLOW_NAME = "corridor-brief"
WORKFLOW_YAML = (Path(__file__).parent / "workflows" / "corridor-brief.yaml").read_text(encoding="utf-8")
CORRIDORS = ("ditmars, ditmars_control (Astoria, Queens); park_slope_5th, park_slope_5th_control (Park Slope); "
             "pell_doyers, pell_doyers_control (Chinatown); e32nd, e32nd_control (Koreatown); "
             "vanderbilt, vanderbilt_control (Prospect Heights); hayes (Hayes Valley, San Francisco)")
AREAS = "astoria, park_slope, chinatown, koreatown, prospect_heights, hayes_valley"

TOOLS = [
    {
        "id": "streetshift_search",
        "type": "index_search",
        "description": (
            "Search real businesses (Google Maps via Apify) and their dated customer reviews around StreetShift "
            "corridors: NYC 2020 Open Streets, their control corridors, and Hayes St in San Francisco. Fields: "
            "business name, category, corridor_id, area, rating, car_dependence (0-1), review text and date. "
            "Use for any question about what businesses are on a street or what customers say about them."
        ),
        "configuration": {"pattern": f"{BUSINESSES},{REVIEWS}"},
    },
    {
        "id": "streetshift_briefs",
        "type": "index_search",
        "description": "Search saved stakeholder briefings per corridor (written by the corridor-brief workflow).",
        "configuration": {"pattern": BRIEFS},
    },
    {
        "id": "review_volume_by_month",
        "type": "esql",
        "description": (
            "Monthly count and average rating of scraped Google Maps reviews for one business_id, one corridor id, "
            f"or one area. A business-activity signal to compare before/after a street closure. Corridor ids: {CORRIDORS}. "
            f"Areas: {AREAS}. Caveat: only the newest ~60 reviews per business were scraped, so older months are "
            "under-represented; compare treated vs control corridors over the same months, not absolute levels."
        ),
        "configuration": {
            "query": (
                f"FROM {REVIEWS} | WHERE business_id == ?target OR corridor_id == ?target OR area == ?target "
                "| EVAL month = DATE_TRUNC(1 month, published_at) "
                "| STATS reviews = COUNT(*), avg_rating = AVG(rating) BY month "
                "| SORT month ASC | LIMIT 240"
            ),
            "params": {"target": {"type": "string",
                                  "description": "A business_id, a corridor id (e.g. 'ditmars') or an area (e.g. 'astoria')"}},
        },
    },
    {
        "id": "car_dependence_by_corridor",
        "type": "esql",
        "description": (
            "Average and max car_dependence (0-1, share of a business's reviews about parking/driving, smoothed) "
            f"by business category for one corridor id or area. Corridor ids: {CORRIDORS}. Areas: {AREAS}. "
            "Use for 'which businesses depend on drivers', 'who loses if the street closes to cars'."
        ),
        "configuration": {
            "query": (
                f"FROM {BUSINESSES} | WHERE corridor_id == ?corridor OR area == ?corridor "
                "| STATS businesses = COUNT(*), avg_car_dependence = AVG(car_dependence), "
                "max_car_dependence = MAX(car_dependence), car_mentions = SUM(car_mentions) BY category "
                "| SORT businesses DESC | LIMIT 40"
            ),
            "params": {"corridor": {"type": "string",
                                    "description": "A corridor id (e.g. 'ditmars') or an area (e.g. 'astoria')"}},
        },
    },
    {
        "id": "corridor_write_brief",
        "type": "workflow",
        "description": (
            "Generate and SAVE a stakeholder briefing for one corridor (runs the corridor-brief workflow: semantic "
            "review search -> brief-writer agent -> briefs index). Use only when the user asks for a briefing or "
            f"report to be created or saved. Input: corridor id, one of {CORRIDORS}."
        ),
        "configuration": {"workflow_id": None},  # filled in after the workflow is uploaded
    },
]

READ_TOOLS = ["streetshift_search", "review_volume_by_month", "car_dependence_by_corridor"]

BRIEF_WRITER = {
    "id": "streetshift-brief-writer",
    "name": "StreetShift Brief Writer",
    "description": "Writes grounded corridor briefings for the corridor-brief workflow. Has no workflow tools.",
    "labels": ["calhacks", "streetshift"],
    "avatar_color": "#F5A524",
    "avatar_symbol": "BW",
    "configuration": {
        "instructions": (
            "You write short stakeholder briefings about city streets for a simulated public hearing.\n"
            "- Use only the reviews and tool results you are given. Never invent businesses, numbers or quotes.\n"
            "- Name the business and review date for every claim.\n"
            "- Reviews are a biased sample of customers, not of residents or owners; say so when relevant.\n"
            "- Keep it under 250 words, bullets over paragraphs."
        ),
        "tools": [{"tool_ids": READ_TOOLS}],
    },
}

ANALYST = {
    "id": AGENT_ID,
    "name": "StreetShift Analyst",
    "description": ("Urban planning analyst over real businesses and reviews on NYC Open Streets corridors "
                    "(and their controls) and Hayes St, San Francisco."),
    "labels": ["calhacks", "streetshift", "urban planning"],
    "avatar_color": "#3DDC97",
    "avatar_symbol": "SS",
    "configuration": {
        "instructions": (
            "You are the StreetShift Analyst. You help city planners, residents and business owners reason about "
            "pedestrianizing a street, using real business and review data.\n"
            f"- Corridor ids: {CORRIDORS}. Each treated NYC corridor has a control corridor.\n"
            "- Always ground answers in tool results. Never invent businesses, numbers, or quotes.\n"
            "- Cite every business or review you use as: Business name (category, review date).\n"
            "- For activity over time use review_volume_by_month; for driver reliance use car_dependence_by_corridor; "
            "for what customers say use streetshift_search; for saved briefings use streetshift_briefs.\n"
            "- Call corridor_write_brief only when the user explicitly asks to create or save a briefing.\n"
            "- Reviews are a proxy, not sales data: say when evidence is thin, and never present a review as the "
            "view of the business owner.\n"
            "- Keep answers tight: bullets over paragraphs."
        ),
        "tools": [{"tool_ids": [t["id"] for t in TOOLS]}],
    },
}


def create_briefs_index():
    client = es()
    client.ingest.put_pipeline(
        id="briefs-timestamp",
        processors=[{"set": {"field": "@timestamp", "value": "{{_ingest.timestamp}}"}}],
    )
    if not client.indices.exists(index=BRIEFS):
        client.indices.create(
            index=BRIEFS,
            settings={"index.default_pipeline": "briefs-timestamp"},
            mappings={"_meta": {"description": "Stakeholder briefings per StreetShift corridor, written by the "
                                               "corridor-brief workflow."},
                      "properties": {
                          "@timestamp": {"type": "date"},
                          "corridor_id": {"type": "keyword"},
                          "brief": {"type": "text"},
                          "source": {"type": "keyword"},
                      }},
        )
    print(f"  index {BRIEFS}: ready")


def upsert_workflow() -> str | None:
    existing = kibana("GET", "/api/workflows", params={"query": WORKFLOW_NAME, "size": 100})
    if existing.ok:
        for wf in existing.json().get("results", []):
            if wf.get("name") == WORKFLOW_NAME:
                r = kibana("PUT", f"/api/workflows/workflow/{wf['id']}", json={"yaml": WORKFLOW_YAML})
                print(f"  workflow {WORKFLOW_NAME}: updated ({r.status_code})" + ("" if r.ok else f" {r.text[:300]}"))
                return wf["id"]
    r = None
    for path in ("/api/workflows/workflow", "/api/workflows"):
        r = kibana("POST", path, json={"yaml": WORKFLOW_YAML})
        if r.ok:
            body = r.json()
            print(f"  workflow {WORKFLOW_NAME}: created (valid={body.get('valid')})")
            return body.get("id")
    print(f"  workflow {WORKFLOW_NAME}: FAILED {r.status_code} {r.text[:300]}")
    return None


def upsert(kind: str, body: dict):
    r = kibana("GET", f"/api/agent_builder/{kind}/{body['id']}")
    if r.ok:
        update = {k: v for k, v in body.items() if k not in ("id", "type", "name")}
        r = kibana("PUT", f"/api/agent_builder/{kind}/{body['id']}", json=update)
        verb = "updated"
    else:
        r = kibana("POST", f"/api/agent_builder/{kind}", json=body)
        verb = "created"
    print(f"  {kind[:-1]} {body['id']}: {verb if r.ok else 'FAILED'}" + ("" if r.ok else f" {r.status_code} {r.text[:300]}"))
    return r.ok


def main():
    print("Preparing briefs index...")
    create_briefs_index()

    # Tools + brief-writer agent first: the workflow's ai.agent step references the brief writer.
    print("Creating read tools...")
    for tool in TOOLS:
        if tool["type"] != "workflow":
            upsert("tools", tool)
    print("Creating brief-writer agent...")
    upsert("agents", BRIEF_WRITER)

    print("Uploading workflow...")
    workflow_id = upsert_workflow()
    wf_tool = next(t for t in TOOLS if t["type"] == "workflow")
    if workflow_id:
        wf_tool["configuration"]["workflow_id"] = workflow_id
        upsert("tools", wf_tool)
    else:
        ANALYST["configuration"]["tools"][0]["tool_ids"].remove(wf_tool["id"])
        print(f"  tool {wf_tool['id']}: skipped (no workflow)")

    print("Creating analyst agent...")
    upsert("agents", ANALYST)

    print("\nSmoke test (ES|QL tool):")
    r = kibana("POST", "/api/agent_builder/tools/_execute",
               json={"tool_id": "car_dependence_by_corridor", "tool_params": {"corridor": "ditmars"}})
    print(f"  {r.status_code} {r.text[:400]}")
    print(f"\nworkflow_id={workflow_id}")
    print(f"MCP endpoint: {KIBANA_URL}/api/agent_builder/mcp")
    return 0


if __name__ == "__main__":
    sys.exit(main())
