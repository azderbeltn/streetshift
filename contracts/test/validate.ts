// Type-checks one fixture per contract (via tsc) and validates it against the JSON Schema (via ajv),
// so the TS types and the Python-side schemas can't silently drift apart.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020Mod from "ajv/dist/2020.js";
const Ajv2020 = (Ajv2020Mod as unknown as { default: typeof Ajv2020Mod }).default ?? Ajv2020Mod;
import type { Segment, Business, Scenario, Metrics, BacktestRow, DroidRun } from "../index.ts";

const segment: Segment = { id: "s1", name: "Ditmars Blvd", coords: [[-73.91, 40.775], [-73.909, 40.776]], lanes: 2, baselineCarVolume: null, baselinePedVolume: 1200 };
const business: Business = { id: "b1", name: "Cafe", category: "cafe", lng: -73.91, lat: 40.775, rating: 4.5, reviewCount: 120, popularTimes: [[0, 10, 50]], carDependence: 0.2, segmentId: "s1" };
const scenario: Scenario = { id: "sc1", city: "NYC", corridorId: "ditmars", closedSegmentIds: ["s1"], addedSeating: true, programming: "light", createdAt: Date.now() };
const metrics: Metrics = {
  interaction: { lingerIndex: 0.6, encountersPerHour: 40, verdict: "THRIVES", range: [30, 50] },
  economy: { totalRevenueChangePct: 12, range: [5, 20], perBusiness: [{ businessId: "b1", changePct: 15 }] },
  traffic: { addedVehicleHours: 8, range: [4, 12], overflowSegments: [{ segmentId: "s2", loadIncreasePct: 22 }] },
};
const row: BacktestRow = { corridorId: "ditmars", corridorName: "Ditmars Blvd", split: "calibration", predictedGapPct: 40, actualGapPct: null, directionCorrect: null, absErrorPts: null };
const run: DroidRun = { id: "r1", kind: "backtest", status: "running", plan: ["a"], steps: [{ label: "a", status: "done" }], startedAt: 0 };

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "schemas");
const ajv = new (Ajv2020 as any)({ allErrors: true });
const fixtures: Record<string, unknown> = { Segment: segment, Business: business, Scenario: scenario, Metrics: metrics, BacktestRow: row, DroidRun: run };
let failed = 0;
for (const [name, value] of Object.entries(fixtures)) {
  const validate = ajv.compile(JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8")));
  const ok = validate(value);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}`, ok ? "" : JSON.stringify(validate.errors));
  if (!ok) failed++;
}
// Negative check: a bad verdict must be rejected.
const bad = ajv.getSchema("https://streetshift.dev/schemas/Metrics.json")!;
const rejected = !bad({ ...metrics, interaction: { ...metrics.interaction, verdict: "MAYBE" } });
console.log(`${rejected ? "PASS" : "FAIL"} Metrics rejects invalid verdict`);
if (!rejected) failed++;
process.exit(failed ? 1 : 0);
