"use strict";
const assert = require("node:assert/strict");
const { chromium } = require("./test-browser-runtime");
(async () => {
  const browser = await chromium.launch({ headless:true,executablePath:process.env.CHROME_BIN });
  try {
    const page = await browser.newPage({ viewport:{width:320,height:568},reducedMotion:"reduce" });
    const errors=[]; page.on("pageerror", error=>errors.push(error.message));
    await page.addInitScript(()=>localStorage.setItem("sixth-sense.visited.v1","yes"));
    await page.goto(process.env.SIXTH_SENSE_URL || "http://127.0.0.1:4271");
    await page.waitForSelector("#username-modal[open]");
    await page.fill("#username-onboarding-input","Deletion QA"); await page.click("#username-onboarding-save");
    await page.waitForSelector("#username-modal",{state:"hidden"});
    const profile = await page.evaluate(()=>window.SixthSenseIdentity.read());
    const stats = await page.evaluate(()=>localStorage.getItem("sixth-sense.stats.v1"));
    let requests=0, outcome="failure";
    await page.route("**/api/delete-identity",async route=>{
      requests++;
      assert.deepEqual(route.request().postDataJSON(),{identityToken:profile.token,confirmation:"DELETE"});
      await route.fulfill({status:outcome==="success"?200:503,json:outcome==="success"?{deleted:true}:{error:"Deletion temporarily unavailable"}});
    });
    await page.click('[data-modal-open="settings-modal"]');
    await page.click("#account-delete-open");
    assert.equal(await page.locator('#account-delete-form [type="submit"]').isDisabled(),true);
    await page.click("[data-delete-cancel]"); assert.equal(requests,0);
    await page.click("#account-delete-open");
    await page.fill("#account-delete-confirmation","DELETE");
    await page.click('#account-delete-form [type="submit"]');
    await page.waitForFunction(()=>document.querySelector("#account-delete-message").textContent.includes("temporarily"));
    assert.equal(await page.evaluate(()=>window.SixthSenseIdentity.read().id),profile.id);
    assert.equal(await page.locator("[data-delete-cancel]").isEnabled(),true);
    const bounds=await page.locator("#account-delete-modal").boundingBox();
    assert.ok(bounds.x>=0&&bounds.x+bounds.width<=321);
    outcome="success";
    await Promise.all([page.waitForNavigation({waitUntil:"domcontentloaded"}),page.click('#account-delete-form [type="submit"]')]);
    assert.equal(await page.evaluate(()=>window.SixthSenseIdentity.read().id),undefined);
    assert.equal(await page.evaluate(()=>localStorage.getItem("sixth-sense.online.identity.v1")),null);
    assert.equal(await page.evaluate(()=>localStorage.getItem("sixth-sense.stats.v1")),stats);
    assert.equal(requests,2); assert.deepEqual(errors,[]);
    console.log("Deletion UI: confirmation/cancel, recoverable server failure, 320px dialog, successful local credential clearing and unchanged solo wallet passed.");
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
