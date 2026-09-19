"use strict";
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const Core = require("./game-core");
const bank = require("./data/bollywood-answers.json");
const api = require("./api/multiplayer")._test;

(async () => {
  const approved = require("./docs/bollywood-review/bollywood-word-bank.json");
  assert.equal(bank.length, 125);
  assert.equal(new Set(bank.map(e => e.word)).size, 125);
  assert.equal(bank.filter(e => e.kind === "Film").length, 75);
  assert.equal(bank.filter(e => e.kind === "Character").length, 50);
  assert.deepEqual(bank.map(e => [e.word, e.kind, e.clue]), approved.map(e => [e.word.toLowerCase(), e.kind, e.hint]), "replace the entire pool with the approved words and hints");
  assert(bank.filter(e => e.era === "classic").length <= 100);
  assert.equal(bank.filter(e => e.era === "recent").length, 98);
  for (const entry of bank) {
    assert.match(entry.word, /^[a-z]{5,7}$/);
    assert.equal(entry.era, entry.year >= 2000 ? "recent" : "classic");
    assert(entry.year <= 2025);
    assert(entry.clue.length > 20 && entry.clue.length <= 100, entry.word);
    assert(!entry.clue.includes("?"), "Sense hints must not be quiz questions");
    assert(!new RegExp(`\\b${entry.word}\\b`, "i").test(entry.clue), `clue leaks ${entry.word}`);
    assert(!/\[[^\]]*\]/.test(entry.clue), `source footnote in ${entry.word}`);
    assert(entry.reference && Array.isArray(entry.sources));
    for (const source of entry.sources) assert.equal(new URL(source).protocol, "https:");
    assert(["Film", "Character"].includes(entry.kind));
    assert(!entry.person && !entry.personSource, "no actor records");
    if (entry.kind === "Film") {
      assert(entry.title);
      assert.equal(entry.title.toLowerCase().replace(/[^a-z]/g, ""), entry.word, "film answers must be complete titles");
    } else {
      assert(entry.character);
      assert.equal(entry.character.toLowerCase(), entry.word, "recognisable character name or nickname");
    }
  }
  for (const word of ["sholay", "dangal", "pathaan", "jawan", "chhaava", "baburao", "rancho", "noentry", "newyork", "choocha"]) assert(bank.some(e => e.word === word), word);
  for (const word of ["ranbir", "deepika", "kajol", "aamir", "paresh", "akshay", "kapoor", "jawaani", "raid2", "sitaarezameenpar"]) assert(!bank.some(e => e.word === word), word);
  assert.deepEqual(new Set(api.chooseAnswers("easy", bank.length, "bollywood")), new Set(bank.map(e => e.word)), "archived actors never enter new routes");
  for (let i = 0; i < 20; i++) {
    const route = api.chooseAnswers("easy", 10, "bollywood");
    assert.equal(new Set(route).size, 10);
    assert(route.every(word => bank.some(e => e.word === word)));
  }
  assert.equal(Core.WORD_LENGTH, 6);
  assert.equal(Core.isValidWord("ranbir"), false);
  assert.deepEqual(Core.scoreGuess("alala", "aamir"), ["exact", "absent", "present", "absent", "absent"]);
  assert.deepEqual(Core.scoreGuess("aaaaaaa", "pathaan"), ["absent", "exact", "absent", "absent", "exact", "exact", "absent"]);
  assert.deepEqual(Core.remainingPeekPositions([{ score: Array(6).fill("exact") }], [], 7), [6]);
  const room = { code: "BOLLYQ", mode: "race", answer_theme: "bollywood", max_guesses: 6, word_count: 3, status: "running", answer_words: ["jawan", "pathaan", "dangal"] };
  const me = { id: randomUUID(), display_name: "QA", avatar: "fox", seat: 1, revision: 1, current_word_index: 0, attempts: [], lifeline_state: {}, completed_rounds: [], failed_batches: 0, finished: false, score: 0 };
  const sql = async (strings, ...values) => {
    const q = strings.join("?");
    if (q.includes("SELECT * FROM sixth_sense_rooms")) return [room];
    if (q.includes("SELECT * FROM sixth_sense_players") || q.includes("SELECT id, display_name")) return [me];
    if (q.includes("SELECT response") || q.includes("INSERT INTO sixth_sense_actions")) return [];
    if (q.includes("SET current_word_index=")) {
      Object.assign(me, { current_word_index: values[0], attempts: JSON.parse(values[1]), completed_rounds: JSON.parse(values[2]), failed_batches: values[3], finished: values[4], eliminated: values[5], lifeline_state: JSON.parse(values[6]) });
      return [me];
    }
    if (q.includes("SET lifeline_state=")) { me.lifeline_state = JSON.parse(values[0]); return [me]; }
    throw Error("Unexpected query: " + q);
  };
  const body = { roomCode: room.code, resumeToken: "fixture-seat" };
  const send = (guess) => api.submitGuess(sql, { ...body, actionId: randomUUID(), guess });
  // Both five- and seven-letter fictional characters retain authoritative hints and redaction.
  for (const answer of ["virus", "baburao"]) {
    room.answer_words[0] = answer; me.lifeline_state = {};
    const hidden = await api.snapshot(sql, room, me);
    assert.equal(hidden.me.answerKind, "Character");
    assert.equal(hidden.me.wordLength, answer.length);
    assert(!JSON.stringify(hidden).includes(answer));
    const hint = await api.submitLifeline(sql, { ...body, kind: "sense", actionId: randomUUID() });
    assert.equal(hint.effect.clue, bank.find(e => e.word === answer).clue);
    const restored = await api.snapshot(sql, room, me);
    assert.equal(restored.me.lifelines.clue, hint.effect.clue);
    assert(!JSON.stringify(restored).includes(answer));
  }
  room.answer_words[0] = "jawan"; me.lifeline_state = {};
  let snapshot = await api.snapshot(sql, room, me);
  assert.equal(snapshot.me.wordLength, 5);
  assert.equal(snapshot.me.answerKind, "Film");
  assert(!JSON.stringify(snapshot).includes("jawan") && !JSON.stringify(snapshot).includes("pathaan"));
  await assert.rejects(api.joinRoom(sql, body), /Refresh or update/);
  await assert.rejects(send("planet"), /Enter 5 letters/);
  await assert.rejects(send("jawa1"), /Enter 5 letters/);
  const miss = await send("zzzzz");
  assert.equal(miss.snapshot.me.attempts[0].score.length, 5);
  const win = await send("jawan");
  assert.equal(win.snapshot.me.currentWordIndex, 1);
  assert.equal(win.snapshot.me.wordLength, 7);
  assert.deepEqual(win.snapshot.me.attempts, []);
  assert.deepEqual(win.snapshot.me.lifelines, {});
  me.attempts = [{ guess: "pathaaz", score: Core.scoreGuess("pathaaz", "pathaan") }];
  const peek = await api.submitLifeline(sql, { ...body, kind: "peek", actionId: randomUUID() });
  assert.deepEqual(peek.effect, { kind: "peek", position: 6, letter: "n" });
  await assert.rejects(api.submitLifeline(sql, { ...body, kind: "peek", actionId: randomUUID() }), /Every position/);
  const sense = await api.submitLifeline(sql, { ...body, kind: "sense", actionId: randomUUID() });
  assert.equal(sense.effect.clue, bank.find(e => e.word === "pathaan").clue);
  await assert.rejects(api.submitLifeline(sql, { ...body, kind: "skip", actionId: randomUUID() }), /disabled in multiplayer/);
  me.attempts = Array.from({ length: 5 }, () => ({ guess: "zzzzzzz", score: Array(7).fill("absent") }));
  const exhausted = await send("zzzzzzz");
  assert.equal(exhausted.snapshot.me.lifelines.lastChancePending, true);
  await assert.rejects(send("pathaan"), /Finish the open decision/);
  // Archived words stay available only to already-created routes, not new selection.
  room.answer_words[1] = "kapoor"; me.attempts = []; me.lifeline_state = {};
  const legacy = await api.submitLifeline(sql, { ...body, kind: "sense", actionId: randomUUID() });
  assert.equal(legacy.effect.clue, require("./data/bollywood-legacy-20260918.json").find(e => e.word === "kapoor").clue);
  room.answer_words[1] = "ranbir"; me.lifeline_state = {};
  const oldActor = await api.submitLifeline(sql, { ...body, kind: "sense", actionId: randomUUID() });
  assert.equal(oldActor.effect.clue, require("./data/bollywood-legacy-20260918.json").find(e => e.word === "ranbir").clue);
  room.answer_theme = "classic"; me.attempts = []; me.lifeline_state = {};
  await assert.rejects(send("ranbir"), /accepted dictionary/);
  console.log("Bollywood passed: 125 movie/character answers match approval, no new actor routes, character kind/Sense/redaction, era/length/clue audit, 5→7 progression, Peek, Last Chance, Skip guard and legacy room lookup.");
})().catch(error => { console.error(error); process.exitCode = 1; });

