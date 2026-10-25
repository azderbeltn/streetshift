// Opens the hearing on the current (pedestrianized) Hayes scenario, asks Maya a question, screenshots.
import { chromium } from "playwright";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "screenshots");
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("http://localhost:5173"); await page.waitForTimeout(10000);
if (!(await page.getByRole("button", { name: /Reopen to cars/ }).count())) { await page.getByRole("button", { name: /Pedestrianize this corridor/ }).click(); await page.waitForTimeout(5000); }
await page.getByRole("button", { name: /^Hearing/ }).click(); await page.waitForTimeout(800);
await page.getByRole("button", { name: /Open the hearing|Restart hearing/ }).click();
for (let i = 0; i < 40; i++) { await page.waitForTimeout(3000); if ((await page.locator(".turn").count()) >= 9) break; }
console.log("turns:", await page.locator(".turn").count());
await page.locator(".hearing .ask input").fill("Would you support it if the city added a loading zone for deliveries?");
await page.getByRole("button", { name: "Ask", exact: true }).click();
for (let i = 0; i < 20; i++) { await page.waitForTimeout(2000); if ((await page.locator(".turn").count()) >= 11) break; }
await page.locator(".turn .looked a").last().click().catch(() => {});
await page.waitForTimeout(800);
await page.screenshot({ path: join(out, "hearing.png") });
console.log("last turns:", (await page.locator(".turn .said").allInnerTexts()).slice(-2).map((s) => s.slice(0, 200)));
await browser.close();
