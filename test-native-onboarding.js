"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    for (const scenario of ["fresh", "yes", "slow", "existing", "existing-teen", "existing-13plus", "unavailable", "initialize-failed"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      await page.addInitScript(scenario => {
        const state = { ageBand: ({existing:"18+", "existing-teen":"13-15", "existing-13plus":"13+"})[scenario] || "", safeTop: 62, eligible: false, products: {}, pendingPurchases: [], pendingReward: {} };
        window.__ageCalls = [];
        const native = {
          addListener: async (event, handler) => { if (event === "stateChanged") window.__nativeRotate = () => handler({ ...state, safeTop: 0 }); }, setBanner: async () => {},
          getState: async () => {
            if (scenario === "slow") await new Promise(resolve => setTimeout(resolve, 1200));
            if (scenario === "unavailable") throw new Error("Native service unavailable");
            return { ...state };
          },
          initialize: async ({ ageBand }) => {
            window.__ageCalls.push(ageBand);
            if (scenario === "initialize-failed") throw new Error("Storage unavailable");
            state.ageBand = ageBand; return { ...state };
          }
        };
        window.Capacitor = { isNativePlatform: () => true, registerPlugin: name => name === "SenseiMonetization" ? native : { addListener: async () => {} } };
      }, scenario);
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4273");
      if (["fresh", "yes", "slow", "initialize-failed"].includes(scenario)) {
        await page.locator("#age-band-modal[open]").waitFor();
        // Let the old username timer fire; it must not cover the age choices.
        await page.waitForTimeout(550);
        assert.deepEqual(await page.locator("dialog[open]").evaluateAll(nodes => nodes.map(node => node.id)), ["age-band-modal"]);
        assert.equal(await page.locator('#age-under13-notice').isVisible(), false, 'no reward-ad explanation before age choice');
        assert.equal(await page.locator('[data-age-band]').count(), 2);
        assert.equal(await page.locator('[data-age-band="under13"]').isEnabled(), true, 'gray No button remains selectable');
        if (scenario === "fresh") {
          await page.locator('#age-band-modal [data-open-privacy]').click();
          const policy = page.frameLocator('[data-privacy-document]');
          await policy.getByText('AlphaCodeAI', { exact: true }).waitFor();
          await policy.getByRole('link', { name: 'Request deletion of your account or data' }).click();
          await policy.getByRole('heading', { name: 'Request deletion of your Sixth Sense account or data' }).waitFor();
          await page.getByRole('button', { name: 'Close privacy policy', exact: true }).click();
          assert.deepEqual(await page.locator('dialog[open]').evaluateAll(nodes => nodes.map(node => node.id)), ['age-band-modal'], 'reading privacy must not choose an age or bypass onboarding');
          if (process.env.AGE_PREVIEW_DIR) await page.screenshot({path:require('node:path').join(process.env.AGE_PREVIEW_DIR,'age-question.png')});
        }
        if (scenario === 'yes') {
          await page.locator('[data-age-band="13+"]').click();
          assert.equal(await page.locator('#age-under13-notice').isVisible(), false);
          assert.deepEqual(await page.evaluate(()=>window.__ageCalls), ['13+'], '13+ must never be recorded as 18+');
        } else {
          await page.locator('[data-age-band="under13"]').click();
          await page.locator('#age-under13-notice').waitFor();
          assert.match(await page.locator('#age-under13-notice').innerText(), /still earn coins by solving puzzles/);
          assert.deepEqual(await page.evaluate(()=>window.__ageCalls), ['under13']);
          assert.equal(await page.locator('#username-modal[open]').count(), 0, 'notice stays before username onboarding');
          if (scenario==='fresh') {
            await page.setViewportSize({width:320,height:568});
            const bounds = await page.locator('#age-under13-continue').boundingBox();
            assert(bounds.width>=44 && bounds.height>=44 && bounds.y>=0 && bounds.y+bounds.height<=568, 'under-13 continuation must fit a small phone');
            await page.setViewportSize({width:390,height:844});
          }
          if (scenario==='fresh' && process.env.AGE_PREVIEW_DIR) await page.screenshot({path:require('node:path').join(process.env.AGE_PREVIEW_DIR,'age-under13.png')});
          await page.getByRole('button', {name:'Continue playing',exact:true}).click();
        }
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
    console.log("Native onboarding passed: binary age choices, No-only reward explanation, 13+ privacy classification, legacy ages, offline policy and failure recovery.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
