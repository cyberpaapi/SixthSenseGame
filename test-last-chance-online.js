"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    for (const mode of ["vs", "race", "coop"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 780 }, reducedMotion: "reduce" });
      await page.addInitScript(() => {
        const state = { eligible: true, ageBand: "18+", rewardReady: true, pendingReward: {} };
        window.__qa = { state, watches: 0 };
        window.Capacitor = { isNativePlatform: () => true, registerPlugin: name => name === "App" ? { addListener() {} } : {
          getState: async () => ({ ...state }), initialize: async () => ({ ...state }), setBanner: async () => {}, addListener() {},
          showReward: async request => { window.__qa.watches++; state.pendingReward = request; return { ...state }; },
          acknowledgeReward: async () => { state.pendingReward = {}; }
        } };
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Online ad QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 9, coins: 250 }));
      });
      const player = { id: "self", name: "Online ad QA", avatar: "fox", accent: "violet", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false };
      const snapshot = {
        room: { code: "ADTEST", mode, difficulty: "easy", wordCount: 3, currentRound: 0, status: "running", revision: 1, maxGuesses: 6, lastChanceAds: true },
        me: { ...player, isHost: true, failedBatches: 0, lifelines: { round: 0, lastChancePending: true }, attempts: Array.from({ length: 6 }, () => ({ guess: "rattle", score: Array(6).fill("absent") })) },
        players: [player, { ...player, id: "other", name: "Friend", seat: 2 }]
      };
      const requests = [];
      let fail = true;
      await page.route("**/api/multiplayer", async route => {
        const body = route.request().postDataJSON();
        if (body.action === "last_chance") {
          requests.push(body);
          if (fail) { fail = false; return route.fulfill({ status: 503, json: { error: "Temporary room outage" } }); }
          snapshot.me.lifelines = { round: 0, extraAttempt: true };
          snapshot.room.revision++;
        }
        await route.fulfill({ json: { roomCode: "ADTEST", resumeToken: "test-only-token", playerId: "self", snapshot } });
      });
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
      await page.click(`[data-open-online="${mode}"]`);
      await page.click("#online-create-room");
      await page.waitForSelector("#last-chance-modal[open]");
      assert.equal(await page.locator("#online-board .board-row").count(), 6);
      await page.click("#last-chance-ad");
      await page.waitForFunction(() => document.querySelector("#last-chance-ad-message").textContent.includes("Reward saved"));
      assert(await page.evaluate(() => Boolean(window.__qa.state.pendingReward.claimId)));
      await page.click("#last-chance-ad");
      await page.waitForSelector("#last-chance-modal[open]", { state: "hidden" });
      assert.equal(await page.locator("#online-board .board-row").count(), 7);
      assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins), 250);
      assert.equal(await page.evaluate(() => window.__qa.watches), 1, "network retry must not require another ad");
      assert.equal(requests.length, 2);
      assert.equal(requests[0].actionId, requests[1].actionId, "retry must use the same authoritative action id");
      assert.equal(requests[1].expectedRound, 0);
      assert.equal(requests[1].expectedFailedBatches, 0);
      await page.close();
    }
    console.log("Online Last Chance fixtures passed: VS/Race/Co-op, six plus one, no coin charge, earned-ad receipt retained across API failure and idempotent retry.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
