import { useEffect, useRef, useState } from "react";
import type { Business, NetworkPayload, SegMetric, Summary } from "./api";

/** Number that counts up/down smoothly to its target. */
function useCount(target: number | null | undefined, ms = 900): number | null {
  const [v, setV] = useState<number | null>(target ?? null);
  const from = useRef(target ?? 0);
  useEffect(() => {
    if (target === null || target === undefined) { setV(null); return; }
    const start = performance.now(), a = from.current, b = target;
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - start) / ms), e = 1 - (1 - k) ** 3;
      const x = a + (b - a) * e; setV(x); from.current = x;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const f0 = (x: number | null) => (x === null ? "—" : Math.round(x).toLocaleString());
const f1 = (x: number | null) => (x === null ? "—" : x.toFixed(1));
const sgn = (x: number | null, d = 1) => (x === null ? "—" : `${x > 0 ? "+" : ""}${x.toFixed(d)}`);

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <svg className="spark" width="100%" height="22" />;
  const lo = Math.min(...values), hi = Math.max(...values), w = 120, h = 22;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 2 - ((v - lo) / (hi - lo || 1)) * (h - 4)}`).join(" ");
  return <svg className="spark" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}

function Stat({ label, value, fmt, unit, range, was, hero, cls }: { label: string; value: number | null | undefined; fmt: (x: number | null) => string; unit?: string; range?: [number, number] | null; was?: string | null; hero?: boolean; cls?: string }) {
  const v = useCount(value);
  return (
    <div className="stat">
      <div className="lbl">{label}</div>
      <div className={`big ${hero ? "hero" : ""} ${cls ?? ""}`}>{fmt(v)}<span className="unit">{unit}</span></div>
      {range && <div className="rng">range {fmt(range[0])} – {fmt(range[1])}</div>}
      {was !== undefined && was !== null && <div className="was">Before your changes: <b>{was}</b></div>}
    </div>
  );
}

export function ConnectionPanel({ s, history, connectionsLive, active }: { s: Summary | null; history: number[]; connectionsLive: number; active: boolean }) {
  const verdict = active ? s?.verdict ?? "NONE" : "NONE";
  return (
    <div className="glass panel">
      <h3><span className="label">Connection</span><span className={`verdict ${verdict}`}>{verdict === "NONE" ? "NO CHANGE" : verdict.replace("_", " ")}</span></h3>
      <div className="stat-row">
        <div style={{ gridColumn: "1 / -1" }}>
          <Stat hero label="Conversations per hour" value={s?.conversationsPerHour} fmt={f0} range={s ? [s.conversationsLo, s.conversationsHi] : null} was={s ? f0(s.beforeConversationsPerHour) : null} />
          <Spark values={history} color="#ff5fa2" />
        </div>
        <Stat label="Time people linger" value={s?.lingerMinutes} fmt={f1} unit="min" was={s ? f1(s.beforeLingerMinutes) : null} />
        <Stat label="New connections / day" value={s?.newConnectionsPerDay} fmt={f0} range={s ? [s.newConnectionsLo, s.newConnectionsHi] : null} was={s ? f0(s.beforeNewConnectionsPerDay) : null} />
      </div>
      <div className="list">
        <div className="li"><span>People on the block at any moment</span><span className="mono">{s ? f0(s.peoplePresent) : "—"}</span></div>
        <div className="li"><span>Conversations seen on the map</span><span className="mono">{connectionsLive}</span></div>
      </div>
      <div className="note"><span className="dot" />Model output, not validated. No ground truth exists for interaction.</div>
    </div>
  );
}

export function EconomyPanel({ s, biz, businesses }: { s: Summary | null; biz: Map<string, number>; businesses: Business[] }) {
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const ranked = [...biz.entries()].filter(([id]) => byId.has(id)).sort((a, b) => b[1] - a[1]);
  // Only changes beyond +/-2% count as winning or losing; smaller shifts are within model noise.
  const winners = ranked.filter(([, v]) => v > 2).slice(0, 3), losers = ranked.filter(([, v]) => v < -2).slice(-2).reverse();
  return (
    <div className="glass panel">
      <h3><span className="label">Economy</span><span className="dim mono" style={{ fontSize: 10.5 }}>{ranked.length} businesses affected</span></h3>
      <div className="stat-row">
        <Stat label="Revenue change, affected businesses" value={s?.revenueChangePct} fmt={(x) => sgn(x)} unit="%" range={s ? [s.revenueLo, s.revenueHi] : null} was={s ? "0%" : null}
          cls={s && s.revenueChangePct < 0 ? "neg" : s && s.revenueChangePct > 0 ? "pos" : ""} />
        <Stat label="Winners / losers (>2%)" value={ranked.filter(([, v]) => v > 2).length} fmt={(x) => `${f0(x)} / ${ranked.filter(([, v]) => v < -2).length}`} />
      </div>
      {(winners.length > 0 || losers.length > 0) && (
        <div className="list">
          {winners.map(([id, v]) => <div className="li" key={id}><span>{byId.get(id)!.name}</span><span className="mono pos">{sgn(v)}%</span></div>)}
          {losers.map(([id, v]) => <div className="li" key={id}><span>{byId.get(id)!.name}</span><span className="mono neg">{sgn(v)}%</span></div>)}
        </div>
      )}
    </div>
  );
}

export function TrafficPanel({ s, seg, network }: { s: Summary | null; seg: Map<string, SegMetric>; network: NetworkPayload | null }) {
  const names = new Map(network?.segments.map((x) => [x.id, x.name]) ?? []);
  const byStreet = new Map<string, number>();
  for (const m of seg.values()) {
    if (m.loadPct <= 10 || m.afterCar - m.baseCar < 15) continue;
    const n = names.get(m.segmentId) ?? "street";
    byStreet.set(n, Math.max(byStreet.get(n) ?? 0, m.loadPct));
  }
  const overflow = [...byStreet.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  return (
    <div className="glass panel">
      <h3><span className="label">Traffic</span><span className="dim mono" style={{ fontSize: 10.5 }}>{s ? `${s.elapsedMs} ms` : ""}</span></h3>
      <div className="stat-row">
        <Stat label="Added vehicle-hours / day" value={s?.addedVehicleHours} fmt={f1} range={s ? [s.vehicleHoursLo, s.vehicleHoursHi] : null} was={s ? "0" : null} />
        <Stat label="Cars rerouted / peak hour" value={s?.reroutedVehPerHour} fmt={f0} was={s ? "0" : null} />
      </div>
      {overflow.length > 0 && <div className="list">{overflow.map(([n, v]) => <div className="li" key={n}><span>{n}</span><span className="mono" style={{ color: "#ff9a3c" }}>+{Math.round(v)}% load</span></div>)}</div>}
    </div>
  );
}
