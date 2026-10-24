// B. Economy (pedestrian flows, business capture, revenue change) and A. Interaction.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Business } from "../../contracts/index.ts";
import { ASSETS, type Network, haversineM } from "./network.ts";
import { P, type Level, pedUpliftBase } from "./params.ts";
import { normStreet, type TrafficResult } from "./traffic.ts";

export type Group = "restaurant" | "cafe" | "bar" | "bakery" | "food_other" | "retail" | "grocery" | "service" | "other";
export const FOOD: Group[] = ["restaurant", "cafe", "bar", "bakery", "food_other"];
/** The DOT ground truth is taxable sales of restaurants and bars. */
export const RESTAURANT_BAR: Group[] = ["restaurant", "cafe", "bar", "bakery", "food_other"];

/** Map a Google Maps category string to a model group. */
export function groupOf(category: string): Group {
  const c = category.toLowerCase();
  if (/\bbar\b|pub|tavern|brewery|lounge|wine|cocktail|beer|night ?club|taproom/.test(c)) return "bar";
  if (/coffee|caf[eé]|tea house|bubble tea|espresso/.test(c)) return "cafe";
  if (/bakery|pastry|donut|dessert|ice cream|gelato|patisserie|cake|açaí|acai|juice|frozen yogurt/.test(c)) return "bakery";
  if (/restaurant|pizza|diner|bistro|grill|steak|sushi|taco|burger|sandwich|deli|noodle|ramen|bbq|barbecue|kitchen|eatery|food court|brunch|creperie|gastropub/.test(c)) return "restaurant";
  if (/takeout|meal|catering|food|chicken|wings|bagel|falafel|gyro|hot dog/.test(c)) return "food_other";
  if (/grocery|supermarket|market|convenience|liquor|butcher|fish|produce|bodega|pharmacy|drugstore/.test(c)) return "grocery";
  if (/salon|barber|spa|nail|beauty|laundr|dry clean|bank|atm|insurance|real estate|dentist|doctor|clinic|medical|optic|tax|lawyer|attorney|tailor|repair|gym|fitness|yoga|school|tutor|agency|office|church|post office|car wash|auto|parking|gas station|veterinar|massage|tattoo|cleaners/.test(c)) return "service";
  if (/store|shop|boutique|clothing|shoe|gift|book|florist|jewel|furniture|hardware|toy|electronics|thrift|vintage|record|mattress|outlet|cosmetics|music/.test(c)) return "retail";
  return "other";
}

export type Biz = Business & { group: Group };

export function loadBusinesses(area: string): Biz[] {
  const f = join(ASSETS, area, "businesses.json");
  if (!existsSync(f)) return [];
  const raw = JSON.parse(readFileSync(f, "utf8"));
  const list: Business[] = Array.isArray(raw) ? raw : raw.businesses;
  return list.map((b) => ({ ...b, carDependence: b.carDependence ?? 0, group: groupOf(b.category) }));
}

export function loadContext(area: string): any {
  const f = join(ASSETS, area, "context.json");
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

/** Census residents per km^2 inside the area circle; null if Census data missing. */
export function densityPerKm2(area: string, radiusM = 1500): number | null {
  const ctx = loadContext(area);
  const pop = ctx?.census?.populationInCircle;
  return typeof pop === "number" ? pop / (Math.PI * (radiusM / 1000) ** 2) : null;
}
const REF_DENSITY = 15000;

/**
 * Measured weekday-evening pedestrians/hour (NYC Bi-Annual Pedestrian Counts, 2015-2019 mean, both
 * sidewalks) applied to segments of the same street within 250 m of a count location.
 */
const pedCountCache = new Map<string, Map<string, { pph: number; loc: string }>>();
export function pedCountOverrides(net: Network): Map<string, { pph: number; loc: string }> {
  const hit = pedCountCache.get(net.area);
  if (hit) return hit;
  const out = new Map<string, { pph: number; loc: string }>();
  const ctx = loadContext(net.area);
  const seen = new Set<string>();
  for (const c of Object.values<any>(ctx?.counts ?? {})) {
    for (const pc of c.pedestrianCounts ?? []) {
      if (seen.has(pc.loc) || !pc.coords || !pc.hourlyPreCovid?.pm) continue;
      seen.add(pc.loc);
      const street = normStreet(pc.street ?? "");
      for (const s of net.segments) {
        if (normStreet(s.name) !== street) continue;
        if (s.coords.some((pt) => haversineM(pt, pc.coords) < 250)) out.set(s.id, { pph: pc.hourlyPreCovid.pm, loc: `NYC ped count #${pc.loc} ${pc.street} (${pc.from}–${pc.to})` });
      }
    }
  }
  pedCountCache.set(net.area, out);
  return out;
} // residents/km^2 for which baseVolumeByClassPph applies (dense NYC neighbourhood)

export type ScenarioInput = {
  closedSegmentIds: string[];
  addedSeating: boolean;
  programming: "none" | "light" | "heavy";
  /** Optional planner edits (tool dock): extra residents/workers on a segment, parks, use changes. */
  segmentMods?: Record<string, { extraResidents?: number; extraWorkers?: number; park?: boolean }>;
  businessMods?: Record<string, { category: string }>;
};

export type EconomyResult = {
  segmentPed: Record<string, { base: number; after: number }>;
  pedAt: (segmentId: string) => number;
  perBusiness: { businessId: string; changePct: number; baseVisitsPerHour: number }[];
  totalRevenueChangePct: number;
  corridorRevenueChangePct: (segmentIds: string[], groups?: Group[]) => number | null;
  closureIntensity: number;
  pedEstimated: boolean;
};

const classVal = <T,>(t: Record<string, T>, hw: string): T => t[hw] ?? t[hw?.replace("_link", "")] ?? t.default;

/**
 * Cross streets touching the closed segments. The continuation of the same street keeps its cars and
 * gets no seating, so the crowd stops at the barrier; side streets get some spillover.
 */
function neighbours(net: Network, ids: Set<string>): Set<string> {
  const nodes = new Set<string>();
  const names = new Set<string>();
  for (const id of ids) { for (const n of id.split("_")) nodes.add(n); names.add(net.segById.get(id)?.name ?? ""); }
  const out = new Set<string>();
  for (const s of net.segments) if (!ids.has(s.id) && !names.has(s.name) && s.id.split("_").some((n) => nodes.has(n))) out.add(s.id);
  return out;
}

/**
 * Businesses fronting a set of segments: those assigned to one of the segments, plus those within
 * 25 m whose assigned segment is not part of any corridor (corner shops on cross streets). Exclusive,
 * so a treated corridor and an adjacent control never share a business.
 */
export function businessesOn(net: Network, biz: Biz[], segmentIds: string[]): Biz[] {
  const ids = new Set(segmentIds);
  const inAnyCorridor = new Set(Object.values(net.corridors).flatMap((c) => c.segmentIds));
  const pts = segmentIds.flatMap((s) => net.segById.get(s)?.coords ?? []);
  return biz.filter((b) => ids.has(b.segmentId) || (!inAnyCorridor.has(b.segmentId) && pts.some((p) => haversineM(p, [b.lng, b.lat]) < 25)));
}

export function runEconomy(net: Network, biz0: Biz[], s: ScenarioInput, traffic: TrafficResult, level: Level): EconomyResult {
  const biz = biz0.map((b) => (s.businessMods?.[b.id] ? { ...b, category: s.businessMods[b.id].category, group: groupOf(s.businessMods[b.id].category) } : b));
  const closed = new Set(s.closedSegmentIds);
  const adj = neighbours(net, closed);
  const density = densityPerKm2(net.area);
  const densityF = density ? Math.sqrt(density / REF_DENSITY) : 1;

  // Baseline pedestrians per hour on each segment.
  const bizBySeg = new Map<string, Biz[]>();
  for (const b of biz) (bizBySeg.get(b.segmentId) ?? bizBySeg.set(b.segmentId, []).get(b.segmentId)!).push(b);
  const pedBase = new Map<string, number>();
  for (const seg of net.segments) {
    const n = bizBySeg.get(seg.id)?.length ?? 0;
    const mod = s.segmentMods?.[seg.id];
    // Each added resident/worker makes ~3 walk trips a day, ~10% in the busy hour (assumption).
    const added = ((mod?.extraResidents ?? 0) + (mod?.extraWorkers ?? 0)) * 3 * 0.1 + (mod?.park ? 60 : 0);
    const measured = pedCountOverrides(net).get(seg.id)?.pph;
    pedBase.set(seg.id, measured !== undefined ? measured + added : seg.baselinePedVolume ?? classVal<number>(P.pedestrians.baseVolumeByClassPph.value, seg.highway) * densityF + n * P.pedestrians.perBusinessPph[level] + added);
  }

  // Closure intensity: how much the street changes. Removing a busy car street transforms it;
  // closing an alley that had few cars changes little (seating still helps).
  const carBefore = s.closedSegmentIds.map((id) => traffic.segmentLoads[id]?.base ?? 0);
  const carVol = carBefore.length ? carBefore.reduce((a, b) => a + b, 0) / carBefore.length : 0;
  const closureIntensity = closed.size ? 0.4 + 0.6 * Math.min(1.5, carVol / 300) : 0;
  const closedBiz = businessesOn(net, biz, s.closedSegmentIds);
  const nFood = closedBiz.filter((b) => FOOD.includes(b.group)).length;
  const agglomeration = nFood / (nFood + 6); // food draws people (Whyte); saturates
  const seatingF = s.addedSeating ? P.pedestrians.seatingMultiplier[level] : 1;
  const progF = P.pedestrians.programmingMultiplier.value[s.programming];
  const uplift = pedUpliftBase() * P.pedestrians.closureUplift[level] * closureIntensity * (0.5 + agglomeration) * seatingF * progF;

  const pedAfter = new Map(pedBase);
  for (const id of closed) pedAfter.set(id, pedBase.get(id)! * (1 + uplift));
  for (const id of adj) pedAfter.set(id, pedBase.get(id)! * (1 + 0.25 * uplift));

  // Business visits: passers-by x capture rate x attractiveness.
  const reviews = biz.map((b) => b.reviewCount ?? 0).sort((a, b) => a - b);
  const medReviews = reviews[Math.floor(reviews.length / 2)] ?? 0;
  const attract = (b: Biz) => Math.min(2, Math.max(0.5, ((b.reviewCount ?? 0) + 20) / (medReviews + 20)));
  const closedPts = s.closedSegmentIds.flatMap((id) => net.segById.get(id)?.coords ?? []);
  const onClosed = new Set(closedBiz.map((b) => b.id));
  const overflowPct = new Map(traffic.overflowSegments.map((o) => [o.segmentId, o.loadIncreasePct]));

  const before = new Map<string, number>(), after = new Map<string, number>();
  let addedOnClosed = 0;
  for (const b of biz) {
    const cap = P.economy.captureRate.value[b.group] * attract(b);
    const v0 = pedBase.get(b.segmentId)! * cap;
    let v1 = (onClosed.has(b.id) ? Math.max(pedAfter.get(b.segmentId)!, pedBase.get(b.segmentId)! * (1 + uplift)) : pedAfter.get(b.segmentId)!) * cap;
    if (onClosed.has(b.id) && FOOD.includes(b.group) && s.addedSeating) v1 *= 1 + P.economy.outdoorSeatingCapacityGain[level];
    // Car-arriving customers: lose some where frontage closes or the street now jams.
    const difficulty = onClosed.has(b.id) ? 1 : Math.min(0.5, (overflowPct.get(b.segmentId) ?? 0) / 200);
    const carShare = P.economy.carCustomerShare[level] * (0.5 + b.carDependence);
    v1 -= v0 * carShare * Math.min(1, P.economy.carLossElasticity[level] * difficulty);
    before.set(b.id, v0); after.set(b.id, v1);
    if (onClosed.has(b.id)) addedOnClosed += v1 - v0;
  }
  // Diversion: part of the new visits come from nearby corridors (within 800 m), pro rata.
  if (addedOnClosed > 0 && closedPts.length) {
    const nearby = biz.filter((b) => !onClosed.has(b.id) && closedPts.some((p) => haversineM(p, [b.lng, b.lat]) < 800));
    const pool = nearby.reduce((a, b) => a + before.get(b.id)!, 0);
    const diverted = addedOnClosed * P.economy.diversionFromNearby[level];
    for (const b of nearby) after.set(b.id, after.get(b.id)! - (diverted * before.get(b.id)!) / Math.max(pool, 1e-9));
  }

  const perBusiness = biz.map((b) => ({
    businessId: b.id, baseVisitsPerHour: Math.round(before.get(b.id)! * 10) / 10,
    changePct: before.get(b.id)! > 0 ? Math.round(((after.get(b.id)! / before.get(b.id)!) - 1) * 1000) / 10 : 0,
  }));
  const sum = (m: Map<string, number>, ids: Iterable<string>) => { let t = 0; for (const i of ids) t += m.get(i) ?? 0; return t; };
  const affected = biz.filter((b) => Math.abs(after.get(b.id)! - before.get(b.id)!) > 1e-9).map((b) => b.id);
  const tb = sum(before, affected), ta = sum(after, affected);
  const segmentPed: EconomyResult["segmentPed"] = {};
  for (const [id, v] of pedBase) { const a = pedAfter.get(id)!; if (a !== v || closed.has(id)) segmentPed[id] = { base: Math.round(v), after: Math.round(a) }; }

  return {
    segmentPed, perBusiness, closureIntensity, pedAt: (id) => pedAfter.get(id) ?? 0,
    totalRevenueChangePct: tb > 0 ? Math.round((ta / tb - 1) * 1000) / 10 : 0,
    corridorRevenueChangePct: (segmentIds, groups) => {
      const ids = businessesOn(net, biz, segmentIds).filter((b) => !groups || groups.includes(b.group)).map((b) => b.id);
      const b0 = sum(before, ids);
      return b0 > 0 ? ((sum(after, ids) / b0) - 1) * 100 : null;
    },
    pedEstimated: !s.closedSegmentIds.some((id) => pedCountOverrides(net).has(id)),
  };
}

export type InteractionResult = { lingerIndex: number; encountersPerHour: number; dwellMinutes: number; peoplePresent: number; newConnectionsPerDay: number };

/** A. Interaction on the closed segments (or, if none, on `focus`). Model output, not validated. */
export function runInteraction(net: Network, biz: Biz[], s: ScenarioInput, econ: EconomyResult, level: Level, focus?: string[]): InteractionResult {
  const ids = s.closedSegmentIds.length ? s.closedSegmentIds : focus ?? [];
  if (!ids.length) return { lingerIndex: 0, encountersPerHour: 0, dwellMinutes: 0, peoplePresent: 0, newConnectionsPerDay: 0 };
  const lengthM = ids.reduce((a, id) => a + (net.segById.get(id)?.lengthM ?? 0), 0);
  const peds = ids.reduce((a, id) => a + econ.pedAt(id), 0) / ids.length;
  const on = businessesOn(net, biz, ids);
  const foodShare = on.length ? on.filter((b) => FOOD.includes(b.group)).length / on.length : 0;
  const pedestrianized = s.closedSegmentIds.length > 0;
  const parks = ids.filter((id) => s.segmentMods?.[id]?.park).length / ids.length;
  const dwell = P.interaction.dwellMinutesBase.value * (1 + foodShare * P.interaction.dwellFoodMultiplier.value)
    * (pedestrianized && s.addedSeating ? P.pedestrians.seatingMultiplier[level] : 1)
    * (pedestrianized ? P.pedestrians.programmingMultiplier.value[s.programming] : 1) * (1 + parks);
  const present = (peds * dwell) / 60; // Little's law: arrivals/min x minutes
  const lingerIndex = present / Math.max(lengthM / 100, 0.5);
  const crowd = lingerIndex / (lingerIndex + 10);
  const encountersPerHour = P.interaction.encounterRate.value * 60 * present * crowd * (pedestrianized ? 1 : 0.4);
  return {
    lingerIndex: Math.round(lingerIndex * 10) / 10, encountersPerHour: Math.round(encountersPerHour),
    dwellMinutes: Math.round(dwell * 10) / 10, peoplePresent: Math.round(present),
    newConnectionsPerDay: Math.round(encountersPerHour * P.traffic.closureHoursPerDay.value * P.interaction.connectionShare.value),
  };
}
