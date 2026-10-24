// Droid run panel: plan, live steps and report from Convex. The "Run" buttons queue a run in
// Convex; the local /droid worker (Factory Droid SDK) claims it and streams its steps back.
import { useState } from "react";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/convex/_generated/api";
import type { Business, NetworkPayload } from "./api";

const url = import.meta.env.CONVEX_URL;
const client = url ? new ConvexReactClient(url) : null;

function DroidPanel() {
  const runs = useQuery(api.droid.latestRuns, {});
  const request = useMutation(api.droid.requestRun);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = runs?.find((r) => r._id === openId) ?? runs?.[0];
  const detail = useQuery(api.droid.runWithSteps, current ? { runId: current._id } : "skip");
  const busy = runs?.some((r) => r.status === "planning" || r.status === "running");
  return (
    <div className="glass panel">
      <h3><span className="label">Factory Droid</span>
        <span style={{ display: "flex", gap: 6 }}>
          <button className="btn small" disabled={busy} onClick={() => request({ kind: "backtest" }).then((id) => setOpenId(id))}>Run backtest</button>
          <button className="btn small" disabled={busy} onClick={() => request({ kind: "sweep" }).then((id) => setOpenId(id))}>Street sweep</button>
        </span>
      </h3>
      {!current && <div className="dim" style={{ fontSize: 11.5 }}>No runs yet. Droid re-runs the backtest or ranks the best blocks to pedestrianize, with every step logged here.</div>}
      {current && (
        <>
          <div className="row" style={{ marginTop: 0 }}>
            <span className="muted">{current.kind === "backtest" ? "Backtest runner" : "Street sweep"} · {current.trigger}</span>
            <span className={`tag ${current.status === "done" ? "fwd" : current.status === "failed" ? "hold" : "cal"}`}>{current.status}</span>
          </div>
          {current.plan.length > 0 && (
            <div className="list">
              <div className="label" style={{ fontSize: 9.5 }}>Plan</div>
              {current.plan.map((p, i) => <div key={i} className="li"><span>{i + 1}. {p}</span></div>)}
            </div>
          )}
          {detail?.steps && detail.steps.length > 0 && (
            <div className="list">
              <div className="label" style={{ fontSize: 9.5 }}>Steps</div>
              {detail.steps.map((s) => (
                <div key={s._id} className="li" title={s.output ?? ""}>
                  <span>{s.status === "done" ? "✓" : s.status === "failed" ? "✗" : "…"} {s.label}</span>
                  <span className={s.status === "done" ? "pos" : s.status === "failed" ? "neg" : "dim"}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
          {current.resultSummary && <div className="muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.45 }}>{current.resultSummary}</div>}
          {detail?.reportUrl && <a className="pill" style={{ display: "inline-block", marginTop: 8 }} href={detail.reportUrl} target="_blank" rel="noreferrer">Open report (Convex file storage)</a>}
          {runs && runs.length > 1 && (
            <div className="row"><span className="dim">History</span>
              <select value={current._id} onChange={(e) => setOpenId(e.target.value)}>
                {runs.map((r) => <option key={r._id} value={r._id}>{r.kind} · {new Date(r.startedAt).toLocaleTimeString()} · {r.status}</option>)}
              </select></div>
          )}
        </>
      )}
    </div>
  );
}

export default function Side(_props: { network: NetworkPayload | null; businesses: Business[] }) {
  if (!client) return null;
  return <ConvexProvider client={client}><DroidPanel /></ConvexProvider>;
}
