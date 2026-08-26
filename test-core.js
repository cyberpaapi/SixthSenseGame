"use strict";

const assert = require("assert");
const Core = require("./game-core.js");
const GuessBank = require("./word-bank.js");
const GuessBankSet = new Set(GuessBank);

assert.equal(Core.ANSWERS.length, new Set(Core.ANSWERS.map(item => item.word)).size, "answer words must be unique");
assert.equal(Core.ANSWERS.length, 5000, "answer bank must contain exactly 5,000 words");
assert.deepEqual(Core.ANSWERS.filter(item => item.word.length !== 6), [], "every answer must have six letters");
assert.deepEqual(Core.ANSWERS.filter(item => !item.clue || typeof item.clue !== "string"), [], "every answer must have a Sense clue");
assert([...Core.WORDS].every(word => word.length === 6), "every accepted guess must have six letters");
assert.equal(GuessBank.length, 15232, "ENABLE audit should produce exactly 15,232 realistic six-letter guesses");
assert.equal(Core.WORDS.size, 15232, "every answer must already belong to the curated guess bank");
assert(Core.ANSWERS.every(item => GuessBankSet.has(item.word)), "every answer must be present in the raw guess bank");
assert(Core.isValidWord("rattle"), "RATTLE must be accepted");
assert(Core.isValidWord("raffle"), "RAFFLE must be accepted");
assert(Core.ANSWERS.some(item => item.word === "rattle"), "RATTLE must be a possible puzzle answer");
assert(Core.ANSWERS.some(item => item.word === "raffle"), "RAFFLE must be a possible puzzle answer");
assert(!Core.isValidWord("coates"), "COATES is a surname/malformed inflection and must not be accepted");
assert(!Core.ANSWERS.some(item => item.word === "coates"), "COATES must never be a puzzle answer");
assert(!Core.isValidWord("george"), "ordinary proper names must not be accepted");
assert(!Core.isValidWord("london"), "place names must not be accepted");

const answerSafetyExclusions = [
  "coitus", "condom", "dildos", "faggot", "fucked", "fucker", "fuckin", "hentai",
  "incest", "nigger", "niggas", "orgasm", "raping", "rapist", "retard", "sexual",
  "slutty", "sodomy", "vagina", "whored", "whores"
];
assert.deepEqual(
  Core.ANSWERS.filter(item => answerSafetyExclusions.includes(item.word)),
  [],
  "sensitive terms may be recognized as guesses but must not become puzzle answers"
);
assert.deepEqual(
  Core.ANSWERS.filter(item => new RegExp(`\\b${item.word}\\b`, "i").test(item.clue)),
  [],
  "Sense clues must not reveal their own answers"
);
assert.deepEqual(
  Core.ANSWERS.filter(item => /this word|;\s*;/i.test(item.clue)),
  [],
  "Sense clues must not contain broken substitution or example fragments"
);
assert.deepEqual(
  Core.ANSWERS.filter(item => /(trade name|the music of|a native or inhabitant|a native or resident|a resident of|a member of the .* (people|peoples|nation|tribe)|ethnic slur|offensive term|caucasoid race)/i.test(item.clue)),
  [],
  "Sense clues must not select proper-name or offensive senses"
);

assert.deepEqual(Core.scoreGuess("letter", "better"), ["absent", "exact", "exact", "exact", "exact", "exact"]);
assert.deepEqual(Core.scoreGuess("banana", "animal"), ["absent", "present", "present", "present", "absent", "absent"]);
assert.deepEqual(Core.scoreGuess("coffee", "cookie"), ["exact", "exact", "absent", "absent", "absent", "exact"]);

const history = [{ guess: "bright", score: ["exact", "present", "absent", "absent", "absent", "absent"] }];
assert.equal(Core.validateHardMode("border", history), null);
assert.match(Core.validateHardMode("farmer", history), /Position 1/);
assert.match(Core.validateHardMode("bottle", history), /include R/);

const selected = Core.practiceAnswer(Core.dailyAnswer().word, () => 0);
assert.notEqual(selected.word, Core.dailyAnswer().word);
assert.equal(Core.dateKey(new Date("2026-08-26T12:00:00Z")), "2026-08-26");
assert.equal(Core.STARTING_COINS, 20);
assert.equal(Core.MAX_GUESSES, 7);
assert.deepEqual(Core.LIFELINE_COSTS, { sense: 3, peek: 5, clear: 4, skip: 6 });
assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map(Core.rewardForAttempts), [14, 12, 10, 8, 6, 4, 2]);
assert.equal(Core.rewardForAttempts(0), 2, "invalid attempt counts should fall back safely");

console.log(`Sixth Sense core: ${Core.ANSWERS.length} answers, ${Core.WORDS.size} accepted words — all checks passed.`);
