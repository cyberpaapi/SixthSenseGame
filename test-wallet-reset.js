"use strict";
const openLegacySolo = require("./test-legacy-solo-helper");
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  const root = process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269";
  try {
    for (const version of [undefined, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const page = await browser.newPage({ reducedMotion: "reduce" });
      await page.goto(root);
      const original = {
        economyVersion: version, coins: version === 1 ? 0 : 9876,
        played: 12, wins: 9, currentStreak: 3, maxStreak: 7,
        totalPoints: 4500, totalSolves: 9, completedWords: ["planet"],
        inventory: { sense: 2, peek: 3, clear: 4, skip: 1 },
        adventure: { seed: 12345, level: 8 }, rewardedClaims: { "prior-ad": 200 }
      };
      await page.evaluate(stats => {
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify(stats));
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Reset QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false, avatar: "dragon", unlockedAvatars: ["dragon"], decoration: "aurora", unlockedDecorations: ["aurora"] }));
        localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({ version: 4, mode: "practice", answer: "planet", clue: "A world orbiting a star.", status: "playing", guesses: [], maxGuesses: 6 }));
      }, original);
      await page.reload();
      const state = await page.evaluate(() => ({
        stats: JSON.parse(localStorage.getItem("sixth-sense.stats.v1")),
        settings: JSON.parse(localStorage.getItem("sixth-sense.settings.v1")),
        game: JSON.parse(localStorage.getItem("sixth-sense.practice.v1"))
      }));
      assert.equal(state.stats.coins, version === 9 ? 9876 : 500);
      assert.equal(state.stats.economyVersion, 9);
      for (const field of ["played", "wins", "currentStreak", "maxStreak", "totalPoints", "totalSolves", "completedWords", "inventory", "adventure", "rewardedClaims"]) assert.deepEqual(state.stats[field], original[field], `${field} must survive reset`);
      assert.equal(state.settings.avatar, "dragon");
      assert.deepEqual(state.settings.unlockedAvatars, ["dragon"]);
      assert.equal(state.settings.decoration, "aurora");
      assert.equal(state.game.answer, "planet");
      assert.equal(state.game.status, "playing");
      await openLegacySolo(page, "practice");
      await page.keyboard.type("planet");
      await page.waitForSelector("#result-modal[open]");
      const earned = await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).coins);
      assert.equal(earned, (version === 9 ? 9876 : 500) + 140);
      await page.reload();
      assert.equal(await page.locator("#coin-count").textContent(), String(earned), "reset must not repeat after earning/reload");
      await page.close();
    }
    const fresh = await browser.newPage();
    await fresh.goto(root);
    assert.equal(await fresh.locator("#coin-count").textContent(), "500");
    console.log("Wallet reset passed: legacy versions including v8, zero/high balances, v9 preservation, progress/inventory/cosmetics/receipt preservation, actual earnings and reload persistence, fresh 500 baseline.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
