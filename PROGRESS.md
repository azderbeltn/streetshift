# StreetShift: Progress

**Updated:** 2026-10-24 ~4:20 pm PT
**Current phase:** 6, Agents and hearing. Phases 0–5 are done and verified.
**Repo:** https://github.com/azderbeltn/streetshift · local `C:\Users\azizd\CalHacks\streetshift`
**Next:** stakeholder hearing (Claude + Fetch.ai uAgents), Analyst on ASI:One (needs the human's mailbox click), then Phase 7 (DEMO_MODE, README, DEVPOST, DEMO).

## How to run (4 terminals)
```
cd sim    && node --import tsx src/server.ts      # sim API :8787 + SpacetimeDB live loop
cd web    && npx vite                              # UI :5173
cd droid  && npx tsx src/worker.ts                 # Factory Droid worker (Convex queue)
cd agents && uv run python analyst/agent.py        # Fetch.ai StreetShift Analyst (mailbox)
```

## Phase status

| Phase | Status | Evidence |
|---|---|---|
| 0 Setup | ✅ | Keys checked, toolchain, contracts (6/6 schema tests), Convex + SpacetimeDB login, docs in `/docs` |
| 1 Data | ✅ | 6 OSM areas (`sim/assets/*/network.json`), ground truth from the DOT PDF with page cites + press sanity check, Census ACS 2024, NYC ATR + pedestrian counts (units from DOT readme), 1,010 businesses / 36,416 reviews (Apify, $31.55), Elastic indexes + Agent Builder + Workflow (`data/elastic_verification.md`) |
| 2 Simulation | ✅ | `npm test` in `/sim`: Ditmars closure → valid Metrics in 808 ms; quiet residential street → DIES_OFF |
| 3 Backtest | ✅ (STOP GATE 2 shown) | `validation/backtest_report.md`: 5/5 direction, holdout MAE 12.3 pts, 3/3 holdout inside range, Spearman 0.50. Calibrated on Ditmars + Park Slope only |
| 4 Frontend | ✅ | Screens in `web/screenshots/`: idle, pedestrianized, tour-1..4 (assumptions, floors, person card). Backtest screen still to screenshot |
| 5 Droid | ✅ | Backtest run: plan + 9 steps streamed to Convex, report in Convex file storage, results in `backtestResults`. Sweep run: 19 Hayes Valley blocks evaluated, top block THRIVES 10→44 conversations/h |
| 6 Agents & voice | 🔄 | Analyst uAgent runs (`agent1qd4qtakflx6z29sy6m5m6vsv486hke5xnw3k2dvmghqed2tf2pnkgq67f58`) and answers locally; **mailbox needs the human's Connect click**. Hearing not built yet. Voice: LiveKit keys missing |
| 7 Polish | ⏳ | |

## What works in the UI
- Real 3D Hayes Valley + 5 NYC corridors; cars/people (Census-sized crowd) animated with TripsLayer
- Click a block → pedestrianize, seating, programming; tools: add floors (click a building), change use (click a business), add park
- Connection / Economy / Traffic panels with ranges, "Before your changes", ▲▼ change badges
- Cause → effect strip (cars removed → people → lingering → conversations → revenue → traffic)
- **Assumptions drawer**: 6 sliders (foot traffic, seating effect, linger time, drivers, diversion, car volume), shared via SpacetimeDB
- Click a person (or a pink conversation dot) → who they are, lingering, conversations, heading
- Live conversation feed with real business names; Merchant Report (Claude, cached)
- Backtest Challenge with reveal + scoreboard; Factory Droid panel (Run backtest / Street sweep) live from Convex
- Multiplayer: two browsers on the same corridor share edits, results and cursors (SpacetimeDB)

## Mocked / degraded right now
- Elastic embeddings: Jina v5-small hit the trial limit (HTTP 402) → indexes use `.multilingual-e5-small-elasticsearch`; Jina reranker still used
- Voice (LiveKit): no credentials → typed Q&A fallback planned (`USE_MOCK_VOICE`)

## Usage log
| Service | Usage |
|---|---|
| Apify | $31.55 of $205 |
| Anthropic | ~10 calls (merchant reports, analyst), all cached in `sim/.cache` and `agents/.cache` |
| Factory Droid | 4 runs (2 failed while scoping tools, 1 backtest, 1 sweep) |
| Elastic | ingest of 37k docs (twice, Jina → e5), agent converse tests |
| SpacetimeDB / Convex | free tiers |
