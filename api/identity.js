"use strict";
const { neon } = require("@neondatabase/serverless");
const identities = require("../lib/identities");

module.exports = async function handler(request, response) {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
  response.setHeader("cache-control", "no-store");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "Use POST." });
  try {
    if (!process.env.DATABASE_URL) throw Object.assign(new Error("Connect to the username service to reserve your name."), { status: 503 });
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    if (!["claim", "restore"].includes(body.action)) throw Object.assign(new Error("Unknown username action."), { status: 400 });
    identities.credential(body.identityToken);
    if (body.action === "claim") identities.username(body.name);
    const sql = neon(process.env.DATABASE_URL);
    await identities.ensureSchema(sql);
    await identities.rateLimit(sql, request);
    const profile = body.action === "claim"
      ? await identities.claim(sql, body.name, body.identityToken)
      : await identities.authenticate(sql, body.identityToken);
    return response.status(200).json({ id: profile.id, name: profile.display_name });
  } catch (error) {
    // Never log request bodies or database parameters containing identity secrets.
    return response.status(error.status || 500).json({ error: error.status ? error.message : "The username service is unavailable. Please try again." });
  }
};
