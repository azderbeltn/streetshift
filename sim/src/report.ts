// Merchant Report: a one-page forecast for one business under the current scenario. Numbers come
// from the model at low/mid/high; Claude (ANTHROPIC_MODEL) writes the plain-language summary when
// available (src/claude.ts, cached to disk), otherwise a template is used.
import { loadNetwork } from "./network.ts";
import { loadBusinesses, runEconomy, type ScenarioInput } from "./economy.ts";
import { runTraffic } from "./traffic.ts";
import { LEVELS } from "./params.ts";
import { claude } from "./claude.ts";

export async function merchantReport(b: ScenarioInput & { area: string; businessId: string }) {
  const net = loadNetwork(b.area);
  const biz = loadBusinesses(b.area);
  const me = biz.find((x) => x.id === b.businessId);
  if (!me) throw new Error("unknown business");
  const s: ScenarioInput = { closedSegmentIds: b.closedSegmentIds ?? [], addedSeating: !!b.addedSeating, programming: b.programming ?? "none", segmentMods: b.segmentMods, businessMods: b.businessMods };
  const by = Object.fromEntries(LEVELS.map((l) => {
    const e = runEconomy(net, biz, s, runTraffic(net, s.closedSegmentIds, l), l);
    const p = e.perBusiness.find((x) => x.businessId === me.id)!;
    return [l, { changePct: p.changePct, baseVisitsPerHour: p.baseVisitsPerHour, pedBase: e.segmentPed[me.segmentId]?.base, pedAfter: e.segmentPed[me.segmentId]?.after }];
  }));
  const seg = net.segById.get(me.segmentId);
  const onClosed = s.closedSegmentIds.includes(me.segmentId);
  const facts = {
    business: { name: me.name, category: me.category, group: me.group, rating: me.rating, reviews: me.reviewCount, carDependence: me.carDependence, street: seg?.name },
    scenario: { closedBlocks: s.closedSegmentIds.length, fronting: onClosed ? "this business fronts a pedestrianized block" : "this business is not on a closed block", addedSeating: s.addedSeating, programming: s.programming },
    forecast: { revenueChangePct: { low: by.low.changePct, mid: by.mid.changePct, high: by.high.changePct }, visitsPerHourBefore: by.mid.baseVisitsPerHour,
      pedestriansPerHourOnBlock: { before: by.mid.pedBase ?? null, after: by.mid.pedAfter ?? null } },
  };
  const range = [Math.min(by.low.changePct, by.high.changePct, by.mid.changePct), Math.max(by.low.changePct, by.high.changePct, by.mid.changePct)];
  let summary: string | null = null, author = "template";
  try {
    summary = await claude(
      "You write one-page merchant forecasts for a city planning simulator. Be plain, specific and honest. Use only the numbers given; always state the range; say what drives the result; name one thing the owner could do. Never invent facts about the owner or the business beyond the data. 120-170 words. No headings.",
      JSON.stringify(facts), { maxTokens: 1200 });
    if (summary) author = process.env.ANTHROPIC_MODEL ?? "claude";
  } catch { summary = null; }
  if (!summary) {
    summary = `${me.name} (${me.category}) on ${seg?.name ?? "its block"}: forecast revenue change ${by.mid.changePct >= 0 ? "+" : ""}${by.mid.changePct}% (range ${range[0]}% to ${range[1]}%). ` +
      (onClosed ? "It fronts the pedestrianized block, so it gains passers-by" : "It is near, not on, the closed block") +
      `; ${me.carDependence > 0.3 ? "a car-dependent customer base pulls the number down" : "few customers arrive by car, so lost parking matters little"}.`;
  }
  const markdown = [`MERCHANT REPORT · ${me.name}`, `${me.category} · ${seg?.name ?? ""}${me.rating ? ` · ★ ${me.rating} (${me.reviewCount} reviews)` : ""}`, "",
    `Forecast revenue change: ${by.mid.changePct >= 0 ? "+" : ""}${by.mid.changePct}%   (range ${range[0]}% to ${range[1]}%)`,
    `Pedestrians on this block: ${Math.round(by.mid.pedBase ?? 0)} → ${Math.round(by.mid.pedAfter ?? by.mid.pedBase ?? 0)} per hour`,
    `Car-dependence (from reviews mentioning parking/driving): ${me.carDependence.toFixed(2)}`, "", summary, "",
    `Written by ${author}. Model output with stated uncertainty; not a guarantee. StreetShift does not represent the views of this business's owner.`].join("\n");
  return { facts, markdown, author };
}
