"use strict";
const openLegacySolo = require("./test-legacy-solo-helper");
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("sixth-sense.visited.v1", "yes");
      localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({ name: "Touch QA" }));
      localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({ music: false, effects: false }));
    });
    await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
    await openLegacySolo(page, "practice");
    const typed = () => page.evaluate(() => JSON.parse(localStorage.getItem("sixth-sense.practice.v1")).current);
    // Some browsers label the compatibility click as mouse or omit its origin.
    // Replay those real touch clicks with that metadata before the key listener.
    await page.evaluate(() => {
      window.qaClickTypes = ["mouse", "", "touch", "pen", ""];
      document.querySelector("#keyboard").addEventListener("click", event => {
        if (!event.isTrusted || !window.qaClickTypes.length) return;
        event.stopImmediatePropagation();
        event.stopPropagation();
        event.target.dispatchEvent(new PointerEvent("click", {
          bubbles: true, pointerType: window.qaClickTypes.shift(), detail: 1
        }));
      }, { capture: true });
    });
    for (const key of "WZXED") {
      const b = await page.locator(`[data-key="${key}"]`).boundingBox();
      await page.touchscreen.tap(b.x + 1, b.y + b.height / 2);
    }
    assert.equal(await typed(), "wzxed");
    const cdp = await page.context().newCDPSession(page);
    const box = await page.locator('[data-key="BACK"]').boundingBox();
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await page.waitForTimeout(700);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x + 5, y: point.y + 4 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    assert.equal(await typed(), "wzxe", "held/slightly moving Delete activates once");
    assert.equal(await page.evaluate(() => String(getSelection())), "", "holding a key must not select its text");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    assert.equal(await typed(), "wzxe", "cancelled touch must not enter/delete");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x - 50, y: point.y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    assert.equal(await typed(), "wzxe", "dragging away cancels activation");
    await page.locator('[data-key="BACK"]').click();
    assert.equal(await typed(), "wzx", "mouse still works");
    await page.locator('[data-key="BACK"]').focus();
    await page.keyboard.press("Space");
    assert.equal(await typed(), "wz", "focused semantic keyboard activation works once");
    await page.locator('[data-key="E"]').evaluate(button => button.click());
    assert.equal(await typed(), "wze", "assistive/programmatic click remains available");
    console.log("Keyboard touch passed: WZXED edges, held/slight-motion release, cancellation, drag-away, no selection/duplicate, mouse, Space and semantic click.");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
