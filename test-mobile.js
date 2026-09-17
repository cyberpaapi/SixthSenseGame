"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const purchaseApi = require("./api/play-purchase");
assert.equal(purchaseApi.isOwnedPurchase({ purchaseState: 0, consumptionState: 0 }), true);
for (const purchaseState of [1, 2, undefined]) assert.equal(purchaseApi.isOwnedPurchase({ purchaseState, consumptionState: 0 }), false);
assert.equal(purchaseApi.isOwnedPurchase({ purchaseState: 0, consumptionState: 1 }), false);
assert.throws(() => purchaseApi.validateToken({ purchaseToken: "short" }));

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    for (const outcome of ["earned", "cancel", "failed"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const errors = []; page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(outcome => {
        if (window.top !== window) return;
        const listeners = {};
        const state = { owned: false, price: "₹79.00", eligible: true, ageBand: "18+", rewardReady: true, billingReady: true, pendingReward: {} };
        window.__nativeTest = { state, banners: [], watches: 0, notify: () => listeners.stateChanged?.({ ...state }) };
        const native = {
          addListener: async (event, handler) => { listeners[event] = handler; },
          getState: async () => ({ ...state }), initialize: async () => ({ ...state }),
          setBanner: async value => window.__nativeTest.banners.push(value.visible),
          showReward: async receipt => {
            window.__nativeTest.watches++;
            if (outcome === "failed") throw new Error("Ad failed to show");
            if (outcome === "earned") state.pendingReward = receipt;
            return { ...state };
          },
          acknowledgeReward: async () => { state.pendingReward = {}; },
          prepareReward: async () => ({ ...state }),
          purchaseRemoveAds: async () => {}, restorePurchases: async () => {}
        };
        window.Capacitor = { isNativePlatform: () => true, registerPlugin: name => name === "SenseiMonetization" ? native : { addListener: async () => {}, exitApp: async () => {}, open: async () => {} } };
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Mobile QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 7, coins: 250, totalPoints: 0 }));
      }, outcome);
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
      await page.evaluate(() => {
        localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({ version: 3, mode: "practice", answer: "planet", clue: "A world orbiting a star.", status: "playing", guesses: ["rattle", "castle"].map(guess => ({ guess, score: window.SixthSenseCore.scoreGuess(guess, "planet") })) }));
      });
      await page.click('[data-start-mode="practice"]');
      await page.keyboard.type("planet");
      await page.waitForSelector("#result-modal[open]");
      assert.match(await page.locator("#reward-ad-button").textContent(), /300 solve coins total/);
      const claimId = await page.evaluate(() => window.SixthSenseRewards.offer().claimId);
      await page.click("#reward-ad-button");
      await page.waitForFunction(() => !document.querySelector("#reward-ad-button").textContent.includes("Opening"));
      assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins), outcome === "earned" ? 550 : 350);
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).totalPoints), 500);
      if (outcome === "earned") {
        await page.evaluate(claimId => window.SixthSenseRewards.applyReceipt({ claimId, coins: 200 }), claimId);
        assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins), 550, "receipt replay must never grant again");
        assert.equal(await page.locator("#reward-ad-button").isDisabled(), true);
        assert.match(await page.locator("#result-coins").textContent(), /300 coins/);
        await page.evaluate(() => {
          window.__originalSetItem = Storage.prototype.setItem;
          Storage.prototype.setItem = function (key, value) {
            if (key === "sixth-sense.stats.v1") throw new Error("Storage full");
            return window.__originalSetItem.call(this, key, value);
          };
          window.__nativeTest.state.pendingReward = { claimId: crypto.randomUUID(), coins: 40 };
          window.__nativeTest.notify();
        });
        await page.waitForFunction(() => document.querySelector("#reward-ad-message").textContent.includes("Free up"));
        assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins), 550);
        assert(await page.evaluate(() => Boolean(window.__nativeTest.state.pendingReward.claimId)), "failed storage must retain native receipt");
        await page.evaluate(() => { Storage.prototype.setItem = window.__originalSetItem; window.__nativeTest.notify(); });
        await page.waitForFunction(() => window.SixthSenseEconomy.state().coins === 590);
      } else assert.match(await page.locator("#reward-ad-message").textContent(), outcome === "failed" ? /failed/ : /closed before/);
      assert.equal(await page.evaluate(() => window.__nativeTest.banners.at(-1)), false, "banners hide while the result dialog is open");
      for (const size of [{ width: 320, height: 568 }, { width: 360, height: 800 }, { width: 430, height: 932 }]) {
        await page.setViewportSize(size);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const button = await page.locator("#result-primary").boundingBox();
        assert(button.y >= 0 && button.y + button.height <= size.height, "OK must fit with the ad offer");
      }
      await page.click("#result-primary");
      await page.waitForFunction(() => window.__nativeTest.banners.at(-1) === true);
      await page.evaluate(() => { window.__nativeTest.state.owned = true; window.__nativeTest.notify(); });
      await page.waitForFunction(() => window.__nativeTest.banners.at(-1) === false);
      assert.match(await page.locator("#remove-ads-button").textContent(), /removed/);
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log("Mobile bridge QA passed: reward success/cancel/failure, exact 3× solve coins, unchanged points, duplicate prevention, small-phone UI, banner placement and verified-purchase UI.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
