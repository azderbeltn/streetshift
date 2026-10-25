// Prewarm for DEMO_MODE: run every scripted demo step once against the running sim so all Claude
// responses are cached on disk (sim/.cache/claude) and every scenario/trips payload is warm.
//   cd sim && npx tsx scripts/prewarm.ts
const SIM = `http://localhost:${process.env.SIM_PORT ?? 8787}`;
const post = async (path: string, body: unknown) => {
  const t = performance.now();
  const r = await fetch(SIM + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return { j, ms: Math.round(performance.now() - t) };
};

const areas: any[] = await (await fetch(`${SIM}/areas`)).json();
for (const a of areas) {
  for (const c of a.corridors.filter((x: any) => x.role !== "control")) {
    const req = { area: a.area, corridorId: c.id, closedSegmentIds: c.segmentIds, addedSeating: true, programming: "light" };
    const run = await post("/scenario/run", req);
    const trips = await post("/scenario/trips", req);
    console.log(`${c.id.padEnd(16)} run ${run.ms} ms · trips ${trips.ms} ms · ${run.j.metrics.interaction.verdict} · conv ${run.j.connection.conversationsPerHour}/h`);
  }
}

// Hayes: merchant reports for the top 5 businesses on the block, the hearing, and the scripted question.
const hayes = areas.find((a) => a.area === "hayes_valley");
const corridor = hayes.corridors.find((c: any) => c.id === "hayes");
const req = { area: "hayes_valley", corridorId: "hayes", closedSegmentIds: corridor.segmentIds, addedSeating: true, programming: "light" };
const biz: any[] = await (await fetch(`${SIM}/areas/hayes_valley/businesses`)).json();
for (const b of biz.filter((x) => corridor.segmentIds.includes(x.segmentId)).sort((x, y) => (y.reviewCount ?? 0) - (x.reviewCount ?? 0)).slice(0, 5)) {
  const r = await post("/report/merchant", { ...req, businessId: b.id });
  console.log(`merchant report ${b.name}: ${r.ms} ms (${r.j.author})`);
}
const ask = await post("/hearing/ask", { ...req, scenarioId: "prewarm:hayes", character: "cafe", question: "Would you support it if the city added a loading zone for deliveries?" });
console.log(`hearing Q&A: ${ask.ms} ms · "${ask.j.text.slice(0, 90)}…"`);
console.log("done. Start the hearing once from the UI to cache its turns too.");
