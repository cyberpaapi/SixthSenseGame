"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  const root = process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269";
  let soloStyle;
  try {
    for (const mode of ["daily", "race", "vs", "coop", "bollywood", "bollywood-vs"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Message QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      });
      const player = { id: "self", name: "Message QA", avatar: "fox", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false };
      const snapshot = { room: { code: "MESSAG", mode: mode.includes("vs") ? "vs" : mode === "coop" ? "coop" : "race", theme: mode.startsWith("bollywood") ? "bollywood" : "classic", difficulty: "easy", status: "running", wordCount: 3, currentRound: 0, maxGuesses: 6, revision: 1 }, me: { ...player, isHost: true, wordLength: mode.startsWith("bollywood") ? 7 : 6, answerKind: "Film", lifelines: {} }, players: [player, { ...player, id: "other", seat: 2, name: "Friend" }] };
      let polls = 0, offline = false;
      await page.route("**/api/multiplayer", async route => {
        const request = route.request().postDataJSON();
        if (request.action === "snapshot") {
          polls++;
          if (offline) return route.fulfill({ status: 503, json: { error: "Connection interrupted. Reconnecting…" } });
          snapshot.room.revision++;
        }
        if (request.action === "guess") return route.fulfill({ status: 400, json: { error: "That word isn’t in the accepted dictionary." } });
        let effect;
        if (request.action === "lifeline") {
          effect = { kind: "clear", letters: ["x", "y", "z"] };
          snapshot.me.lifelines.eliminatedLetters = effect.letters;
        }
        await route.fulfill({ json: { roomCode: "MESSAG", resumeToken: "fixture-seat", playerId: "self", snapshot, effect } });
      });
      await page.goto(root);
      if (mode === "daily") await page.click('[data-start-mode="daily"]');
      else {
        await page.click(`[data-open-online="${mode}"]`);
        await page.click("#online-create-room");
        await page.waitForSelector("#online-board .tile");
      }
      const selector = mode === "daily" ? "#toast" : "#online-live-status";
      const boardSelector = mode === "daily" ? "#game-board" : "#online-board";
      // Real invalid guess, using each mode's normal input path.
      await page.keyboard.type(mode.startsWith("bollywood") ? "qqqqqqq" : "qqqqqq");
      await page.waitForFunction(selector => /dictionary/.test(document.querySelector(selector).textContent), selector);
      const style = await page.locator(selector).evaluate(el => {
        const css = getComputedStyle(el);
        return [css.backgroundImage, css.color, css.borderRadius, css.fontSize, css.lineHeight];
      });
      if (!soloStyle) soloStyle = style;
      else assert.deepEqual(style, soloStyle, `${mode}: same feedback styling as solo`);
      if (mode !== "daily") {
        const before = polls;
        await page.waitForFunction(() => document.querySelector("#online-live-status").textContent.includes("dictionary"));
        await page.waitForTimeout(1100);
        assert(polls > before, "a room update arrived during feedback");
        assert.match(await page.locator(selector).textContent(), /dictionary/, "polling must not erase transient feedback");
        await page.waitForFunction(() => !document.querySelector("#online-live-status").textContent.includes("dictionary"));
        assert.match(await page.locator(selector).textContent(), /Word|Round|Shared word/);
        await page.click('[data-online-lifeline="clear"] button');
        await page.waitForFunction(() => document.querySelector("#online-live-status").textContent === "Removed X, Y, Z.");
      }
      for (const dark of [false, true]) {
        await page.evaluate(dark => document.body.classList.toggle("is-dark", dark), dark);
        for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 360 }]) {
          await page.setViewportSize(viewport);
          await page.waitForFunction(() => document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth);
          const before = await page.locator(boardSelector).boundingBox();
          await page.evaluate(() => window.SixthSenseMessages.announce("That word isn’t in the accepted dictionary. Try another word.", { duration: 6000 }));
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          const m = await page.evaluate(({ selector, boardSelector }) => {
            const bubble = document.querySelector(selector), slot = bubble.parentElement;
            const rect = el => el.getBoundingClientRect().toJSON();
            return { bubble: rect(bubble), slot: rect(slot), board: rect(document.querySelector(boardSelector)), scroll: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, height: innerHeight, vw: innerWidth };
          }, { selector, boardSelector });
          assert(m.bubble.top >= m.slot.top - 1 && m.bubble.bottom <= m.slot.bottom + 1, `${mode}: bubble stays inside reserved area ${JSON.stringify(m)}`);
          assert(m.bubble.bottom <= m.board.top + 1, `${mode}: message must not cover board ${JSON.stringify(m)}`);
          assert(m.scroll <= m.height + 1 && m.width <= m.vw, `${mode}: no page overflow`);
          // Resize fitting can finish after the initial read; measure stable layout around a second message.
          const stable = await page.locator(boardSelector).boundingBox();
          await page.evaluate(() => window.SixthSenseMessages.announce("Position 2 is A."));
          assert.deepEqual(await page.locator(boardSelector).boundingBox(), stable, "message length cannot move the board");
          assert(before.width > 0);
        }
      }
      if (mode === "race") {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(process.env.TEMP, "sixth-sense-message-race.png") });
        await page.waitForTimeout(2700);
        offline = true;
        await page.waitForFunction(() => document.querySelector("#online-live-status").textContent.includes("Reconnecting"));
        offline = false;
        await page.waitForFunction(() => document.querySelector("#online-live-status").textContent.startsWith("Word"));
        await page.click("#online-leave"); await page.click("#online-leave-confirm");
        assert.equal(await page.locator(selector).textContent(), "", "leaving clears stale room feedback");
      }
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log("Message browser checks passed: shared solo/all-multiplayer bubbles, real invalid guesses, poll-safe feedback, timed status restore, lifelines, reconnect recovery, light/dark phone/landscape layout and exit cleanup.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
