"use strict";

const assert = require("node:assert");
const { chromium } = require("playwright");

const baseUrl = process.env.SIXTH_SENSE_PRODUCTION_URL || "https://sixth-sense-game.vercel.app";
const chromePath = process.env.CHROME_BIN || undefined;
const guesses = ["rattle", "raffle", "planet", "banner", "market", "school", "bridge"];

async function seedIdentity(page, name, avatar, accent) {
  await page.addInitScript(({ playerName, playerAvatar, playerAccent }) => {
    localStorage.setItem("sixth-sense.visited.v1", "yes");
    localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: playerName }));
    localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ avatar: playerAvatar, accent: playerAccent, music: false, effects: false }));
  }, { playerName: name, playerAvatar: avatar, playerAccent: accent });
}

async function submitWord(page, word) {
  const submitted = page.waitForResponse(response => response.url().includes("/api/multiplayer") && response.request().method() === "POST" && response.request().postDataJSON()?.action === "guess");
  for (const letter of word) await page.click(`[data-online-key="${letter.toUpperCase()}"]`);
  assert.equal((await submitted).status(), 200, "the server must accept the submitted guess");
  await page.waitForFunction(() => document.querySelector("#last-chance-modal[open]") || !document.querySelector("#online-round-transition")?.hidden || !document.querySelector('[data-online-key="A"]')?.disabled);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: chromePath });
  const hostContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guestContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();
  const suffix = String(Date.now()).slice(-6);
  const hostName = `Fox${suffix}`;
  const guestName = `Owl${suffix}`;
  const startedAt = Date.now();

  try {
    await seedIdentity(hostPage, hostName, "fox", "coral");
    await seedIdentity(guestPage, guestName, "owl", "aqua");
    await Promise.all([
      hostPage.goto(baseUrl, { waitUntil: "networkidle" }),
      guestPage.goto(baseUrl, { waitUntil: "networkidle" })
    ]);

    await hostPage.click('[data-open-online="vs"]');
    await hostPage.click("#online-create-room");
    await hostPage.waitForSelector("#online-screen:not([hidden])", { timeout: 15000 });
    const roomCode = (await hostPage.locator("#online-room-code").textContent()).trim();
    assert.match(roomCode, /^[A-HJ-NP-Z2-9]{6}$/);

    await guestPage.click('[data-open-online="vs"]');
    await guestPage.fill("#online-join-code", roomCode);
    await guestPage.click("#online-join-room");
    await guestPage.waitForSelector("#online-screen:not([hidden])", { timeout: 15000 });
    await hostPage.waitForSelector("#online-start:not([hidden])", { timeout: 5000 });
    await hostPage.click("#online-start");
    await Promise.all([
      hostPage.waitForFunction(() => !document.querySelector('[data-online-key="A"]')?.disabled, null, { timeout: 10000 }),
      guestPage.waitForFunction(() => !document.querySelector('[data-online-key="A"]')?.disabled, null, { timeout: 10000 })
    ]);
    assert.equal(await hostPage.locator('[data-online-lifeline="sense"] button').isEnabled(), true, "VS lifelines must be live before the first attempt");
    assert.equal(await hostPage.locator("#online-board .tile").count(), 36, "new production rooms must use six standard rows");
    assert.equal(await guestPage.locator("#online-board .tile").count(), 36, "both seats must receive the six-try room limit");
    assert.equal(await hostPage.locator('[data-online-lifeline="skip"]').isHidden(), true, "VS must not expose Skip");

    await hostPage.click('[data-online-lifeline="sense"] button');
    await hostPage.waitForSelector("#hint-modal[open]", { timeout: 10000 });
    const purchasedClue = await hostPage.locator("#hint-dialog-copy").textContent();
    assert(await hostPage.evaluate(clue => window.SixthSenseCore.ANSWERS.some(entry => entry.clue === clue), purchasedClue), "server clue must belong to the current published bank");
    await hostPage.click("#hint-ok-button");
    const balanceAfterHint = await hostPage.locator("#coin-count").textContent();
    await hostPage.reload({ waitUntil: "domcontentloaded" });
    await hostPage.waitForSelector("#online-screen:not([hidden])", { timeout: 10000 });
    await hostPage.click('[data-online-lifeline="sense"] button');
    await hostPage.waitForSelector("#hint-modal[open]");
    assert.equal(await hostPage.locator("#hint-dialog-copy").textContent(), purchasedClue, "purchased clue must survive an authoritative refresh");
    assert.equal(await hostPage.locator("#coin-count").textContent(), balanceAfterHint, "reopening after refresh must not charge again");
    await hostPage.click("#hint-ok-button");

    assert.match(await hostPage.locator("#online-versus-names").textContent(), new RegExp(`${hostName} 0VS0 ${guestName}`));
    assert.match(await guestPage.locator("#online-versus-names").textContent(), new RegExp(`${hostName} 0VS0 ${guestName}`));

    await guestPage.reload({ waitUntil: "domcontentloaded" });
    await guestPage.waitForSelector("#online-screen:not([hidden])", { timeout: 10000 });
    assert.match(await guestPage.locator("#online-versus-names").textContent(), new RegExp(`${hostName} 0VS0 ${guestName}`), "refresh must restore the same guest seat");

    const observeStartedAt = Date.now();
    await submitWord(hostPage, guesses[0]);
    await guestPage.waitForSelector(".attempt-patterns > span", { timeout: 5000 });
    const observerLatencyMs = Date.now() - observeStartedAt;

    const peekResponse = hostPage.waitForResponse(response => response.url().includes("/api/multiplayer") && response.request().method() === "POST" && response.request().postDataJSON()?.action === "lifeline" && response.request().postDataJSON()?.kind === "peek");
    await hostPage.click('[data-online-lifeline="peek"] button');
    const peekResult = await (await peekResponse).json();
    assert.equal(peekResult.effect.kind, "peek");
    assert(peekResult.snapshot.me.attempts.every(attempt => attempt.score[peekResult.effect.position] !== "exact"), "production Reveal must never select an already-green position");
    await hostPage.waitForFunction(() => !document.querySelector('[data-online-key="A"]')?.disabled);

    for (const word of guesses.slice(1)) {
      if (await hostPage.locator("#online-round-transition:not([hidden])").count() || await hostPage.locator("#last-chance-modal[open]").count()) break;
      await submitWord(hostPage, word);
    }

    if (!(await hostPage.locator("#online-round-transition:not([hidden])").count())) {
      await hostPage.waitForSelector("#last-chance-modal[open]", { timeout: 6000 });
      await hostPage.click("#last-chance-decline");
    }

    await Promise.all([
      hostPage.waitForSelector("#online-round-transition:not([hidden])", { timeout: 6000 }),
      guestPage.waitForSelector("#online-round-transition:not([hidden])", { timeout: 6000 })
    ]);
    assert.match(await hostPage.locator("#online-round-title").textContent(), /New word|Match complete/);
    assert.match(await guestPage.locator("#online-round-score").textContent(), new RegExp(`${guestName} 1`));

    for (const page of [hostPage, guestPage]) {
      await page.click("#online-leave");
      await page.click("#online-leave-confirm");
      await page.waitForSelector("#home-screen:not([hidden])", { timeout: 5000 });
    }

    await hostPage.click('[data-open-online="coop"]');
    await hostPage.click("#online-create-room");
    await hostPage.waitForSelector("#online-screen:not([hidden])", { timeout: 15000 });
    const coopCode = (await hostPage.locator("#online-room-code").textContent()).trim();
    await guestPage.click('[data-open-online="coop"]');
    await guestPage.fill("#online-join-code", coopCode);
    await guestPage.click("#online-join-room");
    await guestPage.waitForSelector("#online-screen:not([hidden])", { timeout: 15000 });
    await hostPage.waitForSelector("#online-start:not([hidden])", { timeout: 5000 });
    await hostPage.click("#online-start");
    await Promise.all([
      hostPage.waitForFunction(() => !document.querySelector('[data-online-lifeline="sense"] button')?.disabled, null, { timeout: 10000 }),
      guestPage.waitForFunction(() => document.querySelector("#online-live-status")?.textContent.includes("Shared word 1"), null, { timeout: 10000 })
    ]);
    assert.equal(await hostPage.locator('[data-online-lifeline="skip"]').isHidden(), true, "Co-op Skip is disabled");
    assert.equal(await guestPage.locator('[data-online-lifeline="skip"]').isHidden(), true);
    const deniedSkip = await hostPage.evaluate(async () => {
      const seat = JSON.parse(localStorage.getItem("sixth-sense.active-room.v1"));
      const response = await fetch("/api/multiplayer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "lifeline", kind: "skip", roomCode: seat.roomCode, resumeToken: seat.token, actionId: crypto.randomUUID() }) });
      return { status: response.status, body: await response.json() };
    });
    assert.equal(deniedSkip.status, 409);
    assert.match(deniedSkip.body.error, /Skip is disabled/);
    const presenceRequests = [];
    hostPage.on("request", request => { if (request.method() === "POST" && request.url().includes("/api/multiplayer")) { const body = request.postDataJSON(); if (body.action === "presence") presenceRequests.push(body); } });
    const hostId = await hostPage.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.active-room.v1")).playerId);
    await hostPage.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
    await guestPage.waitForSelector('.player-progress[data-player-id="' + hostId + '"] .is-away', { timeout: 10000 });
    assert.match(await guestPage.locator("#online-presence-alert").textContent(), new RegExp(hostName));
    await hostPage.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
    await guestPage.waitForFunction(id => !document.querySelector('.player-progress[data-player-id="' + id + '"] .is-away'), hostId);
    await guestPage.evaluate(() => { document.querySelector("#online-presence-alert").hidden = true; });
    await hostPage.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange"));
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange"));
    });
    await guestPage.waitForSelector("#online-presence-alert:not([hidden])", { timeout: 10000 });
    await guestPage.waitForFunction(id => !document.querySelector('.player-progress[data-player-id="' + id + '"] .is-away'), hostId);
    const delivered = await hostPage.evaluate(async departure => {
      const options = body => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const retry = await fetch("/api/multiplayer", options(departure));
      if (!retry.ok) throw Error("presence retry failed");
      const response = await fetch("/api/multiplayer", options({ action: "snapshot", roomCode: departure.roomCode, resumeToken: departure.resumeToken }));
      return (await response.json()).snapshot;
    }, presenceRequests.find(request => request.away));
    assert.equal(delivered.players.find(player => player.id === hostId).awayCount, 2, "duplicate departures must not create duplicate alerts");
    assert.equal(delivered.me.screenAway, false, "delayed departure retry must not mark a returned player away");

    console.log(`Production multiplayer QA passed: VS room ${roomCode}, Co-op room ${coopCode}, two isolated clients, current-bank hint purchase/free reopening after refresh, live attempt visibility (${observerLatencyMs}ms), synchronized VS transition, Co-op Skip removal, shared away alerts/red avatars/return and quick-switch detection (${Date.now() - startedAt}ms total).`);
  } finally {
    await hostContext.close();
    await guestContext.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
