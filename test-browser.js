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
    assert.deepEqual(await page.evaluate(() => Object.fromEntries(Object.entries(window.SixthSenseCore.ANSWER_TIERS).map(([tier, words]) => [tier, words.length]))), { easy: 4309, medium: 1995, extreme: 3883 });
    assert.equal(await page.evaluate(() => window.SixthSenseCore.WORDS.size), 15232);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("rattle")), true);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("raffle")), true);
    assert.equal(await page.evaluate(() => window.SixthSenseCore.isValidWord("coates")), false);
    assert.equal(await page.locator("#home-screen").isVisible(), true);
    assert.equal(await page.locator("#game-screen").isHidden(), true);
    assert.equal(await page.locator("[data-start-mode]").count(), 5);
    assert.equal(await page.locator("[data-open-online]").count(), 2);
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
    const lifelineSizing = await page.locator(".lifeline-button").first().evaluate(button => {
      const hit = button.getBoundingClientRect();
      const art = button.querySelector("img").getBoundingClientRect();
      return { hit: hit.width, art: art.width };
    });
    assert(lifelineSizing.hit >= 44, "lifeline touch targets must remain accessible");
    assert(lifelineSizing.art <= 40, "lifeline artwork should remain visually compact");
    assert.equal(await page.locator(".lifeline-heading").count(), 0);
    assert.equal(await page.evaluate(() => Boolean(document.querySelector("#keyboard + .lifeline-dock"))), true, "lifelines should sit below the keyboard");
    assert.equal(await page.locator(".topbar .profile-trigger .avatar-art").count(), 1);
    assert.equal(await page.locator(".topbar .profile-trigger").evaluate(element => getComputedStyle(element).boxShadow), "none", "the avatar must not sit on a raised square pedestal");
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
    await compactPage.click("[data-open-adventure-map]");
    assert(await compactPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), "360px Adventure map must not overflow horizontally");
    assert(await compactPage.evaluate(() => document.documentElement.scrollHeight <= document.documentElement.clientHeight), "360×800 Adventure map must not scroll vertically");
    await compact.close();

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
    const adventureSeed = await adventurePage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).adventure.seed);
    assert.equal(await adventurePage.evaluate(seed => window.SixthSenseCore.adventureAnswer(0, seed).tier, adventureSeed), "easy");
    await adventurePage.click("#adventure-play");
    assert.equal(await adventurePage.locator("#game-screen").isVisible(), true);
    assert.equal(await adventurePage.locator("#game-mode-label").textContent(), "Adventure Puzzle");
    assert.equal(await adventurePage.locator("#mode-detail").isHidden(), true);
    assert.equal(await adventurePage.locator("#mode-detail").textContent(), "");
    const adventureAnswer = await adventurePage.evaluate(seed => window.SixthSenseCore.adventureAnswer(0, seed).word, adventureSeed);
    for (const letter of adventureAnswer) await adventurePage.click(`[data-key="${letter.toUpperCase()}"]`);
    await adventurePage.click('[data-key="ENTER"]');
    await adventurePage.waitForSelector("#stats-modal[open]", { timeout: 4000 });
    assert.equal(await adventurePage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).adventure.level), 1, "winning must advance exactly one Adventure level");
    assert.equal(await adventurePage.locator("#new-practice-button").textContent(), "Continue the trail");
    await adventurePage.click("#new-practice-button");
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
    await adventurePage.screenshot({ path: path.join(evidenceDir, "adventure-map-390x844.png"), fullPage: true });
    await adventure.close();

    const zoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const zonePage = await zoneContext.newPage();
    await zonePage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "ZoneFox" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ adventure: { seed: 123456, level: 4309 } }));
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
    });
    await modesPage.goto(baseUrl, { waitUntil: "networkidle" });
    await modesPage.click('[data-modal-open="settings-modal"]');
    const settingsScrollStyle = await modesPage.locator("#settings-modal .modal-sheet").evaluate(element => ({ scrollbarWidth: getComputedStyle(element).scrollbarWidth, overflowY: getComputedStyle(element).overflowY, scrollable: element.scrollHeight > element.clientHeight }));
    assert.equal(settingsScrollStyle.scrollbarWidth, "none", "the settings popup scrollbar should be visually hidden");
    assert.equal(settingsScrollStyle.overflowY, "auto", "settings must remain scrollable after hiding the bar");
    assert.equal(settingsScrollStyle.scrollable, true, "the phone settings sheet should still have scrollable content");
    assert.equal(await modesPage.evaluate(() => getComputedStyle(document.documentElement).overflowY), "hidden", "the page scrollbar behind Settings should also be hidden");
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
    assert.equal(await modesPage.locator(".avatar-choice").count(), 9);
    assert.equal(await modesPage.locator("[data-accent-option]").count(), 8);
    await modesPage.click('[data-avatar-option="tiger"]');
    await modesPage.click('[data-accent-option="aqua"]');
    assert.equal(await modesPage.locator('[data-avatar-option="tiger"]').getAttribute("aria-pressed"), "true");
    assert(await modesPage.locator("#brand-player-avatar").evaluate(element => element.classList.contains("avatar-tiger")), "the chosen avatar should immediately replace the header icon");
    assert.equal(await modesPage.locator('[data-accent-option="aqua"]').getAttribute("aria-pressed"), "true");
    assert.deepEqual(await modesPage.evaluate(() => { const s=JSON.parse(localStorage.getItem("sixth-sense.settings.v1")); return { avatar:s.avatar, accent:s.accent }; }), { avatar: "tiger", accent: "aqua" });
    assert.equal(await modesPage.locator("#settings-username").inputValue(), "ModeFox");
    await modesPage.fill("#settings-username", "TigerNova");
    await modesPage.click("#save-settings-username");
    assert.deepEqual(await modesPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.online.identity.v1"))), { name: "TigerNova" }, "Identity Studio must persist username changes");
    assert.equal(await modesPage.locator("#settings-username-message").textContent(), "Saved.");
    await modesPage.click("#settings-modal .modal-close");
    await modesPage.click("#profile-trigger");
    assert.equal(await modesPage.locator("#profile-name").textContent(), "TigerNova", "profile must show the chosen username");
    await modesPage.click("#profile-modal .modal-close");

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
    let sharedRound = 0;
    const versusSnapshot = viewerId => ({
      room: { code: "SENSE6", mode: "vs", difficulty: "easy", wordCount: 9, endless: false, currentRound: sharedRound, lastRoundWinnerPlayerId: sharedRound ? "host" : null, status: "running", revision: 2 + sharedRound, winnerPlayerId: null },
      me: { id: viewerId, isHost: viewerId === "host", currentWordIndex: sharedRound, attempts: [], score: viewerId === "host" && sharedRound ? 1 : 0, finished: false, eliminated: false },
      players: [
        { id: "host", name: "OwlStar", avatar: "owl", accent: "violet", accentHex: "#7c45e8", seat: 1, currentWordIndex: sharedRound, attempts: sharedRound ? [] : [["absent","present","exact","absent","present","absent"]], score: sharedRound ? 1 : 0, finished: false, eliminated: false },
        { id: "self", name: "TigerAce", avatar: "tiger", accent: "aqua", accentHex: "#078995", seat: 2, currentWordIndex: sharedRound, attempts: [], score: 0, finished: false, eliminated: false }
      ]
    });
    let createPayload = null;
    const mockOnlineApi = async route => {
      const body = route.request().postDataJSON();
      let payload;
      if (body.action === "create") {
        createPayload = body;
        payload = { roomCode: "DUEL55", resumeToken: "create-token", playerId: "self", snapshot: createdSnapshot };
      } else if (body.action === "join") {
        const viewerId = body.player.name === "OwlStar" ? "host" : "self";
        payload = { roomCode: "SENSE6", resumeToken: `${viewerId}-token`, playerId: viewerId, snapshot: versusSnapshot(viewerId) };
      } else if (body.resumeToken === "create-token") payload = { snapshot: createdSnapshot };
      else payload = { snapshot: versusSnapshot(body.resumeToken === "host-token" ? "host" : "self") };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    };
    await onlinePage.route("**/api/multiplayer", mockOnlineApi);
    await onlinePage.goto(baseUrl, { waitUntil: "networkidle" });
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
    await onlinePage.click("#online-leave");
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
    assert.equal(await onlinePage.locator("#online-keyboard .key").count(), 28);
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
    await opponent.close();
    await online.close();

    const repeats = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const repeatPage = await repeats.newPage();
    await repeatPage.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "RepeatFox" }));
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
