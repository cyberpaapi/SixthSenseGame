"use strict";
const assert = require("assert/strict");
const P = require("./progression");
const date = "2026-09-05";
const solve = (state, word, extra = {}) => P.recordSolve(state, { date, word, won: true, ...extra });
let result = solve(undefined, "rattle");
assert.equal(result.reward, 0);
assert.deepEqual(result.state.words, ["rattle"]);
assert.equal(solve(result.state, "rattle").state.words.length, 1, "same word cannot advance trio twice");
assert.equal(solve(result.state, "raffle", { replay: true }).state.words.length, 1);
assert.equal(solve(result.state, "raffle", { won: false }).state.words.length, 1);
assert.equal(solve(result.state, "raffle", { recorded: true }).state.words.length, 1);
result = solve(result.state, "raffle");
result = solve(result.state, "dipped");
assert.equal(result.reward, 60);
assert.equal(result.state.claimed, true);
assert.equal(solve(result.state, "brooch").reward, 0, "bonus only once per UTC day");
assert.equal(solve(result.state, "dipped").reward, 0);
assert.deepEqual(P.trio(result.state, "2026-09-06"), { date: "2026-09-06", words: [], claimed: false });
assert.equal(P.trio({ date, words: ["rattle", "rattle", "bad", null, "RATTLE"] }, date).words.length, 1);
assert.equal(P.mastery(2999).level, 1);
assert.equal(P.mastery(3000).level, 2);
assert.equal(P.mastery(3000).current, 0);
assert.equal(P.mastery(-100).remaining, 3000);
assert.equal(P.mastery(18000).level, 7);
const overrides = require("./scripts/clue_overrides.json");
const bank = require("./answer-bank");
assert.equal(require("node:crypto").createHash("sha256").update(JSON.stringify(bank.map(item => [item.word, item.tier]))).digest("hex"),
  "9fb86c30b3a47bb6e2fbfa529bb2d034a72d0aa0015760d5a7dfbf0af1caca27", "clue refresh must preserve all existing answers, tier membership, and Adventure order");
for (const [word, clue] of Object.entries(overrides)) {
  assert.equal(word.length, 6);
  assert.equal(bank.find(item => item.word === word)?.clue, clue, `${word} must use reviewed wording`);
}
assert.match(bank.find(item => item.word === "dipped").clue, /liquid/);
assert.doesNotMatch(bank.find(item => item.word === "dipped").clue, /horse|spine/);
assert.match(bank.find(item => item.word === "entire").clue, /Whole/);
console.log("Progression and reviewed-clue regressions passed.");
