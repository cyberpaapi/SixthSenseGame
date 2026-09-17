"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");

async function check(purchase, options = {}) {
  const calls = [], records = [];
  const sql = async (strings, ...values) => { records.push({ query: strings.join("?"), values }); return strings.join("").includes("RETURNING hits") ? [{ hits: options.hits || 1 }] : []; };
  class GoogleAuth {
    async getClient() { return { request: async request => {
      calls.push(request);
      if (options.unavailable) throw new Error("Provider offline");
      return { data: purchase };
    } }; }
  }
  const context = { module: { exports: {} }, process: { env: options.unconfigured ? {} : { GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: "{}", DATABASE_URL: "test-only", ANDROID_PACKAGE_NAME: "com.sensei.sixthsense" } }, require: name => ({ "node:crypto": crypto, "google-auth-library": { GoogleAuth }, "@neondatabase/serverless": { neon: () => sql } })[name] };
  vm.runInNewContext(fs.readFileSync(require.resolve("./api/play-purchase"), "utf8"), context);
  const response = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  const token = "test-purchase-token-1234567890";
  await context.module.exports({ method: options.method || "POST", body: { purchaseToken: token } }, response);
  return { response, calls, records, token };
}
(async () => {
  for (const unconfigured of [true, false]) {
    const readiness = await check({}, { method: "GET", unconfigured });
    assert.equal(readiness.response.code, unconfigured ? 503 : 200);
    assert.equal(readiness.response.body.available, !unconfigured);
    assert.equal(readiness.calls.length, 0);
  }
  const limited = await check({}, { hits: 16 });
  assert.equal(limited.response.code, 429);
  assert.equal(limited.calls.length, 0, "rate-limited requests must not call Google");
  const valid = await check({ purchaseState: 0, consumptionState: 0, acknowledgementState: 0 });
  assert.equal(valid.response.body.owned, true);
  assert.equal(valid.calls.length, 2);
  assert.equal(valid.calls[1].method, "POST");
  assert.match(valid.calls[1].url, /:acknowledge$/);
  assert(valid.records.some(record => record.values.includes(crypto.createHash("sha256").update(valid.token).digest("hex"))));
  assert(!valid.records.some(record => record.values.includes(valid.token)), "raw tokens must not be stored");
  const restored = await check({ purchaseState: 0, consumptionState: 0, acknowledgementState: 1 });
  assert.equal(restored.response.body.owned, true);
  assert.equal(restored.calls.length, 1, "acknowledged purchases must restore without duplicate acknowledgement");
  for (const purchaseState of [1, 2]) {
    const invalid = await check({ purchaseState, consumptionState: 0, acknowledgementState: 0 });
    assert.equal(invalid.response.body.owned, false);
    assert.equal(invalid.calls.length, 1, "pending/cancelled purchases must never be acknowledged or granted");
  }
  for (const options of [{ unavailable: true }, { unconfigured: true }]) {
    const failed = await check({}, options);
    assert.equal(failed.response.code, 503);
    assert.equal(failed.response.body.owned, undefined);
    assert(!JSON.stringify(failed.response.body).includes(failed.token));
  }
  console.log("Play purchase server passed: verify-before-grant, acknowledgement, restore, pending/refund denial, hashed records, and fail-closed configuration/provider errors.");
})().catch(error => { console.error(error); process.exitCode = 1; });
