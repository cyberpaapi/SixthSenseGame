"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    for (const scenario of ["fresh", "slow", "existing", "unavailable", "initialize-failed"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      await page.addInitScript(scenario => {
        const state = { ageBand: scenario === "existing" ? "18+" : "", safeTop: 62, eligible: false, products: {}, pendingPurchases: [], pendingReward: {} };
        const native = {
          addListener: async (event, handler) => { if (event === "stateChanged") window.__nativeRotate = () => handler({ ...state, safeTop: 0 }); }, setBanner: async () => {},
          getState: async () => {
            if (scenario === "slow") await new Promise(resolve => setTimeout(resolve, 1200));
            if (scenario === "unavailable") throw new Error("Native service unavailable");
            return { ...state };
          },
          initialize: async ({ ageBand }) => {
            if (scenario === "initialize-failed") throw new Error("Storage unavailable");
            state.ageBand = ageBand; return { ...state };
          }
        };
        window.Capacitor = { isNativePlatform: () => true, registerPlugin: name => name === "SenseiMonetization" ? native : { addListener: async () => {} } };
      }, scenario);
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4273");
      if (["fresh", "slow", "initialize-failed"].includes(scenario)) {
        await page.locator("#age-band-modal[open]").waitFor();
        // Let the old username timer fire; it must not cover the age choices.
        await page.waitForTimeout(550);
        assert.deepEqual(await page.locator("dialog[open]").evaluateAll(nodes => nodes.map(node => node.id)), ["age-band-modal"]);
        await page.getByRole("button", { name: "Under 13", exact: true }).click();
      }
      await page.getByRole("button", { name: "Play solo as a guest", exact: true }).click();
      assert.equal(await page.locator("dialog[open]").count(), 0, scenario + " reaches home without trapped dialogs");
      if (scenario !== "unavailable") {
        assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue("--native-safe-top")), "62px");
        await page.evaluate(() => window.__nativeRotate());
        assert.equal(await page.evaluate(() => document.documentElement.style.getPropertyValue("--native-safe-top")), "0px", "rotation refreshes the native safe inset");
      }
      await page.close();
    }
    console.log("Native onboarding passed: fresh/delayed/existing age, service failure and storage failure all reach solo play without stacked dialogs.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
