# StreetShift: Progress

**Current phase:** 0, Setup. Waiting at **STOP GATE 1**.
**Repo path:** `C:\Users\azizd\CalHacks\streetshift` (CLAUDE.md says `C:\Users\azizd\streetshift`; the actual location is the CalHacks folder).
**Next step:** human completes STOP GATE 1, then create the GitHub repo, push, and start Phase 1 (Data).

## Phase 0 tasks

| Task | Status | Evidence |
|---|---|---|
| Key check (`check_keys.py`) | ✅ | See below. All 7 services work. Census and Agentverse failed in the script for non-key reasons (see BLOCKERS.md, Resolved). |
| Toolchain | ✅ | See below |
| Monorepo layout + `.gitignore` | ✅ | `/contracts /data /sim /spacetime /convex /agents /droid /web /validation /docs`; `git check-ignore .env` → ignored |
| Contracts (TS + JSON Schema) | ✅ | `npm test` in `/contracts`: 6/6 fixtures PASS plus 1 negative check PASS |
| Convex scaffold + AI files | ✅ (login pending) | `npm create convex@latest . -- -t bare`; `npx convex ai-files install` → `convex/_generated/ai/guidelines.md` and `.agents/skills/` present; `npm run typecheck` exit 0 |
| Claude Code plugins | ✅ | `claude plugin list`: convex 1.14.0, elastic-elasticsearch 0.6.0, elastic-kibana 0.6.0, all enabled |
| Agent seeds | ✅ | 5 random `AGENT_SEED_*` written to `.env` (never printed) |
| Docs → `/docs` | 🔄 | in progress |
| Forward corridor candidates | 🔄 | in progress → `docs/corridor-candidates.md` |
| Root build | ✅ | `npm run build` exit 0 |

### Key check output (2026-10-24)
```
Apify                     OK        used $0 of $205 this month
Elasticsearch             OK        connected
Kibana                    OK        connected
US Census                 PROBLEM   HTTP None   → retry: HTTP 200 (timeout, key fine)
NYC/SF Open Data token    OK        works
ASI:One                   OK        works
Agentverse                PROBLEM   HTTP 403    → Cloudflare 1010 UA block; with User-Agent: HTTP 200
```
Not checked by the script: Anthropic, Factory, Moss (tested when those parts are built). LiveKit and Convex not set yet.

### Toolchain
```
node v26.4.0 · npm 11.17.0 · git 2.55.0 · gh 2.96.0 (logged in as azderbeltn)
uv 0.13.5 (installed per-user → ~/.local/bin)
python 3.14.6 system; 3.12.15 via `uv python install 3.12` (use for /data and /agents)
spacetime 2.13.0 (installed per-user → %LOCALAPPDATA%\SpacetimeDB)
claude 2.1.305 · lk: not installed (Phase 6)
```
Note: new shells need `~/.local/bin` and `%LOCALAPPDATA%\SpacetimeDB` on PATH (the installers added them to the user PATH; current shells may need a restart).

## Mocked right now
Nothing yet. Convex, SpacetimeDB and LiveKit aren't wired up yet (see BLOCKERS.md).

## Usage log
| Service | Usage so far |
|---|---|
| Apify | $0 of $205 |
| Anthropic | 0 calls |
| Elastic | connection test only |
