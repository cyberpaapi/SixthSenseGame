"use strict";
const { neon } = require("@neondatabase/serverless");
const identities = require("../lib/identities");
const { deleteIdentity } = require("../lib/delete-identity");
const { ensureSchema } = require("./multiplayer");
module.exports = async function handler(request, response) {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
  response.setHeader("cache-control", "no-store");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "Use POST." });
  try {
    let body;
    try { body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {}; }
    catch (_) { throw Object.assign(new Error("Invalid request."), { status: 400 }); }
    identities.credential(body.identityToken);
    if (body.confirmation !== "DELETE") throw Object.assign(new Error("Type DELETE to confirm account deletion."), { status: 400 });
    if (!process.env.DATABASE_URL) throw Object.assign(new Error("Account deletion is unavailable. Please try again later."), { status: 503 });
    const sql = neon(process.env.DATABASE_URL);
    await ensureSchema(sql);
    await identities.rateLimit(sql, request);
    return response.status(200).json(await deleteIdentity(sql, body));
  } catch (error) {
    // Never log credentials, request bodies or SQL parameters.
    return response.status(error.status || 500).json({ error: error.status ? error.message : "Your account could not be deleted. Please try again." });
  }
};
