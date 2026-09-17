"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const page = await browser.newPage({ viewport: { width: 360, height: 686 }, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      if (window.top !== window) return;
      const state = { eligible: true, ageBand: "18+", owned: false };
      window.__bannerQA = { state, visible: false };
      window.Capacitor = { isNativePlatform: () => true, registerPlugin: name => name === "App" ? { addListener() {} } : {
        getState: async () => state, initialize: async () => state,
        addListener: async (name, listener) => { window.__bannerQA.notify = () => listener(state); },
        setBanner: async ({ visible }) => { window.__bannerQA.visible = visible; }
      } };
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Banner QA" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
    });
    const root = process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269";
    await page.goto(root);
    await page.click('[data-start-mode="practice"]');
    await page.waitForFunction(() => window.__bannerQA.visible);
    async function measure(prefix) {
      // Wait for the resize observer's visible result instead of assuming that
      // a fixed delay includes its frame. A persistent overlap still times out.
      await page.waitForFunction(prefix => {
        const board = document.querySelector(prefix === "game" ? "#game-board" : "#online-board");
        const bounds = board.getBoundingClientRect();
        const wrap = board.closest(".board-wrap").getBoundingClientRect();
        return bounds.width > 0 && bounds.top >= wrap.top - 1 && bounds.bottom <= wrap.bottom + 1;
      }, prefix, { timeout: 3000 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      return page.evaluate(prefix => {
        const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        return { board: rect(prefix === "game" ? "#game-board" : "#online-board"), keyboard: rect(prefix === "game" ? "#keyboard" : "#online-keyboard"), dock: rect(`#${prefix}-screen .lifeline-dock`), key: rect(`#${prefix}-screen .key`), height: innerHeight, scroll: document.documentElement.scrollHeight };
      }, prefix);
    }
    // WebView sizes reserve 56 px system bars plus 58–68 px for the native ad.
    const fits = m => m.scroll <= m.height && m.dock.bottom <= m.height && m.keyboard.bottom <= m.dock.top + 1 && (m.board.bottom <= m.keyboard.top || (m.board.right <= m.keyboard.left && m.board.bottom <= m.height));
    for (const viewport of [{ width: 320, height: 454 }, { width: 360, height: 686 }, { width: 390, height: 720 }, { width: 430, height: 808 }, { width: 844, height: 360 }, { width: 866, height: 294 }]) {
      await page.setViewportSize(viewport);
      for (const extra of [false, true]) {
        await page.evaluate(extra => {
          const board = document.querySelector("#game-board");
          board.classList.toggle("has-extra-row", extra);
          if (extra) board.append(board.firstElementChild.cloneNode(true));
          else if (board.children.length > 6) board.lastElementChild.remove();
        }, extra);
        const m = await measure("game");
        assert(m.scroll <= m.height, JSON.stringify(m));
        assert(fits(m), JSON.stringify(m));
        assert(m.key.height >= 44);
      }
    }
    await page.click('[data-modal-open="settings-modal"]');
    await page.waitForFunction(() => !window.__bannerQA.visible);
    await page.locator('#settings-modal .modal-close').click();
    await page.waitForFunction(() => window.__bannerQA.visible);
    await page.evaluate(() => { window.__bannerQA.state.owned = true; window.__bannerQA.notify(); });
    await page.waitForFunction(() => !window.__bannerQA.visible);
    await page.evaluate(() => { window.__bannerQA.state.owned = false; window.__bannerQA.notify(); });

    // Explicit room-API fixture; layout QA does not claim a live multiplayer match.
    const player = { id: "self", name: "Banner QA", avatar: "fox", accent: "violet", accentHex: "#7c45e8", seat: 1, currentWordIndex: 0, attempts: [], score: 0, finished: false, eliminated: false };
    for (const mode of ["vs", "race", "coop"]) {
      await page.goto(root);
      await page.route("**/api/multiplayer", route => route.fulfill({ json: { roomCode: "BANNER", resumeToken: "test-only", playerId: "self", snapshot: {
        room: { code: "BANNER", mode, difficulty: "easy", wordCount: 3, currentRound: 0, status: "running", revision: 1 },
        me: { ...player, isHost: true, lifelines: {} }, players: [player, { ...player, id: "other", name: "Friend", seat: 2 }]
      } } }));
      await page.click(`[data-open-online="${mode}"]`);
      await page.click("#online-create-room");
      await page.waitForSelector("#online-board .tile");
      await page.waitForFunction(() => window.__bannerQA.visible);
      for (const viewport of [{ width: 360, height: 686 }, { width: 390, height: 720 }, { width: 430, height: 808 }, { width: 844, height: 360 }, { width: 866, height: 294 }]) {
        await page.setViewportSize(viewport);
        const m = await measure("online");
        assert(fits(m), `${mode}: ${JSON.stringify(m)}`);
        assert(m.key.height >= 44);
      }
      await page.unroute("**/api/multiplayer");
    }
    console.log("Banner layout passed: reserved ad/system-bar space, six/seven rows, solo/VS/Race/Co-op, visible 44 px controls, dialog hiding and paid removal.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
