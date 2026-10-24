// StreetShift Droid worker. Claims queued runs from Convex (queued by the UI's "Run backtest" button
// or the daily sweep cron), runs a Factory Droid session to do the work, and streams its plan and
// every step back to Convex so the UI shows them live.
//
// Scope: Droid gets only in-process MCP tools for the /sim API, the /validation scorer and the
// /reports directory. Autonomy is Off and the permission handler approves only those tools; every
// native tool (shell, file edit, etc.) is disabled or refused.
//
//   npm run worker            (from /droid; needs FACTORY_API_KEY, CONVEX_URL, DROID_WORKER_SECRET)
//   npm run worker -- --once  process one queued run and exit
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { AutonomyLevel, DroidMessageType, ToolConfirmationOutcome, ToolConfirmationType, createSdkMcpServer, createSession, tool } from "@factory/droid-sdk/node";
import { api } from "../../convex/convex/_generated/api.js";
import { scoreAll, writeReport } from "../../validation/score.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
if (existsSync(join(ROOT, ".env"))) process.loadEnvFile(join(ROOT, ".env"));
const REPORTS = join(ROOT, "reports");
mkdirSync(REPORTS, { recursive: true });
const SIM = `http://localhost:${process.env.SIM_PORT ?? 8787}`;
const SECRET = process.env.DROID_WORKER_SECRET!;
const convex = new ConvexHttpClient(process.env.CONVEX_URL!);
const MCP = "streetshift";
// On Windows the npm `droid` shim can't be spawned directly; point the SDK at the real binary.
const DROID_EXE = process.env.DROID_EXEC_PATH ?? join(process.env.APPDATA ?? "", "npm", "node_modules", "droid", "node_modules", "@factory", "cli-win32-x64", "bin", "droid.exe");

async function sim(path: string, body?: unknown) {
  const r = await fetch(SIM + path, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${await r.text()}`);
  return r.json();
}

type Run = { _id: any; kind: "backtest" | "sweep" };

/** Step log: every tool call becomes a step in Convex. */
function stepLog(runId: any) {
  let n = 0;
  return {
    async start(label: string) { const i = n++; await convex.mutation(api.droid.upsertStep, { secret: SECRET, runId, index: i, label, status: "running", output: null }); return i; },
    async done(i: number, label: string, output: string, ok = true) { await convex.mutation(api.droid.upsertStep, { secret: SECRET, runId, index: i, label, status: ok ? "done" : "failed", output }); },
  };
}

function tools(run: Run, log: ReturnType<typeof stepLog>, out: { report?: { title: string; markdown: string }; summary?: string }) {
  const wrap = <A,>(label: (a: A) => string, fn: (a: A) => Promise<unknown>) => async (a: A) => {
    const i = await log.start(label(a));
    try {
      const res = await fn(a);
      const text = typeof res === "string" ? res : JSON.stringify(res);
      await log.done(i, label(a), text.slice(0, 1500));
      return text;
    } catch (e) { await log.done(i, label(a), String(e), false); return `ERROR: ${e}`; }
  };
  const common = [
    tool("set_plan", "Record your plan as a short list of steps before doing anything else.", { steps: z.array(z.string()).min(1).max(10) },
      async ({ steps }) => { await convex.mutation(api.droid.setPlan, { secret: SECRET, runId: run._id, plan: steps }); return "plan recorded"; }),
    tool("write_report", "Write the final markdown report to the reports directory (the only place you may write).", { title: z.string(), markdown: z.string() },
      wrap((a: { title: string }) => `Write report: ${a.title}`, async ({ title, markdown }: { title: string; markdown: string }) => {
        out.report = { title, markdown };
        const f = join(REPORTS, `${run.kind}-${new Date().toISOString().replace(/[:.]/g, "-")}.md`);
        writeFileSync(f, markdown, "utf8");
        return `saved ${f.replace(ROOT, "")}`;
      })),
    tool("finish", "Call last with a one or two sentence summary of the result.", { summary: z.string() },
      async ({ summary }) => { out.summary = summary; return "ok"; }),
  ];
  if (run.kind === "backtest") return [
    ...common,
    tool("list_backtest_corridors", "List the five 2020 NYC Open Streets corridors with their control corridors and calibration/holdout split. Contains no outcomes.", {},
      wrap(() => "List backtest corridors", async () => {
        const areas = await sim("/areas");
        return areas.flatMap((a: any) => a.corridors.filter((c: any) => c.role === "treated").map((c: any) => ({ corridorId: c.id, name: c.name, area: a.area, control: `${c.id}_control`,
          split: ["ditmars", "park_slope_5th"].includes(c.id) ? "calibration" : "holdout" })));
      })),
    tool("predict_corridor", "Run the StreetShift simulation for one Open Street vs its control (closure + outdoor seating) and return the predicted restaurant & bar sales gap at low/mid/high parameters.",
      { corridorId: z.string(), area: z.string(), controlId: z.string() },
      wrap((a: { corridorId: string }) => `Simulate ${a.corridorId} vs control`, async ({ corridorId, area, controlId }: any) => {
        const p = await sim("/backtest/predict", { treatedId: corridorId, controlId, area });
        return { corridorId, gapPct: p.byLevel, foodBusinesses: p.foodBusinesses };
      })),
    tool("score_backtest", "Score all predictions against the NYC DOT ground truth (validation/score.ts), write validation/backtest_report.md and save results to Convex. Returns the scoreboard.", {},
      wrap(() => "Score against NYC DOT ground truth", async () => {
        const res = scoreAll();
        writeReport(res);
        await convex.mutation(api.droid.saveBacktest, { secret: SECRET, runId: run._id, summary: res.summary,
          rows: res.rows.filter((r) => r.available).map((r) => ({ corridorId: r.corridorId, corridorName: r.corridorName, split: r.split, predictedGapPct: r.predictedGapPct,
            actualGapPct: r.actualGapPct, directionCorrect: r.directionCorrect, absErrorPts: r.absErrorPts })) });
        return { summary: res.summary, rows: res.rows.map((r) => ({ corridor: r.corridorName, split: r.split, predicted: r.predictedGapPct, range: r.predictedRange, actual: r.actualGapPct, directionCorrect: r.directionCorrect, absErrorPts: r.absErrorPts })) };
      })),
  ];
  return [
    ...common,
    tool("list_candidate_blocks", "List street blocks in an area that are eligible to pedestrianize (enough storefronts), with business counts.", { area: z.string(), limit: z.number().int().min(5).max(40) },
      wrap((a: { area: string }) => `Find candidate blocks in ${a.area}`, async ({ area, limit }: { area: string; limit: number }) => {
        const [net, biz] = await Promise.all([sim(`/areas/${area}/network`), sim(`/areas/${area}/businesses`)]);
        const count = new Map<string, number>();
        for (const b of biz) count.set(b.segmentId, (count.get(b.segmentId) ?? 0) + 1);
        return net.segments.filter((s: any) => (count.get(s.id) ?? 0) >= 3 && !["primary", "trunk", "motorway"].includes(s.highway))
          .map((s: any) => ({ segmentId: s.id, street: s.name, lengthM: s.lengthM, roadClass: s.highway, businesses: count.get(s.id) }))
          .sort((a: any, b: any) => b.businesses - a.businesses).slice(0, limit);
      })),
    tool("evaluate_blocks", "Simulate pedestrianizing each block on its own (with seating, light programming) and return connection, revenue and traffic outcomes with ranges.",
      { area: z.string(), segmentIds: z.array(z.string()).min(1).max(40) },
      wrap((a: { segmentIds: string[] }) => `Simulate ${a.segmentIds.length} blocks one at a time`, async ({ area, segmentIds }: { area: string; segmentIds: string[] }) => {
        const out = [];
        for (const id of segmentIds) {
          const r = await sim("/scenario/run", { area, closedSegmentIds: [id], addedSeating: true, programming: "light" });
          out.push({ segmentId: id, verdict: r.metrics.interaction.verdict, conversationsPerHour: r.connection.conversationsPerHour, conversationsBefore: r.baseline.interaction.encountersPerHour,
            newConnectionsPerDay: r.connection.newConnectionsPerDay, revenueChangePct: r.metrics.economy.totalRevenueChangePct, revenueRange: r.metrics.economy.range,
            addedVehicleHoursPerDay: r.metrics.traffic.addedVehicleHours, carsReroutedPerHour: r.traffic.reroutedVehPerHour });
        }
        return out;
      })),
  ];
}

const PROMPTS = {
  backtest: `You are StreetShift's backtest runner. Goal: re-run the StreetShift backtest on the five 2020 NYC Open Streets and report how close the model's predictions were to the city's published sales data.
Use only the streetshift tools. Steps: (1) call set_plan with your plan; (2) list the corridors; (3) run predict_corridor for every corridor; (4) call score_backtest exactly once; (5) write_report a concise markdown report: a table per corridor (split, predicted gap with range, actual gap, direction, error), the overall scores, and 3 honest caveats (small sample, outdoor dining confound, estimated pedestrian volumes); (6) call finish with a one-sentence summary. Never invent numbers; use the tool outputs.`,
  sweep: `You are StreetShift's street sweep. Goal: find the top 5 blocks in San Francisco's Hayes Valley (area id "hayes_valley") to pedestrianize, prioritising bringing people together (conversations, new connections) while protecting small businesses and keeping added traffic low.
Use only the streetshift tools. Steps: (1) set_plan; (2) list_candidate_blocks for hayes_valley with limit 20; (3) evaluate_blocks for all candidates (one call); (4) rank them — explain your scoring rule in one line; (5) write_report with a ranked table of the top 5 (street, verdict, conversations before→after, revenue change with range, added vehicle-hours) and a short paragraph on trade-offs; (6) finish with a one-sentence summary naming the top block. Never invent numbers.`,
};

async function execute(run: Run) {
  const log = stepLog(run._id);
  const out: { report?: { title: string; markdown: string }; summary?: string } = {};
  const server = createSdkMcpServer({ name: MCP, tools: tools(run, log, out) as any });
  const session = await createSession({
    execPath: existsSync(DROID_EXE) ? DROID_EXE : undefined,
    cwd: REPORTS,
    autonomyLevel: AutonomyLevel.Off,
    mcpServers: [server],
    permissionHandler({ toolUses, options }) {
      // Approve only StreetShift's own MCP tools; refuse everything else (shell, edits, web, ...).
      // Droid calls MCP tools from its Script tool, so a script is approved only when every call
      // inside it is one of ours.
      const ours = (c: any) => c?.type === ToolConfirmationType.McpTool && c.serverName === MCP;
      const ok = toolUses.length > 0 && toolUses.every((u: any) => ours(u.details) ||
        (u.details?.type === ToolConfirmationType.Script && Array.isArray(u.details.calls) && u.details.calls.length > 0 && u.details.calls.every((c: any) => ours(c.confirmation))));
      const want = ok ? ToolConfirmationOutcome.ProceedOnce : ToolConfirmationOutcome.Cancel;
      return options.some((o: any) => o.value === want) ? want : ToolConfirmationOutcome.Cancel;
    },
  });
  try {
    // Turn off every native tool so the only things Droid can do are the scoped MCP tools.
    // Droid reaches MCP tools through Script (calls are vetted by the permission handler above) and
    // loads their schemas with ToolSearch; everything else is switched off.
    const KEEP = new Set(["ToolSearch", "Script", "WaitForScript"]);
    const native = (await session.listTools()).filter((t: any) => !String(t.id).startsWith(`${MCP}___`) && !KEEP.has(t.id)).map((t: any) => t.id);
    if (native.length) await session.updateSettings({ disabledToolIds: native });
    let lastText = "";
    for await (const m of session.stream(PROMPTS[run.kind])) {
      if (m.type === DroidMessageType.Assistant && (m as any).text) lastText = (m as any).text;
      if (m.type === DroidMessageType.Result) {
        const ok = (m as any).success;
        let report: { fileId: any; title: string } | null = null;
        if (out.report) {
          const url = await convex.mutation(api.droid.generateUploadUrl, { secret: SECRET });
          const up = await fetch(url, { method: "POST", headers: { "content-type": "text/markdown" }, body: out.report.markdown });
          const { storageId } = await up.json();
          report = { fileId: storageId, title: out.report.title };
        }
        await convex.mutation(api.droid.finish, { secret: SECRET, runId: run._id, status: ok && out.report ? "done" : "failed",
          resultSummary: out.summary ?? lastText.slice(0, 500) ?? "no summary", report });
        console.log(`[droid] ${run.kind} ${ok ? "done" : "failed"}: ${out.summary ?? ""}`);
      }
    }
  } catch (e) {
    await convex.mutation(api.droid.finish, { secret: SECRET, runId: run._id, status: "failed", resultSummary: String(e).slice(0, 500), report: null });
    console.error("[droid] run failed", e);
  } finally {
    await session.close();
  }
}

async function main() {
  const once = process.argv.includes("--once");
  console.log(`[droid] worker polling ${process.env.CONVEX_URL} for queued runs`);
  for (;;) {
    const run = (await convex.mutation(api.droid.claimNext, { secret: SECRET })) as Run | null;
    if (run) { console.log(`[droid] claimed ${run.kind} run ${run._id}`); await execute(run); if (once) return; }
    else if (once) { console.log("[droid] nothing queued"); return; }
    await new Promise((r) => setTimeout(r, 3000));
  }
}
main();
