"use strict";
const assert = require("node:assert/strict");
const { canJoinRoom, joinRoom } = require("./api/multiplayer")._test;

(async () => {
  for (const mode of ["race", "vs", "coop"]) {
    for (const status of ["waiting", "running", "finished"]) {
      assert.equal(canJoinRoom({ mode, status }), status === "waiting" || (mode === "race" && status === "running"));
    }
  }
  const room = { code: "JOINQA", mode: "race", status: "running", capacity: 8, answer_words: ["planet", "bridge", "school"], word_count: 3, max_guesses: 6 };
  let inserted;
  const sql = async (strings, ...values) => {
    const query = strings.join("?");
    if (query.includes("SELECT * FROM sixth_sense_rooms")) return [room];
    if (query.includes("WITH locked_room")) {
      assert.match(query, /status='waiting' OR \(mode='race' AND status='running'\)/);
      assert.match(query, /FOR UPDATE/);
      inserted = { id: values[1], display_name: values[3], avatar: values[4], accent: values[5], seat: 3, current_word_index: 0, attempts: [], completed_rounds: [], lifeline_state: {}, score: 0, finished: false };
      return [inserted];
    }
    if (query.includes("SELECT id, display_name")) return [inserted];
    throw Error("Unexpected room/player mutation: " + query);
  };
  const before = structuredClone(room);
  const joined = await joinRoom(sql, { roomCode: room.code, player: { name: "Late racer" } });
  assert.equal(joined.snapshot.room.status, "running");
  assert.equal(joined.snapshot.me.currentWordIndex, 0);
  assert.deepEqual(joined.snapshot.me.attempts, []);
  assert.deepEqual(room, before, "joining must not restart the race or replace its route");
  assert(!JSON.stringify(joined).includes("planet"), "joining must not disclose the answer route");
  for (const state of [{ mode: "race", status: "finished" }, { mode: "vs", status: "running" }, { mode: "coop", status: "running" }]) {
    await assert.rejects(joinRoom(async () => [{ ...room, ...state }], { roomCode: room.code, player: { name: "Late" } }), error => error.status === 409);
  }
  await assert.rejects(joinRoom(async () => [], { roomCode: room.code, player: { name: "Late" } }), error => error.status === 404);
  // The room can finish after the initial read, before the locked insertion.
  let reads = 0;
  await assert.rejects(joinRoom(async strings => {
    if (strings.join("").includes("SELECT * FROM sixth_sense_rooms")) return [{ ...room, status: ++reads === 1 ? "running" : "finished" }];
    return [];
  }, { roomCode: room.code, player: { name: "Late" } }), /has finished/);
  console.log("Race late-join rules passed: active Race only, word-one start, no route reset/disclosure, finished/expired/non-Race rejection and finish-during-join handling.");
})().catch(error => { console.error(error); process.exitCode = 1; });
