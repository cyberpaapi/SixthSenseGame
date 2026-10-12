"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { neon } = require("@neondatabase/serverless");
const { SignedDataVerifier, AppStoreServerAPIClient, Environment } = require("@apple/app-store-server-library");
const { validate, grantPurchase } = require("../lib/apple-store");
let schema;
const configured = () => Boolean(process.env.DATABASE_URL && process.env.APPLE_IAP_PRIVATE_KEY && process.env.APPLE_IAP_KEY_ID && process.env.APPLE_IAP_ISSUER_ID && /^[1-9][0-9]+$/.test(process.env.APPLE_APP_ID || ""));

async function verifyFresh(jws) {
  const roots = ["AppleRootCA-G2.cer", "AppleRootCA-G3.cer"].map(file => fs.readFileSync(path.join(__dirname, "../lib/apple-roots", file)));
  const bundleId = "com.sensei.sixthsense";
  // Never trust a decoded client environment; accept only a successful Apple chain verification.
  for (const environment of [Environment.PRODUCTION, Environment.SANDBOX]) {
    const verifier = new SignedDataVerifier(roots, true, environment, bundleId, Number(process.env.APPLE_APP_ID));
    let submitted;
    try { submitted = await verifier.verifyAndDecodeTransaction(jws); } catch { continue; }
    const client = new AppStoreServerAPIClient(process.env.APPLE_IAP_PRIVATE_KEY, process.env.APPLE_IAP_KEY_ID, process.env.APPLE_IAP_ISSUER_ID, bundleId, environment);
    // A cryptographically valid old receipt can predate a refund. Fetch the current transaction.
    const latest = await client.getTransactionInfo(submitted.transactionId);
    const verified = await verifier.verifyAndDecodeTransaction(latest.signedTransactionInfo);
    if (verified.transactionId !== submitted.transactionId || verified.productId !== submitted.productId) throw new Error("Transaction mismatch");
    return verified;
  }
  throw Object.assign(new Error("Apple could not verify the purchase."), { status: 400 });
}

module.exports = async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  if (request.method === "GET") return response.status(configured() ? 200 : 503).json({ available: configured(), catalogVersion: 1 });
  if (request.method !== "POST") return response.status(405).json({ error: "POST required." });
  try {
    const input = validate(request.body);
    if (!configured()) return response.status(503).json({ error: "Apple purchases are not configured yet." });
    const sql = neon(process.env.DATABASE_URL);
    if (!schema) schema = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS sixth_sense_apple_grants (
        claim_id text PRIMARY KEY, product_id text NOT NULL, installation_id text NOT NULL,
        delivered boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz)`;
      await sql`CREATE TABLE IF NOT EXISTS sixth_sense_apple_requests (bucket text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now())`;
    })().catch(error => { schema = null; throw error; });
    await schema;
    const ip = String(request.headers?.["x-vercel-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0];
    const bucket = crypto.createHmac("sha256", process.env.APPLE_IAP_PRIVATE_KEY).update(`apple:${ip}:${Math.floor(Date.now() / 60000)}`).digest("hex");
    const rows = await sql`INSERT INTO sixth_sense_apple_requests (bucket) VALUES (${bucket}) ON CONFLICT (bucket) DO UPDATE SET hits=sixth_sense_apple_requests.hits+1 RETURNING hits`;
    if (Number(rows[0]?.hits) > 30) return response.status(429).json({ error: "Please wait a minute before restoring again." });
    await sql`DELETE FROM sixth_sense_apple_requests WHERE created_at < now() - interval '1 day'`;
    const transaction = await verifyFresh(input.signedTransaction);
    return response.status(200).json(await grantPurchase({ sql, transaction, ...input }));
  } catch (error) {
    // No receipt, key, installation token, or provider URL in logs/responses.
    return response.status(error.status || 503).json({ error: error.status ? error.message : "Purchase verification unavailable. Reconnect and restore purchases." });
  }
};
