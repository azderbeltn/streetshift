// Planner-adjustable assumptions ("what if we're wrong about X?"). Each knob overrides one model
// parameter for a single run; the default is the calibrated/sourced value from params.json, so the
// backtested model is always the reference. low/high levels scale with the knob so ranges move too.
import { P } from "./params.ts";

export type Knob = { key: string; label: string; help: string; unit: string; min: number; max: number; step: number; default: number };
type Def = Knob & { apply: (v: number) => void };

const levels = (obj: any, v: number) => {
  const k = v / obj.mid;
  obj.low *= k; obj.high *= k; obj.mid = v;
};

const DEFS: Def[] = [
  { key: "footTraffic", label: "Foot traffic", help: "Scales every street's baseline pedestrians (estimates and NYC counts).", unit: "×", min: 0.4, max: 2.5, step: 0.05, default: 1,
    apply: (v) => { P.pedestrians.footTrafficScale = { value: v }; } },
  { key: "seatingEffect", label: "Seating effect", help: "How much seating multiplies dwell time and foot traffic on a closed block (Whyte).", unit: "×", min: 1, max: 2, step: 0.05, default: P.pedestrians.seatingMultiplier.mid,
    apply: (v) => levels(P.pedestrians.seatingMultiplier, v) },
  { key: "lingerMinutes", label: "Base linger time", help: "Minutes an ordinary passer-by spends on a block before any changes.", unit: "min", min: 1, max: 5, step: 0.1, default: P.interaction.dwellMinutesBase.value,
    apply: (v) => { P.interaction.dwellMinutesBase.value = v; } },
  { key: "carCustomers", label: "Customers who drive", help: "Share of shoppers arriving by car; they are the ones a closure can lose.", unit: "%", min: 0, max: 45, step: 1, default: P.economy.carCustomerShare.mid * 100,
    apply: (v) => levels(P.economy.carCustomerShare, Math.max(v, 0.001) / 100) },
  { key: "diversion", label: "Sales pulled from nearby streets", help: "Share of the closed street's new visits that would otherwise have gone to nearby streets.", unit: "%", min: 0, max: 60, step: 1, default: P.economy.diversionFromNearby.mid * 100,
    apply: (v) => levels(P.economy.diversionFromNearby, Math.max(v, 0.001) / 100) },
  { key: "trafficDemand", label: "Car traffic volume", help: "Scales calibrated car volumes; congestion grows non-linearly (BPR).", unit: "×", min: 0.5, max: 2, step: 0.05, default: 1,
    apply: (v) => { P.traffic.demandScale = { value: v }; } },
];

export const KNOBS: Knob[] = DEFS.map(({ apply: _a, ...k }) => k);

/** Run `fn` with the given assumption overrides, restoring the original parameters afterwards. */
export function withAssumptions<T>(ov: Record<string, number> | undefined, fn: () => T): T {
  const active = DEFS.filter((d) => ov && typeof ov[d.key] === "number" && Math.abs(ov[d.key] - d.default) > 1e-9);
  if (!active.length) return fn();
  const saved = JSON.stringify(P);
  try {
    for (const d of active) d.apply(Math.min(d.max, Math.max(d.min, ov![d.key])));
    return fn();
  } finally {
    const orig = JSON.parse(saved);
    for (const k of Object.keys(P)) delete P[k];
    Object.assign(P, orig);
  }
}
