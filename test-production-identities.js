"use strict";
const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
const root = process.env.SIXTH_SENSE_API_URL || "https://sixth-sense-game.vercel.app";
const secret = () => randomBytes(32).toString("hex");
async function request(path, body, origin = root) {
  const response = await fetch(`${origin}/api/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: response.status, ...await response.json() };
}
const name = "QA" + randomBytes(5).toString("hex");
(async () => {
  const tokens = [secret(), secret()];
  const claims = await Promise.all(tokens.map((identityToken, i) => request("identity", { action: "claim", identityToken, name: i ? ` ${name.toUpperCase()} ` : name })));
  assert.deepEqual(claims.map(r => r.status).sort(), [200, 409], "exactly one concurrent global claimant");
  const won = claims.findIndex(r => r.status === 200), token = tokens[won], owner = claims[won];
  const otherToken = tokens[1 - won];
  const other = await request("identity", { action: "claim", identityToken: otherToken, name: name + "B" }); assert.equal(other.status, 200);
  const rename = await request("identity", { action: "claim", identityToken: otherToken, name: owner.name }); assert.equal(rename.status, 409);
  assert.equal((await request("identity", { action: "restore", identityToken: otherToken })).name, other.name);
  const replay = await request("identity", { action: "claim", identityToken: token, name: owner.name }); assert.equal(replay.id, owner.id);
  assert.equal((await request("identity", { action: "restore", identityToken: secret() })).status, 401);
  assert.equal((await request("multiplayer", { action: "create", mode: "race", player: { name: owner.name }, identityId: owner.id })).status, 401);
  const host = await request("multiplayer", { action: "create", identityToken: token, mode: "race", player: { name: "SpoofedName" } });
  assert.equal(host.status, 200, host.error); assert.equal(host.snapshot.me.name, owner.name);
  assert.equal(host.snapshot.players[0].name, owner.name);
  assert(!JSON.stringify(host.snapshot).includes(token), "snapshots must not expose profile credentials");
  const secondRoom = await request("multiplayer", { action: "create", identityToken: token, mode: "vs", player: { name: "SpoofedAgain" } });
  assert.equal(secondRoom.status, 200); assert.equal(secondRoom.snapshot.me.name, owner.name);
  const joined = await request("multiplayer", { action: "join", identityToken: otherToken, roomCode: host.roomCode, player: { name: owner.name } });
  assert.equal(joined.status, 200); assert.equal(joined.snapshot.me.name, other.name);
  const seat = { roomCode: host.roomCode, resumeToken: host.resumeToken };
  assert.equal((await request("multiplayer", { action: "start", ...seat })).status, 200);
  const progress = await request("multiplayer", { action: "guess", ...seat, guess: "planet", actionId: randomUUID() }); assert.equal(progress.status, 200);
  const restored = await request("multiplayer", { action: "join", identityToken: token, roomCode: host.roomCode });
  assert.equal(restored.status, 200); assert.equal(restored.playerId, host.playerId); assert.equal(restored.snapshot.players.length, 2);
  assert.deepEqual(restored.snapshot.me.attempts, progress.snapshot.me.attempts);
  const replayRestore = await request("multiplayer", { action: "join", identityToken: token, roomCode: host.roomCode });
  assert.equal(replayRestore.resumeToken === restored.resumeToken, true, "restore retries must retain the same seat credential");
  assert.equal(restored.snapshot.me.currentWordIndex, progress.snapshot.me.currentWordIndex);
  assert.equal((await request("multiplayer", { action: "snapshot", ...seat })).status, 401, "cross-device restore rotates the old room credential");
  assert.equal((await request("multiplayer", { action: "snapshot", roomCode: host.roomCode, resumeToken: restored.resumeToken, identityToken: otherToken })).status, 403);
  const renamed = await request("identity", { action: "claim", identityToken: token, name: name + "New" }); assert.equal(renamed.status, 200);
  const updatedRoom = await request("multiplayer", { action: "snapshot", roomCode: secondRoom.roomCode, resumeToken: secondRoom.resumeToken });
  assert.equal(updatedRoom.snapshot.me.name, renamed.name, "rename propagates to every linked room");
  if (process.env.SIXTH_SENSE_LEGACY_URL) {
    const legacy = await request("multiplayer", { action: "create", mode: "race", player: { name: "Legacy QA" } }, process.env.SIXTH_SENSE_LEGACY_URL);
    assert.equal(legacy.status, 200);
    const oldSeat = { roomCode: legacy.roomCode, resumeToken: legacy.resumeToken };
    const guest = await request("multiplayer", { action: "snapshot", ...oldSeat });
    assert.equal(guest.snapshot.me.name, `Guest-${legacy.roomCode}-1`);
    const bound = await request("multiplayer", { action: "snapshot", ...oldSeat, identityToken: token });
    assert.equal(bound.snapshot.me.name, renamed.name); assert.equal(bound.snapshot.me.id, legacy.playerId);
  }
  console.log("Live identity acceptance passed: concurrent global claims, case/space duplicates, failed rename rollback, hashed-owner authentication, name-spoof rejection, cross-room rename, cross-device seat/progress recovery and credential rotation" + (process.env.SIXTH_SENSE_LEGACY_URL ? ", legacy guest-to-profile migration." : "."));
})().catch(error => { console.error(error); process.exitCode = 1; });
