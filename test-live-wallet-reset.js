"use strict";
const openLegacySolo = require("./test-legacy-solo-helper");
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      if (!localStorage.getItem("qa-wallet-seeded")) {
        localStorage.setItem("qa-wallet-seeded", "yes");
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 9, coins: 9876, played: 12, inventory: { peek: 3 }, adventure: { seed: 12345, level: 8 } }));
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Wallet QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      }
    });
    let policy = { resetVersion: 9, startingCoins: 500 };
    let offline = false;
    await context.route("**/economy.json?*", route => offline ? route.abort() : route.fulfill({ json: policy }));
    const first = await context.newPage(); const second = await context.newPage();
    const root = process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269";
    await first.goto(root); await second.goto(root);
    assert.equal(await first.locator("#coin-count").textContent(), "9876");
    await openLegacySolo(first, "practice"); await first.keyboard.type("pla");
    const savedPuzzle = await first.evaluate(() => localStorage.getItem("sixth-sense.practice.v1"));
    policy = { resetVersion: 10, startingCoins: 500 };
    await first.evaluate(() => window.dispatchEvent(new Event("focus")));
    for (const page of [first, second]) await page.waitForFunction(() => document.querySelector("#coin-count").textContent === "500");
    assert.equal(await first.evaluate(() => localStorage.getItem("sixth-sense.practice.v1")), savedPuzzle);
    const preserved = await first.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")));
    assert.equal(preserved.played, 12); assert.equal(preserved.inventory.peek, 3); assert.equal(preserved.adventure.level, 8);
    await first.evaluate(() => window.SixthSenseEconomy.credit(40));
    await second.waitForFunction(() => document.querySelector("#coin-count").textContent === "540");
    await second.evaluate(() => window.dispatchEvent(new Event("focus")));
    await second.waitForTimeout(200);
    assert.equal(await second.locator("#coin-count").textContent(), "540", "same reset must not erase later earnings");
    await first.reload();
    await first.waitForFunction(() => document.querySelector("#coin-count").textContent === "540");
    assert.equal(await first.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).economyVersion), 10, "bundled version must not downgrade a newer reset");
    offline = true;
    await first.evaluate(() => window.dispatchEvent(new Event("online")));
    await first.waitForTimeout(200);
    assert.equal(await first.locator("#coin-count").textContent(), "540");
    offline = false;
    // Simulate an old open tab overwriting the shared stats with its pre-reset wallet.
    await second.evaluate(() => {
      const stats = JSON.parse(localStorage.getItem("sixth-sense.stats.v1"));
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ ...stats, economyVersion: 6, coins: 99999 }));
    });
    await first.waitForFunction(() => document.querySelector("#coin-count").textContent === "500");
    await second.waitForFunction(() => document.querySelector("#coin-count").textContent === "500");
    await first.evaluate(() => window.SixthSenseEconomy.credit(40));
    policy = { resetVersion: 11, startingCoins: 500 };
    await first.waitForFunction(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).economyVersion === 11, null, { timeout: 35000 });
    assert.equal(await first.locator("#coin-count").textContent(), "500", "periodic check must reset an already-open updated page");
    console.log("Live wallet checks passed: foreground/30-second policy resets, cross-tab balance sync, stale legacy-write repair, exact 500, preserved puzzle/progress, offline recovery and no repeated reset after earning/reload.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
