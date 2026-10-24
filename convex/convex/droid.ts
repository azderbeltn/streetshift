import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { droidStatus } from "./schema";

// Droid run lifecycle. The UI (or the daily cron) queues a run; the local /droid worker claims it,
// streams its plan and steps here, uploads the report to file storage and saves backtest results.
// Worker-only mutations require DROID_WORKER_SECRET (set with `npx convex env set`).

function checkSecret(secret: string) {
  const expected = process.env.DROID_WORKER_SECRET;
  if (!expected || secret !== expected) throw new Error("unauthorized worker");
}

async function queue(ctx: MutationCtx, kind: "backtest" | "sweep", trigger: string): Promise<Id<"droidRuns">> {
  return await ctx.db.insert("droidRuns", {
    kind, status: "planning", plan: [], resultSummary: null, reportId: null, trigger,
    claimedAt: null, startedAt: Date.now(), finishedAt: null,
  });
}

export const requestRun = mutation({
  args: { kind: v.union(v.literal("backtest"), v.literal("sweep")) },
  handler: async (ctx, { kind }) => await queue(ctx, kind, "ui"),
});

export const scheduledSweep = internalMutation({
  args: {},
  handler: async (ctx) => { await queue(ctx, "sweep", "schedule"); return null; },
});

export const latestRuns = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("droidRuns").order("desc").take(8),
});

export const runWithSteps = query({
  args: { runId: v.id("droidRuns") },
  handler: async (ctx, { runId }) => {
    const run = await ctx.db.get("droidRuns", runId);
    if (!run) return null;
    const steps = await ctx.db.query("droidSteps").withIndex("by_runId_and_index", (q) => q.eq("runId", runId)).take(200);
    const report = run.reportId ? await ctx.db.get("reports", run.reportId) : null;
    const reportUrl = report ? await ctx.storage.getUrl(report.fileId) : null;
    return { run, steps, reportUrl };
  },
});

export const latestBacktest = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("backtestResults").order("desc").first(),
});

// ---------------- worker API ----------------

export const claimNext = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    checkSecret(secret);
    const run = await ctx.db.query("droidRuns").withIndex("by_claimedAt", (q) => q.eq("claimedAt", null)).first();
    if (!run) return null;
    await ctx.db.patch("droidRuns", run._id, { claimedAt: Date.now() });
    return run;
  },
});

export const setPlan = mutation({
  args: { secret: v.string(), runId: v.id("droidRuns"), plan: v.array(v.string()) },
  handler: async (ctx, { secret, runId, plan }) => {
    checkSecret(secret);
    await ctx.db.patch("droidRuns", runId, { plan, status: "running" });
    return null;
  },
});

export const upsertStep = mutation({
  args: { secret: v.string(), runId: v.id("droidRuns"), index: v.number(), label: v.string(), status: v.string(), output: v.union(v.string(), v.null()) },
  handler: async (ctx, { secret, runId, index, label, status, output }) => {
    checkSecret(secret);
    const existing = await ctx.db.query("droidSteps").withIndex("by_runId_and_index", (q) => q.eq("runId", runId).eq("index", index)).unique();
    const clipped = output && output.length > 4000 ? output.slice(0, 4000) + "…" : output;
    if (existing) await ctx.db.patch("droidSteps", existing._id, { label, status, output: clipped });
    else await ctx.db.insert("droidSteps", { runId, index, label, status, output: clipped });
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => { checkSecret(secret); return await ctx.storage.generateUploadUrl(); },
});

export const finish = mutation({
  args: {
    secret: v.string(), runId: v.id("droidRuns"), status: droidStatus, resultSummary: v.string(),
    report: v.union(v.object({ fileId: v.id("_storage"), title: v.string() }), v.null()),
  },
  handler: async (ctx, { secret, runId, status, resultSummary, report }) => {
    checkSecret(secret);
    const run = await ctx.db.get("droidRuns", runId);
    if (!run) throw new Error("no run");
    const reportId = report ? await ctx.db.insert("reports", { kind: run.kind, title: report.title, fileId: report.fileId, runId, createdAt: Date.now() }) : null;
    await ctx.db.patch("droidRuns", runId, { status, resultSummary, reportId, finishedAt: Date.now() });
    return null;
  },
});

const rowValidator = v.object({
  corridorId: v.string(), corridorName: v.string(), split: v.string(), predictedGapPct: v.number(),
  actualGapPct: v.union(v.number(), v.null()), directionCorrect: v.union(v.boolean(), v.null()), absErrorPts: v.union(v.number(), v.null()),
});

export const saveBacktest = mutation({
  args: { secret: v.string(), runId: v.union(v.id("droidRuns"), v.null()), rows: v.array(rowValidator), summary: v.any() },
  handler: async (ctx, { secret, runId, rows, summary }) => {
    checkSecret(secret);
    await ctx.db.insert("backtestResults", { runId, rows, summary, createdAt: Date.now() });
    return null;
  },
});

export const upsertGroundTruth = mutation({
  args: { secret: v.string(), rows: v.array(v.object({
    corridorId: v.string(), corridorName: v.string(), split: v.union(v.literal("calibration"), v.literal("holdout")),
    actualTreatedPct: v.number(), actualControlPct: v.number(), actualGapPct: v.number(), source: v.string() })) },
  handler: async (ctx, { secret, rows }) => {
    checkSecret(secret);
    for (const r of rows) {
      const existing = await ctx.db.query("groundTruth").withIndex("by_corridorId", (q) => q.eq("corridorId", r.corridorId)).unique();
      if (existing) await ctx.db.replace("groundTruth", existing._id, r);
      else await ctx.db.insert("groundTruth", r);
    }
    return null;
  },
});
