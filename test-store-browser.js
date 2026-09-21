"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");
const catalog = require("./store-catalog");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    page.setDefaultTimeout(15000);
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(catalog => {
      if (window.top !== window) return;
      const listeners = {};
      const state = { owned: false, price: "₹799.00", eligible: true, ageBand: "18+", pendingReward: {}, pendingPurchases: [],
        products: Object.fromEntries(Object.entries(catalog).map(([id, p]) => [id, { price: `₹${p.inr}.00`, owned: false }])) };
      const test = window.__storeTest = { state, acknowledgements: [], ads: [], purchases: [], failAd: false, notify: () => listeners.stateChanged?.({ ...state }) };
      const native = {
        addListener: async (event, fn) => { listeners[event] = fn; }, getState: async () => ({ ...state }), initialize: async () => ({ ...state }),
        setBanner: async () => {}, restorePurchases: async () => {},
        purchaseProduct: async ({ productId }) => test.purchases.push(productId), purchaseRemoveAds: async () => test.purchases.push("remove_banner_ads"),
        acknowledgePurchaseDelivery: async ({ claimId }) => { test.acknowledgements.push(claimId); state.pendingPurchases = state.pendingPurchases.filter(r => r.claimId !== claimId); },
        showInterstitial: async detail => { test.ads.push(detail); if (test.failAd) throw Error("No fill"); return { ...state }; }
      };
      window.Capacitor = { isNativePlatform: () => true, registerPlugin: name => name === "SenseiMonetization" ? native : { addListener: async () => {} } };
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Store QA" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
      if (!localStorage.getItem("sixth-sense.stats.v1")) localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ economyVersion: 10, coins: 500 }));
    }, catalog);
    await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4282");
    await page.waitForFunction(() => window.SixthSensePurchases && document.querySelector('[data-product-id="coins_500"]').textContent.includes("99"));
    const wallet = () => page.evaluate(() => window.SixthSenseEconomy.state());
    const receipt = (id, char) => ({ claimId: char.repeat(64), productId: id, coins: catalog[id].coins, inventory: catalog[id].inventory });
    const deliver = value => page.evaluate(value => { window.__storeTest.state.pendingPurchases = [value]; window.__storeTest.notify(); }, value);
    await page.click("#coin-wallet");
    await page.waitForSelector("#settings-modal[open]");
    await page.click('[data-product-id="coins_500"]');
    assert.deepEqual(await page.evaluate(() => window.__storeTest.purchases), ["coins_500"]);
    const first = receipt("coins_500", "a");
    await deliver(first);
    await page.waitForFunction(() => window.SixthSenseEconomy.state().coins === 1000 && !window.__storeTest.state.pendingPurchases.length);
    await deliver(first);
    await page.waitForFunction(() => !window.__storeTest.state.pendingPurchases.length);
    assert.equal((await wallet()).coins, 1000, "duplicate receipt does not pay twice");
    await page.reload();
    await deliver(first);
    await page.waitForFunction(() => !window.__storeTest.state.pendingPurchases.length);
    assert.equal((await wallet()).coins, 1000, "ledger survives reload");
    await page.click("#coin-wallet");
    const before = await wallet();
    await deliver(receipt("lifeline_kit", "b"));
    await page.waitForFunction(() => !window.__storeTest.state.pendingPurchases.length);
    const kit = await wallet();
    for (const [kind, count] of Object.entries(catalog.lifeline_kit.inventory)) assert.equal(kit.inventory[kind], before.inventory[kind] + count);
    assert.equal(kit.coins, before.coins);
    await deliver(receipt("complete_pack", "c"));
    await page.waitForFunction(() => window.SixthSenseEconomy.state().coins === 2500);
    const complete = await wallet();
    for (const [kind, count] of Object.entries(catalog.complete_pack.inventory)) assert.equal(complete.inventory[kind], kit.inventory[kind] + count);
    await page.evaluate(() => {
      window.__setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) { if (key === "sixth-sense.stats.v1") throw Error("Storage full"); return window.__setItem.call(this, key, value); };
    });
    await deliver(receipt("coins_1500", "d"));
    await page.waitForFunction(() => document.querySelector("#store-message").textContent.includes("Free up storage"));
    assert.equal((await wallet()).coins, 2500, "failed atomic write leaves memory unchanged");
    assert.equal(await page.evaluate(() => window.__storeTest.state.pendingPurchases.length), 1);
    await page.evaluate(() => { Storage.prototype.setItem = window.__setItem; window.__storeTest.notify(); });
    await page.waitForFunction(() => window.SixthSenseEconomy.state().coins === 4000 && !window.__storeTest.state.pendingPurchases.length);
    await page.evaluate(() => window.SixthSenseEconomy.credit(99999, "QA cap"));
    await deliver(receipt("coins_3500", "e"));
    await page.waitForFunction(() => document.querySelector("#store-message").textContent.includes("Spend some coins"));
    assert.equal((await wallet()).coins, 99999);
    assert.equal(await page.evaluate(() => window.__storeTest.state.pendingPurchases.length), 1, "full wallet retains whole paid pack");
    await page.evaluate(() => window.SixthSenseEconomy.spend(4000, "QA space"));
    await page.click("#restore-purchases-button");
    await page.waitForFunction(() => window.SixthSenseEconomy.state().coins === 99499 && !window.__storeTest.state.pendingPurchases.length);
    assert.equal(await page.evaluate(value => { try { window.SixthSensePurchases.applyReceipt({ ...value, coins: 1 }); return false; } catch (_) { return true; } }, receipt("coins_500", "f")), true);
    await page.evaluate(() => {
      window.SixthSenseEconomy.spend(99000, "QA balance");
      const state = window.__storeTest.state; state.products.coins_500.price = "$1.49"; state.owned = true; state.products.complete_pack.owned = true; window.__storeTest.notify();
    });
    assert.match(await page.locator('[data-product-id="coins_500"]').textContent(), /\$1.49/);
    assert.equal(await page.locator("#remove-ads-button").isDisabled(), true);
    assert.equal(await page.locator('[data-product-id="complete_pack"]').isDisabled(), true);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const button of await page.locator(".store-product button").all()) {
        await button.scrollIntoViewIfNeeded();
        const bounds = await button.boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.height >= 44, JSON.stringify(bounds));
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert(await page.locator(".store-product img").evaluateAll(images => images.every(img => img.complete && img.naturalWidth === 512)));
    }
    if (process.env.SIXTH_SENSE_EVIDENCE) {
      await page.locator("#mobile-store").scrollIntoViewIfNeeded();
      await page.screenshot({ path: require("node:path").join(process.env.SIXTH_SENSE_EVIDENCE, "shop-preview.png") });
    }
    await page.evaluate(() => document.querySelector("#settings-modal").close());
    // Real Adventure completion hooks; native unit tests separately check the 3-level cadence.
    for (let level = 0; level < 3; level++) {
      if (level === 0) await page.click("[data-open-adventure-map]");
      await page.click("#adventure-play");
      const word = await page.evaluate(() => { const state = window.SixthSenseAdventure.state(); return window.SixthSenseCore.adventureAnswer(state.level, state.seed).word; });
      await page.keyboard.type(word);
      await page.waitForSelector("#result-modal[open]");
      assert.equal(await page.evaluate(() => window.__storeTest.ads.length), level + 1);
      await page.click("#result-primary");
      await page.evaluate(() => { window.__storeTest.failAd = true; });
    }
    const events = await page.evaluate(() => window.__storeTest.ads);
    assert(events.every(event => event.placement === "adventure"));
    assert.equal(new Set(events.map(event => event.eventId)).size, 3);
    await page.evaluate(() => window.SixthSenseAppLifecycle.back());
    const players = [0, 1].map(i => ({ id: `p${i}`, name: `Player ${i}`, avatar: "fox", seat: i + 1, currentWordIndex: 0, attempts: [], score: 0, finished: false }));
    const me = { ...players[0], isHost: true, wordLength: 6, lifelines: {} };
    const snapshot = { room: { code: "STOREQ", mode: "race", difficulty: "easy", wordCount: 3, status: "running", revision: 1, maxGuesses: 6 }, me, players };
    await page.route("**/api/multiplayer", route => route.fulfill({ json: { roomCode: "STOREQ", resumeToken: "fixture-seat", playerId: "p0", snapshot } }));
    await page.click('[data-open-online="race"]');
    await page.click("#online-create-room");
    await page.waitForSelector(".race-token");
    assert.equal(await page.evaluate(() => window.__storeTest.ads.length), 3, "no ad at match start");
    me.currentWordIndex = 1; players[0].currentWordIndex = 1; snapshot.room.revision++;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    assert.equal(await page.evaluate(() => window.__storeTest.ads.length), 3, "no ad between race words");
    me.currentWordIndex = 3; me.finished = true; players[0].currentWordIndex = 3;
    snapshot.room.status = "finished"; snapshot.room.winnerPlayerId = "p0"; snapshot.room.revision++;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForSelector("#online-result-modal[open]");
    assert.deepEqual(await page.evaluate(() => window.__storeTest.ads.at(-1)), { placement: "multiplayer", eventId: "STOREQ:p0" });
    snapshot.room.revision++;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    assert.equal(await page.evaluate(() => window.__storeTest.ads.length), 4, "finished snapshot does not repeat the ad");
    assert.deepEqual(errors, []);
    await page.close();
    const paidWallet = await browser.newPage();
    paidWallet.setDefaultTimeout(15000);
    await paidWallet.addInitScript(() => {
      if (!localStorage.getItem("sixth-sense.stats.v1")) localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({ coins: 2345, economyVersion: 9, purchaseClaims: { ["a".repeat(64)]: "coins_500" } }));
    });
    await paidWallet.route("**/economy.json?*", route => route.fulfill({ json: { resetVersion: 11, startingCoins: 500 } }));
    await paidWallet.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4282");
    await paidWallet.waitForFunction(() => JSON.parse(localStorage.getItem("sixth-sense.stats.v1")).economyVersion === 11);
    assert.equal(await paidWallet.locator("#coin-count").textContent(), "2345", "bundled migration and web reset preserve paid wallet");
    assert.equal(await paidWallet.locator("#mobile-store").isHidden(), true, "plain web does not expose Play checkout");
    await paidWallet.close();
    console.log("Store browser QA passed: localized prices, catalog contents, atomic delivery, replay/restart recovery, storage failure, full wallet, phone layout, Adventure and full-match ad hooks, result continuation after ad failure.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
