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
    await page.waitForSelector("#username-modal[open]");
    assert.equal(await page.locator("#help-modal").getAttribute("open"), null, "help must wait until the required first-open username is saved");
    await page.fill("#username-onboarding-input", "FoxPilot");
    await page.click("#username-onboarding-save");
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.online.identity.v1"))), { name: "FoxPilot" });
    await page.waitForSelector("#help-modal[open]");
    await page.click(".modal-got-it");
    assert.equal(await page.evaluate(() => window.SixthSenseCore.ANSWERS.length), 10187);
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.entries(window.SixthSenseCore.ANSWER_TIERS).map(([tier, words]) => [tier, words.length]))), { easy: 4058, medium: 2246, extreme: 3883 });
    assert.equal(await page.evaluate(() => window.SixthSenseCore.WORDS.size), 15232);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("rattle")), true);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("raffle")), true);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("coates")), false);
    assert.equal(await page.locator("#home-screen").isVisible(), true);
    assert.equal(await page.locator("#game-screen").isHidden(), true);
    assert.equal(await page.locator("[data-start-mode]").count(), 5);
    assert.equal(await page.locator("[data-open-online]").count(), 3);
    assert.equal(await page.locator("[data-open-adventure-map]").count(), 1);
    assert.equal(await page.locator("#adventure-feature").isVisible(), true);
    assert.match(await page.locator("#adventure-feature-art").getAttribute("src"), /adventure-zone-sky-ladder-v1\.webp$/);
    const primaryModeSizing = await page.evaluate(() => {
      const daily = document.querySelector(".lobby-hero").getBoundingClientRect();
      const adventure = document.querySelector(".adventure-feature").getBoundingClientRect();
      return { dailyHeight: daily.height, adventureHeight: adventure.height, viewportHeight: window.innerHeight };
    });
    assert(Math.abs(primaryModeSizing.dailyHeight - (primaryModeSizing.viewportHeight / 2)) <= 2, "Daily should occupy half the phone viewport");
    assert(Math.abs(primaryModeSizing.adventureHeight - (primaryModeSizing.viewportHeight / 2)) <= 2, "Adventure should occupy half the phone viewport");
    assert(Math.abs(primaryModeSizing.dailyHeight - primaryModeSizing.adventureHeight) <= 1, "Daily and Adventure should have equal visual weight");
    assert.doesNotMatch(await page.locator("#adventure-feature").textContent(), /10,187|4,309|1,995|3,883/, "Adventure entry should not confront new players with the full journey size");
    assert.doesNotMatch(await page.locator("#adventure-feature").textContent(), /\bEasy\b|Level\s+\d/i, "Adventure entry should not show difficulty or current-level hints");
    const adventureFeatureOrder = await page.evaluate(() => ({ adventure: document.querySelector("#adventure-feature").getBoundingClientRect().top, modes: document.querySelector(".mode-shelf").getBoundingClientRect().top }));
    assert(adventureFeatureOrder.adventure < adventureFeatureOrder.modes, "Adventure must sit above the smaller game modes");
    assert.equal(await page.locator(".mini-stats").count(), 0);
    assert.equal(await page.locator(".streak-rail").isVisible(), true);
    const homeControlSizing = await page.evaluate(() => {
      const headerButton = document.querySelector(".header-actions .icon-button").getBoundingClientRect();
      const headerArt = document.querySelector(".header-actions .icon-button img").getBoundingClientRect();
      const daily = document.querySelector(".daily-quest").getBoundingClientRect();
      const modeArt = document.querySelector(".mode-tile img").getBoundingClientRect();
      const modeShelf = document.querySelector(".mode-shelf").getBoundingClientRect();
      return { headerButton: headerButton.width, headerArt: headerArt.width, dailyHeight: daily.height, modeArtHeight: modeArt.height, modeShelfHeight: modeShelf.height };
    });
    assert(homeControlSizing.headerButton >= 44, "compact header art must retain a 44px touch target");
    assert(homeControlSizing.headerArt <= 36, "header artwork should remain visually compact");
    assert(homeControlSizing.dailyHeight <= 70, "Daily action should use the compact button treatment");
    assert(homeControlSizing.modeArtHeight < 130, "mode artwork should not dominate the home screen");
    assert(homeControlSizing.modeShelfHeight <= 250, "the phone mode launcher should remain compact");
    assert.equal(await page.locator("#mode-shelf-title").textContent(), "Pick your signal");
    assert.equal(await page.locator("#streak-track").getAttribute("aria-valuenow"), "0");
    assert.match(await page.locator("#home-title").textContent(), /Seven chances/);
    assert.equal(await page.locator(".mode-tile img").count(), 4);
    assert.match(await page.locator(".lobby-hero-art").getAttribute("src"), /lobby-observatory-v2\.webp$/);
    assert.match(await page.locator(".brand-wordmark img").getAttribute("src"), /logo-sixth-sense-clay-v1\.png$/);
    const brandLogoSizing = await page.locator(".brand-wordmark img").evaluate(image => {
      const rect = image.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    assert(brandLogoSizing.width <= 100 && brandLogoSizing.height <= 42, "the clay wordmark should remain compact in the phone header");
    assert(await page.locator("#brand-player-avatar").evaluate(element => element.classList.contains("avatar-fox")));
    await page.click('[data-start-mode="daily"]');
    assert.equal(await page.locator("#home-screen").isHidden(), true);
    assert.equal(await page.locator("#game-screen").isVisible(), true);
    assert.equal(await page.locator("#game-board .board-row").count(), 7);
    assert.equal(await page.locator("#game-board .tile").count(), 42);
    assert.equal(await page.locator("#keyboard .key").count(), 27);
    assert.equal(await page.locator('[data-key="ENTER"]').count(), 0, "automatic submission must remove the onscreen Enter key");
    assert.equal(await page.locator(".game-card-head, #puzzle-label, #puzzle-heading, .mode-switch").count(), 0);
    assert.equal(await page.locator(".topbar .brand").isVisible(), true);
    assert.equal(await page.locator("#game-mode-label").textContent(), "Daily Puzzle");
    assert.equal(await page.locator(".mode-spark").count(), 0);
    assert.equal(await page.locator("#coin-count").textContent(), "250");
    assert.equal(await page.locator(".topbar #coin-wallet").isVisible(), true);
    assert.equal(await page.locator("#game-screen .lifeline-button img").count(), 4);
    assert.equal(await page.locator("#game-screen .lifeline-price:visible").count(), 4);
    assert.equal(await page.locator("#game-screen .lifeline-stock:visible").count(), 0);
    const lifelineSizing = await page.locator("#game-screen .lifeline-button").first().evaluate(button => {
      const hit = button.getBoundingClientRect();
      const art = button.querySelector("img").getBoundingClientRect();
      return { hit: hit.width, art: art.width };
    });
    assert(lifelineSizing.hit >= 44, "lifeline touch targets must remain accessible");
    assert(lifelineSizing.art <= 40, "lifeline artwork should remain visually compact");
    assert.equal(await page.locator(".lifeline-heading").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("#keyboard + .lifeline-dock"))), true, "lifelines should sit below the keyboard");
    assert.equal(await page.locator(".topbar .profile-trigger .avatar-art").count(), 1);
    assert.equal(await page.locator('.topbar [data-modal-open="stats-modal"]').count(), 0, "Statistics should no longer occupy the game header");
    assert.equal(await page.locator(".topbar .profile-trigger").evaluate(element => getComputedStyle(element).boxShadow), "none", "the avatar must not sit on a raised square pedestal");
    const layoutMetrics = await page.evaluate(() => {
      const board = document.querySelector("#game-board").getBoundingClientRect();
      const keyboard = document.querySelector("#keyboard").getBoundingClientRect();
      const centers = [...document.querySelectorAll("#game-screen .lifeline-button")].map(button => {
        const rect = button.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });
      const steps = centers.slice(1).map((center, index) => center - centers[index]);
      return { boardKeyboardGap: keyboard.top - board.bottom, keyboardWidth: keyboard.width, boardWidth: board.width, lifelineStepSpread: Math.max(...steps) - Math.min(...steps) };
    });
    assert(layoutMetrics.boardKeyboardGap >= 12, "keyboard must not overlap the last board row");
    assert(layoutMetrics.keyboardWidth >= layoutMetrics.boardWidth, "the Daily keyboard must use the full puzzle width instead of shrinking around its letters");
    assert(layoutMetrics.lifelineStepSpread <= 1, "lifeline icons should be equally spaced");
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "phone view must not overflow horizontally");
    assert(await page.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "game screen must not scroll vertically");
    await page.screenshot({ path: path.join(evidenceDir, "mobile-inventory-390x844.png"), fullPage: true });

    const lifelineLayoutBeforeHint = await page.evaluate(() => {
      const dock = document.querySelector("#game-screen .lifeline-dock").getBoundingClientRect();
      const prices = [...document.querySelectorAll("#game-screen .lifeline-price:not([hidden])")].map(element => element.getBoundingClientRect());
      return { dockTop: dock.top, dockBottom: dock.bottom, priceBottom: Math.max(...prices.map(rect => rect.bottom)), viewportHeight: innerHeight };
    });
    await page.click("#clue-button");
    assert.equal(await page.locator("#coin-count").textContent(), "220");
    assert.equal(await page.locator('[data-lifeline="sense"] .lifeline-stock').isVisible(), true);
    assert.equal(await page.locator('[data-lifeline="sense"] .lifeline-stock').textContent(), "1");
    assert.equal(await page.locator('[data-lifeline="sense"] .lifeline-price').isHidden(), true);
    assert.doesNotMatch(await page.locator("#clue-copy").textContent(), /Sense:/, "Sense must not duplicate its clue in a layout-changing inline message");
    assert.equal(await page.locator("#hint-modal").isVisible(), true);
    assert.equal(await page.locator("#hint-ok-button").textContent(), "OK");
    const hintStyle = await page.locator("#hint-modal .popup-sheet").evaluate(el => ({ border: getComputedStyle(el).borderColor, background: getComputedStyle(el).backgroundColor, text: getComputedStyle(document.querySelector("#hint-dialog-copy")).color }));
    assert.match(hintStyle.border, /124, 58, 237/, "Sense popup should use a purple outline");
    assert.match(hintStyle.background, /rgba\(255, 255, 255, 0\.6\)/, "Sense popup should use a 60% white surface");
    assert.equal(hintStyle.text, "rgb(17, 17, 17)", "Sense popup text should stay black");
    await page.waitForTimeout(320);
    const hintCenter = await page.locator("#hint-modal").evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, viewportX: innerWidth / 2, viewportY: innerHeight / 2 };
    });
    assert(Math.abs(hintCenter.x - hintCenter.viewportX) <= 2, "Sense hint should be horizontally centered");
    assert(Math.abs(hintCenter.y - hintCenter.viewportY) <= 2, "Sense hint should be vertically centered");
    const lifelineLayoutDuringHint = await page.evaluate(() => {
      const dock = document.querySelector("#game-screen .lifeline-dock").getBoundingClientRect();
      const prices = [...document.querySelectorAll("#game-screen .lifeline-price:not([hidden])")].map(element => element.getBoundingClientRect());
      return { dockTop: dock.top, dockBottom: dock.bottom, priceBottom: Math.max(...prices.map(rect => rect.bottom)), viewportHeight: innerHeight };
    });
    assert(Math.abs(lifelineLayoutDuringHint.dockTop - lifelineLayoutBeforeHint.dockTop) <= 1, "Sense popup must not move the lifeline dock");
    assert(Math.abs(lifelineLayoutDuringHint.dockBottom - lifelineLayoutBeforeHint.dockBottom) <= 1, "Sense popup must not resize the lifeline dock");
    assert(lifelineLayoutDuringHint.priceBottom <= lifelineLayoutDuringHint.viewportHeight, "remaining lifeline prices must stay inside the phone viewport while Sense is open");
    assert.equal(await page.locator("#game-screen .lifeline-price:visible").count(), 3, "only the unlocked Sense price should disappear");
    const firstHint = await page.locator("#hint-dialog-copy").textContent();
    await page.click("#hint-ok-button");
    await page.click("#clue-button");
    assert.equal(await page.locator("#hint-dialog-copy").textContent(), firstHint, "Sense should show the same hint again");
    assert.equal(await page.locator("#coin-count").textContent(), "220", "reopening Sense should not charge twice");
    await page.click("#hint-ok-button");
    await page.click("#peek-button");
    assert.equal(await page.locator("#coin-count").textContent(), "170");
    assert.equal(await page.locator("#game-board .tile.peeked").count(), 1);
    assert.equal(await page.locator('[data-lifeline="peek"] .lifeline-price').isVisible(), true, "one tap should buy and immediately use Peek");
    await page.click("#clear-button");
    assert.equal(await page.locator("#coin-count").textContent(), "130");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")).eliminatedLetters.length), 3);
    await page.click("#skip-puzzle-button");
    assert.equal(await page.locator("#skip-modal").isVisible(), true);
    await page.click("#cancel-skip-button");
    assert.equal(await page.locator("#coin-count").textContent(), "130", "cancelling Skip should not buy or consume anything");

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
    await page.waitForFunction(() => document.querySelectorAll('[data-row="0"] .tile.exact, [data-row="0"] .tile.present, [data-row="0"] .tile.absent').length === 6);
    const stateLetters = Object.fromEntries(["exact", "present", "absent"].map(status => [status, Object.keys(probe.states).find(letter => probe.states[letter] === status)]));
    await page.waitForFunction(({ stateLetters }) => Object.entries(stateLetters).every(([status, letter]) => document.querySelector(`[data-key="${letter.toUpperCase()}"]`)?.classList.contains(status)), { stateLetters });
    assert(await page.locator(`[data-key="${stateLetters.absent.toUpperCase()}"]`).evaluate(el => el.classList.contains("absent")), "absent keyboard letter should be dark");
    assert(await page.locator(`[data-key="${stateLetters.exact.toUpperCase()}"]`).evaluate(el => el.classList.contains("exact")), "exact keyboard letter should be green");
    assert(await page.locator(`[data-key="${stateLetters.present.toUpperCase()}"]`).evaluate(el => el.classList.contains("present")), "present keyboard letter should be orange");
    await page.click('[data-modal-open="settings-modal"]');
    await page.click('label:has(#dark-mode)');
    await page.waitForTimeout(250);
    const darkKeyboardStyles = await page.evaluate(({ stateLetters }) => {
      const background = letter => getComputedStyle(document.querySelector(`[data-key="${letter.toUpperCase()}"]`)).backgroundImage;
      const untested = [...document.querySelectorAll("#keyboard .key")].find(key => !key.classList.contains("exact") && !key.classList.contains("present") && !key.classList.contains("absent"));
      return {
        exact: background(stateLetters.exact),
        present: background(stateLetters.present),
        absent: background(stateLetters.absent),
        untested: getComputedStyle(untested).backgroundImage,
        markers: Object.fromEntries(Object.entries(stateLetters).map(([status, letter]) => [status, document.querySelector(`[data-key="${letter.toUpperCase()}"] .key-marker`)?.textContent]))
      };
    }, { stateLetters });
    assert.equal(new Set([darkKeyboardStyles.exact, darkKeyboardStyles.present, darkKeyboardStyles.absent, darkKeyboardStyles.untested]).size, 4, "dark mode must keep exact, present, absent, and untested keys visually distinct");
    assert.deepEqual(darkKeyboardStyles.markers, { exact: "●", present: "◆", absent: "×" }, "dark-mode keyboard feedback must retain color-independent markers");
    await page.click('label:has(#dark-mode)');
    await page.click("#settings-modal .modal-close");
    await page.waitForTimeout(2800);
    assert.equal(await page.locator("#toast").isHidden(), true, "valid guesses should not show a tries-left toast");

    const answer = await page.evaluate(() => window.SixthSenseCore.dailyAnswer().word);
    for (const letter of answer) await page.click(`[data-key="${letter.toUpperCase()}"]`);
    await page.waitForSelector("#result-modal[open]", { timeout: 4000 });
    assert.equal(await page.locator('[data-row="1"] .tile.exact').count(), 6);
    assert.equal(await page.locator("#result-word span").count(), 6, "the victory screen should make the solved word the visual focus");
    assert.equal((await page.locator("#result-word").getAttribute("aria-label")).endsWith(answer.toUpperCase()), true);
    assert.equal(await page.locator("#result-attempts").textContent(), "Solved in 2");
    assert.equal(await page.locator("#result-coins").textContent(), "+120 coins");
    assert.equal(await page.locator("#result-points").textContent(), "+600 points");
    assert.equal(await page.locator("#result-primary").textContent(), "OK");
    assert.equal(await page.locator("#result-share").count(), 0, "the completion card should stay focused on the result and OK action");
    assert(await page.locator("#celebration .confetti").count() >= 70, "completion should trigger a full confetti burst");
    assert.equal(await page.locator("#celebration .confetti.is-cannon").count(), 20, "the victory card should receive a delayed two-sided confetti cannon");
    assert.equal(await page.locator("#result-confetti i").count(), 26, "the reward card should keep a visible confetti cascade above its backdrop");
    assert.equal(await page.locator("#result-modal img[src*='result-signal-crest-v1.webp']").count(), 1, "the victory art should be purpose-made and optimized");
    assert(await page.evaluate(() => document.querySelector("#result-modal").scrollWidth <= document.querySelector("#result-modal").clientWidth), "the result screen must not overflow horizontally");
    assert.equal(await page.locator("#stats-modal").getAttribute("open"), null, "ordinary Statistics must stay separate from the completion moment");
    assert.equal(await page.locator("#coin-count").textContent(), "250", "a two-attempt solve should award 120 coins after lifeline spending");
    assert.equal(await page.locator("#stat-coins").textContent(), "250");
    assert.equal(await page.locator("#streak-track").getAttribute("aria-valuenow"), "1");
    assert((await page.evaluate(() => window.SixthSenseAudio.state().scheduledEffects)) >= 9, "the solved row and victory moment should schedule layered completion audio");
    assert.deepEqual(await page.evaluate(() => window.SixthSenseAudio.state().lastCelebration), { hoots: 2, claps: 18 }, "victory audio must include the celebratory two-part hoot and background applause sequence");
    await page.waitForTimeout(850);
    await page.screenshot({ path: path.join(evidenceDir, "victory-result-390x844.png"), fullPage: true });
    await page.click("#result-primary");
    assert.equal(await page.locator("#home-screen").isVisible(), true, "OK should return a completed Daily puzzle to home");
    await page.click('[data-start-mode="daily"]');
    await page.waitForSelector("#result-modal[open]", { timeout: 1200 });
    assert.equal(await page.locator("#result-primary").textContent(), "OK", "reopening a finished Daily must restore its completion card");
    await page.click("#result-primary");
    await page.click('[data-start-mode="practice"]');
    await page.click('[data-key="A"]');
    await page.evaluate(() => history.back());
    await page.waitForSelector("#leave-game-modal[open]");
    assert.equal(await page.locator("#game-screen").isVisible(), true, "browser Back must not discard an active puzzle before confirmation");
    await page.click("#leave-game-cancel");
    assert.equal(await page.locator("#game-screen").isVisible(), true, "cancelling Back must keep the active puzzle");
    await page.evaluate(() => history.back());
    await page.waitForSelector("#leave-game-modal[open]");
    await page.click("#leave-game-confirm");
    await page.waitForSelector("#home-screen:not([hidden])");
    assert.equal(await page.locator("#home-screen").isVisible(), true, "confirmed browser Back must return to the previous in-app screen");
    assert.deepEqual(errors, []);
    await phone.close();

    const compact = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const compactPage = await compact.newPage();
    await compactPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "CompactFox" }));
    });
    await compactPage.goto(baseUrl, { waitUntil: "networkidle" });
    await compactPage.click('[data-start-mode="daily"]');
    assert(await compactPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "360px game must not overflow horizontally");
    assert(await compactPage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "360×800 game must not scroll vertically");
    assert.equal(await compactPage.locator(".topbar #coin-wallet").isVisible(), true);
    assert.equal(await compactPage.locator(".lifeline-price:visible").count(), 4);
    await compactPage.click(".brand");
    await compactPage.click("#leave-game-confirm");
    await compactPage.click("[data-open-adventure-map]");
    assert(await compactPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "360px Adventure map must not overflow horizontally");
    assert(await compactPage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "360×800 Adventure map must not scroll vertically");
    await compact.close();

    const cappedWallet = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const cappedWalletPage = await cappedWallet.newPage();
    await cappedWalletPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "CapFox" }));
      if (!localStorage.getItem("sixth-sense.stats.v1")) localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins: 99990, economyVersion: 3 }));
    });
    await cappedWalletPage.goto(baseUrl, { waitUntil: "networkidle" });
    assert.equal(await cappedWalletPage.evaluate(() => window.SixthSenseCore.MAX_COINS), 99999);
    assert.equal(await cappedWalletPage.locator("#coin-count").textContent(), "99990", "the wallet should render an existing five-digit balance");
    assert.equal(await cappedWalletPage.evaluate(() => window.SixthSenseEconomy.credit(50, "Cap test")), true);
    assert.equal(await cappedWalletPage.locator("#coin-count").textContent(), "99999", "rewards should stop exactly at the five-digit cap");
    assert.equal(await cappedWalletPage.evaluate(() => window.SixthSenseEconomy.credit(10, "Cap test")), true);
    assert.deepEqual(await cappedWalletPage.evaluate(() => { const stats = JSON.parse(localStorage.getItem("sixth-sense.stats.v1")); return { rendered: document.querySelector("#coin-count").textContent, saved: stats.coins }; }), { rendered: "99999", saved: 99999 }, "credits above the cap must neither render nor persist a sixth digit");
    assert(await cappedWalletPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "a five-digit wallet must fit the 360px header");
    await cappedWalletPage.reload({ waitUntil: "networkidle" });
    assert.equal(await cappedWalletPage.locator("#coin-count").textContent(), "99999", "the capped wallet should survive reload");
    await cappedWalletPage.evaluate(() => { const stats = JSON.parse(localStorage.getItem("sixth-sense.stats.v1")); stats.coins = 120000; localStorage.setItem("sixth-sense.stats.v1", JSON.stringify(stats)); });
    await cappedWalletPage.reload({ waitUntil: "networkidle" });
    assert.equal(await cappedWalletPage.locator("#coin-count").textContent(), "99999", "oversized saved balances should clamp back to the cap on load");
    await cappedWallet.close();

    const rewardContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const rewardPage = await rewardContext.newPage();
    const yesterdayKey = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await rewardPage.addInitScript(yesterday => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "RewardFox" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins: 0, economyVersion: 2, currentStreak: 6, maxStreak: 6, lastWinDate: yesterday, distribution: [0,0,0,0,0,0,0] }));
    }, yesterdayKey);
    await rewardPage.goto(baseUrl, { waitUntil: "networkidle" });
    assert.deepEqual(await rewardPage.evaluate(() => { const stats = JSON.parse(localStorage.getItem("sixth-sense.stats.v1")); return { coins: stats.coins, economyVersion: stats.economyVersion }; }), { coins: 250, economyVersion: 3 }, "every existing economy-v2 wallet should reset once to the new 250-coin baseline");
    await rewardPage.click('[data-start-mode="daily"]');
    const rewardAnswer = await rewardPage.evaluate(() => window.SixthSenseCore.dailyAnswer().word);
    for (const letter of rewardAnswer) await rewardPage.click(`[data-key="${letter.toUpperCase()}"]`);
    await rewardPage.waitForSelector("#result-modal[open]", { timeout: 4000 });
    assert.equal(await rewardPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")).streakReward), 300, "the seventh consecutive Daily solve must grant the scaled streak reward");
    assert.equal(await rewardPage.locator("#result-streak-reward").isVisible(), true, "the earned streak reward must be celebrated in the result screen");
    assert.equal(await rewardPage.locator("#result-coins").textContent(), "+440 coins", "the result should combine the one-try reward and seven-day bonus");
    await rewardContext.close();

    const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "StillFox" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
    });
    await reducedPage.goto(baseUrl, { waitUntil: "networkidle" });
    await reducedPage.click('[data-start-mode="daily"]');
    const reducedAnswer = await reducedPage.evaluate(() => window.SixthSenseCore.dailyAnswer().word);
    for (const letter of reducedAnswer) await reducedPage.click(`[data-key="${letter.toUpperCase()}"]`);
    await reducedPage.waitForSelector("#result-modal[open]", { timeout: 4000 });
    assert.equal(await reducedPage.locator("#celebration .confetti, #result-confetti i").count(), 0, "reduced-motion players should receive the complete result without optional confetti motion");
    assert.equal(await reducedPage.locator("#result-word span").count(), 6, "reduced motion must preserve the full solved-word result");
    await reducedContext.close();

    const adventure = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const adventurePage = await adventure.newPage();
    await adventurePage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "TrailFox" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
    });
    await adventurePage.goto(baseUrl, { waitUntil: "networkidle" });
    await adventurePage.click("[data-open-adventure-map]");
    assert.equal(await adventurePage.locator("#adventure-screen").isVisible(), true);
    assert.equal(await adventurePage.locator("#home-screen").isHidden(), true);
    assert.equal(await adventurePage.locator(".adventure-level-node").count(), 8, "each Adventure image should show eight consecutive levels");
    assert.equal(await adventurePage.locator(".adventure-ladder-rung").count(), 0, "the ladder must live in the generated artwork, not extra DOM");
    assert.equal(await adventurePage.locator('.adventure-level-node[aria-current="step"]').count(), 1);
    const ladderGeometry = await adventurePage.evaluate(() => {
      const boxes = [...document.querySelectorAll(".adventure-level-node")].map(node => node.getBoundingClientRect());
      const nodes = boxes.map(box => box.left + box.width / 2);
      const verticalGaps = boxes.slice(1).map((box, index) => Math.abs((box.top + box.height / 2) - (boxes[index].top + boxes[index].height / 2)));
      const path = document.querySelector(".adventure-level-path");
      return { centerSpread: Math.max(...nodes) - Math.min(...nodes), minimumRungGap: Math.min(...verticalGaps), rungSpacingSpread: Math.max(...verticalGaps) - Math.min(...verticalGaps), leftRail: getComputedStyle(path, "::before").content, rightRail: getComputedStyle(path, "::after").content };
    });
    assert(ladderGeometry.centerSpread <= 1, "the route nodes should form one vertical ladder");
    assert(ladderGeometry.minimumRungGap >= 56, "eight level markers should retain clear vertical breathing room");
    assert(ladderGeometry.rungSpacingSpread <= 2, "the route nodes should align to evenly spaced painted rungs");
    assert.equal(ladderGeometry.leftRail, "none", "the painted ladder should not be duplicated with a CSS left rail");
    assert.equal(ladderGeometry.rightRail, "none", "the painted ladder should not be duplicated with a CSS right rail");
    assert.equal(await adventurePage.locator("#adventure-map-tier, #adventure-current-title").count(), 0);
    assert.match(await adventurePage.locator("#adventure-map-art").getAttribute("src"), /adventure-zone-sky-ladder-v1\.webp$/);
    assert.equal(await adventurePage.locator("#adventure-play").textContent(), "Play");
    assert.doesNotMatch(await adventurePage.locator(".adventure-map-head, .adventure-map-foot").allTextContents().then(parts => parts.join(" ")), /\bEasy\b|Level\s+\d/i, "the map chrome should leave progression to the ladder itself");
    const homeIconAlignment = await adventurePage.locator("#adventure-back").evaluate(button => {
      const buttonBox = button.getBoundingClientRect();
      const image = button.querySelector("img");
      const imageBox = image.getBoundingClientRect();
      const opticalX = imageBox.left + imageBox.width * (140.262 / 256);
      const opticalY = imageBox.top + imageBox.height * (151.895 / 256);
      return { x: Math.abs(opticalX - (buttonBox.left + buttonBox.width / 2)), y: Math.abs(opticalY - (buttonBox.top + buttonBox.height / 2)), hit: buttonBox.width };
    });
    assert(homeIconAlignment.x < 1 && homeIconAlignment.y < 1, "the visible house artwork should be optically centered in its button");
    assert(Math.round(homeIconAlignment.hit) >= 44, "aligning the house artwork must preserve its touch target");
    assert.equal(await adventurePage.locator(".adventure-total-chip").count(), 0);
    assert.doesNotMatch(await adventurePage.locator("#adventure-screen").textContent(), /10,187|4,309|1,995|3,883/, "the current zone should stay focused on nearby levels");
    assert(await adventurePage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "Adventure map must fit the phone viewport without page scroll");
    assert(await adventurePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "Adventure map must not overflow horizontally");
    assert.equal(await adventurePage.locator("#adventure-lock-veil").count(), 0, "future pages must not cover the Adventure screen with a lock veil");
    const adventureNavAxis = await adventurePage.locator(".adventure-page-controls").evaluate(element => getComputedStyle(element).flexDirection);
    assert.equal(adventureNavAxis, "column", "Adventure page controls should follow the vertical ladder");
    const swipeAdventure = async ({ fromX, fromY, toX, toY }) => adventurePage.locator("#adventure-level-path").evaluate((pathElement, points) => {
      const start = new Touch({ identifier: 1, target: pathElement, clientX: points.fromX, clientY: points.fromY });
      const end = new Touch({ identifier: 1, target: pathElement, clientX: points.toX, clientY: points.toY });
      pathElement.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [start] }));
      pathElement.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [end] }));
    }, { fromX, fromY, toX, toY });
    await swipeAdventure({ fromX: 320, fromY: 430, toX: 70, toY: 430 });
    assert.match(await adventurePage.locator(".adventure-level-node").first().getAttribute("aria-label"), /level 1, current/, "horizontal swipes should no longer page Adventure");
    await swipeAdventure({ fromX: 195, fromY: 620, toX: 195, toY: 300 });
    assert.match(await adventurePage.locator(".adventure-level-node").first().getAttribute("aria-label"), /level 9, locked/, "an upward swipe should reveal the next eight levels");
    assert.equal(await adventurePage.locator(".adventure-level-node.is-locked").count(), 8, "future rungs should each carry their own locked state");
    assert.equal(await adventurePage.locator("#adventure-play").isDisabled(), true, "a future page cannot start a locked level");
    await swipeAdventure({ fromX: 195, fromY: 300, toX: 195, toY: 620 });
    assert.match(await adventurePage.locator(".adventure-level-node").first().getAttribute("aria-label"), /level 1, current/, "a downward swipe should return to lower levels");
    const adventureSeed = await adventurePage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).adventure.seed);
    assert.equal(await adventurePage.evaluate(seed => window.SixthSenseCore.adventureAnswer(0, seed).tier, adventureSeed), "easy");
    await adventurePage.click("#adventure-play");
    assert.equal(await adventurePage.locator("#game-screen").isVisible(), true);
    assert.equal(await adventurePage.locator("#game-mode-label").textContent(), "Adventure Puzzle");
    assert.equal(await adventurePage.locator("#mode-detail").isHidden(), true);
    assert.equal(await adventurePage.locator("#mode-detail").textContent(), "");
    const adventureAnswer = await adventurePage.evaluate(seed => window.SixthSenseCore.adventureAnswer(0, seed).word, adventureSeed);
    for (const letter of adventureAnswer) await adventurePage.click(`[data-key="${letter.toUpperCase()}"]`);
    await adventurePage.waitForSelector("#result-modal[open]", { timeout: 4000 });
    assert.equal(await adventurePage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).adventure.level), 1, "winning must advance exactly one Adventure level");
    assert.equal(await adventurePage.locator("#result-primary").textContent(), "OK", "Adventure wins should use the shared victory card");
    assert.equal(await adventurePage.locator("#result-points").textContent(), "+700 points");
    await adventurePage.click("#result-primary");
    assert.equal(await adventurePage.locator("#adventure-screen").isVisible(), true);
    assert.equal(await adventurePage.locator(".adventure-level-node").count(), 8, "level two should retain an eight-level image window");
    assert.equal(await adventurePage.locator('.adventure-level-node[aria-current="step"] .avatar-art').count(), 1);
    assert.equal(await adventurePage.locator('.adventure-level-node[aria-current="step"] small').textContent(), "2");
    const climbMotion = await adventurePage.locator('.adventure-level-node[aria-current="step"] .avatar-art').evaluate(element => ({ climbing: element.classList.contains("is-climbing"), animationName: getComputedStyle(element).animationName, distance: getComputedStyle(element).getPropertyValue("--climb-distance") }));
    assert.equal(climbMotion.climbing, true, "the avatar should climb from the completed rung after a win");
    assert.match(climbMotion.animationName, /adventure-token-climb/);
    assert(Number.parseFloat(climbMotion.distance) >= 56, "the avatar climb should cover a full visible rung");
    await adventurePage.waitForTimeout(180);
    await adventurePage.screenshot({ path: path.join(evidenceDir, "adventure-ladder-climb-390x844.png"), fullPage: true });
    await adventurePage.click("#profile-trigger");
    assert.equal(await adventurePage.locator("#profile-modal").isVisible(), true);
    assert.equal(await adventurePage.locator("#profile-words-solved").textContent(), "1");
    assert.equal(await adventurePage.locator("#profile-total-solves").textContent(), "1");
    assert.equal(await adventurePage.locator("#profile-best-attempts").textContent(), "1 try");
    assert.equal(await adventurePage.locator("#profile-fastest-word").textContent(), adventureAnswer.toUpperCase());
    assert.match(await adventurePage.locator("#profile-fastest-time").textContent(), /^Solved in /);
    assert.equal(await adventurePage.locator("#profile-zone").textContent(), "Adventure in progress");
    await adventurePage.click("#profile-modal .modal-close");
    await adventurePage.click("#adventure-play");
    await adventurePage.click("#skip-puzzle-button");
    await adventurePage.click("#confirm-skip-button");
    await adventurePage.waitForSelector("#result-modal[open]", { timeout: 4000 });
    await adventurePage.click("#result-primary");
    await adventurePage.waitForSelector("#adventure-screen:not([hidden])", { timeout: 1200 });
    assert.equal(await adventurePage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).adventure.level), 2, "Adventure Skip must return to the map and advance the token exactly one rung");
    await adventurePage.screenshot({ path: path.join(evidenceDir, "adventure-map-390x844.png"), fullPage: true });
    await adventure.close();

    const zoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const zonePage = await zoneContext.newPage();
    await zonePage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "ZoneFox" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ adventure: { seed: 123456, level: 4058 } }));
    });
    await zonePage.goto(baseUrl, { waitUntil: "networkidle" });
    await zonePage.click("[data-open-adventure-map]");
    assert.equal(await zonePage.locator(".adventure-level-node").count(), 8, "established players should see three previous, current, and four next levels");
    assert.equal(await zonePage.locator("#adventure-map-tier").count(), 0);
    assert.match(await zonePage.locator("#adventure-map-art").getAttribute("src"), /adventure-zone-ember-ladder-v1\.webp$/, "only the current zone art should be loaded into the map");
    await zoneContext.close();

    const modes = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const modesPage = await modes.newPage();
    await modesPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "ModeFox" }));
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins: 5000, economyVersion: 3 }));
    });
    await modesPage.goto(baseUrl, { waitUntil: "networkidle" });
    await modesPage.click('[data-modal-open="settings-modal"]');
    const settingsScrollStyle = await modesPage.locator("#settings-modal .modal-sheet").evaluate(element => ({ scrollbarWidth: getComputedStyle(element).scrollbarWidth, overflowY: getComputedStyle(element).overflowY, scrollable: element.scrollHeight > element.clientHeight }));
    assert.equal(settingsScrollStyle.scrollbarWidth, "none", "the settings popup scrollbar should be visually hidden");
    assert.equal(settingsScrollStyle.overflowY, "auto", "settings must remain scrollable after hiding the bar");
    assert.equal(settingsScrollStyle.scrollable, true, "the phone settings sheet should still have scrollable content");
    assert.equal(await modesPage.evaluate(() => getComputedStyle(document.documentElement).overflowY), "hidden", "the page scrollbar behind Settings should also be hidden");
    assert.equal(await modesPage.locator('.topbar [data-modal-open="stats-modal"]').count(), 0, "Statistics should be absent from the top bar");
    assert.equal(await modesPage.locator('#settings-modal [data-modal-open="stats-modal"]').isVisible(), true, "Settings should contain the Statistics action");
    await modesPage.click('#settings-modal [data-modal-open="stats-modal"]');
    assert.equal(await modesPage.locator("#stats-modal").isVisible(), true, "the Settings Statistics action should open the statistics sheet");
    assert.equal(await modesPage.locator("#stat-coins").textContent(), "5000");
    await modesPage.click("#stats-modal .modal-close");
    assert.equal(await modesPage.locator("#settings-modal").isVisible(), true, "closing Statistics should return to Settings");
    assert.equal(await modesPage.locator("#music-mode").isChecked(), true, "music should be enabled by default");
    assert.equal(await modesPage.locator("#effects-mode").isChecked(), true, "sound effects should be enabled by default");
    await modesPage.click('label:has(#music-mode)');
    await modesPage.click('label:has(#effects-mode)');
    assert.deepEqual(await modesPage.evaluate(() => { const s=JSON.parse(localStorage.getItem("sixth-sense.settings.v1")); return { music:s.music, effects:s.effects }; }), { music: false, effects: false });
    await modesPage.click('label:has(#effects-mode)');
    await modesPage.click('label:has(#music-mode)');
    await modesPage.waitForTimeout(120);
    const audioState = await modesPage.evaluate(() => window.SixthSenseAudio.state());
    assert.deepEqual({ music: audioState.music, effects: audioState.effects, unlocked: audioState.unlocked, musicRunning: audioState.musicRunning }, { music: true, effects: true, unlocked: true, musicRunning: true }, "music and effects should restart independently after a user gesture");
    assert(audioState.scheduledEffects >= 2, "sound-effect interactions should reach the audio engine");
    assert.equal(await modesPage.locator(".avatar-choice").count(), 18);
    assert.equal(await modesPage.locator("[data-decoration-option]").count(), 5);
    assert.equal(await modesPage.locator("[data-accent-option]").count(), 8);
    await modesPage.click('[data-avatar-option="tiger"]');
    await modesPage.click('[data-accent-option="aqua"]');
    assert.equal(await modesPage.locator('[data-avatar-option="tiger"]').getAttribute("aria-pressed"), "true");
    assert(await modesPage.locator("#brand-player-avatar").evaluate(element => element.classList.contains("avatar-tiger")), "the chosen avatar should immediately replace the header icon");
    assert.equal(await modesPage.locator('[data-accent-option="aqua"]').getAttribute("aria-pressed"), "true");
    assert.deepEqual(await modesPage.evaluate(() => { const s=JSON.parse(localStorage.getItem("sixth-sense.settings.v1")); return { avatar:s.avatar, accent:s.accent }; }), { avatar: "tiger", accent: "aqua" });
    await modesPage.click('[data-avatar-option="red-panda"]');
    assert(await modesPage.locator("#brand-player-avatar").evaluate(element => element.classList.contains("avatar-red-panda")), "a purchased premium avatar should apply immediately");
    assert.equal(await modesPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).coins), 2750, "premium avatars must spend their 50× cosmetic price");
    await modesPage.click('[data-decoration-option="aurora"]');
    assert.equal(await modesPage.locator("#brand-player-avatar").getAttribute("data-decoration"), "aurora", "a purchased highlight should apply immediately");
    assert.equal(await modesPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).coins), 1250, "premium highlights must spend their 50× cosmetic price");
    assert.equal(await modesPage.locator("#settings-username").inputValue(), "ModeFox");
    await modesPage.fill("#settings-username", "TigerNova");
    await modesPage.click("#save-settings-username");
    assert.deepEqual(await modesPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.online.identity.v1"))), { name: "TigerNova" }, "Identity Studio must persist username changes");
    assert.equal(await modesPage.locator("#settings-username-message").textContent(), "Saved.");
    await modesPage.click("#settings-modal .modal-close");
    await modesPage.click("#profile-trigger");
    assert.equal(await modesPage.locator("#profile-name").textContent(), "TigerNova", "profile must show the chosen username");
    await modesPage.click("#profile-customize");
    assert.equal(await modesPage.locator("#settings-modal").isVisible(), true, "the top-left avatar profile must link to avatar controls");
    await modesPage.click("#settings-modal .modal-close");

    await modesPage.click('[data-start-mode="sprint"]');
    assert.equal(await modesPage.locator("#game-mode-label").textContent(), "Time Tackle");
    assert.match(await modesPage.locator("#mode-detail").textContent(), /^\d{2}:\d{2}$/);
    assert(await modesPage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "Time Tackle game must not scroll");
    await modesPage.click(".brand");
    await modesPage.click("#leave-game-confirm");
    await modesPage.click('[data-start-mode="insight"]');
    assert.equal(await modesPage.locator("#game-mode-label").textContent(), "Insight Puzzle");
    assert.equal(await modesPage.locator("#game-board .tile.peeked").count(), 1);
    assert.match(await modesPage.locator("#clue-button").getAttribute("aria-label"), /show the clue again/);
    await modesPage.click(".brand");
    await modesPage.click("#leave-game-confirm");
    await modesPage.click('[data-start-mode="streak"]');
    assert.equal(await modesPage.locator("#game-mode-label").textContent(), "Streak Puzzle");
    assert.equal(await modesPage.locator("#mode-detail").textContent(), "0 win run");
    await modes.close();

    const online = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const onlinePage = await online.newPage();
    await onlinePage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "TigerAce" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ avatar: "tiger", accent: "aqua", music: false, effects: false }));
    });
    const createdSnapshot = {
      room: { code: "DUEL55", mode: "vs", difficulty: "easy", wordCount: 9, endless: true, currentRound: 0, lastRoundWinnerPlayerId: null, status: "waiting", revision: 1, winnerPlayerId: null },
      me: { id: "self", isHost: true, currentWordIndex: 0, attempts: [], score: 0, finished: false, eliminated: false },
      players: [{ id: "self", name: "TigerAce", avatar: "tiger", accent: "aqua", accentHex: "#078995", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false, eliminated: false }]
    };
    const raceCreatedSnapshot = {
      room: { code: "RACE55", mode: "race", difficulty: "easy", wordCount: 3, endless: false, currentRound: 0, lastRoundWinnerPlayerId: null, status: "waiting", revision: 1, winnerPlayerId: null },
      me: { id: "self", isHost: true, currentWordIndex: 0, attempts: [], score: 0, finished: false, eliminated: false, lifelines: {} },
      players: [{ id: "self", name: "TigerAce", avatar: "tiger", accent: "aqua", accentHex: "#078995", decoration: "none", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false, eliminated: false }]
    };
    let sharedRound = 0;
    let selfLifelines = {};
    const versusSnapshot = viewerId => ({
      room: { code: "SENSE6", mode: "vs", difficulty: "easy", wordCount: 9, endless: false, currentRound: sharedRound, lastRoundWinnerPlayerId: sharedRound ? "host" : null, status: "running", revision: 2 + sharedRound, winnerPlayerId: null },
      me: { id: viewerId, isHost: viewerId === "host", currentWordIndex: sharedRound, attempts: [], score: viewerId === "host" && sharedRound ? 1 : 0, finished: false, eliminated: false, lifelines: viewerId === "self" ? selfLifelines : {} },
      players: [
        { id: "host", name: "OwlStar", avatar: "owl", accent: "violet", accentHex: "#7c45e8", seat: 1, currentWordIndex: sharedRound, attempts: sharedRound ? [] : [["absent","present","exact","absent","present","absent"]], score: sharedRound ? 1 : 0, finished: false, eliminated: false },
        { id: "self", name: "TigerAce", avatar: "tiger", accent: "aqua", accentHex: "#078995", seat: 2, currentWordIndex: sharedRound, attempts: [], score: 0, finished: false, eliminated: false }
      ]
    });
    let createPayload = null;
    let submittedOnlineGuess = null;
    const mockOnlineApi = async route => {
      const body = route.request().postDataJSON();
      let payload;
      if (body.action === "create") {
        createPayload = body;
        const isRace = body.mode === "race";
        payload = { roomCode: isRace ? "RACE55" : "DUEL55", resumeToken: "create-token", playerId: "self", snapshot: isRace ? raceCreatedSnapshot : createdSnapshot };
      } else if (body.action === "join") {
        const viewerId = body.player.name === "OwlStar" ? "host" : "self";
        payload = { roomCode: "SENSE6", resumeToken: `${viewerId}-token`, playerId: viewerId, snapshot: versusSnapshot(viewerId) };
      } else if (body.action === "lifeline") {
        selfLifelines = { round: sharedRound, clue: "A test clue", peeked: [], eliminatedLetters: [] };
        payload = { effect: { kind: "sense", clue: "A test clue" }, snapshot: versusSnapshot("self") };
      } else if (body.action === "guess") {
        submittedOnlineGuess = body.guess;
        payload = { snapshot: versusSnapshot("self") };
      } else if (body.resumeToken === "create-token") payload = { snapshot: createPayload?.mode === "race" ? raceCreatedSnapshot : createdSnapshot };
      else payload = { snapshot: versusSnapshot(body.resumeToken === "host-token" ? "host" : "self") };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    };
    await onlinePage.route("**/api/multiplayer", mockOnlineApi);
    await onlinePage.goto(baseUrl, { waitUntil: "networkidle" });
    assert.match(await onlinePage.locator(".online-mode-art-coop").evaluate(element => getComputedStyle(element).backgroundImage), /multiplayer-coop-v1\.webp/, "Co-op must use its original generated team artwork");
    await onlinePage.click('[data-open-online="coop"]');
    assert.equal(await onlinePage.locator("#online-lobby-kicker").textContent(), "Co-op journey");
    assert.deepEqual(await onlinePage.locator('input[name="online-distance"]').evaluateAll(inputs => inputs.map(input => input.value)), ["3", "5", "10"], "Co-op must offer 3, 5, and 10 shared words");
    await onlinePage.click("#online-lobby-modal .modal-close");
    await onlinePage.click('[data-open-online="vs"]');
    assert.equal(await onlinePage.locator("#online-distance-options").isVisible(), true, "VS should expose the shared game-length control");
    assert.equal(await onlinePage.locator("#online-distance-options legend").textContent(), "Game length");
    assert.deepEqual(await onlinePage.locator('#online-difficulty-options span').allTextContents(), ["Normal", "Hard", "Extreme"], "player-facing difficulties must use the Normal/Hard/Extreme scale");
    assert.deepEqual(await onlinePage.locator('input[name="online-distance"]').evaluateAll(inputs => inputs.map(input => input.value)), ["3", "5", "9", "endless"], "VS must offer 3, 5, 9, and Endless");
    await onlinePage.locator('label:has(input[name="online-distance"][value="endless"])').click();
    assert.equal(await onlinePage.locator("#online-player-name").inputValue(), "TigerAce", "online rooms must use the saved username");
    assert.equal(await onlinePage.locator("#online-player-name").getAttribute("readonly"), "", "the room lobby must not fork the saved identity");
    await onlinePage.click("#online-create-room");
    await onlinePage.waitForSelector("#online-screen:not([hidden])");
    assert.equal(createPayload.mode, "vs");
    assert.equal(createPayload.wordCount, "endless", "VS room creation must send Endless to the authoritative API");
    assert.equal(await onlinePage.locator("#online-room-title").textContent(), "Normal · Endless");
    assert.equal(await onlinePage.locator("#online-leave").textContent().then(text => text.trim()), "Back", "multiplayer must expose a clear Back action");
    assert.equal(await onlinePage.locator("#online-leave svg").count(), 1, "the Back action must use the arrow instead of the old house art");
    assert.match(await onlinePage.locator("#online-leave").evaluate(element => getComputedStyle(element).backgroundImage), /rgb\(255, 101, 114\)|rgb\(201, 31, 67\)/, "Back must read as a red destructive exit");
    assert.match(await onlinePage.evaluate(() => getComputedStyle(document.body).backgroundAttachment), /^scroll(?:, scroll)*$/, "mobile multiplayer must avoid fixed-background compositor flicker");
    await onlinePage.locator("#online-board .tile").first().evaluate(element => { element.dataset.pollStable = "yes"; });
    await onlinePage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await onlinePage.waitForTimeout(1950);
    assert.equal(await onlinePage.locator('#online-board .tile[data-poll-stable="yes"]').count(), 1, "unchanged room polls must preserve the board DOM instead of repainting it every second");
    await onlinePage.evaluate(() => history.back());
    await onlinePage.waitForSelector("#online-leave-modal[open]");
    assert.equal(await onlinePage.locator("#online-leave-title").textContent(), "Leave VS room");
    assert.equal(await onlinePage.locator("#online-screen").isVisible(), true, "browser Back must not exit an active room before confirmation");
    await onlinePage.click("#online-leave-cancel");
    assert.equal(await onlinePage.locator("#online-screen").isVisible(), true, "Stay in game must keep the active room open");
    await onlinePage.click("#online-leave");
    await onlinePage.click("#online-leave-confirm");
    await onlinePage.waitForSelector("#home-screen:not([hidden])");
    await onlinePage.click('[data-open-online="vs"]');
    await onlinePage.fill("#online-join-code", "sense6");
    await onlinePage.click("#online-join-room");
    await onlinePage.waitForSelector("#online-screen:not([hidden])");
    assert.equal(await onlinePage.locator("#online-room-code").textContent(), "SENSE6");
    assert.equal(await onlinePage.locator("#online-room-title").textContent(), "Normal · 9 rounds");
    assert.match(await onlinePage.locator("#online-versus-names").textContent(), /OwlStar 0VS0 TigerAce/, "both names and scores must remain visible above the board");
    assert.equal(await onlinePage.locator(".player-progress").count(), 2);
    assert.equal(await onlinePage.locator(".series-track").count(), 2, "finite VS should show each player's point progress");
    assert.match((await onlinePage.locator(".player-progress").first().textContent()), /0 points/);
    assert.equal(await onlinePage.locator(".attempt-patterns > span").count(), 1, "VS should show the opponent's attempt pattern live");
    assert.equal(await onlinePage.locator("#online-board .tile").count(), 42);
    assert.equal(await onlinePage.locator("#online-keyboard .key").count(), 27);
    assert.equal(await onlinePage.locator('[data-online-key="ENTER"]').count(), 0, "multiplayer must use the same automatic six-letter submission");
    assert.equal(await onlinePage.locator('[data-online-lifeline="sense"] button').isEnabled(), true, "VS lifelines must be usable before the first attempt");
    for (const letter of "rattle") await onlinePage.click(`[data-online-key="${letter.toUpperCase()}"]`);
    await onlinePage.waitForTimeout(120);
    assert.equal(submittedOnlineGuess, "rattle", "typing the sixth multiplayer letter must submit without Enter");
    assert.equal(await onlinePage.locator("[data-online-lifeline]:visible").count(), 3, "VS must expose Sense, Peek, and Clear without Skip");
    assert.equal(await onlinePage.locator('[data-online-lifeline="skip"]').isHidden(), true, "Skip must not be available in VS");
    assert.equal(await onlinePage.locator('[data-online-lifeline="sense"] button').isEnabled(), true, "VS lifelines must be usable immediately after a guess finishes");
    assert.equal(await onlinePage.locator("#online-leave").textContent().then(text => text.trim()), "Back", "every multiplayer mode needs an explicit exit");
    await onlinePage.click('[data-online-lifeline="sense"] button');
    await onlinePage.waitForSelector("#hint-modal[open]");
    assert.equal(await onlinePage.locator("#hint-dialog-copy").textContent(), "A test clue");
    await onlinePage.click("#hint-ok-button");
    assert.doesNotMatch(await onlinePage.locator("#online-live-status").textContent(), /Sense unlocked/, "Sense must use the centered message box instead of shifting the live status");
    assert.equal(await onlinePage.locator('[data-online-lifeline="sense"] .lifeline-stock').isVisible(), true, "used Sense should remain reopenable in multiplayer");
    const onlineOverflow = await onlinePage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll("body *")].filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.right > innerWidth + 1 || rect.left < -1;
      }).slice(0, 8).map(element => ({ selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${element.className || ""}`, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right }))
    }));
    assert(onlineOverflow.scrollWidth <= onlineOverflow.clientWidth, `online phone view must not overflow horizontally: ${JSON.stringify(onlineOverflow)}`);

    const opponent = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const opponentPage = await opponent.newPage();
    await opponentPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "OwlStar" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ avatar: "owl", accent: "violet", music: false, effects: false }));
    });
    await opponentPage.route("**/api/multiplayer", mockOnlineApi);
    await opponentPage.goto(baseUrl, { waitUntil: "networkidle" });
    await opponentPage.click('[data-open-online="vs"]');
    await opponentPage.fill("#online-join-code", "sense6");
    await opponentPage.click("#online-join-room");
    await opponentPage.waitForSelector("#online-screen:not([hidden])");
    sharedRound = 1;
    await Promise.all([
      onlinePage.waitForSelector("#online-round-transition:not([hidden])", { timeout: 2500 }),
      opponentPage.waitForSelector("#online-round-transition:not([hidden])", { timeout: 2500 })
    ]);
    assert.equal(await onlinePage.locator("#online-round-title").textContent(), "New word");
    assert.equal(await opponentPage.locator("#online-round-title").textContent(), "New word", "the same round transition must trigger on both screens");
    assert.match(await onlinePage.locator("#online-round-kicker").textContent(), /OwlStar wins the point/);
    assert.match(await opponentPage.locator("#online-round-score").textContent(), /OwlStar 1 · TigerAce 0/);
    assert.match(await onlinePage.locator("#online-versus-names").textContent(), /OwlStar 1VS0 TigerAce/);
    assert.equal(await onlinePage.locator("#online-board .tile.exact, #online-board .tile.present, #online-board .tile.absent").count(), 0, "both boards must clear for the new shared word");
    await onlinePage.screenshot({ path: path.join(evidenceDir, "multiplayer-vs-390x844.png"), fullPage: true });
    await onlinePage.click("#online-leave");
    await onlinePage.waitForSelector("#online-leave-modal[open]");
    await onlinePage.click("#online-leave-confirm");
    await onlinePage.waitForSelector("#home-screen:not([hidden])");
    await onlinePage.click('[data-open-online="race"]');
    await onlinePage.click("#online-create-room");
    await onlinePage.waitForSelector(".race-course");
    assert.equal(await onlinePage.locator(".race-token .avatar-art").count(), 1, "Race must place player avatars directly on the shared course");
    assert.match(await onlinePage.locator(".race-course-rail").evaluate(element => getComputedStyle(element).backgroundImage), /rgb\(29, 155, 88\)|rgb\(67, 225, 135\)/, "the Race course must use a thin green rail");
    assert.match(await onlinePage.locator(".race-course-finish").evaluate(element => getComputedStyle(element).backgroundImage), /conic-gradient/, "Race must end in a black-and-white checkered finish");
    await onlinePage.screenshot({ path: path.join(evidenceDir, "multiplayer-race-390x844.png"), fullPage: true });
    await opponent.close();
    await online.close();

    const repeats = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const repeatPage = await repeats.newPage();
    await repeatPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "RepeatFox" }));
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins: 500, economyVersion: 3, inventory: { sense: 0, peek: 0, clear: 0, skip: 0 } }));
    });
    await repeatPage.goto(baseUrl, { waitUntil: "networkidle" });
    await repeatPage.click('[data-start-mode="daily"]');

    await repeatPage.click("#peek-button");
    assert.equal(await repeatPage.locator('[data-lifeline="peek"]').evaluate(el => el.classList.contains("is-purchased")), true, "Peek purchase should animate");
    assert.equal(await repeatPage.locator("#game-board .tile.peeked").count(), 1);
    assert.equal(await repeatPage.locator('[data-lifeline="peek"] .lifeline-price').isVisible(), true, "Peek should be purchasable again after use");
    assert.equal(await repeatPage.locator("#peek-button").isEnabled(), true);
    await repeatPage.click("#peek-button");
    assert.equal(await repeatPage.locator("#game-board .tile.peeked").count(), 2, "Peek should reveal another distinct position");
    assert.equal(await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")).peekUses), 2);

    await repeatPage.click("#clear-button");
    assert.equal(await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")).eliminatedLetters.length), 3);
    assert.equal(await repeatPage.locator('[data-lifeline="clear"] .lifeline-price').isVisible(), true, "Clear should be purchasable again after use");
    await repeatPage.click("#clear-button");
    const repeatedClear = await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.daily.v1")));
    assert.equal(repeatedClear.clearUses, 2);
    assert.equal(repeatedClear.eliminatedLetters.length, 6, "Clear should accumulate three new impossible letters per use");
    assert.equal(new Set(repeatedClear.eliminatedLetters).size, 6, "repeated Clear letters should remain unique");

    await repeatPage.click(".brand");
    assert.equal(await repeatPage.locator("#leave-game-modal").isVisible(), true, "leaving an active puzzle must ask for confirmation");
    await repeatPage.click("#leave-game-confirm");
    await repeatPage.evaluate(() => { Math.random = () => 0; });
    await repeatPage.click('[data-start-mode="practice"]');
    await repeatPage.click("#skip-puzzle-button");
    await repeatPage.click("#confirm-skip-button");
    await repeatPage.waitForSelector("#result-modal[open]", { timeout: 4000 });
    await repeatPage.click("#result-primary");
    assert.equal(await repeatPage.locator('[data-lifeline="skip"] .lifeline-price').isVisible(), true, "Skip should be purchasable again after starting the fresh puzzle");
    await repeatPage.click("#skip-puzzle-button");
    assert.equal(await repeatPage.locator("#skip-modal").isVisible(), true, "a second purchased Skip should also be usable");
    await repeatPage.click("#cancel-skip-button");
    const practiceAnswer = await repeatPage.evaluate(() => window.SixthSenseCore.practiceAnswer(window.SixthSenseCore.dailyAnswer().word, () => 0, []).word);
    for (const letter of practiceAnswer) await repeatPage.click(`[data-key="${letter.toUpperCase()}"]`);
    await repeatPage.waitForSelector("#result-modal[open]", { timeout: 4000 });
    assert.equal(await repeatPage.locator("#result-primary").textContent(), "OK", "every solo completion should use a clear OK action");
    await repeatPage.click("#result-primary");
    assert.equal(await repeatPage.locator("#home-screen").isVisible(), true);
    assert.equal(await repeatPage.locator("#result-modal").getAttribute("open"), null);

    await repeatPage.click('[data-start-mode="practice"]');
    const lastChanceGame = await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.practice.v1")));
    const missCandidates = ["rattle", "raffle", "planet", "banner", "market", "school", "bridge", "coffee"].filter(word => word !== lastChanceGame.answer).slice(0, 7);
    for (let guessIndex = 0; guessIndex < missCandidates.length; guessIndex += 1) {
      for (const letter of missCandidates[guessIndex]) await repeatPage.click(`[data-key="${letter.toUpperCase()}"]`);
      await repeatPage.waitForTimeout(1150);
      assert.equal(await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.practice.v1")).guesses.length), guessIndex + 1, `${missCandidates[guessIndex]} must record as Last Chance setup guess ${guessIndex + 1}`);
    }
    await repeatPage.waitForSelector("#last-chance-modal[open]", { timeout: 4000 });
    const coinsBeforeLastChance = await repeatPage.evaluate(() => window.SixthSenseEconomy.state().coins);
    await repeatPage.click("#last-chance-buy");
    assert.equal(await repeatPage.locator("#game-board .board-row").count(), 8, "buying Last Chance must add exactly one eighth row");
    assert.equal(await repeatPage.evaluate(() => window.SixthSenseEconomy.state().coins), coinsBeforeLastChance - 80, "Last Chance must charge 80 coins once");
    const lastChanceAnswer = await repeatPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.practice.v1")).answer);
    for (const letter of lastChanceAnswer) await repeatPage.click(`[data-key="${letter.toUpperCase()}"]`);
    await repeatPage.waitForSelector("#result-modal[open]", { timeout: 4000 });
    assert.equal(await repeatPage.locator("#result-attempts").textContent(), "Solved in 8", "the victory card must acknowledge an eighth-attempt solve");
    await repeatPage.click("#result-primary");
    assert(await repeatPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "repeatable lifelines must not introduce horizontal overflow");
    await repeats.close();

    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
    const desk = await desktop.newPage();
    await desk.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "DeskFox" }));
    });
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
