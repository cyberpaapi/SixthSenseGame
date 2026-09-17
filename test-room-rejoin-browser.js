"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      if (!localStorage.getItem("qa-seeded")) {
        localStorage.setItem("qa-seeded", "yes");
        localStorage.setItem("sixth-sense.active-room.v1", JSON.stringify({ roomCode: "RETURN", token: "original-token", playerId: "original" }));
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Returning racer" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      }
    });
    const player = { id: "original", name: "Returning racer", avatar: "fox", seat: 1, currentWordIndex: 1, attempts: [], finished: false, score: 140 };
    const snapshot = { room: { code: "RETURN", mode: "race", status: "running", wordCount: 3, maxGuesses: 6, difficulty: "easy" }, players: [player, { ...player, id: "guest", name: "Guest", seat: 2 }], me: { ...player, isHost: true, lifelines: { round: 1, eliminatedLetters: ["z"] }, attempts: [{ guess: "market", score: ["absent", "present", "absent", "absent", "absent", "exact"] }] } };
    let unavailable = true;
    let resumed = 0;
    await page.route("**/api/multiplayer", route => {
      const body = route.request().postDataJSON();
      if (unavailable) return route.fulfill({ status: 503, json: { error: "Temporary service interruption" } });
      if (body.action === "join") {
        assert.equal(body.resumeToken, "original-token");
        resumed++;
      }
      if (body.action === "create") return route.fulfill({ json: { roomCode: "ABCDEF", resumeToken: "other-token", playerId: "other", snapshot: { ...snapshot, room: { ...snapshot.room, code: "ABCDEF", status: "waiting" }, me: { ...snapshot.me, id: "other" } } } });
      return route.fulfill({ json: { roomCode: "RETURN", resumeToken: "original-token", playerId: "original", snapshot } });
    });
    await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
    await page.waitForTimeout(200);
    assert(await page.evaluate(() => Boolean(localStorage.getItem("sixth-sense.active-room.v1"))), "temporary server errors must not erase the active key");
    assert(await page.evaluate(() => Boolean(JSON.parse(localStorage.getItem("sixth-sense.room-seats.v1"))?.RETURN)), "migrate the old active save before attempting recovery");
    unavailable = false;
    await page.reload();
    await page.waitForSelector('#online-screen:not([hidden]) [data-online-key="A"]:enabled');
    const leave = async () => { await page.click("#online-leave"); await page.click("#online-leave-confirm"); await page.waitForSelector("#home-screen:not([hidden])"); };
    await leave();
    assert.equal(await page.evaluate(() => localStorage.getItem("sixth-sense.active-room.v1")), null, "leaving should return home without auto-opening the room");
    await page.click('[data-open-online="race"]'); await page.click("#online-create-room");
    await page.waitForSelector("#online-screen:not([hidden])"); await leave();
    await page.reload();
    await page.click('[data-open-online="race"]'); await page.fill("#online-join-code", "RETURN"); await page.click("#online-join-room");
    await page.waitForSelector('#online-screen:not([hidden]) [data-online-key="A"]:enabled');
    assert.equal(resumed, 1);
    assert.match(await page.locator("#online-live-status").textContent(), /Word 2 of 3/);
    assert.equal((await page.locator("#online-board .board-row").first().innerText()).replace(/[×◆●\s]/g, ""), "MARKET");
    assert.equal(await page.locator('[data-online-key="Z"]').isDisabled(), true);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.active-room.v1")).playerId), "original");
    console.log("Room recovery browser QA passed: legacy migration, transient failure retention, leave/reload/other-room/rejoin, same seat, submitted guesses, word progress and lifelines.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
