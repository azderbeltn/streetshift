# Elastic (Serverless + Agent Builder + Workflows): reference for StreetShift

Sources:
- The official Cal Hacks starter, cloned to `docs/elastic-starter/` (from https://github.com/jdarmada/calhacks-paper-scout, `.git` removed). Its key files are `paper-scout/common.py`, `ingest.py`, `app.py`, `setup_agent.py` and `workflows/paper-digest.yaml`.
- The official docs at elastic.co/docs, fetched 2026-10-24. URLs are listed in Part C.

Code marked **[starter, verbatim]** is copied exactly from the starter. Code marked **[docs]** is restated from elastic.co pages.

---

## Part A. The starter's patterns

### A.0 Architecture (from paper-scout/README.md)

```
arXiv API ──► ingest.py ──► Elasticsearch Serverless (index: papers)
                                │  semantic_text ← Jina v5 embeddings (auto)
                                │
        ┌───────────────────────┼──────────────────────────────┐
        ▼                       ▼                              ▼
   app.py search          Agent Builder agent             Workflow: paper-digest
   keyword | semantic     tools: index_search,            search ► ai.agent ► index
   | hybrid + rerank      2× ES|QL, workflow              (manual, daily, or as a tool)
                                │
                                └──► MCP endpoint ► Claude Code / Cursor / your app
```

Run order: `uv run ingest.py`, then `uv run setup_agent.py`, then `uv run app.py`. Every script uses PEP 723 inline deps:

```python
# /// script
# requires-python = ">=3.10"
# dependencies = ["elasticsearch>=9", "requests", "python-dotenv"]
# ///
```

### A.1 Clients and config (common.py) [starter, verbatim]

```python
ES_URL = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
# On Elastic Cloud the Kibana URL is the Elasticsearch URL with ".es." swapped for ".kb.".
KIBANA_URL = (os.environ.get("KIBANA_URL") or ES_URL.replace(".es.", ".kb.", 1)).rstrip("/")
if KIBANA_URL == ES_URL.rstrip("/"):
    KIBANA_URL = ""  # not an Elastic Cloud URL, so we can't guess
API_KEY = os.environ.get("ELASTIC_API_KEY", "")
INDEX = os.environ.get("PAPERS_INDEX", "papers")
# Jina v5 is the default semantic_text model on Serverless; we name it explicitly so it's visible.
EMBEDDING_ID = os.environ.get("EMBEDDING_INFERENCE_ID", ".jina-embeddings-v5-text-small")
AGENT_ID = os.environ.get("AGENT_ID", "paper-scout")


def es() -> Elasticsearch:
    if API_KEY:
        return Elasticsearch(ES_URL, api_key=API_KEY, request_timeout=120)
    return Elasticsearch(ES_URL, request_timeout=120)


def kibana(method: str, path: str, **kwargs) -> requests.Response:
    """Call a Kibana API (Agent Builder, Workflows) with the same API key."""
    if not KIBANA_URL:
        raise RuntimeError("KIBANA_URL is not set in .env")
    headers = {
        "Authorization": f"ApiKey {API_KEY}",
        "kbn-xsrf": "true",
        "Content-Type": "application/json",
        "x-elastic-internal-origin": "Kibana",
    }
    return requests.request(method, f"{KIBANA_URL}{path}", headers=headers, timeout=300, **kwargs)


def find_reranker(client: Elasticsearch) -> str | None:
    """Pick a rerank endpoint if the project has one (prefers Jina)."""
    if os.environ.get("RERANK_INFERENCE_ID"):
        return os.environ["RERANK_INFERENCE_ID"]
    try:
        endpoints = client.inference.get(task_type="rerank").get("endpoints", [])
    except Exception:
        return None
    ids = [e["inference_id"] for e in endpoints]
    # newest Jina text reranker first (m0 is the multimodal one)
    jina = sorted((i for i in ids if "jina" in i and "m0" not in i), reverse=True)
    return (jina or ids or [None])[0]
```

Kibana headers on every request: `Authorization: ApiKey <key>`, `kbn-xsrf: true`, `Content-Type: application/json` and `x-elastic-internal-origin: Kibana`. One API key works for both Elasticsearch and Kibana.

### A.2 Index with semantic_text (ingest.py) [starter, verbatim]

The script checks that the inference endpoint exists before naming it in the mapping. If it doesn't exist, it falls back to the cluster's default model.

```python
def create_index(client, recreate: bool):
    if client.indices.exists(index=INDEX):
        if not recreate:
            print(f"Index '{INDEX}' exists, adding to it (use --recreate to start fresh)")
            return
        client.indices.delete(index=INDEX)

    semantic = {"type": "semantic_text"}
    try:
        client.inference.get(inference_id=EMBEDDING_ID)
        semantic["inference_id"] = EMBEDDING_ID
        print(f"Embedding with {EMBEDDING_ID}")
    except Exception:
        print(f"{EMBEDDING_ID} not found here, using this cluster's default semantic_text model")

    client.indices.create(
        index=INDEX,
        mappings={
            "properties": {
                "arxiv_id": {"type": "keyword"},
                "title": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
                "abstract": {"type": "text"},
                "content": semantic,
                "authors": {"type": "keyword"},
                "primary_category": {"type": "keyword"},
                "categories": {"type": "keyword"},
                "published": {"type": "date"},
                "updated": {"type": "date"},
                "url": {"type": "keyword", "index": False},
                "pdf_url": {"type": "keyword", "index": False},
            }
        },
    )
```

The resulting mapping JSON for the semantic field is:

```json
"content": { "type": "semantic_text", "inference_id": ".jina-embeddings-v5-text-small" }
```

Pattern details:
- The doc keeps a plain `text` field (`abstract`) for BM25 and the reranker, and a separate `semantic_text` field (`content`, title plus abstract) for Jina.
- Each doc sets `"_id"` explicitly, so re-ingesting overwrites the same doc instead of duplicating it. Example: `"content": f"{title}\n\n{abstract}"`.
- Elastic chunks and embeds the text at index time. No embedding pipeline is needed.

### A.3 Bulk ingest (ingest.py) [starter, verbatim]

```python
ok, errors = helpers.bulk(
    client,
    ({"_index": INDEX, **d} for d in docs),
    chunk_size=args.batch,  # embeddings are computed during bulk, so keep batches modest
    raise_on_error=False,
)
...
client.indices.refresh(index=INDEX)
print(f"Done. {client.count(index=INDEX)['count']} papers in '{INDEX}' (+{total} this run)")
```

The default `--batch` is 50. Embedding happens inside the bulk call, so keep chunks small.

### A.4 Search three ways (app.py) [starter, verbatim]

```python
def keyword_query(q):
    """Classic BM25: great when you know the exact words."""
    return {"multi_match": {"query": q, "fields": ["title^2", "abstract", "authors"]}}


def semantic_query(q):
    """Jina embeddings via semantic_text: great when you know the idea, not the words."""
    return {"semantic": {"field": "content", "query": q}}


def hybrid_retriever(q):
    """Both, fused with Reciprocal Rank Fusion, then (optionally) reranked by a cross-encoder."""
    rrf = {
        "rrf": {
            "retrievers": [
                {"standard": {"query": keyword_query(q)}},
                {"standard": {"query": semantic_query(q)}},
            ],
            "rank_window_size": 50,
        }
    }
    if not RERANKER:
        return rrf
    return {
        "text_similarity_reranker": {
            "retriever": rrf,
            "field": "abstract",
            "inference_id": RERANKER,
            "inference_text": q,
            "rank_window_size": 20,
        }
    }
```

The call is `client.search(index=INDEX, retriever=hybrid_retriever(q), size=size, source=SOURCE)`. If the reranker throws an error, the app falls back to plain RRF:

```python
rrf = hybrid_retriever(q)
rrf = rrf.get("text_similarity_reranker", {}).get("retriever", rrf)
```

The retriever as raw JSON:

```json
{
  "retriever": {
    "text_similarity_reranker": {
      "retriever": {
        "rrf": {
          "retrievers": [
            { "standard": { "query": { "multi_match": { "query": "Q", "fields": ["title^2", "abstract", "authors"] } } } },
            { "standard": { "query": { "semantic": { "field": "content", "query": "Q" } } } }
          ],
          "rank_window_size": 50
        }
      },
      "field": "abstract",
      "inference_id": "<rerank endpoint>",
      "inference_text": "Q",
      "rank_window_size": 20
    }
  }
}
```

"More like this" with no ML code (verbatim):

```python
query={"bool": {"must": semantic_query(paper["abstract"]), "must_not": {"ids": {"values": [paper_id]}}}}
```

ES|QL from Python, with a named parameter (verbatim):

```python
resp = client.esql.query(
    query=(
        f"FROM {INDEX} | WHERE MATCH(abstract, ?q, {{\"operator\": \"AND\"}}) "
        "| EVAL month = DATE_TRUNC(1 month, published) "
        "| STATS papers = COUNT(*) BY month | SORT month ASC"
    ),
    params=[{"q": q}],
)
cols = [c["name"] for c in resp["columns"]]
rows = [dict(zip(cols, r)) for r in resp["values"]]
```

### A.5 Agent Builder tools and agent (setup_agent.py) [starter, verbatim]

```python
TOOLS = [
    {
        "id": "papers_search",
        "type": "index_search",
        "description": (
            "Search recent arXiv research papers (title, abstract, authors, categories, dates). "
            "Use for any question about what research exists on a topic, finding specific papers, "
            "or comparing approaches. Results include the arXiv URL to cite."
        ),
        "configuration": {"pattern": INDEX},
    },
    {
        "id": "papers_topic_trend",
        "type": "esql",
        "description": (
            "Count papers per month that mention a keyword or phrase, broken down by arXiv category. "
            "Use for 'is X trending', 'how much research is there on X', or 'which fields work on X'. "
            "The index holds the same number of papers per category per month, so monthly counts are directly comparable."
        ),
        "configuration": {
            "query": (
                f"FROM {INDEX} | WHERE MATCH(abstract, ?topic, {{\"operator\": \"AND\"}}) "
                "| EVAL month = DATE_TRUNC(1 month, published) "
                "| STATS papers = COUNT(*) BY month, primary_category "
                "| SORT month DESC, papers DESC | LIMIT 60"
            ),
            "params": {"topic": {"type": "string", "description": "Keyword or phrase, e.g. 'diffusion'"}},
        },
    },
    {
        "id": "papers_top_authors",
        "type": "esql",
        "description": (
            "Find the most prolific authors on a topic. Use for 'who works on X', "
            "'who should I follow / reach out to about X'."
        ),
        "configuration": {
            "query": (
                f"FROM {INDEX} | WHERE MATCH(abstract, ?topic, {{\"operator\": \"AND\"}}) "
                "| STATS papers = COUNT(*), latest = MAX(published) BY authors "
                "| SORT papers DESC, latest DESC | LIMIT 15"
            ),
            "params": {"topic": {"type": "string", "description": "Keyword or phrase, e.g. 'robot grasping'"}},
        },
    },
    {
        "id": "papers_write_digest",
        "type": "workflow",
        "description": (
            "Generate and SAVE a research digest for a topic (runs the paper-digest workflow). "
            "Use only when the user asks for a digest, briefing, or report to be created or saved."
        ),
        "configuration": {"workflow_id": None},  # filled in after the workflow is uploaded
    },
]

AGENT = {
    "id": AGENT_ID,
    "name": "Paper Scout",
    "description": "Research assistant over thousands of recent arXiv papers.",
    "labels": ["calhacks", "research"],
    "avatar_color": "#48EFCF",
    "avatar_symbol": "PS",
    "configuration": {
        "instructions": (
            "You are Paper Scout, a research assistant for hackathon builders.\n"
            "- Always ground answers in the papers index using your tools. Never invent papers.\n"
            "- Only state facts that come from tool results (no affiliations or claims from memory).\n"
            "- Cite every paper you mention as [Title](arXiv URL).\n"
            "- Prefer recent work and say when evidence is thin.\n"
            "- When asked for project ideas, connect 2-3 specific papers to a concrete build that fits a weekend.\n"
            "- For trend questions use papers_topic_trend; for people use papers_top_authors.\n"
            "- Keep answers tight: bullets over paragraphs."
        ),
        "tools": [{"tool_ids": [t["id"] for t in TOOLS]}],
    },
}
```

Tool types: `index_search` uses `configuration.pattern`. `esql` uses `configuration.query` with `?param` placeholders plus `configuration.params: {name: {type, description}}`. `workflow` uses `configuration.workflow_id`.

Idempotent upsert (verbatim). The script does a GET first. If the object exists, it sends a PUT without `id`, `type` or `name`. Otherwise it sends a POST.

```python
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
```

`kind` is either `tools` or `agents`. The script runs in this order:
1. Create the output index and pipeline.
2. Upsert the workflow and get its id.
3. Inject the workflow id into the workflow tool.
4. Upsert the tools.
5. Upsert the agent.
6. Run a smoke test.

```python
r = kibana("POST", "/api/agent_builder/tools/_execute",
           json={"tool_id": "papers_top_authors", "tool_params": {"topic": "agents"}})
```

Output index with an auto-timestamp pipeline (verbatim):

```python
client.ingest.put_pipeline(
    id="paper-digests-timestamp",
    processors=[{"set": {"field": "@timestamp", "value": "{{_ingest.timestamp}}"}}],
)
if not client.indices.exists(index="paper-digests"):
    client.indices.create(
        index="paper-digests",
        settings={"index.default_pipeline": "paper-digests-timestamp"},
        mappings={"properties": {
            "@timestamp": {"type": "date"},
            "topic": {"type": "keyword"},
            "digest": {"type": "text"},
        }},
    )
```

Workflow upsert (verbatim). The body is `{"yaml": <raw yaml string>}`.

```python
def upsert_workflow() -> str | None:
    existing = kibana("GET", "/api/workflows", params={"query": "paper-digest", "size": 100})
    if existing.ok:
        for wf in existing.json().get("results", []):
            if wf.get("name") == "paper-digest":
                r = kibana("PUT", f"/api/workflows/workflow/{wf['id']}", json={"yaml": WORKFLOW_YAML})
                print(f"  workflow paper-digest: updated ({r.status_code})")
                return wf["id"]
    # Newer Kibana: /api/workflows/workflow, older: /api/workflows
    for path in ("/api/workflows/workflow", "/api/workflows"):
        r = kibana("POST", path, json={"yaml": WORKFLOW_YAML})
        if r.ok:
            print("  workflow paper-digest: created")
            return r.json().get("id")
    print(f"  workflow paper-digest: FAILED {r.status_code} {r.text[:300]}")
    print("  (Workflows may need enabling: Stack Management > Advanced Settings > workflows:ui:enabled)")
    return None
```

### A.6 Chat with the agent (app.py) [starter, verbatim]

```python
payload = {"input": body.message, "agent_id": AGENT_ID}
if body.conversation_id:
    payload["conversation_id"] = body.conversation_id
r = kibana("POST", "/api/agent_builder/converse", json=payload)
data = r.json()
tools = [
    {"tool": s.get("tool_id"), "params": s.get("params")}
    for s in data.get("steps", [])
    if s.get("type") == "tool_call"
]
return {
    "conversation_id": data.get("conversation_id"),
    "message": data.get("response", {}).get("message", ""),
    "tools": tools,
}
```

The response shape is `conversation_id`, `response.message`, and `steps[]`. Steps with `type == "tool_call"` carry `tool_id` and `params`.

### A.7 Workflow YAML (workflows/paper-digest.yaml) [starter, verbatim]

```yaml
version: "1"
name: paper-digest
description: >-
  Builds a research digest for a topic: finds the most relevant papers with
  semantic search, has an agent write a short briefing, and saves it to the
  paper-digests index. Runs on demand, every morning, or as an agent tool.
enabled: true
tags: ["calhacks", "papers"]

triggers:
  - type: manual
  - type: scheduled
    with:
      every: 1d

inputs:
  - name: topic
    type: string
    description: Research topic to brief on, e.g. "small language models for robotics"
    default: "AI agents that use tools"  # scheduled runs get no inputs, so steps also use | default

steps:
  # 1. Retrieve: semantic search over the Jina-embedded papers
  - name: find_papers
    type: elasticsearch.search
    with:
      index: papers
      size: 8
      query:
        semantic:
          field: content
          query: '{{ inputs.topic | default: "AI agents that use tools" }}'
      _source: ["title", "abstract", "url", "published", "authors"]

  # 2. Reason: hand the papers to an Agent Builder agent
  - name: write_digest
    type: ai.agent
    agent-id: elastic-ai-agent
    with:
      message: |
        You are writing a short research briefing for a hackathon team on: {{ inputs.topic | default: "AI agents that use tools" }}.
        Using ONLY the papers below, write:
        - a 2 sentence overview of where the field is
        - the 3 most interesting papers, each with one line on why it matters and its link
        - one open problem a team could build a weekend project around
        Papers:
        {{ steps.find_papers.output.hits.hits | json }}

  # 3. Act: store the digest so apps, dashboards, or other agents can use it
  - name: save_digest
    type: elasticsearch.index
    with:
      index: paper-digests
      document:
        topic: '{{ inputs.topic | default: "AI agents that use tools" }}'
        digest: "{{ steps.write_digest.output.message }}"

  - name: log
    type: console
    with:
      message: "{{ steps.write_digest.output.message }}"
```

How the workflow works:
- **Triggers:** `manual` and `scheduled` (`with: every: 1d`). Scheduled runs get no inputs, so every template uses `| default:`.
- **Templating:** Liquid. Templates reference `inputs.X`, `steps.<name>.output...`, and the `| json` filter.
- **Steps:** search, then `ai.agent`, then index. The `ai.agent` step's `agent-id` sits at the top level of the step, outside `with`. The starter uses the built-in `elastic-ai-agent`, but you can point it at your own agent instead. The step's output text is at `steps.<name>.output.message`.
- **Agent use:** the agent calls the workflow through a `type: workflow` tool whose `configuration.workflow_id` is the id returned on upload. The workflow's `inputs` become the tool's parameters.

### A.8 MCP (from README) [starter, verbatim]

```bash
claude mcp add --transport http paper-scout "$KIBANA_URL/api/agent_builder/mcp" --header "Authorization: ApiKey $ELASTIC_API_KEY"
```

PowerShell form for StreetShift:

```powershell
claude mcp add --transport http streetshift "$env:KIBANA_URL/api/agent_builder/mcp" --header "Authorization: ApiKey $env:ELASTIC_API_KEY"
```

---

## Part B. Environment variables used by the starter

| Var | Default | Notes |
|---|---|---|
| `ELASTICSEARCH_URL` | `http://localhost:9200` | From the Serverless project's "Connection details" |
| `KIBANA_URL` | the ES URL with `.es.` replaced by `.kb.` | Optional on Elastic Cloud |
| `ELASTIC_API_KEY` | (empty) | Used for both ES and Kibana as `ApiKey <key>` |
| `PAPERS_INDEX` | `papers` | |
| `EMBEDDING_INFERENCE_ID` | `.jina-embeddings-v5-text-small` | |
| `RERANK_INFERENCE_ID` | auto-detected | Prefers the newest Jina reranker. Otherwise it takes the first rerank endpoint. |
| `AGENT_ID` | `paper-scout` | |

---

## Part C. Official Elastic docs (current references)

### C.1 Agent Builder Kibana API [docs]
https://www.elastic.co/docs/solutions/search/agent-builder/kibana-api (redirects to explore-analyze/ai-features/agent-builder/kibana-api). Full reference: https://www.elastic.co/docs/api/doc/kibana/group/endpoint-agent-builder

Headers:
- `Authorization: ApiKey ${API_KEY}` on every request.
- `kbn-xsrf: true` on POST, PUT and DELETE.
- `Content-Type: application/json` when there is a body.
- For a non-default space, prefix the path with `/s/<space>` (for example `/s/<space>/api/agent_builder/...`).

Tools:
- `GET /api/agent_builder/tools`
- `POST /api/agent_builder/tools`
- `GET|PUT|DELETE /api/agent_builder/tools/{id}`
- `POST /api/agent_builder/tools/_execute` with `{"tool_id": "...", "tool_params": {...}}`

Tool body fields:
- `id`, `type` and `configuration` are required. `type` is one of `esql`, `index_search`, `workflow` or `mcp`.
- `description` and `tags` (default `[]`) are optional.
- `confirmation: {askUser: "once"|"always"|"never"}` is optional.

Example (docs):
```json
{
  "id": "example-esql-tool",
  "type": "esql",
  "description": "Example ES|QL query tool for analyzing financial trades with time filtering",
  "tags": ["analytics", "finance"],
  "configuration": {
    "query": "FROM financial_trades | WHERE execution_timestamp >= ?startTime | STATS trade_count=COUNT(*), avg_price=AVG(execution_price) BY symbol | SORT trade_count DESC | LIMIT ?limit",
    "params": {
      "startTime": { "type": "date", "description": "Start time for the analysis in ISO format" },
      "limit": { "type": "integer", "description": "Maximum number of results to return" }
    }
  }
}
```

Agents:
- `GET|POST /api/agent_builder/agents`
- `GET|PUT|DELETE /api/agent_builder/agents/{id}`
- `POST /api/agent_builder/agents/{agent_id}/consumption`
- `PUT /api/agent_builder/agents/{id}/access_control`

Agent body (docs):
```json
{
  "id": "new-agent-id",
  "name": "Search Index Helper",
  "description": "Searches indices with the content- prefix",
  "labels": ["custom-indices"],
  "avatar_color": "#BFDBFF",
  "avatar_symbol": "SI",
  "access_control": { "access_mode": "shared" },
  "configuration": {
    "instructions": "Help the user search indices starting with content-.",
    "tools": [{ "tool_ids": ["platform.core.search", "platform.core.list_indices"] }]
  }
}
```

Built-in tools include `platform.core.search` and `platform.core.list_indices`. The built-in agent id is `elastic-ai-agent`.

Note: `configuration.workflow_ids` on an agent is for pre-execution workflows that run on every turn. It is not how you add workflow tools.

Converse:
- `POST /api/agent_builder/converse` with `{"input": "...", "agent_id": "..."}`. Add `"conversation_id"` to continue a conversation.
- `POST /api/agent_builder/converse/async` streams the response.
- Conversations: `GET|POST /api/agent_builder/conversations` and `GET|DELETE /api/agent_builder/conversations/{id}`.

### C.2 ES|QL tool parameters [docs]
https://www.elastic.co/docs/solutions/search/agent-builder/tools/esql-tools

Syntax and types:
- Reference a parameter in the query as `?name`.
- Allowed types on Serverless and 9.4+: `string`, `integer`, `float`, `boolean`, `date` and `array`. On 9.2–9.3 the types were `text`, `keyword`, `long`, `integer`, `double`, `float`, `boolean`, `date`, `object` and `nested`.

Optional parameters:
- A parameter can be optional. Via the API, defaults are not required but are strongly recommended. An optional parameter the agent leaves out becomes `null`, which can break the query.
- Unverified: the exact JSON key names for optional parameters and defaults (likely `optional: true` and `defaultValue`). Confirm with `GET /api/agent_builder/tools/{id}` after creating the tool in the UI.

Keep parameters as simple scalars. The starter's `?topic` inside `MATCH(field, ?topic, {"operator":"AND"})` is a proven pattern.

### C.3 index_search tool [docs]
https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools/index-search-tools

Configuration fields:
- `pattern` (required): an index, alias or pattern, such as `"businesses,reviews"` or a wildcard.
- `row_limit` (optional).
- `custom_instructions` (optional).

The docs suggest adding an index mapping `_meta.description` to tell the agent what the index holds.

### C.4 Workflow tools [docs]
https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/tools/workflow-tools and https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/agents-and-workflows

How they work:
- Inputs are detected automatically from the workflow YAML's `inputs`, and the agent fills them from the chat.
- The workflow's final output returns to the chat.
- The tool can require confirmation: Never, Once or Always.
- The official docs don't list the API field. The starter uses `configuration.workflow_id`.
- A workflow can call Agent Builder APIs with a `kibana.request` step:

```yaml
- name: list_agents
  type: kibana.request
  with:
    method: GET
    path: /api/agent_builder/agents
```

### C.5 Workflows [docs]
Overview: https://www.elastic.co/docs/explore-analyze/workflows. API: https://www.elastic.co/docs/api/doc/serverless/group/endpoint-workflows

YAML structure:
- Metadata: `name`, `description`, `enabled`, `tags`.
- `consts`.
- `inputs`: each has `name`, `type`, and optional `required`, `default` and `description`.
- `triggers`: `manual`, `scheduled` (`with: {every: 1d}`) or `alert`.
- `steps`: each has `name`, `type` and `with`.
- Templating is Liquid: `{{ inputs.x }}`, `{{ consts.x }}`, `{{ steps.s.output... }}`.

Step families:
- Action steps: `elasticsearch.search`, `elasticsearch.index`, `kibana.request`, `console`, and more.
- Flow control: `if`, `switch`, `foreach`, `while`, `loop.break`, `loop.continue`, `parallel` (preview), `wait` and `waitForInput`.
- AI steps: `ai.prompt`, `ai.classify`, `ai.summarize` and `ai.agent`.
- Data steps and composition steps (workflows calling workflows).

`ai.agent` step (https://www.elastic.co/docs/explore-analyze/workflows/steps/ai-steps):
```yaml
- name: <step_name>
  type: ai.agent
  agent-id: <optional; defaults to built-in elastic-ai-agent>   # top level
  inference-id: <optional>                                      # top level (connector-id is deprecated; don't set both)
  create-conversation: <optional bool>
  with:
    message: <required, Liquid>
    schema: <optional JSON Schema -> structured_output>
    conversation_id: <optional>
```
Outputs: `message` (always), `structured_output` (when `schema` is set), and `conversation_id`.

`ai.prompt` step:
- Top-level `connector-id`.
- `with: {prompt, systemPrompt, schema, temperature}`.
- Output: `content` and `metadata`.

Workflows REST API (Serverless):
- `POST /api/workflows/workflow` creates one workflow from `{"yaml": "..."}`. You can also pass a custom id (3–255 characters, lowercase letters, digits and hyphens). The response includes `id` and `valid`.
- `POST /api/workflows` is the bulk create: `{"workflows": [...]}` plus an `?overwrite=` query parameter.
- `GET /api/workflows` lists workflows (the starter passes `?query=&size=`, and the response has `results[]`).
- `GET|PUT|DELETE /api/workflows/workflow/{id}`.
- `POST /api/workflows/workflow/{id}/run` with `{"inputs": {...}, "metadata": {...}?}` returns `{"workflowExecutionId": "..."}`. Privilege: `workflowsManagement:execute`. The workflow must be enabled and valid.
- Executions:
  - `GET /api/workflows/executions/{executionId}`
  - `GET /api/workflows/executions/{executionId}/steps`
  - `GET /api/workflows/executions/{executionId}/logs`
  - `GET /api/workflows/workflow/{workflowId}/executions`
- `POST /api/workflows/test` runs a saved workflow by id, or an unsaved YAML draft.
- `GET /api/workflows/schema` returns the YAML JSON schema. Useful for validating a workflow before deploying it.
- Creating a workflow needs `workflowsManagement:create`.
- The Kibana plugin README mentions an `elastic-api-version: 2023-10-31` header for public routes. The starter doesn't send it. Add it only if requests fail.
- If Workflows are disabled: Stack Management > Advanced Settings > `workflows:ui:enabled`.

### C.6 Agent Builder MCP server [docs]
https://www.elastic.co/docs/solutions/search/agent-builder/mcp-server and https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server-api-keys

Endpoints:
- Default space: `{KIBANA_URL}/api/agent_builder/mcp`
- Custom space: `{KIBANA_URL}/s/{SPACE}/api/agent_builder/mcp`

The endpoint exposes every Agent Builder tool. Authenticate with the header `Authorization: ApiKey <key>`. OAuth 2.1 is also available on Serverless.

The API key needs these privileges:
- Kibana application privileges `feature_agentBuilder.read` and `feature_actions.read` on the `default` space. Without them you get 403.
- Cluster privilege `monitor_inference`.
- Index privileges `read` and `view_index_metadata` on the indexes you search. Narrow the list for production.

Create the key with `POST /_security/api_key` and a `mcp-access` role descriptor. For clients that only speak stdio, such as Claude Desktop, use `npx mcp-remote <url> --header "Authorization:${AUTH_HEADER}"` with `AUTH_HEADER="ApiKey <key>"`.

The older standalone `elastic/mcp-server-elasticsearch` is deprecated in favor of this endpoint.

### C.7 semantic_text and Jina on Serverless [docs]
https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/semantic-text and https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/semantic-text-setup-configuration

Default embedding endpoint by version:

| Deployment | Default `inference_id` |
|---|---|
| Serverless and ECH 9.4+ | `.jina-embeddings-v5-text-small` (on EIS) |
| 9.3 | `.elser-2-elastic` |
| 9.0–9.2 | `.elser-2-elasticsearch` |

Elastic warns that the default can change to a newer model later, so set `inference_id` explicitly (the starter does).

Mapping options:
```json
{ "mappings": { "properties": {
  "review_text": {
    "type": "semantic_text",
    "inference_id": ".jina-embeddings-v5-text-small",
    "chunking_settings": { "strategy": "word", "max_chunk_size": 120, "overlap": 40 }
  }
}}}
```

`search_inference_id` and `index_options` are also accepted. To query, use `{"semantic": {"field": "...", "query": "..."}}`. A `match` query on a semantic_text field also works.

Other EIS models:
- `jina-embeddings-v3`
- `jina-embeddings-v5-omni-small` and `-nano` (multimodal)
- `.elser-2-elastic` (sparse)

### C.8 Retrievers and reranking [docs]
- RRF: https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/rrf-retriever
  - `retrievers`: a list of child retrievers. Since 9.2 each child can take a `weight` (default 1.0).
  - `rank_constant`: default 60, minimum 1.
  - `rank_window_size`: default 10, and must be at least `size`.
  - Shorthand: `query` plus `fields` (multi-field format, 9.1+). You can't combine it with `retrievers`.
  - `filter`: applied to every child retriever.
- text_similarity_reranker: https://www.elastic.co/docs/reference/elasticsearch/rest-apis/retrievers/text-similarity-reranker-retriever
  - `retriever`: the child retriever.
  - `field` and `inference_text`: both required.
  - `inference_id`: defaults to `.rerank-v1-elasticsearch`, the preconfigured Elastic Rerank model.
  - `rank_window_size`: default 10.
  - `min_score`: optional.
- Preconfigured rerank endpoints named in the semantic reranking docs (https://www.elastic.co/docs/solutions/search/ranking/semantic-reranking): `.jina-reranker-v3.5` and `.rerank-v1-elasticsearch`. Jina rerankers on EIS are jina-reranker-v2-base-multilingual, v3 and v3.5. **Exact ids vary by project, so list them with `GET _inference/rerank`** (that is what the starter's `find_reranker()` does), and set `RERANK_INFERENCE_ID` to pin one.
- Linear retriever: an alternative to RRF that supports `normalizer: "minmax"` and per-field boosts.

---

## Part D. Mapping the starter onto StreetShift

| Starter | StreetShift |
|---|---|
| index `papers` | indexes `businesses` and `reviews` (review text in a `semantic_text` field, keyword `business_id` and `corridor_id`, `date` field for review dates) |
| `papers_search` (index_search) | `streetshift_search` index_search with `pattern: "businesses,reviews"` (or two tools) |
| `papers_topic_trend` (esql) | `review_volume_by_month`: `FROM reviews \| WHERE corridor_id == ?corridor \| EVAL month = DATE_TRUNC(1 month, review_date) \| STATS reviews = COUNT(*) BY month \| SORT month ASC` |
| `papers_top_authors` (esql) | `car_dependence_by_corridor`: `FROM businesses \| WHERE corridor_id == ?corridor \| STATS avg_car = AVG(carDependence) BY category` |
| workflow `paper-digest` and tool `papers_write_digest` | workflow `corridor-brief` (input `corridor`). Steps: semantic search on `reviews` filtered by corridor, then `ai.agent` with `agent-id: streetshift-analyst`, then index into `briefs`. Tool `corridor_write_brief` points at its workflow id. |
| `paper-digests` index and timestamp pipeline | `briefs` index and `briefs-timestamp` pipeline |
| agent `paper-scout` | agent `streetshift-analyst` |

Caution: if the `corridor-brief` workflow's `ai.agent` step calls `streetshift-analyst`, and that agent also has the workflow as a tool, the agent could call the workflow from inside the workflow and recurse. Either use `elastic-ai-agent` in the workflow step, or tell the analyst in its instructions not to call the brief tool when it is running inside a brief.
