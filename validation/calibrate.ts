// Fit the single free parameter (base pedestrian uplift on a closed street) on the CALIBRATION
// corridors only, by grid search on squared error of the predicted treated-minus-control gap.
// Writes sim/calibration.json. Holdout ground truth is never requested.
//
//   npx --prefix sim tsx validation/calibrate.ts
import { writeFileSync } from "node:fs";
import { loadGroundTruth, predictCorridor } from "./score.ts";
import { setUpliftOverride, CALIBRATION_FILE } from "../sim/src/params.ts";

const cal = loadGroundTruth("calibration");
const usable = cal.filter((c) => predictCorridor(c.corridorId) !== null);
if (!usable.length) throw new Error("no calibration corridor has data yet");

let best = { v: NaN, sse: Infinity, preds: [] as number[] };
for (let v = 0.02; v <= 2.0 + 1e-9; v += 0.01) {
  setUpliftOverride(v);
  const preds = usable.map((c) => predictCorridor(c.corridorId)!.byLevel.mid.gap!);
  const sse = preds.reduce((s, p, i) => s + (p - usable[i].actualGapPct) ** 2, 0);
  if (sse < best.sse) best = { v: Math.round(v * 100) / 100, sse, preds };
}
setUpliftOverride(null);
writeFileSync(CALIBRATION_FILE, JSON.stringify({ pedUpliftBase: best.v, fitOn: usable.map((c) => c.corridorId), fittedAt: new Date().toISOString(),
  note: "Grid search 0.02..2.00 step 0.01 minimising squared error of the mid predicted gap on calibration corridors only." }, null, 2) + "\n");
console.log(`pedUpliftBase = ${best.v}  (fit on ${usable.map((c) => c.corridorId).join(", ")})`);
usable.forEach((c, i) => console.log(`  ${c.corridorId}: predicted gap ${best.preds[i].toFixed(1)} vs actual ${c.actualGapPct}`));
