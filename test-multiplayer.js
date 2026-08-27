"use strict";

const assert = require("node:assert");
const handler = require("./api/multiplayer.js");
const Core = require("./game-core.js");
const { cleanPlayer, roomCode, token, tokenHash, normalizeGameLength, resolveVsRound, chooseAnswers } = handler._test;

for (let index = 0; index < 100; index += 1) {
  assert.match(roomCode(), /^[A-HJ-NP-Z2-9]{6}$/, "room codes must be six unambiguous characters");
}

const resumeToken = token();
assert(resumeToken.length >= 40, "resume tokens need strong entropy");
assert.notEqual(tokenHash(resumeToken), resumeToken, "only a hash may be stored server-side");
assert.equal(tokenHash(resumeToken), tokenHash(resumeToken), "resume-token hashing must be stable");

assert.deepEqual(cleanPlayer({ name: "  Tiger   Ace  ", avatar: "tiger", accent: "aqua" }), { name: "Tiger Ace", avatar: "tiger", accent: "aqua", decoration: "none" });
assert.deepEqual(cleanPlayer({ name: "Premium", avatar: "dragon", accent: "violet", decoration: "prism" }), { name: "Premium", avatar: "dragon", accent: "violet", decoration: "prism" });
assert.deepEqual(cleanPlayer({ name: "Player", avatar: "unknown", accent: "black", decoration: "unknown" }), { name: "Player", avatar: "fox", accent: "coral", decoration: "none" });
assert.throws(() => cleanPlayer({ name: "   " }), /Choose a player name/);

for (const length of [3, 5, 10]) assert.deepEqual(normalizeGameLength("race", length), { wordCount: length, endless: false }, `${length}-word Race rooms must be accepted`);
for (const length of [3, 5, 9]) assert.deepEqual(normalizeGameLength("vs", length), { wordCount: length, endless: false }, `${length}-round VS rooms must be accepted`);
assert.deepEqual(normalizeGameLength("race", 9), { wordCount: 3, endless: false }, "Race must keep its 3/5/10 lengths");
assert.deepEqual(normalizeGameLength("vs", 10), { wordCount: 3, endless: false }, "VS must reject its retired 10-round length");
assert.deepEqual(normalizeGameLength("vs", "endless"), { wordCount: 9, endless: true }, "VS must support Endless rounds");
assert.deepEqual(normalizeGameLength("vs", "unexpected"), { wordCount: 3, endless: false }, "invalid lengths should fall back to Quick");

const roundOne = resolveVsRound({ currentRound: 0, wordCount: 3, endless: false, players: [{ id: "a", score: 0 }, { id: "b", score: 0 }], roundWinnerId: "a" });
assert.deepEqual(roundOne, { scores: [{ id: "a", score: 1 }, { id: "b", score: 0 }], nextRound: 1, finished: false, matchWinnerId: null }, "first solve must award exactly one point and advance both players");
const finalRound = resolveVsRound({ currentRound: 2, wordCount: 3, endless: false, players: [{ id: "a", score: 1 }, { id: "b", score: 1 }], roundWinnerId: "b" });
assert.equal(finalRound.finished, true, "the selected final round must finish the match");
assert.equal(finalRound.matchWinnerId, "b", "the higher final score must win the match");
const endlessRound = resolveVsRound({ currentRound: 999, wordCount: 9, endless: true, players: [{ id: "a", score: 500 }, { id: "b", score: 499 }], roundWinnerId: "b" });
assert.equal(endlessRound.finished, false, "Endless VS must continue after every round");
assert.equal(endlessRound.nextRound, 1000, "Endless VS must keep advancing its shared round");

for (const tier of Core.TIER_ORDER) {
  const answers = chooseAnswers(tier, 10);
  assert.equal(new Set(answers).size, 10, `${tier} room routes must not repeat words`);
  assert(answers.every(word => Core.answersForDifficulty(tier).some(item => item.word === word)), `${tier} rooms must draw only from their selected tier`);
}

console.log("Sixth Sense multiplayer helpers: codes, identities, VS scoring, lengths, and tier routes — all checks passed.");
