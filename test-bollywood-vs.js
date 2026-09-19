"use strict";
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const api = require("./api/multiplayer")._test;
const bank = require("./data/bollywood-answers.json");

(async () => {
  const pool = new Set(bank.map(e => e.word));
  assert(api.isBollywood({ mode: "vs", answer_theme: "bollywood" }));
  assert(!api.isBollywood({ mode: "coop", answer_theme: "bollywood" }));
  for (const mode of ["race", "vs", "coop"]) {
    const stop = new Error("capture insert");
    await assert.rejects(api.createRoom(async (strings, ...values) => {
      assert(strings.join("").includes("INSERT INTO sixth_sense_rooms"));
      assert.equal(values[1], mode);
      assert.equal(values[5], mode === "vs" ? 2 : mode === "coop" ? 4 : 8);
      assert.equal(values[8], mode === "coop" ? "classic" : "bollywood");
      throw stop;
    }, { mode, theme: "bollywood", wordCount: 3, player: { name: "QA" } }), e => e === stop);
  }
  assert.equal(api.chooseFreshAnswer("easy", [...pool].slice(0, -1), "bollywood"), [...pool].at(-1));
  assert(pool.has(api.chooseFreshAnswer("easy", [...pool], "bollywood")), "exhaustion must recycle Bollywood, not English");
  for (const answer of ["jawan", "pathaan", "virus", "baburao"]) {
    for (const decision of ["solve", "decline"]) {
      const room = { code: "BOLLYV", mode: "vs", answer_theme: "bollywood", difficulty: "easy", max_guesses: 6, word_count: 9, endless: true, current_round: 0, status: "running", answer_words: [answer], revision: 1 };
      const me = { id: randomUUID(), current_word_index: 0, attempts: [], lifeline_state: {}, completed_rounds: [], score: 0, revision: 1 };
      const opponent = { ...me, id: randomUUID() };
      const stop = new Error("capture round transition");
      const sql = async (strings, ...values) => {
        const q = strings.join("?");
        if (q.includes("SELECT * FROM sixth_sense_players")) return [me];
        if (q.includes("SELECT response")) return [];
        if (q.includes("SELECT * FROM sixth_sense_rooms")) return [room];
        if (q.includes("SELECT id, score")) return [me, opponent];
        if (q.includes("UPDATE sixth_sense_rooms")) {
          assert.equal(values[0], 1);
          assert.equal(values[1], decision === "solve" ? me.id : opponent.id);
          const next = JSON.parse(values[2]);
          assert.equal(next.length, 2); assert.equal(next[0], answer);
          assert(pool.has(next[1]) && next[1] !== answer, "both endless advancement paths must stay in theme without early repeats");
          assert.equal(values[3], "running");
          throw stop;
        }
        throw Error("Unexpected query: " + q);
      };
      const body = { roomCode: room.code, resumeToken: "fixture", actionId: randomUUID(), guess: answer, decision: "decline" };
      if (decision === "decline") me.lifeline_state = { round: 0, lastChancePending: true };
      await assert.rejects(decision === "solve" ? api.submitGuess(sql, body) : api.submitLastChance(sql, body), e => e === stop);
    }
  }
  console.log("Bollywood VS passed: correct room theme/capacity, 5/7-letter solves, forfeit winner, both endless route paths, no English fallback and exhausted-pool recycling.");
})().catch(e => { console.error(e); process.exitCode = 1; });
