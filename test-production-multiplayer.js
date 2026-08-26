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
  for (const letter of word) await page.click(`[data-online-key="${letter.toUpperCase()}"]`);
  await page.click('[data-online-key="ENTER"]');
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

    assert.match(await hostPage.locator("#online-versus-names").textContent(), new RegExp(`${hostName} 0VS0 ${guestName}`));
    assert.match(await guestPage.locator("#online-versus-names").textContent(), new RegExp(`${hostName} 0VS0 ${guestName}`));

    await guestPage.reload({ waitUntil: "networkidle" });
    await guestPage.waitForSelector("#online-screen:not([hidden])", { timeout: 10000 });
    assert.match(await guestPage.locator("#online-versus-names").textContent(), new RegExp(`${hostName} 0VS0 ${guestName}`), "refresh must restore the same guest seat");

    const observeStartedAt = Date.now();
    await submitWord(hostPage, guesses[0]);
    await guestPage.waitForSelector(".attempt-patterns > span", { timeout: 5000 });
    const observerLatencyMs = Date.now() - observeStartedAt;

    for (const word of guesses.slice(1)) {
      if (await hostPage.locator("#online-round-transition:not([hidden])").count()) break;
      await submitWord(hostPage, word);
    }

    await Promise.all([
      hostPage.waitForSelector("#online-round-transition:not([hidden])", { timeout: 6000 }),
      guestPage.waitForSelector("#online-round-transition:not([hidden])", { timeout: 6000 })
    ]);
    assert.match(await hostPage.locator("#online-round-title").textContent(), /New word|Match complete/);
    assert.match(await guestPage.locator("#online-round-score").textContent(), new RegExp(`${guestName} 1`));

    console.log(`Production multiplayer QA passed: room ${roomCode}, two isolated clients, refresh rejoin, live attempt visibility (${observerLatencyMs}ms), and synchronized round transition (${Date.now() - startedAt}ms total).`);
  } finally {
    await hostContext.close();
    await guestContext.close();
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
