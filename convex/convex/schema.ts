import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Persistent StreetShift data. Live, high-churn world state (cursors, per-frame metrics) lives in
// SpacetimeDB; Convex keeps the durable record: saved scenarios, ground truth, backtest results,
// Droid run logs and generated reports (file storage).
export const droidStatus = v.union(v.literal("planning"), v.literal("running"), v.literal("done"), v.literal("failed"));

export default defineSchema({
  scenarios: defineTable({
    area: v.string(),
    corridorId: v.string(),
    name: v.string(),
    closedSegmentIds: v.array(v.string()),
    addedSeating: v.boolean(),
    programming: v.union(v.literal("none"), v.literal("light"), v.literal("heavy")),
    assumptions: v.record(v.string(), v.number()),
    summary: v.any(), // scenario_result row at save time
    createdAt: v.number(),
  }).index("by_area", ["area"]),

  groundTruth: defineTable({
    corridorId: v.string(),
    corridorName: v.string(),
    split: v.union(v.literal("calibration"), v.literal("holdout")),
    actualTreatedPct: v.number(),
    actualControlPct: v.number(),
    actualGapPct: v.number(),
    source: v.string(),
  }).index("by_corridorId", ["corridorId"]),

  backtestResults: defineTable({
    runId: v.union(v.id("droidRuns"), v.null()),
    rows: v.array(v.object({
      corridorId: v.string(), corridorName: v.string(), split: v.string(),
      predictedGapPct: v.number(), actualGapPct: v.union(v.number(), v.null()),
      directionCorrect: v.union(v.boolean(), v.null()), absErrorPts: v.union(v.number(), v.null()),
    })),
    summary: v.any(),
    createdAt: v.number(),
  }),

  droidRuns: defineTable({
    kind: v.union(v.literal("backtest"), v.literal("sweep")),
    status: droidStatus,
    plan: v.array(v.string()),
    resultSummary: v.union(v.string(), v.null()),
    reportId: v.union(v.id("reports"), v.null()),
    trigger: v.string(), // "ui" | "schedule"
    claimedAt: v.union(v.number(), v.null()),
    startedAt: v.number(),
    finishedAt: v.union(v.number(), v.null()),
  }).index("by_claimedAt", ["claimedAt"]),

  droidSteps: defineTable({
    runId: v.id("droidRuns"),
    index: v.number(),
    label: v.string(),
    status: v.string(),
    output: v.union(v.string(), v.null()),
  }).index("by_runId_and_index", ["runId", "index"]),

  reports: defineTable({
    kind: v.string(),
    title: v.string(),
    fileId: v.id("_storage"),
    runId: v.union(v.id("droidRuns"), v.null()),
    createdAt: v.number(),
  }),
});
