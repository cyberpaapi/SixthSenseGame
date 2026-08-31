(function () {
  "use strict";

  const Core = window.SixthSenseCore;
  const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", [..."ZXCVBNM", "BACK"]];
  const MARKERS = { exact: "●", present: "◆", absent: "×" };
  const PRIORITY = { absent: 1, present: 2, exact: 3 };
  const DIFFICULTY_LABELS = Object.freeze({ easy: "Normal", medium: "Hard", extreme: "Extreme" });
  const API_BASE = document.documentElement.dataset.multiplayerApi || "";
  const POLL_MS = 900;
  const SETTINGS_KEY = "sixth-sense.settings.v1";
  const IDENTITY_KEY = "sixth-sense.online.identity.v1";
  const ACTIVE_ROOM_KEY = "sixth-sense.active-room.v1";
  const ONLINE_REWARDS_KEY = "sixth-sense.online-rewards.v1";
  const LENGTH_OPTIONS = Object.freeze({
    race: [{ value: "3", label: "Sprint", detail: "3" }, { value: "5", label: "Normal", detail: "5" }, { value: "10", label: "Marathon", detail: "10" }],
    vs: [{ value: "3", label: "Quick", detail: "3" }, { value: "5", label: "Classic", detail: "5" }, { value: "9", label: "Epic", detail: "9" }, { value: "endless", label: "Endless", detail: "∞" }],
    coop: [{ value: "3", label: "Sprint", detail: "3" }, { value: "5", label: "Normal", detail: "5" }, { value: "10", label: "Marathon", detail: "10" }]
  });

  const els = {
    lobby: document.querySelector("#online-lobby-modal"),
    lobbyKicker: document.querySelector("#online-lobby-kicker"),
    message: document.querySelector("#online-lobby-message"),
    name: document.querySelector("#online-player-name"),
    joinCode: document.querySelector("#online-join-code"),
    preview: document.querySelector("#online-avatar-preview"),
    distance: document.querySelector("#online-distance-options"),
    distanceGrid: document.querySelector("#online-distance-grid"),
    create: document.querySelector("#online-create-room"),
    join: document.querySelector("#online-join-room"),
    screen: document.querySelector("#online-screen"),
    home: document.querySelector("#home-screen"),
    solo: document.querySelector("#game-screen"),
    board: document.querySelector("#online-board"),
    keyboard: document.querySelector("#online-keyboard"),
    progress: document.querySelector("#player-progress-list"),
    title: document.querySelector("#online-room-title"),
    kicker: document.querySelector("#online-mode-kicker"),
    versusNames: document.querySelector("#online-versus-names"),
    roomCode: document.querySelector("#online-room-code"),
    roomState: document.querySelector("#online-room-state"),
    status: document.querySelector("#online-live-status"),
    roundTransition: document.querySelector("#online-round-transition"),
    roundKicker: document.querySelector("#online-round-kicker"),
    roundTitle: document.querySelector("#online-round-title"),
    roundScore: document.querySelector("#online-round-score"),
    start: document.querySelector("#online-start"),
    leave: document.querySelector("#online-leave"),
    leaveDialog: document.querySelector("#online-leave-modal"),
    leaveKicker: document.querySelector("#online-leave-kicker"),
    leaveTitle: document.querySelector("#online-leave-title"),
    leaveCopy: document.querySelector("#online-leave-copy"),
    leaveCancel: document.querySelector("#online-leave-cancel"),
    leaveConfirm: document.querySelector("#online-leave-confirm"),
    resultDialog: document.querySelector("#online-result-modal"),
    resultKicker: document.querySelector("#online-result-kicker"),
    resultTitle: document.querySelector("#online-result-title"),
    resultCopy: document.querySelector("#online-result-copy"),
    resultPoints: document.querySelector("#online-result-points"),
    resultOk: document.querySelector("#online-result-ok"),
    skipDialog: document.querySelector("#online-skip-result-modal"),
    skipWord: document.querySelector("#online-skip-revealed-word"),
    skipOk: document.querySelector("#online-skip-result-ok"),
    lastChanceDialog: document.querySelector("#last-chance-modal"),
    lastChanceCopy: document.querySelector("#last-chance-copy"),
    lifelines: [...document.querySelectorAll("[data-online-lifeline]")]
  };

  const state = {
    requestedMode: "race",
    roomCode: "",
    token: "",
    playerId: "",
    snapshot: null,
    current: "",
    activeRound: null,
    renderedSnapshotSignature: "",
    pollTimer: null,
    transitionTimer: null,
    busy: false,
    finishedResultShown: false,
    lastRoundCoinReward: 0
  };

  function readJson(key, fallback) {
    try { return { ...fallback, ...(JSON.parse(localStorage.getItem(key)) || {}) }; }
    catch (_) { return { ...fallback }; }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Storage can be unavailable. */ }
  }

  function playAudio(name, detail) {
    window.SixthSenseAudio?.play(name, detail);
  }

  function identity() {
    const settings = readJson(SETTINGS_KEY, { avatar: "fox", accent: "coral", decoration: "none" });
    const saved = readJson(IDENTITY_KEY, { name: "" });
    return { name: (els.name.value || saved.name || "Player").trim().slice(0, 18), avatar: settings.avatar || "fox", accent: settings.accent || "coral", decoration: settings.decoration || "none" };
  }

  function decorateAvatar(element, player) {
    element.className = `avatar-art avatar-${player.avatar}`;
    element.dataset.decoration = player.decoration || "none";
  }

  function setLobbyMessage(message, error = false) {
    els.message.textContent = message;
    els.message.dataset.error = String(error);
  }

  function openLobby(mode) {
    state.requestedMode = ["race", "vs", "coop"].includes(mode) ? mode : "race";
    const label = state.requestedMode === "vs" ? "One-on-one VS" : state.requestedMode === "coop" ? "Co-op journey" : "Multiplayer Race";
    els.lobbyKicker.textContent = label;
    els.distance.hidden = false;
    renderLengthOptions();
    els.create.textContent = state.requestedMode === "vs" ? "Create VS room" : state.requestedMode === "coop" ? "Create co-op room" : "Create private race";
    const savedIdentity = readJson(IDENTITY_KEY, { name: "" });
    els.name.value = savedIdentity.name || "";
    const player = identity();
    decorateAvatar(els.preview, player);
    setLobbyMessage("");
    els.lobby.showModal();
    playAudio("room");
    setTimeout(() => els.create.focus(), 80);
  }

  function renderLengthOptions() {
    const options = LENGTH_OPTIONS[state.requestedMode];
    els.distanceGrid.classList.toggle("has-four", options.length === 4);
    els.distanceGrid.innerHTML = options.map((option, index) => `<label><input type="radio" name="online-distance" value="${option.value}"${index === 0 ? " checked" : ""}><span>${option.label} <small>${option.detail}</small></span></label>`).join("");
  }

  async function api(action, payload = {}) {
    const response = await fetch(`${API_BASE}/api/multiplayer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Room service returned ${response.status}.`);
    return data;
  }

  function selectedValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value;
  }

  async function createRoom() {
    if (state.busy) return;
    const player = identity();
    if (!player.name || player.name === "Player") return setLobbyMessage("Choose a player name first.", true);
    saveJson(IDENTITY_KEY, { name: player.name });
    setBusy(true, "Creating room…");
    try {
      const result = await api("create", {
        mode: state.requestedMode,
        difficulty: selectedValue("online-difficulty") || "easy",
        wordCount: selectedValue("online-distance") || "3",
        player
      });
      enterRoom(result);
    } catch (error) { setLobbyMessage(friendlyError(error), true); }
    finally { setBusy(false); }
  }

  async function joinRoom() {
    if (state.busy) return;
    const player = identity();
    const code = els.joinCode.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6);
    if (!player.name || player.name === "Player") return setLobbyMessage("Choose a player name first.", true);
    if (code.length !== 6) return setLobbyMessage("Enter the six-character room code.", true);
    saveJson(IDENTITY_KEY, { name: player.name });
    setBusy(true, "Joining room…");
    try { enterRoom(await api("join", { roomCode: code, player })); }
    catch (error) { setLobbyMessage(friendlyError(error), true); }
    finally { setBusy(false); }
  }

  function friendlyError(error) {
    if (/fetch|network|json/i.test(error.message)) return "Online rooms are waiting for the production database connection.";
    if (/DATABASE_URL|database is not connected/i.test(error.message)) return "Online rooms are ready in the build; connect the Vercel database to activate them.";
    return error.message;
  }

  function setBusy(busy, message = "") {
    state.busy = busy;
    els.create.disabled = busy;
    els.join.disabled = busy;
    if (message) setLobbyMessage(message);
    if (state.snapshot && !els.screen.hidden) {
      renderKeyboard();
      renderLifelines();
    }
  }

  function enterRoom(result) {
    state.roomCode = result.roomCode;
    state.token = result.resumeToken;
    state.playerId = result.playerId;
    state.current = "";
    state.activeRound = ["vs", "coop"].includes(result.snapshot.room.mode) ? Number(result.snapshot.room.currentRound) || 0 : result.snapshot.me.currentWordIndex;
    state.snapshot = result.snapshot;
    state.finishedResultShown = false;
    state.renderedSnapshotSignature = "";
    localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({ roomCode: state.roomCode, token: state.token, playerId: state.playerId }));
    if (els.lobby.open) els.lobby.close();
    els.home.hidden = true;
    els.solo.hidden = true;
    els.screen.hidden = false;
    document.body.dataset.screen = "online";
    window.SixthSenseNavigation?.onlineEntered();
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderSnapshot();
    playAudio("success");
    schedulePoll(100);
  }

  function leaveRoom() {
    clearTimeout(state.pollTimer);
    state.pollTimer = null;
    state.snapshot = null;
    state.renderedSnapshotSignature = "";
    state.current = "";
    localStorage.removeItem(ACTIVE_ROOM_KEY);
    clearTimeout(state.transitionTimer);
    els.roundTransition.hidden = true;
    if (els.skipDialog.open) els.skipDialog.close();
    if (els.lastChanceDialog.open) els.lastChanceDialog.close();
    els.screen.hidden = true;
    els.home.hidden = false;
    els.solo.hidden = true;
    document.body.dataset.screen = "home";
    window.SixthSenseNavigation?.onlineLeft();
    window.scrollTo({ top: 0, behavior: "smooth" });
    playAudio("open");
  }

  function requestLeave() {
    if (els.screen.hidden || !state.snapshot) return;
    const mode = state.snapshot.room.mode;
    els.leaveKicker.textContent = "Leave this match?";
    els.leaveTitle.textContent = mode === "vs" ? "Leave VS room" : mode === "coop" ? "Leave co-op room" : "Leave race";
    els.leaveCopy.textContent = "Your saved seat on this device will be cleared, so you can’t resume this match after leaving. The room stays open for the other players.";
    if (!els.leaveDialog.open) els.leaveDialog.showModal();
    setTimeout(() => els.leaveCancel.focus(), 60);
  }

  function schedulePoll(delay = POLL_MS) {
    clearTimeout(state.pollTimer);
    state.pollTimer = setTimeout(poll, delay);
  }

  async function restoreActiveRoom() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(ACTIVE_ROOM_KEY)); } catch (_) { saved = null; }
    if (!saved || !/^[A-HJ-NP-Z2-9]{6}$/.test(saved.roomCode || "") || !saved.token || !saved.playerId) return;
    try {
      const result = await api("snapshot", { roomCode: saved.roomCode, resumeToken: saved.token });
      enterRoom({ roomCode: saved.roomCode, resumeToken: saved.token, playerId: saved.playerId, snapshot: result.snapshot });
    } catch (_) {
      localStorage.removeItem(ACTIVE_ROOM_KEY);
    }
  }

  async function poll() {
    if (!state.snapshot || els.screen.hidden) return;
    try {
      const result = await api("snapshot", { roomCode: state.roomCode, resumeToken: state.token });
      state.snapshot = result.snapshot;
      renderSnapshot();
    } catch (error) {
      els.status.textContent = friendlyError(error);
    }
    schedulePoll();
  }

  function snapshotSignature(snapshot) {
    return JSON.stringify(snapshot);
  }

  function renderSnapshot() {
    const snapshot = state.snapshot;
    if (!snapshot) return;
    const signature = snapshotSignature(snapshot);
    if (signature === state.renderedSnapshotSignature) return false;
    state.renderedSnapshotSignature = signature;
    const room = snapshot.room;
    const sharedRound = ["vs", "coop"].includes(room.mode);
    const nextRound = sharedRound ? Number(room.currentRound) || 0 : snapshot.me.currentWordIndex;
    const roundAdvanced = sharedRound && state.activeRound !== null && nextRound > state.activeRound;
    if (nextRound !== state.activeRound) state.current = "";
    state.activeRound = nextRound;
    els.kicker.textContent = room.mode === "vs" ? "One-on-one VS" : room.mode === "coop" ? "Co-op journey" : "Multiplayer Race";
    const lengthLabel = room.mode === "vs" && room.endless ? "Endless" : `${room.wordCount} ${room.mode === "vs" ? "rounds" : "words"}`;
    els.title.textContent = `${DIFFICULTY_LABELS[room.difficulty] || "Normal"} · ${lengthLabel}`;
    renderVersusNames();
    els.roomCode.textContent = room.code;
    els.roomState.textContent = room.status;
    const winner = snapshot.players.find(player => player.id === room.winnerPlayerId);
    if (room.status === "waiting") els.status.textContent = snapshot.players.length < 2 ? "Share the room code. The match can start when another player joins." : snapshot.me.isHost ? "Everyone is here—start when ready." : "Waiting for the host to start.";
    else if (room.status === "finished") els.status.textContent = winner ? `${winner.name} won the match!` : "Match complete.";
    else if (snapshot.me.finished) els.status.textContent = "Match complete.";
    else if (room.mode === "race") els.status.textContent = `Word ${Math.min(room.wordCount, snapshot.me.currentWordIndex + 1)} of ${room.wordCount}`;
    else if (room.mode === "coop") els.status.textContent = `Shared word ${Math.min(room.wordCount, nextRound + 1)} of ${room.wordCount} · Solve it together.`;
    else els.status.textContent = `${room.endless ? `Round ${nextRound + 1} · Endless` : `Round ${Math.min(room.wordCount, nextRound + 1)} of ${room.wordCount}`} · First solve wins the point.`;
    els.start.hidden = !(room.status === "waiting" && snapshot.me.isHost && snapshot.players.length >= 2);
    renderBoard();
    renderKeyboard();
    renderLifelines();
    renderProgress();
    awardVsRoundIfNeeded();
    showPendingDecisionIfNeeded();
    if (roundAdvanced) showRoundTransition();
    if (room.status === "finished" && !state.finishedResultShown) showMatchResult();
    return true;
  }

  function showMatchResult() {
    const snapshot = state.snapshot;
    const winner = snapshot.players.find(player => player.id === snapshot.room.winnerPlayerId);
    const me = snapshot.me;
    const isCoop = snapshot.room.mode === "coop";
    const won = isCoop || winner?.id === me.id;
    const progress = snapshot.room.mode === "vs" ? Number(me.score) || 0 : Math.min(Number(me.currentWordIndex) || 0, snapshot.room.wordCount);
    const points = progress * 100;
    state.finishedResultShown = true;
    els.resultKicker.textContent = won ? "Match complete" : "Final signal";
    els.resultTitle.textContent = isCoop ? "Team victory!" : won ? "Victory!" : "Match complete";
    els.resultCopy.textContent = isCoop ? "Every signal connected. Your team completed the shared route." : won ? "You carried the strongest signal to the finish." : winner ? `${winner.name} reached the finish first. Your progress still earned points.` : "The room has completed.";
    els.resultPoints.textContent = `+${points.toLocaleString()}`;
    if (!els.resultDialog.open) els.resultDialog.showModal();
    if (won) {
      window.SixthSenseCelebration?.();
      playAudio("win");
    }
    setTimeout(() => els.resultOk.focus({ preventScroll: true }), 60);
  }

  function renderVersusNames() {
    const snapshot = state.snapshot;
    if (snapshot.room.mode !== "vs" || snapshot.players.length < 2) {
      els.versusNames.hidden = true;
      els.versusNames.textContent = "";
      return;
    }
    const players = [...snapshot.players].sort((a, b) => a.seat - b.seat);
    els.versusNames.hidden = false;
    els.versusNames.replaceChildren(
      document.createTextNode(`${players[0].name} ${players[0].score || 0}`),
      Object.assign(document.createElement("b"), { textContent: "VS" }),
      document.createTextNode(`${players[1].score || 0} ${players[1].name}`)
    );
  }

  function showRoundTransition() {
    const snapshot = state.snapshot;
    const winner = snapshot.players.find(player => player.id === snapshot.room.lastRoundWinnerPlayerId);
    const players = [...snapshot.players].sort((a, b) => a.seat - b.seat);
    clearTimeout(state.transitionTimer);
    els.roundKicker.textContent = snapshot.room.mode === "coop" ? (winner ? `${winner.name} found the word` : "Word complete") : winner ? `${winner.name} wins the point` : "Round complete";
    els.roundTitle.textContent = snapshot.room.status === "finished" ? "Match complete" : "New word";
    els.roundScore.textContent = snapshot.room.mode === "coop" ? "The team advances together" : `${players.map(player => `${player.name} ${player.score || 0}`).join(" · ")}${state.lastRoundCoinReward ? ` · +${state.lastRoundCoinReward} coins` : ""}`;
    state.lastRoundCoinReward = 0;
    els.roundTransition.hidden = false;
    els.roundTransition.classList.remove("is-showing");
    void els.roundTransition.offsetWidth;
    els.roundTransition.classList.add("is-showing");
    playAudio(snapshot.room.status === "finished" ? "win" : "success");
    state.transitionTimer = setTimeout(() => {
      els.roundTransition.classList.remove("is-showing");
      els.roundTransition.hidden = true;
    }, 1650);
  }

  function currentAttempts() {
    return state.snapshot?.me?.attempts || [];
  }

  function renderBoard() {
    const attempts = currentAttempts();
    const peeked = new Map((state.snapshot?.me?.lifelines?.peeked || []).map(entry => [Number(entry.position), entry.letter]));
    els.board.innerHTML = "";
    const maxGuesses = Core.MAX_GUESSES + (state.snapshot?.me?.lifelines?.extraAttempt ? 1 : 0);
    els.board.classList.toggle("has-extra-row", maxGuesses > Core.MAX_GUESSES);
    for (let rowIndex = 0; rowIndex < maxGuesses; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "board-row";
      row.setAttribute("role", "row");
      const prior = attempts[rowIndex];
      const letters = prior ? prior.guess : rowIndex === attempts.length ? state.current : "";
      for (let column = 0; column < Core.WORD_LENGTH; column += 1) {
        const tile = document.createElement("div");
        const letter = letters[column] || "";
        const status = prior?.score[column];
        const peekedLetter = !prior && rowIndex === attempts.length && !letter ? peeked.get(column) : "";
        tile.className = `tile${status ? ` ${status}` : ""}${peekedLetter ? " peeked" : ""}`;
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", status ? `${letter.toUpperCase()}, ${status}` : letter ? letter.toUpperCase() : "empty");
        tile.textContent = peekedLetter || letter;
        if (status) {
          const marker = document.createElement("small");
          marker.textContent = MARKERS[status];
          marker.setAttribute("aria-hidden", "true");
          tile.appendChild(marker);
        }
        row.appendChild(tile);
      }
      els.board.appendChild(row);
    }
  }

  function keyStates() {
    const states = {};
    currentAttempts().forEach(entry => entry.guess.split("").forEach((letter, index) => {
      const next = entry.score[index];
      if (!states[letter] || PRIORITY[next] > PRIORITY[states[letter]]) states[letter] = next;
    }));
    return states;
  }

  function renderKeyboard() {
    const states = keyStates();
    const eliminated = new Set(state.snapshot?.me?.lifelines?.eliminatedLetters || []);
    const lifelines = state.snapshot?.me?.lifelines || {};
    const maxGuesses = Core.MAX_GUESSES + (lifelines.extraAttempt ? 1 : 0);
    const canPlay = state.snapshot?.room.status === "running" && !state.snapshot.me.finished && !lifelines.lastChancePending && !lifelines.pendingSkip && currentAttempts().length < maxGuesses && !state.busy;
    els.keyboard.innerHTML = "";
    KEY_ROWS.forEach(keys => {
      const row = document.createElement("div");
      row.className = "keyboard-row";
      [...keys].forEach(key => {
        const button = document.createElement("button");
        const letter = key.length === 1 ? key.toLowerCase() : key;
        const status = states[letter];
        button.type = "button";
        button.disabled = !canPlay || (key.length === 1 && eliminated.has(letter));
        button.className = `key${key.length > 1 ? " wide" : ""}${status ? ` ${status}` : ""}${eliminated.has(letter) ? " is-eliminated" : ""}`;
        button.dataset.onlineKey = key;
        button.setAttribute("aria-label", key === "BACK" ? "Delete letter" : `Letter ${key}${status ? `, ${status}` : ""}`);
        if (key === "BACK") button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM11 9l6 6M17 9l-6 6"></path></svg>';
        else button.textContent = key;
        if (status) {
          const marker = document.createElement("small");
          marker.className = "key-marker";
          marker.textContent = MARKERS[status];
          button.appendChild(marker);
        }
        button.addEventListener("click", () => handleKey(key));
        row.appendChild(button);
      });
      els.keyboard.appendChild(row);
    });
  }

  function handleKey(key) {
    if (els.screen.hidden || state.busy || state.snapshot?.room.status !== "running" || state.snapshot.me.finished) return;
    if (key === "ENTER") return submitGuess();
    if (key === "BACK") {
      if (!state.current) return;
      state.current = state.current.slice(0, -1);
      playAudio("delete");
    }
    else if (/^[A-Z]$/.test(key) && state.current.length < Core.WORD_LENGTH && !(state.snapshot?.me?.lifelines?.eliminatedLetters || []).includes(key.toLowerCase())) {
      state.current += key.toLowerCase();
      playAudio("letter", { semitone: (key.charCodeAt(0) - 65) % 7 });
    }
    else return;
    renderBoard();
    if (key !== "BACK" && state.current.length === Core.WORD_LENGTH) void submitGuess();
  }

  async function submitGuess() {
    if (state.current.length !== Core.WORD_LENGTH) return setPlayStatus("Six letters make the signal.");
    if (!Core.isValidWord(state.current)) return setPlayStatus("That word isn’t in the accepted dictionary.");
    state.busy = true;
    renderKeyboard();
    const guess = state.current;
    try {
      const result = await api("guess", { roomCode: state.roomCode, resumeToken: state.token, guess, actionId: crypto.randomUUID() });
      state.current = "";
      state.snapshot = result.snapshot;
      renderSnapshot();
      playAudio(state.snapshot.me.finished ? "win" : "submit");
      schedulePoll(250);
    } catch (error) {
      setPlayStatus(friendlyError(error));
      if (/opponent won|round changed/i.test(error.message)) schedulePoll(0);
    }
    finally { state.busy = false; renderKeyboard(); renderLifelines(); }
  }

  function renderLifelines() {
    const economy = window.SixthSenseEconomy?.state() || { inventory: {}, costs: Core.LIFELINE_COSTS };
    const effects = state.snapshot?.me?.lifelines || {};
    const active = state.snapshot?.room.status === "running" && !state.snapshot?.me.finished && !effects.lastChancePending && !effects.pendingSkip && !state.busy;
    const names = { sense: "Sense", peek: "Peek", clear: "Clear", skip: "Skip" };
    els.lifelines.forEach(item => {
      const kind = item.dataset.onlineLifeline;
      item.hidden = state.snapshot?.room.mode === "vs" && kind === "skip";
      if (item.hidden) return;
      const button = item.querySelector("button");
      const stock = item.querySelector(".lifeline-stock");
      const price = item.querySelector(".lifeline-price");
      const stored = Math.max(0, Number(economy.inventory?.[kind]) || 0);
      const senseUnlocked = kind === "sense" && Boolean(effects.clue);
      const exhausted = kind === "peek" && (effects.peeked || []).length >= Core.WORD_LENGTH;
      const available = !exhausted;
      stock.hidden = !(stored > 0 || senseUnlocked);
      stock.querySelector("b").textContent = senseUnlocked ? "1" : stored;
      price.hidden = !active || !available || stored > 0 || senseUnlocked;
      price.querySelector("b").textContent = economy.costs?.[kind] ?? Core.LIFELINE_COSTS[kind];
      button.disabled = !active || !available;
      button.setAttribute("aria-label", senseUnlocked ? "Sense: show the clue again" : stored > 0 ? `${names[kind]}: use one, ${stored} available` : `${names[kind]}: buy for ${Core.LIFELINE_COSTS[kind]} coins`);
    });
  }

  function showLifelineEffect(effect) {
    if (!effect) return;
    if (effect.kind === "sense") {
      window.SixthSenseDialogs?.showHint(effect.clue);
    }
    else if (effect.kind === "peek") els.status.textContent = `Peek: position ${Number(effect.position) + 1} is ${String(effect.letter).toUpperCase()}.`;
    else if (effect.kind === "clear") els.status.textContent = `Clear removed ${effect.letters.map(letter => letter.toUpperCase()).join(", ")}.`;
    else if (effect.kind === "skip") showOnlineSkip(effect.answer);
    playAudio(effect.kind === "sense" ? "hint" : effect.kind);
  }

  function rewardedRounds() {
    try {
      const saved = JSON.parse(localStorage.getItem(ONLINE_REWARDS_KEY));
      return new Set(Array.isArray(saved) ? saved : []);
    } catch (_) { return new Set(); }
  }

  function awardVsRoundIfNeeded() {
    const snapshot = state.snapshot;
    if (snapshot?.room.mode !== "vs" || snapshot.room.lastRoundWinnerPlayerId !== snapshot.me.id) return;
    const completed = snapshot.me.lastCompletedRound;
    if (!completed || completed.forfeit || !Number.isInteger(Number(completed.attempts))) return;
    const roundIndex = Number(snapshot.room.currentRound) - 1;
    if (Number(completed.wordIndex) !== roundIndex) return;
    const key = `${snapshot.room.code}:${roundIndex}`;
    const claimed = rewardedRounds();
    if (claimed.has(key)) return;
    const reward = Core.vsRewardForAttempts(Number(completed.attempts));
    if (!window.SixthSenseEconomy?.credit(reward, "VS round reward")) return;
    claimed.add(key);
    try { localStorage.setItem(ONLINE_REWARDS_KEY, JSON.stringify([...claimed].slice(-300))); } catch (_) { /* Ignore storage limits. */ }
    state.lastRoundCoinReward = reward;
  }

  function showOnlineSkip(answer) {
    if (!answer || !els.skipDialog) return;
    els.skipWord.innerHTML = "";
    String(answer).toUpperCase().split("").forEach(letter => {
      els.skipWord.appendChild(Object.assign(document.createElement("span"), { textContent: letter }));
    });
    if (!els.skipDialog.open) els.skipDialog.showModal();
    setTimeout(() => els.skipOk.focus({ preventScroll: true }), 60);
  }

  function showPendingDecisionIfNeeded() {
    const lifelines = state.snapshot?.me?.lifelines || {};
    if (!lifelines.pendingSkip && els.skipDialog.open) els.skipDialog.close();
    if (!lifelines.lastChancePending && els.lastChanceDialog.open) els.lastChanceDialog.close();
    if (lifelines.pendingSkip) {
      showOnlineSkip(lifelines.skippedAnswer);
      return;
    }
    if (lifelines.lastChancePending && !els.lastChanceDialog.open) {
      els.lastChanceCopy.textContent = `Unlock one final attempt for ${Core.LAST_CHANCE_COST} coins. No coins are spent until you continue.`;
      els.lastChanceDialog.showModal();
    }
  }

  async function confirmOnlineSkip() {
    if (state.busy || !state.snapshot?.me?.lifelines?.pendingSkip) return;
    state.busy = true;
    els.skipOk.disabled = true;
    try {
      const result = await api("advance_skip", { roomCode: state.roomCode, resumeToken: state.token, actionId: crypto.randomUUID() });
      state.snapshot = result.snapshot;
      state.current = "";
      if (els.skipDialog.open) els.skipDialog.close();
      state.renderedSnapshotSignature = "";
      renderSnapshot();
      schedulePoll(200);
    } catch (error) { setPlayStatus(friendlyError(error)); }
    finally { state.busy = false; els.skipOk.disabled = false; renderKeyboard(); renderLifelines(); }
  }

  async function resolveOnlineLastChance(purchase) {
    if (state.busy || !state.snapshot?.me?.lifelines?.lastChancePending) return;
    const economy = window.SixthSenseEconomy;
    if (purchase && !economy?.spend(Core.LAST_CHANCE_COST, "Last Chance")) return;
    state.busy = true;
    try {
      const result = await api("last_chance", { roomCode: state.roomCode, resumeToken: state.token, decision: purchase ? "purchase" : "decline", actionId: crypto.randomUUID() });
      state.snapshot = result.snapshot;
      state.current = "";
      if (els.lastChanceDialog.open) els.lastChanceDialog.close();
      state.renderedSnapshotSignature = "";
      renderSnapshot();
      schedulePoll(200);
    } catch (error) {
      if (purchase) economy?.credit(Core.LAST_CHANCE_COST, "Last Chance refund");
      setPlayStatus(friendlyError(error));
    } finally {
      state.busy = false;
      renderKeyboard();
      renderLifelines();
    }
  }

  async function useLifeline(item) {
    const kind = item.dataset.onlineLifeline;
    if (state.snapshot?.room.mode === "vs" && kind === "skip") return;
    if (state.busy || state.snapshot?.room.status !== "running" || state.snapshot.me.finished) return;
    const currentEffect = state.snapshot.me.lifelines || {};
    if (kind === "sense" && currentEffect.clue) {
      showLifelineEffect({ kind, clue: currentEffect.clue });
      return;
    }
    const economy = window.SixthSenseEconomy;
    if (!economy) return;
    const wallet = economy.state();
    if ((Number(wallet.inventory?.[kind]) || 0) < 1) {
      if (!economy.purchase(kind)) return;
      item.classList.remove("is-purchased");
      void item.offsetWidth;
      item.classList.add("is-purchased");
      renderLifelines();
    }
    state.busy = true;
    renderKeyboard();
    renderLifelines();
    try {
      const result = await api("lifeline", { roomCode: state.roomCode, resumeToken: state.token, kind, actionId: crypto.randomUUID() });
      economy.consume(kind);
      state.snapshot = result.snapshot;
      state.current = "";
      renderSnapshot();
      showLifelineEffect(result.effect);
      schedulePoll(250);
    } catch (error) {
      setPlayStatus(friendlyError(error));
    } finally {
      state.busy = false;
      renderKeyboard();
      renderLifelines();
    }
  }

  function setPlayStatus(message) {
    els.status.textContent = message;
    els.status.classList.remove("is-shaking");
    void els.status.offsetWidth;
    els.status.classList.add("is-shaking");
    playAudio("invalid");
  }

  function renderProgress() {
    const snapshot = state.snapshot;
    const isVs = snapshot.room.mode === "vs";
    const isCoop = snapshot.room.mode === "coop";
    const sorted = [...snapshot.players].sort((a, b) => isVs
      ? (Number(b.score) - Number(a.score) || a.seat - b.seat)
      : (b.currentWordIndex - a.currentWordIndex || a.seat - b.seat));
    els.progress.innerHTML = "";
    els.progress.classList.toggle("is-race", snapshot.room.mode === "race");
    if (snapshot.room.mode === "race") {
      const course = document.createElement("div");
      course.className = "race-course";
      const courseHeight = Math.max(82, sorted.length * 10 + 46);
      course.style.minHeight = `${courseHeight}px`;
      course.innerHTML = '<span class="race-course-rail" aria-hidden="true"></span><span class="race-course-finish" aria-label="Finish line"></span>';
      sorted.forEach((player, lane) => {
        const completed = Math.min(player.currentWordIndex, snapshot.room.wordCount);
        const progress = snapshot.room.wordCount ? (completed / snapshot.room.wordCount) * 100 : 0;
        const token = document.createElement("span");
        token.className = "race-token";
        token.style.left = `${Math.max(6, Math.min(91, 6 + progress * .85))}%`;
        token.style.top = `${courseHeight / 2 - 17 + (lane - (sorted.length - 1) / 2) * 9}px`;
        token.title = `${player.name}: ${completed} of ${snapshot.room.wordCount}`;
        const art = document.createElement("span");
        decorateAvatar(art, player);
        token.append(art, Object.assign(document.createElement("small"), { textContent: player.name }));
        course.appendChild(token);
      });
      els.progress.appendChild(course);
    }
    sorted.forEach((player, rank) => {
      const card = document.createElement("article");
      card.className = `player-progress${player.id === snapshot.me.id ? " is-self" : ""}`;
      card.style.setProperty("--accent", player.accentHex);
      const avatar = document.createElement("span");
      decorateAvatar(avatar, player);
      avatar.setAttribute("aria-hidden", "true");
      const copy = document.createElement("div");
      copy.className = "player-progress-copy";
      const completedWords = Math.min(isCoop ? snapshot.room.currentRound : player.currentWordIndex, snapshot.room.wordCount);
      const label = !isVs
        ? `${completedWords} / ${snapshot.room.wordCount} words`
        : `${Number(player.score) || 0} ${Number(player.score) === 1 ? "point" : "points"} · ${player.attempts.length} / ${Core.MAX_GUESSES + (player.id === snapshot.me.id && snapshot.me.lifelines?.extraAttempt ? 1 : 0)} attempts`;
      copy.innerHTML = `<strong>${escapeHtml(player.name)}${player.id === snapshot.me.id ? " · You" : ""}</strong><small>${label}</small>`;
      if (isVs || isCoop) {
        if (isVs && !snapshot.room.endless) {
          const track = document.createElement("span");
          track.className = "series-track";
          track.innerHTML = `<i style="--progress:${Math.min(100, ((Number(player.score) || 0) / snapshot.room.wordCount) * 100)}%"></i>`;
          copy.appendChild(track);
        }
        const patterns = document.createElement("span");
        patterns.className = "attempt-patterns";
        player.attempts.forEach(score => {
          const line = document.createElement("span");
          score.forEach(status => { const pip = document.createElement("i"); pip.className = status; line.appendChild(pip); });
          patterns.appendChild(line);
        });
        copy.appendChild(patterns);
      }
      const place = document.createElement("span");
      place.className = "player-rank";
      place.textContent = isVs ? `${Number(player.score) || 0}pt` : isCoop ? "◆" : player.finished ? "✓" : `#${rank + 1}`;
      card.append(avatar, copy, place);
      els.progress.appendChild(card);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  async function startMatch() {
    if (state.busy) return;
    state.busy = true;
    els.start.disabled = true;
    try {
      const result = await api("start", { roomCode: state.roomCode, resumeToken: state.token, actionId: crypto.randomUUID() });
      state.snapshot = result.snapshot;
      renderSnapshot();
      playAudio("start");
    } catch (error) { setPlayStatus(friendlyError(error)); }
    finally {
      state.busy = false;
      els.start.disabled = false;
      renderKeyboard();
      renderLifelines();
    }
  }

  document.querySelectorAll("[data-open-online]").forEach(button => button.addEventListener("click", () => openLobby(button.dataset.openOnline)));
  els.create.addEventListener("click", createRoom);
  els.join.addEventListener("click", joinRoom);
  els.joinCode.addEventListener("input", () => { els.joinCode.value = els.joinCode.value.replace(/[^a-z0-9]/gi, "").toUpperCase(); });
  els.start.addEventListener("click", startMatch);
  els.leave.addEventListener("click", requestLeave);
  els.leaveCancel.addEventListener("click", () => { els.leaveDialog.close(); window.SixthSenseNavigation?.onlineLeaveCancelled(); });
  els.leaveConfirm.addEventListener("click", () => { els.leaveDialog.close(); leaveRoom(); });
  els.leaveDialog.addEventListener("cancel", () => window.SixthSenseNavigation?.onlineLeaveCancelled());
  els.resultOk.addEventListener("click", () => { els.resultDialog.close(); leaveRoom(); });
  els.lifelines.forEach(item => item.querySelector("button").addEventListener("click", () => useLifeline(item)));
  document.addEventListener("sixth-sense-economy-change", renderLifelines);
  document.addEventListener("sixth-sense-online-last-chance", event => resolveOnlineLastChance(event.detail?.decision === "purchase"));
  document.addEventListener("sixth-sense-identity-change", async event => {
    if (!state.snapshot || !state.roomCode || !state.token) {
      if (els.lobby.open) decorateAvatar(els.preview, identity());
      return;
    }
    try {
      const result = await api("identity", { roomCode: state.roomCode, resumeToken: state.token, player: event.detail || identity() });
      state.snapshot = result.snapshot;
      renderSnapshot();
    } catch (error) {
      els.status.textContent = friendlyError(error);
    }
  });
  document.addEventListener("sixth-sense-request-online-leave", requestLeave);
  document.addEventListener("keydown", event => {
    if (els.screen.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Enter") handleKey("ENTER");
    else if (event.key === "Backspace" || event.key === "Delete") handleKey("BACK");
    else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
  });
  window.addEventListener("online", () => { if (!els.screen.hidden) schedulePoll(0); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !els.screen.hidden) schedulePoll(0); });
  els.skipOk.addEventListener("click", confirmOnlineSkip);
  els.skipDialog.addEventListener("cancel", event => event.preventDefault());
  restoreActiveRoom();
})();
