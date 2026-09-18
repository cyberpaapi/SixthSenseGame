"use strict";

// The retired modes have no production launcher. Exercise their retained save /
// reward engine through an explicit DOM fixture, without adding a runtime hook.
module.exports = async function openLegacySolo(page, mode = "practice") {
  const daily = page.locator('[data-start-mode="daily"]');
  await daily.evaluate((button, legacyMode) => { button.dataset.startMode = legacyMode; }, mode);
  try { await page.locator(`[data-start-mode="${mode}"]`).click(); }
  finally { await page.locator(`[data-start-mode="${mode}"]`).evaluate(button => { button.dataset.startMode = "daily"; }); }
};
