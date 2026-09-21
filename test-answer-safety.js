"use strict";
const assert = require("node:assert/strict");
const { snapshot, chooseAnswers } = require("./api/multiplayer")._test;
const bank = require("./answer-bank");
const policy = require("./scripts/answer_safety.json");
const banned = new Set(policy.excludedAnswers);

(async () => {
  for (const tier of ["easy", "medium", "extreme"]) {
    const route = chooseAnswers(tier, bank.filter(e => e.tier === tier).length);
    assert(!route.some(word => banned.has(word)), "every possible new multiplayer answer must pass curation");
  }
  const room = { code: "SAFEQA", mode: "race", status: "running", answer_words: ["ravish"], word_count: 1 };
  const me = { id: "safety-fixture", display_name: "Tester", current_word_index: 0, attempts: [], completed_rounds: [], lifeline_state: { round: 0, clue: "OLD UNSAFE DEFINITION" } };
  const sql = async () => [me];
  const old = await snapshot(sql, room, me);
  assert.doesNotMatch(JSON.stringify(old), /OLD UNSAFE DEFINITION|ravish/);
  assert.match(old.me.lifelines.clue, /no longer available/);
  room.answer_words = ["peeler"];
  me.lifeline_state = { round: 0, clue: "OLD UNSAFE DEFINITION" };
  assert.match((await snapshot(sql, room, me)).me.lifelines.clue, /kitchen tool/);
  me.lifeline_state = {};
  assert.equal((await snapshot(sql, room, me)).me.lifelines.clue, undefined, "clue refresh must not give away unpaid Sense");
  console.log("Answer safety: complete server selection, legacy clue replacement, and unpaid-clue redaction passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
