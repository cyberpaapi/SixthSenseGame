"use strict";
const openLegacySolo = require("./test-legacy-solo-helper");
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    for (const outcome of ["earned", "cancel", "failed", "coins", "storage"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 780 }, reducedMotion: "reduce" });
      await page.addInitScript(outcome => {
        const state = { eligible: true, ageBand: "18+", rewardReady: true, pendingReward: {} };
        const listeners = {};
        window.__qa = { state, calls: 0, notify: () => listeners.stateChanged?.({ ...state }) };
        window.Capacitor = { isNativePlatform: () => true, registerPlugin: name => name === "App" ? { addListener() {} } : {
          getState: async () => ({ ...state }), initialize: async () => ({ ...state }), setBanner: async () => {},
          addListener: (name, handler) => { listeners[name] = handler; },
          prepareReward: async () => ({ ...state }),
          showReward: async request => {
            window.__qa.calls++;
            if (outcome === "failed") throw Error("Ad failed");
            if (outcome !== "cancel") state.pendingReward = { ...request };
            if (outcome === "storage") {
              window.__setItem = Storage.prototype.setItem;
              Storage.prototype.setItem = function(key, value) {
                if (key === "sixth-sense.practice.v1") throw Error("Storage full");
                return window.__setItem.call(this, key, value);
              };
            }
            return { ...state };
          },
          acknowledgeReward: async () => { state.pendingReward = {}; }
        } };
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Last Chance QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ dark: true, music: false, effects: false }));
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 10, coins: 250 }));
      }, outcome);
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
      assert.equal(await page.evaluate(() => window.SixthSenseCore.MAX_GUESSES), 6);
      await page.evaluate(() => {
        const guesses = ["rattle", "castle", "bright", "silver", "purple"].map(guess => ({ guess, score: window.SixthSenseCore.scoreGuess(guess, "planet") }));
        localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({ version: 4, mode: "practice", answer: "planet", clue: "A world.", status: "playing", guesses }));
      });
      await openLegacySolo(page, "practice");
      assert.equal(await page.locator("#game-board .board-row").count(), 6);
      await page.keyboard.type("orange");
      await page.waitForSelector("#last-chance-modal[open]");
      assert.match(await page.locator("#last-chance-buy").textContent(), /125/);
      const coin = await page.locator("#last-chance-buy .coin-symbol").boundingBox();
      assert(coin && coin.width >= 15 && Math.abs(coin.width - coin.height) < 1, "coin must be round, not a collapsed inline stripe");
      if (outcome === "coins") await page.click("#last-chance-buy");
      else await page.click("#last-chance-ad");
      if (outcome === "storage") {
        await page.waitForFunction(() => document.querySelector("#last-chance-ad-message").textContent.includes("storage"));
        assert(await page.evaluate(() => Boolean(window.__qa.state.pendingReward.claimId)));
        assert.equal(await page.locator("#game-board .board-row").count(), 6);
        await page.evaluate(() => { Storage.prototype.setItem = window.__setItem; window.__qa.notify(); });
      }
      const unlocked = ["earned", "coins", "storage"].includes(outcome);
      if (unlocked) {
        await page.waitForSelector("#last-chance-modal[open]", { state: "hidden" });
        assert.equal(await page.locator("#game-board .board-row").count(), 7);
        assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins), outcome === "coins" ? 125 : 250);
        if (outcome !== "coins") {
          const receipt = await page.evaluate(() => ({ claimId: JSON.parse(localStorage.getItem("sixth-sense.practice.v1")).lastChanceClaimId, kind: "last-chance" }));
          await page.evaluate(receipt => window.SixthSenseLastChance.applyReceipt(receipt), receipt);
          assert.equal(await page.locator("#game-board .board-row").count(), 7, "replay cannot add another attempt");
        }
        await page.reload();
        await openLegacySolo(page, "practice");
        assert.equal(await page.locator("#game-board .board-row").count(), 7, "earned extra try must survive restart");
        await page.keyboard.type("planet");
        await page.waitForSelector("#result-modal[open]");
        assert.equal(await page.locator("#result-attempts").textContent(), "Solved in 7");
      } else {
        await page.waitForFunction(() => !document.querySelector("#last-chance-ad").disabled);
        assert.equal(await page.locator("#last-chance-modal[open]").count(), 1);
        assert.equal(await page.locator("#game-board .board-row").count(), 6);
        assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins), 250);
        await page.click("#last-chance-decline");
        await page.waitForSelector("#result-modal[open]");
        assert.equal(await page.locator("#result-attempts").textContent(), "6 tries used");
      }
      await page.close();
    }
    console.log("Last Chance: six tries, 125 coins or earned ad, cancel/failure, round coin, receipt replay, storage recovery and restart passed.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
