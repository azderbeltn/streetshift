"""StreetShift Analyst: an ASI:One-compatible uAgent (Agent Chat Protocol 0.3.0, Agentverse mailbox).

Ask it "What happens if NYC pedestrianizes Ditmars Blvd?" or "Close Hayes Street in SF with seating
and events". Claude reads the question and picks the corridor and options; the agent runs the
scenario on the local StreetShift simulator (/sim) and answers with connection, economy and traffic
outcomes (each with a range), the backtest track record, and a link to the live map.

Run (from /agents):  uv run python analyst/agent.py
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from uagents import Agent, Context, Protocol  # noqa: E402
from uagents_core.contrib.protocols.chat import (  # noqa: E402
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

from common import APP_URL, claude, sim_get, sim_post  # noqa: E402

HERE = Path(__file__).resolve().parent

agent = Agent(
    name="streetshift-analyst",
    seed=os.environ["AGENT_SEED_ANALYST"],
    port=int(os.environ.get("ANALYST_PORT", "8011")),
    mailbox=True,
    publish_agent_details=True,
    readme_path=str(HERE / "README.md"),
)
protocol = Protocol(spec=chat_protocol_spec)

INTENT_SCHEMA = {
    "type": "object",
    "properties": {
        "on_topic": {"type": "boolean", "description": "Is this about closing/pedestrianizing a street, or about StreetShift?"},
        "corridor_id": {"type": "string", "description": "One id from the list, or empty if none matches"},
        "added_seating": {"type": "boolean"},
        "programming": {"type": "string", "enum": ["none", "light", "heavy"]},
        "wants_backtest": {"type": "boolean", "description": "Asks how accurate the model is / how it did on real streets"},
        "unmatched_street": {"type": "string", "description": "Street the user named that is not in the list, else empty"},
    },
    "required": ["on_topic", "corridor_id", "added_seating", "programming", "wants_backtest", "unmatched_street"],
    "additionalProperties": False,
}


def corridors():
    out = []
    for a in sim_get("/areas"):
        for c in a["corridors"]:
            if c["role"] in ("treated", "forward"):
                out.append({"id": c["id"], "name": c["name"], "area": a["area"], "city": a["city"], "role": c["role"],
                            "segmentIds": c["segmentIds"], "businesses": a["businesses"]})
    return out


def backtest_line():
    try:
        s = sim_get("/backtest/results")["summary"]
        return (f"Track record: on {s['corridorsScored']} real 2020 NYC Open Streets the model called the direction "
                f"{round((s['directionAccuracy'] or 0) * 100)}% of the time; mean error on blind holdout streets "
                f"{s['maeHoldout']:.0f} percentage points.")
    except Exception:
        return ""


def answer(question: str) -> str:
    cs = corridors()
    listing = "\n".join(f"- {c['id']}: {c['name']} ({c['city']}, {'backtest' if c['role'] == 'treated' else 'live demo'})" for c in cs)
    intent = json.loads(claude(
        "You route questions for StreetShift, a simulator that predicts what happens when a street is closed to cars "
        "(pedestrianized). Map the user's question to one modelled corridor. Default added_seating=true and "
        "programming='light' unless the user says otherwise. Modelled corridors:\n" + listing,
        question, schema=INTENT_SCHEMA, max_tokens=400, fast=True))
    if not intent["on_topic"]:
        return ("I'm the StreetShift Analyst. I predict what happens when a street goes car-free: conversations and "
                "lingering, revenue for nearby businesses, and added traffic. Try: \"What happens if NYC pedestrianizes "
                "Ditmars Blvd?\" or \"Close Hayes Street in San Francisco with seating and events.\"")
    c = next((x for x in cs if x["id"] == intent["corridor_id"]), None)
    if not c:
        names = ", ".join(x["name"] for x in cs)
        return (f"I don't have {intent['unmatched_street'] or 'that street'} modelled yet. Streets I can run right now: {names}. "
                f"{backtest_line()}")
    run = sim_post("/scenario/run", {"area": c["area"], "corridorId": c["id"], "closedSegmentIds": c["segmentIds"],
                                     "addedSeating": intent["added_seating"], "programming": intent["programming"]})
    m, con, base = run["metrics"], run["connection"], run["baseline"]["interaction"]
    facts = {
        "street": c["name"], "city": c["city"], "options": {"seating": intent["added_seating"], "programming": intent["programming"]},
        "connection": {"verdict": m["interaction"]["verdict"], "conversationsPerHour": con["conversationsPerHour"],
                       "range": con["range"]["conversationsPerHour"], "before": base["encountersPerHour"],
                       "lingerMinutes": con["lingerMinutes"], "lingerBefore": base["dwellMinutes"],
                       "newConnectionsPerDay": con["newConnectionsPerDay"], "note": "model output, not validated"},
        "economy": {"revenueChangePctAffectedBusinesses": m["economy"]["totalRevenueChangePct"], "range": m["economy"]["range"],
                    "restaurantBarChangePctOnStreet": run.get("corridor", {}).get("restaurantBarChangePct", {}).get("mid")},
        "traffic": {"addedVehicleHoursPerDay": m["traffic"]["addedVehicleHours"], "range": m["traffic"]["range"],
                    "carsReroutedPerPeakHour": run["traffic"]["reroutedVehPerHour"]},
        "flags": run["flags"], "trackRecord": backtest_line(),
        "link": f"{APP_URL}/?area={c['area']}&corridor={c['id']}",
    }
    return claude(
        "You are the StreetShift Analyst. Explain a simulation result to a city planner or resident in under 170 words. "
        "Lead with the human-connection outcome, then business revenue, then traffic. Always give ranges. Say plainly "
        "that interaction is model output, not validated. Use only the numbers provided; never invent facts. End with "
        "the track record sentence and the link on its own line. Plain text, short paragraphs, no markdown headings.",
        json.dumps(facts), max_tokens=900)


@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(acknowledged_msg_id=msg.msg_id))
    text = "".join(item.text for item in msg.content if isinstance(item, TextContent))
    ctx.logger.info(f"question from {sender[:16]}…: {text[:200]}")
    try:
        reply = answer(text)
    except Exception as err:  # keep the chat alive with an honest error
        ctx.logger.exception("analyst failed: %s", err)
        reply = "Sorry, the StreetShift simulator is not reachable right now. Please try again in a minute."
    await ctx.send(sender, ChatMessage(content=[TextContent(type="text", text=reply), EndSessionContent(type="end-session")]))


@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    if "--ask" in sys.argv:  # local test without the network: uv run python analyst/agent.py --ask "..."
        print(answer(sys.argv[sys.argv.index("--ask") + 1]))
    else:
        agent.run()
