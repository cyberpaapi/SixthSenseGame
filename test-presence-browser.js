"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    for (const mode of ["vs", "race", "coop"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      await page.addInitScript(() => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Screen QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      });
      const player = { id: "self", name: "Screen QA", avatar: "fox", accent: "violet", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false, screenAway: false, awayCount: 0 };
      const snapshot = { room: { code: "SCREEN", mode, difficulty: "easy", wordCount: 3, currentRound: 0, status: "running", revision: 1, maxGuesses: 6, presenceEnabled: true }, me: { ...player, isHost: true, lifelines: {}, presenceSequence: 0 }, players: [player, { ...player, id: "other", name: "Friend", seat: 2 }] };
      const events = [];
      await page.route("**/api/multiplayer", async route => {
        const body = route.request().postDataJSON();
        if (body.action === "presence") {
          events.push(body); player.screenAway = body.away; if (body.away) player.awayCount++;
          snapshot.me.presenceSequence = body.sequence;
          return route.fulfill({ json: { accepted: true } });
        }
        await route.fulfill({ json: { roomCode: "SCREEN", resumeToken: "qa-seat", playerId: "self", snapshot } });
      });
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
      await page.click(`[data-open-online="${mode}"]`); await page.click("#online-create-room");
      await page.waitForSelector("#online-screen:not([hidden])");
      assert.equal(await page.locator('[data-online-lifeline="skip"]').isHidden(), true);
      await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
      await page.waitForSelector(mode === "race" ? ".race-token .is-away" : '.player-progress[data-player-id="self"] .is-away');
      if (mode === "vs") await page.screenshot({ path: require("node:path").join(process.env.TEMP, "presence-away.png") });
      assert.match(await page.locator("#online-presence-alert").textContent(), /Screen QA left/);
      assert.notEqual(await page.locator('.player-progress .is-away').first().evaluate(el => getComputedStyle(el).filter), "none");
      if (mode === "race") assert.equal(await page.locator(".race-token .is-away").count(), 1);
      await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
      await page.waitForFunction(() => !document.querySelector(".player-progress .is-away"));
      assert.deepEqual(events.map(event => event.away), [true, false]);
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent("sixth-sense-ad-active", { detail: true }));
        document.dispatchEvent(new CustomEvent("sixth-sense-native-active", { detail: false }));
        Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange"));
        Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange"));
        document.dispatchEvent(new CustomEvent("sixth-sense-native-active", { detail: true }));
        document.dispatchEvent(new CustomEvent("sixth-sense-ad-active", { detail: false }));
      });
      await page.waitForTimeout(1100);
      assert.equal(events.length, 2, "the game's rewarded ads must not cause an away event");
      for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 360 }, { width: 866, height: 294 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const geometry = await page.evaluate(() => ({ scroll: document.documentElement.scrollHeight, height: innerHeight, dock: document.querySelector(".online-lifeline-dock").getBoundingClientRect().bottom, key: document.querySelector(".online-keyboard .key").getBoundingClientRect().height }));
        assert(geometry.scroll <= geometry.height + 1 && geometry.dock <= geometry.height + 1 && geometry.key >= 44, "alert/controls must fit: " + JSON.stringify({ mode, ...geometry }));
      }
      await page.close();
    }
    console.log("Presence browser fixtures passed: VS/Race/Co-op alerts, red avatars, Away labels, return, ad/native exclusion, no phone overflow, no multiplayer Skip.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
