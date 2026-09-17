"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const Core = require("./game-core");
const attempts = [{ guess: "rattle", score: Core.scoreGuess("rattle", "battle") }];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  const root = process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269";
  try {
    for (const mode of ["practice", "vs", "race", "coop"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const stocked = mode === "race";
      await page.addInitScript(({ attempts, stocked }) => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Reveal QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 5, coins: 250, inventory: { peek: stocked ? 1 : 0 } }));
        localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({ version: 4, mode: "practice", answer: "battle", clue: "A fight.", status: "playing", guesses: attempts, maxGuesses: 6 }));
      }, { attempts, stocked });
      let requests = 0;
      if (mode !== "practice") {
        // Explicit API fixture; real authoritative candidate selection is checked in test-peek.js.
        const player = { id: "self", name: "Reveal QA", avatar: "fox", accent: "violet", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false };
        const snapshot = {
          room: { code: "PEEKQA", mode, difficulty: "easy", wordCount: 3, currentRound: 0, status: "running", revision: 1, maxGuesses: 6 },
          me: { ...player, isHost: true, attempts, lifelines: { round: 0, peeked: [] } },
          players: [player, { ...player, id: "other", name: "Friend", seat: 2 }]
        };
        await page.route("**/api/multiplayer", async route => {
          const body = route.request().postDataJSON();
          let effect;
          if (body.action === "lifeline") {
            assert.equal(body.kind, "peek");
            requests++;
            effect = { kind: "peek", position: 0, letter: "b" };
            snapshot.me.lifelines.peeked = [{ position: 0, letter: "b" }];
            snapshot.room.revision++;
          }
          await route.fulfill({ json: { roomCode: "PEEKQA", resumeToken: "qa-seat", playerId: "self", snapshot, effect } });
        });
      }
      await page.goto(root);
      if (mode === "practice") await page.click('[data-start-mode="practice"]');
      else { await page.click(`[data-open-online="${mode}"]`); await page.click("#online-create-room"); }
      const button = page.locator(mode === "practice" ? "#peek-button" : '[data-online-lifeline="peek"] button');
      await button.click();
      await page.waitForFunction(selector => document.querySelector(selector)?.disabled, mode === "practice" ? "#peek-button" : '[data-online-lifeline="peek"] button');
      const board = mode === "practice" ? "#game-board" : "#online-board";
      assert.equal(await page.locator(`${board} .peeked`).count(), 1);
      assert.equal((await page.locator(`${board} .peeked`).textContent()).toLowerCase(), "b");
      assert.equal(await page.locator("#coin-count").textContent(), stocked ? "250" : "200");
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).inventory.peek), 0);
      if (mode !== "practice") assert.equal(requests, 1);
      await page.close();
    }
    console.log("Reveal browser passed: solo/VS/Race/Co-op reveal only the non-green position, disable when exhausted, and spend one 50-coin purchase or one stocked item.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
