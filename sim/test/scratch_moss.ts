import { MossClient } from "@moss-js/moss";
import { join } from "node:path";
process.loadEnvFile(join(process.cwd(), "..", ".env"));
const c = new MossClient(process.env.MOSS_PROJECT_ID!, process.env.MOSS_PROJECT_KEY!);
let t = performance.now();
const timer = setTimeout(() => { console.log("still loading after 300s"); process.exit(1); }, 300000);
await c.loadIndex("streetshift-facts");
clearTimeout(timer);
console.log("loaded in", Math.round(performance.now() - t), "ms");
for (const q of ["outdoor seating cafe Hayes Street", "hard to find parking", "kids playground"]) {
  t = performance.now();
  const r: any = await c.query("streetshift-facts", q, { topK: 3, alpha: 0.6, filter: { field: "area", condition: { $eq: "hayes_valley" } } } as any);
  console.log(`${q}: ${(performance.now() - t).toFixed(1)} ms`, r.docs.map((d: any) => `${d.score.toFixed(3)} ${d.text.slice(0, 70)}`));
}
const s = await c.session("hearing-test");
await s.addDocs([{ id: "1", text: "Maya said deliveries need a loading zone on Hayes" }]);
t = performance.now();
const rs: any = await s.query("loading zone deliveries", { topK: 1 } as any);
console.log("session query", (performance.now() - t).toFixed(1), "ms", rs.docs[0]?.text);
await c.close();
