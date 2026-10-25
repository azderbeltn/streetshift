import { useEffect, useRef, useState } from "react";
import { SIM_URL } from "./api";
import { actions, scenarioInput, useStore, getState } from "./store";

type Character = { key: string; name: string; role: string };
const COLORS: Record<string, string> = { Maya: "#ffb547", Dev: "#4cc3ff", Rosa: "#ff5fa2", Sam: "#3ee08f", Chair: "#8a95a8", Judge: "#c58cff" };

/** Simulated public hearing: Claude stakeholders grounded in Moss/Elastic lookups, live via SpacetimeDB. */
export default function Hearing({ onClose }: { onClose: () => void }) {
  const hearing = useStore((s) => s.hearing);
  const mode = useStore((s) => s.mode);
  const scenarioId = useStore((s) => s.scenarioId);
  const closed = useStore((s) => s.closed);
  const [chars, setChars] = useState<Character[]>([]);
  const [who, setWho] = useState("cafe");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch(`${SIM_URL}/hearing/characters`).then((r) => r.json()).then(setChars).catch(() => {}); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [hearing.length]);
  // Local mode: poll the sim's fallback transcript.
  useEffect(() => {
    if (mode === "live") return;
    const h = setInterval(() => fetch(`${SIM_URL}/hearing/local?scenarioId=${encodeURIComponent(scenarioId)}`).then((r) => r.json())
      .then((ts: any[]) => actions.setLocalHearing(ts.map((t, i) => ({ id: String(i), at: i, ...t })))).catch(() => {}), 1500);
    return () => clearInterval(h);
  }, [mode, scenarioId]);
  const post = (path: string, body: object) => fetch(`${SIM_URL}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...scenarioInput(getState()), scenarioId, ...body }) });
  const start = async () => { setBusy("Hearing in session…"); actions.clearHearing(); await post("/hearing/start", {}); setTimeout(() => setBusy(null), 60000); };
  const ask = async () => {
    if (!q.trim()) return;
    const question = q; setQ(""); setBusy(`${chars.find((c) => c.key === who)?.name ?? "They"} is answering…`);
    try { await post("/hearing/ask", { character: who, question, history: hearing.slice(-6).map((m) => `${m.speaker}: ${m.text}`) }); } finally { setBusy(null); }
  };
  useEffect(() => { if (busy?.startsWith("Hearing") && hearing.length >= 9) setBusy(null); }, [hearing.length, busy]);

  return (
    <div className="glass panel hearing">
      <h3><span className="label">Public hearing</span><span style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button className="btn small go" disabled={!closed.size || !!busy} onClick={start}>{hearing.length ? "Restart hearing" : "Open the hearing"}</button>
        <button className="close-x" style={{ position: "static" }} onClick={onClose}>×</button></span></h3>
      {!closed.size && <div className="dim" style={{ fontSize: 11.5 }}>Pedestrianize a block first; the stakeholders argue about your scenario.</div>}
      <div className="transcript">
        {hearing.map((m) => (
          <div key={m.id} className="turn">
            <div className="who"><span className="av" style={{ background: COLORS[m.speaker] ?? "#7c9cff" }}>{m.speaker[0]}</span>
              <b>{m.speaker}</b><span className="dim">{m.role}</span></div>
            <div className="said">{m.text}</div>
            {m.lookups.length > 0 && (
              <div className="looked">
                <a onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? "▾" : "▸"} looked up {m.lookups.length} facts · {m.retrievalMs} ms · {m.lookups[0].source.split(" · ")[0]}</a>
                {open === m.id && m.lookups.map((l, i) => <div key={i} className="lk"><span className="mono">{l.score.toFixed(3)}</span> <span className="dim">{l.source}</span><div>{l.text}</div></div>)}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="dim" style={{ fontSize: 11.5, padding: "6px 0" }}>{busy}</div>}
        <div ref={end} />
      </div>
      <div className="ask">
        <select value={who} onChange={(e) => setWho(e.target.value)}>{chars.map((c) => <option key={c.key} value={c.key}>{c.name} · {c.role}</option>)}</select>
        <div style={{ display: "flex", gap: 6 }}>
          <input placeholder="Ask a question…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
          <button className="btn small" onClick={ask} disabled={!q.trim() || !!busy}>Ask</button>
          <button className="btn small" title={import.meta.env.LIVEKIT_ENABLED === "true" ? "Ask by voice (LiveKit)" : "Voice needs LiveKit credentials; typed questions work the same way"} disabled={import.meta.env.LIVEKIT_ENABLED !== "true"}>🎙</button>
        </div>
      </div>
      <div className="note"><span className="dot" />Characters are fictional composites grounded in real data; they do not represent any real business owner or resident.</div>
    </div>
  );
}
