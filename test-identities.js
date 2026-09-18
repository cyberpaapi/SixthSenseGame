"use strict";
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const I = require("./lib/identities");
const MP = require("./api/multiplayer")._test;
(async () => {
  for (const name of [" Aryan  Sense ", "ARYAN SENSE", "Ａｒｙａｎ Sense", "Aryan\u200b Sense"]) assert.equal(I.username(name).key, "aryan sense");
  for (const name of ["a", "!@", "x".repeat(19), "Guest-ABC123-1", "na\0me"]) assert.throws(() => I.username(name), error => error.status === 400);
  for (const key of [null, "short", "x".repeat(64)]) assert.throws(() => I.credential(key), error => error.status === 401);
  const token = randomBytes(32).toString("hex");
  assert.equal(I.credential(token), I.credential(token.toUpperCase()));
  let params;
  const owner = { id: "owner", display_name: "Aryan" };
  assert.equal(await I.claim(async (strings, ...values) => {
    params = values;
    assert(strings.join("").includes("ON CONFLICT (token_hash) DO UPDATE"));
    return [owner];
  }, "Aryan", token), owner);
  assert(!params.includes(token), "plaintext secret must not enter the database");
  assert(params.includes(I.credential(token)));
  await assert.rejects(I.claim(async () => { throw { code: "23505" }; }, "ARYAN", token), e => e.status === 409);
  await assert.rejects(I.authenticate(async () => [], token), e => e.status === 401);
  for (const action of ["create", "join", "identity"]) {
    const forged = { action, identityId: "victim", player: { name: "Stolen" } };
    await assert.rejects(MP.authorizeIdentity(async () => { throw Error("must not query invalid credentials"); }, forged), e => e.status === 401);
    assert.equal(forged.identityId, undefined);
    const body = { action, identityToken: token, identityId: "victim", player: { name: "Stolen", avatar: "fox" } };
    await MP.authorizeIdentity(async () => [owner], body);
    assert.equal(body.identityId, owner.id); assert.equal(body.player.name, owner.display_name);
  }
  await assert.rejects(MP.bindIdentity(async () => { throw Error("must not change owner"); }, { identity_id: "victim" }, { identityId: "attacker" }), e => e.status === 403);
  await assert.rejects(MP.bindIdentity(async () => [], { id: "seat" }, { identityId: "owner" }), e => e.status === 409);
  await assert.rejects(MP.bindIdentity(async () => { throw { code: "23505" }; }, { id: "seat" }, { identityId: "owner" }), e => e.status === 409);
  console.log("Global identity unit checks passed: normalization, validation, hashed credentials, atomic claim/rename, duplicate rejection, server-derived names, forged-owner rejection and legacy-seat binding guards.");
})().catch(error => { console.error(error); process.exitCode = 1; });
