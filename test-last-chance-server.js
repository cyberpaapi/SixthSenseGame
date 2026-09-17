"use strict";
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { submitGuess, submitLastChance, roomGuessLimit } = require("./api/multiplayer")._test;

(async () => {
  assert.equal(roomGuessLimit({ max_guesses: 6 }), 6);
  assert.equal(roomGuessLimit({ max_guesses: 7 }), 7, "existing rooms retain their original limit");
  for (const mode of ["vs", "race", "coop"]) {
    const room = { code: "ADTEST", mode, max_guesses: 6, current_round: 0, answer_words: ["planet"], status: "running" };
    const me = { id: randomUUID(), current_word_index: 0, failed_batches: 0, attempts: Array(6).fill({ guess: "rattle" }), lifeline_state: { round: 0, lastChancePending: true } };
    const sql = async strings => {
      const query = strings.join("?");
      if (query.includes("SELECT * FROM sixth_sense_players")) return [me];
      if (query.includes("SELECT response")) return [];
      if (query.includes("SELECT * FROM sixth_sense_rooms")) return [room];
      throw Error("Unexpected database mutation: " + query);
    };
    const body = { roomCode: "ADTEST", resumeToken: "test-seat", actionId: randomUUID(), guess: "planet" };
    await assert.rejects(submitGuess(sql, body), /Finish the open decision/, `${mode} cannot bypass Last Chance by sending a guess directly`);
    me.lifeline_state = { round: 0 };
    await assert.rejects(submitGuess(sql, body), /No attempts remain/);
    me.lifeline_state = { round: 0, extraAttempt: true };
    me.attempts.push({ guess: "castle" });
    await assert.rejects(submitGuess(sql, body), /No attempts remain/, "an eighth attempt must be rejected even after unlocking Last Chance");
    me.lifeline_state = { round: 0, lastChancePending: true };
    const unlock = { ...body, decision: "purchase", expectedRound: 1, expectedFailedBatches: 0 };
    await assert.rejects(submitLastChance(sql, unlock), /word changed/, "a receipt cannot unlock a later round");
    unlock.expectedRound = 0; unlock.expectedFailedBatches = 1;
    await assert.rejects(submitLastChance(sql, unlock), /word changed/, "a receipt cannot unlock a different attempt batch");
  }
  console.log("Last Chance server guards passed: six-attempt cap, pending decision, extra-attempt cap, stale round/batch rejection, legacy room limit.");
})().catch(error => { console.error(error); process.exitCode = 1; });
