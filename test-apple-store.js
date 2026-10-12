"use strict";
const assert = require("node:assert/strict");
const { validate, grantPurchase } = require("./lib/apple-store");
const catalog = require("./store-catalog");
const handler = require("./api/apple-store");
const installationId = "12345678-1234-4234-9234-123456789abc";
function fixture() {
  const grants = new Map();
  const sql = async (strings, ...v) => {
    const query = strings.join("?");
    if (query.startsWith("INSERT")) {
      if (!grants.has(v[0])) grants.set(v[0], { product_id: v[1], installation_id: v[2], delivered: false });
      return [];
    }
    if (query.startsWith("SELECT")) return grants.has(v[0]) ? [{ ...grants.get(v[0]) }] : [];
    if (query.startsWith("UPDATE")) { grants.get(v[0]).delivered = true; return []; }
    throw new Error("Unexpected query");
  };
  return { sql, grants };
}
function transaction(id, extra = {}) {
  return { transactionId: "123456789", productId: id, environment: "Sandbox", quantity: 1,
    inAppOwnershipType: "PURCHASED", type: catalog[id].permanent ? "Non-Consumable" : "Consumable", appAccountToken: installationId, ...extra };
}
async function request(method, body) {
  let code, data;
  await handler({ method, body }, { setHeader() {}, status(v) { code = v; return this; }, json(v) { data = v; } });
  return { code, data };
}
(async () => {
  assert.equal(validate({ action: "verify", installationId, signedTransaction: "a.b.c" }).installationId, installationId);
  for (const change of [{ action: "grant" }, { installationId: "bad" }, { signedTransaction: "bad" }, { signedTransaction: "a".repeat(30001)+".b.c" }]) {
    assert.throws(() => validate({ action: "verify", installationId, signedTransaction: "a.b.c", ...change }));
  }
  for (const id of Object.keys(catalog)) {
    const f = fixture(), t = transaction(id);
    const input = { sql: f.sql, transaction: t, installationId, action: "verify" };
    const first = await grantPurchase(input);
    assert.equal(first.owned, Boolean(catalog[id].permanent));
    if (id === "remove_banner_ads") { assert.equal(first.receipt, null); continue; }
    assert.equal(first.receipt.coins, catalog[id].coins);
    assert.deepEqual(first.receipt.inventory, catalog[id].inventory);
    const concurrent = await Promise.all([grantPurchase(input), grantPurchase(input)]);
    assert.equal(f.grants.size, 1);
    concurrent.forEach(r => assert.deepEqual(r.receipt, first.receipt));
    assert.equal((await grantPurchase({ ...input, action: "deliver" })).delivered, true);
    assert.equal((await grantPurchase({ ...input, action: "deliver" })).delivered, true);
    assert.equal((await grantPurchase(input)).receipt, null);
  }
  for (const extra of [{ quantity: 2 }, { type: "Non-Consumable" }, { inAppOwnershipType: "FAMILY_SHARED" }, { environment: "Xcode" }]) {
    const f = fixture(); await assert.rejects(grantPurchase({ sql: f.sql, transaction: transaction("coins_500", extra), installationId, action: "verify" })); assert.equal(f.grants.size, 0);
  }
  const f = fixture();
  assert.equal((await grantPurchase({ sql: f.sql, transaction: transaction("complete_pack", { revocationDate: Date.now() }), installationId, action: "verify" })).invalid, true);
  assert.equal(f.grants.size, 0);
  const other = "87654321-1234-4234-9234-123456789abc";
  await assert.rejects(grantPurchase({ sql: f.sql, transaction: transaction("coins_500"), installationId: other, action: "verify" }));
  assert.equal((await grantPurchase({ sql: f.sql, transaction: transaction("complete_pack"), installationId: other, action: "verify" })).suppliesOnOriginalDevice, true);
  assert.equal(f.grants.size, 0);
  delete process.env.APPLE_IAP_PRIVATE_KEY;
  assert.equal((await request("GET")).data.available, false);
  assert.equal((await request("POST", { action: "verify", installationId, signedTransaction: "a.b.c" })).code, 503);
  assert.equal((await request("DELETE")).code, 405);
  // Real Apple verifier: malformed or unsigned JWTs cannot reach a supply grant.
  process.env.DATABASE_URL = "postgres://unused";
  const fs = require("node:fs"), { SignedDataVerifier, Environment } = require("@apple/app-store-server-library");
  const roots = ["G2", "G3"].map(version => fs.readFileSync(`lib/apple-roots/AppleRootCA-${version}.cer`));
  const verifier = new SignedDataVerifier(roots, true, Environment.SANDBOX, "com.sensei.sixthsense");
  await assert.rejects(verifier.verifyAndDecodeTransaction("a.b.c"));
  const unsigned = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url") + "." + Buffer.from(JSON.stringify(transaction("coins_500"))).toString("base64url") + ".";
  await assert.rejects(verifier.verifyAndDecodeTransaction(unsigned));
  console.log("Apple store passed: catalog, installation binding, replay/concurrency, delivery retry, revoked/unsupported purchases, disabled setup and real invalid-signature rejection.");
})().catch(error => { console.error(error); process.exitCode = 1; });
