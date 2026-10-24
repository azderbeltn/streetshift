// Phase 2 acceptance: closing Ditmars Blvd gives sensible metrics in < 5 s; closing a quiet
// residential side street yields DIES_OFF or MARGINAL.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020Mod from "../../contracts/node_modules/ajv/dist/2020.js";
import { runScenario } from "../src/model.ts";
import { loadNetwork, haversineM } from "../src/network.ts";
import { loadBusinesses } from "../src/economy.ts";

const Ajv2020 = (Ajv2020Mod as any).default ?? Ajv2020Mod;
const schema = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "contracts", "schemas", "Metrics.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

test("closing Ditmars Blvd returns sensible Metrics in under 5 s", () => {
  const net = loadNetwork("astoria");
  const t = performance.now();
  const r = runScenario({ area: "astoria", corridorId: "ditmars", closedSegmentIds: net.corridors.ditmars.segmentIds, addedSeating: true, programming: "light" });
  const ms = performance.now() - t;
  console.log(JSON.stringify({ ms: Math.round(ms), interaction: r.metrics.interaction, economy: { total: r.metrics.economy.totalRevenueChangePct, range: r.metrics.economy.range },
    traffic: { addedVehicleHours: r.metrics.traffic.addedVehicleHours, range: r.metrics.traffic.range, overflow: r.metrics.traffic.overflowSegments.slice(0, 3).map((o) => `${net.segById.get(o.segmentId)!.name} +${o.loadIncreasePct}%`) },
    before: r.baseline.interaction }));
  assert.ok(ms < 5000, `took ${ms} ms`);
  assert.ok(validate(r.metrics), JSON.stringify(validate.errors));
  assert.ok(r.metrics.traffic.addedVehicleHours > 0, "closing a through street adds some delay");
  assert.ok(r.metrics.traffic.overflowSegments.length > 0, "some streets absorb overflow");
  assert.ok(r.metrics.interaction.encountersPerHour > r.baseline.interaction.encountersPerHour, "a pedestrianized commercial street has more encounters than before");
  for (const [lo, hi, v] of [[...r.metrics.economy.range, r.metrics.economy.totalRevenueChangePct], [...r.metrics.traffic.range, r.metrics.traffic.addedVehicleHours]] as number[][])
    assert.ok(lo <= v && v <= hi, `value ${v} inside range [${lo}, ${hi}]`);
  const food = r.corridor!.restaurantBarChangePct.mid!;
  assert.ok(food > 0 && food < 300, `restaurant/bar change on Ditmars ${food}% is positive and bounded`);
});

test("closing a quiet residential side street yields DIES_OFF or MARGINAL", () => {
  const net = loadNetwork("astoria");
  const biz = loadBusinesses("astoria");
  // A residential segment with no business within 150 m.
  const seg = net.segments.find((s) => s.highway === "residential" && s.lengthM > 60 &&
    !biz.some((b) => s.coords.some((p) => haversineM(p, [b.lng, b.lat]) < 150)))!;
  assert.ok(seg, "found a quiet residential segment");
  const r = runScenario({ area: "astoria", closedSegmentIds: [seg.id], addedSeating: false, programming: "none" });
  console.log(JSON.stringify({ segment: `${seg.name} (${seg.id})`, interaction: r.metrics.interaction }));
  assert.ok(["DIES_OFF", "MARGINAL"].includes(r.metrics.interaction.verdict));
});
