"use strict";
const crypto = require("node:crypto");
const { GoogleAuth } = require("google-auth-library");
const { neon } = require("@neondatabase/serverless");
let schema;

function validateToken(body) {
  const token = body?.purchaseToken;
  if (typeof token !== "string" || token.length < 20 || token.length > 4096 || /[\s\x00-\x1f]/.test(token)) throw Object.assign(new Error("Invalid purchase token."), { status: 400 });
  return token;
}
function isOwnedPurchase(purchase) {
  return purchase.purchaseState === 0 && purchase.consumptionState === 0;
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  const configured = Boolean(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON && process.env.DATABASE_URL && process.env.ANDROID_PACKAGE_NAME);
  if (request.method === "GET") return response.status(configured ? 200 : 503).json({ available: configured });
  if (request.method !== "POST") return response.status(405).json({ error: "POST required." });
  try {
    const token = validateToken(request.body);
    if (!configured) return response.status(503).json({ error: "Purchase verification is not configured." });
    const sql = neon(process.env.DATABASE_URL);
    if (!schema) schema = Promise.all([sql`CREATE TABLE IF NOT EXISTS sixth_sense_play_purchases (
      token_hash text PRIMARY KEY, product_id text NOT NULL, owned boolean NOT NULL,
      verified_at timestamptz NOT NULL DEFAULT now()
    )`, sql`CREATE TABLE IF NOT EXISTS sixth_sense_purchase_requests (
      bucket text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now()
    )`]).catch(error => { schema = null; throw error; });
    await schema;
    const credentials = JSON.parse(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON);
    const ip = String(request.headers?.["x-vercel-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0];
    const bucket = crypto.createHmac("sha256", credentials.private_key || process.env.ANDROID_PACKAGE_NAME).update(`${ip}:${Math.floor(Date.now() / 60000)}`).digest("hex");
    const rate = await sql`INSERT INTO sixth_sense_purchase_requests (bucket) VALUES (${bucket})
      ON CONFLICT (bucket) DO UPDATE SET hits = sixth_sense_purchase_requests.hits + 1 RETURNING hits`;
    if (Number(rate[0]?.hits) > 15) return response.status(429).json({ error: "Please wait a minute before restoring again." });
    await sql`DELETE FROM sixth_sense_purchase_requests WHERE created_at < now() - interval '1 day'`;
    const auth = new GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/androidpublisher"] });
    const client = await auth.getClient();
    const packageName = process.env.ANDROID_PACKAGE_NAME;
    const product = "remove_banner_ads";
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/products/${product}/tokens/${encodeURIComponent(token)}`;
    let purchase;
    try { purchase = (await client.request({ url, timeout: 15000 })).data; }
    catch (error) {
      if ([400, 404, 410].includes(error.response?.status)) return response.status(200).json({ owned: false });
      throw error;
    }
    const owned = isOwnedPurchase(purchase);
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    // Idempotent durable entitlement record; never trust the device's purchased flag.
    await sql`INSERT INTO sixth_sense_play_purchases (token_hash, product_id, owned) VALUES (${hash}, ${product}, ${owned})
      ON CONFLICT (token_hash) DO UPDATE SET owned = EXCLUDED.owned, verified_at = now()`;
    if (owned && purchase.acknowledgementState === 0) {
      await client.request({ url: `${url}:acknowledge`, method: "POST", data: {}, timeout: 15000 });
    }
    return response.status(200).json({ owned });
  } catch (error) {
    // Do not log tokens, credentials, Google request URLs, or full exception objects.
    return response.status(error.status || 503).json({ error: error.status === 400 ? error.message : "Purchase verification is temporarily unavailable. Please restore again." });
  }
};
module.exports.validateToken = validateToken;
module.exports.isOwnedPurchase = isOwnedPurchase;
