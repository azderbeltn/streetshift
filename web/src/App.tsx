import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import MapView, { type FloorBlock, type Pick } from "./MapView";
import { ConnectionPanel, EconomyPanel, TrafficPanel } from "./Panels";
import { api, type AreaSummary, type Business, type NetworkPayload, type SearchHit, type TripsPayload } from "./api";
import { actions, connect, myself, scenarioInput, useStore } from "./store";
import Backtest from "./Backtest";
import Side from "./Side";
import Assumptions from "./Assumptions";
import Chain from "./Chain";
import Hearing from "./Hearing";

type Tool = "pedestrianize" | "floors" | "land_use" | "park" | "inspect";
const TOOLS: { id: Tool; label: string; key: string; icon: JSX.Element }[] = [
  { id: "pedestrianize", label: "Pedestrianize", key: "1", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="3" r="1.6" /><path d="M8 5v5M5 7.5h6M8 10l-2.5 4.5M8 10l2.5 4.5" /></svg> },
  { id: "floors", label: "Add floors", key: "2", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="5" width="8" height="10" /><path d="M6 2h4M8 2v3M6 8h1M9 8h1M6 11h1M9 11h1" /></svg> },
  { id: "land_use", label: "Change use", key: "3", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6l2-4h8l2 4M2 6v8h12V6M2 6h12M6 14v-4h4v4" /></svg> },
  { id: "park", label: "Add park", key: "4", icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 14V8M8 2c-3 2-4 4-2 6h4c2-2 1-4-2-6zM3 14h10" /></svg> },
];
const USES = ["Café", "Restaurant", "Bar", "Clothing store", "Grocery store", "Hair salon", "Bank"];

export default function App() {
  const st = useStore((s) => s);
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [network, setNetwork] = useState<NetworkPayload | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [trips, setTrips] = useState<TripsPayload | null>(null);
  const [beforeTrips, setBeforeTrips] = useState<TripsPayload | null>(null);
  const [tool, setTool] = useState<Tool>("pedestrianize");
  const [pick, setPick] = useState<Pick | null>(null);
  const [hover, setHover] = useState<{ kind: "segment" | "business"; id: string; x: number; y: number } | null>(null);
  const [feed, setFeed] = useState<{ id: number; text: string; at: string }[]>([]);
  const [hour, setHour] = useState(18);
  const [showBefore, setShowBefore] = useState(false);
  const [floors, setFloors] = useState<FloorBlock[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [liveConnections, setLiveConnections] = useState(0);
  const [mode, setMode] = useState<"plan" | "backtest">("plan");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [showAssumptions, setShowAssumptionsRaw] = useState(false);
  const [showHearing, setShowHearingRaw] = useState(false);
  const setShowAssumptions = (f: (v: boolean) => boolean) => setShowAssumptionsRaw((v) => { const n = f(v); if (n) setShowHearingRaw(false); return n; });
  const setShowHearing = (f: (v: boolean) => boolean) => setShowHearingRaw((v) => { const n = f(v); if (n) setShowAssumptionsRaw(false); return n; });
  const lastPresence = useRef(0);

  useEffect(() => { connect(); api.areas().then(setAreas).catch((e) => setToast(`Sim API unreachable: ${e.message}`)); }, []);
  useEffect(() => {
    setNetwork(null); setBusinesses([]); setTrips(null); setBeforeTrips(null); setFloors([]); setHistory([]);
    api.network(st.area).then(setNetwork); api.businesses(st.area).then(setBusinesses);
    api.trips({ area: st.area, closedSegmentIds: [], addedSeating: false, programming: "none" }).then((t) => { setBeforeTrips(t); setTrips((x) => x ?? t); });
  }, [st.area]);
  // Re-fetch animated trips when the set of closed streets changes.
  const closedKey = [...st.closed].sort().join(",") + "|" + [...st.edits.values()].filter((e) => e.kind === "param" || e.kind === "park" || e.kind === "floors").map((e) => `${e.kind}:${e.targetId}=${e.value}`).sort().join(",");
  useEffect(() => {
    if (!st.closed.size && !st.edits.size) { if (beforeTrips) setTrips(beforeTrips); return; }
    const h = setTimeout(() => api.trips(scenarioInput()).then(setTrips), 150);
    return () => clearTimeout(h);
  }, [closedKey, st.area, beforeTrips]);
  useEffect(() => { if (st.summary) setHistory((h) => [...h.slice(-30), st.summary!.conversationsPerHour]); }, [st.summary?.conversationsPerHour]);
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 3500); return () => clearTimeout(h); }, [toast]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName === "INPUT") return; const t = TOOLS.find((x) => x.key === e.key); if (t) setTool(t.id); if (e.key === "Escape") setPick(null); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Time-of-day: share of the crowd out, from the area's Google popular-times (mean over businesses).
  const pedShare = useMemo(() => {
    const curves = businesses.map((b) => b.popularTimes).filter(Boolean) as number[][][];
    if (!curves.length) return 1;
    const day = 6; // Saturday (popularTimes day 0 = Sunday)
    const at = (h: number) => curves.reduce((a, c) => a + (c[day]?.[h] ?? 0), 0) / curves.length;
    const peak = Math.max(...Array.from({ length: 24 }, (_, h) => at(h))) || 1;
    return Math.max(0.12, at(hour) / peak);
  }, [businesses, hour]);

  const segById = useMemo(() => new Map(network?.segments.map((s) => [s.id, s]) ?? []), [network]);
  const bizById = useMemo(() => new Map(businesses.map((b) => [b.id, b])), [businesses]);
  const corridor = network?.corridors[st.corridorId];
  const active = st.closed.size > 0 || st.edits.size > 0;

  const onPick = (p: Pick) => {
    if (tool === "floors" && p.kind === "building") {
      const g: any = p.feature.geometry;
      const poly = g.type === "Polygon" ? g.coordinates : g.type === "MultiPolygon" ? g.coordinates[0] : null;
      const h0 = Number(p.feature.properties?.render_height ?? 10);
      // Nearest street segment gets the added residents (3 floors x 6 units x 2.2 people).
      let best = "", bd = 1e9;
      for (const s of network?.segments ?? []) for (const c of s.coords) { const d = (c[0] - p.lngLat[0]) ** 2 + (c[1] - p.lngLat[1]) ** 2; if (d < bd) { bd = d; best = s.id; } }
      if (poly && best) {
        const prev = Number([...st.edits.values()].find((e) => e.kind === "floors" && e.targetId === best)?.value ?? 0);
        actions.setEdit("floors", best, String(prev + 40));
        setFloors((f) => [...f, { key: `${p.lngLat}`, polygon: poly, height: h0 + 9 }]);
        setToast(`+3 floors · ~40 new residents near ${segById.get(best)?.name ?? "this block"}`);
      }
      return;
    }
    setPick(p);
  };
  const onPointer = (ll: [number, number]) => {
    const now = performance.now();
    if (now - lastPresence.current > 250) { lastPresence.current = now; actions.presence(ll[0], ll[1], tool); }
  };
  const doSearch = async (q: string) => {
    if (!q.trim()) { setHits(null); return; }
    try { setHits((await api.search(q, st.area)).hits); } catch (e: any) { setHits([]); setToast(`Search: ${e.message}`); }
  };
  const corridorIds = corridor?.segmentIds ?? [];
  const corridorClosed = corridorIds.length > 0 && corridorIds.every((id) => st.closed.has(id));

  const forward = areas.flatMap((a) => a.corridors.filter((c) => c.role === "forward").map((c) => ({ a, c })));
  const treated = areas.flatMap((a) => a.corridors.filter((c) => c.role === "treated").map((c) => ({ a, c })));
  const splitOf = (id: string) => (["ditmars", "park_slope_5th"].includes(id) ? "cal" : "hold");

  return (
    <>
      <MapView network={network} businesses={businesses} closed={st.closed} seg={st.seg} biz={st.biz} trips={showBefore ? beforeTrips : trips}
        pedShare={pedShare} showBefore={showBefore} floors={floors} presence={st.presence} onPick={onPick} onHover={setHover}
        onFeed={(text) => setFeed((f) => [...f.slice(-5), { id: Math.random(), text, at: `${String(hour).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}` }])}
        onPointer={onPointer} onConnections={setLiveConnections} preferBuildings={tool === "floors"} />

      <div className="topbar glass">
        <div className="brand"><b>STREETSHIFT</b><span>Predict what happens when a street goes car-free — and see how wrong we were on five real ones.</span></div>
        <div className="spacer" />
        <span className="pill"><span className={`status-dot ${st.mode === "live" ? "on" : ""}`} />{st.mode === "live" ? `SpacetimeDB live · ${st.presence.length || 1} planner${st.presence.length === 1 ? "" : "s"}` : st.mode === "local" ? "Local mode" : "Connecting…"}</span>
        {st.computing && <span className="pill">Recomputing…</span>}
        <span className="pill" style={{ borderColor: myself.color, color: myself.color }}>{myself.name}</span>
        <button className={`pill ${mode === "plan" ? "active" : ""}`} onClick={() => setMode("plan")}>Plan</button>
        <button className={`pill ${mode === "backtest" ? "active" : ""}`} onClick={() => setMode("backtest")}>Backtest challenge</button>
      </div>

      <div className="left">
        <div className="glass">
          <div className="search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#8a95a8" strokeWidth="1.6"><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" /></svg>
            <input placeholder="Search businesses & reviews (Elastic)…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch(query)} />
          </div>
          {hits && (
            <div className="search-results">
              {hits.length === 0 && <div className="muted" style={{ padding: 8 }}>No matches.</div>}
              {hits.map((h, i) => (
                <div key={i} className="search-hit" onClick={() => { const b = h.businessId ? bizById.get(h.businessId) : undefined; if (b) setPick({ kind: "business", id: b.id, x: window.innerWidth / 2, y: window.innerHeight / 2 }); }}>
                  <div><b>{h.name}</b> <span className="dim">{h.category}</span></div>
                  {h.snippet && <div className="snip">“{h.snippet}”</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass corridors">
          <div className="label" style={{ margin: "2px 4px 8px" }}>Forward-looking</div>
          {forward.map(({ a, c }) => (
            <div key={c.id} className={`corridor ${st.corridorId === c.id ? "active" : ""}`} onClick={() => actions.selectCorridor(a.area, c.id)}>
              <div><div className="name">{c.name}</div><div className="sub">San Francisco · {a.businesses} businesses · {a.populationInCircle?.toLocaleString() ?? "—"} residents</div></div>
              <span className="tag fwd">live</span>
            </div>
          ))}
          <div className="label" style={{ margin: "12px 4px 8px" }}>NYC Open Streets, 2020 (backtest)</div>
          {treated.map(({ a, c }) => (
            <div key={c.id} className={`corridor ${st.corridorId === c.id ? "active" : ""}`} onClick={() => actions.selectCorridor(a.area, c.id)}>
              <div><div className="name">{c.name}</div><div className="sub">{a.area.replace("_", " ")} · {a.businesses} businesses</div></div>
              <span className={`tag ${splitOf(c.id)}`}>{splitOf(c.id) === "cal" ? "calibration" : "holdout"}</span>
            </div>
          ))}
        </div>
        {corridor && (
          <div className="glass panel">
            <div className="label">{corridor.name}</div>
            <div className="muted" style={{ margin: "4px 0 10px", fontSize: 11.5 }}>{corridorIds.length} blocks · {Math.round(corridor.lengthM)} m</div>
            <button className={`btn ${corridorClosed ? "stop" : "go"}`} onClick={() => actions.setClosed(corridorIds, !corridorClosed)}>{corridorClosed ? "Reopen to cars" : "Pedestrianize this corridor"}</button>
            <div className="row"><span>Add seating</span><input type="checkbox" checked={st.addedSeating} onChange={(e) => actions.setOptions(e.target.checked, st.programming)} /></div>
            <div className="row"><span>Programming</span>
              <select value={st.programming} onChange={(e) => actions.setOptions(st.addedSeating, e.target.value as any)}>
                <option value="none">none</option><option value="light">light</option><option value="heavy">heavy</option></select></div>
            {active && <div className="row"><button className="btn small" onClick={() => { actions.clear(); setFloors([]); }}>Reset all changes</button><span className="dim">{st.closed.size} closed · {st.edits.size} edits</span></div>}
          </div>
        )}
      </div>

      <div className="right">
        <ConnectionPanel s={active ? st.summary : null} history={history} connectionsLive={liveConnections} active={active} />
        <EconomyPanel s={active ? st.summary : null} biz={active ? st.biz : new Map()} businesses={businesses} />
        <TrafficPanel s={active ? st.summary : null} seg={active ? st.seg : new Map()} network={network} />
        <Side network={network} businesses={businesses} />
      </div>

      <div className="feed">{[...feed].reverse().map((f) => <div key={f.id} className="feed-item glass"><span className="ic" />{f.text}<span className="t">{f.at}</span></div>)}</div>

      <div className="dock glass">
        {TOOLS.map((t) => <button key={t.id} className={`tool ${tool === t.id ? "active" : ""}`} onClick={() => setTool(t.id)}>{t.icon}{t.label}<span className="k">{t.key}</span></button>)}
        <button className={`tool ${showAssumptions ? "active" : ""}`} onClick={() => setShowAssumptions((v) => !v)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h7M12 4h2M2 8h2M7 8h7M2 12h9M14 12h0" /><circle cx="10.5" cy="4" r="1.5" /><circle cx="5.5" cy="8" r="1.5" /><circle cx="12.5" cy="12" r="1.5" /></svg>Assumptions{[...st.edits.values()].some((e) => e.kind === "param") && <span className="k" style={{ color: "var(--ped)" }}>●</span>}
        </button>
        <button className={`tool ${showHearing ? "active" : ""}`} onClick={() => setShowHearing((v) => !v)}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3h12v8H7l-3 3v-3H2z" /><path d="M5 6h6M5 8.5h4" /></svg>Hearing{st.hearing.length > 0 && <span className="k">{st.hearing.length}</span>}
        </button>
      </div>

      <div className="bottom glass">
        <span className="label">Time</span><span className="mono" style={{ width: 44 }}>{String(hour).padStart(2, "0")}:00</span>
        <input type="range" min={6} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
        <span className="dim mono" style={{ fontSize: 10.5 }}>{trips ? `${Math.round(trips.agents.peds * pedShare)} people · ${trips.agents.cars} cars` : ""}</span>
        <div className="seg-toggle"><button className={!showBefore ? "on" : ""} onClick={() => setShowBefore(false)}>After</button><button className={showBefore ? "on" : ""} onClick={() => setShowBefore(true)}>Before</button></div>
        <div className="legend"><span><i style={{ background: "var(--car)" }} />cars</span><span><i style={{ background: "var(--ped)" }} />people</span><span><i style={{ background: "var(--connect)" }} />conversations</span><span><i style={{ background: "linear-gradient(90deg,#4cc3ff,#ff9628,#ff3c3c)" }} />overflow</span></div>
      </div>

      {hover && !pick && (
        <div className="tip glass" style={{ left: hover.x, top: hover.y }}>
          {hover.kind === "segment" ? (() => { const s = segById.get(hover.id); const m = st.seg.get(hover.id); return <><b>{s?.name}</b><span className="muted">{s?.highway} · {Math.round(s?.lengthM ?? 0)} m</span>{m && <div className="mono">cars {Math.round(m.baseCar)}→{Math.round(m.afterCar)}/h · people {Math.round(m.basePed)}→{Math.round(m.afterPed)}/h</div>}</>; })()
            : (() => { const b = bizById.get(hover.id); const ch = st.biz.get(hover.id); return b ? <><b>{b.name}</b><span className="muted">{b.category}{b.rating ? ` · ★ ${b.rating}` : ""}</span><div className="mono">{ch !== undefined && active ? <span className={ch >= 0 ? "pos" : "neg"}>{ch >= 0 ? "+" : ""}{ch.toFixed(1)}% revenue</span> : "no change"} · car-dependence {(b.carDependence ?? 0).toFixed(2)}</div></> : null; })()}
        </div>
      )}

      {pick && pick.kind === "segment" && (() => {
        const s = segById.get(pick.id)!; const isClosed = st.closed.has(pick.id); const parked = st.edits.has(`park:${pick.id}`);
        return (
          <div className="popover glass" style={{ left: pick.x, top: pick.y }}>
            <button className="close-x" onClick={() => setPick(null)}>×</button>
            <h4>{s.name}</h4><div className="sub">{s.highway} · {Math.round(s.lengthM)} m</div>
            {tool === "park"
              ? <button className={`btn ${parked ? "stop" : "go"}`} onClick={() => { actions.setEdit("park", pick.id, parked ? "" : "1"); setPick(null); }}>{parked ? "Remove park" : "Make it a park"}</button>
              : <button className={`btn ${isClosed ? "stop" : "go"}`} onClick={() => { actions.setClosed([pick.id], !isClosed); setPick(null); }}>{isClosed ? "Reopen to cars" : "Pedestrianize this block"}</button>}
            <div className="row"><span>Add seating</span><input type="checkbox" checked={st.addedSeating} onChange={(e) => actions.setOptions(e.target.checked, st.programming)} /></div>
            <div className="row"><span>Programming</span>
              <select value={st.programming} onChange={(e) => actions.setOptions(st.addedSeating, e.target.value as any)}>
                <option value="none">none</option><option value="light">light</option><option value="heavy">heavy</option></select></div>
          </div>
        );
      })()}

      {pick && pick.kind === "business" && (() => {
        const b = bizById.get(pick.id); if (!b) return null; const ch = st.biz.get(b.id);
        return (
          <div className="popover glass" style={{ left: pick.x, top: pick.y, width: 270 }}>
            <button className="close-x" onClick={() => setPick(null)}>×</button>
            <h4>{b.name}</h4><div className="sub">{b.category}{b.rating ? ` · ★ ${b.rating} (${b.reviewCount})` : ""}</div>
            <div className="row"><span className="muted">Forecast revenue change</span><span className={`mono ${ch && ch < 0 ? "neg" : "pos"}`}>{active && ch !== undefined ? `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%` : "—"}</span></div>
            <div className="row"><span className="muted">Car-dependence (reviews)</span><span className="mono">{b.carDependence.toFixed(2)}</span></div>
            {tool === "land_use" && <div className="row"><span>Change use to</span><select defaultValue="" onChange={(e) => { if (e.target.value) { actions.setEdit("land_use", b.id, e.target.value); setToast(`${b.name} → ${e.target.value}`); setPick(null); } }}><option value="">…</option>{USES.map((u) => <option key={u}>{u}</option>)}</select></div>}
            <div className="row"><button className="btn small" onClick={async () => { setReport("loading"); try { const r = await api.merchantReport(st.area, b.id, scenarioInput()); setReport(r.markdown ?? JSON.stringify(r, null, 2)); } catch (e: any) { setReport(`Report unavailable: ${e.message}`); } }}>Merchant report</button></div>
          </div>
        );
      })()}

      {report && (
        <div className="overlay" onClick={() => setReport(null)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()}>
            <button className="close-x" onClick={() => setReport(null)}>×</button>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{report === "loading" ? "Writing forecast…" : report}</pre>
          </div>
        </div>
      )}

      {showAssumptions && <Assumptions onClose={() => setShowAssumptions(() => false)} />}
      {showHearing && <Hearing onClose={() => setShowHearing(() => false)} />}
      <Chain s={active ? st.summary : null} seg={st.seg} closed={st.closed} network={network} />

      {pick && pick.kind === "person" && (() => {
        const q = pick.person;
        return (
          <div className="popover glass person" style={{ left: pick.x, top: pick.y, width: 260 }}>
            <button className="close-x" onClick={() => setPick(null)}>×</button>
            <h4><span className="avatar" />{q.visitor ? "Visitor to the plaza" : "Local resident"}</h4>
            <div className="sub">{q.visitor ? "Came to spend time on the pedestrianized block" : `One of ${(areas.find((a) => a.area === st.area)?.populationInCircle ?? 0).toLocaleString()} people living within 1.5 km (US Census ACS 2024)`}</div>
            <div className="row"><span className="muted">Time lingering on this walk</span><span className="mono">{q.lingeredMin.toFixed(1)} min</span></div>
            <div className="row"><span className="muted">Distance walked</span><span className="mono">{Math.round(q.walkedM)} m</span></div>
            <div className="row"><span className="muted">Conversations so far</span><span className="mono" style={{ color: q.talkedWith ? "var(--connect)" : undefined }}>{q.talkedWith}{q.talkingNow ? " · talking now" : ""}</span></div>
            {q.heading && <div className="row"><span className="muted">Heading toward</span><span>{q.heading.name}</span></div>}
            <div className="note"><span className="dot" />Simulated person, sized to the real population; not a real individual.</div>
          </div>
        );
      })()}

      {mode === "backtest" && <Backtest onClose={() => setMode("plan")} />}
      {toast && <div className="toast glass">{toast}</div>}
      {st.presence.filter((p) => !p.me).length > 0 && <CursorTags />}
    </>
  );
}

function CursorTags() { return null; }
