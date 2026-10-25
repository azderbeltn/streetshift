// Backtest scorer. The ONLY code that reads validation/ground_truth.json (CLAUDE.md Section 5).
// /sim never sees it; validation/calibrate.ts gets calibration-split rows only, via loadGroundTruth().
//
//   npx --prefix sim tsx validation/score.ts          -> scores all corridors, writes the report
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { BacktestRow } from "../contracts/index.ts";
import { predictGap } from "../sim/src/model.ts";
import { calibration } from "../sim/src/params.ts";
import { listAreas, loadNetwork } from "../sim/src/network.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const GT_FILE = join(HERE, "ground_truth.json");

export type Split = "calibration" | "holdout";
export type TruthRow = { corridorId: string; corridorName: string; split: Split; actualGapPct: number; actualTreatedPct: number; actualControlPct: number; source: string };

/** Corridor -> sim area and control corridor id (geometry only, no outcomes). */
export const PAIRS: Record<string, { area: string; control: string }> = {
  ditmars: { area: "astoria", control: "ditmars_control" },
  park_slope_5th: { area: "park_slope", control: "park_slope_5th_control" },
  pell_doyers: { area: "chinatown", control: "pell_doyers_control" },
  e32nd: { area: "koreatown", control: "e32nd_control" },
  vanderbilt: { area: "prospect_heights", control: "vanderbilt_control" },
};

/** Ground truth for one split. Calibration code must only ever request "calibration". */
export function loadGroundTruth(split: Split): TruthRow[] {
  const gt = JSON.parse(readFileSync(GT_FILE, "utf8"));
  return gt.corridors.filter((c: any) => c.split === split).map((c: any) => ({
    corridorId: c.corridorId, corridorName: c.corridorName, split: c.split, actualGapPct: c.actualGapPct,
    actualTreatedPct: c.actualTreatedPct, actualControlPct: c.actualControlPct, source: c.treated.source,
  }));
}

export function predictCorridor(corridorId: string) {
  const p = PAIRS[corridorId];
  if (!listAreas().includes(p.area)) return null;
  const net = loadNetwork(p.area);
  if (!net.corridors[corridorId] || !net.corridors[p.control]) return null;
  return predictGap(corridorId, p.control, p.area, "light");
}

function spearman(a: number[], b: number[]): number | null {
  if (a.length < 3) return null;
  const rank = (xs: number[]) => { const idx = xs.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]); const r = new Array(xs.length); idx.forEach(([, i], k) => (r[i] = k + 1)); return r; };
  const ra = rank(a), rb = rank(b), n = a.length;
  const d2 = ra.reduce((s, r, i) => s + (r - rb[i]) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

const fmt = (x: number | null | undefined, d = 1) => (x === null || x === undefined ? "—" : (x > 0 ? "+" : "") + x.toFixed(d));

export function scoreAll() {
  const truth = [...loadGroundTruth("calibration"), ...loadGroundTruth("holdout")];
  const rows: (BacktestRow & { predictedRange: [number, number] | null; predictedTreatedPct: number | null; predictedControlPct: number | null; actualTreatedPct: number; actualControlPct: number; source: string; foodBusinesses: { treated: number; control: number } | null; available: boolean })[] = [];
  for (const t of truth) {
    const p = predictCorridor(t.corridorId);
    const g = p?.byLevel.mid.gap ?? null;
    const lo = p ? Math.min(...(["low", "mid", "high"] as const).map((l) => p.byLevel[l].gap ?? NaN)) : NaN;
    const hi = p ? Math.max(...(["low", "mid", "high"] as const).map((l) => p.byLevel[l].gap ?? NaN)) : NaN;
    rows.push({
      corridorId: t.corridorId, corridorName: t.corridorName, split: t.split,
      predictedGapPct: g === null ? NaN : Math.round(g * 10) / 10, actualGapPct: t.actualGapPct,
      directionCorrect: g === null ? null : (g > 0) === (t.actualGapPct > 0),
      absErrorPts: g === null ? null : Math.round(Math.abs(g - t.actualGapPct) * 10) / 10,
      predictedRange: isFinite(lo) && isFinite(hi) ? [Math.round(lo), Math.round(hi)] : null,
      predictedTreatedPct: p?.byLevel.mid.treated ?? null, predictedControlPct: p?.byLevel.mid.control ?? null,
      actualTreatedPct: t.actualTreatedPct, actualControlPct: t.actualControlPct, source: t.source,
      foodBusinesses: p?.foodBusinesses ?? null, available: !!p,
    });
  }
  const done = rows.filter((r) => r.available);
  const holdout = done.filter((r) => r.split === "holdout");
  const mae = (rs: typeof rows) => (rs.length ? rs.reduce((s, r) => s + (r.absErrorPts ?? 0), 0) / rs.length : null);
  const summary = {
    corridorsScored: done.length,
    directionAccuracy: done.length ? done.filter((r) => r.directionCorrect).length / done.length : null,
    maeAll: mae(done), maeHoldout: mae(holdout), maeCalibration: mae(done.filter((r) => r.split === "calibration")),
    spearmanAll: spearman(done.map((r) => r.predictedGapPct), done.map((r) => r.actualGapPct!)),
    holdoutInRange: holdout.filter((r) => r.predictedRange && r.actualGapPct! >= r.predictedRange[0] && r.actualGapPct! <= r.predictedRange[1]).length,
    holdoutScored: holdout.length,
    calibration: calibration(),
  };
  return { rows, summary };
}

/**
 * Run history. v1 was the first and only truly blind holdout run. After it we fixed a data bug
 * (businesses were assigned to the nearest road segment ignoring their street address), re-fit the
 * one parameter on the calibration corridors only, and re-scored. Because we had already seen v1's
 * holdout results, the current run is no longer strictly blind; both are reported.
 */
function runHistory(cur: any): string[] {
  const f = join(HERE, "backtest_results_v1.json");
  if (!existsSync(f)) return [];
  const v1 = JSON.parse(readFileSync(f, "utf8")).summary;
  const row = (name: string, s: any) => `| ${name} | ${s.calibration?.pedUpliftBase ?? "—"} | ${Math.round(s.directionAccuracy * 100)}% | ${s.maeHoldout.toFixed(1)} | ${s.maeCalibration.toFixed(1)} | ${s.holdoutInRange}/${s.holdoutScored} | ${s.spearmanAll?.toFixed(2) ?? "—"} |`;
  return ["## Run history", "",
    "**v1 is the headline result: it is the only run where the holdout streets were truly blind.** After v1 we fixed a data bug (businesses were assigned to the nearest road segment without checking their street address, so corner shops could land on the avenue), re-fit the single parameter on the calibration corridors only, and re-scored. We had already seen v1's holdout results, so the current run is no longer strictly blind. It scored slightly worse on the holdout.", "",
    "| Run | pedUpliftBase | Direction | Holdout MAE (pts) | Calibration MAE (pts) | Holdout in range | Spearman |", "|---|---|---|---|---|---|---|",
    row("v1, blind (headline)", v1), row("current, after address fix", cur), "",
    "Remaining data limit: the Google Maps scrape gathered ~60 places in a 300 m circle per corridor, and only a fraction front the corridor itself (e.g. 15 on E 32nd St). Busy Manhattan blocks are under-counted, which is the most likely reason E 32nd St is the worst miss.", ""];
}

export function writeReport(res: ReturnType<typeof scoreAll>) {
  const { rows, summary: s } = res;
  const lines = [
    "# StreetShift backtest report", "",
    `Generated ${new Date().toISOString()} by \`validation/score.ts\`.`, "",
    "**Question:** after a 2020 NYC Open Street, how much better did its restaurants and bars do than a nearby control corridor?",
    "**Metric:** gap in percentage points between the Open Street's and the control's change in gross taxable sales of restaurants and bars, summer 2021 (Jun–Aug 2021) vs the pre-pandemic baseline. The difference-in-differences nets out COVID, which hit both corridors.",
    "**Ground truth:** NYC DOT, *Streets for Recovery* (2022), data appendix (page cited per row).", "",
    "**Protocol:** one free parameter (base pedestrian uplift on a closed street) is fit on the **calibration** corridors only. Holdout ground truth was not read during calibration; only `score.ts` opens `ground_truth.json`, and `calibrate.ts` can only request calibration rows. Every backtest scenario uses `addedSeating = true` (all five had Open Restaurants roadway dining) and `programming = light`.", "",
    `Calibration: ${s.calibration ? `pedUpliftBase = **${s.calibration.pedUpliftBase}**, fit on ${s.calibration.fitOn.join(", ")} at ${s.calibration.fittedAt}` : "not run (prior values)"}.`, "",
    "| Corridor | Split | Predicted gap (range) | Actual gap | Direction | Abs error | Predicted treated / control | Actual treated / control | Food & drink businesses (T/C) | Source |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...rows.map((r) => r.available
      ? `| ${r.corridorName} | ${r.split} | ${fmt(r.predictedGapPct)} (${r.predictedRange![0]} to ${r.predictedRange![1]}) | ${fmt(r.actualGapPct, 0)} | ${r.directionCorrect ? "✓" : "✗"} | ${r.absErrorPts} | ${fmt(r.predictedTreatedPct, 0)}% / ${fmt(r.predictedControlPct, 0)}% | ${fmt(r.actualTreatedPct, 0)}% / ${fmt(r.actualControlPct, 0)}% | ${r.foodBusinesses!.treated} / ${r.foodBusinesses!.control} | ${r.source} |`
      : `| ${r.corridorName} | ${r.split} | not run (data missing) | ${fmt(r.actualGapPct, 0)} | — | — | — | ${fmt(r.actualTreatedPct, 0)}% / ${fmt(r.actualControlPct, 0)}% | — | ${r.source} |`),
    "",
    "## Scores", "",
    `- Corridors scored: **${s.corridorsScored} / 5**`,
    `- Direction correct (Open Street beat its control): **${s.directionAccuracy === null ? "—" : Math.round(s.directionAccuracy * 100) + "%"}**`,
    `- Mean absolute error, holdout: **${s.maeHoldout === null ? "—" : s.maeHoldout.toFixed(1) + " pts"}** (calibration: ${s.maeCalibration === null ? "—" : s.maeCalibration.toFixed(1) + " pts"})`,
    `- Holdout actuals inside the predicted range: **${s.holdoutInRange} / ${s.holdoutScored}**`,
    `- Rank correlation (Spearman) across scored corridors: **${s.spearmanAll === null ? "— (need ≥ 3)" : s.spearmanAll.toFixed(2)}**`, "",
    ...runHistory(s),
    "## Honest limits", "",
    "- Five corridors is a tiny sample; treat these as a sanity check, not proof.",
    "- Open Streets corridors also had Open Restaurants roadway dining, so the model's effect is closure + seating together.",
    "- Pedestrian volumes on these corridors are estimated (no NYC Bi-Annual Pedestrian Count location within 500 m of most corridors); traffic is calibrated to nearby NYC Automated Traffic Volume Counts where they exist.",
    "- Business mix comes from today's Google Maps listings (Apify), not 2020's.",
    "- A 2026 NY State Comptroller report found retail and restaurant jobs had not recovered on most Open Streets, so the evidence on lasting effects is mixed.",
    "- Interaction metrics have no ground truth and are not part of this backtest.", "",
  ];
  writeFileSync(join(HERE, "backtest_report.md"), lines.join("\n"), "utf8");
  writeFileSync(join(HERE, "backtest_results.json"), JSON.stringify(res, null, 2), "utf8");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(GT_FILE)) throw new Error("run validation/extract_ground_truth.py first");
  const res = scoreAll();
  writeReport(res);
  console.table(res.rows.map((r) => ({ corridor: r.corridorId, split: r.split, predicted: r.predictedGapPct, range: r.predictedRange?.join("..") ?? "", actual: r.actualGapPct, dir: r.directionCorrect, absErr: r.absErrorPts })));
  console.log(JSON.stringify(res.summary));
}
