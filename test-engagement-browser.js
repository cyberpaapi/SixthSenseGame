"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");
const baseUrl = process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4173";
const evidence = process.env.SIXTH_SENSE_EVIDENCE || path.resolve(__dirname, "../work/sixth-sense-qa");

(async () => {
  fs.mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(baseUrl);
    await page.evaluate(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "ClueTester" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ effects: false, music: false }));
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 4, coins: 250, totalPoints: 2900, fastestSolve: { word: "planet", ms: 60000 } }));
    });
    for (const [index, word] of ["dipped", "rattle", "raffle"].entries()) {
      await page.evaluate(answer => localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({
        version: 3, mode: "practice", answer, clue: "A stale horse clue.", status: "playing",
        guesses: [], startedAt: Date.now() - 10000
      })), word);
      await page.reload();
      await page.click('[data-start-mode="practice"]');
      if (index === 0) {
        const before = await page.locator("#keyboard").boundingBox();
        await page.click("#clue-button");
        assert.match(await page.locator("#hint-dialog-copy").textContent(), /Lowered.*liquid/);
        assert.doesNotMatch(await page.locator("#hint-dialog-copy").textContent(), /horse/);
        await page.click("#hint-ok-button");
        await page.click("#clue-button");
        await page.click("#hint-ok-button");
        assert.equal(await page.locator("#coin-count").textContent(), "220", "reopening a corrected clue must be free");
        assert.deepEqual(await page.locator("#keyboard").boundingBox(), before, "hint must not displace the dock");
      }
      await page.keyboard.type(word);
      await page.waitForSelector("#result-modal[open]");
      assert.equal(await page.locator("#result-word span").count(), 6);
      assert(await page.locator("#result-word span").last().evaluate(element => Number(getComputedStyle(element).opacity) > .99), "reduced-motion users should see all six letters without a delayed reveal");
      assert.equal(await page.locator("#result-next").isVisible(), true);
      if (index === 0) {
        assert.match(await page.locator("#result-progress-label").textContent(), /Mastery up/);
        assert.match(await page.locator("#result-bonus").textContent(), /New fastest/);
      }
      if (index === 2) {
        assert.match(await page.locator("#result-coins").textContent(), /\+200 coins/);
        assert.match(await page.locator("#result-bonus").textContent(), /trio complete.*\+60/);
        for (const size of [{ width: 390, height: 844 }, { width: 360, height: 800 }, { width: 320, height: 568 }]) {
          await page.setViewportSize(size);
          const layout = await page.evaluate(() => {
            const ok = document.querySelector("#result-primary").getBoundingClientRect();
            return { right: ok.right, bottom: ok.bottom, width: innerWidth, height: innerHeight, scroll: document.documentElement.scrollWidth };
          });
          assert(layout.right <= layout.width && layout.scroll <= layout.width + 1, "result must not overflow horizontally");
          assert(layout.bottom <= layout.height, "OK must remain visible without scrolling the card");
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(evidence, "progression-victory.png") });
        await page.click("#result-next");
        assert.equal(await page.locator("#result-modal").isVisible(), false);
        // A new game is persisted on its first action, not merely on opening.
        await page.keyboard.type("a");
        const next = await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.practice.v1")));
        assert.notEqual(next.answer, word);
        assert.equal(next.guesses.length, 0);
        assert.equal(await page.locator("#game-screen").isVisible(), true);
      } else await page.click("#result-primary");
    }
    await page.reload();
    assert.equal(await page.locator("#coin-count").textContent(), "700", "solve rewards + single trio bonus persist without another wallet reset");
    assert.equal(await page.locator("#trio-count").textContent(), "3/3");
    assert.match(await page.locator("#trio-caption").textContent(), /Complete/);
    await page.locator(".progression-shelf").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(evidence, "progression-home.png") });
    await page.evaluate(() => document.body.classList.add("is-dark"));
    await page.screenshot({ path: path.join(evidence, "progression-home-dark.png") });
    assert.deepEqual(errors, []);
    console.log("Engagement browser QA passed: fresh saved clues, free reopening, fixed dock, trio bonus, mastery, personal best, Next word, persistence, and phone result sizing.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
