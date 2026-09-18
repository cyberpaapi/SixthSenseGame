"use strict";
const openLegacySolo = require("./test-legacy-solo-helper");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4173");
    await page.evaluate(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "SoundTester" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: true, effects: true }));
      localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({ version: 3, mode: "practice", answer: "planet", clue: "A world.", guesses: [], status: "playing" }));
    });
    await page.reload();
    await openLegacySolo(page, "practice");
    await page.keyboard.type("planet");
    await page.waitForSelector("#result-modal[open]");
    await page.waitForFunction(() => window.SixthSenseAudio.state().lastResult.status === "playing");
    const win = await page.evaluate(() => window.SixthSenseAudio.state());
    assert.deepEqual(win.lastResult.clips, ["applause", "blower"]);
    assert.equal(win.activeResultClips, 2);
    assert.equal(win.musicDucked, true);
    await page.click("#result-primary");
    await page.waitForFunction(() => window.SixthSenseAudio.state().activeResultClips === 0);
    assert.equal(await page.evaluate(() => window.SixthSenseAudio.state().musicDucked), false);

    // Real loss flow: decline the extra attempt after seven misses.
    await page.evaluate(() => {
      const guesses = ["rattle", "castle", "bright", "silver", "purple", "orange", "signal"].map(guess => ({ guess, score: window.SixthSenseCore.scoreGuess(guess, "planet") }));
      localStorage.setItem("sixth-sense.practice.v1", JSON.stringify({ version: 3, mode: "practice", answer: "planet", clue: "A world.", guesses, status: "last-chance" }));
    });
    await openLegacySolo(page, "practice");
    await page.click("#last-chance-decline");
    await page.waitForSelector("#result-modal[open]");
    await page.waitForFunction(() => window.SixthSenseAudio.state().lastResult.status === "playing");
    assert.deepEqual(await page.evaluate(() => window.SixthSenseAudio.state().lastResult.clips), ["aww"]);
    await page.waitForFunction(() => window.SixthSenseAudio.state().lastResult.status === "finished");
    assert.equal(await page.evaluate(() => window.SixthSenseAudio.state().musicDucked), false);
    await page.click("#result-primary");

    // Turning off effects must cancel both playing and pending recorded sounds.
    await page.evaluate(() => window.SixthSenseAudio.play("win"));
    await page.waitForFunction(() => window.SixthSenseAudio.state().lastResult.status === "playing");
    await page.click('[data-modal-open="settings-modal"]');
    await page.click('label:has(#effects-mode)');
    assert.equal(await page.evaluate(() => window.SixthSenseAudio.state().activeResultClips), 0);
    assert.equal(await page.evaluate(() => window.SixthSenseAudio.state().musicDucked), false);
    await page.evaluate(() => window.SixthSenseAudio.play("lose"));
    assert.equal(await page.evaluate(() => window.SixthSenseAudio.state().activeResultClips), 0);
    await page.click('label:has(#effects-mode)');
    await page.evaluate(() => { window.SixthSenseAudio.play("win"); window.SixthSenseAudio.stopResult(); });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await page.evaluate(() => window.SixthSenseAudio.state().activeResultClips), 0, "cancelled asynchronous audio must not start later");

    // A missing optional sound must leave the app usable without a fallback robot voice.
    await page.route("**/assets/audio/**", route => route.abort());
    await page.reload();
    await openLegacySolo(page, "practice");
    await page.evaluate(() => window.SixthSenseAudio.play("lose"));
    await page.waitForFunction(() => window.SixthSenseAudio.state().lastResult.status === "unavailable");
    assert.equal(await page.evaluate(() => window.SixthSenseAudio.state().musicDucked), false);
    assert.deepEqual(errors, []);
    console.log("Result audio passed: decoded applause/blower on wins, crowd aww on losses, music duck/restore, close/mute cancellation, pending cancellation, and missing-file recovery.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
