"use strict";
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { chromium } = require("playwright");
const root = process.env.SIXTH_SENSE_PRODUCTION_URL || "https://sixth-sense-game.vercel.app";
const name = "Join" + String(Date.now()).slice(-7);
async function request(action, fields = {}) {
  const response = await fetch(`${root}/api/multiplayer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...fields }) });
  return { status: response.status, ...await response.json() };
}
async function ok(action, fields) { const result = await request(action, fields); assert.equal(result.status, 200, result.error); return result; }
const seat = player => ({ roomCode: player.roomCode, resumeToken: player.resumeToken });
(async () => {
  const host = await ok("create", { mode: "race", wordCount: 3, player: { name: name + "Host" } });
  await ok("join", { roomCode: host.roomCode, player: { name: name + "First" } });
  await ok("start", seat(host));
  const before = await ok("guess", { ...seat(host), guess: "planet", actionId: randomUUID() });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const lateName = name + "Late";
    await page.addInitScript(n => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: n }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
    }, lateName);
    await page.goto(root);
    await page.click('[data-open-online="race"]');
    await page.fill("#online-join-code", host.roomCode);
    await page.click("#online-join-room");
    await page.waitForSelector('#online-screen:not([hidden]) [data-online-key="A"]:enabled');
    assert.equal(await page.locator("#online-start").isHidden(), true);
    assert.equal(await page.locator("#online-board .tile").count(), 36);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.active-room.v1")));
    const late = await ok("snapshot", { roomCode: saved.roomCode, resumeToken: saved.token });
    assert.equal(late.snapshot.me.currentWordIndex, 0);
    assert.deepEqual(late.snapshot.me.attempts, []);
    assert.equal(late.snapshot.players.length, 3);
    assert.equal(late.snapshot.room.status, "running");
    assert(!("answer_words" in late.snapshot.room) && !("answerWords" in late.snapshot.room));
    const after = await ok("snapshot", seat(host));
    assert.deepEqual(after.snapshot.me, before.snapshot.me, "existing racer's progress must survive late entry");
    assert.deepEqual(after.snapshot.room, before.snapshot.room, "late entry must not restart the race");
    const duplicate = await request("join", { roomCode: host.roomCode, player: { name: lateName.toLowerCase() } });
    assert.equal(duplicate.status, 409); assert.match(duplicate.error, /username/);
    for (let i = 0; i < 4; i++) await ok("join", { roomCode: host.roomCode, player: { name: name + "Fill" + i } });
    const competing = await Promise.all([0, 1].map(i => request("join", { roomCode: host.roomCode, player: { name: name + "Final" + i } })));
    assert.deepEqual(competing.map(result => result.status).sort(), [200, 409], "only one concurrent join may take the eighth seat");
    assert.match(competing.find(result => result.status === 409).error, /full/);
    assert.equal((await ok("snapshot", seat(host))).snapshot.players.length, 8);
    await page.waitForFunction(() => document.querySelectorAll(".race-token").length === 8);
    await page.locator('[data-online-key="R"]').tap();
    assert.equal((await page.locator("#online-board .board-row").first().innerText()).replace(/\s/g, ""), "R");
    console.log("Live Race late-join passed: phone joins running room at word one, existing progress preserved, playable keyboard, roster updates, duplicate-name denial and concurrent eight-seat cap.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
