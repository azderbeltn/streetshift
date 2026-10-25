# StreetShift — Devpost draft

**Tagline:** Predict what happens when a street goes car-free, and see how wrong we were on five real ones.

## Inspiration
Every fight over a car-free street ends up as a shouting match at a public hearing. Café owners fear losing customers, the people on the next block fear cut-through traffic, advocates promise a lively plaza, and the city decides on gut feeling. Meanwhile the thing these projects are really for (people lingering, bumping into neighbours, talking to strangers) never gets measured at all. We wanted a tool that puts evidence on the table before the barriers go up, and that is honest about how good that evidence is.

## What it does
StreetShift is a city simulator on a real 3D map. Pick a street (Hayes St in San Francisco, which already closes to cars on weekends, or one of five New York streets) and pedestrianize a block. A crowd sized to the real Census population walks and drives around it, and three outcomes update live, each with a range and a "before your changes" value:

- **Connection:** conversations per hour, time people linger, new connections formed, and a verdict (thrives, marginal or dies off), based on William Whyte's research on public space. Pink arcs show conversations forming, and the feed names the real business they happen outside ("2 people started talking outside Juice Shop").
- **Economy:** revenue change for each nearby business, with winners and losers.
- **Traffic:** added vehicle-hours and which streets absorb the overflow, shown orange to red on the map.

You can also add floors to a building, change a shop's use, add a park, and **drag the model's assumptions** (foot traffic, seating effect, share of customers who drive, sales pulled from nearby streets, car volume). A cause-and-effect strip shows how one change ripples through: cars removed, then people on the block, time lingering, conversations, revenue and traffic. Click a person to see who they are and who they talked to. Click a business for a Claude-written Merchant Report.

Then the part we're proudest of, the **Backtest Challenge**. In 2020 New York closed five streets to cars, and the city later published restaurant and bar sales on each one and on a nearby control street. StreetShift predicts the gap, then reveals what really happened. We fit one parameter on two streets; the other three are blind. Result: **direction right on 5/5, 12-point mean error on the blind streets, and all three blind actuals inside our predicted range.**

Finally you can stage a **public hearing**. Four Claude stakeholders (a café owner, a commuter, a resident on the overflow street, a parent) argue about your scenario. Each one looks up facts before speaking, and you can see what they looked up. You can question any of them. Or skip the app and ask the **StreetShift Analyst** on ASI:One: "What happens if NYC pedestrianizes Ditmars Blvd?"

## How we built it
- **Real data:** OpenStreetMap road and walk networks (OSMnx); 1,010 businesses and 36,416 dated reviews from Google Maps via **Apify**; US Census ACS 2024 population by block group; NYC DOT traffic and pedestrian counts (Socrata); the NYC DOT *Streets for Recovery* report as ground truth, extracted straight from the PDF with page citations.
- **Simulation (TypeScript):** origin–destination car trips brought to a congestion-aware equilibrium, rerouting around closures with BPR delay; pedestrian flows, business capture by category, car-customer loss, and diversion from nearby streets; Whyte-style dwell and encounter model. Every output is run at low/mid/high parameters.
- **SpacetimeDB** is the live core. Every edit is a reducer, the sim subscribes, recomputes in about 0.2 s and publishes results, and every browser (and every planner's cursor) updates by subscription.
- **Convex** stores Droid runs and steps, backtest results, ground truth, saved scenarios, and reports (file storage), and a daily cron queues a street sweep.
- **Factory Droid** runs the backtest and the neighbourhood sweep from a button in the UI. It is scoped to our own MCP tools only: autonomy off, native tools disabled, and a permission handler that approves only calls to the sim, the scorer and the reports folder. Its plan and every step stream into the UI.
- **Elastic Serverless:** `businesses` and `reviews` indexes with `semantic_text`; hybrid search (BM25 + semantic, RRF, rerank) for the search bar and the hearing; car-dependence per business mined from reviews about parking; an Agent Builder agent with index-search, ES|QL and Workflow tools; and a `corridor-brief` Workflow that writes stakeholder briefings.
- **Claude** powers the hearing, the Merchant Reports and the Analyst. **Moss** holds a persistent facts index plus a per-hearing session memory. **Fetch.ai** uAgents with the Agent Chat Protocol and an Agentverse mailbox make the Analyst usable from ASI:One.
- **Frontend:** React, MapLibre (OpenFreeMap tiles with our own dark 3D buildings) and deck.gl (TripsLayer, ArcLayer, ColumnLayer).

## Challenges we ran into
- **Honest validation.** We kept ground truth readable only by the scorer, so calibration physically can't see the blind streets.
- **Data traps.** Our first "car-dependence" signal said Park Slope was three times as car-dependent as anywhere else, because reviews say "Park Slope". French reviews counted "car" (in French it means "because").
- **Traffic accounting.** A naive reroute made closures look like they *reduced* congestion. We fixed it by equilibrating the baseline and comparing against a matched reroute without the closure.
- **The venue network.** It dropped DNS and blocked the main Overpass server, so we built every service behind a fallback.

## Accomplishments that we're proud of
- A prediction that admits how wrong it is: 5/5 direction, 12-point error on blind streets, every number with a range.
- Watching a judge drag "share of customers who drive" and see the café's forecast and the hearing's arguments change.
- A Droid that does real work in the product with tightly scoped access.

## What we learned
- Ranges and backtests change the conversation more than a single confident number does.
- The empty-plaza effect is real in the model too: closing a long street spreads the crowd thin, so a short, busy block with seating can beat a whole avenue.

## What's next
- More backtest corridors: SF Slow Streets, Paris, Barcelona superblocks.
- Validated interaction data from wearable-free counts (e.g. Whyte-style observation studies).
- Time-of-day schedules in the UI (the Analyst already compares full-time vs weekends-only).
- A city-facing deployment.

## Built with
SpacetimeDB, Convex, Factory Droid SDK, Elastic (Serverless, Agent Builder, Workflows), Apify, Claude, Fetch.ai uAgents / Agentverse / ASI:One, Moss, MapLibre, deck.gl, OSMnx, OpenStreetMap, US Census API, NYC Open Data, React, TypeScript, Python

## Links
- GitHub: https://github.com/azderbeltn/streetshift
- ASI:One shared chat: *(add link)*
- Agent: StreetShift Analyst, `agent1qd4qtakflx6z29sy6m5m6vsv486hke5xnw3k2dvmghqed2tf2pnkgq67f58`
- Demo video: *(add link)*

## Tracks
Meta (Bringing People Closer Together with AI) · Elastic (Find the Signal) · SpacetimeDB · Convex · Factory Droid · Apify · Fetch.ai ASI:One Agent Challenge · Moss · Microsoft · Anthropic
