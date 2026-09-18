"use strict";
const crypto = require("node:crypto");
let schema;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const hash = value => crypto.createHash("sha256").update(String(value)).digest("hex");

function username(value) {
  const name = String(value || "").normalize("NFKC").replace(/[<>\p{Cf}]/gu, "").replace(/\s+/gu, " ").trim();
  if (name.length < 2 || name.length > 18 || !/[\p{L}\p{N}]/u.test(name) || /[\p{Cc}]/u.test(name)) throw fail("Use 2–18 characters, including a letter or number.");
  if (/^guest-/i.test(name)) throw fail("Choose a name that does not start with Guest-.");
  return { name, key: name.toLowerCase() };
}

function credential(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value)) throw fail("Refresh or update the game, then reserve your username or restore its recovery code.", 401);
  return hash(value.toLowerCase());
}

async function ensureSchema(sql) {
  if (!schema) schema = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS sixth_sense_identities (
      id uuid PRIMARY KEY, username_key text NOT NULL UNIQUE, display_name text NOT NULL,
      token_hash text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS sixth_sense_identity_requests (
      bucket text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now()
    )`;
  })().catch(error => { schema = null; throw error; });
  return schema;
}

async function authenticate(sql, token) {
  const rows = await sql`SELECT id, display_name FROM sixth_sense_identities WHERE token_hash=${credential(token)}`;
  if (!rows.length) throw fail("That recovery code was not found. Check it and try again.", 401);
  return rows[0];
}

async function claim(sql, name, token) {
  const normalized = username(name), tokenHash = credential(token);
  try {
    // One atomic upsert: a failed rename retains the old reservation, and
    // concurrent first claims are decided by the database unique constraint.
    const rows = await sql`INSERT INTO sixth_sense_identities (id, username_key, display_name, token_hash)
      VALUES (${crypto.randomUUID()}, ${normalized.key}, ${normalized.name}, ${tokenHash})
      ON CONFLICT (token_hash) DO UPDATE SET username_key=EXCLUDED.username_key, display_name=EXCLUDED.display_name, updated_at=now()
      RETURNING id, display_name`;
    return rows[0];
  } catch (error) {
    if (error.code === "23505") throw fail("That username is already taken. Choose another, or restore your name with its recovery code.", 409);
    throw error;
  }
}

async function rateLimit(sql, request) {
  const ip = String(request.headers?.["x-vercel-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0];
  const bucket = crypto.createHmac("sha256", process.env.DATABASE_URL).update(`${ip}:${Math.floor(Date.now() / 60000)}`).digest("hex");
  const rows = await sql`INSERT INTO sixth_sense_identity_requests (bucket) VALUES (${bucket})
    ON CONFLICT (bucket) DO UPDATE SET hits=sixth_sense_identity_requests.hits+1 RETURNING hits`;
  if (Number(rows[0]?.hits) > 30) throw fail("Too many name requests. Please wait a minute.", 429);
  await sql`DELETE FROM sixth_sense_identity_requests WHERE created_at < now() - interval '1 day'`;
}

module.exports = { username, credential, hash, ensureSchema, authenticate, claim, rateLimit };
