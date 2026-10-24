import type { NetworkPayload, SegMetric, Summary } from "./api";

/**
 * Cause -> effect strip: how one change propagates through the model.
 * cars removed -> people on the block -> time lingering -> conversations -> revenue / traffic.
 */
export default function Chain({ s, seg, closed, network }: { s: Summary | null; seg: Map<string, SegMetric>; closed: Set<string>; network: NetworkPayload | null }) {
  if (!s || closed.size === 0) return null;
  const ms = [...closed].map((id) => seg.get(id)).filter(Boolean) as SegMetric[];
  const carsRemoved = ms.reduce((a, m) => a + m.baseCar, 0);
  const pedB = ms.reduce((a, m) => a + m.basePed, 0), pedA = ms.reduce((a, m) => a + m.afterPed, 0);
  const pedPct = pedB > 0 ? (pedA / pedB - 1) * 100 : 0;
  const name = network?.segments.find((x) => closed.has(x.id))?.name ?? "the block";
  const steps: { k: string; v: string; sub: string; tone?: string }[] = [
    { k: "Cars removed", v: `${Math.round(carsRemoved)}/h`, sub: `from ${name}` },
    { k: "People on the block", v: `${pedPct >= 0 ? "+" : ""}${Math.round(pedPct)}%`, sub: `${Math.round(pedB)} → ${Math.round(pedA)}/h`, tone: "ped" },
    { k: "Time lingering", v: `${s.lingerMinutes.toFixed(1)} min`, sub: `was ${s.beforeLingerMinutes.toFixed(1)}`, tone: "ped" },
    { k: "Conversations", v: `${Math.round(s.conversationsPerHour)}/h`, sub: `was ${Math.round(s.beforeConversationsPerHour)}`, tone: "connect" },
    { k: "Revenue", v: `${s.revenueChangePct >= 0 ? "+" : ""}${s.revenueChangePct.toFixed(1)}%`, sub: "affected businesses", tone: s.revenueChangePct >= 0 ? "good" : "bad" },
    { k: "Traffic", v: `+${s.addedVehicleHours.toFixed(1)} veh-h`, sub: `${Math.round(s.reroutedVehPerHour)} cars rerouted/h`, tone: "car" },
  ];
  return (
    <div className="chain glass">
      {steps.map((x, i) => (
        <div key={x.k} className="chain-step">
          {i > 0 && <span className="arrow">→</span>}
          <div>
            <div className="label" style={{ fontSize: 9.5 }}>{x.k}</div>
            <div key={x.v} className={`mono chain-v ${x.tone ?? ""}`}>{x.v}</div>
            <div className="dim" style={{ fontSize: 10 }}>{x.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
