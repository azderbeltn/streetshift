# Blockers

Open issues that need the human, or that forced a mock. Newest first.

## Open

- **Elastic Jina embeddings hit the free-trial cap**: after about 30k reviews, `.jina-embeddings-v5-text-small` returns HTTP 402 "You have reached your total trial limit for this model. Upgrade to continue" on every call, both indexing and query embedding. That breaks every semantic query on fields embedded with it. We did not upgrade. Workaround in place: `data/elastic_common.py` `usable_embedding_id()` probes the endpoint and falls back to `.multilingual-e5-small-elasticsearch`, which runs on the project's own ML nodes with no EIS trial cap. The `businesses` and `reviews` indexes were recreated on e5. Hybrid search and the reranker (`.jina-reranker-v3.5`) still work. `.jina-embeddings-v5-text-nano` and `jina-embeddings-v3` still answer, but they probably have the same kind of cap, so we didn't use them for 36k reviews: the live demo needs query-time embeddings to keep working. The human could ask the Elastic booth whether the trial quota can be raised; if it is, rerun `elastic_ingest.py --recreate` with Jina.

- **LiveKit credentials** — `LIVEKIT_*` are empty and the `lk` CLI isn't installed. Not needed until Phase 6 (below the line in 8.6). `USE_MOCK_VOICE` fallback stays available.

- **Creao track needs their platform** — a CREAO agent (agent.creao.ai) must do the core work; it runs in their cloud and can't reach the local `/sim` without a tunnel. Not in the plan. Human decides whether to enter (docs/creao.md).
- **Droid CLI** — `@factory/droid-sdk` spawns the `droid` CLI from PATH; install it (`npm install -g droid` or `irm https://app.factory.ai/cli/windows | iex`) in Phase 5.
- **Fetch.ai** — the README needs **two** badges (innovationlab + hackathon), plus registration via the "Cal Hacks ASI:One Submission" agent inside ASI:One (docs/fetchai-calhacks.md).

## Resolved

- Convex: cloud project `streetshift` created; the human accepted the ToS in the dashboard.
- SpacetimeDB: `SPACETIMEDB_TOKEN` in .env is not a CLI JWT; the CLI was logged in via browser instead. URI = https://maincloud.spacetimedb.com.

- `check_keys.py` reported **US Census: PROBLEM (HTTP None)**. That was a network timeout, not the key: a direct retry returned HTTP 200 with data.
- `check_keys.py` reported **Agentverse: HTTP 403**. The body was Cloudflare `error code: 1010`, which blocks Python's default User-Agent. With a `User-Agent` header the key returns HTTP 200. All Agentverse calls must send a User-Agent.
