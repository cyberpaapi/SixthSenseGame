"use strict";
const crypto = require("node:crypto");
const { GoogleAuth } = require("google-auth-library");
const { neon } = require("@neondatabase/serverless");
const catalog = require("../store-catalog");
const { validateToken } = require("./play-purchase");
let schema;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });

function validate(body) {
  const token = validateToken(body);
  const productId = body?.productId;
  if (!Object.hasOwn(catalog, productId || "")) throw fail("Unknown product.");
  if (!/^[a-f0-9]{64}$/.test(body?.installationId || "")) throw fail("Invalid installation.");
  if (!["verify", "deliver"].includes(body?.action)) throw fail("Invalid purchase action.");
  return { token, productId, installationId: body.installationId, action: body.action, product: catalog[productId] };
}

module.exports = async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  const configured = Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON && process.env.DATABASE_URL && process.env.ANDROID_PACKAGE_NAME);
  if (request.method === "GET") return response.status(configured ? 200 : 503).json({ available: configured, catalogVersion: 1 });
  if (request.method !== "POST") return response.status(405).json({ error: "POST required." });
  try {
    const { token, productId, installationId, action, product } = validate(request.body);
    if (!configured) throw fail("Purchases are not configured yet.", 503);
    const sql = neon(process.env.DATABASE_URL);
    if (!schema) schema = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS sixth_sense_store_grants (
        token_hash text PRIMARY KEY, product_id text NOT NULL, installation_id text NOT NULL,
        delivered boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz
      )`;
      await sql`CREATE TABLE IF NOT EXISTS sixth_sense_purchase_requests (
        bucket text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now()
      )`;
    })().catch(error => { schema = null; throw error; });
    await schema;
    const credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
    const ip = String(request.headers?.["x-vercel-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0];
    const bucket = crypto.createHmac("sha256", credentials.private_key || process.env.ANDROID_PACKAGE_NAME).update(`store:${ip}:${Math.floor(Date.now() / 60000)}`).digest("hex");
    const rate = await sql`INSERT INTO sixth_sense_purchase_requests (bucket) VALUES (${bucket})
      ON CONFLICT (bucket) DO UPDATE SET hits=sixth_sense_purchase_requests.hits+1 RETURNING hits`;
    if (Number(rate[0]?.hits) > 40) throw fail("Please wait a minute and restore again.", 429);
    await sql`DELETE FROM sixth_sense_purchase_requests WHERE created_at < now() - interval '1 day'`;
    const client = await new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/androidpublisher"] }).getClient();
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(process.env.ANDROID_PACKAGE_NAME)}/purchases/products/${productId}/tokens/${encodeURIComponent(token)}`;
    let purchase;
    try { purchase = (await client.request({ url, timeout: 15000 })).data; }
    catch (error) {
      if ([400, 404, 410].includes(error.response?.status)) return response.status(200).json({ owned: false, invalid: true });
      throw error;
    }
    if (purchase.purchaseState !== 0) return response.status(200).json({ owned: false, pending: purchase.purchaseState === 2, invalid: purchase.purchaseState !== 2 });
    if ((purchase.quantity ?? 1) !== 1) throw fail("Contact support to recover this purchase.", 409);
    const owned = Boolean(product.permanent && purchase.consumptionState === 0);
    if (product.permanent && !owned) return response.status(200).json({ owned: false, invalid: true });
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const hasSupplies = product.coins > 0 || Object.keys(product.inventory).length > 0;
    let grant;
    if (hasSupplies) {
      // Bind consumable supplies to the Play-verified installation identifier.
      // A permanent ad-removal benefit can restore elsewhere, but its bonus cannot be farmed.
      if (purchase.obfuscatedExternalAccountId !== installationId) {
        if (owned) return response.status(200).json({ owned, suppliesOnOriginalDevice: true });
        throw fail("Restore this coin or lifeline purchase on its original installation, or contact support.", 409);
      }
      if (purchase.consumptionState === 0) {
        await sql`INSERT INTO sixth_sense_store_grants (token_hash, product_id, installation_id)
          VALUES (${hash}, ${productId}, ${installationId}) ON CONFLICT (token_hash) DO NOTHING`;
      }
      const rows = await sql`SELECT product_id, installation_id, delivered FROM sixth_sense_store_grants WHERE token_hash=${hash}`;
      grant = rows[0];
      if (!grant || grant.product_id !== productId || grant.installation_id !== installationId) throw fail("Contact support to recover this purchase.", 409);
    }
    if (owned && purchase.acknowledgementState === 0) {
      await client.request({ url: `${url}:acknowledge`, method: "POST", data: {}, timeout: 15000 });
    }
    if (hasSupplies && action === "deliver" && !grant.delivered) {
      // Native calls this only after the wallet+receipt write succeeds. A retry
      // after an uncertain consume response sees consumptionState=1 and finishes the ledger.
      if (!product.permanent && purchase.consumptionState === 0) await client.request({ url: `${url}:consume`, method: "POST", timeout: 15000 });
      await sql`UPDATE sixth_sense_store_grants SET delivered=true, delivered_at=now() WHERE token_hash=${hash}`;
      grant.delivered = true;
    }
    if (hasSupplies && !grant.delivered && purchase.consumptionState === 1 && action === "verify") {
      // Consumption can only follow an already durable device grant; don't issue a second receipt.
      await sql`UPDATE sixth_sense_store_grants SET delivered=true, delivered_at=now() WHERE token_hash=${hash}`;
      grant.delivered = true;
    }
    return response.status(200).json({ owned, delivered: Boolean(grant?.delivered),
      receipt: hasSupplies && !grant.delivered ? { claimId: hash, productId, coins: product.coins, inventory: product.inventory } : null });
  } catch (error) {
    // Never log tokens, installation IDs, credentials or provider request URLs.
    return response.status(error.status || 503).json({ error: error.status ? error.message : "Purchase verification is temporarily unavailable. Use Restore purchases when connected." });
  }
};
module.exports.validate = validate;
