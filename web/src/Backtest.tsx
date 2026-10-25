import { useEffect, useState } from "react";
import { api } from "./api";

type Row = { corridorId: string; corridorName: string; split: string; predictedGapPct: number; actualGapPct: number; directionCorrect: boolean | null;
  absErrorPts: number | null; predictedRange: [number, number] | null; predictedTreatedPct: number | null; predictedControlPct: number | null;
  actualTreatedPct: number; actualControlPct: number; source: string; available: boolean; foodBusinesses: { treated: number; control: number } | null };
type Results = { rows: Row[]; summary: any; generatedAt?: string; v1Summary?: any };

const sgn = (x: number | null | undefined, d = 0) => (x === null || x === undefined || Number.isNaN(x) ? "—" : `${x > 0 ? "+" : ""}${x.toFixed(d)}`);

export default function Backtest({ onClose }: { onClose: () => void }) {
  const [res, setRes] = useState<Results | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  useEffect(() => { api.backtest().then(setRes).catch((e) => setErr(String(e.message ?? e))); }, []);
  if (err) return <div className="overlay"><div className="modal glass"><button className="close-x" onClick={onClose}>×</button><h2>Backtest</h2><p className="muted">{err}</p></div></div>;
  if (!res) return <div className="overlay"><div className="modal glass"><p className="muted">Loading backtest…</p></div></div>;

  const rows = res.rows.filter((r) => r.available);
  const done = i >= rows.length;
  const r = rows[Math.min(i, rows.length - 1)];
  const shown = rows.filter((_, k) => revealed.has(k));
  const scale = (v: number) => `${Math.max(2, Math.min(100, (Math.abs(v) / 80) * 100))}%`;

  return (
    <div className="overlay">
      <div className="modal glass" style={{ width: "min(1040px, calc(100vw - 40px))" }}>
        <button className="close-x" onClick={onClose}>×</button>
        <div className="label" style={{ color: "var(--ped)" }}>Backtest challenge</div>
        <h2>Can the model call a street it has never seen?</h2>
        <p className="muted" style={{ marginTop: 4, maxWidth: 760, lineHeight: 1.5 }}>
          In 2020 New York closed these streets to cars. The city later published restaurant &amp; bar sales on each Open Street and on a nearby control street.
          We predict the <b>gap</b> (Open Street minus control, percentage points, summer 2021 vs pre-pandemic) from our simulation, then reveal what really happened.
          One parameter was fit on the two <span className="tag cal">calibration</span> streets; the three <span className="tag hold">holdout</span> streets are blind.
        </p>

        {!done && r && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            <div className="glass panel" style={{ animation: "feedIn .5s ease" }}>
              <div className="label">Prediction · {r.corridorName} <span className={`tag ${r.split === "calibration" ? "cal" : "hold"}`} style={{ marginLeft: 6 }}>{r.split}</span></div>
              <div className="mono" style={{ fontSize: 48, marginTop: 8 }}>{sgn(r.predictedGapPct)}<span className="unit" style={{ fontSize: 16 }}> pts</span></div>
              <div className="rng mono muted">range {sgn(r.predictedRange?.[0])} to {sgn(r.predictedRange?.[1])} pts</div>
              <div className="list">
                <div className="li"><span>Open Street restaurants &amp; bars</span><span className="mono">{sgn(r.predictedTreatedPct)}% vs control</span></div>
                <div className="li"><span>Control corridor</span><span className="mono">{sgn(r.predictedControlPct)}%</span></div>
                <div className="li"><span>Food &amp; drink businesses (treated / control)</span><span className="mono">{r.foodBusinesses?.treated} / {r.foodBusinesses?.control}</span></div>
              </div>
            </div>
            <div className="glass panel" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
              {!revealed.has(i) ? (
                <button className="btn go" style={{ width: 200, fontSize: 15, padding: 14 }} onClick={() => setRevealed(new Set([...revealed, i]))}>Reveal what happened</button>
              ) : (
                <div style={{ width: "100%", animation: "feedIn .5s ease" }}>
                  <div className="label">Reality · NYC DOT taxable sales</div>
                  <div className="mono" style={{ fontSize: 48, marginTop: 8, color: "var(--ped)" }}>{sgn(r.actualGapPct)}<span className="unit" style={{ fontSize: 16 }}> pts</span></div>
                  <div className="list">
                    <div className="li"><span>Open Street vs baseline</span><span className="mono">{sgn(r.actualTreatedPct)}%</span></div>
                    <div className="li"><span>Control vs baseline</span><span className="mono">{sgn(r.actualControlPct)}%</span></div>
                    <div className="li"><span>Direction</span><span className={r.directionCorrect ? "pos" : "neg"}>{r.directionCorrect ? "✓ called it" : "✗ wrong way"}</span></div>
                    <div className="li"><span>Error</span><span className="mono">{r.absErrorPts} pts</span></div>
                  </div>
                  <div className="dim" style={{ fontSize: 10.5, marginTop: 8 }}>{r.source}</div>
                  <button className="btn" style={{ marginTop: 12 }} onClick={() => setI(i + 1)}>{i + 1 < rows.length ? "Next street →" : "See the scoreboard →"}</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="glass panel" style={{ marginTop: 14 }}>
          <div className="label" style={{ marginBottom: 8 }}>Scoreboard</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr className="muted" style={{ textAlign: "left" }}><th>Street</th><th>Split</th><th style={{ width: "30%" }}>Predicted vs actual gap</th><th>Pred.</th><th>Actual</th><th>Dir.</th><th>Error</th></tr></thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.corridorId} style={{ borderTop: "1px solid var(--line)", animation: "feedIn .5s ease" }}>
                  <td style={{ padding: "7px 0" }}>{x.corridorName}</td>
                  <td><span className={`tag ${x.split === "calibration" ? "cal" : "hold"}`}>{x.split}</span></td>
                  <td>
                    <div style={{ height: 6, background: "rgba(124,156,255,.8)", width: scale(x.predictedGapPct), borderRadius: 3 }} />
                    <div style={{ height: 6, background: "var(--ped)", width: scale(x.actualGapPct), borderRadius: 3, marginTop: 3 }} />
                  </td>
                  <td className="mono">{sgn(x.predictedGapPct)}</td><td className="mono">{sgn(x.actualGapPct)}</td>
                  <td className={x.directionCorrect ? "pos" : "neg"}>{x.directionCorrect ? "✓" : "✗"}</td><td className="mono">{x.absErrorPts}</td>
                </tr>
              ))}
              {!shown.length && <tr><td colSpan={7} className="dim" style={{ padding: 8 }}>Reveal a street to fill the scoreboard.</td></tr>}
            </tbody>
          </table>
          {done && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 14, animation: "feedIn .6s ease" }}>
              <div className="stat"><div className="lbl">Direction correct</div><div className="big mono">{Math.round((res.summary.directionAccuracy ?? 0) * 100)}%</div></div>
              <div className="stat"><div className="lbl">Holdout mean error</div><div className="big mono">{res.summary.maeHoldout?.toFixed(1) ?? "—"}<span className="unit">pts</span></div></div>
              <div className="stat"><div className="lbl">Holdout inside range</div><div className="big mono">{res.summary.holdoutInRange}/{res.summary.holdoutScored}</div></div>
              <div className="stat"><div className="lbl">Rank correlation</div><div className="big mono">{res.summary.spearmanAll === null ? "—" : res.summary.spearmanAll.toFixed(2)}</div></div>
            </div>
          )}
          {done && res.v1Summary && (
            <div className="muted" style={{ fontSize: 11.5, marginTop: 10, lineHeight: 1.45 }}>
              <b>First blind run (v1):</b> direction {Math.round(res.v1Summary.directionAccuracy * 100)}%, holdout error {res.v1Summary.maeHoldout.toFixed(1)} pts, {res.v1Summary.holdoutInRange}/{res.v1Summary.holdoutScored} inside range, rank correlation {res.v1Summary.spearmanAll.toFixed(2)}.
              Shown above: the current model after we fixed a business-to-street matching bug and re-fit on the calibration streets only (no longer strictly blind).
            </div>
          )}
          <div className="note"><span className="dot" />Five streets is a small sample. All five also had outdoor dining; a 2026 NY State Comptroller report found jobs had not recovered on most Open Streets.</div>
        </div>
      </div>
    </div>
  );
}
