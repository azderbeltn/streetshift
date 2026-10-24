# StreetShift backtest report

Generated 2026-10-24T23:13:43.213Z by `validation/score.ts`.

**Question:** after a 2020 NYC Open Street, how much better did its restaurants and bars do than a nearby control corridor?
**Metric:** gap in percentage points between the Open Street's and the control's change in gross taxable sales of restaurants and bars, summer 2021 (Jun–Aug 2021) vs the pre-pandemic baseline. The difference-in-differences nets out COVID, which hit both corridors.
**Ground truth:** NYC DOT, *Streets for Recovery* (2022), data appendix (page cited per row).

**Protocol:** one free parameter (base pedestrian uplift on a closed street) is fit on the **calibration** corridors only. Holdout ground truth was not read during calibration; only `score.ts` opens `ground_truth.json`, and `calibrate.ts` can only request calibration rows. Every backtest scenario uses `addedSeating = true` (all five had Open Restaurants roadway dining) and `programming = light`.

Calibration: pedUpliftBase = **0.12**, fit on ditmars, park_slope_5th at 2026-10-24T22:32:23.955Z.

| Corridor | Split | Predicted gap (range) | Actual gap | Direction | Abs error | Predicted treated / control | Actual treated / control | Food & drink businesses (T/C) | Source |
|---|---|---|---|---|---|---|---|---|---|
| Ditmars Blvd (Astoria, Queens) | calibration | +38.9 (20 to 66) | +51 | ✓ | 12.1 | +44% / +5% | +44% / -7% | 19 / 8 | streets-for-recovery-report-data.pdf, page 5 |
| 5th Ave (Park Slope, Brooklyn) | calibration | +51.4 (25 to 89) | +44 | ✓ | 7.4 | +51% / -1% | +27% / -17% | 6 / 18 | streets-for-recovery-report-data.pdf, page 3 |
| Pell & Doyers Sts (Chinatown, Manhattan) | holdout | +34.1 (19 to 54) | +23 | ✓ | 11.1 | +34% / -1% | -8% / -31% | 14 / 5 | streets-for-recovery-report-data.pdf, page 7 |
| E 32nd St (Koreatown, Manhattan) | holdout | +41.1 (22 to 68) | +64 | ✓ | 22.9 | +41% / -0% | +15% / -49% | 14 / 15 | streets-for-recovery-report-data.pdf, page 9 |
| Vanderbilt Ave (Prospect Heights, Brooklyn) | holdout | +62.8 (29 to 109) | +60 | ✓ | 2.8 | +60% / -3% | +20% / -40% | 17 / 6 | streets-for-recovery-report-data.pdf, page 1 |

## Scores

- Corridors scored: **5 / 5**
- Direction correct (Open Street beat its control): **100%**
- Mean absolute error, holdout: **12.3 pts** (calibration: 9.8 pts)
- Holdout actuals inside the predicted range: **3 / 3**
- Rank correlation (Spearman) across scored corridors: **0.50**

## Honest limits

- Five corridors is a tiny sample; treat these as a sanity check, not proof.
- Open Streets corridors also had Open Restaurants roadway dining, so the model's effect is closure + seating together.
- Pedestrian volumes on these corridors are estimated (no NYC Bi-Annual Pedestrian Count location within 500 m of most corridors); traffic is calibrated to nearby NYC Automated Traffic Volume Counts where they exist.
- Business mix comes from today's Google Maps listings (Apify), not 2020's.
- A 2026 NY State Comptroller report found retail and restaurant jobs had not recovered on most Open Streets, so the evidence on lasting effects is mixed.
- Interaction metrics have no ground truth and are not part of this backtest.
