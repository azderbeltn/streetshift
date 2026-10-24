import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Saved scenarios: a planner bookmarks the current SpacetimeDB scenario with its results.
export const save = mutation({
  args: {
    area: v.string(), corridorId: v.string(), name: v.string(), closedSegmentIds: v.array(v.string()),
    addedSeating: v.boolean(), programming: v.union(v.literal("none"), v.literal("light"), v.literal("heavy")),
    assumptions: v.record(v.string(), v.number()), summary: v.any(),
  },
  handler: async (ctx, args) => await ctx.db.insert("scenarios", { ...args, createdAt: Date.now() }),
});

export const list = query({
  args: { area: v.string() },
  handler: async (ctx, { area }) => await ctx.db.query("scenarios").withIndex("by_area", (q) => q.eq("area", area)).order("desc").take(20),
});
