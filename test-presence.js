"use strict";
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { updatePresence, submitLifeline } = require("./api/multiplayer")._test;
(async () => {
  for (const mode of ["vs", "race", "coop"]) {
    const room = { code: "SCREEN", mode, status: "running", current_round: 0, answer_words: ["planet"] };
    const me = { id: randomUUID(), current_word_index: 0, lifeline_state: { round: 0 } };
    let writes = 0;
    const sql = async (strings, ...values) => {
      const query = strings.join("?");
      if (query.includes("SELECT * FROM sixth_sense_players")) return [me];
      if (query.includes("SELECT * FROM sixth_sense_rooms")) return [room];
      if (query.includes("SELECT response")) return [];
      if (query.includes("WITH departure")) { writes++; assert.equal(values.at(-1), me.id, "only authenticated seat changes"); return []; }
      throw Error("Unexpected mutation: " + query);
    };
    const request = { roomCode: room.code, resumeToken: "qa", eventId: randomUUID(), sequence: 1, away: true };
    assert.deepEqual(await updatePresence(sql, request), { accepted: true });
    assert.equal(writes, 1);
    for (const invalid of [{ away: "true" }, { sequence: -1 }, { sequence: 1.5 }, { eventId: "invalid" }]) await assert.rejects(updatePresence(sql, { ...request, ...invalid }), /Invalid screen status/);
    room.status = "waiting";
    assert.deepEqual(await updatePresence(sql, request), { accepted: false });
    assert.equal(writes, 1);
    room.status = "running";
    await assert.rejects(submitLifeline(sql, { ...request, actionId: randomUUID(), kind: "skip" }), /Skip is disabled in multiplayer/);
    assert.equal(writes, 1);
    await assert.rejects(updatePresence(async () => [], request), /seat could not be resumed/);
  }
  console.log("Presence API validation/authentication and all-mode Skip rejection passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
