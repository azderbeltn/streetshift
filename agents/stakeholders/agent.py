"""StreetShift hearing stakeholders as Fetch.ai uAgents (Agent Chat Protocol 0.3.0).

Four fictional composite characters: Maya (café owner), Dev (commuter), Rosa (resident on an overflow
street), Sam (parent). Each answers in character through the /sim hearing endpoint (Claude + Moss /
Elastic lookups); the turn also appears live in the app's hearing panel (SpacetimeDB). The StreetShift
Analyst consults all four when an ASI:One user asks what people on the street would think.

Messages from the Analyst are JSON: {"ref", "area", "corridorId", "question"}; replies are JSON
{"ref", "speaker", "role", "text"}. Plain-text questions from anyone else get a plain-text answer.

Run one per character (from /agents):  uv run python stakeholders/agent.py cafe|commuter|resident|parent
"""
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from uagents import Agent, Context, Protocol  # noqa: E402
from uagents_core.contrib.protocols.chat import ChatAcknowledgement, ChatMessage, EndSessionContent, TextContent, chat_protocol_spec  # noqa: E402

from common import sim_get, sim_post  # noqa: E402

CAST = {
    "cafe": ("maya-cafe-owner", "AGENT_SEED_CAFE", 8021),
    "commuter": ("dev-commuter", "AGENT_SEED_COMMUTER", 8022),
    "resident": ("rosa-overflow-resident", "AGENT_SEED_RESIDENT", 8023),
    "parent": ("sam-parent", "AGENT_SEED_PARENT", 8024),
}
key = sys.argv[1] if len(sys.argv) > 1 else "cafe"
name, seed_var, port = CAST[key]

agent = Agent(name=f"streetshift-{name}", seed=os.environ[seed_var], port=port,
              endpoint=[f"http://localhost:{port}/submit"])
protocol = Protocol(spec=chat_protocol_spec)


def scenario_for(area: str, corridor_id: str) -> dict:
    for a in sim_get("/areas"):
        if a["area"] == area:
            c = next(c for c in a["corridors"] if c["id"] == corridor_id)
            return {"area": area, "corridorId": corridor_id, "closedSegmentIds": c["segmentIds"], "addedSeating": True, "programming": "light"}
    raise ValueError(f"unknown corridor {area}/{corridor_id}")


@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(acknowledged_msg_id=msg.msg_id))
    text = "".join(i.text for i in msg.content if isinstance(i, TextContent))
    try:
        req = json.loads(text)
    except json.JSONDecodeError:
        req = {"ref": None, "area": "hayes_valley", "corridorId": "hayes", "question": text}
    try:
        sc = scenario_for(req.get("area", "hayes_valley"), req.get("corridorId", "hayes"))
        turn = sim_post("/hearing/ask", {**sc, "scenarioId": f"{sc['area']}:{sc['corridorId']}", "character": key, "question": req["question"]})
        reply = {"ref": req.get("ref"), "speaker": turn["speaker"], "role": turn["role"], "text": turn["text"]}
    except Exception as err:  # keep the conversation alive
        ctx.logger.exception("stakeholder failed: %s", err)
        reply = {"ref": req.get("ref"), "speaker": name, "role": key, "text": "I can't answer right now; the simulator is unreachable."}
    body = json.dumps(reply) if req.get("ref") else f"{reply['speaker']} ({reply['role']}): {reply['text']}"
    content = [TextContent(type="text", text=body)] + ([] if req.get("ref") else [EndSessionContent(type="end-session")])
    await ctx.send(sender, ChatMessage(content=content))


@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
