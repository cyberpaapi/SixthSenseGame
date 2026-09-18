"use strict";
const openLegacySolo = require("./test-legacy-solo-helper");
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");
const path = require("node:path");
const fs = require("node:fs");

// Catches a pale unsubmitted tile underneath dark-theme white text, and a
// dark-theme override accidentally covering the scored/Peek state backgrounds.
function luminance(rgb) {
  const channels = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const unit = value / 255;
    return unit <= .04045 ? unit / 12.92 : ((unit + .055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "ContrastTester" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ dark: true, effects: false, music: false }));
    });
    await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4173", { waitUntil: "networkidle" });
    await openLegacySolo(page, "practice");
    await page.keyboard.type("ra");
    assert.equal(await page.locator('#game-board [data-letter="r"]').count(), 1);
    for (const dark of [true, false]) {
      if (!dark) {
        await page.click('[data-modal-open="settings-modal"]');
        await page.click('label:has(#dark-mode)');
        await page.click("#settings-modal .modal-close");
      }
      const samples = await page.evaluate(() => {
        const sample = element => {
          const style = getComputedStyle(element);
          return { color: style.color, image: style.backgroundImage, background: style.backgroundColor };
        };
        const result = { typed: sample(document.querySelector('#game-board [data-letter="r"]')), empty: sample(document.querySelector('#game-board [data-letter=""]')), boards: {} };
        // Style fixtures in both real board containers; no simulated room logic.
        for (const id of ["game-board", "online-board"]) {
          result.boards[id] = {};
          for (const state of ["", "exact", "present", "absent", "peeked"]) {
            const tile = document.createElement("div");
            tile.className = `tile ${state}`;
            tile.dataset.letter = "R";
            tile.textContent = "R";
            document.getElementById(id).appendChild(tile);
            result.boards[id][state || "typed"] = sample(tile);
            tile.remove();
          }
        }
        return result;
      });
      for (const [name, tile] of Object.entries({ typed: samples.typed, empty: samples.empty, ...Object.fromEntries(Object.entries(samples.boards).map(([id, tiles]) => [id, tiles.typed])) })) {
        const stops = tile.image.match(/rgb\([^)]+\)/g) || [tile.background];
        for (const stop of stops) {
          const ratio = contrast(tile.color, stop);
          assert(ratio >= 4.5, `${dark ? "Dark" : "Light"} ${name} contrast must be >= 4.5:1, got ${ratio.toFixed(2)}:1 (${tile.color} on ${stop})`);
          if (dark) assert(luminance(stop) < .15, "unsubmitted dark-theme tiles must have a dark surface");
        }
      }
      for (const states of Object.values(samples.boards)) {
        for (const state of ["exact", "present", "absent"]) assert.equal(states[state].image, "none", `${state} must keep its solid feedback color`);
        assert.equal(new Set([states.exact.background, states.present.background, states.absent.background]).size, 3);
        assert(contrast(states.peeked.color, states.peeked.image.match(/rgb\([^)]+\)/g)[0]) >= 4.5, "Peek text must remain readable");
      }
      if (dark && process.env.SIXTH_SENSE_EVIDENCE) {
        fs.mkdirSync(process.env.SIXTH_SENSE_EVIDENCE, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SIXTH_SENSE_EVIDENCE, "dark-typed-tiles.png") });
      }
    }
    console.log("Tile contrast passed: typed/empty tiles in light and dark, shared solo/online styles, scored colors, and Peek.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
