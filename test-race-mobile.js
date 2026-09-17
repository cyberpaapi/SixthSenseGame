"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    for (const count of [2, 8]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
      await page.addInitScript(() => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Race QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      });
      const players = Array.from({ length: count }, (_, i) => ({ id: `p${i}`, name: `PlayerLongName${i}`, avatar: "fox", seat: i + 1, currentWordIndex: 0, attempts: [], score: 0, finished: false }));
      const snapshot = { room: { code: "RACEQA", mode: "race", difficulty: "easy", wordCount: 5, status: "running", revision: 1, maxGuesses: 6 }, me: { ...players[0], isHost: true, lifelines: {} }, players };
      // Explicit UI fixture; real multiplayer continues to use the durable room API.
      await page.route("**/api/multiplayer", route => route.fulfill({ json: { roomCode: "RACEQA", resumeToken: "qa", playerId: "p0", snapshot } }));
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
      await page.click('[data-open-online="race"]');
      for (const selector of ["#online-player-name", "#online-join-code"]) {
        assert(await page.locator(selector).evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16), `${selector} must not inherit the tiny label font`);
      }
      await page.click("#online-create-room");
      await page.waitForSelector(".race-token");
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.evaluate(() => {
        document.querySelector("#online-keyboard").addEventListener("click", event => {
          if (!event.isTrusted || event.pointerType !== "touch") return;
          event.stopImmediatePropagation();
          event.target.dispatchEvent(new PointerEvent("click", { bubbles: true, pointerType: "mouse", detail: 1 }));
        }, { capture: true });
      });
      const cdp = await page.context().newCDPSession(page);
      const tapKey = async (key, tapCount = 1) => {
        const box = await page.locator(`[data-online-key="${key}"]`).boundingBox();
        for (let tap = 0; tap < tapCount; tap++) {
          await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        }
        await page.waitForTimeout(100);
      };
      const typed = () => page.locator("#online-board .board-row").first().innerText().then(text => text.replace(/\s/g, ""));
      await tapKey("A", 2);
      assert.equal(await typed(), "AA", "two quick touches must enter both letters exactly once");
      await tapKey("BACK", 2);
      assert.equal(await typed(), "", "two quick delete touches must both work");
      for (const letter of "WZXED") {
        const box = await page.locator(`[data-online-key="${letter}"]`).boundingBox();
        await page.touchscreen.tap(box.x + 1, box.y + box.height / 2);
      }
      assert.equal(await typed(), "WZXED", "edge touches on reported keys must enter once without selection");
      assert.equal(await page.evaluate(() => String(getSelection())), "");
      await tapKey("BACK", 5);
      const start = await page.locator(".race-token").evaluateAll(tokens => tokens.map(token => token.getBoundingClientRect().top));
      assert(start.every(y => Math.abs(y - start[0]) < 1), "all racers start at the same bottom baseline");
      const before = await page.locator('.race-token[data-player-id="p1"]').boundingBox();
      players[1].currentWordIndex = 3;
      const pressedKey = await page.locator('[data-online-key="R"]').elementHandle();
      const pressedBox = await pressedKey.boundingBox();
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: pressedBox.x + pressedBox.width / 2, y: pressedBox.y + pressedBox.height / 2 }] });
      players[1].name = "Updated opponent"; snapshot.room.revision++;
      await page.evaluate(() => window.dispatchEvent(new Event("online")));
      await page.waitForSelector('.race-token[title^="Updated opponent"]');
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await page.waitForTimeout(100);
      assert.equal(await typed(), "R", "an opponent update between touch-down and touch-up must not swallow the letter");
      const advanced = await page.locator('.race-token[data-player-id="p1"]').boundingBox();
      assert(advanced.y < before.y - 20, "solving words moves the racer upward");
      assert(await pressedKey.evaluate(el => el.isConnected), "polling must retain the pressed key");
      await tapKey("BACK");
      for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 360 }]) {
        await page.setViewportSize(viewport);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        for (const selector of [".race-token", "#online-board .tile", ".online-keyboard .key"]) {
          const box = await page.locator(selector).first().boundingBox();
          await cdp.send("Input.synthesizeTapGesture", { x: box.x + box.width / 2, y: box.y + box.height / 2, tapCount: 2, gestureSourceType: "touch" });
        }
        const panel = await page.locator(".progress-panel").boundingBox();
        await cdp.send("Input.synthesizePinchGesture", { x: panel.x + panel.width / 2, y: panel.y + panel.height / 2, scaleFactor: 1.5, gestureSourceType: "touch" });
        await page.waitForTimeout(200);
        const geometry = await page.evaluate(() => ({ scale: visualViewport.scale, width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, dock: document.querySelector(".online-lifeline-dock").getBoundingClientRect().bottom, key: document.querySelector(".online-keyboard .key").getBoundingClientRect().height }));
        assert(Math.abs(geometry.scale - 1) < 0.01, "Race touch gestures must not zoom: " + JSON.stringify(geometry));
        assert(geometry.scrollWidth <= viewport.width + 1 && geometry.scrollHeight <= viewport.height + 1 && geometry.dock <= viewport.height + 1 && geometry.key >= 44, "Race controls must fit: " + JSON.stringify(geometry));
        const course = await page.locator(".progress-panel").boundingBox();
        const board = await page.locator("#online-board").boundingBox();
        const keyboard = await page.locator("#online-keyboard").boundingBox();
        assert(course.x >= board.x + board.width - 1, "Race progress must sit beside the tiles " + JSON.stringify({viewport,course,board,keyboard}));
        assert(course.y < board.y + board.height && course.y + course.height > board.y, "course shares board height");
        assert(keyboard.width > board.width, "keyboard keeps its full control-column width");
        if (viewport.width === 320) assert((await page.locator("#online-board .tile").first().boundingBox()).height >= 26, "small phone tiles recover room from the old horizontal track");
        if (viewport.width === 390 && count === 8 && process.env.SIXTH_SENSE_EVIDENCE) await page.screenshot({ path: require("node:path").join(process.env.SIXTH_SENSE_EVIDENCE, "race-side-qa.png") });
        const gestureBoundaries = await page.locator(".progress-panel,.player-progress-list,.race-course").evaluateAll(elements => elements.map(el => getComputedStyle(el).touchAction));
        assert(gestureBoundaries.every(value => value === "pan-x pan-y"), "nested scroll regions must not re-enable game zoom");
      }
      await page.click("#online-leave"); await page.click("#online-leave-confirm");
      assert.equal(await page.locator("body").evaluate(el => getComputedStyle(el).touchAction), "auto", "home keeps normal browser gestures");
      assert.doesNotMatch(await page.locator('meta[name="viewport"]').getAttribute("content"), /user-scalable\s*=\s*no|maximum-scale/);
      await page.close();
    }
    console.log("Race mobile QA passed: readable lobby fields, two/eight-player touch gestures, stable zoom, phone/landscape fit, 44px keys and home zoom preserved. Chromium emulation; physical Safari not verified.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
