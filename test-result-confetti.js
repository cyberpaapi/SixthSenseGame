"use strict";
const openLegacySolo = require("./test-legacy-solo-helper");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    for (const scenario of ["win", "loss", "reduced"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: scenario === "reduced" ? "reduce" : "no-preference" });
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4173");
      await page.evaluate(scenario => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Confetti QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
        const words = scenario === "loss" ? ["rattle", "castle", "bright", "silver", "purple", "orange", "signal"] : ["rattle", "castle"];
        localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({ version: 3, mode: "practice", answer: "planet", clue: "A world orbiting a star.", status: scenario === "loss" ? "last-chance" : "playing", guesses: words.map(guess => ({ guess, score: window.SixthSenseCore.scoreGuess(guess, "planet") })) }));
      }, scenario);
      await page.reload();
      await openLegacySolo(page, "practice");
      if (scenario === "loss") await page.click("#last-chance-decline");
      else await page.keyboard.type("planet");
      await page.waitForSelector("#result-modal[open]");
      assert.equal(await page.locator("#result-confetti i").count(), scenario === "win" ? 56 : 0);
      if (scenario === "win") {
        const position = () => page.locator("#result-confetti i").first().evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
        const before = await position();
        await page.waitForTimeout(950);
        assert((await position()) > before + 50, "confetti must actually fall down the open card");
        assert.equal(await page.locator("#result-confetti").evaluate(el => getComputedStyle(el).pointerEvents), "none");
        if (process.env.SIXTH_SENSE_EVIDENCE) {
          fs.mkdirSync(process.env.SIXTH_SENSE_EVIDENCE, { recursive: true });
          await page.screenshot({ path: path.join(process.env.SIXTH_SENSE_EVIDENCE, "success-confetti.png") });
        }
        await page.click("#result-primary");
        await page.waitForFunction(() => document.querySelector("#result-confetti").childElementCount === 0);
        // Exercise the shared online card surface without simulating a multiplayer result.
        await page.evaluate(() => {
          const dialog = document.querySelector("#online-result-modal");
          dialog.showModal();
          window.SixthSenseDialogs.celebrateResult(dialog);
        });
        assert.equal(await page.locator("#online-result-modal .result-confetti i").count(), 56);
        await page.waitForFunction(() => document.querySelector("#online-result-modal .result-confetti").childElementCount === 0, null, { timeout: 6000 });
        await page.evaluate(() => window.SixthSenseDialogs.celebrateResult(document.querySelector("#online-result-modal")));
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.waitForFunction(() => document.querySelector("#online-result-modal .result-confetti").childElementCount === 0);
      }
      await page.close();
    }
    console.log("Confetti passed: actual win/loss, downward motion, click-through, close cleanup, online card surface, automatic expiry, and reduced-motion cancellation.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
