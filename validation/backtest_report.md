# StreetShift backtest report

Generated 2026-10-25T03:09:27.785Z by `validation/score.ts`.

**Question:** after a 2020 NYC Open Street, how much better did its restaurants and bars do than a nearby control corridor?
**Metric:** gap in percentage points between the Open Street's and the control's change in gross taxable sales of restaurants and bars, summer 2021 (Jun–Aug 2021) vs the pre-pandemic baseline. The difference-in-differences nets out COVID, which hit both corridors.
**Ground truth:** NYC DOT, *Streets for Recovery* (2022), data appendix (page cited per row).

**Protocol:** one free parameter (base pedestrian uplift on a closed street) is fit on the **calibration** corridors only. Holdout ground truth was not read during calibration; only `score.ts` opens `ground_truth.json`, and `calibrate.ts` can only request calibration rows. Every backtest scenario uses `addedSeating = true` (all five had Open Restaurants roadway dining) and `programming = light`.

Calibration: pedUpliftBase = **0.1**, fit on ditmars, park_slope_5th at 2026-10-25T03:08:53.111Z.

| Corridor | Split | Predicted gap (range) | Actual gap | Direction | Abs error | Predicted treated / control | Actual treated / control | Food & drink businesses (T/C) | Source |
|---|---|---|---|---|---|---|---|---|---|
| Ditmars Blvd (Astoria, Queens) | calibration | +41.2 (21 to 70) | +51 | ✓ | 9.8 | +41% / -0% | +44% / -7% | 21 / 8 | streets-for-recovery-report-data.pdf, page 5 |
| 5th Ave (Park Slope, Brooklyn) | calibration | +49.9 (24 to 87) | +44 | ✓ | 5.9 | +48% / -2% | +27% / -17% | 10 / 18 | streets-for-recovery-report-data.pdf, page 3 |
| Pell & Doyers Sts (Chinatown, Manhattan) | holdout | +32.2 (18 to 51) | +23 | ✓ | 9.2 | +32% / -1% | -8% / -31% | 14 / 6 | streets-for-recovery-report-data.pdf, page 7 |
| E 32nd St (Koreatown, Manhattan) | holdout | +37.9 (20 to 62) | +64 | ✓ | 26.1 | +38% / -0% | +15% / -49% | 14 / 14 | streets-for-recovery-report-data.pdf, page 9 |
| Vanderbilt Ave (Prospect Heights, Brooklyn) | holdout | +57.6 (27 to 100) | +60 | ✓ | 2.4 | +55% / -3% | +20% / -40% | 20 / 6 | streets-for-recovery-report-data.pdf, page 1 |

## Scores

- Corridors scored: **5 / 5**
- Direction correct (Open Street beat its control): **100%**
- Mean absolute error, holdout: **12.6 pts** (calibration: 7.9 pts)
- Holdout actuals inside the predicted range: **2 / 3**
- Rank correlation (Spearman) across scored corridors: **0.30**

## Run history

**v1 is the headline result: it is the only run where the holdout streets were truly blind.** After v1 we fixed a data bug (businesses were assigned to the nearest road segment without checking their street address, so corner shops could land on the avenue), re-fit the single parameter on the calibration corridors only, and re-scored. We had already seen v1's holdout results, so the current run is no longer strictly blind. It scored slightly worse on the holdout.

| Run | pedUpliftBase | Direction | Holdout MAE (pts) | Calibration MAE (pts) | Holdout in range | Spearman |
|---|---|---|---|---|---|---|
| v1, blind (headline) | 0.12 | 100% | 12.3 | 9.8 | 3/3 | 0.50 |
| current, after address fix | 0.1 | 100% | 12.6 | 7.9 | 2/3 | 0.30 |

Remaining data limit: the Google Maps scrape gathered ~60 places in a 300 m circle per corridor, and only a fraction front the corridor itself (e.g. 15 on E 32nd St). Busy Manhattan blocks are under-counted, which is the most likely reason E 32nd St is the worst miss.

## Honest limits

- Five corridors is a tiny sample; treat these as a sanity check, not proof.
- Open Streets corridors also had Open Restaurants roadway dining, so the model's effect is closure + seating together.
- Pedestrian volumes on these corridors are estimated (no NYC Bi-Annual Pedestrian Count location within 500 m of most corridors); traffic is calibrated to nearby NYC Automated Traffic Volume Counts where they exist.
- Business mix comes from today's Google Maps listings (Apify), not 2020's.
- A 2026 NY State Comptroller report found retail and restaurant jobs had not recovered on most Open Streets, so the evidence on lasting effects is mixed.
- Interaction metrics have no ground truth and are not part of this backtest.
