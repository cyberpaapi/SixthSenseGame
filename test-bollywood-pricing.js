"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    for (const mode of ["race", "vs", "bollywood", "bollywood-vs"]) {
      const bollywood = mode.startsWith("bollywood");
      const prices = bollywood ? { sense: 75, peek: 125, clear: 100 } : { sense: 30, peek: 50, clear: 40 };
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Price QA" }));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins: 500, economyVersion: 9, inventory: { sense: 0, peek: 0, clear: 0, skip: 0 } }));
      });
      const player = { id: "self", name: "Price QA", avatar: "fox", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false };
      const snapshot = {
        room: { code: "PRICES", mode: mode.includes("vs") ? "vs" : "race", theme: bollywood ? "bollywood" : "classic", status: "running", difficulty: "easy", wordCount: 3, currentRound: 0, revision: 1, maxGuesses: 6 },
        me: { ...player, isHost: true, wordLength: 6, answerKind: bollywood ? "Character" : "", lifelines: {} },
        players: [player, { ...player, id: "other", name: "Friend", seat: 2 }]
      };
      let failNext = false, lifelineRequests = 0;
      await page.route("**/api/multiplayer", async route => {
        const body = route.request().postDataJSON();
        let effect;
        if (body.action === "lifeline") {
          lifelineRequests++;
          if (failNext) {
            failNext = false;
            return route.fulfill({ status: 503, json: { error: "Temporary fixture failure" } });
          }
          snapshot.me.lifelines.round = 0;
          if (body.kind === "sense") {
            snapshot.me.lifelines.clue = "A college student's unusual lessons outlast his borrowed identity.";
            effect = { kind: "sense", clue: snapshot.me.lifelines.clue };
          } else if (body.kind === "peek") {
            const peeked = snapshot.me.lifelines.peeked ||= [];
            const position = peeked.length;
            effect = { kind: "peek", position, letter: "rancho"[position] };
            peeked.push({ position, letter: effect.letter });
          } else {
            effect = { kind: "clear", letters: ["x", "y", "z"] };
            snapshot.me.lifelines.eliminatedLetters = effect.letters;
          }
          snapshot.room.revision++;
        }
        return route.fulfill({ json: { roomCode: "PRICES", resumeToken: "fixture-seat", playerId: "self", snapshot, effect } });
      });
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269", { waitUntil: "domcontentloaded" });
      await page.click(`[data-open-online="${mode}"]`);
      await page.click("#online-create-room");
      await page.waitForSelector("#online-board .tile");
      const wallet = () => page.evaluate(() => window.SixthSenseEconomy.state());
      const item = kind => page.locator(`[data-online-lifeline="${kind}"]`);
      const use = async kind => {
        const response = page.waitForResponse(r => r.url().includes("/api/multiplayer") && r.request().postDataJSON()?.action === "lifeline");
        await item(kind).locator("button").click();
        await response;
        await page.waitForFunction(kind => !document.querySelector(`[data-online-lifeline="${kind}"] button`).disabled, kind);
      };
      for (const [kind, price] of Object.entries(prices)) {
        assert.equal(await item(kind).locator(".lifeline-price b").innerText(), String(price), `${mode}: displayed price`);
        assert((await item(kind).locator("button").getAttribute("aria-label")).includes(`${price} coins`), `${mode}: accessible price`);
      }
      let expected = 500;
      await use("sense"); expected -= prices.sense;
      assert.equal((await wallet()).coins, expected, `${mode}: Sense deduction`);
      await page.waitForSelector("#hint-modal[open]"); await page.click("#hint-ok-button");
      const requestsBeforeReopen = lifelineRequests;
      await item("sense").locator("button").click();
      await page.waitForSelector("#hint-modal[open]");
      assert.equal((await wallet()).coins, expected, "reopening Sense is free");
      assert.equal(lifelineRequests, requestsBeforeReopen, "reopening uses the unlocked clue");
      await page.click("#hint-ok-button");
      for (const kind of ["peek", "clear"]) {
        await use(kind); expected -= prices[kind];
        assert.equal((await wallet()).coins, expected, `${mode}: ${kind} deduction`);
        assert.equal((await wallet()).inventory[kind], 0);
      }
      // Existing failure semantics retain the purchased inventory; retry must not charge again.
      failNext = true;
      await use("peek"); expected -= prices.peek;
      assert.equal((await wallet()).coins, expected);
      assert.equal((await wallet()).inventory.peek, 1);
      assert(await item("peek").locator(".lifeline-price").isHidden());
      await use("peek");
      assert.equal((await wallet()).coins, expected, "stored inventory does not require another purchase");
      assert.equal((await wallet()).inventory.peek, 0);
      const insufficientBalance = Math.min(expected, prices.peek - 1);
      await page.evaluate(balance => {
        const economy = window.SixthSenseEconomy;
        economy.spend(economy.state().coins - balance, "fixture balance");
      }, insufficientBalance);
      const requestsBeforeDenial = lifelineRequests;
      await item("peek").locator("button").click();
      await page.waitForFunction(cost => document.querySelector("#online-live-status").textContent.includes(`Peek needs ${cost} coins`), prices.peek);
      assert.equal((await wallet()).coins, insufficientBalance);
      assert.equal(lifelineRequests, requestsBeforeDenial, "insufficient balance must not request an effect");
      assert.deepEqual(errors, []);
      await page.close();
    }
    console.log("Bollywood pricing passed: Race/VS 75/125/100 prices and deductions, classic 30/50/40, ARIA, free Sense reopening, stored tokens, failed-request retry and insufficient funds.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
