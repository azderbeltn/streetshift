# StreetShift — Build Spec for Claude Code

You are building StreetShift end to end, mostly autonomously. Read this whole file before doing anything. It is the single source of truth for product, architecture, rules and phases.

---

## 0. Operating rules (read first, follow always)

1. **Never guess a sponsor API.** Before writing code for any sponsor (SpacetimeDB, Convex, Fetch.ai, Moss, LiveKit, Factory Droid SDK, Apify, Elastic), read its file in `/docs`. If the doc is missing, fetch it from the URL in Section 9 and save it to `/docs/<sponsor>.md` first. If you still can't get it, write the issue to `BLOCKERS.md` and use the mock adapter (rule 4).
2. **Done means verified.** A task is done only after you have run it and seen it work: a passing test, real script output, or a screenshot of the UI. Paste the evidence into `PROGRESS.md` under the task.
3. **Work in phases (Section 8), in order.** Commit after every completed task with a clear message. Do not start a phase until the previous phase's acceptance check passes.
4. **Every sponsor integration sits behind an adapter with a mock.** If a key in `.env` is missing or a service fails, set `USE_MOCK_<SPONSOR>=true`, keep building, and log it in `BLOCKERS.md`. The demo must never depend on one service being up.
5. **Secrets live only in `.env`.** Never hardcode or print keys. Keep `.env.example` up to date with every variable name.
6. **Stop and ask the human only at the STOP gates** marked in Section 8, or if blocked on the same problem after 3 genuinely different attempts.
7. **Never invent data.** Ground-truth numbers come only from the sources in Section 5. If a number can't be extracted, leave it `null` and flag it. Do not fill gaps with plausible values.
8. **Keep `PROGRESS.md` current.** It records phase, task status, evidence, what's mocked, and next step, so the human can check in any time.

---

## 0.5 Project facts (provided by the human)

- **Builder:** solo developer.
- **Machine:** native **Windows**, no WSL, and the human may **not have administrator rights**. Rules: prefer per-user installs that don't need admin (`winget install --scope user ...`, user-level installers, `uv` for Python). If an install needs admin or opens a Windows prompt, stop and tell the human exactly what to click. Use PowerShell syntax for commands; when docs show Linux/macOS commands (`curl ... | sh`, `export`, `source`), translate them to the Windows equivalent. Use `pathlib`/`path.join`, never hardcoded `/` paths. Docker is not used in the test run. The repo lives at `C:\Users\azizd\streetshift`.
- **Elastic:** Elastic Cloud **Serverless**, free for the weekend at https://ela.st/calhacks. Follow the pattern of Elastic's official Cal Hacks starter (Section 9). No local Elasticsearch.
- **Project name:** StreetShift.
- **Claude models:** `claude-sonnet-5-5` (env `ANTHROPIC_MODEL`) for stakeholder agents, the hearing, explanations and policy briefs. `claude-haiku-5-5` (env `ANTHROPIC_MODEL_FAST`) for live voice replies, where speed matters most. Always read model names from `.env`, never hardcode them.
- **Voice:** LiveKit is the voice path (no browser-speech version). Build from the official Moss + LiveKit hacker starter. If LiveKit fails, `USE_MOCK_VOICE=true` falls back to typed Q&A in the hearing panel, so the demo still works.
- **This is the real build, happening now at CalHacks 13.** Devpost submission is due **Sunday 9:00 am**, and the human must be at the table for judging from 10:30 am. Follow the full phases in Section 8 in the priority order of Section 8.6. Ignore Section 8.5 (Test Run Mode); it is kept only for reference.
- **GitHub:** the human's GitHub username is **azderbeltn**. After Phase 0, check whether `azderbeltn/streetshift` exists (`gh repo view azderbeltn/streetshift`). If it doesn't, create it with `gh repo create azderbeltn/streetshift --public --source . --push`. If it does, add it as `origin` and push. Push after every completed task. The human runs `gh auth login` at STOP GATE 1. Before every push, confirm `.env` is git-ignored and scan staged files for secrets (`git diff --cached` grep for key-like strings, or `gitleaks` if installed). Never push a secret.
- **Spending:** use the credits sponsors provided. Never upgrade a plan, start a paid tier, or enter payment details; stop and ask instead. Cache every Claude and Apify response to disk so reruns cost nothing, keep the Apify caps in Section 5, and log rough usage per service in `PROGRESS.md`.
- **Forward-looking street:** not chosen yet. At STOP GATE 1, propose 3 candidates (SF or Berkeley) using the criteria in Phase 0, and let the human pick.

---

## 0.6 Direction update: real places, real data, technical look (Meta track first)

- **Primary track is Meta ("Bringing People Closer Together with AI").** Human connection is the headline outcome: "Conversations per hour," "Time people spend lingering," and "New connections formed" are the hero metrics. Economy and traffic are the supporting outcomes and the tradeoffs.
- **Real places, not a toy city.** The map shows real streets (OSMnx/OpenStreetMap), real 3D buildings, and real businesses (Apify Google Maps data). The simulated population is calibrated to real residents using the US Census API (block-group population and households), so the crowd reflects who actually lives there.
- **Look: technical and serious, not a game.** Follow Section 7 ("SimCity meets a Bloomberg terminal, at night"). Dark MapLibre base map with 3D extruded buildings (use OpenFreeMap vector tiles, which include building heights, styled dark; verify current style URLs at openfreemap.org; fall back to `MAP_STYLE_URL` if that fails). deck.gl TripsLayer for people and cars.
- **Interaction ideas to keep from the approved mockup** (`/design/streetshift-mockup.html`; open it to see them working): a tool dock, click-to-pedestrianize a block, click a building to add floors (more residents or workers), change a lot's use (café, shop, park), a live event feed of conversations forming ("2 people started talking outside Juniper Café"), pink conversation arcs and faint lines between people who've connected, and every stat showing "Before your changes." Restyle all of these to the technical look; do not copy the toy visuals.
- **Features of the real build:**
  1. **Scenario tools:** pedestrianize a block (with options for seating and programming), add floors (upzoning), change land use, add a park.
  2. **Three outcome panels:** Connection (conversations, lingering time, new connections, verdict: Thrives / Marginal / Dies off), Economy (per-business revenue change, winners and losers), Traffic (added vehicle-hours, overflow streets). Every number shows a range.
  3. **Backtest "challenge":** recreate a 2020 NYC Open Street and reveal how close the model's prediction was to the city's published sales data.
  4. **Merchant Report:** click any business for a one-page forecast.
  5. **Street sweep (Droid):** rank the best blocks in the neighborhood to pedestrianize.
  6. **Simulated public hearing:** Claude-powered stakeholder agents argue about the scenario; ask them questions by voice.
  7. **ASI:One agent:** ask the StreetShift Analyst about any street from inside ASI:One.
- **Agent design stays two-tier:** thousands of simple rule-based people for the crowd, and a few Claude-powered stakeholder characters (Section 6).

---

## 1. Product

**One line:** A city simulator that predicts what happens when a street is pedestrianized, and proves its accuracy by backtesting against real New York City streets.

**Problem:** Cities fight bitterly over pedestrianizing streets. Business owners fear losing customers, residents fear overflow traffic, and advocates promise vibrancy. Decisions are made on gut feeling. STREETSHIFT gives evidence before money is spent.

**For any street closure, it predicts three outcomes:**
- **A. Interaction:** Does the new space become lively (people linger and meet) or die off?
- **B. Economy:** How does revenue change for each nearby business: who wins, who loses?
- **C. Traffic:** How much added travel time, and which streets absorb the overflow?

**Proof:** A Backtest Mode runs the model on 5 real NYC Open Streets corridors (closed to cars in 2020) and compares predictions to the city's published sales results against nearby control corridors.

**Who it's for:** City transportation departments and planners, and the small-business owners and residents on corridors facing a pedestrianization decision.

---

## 2. Architecture

Monorepo layout:

```
/contracts   Shared schemas (TypeScript types + JSON Schema). Every lane builds against these.
/data        Python 3.11+ (uv). Offline data prep: OSMnx road graphs, Apify scraping,
             NYC Open Data, ground truth extraction, Elastic indexing, Moss indexing.
/sim         TypeScript (Node 20+). Simulation engine + HTTP API. Writes live state to SpacetimeDB.
/spacetime   SpacetimeDB module (tables + reducers). Use a TypeScript module if /docs/spacetimedb.md
             says it's supported; otherwise Rust.
/convex      Convex backend: scenarios, ground truth, backtest results, Droid run logs, reports, files.
/agents      Python. Fetch.ai uAgents (Agentverse + Chat Protocol), Claude stakeholder agents,
             LiveKit voice agent with Moss retrieval.
/droid       TypeScript. Factory Droid SDK runners: backtest runner + street sweep.
/web         React + Vite + deck.gl + MapLibre. Subscribes to SpacetimeDB; reads/writes Convex.
/validation  Ground truth, calibration split, accuracy metrics, backtest report output.
/docs        Saved sponsor documentation (markdown).
```

**Data flow:**
1. `/data` builds road graphs and business data offline, then exports JSON to `/sim/assets/` and indexes into Elastic and Moss.
2. `/sim` loads graphs, precomputes baseline car and pedestrian trips, and exposes `POST /scenario/run`.
3. When a street is closed, `/sim` reroutes affected car trips, recomputes pedestrian flows and business capture, computes A/B/C metrics, and writes aggregate state to SpacetimeDB.
4. `/web` subscribes to SpacetimeDB and updates the map and gauges live.
5. Convex stores scenarios and results. A Convex action triggers `/droid` runners for backtests and sweeps.
6. `/agents` stakeholder agents read simulation results (via `/sim` API) and business facts (via Moss and Elastic) to argue in the simulated hearing.

**Performance rule:** Do NOT write every moving dot into SpacetimeDB each frame. Precompute trips as `{path: [[lng,lat],...], timestamps: [...]}` and serve them as static JSON per scenario. The frontend animates them with deck.gl TripsLayer. SpacetimeDB holds scenario state, closed segments, per-segment and per-business metrics, presence, and hearing messages.

---

## 3. Contracts (create these first, in `/contracts`)

```ts
// Segment of road network
type Segment = { id: string; name: string; coords: [number, number][]; lanes: number;
                 baselineCarVolume: number | null; baselinePedVolume: number | null };

type Business = { id: string; name: string; category: string; lng: number; lat: number;
                  rating: number | null; reviewCount: number | null;
                  popularTimes: number[][] | null;   // [dayOfWeek][hour] 0-100
                  carDependence: number;              // 0-1, from Elastic review signals
                  segmentId: string };

type Scenario = { id: string; city: "NYC" | "SF" | "BERKELEY"; corridorId: string;
                  closedSegmentIds: string[]; addedSeating: boolean;
                  programming: "none" | "light" | "heavy"; createdAt: number };

type Metrics = {
  interaction: { lingerIndex: number; encountersPerHour: number;
                 verdict: "THRIVES" | "MARGINAL" | "DIES_OFF"; range: [number, number] };
  economy: { totalRevenueChangePct: number; range: [number, number];
             perBusiness: { businessId: string; changePct: number }[] };
  traffic: { addedVehicleHours: number; range: [number, number];
             overflowSegments: { segmentId: string; loadIncreasePct: number }[] };
};

type BacktestRow = { corridorId: string; corridorName: string; split: "calibration" | "holdout";
                     predictedGapPct: number; actualGapPct: number | null;
                     directionCorrect: boolean | null; absErrorPts: number | null };

type DroidRun = { id: string; kind: "backtest" | "sweep"; status: "planning" | "running" | "done" | "failed";
                  plan: string[]; steps: { label: string; status: string; output?: string }[];
                  resultSummary?: string; startedAt: number };
```

Mirror these as JSON Schema for the Python side (`/contracts/schemas/*.json`).

---

## 4. Simulation model (keep it simple and defensible)

All parameters live in `/sim/params.json` with a comment citing their source. Every output is a range, not a single number: run the model at low/mid/high parameter values and report all three.

**C. Traffic**
- Road graph from OSMnx for each corridor area (about 1.5 km radius).
- Generate baseline car trips (origin–destination pairs weighted toward arterials). Calibrate total volume to NYC Automated Traffic Volume Counts where a count location exists nearby; otherwise use defaults by road class and flag as estimated.
- On closure, remove the segments, reroute affected trips with shortest-path (travel-time weights), and measure added vehicle-hours and load increase on each segment. Apply a simple congestion penalty (BPR-style function) so heavily loaded segments slow down.

**B. Economy**
- Pedestrian volume per segment: baseline from NYC Bi-Annual Pedestrian Counts if a location is nearby, else estimate from business density and popular-times totals.
- On closure: pedestrian volume on the closed segments rises (uplift parameter), and more so with added seating and programming.
- Each business captures a share of passersby by category (cafés and restaurants high, services low). Car-dependent businesses (high `carDependence`) lose a share of drive-in customers proportional to added traffic difficulty.
- Revenue change per business is approximately the change in captured visits. Corridor total is a weighted sum.
- **Prediction target for backtests:** the gap between the treated corridor and its control corridor (difference-in-differences), not raw change. COVID affected both; the gap nets it out.

**A. Interaction**
- `lingerIndex` from pedestrian density, dwell-time multiplier (seating, food businesses, programming), and segment length.
- `encountersPerHour` grows with density times dwell time.
- Verdict: below a minimum density threshold → `DIES_OFF` (the empty-plaza effect from William Whyte's research on small urban spaces); mid → `MARGINAL`; high → `THRIVES`.
- Mark interaction as **model output, not validated** in the UI and in reports. There's no ground truth for it.

---

## 5. Data sources and ground truth

**Backtest corridors (NYC Open Streets, 2020):** Ditmars Boulevard (Astoria, Queens); Pell & Doyers Streets (Chinatown, Manhattan); East 32nd Street (Koreatown, Manhattan); 5th Avenue (Park Slope, Brooklyn); Vanderbilt Avenue (Prospect Heights, Brooklyn). Each has a nearby control corridor defined in the DOT report.

**Ground truth: NYC DOT "Streets for Recovery" (2022).** Taxable sales for restaurants and bars, March 2020–August 2021, vs. a 2017–early 2020 baseline, for each Open Street and its control corridor.
- Report: https://www.nyc.gov/html/dot/downloads/pdf/streets-for-recovery.pdf
- Data appendix: https://www.nyc.gov/html/dot/downloads/pdf/streets-for-recovery-report-data.pdf
- Download both to `/validation/sources/`, extract per-corridor treated and control values into `/validation/ground_truth.json`, and record the page number for every value.
- Two values confirmed in press coverage, to sanity-check extraction: Astoria (Ditmars) treated **+44%** vs. control **−7%**; Chinatown treated **−8%** vs. control **−31%**. Averages across corridors: treated **+19%** vs. control **−29%**. If your extraction disagrees with these, stop and flag it.

**Supporting NYC Open Data (Socrata API):**
- Automated Traffic Volume Counts, dataset `7ym2-wayt`: https://data.cityofnewyork.us/Transportation/Automated-Traffic-Volume-Counts/7ym2-wayt
- Bi-Annual Pedestrian Counts, dataset `cqsj-cfgu`: https://data.cityofnewyork.us/Transportation/Bi-Annual-Pedestrian-Counts/cqsj-cfgu
- Coverage is patchy. For each corridor, record which count locations fall within 500 m, and use them only where they exist.

**Businesses: Apify Google Maps scraper.** For each corridor and its control corridor, scrape all businesses within about 300 m: name, category, coordinates, rating, review count, popular times, and reviews with dates (cap about 200 reviews per business for time). Cache raw results in `/data/raw/` so you never re-scrape unnecessarily.

**Honesty notes to surface in the UI and Devpost:** treated corridors also had outdoor dining, so `addedSeating=true` for all backtests; interaction is not validated; a 2026 NY State Comptroller report found retail and restaurant jobs had not recovered on most Open Streets, so evidence is mixed.

### Validation protocol (do not break this)
- **Calibration set:** Ditmars Blvd and 5th Ave Park Slope. Tune parameters only on these.
- **Holdout set:** Pell/Doyers, East 32nd St, Vanderbilt Ave. The model must never see holdout ground truth during tuning. Keep `ground_truth.json` loaded only by `/validation/score.ts`, never by `/sim`.
- **Metrics:** direction correct per corridor (treated beat control?), absolute error in percentage points of the gap, and rank order of the 5 corridors (Spearman correlation).
- Write results to `/validation/backtest_report.md` and to Convex.

---

## 6. Sponsor integrations (each one has a real job)

| Sponsor | Job in the product | Must-have for the track |
|---|---|---|
| **Apify** | Scrape businesses, popular times and dated reviews for 10 corridors. Also build and publish a custom Apify Actor that pulls NYC Open Data counts for any location (for the Best Actor prize). | Used in a meaningful way; Actor published. |
| **Elastic** | The challenge is "Find the Signal with Elasticsearch," and it rewards hitting four pieces: Serverless, search, Agent Builder and Workflows. Use all four. **(1) Data in:** an index `businesses` and an index `reviews` on Elastic Cloud Serverless, with review text in a `semantic_text` field so Elastic embeds it automatically with Jina (no embedding pipeline). **(2) Find:** hybrid search (BM25 + semantic, fused with RRF, then rerank) powers the planner search bar; `carDependence` per business comes from a semantic query for reviews about parking and driving there. **(3) Reason:** an Agent Builder agent `streetshift-analyst` with tools: an `index_search` tool over both indexes, an ES\|QL tool `review_volume_by_month(business_id or corridor)` that gives monthly review counts before and after a closure (a business-activity signal to check against the city's tax data), and an ES\|QL tool `car_dependence_by_corridor`. **(4) Act:** an Elastic Workflow `corridor-brief` (manual, scheduled daily, and callable by the agent as a tool) that searches a corridor's reviews, has the agent write a stakeholder briefing, and saves it to a `briefs` index. The stakeholder agents read these briefs. Agent Builder also exposes its tools over MCP; the Claude stakeholder agents call them that way. | Serverless + semantic_text/Jina, hybrid search, Agent Builder with tools, and a Workflow that acts. |
| **SpacetimeDB** | Live world state: scenario, closed segments, per-segment and per-business metrics, multiplayer presence (two planners editing one scenario see each other's cursors), and hearing messages. Scenario edits are reducers. | Spacetime is the core real-time backend, not an add-on. |
| **Convex** | Persistent app data: scenarios, ground truth, backtest results, Droid run logs, reports in file storage. Convex actions trigger Droid runs and save outputs. | Real use of database, functions and file storage. |
| **Factory Droid SDK** | (1) **Backtest runner**, triggered when the user clicks "Run backtest": plans, runs the sim on all 5 corridors, calls the scorer, writes the report. (2) **Street sweep**, triggered on schedule or on demand: tries every eligible segment in a target neighborhood and ranks the top 5 candidates. Scope Droid's permissions to the `/sim` API, `/validation`, and the reports directory only. Stream its plan, steps and results into Convex `DroidRun` records shown live in the UI. | Droid does real work in the running product, triggered by events, with visible steps and scoped access. README must explain where and how Droid is used. |
| **Anthropic (Claude)** | Powers stakeholder agents, the "why did this happen" explanations, and the policy brief. Use the Anthropic API; read the model name from `.env` (`ANTHROPIC_MODEL`). | Claude does something that matters. Document failure modes: overconfidence, agents misrepresenting real business owners. |
| **Fetch.ai** | 4 stakeholder agents (café owner, commuter, resident on an overflow street, parent) plus 1 **StreetShift Analyst** agent, all uAgents registered on Agentverse with the Agent Chat Protocol and Claude as the reasoning engine. The Analyst must let someone run the core workflow from inside ASI:One: "What happens if NYC pedestrianizes X?" → calls `/sim`, returns metrics and a link. Stakeholder agents message each other in the hearing. | CalHacks 13 "ASI:One Agent Challenge: From Intent to Action." Requirements: any framework; registered on Agentverse; Agent Chat Protocol; discoverable and directly usable through ASI:One. Run agents locally with an Agentverse **mailbox** so ASI:One can reach them without a public server, and so they can call the local `/sim` API. Give each agent a clear Agentverse profile (name, description, keywords like "urban planning", "pedestrian street", "city simulation") so ASI:One routes matching questions to it. In the repo README, list every agent's name and address and include the badge `![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)`. Save an ASI:One shared chat link showing the full workflow. The human must check the official resources doc for this year's exact submission list. |
| **Moss** | Sub-10 ms retrieval for the stakeholder characters, so voice and text answers are grounded and fast. Use both index models from the Moss docs: (1) a **persistent cloud index** per corridor, built once by an ingestion script in `/data`, holding each business's facts and review snippets plus corridor facts (Census, counts); serving processes load it at startup, never recreate it; (2) a **session index** per live hearing, where the latest scenario results and what was said in the hearing are added during the conversation, so characters remember what the judge asked a minute ago. Use **hybrid search** (semantic + keyword) so business names match exactly. Claude stays the reasoning model; Moss is the retrieval layer. Docs: https://docs.moss.dev (Quickstart, Sessions, Hybrid search, Storage and persistence). | Moss track examples: voice agents that act in real time, and personal agents with memory. Show retrieval in the UI: a small "what this character looked up" panel with the matched snippets and scores, like the official starter's Knowledge Matches panel. |
| **LiveKit** (voice transport) | Real-time voice so the judge can question a stakeholder agent out loud. Start from the official Moss + LiveKit hacker starter. Use the LiveKit CLI (`lk`) to create the app and write credentials into env files; never hand-type LiveKit keys. If it fails, fall back to typed Q&A (`USE_MOCK_VOICE`). | Supports the Moss track. |
| **Microsoft** | The product framing: production-minded planning agent with measurable accuracy (backtest scoreboard), a clear buyer (city DOTs), responsible design (ranges, stated limits, no individual surveillance). | Judging criteria: customer understanding, measurable usefulness, path to production, responsible design, end-to-end function. |
| **Meta** | The interaction outcome: predicting whether a new public space will bring people together or sit empty. | Pitch framing; no SDK. |
| **Creao** | Positioning as an AI-first disruptor of slow, expensive traffic and economic impact studies. | Check the Creao event page; the track may require building on their platform. |

---

## 7. UI spec: "SimCity meets a Bloomberg terminal, at night"

Follow this exactly. No default component-library look.

- Full-screen dark MapLibre basemap, 3D extruded buildings, ~45° pitch, slow camera drift when idle. Use a free dark vector style (key in `.env` as `MAP_STYLE_URL`).
- Cars: deck.gl TripsLayer, cool blue glowing trails with fading tails. Pedestrians: warm amber trails. Additive blending for glow.
- Pedestrianize interaction: hover highlights a segment; click opens a small glass popover with "Pedestrianize", "Add seating", "Programming: none/light/heavy". On activate, an animated green pulse spreads along the segment.
- Rerouted congestion: segments recolor smoothly blue → orange → red by load increase.
- Businesses: thin glowing columns (ColumnLayer); height = revenue index, color green or red by change; animate on update. Hover shows name, category, change %, car-dependence.
- Right side: three floating glass panels (backdrop blur, 1px light border) for **Interaction**, **Economy**, **Traffic**. Big monospace numbers that count up, the range shown underneath, a small sparkline. Interaction panel shows the verdict badge and a "model output, not validated" tag.
- Bottom: time-of-day scrubber and a before/after toggle.
- Left: corridor picker (NYC backtest corridors + one forward-looking corridor in SF or Berkeley; the human chooses at STOP gate 1), and a search bar backed by Elastic.
- **Backtest Mode:** a cinematic sequence per corridor. Prediction card slides in, a "Reveal" button, the actual value slides in beside it, then a row fills in on the scoreboard (direction ✓/✗, error, rank). Final card shows overall direction accuracy and rank correlation.
- **Droid panel:** live list of the current run's plan and steps with status ticks, streaming from Convex.
- **Hearing panel:** chat-style transcript of stakeholder agents arguing, each with an avatar and role; a mic button to ask one of them a question by voice.
- Typography: a monospace for numbers (e.g. JetBrains Mono), a clean sans for labels (e.g. Inter), both from Google Fonts with system fallbacks.
- Take a screenshot after every major visual change (use Playwright) and save to `/web/screenshots/`. Review it against this spec before moving on.

---

## 8. Phases with acceptance checks

**Phase 0 — Setup (target 1 hour)**
- Create the monorepo, `PROGRESS.md`, `BLOCKERS.md`, and a `.gitignore` that excludes `.env`, `.env.local`, `/data/raw/` and caches. A filled-in `.env.example` is provided by the human; keep it in sync with Section 10.
- Fetch and save every doc in Section 9 to `/docs`.
- Write `/contracts`.
- Acceptance: repo builds, docs saved, contracts committed.
- **Convex setup (from Convex's official setup instructions):** in `/convex`, if the folder is empty run `npm create convex@latest . -- -t bare`; otherwise `npm install convex`, add an empty `convex/schema.ts` and a `convex dev` script. Then run `npx convex ai-files install` and check that `convex/_generated/ai/guidelines.md` and `.agents/skills` exist (the command exits 0 even if downloads fail, so rerun if either is missing). Install the Convex plugin for Claude Code: `claude plugin marketplace add anthropics/claude-plugins-official`, then `claude plugin install convex@claude-plugins-official --scope user`; verify with `claude plugin list`. Running `npx convex dev` the first time opens a browser login for the human.
- Verify the Windows toolchain, installing anything missing with per-user installs: `node -v` (20+), `uv --version`, `python --version` (3.11+; install via `uv python install 3.12` if missing), `git --version`, `gh --version`, `spacetime --version` (use SpacetimeDB's Windows installer from its docs). Skip Docker. Install the Elastic Agent Skills plugins for Claude Code (Section 9) so Elastic code uses current APIs.
- Research 3 forward-looking corridor candidates in SF or Berkeley. Criteria: a commercial street with many small businesses; ideally an active or recent public debate about pedestrianization or car-free use; enough Google Maps businesses to scrape; city open data for traffic or pedestrian counts nearby if possible. For each, write 2–3 sentences on why it's a good demo.
- **STOP GATE 1:** Ask the human to (a) copy `.env.example` to `.env` and fill it in, (b) run `gh auth login`, (c) pick one of the 3 corridors, (d) confirm. Then create the GitHub repo and continue.

**Phase 1 — Data (target 3 hours)**
- OSMnx graphs for all 5 treated + 5 control corridors + the forward-looking corridor.
- Download and extract ground truth with page citations; run the sanity check in Section 5.
- Pull NYC traffic and pedestrian counts near each corridor.
- If the forward-looking corridor is in San Francisco, pull DataSF datasets (portal is now **data.sf.gov**; the old data.sfgov.org domain stops working Nov 20, 2026, so never use it). Use the Socrata API with `DATASF_APP_TOKEN` (and `NYC_OPEN_DATA_APP_TOKEN` for NYC; both portals run on Socrata). Socrata is in the middle of upgrading to its newer SODA3 API: read the current docs at https://dev.socrata.com before writing requests, always send the app token, and if the classic `/resource/<id>.json` endpoint fails, switch to the SODA3 endpoint the docs describe. Find dataset IDs with the catalog search rather than guessing; useful searches: "traffic counts", "pedestrian counts", "Registered Business Locations", "Slow Streets", "parking meters". Record each dataset ID and URL in `/data/SOURCES.md`.
- Pull US Census population and households by block group for every corridor area (`CENSUS_API_KEY`), and size each area's simulated population from it.
- Apify scrape of businesses and reviews (start with Ditmars and its control; expand after Phase 3 works).
- Elastic (follow the official starter's `ingest.py` and `setup_agent.py` patterns): create `businesses` and `reviews` indexes with `semantic_text`, ingest, compute `carDependence`, then create the Agent Builder tools, the `corridor-brief` Workflow and the `streetshift-analyst` agent. Verify by asking the agent one question and getting a cited answer. Moss index of business facts.
- Acceptance: printed summary table of corridors with segment counts, business counts, count-location coverage, and ground truth values.

**Phase 2 — Simulation core (target 4 hours)**
- Baseline trips, rerouting, pedestrian flows, business capture, A/B/C metrics with ranges.
- `POST /scenario/run` returns `Metrics` in under 5 seconds for one corridor.
- Writes state to SpacetimeDB.
- Acceptance: a test closes Ditmars Blvd and prints sensible metrics; a second test confirms closing a residential side street yields `DIES_OFF` or `MARGINAL`.

**Phase 3 — First prediction vs. reality (target 2 hours). This is the most important milestone.**
- Calibrate on the calibration set only. Run the scorer on all 5 corridors.
- Acceptance: `/validation/backtest_report.md` with the full table and metrics.
- **STOP GATE 2:** Show the human the report. Do not tune on holdout results.

**Phase 4 — Frontend (target 5 hours)**
- Everything in Section 7 except voice and the hearing.
- Acceptance: screenshots of the idle map, a pedestrianized street with rerouting, and the full Backtest Mode sequence.

**Phase 5 — Droid runners (target 2 hours)**
- Backtest runner and street sweep, triggered from Convex, streaming steps to the UI.
- Acceptance: clicking "Run backtest" shows a live Droid plan and produces the report; the sweep ranks the top 5 segments for the forward-looking corridor.

**Phase 6 — Agents and voice (target 4 hours)**
- Fetch uAgents on Agentverse with Chat Protocol and Claude. The Analyst agent runs a full scenario from an ASI:One conversation.
- The hearing: stakeholder agents argue over the latest scenario, grounded in sim results and Moss/Elastic retrieval.
- Voice Q&A with one stakeholder via LiveKit + Moss, using `ANTHROPIC_MODEL_FAST` for replies.
- Acceptance: a saved ASI:One shared chat URL demonstrating the workflow; a hearing transcript; a recorded voice answer under 2 seconds to first audio.

**Phase 7 — Polish and demo safety (remaining time)**
- A `DEMO_MODE` flag that preloads cached results for every corridor so the demo works with no network.
- README covering architecture, where each sponsor is used (especially Droid), validation protocol, and limits.
- Devpost draft text in `/DEVPOST.md`.
- A 2-minute demo script in `/DEMO.md` (Section 11).
- **STOP GATE 3:** Ask the human to run the full demo end to end.

---

## 8.5 Test Run Mode (a few hours, solo)

The goal of this run is one question: **does the core idea work?** That means a simulated street closure on a real map, and one honest prediction-versus-reality comparison. Everything else is optional.

**Scope:**
1. **Phase 0, trimmed (30 min):** repo, contracts, toolchain check, docs for only SpacetimeDB, Apify, Elastic starter and deck.gl. Skip the corridor research; use **Ditmars Blvd** as the demo street. STOP GATE 1 asks only for `.env` and `gh auth login`.
2. **Data, minimal (60 min):** OSMnx graphs for **Ditmars Blvd and its control corridor, and Pell & Doyers Streets and its control corridor** only. Ground truth for these two from Section 5 (both values are confirmed). Apify scrape capped at 50 businesses and 50 reviews per business per corridor. Elastic: ingest businesses and reviews with `semantic_text` and compute `carDependence`; skip Agent Builder and Workflows.
3. **Simulation core (60–90 min):** traffic rerouting and the economy model. Interaction metric only if time allows.
4. **The test (30 min):** calibrate on Ditmars only. Predict Pell & Doyers blind. Write `/validation/backtest_report.md` with the predicted gap, the actual gap, direction correct or not, and error.
5. **Minimal UI (60 min):** dark MapLibre map, TripsLayer for cars and pedestrians, click a segment to pedestrianize, congestion recoloring, one panel with Economy and Traffic numbers, and a simple Reveal card. Write live state to SpacetimeDB; skip multiplayer.

**Mocked or skipped in this run:** Convex (use local JSON), Factory Droid, Fetch.ai, Moss, LiveKit, the hearing, Agent Builder, Workflows, the sweep, and the forward-looking corridor. Set the matching `USE_MOCK_*` flags.

**Finish by writing `TEST_RUN_RESULT.md`:** what worked, the backtest numbers, what was hardest, what the full build should change, and a time estimate for each remaining phase.

**Important:** this is a rehearsal. CalHacks requires projects to be started during the event, so the real build starts from an empty repo at the hackathon, not from this one.

---

## 8.6 Priority order for the time left (deadline Sunday 9:00 am)

Build in this order. If time runs short, everything below the line can be mocked without breaking the demo.

1. Real map of the forward-looking corridor and Ditmars Blvd with 3D buildings, real businesses, and a moving crowd (Phases 1, 2, 4 core).
2. Pedestrianize tool with the three outcome panels and "Before your changes."
3. Backtest challenge for at least Ditmars and Pell & Doyers (Phase 3).
4. Elastic: Serverless indexes, semantic search, Agent Builder agent, one Workflow (needed for the Elastic track).
5. SpacetimeDB as the live state behind the map.
6. Fetch.ai StreetShift Analyst on Agentverse, usable from ASI:One, with a saved shared chat link.

---- (below the line) ----

7. Droid backtest runner and street sweep.
8. Convex persistence and Merchant Report.
9. Stakeholder hearing; then voice via LiveKit + Moss (needs LiveKit and Moss keys, not provided yet).

**Checkpoints:** a Devpost draft in `/DEVPOST.md` by Saturday 11 pm (the human posts it); `DEMO_MODE` with cached results and a recorded 3-minute demo video by Sunday 7 am; final push to GitHub by 8:30 am. Pitches are 3 minutes plus 2 minutes of questions.

---

## 9. Docs to fetch into `/docs` (Phase 0)

- Moss: https://www.moss.dev/llms-full.txt, https://docs.moss.dev/docs (Quickstart, Sessions, Hybrid search, Storage and persistence), SDK repo https://github.com/usemoss/moss
- Moss + LiveKit voice starter: https://github.com/livekit-examples/moss-hacker-starter
- Fetch.ai uAgents + Chat Protocol: https://innovationlab.fetch.ai/resources/docs/next/examples/chat-protocol/asi-compatible-uagents
- Fetch.ai CalHacks 13 page (requirements): https://www.fetch.ai/events/calhacks-13-0
- Community Fetch hackathon starter (unofficial, optional): https://github.com/adylagad/fetch-hackathon-starter
- SpacetimeDB docs: search for the official SpacetimeDB docs site (quickstart, module languages, TypeScript client SDK)
- Convex docs: search for the official Convex docs (quickstart, actions, scheduled functions, file storage)
- Factory Droid SDK docs: search for Factory's official Droid SDK documentation (TypeScript)
- Apify: Google Maps scraper Actor docs and the Apify SDK/Actor development docs
- Elastic official Cal Hacks starter (clone into `/docs/elastic-starter/` and read `paper-scout/README.md`, `ingest.py`, `setup_agent.py`, `workflows/paper-digest.yaml`): https://github.com/jdarmada/calhacks-paper-scout
- Elastic challenge sign-up and Serverless project: https://ela.st/calhacks
- Elastic Agent Skills for Claude Code (install in Phase 0):
  `claude plugin marketplace add https://github.com/elastic/agent-skills`
  `claude plugin install elastic-elasticsearch@elastic-agent-skills`
  `claude plugin install elastic-kibana@elastic-agent-skills`
- Once the Agent Builder agent exists, connect its MCP endpoint to Claude Code so you can query the real index while building:
  `claude mcp add --transport http streetshift "$KIBANA_URL/api/agent_builder/mcp" --header "Authorization: ApiKey $ELASTIC_API_KEY"`
- deck.gl TripsLayer, ColumnLayer, PathLayer docs; MapLibre GL JS docs
- OSMnx docs
- Creao event page: https://community.creao.ai/CalHacks2026

---

## 10. Environment variables (`.env.example`)

```
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5-5
ANTHROPIC_MODEL_FAST=claude-haiku-5-5
APIFY_TOKEN=
ELASTICSEARCH_URL=
KIBANA_URL=
ELASTIC_API_KEY=
EMBEDDING_INFERENCE_ID=.jina-embeddings-v5-text-small
SPACETIMEDB_URI=
SPACETIMEDB_MODULE=
CONVEX_DEPLOYMENT=
CONVEX_URL=
FACTORY_API_KEY=
AGENTVERSE_API_KEY=
ASI1_API_KEY=
AGENT_SEED_ANALYST=
AGENT_SEED_CAFE=
AGENT_SEED_COMMUTER=
AGENT_SEED_RESIDENT=
AGENT_SEED_PARENT=
MOSS_PROJECT_ID=
MOSS_PROJECT_KEY=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
NYC_OPEN_DATA_APP_TOKEN=
CENSUS_API_KEY=
SPACETIMEDB_TOKEN=
DEMO_MODE=false
USE_MOCK_APIFY=false
USE_MOCK_ELASTIC=false
USE_MOCK_SPACETIME=false
USE_MOCK_CONVEX=false
USE_MOCK_DROID=false
USE_MOCK_FETCH=false
USE_MOCK_MOSS=false
USE_MOCK_VOICE=false
```

---

## 11. Demo script (write the full version to `/DEMO.md`)

1. **Hook (15s):** "Every pedestrianization fight is decided by gut feeling. We built a simulator, and then we tested it against five real streets."
2. **Live play (30s):** Judge picks a street on the forward-looking corridor and pedestrianizes it. Traffic reroutes, businesses pulse, gauges count up.
3. **Backtest reveal (40s):** Switch to Ditmars Blvd, May 2020. Run. Prediction appears. Reveal the real number. The scoreboard fills in across all 5 corridors.
4. **Droid (15s):** Show the live Droid run that produced the backtest, and the sweep's top 5 streets.
5. **Hearing (20s):** Stakeholder agents argue; judge asks the café owner a question by voice.
6. **Close (10s):** "Every simulation here shows a prediction. Ours shows how wrong it was on five real streets, and why you can trust it on yours."
