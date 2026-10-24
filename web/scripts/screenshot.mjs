// Playwright screenshots of the running app (CLAUDE.md Section 7).
//   node scripts/screenshot.mjs <name> [--corridor <label>] [--pedestrianize] [--backtest] [--wait ms]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const name = args[0] ?? "shot";
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const has = (k) => args.includes(k);
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "screenshots");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const logs = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(process.env.APP_URL ?? "http://localhost:5173", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(Number(opt("--wait") ?? 9000));
if (opt("--corridor")) { await page.getByText(opt("--corridor"), { exact: false }).first().click(); await page.waitForTimeout(7000); }
// Scenarios are shared (SpacetimeDB), so start from a clean slate.
const reset = page.getByRole("button", { name: /Reset all changes/ });
if (await reset.count()) { await reset.click(); await page.waitForTimeout(3000); }
if (has("--pedestrianize")) { await page.getByRole("button", { name: /Pedestrianize this corridor/ }).click(); await page.waitForTimeout(8000); }
if (has("--backtest")) {
  await page.getByRole("button", { name: "Backtest challenge" }).click(); await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) {
    const reveal = page.getByRole("button", { name: /Reveal what happened/ });
    if (await reveal.count()) { await reveal.click(); await page.waitForTimeout(700); if (i === 0) await page.screenshot({ path: join(out, `${name}-reveal.png`) }); }
    const next = page.getByRole("button", { name: /Next street|See the scoreboard/ });
    if (await next.count()) { await next.click(); await page.waitForTimeout(500); } else break;
  }
}
await page.screenshot({ path: join(out, `${name}.png`) });
console.log(`saved screenshots/${name}.png`);
if (logs.length) console.log(logs.slice(0, 15).join("\n"));
await browser.close();
