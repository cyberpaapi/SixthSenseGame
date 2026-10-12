"use strict";
const crypto = require("node:crypto");
const catalog = require("../store-catalog");
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validate(body) {
  if (!["verify", "deliver"].includes(body?.action) || !uuid.test(body?.installationId || "")) throw fail("Invalid purchase request.");
  if (typeof body.signedTransaction !== "string" || body.signedTransaction.length > 30000 || body.signedTransaction.split(".").length !== 3) throw fail("Invalid transaction.");
  return { action: body.action, installationId: body.installationId.toLowerCase(), signedTransaction: body.signedTransaction };
}

async function grantPurchase({ sql, transaction: t, installationId, action }) {
  if (!t || !/^[0-9]{1,30}$/.test(t.transactionId || "") || !Object.hasOwn(catalog, t.productId || "") || !["Production", "Sandbox"].includes(t.environment)) throw fail("Unknown Apple purchase.");
  if (t.revocationDate != null) return { owned: false, invalid: true };
  const product = catalog[t.productId];
  if (t.quantity !== 1 || t.inAppOwnershipType !== "PURCHASED" || t.type !== (product.permanent ? "Non-Consumable" : "Consumable")) throw fail("Unsupported purchase.", 409);
  const owned = Boolean(product.permanent);
  const supplies = product.coins > 0 || Object.keys(product.inventory).length > 0;
  if (!supplies) return { owned, delivered: true, receipt: null };
  if ((t.appAccountToken || "").toLowerCase() !== installationId) {
    if (owned) return { owned, suppliesOnOriginalDevice: true, receipt: null };
    throw fail("Restore supplies on the original installation or contact support.", 409);
  }
  const claimId = crypto.createHash("sha256").update(`apple:${t.environment}:${t.transactionId}`).digest("hex");
  await sql`INSERT INTO sixth_sense_apple_grants (claim_id, product_id, installation_id)
    VALUES (${claimId}, ${t.productId}, ${installationId}) ON CONFLICT (claim_id) DO NOTHING`;
  const [grant] = await sql`SELECT product_id, installation_id, delivered FROM sixth_sense_apple_grants WHERE claim_id=${claimId}`;
  if (!grant || grant.product_id !== t.productId || grant.installation_id !== installationId) throw fail("Purchase ownership mismatch.", 409);
  if (action === "deliver" && !grant.delivered) {
    await sql`UPDATE sixth_sense_apple_grants SET delivered=true, delivered_at=now() WHERE claim_id=${claimId}`;
    grant.delivered = true;
  }
  return { owned, delivered: grant.delivered, receipt: grant.delivered ? null : {
    claimId, productId: t.productId, coins: product.coins, inventory: product.inventory
  } };
}
module.exports = { validate, grantPurchase };
