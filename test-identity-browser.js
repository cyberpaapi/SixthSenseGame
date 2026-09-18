"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN, sharedIdentityFixture: true });
  try {
    const pages = [];
    for (let i = 0; i < 2; i++) {
      const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
      await page.addInitScript(() => localStorage.setItem("sixth-sense.visited.v1", "yes"));
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
      await page.waitForSelector("#username-modal[open]");
      await page.waitForFunction(() => { const r = document.querySelector('#username-offline').getBoundingClientRect(); return r.height >= 44 && r.bottom <= innerHeight; });
      pages.push(page);
    }
    const [a, b] = pages;
    await a.fill("#username-onboarding-input", "Cinema Hero"); await a.click("#username-onboarding-save");
    await a.waitForSelector("#username-modal", { state: "hidden" });
    const original = await a.evaluate(() => window.SixthSenseIdentity.read());
    assert.equal(original.name, "Cinema Hero");
    await b.fill("#username-onboarding-input", " cinema  HERO "); await b.click("#username-onboarding-save");
    await b.waitForFunction(() => document.querySelector("#username-onboarding-message").textContent.includes("already taken"));
    assert.equal(await b.locator("#username-modal").isVisible(), true);
    assert.equal(await b.evaluate(() => window.SixthSenseIdentity.read().id), undefined);
    await b.fill("#username-onboarding-input", "Another Hero"); await b.click("#username-onboarding-save");
    await b.waitForSelector("#username-modal", { state: "hidden" });
    await b.click('[data-modal-open="settings-modal"]');
    await b.fill("#settings-username", "Cinema Hero"); await b.click("#save-settings-username");
    await b.waitForFunction(() => document.querySelector("#settings-username-message").textContent.includes("already taken"));
    assert.equal(await b.evaluate(() => window.SixthSenseIdentity.read().name), "Another Hero");
    const coins = await b.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1"))?.coins);
    await b.click('#settings-modal [data-identity-restore]');
    await b.fill("#identity-restore-code", "0".repeat(64)); await b.click('#identity-restore-form button');
    await b.waitForFunction(() => document.querySelector("#identity-recovery-message").textContent.includes("Invalid"));
    assert.equal(await b.evaluate(() => window.SixthSenseIdentity.read().name), "Another Hero");
    await b.fill("#identity-restore-code", original.token); await b.click('#identity-restore-form button');
    await b.waitForSelector("#identity-recovery-modal", { state: "hidden" });
    assert.equal(await b.evaluate(() => window.SixthSenseIdentity.read().id), original.id);
    assert.equal(await b.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1"))?.coins), coins);
    await b.click("#identity-backup");
    assert.equal((await b.inputValue("#identity-recovery-code")).length, 64);
    const geometry = await b.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, dialog: document.querySelector("#identity-recovery-modal").getBoundingClientRect().width }));
    assert(geometry.scroll <= geometry.width && geometry.dialog <= geometry.width);
    await b.click("#identity-recovery-modal .modal-close");
    assert.equal(await b.inputValue("#identity-recovery-code"), "");
    await b.reload();
    await b.waitForFunction(id => window.SixthSenseIdentity.read().id === id, original.id);
    assert.equal(await b.evaluate(() => window.SixthSenseIdentity.read().name), original.name);
    console.log("Username browser checks passed: duplicate case/space claim, failed rename preservation, invalid/valid recovery, cross-device ownership, unchanged coins, reload and 320px recovery layout.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
