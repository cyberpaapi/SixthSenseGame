"use strict";
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const Core = require("./game-core");
const { submitLifeline } = require("./api/multiplayer")._test;
const history = (answer, guesses) => guesses.map(guess => ({ guess, score: Core.scoreGuess(guess, answer) }));

(async () => {
  assert.deepEqual(Core.remainingPeekPositions(history("battle", ["rattle"])), [0]);
  assert.deepEqual(Core.remainingPeekPositions(history("battle", ["rattle"]), [0]), []);
  assert.deepEqual(Core.remainingPeekPositions(history("planet", ["placer", "magnet"])), [], "greens from every earlier row remain known");
  assert.deepEqual(Core.remainingPeekPositions(history("banana", ["cabana"]), [0]), [2], "a repeated letter at a different unknown position remains useful");
  for (const mode of ["vs", "race", "coop"]) {
    const room = { code: "PEEKQA", mode, status: "running", current_round: 0, answer_words: ["battle"] };
    const me = { id: randomUUID(), current_word_index: 0, revision: 1, attempts: JSON.stringify(history("battle", ["rattle"])), lifeline_state: { round: 0, peeked: [] } };
    const stopAfterUpdate = new Error("captured authoritative update");
    let updated;
    const sql = async (strings, ...values) => {
      const query = strings.join("?");
      if (query.includes("SELECT * FROM sixth_sense_players")) return [me];
      if (query.includes("SELECT response")) return [];
      if (query.includes("SELECT * FROM sixth_sense_rooms")) return [room];
      if (query.includes("UPDATE sixth_sense_players")) { updated = JSON.parse(values[0]); throw stopAfterUpdate; }
      throw Error("Unexpected query: " + query);
    };
    const request = { roomCode: room.code, resumeToken: "qa-seat", actionId: randomUUID(), kind: "peek" };
    await assert.rejects(submitLifeline(sql, request), error => error === stopAfterUpdate);
    assert.deepEqual(updated.peeked, [{ position: 0, letter: "b" }], `${mode} must reveal the only non-green position`);
    me.lifeline_state = updated;
    updated = null;
    await assert.rejects(submitLifeline(sql, { ...request, actionId: randomUUID() }), /Every position is already revealed/);
    assert.equal(updated, null, "exhausted Reveal must not write or consume another effect");
  }
  console.log("Reveal rules/API passed: skip all earlier greens and prior reveals, preserve unknown duplicate-letter positions, reject exhausted VS/Race/Co-op use.");
})().catch(error => { console.error(error); process.exitCode = 1; });
