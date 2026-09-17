"use strict";
// Start before publishing a new reset to verify actual open-client delivery.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const target = Number(process.env.WALLET_RESET_TARGET);
if (!Number.isSafeInteger(target) || target < 2) throw Error("Set WALLET_RESET_TARGET to the next unpublished reset generation");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const cases = [];
    for (const root of ["https://sixth-sense-game.vercel.app/", "https://cyberpaapi.github.io/SixthSenseGame/"]) {
      const policy = await (await fetch(root + "economy.json?check=" + Date.now())).json();
      assert(policy.resetVersion < target, "Start this check before deploying the target reset");
      for (const coins of [0, 9876]) {
        const page = await browser.newPage();
        await page.addInitScript(({ coins, version }) => {
          localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins, economyVersion: version, played: 12, inventory: { peek: 3 } }));
          localStorage.setItem("sixth-sense.visited.v1", "yes");
          localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Reset delivery QA" }));
          localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
        }, { coins, version: policy.resetVersion });
        await page.goto(root);
        assert.equal(await page.locator("#coin-count").textContent(), String(coins));
        cases.push({ page, root, coins });
      }
    }
    console.log(`READY: four real public pages remain open on the previous build, awaiting reset ${target}. No mocked policy or reload.`);
    await Promise.all(cases.map(async ({ page, root, coins }) => {
      await page.waitForFunction(version => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).economyVersion >= version, target, { timeout: 600000 });
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")));
      assert.equal(saved.coins, 500);
      assert.equal(saved.played, 12);
      assert.equal(saved.inventory.peek, 3);
      assert.equal(await page.locator("#coin-count").textContent(), "500");
      console.log(`${root}: open wallet ${coins} -> 500, generation ${saved.economyVersion}, progress retained.`);
    }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
