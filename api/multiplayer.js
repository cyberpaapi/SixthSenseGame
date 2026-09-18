"use strict";

const crypto = require("node:crypto");
const { neon } = require("@neondatabase/serverless");
const Identities = require("../lib/identities");
const Core = require("../game-core.js");
const Bollywood = require("../data/bollywood-answers.json");
// Retain clues for routes created before the owner's complete-title/first-name refinement.
// This archive is never used to choose new answers; rooms expire after 24 hours.
const BollywoodLegacy = require("../data/bollywood-legacy-20260918.json");
const BOLLYWOOD_BY_WORD = new Map([...BollywoodLegacy, ...Bollywood].map(entry => [entry.word, entry]));
const isBollywood = room => ["race", "vs"].includes(room.mode) && room.answer_theme === "bollywood";
const clueFor = (room, answer) => isBollywood(room) ? BOLLYWOOD_BY_WORD.get(answer)?.clue : ANSWER_CLUES.get(answer);
const ANSWER_CLUES = new Map(Core.ANSWERS.map(item => [item.word, item.clue]));

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_TTL_HOURS = 24;
const RACE_LENGTHS = new Set([3, 5, 10]);
const VS_LENGTHS = new Set([3, 5, 9]);
const ACCENTS = Object.freeze({ coral: "#ff4f83", mango: "#ff9f2f", sun: "#d4aa00", leaf: "#15985b", aqua: "#078995", sky: "#347cf4", violet: "#7c45e8", berry: "#c72b9b" });
const AVATARS = new Set(["fox", "owl", "axolotl", "panda", "tiger", "koala", "frog", "rabbit", "penguin", "red-panda", "capybara", "raccoon", "snow-leopard", "phoenix", "dragon", "unicorn", "otter", "chameleon"]);
const DECORATIONS = new Set(["none", "aurora", "sunburst", "prism", "champion"]);
let schemaPromise;

function roomGuessLimit(room) { return Number(room.max_guesses) === 7 ? 7 : Core.MAX_GUESSES; }

function database() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error("The multiplayer database is not connected yet."), { status: 503 });
  return neon(process.env.DATABASE_URL);
}

async function ensureSchema(sql) {
  if (!schemaPromise) schemaPromise = (async () => {
    await Identities.ensureSchema(sql);
    await sql`CREATE TABLE IF NOT EXISTS sixth_sense_rooms (
      code text PRIMARY KEY,
      mode text NOT NULL CHECK (mode IN ('race','vs','coop')),
      difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','extreme')),
      word_count integer NOT NULL CHECK (word_count IN (1,3,5,9,10)),
      endless boolean NOT NULL DEFAULT false,
      current_round integer NOT NULL DEFAULT 0,
      last_round_winner_player_id uuid,
      capacity integer NOT NULL CHECK (capacity BETWEEN 2 AND 8),
      status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','running','finished')),
      host_player_id uuid NOT NULL,
      winner_player_id uuid,
      answer_words jsonb NOT NULL DEFAULT '[]'::jsonb,
      revision integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NOT NULL
    )`;
    await sql`CREATE TABLE IF NOT EXISTS sixth_sense_players (
      id uuid PRIMARY KEY,
      room_code text NOT NULL REFERENCES sixth_sense_rooms(code) ON DELETE CASCADE,
      resume_hash text NOT NULL,
      display_name text NOT NULL,
      avatar text NOT NULL,
      accent text NOT NULL,
      decoration text NOT NULL DEFAULT 'none',
      seat integer NOT NULL,
      current_word_index integer NOT NULL DEFAULT 0,
      attempts jsonb NOT NULL DEFAULT '[]'::jsonb,
      completed_rounds jsonb NOT NULL DEFAULT '[]'::jsonb,
      failed_batches integer NOT NULL DEFAULT 0,
      score integer NOT NULL DEFAULT 0,
      finished boolean NOT NULL DEFAULT false,
      eliminated boolean NOT NULL DEFAULT false,
      lifeline_state jsonb NOT NULL DEFAULT '{}'::jsonb,
      revision integer NOT NULL DEFAULT 1,
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(room_code, seat)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS sixth_sense_players_room_idx ON sixth_sense_players(room_code)`;
    await sql`ALTER TABLE sixth_sense_players ADD COLUMN IF NOT EXISTS identity_id uuid REFERENCES sixth_sense_identities(id)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS sixth_sense_players_identity_idx ON sixth_sense_players(room_code, identity_id) WHERE identity_id IS NOT NULL`;
    await sql`ALTER TABLE sixth_sense_rooms ADD COLUMN IF NOT EXISTS answer_theme text NOT NULL DEFAULT 'classic'`;
    await sql`ALTER TABLE sixth_sense_rooms ADD COLUMN IF NOT EXISTS max_guesses integer NOT NULL DEFAULT 7`;
    await sql`ALTER TABLE sixth_sense_rooms ADD COLUMN IF NOT EXISTS endless boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE sixth_sense_rooms ADD COLUMN IF NOT EXISTS current_round integer NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE sixth_sense_rooms ADD COLUMN IF NOT EXISTS last_round_winner_player_id uuid`;
    await sql`ALTER TABLE sixth_sense_players ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE sixth_sense_players ADD COLUMN IF NOT EXISTS decoration text NOT NULL DEFAULT 'none'`;
    await sql`ALTER TABLE sixth_sense_players ADD COLUMN IF NOT EXISTS lifeline_state jsonb NOT NULL DEFAULT '{}'::jsonb`;
    await sql`ALTER TABLE sixth_sense_players ADD COLUMN IF NOT EXISTS screen_away boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE sixth_sense_players ADD COLUMN IF NOT EXISTS away_count integer NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE sixth_sense_players ADD COLUMN IF NOT EXISTS presence_sequence bigint NOT NULL DEFAULT 0`;
    await sql`CREATE TABLE IF NOT EXISTS sixth_sense_presence_events (
      event_id uuid PRIMARY KEY, player_id uuid NOT NULL REFERENCES sixth_sense_players(id) ON DELETE CASCADE,
      sequence bigint NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(player_id, sequence)
    )`;
    await sql`ALTER TABLE sixth_sense_rooms DROP CONSTRAINT IF EXISTS sixth_sense_rooms_word_count_check`;
    await sql`ALTER TABLE sixth_sense_rooms DROP CONSTRAINT IF EXISTS sixth_sense_rooms_mode_check`;
    await sql`ALTER TABLE sixth_sense_rooms DROP CONSTRAINT IF EXISTS sixth_sense_rooms_mode_v2_check`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sixth_sense_rooms_mode_v3_check') THEN
        ALTER TABLE sixth_sense_rooms ADD CONSTRAINT sixth_sense_rooms_mode_v3_check CHECK (mode IN ('race','vs','coop'));
      END IF;
    END $$`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sixth_sense_rooms_word_count_v2_check') THEN
        ALTER TABLE sixth_sense_rooms ADD CONSTRAINT sixth_sense_rooms_word_count_v2_check CHECK (word_count IN (1,3,5,9,10));
      END IF;
    END $$`;
    await sql`CREATE TABLE IF NOT EXISTS sixth_sense_actions (
      action_id uuid PRIMARY KEY,
      room_code text NOT NULL,
      player_id uuid NOT NULL,
      response jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS sixth_sense_actions_created_idx ON sixth_sense_actions(created_at)`;
  })().catch(error => { schemaPromise = null; throw error; });
  return schemaPromise;
}

function cleanPlayer(raw = {}) {
  const name = String(raw.name || "").replace(/\s+/g, " ").trim().slice(0, 18);
  if (name.length < 1) throw Object.assign(new Error("Choose a player name."), { status: 400 });
  return {
    name,
    avatar: AVATARS.has(raw.avatar) ? raw.avatar : "fox",
    accent: ACCENTS[raw.accent] ? raw.accent : "coral",
    decoration: DECORATIONS.has(raw.decoration) ? raw.decoration : "none"
  };
}

function roomCode() {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join("");
}

function token() { return crypto.randomBytes(30).toString("base64url"); }
function tokenHash(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
function isSharedRoundMode(mode) { return mode === "vs" || mode === "coop"; }
function normalizeGameLength(mode, value) {
  if (mode === "vs" && String(value).toLowerCase() === "endless") return { wordCount: 9, endless: true };
  const count = Number(value);
  const allowed = mode === "vs" ? VS_LENGTHS : RACE_LENGTHS;
  return { wordCount: allowed.has(count) ? count : 3, endless: false };
}

function resolveVsRound({ currentRound, wordCount, endless, players, roundWinnerId }) {
  const scores = players.map(player => ({ id: player.id, score: Number(player.score) + (player.id === roundWinnerId ? 1 : 0) }));
  const nextRound = Number(currentRound) + 1;
  const finished = !endless && nextRound >= Number(wordCount);
  const matchWinnerId = finished
    ? [...scores].sort((a, b) => b.score - a.score || (a.id === roundWinnerId ? -1 : 1))[0]?.id || roundWinnerId
    : null;
  return { scores, nextRound, finished, matchWinnerId };
}

function parseJson(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

async function getRoom(sql, code) {
  const rows = await sql`SELECT * FROM sixth_sense_rooms WHERE code=${code} AND expires_at > now()`;
  if (!rows.length) throw Object.assign(new Error("That room does not exist or has expired."), { status: 404 });
  return rows[0];
}

async function authenticate(sql, code, resumeToken) {
  const hash = tokenHash(resumeToken || "");
  const players = await sql`SELECT * FROM sixth_sense_players WHERE room_code=${code} AND resume_hash=${hash}`;
  if (!players.length) throw Object.assign(new Error("Your room seat could not be resumed."), { status: 401 });
  return players[0];
}

async function snapshot(sql, room, me) {
  const players = await sql`SELECT id, display_name, avatar, accent, decoration, seat, current_word_index, attempts, completed_rounds, failed_batches, score, finished, eliminated, lifeline_state, screen_away, away_count, presence_sequence,
    COALESCE((SELECT i.display_name FROM sixth_sense_identities i WHERE i.id=sixth_sense_players.identity_id), 'Guest-' || room_code || '-' || seat) AS global_name
    FROM sixth_sense_players WHERE room_code=${room.code} ORDER BY seat`;
  const normalized = players.map(player => {
    const attempts = parseJson(player.attempts, []);
    return {
      id: player.id,
      name: player.global_name || player.display_name,
      screenAway: room.status === "running" && Boolean(player.screen_away),
      awayCount: Number(player.away_count) || 0,
      avatar: player.avatar,
      accent: player.accent,
      accentHex: ACCENTS[player.accent] || ACCENTS.coral,
      decoration: player.decoration,
      seat: player.seat,
      currentWordIndex: isSharedRoundMode(room.mode) ? room.current_round : player.current_word_index,
      attempts: attempts.map(entry => entry.score),
      completedRounds: parseJson(player.completed_rounds, []).length,
      failedBatches: player.failed_batches,
      score: player.score,
      finished: player.finished,
      eliminated: player.eliminated
    };
  });
  const own = players.find(player => player.id === me.id);
  const ownLifelines = parseJson(own.lifeline_state, {});
  const active = activeAnswer(room, own);
  // Update an already purchased clue after a content release, without revealing
  // anything to seats that have not unlocked Sense or carrying it into a new round.
  if (ownLifelines.clue && Number(ownLifelines.round) === active.index) {
    ownLifelines.clue = clueFor(room, active.answer) || ownLifelines.clue;
  }
  return {
    room: {
      code: room.code,
      maxGuesses: roomGuessLimit(room),
      lastChanceAds: true,
      presenceEnabled: true,
      mode: room.mode,
      theme: isBollywood(room) ? "bollywood" : "classic",
      difficulty: room.difficulty,
      wordCount: room.word_count,
      endless: room.endless,
      currentRound: room.current_round,
      lastRoundWinnerPlayerId: room.last_round_winner_player_id,
      status: room.status,
      revision: room.revision,
      winnerPlayerId: room.winner_player_id
    },
    me: {
      id: me.id,
      name: own.global_name || own.display_name,
      wordLength: isBollywood(room) ? (active.answer?.length || 6) : Core.WORD_LENGTH,
      answerKind: isBollywood(room) ? (BOLLYWOOD_BY_WORD.get(active.answer)?.kind || "") : "",
      presenceSequence: Number(own.presence_sequence) || 0,
      screenAway: Boolean(own.screen_away),
      isHost: room.host_player_id === me.id,
      currentWordIndex: isSharedRoundMode(room.mode) ? room.current_round : own.current_word_index,
      attempts: parseJson(own.attempts, []),
      failedBatches: Number(own.failed_batches) || 0,
      score: own.score,
      finished: own.finished,
      eliminated: own.eliminated,
      lifelines: ownLifelines,
      lastCompletedRound: parseJson(own.completed_rounds, []).at(-1) || null
    },
    players: normalized
  };
}

async function createRoom(sql, body) {
  const mode = ["race", "vs", "coop"].includes(body.mode) ? body.mode : "race";
  const theme = ["race", "vs"].includes(mode) && body.theme === "bollywood" ? "bollywood" : "classic";
  const difficulty = theme === "classic" && ["easy", "medium", "extreme"].includes(body.difficulty) ? body.difficulty : "easy";
  const { wordCount, endless } = normalizeGameLength(mode, body.wordCount);
  const capacity = mode === "vs" ? 2 : mode === "coop" ? 4 : 8;
  const player = cleanPlayer(body.player);
  const playerId = crypto.randomUUID();
  const resumeToken = token();
  let code;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    code = roomCode();
    const inserted = await sql`INSERT INTO sixth_sense_rooms (code, mode, difficulty, word_count, endless, capacity, host_player_id, max_guesses, answer_theme, expires_at)
      VALUES (${code}, ${mode}, ${difficulty}, ${wordCount}, ${endless}, ${capacity}, ${playerId}, ${Core.MAX_GUESSES}, ${theme}, now() + (${ROOM_TTL_HOURS} || ' hours')::interval)
      ON CONFLICT DO NOTHING RETURNING *`;
    if (inserted.length) break;
    code = null;
  }
  if (!code) throw Object.assign(new Error("Could not allocate a room code. Try again."), { status: 503 });
  await sql`INSERT INTO sixth_sense_players (id, room_code, resume_hash, display_name, avatar, accent, decoration, seat, identity_id)
    VALUES (${playerId}, ${code}, ${tokenHash(resumeToken)}, ${player.name}, ${player.avatar}, ${player.accent}, ${player.decoration}, 1, ${body.identityId || null})`;
  const room = await getRoom(sql, code);
  const me = await authenticate(sql, code, resumeToken);
  return { roomCode: code, resumeToken, playerId, snapshot: await snapshot(sql, room, me) };
}

async function joinRoom(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const room = await getRoom(sql, code);
  if (isBollywood(room) && body.supportsVariableLength !== true) throw Object.assign(new Error("Refresh or update the game to join this Bollywood match."), { status: 409 });
  // An authenticated return uses the existing seat, even when the room is full
  // or no longer accepts new players. A name alone never proves seat ownership.
  if (body.resumeToken) {
    const me = await authenticate(sql, code, body.resumeToken);
    await bindIdentity(sql, me, body);
    return { roomCode: code, resumeToken: body.resumeToken, playerId: me.id, snapshot: await snapshot(sql, room, me) };
  }
  if (body.identityId) {
    const existing = await sql`SELECT * FROM sixth_sense_players WHERE room_code=${code} AND identity_id=${body.identityId}`;
    if (existing.length) {
      // Stable for a profile/seat, so retrying a lost restore response cannot
      // invalidate the credential returned by another simultaneous restore.
      const resumedToken = crypto.createHmac("sha256", body.identityToken.toLowerCase()).update(`room:${code}:${existing[0].id}`).digest("base64url");
      await sql`UPDATE sixth_sense_players SET resume_hash=${tokenHash(resumedToken)} WHERE id=${existing[0].id}`;
      return { roomCode: code, resumeToken: resumedToken, playerId: existing[0].id, snapshot: await snapshot(sql, room, existing[0]) };
    }
  }
  const player = cleanPlayer(body.player);
  if (!canJoinRoom(room)) throw Object.assign(new Error(room.status === "finished" ? "That match has finished." : "That match has already started."), { status: 409 });
  const playerId = crypto.randomUUID();
  const resumeToken = token();
  let inserted;
  for (let retry = 0; retry < 4 && !inserted?.length; retry += 1) {
    try {
      inserted = await sql`WITH locked_room AS (
          SELECT code, capacity FROM sixth_sense_rooms WHERE code=${code}
            AND (status='waiting' OR (mode='race' AND status='running')) AND expires_at > now() FOR UPDATE
        ), next_seat AS (
          SELECT (COALESCE(MAX(seat),0) + 1)::int AS seat, COUNT(*)::int AS player_count
          FROM sixth_sense_players WHERE room_code=${code}
        )
        INSERT INTO sixth_sense_players (id, room_code, resume_hash, display_name, avatar, accent, decoration, seat, identity_id)
        SELECT ${playerId}, locked_room.code, ${tokenHash(resumeToken)}, ${player.name}, ${player.avatar}, ${player.accent}, ${player.decoration}, next_seat.seat, ${body.identityId || null}
        FROM locked_room CROSS JOIN next_seat WHERE next_seat.player_count < locked_room.capacity
          AND NOT EXISTS (SELECT 1 FROM sixth_sense_players WHERE room_code=locked_room.code AND identity_id=${body.identityId || null})
        RETURNING *`;
    } catch (error) {
      if (error.code !== "23505") throw error;
    }
  }
  if (!inserted?.length) {
    const currentRoom = await getRoom(sql, code);
    if (!canJoinRoom(currentRoom)) throw Object.assign(new Error(currentRoom.status === "finished" ? "That match has finished." : "That match has already started."), { status: 409 });
    const duplicate = await sql`SELECT 1 FROM sixth_sense_players WHERE room_code=${code} AND identity_id=${body.identityId || null} LIMIT 1`;
    if (duplicate.length) throw Object.assign(new Error("Your seat was just added. Join again to restore it."), { status: 409 });
    const count = await sql`SELECT COUNT(*)::int AS count FROM sixth_sense_players WHERE room_code=${code}`;
    if (count[0].count >= currentRoom.capacity) throw Object.assign(new Error("That room is full."), { status: 409 });
    throw Object.assign(new Error("The room changed while you joined. Try once more."), { status: 409 });
  }
  const refreshedRoom = await getRoom(sql, code);
  return { roomCode: code, resumeToken, playerId, snapshot: await snapshot(sql, refreshedRoom, inserted[0]) };
}

function canJoinRoom(room) {
  return room.status === "waiting" || (room.mode === "race" && room.status === "running");
}

function chooseAnswers(difficulty, count, theme = "classic") {
  const pool = [...(theme === "bollywood" ? Bollywood : Core.answersForDifficulty(difficulty))];
  const chosen = [];
  while (chosen.length < count) {
    const index = crypto.randomInt(pool.length);
    chosen.push(pool[index].word);
    pool.splice(index, 1);
  }
  return chosen;
}

function chooseFreshAnswer(difficulty, usedWords, theme = "classic") {
  const fullPool = (theme === "bollywood" ? Bollywood : Core.answersForDifficulty(difficulty)).map(entry => entry.word);
  const unused = fullPool.filter(word => !usedWords.includes(word));
  const pool = unused.length ? unused : fullPool;
  return pool[crypto.randomInt(pool.length)];
}

async function startMatch(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const me = await authenticate(sql, code, body.resumeToken);
  const room = await getRoom(sql, code);
  if (room.host_player_id !== me.id) throw Object.assign(new Error("Only the host can start the match."), { status: 403 });
  if (room.status !== "waiting") return { snapshot: await snapshot(sql, room, me) };
  const counts = await sql`SELECT COUNT(*)::int AS count FROM sixth_sense_players WHERE room_code=${code}`;
  if (counts[0].count < 2) throw Object.assign(new Error("At least two players are needed."), { status: 409 });
  const answers = chooseAnswers(room.difficulty, room.endless ? 1 : room.word_count, isBollywood(room) ? "bollywood" : "classic");
  const updated = await sql`UPDATE sixth_sense_rooms SET status='running', answer_words=${JSON.stringify(answers)}::jsonb, current_round=0, last_round_winner_player_id=NULL, revision=revision+1
    WHERE code=${code} AND status='waiting' AND revision=${room.revision} RETURNING *`;
  const activeRoom = updated[0] || await getRoom(sql, code);
  return { snapshot: await snapshot(sql, activeRoom, me) };
}

async function storeAction(sql, actionId, code, playerId, response) {
  await sql`INSERT INTO sixth_sense_actions (action_id, room_code, player_id, response) VALUES (${actionId}, ${code}, ${playerId}, ${JSON.stringify(response)}::jsonb)
    ON CONFLICT (action_id) DO NOTHING`;
  return response;
}

async function submitVsGuess(sql, { code, guess, actionId, me, room }) {
  const roundIndex = Number(room.current_round) || 0;
  const answers = parseJson(room.answer_words, []);
  const answer = answers[roundIndex];
  if (!answer) throw Object.assign(new Error("The room puzzle state is incomplete."), { status: 409 });
  const attempts = parseJson(me.attempts, []);
  const storedLifelines = parseJson(me.lifeline_state, {});
  const lifelines = Number(storedLifelines.round) === roundIndex ? storedLifelines : { round: roundIndex, clue: "", peeked: [], eliminatedLetters: [] };
  const score = Core.scoreGuess(guess, answer);
  attempts.push({ guess, score });
  const won = guess === answer;
  const hasExtraAttempt = Boolean(lifelines.extraAttempt);
  const exhausted = !won && attempts.length >= roomGuessLimit(room) + (hasExtraAttempt ? 1 : 0);

  if (!won && attempts.length === roomGuessLimit(room) && !hasExtraAttempt) {
    const pending = { ...lifelines, lastChancePending: true };
    const updated = await sql`UPDATE sixth_sense_players SET attempts=${JSON.stringify(attempts)}::jsonb, lifeline_state=${JSON.stringify(pending)}::jsonb,
        revision=revision+1, updated_at=now()
      WHERE id=${me.id} AND revision=${me.revision}
        AND EXISTS (SELECT 1 FROM sixth_sense_rooms WHERE code=${code} AND status='running' AND current_round=${roundIndex})
      RETURNING *`;
    if (!updated.length) throw Object.assign(new Error("The round changed while that guess arrived. Your board has been refreshed."), { status: 409 });
    return storeAction(sql, actionId, code, me.id, { snapshot: await snapshot(sql, room, updated[0]) });
  }

  if (!won && !exhausted) {
    const updated = await sql`UPDATE sixth_sense_players SET attempts=${JSON.stringify(attempts)}::jsonb, revision=revision+1, updated_at=now()
      WHERE id=${me.id} AND revision=${me.revision}
        AND EXISTS (SELECT 1 FROM sixth_sense_rooms WHERE code=${code} AND status='running' AND current_round=${roundIndex})
      RETURNING *`;
    if (!updated.length) throw Object.assign(new Error("The round changed while that guess arrived. Your board has been refreshed."), { status: 409 });
    return storeAction(sql, actionId, code, me.id, { snapshot: await snapshot(sql, room, updated[0]) });
  }

  const players = await sql`SELECT id, score, completed_rounds FROM sixth_sense_players WHERE room_code=${code} ORDER BY seat`;
  const opponent = players.find(player => player.id !== me.id);
  if (!opponent) throw Object.assign(new Error("The opponent is no longer in this room."), { status: 409 });
  const roundWinnerId = won ? me.id : opponent.id;
  const resolution = resolveVsRound({ currentRound: roundIndex, wordCount: room.word_count, endless: room.endless, players, roundWinnerId });
  const nextAnswers = [...answers];
  if (room.endless && nextAnswers.length <= resolution.nextRound) nextAnswers.push(chooseFreshAnswer(room.difficulty, nextAnswers, isBollywood(room) ? "bollywood" : "classic"));
  const updatedRooms = await sql`UPDATE sixth_sense_rooms SET current_round=${resolution.nextRound}, last_round_winner_player_id=${roundWinnerId},
      answer_words=${JSON.stringify(nextAnswers)}::jsonb, status=${resolution.finished ? "finished" : "running"},
      winner_player_id=${resolution.matchWinnerId}, revision=revision+1
    WHERE code=${code} AND status='running' AND current_round=${roundIndex} AND revision=${room.revision} RETURNING *`;
  if (!updatedRooms.length) throw Object.assign(new Error("Your opponent won that point a moment earlier. Loading the new word."), { status: 409 });

  const winner = players.find(player => player.id === roundWinnerId);
  const completedRounds = [...parseJson(winner.completed_rounds, []), {
    wordIndex: roundIndex,
    attempts: won ? attempts.length : null,
    forfeit: !won
  }];
  await sql`UPDATE sixth_sense_players SET attempts='[]'::jsonb,
      completed_rounds=CASE WHEN id=${roundWinnerId} THEN ${JSON.stringify(completedRounds)}::jsonb ELSE completed_rounds END,
      score=score + CASE WHEN id=${roundWinnerId} THEN 1 ELSE 0 END,
      finished=${resolution.finished}, eliminated=false, lifeline_state='{}'::jsonb, revision=revision+1, updated_at=now()
    WHERE room_code=${code}`;
  const own = (await sql`SELECT * FROM sixth_sense_players WHERE id=${me.id} LIMIT 1`)[0];
  return storeAction(sql, actionId, code, me.id, { snapshot: await snapshot(sql, updatedRooms[0], own) });
}

async function submitCoopGuess(sql, { code, guess, actionId, me, room }) {
  const roundIndex = Number(room.current_round) || 0;
  const answers = parseJson(room.answer_words, []);
  const answer = answers[roundIndex];
  if (!answer) throw Object.assign(new Error("The room puzzle state is incomplete."), { status: 409 });
  const attempts = parseJson(me.attempts, []);
  const storedLifelines = parseJson(me.lifeline_state, {});
  const lifelines = Number(storedLifelines.round) === roundIndex ? storedLifelines : { round: roundIndex, clue: "", peeked: [], eliminatedLetters: [] };
  const score = Core.scoreGuess(guess, answer);
  attempts.push({ guess, score });
  const won = guess === answer;
  const hasExtraAttempt = Boolean(lifelines.extraAttempt);

  if (!won && attempts.length === roomGuessLimit(room) && !hasExtraAttempt) {
    const pending = { ...lifelines, lastChancePending: true };
    const updated = await sql`UPDATE sixth_sense_players SET attempts=${JSON.stringify(attempts)}::jsonb, lifeline_state=${JSON.stringify(pending)}::jsonb,
        revision=revision+1, updated_at=now()
      WHERE id=${me.id} AND revision=${me.revision}
        AND EXISTS (SELECT 1 FROM sixth_sense_rooms WHERE code=${code} AND status='running' AND current_round=${roundIndex})
      RETURNING *`;
    if (!updated.length) throw Object.assign(new Error("A teammate changed the word while that guess arrived."), { status: 409 });
    return storeAction(sql, actionId, code, me.id, { snapshot: await snapshot(sql, room, updated[0]) });
  }

  if (!won) {
    const exhausted = attempts.length >= roomGuessLimit(room) + (hasExtraAttempt ? 1 : 0);
    const updated = await sql`UPDATE sixth_sense_players SET attempts=${JSON.stringify(exhausted ? [] : attempts)}::jsonb,
        failed_batches=failed_batches + ${exhausted ? 1 : 0}, lifeline_state=${JSON.stringify(exhausted ? {} : lifelines)}::jsonb,
        revision=revision+1, updated_at=now()
      WHERE id=${me.id} AND revision=${me.revision}
        AND EXISTS (SELECT 1 FROM sixth_sense_rooms WHERE code=${code} AND status='running' AND current_round=${roundIndex})
      RETURNING *`;
    if (!updated.length) throw Object.assign(new Error("A teammate changed the word while that guess arrived."), { status: 409 });
    return storeAction(sql, actionId, code, me.id, { snapshot: await snapshot(sql, room, updated[0]) });
  }

  const nextRound = roundIndex + 1;
  const finished = nextRound >= Number(room.word_count);
  const updatedRooms = await sql`UPDATE sixth_sense_rooms SET current_round=${nextRound}, last_round_winner_player_id=${me.id},
      status=${finished ? "finished" : "running"}, winner_player_id=${finished ? me.id : null}, revision=revision+1
    WHERE code=${code} AND status='running' AND current_round=${roundIndex} AND revision=${room.revision} RETURNING *`;
  if (!updatedRooms.length) throw Object.assign(new Error("A teammate solved that word a moment earlier. Loading the new word."), { status: 409 });
  const completed = [...parseJson(me.completed_rounds, []), { wordIndex: roundIndex, attempts: attempts.length, cooperative: true }];
  await sql`UPDATE sixth_sense_players SET current_word_index=${nextRound}, attempts='[]'::jsonb,
      completed_rounds=CASE WHEN id=${me.id} THEN ${JSON.stringify(completed)}::jsonb ELSE completed_rounds END,
      score=score+1, finished=${finished}, eliminated=false, lifeline_state='{}'::jsonb, revision=revision+1, updated_at=now()
    WHERE room_code=${code}`;
  const own = (await sql`SELECT * FROM sixth_sense_players WHERE id=${me.id} LIMIT 1`)[0];
  return storeAction(sql, actionId, code, me.id, { snapshot: await snapshot(sql, updatedRooms[0], own) });
}

async function submitGuess(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const guess = String(body.guess || "").toLowerCase();
  const actionId = String(body.actionId || "");
  if (!/^[0-9a-f-]{36}$/i.test(actionId)) throw Object.assign(new Error("Invalid action identifier."), { status: 400 });
  const me = await authenticate(sql, code, body.resumeToken);
  const prior = await sql`SELECT response FROM sixth_sense_actions WHERE action_id=${actionId} AND player_id=${me.id}`;
  if (prior.length) return parseJson(prior[0].response, prior[0].response);
  const room = await getRoom(sql, code);
  if (room.status !== "running") throw Object.assign(new Error("The match is not accepting guesses."), { status: 409 });
  if (me.finished) throw Object.assign(new Error("Your run is already complete."), { status: 409 });
  const active = activeAnswer(room, me);
  const effects = parseJson(me.lifeline_state, {});
  const currentEffects = Number(effects.round) === active.index ? effects : {};
  if (currentEffects.lastChancePending || currentEffects.pendingSkip) throw Object.assign(new Error("Finish the open decision before guessing."), { status: 409 });
  if (parseJson(me.attempts, []).length >= roomGuessLimit(room) + (currentEffects.extraAttempt ? 1 : 0)) throw Object.assign(new Error("No attempts remain for this word."), { status: 409 });
  if (isBollywood(room)) {
    if (!active.answer || !/^[a-z]{5,7}$/.test(guess) || guess.length !== active.answer.length) throw Object.assign(new Error(`Enter ${active.answer?.length || "5–7"} letters for this Bollywood answer.`), { status: 400 });
  } else if (!Core.isValidWord(guess)) throw Object.assign(new Error("That word is not in the accepted dictionary."), { status: 400 });
  if (room.mode === "vs") return submitVsGuess(sql, { code, guess, actionId, me, room });
  if (room.mode === "coop") return submitCoopGuess(sql, { code, guess, actionId, me, room });
  const answers = parseJson(room.answer_words, []);
  const answer = answers[me.current_word_index];
  if (!answer) throw Object.assign(new Error("The room puzzle state is incomplete."), { status: 409 });
  const attempts = parseJson(me.attempts, []);
  const score = Core.scoreGuess(guess, answer);
  attempts.push({ guess, score });
  const won = guess === answer;
  const storedLifelines = parseJson(me.lifeline_state, {});
  const lifelines = Number(storedLifelines.round) === Number(me.current_word_index) ? storedLifelines : { round: Number(me.current_word_index), clue: "", peeked: [], eliminatedLetters: [] };
  const hasExtraAttempt = Boolean(lifelines.extraAttempt);
  const exhausted = !won && attempts.length >= roomGuessLimit(room) + (hasExtraAttempt ? 1 : 0);
  let nextIndex = me.current_word_index;
  let nextAttempts = attempts;
  let completedRounds = parseJson(me.completed_rounds, []);
  let failedBatches = me.failed_batches;
  let finished = false;
  let eliminated = false;
  let lifelineState = lifelines;
  if (won) {
    completedRounds = [...completedRounds, { wordIndex: me.current_word_index, attempts: attempts.length }];
    nextIndex += 1;
    nextAttempts = [];
    lifelineState = {};
    finished = nextIndex >= room.word_count;
  } else if (!won && attempts.length === roomGuessLimit(room) && !hasExtraAttempt) {
    lifelineState = { ...lifelines, lastChancePending: true };
  } else if (exhausted && room.mode === "race") {
    failedBatches += 1;
    nextAttempts = [];
    lifelineState = {};
  }
  const updated = await sql`UPDATE sixth_sense_players SET current_word_index=${nextIndex}, attempts=${JSON.stringify(nextAttempts)}::jsonb,
      completed_rounds=${JSON.stringify(completedRounds)}::jsonb, failed_batches=${failedBatches}, finished=${finished}, eliminated=${eliminated},
      lifeline_state=${JSON.stringify(lifelineState)}::jsonb,
      revision=revision+1, updated_at=now()
    WHERE id=${me.id} AND revision=${me.revision} RETURNING *`;
  if (!updated.length) throw Object.assign(new Error("Two guesses arrived together; please submit again."), { status: 409 });
  let activeRoom = room;
  if (won && finished) {
    const wonRoom = await sql`UPDATE sixth_sense_rooms SET status='finished', winner_player_id=${me.id}, revision=revision+1
      WHERE code=${code} AND status='running' AND winner_player_id IS NULL RETURNING *`;
    if (wonRoom.length) activeRoom = wonRoom[0];
  }
  const response = { snapshot: await snapshot(sql, activeRoom, updated[0]) };
  return storeAction(sql, actionId, code, me.id, response);
}

function activeAnswer(room, me) {
  const answers = parseJson(room.answer_words, []);
  const index = isSharedRoundMode(room.mode) ? Number(room.current_round) || 0 : Number(me.current_word_index) || 0;
  return { answer: answers[index], index, answers };
}

async function submitLifeline(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const kind = String(body.kind || "").toLowerCase();
  const actionId = String(body.actionId || "");
  if (!/^[0-9a-f-]{36}$/i.test(actionId) || !["sense", "peek", "clear", "skip"].includes(kind)) throw Object.assign(new Error("Invalid lifeline request."), { status: 400 });
  const me = await authenticate(sql, code, body.resumeToken);
  const prior = await sql`SELECT response FROM sixth_sense_actions WHERE action_id=${actionId} AND player_id=${me.id}`;
  if (prior.length) return parseJson(prior[0].response, prior[0].response);
  const room = await getRoom(sql, code);
  if (room.status !== "running" || me.finished) throw Object.assign(new Error("Lifelines are only available during an active match."), { status: 409 });
  const { answer, index, answers } = activeAnswer(room, me);
  if (!answer) throw Object.assign(new Error("The room puzzle state is incomplete."), { status: 409 });
  const priorState = parseJson(me.lifeline_state, {});
  const lifelines = Number(priorState.round) === index ? priorState : { round: index, clue: "", peeked: [], eliminatedLetters: [] };
  if (lifelines.lastChancePending || lifelines.pendingSkip) throw Object.assign(new Error("Finish the open decision before using another lifeline."), { status: 409 });

  if (kind === "skip") throw Object.assign(new Error("Skip is disabled in multiplayer. Refresh the game to update your controls."), { status: 409 });

  let effect;
  if (kind === "sense") {
    lifelines.clue = clueFor(room, answer) || lifelines.clue || (isBollywood(room) ? "A Hindi film or performer." : "A familiar six-letter word.");
    effect = { kind, clue: lifelines.clue };
  } else if (kind === "peek") {
    const candidates = Core.remainingPeekPositions(parseJson(me.attempts, []), (lifelines.peeked || []).map(entry => entry.position), answer.length);
    if (!candidates.length) throw Object.assign(new Error("Every position is already revealed."), { status: 409 });
    const seed = crypto.createHash("sha256").update(`${answer}:${me.id}:${candidates.length}`).digest().readUInt32BE(0);
    const position = candidates[seed % candidates.length];
    const reveal = { position, letter: answer[position] };
    lifelines.peeked = [...(lifelines.peeked || []), reveal];
    effect = { kind, ...reveal };
  } else {
    const used = new Set(lifelines.eliminatedLetters || []);
    const candidates = "abcdefghijklmnopqrstuvwxyz".split("").filter(letter => !answer.includes(letter) && !used.has(letter));
    if (!candidates.length) throw Object.assign(new Error("There are no more impossible letters to remove."), { status: 409 });
    const seed = crypto.createHash("sha256").update(`${answer}:${me.id}:${candidates.length}`).digest().readUInt32BE(0);
    const removed = Array.from({ length: Math.min(3, candidates.length) }, (_, offset) => candidates[(seed + offset) % candidates.length]);
    lifelines.eliminatedLetters = [...used, ...removed];
    effect = { kind, letters: removed };
  }
  const updated = await sql`UPDATE sixth_sense_players SET lifeline_state=${JSON.stringify(lifelines)}::jsonb, revision=revision+1, updated_at=now()
    WHERE id=${me.id} AND revision=${me.revision} RETURNING *`;
  if (!updated.length) throw Object.assign(new Error("Two actions arrived together; please try again."), { status: 409 });
  return storeAction(sql, actionId, code, me.id, { effect, snapshot: await snapshot(sql, room, updated[0]) });
}

async function advanceSkip(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const actionId = String(body.actionId || "");
  if (!/^[0-9a-f-]{36}$/i.test(actionId)) throw Object.assign(new Error("Invalid action identifier."), { status: 400 });
  const me = await authenticate(sql, code, body.resumeToken);
  const prior = await sql`SELECT response FROM sixth_sense_actions WHERE action_id=${actionId} AND player_id=${me.id}`;
  if (prior.length) return parseJson(prior[0].response, prior[0].response);
  const room = await getRoom(sql, code);
  if (room.status !== "running" || room.mode === "vs") throw Object.assign(new Error("Skip cannot advance this match."), { status: 409 });
  const { index } = activeAnswer(room, me);
  const lifelines = parseJson(me.lifeline_state, {});
  if (!lifelines.pendingSkip || Number(lifelines.round) !== index) throw Object.assign(new Error("There is no revealed Skip to confirm."), { status: 409 });

  if (room.mode === "coop") {
    const nextRound = index + 1;
    const finished = nextRound >= Number(room.word_count);
    const updatedRooms = await sql`UPDATE sixth_sense_rooms SET current_round=${nextRound}, last_round_winner_player_id=NULL,
        status=${finished ? "finished" : "running"}, winner_player_id=NULL, revision=revision+1
      WHERE code=${code} AND status='running' AND current_round=${index} AND revision=${room.revision} RETURNING *`;
    if (!updatedRooms.length) throw Object.assign(new Error("A teammate already changed the word."), { status: 409 });
    await sql`UPDATE sixth_sense_players SET current_word_index=${nextRound}, attempts='[]'::jsonb, lifeline_state='{}'::jsonb,
        failed_batches=failed_batches+1, score=score+1, finished=${finished}, revision=revision+1, updated_at=now()
      WHERE room_code=${code}`;
    const own = (await sql`SELECT * FROM sixth_sense_players WHERE id=${me.id} LIMIT 1`)[0];
    return storeAction(sql, actionId, code, me.id, { effect: { kind: "skip", advanced: true, noReward: true }, snapshot: await snapshot(sql, updatedRooms[0], own) });
  }

  const nextIndex = Number(me.current_word_index) + 1;
  const finished = nextIndex >= Number(room.word_count);
  const updated = await sql`UPDATE sixth_sense_players SET current_word_index=${nextIndex}, attempts='[]'::jsonb, lifeline_state='{}'::jsonb,
      failed_batches=failed_batches+1, finished=${finished}, revision=revision+1, updated_at=now()
    WHERE id=${me.id} AND revision=${me.revision} RETURNING *`;
  if (!updated.length) throw Object.assign(new Error("The word changed while Skip was confirmed."), { status: 409 });
  return storeAction(sql, actionId, code, me.id, { effect: { kind: "skip", advanced: true, noReward: true }, snapshot: await snapshot(sql, room, updated[0]) });
}

async function submitLastChance(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const decision = body.decision === "purchase" ? "purchase" : body.decision === "decline" ? "decline" : "";
  const actionId = String(body.actionId || "");
  if (!decision || !/^[0-9a-f-]{36}$/i.test(actionId)) throw Object.assign(new Error("Invalid Last Chance request."), { status: 400 });
  const me = await authenticate(sql, code, body.resumeToken);
  const prior = await sql`SELECT response FROM sixth_sense_actions WHERE action_id=${actionId} AND player_id=${me.id}`;
  if (prior.length) return parseJson(prior[0].response, prior[0].response);
  const room = await getRoom(sql, code);
  if (room.status !== "running") throw Object.assign(new Error("The match is no longer active."), { status: 409 });
  const { index, answers } = activeAnswer(room, me);
  const lifelines = parseJson(me.lifeline_state, {});
  if ((body.expectedRound !== undefined && Number(body.expectedRound) !== index) || (body.expectedFailedBatches !== undefined && Number(body.expectedFailedBatches) !== Number(me.failed_batches))) throw Object.assign(new Error("The word changed before the reward was collected."), { status: 409 });
  if (!lifelines.lastChancePending || Number(lifelines.round) !== index) throw Object.assign(new Error("Last Chance is not currently available."), { status: 409 });

  if (decision === "purchase") {
    const updated = await sql`UPDATE sixth_sense_players SET lifeline_state=${JSON.stringify({ ...lifelines, lastChancePending: false, extraAttempt: true })}::jsonb,
        revision=revision+1, updated_at=now() WHERE id=${me.id} AND revision=${me.revision} RETURNING *`;
    if (!updated.length) throw Object.assign(new Error("The word changed while Last Chance was unlocked."), { status: 409 });
    return storeAction(sql, actionId, code, me.id, { effect: { kind: "last-chance", purchased: true }, snapshot: await snapshot(sql, room, updated[0]) });
  }

  if (room.mode === "vs") {
    const players = await sql`SELECT id, score, completed_rounds FROM sixth_sense_players WHERE room_code=${code} ORDER BY seat`;
    const opponent = players.find(player => player.id !== me.id);
    if (!opponent) throw Object.assign(new Error("The opponent is no longer in this room."), { status: 409 });
    const resolution = resolveVsRound({ currentRound: index, wordCount: room.word_count, endless: room.endless, players, roundWinnerId: opponent.id });
    const nextAnswers = [...answers];
    if (room.endless && nextAnswers.length <= resolution.nextRound) nextAnswers.push(chooseFreshAnswer(room.difficulty, nextAnswers, isBollywood(room) ? "bollywood" : "classic"));
    const updatedRooms = await sql`UPDATE sixth_sense_rooms SET current_round=${resolution.nextRound}, last_round_winner_player_id=${opponent.id}, answer_words=${JSON.stringify(nextAnswers)}::jsonb,
        status=${resolution.finished ? "finished" : "running"}, winner_player_id=${resolution.matchWinnerId}, revision=revision+1
      WHERE code=${code} AND status='running' AND current_round=${index} AND revision=${room.revision} RETURNING *`;
    if (!updatedRooms.length) throw Object.assign(new Error("The round changed while Last Chance was declined."), { status: 409 });
    const opponentRounds = [...parseJson(opponent.completed_rounds, []), { wordIndex: index, attempts: null, forfeit: true }];
    await sql`UPDATE sixth_sense_players SET attempts='[]'::jsonb, lifeline_state='{}'::jsonb,
        completed_rounds=CASE WHEN id=${opponent.id} THEN ${JSON.stringify(opponentRounds)}::jsonb ELSE completed_rounds END,
        score=score + CASE WHEN id=${opponent.id} THEN 1 ELSE 0 END, finished=${resolution.finished}, revision=revision+1, updated_at=now()
      WHERE room_code=${code}`;
    const own = (await sql`SELECT * FROM sixth_sense_players WHERE id=${me.id} LIMIT 1`)[0];
    return storeAction(sql, actionId, code, me.id, { effect: { kind: "last-chance", declined: true }, snapshot: await snapshot(sql, updatedRooms[0], own) });
  }

  const updated = await sql`UPDATE sixth_sense_players SET attempts='[]'::jsonb, lifeline_state='{}'::jsonb,
      failed_batches=failed_batches+1, revision=revision+1, updated_at=now()
    WHERE id=${me.id} AND revision=${me.revision} RETURNING *`;
  if (!updated.length) throw Object.assign(new Error("The word changed while Last Chance was declined."), { status: 409 });
  return storeAction(sql, actionId, code, me.id, { effect: { kind: "last-chance", declined: true }, snapshot: await snapshot(sql, room, updated[0]) });
}

async function updateIdentity(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const me = await authenticate(sql, code, body.resumeToken);
  await bindIdentity(sql, me, body);
  const player = cleanPlayer(body.player);
  const updated = await sql`UPDATE sixth_sense_players SET display_name=${player.name}, avatar=${player.avatar}, accent=${player.accent}, decoration=${player.decoration}, revision=revision+1, updated_at=now()
    WHERE id=${me.id} RETURNING *`;
  const room = await getRoom(sql, code);
  return { snapshot: await snapshot(sql, room, updated[0]) };
}

async function updatePresence(sql, body) {
  if (typeof body.away !== "boolean" || !Number.isSafeInteger(body.sequence) || body.sequence < 1 || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(body.eventId || "")) throw Object.assign(new Error("Invalid screen status."), { status: 400 });
  const code = String(body.roomCode || "").toUpperCase();
  const me = await authenticate(sql, code, body.resumeToken);
  const room = await getRoom(sql, code);
  if (room.status !== "running") return { accepted: false };
  // Count each departure once even if a quick return arrives first. Sequence
  // ordering prevents a delayed departure from turning a returned player red.
  // Keep gameplay revision unchanged so presence cannot cancel a valid guess.
  await sql`WITH departure AS (
      INSERT INTO sixth_sense_presence_events (event_id, player_id, sequence)
      SELECT ${body.eventId}::uuid, ${me.id}::uuid, ${body.sequence}::bigint WHERE ${body.away}
      ON CONFLICT DO NOTHING RETURNING event_id
    ) UPDATE sixth_sense_players SET
      away_count=away_count+(SELECT count(*)::integer FROM departure),
      screen_away=CASE WHEN ${body.sequence}::bigint > presence_sequence THEN ${body.away} ELSE screen_away END,
      presence_sequence=GREATEST(presence_sequence, ${body.sequence}::bigint)
    WHERE id=${me.id}`;
  return { accepted: true };
}

async function getSnapshot(sql, body) {
  const code = String(body.roomCode || "").toUpperCase();
  const me = await authenticate(sql, code, body.resumeToken);
  await bindIdentity(sql, me, body);
  const room = await getRoom(sql, code);
  return { snapshot: await snapshot(sql, room, me) };
}

async function bindIdentity(sql, me, body) {
  if (!body.identityId) return; // Old seats can finish using their unique Guest label.
  if (me.identity_id && me.identity_id !== body.identityId) throw Object.assign(new Error("This room belongs to another profile. Restore its recovery code to continue."), { status: 403 });
  if (me.identity_id) return;
  try {
    const rows = await sql`UPDATE sixth_sense_players SET identity_id=${body.identityId} WHERE id=${me.id} AND identity_id IS NULL RETURNING id`;
    if (!rows.length) throw Object.assign(new Error("The room identity changed. Rejoin your room."), { status: 409 });
  } catch (error) {
    if (error.code === "23505") throw Object.assign(new Error("This profile already has a seat. Leave and rejoin with the room code."), { status: 409 });
    throw error;
  }
}

async function authorizeIdentity(sql, body) {
  delete body.identityId; // Never trust a client-supplied database identity.
  const required = body.action === "create" || body.action === "identity" || (body.action === "join" && !body.resumeToken);
  if (required || (body.identityToken && ["join", "snapshot"].includes(body.action))) {
    const profile = await Identities.authenticate(sql, body.identityToken);
    body.identityId = profile.id;
    body.player = { ...body.player, name: profile.display_name };
  }
}

async function handler(request, response) {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type");
  response.setHeader("cache-control", "no-store");
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "Use POST." });
  try {
    const sql = database();
    await ensureSchema(sql);
    const body = typeof request.body === "string" ? JSON.parse(request.body) : (request.body || {});
    await authorizeIdentity(sql, body);
    let result;
    if (body.action === "create") result = await createRoom(sql, body);
    else if (body.action === "join") result = await joinRoom(sql, body);
    else if (body.action === "start") result = await startMatch(sql, body);
    else if (body.action === "guess") result = await submitGuess(sql, body);
    else if (body.action === "lifeline") result = await submitLifeline(sql, body);
    else if (body.action === "advance_skip") result = await advanceSkip(sql, body);
    else if (body.action === "last_chance") result = await submitLastChance(sql, body);
    else if (body.action === "identity") result = await updateIdentity(sql, body);
    else if (body.action === "presence") result = await updatePresence(sql, body);
    else if (body.action === "snapshot") result = await getSnapshot(sql, body);
    else throw Object.assign(new Error("Unknown multiplayer action."), { status: 400 });
    return response.status(200).json(result);
  } catch (error) {
    console.error("multiplayer", error.status || error.code || "internal");
    return response.status(error.status || 500).json({ error: error.status ? error.message : "The room service could not complete that action." });
  }
}

module.exports = handler;
module.exports._test = { authorizeIdentity, bindIdentity, snapshot, createRoom, isBollywood, canJoinRoom, joinRoom, updatePresence, roomGuessLimit, submitGuess, submitLastChance, submitLifeline, cleanPlayer, roomCode, token, tokenHash, isSharedRoundMode, normalizeGameLength, resolveVsRound, chooseAnswers, chooseFreshAnswer, ACCENTS, AVATARS };
