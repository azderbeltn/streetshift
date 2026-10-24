// End-to-end interaction tour with screenshots: pedestrianize, assumptions slider, add floors,
// click a person, add a park. Screens go to web/screenshots/tour-*.png.
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "screenshots");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shot = async (n) => { await page.screenshot({ path: join(out, `tour-${n}.png`) }); console.log("shot", n); };
const text = async (sel) => (await page.locator(sel).first().innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 160);

await page.goto("http://localhost:5173");
await page.waitForTimeout(10000);
const reset = page.getByRole("button", { name: /Reset all changes/ });
if (await reset.count()) { await reset.click(); await page.waitForTimeout(3000); }

// 1. Pedestrianize the corridor.
await page.getByRole("button", { name: /Pedestrianize this corridor/ }).click();
await page.waitForTimeout(7000);
console.log("chain:", await text(".chain"));
await shot("1-pedestrianized");

// 2. Assumptions: raise foot traffic, watch the verdict and numbers respond.
await page.getByRole("button", { name: /Assumptions/ }).click();
await page.waitForTimeout(800);
const slider = page.locator(".knob input[type=range]").first();
await slider.evaluate((el) => { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; s.call(el, "2"); el.dispatchEvent(new Event("input", { bubbles: true })); });
await page.waitForTimeout(6000);
console.log("connection after foot traffic x2:", await text(".right .panel"));
await shot("2-assumptions");
await page.getByRole("button", { name: /Reset all to calibrated/ }).click().catch(() => {});
await page.locator(".assumptions .close-x").click();
await page.waitForTimeout(3000);

// 3. Add floors: pick the tool and click buildings near the centre.
await page.getByRole("button", { name: /Add floors/ }).click();
for (const [x, y] of [[600, 520], [560, 470], [980, 520]]) { await page.mouse.click(x, y); await page.waitForTimeout(900); }
await page.waitForTimeout(5000);
console.log("toast/edits:", await text(".toast"), "|", await text(".left .panel .row:last-child"));
await shot("3-floors");

// 4. Click a person: click around the conversation cluster on the closed block.
await page.getByRole("button", { name: /Pedestrianize/ }).first().click();
let found = false;
const dots = await page.evaluate(() => ((window).__ss?.dots ?? []).map((ll) => { const p = (window).__map.project(ll); return [p.x, p.y]; }));
console.log("conversation dots on screen:", dots.length);
for (const [x, y] of dots) {
  await page.mouse.click(x, y); await page.waitForTimeout(400);
  if (await page.locator(".person").count()) { found = true; break; }
  console.log("  clicked", Math.round(x), Math.round(y), "->", await text(".popover h4") || "(no popover)");
  await page.keyboard.press("Escape");
}
console.log("person card:", found ? await text(".person") : "not found");
await shot("4-person");
await page.keyboard.press("Escape");

// 5. Add park on a side street segment near the corridor.
await page.getByRole("button", { name: /Add park/ }).click();
console.log("errors:", errors.slice(0, 5));
await browser.close();
