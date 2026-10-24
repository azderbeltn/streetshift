# Blockers

Open issues that need the human, or that forced a mock. Newest first.

## Open

- **Convex login** — `npx convex dev` in `/convex` opens a browser login. Needs the human (STOP GATE 1). `CONVEX_DEPLOYMENT` / `CONVEX_URL` are empty until then.
- **SpacetimeDB URI** — `SPACETIMEDB_URI` is empty. Plan: publish to maincloud (`spacetime login` opens a browser, needs the human) or run `spacetime start` locally. Decide at STOP GATE 1.
- **LiveKit credentials** — `LIVEKIT_*` are empty and the `lk` CLI isn't installed. Not needed until Phase 6 (below the line in 8.6). `USE_MOCK_VOICE` fallback stays available.

## Resolved

- `check_keys.py` reported **US Census: PROBLEM (HTTP None)**. That was a network timeout, not the key: a direct retry returned HTTP 200 with data.
- `check_keys.py` reported **Agentverse: HTTP 403**. The body was Cloudflare `error code: 1010`, which blocks Python's default User-Agent. With a `User-Agent` header the key returns HTTP 200. All Agentverse calls must send a User-Agent.
