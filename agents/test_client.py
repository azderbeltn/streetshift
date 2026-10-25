"""Local test client: sends one chat question to the StreetShift Analyst and prints the reply.
Run (from /agents):  uv run python test_client.py "What would people on Hayes Street think if it went car-free?"
"""
import os
import sys

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import ChatAcknowledgement, ChatMessage, TextContent, chat_protocol_spec
from uagents_core.identity import Identity
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
ANALYST = Identity.from_seed(os.environ["AGENT_SEED_ANALYST"], 0).address
QUESTION = sys.argv[1] if len(sys.argv) > 1 else "What would people on Hayes Street think if it went car-free?"

client = Agent(name="streetshift-test-client", seed="streetshift test client seed (not secret)", port=8030, endpoint=["http://localhost:8030/submit"])
proto = Protocol(spec=chat_protocol_spec)


@client.on_event("startup")
async def ask(ctx: Context):
    ctx.logger.info(f"asking {ANALYST[:20]}…: {QUESTION}")
    await ctx.send(ANALYST, ChatMessage(content=[TextContent(type="text", text=QUESTION)]))


@proto.on_message(ChatMessage)
async def reply(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(sender, ChatAcknowledgement(acknowledged_msg_id=msg.msg_id))
    print("\n===== ANALYST REPLY =====\n" + "".join(i.text for i in msg.content if isinstance(i, TextContent)) + "\n=========================", flush=True)
    os._exit(0)


@proto.on_message(ChatAcknowledgement)
async def ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass


client.include(proto)
client.run()
