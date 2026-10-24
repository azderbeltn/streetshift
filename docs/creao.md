# CREAO track at CalHacks 13.0

Fetched: 2026-10-24.

Sources:
- https://community.creao.ai/CalHacks2026 (CREAO "CalHacks Hacker Pack": Home, /CalHacks2026/tech, /CalHacks2026/schedule, /CalHacks2026/about). The page is a JS-rendered SPA (`<div id="root">` only). Text below was extracted from the page's own JS bundle (`/assets/index-CwYe8AHp.js`) as string literals; wording is verbatim, layout reconstructed.
- https://cal-hacks-13-0.devpost.com/ (prize listing)
- https://docs.creao.ai/pro/api-trigger.md (API Trigger reference, saved verbatim at the end)

## Answer: does the CREAO track require building on their platform?

**Yes.** "One rule for every track: a CREAO agent does the core work." The single requirement is that at least one CREAO agent, built on agent.creao.ai, does the core work of the project; the Devpost README must include a share link to one of the agent's runs plus the agent ID; the demo must show the agent running; and the project must select the CREAO track on Devpost. Judging gives 30% to "AI as foundation (Remove the agent. Does the product stop working?)" and 25% to "Depth on CREAO".

Implication for StreetShift (saver's note): to compete, a CREAO agent (e.g. one that writes the policy brief / corridor report, or orchestrates the street sweep) would have to be built on agent.creao.ai and called from our backend via `POST https://agent.creao.ai/api/v1/runs`. Claude-only integrations do not qualify. "Best AI-First Disruptor" matches the CLAUDE.md framing. (CalHacks 12 rules allowed only one CREAO track per project; not confirmed for 13.)

## Prizes (Devpost)
"[Creao AI] Best AI-First Disruptor, Best One-Person Company, Best Team Empowerment — $8,760 in cash. $3,000 cash / 1 year of CREAO Pro Max ($1,440 value) / Product, technical and founder mentorship / Meet-and-greet with a CREAO founder or member of technical staff / Demo opportunities / Launch support through CREAO's community and content channels / Interview opportunities with CREAO. Tag your project's category!"

## Hacker Pack: Home (verbatim strings)

"Everything you need to architect, build, and deploy on CREAO and win a prize track." "Build it at the hackathon. Take it further with CREAO." October 23-24, 2026, Palace of Fine Arts, San Francisco.

### About CREAO
"CREAO is an AI agent company running three product lines on one shared cloud runtime: a consumer agent product (agent.creao.ai), a Developer Platform (developer.creao.ai), and vertical agent solutions built with domain experts. At agent.creao.ai you build an agent by chatting with it, give it tools, and save it. That agent can then run on a schedule, work alongside your team, or be called from your own code."

"Our thesis: the next generation of breakout products won't merely use AI as an add-on; they will be built on autonomous agents from day one. This hackathon is your opportunity to build and validate that vision."

### Join the CREAO Prize Tracks
- Register (Upgraded Account): "Sign up with this link to get an upgraded account for the hackathon:" https://creao.ai/signup?hackathon=calhacks13&utm_source=calhacks13&utm_medium=hackathon&utm_campaign=hackathons-oct-2026 — "This grants you access with an upgraded account (Pro-level features, paid models, scheduled runs, and extra credits for the weekend)."
- "Run out of credits? Message us in our Discord channel or come to the CREAO booth to request more credits. We top up hackers on request." (Discord: https://discord.gg/creao-ai)
- Submit Your Project: "Submit on the Cal Hacks Devpost and select the CREAO track. Projects that don't select the track won't be judged for it." https://cal-hacks-13-0.devpost.com/

### The rule
"At least one CREAO agent does the core work of your project." "That's the whole rule. How you use CREAO beyond it is up to you."

### Judging
| Weight | Criterion | Question |
|---|---|---|
| 30% | AI as foundation | Remove the agent. Does the product stop working? |
| 25% | Depth on CREAO | What does the agent actually do? Did you extend it with your own tools, APIs, or agents, or call it from your product? We check the links in your README. |
| 20% | Originality and ambition | Is this a new kind of product, or a chatbot wrapper? |
| 15% | Track fit | Does it clearly answer the track's question? |
| 10% | Demo and storytelling | The live demo works, and the pitch names what CREAO is doing. |

### The Prize Tracks
"One rule for every track: a CREAO agent does the core work. Pick the track that fits."
1. **Best AI-First Disruptor — $2,500.** "Remove the agent, and the product stops working." Win if: "your app runs on the agent's output, end to end." Build with: "API Trigger + webhooks, connectors, Browser Use, your own tools".
2. **Best One-Person Company — $1,500.** "One human operating like a funded startup." Win if: "you show an org chart of agents that hand work to each other." Build with: "one saved agent per role, coordinated by a scheduled /workflow (no code) or an orchestrator via API Trigger".
3. **Best Team Empowerment — $1,000.** "Agents as the connective tissue between people." Win if: "your agents make a team work better together without replacing anyone." Build with: "Slack, Teams or Notion connectors, scheduled runs, webhook handoffs".

### CREAO Launchpad: The Real Prize
"Every winning team is invited into CREAO Launchpad, our post-hackathon program for the next generation of builders." Includes: 1 year of CREAO Pro Max ($1,440 value); product, technical, and founder mentorship; CREAO meet-and-greet; demo opportunities; launch support and amplification; career opportunities ("winning teams get interview opportunities").

### Tips (verbatim)
- Prototype in minutes. Sign up with the hackathon link, build your agent by chatting, save it with Create Agent, and make your first API call the same hour.
- Choose run modes intentionally. Use async runs with webhooks or polling for multi-step background work; keep your UI responsive while the agent works.
- Leverage multi-agent orchestration. Coordinate specialized role agents through the API Trigger, with keys stored in Secrets and conversation continuity via threadId.
- Secure keys server-side. Always proxy API requests through your backend. Never expose credentials in client-side web or mobile code.
- Answer the rubric question in your pitch. Say out loud: "Remove the agent, and this product dies." Then prove it in the demo.
- Runs take minutes. Design for async work: show progress in your UI, and don't hold a request open waiting for a run. There's no live token streaming on the API Trigger.
- Every run spends credits. An orchestrator that starts many agents spends many runs. Watch your balance, and don't let an agent start itself. If you run out, message us in the Discord channel or come to the CREAO booth for a top-up.
- Keys stay on the server. Never put a capi_ key in browser, mobile, or public repo code. Call the API from your backend.
- Sandboxes are per conversation. Packages you install in chat stay for that conversation. Save them with Create Agent or Update Environment so every run has them. Saving is done in the agent.creao.ai interface; the API only runs agents.
- An agent that posts, sends, or edits in a connected app follows the agent's write setting. Set it to run automatically if your product needs unattended writes.

### Schedule items mentioning CREAO
"CREAO table: get your account and credits"; "CREAO workshop at Gate 4: zero to your first API run"; "Closing ceremony and winners".

## Hacker Pack: Tech Stack (verbatim strings)

"Build a product where the agent does the work."

**The one requirement**
- At least one CREAO agent does the core work of your project.
- Build that agent on agent.creao.ai (https://agent.creao.ai). You can use more than one.
- In your Devpost README, include a share link to one of the agent's runs and the agent ID (shown on its page).
- Show the agent running in your demo.

**Three ways to plug your code in.** "Every CREAO agent runs in its own Linux sandbox with internet access. You can extend it in any combination of these three ways."
- A. Call your agent from your product: "Every agent can be triggered over HTTPS. Your backend starts a run and gets the result back through a webhook or by polling. Your app handles the UI and data, and the agent handles the work." Continue a conversation with `threadId`; attach up to 10 files per run.
- B. Give the agent new abilities: "Write a CLI or script and install it into the agent's sandbox. Either save it with the agent, or publish it as a skill on GitHub so any agent can use it."
- C. Your services + Secrets: "Deploy your own API or use a sponsor's, and save its key in CREAO's secret manager. The agent can then call that service securely." (Saver's note: the agent runs in CREAO's cloud, so it cannot reach our local /sim API without a tunnel or a deployed endpoint.)

Architecture: "Your frontend talks to your backend. Your backend starts runs on agent.creao.ai through the API Trigger and receives the result by webhook. The agent runs in a sandbox that holds your CLI tools and skills, your secrets as environment variables, and built-in tools." Built-in tools: web search, web fetch, connectors, Browser Use.

**From zero to your first API run**
1. Sign up at agent.creao.ai and send your account email to the CREAO booth. We upgrade every registered hacker to Pro Plus with extra credits for the weekend.
2. Build the agent by chatting. Describe the task, connect the services it needs, and let it run until the result is right. Install any packages or tools it needs in the same chat.
3. Click Create Agent. This saves the workflow, an input form, and the sandbox environment, including anything you installed. Every future run starts from this state.
4. Store your keys. Save API keys for your own services in the secret manager (Secrets). The agent can use them without you pasting them into chat.
5. Create an API key. Either kind works. An account key from Settings → API Keys can run any of your agents. An agent key from an agent's own page runs only that agent. Both start with `capi_`. Keep them on your server.
6. Call it from your backend with the examples below, then build your product around the result.

Auth header: `Authorization: Bearer capi_…`. "Runs usually take a few minutes, so start one, then wait for the webhook or poll."

| Key | Where | Can run | Use for |
|---|---|---|---|
| Account key | Settings → API Keys | Any agent your account can open | Apps that call several agents, and orchestrators |
| Agent key | The agent's own page | Only that agent. Any other returns `APP_SCOPE_RESTRICTED`. | Apps that call one agent, and keys an agent stores for calling others |

"Both keys work on both run routes, and either is fine for your submission. Every run has to name an agent, so there is no call without an `appId`. To send free-form prompts, create one general agent with a single `prompt` input and call it with `"inputs": { "prompt": "…" }`."

| Route | Purpose |
|---|---|
| `POST /api/v1/runs` | Start a run. The agent goes in the body as appId. Returns 202 with a run id. |
| `POST /api/v1/apps/{appId}/runs` | Same, with the agent in the URL instead of the body. |
| `GET /api/v1/runs/{id}` | Status and result. Poll until completed, failed, or cancelled. |
| `GET /api/v1/runs` | List runs. Filter with status, limit, offset. |
| `POST /api/v1/runs/{id}/cancel` | Cancel a run. |

```bash
curl -X POST https://agent.creao.ai/api/v1/runs \
-H "Authorization: Bearer $CREAO_API_KEY" \
-H "Content-Type: application/json" \
-d '{
  "appId": "YOUR_AGENT_ID",
  "inputs": { "company": "Acme Robotics", "depth": "detailed" },
  "webhookUrl": "https://your-app.example/creao-callback?token=RANDOM_SECRET",
  "idempotencyKey": "order-1842-research"
}'

# → 202 { "id": "RUN_ID", "status": "pending", "appId": "…", "appName": "…" }
```

| Field | Meaning |
|---|---|
| appId | Which agent to run, shown on the agent's page. Required on /api/v1/runs. |
| inputs | Values for the agent's input form, as a JSON object. |
| webhookUrl | Public https URL that receives the result. Optional. |
| threadId | Continue a previous run's conversation, so the agent remembers earlier turns. Use the threadId from an earlier result. |
| idempotencyKey | Safe retries: sending the same key again returns the same run instead of starting a new one. 8–128 characters. |
| chatModelId | Request a specific model. Limited by the account's plan. |
| files | Send multipart/form-data instead of JSON to attach up to 10 files (10 MB each). inputs then goes as a JSON string. |

What the webhook receives, and what polling returns in result:

```json
{
"runId": "RUN_ID",
"status": "completed",
"threadId": "THREAD_ID",
"result": {
  "text": "…",
  "chatText": "…",
  "artifacts": [
    { "id": "…", "title": "report.pdf", "type": "file", "url": "https://…" }
  ]
}
}
```

- Webhooks aren't signed. When one arrives, fetch GET /api/v1/runs/{runId} with your key and trust that response. A random token in the callback URL adds a second check.
- Expect duplicates and gaps. We try delivery up to 3 times. De-duplicate on runId, and poll any run that's been pending unusually long.
- Local dev needs a tunnel. Webhooks can't reach localhost or private IPs. Use ngrok or cloudflared, or deploy your callback endpoint.
- Debug in the UI. Every API run appears as a normal conversation in your agent.creao.ai sidebar, titled [API] …, so you can watch what the agent did step by step.

**Tools and secrets, in practice**: In chat, ask the agent to install your tool, confirm it works, then click Create Agent. To change an existing agent, use Update Environment on its page, install, then Save to Agent. Packages installed during a normal run are not saved back. Only Create Agent and Update Environment save the environment. Publish a skill on GitHub: a skill is a public repo (or folder) with a SKILL.md that tells the agent when and how to use your tool, plus any scripts it needs. Paste the URL into Skills → Install from GitHub, or ask the agent in chat to install it. Skills work in every chat and agent on your account, not just one. Keys for your own services go in the secret manager (Secrets). Use keys made for your hackathon project, never a personal or production key.

**Docs links**: Quickstart https://docs.creao.ai/getting-started/quickstart · Agents https://docs.creao.ai/features/agents · API Trigger https://docs.creao.ai/pro/api-trigger · Saving packages https://docs.creao.ai/pro/agent-runtime-environment · Skills and connectors https://docs.creao.ai/features/skills-and-connectors · Secrets https://docs.creao.ai/features/secrets · Browser Use https://docs.creao.ai/features/browser-use · Workflows https://docs.creao.ai/features/workflows · Scheduled runs https://docs.creao.ai/features/scheduled-runs · Sandbox https://docs.creao.ai/pro/sandbox-lifecycle · Workspaces https://docs.creao.ai/features/workspaces · Memory https://docs.creao.ai/features/memory · Index https://docs.creao.ai/llms.txt

---

# [Saved page] https://docs.creao.ai/pro/api-trigger.md (verbatim)

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.creao.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# API Trigger

> Run CREAO agents programmatically through app-scoped API keys or CREAO CLI Account API keys.

## Overview

CREAO supports two API paths for running agents programmatically:

| Path | Create the key in | Key prefix | Endpoint family | Best for |
| - | - | - | - | - |
| App-scoped API Trigger | The agent detail page in `agent.creao.ai` | `capi_` | `https://agent.creao.ai/api/v1/apps/{appId}/runs` | Calling one specific agent from a script or backend |
| CREAO CLI | Developer Console at `developer.creao.ai` | `cr_sk_` | `https://developer.creao.ai/v1/*` | Account-level backend integrations, async runs, realtime streaming, webhooks, and usage analytics |

Both paths run CREAO agents you own and consume credits from your CREAO account balance. CREAO CLI can also create personal agents, update agents by replacing provided fields, and request natural-language edits. They are current supported paths with different key scopes, route families, and request shapes.

> [!TIP]
>
> For the CREAO CLI endpoint reference, see the [API Reference](https://docs.creao.ai/api-reference/overview.md). For a side-by-side contract summary, see [API Paths](https://docs.creao.ai/api-reference/api-paths.md).

> [!WARNING]
>
> API keys are server-side secrets. Do not put `capi_` or `cr_sk_` keys in browser frontend code, mobile apps, public repositories, client logs, or analytics events.

## Which path should I use?

Use the app-scoped API Trigger when you want a key that can run only one agent. This is the path shown from the agent page in `agent.creao.ai`, and it uses `inputs` in the request body.

Use CREAO CLI when your backend owns an account-level integration. CREAO CLI keys can create, edit, and run personal agents owned by the same account, use `agent_id` and `input`, and support async polling, realtime NDJSON streaming, webhooks, and account-level analytics.

## App-scoped API Trigger

Create an app-scoped API key from the agent detail page in `agent.creao.ai`. The key starts with `capi_` and is scoped to that agent.

### Create a run

```bash theme={null}
curl -X POST "https://agent.creao.ai/api/v1/apps/00000000-0000-4000-8000-000000000000/runs" \
  -H "Authorization: Bearer capi_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "company": "Apple",
      "year": "2025"
    }
  }'
```

The response is accepted for background execution:

```json theme={null}
{
  "id": "11111111-1111-4111-8111-111111111111",
  "status": "pending",
  "appId": "00000000-0000-4000-8000-000000000000",
  "appName": "Research Agent"
}
```

### Poll a run

```bash theme={null}
curl "https://agent.creao.ai/api/v1/apps/00000000-0000-4000-8000-000000000000/runs/11111111-1111-4111-8111-111111111111" \
  -H "Authorization: Bearer capi_your_key_here"
```

Poll until `status` becomes `completed`, `failed`, or `cancelled`.

### Download generated files

Polling and webhook results include generated files in `result.artifacts`:

```json theme={null}
{
  "id": "workspaces/your-user-id/your-thread-id/files/report.pdf",
  "title": "Report",
  "type": "application/pdf",
  "url": "https://agent.creao.ai/api/v1/runs/11111111-1111-4111-8111-111111111111/artifacts/download?artifactId=workspaces%2Fyour-user-id%2Fyour-thread-id%2Ffiles%2Freport.pdf"
}
```

Fetch `url` with your API key and follow the redirect:

```bash theme={null}
curl --fail --location "$ARTIFACT_URL" \
  -H "Authorization: Bearer $CREAO_API_KEY" \
  --output report.pdf
```

The URL requires authentication on every request. The key must belong to the run's owner and, if agent-scoped, match the run's agent. Knowing the URL or file ID alone does not grant access. The endpoint is `GET /api/v1/runs/{runId}/artifacts/download?artifactId={artifactId}`; pass the artifact's exact `id` as the encoded query value.

CREAO redirects to a temporary storage URL with a maximum lifetime of one hour (underlying credentials may expire sooner). The storage URL grants access to anyone holding it until it expires. Keep it private. Only send your API key to CREAO; do not forward it to a different origin when following redirects. Curl's `--location` strips the Authorization header on cross-origin redirects; do not use `--location-trusted`.

Save the stable CREAO URL, not the redirect destination. If a storage link expires, fetch the stable URL again to obtain a fresh redirect. Older runs also receive stable URLs when polled. Files remain downloadable only while they remain available at their recorded location; polling retains artifact metadata after a file is deleted.

| Response | Meaning |
| - | - |
| `302` | Follow `Location` to download the file. |
| `401` | Authentication is missing, invalid, or revoked. |
| `404 RUN_NOT_FOUND` | The run does not exist or is inaccessible to this user or agent-scoped key. |
| `404 ARTIFACT_NOT_FOUND` | The artifact is not in the run, is outside the owner's workspace, or the file is unavailable. |
| `400 INVALID_INPUT` | The run ID or artifact parameter is malformed. |
| `500 S3_OPERATION_FAILED` | Storage could not be reached or the download link could not be created; retry the stable URL. |

Errors use the JSON envelope `{ "error": "ERROR_CODE" }`. Existing PDF quarantine restrictions also apply to these downloads.

### Receive the result by webhook

Add `webhookUrl` to the run request, and CREAO POSTs the result to that URL when the run finishes:

```bash theme={null}
curl -X POST "https://agent.creao.ai/api/v1/apps/00000000-0000-4000-8000-000000000000/runs" \
  -H "Authorization: Bearer capi_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": { "company": "Apple", "year": "2025" },
    "webhookUrl": "https://your-server.example/webhooks/creao"
  }'
```

> [!WARNING]
>
> `webhookUrl` must be a public `http` or `https` URL. Localhost, private-network, link-local, and metadata-service targets are rejected when you create the run, or skipped at delivery.

The webhook body:

```json theme={null}
{
  "runId": "11111111-1111-4111-8111-111111111111",
  "status": "completed",
  "threadId": "33333333-3333-4333-8333-333333333333",
  "result": {
    "text": "Apple reported ...",
    "artifacts": []
  }
}
```

`status` is `completed` or `failed`. `result.chatText` is added when the agent's conversational reply differs from `result.text`. The webhook carries no error details; poll the run for its `errorCode`.

Every request carries these headers:

| Header | Value |
| - | - |
| `Content-Type` | `application/json` |
| `X-Creao-Delivery-Id` | A UUID that is the same on every attempt for the run's result |

CREAO makes up to three attempts with short backoff. A non-`2xx` response, a connection error, or no response within 10 seconds is retried. Redirects are not followed, so a `3xx` response counts as a failed attempt. The first `2xx` response ends delivery.

Delivery is at least once. A retry can repeat a request your endpoint already processed, for example when it timed out before responding. Deduplicate on `X-Creao-Delivery-Id` (or `runId`), respond with a `2xx` quickly, and do slow work afterwards.

Webhooks are best-effort, so keep polling as the fallback. A run that fails before it starts executing, for example for insufficient credits, ends without a webhook.

## CREAO CLI

Create an Account API key in [Developer Console](https://developer.creao.ai/). CREAO CLI keys start with `cr_sk_` and are sent as Bearer tokens to `developer.creao.ai/v1/*`.

**1. Create an Account API key**

Open [Developer Console](https://developer.creao.ai/), go to **API Keys**, and create a key. Store the full key immediately because it is shown only once.

**2. Find the agent ID**

Start a personal-agent creation run through `POST /v1/agents` and poll it for the new `agent_id`, or open **Agents** in Developer Console and copy the `agent_id` for an existing agent. Browser-based editing, files, schedules, and debugging still live in `agent.creao.ai`.

**3. Create an async run**

```bash theme={null}
curl -X POST https://developer.creao.ai/v1/runs \
  -H "Authorization: Bearer cr_sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "00000000-0000-4000-8000-000000000000",
    "input": {
      "company": "Apple",
      "year": "2025"
    }
  }'
```

The API returns `202 Accepted` with a run ID and conversation ID:

```json theme={null}
{
  "run_id": "11111111-1111-4111-8111-111111111111",
  "status": "pending",
  "agent_id": "00000000-0000-4000-8000-000000000000",
  "conversation_id": "22222222-2222-4222-8222-222222222222"
}
```

**4. Poll for the result**

```bash theme={null}
curl https://developer.creao.ai/v1/runs/11111111-1111-4111-8111-111111111111 \
  -H "Authorization: Bearer cr_sk_your_key_here"
```

Poll until `status` becomes `completed`, `failed`, or `cancelled`.

## CREAO CLI reference

### Create an agent

```
POST /v1/agents
```

#### JSON body

| Field | Type | Required | Description |
| - | - | - | - |
| `input` | string | Yes | Natural-language request describing the agent to create, up to 256 KB serialized |
| `conversation_id` | UUID | No | Existing creation conversation to continue |
| `webhook_url` | string | No | Public `http` or `https` URL for the terminal result |

Returns `202 Accepted` with a queued `run_id`, `conversation_id`, and `agent_id: null`. Poll `GET /v1/runs/:run_id`; when the creation run completes, the response includes the new agent ID in both `agent_id` and `result.agent_id`.

### Update an agent

```
PATCH /v1/agents/:agent_id
```

Update an agent by replacing provided fields. Omitted fields are unchanged; this endpoint does not interpret natural-language instructions. The body can include any supported create field plus optional `release_note`. The target must be a personal agent owned by the Account key owner. Team, shared, deleted, or foreign agents return `AGENT_NOT_FOUND`.

### Edit an agent from instructions

```
POST /v1/agents/:agent_id/edits
```

Start an async natural-language edit for an agent. Use this when your product wants to say what should change, for example:

```json theme={null}
{
  "instructions": "Add a valuation sensitivity table for the selected ticker and include a short downside-risk note.",
  "release_note": "Add valuation sensitivity section."
}
```

Returns `202 Accepted` with `run_id`, `agent_id`, `status`, and timestamps. Poll `GET /v1/agents/:agent_id/edits/:run_id` until `status` is `succeeded`, `failed`, or `cancelled`.

### Create an async run

```
POST /v1/runs
```

#### JSON body

| Field | Type | Required | Description |
| - | - | - | - |
| `agent_id` | UUID | Yes | Active personal CREAO agent to run |
| `input` | JSON | Yes | Structured input for the agent, up to 256 KB serialized |
| `conversation_id` | UUID | No | Reuse an existing CREAO CLI conversation/thread |
| `webhook_url` | string | No | Public `http` or `https` URL to receive the terminal run result |

Returns `202 Accepted` with a run object.

### Get run status

```
GET /v1/runs/:run_id
```

Returns the run object for the authenticated Account key owner.

| Field | Type | Description |
| - | - | - |
| `run_id` | UUID | Run ID |
| `status` | string | `pending`, `running`, `completed`, `failed`, or `cancelled` |
| `agent_id` | UUID | Agent that ran |
| `conversation_id` | UUID \| null | Conversation/thread ID for follow-up runs |
| `result` | JSON | Final agent output, present after completion |
| `usage.credits` | number | Credits used by the run, when available |
| `error.code` | string | Machine-readable failure code, when failed |
| `created_at` | string | ISO timestamp for run creation |
| `started_at` | string \| null | ISO timestamp for execution start |
| `completed_at` | string \| null | ISO timestamp for terminal status |
| `webhook_delivered_at` | string \| null | ISO timestamp for successful webhook delivery |

### List runs

```
GET /v1/runs?status=completed&limit=20&offset=0
```

Query parameters:

| Parameter | Default | Max | Description |
| - | - | - | - |
| `status` | - | - | Filter by `pending`, `running`, `completed`, `failed`, or `cancelled` |
| `limit` | `20` | `100` | Number of runs to return |
| `offset` | `0` | - | Number of runs to skip |

Response:

```json theme={null}
{
  "runs": [],
  "limit": 20,
  "offset": 0
}
```

## Realtime runs

Use CREAO CLI realtime runs when your backend wants streamed progress and output.

```
POST /v1/realtime/runs
```

Body fields:

| Field | Type | Required | Description |
| - | - | - | - |
| `agent_id` | UUID | Yes | Active personal CREAO agent to run |
| `input` | JSON | Yes | Structured input for the agent, up to 256 KB serialized |
| `conversation_id` | UUID | No | Reuse an existing CREAO CLI conversation/thread |

Example:

```bash theme={null}
curl -N -X POST https://developer.creao.ai/v1/realtime/runs \
  -H "Authorization: Bearer cr_sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "00000000-0000-4000-8000-000000000000",
    "input": { "query": "Summarize the latest quarterly report" }
  }'
```

The response is `application/x-ndjson`. Each line is one `{ "type": "..." }` object. Events include:

| Event | Meaning |
| - | - |
| `run.created` | Run record and conversation have been created (`render_protocol: 1`) |
| `message.created` | A new assistant message started |
| `output_text.delta` | Incremental text output |
| `thinking.started` / `thinking.delta` / `thinking.completed` | Model thinking |
| `search.started` / `search.completed` | Web or academic search card |
| `todo.updated` | Replace-all todo list |
| `tool.started` | An opaque tool call started (no input) |
| `tool.completed` | An opaque tool call completed (no output) |
| `artifact.created` | An artifact was produced |
| `run.completed` | Run finished successfully |
| `run.failed` | Run failed |
| `error` | Stream-level error |
| `ping` | Keepalive event |

## Conversations

Pass a previous `conversation_id` to continue the same thread of work with the same agent through CREAO CLI:

```bash theme={null}
curl -X POST https://developer.creao.ai/v1/runs \
  -H "Authorization: Bearer cr_sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "00000000-0000-4000-8000-000000000000",
    "conversation_id": "22222222-2222-4222-8222-222222222222",
    "input": { "follow_up": "Turn that into a slide outline" }
  }'
```

## Webhooks

CREAO CLI async runs can deliver the terminal result to your backend:

```bash theme={null}
curl -X POST https://developer.creao.ai/v1/runs \
  -H "Authorization: Bearer cr_sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "00000000-0000-4000-8000-000000000000",
    "input": { "query": "quarterly revenue" },
    "webhook_url": "https://your-server.example/webhooks/creao"
  }'
```

> [!WARNING]
>
> `webhook_url` must be a publicly reachable `http` or `https` URL. URLs pointing to private networks are rejected.

Delivery works the same way as on the app-scoped path: up to three attempts, no redirects followed, and one `X-Creao-Delivery-Id` across attempts. See [Webhooks](https://docs.creao.ai/developer-api/webhooks.md) for the CREAO CLI payload.

## Keep request shapes separate

Do not mix the two route families:

| App-scoped API Trigger | CREAO CLI |
| - | - |
| `Authorization: Bearer capi_...` | `Authorization: Bearer cr_sk_...` |
| `POST /api/v1/apps/{appId}/runs` | `POST /v1/runs` |
| URL-scoped `appId` | Body field `agent_id` |
| Body field `inputs` | Body field `input` |
| Agent-page key management | Developer Console key management |

## Rate limits

CREAO CLI requests are account-scoped and enforced before execution starts. The Developer Console dashboard shows your plan, available credits, and active rate limit.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.