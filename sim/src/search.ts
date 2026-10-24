// Planner search bar: Elastic hybrid search over the `reviews` index (BM25 + semantic_text/Jina,
// fused with RRF, then reranked), mirroring data/elastic_search.py. Falls back to a local
// name/category match when Elastic is mocked or unreachable.
import { loadBusinesses } from "./economy.ts";
import { listAreas } from "./network.ts";

export type Hit = { businessId?: string; name: string; category?: string; snippet?: string; score?: number; area?: string; lng?: number; lat?: number };

let reranker: string | null | undefined;

async function es(path: string, body?: unknown, method = "POST") {
  const base = (process.env.ELASTICSEARCH_URL ?? "").replace(/\/$/, "");
  const r = await fetch(base + path, {
    method: body === undefined ? "GET" : method,
    headers: { Authorization: `ApiKey ${process.env.ELASTIC_API_KEY}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`elastic ${path}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function findReranker(): Promise<string | null> {
  if (reranker !== undefined) return reranker;
  if (process.env.RERANK_INFERENCE_ID) return (reranker = process.env.RERANK_INFERENCE_ID);
  try {
    const ids: string[] = ((await es("/_inference/rerank")).endpoints ?? []).map((e: any) => e.inference_id);
    const jina = ids.filter((i) => i.includes("jina") && !i.includes("m0")).sort().reverse();
    reranker = jina[0] ?? ids[0] ?? null;
  } catch { reranker = null; }
  return reranker;
}

function local(q: string, area?: string): Hit[] {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const areas = area ? [area] : listAreas();
  return areas.flatMap((a) => loadBusinesses(a).map((b) => ({ b, a })))
    .map(({ b, a }) => ({ b, a, s: words.filter((w) => `${b.name} ${b.category}`.toLowerCase().includes(w)).length }))
    .filter((x) => x.s > 0).sort((x, y) => y.s - x.s).slice(0, 10)
    .map(({ b, a, s }) => ({ businessId: b.id, name: b.name, category: b.category, score: s, area: a, lng: b.lng, lat: b.lat }));
}

export async function search(q: string, area?: string): Promise<{ hits: Hit[]; mode: string }> {
  if (!q.trim()) return { hits: [], mode: "empty" };
  if (process.env.USE_MOCK_ELASTIC === "true" || !process.env.ELASTICSEARCH_URL) return { hits: local(q, area), mode: "local (USE_MOCK_ELASTIC)" };
  const flt = area ? [{ term: { area } }] : [];
  const rrf = { rrf: { retrievers: [
    { standard: { query: { bool: { must: { multi_match: { query: q, fields: ["text", "business_name^2"] } }, filter: flt } } } },
    { standard: { query: { bool: { must: { semantic: { field: "content", query: q } }, filter: flt } } } },
  ], rank_window_size: 50 } };
  const source = ["business_id", "business_name", "category", "area", "text", "published_at", "rating"];
  const rr = await findReranker();
  const run = async (retriever: unknown) => (await es("/reviews/_search", { retriever, size: 12, _source: source })).hits.hits;
  let hits: any[], mode: string;
  try {
    hits = rr ? await run({ text_similarity_reranker: { retriever: rrf, field: "text", inference_id: rr, inference_text: q, rank_window_size: 20 } }) : await run(rrf);
    mode = rr ? `elastic rrf+rerank(${rr})` : "elastic rrf";
  } catch (e) {
    try { hits = await run(rrf); mode = "elastic rrf"; }
    catch (e2) { return { hits: local(q, area), mode: `local (elastic error: ${String(e2).slice(0, 80)})` }; }
  }
  // One hit per business, best review snippet first.
  const seen = new Set<string>(), out: Hit[] = [];
  for (const h of hits) {
    const s = h._source;
    if (seen.has(s.business_id)) continue;
    seen.add(s.business_id);
    const text: string = s.text ?? "";
    out.push({ businessId: s.business_id, name: s.business_name, category: s.category, area: s.area, score: h._score,
      snippet: text.length > 180 ? text.slice(0, 177) + "…" : text });
  }
  return { hits: out, mode };
}
