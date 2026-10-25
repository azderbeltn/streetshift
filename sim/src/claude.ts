// Claude calls for StreetShift (explanations, merchant reports, stakeholder agents). Official
// Anthropic SDK; model names come from .env (ANTHROPIC_MODEL / ANTHROPIC_MODEL_FAST). Every response
// is cached to disk by (model, system, user) so reruns cost nothing.
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CACHE = join(dirname(fileURLToPath(import.meta.url)), "..", ".cache", "claude");
let client: Anthropic | null = null;

export type ClaudeOpts = { fast?: boolean; maxTokens?: number; effort?: "low" | "medium" | "high" };

/** Returns the text reply, or null when Claude is not configured. Throws on API errors or refusal. */
export async function claude(system: string, user: string, opts: ClaudeOpts = {}): Promise<string | null> {
  const model = opts.fast ? process.env.ANTHROPIC_MODEL_FAST : process.env.ANTHROPIC_MODEL;
  if (!process.env.ANTHROPIC_API_KEY || !model) return null;
  mkdirSync(CACHE, { recursive: true });
  const f = join(CACHE, `${createHash("sha256").update(JSON.stringify([model, system, user, opts.effort])).digest("hex").slice(0, 32)}.json`);
  if (existsSync(f)) return JSON.parse(readFileSync(f, "utf8")).text;

  client ??= new Anthropic();
  // Server-side refusal fallback: supported for Sonnet/Opus/Fable on the Claude API; Haiku has none.
  const withFallback = !/haiku/.test(model);
  const params: any = {
    model, max_tokens: opts.maxTokens ?? 2000, system, messages: [{ role: "user", content: user }],
    output_config: { effort: opts.effort ?? "low" },
  };
  const res: any = withFallback
    ? await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
    : await client.messages.create(params);
  if (res.stop_reason === "refusal") throw new Error(`claude refused (${res.stop_details?.category ?? "unknown"})`);
  if (res.stop_reason === "max_tokens") console.warn(`[claude] ${model} hit max_tokens (${params.max_tokens}); reply may be cut off`);
  const text = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
  writeFileSync(f, JSON.stringify({ model: res.model, text, usage: res.usage }), "utf8");
  return text;
}
