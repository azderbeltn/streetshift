import { useEffect, useRef, useState } from "react";
import { SIM_URL } from "./api";
import { actions, useStore } from "./store";

type Knob = { key: string; label: string; help: string; unit: string; min: number; max: number; step: number; default: number };

/** Planner-adjustable model assumptions. Shared through SpacetimeDB, so every planner sees them. */
export default function Assumptions({ onClose }: { onClose: () => void }) {
  const [knobs, setKnobs] = useState<Knob[]>([]);
  const edits = useStore((s) => s.edits);
  const [local, setLocal] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => { fetch(`${SIM_URL}/assumptions`).then((r) => r.json()).then(setKnobs).catch(() => setKnobs([])); }, []);
  const valueOf = (k: Knob) => local[k.key] ?? Number(edits.get(`param:${k.key}`)?.value ?? k.default);
  const set = (k: Knob, v: number) => {
    setLocal((l) => ({ ...l, [k.key]: v }));
    clearTimeout(timers.current[k.key]);
    timers.current[k.key] = setTimeout(() => {
      actions.setEdit("param", k.key, Math.abs(v - k.default) < 1e-9 ? "" : String(v));
      setLocal((l) => { const n = { ...l }; delete n[k.key]; return n; });
    }, 180);
  };
  const changed = knobs.filter((k) => Math.abs(valueOf(k) - k.default) > 1e-9);
  const fmt = (k: Knob, v: number) => (k.unit === "%" ? `${Math.round(v)}%` : k.unit === "×" ? `${v.toFixed(2)}×` : `${v.toFixed(1)} ${k.unit}`);
  return (
    <div className="glass panel assumptions">
      <h3><span className="label">Assumptions</span><button className="close-x" style={{ position: "static" }} onClick={onClose}>×</button></h3>
      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, marginBottom: 6 }}>
        What if we're wrong? Drag any assumption and watch every outcome respond. Defaults are the calibrated, sourced values the backtest was scored with.
      </div>
      {knobs.map((k) => {
        const v = valueOf(k), off = Math.abs(v - k.default) > 1e-9;
        return (
          <div key={k.key} className="knob" title={k.help}>
            <div className="row" style={{ marginTop: 8 }}>
              <span>{k.label}</span>
              <span className="mono" style={{ color: off ? "var(--ped)" : "var(--muted)" }}>{fmt(k, v)}</span>
            </div>
            <input type="range" min={k.min} max={k.max} step={k.step} value={v} onChange={(e) => set(k, Number(e.target.value))} />
            <div className="knob-help">{k.help}{off && <> · <a onClick={() => set(k, k.default)}>reset ({fmt(k, k.default)})</a></>}</div>
          </div>
        );
      })}
      {changed.length > 0 && <button className="btn small" style={{ marginTop: 10 }} onClick={() => changed.forEach((k) => set(k, k.default))}>Reset all to calibrated</button>}
    </div>
  );
}
