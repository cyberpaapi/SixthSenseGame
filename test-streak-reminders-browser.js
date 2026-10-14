"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    for (const platform of ["web", "android", "denied"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(platform => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "StreakTester" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ effects: false, music: false }));
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 10, coins: 500, currentStreak: 7, maxStreak: 7, lastWinDate: yesterday, lastDailyRewardStreak: 7 }));
        window.__reminders = { enabled: false, allowed: platform !== "denied", changes: [], snapshots: [] };
        const reminders = {
          sync: async snapshot => { window.__reminders.snapshots.push(snapshot); return window.__reminders; },
          setEnabled: async ({ enabled }) => { window.__reminders.enabled = enabled; window.__reminders.changes.push(enabled); return window.__reminders; },
          consumeLaunch: async () => ({ openDaily: false }),
          addListener: async () => ({ remove: async () => {} })
        };
        const monetization = {
          getState: async () => ({ ageBand: "under13", eligible: false, products: {}, pendingPurchases: [], pendingReward: {} }),
          initialize: async () => ({ ageBand: "under13", eligible: false, products: {}, pendingPurchases: [], pendingReward: {} }),
          setBanner: async () => {}, addListener: async () => {}
        };
        if (platform !== "web") window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "android", registerPlugin: name => name === "StreakReminders" ? reminders : name === "SenseiMonetization" ? monetization : { addListener: async () => {} } };
      }, platform);
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4273");
      await page.waitForFunction(() => Boolean(window.SixthSenseDailyStreak));
      await page.evaluate(() => document.querySelector("#settings-modal").showModal());
      assert.equal(await page.locator("#streak-reminder-settings").isVisible(), platform !== "web");
      if (platform !== "web") {
        await page.locator("#streak-reminders").check({ force: true });
        await page.waitForFunction(() => window.__reminders.changes.length === 1);
        assert.match(await page.locator("#streak-reminder-status").textContent(), platform === "denied" ? /Blocked by Android/ : /12, 6 and 3 hours/);
        await page.locator("#streak-reminders").uncheck({ force: true });
        await page.waitForFunction(() => window.__reminders.changes.length === 2);
        assert.deepEqual(await page.evaluate(() => window.__reminders.changes), [true, false]);
        assert.equal(await page.evaluate(() => window.__reminders.snapshots.at(-1).count), 7);
      }
      await page.evaluate(() => document.querySelector("#settings-modal").close());
      await page.evaluate(() => window.SixthSenseDailyStreak.open());
      const answer = await page.evaluate(() => window.SixthSenseCore.dailyAnswer().word);
      await page.keyboard.type(answer);
      await page.locator("#result-modal[open]").waitFor();
      assert.equal(await page.locator("#streak-progress-count").textContent(), "8");
      if (platform !== "web") assert.equal(await page.evaluate(() => window.__reminders.snapshots.at(-1).count), 8);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log("Streak browser integration passed: native-only opt-in, denied/off feedback, Daily deep link, day 8 and native win synchronization.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
