# Blockers

Open issues that need the human, or that forced a mock. Newest first.

## Open

- **Moss `loadIndex` hangs on this network**: the cloud index `streetshift-facts` is `Ready` with 3,787 docs (verified via `list_indexes`), but `loadIndex` (JS 1.21.0 and Python 1.21.0) never completes, even after 300 s. Cause unknown; likely the index/model download is blocked or very slow on the venue network. The hearing wraps every Moss call in a timeout and falls back to Elastic hybrid search; the "looked up" panel shows which source answered. Retry on another network (hotspot) before judging: `npx --prefix sim tsx sim/test/scratch_moss.ts`.
- **ASI:One shared chat link**: must be created by the human in ASI:One (Share → copy link), then added to DEVPOST.md and submitted via the "Cal Hacks ASI:One Submission" agent.
- **Elastic Jina embeddings hit the free-trial cap**: after about 30k reviews, `.jina-embeddings-v5-text-small` returns HTTP 402 "You have reached your total trial limit for this model. Upgrade to continue" on every call, both indexing and query embedding. That breaks every semantic query on fields embedded with it. We did not upgrade. Workaround in place: `data/elastic_common.py` `usable_embedding_id()` probes the endpoint and falls back to `.multilingual-e5-small-elasticsearch`, which runs on the project's own ML nodes with no EIS trial cap. The `businesses` and `reviews` indexes were recreated on e5. Hybrid search and the reranker (`.jina-reranker-v3.5`) still work. `.jina-embeddings-v5-text-nano` and `jina-embeddings-v3` still answer, but they probably have the same kind of cap, so we didn't use them for 36k reviews: the live demo needs query-time embeddings to keep working. The human could ask the Elastic booth whether the trial quota can be raised; if it is, rerun `elastic_ingest.py --recreate` with Jina.

- **LiveKit credentials**: `LIVEKIT_*` are empty and the `lk` CLI isn't installed. Voice needs a LiveKit Cloud login (`lk cloud auth`, browser). The hearing works with typed questions (`USE_MOCK_VOICE`).

- **Creao track skipped**: it requires a CREAO-hosted agent doing the core work (docs/creao.md); the human approved skipping it.
- **Fetch.ai** — the README needs **two** badges (innovationlab + hackathon), plus registration via the "Cal Hacks ASI:One Submission" agent inside ASI:One (docs/fetchai-calhacks.md).

## Resolved

- Droid CLI installed (`npm install -g droid`, 0.249.0). On Windows the SDK can't spawn the npm shim, so `droid/src/worker.ts` passes `execPath` to the real `droid.exe`. Droid calls MCP tools through its `Script` tool, so the permission handler approves a script only when every call in it is a `streetshift` MCP tool.
- Fetch.ai mailbox connected by the human; ASI:One questions are reaching the Analyst.
- Overpass (overpass-api.de) unreachable from the venue network; `build_graphs.py` uses the mail.ru mirror.
- Convex: cloud project `streetshift` created; the human accepted the ToS in the dashboard.
- SpacetimeDB: `SPACETIMEDB_TOKEN` in .env is not a CLI JWT; the CLI was logged in via browser instead. URI = https://maincloud.spacetimedb.com.

- `check_keys.py` reported **US Census: PROBLEM (HTTP None)**. That was a network timeout, not the key: a direct retry returned HTTP 200 with data.
- `check_keys.py` reported **Agentverse: HTTP 403**. The body was Cloudflare `error code: 1010`, which blocks Python's default User-Agent. With a `User-Agent` header the key returns HTTP 200. All Agentverse calls must send a User-Agent.
