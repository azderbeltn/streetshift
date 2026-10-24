// Runs one scenario at low/mid/high parameter levels and assembles the contract `Metrics`.
import type { Metrics, Verdict } from "../../contracts/index.ts";
import { loadNetwork } from "./network.ts";
import { withAssumptions } from "./assumptions.ts";
import { LEVELS, P, type Level } from "./params.ts";
import { runTraffic, trafficBaseline, type TrafficResult } from "./traffic.ts";
import { loadBusinesses, runEconomy, runInteraction, businessesOn, type ScenarioInput, type EconomyResult, type InteractionResult, RESTAURANT_BAR } from "./economy.ts";

export type ScenarioRequest = ScenarioInput & { area: string; corridorId?: string };

export type RunResult = {
  metrics: Metrics;
  baseline: { interaction: InteractionResult }; // "Before your changes"
  interaction: Record<Level, InteractionResult>;
  connection: { conversationsPerHour: number; lingerMinutes: number; newConnectionsPerDay: number; peoplePresent: number; range: { conversationsPerHour: [number, number]; newConnectionsPerDay: [number, number] } };
  segmentLoads: TrafficResult["segmentLoads"];
  segmentPed: EconomyResult["segmentPed"];
  traffic: { reroutedVehPerHour: number; unreachableVehPerHour: number; estimated: boolean; calibration: string };
  corridor?: { id: string; restaurantBarChangePct: Record<Level, number | null> };
  flags: string[];
  elapsedMs: number;
};

const r1 = (x: number) => Math.round(x * 10) / 10;
const span = (xs: number[]): [number, number] => [r1(Math.min(...xs)), r1(Math.max(...xs))];

export function verdictOf(lingerIndex: number): Verdict {
  const t = P.interaction.thresholds;
  return lingerIndex < t.diesOffBelow ? "DIES_OFF" : lingerIndex >= t.thrivesAbove ? "THRIVES" : "MARGINAL";
}

export function runScenario(req: ScenarioRequest): RunResult {
  return withAssumptions(req.assumptions, () => runScenarioInner(req));
}

function runScenarioInner(req: ScenarioRequest): RunResult {
  const t0 = performance.now();
  const net = loadNetwork(req.area);
  const biz = loadBusinesses(req.area);
  const s: ScenarioInput = { closedSegmentIds: req.closedSegmentIds ?? [], addedSeating: !!req.addedSeating, programming: req.programming ?? "none",
    segmentMods: req.segmentMods, businessMods: req.businessMods, assumptions: req.assumptions };
  const unknown = s.closedSegmentIds.filter((id) => !net.segById.has(id));
  if (unknown.length) throw new Error(`unknown segment ids: ${unknown.slice(0, 5).join(", ")}`);
  const focus = req.corridorId ? net.corridors[req.corridorId]?.segmentIds : undefined;

  const tr = {} as Record<Level, TrafficResult>, ec = {} as Record<Level, EconomyResult>, ia = {} as Record<Level, InteractionResult>;
  for (const l of LEVELS) {
    tr[l] = runTraffic(net, s.closedSegmentIds, l);
    ec[l] = runEconomy(net, biz, s, tr[l], l);
    ia[l] = runInteraction(net, biz, s, ec[l], l, focus);
  }
  // "Before your changes": same place, nothing changed.
  const none: ScenarioInput = { closedSegmentIds: [], addedSeating: false, programming: "none" };
  const trB = runTraffic(net, [], "mid");
  const baseFocus = s.closedSegmentIds.length ? s.closedSegmentIds : focus;
  const baseIa = runInteraction(net, biz, none, runEconomy(net, biz, none, trB, "mid"), "mid", baseFocus);

  const m = ec.mid;
  const metrics: Metrics = {
    interaction: { lingerIndex: ia.mid.lingerIndex, encountersPerHour: ia.mid.encountersPerHour, verdict: verdictOf(ia.mid.lingerIndex),
      range: span(LEVELS.map((l) => ia[l].encountersPerHour)) },
    economy: { totalRevenueChangePct: m.totalRevenueChangePct, range: span(LEVELS.map((l) => ec[l].totalRevenueChangePct)),
      perBusiness: m.perBusiness.filter((p) => p.changePct !== 0).map(({ businessId, changePct }) => ({ businessId, changePct })) },
    traffic: { addedVehicleHours: tr.mid.addedVehicleHours, range: span(LEVELS.map((l) => tr[l].addedVehicleHours)), overflowSegments: tr.mid.overflowSegments },
  };
  const flags: string[] = ["Interaction is model output, not validated."];
  if (tr.mid.estimated) flags.push("Traffic volumes estimated from road class (no nearby NYC counts).");
  if (m.pedEstimated) flags.push("Pedestrian volumes estimated from business density, road class and Census density (no nearby counts).");
  if (!biz.length) flags.push("No business data for this area yet.");

  let corridor: RunResult["corridor"];
  if (req.corridorId && focus) {
    corridor = { id: req.corridorId, restaurantBarChangePct: {} as Record<Level, number | null> };
    for (const l of LEVELS) corridor.restaurantBarChangePct[l] = ec[l].corridorRevenueChangePct(focus, RESTAURANT_BAR);
  }
  return {
    metrics, baseline: { interaction: baseIa }, interaction: ia,
    connection: { conversationsPerHour: ia.mid.encountersPerHour, lingerMinutes: ia.mid.dwellMinutes, newConnectionsPerDay: ia.mid.newConnectionsPerDay,
      peoplePresent: ia.mid.peoplePresent,
      range: { conversationsPerHour: span(LEVELS.map((l) => ia[l].encountersPerHour)), newConnectionsPerDay: span(LEVELS.map((l) => ia[l].newConnectionsPerDay)) } },
    segmentLoads: tr.mid.segmentLoads, segmentPed: m.segmentPed,
    traffic: { reroutedVehPerHour: tr.mid.reroutedTrips, unreachableVehPerHour: tr.mid.unreachableTrips, estimated: tr.mid.estimated,
      calibration: trafficBaseline(net).calibration.note },
    corridor, flags, elapsedMs: Math.round(performance.now() - t0),
  };
}

/**
 * Backtest prediction for a treated/control pair: close the treated corridor (with outdoor dining,
 * as all 2020 Open Streets had) and predict restaurant & bar sales change on treated minus control.
 */
export function predictGap(treatedId: string, controlId: string, area: string, programming: "none" | "light" | "heavy" = "light") {
  const net = loadNetwork(area);
  const res = runScenario({ area, closedSegmentIds: net.corridors[treatedId].segmentIds, addedSeating: true, programming });
  const biz = loadBusinesses(area);
  const out = {} as Record<Level, { treated: number | null; control: number | null; gap: number | null }>;
  for (const l of LEVELS) {
    const ec = runEconomy(net, biz, { closedSegmentIds: net.corridors[treatedId].segmentIds, addedSeating: true, programming },
      runTraffic(net, net.corridors[treatedId].segmentIds, l), l);
    const t = ec.corridorRevenueChangePct(net.corridors[treatedId].segmentIds, RESTAURANT_BAR);
    const c = ec.corridorRevenueChangePct(net.corridors[controlId].segmentIds, RESTAURANT_BAR);
    out[l] = { treated: t, control: c, gap: t !== null && c !== null ? t - c : null };
  }
  const nT = businessesOn(net, biz, net.corridors[treatedId].segmentIds).filter((b) => RESTAURANT_BAR.includes(b.group)).length;
  const nC = businessesOn(net, biz, net.corridors[controlId].segmentIds).filter((b) => RESTAURANT_BAR.includes(b.group)).length;
  return { byLevel: out, foodBusinesses: { treated: nT, control: nC }, metrics: res.metrics };
}
