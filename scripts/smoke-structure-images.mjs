// Smoke test: 10 events with PDF images render <img>; #15 #31 fall back to rotation table.
import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 3781;
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "/tmp/jopt-img-smoke";

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const proc = spawn("npm", ["run", "dev", "--", "-p", String(PORT)], {
  cwd: REPO,
  env: { ...process.env, NODE_ENV: "development" },
  stdio: ["ignore", "pipe", "pipe"],
});
let ready = false;
proc.stdout.on("data", (d) => { if (String(d).includes("Ready")) ready = true; });
const stop = async () => { proc.kill("SIGTERM"); await sleep(500); };

try {
  for (let i = 0; i < 90; i++) { if (ready) break; await sleep(500); }
  await sleep(1500);

  // Spot check: image static asset is served
  for (const file of ["46-p1.png", "131-p3.png", "86-p2.png"]) {
    const r = await fetch(`http://localhost:${PORT}/structure-pdfs/${file}`);
    console.log(`STATIC ${file}: HTTP ${r.status}, size ${(await r.arrayBuffer()).byteLength}`);
  }

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const targetsWithImage = ["#46", "#60", "#86", "#88", "#116", "#122", "#131", "#148", "#162", "#179"];
  const targetsFallback = ["#15", "#31"];
  const errorPattern = /(Something went wrong|TypeError|Cannot read properties|Application error)/i;

  async function check(num) {
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "networkidle" });
    try { await page.getByRole("button", { name: /^ALL$/i }).first().click({ timeout: 3000 }); await sleep(300); } catch {}
    const card = page.locator(`text=${num} `).first();
    await card.scrollIntoViewIfNeeded({ timeout: 5000 });
    await card.click({ timeout: 5000 });
    await sleep(400);
    await page.getByRole("button", { name: /^Structure$/ }).first().click({ timeout: 4000 });
    await sleep(500);
    const body = await page.textContent("body");
    const errMatch = (body || "").match(errorPattern);
    const notAvail = (body || "").includes("Structure not available");
    // Count <img> tags pointing to /structure-pdfs/
    const imgCount = await page.locator('img[src^="/structure-pdfs/"]').count();
    const tableCount = await page.locator('table').count();
    const fname = `${OUT}/${num.replace("#", "")}.png`;
    await page.screenshot({ path: fname, fullPage: false });
    return { num, status: errMatch ? `ERR:${errMatch[0]}` : notAvail ? "NOT_AVAIL" : "OK", imgCount, tableCount };
  }
  for (const n of targetsWithImage) {
    const r = await check(n);
    console.log(`IMG ${r.num.padEnd(5)} ${r.status} imgs=${r.imgCount} tables=${r.tableCount}`);
  }
  for (const n of targetsFallback) {
    const r = await check(n);
    console.log(`TBL ${r.num.padEnd(5)} ${r.status} imgs=${r.imgCount} tables=${r.tableCount}`);
  }
  await browser.close();
} finally {
  await stop();
}
