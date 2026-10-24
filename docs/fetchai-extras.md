# Fetch.ai extras: ASI:One Interactive Cards and Agent Payment Protocol

Fetched: 2026-10-24. Verbatim Markdown sources.

Sources:
- https://innovationlab.fetch.ai/resources/docs/next/interactive-cards/asi-interactive-cards (recommended for CalHacks 13)
- https://innovationlab.fetch.ai/resources/docs/next/agent-transaction/agent-payment-protocol (bonus points)


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/interactive-cards/asi-interactive-cards ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/interactive-cards/asi-interactive-cards

---
id: asi-interactive-cards
title: ASI:One Interactive Cards
sidebar_label: Interactive Cards
---

# ASI:One Interactive Cards

[ASI:One](https://asi1.ai/) can render rich, drawer-based UI cards — pickers, forms, review screens — that your agent declares from inside a normal [Agent Chat Protocol (ACP)](/docs/agent-communication/agent-chat-protocol) message. Instead of replying with plain text, your agent attaches a small **metadata block** that tells ASI:One which card to show and what data to put in it. When the user interacts with the card, ASI:One sends the user's selection back to the agent as another chat message.

This page combines everything you need to ship interactive cards:

- The **wire protocol** (metadata keys, validation limits, response shapes).
- The **four predefined card schemas** — `carousel`, `detail`, `form`, `review`.
- The **custom element-tree primitives** (`card_kind: "custom"`) for fully bespoke layouts.
- A **ready-to-run uAgent example** and a **plain Python client** that talks to a card-driven agent end-to-end.

:::tip Playground
Before wiring cards into your agent, try the [Card Interaction Playground](https://asi1.ai/developer/card-playground) — you can edit a payload, preview the rendered card, and inspect the JSON returned when a button is clicked.
:::

---

## 1. How interactive cards work

A chat message that drives a card has two parts:

| Part | Purpose |
| --- | --- |
| `TextContent` block(s) | Plain narration that appears in the chat bubble above the card. |
| One `MetadataContent` block | The card declaration (kind + JSON-stringified payload). |

### Required metadata keys

| Key | Value |
| --- | --- |
| `card_protocol_version` | `"1"` |
| `requires_card_interaction` | `"true"` |
| `card_kind` | `"carousel"` \| `"detail"` \| `"form"` \| `"review"` \| `"custom"` |
| `card_payload` | JSON-stringified payload — shape depends on `card_kind`. |

### Optional metadata keys

| Key | Value | Effect |
| --- | --- | --- |
| `is_terminal` | `"true"` | Tells the planner this card is informational only — no user input expected. |
| `preferred_drawer_width_px` | integer string, e.g. `"540"` | Hint for the drawer width. Clamped to `[320, 800]`. |

### Validation limits

- `card_payload` must be **≤ 64 KB**.
- Custom element-tree nesting depth is capped at **8 levels** (the root counts as level 1).
- Unknown `card_kind` values are rejected.
- Payloads that don't match the schema for the declared `card_kind` are rejected.

When validation fails, ASI:One silently falls back to treating the message as a plain text reply, so the user still sees your `TextContent`.

### Choosing between paths

- **Predefined schemas** (`carousel`, `detail`, `form`, `review`) — use these whenever your card fits the pattern. They get polished, designed UI for free.
- **Custom element tree** (`card_kind: "custom"`) — compose primitives directly when the predefined kinds don't fit.
- **Typed escape hatch** — for high-fidelity widgets like seat maps, reach out to the ASI:One team; they ship the React component themselves.

### Response format

When the user interacts with the card, ASI:One forwards the selection back as a `TextContent` message inside a follow-up `ChatMessage`. The shape of that text depends on **how** the user reached your agent, so your handler must be ready for both formats:

1. **Natural-language prose (planner-mediated)** — when ASI:One's planner LLM routed the user to you. The planner narrates the selection in prose, e.g. *"The user picked offer off_123 with cabin economy."* Every identifier you put under the CTA's `selection` payload is mentioned somewhere in that sentence.
2. **Selection JSON (direct @mention)** — when the user is talking to your agent directly via `@mention`. The selection is delivered verbatim as a JSON object serialized to a string, built from the CTA's `selection` block plus any captured user inputs.

A typical direct-mention payload looks like:

```json
{
  "action": "book_offer",
  "offer_id": "off_123",
  "cabin": "economy"
}
```

A robust agent tries `json.loads()` on the incoming text first and falls back to natural-language parsing if that fails.

### Common pitfalls

- Forgetting `card_protocol_version: "1"` — the card declaration is silently dropped.
- Wrapping `card_payload` in an extra envelope like `{"data": {...}}` — the schema expects the payload at the top level.
- Setting `is_terminal: "true"` on a card that needs user input — the drawer never opens, so the user can't act.
- Putting non-string values directly in `MetadataContent.metadata` — the wire type is `dict[str, str]`. Always `json.dumps(...)` nested structures.

---

## 2. Predefined card schemas

The four built-in `card_kind` values cover the most common interactive patterns. Each section below shows the payload shape, the rendered card, and the selection shape your agent will receive.

### `carousel` — selectable items list

A horizontally scrollable list of cards. Great for search results, offers, or any "pick one of these" flow.

<div>
  <img
    src="/resources/img/agentverse/interactive-cards/carousel.png"
    alt="Carousel card rendered in ASI:One"
  />
</div>

```json title='card_payload — card_kind: "carousel"'
{
  "title": "Choose a flight",
  "subtitle": "London → Edinburgh, 2026-06-25",
  "items": [
    {
      "id": "off_123",
      "image": "https://example.com/ba.png",
      "title": "British Airways",
      "subtitle": "Direct · 1h 15m · Economy",
      "badges": [{"label": "Direct", "variant": "info"}],
      "secondary_text": "USD 88.16",
      "primary_cta": {
        "label": "Select",
        "selection": {"offer_id": "off_123"}
      }
    }
  ]
}
```

**Selection shape:** whatever you put under `primary_cta.selection` (e.g. `{"offer_id": "off_123"}`).

---

### `detail` — detail view with sub-options + CTAs

A focused detail page for a single item, with a hero image, key/value summary rows, an optional sub-option picker (radio buttons), and one or more action buttons.

<div>
  <img
    src="/resources/img/agentverse/interactive-cards/details.png"
    alt="Detail card rendered in ASI:One"
  />
</div>

```json title='card_payload — card_kind: "detail"'
{
  "title": "British Airways · LHR → EDI",
  "hero_image": "https://example.com/hero.png",
  "summary_rows": [
    {"label": "Departure", "value": "21:50 · LHR"},
    {"label": "Arrival", "value": "23:05 · EDI"}
  ],
  "sub_options": {
    "name": "cabin",
    "kind": "radio",
    "label": "Cabin class",
    "choices": [
      {"value": "economy", "label": "Economy", "secondary_text": "USD 88"},
      {"value": "business", "label": "Business", "secondary_text": "USD 220"}
    ]
  },
  "ctas": [
    {"label": "Continue", "selection": {"action": "continue"}, "primary": true},
    {"label": "Back", "selection": {"action": "back"}}
  ]
}
```

**Selection shape:** the sub-option value merged with the clicked CTA's `selection`, e.g. `{"cabin": "economy", "action": "continue"}`.

---

### `form` — labeled inputs with submit

A vertical form with labeled fields and a single submit button. Use it for capturing structured input like contact details, preferences, or filters.

<div>
  <img
    src="/resources/img/agentverse/interactive-cards/form.png"
    alt="Form card rendered in ASI:One"
  />
</div>

```json title='card_payload — card_kind: "form"'
{
  "title": "Passenger details",
  "fields": [
    {"name": "first_name", "kind": "text", "label": "First name", "required": true},
    {"name": "email", "kind": "email", "label": "Email", "required": true},
    {
      "name": "country",
      "kind": "select",
      "label": "Country",
      "options": [{"value": "GB", "label": "United Kingdom"}]
    }
  ],
  "submit_cta": {"label": "Continue", "selection": {"action": "submit"}}
}
```

**Field kinds:** `text`, `number`, `email`, `select`, `checkbox`. `select` requires a non-empty `options` array.

**Selection shape:** every field's value merged with `submit_cta.selection`, e.g. `{"first_name": "Alex", "email": "alex@example.com", "country": "GB", "action": "submit"}`.

---

### `review` — confirm/reject summary

A read-only summary with two clear CTAs — typically Confirm and Cancel. Perfect as the last step before a transaction, booking, or any irreversible action.

<div>
  <img
    src="/resources/img/agentverse/interactive-cards/review.png"
    alt="Review card rendered in ASI:One"
  />
</div>

```json title='card_payload — card_kind: "review"'
{
  "title": "Confirm booking",
  "summary_rows": [
    {"label": "Flight", "value": "BA1437"},
    {"label": "Total", "value": "USD 88.16"}
  ],
  "approve_cta": {"label": "Confirm booking", "selection": {"action": "confirm"}, "primary": true},
  "reject_cta": {"label": "Cancel", "selection": {"action": "cancel"}}
}
```

**Selection shape:** either `approve_cta.selection` or `reject_cta.selection`, depending on which button the user clicked. When the planner is involved, the natural-language forward will explicitly mention confirm vs. cancel intent.

---

## 3. Custom element-tree primitives (`card_kind: "custom"`)

When none of the four predefined shapes fit, set `card_kind: "custom"` and compose the layout yourself from primitives. The payload root must be `{"root": <element>}`, and the element tree can be at most **8 levels deep** (root included).

### Layout primitives

- `{type: "section", title?: str, subtitle?: str, children: [...]}` — a labeled section.
- `{type: "group", direction: "row" | "column", gap?: int, children: [...]}` — flex container.
- `{type: "divider"}` — horizontal rule.

### Content primitives

- `{type: "text", value: str, style?: "body" | "muted" | "emphasis"}`
- `{type: "heading", value: str, level: 1 | 2 | 3}` — `level` defaults to `2`.
- `{type: "image", src: str, alt?: str, aspect_ratio?: str}` (e.g. `"16:9"`)
- `{type: "badge", label: str, variant?: "info" | "success" | "warning"}`

### Interactive primitives

- `{type: "button", label: str, primary?: bool, action: {selection: {...}}}` — submits the collected selection when clicked.
- `{type: "input", name: str, kind: "text" | "number" | "email" | "select" | "checkbox", label: str, required?: bool, options?: [{value, label}, ...], placeholder?: str}` — `select` requires a non-empty `options` array.
- `{type: "list", items: [{children: [...], action?: {selection: {...}}}]}` — selectable list. Tapping a list item that has an `action` is equivalent to clicking a button.
- `{type: "choice_grid", name: str, choices: [{value, label, image?}, ...], multi?: bool}` — image-tile picker.

### How selection works in custom cards

The drawer keeps track of every `input` and `choice_grid` value (keyed by `name`) and merges those values with the clicked button's `action.selection` to form the final selection payload.

For example, a custom form with three inputs and a Submit button delivers:

```json
{
  "first_name": "Alex",
  "email": "alex@example.com",
  "country": "GB",
  "action": "submit"
}
```

### Example: a hotel picker built from primitives

<div>
  <img
    src="/resources/img/agentverse/interactive-cards/example.png"
    alt="Custom element-tree hotel picker rendered in ASI:One"
  />
</div>

```json title='card_payload — card_kind: "custom"'
{
  "root": {
    "type": "section",
    "title": "Hotels in London",
    "children": [
      {
        "type": "list",
        "items": [
          {
            "children": [
              {"type": "image", "src": "https://example.com/h1.jpg", "aspect_ratio": "16:9"},
              {"type": "heading", "value": "The Strand", "level": 3},
              {"type": "text", "value": "Covent Garden · 3 nights · USD 540"},
              {"type": "badge", "label": "Free cancellation", "variant": "success"}
            ],
            "action": {"selection": {"hotel_id": "h_strand"}}
          }
        ]
      }
    ]
  }
}
```

When the user taps the row, your agent receives `{"hotel_id": "h_strand"}` — either as JSON (direct `@mention`) or summarized in prose (planner-mediated).

---

## 4. Agent example — flight booking with all four card kinds

The agent below uses the [Agent Chat Protocol](/docs/agent-communication/agent-chat-protocol) to drive a complete booking flow:

1. **Carousel** — show available flights.
2. **Detail** — show the picked flight with a cabin selector.
3. **Form** — collect passenger details.
4. **Review** — confirm before "booking".

The same handler can be reused for any card flow: build a `card_payload` dict, JSON-encode it, attach it as a `MetadataContent` block, and send a `ChatMessage`.

```python title='card_agent.py'
import json
from datetime import datetime, timezone
from uuid import uuid4

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    MetadataContent,
    TextContent,
    chat_protocol_spec,
)

agent = Agent(name="flight_card_agent", seed="flight-card-agent-seed-phrase")
chat_proto = Protocol(spec=chat_protocol_spec)

# Helper: build a ChatMessage with one text bubble + one card declaration.
def card_message(narration: str, card_kind: str, card_payload: dict) -> ChatMessage:
    return ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[
            TextContent(type="text", text=narration),
            MetadataContent(
                type="metadata",
                metadata={
                    "card_protocol_version": "1",
                    "requires_card_interaction": "true",
                    "card_kind": card_kind,
                    "card_payload": json.dumps(card_payload),
                    "preferred_drawer_width_px": "540",
                },
            ),
        ],
    )

# ---- Card payload builders -------------------------------------------------

def flights_carousel() -> dict:
    return {
        "title": "Choose a flight",
        "subtitle": "London → Edinburgh, 2026-06-25",
        "items": [
            {
                "id": "off_123",
                "image": "https://example.com/ba.png",
                "title": "British Airways",
                "subtitle": "Direct · 1h 15m",
                "badges": [{"label": "Direct", "variant": "info"}],
                "secondary_text": "USD 88.16",
                "primary_cta": {
                    "label": "Select",
                    "selection": {"action": "pick_flight", "offer_id": "off_123"},
                },
            },
            {
                "id": "off_456",
                "image": "https://example.com/ej.png",
                "title": "easyJet",
                "subtitle": "Direct · 1h 20m",
                "badges": [{"label": "Cheapest", "variant": "success"}],
                "secondary_text": "USD 62.40",
                "primary_cta": {
                    "label": "Select",
                    "selection": {"action": "pick_flight", "offer_id": "off_456"},
                },
            },
        ],
    }

def flight_detail(offer_id: str) -> dict:
    return {
        "title": "British Airways · LHR → EDI",
        "hero_image": "https://example.com/hero.png",
        "summary_rows": [
            {"label": "Departure", "value": "21:50 · LHR"},
            {"label": "Arrival", "value": "23:05 · EDI"},
        ],
        "sub_options": {
            "name": "cabin",
            "kind": "radio",
            "label": "Cabin class",
            "choices": [
                {"value": "economy", "label": "Economy", "secondary_text": "USD 88"},
                {"value": "business", "label": "Business", "secondary_text": "USD 220"},
            ],
        },
        "ctas": [
            {
                "label": "Continue",
                "primary": True,
                "selection": {"action": "pick_cabin", "offer_id": offer_id},
            },
            {"label": "Back", "selection": {"action": "back"}},
        ],
    }

def passenger_form(offer_id: str, cabin: str) -> dict:
    return {
        "title": "Passenger details",
        "fields": [
            {"name": "first_name", "kind": "text", "label": "First name", "required": True},
            {"name": "last_name", "kind": "text", "label": "Last name", "required": True},
            {"name": "email", "kind": "email", "label": "Email", "required": True},
            {
                "name": "country",
                "kind": "select",
                "label": "Country",
                "options": [
                    {"value": "GB", "label": "United Kingdom"},
                    {"value": "US", "label": "United States"},
                ],
            },
        ],
        "submit_cta": {
            "label": "Continue",
            "selection": {"action": "submit_passenger", "offer_id": offer_id, "cabin": cabin},
        },
    }

def review_booking(passenger: dict) -> dict:
    return {
        "title": "Confirm booking",
        "summary_rows": [
            {"label": "Flight", "value": "BA1437 · LHR → EDI"},
            {"label": "Cabin", "value": passenger["cabin"].title()},
            {"label": "Passenger", "value": f'{passenger["first_name"]} {passenger["last_name"]}'},
            {"label": "Total", "value": "USD 88.16"},
        ],
        "approve_cta": {
            "label": "Confirm booking",
            "primary": True,
            "selection": {"action": "confirm", "offer_id": passenger["offer_id"]},
        },
        "reject_cta": {"label": "Cancel", "selection": {"action": "cancel"}},
    }

# ---- Selection parser ------------------------------------------------------

def parse_selection(text: str) -> dict:
    """Try JSON first (direct @mention); fall back to a tiny prose parser."""
    try:
        return json.loads(text)
    except (ValueError, TypeError):
        pass

    selection: dict = {}
    if "off_123" in text:
        selection["offer_id"] = "off_123"
    elif "off_456" in text:
        selection["offer_id"] = "off_456"
    if "economy" in text.lower():
        selection["cabin"] = "economy"
    elif "business" in text.lower():
        selection["cabin"] = "business"
    if "confirm" in text.lower():
        selection["action"] = "confirm"
    elif "cancel" in text.lower():
        selection["action"] = "cancel"
    return selection

# ---- Handlers --------------------------------------------------------------

@chat_proto.on_message(ChatMessage)
async def on_message(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(
        sender,
        ChatAcknowledgement(
            timestamp=datetime.now(timezone.utc),
            acknowledged_msg_id=msg.msg_id,
        ),
    )

    last_text = next(
        (c.text for c in msg.content if isinstance(c, TextContent)),
        "",
    )

    # Stash partial state on the session so we can chain multiple cards.
    session = ctx.storage.get(sender) or {}

    if not last_text or last_text.lower() in {"hi", "hello", "start", "book"}:
        await ctx.send(
            sender,
            card_message(
                "Here are the flights I found. Pick one to continue.",
                "carousel",
                flights_carousel(),
            ),
        )
        return

    selection = parse_selection(last_text)
    action = selection.get("action")

    if action == "pick_flight" and "offer_id" in selection:
        session["offer_id"] = selection["offer_id"]
        ctx.storage.set(sender, session)
        await ctx.send(
            sender,
            card_message(
                "Great choice. Pick a cabin to continue.",
                "detail",
                flight_detail(selection["offer_id"]),
            ),
        )

    elif action == "pick_cabin":
        session["cabin"] = selection.get("cabin", "economy")
        session["offer_id"] = selection.get("offer_id", session.get("offer_id"))
        ctx.storage.set(sender, session)
        await ctx.send(
            sender,
            card_message(
                "Almost there — tell me who's travelling.",
                "form",
                passenger_form(session["offer_id"], session["cabin"]),
            ),
        )

    elif action == "submit_passenger":
        session.update(
            offer_id=selection.get("offer_id", session.get("offer_id")),
            cabin=selection.get("cabin", session.get("cabin", "economy")),
            first_name=selection.get("first_name", "Guest"),
            last_name=selection.get("last_name", "User"),
            email=selection.get("email"),
            country=selection.get("country"),
        )
        ctx.storage.set(sender, session)
        await ctx.send(
            sender,
            card_message(
                "Please review and confirm your booking.",
                "review",
                review_booking(session),
            ),
        )

    elif action == "confirm":
        ctx.storage.set(sender, {})
        await ctx.send(
            sender,
            ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[TextContent(type="text", text="Booking confirmed. Reference: BKG-9F2A.")],
            ),
        )

    elif action == "cancel":
        ctx.storage.set(sender, {})
        await ctx.send(
            sender,
            ChatMessage(
                timestamp=datetime.now(timezone.utc),
                msg_id=uuid4(),
                content=[TextContent(type="text", text="No worries — booking cancelled.")],
            ),
        )

    else:
        await ctx.send(
            sender,
            card_message(
                "Sorry, I didn't catch that. Pick a flight to get started.",
                "carousel",
                flights_carousel(),
            ),
        )

@chat_proto.on_message(ChatAcknowledgement)
async def on_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(f"ACK from {sender} for {msg.acknowledged_msg_id}")

agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    agent.run()
```

:::tip Custom cards in the same agent
Swap any of the helpers above for a `card_kind: "custom"` payload (using the element-tree primitives) and the rest of the handler keeps working — selection parsing is identical.
:::

---

## 5. Client example — driving the agent from plain Python

The agent above is reachable from anything that speaks ACP — including ASI:One, another uAgent, or a plain Python script. The snippet below mints an identity with `uagents-core`, sends a `ChatMessage` carrying a simulated card selection, and listens on a small Flask webhook for the agent's reply.

```bash title='install dependencies'
pip install "uagents-core>=0.4.9" flask requests
```

```python title='card_client.py'
import json
import os
import threading
from datetime import datetime, timezone
from uuid import uuid4

from flask import Flask, request, jsonify
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    TextContent,
    chat_protocol_spec,
)
from uagents_core.crypto import Identity
from uagents_core.envelope import Envelope
from uagents_core.utils.communication import parse_message_from_agent, send_message_to_agent
from uagents_core.utils.registration import register_with_agentverse

# 1. Identity + Agentverse registration (mailbox so the agent can reach us).
identity = Identity.from_seed(os.environ["CLIENT_SEED"], 0)
register_with_agentverse(
    identity=identity,
    url="http://localhost:5000/webhook",
    agentverse_token=os.environ["AGENTVERSE_API_KEY"],
    agent_title="Card Client",
    readme="<description>Drives the flight booking card agent.</description>",
)

AGENT_ADDRESS = os.environ["FLIGHT_AGENT_ADDRESS"]  # the card_agent.py address

app = Flask(__name__)

def send_text(text: str) -> None:
    """Wrap text in a ChatMessage and send it to the card agent."""
    msg = ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[TextContent(type="text", text=text)],
    )
    send_message_to_agent(identity, AGENT_ADDRESS, msg.model_dump(mode="json"))

@app.post("/webhook")
def webhook():
    """Receive ChatMessage / ChatAcknowledgement responses from the agent."""
    raw = request.get_data().decode("utf-8")
    incoming = parse_message_from_agent(raw)

    # The payload is the JSON-serialised ChatMessage / ChatAcknowledgement.
    payload = incoming.payload or {}

    if "acknowledged_msg_id" in payload:
        print(f"[ack] {payload['acknowledged_msg_id']}")
        return jsonify({"status": "ok"})

    for block in payload.get("content", []):
        block_type = block.get("type")
        if block_type == "text":
            print(f"[agent text] {block['text']}")
        elif block_type == "metadata":
            meta = block.get("metadata", {})
            if meta.get("requires_card_interaction") == "true":
                card_kind = meta.get("card_kind")
                card_payload = json.loads(meta.get("card_payload", "{}"))
                print(f"[card] kind={card_kind} payload={json.dumps(card_payload, indent=2)}")

                # Simulate the user picking the first CTA on the rendered card.
                selection = simulate_user_pick(card_kind, card_payload)
                if selection is not None:
                    print(f"[client] sending selection -> {selection}")
                    send_text(json.dumps(selection))

    return jsonify({"status": "ok"})

def simulate_user_pick(card_kind: str, payload: dict):
    """Pretend to be a user clicking the primary CTA on each card kind."""
    if card_kind == "carousel":
        item = payload["items"][0]
        return item["primary_cta"]["selection"]

    if card_kind == "detail":
        cta = next((c for c in payload["ctas"] if c.get("primary")), payload["ctas"][0])
        sub = payload.get("sub_options")
        merged = dict(cta["selection"])
        if sub:
            merged[sub["name"]] = sub["choices"][0]["value"]
        return merged

    if card_kind == "form":
        cta = payload["submit_cta"]
        merged = dict(cta["selection"])
        for field in payload["fields"]:
            if field["kind"] == "select":
                merged[field["name"]] = field["options"][0]["value"]
            else:
                merged[field["name"]] = f"demo_{field['name']}"
        return merged

    if card_kind == "review":
        return payload["approve_cta"]["selection"]

    if card_kind == "custom":
        # Walk the tree, pick the first list item or button with an action.
        def walk(node):
            if isinstance(node, dict):
                if node.get("type") == "list":
                    for item in node.get("items", []):
                        if item.get("action"):
                            return item["action"]["selection"]
                if node.get("type") == "button":
                    return node.get("action", {}).get("selection")
                for child in node.get("children", []) or []:
                    found = walk(child)
                    if found is not None:
                        return found
            return None

        return walk(payload.get("root"))

    return None

if __name__ == "__main__":
    threading.Thread(
        target=lambda: send_text("Start booking"),
        daemon=True,
    ).start()
    app.run(host="0.0.0.0", port=5000)
```

Set the three environment variables before running:

```bash
export AGENTVERSE_API_KEY="your-agentverse-key"     # from agentverse.ai/profile/api-keys
export CLIENT_SEED="any-stable-string"              # determines the client address
export FLIGHT_AGENT_ADDRESS="agent1q..."            # printed by card_agent.py on startup
python card_client.py
```

The client logs each card the agent emits, auto-clicks the primary CTA, and forwards the resulting selection back as JSON — exactly the shape ASI:One sends when a real user interacts with the drawer.

---

## 6. Next steps

- Open the [Card Interaction Playground](https://asi1.ai/developer/card-playground) and iterate on a payload until it looks right, then paste it into `card_agent.py`.
- Read the [Agent Chat Protocol](/docs/agent-communication/agent-chat-protocol) page for the underlying message types and acknowledgement rhythm.
- Browse [Agentverse Skills](/docs/agentverse/agentverse-skills) and the [Agentverse API key](/docs/agentverse/agentverse-api-key) guide to wire your agent into the wider ecosystem.
- For high-fidelity widgets (seat maps, calendars, charts) that don't fit the predefined or custom-tree shapes, contact the ASI:One team to discuss the typed escape hatch.


---

<!-- ===== SOURCE: https://innovationlab.fetch.ai/resources/docs/next/agent-transaction/agent-payment-protocol ===== -->

# [Saved page] https://innovationlab.fetch.ai/resources/docs/next/agent-transaction/agent-payment-protocol

---
id: agent-payment-protocol
title: Agent Payment Protocol
---

# Agent Payment Protocol

The Agent Payment Protocol standardizes how two agents negotiate and finalize a payment. It defines message types, valid interaction paths, and clear roles for a buyer and a seller. This guide explains the models, interaction rules, and shows working examples for both roles.

## Understanding the Payment Protocol

### 1. Core Models

#### Funds
```python
class Funds(Model):
    # amount of funds
    amount: str

    # currency of the funds (USDC, FET, etc.)
    currency: str

    # payment method (skyfire, fet_direct, stripe, …)
    payment_method: str = "fet_direct"
```
- **amount**: amount expressed as a string (supports arbitrary formats/precisions)
- **currency**: the asset or token symbol
- **payment_method**: payment rail/method identifier (conventional string; not an enum)

### Payment methods

The payment protocol is payment-rail agnostic. Use `Funds.payment_method` to describe **how** the buyer will pay.

Common values (conventional strings — library comments may list a subset such as `skyfire` / `fet_direct`):

- **`stripe`**: card payment via Stripe Checkout (recommended for fiat). In practice, `CommitPayment.transaction_id` is usually set to the **Stripe Checkout Session ID** (e.g. `cs_test_...`) so the seller can verify payment status via Stripe.
- **`skyfire`**: USDC payment via Skyfire.
- **`fet_direct`**: direct on-chain FET transfer.

You can also include rail-specific UI/verification hints via `RequestPayment.metadata`.

For example, to support **Stripe embedded Checkout** experiences, you can include a `stripe` object in `metadata`:

```json
{
  "stripe": {
    "ui_mode": "embedded",
    "publishable_key": "pk_test_...",
    "client_secret": "cs_test_...",
    "checkout_session_id": "cs_test_...",
    "currency": "usd",
    "amount_cents": 100
  }
}
```

:::note Protocol-only demo vs real rails
The seller/buyer scripts below are a **protocol-only demo** (`payment_method="skyfire"` + a fake `transaction_id`). They intentionally omit rail metadata. For a real Stripe path, see **[Stripe Horoscope Agent (Payment Protocol)](../examples/agent-transaction/stripe-horoscope-payment-protocol)**.
:::

#### RequestPayment
```python
class RequestPayment(Model):
    # list of Funds options the counterparty may pay with
    accepted_funds: list[Funds]

    # recipient address or identifier
    recipient: str

    # deadline for the payment request in seconds
    deadline_seconds: int

    # optional reference for the payment
    reference: str | None = None

    # optional description of the payment
    description: str | None = None

    # optional metadata for the payment
    metadata: dict[str, str | dict[str, str]] | None = None
```
- **accepted_funds**: list of `Funds` options the requester accepts for payment (the invoice’s accepted rails)
- **recipient**: where funds should be sent (address, handle, etc.)
- **deadline_seconds**: validity window of the request
- Optional: **reference**, **description**, **metadata**

#### RejectPayment
```python
class RejectPayment(Model):
    # optional reason for rejecting the payment
    reason: str | None = None
```
- Sent by the **buyer** to decline a `RequestPayment`

#### CommitPayment
```python
class CommitPayment(Model):
    # funds to be paid
    funds: Funds

    # recipient address or identifier
    recipient: str

    # unique transaction token or hash
    transaction_id: str

    # optional reference for the payment
    reference: str | None = None

    # optional description of the payment
    description: str | None = None

    # optional metadata for the payment
    metadata: dict[str, str | dict[str, str]] | None = None
```
- **Buyer’s** commitment response: the exact funds chosen and a **transaction_id** to track the payment

#### CancelPayment
```python
class CancelPayment(Model):
    # unique transaction token or hash
    transaction_id: str | None = None

    # optional reason for canceling the payment
    reason: str | None = None
```
- **Seller** may cancel after a commit (instead of completing). Prefer echoing `CommitPayment.transaction_id` when known; `None` is allowed when no transaction was recorded yet.

#### CompletePayment
```python
class CompletePayment(Model):
    # unique transaction token or hash
    transaction_id: str | None = None
```
- **Seller** confirms the payment completed (typically after verifying the commit). Prefer echoing `CommitPayment.transaction_id`; `None` is allowed only when there is no transaction to reference.

### Glossary (who invoices vs who pays)

| Message | Meaning | Typical sender |
| --- | --- | --- |
| `RequestPayment` | Invoice / request to be paid | Seller |
| `CommitPayment` | Payer commits funds (with `transaction_id`) | Buyer |
| `RejectPayment` | Payer declines the request | Buyer |
| `CompletePayment` | Merchant confirms completion | Seller |
| `CancelPayment` | Merchant cancels after commit | Seller |

### 2. Protocol Specification

```python
payment_protocol_spec = ProtocolSpecification(
    name="AgentPaymentProtocol",
    version="0.1.0",
    interactions={
        RequestPayment: {CommitPayment, RejectPayment},
        CommitPayment: {CompletePayment, CancelPayment},
        CompletePayment: set(),
        CancelPayment: set(),
        RejectPayment: set(),
    },
    roles={
        # Messages each role implements handlers for (inbound)
        "seller": {CommitPayment, RejectPayment},
        "buyer": {RequestPayment, CancelPayment, CompletePayment},
    },
)
```
- **Interactions**: valid next messages per message type
- **Roles**: which **inbound** message types each role must handle (not a list of messages the role is limited to send)

Verify the installed protocol version:

```bash
python -c "from uagents_core.contrib.protocols.payment import payment_protocol_spec; print(payment_protocol_spec.name, payment_protocol_spec.version)"
```

Expected: `AgentPaymentProtocol 0.1.0`.

### 3. Basic Payment Flow

1. Seller sends `RequestPayment` to Buyer
2. Buyer responds with either `CommitPayment` or `RejectPayment`
3. If committed, Seller sends `CompletePayment` (or `CancelPayment` if aborting after commit)

## Using the Payment Protocol

### Prerequisites

**Agentverse-hosted**
- Packages are provided by the platform; no local `pip install` required.

**Local**
- Python **3.10+**
- `pip install "uagents>=0.25.5"` (pulls compatible `uagents_core`), or `pip install uagents uagents-core` if needed
- Payment protocol version **0.1.0** (see verify command above)

Import the models and specification from `uagents_core.contrib.protocols.payment`:

```python
from uagents_core.contrib.protocols.payment import (
    Funds,
    RequestPayment,
    RejectPayment,
    CommitPayment,
    CancelPayment,
    CompletePayment,
    payment_protocol_spec,
)
```

:::note Locked-spec errors
Because the specification defines roles, instantiate the protocol with `role="buyer"` or `role="seller"` so it matches the **inbound handlers** you implement. A locked-spec error usually means you registered a handler (or interaction) that your `role=` does not include — for example, a `role="seller"` agent must handle `CommitPayment` / `RejectPayment`, while a `role="buyer"` agent must handle `RequestPayment` / `CompletePayment` / `CancelPayment`.
:::

## Example Agents

Below are two minimal agents demonstrating the Buyer and Seller roles. These are local-runnable once you replace the buyer address placeholder.

### Seller Agent

```python title="seller.py"
import os
from uuid import uuid4
from uagents import Agent, Protocol, Context

from uagents_core.contrib.protocols.payment import (
    Funds,
    RequestPayment,
    CommitPayment,
    RejectPayment,
    CancelPayment,
    CompletePayment,
    payment_protocol_spec,
)

SELLER_PORT = int(os.getenv("SELLER_PORT", "8091"))
# REQUIRED: paste Buyer address from its startup logs before starting Seller
BUYER_ADDRESS = "PASTE_BUYER_ADDRESS_HERE"

seller = Agent(
    name="demo_seller",
    port=SELLER_PORT,
    endpoint=[f"http://localhost:{SELLER_PORT}/submit"],
    seed="demo_seller_seed",
)

payment_proto = Protocol(spec=payment_protocol_spec, role="seller")

@seller.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Seller address: {ctx.agent.address}")

    if BUYER_ADDRESS.startswith("PASTE_") or not BUYER_ADDRESS.startswith("agent"):
        ctx.logger.error("Set BUYER_ADDRESS to the Buyer's real address before running Seller")
        return

    # Protocol-only demo: no Stripe/Skyfire metadata. Real rails verify before CompletePayment.
    # Optional Stripe-shaped metadata (commented):
    # metadata={"stripe": {"ui_mode": "embedded", "checkout_session_id": "cs_test_..."}}
    req = RequestPayment(
        accepted_funds=[Funds(currency="USDC", amount="0.001", payment_method="skyfire")],
        recipient=ctx.agent.address,
        deadline_seconds=300,
        reference=str(uuid4()),
        description="demo payment",
        metadata={},
    )
    ctx.logger.info(f"Seller sending RequestPayment to {BUYER_ADDRESS}: {req}")
    await ctx.send(BUYER_ADDRESS, req)

@payment_proto.on_message(CommitPayment)
async def on_commit(ctx: Context, sender: str, msg: CommitPayment):
    ctx.logger.info(f"Seller received CommitPayment: {msg}")
    # Demo only — real integrations must verify Stripe/Skyfire/on-chain payment first.
    # To abort instead: await ctx.send(sender, CancelPayment(transaction_id=msg.transaction_id, reason="demo cancel"))
    await ctx.send(sender, CompletePayment(transaction_id=msg.transaction_id))
    ctx.logger.info("Seller sent CompletePayment")

@payment_proto.on_message(RejectPayment)
async def on_reject(ctx: Context, sender: str, msg: RejectPayment):
    ctx.logger.info(f"Buyer rejected: {msg.reason}")

seller.include(payment_proto, publish_manifest=True)

if __name__ == "__main__":
    seller.run()
```

### Buyer Agent

```python title="buyer.py"
import os
from uagents import Agent, Protocol, Context

from uagents_core.contrib.protocols.payment import (
    Funds,
    RequestPayment,
    CommitPayment,
    RejectPayment,
    CompletePayment,
    CancelPayment,
    payment_protocol_spec,
)

BUYER_PORT = int(os.getenv("BUYER_PORT", "8092"))
BUYER_MODE = os.getenv("BUYER_MODE", "commit").lower()  # commit | reject

buyer = Agent(
    name="demo_buyer",
    port=BUYER_PORT,
    endpoint=[f"http://localhost:{BUYER_PORT}/submit"],
    seed="demo_buyer_seed",
)

payment_proto = Protocol(spec=payment_protocol_spec, role="buyer")

@buyer.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Buyer address: {ctx.agent.address}")

@payment_proto.on_message(RequestPayment)
async def on_request(ctx: Context, sender: str, msg: RequestPayment):
    ctx.logger.info(f"Buyer received RequestPayment: {msg}")

    if not msg.accepted_funds:
        await ctx.send(sender, RejectPayment(reason="no accepted funds provided"))
        return

    selected = msg.accepted_funds[0]

    if BUYER_MODE == "reject":
        await ctx.send(sender, RejectPayment(reason="demo reject"))
        return

    # Demo only: hardcoded transaction_id — no real Stripe/Skyfire/on-chain verification occurs.
    commit = CommitPayment(
        funds=Funds(
            currency=selected.currency,
            amount=selected.amount,
            payment_method=selected.payment_method,
        ),
        recipient=msg.recipient,
        transaction_id="demo-txn-001",
        reference=msg.reference,
        description=msg.description,
        metadata=msg.metadata or {},
    )
    await ctx.send(sender, commit)
    ctx.logger.info("Buyer sent CommitPayment")

@payment_proto.on_message(CompletePayment)
async def on_complete(ctx: Context, sender: str, msg: CompletePayment):
    ctx.logger.info(f"Buyer received CompletePayment: {msg}")

@payment_proto.on_message(CancelPayment)
async def on_cancel(ctx: Context, sender: str, msg: CancelPayment):
    # Seller may send CancelPayment instead of CompletePayment after a commit
    ctx.logger.info(f"Buyer received CancelPayment: {msg}")

buyer.include(payment_proto, publish_manifest=True)

if __name__ == "__main__":
    buyer.run()
```

### Running the Agents

#### Hosted (Agentverse)

1. Create two hosted agents (Buyer and Seller). See [Hosted Agents](/docs/agent-creation/uagent-creation#hosted-agents).
2. Paste each script into the matching editor. For hosted agents, **omit** the `if __name__ == "__main__": … .run()` block and you can simplify `Agent(...)` to `Agent()` (Agentverse provides networking).
3. Start **Buyer** first, copy its address from logs into Seller’s `BUYER_ADDRESS`.
4. Start **Seller**. Seller sends `RequestPayment` on startup, so Buyer must already be running.

#### Local

Defaults: Seller port **8091**, Buyer port **8092** (override with `SELLER_PORT` / `BUYER_PORT`).

```python
# Seller — already shown in seller.py
seller = Agent(
    name="demo_seller",
    port=SELLER_PORT,
    endpoint=[f"http://localhost:{SELLER_PORT}/submit"],
    seed="demo_seller_seed",
)

# Buyer — already shown in buyer.py
buyer = Agent(
    name="demo_buyer",
    port=BUYER_PORT,
    endpoint=[f"http://localhost:{BUYER_PORT}/submit"],
    seed="demo_buyer_seed",
)
```

**Seller will not work until `BUYER_ADDRESS` is replaced** with the Buyer’s real address.

1. Start the **Buyer** first and copy its address from logs (`Buyer address: agent1q...`).
2. Paste that address into `BUYER_ADDRESS` in `seller.py`.
3. Start the **Seller**.

You should see the **Seller** send a `RequestPayment`, the **Buyer** respond with a `CommitPayment`, and the **Seller** send a `CompletePayment`.

Prefer importing from `uagents_core.contrib.protocols.payment` as shown above. Vendoring (copying) the models/spec into your repo is only needed if you must pin or customize the protocol offline; otherwise depend on `uagents_core` so you stay aligned with published version `0.1.0`.

### Expected Output

When both agents are running, you should see logs similar to the following.

Buyer logs
```text
INFO:     [demo_buyer]: Starting agent with address: agent1q...
INFO:     [demo_buyer]: Agent inspector available at https://agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8092&address=agent1q...
INFO:     [demo_buyer]: Starting server on http://0.0.0.0:8092 (Press CTRL+C to quit)
INFO:     [demo_buyer]: Buyer address: agent1q...
INFO:     [demo_buyer]: Buyer received RequestPayment: accepted_funds=[Funds(amount='0.001', currency='USDC', payment_method='skyfire')] recipient='agent1q...' deadline_seconds=300 reference='...' description='demo payment' metadata={}
INFO:     [demo_buyer]: Buyer sent CommitPayment
INFO:     [demo_buyer]: Buyer received CompletePayment: transaction_id='demo-txn-001'
```

Seller logs
```text
INFO:     [demo_seller]: Starting agent with address: agent1q...
INFO:     [demo_seller]: Seller address: agent1q...
INFO:     [demo_seller]: Seller sending RequestPayment to agent1q...: accepted_funds=[Funds(amount='0.001', currency='USDC', payment_method='skyfire')] recipient='agent1q...' deadline_seconds=300 reference='...' description='demo payment' metadata={}
INFO:     [demo_seller]: Agent inspector available at https://agentverse.ai/inspect/?uri=http%3A//127.0.0.1%3A8091&address=agent1q...
INFO:     [demo_seller]: Starting server on http://0.0.0.0:8091 (Press CTRL+C to quit)
INFO:     [demo_seller]: Seller received CommitPayment: funds=Funds(amount='0.001', currency='USDC', payment_method='skyfire') recipient='agent1q...' transaction_id='demo-txn-001' reference='...' description='demo payment' metadata={}
INFO:     [demo_seller]: Seller sent CompletePayment
```

**Success checklist**
- [ ] Buyer received `RequestPayment`
- [ ] Buyer sent `CommitPayment`
- [ ] Seller sent `CompletePayment`
- [ ] Buyer received `CompletePayment`

### Troubleshooting

- **Seller errors about buyer address / no reply** → Buyer is not running, or `BUYER_ADDRESS` still starts with `PASTE_`.
- **`NameError: seller` / `buyer`** → Ensure each script constructs `seller = Agent(...)` / `buyer = Agent(...)` before decorators.
- **Locked-spec errors** → Set `role="seller"` or `role="buyer"` to match the inbound handlers you implement (see note above).
- **Missing `Agent()` / wrong ports** → Wire `SELLER_PORT` / `BUYER_PORT` into `Agent(port=..., endpoint=[...])` as in the samples.
- **Import / version failures** → Install prerequisites and verify `payment_protocol_spec.version` is `0.1.0`.

## Conclusion

The Payment Protocol provides a clear, role-driven workflow for negotiating and finalizing payments between agents. By defining message types, valid interactions, and explicit roles, it helps you implement predictable flows: the seller initiates with `RequestPayment`, the buyer either sends `CommitPayment` or `RejectPayment`, and the seller completes or cancels as appropriate.

- Always instantiate your protocol with the correct `role` so inbound handlers match the role’s required messages.
- Use the examples to bootstrap local testing, then adapt handlers to perform real transfers, persistence, retries, and idempotency.
- For complementary patterns, see the [Agent Chat Protocol](/docs/agent-communication/agent-chat-protocol) and the agent setup notes in [Agent Creation](/docs/agent-creation/uagent-creation).

With this foundation, you can extend validation, add signatures or receipts, and integrate with on-chain or off-chain payment rails as needed.
