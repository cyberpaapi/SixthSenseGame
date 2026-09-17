"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  const evidence = process.env.SIXTH_SENSE_EVIDENCE;
  if (evidence) fs.mkdirSync(evidence, { recursive: true });
  try {
    for (const avatar of ["fox", "dragon"]) {
      for (const won of [true, false]) {
        const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4173");
        await page.evaluate(({ avatar, won }) => {
          localStorage.setItem("sixth-sense.visited.v1", "yes");
          localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Aryan" }));
          localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ avatar, unlockedAvatars: ["dragon"], effects: false, music: false }));
          localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 6, coins: 250, totalPoints: 1200 }));
          const words = won ? ["rattle", "castle"] : ["rattle", "castle", "bright", "silver", "purple", "orange", "signal"];
          localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({
            version: 3, mode: "practice", answer: "planet", clue: "A world orbiting a star.",
            status: won ? "playing" : "last-chance", startedAt: Date.now() - 45000,
            guesses: words.map(guess => ({ guess, score: window.SixthSenseCore.scoreGuess(guess, "planet") }))
          }));
        }, { avatar, won });
        await page.reload();
        await page.click('[data-start-mode="practice"]');
        if (won) await page.keyboard.type("planet");
        else await page.click("#last-chance-decline");
        await page.waitForSelector("#result-modal[open]");
        const art = page.locator("#result-avatar");
        assert(await art.evaluate((element, selected) => element.classList.contains(`avatar-${selected}`), avatar));
        assert.equal(await art.getAttribute("data-result-mood"), won ? "happy" : "sad");
        assert.equal(await art.locator(".party-hat").count(), won ? 1 : 0);
        assert.equal(await art.locator(".party-blower").count(), won ? 1 : 0);
        const source = await art.evaluate(element => getComputedStyle(element).backgroundImage);
        assert.match(source, new RegExp(avatar === "dragon" ? "avatar-exclusive" : "avatar-animals"));
        assert.equal(/sad-v\d/.test(source), !won);
        assert.equal(await page.locator("#result-coins").textContent(), won ? "+100 coins" : "No coins");
        await page.evaluate(async () => {
          await document.fonts.ready;
          const image = new Image();
          image.src = getComputedStyle(document.querySelector("#result-avatar")).backgroundImage.slice(5, -2);
          await image.decode();
        });
        if (evidence) {
          await page.locator("#result-modal").screenshot({ path: path.join(evidence, `${avatar}-${won ? "win" : "loss"}.png`) });
          if (won) await page.locator(".result-hero").screenshot({ path: path.join(evidence, `${avatar}-party-avatar.png`) });
        }
        for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 800 }, { width: 430, height: 932 }]) {
          await page.setViewportSize(viewport);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const ok = await page.locator("#result-primary").boundingBox();
          assert(ok.y >= 0 && ok.y + ok.height <= viewport.height + 1, "OK must remain visible on small phones");
          assert(await page.locator("#result-modal").evaluate(element => element.scrollWidth <= element.clientWidth), "result card must not overflow horizontally");
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
    console.log("Result avatars passed: selected base/premium identity, happy wins, sad losses, loaded artwork, unchanged rewards, and phone layouts.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
