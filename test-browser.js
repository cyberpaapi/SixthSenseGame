"use strict";

const assert = require("assert");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4173";
const evidenceDir = process.env.SIXTH_SENSE_EVIDENCE || path.resolve(__dirname, "../../work/sixth-sense-qa");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN || undefined
  });
  try {
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" });
    const page = await phone.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("#help-modal[open]");
    await page.click(".modal-got-it");
    assert.equal(await page.evaluate(() => window.SixthSenseCore.ANSWERS.length), 5000);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("rattle")), true);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("raffle")), true);
    assert.equal(await page.locator("#home-screen").isVisible(), true);
    assert.equal(await page.locator("#game-screen").isHidden(), true);
    assert.equal(await page.locator("[data-start-mode]").count(), 5);
    assert.equal(await page.locator(".mini-stats").count(), 0);
    assert.equal(await page.locator(".streak-rail").isVisible(), true);
    assert.equal(await page.locator("#streak-track").getAttribute("aria-valuenow"), "0");
    assert.match(await page.locator("#home-title").textContent(), /Seven chances/);
    assert.equal(await page.locator(".mode-tile img").count(), 4);
    assert.match(await page.locator(".lobby-hero-art").getAttribute("src"), /lobby-observatory-v2\.webp$/);
    assert.match(await page.locator(".brand-logo").getAttribute("src"), /logo-option-1\.png$/);
    await page.click('[data-start-mode="daily"]');
    assert.equal(await page.locator("#home-screen").isHidden(), true);
    assert.equal(await page.locator("#game-screen").isVisible(), true);
    assert.equal(await page.locator("#game-board .board-row").count(), 7);
    assert.equal(await page.locator("#game-board .tile").count(), 42);
    assert.equal(await page.locator("#keyboard .key").count(), 28);
    assert.equal(await page.locator(".game-card-head, #puzzle-label, #puzzle-heading, .mode-switch").count(), 0);
    assert.equal(await page.locator(".topbar .brand").isVisible(), true);
    assert.equal(await page.locator("#game-mode-label").textContent(), "Daily Puzzle");
    assert.equal(await page.locator(".mode-spark").count(), 0);
    assert.equal(await page.locator("#coin-count").textContent(), "20");
    assert.equal(await page.locator(".topbar #coin-wallet").isVisible(), true);
    assert.equal(await page.locator(".lifeline-button img").count(), 4);
    assert.equal(await page.locator(".lifeline-price:visible").count(), 4);
    assert.equal(await page.locator(".lifeline-stock:visible").count(), 0);
    assert.equal(await page.locator(".lifeline-heading").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("#keyboard + .lifeline-dock"))), true, "lifelines should sit below the keyboard");
    assert.equal(await page.locator(".topbar .brand-mark img").count(), 1);
    const layoutMetrics = await page.evaluate(() => {
      const board = document.querySelector("#game-board").getBoundingClientRect();
      const keyboard = document.querySelector("#keyboard").getBoundingClientRect();
      const centers = [...document.querySelectorAll(".lifeline-button")].map(button => {
        const rect = button.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });
      const steps = centers.slice(1).map((center, index) => center - centers[index]);
      return { boardKeyboardGap: keyboard.top - board.bottom, lifelineStepSpread: Math.max(...steps) - Math.min(...steps) };
    });
    assert(layoutMetrics.boardKeyboardGap >= 12, "keyboard must not overlap the last board row");
    assert(layoutMetrics.lifelineStepSpread <= 1, "lifeline icons should be equally spaced");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "phone view must not overflow horizontally");
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "game screen must not scroll vertically");
    await page.screenshot({ path: path.join(evidenceDir, "mobile-inventory-390x844.png"), fullPage: true });

    await page.click("#clue-button");
    assert.equal(await page.locator("#coin-count").textContent(), "17");
    assert.equal(await page.locator('[data-lifeline="sense"] .lifeline-stock').isVisible(), true);
    assert.equal(await page.locator('[data-lifeline="sense"] .lifeline-stock').textContent(), "1");
    assert.equal(await page.locator('[data-lifeline="sense"] .lifeline-price').isHidden(), true);
    await page.click("#clue-button");
    assert.match(await page.locator("#clue-copy").textContent(), /Sense:/);
    assert.equal(await page.locator("#coin-count").textContent(), "17");
    assert.equal(await page.locator("#toast").evaluate(el => el.classList.contains("is-hint")), true);
    const hintCenter = await page.locator("#toast").evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, viewportX: innerWidth / 2, viewportY: innerHeight / 2 };
    });
    assert(Math.abs(hintCenter.x - hintCenter.viewportX) <= 2, "Sense hint should be horizontally centered");
    assert(Math.abs(hintCenter.y - hintCenter.viewportY) <= 2, "Sense hint should be vertically centered");
    const firstHint = await page.locator("#toast").textContent();
    await page.click("#clue-button");
    assert.equal(await page.locator("#toast").textContent(), firstHint, "Sense should show the same hint again");
    assert.equal(await page.locator("#coin-count").textContent(), "17", "reopening Sense should not charge twice");
    await page.waitForTimeout(5100);
    assert.equal(await page.locator("#toast").isHidden(), true, "Sense hint should fade away after five seconds");
    await page.click("#peek-button");
    assert.equal(await page.locator("#coin-count").textContent(), "12");
    assert.equal(await page.locator('[data-lifeline="peek"] .lifeline-stock').textContent(), "1");
    await page.click("#peek-button");
    assert.equal(await page.locator("#game-board .tile.peeked").count(), 1);
    assert.equal(await page.locator("#coin-count").textContent(), "12");
    await page.click("#clear-button");
    assert.equal(await page.locator("#coin-count").textContent(), "8");
    await page.click("#clear-button");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")).eliminatedLetters.length), 3);
    assert.equal(await page.locator("#coin-count").textContent(), "8");
    await page.click("#skip-puzzle-button");
    assert.equal(await page.locator("#coin-count").textContent(), "2");
    assert.equal(await page.locator('[data-lifeline="skip"] .lifeline-stock').textContent(), "1");
    await page.click("#skip-puzzle-button");
    assert.equal(await page.locator("#skip-modal").isVisible(), true);
    await page.click("#cancel-skip-button");
    assert.equal(await page.locator("#coin-count").textContent(), "2", "cancelling Skip should keep the purchased token");
    assert.equal(await page.locator('[data-lifeline="skip"] .lifeline-stock').textContent(), "1");

    const probe = await page.evaluate(() => {
      const core = window.SixthSenseCore;
      const answer = core.dailyAnswer().word;
      for (const item of core.ANSWERS) {
        if (item.word === answer) continue;
        const score = core.scoreGuess(item.word, answer);
        const states = {};
        item.word.split("").forEach((letter, index) => {
          const priority = { absent: 1, present: 2, exact: 3 };
          if (!states[letter] || priority[score[index]] > priority[states[letter]]) states[letter] = score[index];
        });
        if (["exact", "present", "absent"].every(status => Object.values(states).includes(status))) return { guess: item.word, states };
      }
      throw new Error("No keyboard-state probe word found");
    });
    for (const letter of probe.guess) await page.click(`[data-key="${letter.toUpperCase()}"]`);
    await page.click('[data-key="ENTER"]');
    await page.waitForFunction(() => document.querySelectorAll('[data-row="0"] .tile.exact, [data-row="0"] .tile.present, [data-row="0"] .tile.absent').length === 6);
    const stateLetters = Object.fromEntries(["exact", "present", "absent"].map(status => [status, Object.keys(probe.states).find(letter => probe.states[letter] === status)]));
    await page.waitForFunction(({ stateLetters }) => Object.entries(stateLetters).every(([status, letter]) => document.querySelector(`[data-key="${letter.toUpperCase()}"]`)?.classList.contains(status)), { stateLetters });
    assert(await page.locator(`[data-key="${stateLetters.absent.toUpperCase()}"]`).evaluate(el => el.classList.contains("absent")), "absent keyboard letter should be dark");
    assert(await page.locator(`[data-key="${stateLetters.exact.toUpperCase()}"]`).evaluate(el => el.classList.contains("exact")), "exact keyboard letter should be green");
    assert(await page.locator(`[data-key="${stateLetters.present.toUpperCase()}"]`).evaluate(el => el.classList.contains("present")), "present keyboard letter should be orange");
    await page.waitForTimeout(2800);
    assert.equal(await page.locator("#toast").isHidden(), true, "valid guesses should not show a tries-left toast");

    const answer = await page.evaluate(() => window.SixthSenseCore.dailyAnswer().word);
    for (const letter of answer) await page.click(`[data-key="${letter.toUpperCase()}"]`);
    await page.click('[data-key="ENTER"]');
    await page.waitForSelector("#stats-modal[open]", { timeout: 4000 });
    assert.equal(await page.locator('[data-row="1"] .tile.exact').count(), 6);
    assert.equal(await page.locator("#share-button").isEnabled(), true);
    assert.equal(await page.locator("#coin-count").textContent(), "14", "a two-attempt solve should award 12 coins");
    assert.equal(await page.locator("#stat-coins").textContent(), "14");
    assert.equal(await page.locator("#streak-track").getAttribute("aria-valuenow"), "1");
    await page.click("#stats-modal .modal-close");
    await page.screenshot({ path: path.join(evidenceDir, "mobile-390x844.png"), fullPage: true });
    assert.deepEqual(errors, []);
    await phone.close();

    const compact = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const compactPage = await compact.newPage();
    await compactPage.addInitScript(() => localStorage.setItem("sixth-sense.visited.v1", "yes"));
    await compactPage.goto(baseUrl, { waitUntil: "networkidle" });
    await compactPage.click('[data-start-mode="daily"]');
    assert(await compactPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "360px game must not overflow horizontally");
    assert(await compactPage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "360×800 game must not scroll vertically");
    assert.equal(await compactPage.locator(".topbar #coin-wallet").isVisible(), true);
    assert.equal(await compactPage.locator(".lifeline-price:visible").count(), 4);
    await compact.close();

    const modes = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const modesPage = await modes.newPage();
    await modesPage.addInitScript(() => localStorage.setItem("sixth-sense.visited.v1", "yes"));
    await modesPage.goto(baseUrl, { waitUntil: "networkidle" });
    await modesPage.click('[data-modal-open="settings-modal"]');
    assert.equal(await modesPage.locator(".logo-choice").count(), 9);
    await modesPage.click('[data-logo-option="5"]');
    assert.match(await modesPage.locator(".brand-logo").getAttribute("src"), /logo-option-5\.png$/);
    assert.equal(await modesPage.locator('[data-logo-option="5"]').getAttribute("aria-pressed"), "true");
    assert.equal(await modesPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.settings.v1")).logo), 5);
    await modesPage.click("#settings-modal .modal-close");

    await modesPage.click('[data-start-mode="sprint"]');
    assert.equal(await modesPage.locator("#game-mode-label").textContent(), "Sprint Puzzle");
    assert.match(await modesPage.locator("#mode-detail").textContent(), /^\d{2}:\d{2}$/);
    assert(await modesPage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "Sprint game must not scroll");
    await modesPage.click(".brand");
    await modesPage.click('[data-start-mode="insight"]');
    assert.equal(await modesPage.locator("#game-mode-label").textContent(), "Insight Puzzle");
    assert.equal(await modesPage.locator("#game-board .tile.peeked").count(), 1);
    assert.match(await modesPage.locator("#clue-button").getAttribute("aria-label"), /show the clue again/);
    await modesPage.click(".brand");
    await modesPage.click('[data-start-mode="streak"]');
    assert.equal(await modesPage.locator("#game-mode-label").textContent(), "Streak Puzzle");
    assert.equal(await modesPage.locator("#mode-detail").textContent(), "0 win run");
    await modes.close();

    const repeats = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const repeatPage = await repeats.newPage();
    await repeatPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins: 50, inventory: { sense: 0, peek: 0, clear: 0, skip: 0 } }));
    });
    await repeatPage.goto(baseUrl, { waitUntil: "networkidle" });
    await repeatPage.click('[data-start-mode="daily"]');

    await repeatPage.click("#peek-button");
    assert.equal(await repeatPage.locator('[data-lifeline="peek"]').evaluate(el => el.classList.contains("is-purchased")), true, "Peek purchase should animate");
    await repeatPage.click("#peek-button");
    assert.equal(await repeatPage.locator("#game-board .tile.peeked").count(), 1);
    assert.equal(await repeatPage.locator('[data-lifeline="peek"] .lifeline-price').isVisible(), true, "Peek should be purchasable again after use");
    assert.equal(await repeatPage.locator("#peek-button").isEnabled(), true);
    await repeatPage.click("#peek-button");
    await repeatPage.click("#peek-button");
    assert.equal(await repeatPage.locator("#game-board .tile.peeked").count(), 2, "Peek should reveal another distinct position");
    assert.equal(await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")).peekUses), 2);

    await repeatPage.click("#clear-button");
    await repeatPage.click("#clear-button");
    assert.equal(await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")).eliminatedLetters.length), 3);
    assert.equal(await repeatPage.locator('[data-lifeline="clear"] .lifeline-price').isVisible(), true, "Clear should be purchasable again after use");
    await repeatPage.click("#clear-button");
    await repeatPage.click("#clear-button");
    const repeatedClear = await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")));
    assert.equal(repeatedClear.clearUses, 2);
    assert.equal(repeatedClear.eliminatedLetters.length, 6, "Clear should accumulate three new impossible letters per use");
    assert.equal(new Set(repeatedClear.eliminatedLetters).size, 6, "repeated Clear letters should remain unique");

    await repeatPage.click(".brand");
    await repeatPage.click('[data-start-mode="practice"]');
    await repeatPage.click("#skip-puzzle-button");
    await repeatPage.click("#skip-puzzle-button");
    await repeatPage.click("#confirm-skip-button");
    assert.equal(await repeatPage.locator('[data-lifeline="skip"] .lifeline-price').isVisible(), true, "Skip should be purchasable again after starting the fresh puzzle");
    await repeatPage.click("#skip-puzzle-button");
    await repeatPage.click("#skip-puzzle-button");
    assert.equal(await repeatPage.locator("#skip-modal").isVisible(), true, "a second purchased Skip should also be usable");
    await repeatPage.click("#cancel-skip-button");
    assert(await repeatPage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "repeatable lifelines must not introduce game-screen scrolling");
    await repeats.close();

    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
    const desk = await desktop.newPage();
    await desk.addInitScript(() => localStorage.setItem("sixth-sense.visited.v1", "yes"));
    await desk.goto(baseUrl, { waitUntil: "networkidle" });
    assert(await desk.locator(".streak-rail").isVisible());
    assert.equal(await desk.locator("#home-screen").isVisible(), true);
    assert(await desk.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "desktop view must not overflow horizontally");
    await desk.click('[data-modal-open="settings-modal"]');
    await desk.click('label:has(#dark-mode)');
    assert.equal(await desk.locator("body.is-dark").count(), 1);
    await desk.click("#settings-modal .modal-close");
    await desk.screenshot({ path: path.join(evidenceDir, "desktop-1440x1000-dark.png"), fullPage: true });
    await desktop.close();

    console.log("Browser QA passed: phone playthrough, result sheet, desktop layout, dark theme, and overflow checks.");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
