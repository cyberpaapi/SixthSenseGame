"use strict";
// Explicit username-service fixture for local browser suites. Production tests
// import Playwright directly and exercise the real durable identity service.
const playwright = require("playwright");
const { randomUUID } = require("node:crypto");
module.exports.chromium = {
  async launch(options) {
    const { sharedIdentityFixture = false, ...launchOptions } = options;
    const browser = await playwright.chromium.launch(launchOptions);
    const sharedProfiles = new Map();
    async function install(surface) {
      // Existing isolated room/layout scenarios get isolated API fixtures.
      // The identity suite explicitly shares one registry across devices.
      const profiles = sharedIdentityFixture ? sharedProfiles : new Map();
      await surface.route("**/api/identity", async route => {
        const body = route.request().postDataJSON();
        let p = profiles.get(body.identityToken);
        if (body.action === "restore") return route.fulfill({ status: p ? 200 : 401, json: p || { error: "Invalid recovery code." } });
        const name = String(body.name || "").normalize("NFKC").replace(/\s+/g, " ").trim();
        if ([...profiles.entries()].some(([token, profile]) => token !== body.identityToken && profile.name.toLowerCase() === name.toLowerCase())) return route.fulfill({ status: 409, json: { error: "That username is already taken." } });
        p = { id: p?.id || randomUUID(), name }; profiles.set(body.identityToken, p);
        return route.fulfill({ json: p });
      });
    }
    const newContext = browser.newContext.bind(browser), newPage = browser.newPage.bind(browser);
    browser.newContext = async options => { const context = await newContext(options); await install(context); return context; };
    browser.newPage = async options => { const page = await newPage(options); await install(page); return page; };
    return browser;
  }
};
