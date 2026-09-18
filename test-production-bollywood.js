"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const bank = require("./data/bollywood-answers.json");
const base = process.env.SIXTH_SENSE_URL || "https://sixth-sense-game.vercel.app/";
const endpoint = "https://sixth-sense-game.vercel.app/api/multiplayer";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const pages = [];
    for (const name of ["CinemaHost", "CinemaGuest"]) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
      await page.addInitScript(name => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      }, name);
      await page.goto(base); pages.push(page);
    }
    const [host, guest] = pages;
    const responseFor = (page, action, kind) => page.waitForResponse(r => r.url().includes("/api/multiplayer") && r.request().method() === "POST" && r.request().postDataJSON()?.action === action && (!kind || r.request().postDataJSON().kind === kind), { timeout: 20000 });
    await host.click('[data-open-online="bollywood"]');
    await host.click("#online-create-room");
    await host.waitForSelector("#online-screen:not([hidden])");
    const code = (await host.locator("#online-room-code").textContent()).trim();
    await guest.click('[data-open-online="bollywood"]');
    await guest.fill("#online-join-code", code); await guest.click("#online-join-room");
    await guest.waitForSelector("#online-screen:not([hidden])");
    await host.waitForSelector("#online-start:not([hidden])");
    const started = responseFor(host, "start"); await host.click("#online-start");
    const startResponse = await started; assert.equal(startResponse.status(), 200);
    const initial = (await startResponse.json()).snapshot;
    assert.equal(initial.room.theme, "bollywood");
    assert([5, 6, 7].includes(initial.me.wordLength));
    assert(!("answer_words" in initial.room) && !("answers" in initial.room) && !("answer" in initial.me));
    assert.deepEqual(initial.me.lifelines, {});
    await guest.waitForFunction(length => document.querySelectorAll("#online-board .board-row:first-child .tile").length === length && !document.querySelector('[data-online-key="A"]').disabled, initial.me.wordLength);
    const senseResponse = responseFor(host, "lifeline", "sense");
    await host.click('[data-online-lifeline="sense"] button');
    const sense = await (await senseResponse).json();
    const entry = bank.find(e => e.clue === sense.effect.clue);
    assert(entry && entry.word.length === initial.me.wordLength, "current server clue belongs to the released Bollywood bank");
    await host.waitForSelector("#hint-modal[open]"); await host.click("#hint-ok-button");
    const peekResponse = responseFor(host, "lifeline", "peek");
    await host.click('[data-online-lifeline="peek"] button');
    const peek = await (await peekResponse).json();
    assert.equal(peek.effect.letter, entry.word[peek.effect.position]);
    await host.waitForFunction(() => !document.querySelector('[data-online-key="A"]').disabled);
    const guessed = responseFor(host, "guess");
    for (const letter of entry.word) await host.tap(`[data-online-key="${letter.toUpperCase()}"]`);
    const guessResponse = await guessed; assert.equal(guessResponse.status(), 200);
    const advanced = (await guessResponse.json()).snapshot;
    assert.equal(advanced.me.currentWordIndex, 1); assert.deepEqual(advanced.me.attempts, []);
    assert.deepEqual(advanced.me.lifelines, {});
    await host.reload(); await host.waitForSelector("#online-screen:not([hidden])");
    await host.waitForFunction(() => document.querySelector("#online-live-status").textContent.startsWith("Word 2"));
    const lateResponse = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "join", supportsVariableLength: true, roomCode: code, player: { name: "CinemaLate" } }) });
    assert.equal(lateResponse.status, 200);
    const late = (await lateResponse.json()).snapshot;
    assert.equal(late.me.currentWordIndex, 0); assert.equal(late.me.wordLength, initial.me.wordLength);
    assert.equal(late.players.find(p => p.id === advanced.me.id).currentWordIndex, 1);
    assert(!JSON.stringify(late).includes(entry.word), "a late joiner does not receive the active answer");
    const dataResponse = await fetch(new URL("data/bollywood-answers.json", base));
    assert.equal(dataResponse.status, 404, "the answer bank is excluded from public static hosting");
    console.log(`Live Bollywood passed on ${base}: two isolated browser seats, server theme/length, paid Sense/Peek, solve/advance, refresh restoration, late join and private bank HTTP 404. Room ${code}.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
