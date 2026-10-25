# StreetShift — 3-minute demo script

**Before judging (10 min):** start the four processes (see README). Open `http://localhost:5173` full-screen. On Hayes St, click **Reset all changes**. Close the Assumptions and Hearing drawers. Have ASI:One open in a second tab with the saved chat. Optional: open a second browser window on Hayes to show multiplayer.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:15 | Idle 3D Hayes Valley, crowd moving | "Every fight over a car-free street is decided by gut feeling. We built a simulator, then tested it against five real streets." |
| 0:15–0:50 | Hand the judge the mouse → **Pedestrianize this corridor**. Green pulse, Oak St turns orange, pink conversation arcs, feed scrolls | "This is real Hayes Street, real businesses, a crowd sized to the Census. Conversations go from 3 to 14 an hour, people linger longer, nearby businesses +4%, about one extra vehicle-hour a day, mostly on Oak Street. Every number has a range." |
| 0:50–1:15 | **Assumptions** → drag *Foot traffic* to 2× (verdict flips to THRIVES), then *Customers who drive* up (revenue drops). Point at the cause→effect strip | "Don't trust our assumptions? Change them. Watch the chain: cars removed, people on the block, lingering, conversations, revenue." |
| 1:15–1:55 | **Backtest challenge** → Reveal Ditmars, then Pell & Doyers, then the scoreboard | "In 2020 New York closed these streets. We predict the gap against a control street, then reveal the city's sales data. Five out of five in the right direction, 12 points off on streets the model never saw, and every blind street inside our range." |
| 1:55–2:15 | Droid panel → **Street sweep** (or show the finished run): plan, steps ticking, report | "Factory Droid reruns the backtest and sweeps the neighbourhood for the best five blocks. It can only touch the simulator, the scorer and the reports folder." |
| 2:15–2:40 | **Hearing** → Open the hearing; ask Maya "Would you support it with a loading zone?"; expand "looked up" | "Four Claude stakeholders argue about your scenario, each grounded in what it looked up. Ask them anything." |
| 2:40–2:50 | ASI:One tab: the Analyst answering "What happens if NYC pedestrianizes Ditmars Blvd?" | "And anyone can ask it from ASI:One." |
| 2:50–3:00 | Back to the map | "Every simulator shows a prediction. Ours shows how wrong it was on five real streets, and why you can trust it on yours." |

**If something fails:** the app falls back to local mode by itself if SpacetimeDB is unreachable; search falls back to local matching; the hearing falls back from Moss to Elastic. Claude answers are cached on disk, so the scripted questions replay instantly.

**Likely questions**
- *How do you know the conversation numbers are right?* We don't. They're labelled model output, not validated. The backtest validates the economy model. The interaction model follows Whyte's observations, and we'd love real observation data.
- *Why only one fitted parameter?* With five streets, more knobs would just memorise them. One parameter, fit on two streets, predicting three blind ones.
- *Isn't this zero-sum for nearby streets?* There's a diversion knob (default 15% of new sales come from nearby streets). Drag it and watch the control street.
