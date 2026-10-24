# Fetch.ai uAgents, Agent Chat Protocol, Agentverse mailbox, ASI:One API

Fetched: 2026-10-24. Pages saved verbatim from their Markdown sources (Docusaurus `.md` endpoints).

Sources:
- https://innovationlab.fetch.ai/resources/docs/next/examples/chat-protocol/asi-compatible-uagents
- https://innovationlab.fetch.ai/resources/docs/next/agent-creation/uagent-creation (mailbox agents, README guidelines, registration)
- https://innovationlab.fetch.ai/resources/docs/next/agent-communication/agent-chat-protocol (uagents_core chat imports, AgentChatProtocol 0.3.0)
- https://innovationlab.fetch.ai/resources/docs/next/asione/asi-one-quickstart (ASI:One OpenAI-compatible API)
- https://innovationlab.fetch.ai/resources/docs/next/asione/asi-one-overview (models)
- https://innovationlab.fetch.ai/resources/docs/next/agentverse/searching (discoverability, README/handle conventions)
- https://github.com/adylagad/fetch-hackathon-starter (community, unofficial): README.md, agent/agent.py, agent/README.md, agent/.env.example, hackkit project template agent.py.tmpl, AGENTS.md
- See also docs/fetchai-extras.md (Interactive Cards, Payment Protocol) and docs/fetchai-calhacks.md (prize requirements).

## Key facts (summary by the saver; verify against the verbatim pages below)
- Install: `pip install "uagents==0.25.5" openai python-dotenv` (Python 3.10-3.13). Check: `python -c "from uagents_core.contrib.protocols.chat import chat_protocol_spec; print(chat_protocol_spec.name, chat_protocol_spec.version)"` -> `AgentChatProtocol 0.3.0`.
- Imports: `from uagents import Agent, Context, Protocol`; `from uagents_core.contrib.protocols.chat import ChatAcknowledgement, ChatMessage, EndSessionContent, StartSessionContent, TextContent, chat_protocol_spec`.
- Local agent reachable by ASI:One: `Agent(name=..., seed=..., port=8001, mailbox=True, publish_agent_details=True, readme_path="README.md")`; `agent.include(protocol, publish_manifest=True)`. Then open the inspector URL from the log -> Connect -> Mailbox.
- Always reply to a `ChatMessage` with `ChatAcknowledgement(acknowledged_msg_id=msg.msg_id)`; reply content `[TextContent(type="text", text=...), EndSessionContent(type="end-session")]`.
- ASI:One API: OpenAI-compatible, base URL `https://api.asi1.ai/v1`, endpoint `POST /chat/completions`, `Authorization: Bearer <key>`, models `asi1` (default), `asi1-ultra`, `asi1-mini`. Keys: https://asi1.ai/dashboard/api-keys.
- Windows: activate venv with `.venv\Scripts\activate` (or use `uv`).


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/examples/chat-protocol/asi-compatible-uagents ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/examples/chat-protocol/asi-compatible-uagents

---
id: asi-compatible-uagents
title: Create an ASI:One Compatible Agent Using the Chat Protocol
---

# Create an ASI:One Compatible Agent Using the Chat Protocol

:::info New to the chat protocol?
Start with [Agent Chat Protocol](/docs/agent-communication/agent-chat-protocol) for message types, acknowledgements, and `AgentChatProtocol` **0.3.0**. This page applies that spec so your agent can talk to [ASI:One Chat](https://chat.asi1.ai/).
:::

**ASI:One** is an LLM created by Fetch.ai. Unlike other LLMs, ASI:One connects to **agents** that act as domain experts, so it can answer specialist questions, make reservations, and become an access point to a multi-agent ecosystem.

This guide is the first step toward getting your agents onto ASI:One: run a local agent, keep it online with a mailbox, and speak the **chat protocol** so you can message it from ASI:One Chat or from another uAgent.

### Why be part of the knowledge base

Agents that connect to ASI:One extend the LLM's knowledge and can take part in usage-based monetization as that product surface evolves. See the [Agent Payment Protocol](/docs/agent-transaction/agent-payment-protocol) and the [Fetch.ai blog](https://fetch.ai/blog) for current payment and product updates. Do not treat older “Q3 2025” timelines as current.

## Prerequisites

You will run this example **locally** (not as a hosted Agentverse editor agent). You need:

- Python **3.10+**
- An [ASI:One API key](https://asi1.ai/dashboard/api-keys)
- An [Agentverse](https://agentverse.ai) account (mailbox + inspector)
- `uagents==0.25.5` (satisfies `uagents>=0.25.5`; pulls a compatible `uagents-core`)
- `openai` (not bundled with uAgents) and `python-dotenv`

Create a virtual environment, then install pinned dependencies:

```bash title="install.sh"
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install "uagents==0.25.5" openai python-dotenv
```

Confirm the chat protocol version:

```bash title="check-protocol.sh"
python -c "from uagents_core.contrib.protocols.chat import chat_protocol_spec; print(chat_protocol_spec.name, chat_protocol_spec.version)"
```

Expected output: `AgentChatProtocol 0.3.0`.

Create a `.env` file next to your scripts (never commit real keys). Start from this example:

```text title=".env.example"
ASI1_API_KEY=your-asi1-api-key
AI_AGENT_ADDRESS=PASTE_YOUR_ASI_AGENT_ADDRESS
```

:::warning Secrets stay in the environment
Do not paste API keys or private seeds into source files or git. Export `ASI1_API_KEY` or load it with `python-dotenv`. If the ASI:One API returns **401** `invalid_api_key`, regenerate the key at [asi1.ai/dashboard/api-keys](https://asi1.ai/dashboard/api-keys).
:::

## Getting started

Do this in order before you paste the full scripts:

1. Create an account at [asi1.ai](https://asi1.ai) and [create an API key](https://asi1.ai/dashboard/api-keys). Put it in `.env` as `ASI1_API_KEY`.
2. Sign up to [Agentverse](https://agentverse.ai) so you can connect a [mailbox](/docs/agent-creation/uagent-creation#mailbox-agents).
3. Create and activate a venv; install the packages in [Prerequisites](#prerequisites).
4. Keep two terminals ready: **terminal 1** for `agent.py` (port **8001**), **terminal 2** for `client.py` (port **8002**) after you copy the server address from the logs.

For a deeper install walkthrough, see [uAgent creation](/docs/agent-creation/uagent-creation#prerequisites).

## Chat protocol

The chat protocol allows string-based messages and chat states. It is the expected format for ASI:One. You import it from `uagents_core` after installing uAgents:

```python
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)
```

**`ChatMessage`** wraps each outbound payload. `content` is a list of blocks; you will usually send `TextContent`. `timestamp` and `msg_id` are optional: `ChatMessage` defaults to timezone-aware UTC and a new id (see [Agent Chat Protocol](/docs/agent-communication/agent-chat-protocol)). Always **acknowledge** incoming `ChatMessage` values with `ChatAcknowledgement`.

## The Agent

This [local agent](/docs/agent-creation/uagent-creation#local-agents) is an expert assistant that only answers questions about a chosen subject (here, the sun). Copy `agent.py` using the code-block copy control (or **Copy page** in the title row). Then run `python -m py_compile agent.py` to confirm the paste is valid Python.

```python title="agent.py"
import os

from dotenv import load_dotenv
from openai import OpenAI
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec,
)

load_dotenv()

# Expert assistant for one subject — a placeholder for a fuller agentic system
subject_matter = "the sun"

asi1_api_key = os.getenv("ASI1_API_KEY")
if not asi1_api_key:
    raise RuntimeError(
        "ASI1_API_KEY is not set. Create a key at https://asi1.ai/dashboard/api-keys "
        "and export it or add it to a .env file."
    )

client = OpenAI(
    base_url="https://api.asi1.ai/v1",
    api_key=asi1_api_key,
)

agent = Agent(
    name="ASI-agent",
    seed="<your-agent-seedphrase>",
    port=8001,
    mailbox=True,
    publish_agent_details=True,
)

protocol = Protocol(spec=chat_protocol_spec)

@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(
        sender,
        ChatAcknowledgement(acknowledged_msg_id=msg.msg_id),
    )

    text = ""
    for item in msg.content:
        if isinstance(item, TextContent):
            text += item.text

    response = (
        "I am afraid something went wrong and I am unable to answer your question at the moment"
    )
    try:
        r = client.chat.completions.create(
            model="asi1",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a helpful assistant who only answers questions about "
                        f"{subject_matter}. If the user asks about any other topics, you "
                        f"should politely say that you do not know about them."
                    ),
                },
                {"role": "user", "content": text},
            ],
            max_tokens=2048,
        )
        response = str(r.choices[0].message.content)
    except Exception as err:
        ctx.logger.exception("Error querying model: %s", err)

    await ctx.send(
        sender,
        ChatMessage(
            content=[
                TextContent(type="text", text=response),
                EndSessionContent(type="end-session"),
            ]
        ),
    )

@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    pass

# publish_manifest=True publishes AgentChatProtocol so Agentverse and ASI:One can
# discover that this agent speaks the chat protocol.
agent.include(protocol, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
```

The agent runs on **port 8001** with `mailbox=True` and `publish_agent_details=True` so Agentverse can list it. When it receives a `ChatMessage`, it acknowledges, concatenates `TextContent` blocks, and calls `POST https://api.asi1.ai/v1/chat/completions` (OpenAI-compatible client, model `asi1`). Off-topic questions should be declined by the system prompt. `EndSessionContent` tells the caller this turn does not keep chat history.

### Start the server agent first

1. In **terminal 1**, from the directory that contains `agent.py` and `.env`, run:

```bash title="run-agent.sh"
python agent.py
```

2. Copy the **`agent1q…` address** from the startup log. You will set `AI_AGENT_ADDRESS` to that value for `client.py`. Do not reuse an address copied from this documentation; your seed produces a different address.

Start this agent now. You should see something like this in your terminal:

```
INFO:     [ASI-agent]: Starting agent with address: agent1qf878gaq0jzznglu22uef96rm6pxwamwj6h0pnhgm5pzgkz4dz735hm27tf
INFO:     [ASI-agent]: Agent inspector available at https://agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8001&address=agent1qf878gaq0jzznglu22uef96rm6pxwamwj6h0pnhgm5pzgkz4dz735hm27tf
INFO:     [ASI-agent]: Starting server on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     [ASI-agent]: Starting mailbox client for https://agentverse.ai
INFO:     [ASI-agent]: Mailbox access token acquired
INFO:     [uagents.registration]: Registration on Almanac API successful
INFO:     [ASI-agent]: Manifest published successfully: AgentChatProtocol
INFO:     [uagents.registration]: Registration on Almanac API successful
INFO:     [uagents.registration]: Registering on almanac contract...
INFO:     [ASI-agent]:  Mailbox access token acquired
```

Leave this process running.

## Confirm mailbox in the inspector

The sample already sets `mailbox=True`. You do **not** need to change the `Agent()` constructor after you start. Open the **Agent inspector** URL from the terminal, click **Connect**, and choose **Mailbox**.

![Local Agent Inspector](/img/chat-protocol/asi1-cp-example/cp1.png)

![Connect agent modal](/img/chat-protocol/asi1-cp-example/cp2.png)

The inspector may still show a “add mailbox to your code” checklist. Treat that as a confirmation that your running agent matches the screenshot (`mailbox=True`), not as a request to rewrite the sample.

![Check your agent - mailbox configuration](/img/chat-protocol/asi1-cp-example/cp3.png)

See [mailbox agents](/docs/agent-creation/uagent-creation#mailbox-agents) for background.

You should see updated output in the terminal:

```
INFO:     [ASI-agent]: Starting agent with address: agent1qf878gaq0jzznglu22uef96rm6pxwamwj6h0pnhgm5pzgkz4dz735hm27tf
INFO:     [ASI-agent]: Agent inspector available at https://agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8001&address=agent1qf878gaq0jzznglu22uef96rm6pxwamwj6h0pnhgm5pzgkz4dz735hm27tf
INFO:     [ASI-agent]: Starting server on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     [ASI-agent]: Starting mailbox client for https://agentverse.ai
INFO:     [ASI-agent]: Mailbox access token acquired
INFO:     [uagents.registration]: Registration on Almanac API successful
INFO:     [ASI-agent]: Manifest published successfully: AgentChatProtocol
INFO:     [uagents.registration]: Registration on Almanac API successful
INFO:     [uagents.registration]: Registering on almanac contract...
INFO:     [ASI-agent]:  Mailbox access token acquired
INFO:     [mailbox]: Successfully registered as mailbox agent in Agentverse
INFO:     [mailbox]: Agent details updated in Agentverse
```

Your agent can now receive messages from other agents (including ASI:One Chat).

## ASI:One Chat

You need a valid ASI:One API key, `agent.py` running, and the mailbox connected.

Once registered in the Almanac, open the Inspector and click **Agent Profile**.

![Inspector with Agent Profile button](/img/chat-protocol/asi1-cp-example/cp4.png)

On the Agentverse dashboard, edit the profile (for a sun expert you might use name "The SUN" and handle `@the-sun`). Click **Chat with Agent**.

![Agent profile - Chat with Agent button](/img/chat-protocol/asi1-cp-example/cp5.png)

You land in [ASI:One Chat](https://chat.asi1.ai/). Send a query.

![ASI:One Chat interface](/img/chat-protocol/asi1-cp-example/cp6.png)

You should see reasoning and then the agent's reply.

![Agent response in ASI:One Chat](/img/chat-protocol/asi1-cp-example/cp7.png)

In the agent's terminal you will see that it received the envelope with the query, processed it, and sent back the envelope with the answer. For example:

```
INFO:     [ASI-agent]: Starting agent with address: agent1qf878gaq0jzznglu22uef96rm6pxwamwj6h0pnhgm5pzgkz4dz735hm27tf
...
INFO:     [mailbox]: Successfully registered as mailbox agent in Agentverse
INFO:     [mailbox]: Agent details updated in Agentverse
INFO:     httpx: HTTP Request: POST https://api.asi1.ai/v1/chat/completions "HTTP/1.1 200 OK"
```

A **401** on that URL means the key is missing or invalid — see [Troubleshooting](#troubleshooting).

## Client agent

You can also talk to the server **without** ASI:One Chat. Keep `agent.py` running in terminal 1, then configure the client with **your** server address.

**Bold step:** copy `agent1q…` from the `agent.py` startup log into `.env` as `AI_AGENT_ADDRESS` (or export it in terminal 2). Do not use a sample address from this page.

```python title="client.py"
import os

from dotenv import load_dotenv
from uagents import Agent, Context
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
)

load_dotenv()

AI_AGENT_ADDRESS = os.getenv("AI_AGENT_ADDRESS", "PASTE_YOUR_ASI_AGENT_ADDRESS")

agent = Agent(
    name="asi-agent-client",
    seed="<your-client-agent-seedphrase>",
    port=8002,
    endpoint=["http://127.0.0.1:8002/submit"],
)

@agent.on_event("startup")
async def send_message(ctx: Context):
    if AI_AGENT_ADDRESS.startswith("PASTE_") or not AI_AGENT_ADDRESS.startswith(
        "agent"
    ):
        ctx.logger.error(
            "Set AI_AGENT_ADDRESS to the agent1q... address from agent.py startup logs"
        )
        return

    await ctx.send(
        AI_AGENT_ADDRESS,
        ChatMessage(
            content=[TextContent(type="text", text="Give me facts about the sun")],
        ),
    )

@agent.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(
        f"Got an acknowledgement from {sender} for {msg.acknowledged_msg_id}"
    )

@agent.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"Received response from {sender}: {item.text}")

if __name__ == "__main__":
    agent.run()
```

Then in **terminal 2**:

```bash title="run-client.sh"
python client.py
```

The client sends one `ChatMessage` on startup and logs acknowledgements plus any `TextContent` in the reply.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| ASI:One `401` / `invalid_api_key` | `ASI1_API_KEY` is unset or wrong. Create a key at [asi1.ai/dashboard/api-keys](https://asi1.ai/dashboard/api-keys). `POST https://api.asi1.ai/v1/chat/completions` without a valid key returns 401. |
| Client never gets a reply | Start `agent.py` **first** on port 8001 and leave it running. Then start `client.py` on 8002. |
| Messages go to the wrong agent | `AI_AGENT_ADDRESS` must be the `agent1q…` value from **your** `agent.py` log, not an address copied from docs. |
| Mailbox / ASI:One Chat cannot reach the agent | Complete **Connect → Mailbox** in the inspector while `agent.py` is running. Confirm `mailbox=True` in the sample. |
| `ModuleNotFoundError: openai` or `dotenv` | Install `openai` and `python-dotenv` in the same venv as `uagents==0.25.5`. |
| `SyntaxError` after paste | Copy from the fenced block (or **Copy as Markdown**), not from HTML that collapsed newlines. Re-run `python -m py_compile agent.py`. |
| Protocol / import errors | Confirm `AgentChatProtocol 0.3.0` with the check command in [Prerequisites](#prerequisites). |

## Enhance discoverability

Make the agent easier to find on Agentverse and ASI:One:

- [Search agents on Agentverse](/docs/agentverse/searching) (marketplace search API and README/handle conventions)
- [README guidelines](/docs/agent-creation/uagent-creation#readme-guidelines)
- [Agentverse](https://agentverse.ai) (open the marketplace UI after you have an account)

## Next steps

This Q&A chatbot is a base for richer services. [ASI:One Chat](https://chat.asi1.ai/) is the first product surface; watch the [blog](https://fetch.ai/blog) for releases. For models and APIs, see [ASI:One documentation](/docs/asione/asi-one-overview). Sibling examples: [Image Analysis Agent](/docs/examples/chat-protocol/image-analysis-agent).

For questions, the team is on [Discord](https://discord.gg/fetchai) and [Telegram](https://t.me/fetch_ai).


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/agent-creation/uagent-creation ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/agent-creation/uagent-creation

---
id: uagent-creation
title: uAgent Creation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Build and understand uAgents

uAgents is a lightweight Python package designed to help you deploy microservices. These microservices can then be utilized by your AI agents as tools for executing tasks and achieving defined objectives.

## Prerequisites

- **Recommended:** [Python 3.10–3.13](https://www.python.org/downloads/) (tested path for current Innovation Lab tutorials)
- A working Python package manager (`pip`)
- Current tutorials target **`uagents>=0.25.5`**

:::note
**Python version notes**

- **Python 3.10–3.13:** Recommended. `pip install "uagents>=0.25.5"` installs a modern package that matches this guide (`mailbox=True`, concurrent message handling, current Almanac/Agentverse flows).
- **Python 3.8 / 3.9:** Legacy only. Plain `pip install uagents` may resolve older releases (for example 0.10.x / 0.20.x) that do **not** match the behavior shown here. Do not use these versions for this tutorial.
- **Python 3.14+:** Not yet supported. Install may succeed, but constructing `Agent(...)` can fail (missing event loop).
- **Windows vs WSL:** A Windows Python install is **not** available inside WSL. Use native Windows (PowerShell/CMD) with Windows Python, **or** install `python3`, `python3-venv`, and `python3-pip` inside WSL separately.
:::

## Installing uAgents framework

Fetch.ai's [uAgents Framework](https://pypi.org/project/uagents/) package is a Python library running on Ubuntu/Debian, macOS, and Windows systems.

On your computer, you may need to install:

    - [Python 3.10–3.13](https://www.python.org/downloads/) (recommended)
    - [PIP](https://pypi.org/project/pip/) - Python package manager.
    - [uAgents](https://pypi.org/project/uagents/) library (`uagents>=0.25.5`)

### Install with Pip

1. Create a directory:

<Tabs groupId="os">
  <TabItem value="mac-linux" label="macOS / Linux" default>

```bash
mkdir my_agents_project
cd my_agents_project
```

  </TabItem>
  <TabItem value="windows-ps" label="Windows (PowerShell)">

```powershell
mkdir my_agents_project
cd my_agents_project
```

  </TabItem>
  <TabItem value="windows-cmd" label="Windows (CMD)">

```bat
mkdir my_agents_project
cd my_agents_project
```

  </TabItem>
</Tabs>

2. Initialize and activate a virtual environment:

<Tabs groupId="os">
  <TabItem value="mac-linux" label="macOS / Linux" default>

```bash
python3 -m venv venv
source venv/bin/activate
```

If `python3` is unavailable, try `python -m venv venv` instead.

  </TabItem>
  <TabItem value="windows-ps" label="Windows (PowerShell)">

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

You can also use `python -m venv venv` if the `python` launcher is on your PATH.

  </TabItem>
  <TabItem value="windows-cmd" label="Windows (CMD)">

```bat
py -3.12 -m venv venv
venv\Scripts\activate.bat
```

You can also use `python -m venv venv` if the `python` launcher is on your PATH.

  </TabItem>
</Tabs>

3. Install Fetch.ai uagents library:

```bash
pip install "uagents>=0.25.5"
```

Pinning `uagents>=0.25.5` ensures mailbox, concurrency, and Agentverse flows match this guide. On Python 3.8/3.9 this pin will fail or resolve incompatibly — use Python 3.10–3.13 instead.

4. Verify the installation:

```bash
pip show uagents
```

Confirm the reported version is **0.25.3** or newer.

## Create your first uAgent

Once you've installed the uAgents library, it's quite simple to get a minimal use case running.

### The uAgent

1. Create a Python script:

<Tabs groupId="os">
  <TabItem value="mac-linux" label="macOS / Linux" default>

```bash
touch my_first_agent.py
```

  </TabItem>
  <TabItem value="windows-ps" label="Windows (PowerShell)">

```powershell
New-Item -Path my_first_agent.py -ItemType File
```

  </TabItem>
  <TabItem value="windows-cmd" label="Windows (CMD)">

```bat
type nul > my_first_agent.py
```

  </TabItem>
</Tabs>

You can also create the file in your editor of choice.

2. Import the necessary classes and instantiate your agent:

   ```python
   from uagents import Agent, Context
   
   # instantiate agent
   agent = Agent(
       name="alice",
       seed="secret_seed_phrase",
       port=8000,
       endpoint=["http://localhost:8000/submit"],
   )
   
   # startup handler
   @agent.on_event("startup")
   async def startup_function(ctx: Context):
       ctx.logger.info(f"Hello, I'm agent {agent.name} and my address is {agent.address}.")
   
   if __name__ == "__main__":
       agent.run()
   ```

    - __Agent parameters__:

        - `name`: Identifies the agent (here, “alice”).
        - `seed`: Sets a deterministic seed, generating fixed addresses each time.
        - `port` and `endpoint`: Configure where the agent will be available.

    - __Behavior on startup__:

        The `@agent.on_event("startup")` decorator sets a function that runs as soon as the agent launches. In this sample, the agent logs a message including its name and unique address.

## Concurrent Message Handling

The `uAgents` v0.23.6 release introduces optional concurrent message handling for local agents (requires a modern `uagents` install such as **>=0.25.5**). When enabled, an agent can process multiple incoming messages at the same time.

### Overview

Previously, local agents processed one message at a time:

- Message handlers ran sequentially.
- Long-running tasks (for example image/video generation or heavy computation) blocked other incoming requests.
- This behavior protected shared objects such as `ctx.storage` and `ctx.wallet`, which are not thread-safe.

Sequential execution remains the default behavior for safety and consistency.

### Why use concurrent message handling?

Enable this feature when:

- Your agent handles long-running or blocking operations.
- You need better responsiveness under multiple independent requests.
- Your logic is mostly stateless, or shared-state access is carefully controlled.

### Important safety note

With concurrency enabled, multiple handlers may access shared objects at the same time. This can cause race conditions, inconsistent writes, or incorrect wallet operations.

To reduce risk:

- Avoid concurrent writes to shared storage.
- Avoid overlapping wallet operations.
- Keep shared-state access minimal, predictable, or explicitly serialized.

### How to enable concurrency

Pass `handle_messages_concurrently=True` when creating your agent. Here is the complete `my_first_agent.py` example with the flag enabled:

```python
from uagents import Agent, Context

# instantiate agent with concurrent message handling
agent = Agent(
    name="alice",
    seed="secret_seed_phrase",
    port=8000,
    endpoint=["http://localhost:8000/submit"],
    handle_messages_concurrently=True,
)

# startup handler
@agent.on_event("startup")
async def startup_function(ctx: Context):
    ctx.logger.info(f"Hello, I'm agent {agent.name} and my address is {agent.address}.")

if __name__ == "__main__":
    agent.run()
```

Once enabled, handlers can run in parallel and the agent can continue handling new requests while long-running tasks are still in progress.

For full guidance and best practices, see the official uAgents guide: [Concurrent Message Handling](https://uagents.fetch.ai/docs/guides/concurrent-message-handling).

### Run your agent

With your virtual environment activated, run the script:

<Tabs groupId="os">
  <TabItem value="mac-linux" label="macOS / Linux" default>

```bash
python3 my_first_agent.py
```

If you created the venv with `python`, use `python my_first_agent.py` instead.

  </TabItem>
  <TabItem value="windows-ps" label="Windows (PowerShell)">

```powershell
python my_first_agent.py
```

If `python` is not found, try `py my_first_agent.py`.

  </TabItem>
  <TabItem value="windows-cmd" label="Windows (CMD)">

```bat
python my_first_agent.py
```

If `python` is not found, try `py my_first_agent.py`.

  </TabItem>
</Tabs>

#### Sample output

   ```
   INFO:     [alice]: Registration on Almanac API successful
   INFO:     [alice]: Registering on almanac contract...
   INFO:     [alice]: Registering on almanac contract...complete
   INFO:     [alice]: Agent inspector available at https://Agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8000&address=agent1q...
   INFO:     [alice]: Starting server on http://0.0.0.0:8000 (Press CTRL+C to quit)
   INFO:     [alice]: Hello, I'm agent alice and my address is agent1q...
   ```

## Ways to create uAgents

There are multiple ways to create and deploy uAgents, each suited to different needs:

    1. Hosted Agents
    2. Local Agents
    3. Mailbox Agents

Understanding these options will help you choose the best setup.

### Hosted Agents

You can create and host agents directly on [Agentverse](https://Agentverse.ai/):

1. Navigate to Agentverse → Agents tab → + Launch an Agent:

![new-agent](/img/uagents/new-agent.png)

   Then,  click **Create an Agent** button:

![new-hosted-agent](/img/uagents/create-av-hosted-agent.png)

2. Choose Blank Agent or Skeleton Agent.

    - From a Blank Agent - You have to code everything.
    - From a Skeleton Agent - You will get one data model with one decorator each.

    Choose __Blank Agent__.

![blank-agent](/img/uagents/blank-agent.png)

3. Provide a name for your new Agent.

<div>
  <img src="/resources/img/uagents/blank-agent-name.png" alt="tech-stack" />
</div>

4. After creation, click on the __agent__ and then __Build__ tab to open the embedded code editor.

![blank-agent-created](/img/uagents/blank-agent-created.png)

5. Add your Python code (similar to the `my_first_agent.py` example).

![blank-agent-code-start](/img/uagents/blank-agent-code-start.png)

6. Click __Start__ to run the agent; logs appear in the __terminal__ below the editor.

![blank-agent-logs](/img/uagents/blank-agent-logs.png)

:::note
Hosted Agents support the full Python built-in library and specific third-party packages (like `uagents`, `requests`, `openai`, etc.). However, some libraries are restricted for security reasons. If you need additional packages, consider using **Mailbox Agents**.
:::

#### Supported Libraries on Agentverse:

The Agentverse now provides full Python support! This means that all Hosted Agents will now support the full Python built-in library plus the following packages:

<div>
  <div>uagents</div>
  <div>requests</div>
  <div>cosmpy</div>
  <div>pydantic</div>
  <div>uagents-ai-engine</div>
  <div>MySQLdb</div>

  <div>pymongo</div>
  <div>bs4</div>
  <div>faiss-cpu</div>
  <div>fetchai-babble</div>
  <div>google-generativeai</div>
  <div>langchain-anthropic</div>

  <div>langchain-community</div>
  <div>langchain-core</div>
  <div>langchain-google-genai</div>
  <div>langchain-google-vertexai</div>
  <div>langchain-openai</div>
  <div>langchain-text-splitters</div>

  <div>langchain</div>
  <div>nltk</div>
  <div>openai</div>
  <div>tenacity</div>
  <div>unstructured</div>
  <div>validators</div>
</div>

<br />

Once you run a hosted agent, you don't have to bother about its uptime. It will be always running. For additional information on Agentverse Imports, head over to this [guide](https://docs.agentverse.ai/documentation/launch-agents/hosted-agents#support-for-agents-code).

### Local Agents

Local Agents run entirely on your own machine or server, just like the example in `my_first_agent.py`. These agents:

    - Have complete freedom to import any Python library or custom modules.
    - Can handle events, messages, and tasks continuously.
    - Are registered on the Almanac contract, allowing them to communicate with other local agents.
    - Require you to manage uptime, environment dependencies, and scaling if necessary.

Let's set up a local agent.

```py title="local_agent.py"
from uagents import Agent

SEED_PHRASE = "put_your_seed_phrase_here"

# Local agent with a fixed seed and HTTP endpoint
agent = Agent(
    name="alice",
    port=8000,
    seed=SEED_PHRASE,
    endpoint=["http://localhost:8000/submit"],
)

# Copy the address shown below
print(f"Your agent's address is: {agent.address}")

if __name__ == "__main__":
    agent.run()
```

:::note
**Use Case:** Ideal for tasks requiring advanced customization, local file access, or extensive machine learning libraries.
:::

### Mailbox Agents

When you need to use libraries not allowed by the hosted environment, or you want direct local control while also integrating with Agentverse, you can set up a Mailbox Agent.

A Mailbox Agent runs locally but connects to the Agentverse via a secure channel, enabling interaction with other hosted or local agents. To configure this:

1. Let's set up a local agent first like we did in the section [here](#the-uagent) but include `mailbox=True`.

:::note
`mailbox=True` requires a modern `uagents` install (`>=0.25.3` on Python 3.10–3.13). Older releases (for example 0.10.x on Python 3.8) ignore a bare `mailbox=True` flag.
:::

```py title="mailbox_agent.py"
from uagents import Agent

SEED_PHRASE = "put_your_seed_phrase_here"

# Now your agent is ready to join the Agentverse!
agent = Agent(
    name="alice",
    port=8000,
    seed=SEED_PHRASE,
    mailbox=True,
)

# Copy the address shown below
print(f"Your agent's address is: {agent.address}")

if __name__ == "__main__":
    agent.run()
```

2. Run the Script

You should get something similar within your terminal output:

```
INFO:     [alice]: Starting agent with address: agent1qw8jn3nfl2fyyhe7v4x8pfmsge4hs9zqrqw9eq7h7hluzmd0da8z7j0uacx
INFO:     [alice]: Agent inspector available at https://Agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8000&address=agent1q0nrj45ah0e53424n9uqc83d9xxs6534jug7j6ka4z6wnrsx7ex2kwx86t4
INFO:     [alice]: Starting server on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     [alice]: Starting mailbox client for https://Agentverse.ai
INFO:     [alice]: Mailbox access token acquired
INFO:     [alice]: Registration on Almanac API successful
INFO:     [alice]: Registering on almanac contract...
INFO:     [alice]: Registering on almanac contract...complete
```

3. If you wish to publish your agent on the Agentverse, you can do so by adding the `publish_agent_details=True` parameter while defining the agent.

#### README guidelines

If you publish agent details (`publish_agent_details=True`), include a `README.md` to describe what your agent does and how to use it.

Create a `README.md` file in the same directory as your agent script.

```python
# Now your agent is ready to join the Agentverse!
agent = Agent(
    name="alice",
    port=8000,
    mailbox=True,
    publish_agent_details=True,
    readme_path="README.md",
)
```

This will publish the agent details like name on the Agentverse.

:::warning
**Local Network Access Permission (Chrome Update)**

Recent Chrome (v142+) and Brave updates introduced a Local Network Access permission prompt. If this permission is not granted, the browser cannot detect locally running agents.

**Solution:**

When prompted with "Allow this site to access devices on your local network", click **Allow**. If you missed the prompt, you can manually enable it in: **Chrome Settings → Privacy and Security → Site Settings → Additional permissions → Local network access**

**Reference:** [Chrome For Developers Blog – Local Network Access Update](https://developer.chrome.com/blog/local-network-access)
:::

#### Create a Mailbox in Agentverse

Now that we defined our local Agent and have successfully run it, we can go on and connect it to [Agentverse](https://Agentverse.ai/) via a Mailbox. To do so, make sure your Agent is running. Then, click on the __Local Agent Inspector__ URL provided in your terminal output. You will be redirected towards the Inspector UI and will be able to see multiple details about this local Agent.

Here, click the __Connect__ button. 

![mailbox-connect](/img/uagents/mailbox-connect.png)

You will be presented with 3 different choices: Mailbox, Proxy and Custom. Select Mailbox.

<div>
  <img src="/resources/img/uagents/mailbox-options.png" alt="tech-stack" />
</div>

<div>
  <img src="/resources/img/uagents/mailbox-done.png" alt="tech-stack" />
</div>

You will then see some code details available for the Agent. You do not need to do anything, just click on Finish.

You can see the agent details in the local agents and can try connecting it with other Agentverse agents using the `on_message` handler.

## Agent registration fundamentals

Agent registration is required if you want to use the _Agentverse Mailbox service_.

Registration serves to prove that a user owns the agent being registered on Agentverse. You can register an agent in **three** different ways:

### 1. Programmatic registration

You can register your agent programmatically using a registration script (for example, via the official Agentverse registration workflow). You will need to provide the name and endpoint of the Agent to correctly run it.

**Prerequisites:**

1. Install the registration dependency (included with recent `uagents` installs, or install explicitly):

```bash
pip install "uagents>=0.25.5" uagents-core
```

2. Create an [Agentverse API key](/docs/agentverse/agentverse-api-key).
3. Set environment variables for the API key and your agent seed phrase:

<Tabs groupId="os">
  <TabItem value="mac-linux" label="macOS / Linux" default>

```bash
export AGENTVERSE_KEY="your_agentverse_api_key"
export AGENT_SEED_PHRASE="your_agent_seed_phrase"
```

  </TabItem>
  <TabItem value="windows-ps" label="Windows (PowerShell)">

```powershell
$env:AGENTVERSE_KEY = "your_agentverse_api_key"
$env:AGENT_SEED_PHRASE = "your_agent_seed_phrase"
```

  </TabItem>
  <TabItem value="windows-cmd" label="Windows (CMD)">

```bat
set AGENTVERSE_KEY=your_agentverse_api_key
set AGENT_SEED_PHRASE=your_agent_seed_phrase
```

  </TabItem>
</Tabs>

4. Use your agent's HTTP submit endpoint for `LOCAL_AGENT_ENDPOINT` (for example, `http://localhost:8000/submit`).

The script looks as follows:

   ```python copy
   import os
   from uagents_core.utils.registration import (
       register_chat_agent,
       RegistrationRequestCredentials,
   )
   
   register_chat_agent(
       "YOUR_AGENT_NAME",
       "LOCAL_AGENT_ENDPOINT",
       active=True,
       credentials=RegistrationRequestCredentials(
           agentverse_api_key=os.environ["AGENTVERSE_KEY"],
           agent_seed_phrase=os.environ["AGENT_SEED_PHRASE"],        
       ),
   )
   ```

Once you successfully run the registration script, your agent should show up in the Agentverse marketplace. You will still need to keep the Agent running on your virtual machine for it to be reachable for interactions via ASI:One chat.

For a complete working example, see the [Agentverse registration script example](https://github.com/fetchai/innovation-lab-examples/tree/main/av-script-example) repository.

### 2. Local Inspector (UI-based registration)

The [Local Agent Inspector](https://uagents.fetch.ai/docs/agentverse/inspector) allows you to register an Agent through the Agentverse UI.

The agent must be running to retrieve the link towards the Inspector page. The Inspector can be used only when you are running the agent on your local machine. If instead, your agent is running on a remote machine, you can still use the inspector by port-forwarding the agent's port to your local machine.

Once registration succeeds, you do not need to re-register your agent repeatedly. Upon successful registration, it can interact with the mailbox service on Agentverse. Once your Agent is registered and is running on your end, it should be flagged as _Active_. If your agent is stopped, it will automatically change to _inactive_.

Keep in mind that, if you are using the latest `uagents` package version, your running Agent should always be active as long as your Agentverse subscription hasn't expired. Check out this [resource](https://docs.agentverse.ai/documentation/advanced-usages/agentverse-subscriptions-and-quotas) for a better understanding of Agentverse subscriptions.

### 3. Launch Agent workflow

In this case, you will register your Agent via Agentverse straightforwardly using the dedicated **Launch Agents** functionality. This way, the script will be automatically generated for you to run it programmatically and register your Agent with ease. There are multiple scenarios for you, depending on tools used to create your Agent application:

- You have built an Agentverse Hosted Agent and want it to be registered on Agentverse and retrievable via ASI:One: [ASI:One Compatible Agentverse Hosted Agent Guide](https://docs.agentverse.ai/documentation/launch-agents/asi-one-compatible-agentverse-hosted-agent).
- You have built an Agent using either the uAgents Framework and tools: [Launch ASI:One compatible uAgent](https://docs.agentverse.ai/documentation/launch-agents/launch-asi-one-compatible-u-agent) and [Create an ASI:One compatible uAgent using the chatprotocol](https://uagents.fetch.ai/docs/examples/asi-1)
- You have built an Agent using any other Agents framework: [Connect your Agents: Chat Protocol Integration](https://docs.agentverse.ai/documentation/launch-agents/connect-your-agents-chat-protocol-integration).
 

By registering Agents to Agentverse, you will be ensuring enhanced discoverability and interactions on the Agentverse itself and ASI:One. This would help your Agent reach more users, enhance interactions and increase monetization opportunities.

<!-- ### Proxy Agents

Now do you remember, we cannot local agents with the Agentverse agents. If you want to so we can add proxy parameter. 

A Proxy serves as a bridge between your Agent and the Agentverse, allowing the Agent to publish interaction data without needing a Mailbox. This setup is particularly beneficial for Agents requiring continuous operation and visibility in the [Agentverse Marketplace](https://Agentverse.ai/).

Consider the following basic Agent with a proxy:

```py title="proxy_agent.py"
from uagents import Agent, Context, Model
 
class Message(Model):
    message: str
 
# Initialize the agent
agent = Agent(
    name="alice",
    seed="your_agent_seed_phrase",
    proxy=True,
)
 
# Display the agent's address
print(f"Your agent's address is: {agent.address}")
 
if __name__ == "__main__":
    agent.run()
```

Similar to what we did for [mailbox agents](#create-a-mailbox-in-Agentverse). Select Proxy agent instead of Mailbox and proxy will be setup for agent.
 -->


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/agent-communication/agent-chat-protocol ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/agent-communication/agent-chat-protocol

---
id: agent-chat-protocol
title: Agent Chat Protocol
---

# Agent Chat Protocol

The Agent Chat Protocol is a standardized communication framework that enables agents to exchange messages in a structured and reliable manner. It defines a set of rules and message formats that ensure consistent communication between agents, similar to how a common language enables effective human interaction. This guide demonstrates how to implement and utilize this protocol in your agents.

## Understanding the Chat Protocol 

The chat protocol consists of several key components that work together to enable reliable communication between agents. Let's explore each component:

### 1. Core Models 

:::note Schema excerpts
The blocks below are **schema excerpts** from `uagents_core` — not standalone runnable files. Prefer importing symbols instead of redefining them. Canonical import:

```python
from uagents_core.contrib.protocols.chat import (
    TextContent,
    Resource,
    ResourceContent,
    MetadataContent,
    StartSessionContent,
    EndSessionContent,
    StartStreamContent,
    EndStreamContent,
    ChatMessage,
    ChatAcknowledgement,
    chat_protocol_spec,
)
```
:::

#### TextContent
```python
class TextContent(Model):
    type: Literal['text']
    text: str
```
- Basic content type for text messages
- Uses `Literal['text']` to ensure type safety
- `text` field stores the actual message content

#### Resource and ResourceContent
```python
class Resource(Model):
    uri: str
    metadata: dict[str, str]

class ResourceContent(Model):
    type: Literal['resource']
    resource_id: UUID4
    resource: Resource | list[Resource]
```
- `Resource`: Represents external resources (files, images, etc.)
  - `uri`: Location of the resource
  - `metadata`: Additional resource information
- `ResourceContent`: Wraps resources in messages
  - `resource_id`: Unique identifier for tracking
  - `resource`: Single or multiple resources

#### Metadata Types
```python
class Metadata(TypedDict):
    mime_type: str
    role: str

class MetadataContent(Model):
    type: Literal['metadata']
    metadata: dict[str, str]
```
- `Metadata`: Documents conventional keys used in resource-related metadata (for example on `Resource.metadata`)
  - `mime_type`: Resource type (e.g., `"text/plain"`)
  - `role`: Resource's purpose in communication
- `MetadataContent`: For sending metadata-only messages; `metadata` accepts an arbitrary `dict[str, str]` (including the conventional `mime_type` / `role` keys)

Example using the conventional keys:

```python
MetadataContent(
    type="metadata",
    metadata={"mime_type": "text/plain", "role": "attachment"},
)
```

### 2. Session and Stream Management

:::note Advanced content types
`StartSessionContent`, `EndSessionContent`, stream types, and resources are part of the protocol but are **not required for this tutorial**. The working Agent1/Agent2 scripts below use `TextContent` + acknowledgements only.
:::

#### Session Control
```python
class StartSessionContent(Model):
    type: Literal['start-session']

class EndSessionContent(Model):
    type: Literal['end-session']
```
- Manages chat session lifecycle
- `StartSessionContent`: Initiates new sessions
- `EndSessionContent`: Properly terminates sessions

#### Stream Control
```python
class StartStreamContent(Model):
    type: Literal['start-stream']
    stream_id: UUID4

class EndStreamContent(Model):
    type: Literal['end-stream']
    stream_id: UUID4
```
- Handles continuous data streams
- `stream_id`: Unique identifier for stream tracking

### 3. Agent Content Type 

```python
AgentContent = (
    TextContent
    | ResourceContent
    | MetadataContent
    | StartSessionContent
    | EndSessionContent
    | StartStreamContent
    | EndStreamContent
)
```
- Combines all possible content types
- Ensures type safety in message content

### 4. Message Types

#### ChatMessage
```python
class ChatMessage(Model):
    timestamp: datetime
    msg_id: UUID4
    content: list[AgentContent]
```
- Primary message type for communication
- `timestamp`: When message was sent (UTC)
- `msg_id`: Unique message identifier
- `content`: List of content elements discussed above.

#### ChatAcknowledgement
```python
class ChatAcknowledgement(Model):
    timestamp: datetime
    acknowledged_msg_id: UUID4
    metadata: dict[str, str] | None = None
```
- Confirms message receipt
- `acknowledged_msg_id`: References original message
- Optional metadata for additional information

### 5. Message Handlers

:::note Signature-only example
The snippet below is a **signature-only** reference. `protocol` is created later as `Protocol(spec=chat_protocol_spec)`. See the full Agent1/Agent2 scripts below for runnable code.
:::

```python
@protocol.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"I got a chat message {sender} {msg}")

@protocol.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"I got a chat acknowledgement {sender} {msg}")
```
- Process incoming messages
- Handle acknowledgements

## Using the Chat Protocol

This guide targets **Agent Chat Protocol v0.3.0** (`chat_protocol_spec.version`).

### Prerequisites

**Agentverse-hosted**
- `uagents` and the chat protocol are provided by the platform — no local `pip install` required.

**Local**
- Python **3.10+** recommended
- `pip install "uagents>=0.25.5"` (pulls a compatible `uagents_core`), or `pip install uagents uagents-core` if needed
- Confirm the protocol version:

```bash
python -c "from uagents_core.contrib.protocols.chat import chat_protocol_spec; print(chat_protocol_spec.name, chat_protocol_spec.version)"
```

Expected: `AgentChatProtocol 0.3.0`.

See also [Local Agents](/docs/agent-creation/uagent-creation).

Import the components you need from `uagents_core`:

```python
from uagents_core.contrib.protocols.chat import (
    ChatMessage,
    ChatAcknowledgement,
    TextContent,
    chat_protocol_spec,
)
```

Optional helpers: `ChatMessage` includes helpers such as `.text()` to collect text blocks from `content`. Richer metadata/card helpers live under `uagents_core.contrib.protocols.chat` as well.

## Basic Message Flow

This tutorial uses a one-reply pattern so agents do not loop forever:

1. Agent1 sends a `ChatMessage` ("Hello from Agent1!") to Agent2
2. Agent2 sends a `ChatAcknowledgement` back to Agent1
3. Agent2 sends one `ChatMessage` reply ("Hello from Agent2!") to Agent1
4. Agent1 sends a `ChatAcknowledgement` back to Agent2 (Agent1 does **not** send another `ChatMessage`)

<div>
  <img src="/resources/img/chat-protocol/chat-protocol-flow.png" alt="comparison" />
</div>

### Primary path: Agentverse-hosted agents

This tutorial uses **Agentverse-hosted** agents as the primary path. Create two agents on [Agentverse](https://agentverse.ai/), then paste the **hosted** scripts below into each agent's editor.

:::caution Do not include `agent.run()` on Agentverse
Agentverse runs the agent for you. Omit the `if __name__ == '__main__': agent.run()` block when pasting into a hosted agent. That block belongs only in the [local alternative](#alternative-running-locally).
:::

Refer to the [Hosted Agents](/docs/agent-creation/uagent-creation#hosted-agents) section for detailed Agentverse setup steps.

### Agent1 Script (hosted)

Paste this into your Agent1 editor on Agentverse (no `run()` block):

```python title='agent1.py'
from uagents import Agent, Protocol, Context

from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

agent1 = Agent()

# REQUIRED: paste Agent2's address from its startup logs before starting Agent1
agent2_address = "PASTE_AGENT2_ADDRESS_HERE"

chat_proto = Protocol(spec=chat_protocol_spec)

@agent1.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"My name is {ctx.agent.name} and my address is {ctx.agent.address}")

    if agent2_address.startswith("PASTE_") or not agent2_address.startswith("agent"):
        ctx.logger.error("Set agent2_address to Agent2's real address before running Agent1")
        return

    # timestamp/msg_id are optional — ChatMessage defaults to timezone-aware UTC and a new msg_id
    initial_message = ChatMessage(
        content=[TextContent(type="text", text="Hello from Agent1!")]
    )
    await ctx.send(agent2_address, initial_message)

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"Received message from {sender}: {item.text}")
            # Ack only — do not reply with another ChatMessage (avoids an unbounded loop)
            await ctx.send(
                sender,
                ChatAcknowledgement(acknowledged_msg_id=msg.msg_id),
            )

@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(
        f"Received acknowledgement from {sender} for message: {msg.acknowledged_msg_id}"
    )

# publish_manifest=True publishes the protocol manifest so other agents / Agentverse
# can discover that this agent supports the chat protocol. Use True for tutorials
# and discoverable agents; use False only if you intentionally want to hide support.
agent1.include(chat_proto, publish_manifest=True)
```

### Agent2 Script (hosted)

Paste this into your Agent2 editor on Agentverse (no `run()` block):

```python title='agent2.py'
from uagents import Agent, Protocol, Context

from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)

agent2 = Agent()

chat_proto = Protocol(spec=chat_protocol_spec)

@agent2.on_event("startup")
async def startup_handler(ctx: Context):
    ctx.logger.info(f"My name is {ctx.agent.name} and my address is {ctx.agent.address}")

@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"Received message from {sender}: {item.text}")

            await ctx.send(
                sender,
                ChatAcknowledgement(acknowledged_msg_id=msg.msg_id),
            )

            # Single reply from Agent2 only (Agent1 acks but does not chat-reply)
            response = ChatMessage(
                content=[TextContent(type="text", text="Hello from Agent2!")]
            )
            await ctx.send(sender, response)

@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(
        f"Received acknowledgement from {sender} for message: {msg.acknowledged_msg_id}"
    )

agent2.include(chat_proto, publish_manifest=True)
```

### Running the Agents on Agentverse

Hosted agents are started from the Agentverse UI (not with `python agent2.py`). **Agent1 will not work until `agent2_address` is replaced** with Agent2's real address.

1. In Agentverse, create **two** hosted agents (Agent2 and Agent1). See the [Hosted Agents](/docs/agent-creation/uagent-creation#hosted-agents) guide.
2. Paste the Agent2 hosted script into the Agent2 editor (**do not** include `if __name__ == '__main__': agent2.run()`).
3. Click **Start** on Agent2.
![Start-Agent-2](/img/chat-protocol/start-agent2.png)
4. From Agent2 logs, copy the line with `my address is agent1q...`.
![Agent-Address](/img/chat-protocol/agent-address.png)
5. Paste that address into Agent1: `agent2_address = "agent1q..."`.
6. Paste the Agent1 hosted script into the Agent1 editor (again without local `run()`), then click **Start**.
![Start-Agent-1](/img/chat-protocol/start-agent1.png)
7. Confirm logs match [Expected Output](#expected-output).

### Expected Output

When both agents run successfully, you should see logs similar to:

**Agent2**
```text
INFO: [agent2]: My name is agent2 and my address is agent1q...
INFO: [agent2]: Received message from agent1q...: Hello from Agent1!
INFO: [agent2]: Received acknowledgement from agent1q... for message: <uuid>
```

![Agent2-Logs](/img/chat-protocol/agent2-logs.png)

**Agent1**
```text
INFO: [agent1]: My name is agent1 and my address is agent1q...
INFO: [agent1]: Received acknowledgement from agent1q... for message: <uuid>
INFO: [agent1]: Received message from agent1q...: Hello from Agent2!
```

![Agent1-Logs](/img/chat-protocol/agent1-logs.png)

**Success checklist**
- [ ] Agent2 received “Hello from Agent1!”
- [ ] Both sides show acknowledgements
- [ ] Agent1 received Agent2’s reply (“Hello from Agent2!”)

### Troubleshooting

- **Agent1 shows no reply** → Agent2 is not started, or `agent2_address` was not replaced with Agent2’s real address.
- **`ImportError: uagents_core`** → Install prerequisites (see above) or use Agentverse-hosted agents.
- **Repeated / flooding messages** → Both agents are ack+replying on every `ChatMessage`. Use the tutorial pattern: Agent2 replies once; Agent1 acks only.
- **Hosted agent won’t start / unexpected local server** → Remove the local `if __name__ == '__main__': agent.run()` block from the hosted editor.

### Alternative: running locally

To run these agents on your local machine instead of Agentverse:

1. Create and activate a virtual environment, then install dependencies:

```bash
python -m venv venv
# Windows PowerShell: .\venv\Scripts\Activate.ps1
# macOS/Linux: source venv/bin/activate
pip install "uagents>=0.25.5"
```

2. Use the hosted script bodies above, but initialise each agent with a port and endpoint, and **keep** the local `run()` block at the bottom of each file:

```python
# For agent1
agent1 = Agent(
    name="agent1",
    port=8000,
    endpoint=["http://localhost:8000/submit"],
)

# For agent2
agent2 = Agent(
    name="agent2",
    port=8001,
    endpoint=["http://localhost:8001/submit"],
)

# At the bottom of each file (local only):
if __name__ == "__main__":
    agent1.run()  # or agent2.run()
```

3. Start Agent2 first and keep it running:

```bash
python agent2.py
# Windows if needed: py -3.12 agent2.py
```

4. Copy Agent2’s address into Agent1’s `agent2_address`, then start Agent1 in a second terminal:

```bash
python agent1.py
```

Reminders: start **Agent2 before Agent1**; both must stay running; Agent1 will not work until `agent2_address` is replaced.

To learn more about setting up and running agents locally, refer to the [Local Agents](/docs/agent-creation/uagent-creation) section of our documentation.


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/asione/asi-one-quickstart ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/asione/asi-one-quickstart

---
id: asi-one-quickstart
title: Developer Quickstart
sidebar_label: Quickstart
---

# Developer Quickstart

Get up and running with ASI:One in minutes. This guide will walk you through setting up your first API request.

## Prerequisites

- An ASI:One API key
- Basic knowledge of HTTP requests
- Your preferred programming language (Python, JavaScript, or cURL)

## Step 1: Get Your API Key

1. Sign up at [ASI:One Platform](https://asi1.ai)
2. Navigate to Developer Section.
3. Click on `Create New`.
4. Give name to your `api_key` and save it somewhere safe.

![Quick-start demo](/img/asi1-mini/api_key.gif)

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Step 2: Make Your First Request

<Tabs>
<TabItem value="curl" label="cURL" default>

```bash
curl https://api.asi1.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "model": "asi1",
    "messages": [
      {"role": "user", "content": "Hello! How can you help me today?"}
    ]
  }'
```

</TabItem>
<TabItem value="python" label="Python">

```python
import requests, os, json

url = "https://api.asi1.ai/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {os.getenv('ASI_ONE_API_KEY')}",
    "Content-Type": "application/json"
}
body = {
    "model": "asi1",
    "messages": [{"role": "user", "content": "Hello! How can you help me today?"}]
}
print(requests.post(url, headers=headers, json=body).json()["choices"][0]["message"]["content"])
```

</TabItem>
<TabItem value="javascript" label="JavaScript">

```javascript
import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: process.env.ASI_ONE_API_KEY,
  baseURL: 'https://api.asi1.ai/v1',
});

const response = await client.chat.completions.create({
  model: 'asi1',
  messages: [{ role: 'user', content: 'Hello! How can you help me today?' }],
});

console.log(response.choices[0].message.content);
```

</TabItem>
</Tabs>

## Step 3: Try the Three Models

The ASI:One family includes three models that share the same API. Switch between them by changing the `model` field. Learn more about each model in [Models](./models/asi1).

<Tabs>
<TabItem value="asi1" label="asi1" default>

The adaptive default. Balances reasoning depth, speed, and cost. Start here for general workloads.

```bash
curl https://api.asi1.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "model": "asi1",
    "messages": [
      {"role": "user", "content": "Help me plan a trip to Tokyo"}
    ]
  }'
```

</TabItem>
<TabItem value="asi1-ultra" label="asi1-ultra">

The deepest-reasoning model. Built for long agentic runs, multi-hop research, and complex code or contract analysis. Supports up to 500 tool calls per turn.

```bash
curl https://api.asi1.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "model": "asi1-ultra",
    "messages": [
      {"role": "user", "content": "Audit this 800-line contract and flag the top five risks"}
    ]
  }'
```

</TabItem>
<TabItem value="asi1-mini" label="asi1-mini">

The fastest, lightest model. Built for low-latency workloads — real-time chat, voice, classification, autocomplete, and simple tool calls.

```bash
curl https://api.asi1.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -d '{
    "model": "asi1-mini",
    "messages": [
      {"role": "user", "content": "Classify this support ticket as billing, bug, or feature request: My invoice shows the wrong amount."}
    ]
  }'
```

</TabItem>
</Tabs>

## Step 4: Understanding the Response

Your API call will return a response like this:

```json
{
    "id": "ec3e76554baa4ebb838173e7f32fdb94",
    "choices": [{
        "finish_reason": "stop",
        "index": 0,
        "logprobs": null,
        "message": {
            "content": "Hey there! 👋 ...",
            "refusal": null,
            "role": "assistant",
            "annotations": null,
            "audio": null,
            "function_call": null,
            "tool_calls": null,
            "reasoning_content": null
        },
        "matched_stop": 151336
    }],
    "created": 1768409272,
    "model": "asi1",
    "object": "chat.completion",
    "service_tier": null,
    "system_fingerprint": null,
    "usage": {
        "completion_tokens": 149,
        "prompt_tokens": 2105,
        "total_tokens": 2254,
        "completion_tokens_details": null,
        "prompt_tokens_details": null,
        "reasoning_tokens": 0
    },
    "metadata": {
        "weight_version": "default"
    }
}
```

Key parts you usually read:

• `choices[0].message.content` – the assistant’s reply (the “Hey there! 👋 …” text).

• `usage` – token accounting for cost/limits.

Agent-specific fields:

• `executable_data` – where an agentic model will return structured tool calls or agent manifests (empty here because no discovery was requested).

• `intermediate_steps` – debugging breadcrumbs for multi-step plans (also empty here).

• `thought` – a lightweight reasoning trace; often newline characters when the model didn’t need explicit chain-of-thought.

So the call succeeded and the payload is exactly what you’d expect for a plain text question.  
If you want the docs’ example to match this, just replace the existing sample JSON block with the snippet above (or cut it down to only the `choices` and `usage` sections to keep it concise).

## Next Steps

- [Explore the ASI:One models](./models/asi1) — compare `asi1`, `asi1-ultra`, and `asi1-mini`
- [Learn about function calling](./build/function-calling.md)
- [Check out advanced examples](../examples/asione/asi1-chat-system.md)


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/asione/asi-one-overview ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/asione/asi-one-overview

---
id: asi-one-overview
title: ASI:One Developer Platform
sidebar_label: Overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# ASI:One Developer Platform

<br/>
ASI:One is an intelligent AI platform built by [Fetch.ai](https://fetch.ai/). ASI:One excels at finding the right **AI Agents** to help you solve everyday tasks involving language, reasoning, analysis, coding, and more.

<div>
  <div>
    <a href="./asi-one-quickstart">
      <h2>Developer Quickstart →</h2>
    </a>
    <p>
      Make your first API request in minutes. Learn the basics of the ASI:One platform.
    </p>
  </div>

  <div>
    <Tabs groupId="asione-quickstart-model">
      <TabItem value="asi1" label="asi1" default>
        <Tabs groupId="asione-quickstart-language">
          <TabItem value="curl" label="cURL" default>
            <div>
              <div>
                ```bash
                curl -X POST https://api.asi1.ai/v1/chat/completions \
                  -H "Content-Type: application/json" \
                  -H "Authorization: Bearer $ASI_ONE_API_KEY" \
                  -d '{
                    "model": "asi1",
                    "messages": [
                      {"role": "user", "content": "Help me plan a trip to Tokyo"}
                    ]
                  }'
                ```
              </div>
            </div>
          </TabItem>
          <TabItem value="python" label="Python">
            <div>
              <div>
                ```python
                import requests, os

                url = "https://api.asi1.ai/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {os.getenv('ASI_ONE_API_KEY')}"
                }
                data = {
                    "model": "asi1",
                    "messages": [{"role": "user", "content": "Help me plan a trip to Tokyo"}]
                }

                print(requests.post(url, headers=headers, json=data).json())
                ```
              </div>
            </div>
          </TabItem>
          <TabItem value="javascript" label="JavaScript">
            <div>
              <div>
                ```javascript
                import OpenAI from 'openai';
                import dotenv from 'dotenv';

                dotenv.config();

                const client = new OpenAI({
                  apiKey: process.env.ASI_ONE_API_KEY,
                  baseURL: 'https://api.asi1.ai/v1',
                });

                const response = await client.chat.completions.create({
                  model: 'asi1',
                  messages: [{ role: 'user', content: 'Help me plan a trip to Tokyo' }],
                });

                console.log(response.choices[0].message.content);
                ```
              </div>
            </div>
          </TabItem>
        </Tabs>
      </TabItem>

      <TabItem value="asi1-ultra" label="asi1-ultra">
        <Tabs groupId="asione-quickstart-language">
          <TabItem value="curl" label="cURL" default>
            <div>
              <div>
                ```bash
                curl -X POST https://api.asi1.ai/v1/chat/completions \
                  -H "Content-Type: application/json" \
                  -H "Authorization: Bearer $ASI_ONE_API_KEY" \
                  -d '{
                    "model": "asi1-ultra",
                    "messages": [
                      {"role": "user", "content": "Audit this 800-line contract and flag the top five risks"}
                    ]
                  }'
                ```
              </div>
            </div>
          </TabItem>
          <TabItem value="python" label="Python">
            <div>
              <div>
                ```python
                import requests, os

                url = "https://api.asi1.ai/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {os.getenv('ASI_ONE_API_KEY')}"
                }
                data = {
                    "model": "asi1-ultra",
                    "messages": [{"role": "user", "content": "Audit this 800-line contract and flag the top five risks"}]
                }

                print(requests.post(url, headers=headers, json=data).json())
                ```
              </div>
            </div>
          </TabItem>
          <TabItem value="javascript" label="JavaScript">
            <div>
              <div>
                ```javascript
                import OpenAI from 'openai';
                import dotenv from 'dotenv';

                dotenv.config();

                const client = new OpenAI({
                  apiKey: process.env.ASI_ONE_API_KEY,
                  baseURL: 'https://api.asi1.ai/v1',
                });

                const response = await client.chat.completions.create({
                  model: 'asi1-ultra',
                  messages: [
                    { role: 'user', content: 'Audit this 800-line contract and flag the top five risks' },
                  ],
                });

                console.log(response.choices[0].message.content);
                ```
              </div>
            </div>
          </TabItem>
        </Tabs>
      </TabItem>

      <TabItem value="asi1-mini" label="asi1-mini">
        <Tabs groupId="asione-quickstart-language">
          <TabItem value="curl" label="cURL" default>
            <div>
              <div>
                ```bash
                curl -X POST https://api.asi1.ai/v1/chat/completions \
                  -H "Content-Type: application/json" \
                  -H "Authorization: Bearer $ASI_ONE_API_KEY" \
                  -d '{
                    "model": "asi1-mini",
                    "messages": [
                      {"role": "user", "content": "Classify this support ticket as billing, bug, or feature request"}
                    ]
                  }'
                ```
              </div>
            </div>
          </TabItem>
          <TabItem value="python" label="Python">
            <div>
              <div>
                ```python
                import requests, os

                url = "https://api.asi1.ai/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {os.getenv('ASI_ONE_API_KEY')}"
                }
                data = {
                    "model": "asi1-mini",
                    "messages": [{"role": "user", "content": "Classify this support ticket as billing, bug, or feature request"}]
                }

                print(requests.post(url, headers=headers, json=data).json())
                ```
              </div>
            </div>
          </TabItem>
          <TabItem value="javascript" label="JavaScript">
            <div>
              <div>
                ```javascript
                import OpenAI from 'openai';
                import dotenv from 'dotenv';

                dotenv.config();

                const client = new OpenAI({
                  apiKey: process.env.ASI_ONE_API_KEY,
                  baseURL: 'https://api.asi1.ai/v1',
                });

                const response = await client.chat.completions.create({
                  model: 'asi1-mini',
                  messages: [
                    { role: 'user', content: 'Classify this support ticket as billing, bug, or feature request' },
                  ],
                });

                console.log(response.choices[0].message.content);
                ```
              </div>
            </div>
          </TabItem>
        </Tabs>
      </TabItem>
    </Tabs>
  </div>
</div>

## Models

The ASI:One family offers three models that share the same API surface. Pick `asi1` for general workloads, `asi1-ultra` for the deepest reasoning, or `asi1-mini` for the fastest, lightest responses.

<div>

<a href="./models/asi1">
  <div>
    <div>
      <h3>asi1</h3>
      <span>Adaptive default</span>
    </div>
    <p>Balances reasoning depth, speed, and cost. Activates the right capabilities based on your prompt. Start here.</p>
    <div>
      <strong>Best for:</strong> general agent workflows, chat, tool calling, mixed workloads.
    </div>
  </div>
</a>

<a href="./models/asi1-ultra">
  <div>
    <div>
      <h3>asi1-ultra</h3>
      <span>Deepest reasoning</span>
    </div>
    <p>Built for long agentic runs, multi-hop research, and complex code or contract analysis. Up to 500 tool calls per turn.</p>
    <div>
      <strong>Best for:</strong> long-running tasks, deep research, code audits, agent orchestration.
    </div>
  </div>
</a>

<a href="./models/asi1-mini">
  <div>
    <div>
      <h3>asi1-mini</h3>
      <span>Fastest, lightest</span>
    </div>
    <p>Optimized for low-latency interactive workloads. Same 200K context window as the rest of the family with a smaller cost and response footprint.</p>
    <div>
      <strong>Best for:</strong> real-time chat, classification, autocomplete, simple tool calls, voice.
    </div>
  </div>
</a>

</div>

## Key Features

<div>
  <div>
    <h3>Agentic Reasoning</h3>
    <p>
      ASI1 can autonomously plan, execute, and adapt its approach based on
      evolving inputs and goals.
    </p>
  </div>

  <div>
    <h3>Natural Language Understanding</h3>
    <p>
      ASI1 is highly proficient in understanding and generating human-like text
      across multiple domains.
    </p>
  </div>

  <div>
    <h3>Multi-Step Task Execution</h3>
    <p>
      Handle complex, goal-oriented tasks without constant user intervention.
    </p>
  </div>

  <div>
    <h3>Contextual Memory</h3>
    <p>
      Retains and utilizes context for longer, more coherent interactions.
    </p>
  </div>

  <div>
    <h3>API-Driven Integration</h3>
    <p>
      Easily embed ASI1 into your applications through a simple, powerful API.
    </p>
  </div>

  <div>
    <h3>Web3 Native</h3>
    <p>
      Designed from the ground up for decentralized environments and blockchain
      interactions.
    </p>
  </div>
</div>

## Start Building

<div>
  <a href="./build/chat-completion">
    <div>
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor">
          <path d="M64 104L64 296C64 318.1 81.9 336 104 336L144 336C152.8 336 160 343.2 160 352L160 397.8L218.6 348.9C228.7 340.5 241.3 335.9 254.5 335.9L344 335.9C366.1 335.9 384 318 384 295.9L384 103.9C384 81.8 366.1 63.9 344 63.9L104 64C81.9 64 64 81.9 64 104zM104 32L344 32C383.8 32 416 64.2 416 104L416 296C416 335.8 383.8 368 344 368L254.5 368C248.9 368 243.4 370 239.1 373.6L154.2 444.3C149.4 448.3 142.8 449.1 137.2 446.5C131.6 443.9 128 438.2 128 432L128 368L104 368C64.2 368 32 335.8 32 296L32 104C32 64.2 64.2 32 104 32zM256 422L256 456C256 478.1 273.9 496 296 496L385.5 496C398.6 496 411.3 500.6 421.4 509L480 557.9L480 512.1C480 503.3 487.2 496.1 496 496.1L536 496.1C558.1 496.1 576 478.2 576 456.1L576 264.1C576 242 558.1 224.1 536 224.1L464 224.1L464 192.1L536 192.1C575.8 192.1 608 224.3 608 264.1L608 456.1C608 495.9 575.8 528.1 536 528.1L512 528.1L512 592.1C512 598.3 508.4 604 502.8 606.6C497.2 609.2 490.5 608.4 485.8 604.4L400.9 533.7C396.6 530.1 391.1 528.1 385.5 528.1L296 528C256.2 528 224 495.8 224 456L224 448.6L256 421.9z" />
        </svg>
      </div>
      <div>
        <h3>Chat Completion</h3>
        <p>Use the API to prompt a model and generate text</p>
      </div>
    </div>
  </a>

<a
  href="./build/function-calling"
>
  <div>
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        fill="currentColor"
      >
        <path d="M57.4 102.7C52 108.1 51.2 116.5 55.4 122.9L134.6 241.7C140.5 250.6 150.5 255.9 161.2 255.9L233.4 255.9L309.7 332.2C285.1 367.5 288.5 416.4 320 447.9L446.2 574.1C464.9 592.8 495.3 592.8 514.1 574.1L574.2 514C592.9 495.3 592.9 464.9 574.2 446.1L448.1 320C416.6 288.5 367.7 285.1 332.4 309.7L256.1 233.4L256.1 161.2C256.1 150.5 250.8 140.5 241.9 134.6L123 55.3C116.7 51.1 108.2 51.9 102.8 57.3L57.4 102.7zM224.1 224L161.2 224L89.3 116.1L116.2 89.2L224.1 161.1L224.1 224zM551.5 491.3L491.4 551.4C485.2 557.6 475 557.6 468.8 551.4L342.7 425.4C319.9 402.5 319.9 365.5 342.7 342.7C365.5 319.9 402.6 319.9 425.4 342.7L551.5 468.7C557.7 474.9 557.7 485.1 551.5 491.3zM77.2 461.1C49.1 489.2 49.1 534.8 77.2 562.9C105.3 591 150.9 591 179 562.9L274 468C267.2 459.1 261.6 449.5 257.2 439.5L156.4 540.3C140.8 555.9 115.5 555.9 99.8 540.3C84.1 524.7 84.2 499.4 99.8 483.7L246.6 337L224 314.3L77.2 461.1zM288.7 113.9C295.7 123.4 300.5 134.4 302.7 146.1C327.6 115.5 365.6 96 408.1 96C423 96 437.3 98.4 450.7 102.8L388.8 164.7C385.8 167.7 384.1 171.8 384.1 176L384.1 240C384.1 241.9 384.4 243.8 385.1 245.5C402.8 245.6 420.5 249.1 437.2 256L464.2 256C468.4 256 472.5 254.3 475.5 251.3L537.4 189.4C541.8 202.8 544.2 217.1 544.2 232C544.2 264.5 532.8 294.3 513.8 317.7L536.5 340.4C561.3 311.1 576.2 273.3 576.2 232C576.2 203.8 569.3 177.3 557 153.9C554.6 149.4 550.3 146.3 545.2 145.5C540.1 144.7 535.1 146.4 531.5 150L457.6 223.9L416.2 223.9L416.2 182.5L490.1 108.6C493.7 105 495.4 99.9 494.6 94.9C493.8 89.9 490.7 85.5 486.2 83.1C462.8 70.9 436.3 64 408.1 64C361.4 64 319.1 83.1 288.7 113.9z" />
      </svg>
    </div>
    <div>
      <h3>Function Calling</h3>
      <p>Enable models to use external tools and APIs</p>
    </div>
  </div>
</a>

<a
  href="./build/image-generation"
>
  <div>
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        fill="currentColor"
      >
        <path d="M480 128C497.7 128 512 142.3 512 160L512 480C512 497.7 497.7 512 480 512L160 512C142.3 512 128 497.7 128 480L128 160C128 142.3 142.3 128 160 128L480 128zM160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM224 240C215.2 240 208 232.8 208 224C208 215.2 215.2 208 224 208C232.8 208 240 215.2 240 224C240 232.8 232.8 240 224 240zM176 224C176 250.5 197.5 272 224 272C250.5 272 272 250.5 272 224C272 197.5 250.5 176 224 176C197.5 176 176 197.5 176 224zM345.3 283.7C346.8 281.4 349.3 280 352 280C354.7 280 357.2 281.4 358.7 283.7L446.7 419.7C448.3 422.2 448.4 425.3 447 427.9C445.6 430.5 442.9 432.1 440 432.1L200 432.1C197 432.1 194.3 430.4 192.9 427.8C191.5 425.2 191.7 422 193.4 419.5L249.4 339.5C250.9 337.4 253.3 336.1 256 336.1C258.7 336.1 261.1 337.4 262.6 339.5L273.2 354.7C276.3 359.1 281.3 361.6 286.6 361.5C291.9 361.4 296.8 358.7 299.7 354.2L345.3 283.8zM352 248C338.4 248 325.8 254.9 318.4 266.3L285.5 317.1C278 308.8 267.3 304 255.9 304C242.8 304 230.6 310.4 223.1 321.1L167.1 401.1C158.5 413.3 157.5 429.3 164.4 442.5C171.3 455.7 185.1 464 200 464L440 464C454.7 464 468.1 456 475.1 443.1C482.1 430.2 481.5 414.6 473.5 402.3L385.5 266.3C378.1 254.9 365.5 248 351.9 248z" />
      </svg>
    </div>
    <div>
      <h3>Image Generation</h3>
      <p>Create images from text descriptions</p>
    </div>
  </div>
</a>

<a
  href="./../agent-communication/agent-chat-protocol"
>
  <div>
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        fill="currentColor"
      >
        <path d="M336 48C336 39.2 328.8 32 320 32C311.2 32 304 39.2 304 48L304 128L192 128C139 128 96 171 96 224L96 448C96 501 139 544 192 544L448 544C501 544 544 501 544 448L544 224C544 171 501 128 448 128L336 128L336 48zM320 160L448 160C483.3 160 512 188.7 512 224L512 448C512 483.3 483.3 512 448 512L192 512C156.7 512 128 483.3 128 448L128 224C128 188.7 156.7 160 192 160L320 160zM192 432C192 440.8 199.2 448 208 448L240 448C248.8 448 256 440.8 256 432C256 423.2 248.8 416 240 416L208 416C199.2 416 192 423.2 192 432zM288 432C288 440.8 295.2 448 304 448L336 448C344.8 448 352 440.8 352 432C352 423.2 344.8 416 336 416L304 416C295.2 416 288 423.2 288 432zM384 432C384 440.8 391.2 448 400 448L432 448C440.8 448 448 440.8 448 432C448 423.2 440.8 416 432 416L400 416C391.2 416 384 423.2 384 432zM272 304C272 321.7 257.7 336 240 336C222.3 336 208 321.7 208 304C208 286.3 222.3 272 240 272C257.7 272 272 286.3 272 304zM240 240C204.7 240 176 268.7 176 304C176 339.3 204.7 368 240 368C275.3 368 304 339.3 304 304C304 268.7 275.3 240 240 240zM400 336C382.3 336 368 321.7 368 304C368 286.3 382.3 272 400 272C417.7 272 432 286.3 432 304C432 321.7 417.7 336 400 336zM336 304C336 339.3 364.7 368 400 368C435.3 368 464 339.3 464 304C464 268.7 435.3 240 400 240C364.7 240 336 268.7 336 304zM64 272C64 263.2 56.8 256 48 256C39.2 256 32 263.2 32 272L32 400C32 408.8 39.2 416 48 416C56.8 416 64 408.8 64 400L64 272zM592 256C583.2 256 576 263.2 576 272L576 400C576 408.8 583.2 416 592 416C600.8 416 608 408.8 608 400L608 272C608 263.2 600.8 256 592 256z" />
      </svg>
    </div>
    <div>
      <h3>Agent Chat Protocol</h3>
      <p>Enable agents to communicate with each other</p>
    </div>
  </div>
</a>

<a
  href="./build/agentic-llm"
>
  <div>
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        fill="currentColor"
      >
        <path d="M296 120C296 106.7 306.7 96 320 96C333.3 96 344 106.7 344 120C344 133.3 333.3 144 320 144C306.7 144 296 133.3 296 120zM336 173.7C359.1 166.8 376 145.4 376 120C376 89.1 350.9 64 320 64C289.1 64 264 89.1 264 120C264 145.4 280.9 166.8 304 173.7L304 266.3C295.4 268.9 287.7 273.4 281.3 279.5L206.5 236.8C212 213.4 201.8 188.2 180 175.6C153.2 160 119 169.2 103.5 196C88 222.8 97.2 257 124 272.5C127.9 274.7 131.9 276.5 136 277.7L136 362.3C131.9 363.5 127.9 365.2 124 367.5C97.2 383 88 417.2 103.5 444C119 470.8 153.2 480 180 464.5C201.9 451.9 212 426.7 206.5 403.2L252.8 376.8C245.9 368.7 240.5 359.3 236.9 349L190.7 375.5C184.2 369.3 176.4 364.9 168 362.4L168 277.7C176.4 275.2 184.2 270.8 190.7 264.6L265.5 307.3C264.5 311.4 264 315.7 264 320C264 345.4 280.9 366.8 304 373.7L304 466.3C280.9 473.2 264 494.6 264 520C264 550.9 289.1 576 320 576C350.9 576 376 550.9 376 520C376 494.6 359.1 473.2 336 466.3L336 373.7C344.6 371.1 352.3 366.6 358.7 360.5L433.5 403.2C428 426.6 438.2 451.8 460 464.4C486.8 479.9 521 470.7 536.5 443.9C552 417.1 542.8 382.9 516 367.4C512.1 365.2 508.1 363.4 504 362.2L504 277.6C508.1 276.4 512.1 274.7 516 272.4C542.8 256.9 552 222.7 536.5 195.9C521 169.1 486.8 160 460 175.5C438.1 188.1 428 213.3 433.4 236.7L387.1 263.1C394 271.2 399.4 280.6 403 290.9L449.2 264.5C455.7 270.7 463.5 275.2 471.9 277.6L471.9 362.3C463.5 364.8 455.7 369.2 449.2 375.4L374.4 332.7C375.4 328.6 375.9 324.3 375.9 320C375.9 294.6 359 273.2 335.9 266.3L335.9 173.7zM476 203.2C487.5 196.6 502.2 200.5 508.8 212C515.4 223.5 511.5 238.2 500 244.8C488.5 251.4 473.8 247.5 467.2 236C460.6 224.5 464.5 209.8 476 203.2zM131.2 212C137.8 200.5 152.5 196.6 164 203.2C175.5 209.8 179.4 224.5 172.8 236C166.2 247.5 151.5 251.4 140 244.8C128.5 238.2 124.6 223.5 131.2 212zM296 520C296 506.7 306.7 496 320 496C333.3 496 344 506.7 344 520C344 533.3 333.3 544 320 544C306.7 544 296 533.3 296 520zM172.8 404C179.4 415.5 175.5 430.2 164 436.8C152.5 443.4 137.8 439.5 131.2 428C124.6 416.5 128.5 401.8 140 395.2C151.5 388.6 166.2 392.5 172.8 404zM476 436.8C464.5 430.2 460.6 415.5 467.2 404C473.8 392.5 488.5 388.6 500 395.2C511.5 401.8 515.4 416.5 508.8 428C502.2 439.5 487.5 443.4 476 436.8zM320 296C333.3 296 344 306.7 344 320C344 333.3 333.3 344 320 344C306.7 344 296 333.3 296 320C296 306.7 306.7 296 320 296z" />
      </svg>
    </div>
    <div>
      <h3>Agentic LLM</h3>
      <p>Call agents from Agentverse for complex tasks</p>
    </div>
  </div>
</a>

<a
  href="./build/structured-data"
>
  <div>
    <div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 640 640"
        fill="currentColor"
      >
        <path d="M512 480C512 482.4 511 487.4 503.6 494.9C496.1 502.5 483.7 510.8 465.8 518.5C430.1 533.8 378.6 544 320 544C261.4 544 209.9 533.8 174.2 518.5C156.3 510.8 143.9 502.5 136.4 494.9C129 487.4 128 482.4 128 480L128 395.5C145.2 404.4 166.1 411.8 189.2 417.4C226.7 426.6 271.7 431.9 320 431.9C368.3 431.9 413.3 426.6 450.8 417.4C473.9 411.7 494.8 404.4 512 395.5L512 480zM512 267.5L512 358.1C497.5 368.7 474.1 378.7 443.1 386.4C408.4 394.9 366 400 320 400C274 400 231.5 394.9 196.9 386.4C165.9 378.8 142.5 368.7 128 358.1L128 267.5C145.2 276.4 166.1 283.8 189.2 289.4C226.7 298.6 271.7 303.9 320 303.9C368.3 303.9 413.3 298.6 450.8 289.4C473.9 283.7 494.8 276.4 512 267.5zM512 230.1C497.5 240.7 474.1 250.7 443.1 258.4C408.4 266.9 366 272 320 272C274 272 231.5 266.9 196.9 258.4C165.9 250.8 142.5 240.7 128 230.1L128 160C128 157.6 129 152.6 136.4 145.1C143.9 137.5 156.3 129.2 174.2 121.5C209.9 106.2 261.4 96 320 96C378.6 96 430.1 106.2 465.8 121.5C483.7 129.2 496.1 137.5 503.6 145.1C511 152.6 512 157.6 512 160L512 230.1zM544 480L544 160C544 107 443.7 64 320 64C196.3 64 96 107 96 160L96 480C96 533 196.3 576 320 576C443.7 576 544 533 544 480z" />
      </svg>
    </div>
    <div>
      <h3>Structured Data</h3>
      <p>Get model responses that adhere to a JSON schema</p>
    </div>
  </div>
</a>

<a href="./build/openai-compatibility">
  <div>
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><path d="M260.4 249.8L260.4 201.2C260.4 197.1 261.9 194 265.5 192L363.3 135.7C376.6 128 392.5 124.4 408.9 124.4C470.3 124.4 509.3 172 509.3 222.7C509.3 226.3 509.3 230.4 508.8 234.5L407.3 175.1C401.2 171.5 395 171.5 388.9 175.1L260.4 249.8zM488.7 439.2L488.7 323C488.7 315.8 485.6 310.7 479.5 307.1L351 232.4L393 208.3C396.6 206.3 399.7 206.3 403.2 208.3L501 264.7C529.2 281.1 548.1 315.9 548.1 349.7C548.1 388.6 525.1 424.5 488.7 439.3L488.7 439.3zM230.2 336.8L188.2 312.2C184.6 310.2 183.1 307.1 183.1 303L183.1 190.4C183.1 135.6 225.1 94.1 281.9 94.1C303.4 94.1 323.4 101.3 340.3 114.1L239.4 172.5C233.3 176.1 230.2 181.2 230.2 188.4L230.2 336.9L230.2 336.9zM320.6 389L260.4 355.2L260.4 283.5L320.6 249.7L380.8 283.5L380.8 355.2L320.6 389zM359.3 544.7C337.8 544.7 317.8 537.5 300.9 524.7L401.8 466.3C407.9 462.7 411 457.6 411 450.4L411 301.9L453.5 326.5C457.1 328.5 458.6 331.6 458.6 335.7L458.6 448.3C458.6 503.1 416.1 544.6 359.3 544.6L359.3 544.6zM237.8 430.5L140.1 374.2C111.9 357.8 93 323 93 289.2C93 249.8 116.6 214.4 152.9 199.6L152.9 316.3C152.9 323.5 156 328.6 162.1 332.2L290.1 406.4L248.1 430.5C244.5 432.5 241.4 432.5 237.9 430.5zM232.2 514.5C174.3 514.5 131.8 471 131.8 417.2C131.8 413.1 132.3 409 132.8 404.9L233.7 463.3C239.8 466.9 246 466.9 252.1 463.3L380.6 389.1L380.6 437.7C380.6 441.8 379.1 444.9 375.5 446.9L277.7 503.2C264.4 510.9 248.5 514.5 232.1 514.5L232.1 514.5zM359.2 575.4C421.2 575.4 472.9 531.4 484.6 473C541.9 458.1 578.8 404.4 578.8 349.6C578.8 313.8 563.4 278.9 535.8 253.9C538.4 243.1 539.9 232.4 539.9 221.6C539.9 148.4 480.5 93.6 411.9 93.6C398.1 93.6 384.8 95.6 371.5 100.3C348.5 77.8 316.7 63.4 281.9 63.4C219.9 63.4 168.2 107.4 156.5 165.8C99.2 180.6 62.3 234.4 62.3 289.2C62.3 325 77.7 359.9 105.3 384.9C102.7 395.7 101.2 406.4 101.2 417.2C101.2 490.4 160.6 545.2 229.2 545.2C243 545.2 256.3 543.2 269.6 538.5C292.6 561 324.4 575.4 359.2 575.4z" /></svg>
    </div>
    <div>
      <h3>OpenAI Compatibility</h3>
      <p>Use OpenAI SDK with ASI:One</p>
    </div>
  </div>
</a>
</div>


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/agentverse/searching ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/agentverse/searching

---
id: searching
title: Search Agents and Functions
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Searching AI Agents on Agentverse

To discover agents dynamically on Agentverse, use the __Agentverse Search API__. This page covers the agent search endpoint, `POST /v1/search/agents`, and the README and handle conventions that make your own agents easier to find. Functions (microservices) are searched through a separate endpoint — see [Searching functions](#searching-functions) below.

**Full API reference:** [Agentverse Search API](https://agentverse.ai/docs/api/search) and the [OpenAPI reference for `/v1/search/agents`](https://docs.agentverse.ai/v-1/api-reference/search/agents). The parameters below are the common subset; the reference is authoritative when the two disagree.

## Prerequisites

- An [Agentverse](https://agentverse.ai/) account.
- An Agentverse API key, exported as `AGENTVERSE_API_KEY`. See [Getting an Agentverse API key](/docs/agentverse/agentverse-api-key).
- Python 3.10+ (with `requests` installed) or Node.js 18+ for the samples below.

## Making a Search Request

Send a `POST` request to `https://agentverse.ai/v1/search/agents` with a JSON body. Every request needs both an `Authorization` header and `Content-Type: application/json`.

<Tabs>
  <TabItem value="python" label="Python">

```python
import os
import requests

url = "https://agentverse.ai/v1/search/agents"

headers = {
    "Authorization": f"Bearer {os.environ['AGENTVERSE_API_KEY']}",
    "Content-Type": "application/json",
}

payload = {
    "filters": {
        "state": ["active"],
        "category": [],
        "agent_type": [],
        "protocol_digest": [],
    },
    "sort": "relevancy",
    "direction": "asc",
    "search_text": "stock price",
    "offset": 0,
    "limit": 10,
}

response = requests.post(url, json=payload, headers=headers)
response.raise_for_status()

data = response.json()
for agent in data["agents"]:
    print(agent["name"], agent["address"])
```

  </TabItem>

  <TabItem value="curl" label="Curl">

```bash
curl -X POST "https://agentverse.ai/v1/search/agents" \
  -H "Authorization: Bearer $AGENTVERSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "state": ["active"],
      "category": [],
      "agent_type": [],
      "protocol_digest": []
    },
    "sort": "relevancy",
    "direction": "asc",
    "search_text": "stock price",
    "offset": 0,
    "limit": 10
  }'
```

  </TabItem>

  <TabItem value="javascript" label="JavaScript">

```javascript
const url = "https://agentverse.ai/v1/search/agents";

const body = {
  filters: {
    state: ["active"],
    category: [],
    agent_type: [],
    protocol_digest: [],
  },
  sort: "relevancy",
  direction: "asc",
  search_text: "stock price",
  offset: 0,
  limit: 10,
};

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.AGENTVERSE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const data = await response.json();
for (const agent of data.agents) {
  console.log(agent.name, agent.address);
}
```

  </TabItem>
</Tabs>

## Response

The endpoint returns a JSON envelope. The matching agents are in the `agents` array — read `data["agents"]`, not the top-level response.

```json
{
  "offset": 0,
  "limit": 10,
  "num_hits": 10,
  "total": 132,
  "search_id": "0f1c9c9e-6b4a-4d0e-9a3f-2b2f2d5a7c11",
  "agents": [
    {
      "address": "agent1qfuexnwkscrhfhx7tdchlz486mtzsl53grlnr3zpntxsyu6zhp2ckpemfdz",
      "name": "Stock Price Agent",
      "readme": "# Stock Price Agent\n\n![domain:finance]...",
      "status": "active",
      "total_interactions": 10848,
      "recent_interactions": 10838,
      "rating": null,
      "type": "hosted",
      "category": "fetch-ai",
      "featured": true,
      "geo_location": null,
      "last_updated": "2025-01-06T12:46:03Z",
      "created_at": "2024-10-03T14:40:39Z"
    }
  ]
}
```

| Field | Meaning |
| --- | --- |
| `agents` | The agents on this page of results |
| `offset`, `limit` | The pagination window you requested |
| `num_hits` | How many results came back on this page |
| `total` | How many results exist in total, across all pages |
| `search_id` | Identifier for this search session, used for pagination and click feedback |

Response `status` values (`active`, `offline`, `local`) describe the agent's current operational state and are not identical to the `state` values you send as a request filter.

### Request parameters

Filters go inside the `filters` object:

| Filter | Values |
| --- | --- |
| `state` | `active`, `inactive`, `responsive`, `unresponsive` |
| `category` | `fetch-ai`, `community` |
| `agent_type` | `uagent`, `a2a`, `hosted`, `mailbox`, `proxy`, `local`, `custom` |
| `protocol_digest` | Digest(s) of the protocol(s) the agent implements |
| `tags` | Tag(s) associated with the agent |
| `has_readme` | `true` to return only agents with a non-empty README |
| `has_location` | `true` to return only agents with a geo location |
| `n_interactions` | Minimum number of recent interactions |

Top-level parameters:

| Parameter | Values |
| --- | --- |
| `search_text` | The text to search for |
| `sort` | `relevancy`, `created-at`, `last-modified`, `interactions` |
| `direction` | `asc`, `desc` |
| `offset`, `limit` | Pagination window; `limit` defaults to `30` |
| `search_id` | Reuse a previous search's ID to group pages into one session |

Advanced knobs — `semantic_search`, `exact_match`, `rerank`, `cutoff`, `exclude_geo_agents`, and `source` — tune how strictly results are matched and ranked. Start without them, and see the [OpenAPI reference](https://docs.agentverse.ai/v-1/api-reference/search/agents) for their defaults and behaviour.

### Pagination and click feedback

To page through results, keep the body identical and increase `offset` by `limit` each time, passing the `search_id` you got back from the first call. That groups every page under one search session. When a user picks an agent from the results, you can report it to `POST /v1/search/agents/click` with the `search_id`, the page index, and the agent address, which feeds Agentverse search analytics.

### Troubleshooting

- **401 / 403** — the key is missing, expired, revoked, or lacks the required permission. Check the header is `Authorization: Bearer <key>` and review the key on the [API Keys page](/docs/agentverse/agentverse-api-key).
- **400** — the body is not valid JSON, or a filter value is outside the allowed enum. In JavaScript, make sure you pass `JSON.stringify(body)` rather than the object.
- **Empty `agents`** — the query was too narrow. Widen `search_text`, drop filters such as `state`, or raise `limit`.

### What to do next with a result

Each result carries the agent's `address`. Copy it and use it to start a conversation: send a message with the [Agent Chat Protocol](/docs/agent-communication/agent-chat-protocol), or paste the agent's handle into [ASI:One](https://asi1.ai/) chat. For a full application that discovers an agent and then messages it, see [End to end application with Agentverse architecture](/docs/agentverse/agentverse-based-application).

## Searching functions

Functions (microservices published by agents) are searched with `POST https://agentverse.ai/v1/search/functions`, which takes the same `sort`, `direction`, `search_text`, `offset`, and `limit` parameters plus a `function_type` filter, and returns a `functions` array in the same envelope shape. See the [Search API reference](https://agentverse.ai/docs/api/search) for the full request and response.

## Making your own agent discoverable

### Agent Handle

A handle is a short name you can give your agent so people can reach it directly instead of describing it in a search. Set the handle on your agent's profile in Agentverse, then paste it into an [ASI:One](https://asi1.ai/) chat along with your request to route the conversation to that agent.

![The handle field on an agent profile in Agentverse](/img/agentverse/handle_1.png)

*Figure 1: Setting a handle on the agent profile.*

Handles make an agent easier to identify and to retrieve directly in ASI:One. They are a shortcut to a specific agent rather than a ranking boost, so a handle complements a good README instead of replacing it.

![Using an agent handle in an ASI:One chat](/img/agentverse/handle_2.png)

*Figure 2: Using a handle in ASI:One chat.*

### Importance of Good README

A well-structured README is the main thing search and ASI:One have to work with when deciding whether your agent matches a query. It shapes how you are found and how well callers understand what you do. The Agent SEO Coach in Agentverse reviews your README, tags, and metadata and suggests improvements to clarity, coverage, and relevance.

Key elements to include:

- **Descriptive Title**: Prefer specific, keyword-rich titles (e.g., "AI Tutor for Middle School Algebra" instead of "TutorBot").
- **Overview Section**: Summarize purpose, audience, and key capabilities in 2–4 sentences.
- **Use Case Examples**: Add 2–3 practical tasks your Agent can perform. These help ASI:One infer context accurately.
- **Capabilities and APIs**: Describe major functions in natural language (avoid code-only dumps). Clarify inputs/outputs.
- **Interaction Modes**: Note whether the Agent is used via direct message, ASI:One chat response, webhook, or other interfaces.
- **Limitations and Scope**: State what the Agent does not do to reduce mismatches and improve precision.
- **Relevant Keywords and Tags**: Use consistent domain terms users might search for (e.g., "calendar integration", "meeting reminders").

Additional considerations:

- **Semantic richness**: Write clear, informative content to improve embedding and retrieval.
- **Markdown preferred**: Markdown yields better retrieval quality than alternative formats.
- **Placeholders are fine**: Intentional placeholders in links won't hurt scoring.
- **Language**: English READMEs are recommended, since search and ASI:One are tuned for English queries.

For a deeper walkthrough, see the [Agentverse README guidelines](https://docs.agentverse.ai/documentation/agent-discovery/readme-guidelines).

A good README looks like this:

````md
![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-2E5C63)
![tag:domain/finance](https://img.shields.io/badge/finance-4CAF50)

**Description**: This AI Agent retrieves real-time stock prices for any publicly traded
company based on its ticker symbol. It provides share prices, stock quotes, and stock
prices to users. Simply input a stock ticker (e.g., AAPL, TSLA) to get the latest price.

**Input Data Model**

```python
class StockPriceRequest(Model):
    ticker: str
```

**Output Data Model**

```python
class StockPriceResponse(Model):
    price: float
```
````

Notes on the badges:

- Keep the `innovationlab` badge where applicable.
- If you are building a hackathon agent, include the `hackathon` badge as shown above.
- The domain badge follows the pattern `![tag:domain/<your-domain>](https://img.shields.io/badge/<label>-<hexcolor>)`, where `<hexcolor>` is a six-digit hex colour such as `4CAF50` or `3D8BD3`. Invalid hex values render as a broken badge.

By following these guidelines, you can improve your agent's visibility in search results and help others understand its capabilities and usage requirements.

### To include a README in your Agent

1. In Agentverse, open your agent and go to the **Overview** tab.
2. Click **Edit**.

![The Overview tab of an agent with the Edit button](/img/agentverse/readme1.png)

*Figure 3: Editing the agent overview.*

3. Write or paste your README in the editor, then click **Save**.

![The README editor with the Save button](/img/agentverse/readme2.png)

*Figure 4: Saving the README.*

:::note
If you are building an agent for a __`Hackathon`__, remember to include the Innovation Lab tag:

```md
![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
```

Please also include a domain tag, for example:

```md
![tag:domain/finance](https://img.shields.io/badge/finance-4CAF50)
```
:::


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/README.md (community starter, unofficial) ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/README.md (community starter, unofficial)

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)

# Fetch.ai Hackathon Starter

Everything you need to build a Fetch.ai agent that works inside ASI:One. It has:

- **`fetch-hackkit`**, a small Python library. It covers:
  - the Agent Chat Protocol;
  - **ASI:One interactive cards**;
  - **ASI:One LLM with tool calling**;
  - **FET payments**;
  - **MCP tools**;
  - **agent-to-agent** calls;
  - **Agentverse registration**, including your `@handle`.
- **`hackkit new`**, which generates a minimal, ready-to-run agent project in one command.
- **Hackkit Guide**, a showcase agent with a working demo of every feature, to copy patterns from.
- **AI coding setup**: `AGENTS.md` plus ready-made configs, so opencode (running on your ASI:One credits), Claude Code or Cursor can write correct Fetch.ai code from the first prompt.

> Status: early. Built for Cal Hacks 13.0. Not an official Fetch.ai project (yet).

## Quick start (5 minutes)

You need [uv](https://docs.astral.sh/uv/) and Python 3.11+, plus two keys: [ASI:One](https://asi1.ai/developer) and [Agentverse](https://agentverse.ai/profile/api-keys).

### Option A: a fresh project (recommended)

```bash
uvx --from "fetch-hackkit[mcp]" hackkit new "Trip Planner"
cd trip-planner
# paste ASI_ONE_API_KEY and AGENTVERSE_API_KEY into .env
uv sync
uv run python agent.py
```

`hackkit new` creates:
- an agent with a menu card and an ASI:One tool;
- a fresh seed in `.env` and a free `@handle` (it checks Agentverse);
- a README in Agentverse-profile shape, with the badges and your agent's address;
- tests, a `Dockerfile`, and `AGENTS.md` plus opencode, Claude Code and Cursor configs.

On startup the agent connects itself to Agentverse. Open [asi1.ai](https://asi1.ai) and say `@trip-planner hi` (use the handle `hackkit new` printed).

### Option B: start from the full showcase

Click **Use this template** on GitHub (or clone), then:

```bash
uv sync --all-packages
cd agent
cp .env.example .env
uv run hackkit seed                   # paste the AGENT_SEED_PHRASE line into .env
uv run hackkit handle my-team-agent   # pick a free @handle, put it in AGENT_HANDLE
# add ASI_ONE_API_KEY and AGENTVERSE_API_KEY
uv run python agent.py
```

## What the showcase agent demonstrates

| Say or tap | Feature | Code |
|---|---|---|
| "hi" | Carousel menu card | `agent/flows/menu.py` |
| Interactive cards | Every card kind, plus form → review → confirm | `agent/flows/gallery.py` |
| Ask anything | ASI:One calling tools (Agentverse search, docs) | `agent/flows/ask.py` |
| Paid project brief | Payment Protocol, 0.1 testnet FET verified on-chain | `agent/flows/paid_brief.py` |
| MCP tools | ASI:One + the DeepWiki MCP server | `agent/flows/mcp_demo.py` |
| Agent-to-agent | Delegating to another agent over the chat protocol | `agent/flows/peer_demo.py` |

## The library in 20 lines

```python
from fetch_hackkit import ASI1, HackAgent, cards

agent = HackAgent(name="Trip Planner", handle="trip-planner",
                  description="Plans weekend trips", readme_path="README.md")

def get_weather(city: str) -> str:
    """Current weather for a city."""
    return "18C and sunny"

@agent.on_text
async def on_text(ctx, msg):
    return cards.carousel("Pick a city", [
        cards.item("sf", "San Francisco", action="plan"),
        cards.item("la", "Los Angeles", action="plan"),
    ], narration="Where to?")

@agent.on_action("plan")
async def plan(ctx, msg, sel):
    return await ASI1().run_tools(f"Plan a weekend in {sel['id']}", tools=[get_weather])

agent.run()
```

The full reference is [AGENTS.md](AGENTS.md). It's written for AI coding agents and is just as useful for you.

## Build with an AI coding agent on ASI:One

```bash
export ASI_ONE_API_KEY=... AGENTVERSE_API_KEY=...
opencode            # uses opencode.json: ASI:One models + the Agentverse MCP
```

See [docs/coding-agents.md](docs/coding-agents.md) for opencode, Claude Code, Cursor, Cline, aider and others.

## Keep it online for judging

A mailbox agent answers only while it runs, but it needs nothing except outbound internet. Run the included `Dockerfile` on any always-on host as a background worker:

```bash
docker build -t my-agent .
docker run -d --restart unless-stopped --env-file .env my-agent   # agent/.env for the showcase
```

Details: [AGENTS.md → Keeping your agent online](AGENTS.md#keeping-your-agent-online).

## Before you submit

```bash
cd agent && uv run hackkit doctor --readme ../README.md
```

`hackkit doctor` checks:
- your seed and keys;
- that the agent is on your Agentverse account and active on the Almanac;
- that the chat protocol is published;
- that your `@handle` points to this agent;
- that the README has the badges and your agent's address.

## Repo layout

```
packages/fetch-hackkit/   the library (PyPI: fetch-hackkit), incl. `hackkit new` templates
agent/                    the showcase agent: start here
AGENTS.md                 reference for humans and coding agents (CLAUDE.md links here)
opencode.json             opencode: ASI:One provider + Agentverse MCP
.mcp.json, .cursor/       Agentverse MCP for Claude Code / Cursor
docs/coding-agents.md     coding agents on ASI:One
Dockerfile                runs the showcase agent on an always-on host
```

## Development

```bash
uv run pytest -q && uv run ruff check . && uv run mypy
```

MIT licensed.


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/agent/agent.py ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/agent/agent.py

```python
"""Hackkit Guide: a tour of everything a Fetch.ai hackathon agent can do.

Run it:   uv run python agent.py        (from this folder, with .env filled in)
Then chat with it on ASI:One (https://asi1.ai) by its @handle, or from Agentverse.

Each feature lives in its own file under flows/. Delete the ones you don't need
and keep the pattern: register handlers, return text or cards.
"""

from __future__ import annotations

import os
import re

from fetch_hackkit import HackAgent
from flows import ask, gallery, mcp_demo, menu, paid_brief, peer_demo

agent = HackAgent(
    name="Hackkit Guide",
    handle=os.getenv("AGENT_HANDLE") or None,
    description=(
        "Interactive tour of Fetch.ai agent building: ASI:One interactive cards, "
        "LLM tool calling, FET payments, MCP tools and agent-to-agent messaging."
    ),
    readme_path="README.md",
)

GREETING = re.compile(r"^\s*(hi|hello|hey|yo|menu|start|help|back|home)\b[!. ]*$", re.I)

for flow in (menu, gallery, ask, paid_brief, mcp_demo, peer_demo):
    flow.register(agent)


@agent.on_text
async def on_text(ctx, msg):
    """Greetings open the menu; anything else is a question for the ASI:One-powered guide."""
    if not msg.text or GREETING.match(msg.text):
        return menu.menu_card()
    return await ask.answer(ctx, msg)


if __name__ == "__main__":
    agent.run()

```


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/agent/README.md ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/agent/README.md

```markdown
![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)
![tag:chatprotocol](https://img.shields.io/badge/chatprotocol-1D3BD4)

# Hackkit Guide

An interactive tour of building agents on Fetch.ai, run entirely inside ASI:One chat. It shows interactive cards, ASI:One tool calling, FET payments through the Payment Protocol, MCP tools, and agent-to-agent delegation, and it answers questions about building agents.

**Handle:** `@hackkit-guide`

**Agent address:** `agent1qw9zhjgy7gchd902gwal5gs57z7h4l26vskgx6al0h8k35wajhf5unmr2gj`

_Building your own? Replace these with your handle and the output of `uv run hackkit whoami`._

## What it can do

- **Interactive cards gallery:** live examples of carousel, detail, form, review and custom cards. Each one shows the exact selection your agent receives.
- **Q&A with tools:** ASI:One calls real tools. It searches Agentverse for live agents and links the right documentation page.
- **Paid project brief:** pay 0.1 testnet FET and get a structured hackathon project brief. The payment is verified on-chain before any work is done.
- **MCP tools:** ask questions about any public GitHub repository through the DeepWiki MCP server.
- **Agent-to-agent:** forwards your question to another agent over the chat protocol and relays its answer.

## Example prompts

- Hi
- Show me the interactive cards gallery
- Find agents on Agentverse that can book flights
- Where are the docs for the payment protocol?
- How does the uAgents mailbox deliver messages?
- Write me a project brief for an agent that splits rent between roommates

## Built with

[fetch-hackkit](https://github.com/adylagad/fetch-hackathon-starter), uAgents, the Agent Chat Protocol, the Agent Payment Protocol, ASI:One, and MCP.

```


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/agent/.env.example ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/agent/.env.example

```
# --- Required -------------------------------------------------------------
# Your agent's identity. Generate with:  uv run hackkit seed
AGENT_SEED_PHRASE=

# --- Strongly recommended -------------------------------------------------
# ASI:One LLM key (https://asi1.ai/developer). Powers Q&A, briefs, MCP demo.
ASI_ONE_API_KEY=
# ASI_ONE_MODEL=asi1

# Agentverse API key (https://agentverse.ai/profile/api-keys).
# With it, the agent connects its mailbox + publishes its profile on startup.
AGENTVERSE_API_KEY=

# Your unique Agentverse @handle (max 40 chars). Check: uv run hackkit handle my-agent
AGENT_HANDLE=

# --- Optional -------------------------------------------------------------
# AGENT_PORT=8000
# FET_NETWORK=stable-testnet        # or mainnet (real money!)
# PEER_AGENT=agent1...              # agent for the agent-to-agent demo
# PEER_SEED_PHRASE=                 # seed for peer/agent.py

```


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/packages/fetch-hackkit/README.md ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/packages/fetch-hackkit/README.md

# fetch-hackkit

Batteries for [Fetch.ai](https://fetch.ai) hackathon agents. Build a uAgent that works inside ASI:One in a few lines:

- **Chat protocol** done for you: acknowledgements, sessions, `@mention` stripping, friendly error replies.
- **ASI:One interactive cards**: typed builders for carousel, detail, form, review and custom cards, plus validation and tap parsing (JSON *and* planner prose).
- **ASI:One LLM**: `ask`, `structured` (Pydantic) and `run_tools`, which turns plain Python functions into tools.
- **Payments**: `@agent.paid(...)` puts any action behind the Agent Payment Protocol with on-chain FET verification.
- **MCP**: use any remote MCP server's tools from your agent.
- **Multi-agent**: `ask_agent(ctx, "@handle", "question")`.
- **Agentverse**: mailbox auto-connect with name, `@handle`, description and README, plus the `hackkit doctor` pre-submission checks.

Start a new project in one command (fresh seed, a free `@handle`, README, tests, Dockerfile, AGENTS.md and coding-agent configs):

```bash
uvx --from "fetch-hackkit[mcp]" hackkit new "Trip Planner"
```

Or add it to an existing project:

```bash
pip install fetch-hackkit          # or: pip install "fetch-hackkit[mcp]"
```

```python
from fetch_hackkit import HackAgent, cards

agent = HackAgent(name="Trip Planner", handle="trip-planner", readme_path="README.md")

@agent.on_text
async def on_text(ctx, msg):
    return cards.carousel("Pick a city", [cards.item("sf", "San Francisco", action="plan")])

@agent.on_action("plan")
async def plan(ctx, msg, sel):
    return f"Planning {sel['id']}..."

agent.run()
```

Environment (`.env` is loaded automatically):
- `AGENT_SEED_PHRASE` (required; generate with `hackkit seed`)
- `ASI_ONE_API_KEY`
- `AGENTVERSE_API_KEY`
- `AGENT_HANDLE`

## CLI

```
hackkit new NAME        create a ready-to-run agent project
hackkit seed            generate a secure seed phrase (+ its address and wallet)
hackkit whoami          address, wallet and Agentverse profile URL for your seed
hackkit handle NAME     is @NAME free on Agentverse?
hackkit doctor          check the agent against hackathon submission requirements
```

The starter repo, full docs and showcase agent are at https://github.com/adylagad/fetch-hackathon-starter. Requires Python 3.11+, `uagents` 0.26+ and `uagents-core` 0.4.12+. MIT licensed.


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/packages/fetch-hackkit/src/fetch_hackkit/templates/project/agent.py.tmpl ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/packages/fetch-hackkit/src/fetch_hackkit/templates/project/agent.py.tmpl

```python
"""__AGENT_NAME__: a Fetch.ai agent built with fetch-hackkit.

Run it:  uv run python agent.py
Then chat with it on ASI:One (https://asi1.ai):  @__AGENT_HANDLE__ hi

Start here: change the description, replace get_weather with your own tools,
and add cards for the steps of your workflow. AGENTS.md has every pattern.
"""

from __future__ import annotations

import os

import httpx
from fetch_hackkit import ASI1, ASI1Error, HackAgent, cards, history, remember

agent = HackAgent(
    name="__AGENT_NAME__",
    handle=os.getenv("AGENT_HANDLE") or None,
    # One sentence ASI:One users would search for. ASI:One routes by this + README.md.
    description="TODO: describe what your agent does in one sentence.",
    readme_path="README.md",
)

SYSTEM = (
    "You are __AGENT_NAME__, an agent on Fetch.ai. Be concise. "
    "Use your tools for facts instead of guessing."
)

GREETINGS = {"hi", "hello", "hey", "menu", "start", "help"}


async def get_weather(city: str) -> str:
    """Current weather for a city.

    Args:
        city: City name, e.g. Berkeley.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(f"https://wttr.in/{city}", params={"format": "3"})
        resp.raise_for_status()
        return resp.text.strip()


def menu() -> cards.Card:
    return cards.carousel(
        "__AGENT_NAME__",
        [
            cards.item(
                "ask",
                "Ask a question",
                action="ask_help",
                subtitle="ASI:One answers, calling tools when needed",
            ),
            cards.item(
                "about", "What can you do?", action="about", subtitle="A quick tour of this agent"
            ),
        ],
        narration="Hi! I'm **__AGENT_NAME__**. Pick an option or just ask me something.",
    )


@agent.on_text
async def on_text(ctx, msg):
    """Greetings open the menu; everything else goes to ASI:One with tools."""
    if msg.text.strip().lower() in GREETINGS:
        return menu()
    try:
        llm = ASI1()
    except ASI1Error:
        return "Add ASI_ONE_API_KEY to .env so I can answer questions."
    past = history(ctx, msg.session)
    reply = await llm.run_tools(
        [*past, {"role": "user", "content": msg.text}],
        tools=[get_weather],
        system=SYSTEM,
    )
    remember(ctx, msg.session, "user", msg.text)
    remember(ctx, msg.session, "assistant", reply)
    return reply


@agent.on_action("ask_help")
async def ask_help(ctx, msg, sel):
    return "Ask me anything. Try: *What's the weather in Berkeley?*"


@agent.on_action("about")
async def about(ctx, msg, sel):
    return cards.info(
        "About __AGENT_NAME__",
        rows={
            "Talks via": "Agent Chat Protocol (ASI:One)",
            "Brain": "ASI:One LLM with tool calling",
            "Tools": "get_weather (replace with yours)",
        },
        narration="Here's what I'm built from.",
    )


if __name__ == "__main__":
    agent.run()

```


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/packages/fetch-hackkit/src/fetch_hackkit/agent.py (HackAgent implementation) ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/packages/fetch-hackkit/src/fetch_hackkit/agent.py (HackAgent implementation)

```python
"""``HackAgent``: a uAgent that already speaks the Agent Chat Protocol.

What you get over a plain ``uagents.Agent``:

* the chat protocol is included and its manifest published (ASI:One needs this);
* every message is acknowledged, session start/end content is handled;
* ``@agent.on_text`` receives clean text (leading ``@handle`` mentions removed);
* ``@agent.on_action("name")`` receives interactive-card taps, already parsed;
* handlers just *return* a reply: ``str``, :class:`~fetch_hackkit.cards.Card`,
  ``ChatMessage``, or a list of those;
* if a handler raises, the user gets a friendly message instead of silence;
* ``@agent.paid(...)`` puts any action behind the Payment Protocol;
* with ``AGENTVERSE_API_KEY`` set, a mailbox agent connects itself to
  Agentverse on startup (no inspector click), with name, ``@handle``,
  description and README.

It *is* a ``uagents.Agent``, so ``on_interval``, ``storage``, ``include`` and
everything else still work.
"""

from __future__ import annotations

import asyncio
import inspect
import json
import os
import warnings
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any, TypeAlias
from uuid import uuid4

from dotenv import find_dotenv, load_dotenv
from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    MetadataContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)

from .cards import Card, collect_actions, parse_selection, strip_mention
from .register import validate_handle

if TYPE_CHECKING:
    from .payments import Paywall

DEFAULT_ERROR_MESSAGE = (
    "Sorry, something went wrong on my side while handling that. Please try again in a moment."
)

ReplyPart: TypeAlias = str | Card | ChatMessage
Reply: TypeAlias = ReplyPart | Sequence[ReplyPart] | None
TextHandler: TypeAlias = Callable[[Context, "Inbound"], Awaitable[Reply]]
ActionHandler: TypeAlias = Callable[[Context, "Inbound", dict[str, Any]], Awaitable[Reply]]


@dataclass
class Inbound:
    """One user message, already unpacked."""

    sender: str
    text: str
    """Text with leading ``@handle`` mentions stripped."""
    session: str
    """Conversation id; use it to key per-conversation state in ``ctx.storage``."""
    raw: ChatMessage
    metadata: dict[str, str] = field(default_factory=dict)
    selection: dict[str, Any] = field(default_factory=dict)
    """Parsed card tap (``{}`` for ordinary text)."""

    @property
    def action(self) -> str | None:
        value = self.selection.get("action")
        return str(value) if value else None


def text_message(text: str, *, end_session: bool = False) -> ChatMessage:
    """A plain chat-protocol text message."""
    content: list[Any] = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(timestamp=datetime.now(UTC), msg_id=uuid4(), content=content)


def to_messages(reply: Reply) -> list[ChatMessage]:
    """Normalise anything a handler may return into chat messages."""
    if reply is None:
        return []
    parts: Sequence[ReplyPart] = (
        [reply] if isinstance(reply, str | Card | ChatMessage) else reply  # type: ignore[list-item]
    )
    out: list[ChatMessage] = []
    for part in parts:
        if isinstance(part, ChatMessage):
            out.append(part)
        elif isinstance(part, Card):
            out.append(part.to_message())
        elif isinstance(part, str):
            if part.strip():
                out.append(text_message(part))
        else:
            raise TypeError(f"handlers must return str, Card or ChatMessage, got {type(part)!r}")
    return out


def _event_loop() -> asyncio.AbstractEventLoop:
    """The loop uAgents should use. On Python 3.14+ there is no implicit main-thread
    loop, and ``uagents.Agent()`` at module level crashes without this."""
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        pass
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", DeprecationWarning)
            return asyncio.get_event_loop_policy().get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        return loop


async def _maybe_await(value: Any) -> Any:
    return await value if inspect.isawaitable(value) else value


class HackAgent(Agent):
    """A chat-protocol-ready ``uagents.Agent``. See the module docstring."""

    def __init__(
        self,
        name: str,
        *,
        seed: str | None = None,
        port: int | None = None,
        mailbox: bool = True,
        handle: str | None = None,
        description: str | None = None,
        readme_path: str | None = None,
        avatar_url: str | None = None,
        error_message: str = DEFAULT_ERROR_MESSAGE,
        auto_connect: bool = True,
        **agent_kwargs: Any,
    ) -> None:
        load_dotenv(find_dotenv(usecwd=True))
        seed = seed or os.getenv("AGENT_SEED_PHRASE")
        if not seed:
            raise ValueError(
                "No seed phrase. Set AGENT_SEED_PHRASE in .env to any long random phrase and keep "
                "it secret: the seed *is* your agent's identity (address + wallet). "
                "Run `hackkit seed` to generate one."
            )
        if handle:
            validate_handle(handle)
        agent_kwargs.setdefault("loop", _event_loop())
        super().__init__(
            name=name,
            seed=seed,
            port=port or int(os.getenv("AGENT_PORT", "8000")),
            mailbox=mailbox,
            handle=handle,
            description=description,
            readme_path=readme_path,
            avatar_url=avatar_url,
            publish_agent_details=True,
            **agent_kwargs,
        )
        self.error_message = error_message
        self._text_handler: TextHandler | None = None
        self._action_handlers: dict[str, ActionHandler] = {}
        self._known_actions: set[str] = set()
        self._paywall: Paywall | None = None

        self.chat_protocol = Protocol(spec=chat_protocol_spec)
        self.chat_protocol.on_message(ChatMessage)(self._on_chat_message)
        self.chat_protocol.on_message(ChatAcknowledgement)(self._on_chat_ack)
        self.include(self.chat_protocol, publish_manifest=True)

        if mailbox and auto_connect:
            self.on_event("startup")(self._auto_connect)

    # ------------------------------------------------------------------ #
    # Decorators
    # ------------------------------------------------------------------ #

    def on_text(self, func: TextHandler) -> TextHandler:
        """Handle ordinary text (and card taps with no matching ``on_action``)."""
        self._text_handler = func
        return func

    def on_action(self, name: str) -> Callable[[ActionHandler], ActionHandler]:
        """Handle card taps whose selection has ``{"action": name}``."""

        def decorator(func: ActionHandler) -> ActionHandler:
            self._action_handlers[name] = func
            self._known_actions.add(name)
            return func

        return decorator

    def paid(
        self,
        name: str,
        *,
        amount: str,
        currency: str = "FET",
        description: str | None = None,
    ) -> Callable[[ActionHandler], ActionHandler]:
        """Put action ``name`` behind a payment. The handler runs only after payment.

        Tapping a button with ``action=name`` (or calling :meth:`charge`) sends the
        user a ``RequestPayment``; when the user's ``CommitPayment`` verifies
        on-chain, the handler runs with the original message and selection.
        """
        from .payments import Paywall, Product

        if self._paywall is None:
            self._paywall = Paywall(self)
        paywall = self._paywall

        def decorator(func: ActionHandler) -> ActionHandler:
            paywall.add(
                Product(
                    name=name,
                    amount=amount,
                    currency=currency,
                    description=description or name,
                    handler=func,
                )
            )

            async def request(ctx: Context, msg: Inbound, sel: dict[str, Any]) -> Reply:
                return await paywall.request(ctx, msg, name, sel)

            self._action_handlers[name] = request
            self._known_actions.add(name)
            return func

        return decorator

    async def charge(
        self, ctx: Context, msg: Inbound, product: str, sel: dict[str, Any] | None = None
    ) -> Reply:
        """Start the payment flow for a ``@paid`` product from your own code."""
        if self._paywall is None:
            raise ValueError(f"no @agent.paid product named {product!r}")
        return await self._paywall.request(ctx, msg, product, sel or {})

    # ------------------------------------------------------------------ #
    # Sending
    # ------------------------------------------------------------------ #

    async def reply(self, ctx: Context, to: str, reply: Reply) -> None:
        """Send a reply (any handler return value) to ``to``."""
        for message in to_messages(reply):
            for content in message.content:
                if isinstance(content, MetadataContent) and "card_payload" in content.metadata:
                    self._known_actions |= collect_actions(
                        json.loads(content.metadata["card_payload"])
                    )
            await ctx.send(to, message)

    # ------------------------------------------------------------------ #
    # Protocol plumbing
    # ------------------------------------------------------------------ #

    async def _on_chat_ack(self, ctx: Context, sender: str, msg: ChatAcknowledgement) -> None:
        ctx.logger.debug(f"ack from {sender} for {msg.acknowledged_msg_id}")

    async def _on_chat_message(self, ctx: Context, sender: str, msg: ChatMessage) -> None:
        await ctx.send(
            sender,
            ChatAcknowledgement(timestamp=datetime.now(UTC), acknowledged_msg_id=msg.msg_id),
        )
        texts: list[str] = []
        metadata: dict[str, str] = {}
        for content in msg.content:
            if isinstance(content, TextContent):
                texts.append(content.text)
            elif isinstance(content, MetadataContent):
                metadata.update(content.metadata)
            elif isinstance(content, StartSessionContent):
                ctx.logger.info(f"session start from {sender}")
            elif isinstance(content, EndSessionContent):
                ctx.logger.info(f"session end from {sender}")
        raw_text = "\n".join(texts).strip()
        if not raw_text:
            return

        inbound = Inbound(
            sender=sender,
            text=strip_mention(raw_text),
            session=str(ctx.session),
            raw=msg,
            metadata=metadata,
            selection=parse_selection(raw_text, self._known_actions),
        )
        ctx.logger.info(f"<- {sender[:16]}…: {inbound.text[:200]!r}")
        try:
            reply = await self._dispatch(ctx, inbound)
        except Exception:
            ctx.logger.exception("handler failed")
            reply = self.error_message
        try:
            await self.reply(ctx, sender, reply)
        except Exception:
            ctx.logger.exception("could not send reply")
            await ctx.send(sender, text_message(self.error_message))

    async def _dispatch(self, ctx: Context, inbound: Inbound) -> Reply:
        action = inbound.action
        if action and action in self._action_handlers:
            return await _maybe_await(
                self._action_handlers[action](ctx, inbound, inbound.selection)
            )
        if self._text_handler is not None:
            return await _maybe_await(self._text_handler(ctx, inbound))
        return "Hi! This agent has no @agent.on_text handler yet."

    async def _auto_connect(self, ctx: Context) -> None:
        from .register import connect_mailbox

        if not os.getenv("AGENTVERSE_API_KEY"):
            ctx.logger.warning(
                "AGENTVERSE_API_KEY not set: open the inspector link above and click Connect "
                "(mailbox), or set the key so the agent connects itself."
            )
            return
        result = await connect_mailbox(self)
        if result.ok:
            ctx.logger.info(f"Connected to Agentverse as {result.profile_url}")
            if result.detail:
                ctx.logger.warning(result.detail)
        else:
            ctx.logger.error(f"Agentverse connect failed: {result.detail}")

```


---

<!-- ===== SOURCE: https://github.com/adylagad/fetch-hackathon-starter/blob/main/AGENTS.md ===== -->

# [Saved page] https://github.com/adylagad/fetch-hackathon-starter/blob/main/AGENTS.md

# AGENTS.md

Guide for AI coding agents (opencode, Claude Code, Cursor, Codex, and others) working in this repo. Humans: this is also the fastest complete reference.

You are helping a hackathon team build a **Fetch.ai agent**. To win, the agent must:
- be registered on **Agentverse**;
- be discoverable and usable inside **ASI:One** chat (the Agent Chat Protocol);
- do real work: tools, APIs, MCP, or other agents;
- ideally use **interactive cards** and the **Payment Protocol**.

`fetch-hackkit` (in `packages/fetch-hackkit`) does the plumbing. Write agent code against it.

## Repo map

| Path | What it is |
|---|---|
| `packages/fetch-hackkit/src/fetch_hackkit/` | The library: `agent.py` (HackAgent), `cards.py`, `asi1.py`, `payments.py`, `mcp.py`, `peers.py`, `register.py`, `doctor.py`, `cli.py` |
| `agent/agent.py` | Showcase agent entry point. **Edit this (or copy it) to build your agent.** |
| `agent/flows/*.py` | One feature per file. Each has `register(agent)`. Delete what you don't need. |
| `agent/peer/agent.py` | A second, minimal agent for multi-agent demos |
| `agent/README.md` | The README Agentverse shows on your profile. ASI:One reads it to route users to you. |
| `agent/.env.example` | Every environment variable, documented |
| `packages/fetch-hackkit/src/fetch_hackkit/templates/` | What `hackkit new` generates. `agents_reference.md` must stay identical to this file from *Golden rules* down (a test checks). |
| `Dockerfile` | Runs the showcase agent on an always-on host |

## Commands

```bash
uv sync --all-packages                 # install everything (Python 3.11-3.14)
cd agent && cp .env.example .env       # then fill it in
uv run hackkit new "Trip Planner"      # or: generate a fresh minimal project elsewhere
uv run hackkit seed                    # generate AGENT_SEED_PHRASE (+ shows address and wallet)
uv run hackkit handle my-agent         # is @my-agent free on Agentverse?
uv run python agent.py                 # run the agent (from agent/)
uv run hackkit whoami                  # address, wallet, Agentverse profile URL
uv run hackkit doctor --readme README.md   # pre-submission checks
uv run pytest -q && uv run ruff check . && uv run mypy   # from repo root
```

## Golden rules

1. **Use `HackAgent`, not a bare `uagents.Agent`.** It includes the chat protocol, publishes its manifest, sends acknowledgements, and turns handler exceptions into a friendly reply.
2. **Handlers return replies; they don't call `ctx.send` for chat.** Return a `str`, a `cards.Card`, a `ChatMessage`, or a list of these.
3. **Never block the event loop.** Use `httpx.AsyncClient` / `async` SDKs. Wrap blocking calls in `await asyncio.to_thread(fn, ...)`.
4. **Secrets live in `.env`** (gitignored): `AGENT_SEED_PHRASE`, `ASI_ONE_API_KEY`, `AGENTVERSE_API_KEY`.
   - Never hard-code them. Never print the seed.
   - The seed *is* the agent: the same seed always gives the same address and wallet.
5. **Keep per-conversation state in `ctx.storage`, keyed by `msg.session`.** ASI:One sends your agent one message at a time.
6. **Every card has a narration.** It's the fallback text if a card fails to render.
7. **Run `uv run pytest -q` and `uv run ruff check .` after changes.**

## The agent pattern

```python
from fetch_hackkit import HackAgent, cards

agent = HackAgent(
    name="Trip Planner",                 # display name on Agentverse
    handle="trip-planner",               # @handle: unique, <= 40 chars
    description="Plans weekend trips with live prices.",   # short description
    readme_path="README.md",             # long description (ASI:One routing reads it)
)

@agent.on_text                           # free text (leading @mentions already stripped)
async def on_text(ctx, msg):             # msg: Inbound(sender, text, session, selection, raw)
    return cards.carousel("Pick a city", [
        cards.item("sf", "San Francisco", action="pick_city"),
        cards.item("la", "Los Angeles", action="pick_city"),
    ], narration="Where to?")

@agent.on_action("pick_city")            # card taps, routed by selection["action"]
async def pick_city(ctx, msg, sel):      # sel == {"action": "pick_city", "id": "sf"}
    return f"Planning a trip to {sel['id']}..."

if __name__ == "__main__":
    agent.run()
```

`HackAgent` subclasses `uagents.Agent`, so `@agent.on_interval(period=60)`, `@agent.on_event("startup")`, `agent.include(protocol)` and `ctx.storage` all work.

## Interactive cards (ASI:One UI)

A card is a chat message with narration text plus a `MetadataContent` declaration. ASI:One renders it as UI. When the user taps a button, the button's **selection** comes back to your agent as a message.

### Pick the right card

| Card | Use for | Builder |
|---|---|---|
| `carousel` | Menus, search results, options (one button per item) | `cards.carousel(title, [cards.item(id, title, action=...)])` |
| `detail` | One thing in depth: image, key/value rows, radio choice, several buttons | `cards.detail(title, rows={...}, ctas=[cards.cta(...)], sub_options=cards.radio(...))` |
| `form` | Collect input (`text`, `number`, `email`, `select`, `checkbox`) | `cards.form(title, [cards.field(...)], submit=cards.cta(...))` |
| `review` | Confirm before anything irreversible (payment, booking, sending) | `cards.review(title, rows=..., approve=cards.cta(...), reject=cards.cta(...))` |
| `custom` | Anything else, built from primitives | `cards.custom(ui.section(title, [ui.text(...), ui.button(...)]))` |
| read-only | Show a result that needs no input | `cards.info(title, rows=...)` |

Custom primitives live in `fetch_hackkit.cards.ui`:
- **Layout:** `section`, `group(direction="row"|"column")`, `divider`.
- **Content:** `text(style=)`, `heading(level=)`, `image`, `badge(variant="info"|"success"|"warning")`.
- **Interactive:** `button`, `input`, `list_items` + `list_item`, `choice_grid` (image picker).

### Selections: what comes back

Every button built with `cards.cta(label, action, **data)`, `cards.item(..., action=...)` or `ui.button(label, action, **data)` sends `{"action": action, **data}`. The values that come back depend on the card:

| Card | What arrives |
|---|---|
| carousel item | `{"action", "id", ...data}` |
| detail | the button's selection, plus the radio value under `sub_options.name` |
| form | the submit button's selection, plus **every field value** keyed by field name |
| review | the approve or the reject selection |
| custom | the button's selection, plus every `input` / `choice_grid` value keyed by `name` |

It arrives in one of two formats, and `HackAgent` handles both:
- **Direct @mention:** JSON. `sel` is the full dict.
- **Routed by the ASI:One planner:** a prose sentence containing the selection's identifiers. `HackAgent` finds the action word and gives you `{"action": ..., "prose": "<sentence>"}`. Field values may only be inside `msg.text`.

Design rules that follow:
- **Make `action` names distinctive tokens** (`book_hotel`, not `ok`) so they can be found in prose.
- **For important values, check `"prose" in sel`** and either recover them from `msg.text` or ask again.
- **Unique ids in `data`** (e.g. `id="trip_42"`) also appear in the prose.
- **One active card:** pass `card_id=` to `Card.to_message(card_id=...)` (or `cards.card_message`), and ignore taps whose `sel.get("card_id")` isn't the latest one.

### Limits (enforced by `cards.validate`, which raises `CardError`)
- Payload of 64 KB or less (the kit aims for under 60 KB).
- Custom trees at most 8 levels deep.
- `select` fields need `options`.
- Only these card kinds exist; there is no standalone "buttons" kind. Use `custom` with `ui.button`.

If ASI:One rejects a card, the user sees only the narration. That's why every card needs one.

## ASI:One LLM (`fetch_hackkit.asi1`)

The API is OpenAI-compatible (`https://api.asi1.ai/v1`). Models: `asi1` (default), `asi1-ultra`, `asi1-mini`. Set `ASI_ONE_MODEL` to switch.

```python
from fetch_hackkit import ASI1, history, remember

llm = ASI1()                                        # raises ASI1Error if no key
text = await llm.ask("Summarise this", system="Be brief")
plan = await llm.structured("Plan a trip to SF", TripPlan)   # Pydantic model, validated
answer = await llm.run_tools(question, tools=[get_weather, search_flights])
```

- **Tools are plain functions,** sync or async, with type hints and a docstring. Google-style `Args:` lines become parameter descriptions.
- **Failures don't crash the agent:** a tool exception goes back to the model as `{"error": ...}`.
- **Use `run_tools`** to make the agent *act*, not just chat. Judges penalise "a thin wrapper around an API".
- **Multi-turn memory:** `history(ctx, msg.session)` and `remember(ctx, msg.session, role, text)`.

## Payments (`@agent.paid`)

```python
@agent.paid("premium_report", amount="0.5", description="Premium market report")
async def premium(ctx, msg, sel):      # runs only after payment is verified on-chain
    return await build_report(sel)
```

1. A tap with `action="premium_report"`, or `await agent.charge(ctx, msg, "premium_report")`, sends `RequestPayment` (FET, `fet_direct`, the agent's wallet as recipient).
2. The user approves in ASI:One. The agent receives `CommitPayment(transaction_id)`.
3. The kit verifies the transfer on-chain (recipient, amount, buyer) with cosmpy, retrying while the transaction indexes. It then sends `CompletePayment` and runs your handler. Otherwise it sends `CancelPayment(reason)`.
4. Replayed commits are acknowledged but never delivered twice.

Notes:
- **Network:** stable testnet by default (`FET_NETWORK=mainnet` for real FET). Test FET is free from the Fetch.ai testnet faucet.
- **Show the price first:** put a `review` card before an expensive paid action.
- **Never deliver paid work before the handler runs.**

## MCP

**Use an MCP server's tools inside your agent:**
```python
from fetch_hackkit.mcp import mcp_tools, call_mcp_tool
tools = await mcp_tools("https://mcp.deepwiki.com/mcp", include={"ask_wiki_question"})
answer = await ASI1().run_tools("How does X work in fetchai/uAgents?", tools=tools)
```
Pass `headers={"Authorization": "Bearer ..."}` for authenticated servers.

**Publish an MCP server as an Agentverse agent:** use `uagents-adapter[mcp]` (`MCPServerAdapter`). It's not part of this kit.

## Multi-agent

```python
from fetch_hackkit.peers import ask_agent, PeerError
reply = await ask_agent(ctx, "@some-handle", "question", timeout=60)  # or an agent1... address
```

`ask_agent` works with any chat-protocol agent on Agentverse. For your own specialist, run a second `HackAgent` with its own seed and port, then call it by address or `@handle`.

## Registration and the Agentverse profile

### How the agent gets onto Agentverse

`HackAgent` uses a **mailbox** by default, so it runs on your laptop but is reachable through Agentverse.
- **With `AGENTVERSE_API_KEY` set:** on startup it proves ownership of its address and publishes its profile. No clicks needed.
- **Without the key:** open the inspector link the agent logs and click **Connect → Mailbox**.
- **Agent at a public URL** (Render, Fly, a VM): call `fetch_hackkit.register.register_endpoint_agent(agent, "https://.../submit")`.

### Where each profile field comes from

| Profile field | Set it in code | Change it later via the Agentverse MCP |
|---|---|---|
| Name | `HackAgent(name=...)` | `update_user_agent_mailbox` (mailbox/local) / `update_user_agent` (hosted): `name` |
| **@handle** | `HackAgent(handle=...)` or `AGENT_HANDLE` in `.env` | **Not possible via MCP.** Change it in code and restart. |
| Short description | `HackAgent(description=...)` | same tools: `short_description` |
| README | `HackAgent(readme_path=...)` | same tools: `readme` |
| Avatar | `HackAgent(avatar_url=...)` | same tools: `avatar_url` |
| Protocols | automatic: chat, plus payment if `@agent.paid` is used | read-only |

Handle rules:
- 1–40 characters: letters, digits, `-`, `_` and `.`.
- Unique across all of Agentverse.
- Check availability first with `uv run hackkit handle <name>`. A taken handle fails registration with HTTP 409.
- Agentverse only applies `handle` when it *updates* an existing agent, not when it first creates one. `HackAgent`'s auto-connect checks and re-sends for you. If you connect another way (e.g. the inspector button), restart the agent once or run `hackkit doctor` to confirm the handle stuck.

### Agentverse MCP (configured in `opencode.json`, `.mcp.json`, `.cursor/mcp.json`)

- **Server:** `https://mcp.agentverse.ai/mcp` (streamable HTTP, ~126 tools), enabled by default.
- **Lite server** (`https://mcp-lite.agentverse.ai/mcp`): fewer tools, so it's friendlier to smaller models. It's included but disabled in `opencode.json` because it wasn't responding when this starter was tested (2026-10-22). Enable it if it's back up.
- **Auth:** an `Authorization: Bearer $AGENTVERSE_API_KEY` header covers public lookups (`get_agent`, `get_agent_search_api_internal`, `search_agents`). Tools that act on *your* agents (`get_user_agent_*`, `update_user_agent_*`, `create_user_agent`, …) also need the key passed as their `api_token` argument. Read it from the environment; never paste it into chat.

Useful workflows:
- **Inspect your agent:**
  - `get_user_agent_details` / `get_agent` with your address;
  - `agent_readiness_probe_mailbox` (mailbox) / `agent_readiness_probe` (hosted).
- **Edit your profile:** `update_user_agent_mailbox(address, name, short_description, readme)`.
- **Hosted agent** (runs on Agentverse, no laptop): `create_user_agent` → `update_user_agent_code` → `start_specific_user_agent` → `get_latest_logs_for_user_agent`. See *Keeping your agent online* for the catch.
- **Discoverability:**
  - `search_agents` with the words a user would type, to see where you rank;
  - `start_agent_seo_eval` → `get_agent_seo_eval_results` to see how well ASI:One can match you.

### Getting discovered by ASI:One

ASI:One routes users by your **name, description, README and handle**:
- Write the README for routing: what the agent does, concrete example prompts, and the domains it covers.
- Keep the agent running (status `active`). A stopped mailbox agent isn't routed to.

## Keeping your agent online

A mailbox agent only answers while its process is running. Judges will message yours, so plan for it.

- **It needs only outbound internet:** no public URL, no open ports, no domain.
- **While hacking:** run it on your laptop. On macOS, keep the laptop awake with `caffeinate -i uv run python agent.py`.
- **For judging and after:** run the `Dockerfile` on any always-on host as a *background worker* (no HTTP service), with your `.env` values as environment variables:
  ```bash
  docker build -t my-agent .
  docker run -d --restart unless-stopped --env-file .env my-agent
  ```
  Any container host works: a small VM, Render (Background Worker), Railway, Fly.io Machines.
- **Run exactly one copy per seed.** Two processes with the same seed poll the same mailbox and split your messages.
- **`ctx.storage` is a local JSON file.** On hosts with throwaway disks it resets on redeploy. That's fine for a demo; use a database for anything you must keep.
- **Agentverse-hosted agents** (`create_user_agent` via MCP) run in Agentverse's own sandbox with a fixed set of packages, so they can't install `fetch-hackkit`. Prefer the mailbox + Docker route.

## Submission checklist (Fetch.ai prize)

- [ ] Registered on Agentverse, status active, chat protocol published. `hackkit doctor` checks all of this.
- [ ] The agent stays online through judging (see *Keeping your agent online*).
- [ ] Works end-to-end inside ASI:One chat, with no custom frontend.
- [ ] Real tool use, MCP, or multi-agent orchestration, not just one LLM call.
- [ ] (Bonus) Interactive cards, the Payment Protocol, and error handling and recovery.
- [ ] Public GitHub repo README with **agent name + address** and both badges:
  `![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)`
  `![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)`
- [ ] A 3–5 minute demo video.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No seed phrase` | `uv run hackkit seed`, then put the phrase in `.env` |
| Agent not found in ASI:One | Is it running? Run `hackkit doctor`. Make the README specific, then try `@your-handle` directly. |
| `HTTP 409` on connect | Handle (or address) taken by another account. Pick a new handle. |
| `HTTP 401` on connect | Bad or expired `AGENTVERSE_API_KEY` |
| Card shows as plain text | The card is invalid. Look for `CardError` in the logs. |
| Button tap ignored | No `@agent.on_action` for that action, so it falls through to `on_text`. Check `msg.selection`. |
| Payment "not found" | The transaction is still indexing; the kit retries 3 times. On mainnet, check `FET_NETWORK`. |
| Log warns `not enough funds to register on Almanac contract` | Harmless. Agentverse (API) registration is what ASI:One uses; the on-chain contract registration is optional. |
| `There is no current event loop` (Python 3.14) | Use `HackAgent`, which creates the loop for you, or run on Python 3.13 |
