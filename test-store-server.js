"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), vm = require("node:vm"), crypto = require("node:crypto");
const catalog = require("./store-catalog"), { validateToken } = require("./api/play-purchase");
const installation = "a".repeat(64), token = "qa-token-not-a-real-purchase-123456";
function fixture(purchase = {}, opts = {}) {
  const grants = new Map(), calls = [], records = [];
  const sql = async (strings, ...values) => {
    const query = strings.join("?"); records.push({ query, values });
    if (query.includes("RETURNING hits")) return [{ hits: opts.hits || 1 }];
    if (query.includes("INSERT INTO sixth_sense_store_grants")) {
      if (!grants.has(values[0])) grants.set(values[0], { product_id: values[1], installation_id: values[2], delivered: false });
    }
    if (query.includes("SELECT product_id")) return grants.has(values[0]) ? [{ ...grants.get(values[0]) }] : [];
    if (query.includes("UPDATE sixth_sense_store_grants")) grants.get(values[0]).delivered = true;
    return [];
  };
  class GoogleAuth { async getClient() { return { request: async req => {
    calls.push(req);
    if (opts.offline) throw Error("offline");
    if (req.url.endsWith(":consume")) { purchase.consumptionState = 1; if (opts.uncertainConsume) { opts.uncertainConsume = false; throw Error("response lost"); } }
    if (req.url.endsWith(":acknowledge")) purchase.acknowledgementState = 1;
    return { data: { ...purchase } };
  } }; } }
  const context = { module: { exports: {} }, process: { env: opts.unconfigured ? {} : { GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: "{}", DATABASE_URL: "fixture", ANDROID_PACKAGE_NAME: "com.sensei.sixthsense" } }, require: name => ({ "node:crypto": crypto, "google-auth-library": { GoogleAuth }, "@neondatabase/serverless": { neon: () => sql }, "../store-catalog": catalog, "./play-purchase": { validateToken } })[name] };
  vm.runInNewContext(fs.readFileSync("api/play-store.js", "utf8"), context);
  return { grants, calls, records, request: async (body = {}, method = "POST") => {
    const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await context.module.exports({ method, body: { purchaseToken: token, productId: "coins_500", installationId: installation, action: "verify", ...body } }, res);
    return res;
  } };
}
const paid = () => ({ purchaseState: 0, consumptionState: 0, acknowledgementState: 0, quantity: 1, obfuscatedExternalAccountId: installation });
(async () => {
  for (const id of Object.keys(catalog)) {
    const f = fixture(paid());
    const first = await f.request({ productId: id });
    assert.equal(first.code, 200, id);
    assert.equal(first.data.owned, !!catalog[id].permanent);
    if (id === "remove_banner_ads") { assert.equal(first.data.receipt, null); continue; }
    assert.equal(first.data.receipt.coins, catalog[id].coins);
    assert.deepEqual(JSON.parse(JSON.stringify(first.data.receipt.inventory)), catalog[id].inventory);
    assert.equal(f.calls.some(c => c.url.endsWith(":consume")), false, "verification must not consume before durable client delivery");
    const repeat = await f.request({ productId: id });
    assert.equal(repeat.data.receipt.claimId, first.data.receipt.claimId);
    assert.equal((await f.request({ productId: id, action: "deliver" })).data.delivered, true);
    assert.equal((await f.request({ productId: id })).data.receipt, null, "delivered supplies cannot reappear");
    assert(!f.records.some(r => r.values.includes(token)), "only token hashes stored");
    assert.equal(f.calls.filter(c => c.url.endsWith(":consume")).length, catalog[id].permanent ? 0 : 1);
  }
  for (const state of [1, 2, undefined]) {
    const f = fixture({ ...paid(), purchaseState: state });
    assert.equal((await f.request()).data.receipt, undefined); assert.equal(f.grants.size, 0);
  }
  for (const change of [{ productId: "made_up" }, { installationId: "bad" }, { action: "refund" }]) assert.equal((await fixture(paid()).request(change)).code, 400);
  const mismatch = fixture({ ...paid(), obfuscatedExternalAccountId: "b".repeat(64) });
  assert.equal((await mismatch.request()).code, 409);
  const restored = await mismatch.request({ productId: "complete_pack" });
  assert.equal(restored.data.owned, true); assert.equal(restored.data.receipt, undefined);
  assert.equal((await fixture({ ...paid(), quantity: 2 }).request()).code, 409);
  assert.equal((await fixture(paid(), { hits: 41 }).request()).code, 429);
  for (const options of [{ offline: true }, { unconfigured: true }]) assert.equal((await fixture(paid(), options).request()).code, 503);
  const recovery = fixture(paid(), { uncertainConsume: true });
  await recovery.request(); assert.equal((await recovery.request({ action: "deliver" })).code, 503);
  assert.equal((await recovery.request({ action: "deliver" })).data.delivered, true);
  assert.equal(recovery.calls.filter(c => c.url.endsWith(":consume")).length, 1);
  const concurrent = fixture(paid());
  const both = await Promise.all([concurrent.request(), concurrent.request()]);
  assert.equal(concurrent.grants.size, 1); assert.equal(both[0].data.receipt.claimId, both[1].data.receipt.claimId);
  console.log("Store server passed: catalog grants, pending/refund rejection, installation binding, duplicate/concurrent delivery, permanent restore, consume recovery and fail-closed errors.");
})().catch(e => { console.error(e); process.exitCode = 1; });
