"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const Core = require("./game-core");
const isVs = process.env.BOLLYWOOD_VARIANT === "vs";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Cinema QA" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
    });
    const routeWords = ["jawan", "dangal", "pathaan"];
    const players = Array.from({ length: isVs ? 2 : 8 }, (_, i) => ({ id: `p${i}`, name: `Player${i}`, avatar: "fox", seat: i + 1, currentWordIndex: 0, attempts: [], score: 0, finished: false }));
    const me = { ...players[0], isHost: true, wordLength: 5, answerKind: "Film", lifelines: {} };
    const snapshot = { room: { code: "BOLLYQ", mode: isVs ? "vs" : "race", currentRound: 0, theme: "bollywood", difficulty: "easy", wordCount: 3, status: "running", revision: 1, maxGuesses: 6 }, me, players };
    const requests = [];
    await page.route("**/api/multiplayer", async route => {
      const body = route.request().postDataJSON(); requests.push(body);
      if (body.action === "guess") {
        const answer = routeWords[me.currentWordIndex];
        assert.equal(body.guess.length, answer.length);
        if (body.guess === answer) {
          me.currentWordIndex++; players[0].currentWordIndex = me.currentWordIndex;
          if (isVs) { snapshot.room.currentRound = me.currentWordIndex; me.score++; players[0].score = me.score; snapshot.room.lastRoundWinnerPlayerId = me.id; }
          me.wordLength = routeWords[me.currentWordIndex]?.length || 7;
          me.attempts = []; me.lifelines = {};
        } else me.attempts.push({ guess: body.guess, score: Core.scoreGuess(body.guess, answer) });
        snapshot.room.revision++;
      }
      await route.fulfill({ json: { roomCode: "BOLLYQ", resumeToken: "fixture-seat", playerId: "p0", snapshot } });
    });
    await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const geometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert(geometry.scroll <= geometry.width, JSON.stringify(geometry));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('[data-start-mode]').count(), 1);
    assert.equal(await page.locator('.bollywood-mode-card').count(), 2);
    for (const image of await page.locator('.bollywood-mode-card img').all()) assert(await image.evaluate(el => el.complete && el.naturalWidth >= 1024));
    await page.evaluate(() => document.body.classList.add("is-dark"));
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.bollywood-shelf')).backgroundColor === 'rgb(20, 13, 36)');
    const dark = await page.locator('.bollywood-shelf').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, ink: getComputedStyle(el.querySelector('h2')).color }));
    assert.equal(dark.background, 'rgb(20, 13, 36)');
    assert.equal(dark.ink, 'rgb(255, 249, 255)');
    await page.evaluate(() => document.body.classList.remove("is-dark"));
    await page.click(isVs ? '[data-open-online="bollywood-vs"]' : '[data-open-online="bollywood"]');
    assert.equal(await page.locator("#online-difficulty-options").isHidden(), true);
    assert.equal(await page.locator("#bollywood-room-guide").isVisible(), true);
    await page.click("#online-create-room");
    await page.waitForSelector(isVs ? "#online-versus-names:not([hidden])" : ".race-token");
    const create = requests.find(r => r.action === "create");
    assert.equal(create.theme, "bollywood"); assert.equal(create.mode, isVs ? "vs" : "race"); assert.equal(create.supportsVariableLength, true);
    for (const word of routeWords) {
      await page.waitForFunction(length => document.querySelector("#online-board .board-row")?.children.length === length, word.length);
      assert.equal(await page.locator("#online-board .board-row").count(), 6);
      assert.equal(await page.locator('[data-online-lifeline="skip"]').isHidden(), true);
      for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 360 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const g = await page.evaluate(() => {
          const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, right: r.right, bottom: r.bottom, height: r.height }; };
          return { scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, board: rect("#online-board"), last: rect("#online-board .board-row:first-child .tile:last-child"), course: rect(".progress-panel"), dock: rect(".online-lifeline-dock"), key: rect("#online-keyboard .key") };
        });
        assert(g.scrollWidth <= viewport.width + 1 && g.scrollHeight <= viewport.height + 1 && g.dock.bottom <= viewport.height + 1, `${word} overflow: ${JSON.stringify(g)}`);
        if (!isVs) assert(g.last.right <= g.course.x + 1, `${word} overlaps race track: ${JSON.stringify(g)}`);
        assert(g.key.height >= 44, "44px keys");
      }
      await page.setViewportSize({ width: 390, height: 844 });
      if (isVs) await page.waitForSelector("#online-round-transition", { state: "hidden" });
      const before = requests.filter(r => r.action === "guess").length;
      for (const letter of word.slice(0, -1)) await page.tap(`[data-online-key="${letter.toUpperCase()}"]`);
      assert.equal(requests.filter(r => r.action === "guess").length, before, "do not submit before the last letter");
      assert.equal((await page.locator("#online-board .board-row").first().innerText()).replace(/\s/g, "").toLowerCase(), word.slice(0, -1), "one tap enters once");
      if (word === "pathaan") {
        if (process.env.SIXTH_SENSE_EVIDENCE) await page.screenshot({ path: require("node:path").join(process.env.SIXTH_SENSE_EVIDENCE, "bollywood-race.png") });
        break;
      }
      await page.tap(`[data-online-key="${word.at(-1).toUpperCase()}"]`);
      await page.waitForFunction(() => !document.querySelector('[data-online-key="A"]').disabled);
      assert.equal(requests.filter(r => r.action === "guess").length, before + 1, "submit once at exact length");
    }
    // Seven columns plus the optional seventh row, with a banner-sized reduction in available height.
    me.lifelines = { round: 2, extraAttempt: true }; snapshot.room.revision++;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForFunction(() => document.querySelectorAll("#online-board .board-row").length === 7);
    await page.setViewportSize({ width: 320, height: 518 });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const extra = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, dock: document.querySelector(".online-lifeline-dock").getBoundingClientRect().bottom, key: document.querySelector("#online-keyboard .key").getBoundingClientRect().height }));
    assert(extra.height <= 519 && extra.width <= 321 && extra.dock <= 519 && extra.key >= 44, JSON.stringify(extra));
    assert.equal(await page.locator("#online-board .tile").count(), 49);
    assert.deepEqual(errors, []);
    console.log(`Bollywood ${isVs ? "VS" : "Race"} browser passed: launcher/payload, 5→6→7 board transitions, single touch input and autosubmit, ${isVs ? "two opponents" : "eight racers"}, 320px phone/landscape fit, 44px keys, no console errors.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
