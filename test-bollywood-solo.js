"use strict";
const assert = require("node:assert/strict");
const Solo = require("./bollywood-solo");
const Core = require("./game-core");
const Progression = require("./progression");
const { chromium } = require("./test-browser-runtime");
assert.deepEqual(Solo.answers, require("./data/bollywood-answers.json").map(({ word, clue, kind }) => ({ word, clue, kind })));
let seen = [], previous = "";
for (let i = 0; i < 125; i++) {
  const next = Solo.next(seen, previous, () => 0);
  assert(!seen.includes(next.answer.word)); seen = next.seen; previous = next.answer.word;
}
assert.equal(seen.length, 125);
assert.notEqual(Solo.next(seen, previous, () => .999).answer.word, previous);
assert(Core.validateHardMode("aaaaaaa", [{ guess: "aaaaaab", score: ["absent", "absent", "absent", "absent", "absent", "absent", "exact"] }])?.includes("7"));
let trio;
for (const word of ["anand", "sholay", "padosan"]) { const next = Progression.recordSolve(trio, { date:"2026-10-14", word, won:true }); trio = next.state; }
assert.equal(trio.claimed, true);
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
  try {
    for (const viewport of [{ width:320,height:568 },{ width:390,height:844 },{ width:844,height:360 }]) {
      const page = await browser.newPage({ viewport, reducedMotion:"reduce" });
      const errors=[]; page.on("pageerror", error => errors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem("sixth-sense.visited.v1", "yes");
        localStorage.setItem("sixth-sense.online.identity.v1", JSON.stringify({name:"Cinema QA"}));
        localStorage.setItem("sixth-sense.settings.v1", JSON.stringify({music:false,effects:false}));
        localStorage.setItem("sixth-sense.stats.v1", JSON.stringify({economyVersion:10,coins:5000}));
      });
      await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4269");
      for (const word of ["anand", "sholay", "padosan"]) {
        await page.evaluate(word => localStorage.setItem("sixth-sense.bollywood-solo.v1", JSON.stringify({version:4,mode:"bollywood",answer:word,status:"playing",guesses:[]})), word);
        await page.click('[data-start-mode="bollywood"]');
        assert.equal(await page.locator('#game-board .board-row').count(),6);
        assert.equal(await page.locator('#game-board .board-row').first().locator('.tile').count(),word.length);
        assert.match(await page.locator('#mode-detail').innerText(),new RegExp(`${word.length} letters`, "i"));
        const before=await page.evaluate(() => window.SixthSenseEconomy.state().coins);
        await page.click('#clue-button'); await page.click('#hint-ok-button');
        assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins),before-75);
        await page.click('#clue-button'); await page.click('#hint-ok-button');
        assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins),before-75);
        await page.reload(); await page.click('[data-start-mode="bollywood"]');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('sixth-sense.bollywood-solo.v1')).clueUsed),true);
        await page.waitForTimeout(150);
        const fit=await page.evaluate(() => {
          const board=document.querySelector('#game-board').getBoundingClientRect();
          const dock=document.querySelector('#skip-puzzle-button').getBoundingClientRect();
          return {right:board.right,left:board.left,bottom:dock.bottom,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1 || document.documentElement.scrollHeight>innerHeight+1};
        });
        assert(!fit.overflow && fit.left>=0 && fit.right<=viewport.width+1 && fit.bottom<=fit.height+1,JSON.stringify({viewport,word,fit}));
        await page.keyboard.type(word); await page.waitForSelector('#result-modal[open]');
        assert.equal(await page.locator('#result-word > span').count(),word.length);
        assert(await page.locator('#result-next').isVisible());
        await page.click('#result-next');
        assert.notEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('sixth-sense.bollywood-solo.v1')).answer),word);
        await page.reload();
      }
      // Six arbitrary alphabetic guesses are accepted; seventh chance costs 125.
      await page.evaluate(() => localStorage.setItem("sixth-sense.bollywood-solo.v1", JSON.stringify({version:4,mode:"bollywood",answer:"padosan",status:"playing",guesses:[]})));
      await page.click('[data-start-mode="bollywood"]');
      for(let i=0;i<6;i++) { await page.keyboard.type('zzzzzzz'); await page.waitForTimeout(1250); }
      await page.waitForSelector('#last-chance-modal[open]');
      const coins=await page.evaluate(() => window.SixthSenseEconomy.state().coins);
      await page.click('#last-chance-buy');
      assert.equal(await page.locator('#game-board .board-row').count(),7);
      assert.equal(await page.evaluate(() => window.SixthSenseEconomy.state().coins),coins-125);
      await page.keyboard.type('padosan'); await page.waitForSelector('#result-modal[open]');
      assert.equal(await page.locator('#result-attempts').innerText(),'Solved in 7');
      assert.deepEqual(errors,[]); await page.close();
    }
    console.log('Bollywood solo: exact catalog, nonrepeat cycle, 5–7 letters, pricing, restore, win/next, Last Chance and phone/landscape fit passed.');
  } finally { await browser.close(); }
})().catch(error=>{ console.error(error); process.exitCode=1; });

