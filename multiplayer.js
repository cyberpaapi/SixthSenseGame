(function () {
  "use strict";

  const Core = window.SixthSenseCore;
  const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", ["ENTER", ..."ZXCVBNM", "BACK"]];
  const MARKERS = { exact: "●", present: "◆", absent: "×" };
  const PRIORITY = { absent: 1, present: 2, exact: 3 };
  const DIFFICULTY_LABELS = Object.freeze({ easy: "Normal", medium: "Hard", extreme: "Extreme" });
  const API_BASE = document.documentElement.dataset.multiplayerApi || "";
  const POLL_MS = 900;
  const SETTINGS_KEY = "sixth-sense.settings.v1";
  const IDENTITY_KEY = "sixth-sense.online.identity.v1";
  const LENGTH_OPTIONS = Object.freeze({
    race: [{ value: "3", label: "Sprint", detail: "3" }, { value: "5", label: "Normal", detail: "5" }, { value: "10", label: "Marathon", detail: "10" }],
    vs: [{ value: "3", label: "Quick", detail: "3" }, { value: "5", label: "Classic", detail: "5" }, { value: "9", label: "Epic", detail: "9" }, { value: "endless", label: "Endless", detail: "∞" }]
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
    leave: document.querySelector("#online-leave")
  };

  const state = {
    requestedMode: "race",
    roomCode: "",
    token: "",
    playerId: "",
    snapshot: null,
    current: "",
    activeRound: null,
    pollTimer: null,
    transitionTimer: null,
    busy: false
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
    const settings = readJson(SETTINGS_KEY, { avatar: "fox", accent: "coral" });
    const saved = readJson(IDENTITY_KEY, { name: "" });
    return { name: (els.name.value || saved.name || "Player").trim().slice(0, 18), avatar: settings.avatar || "fox", accent: settings.accent || "coral" };
  }

  function setLobbyMessage(message, error = false) {
    els.message.textContent = message;
    els.message.dataset.error = String(error);
  }

  function openLobby(mode) {
    state.requestedMode = mode === "vs" ? "vs" : "race";
    const label = state.requestedMode === "vs" ? "One-on-one VS" : "Multiplayer Race";
    els.lobbyKicker.textContent = label;
    els.distance.hidden = false;
    renderLengthOptions();
    els.create.textContent = state.requestedMode === "vs" ? "Create VS room" : "Create private race";
    const savedIdentity = readJson(IDENTITY_KEY, { name: "" });
    els.name.value = savedIdentity.name || "";
    const player = identity();
    els.preview.className = `avatar-art avatar-${player.avatar}`;
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
  }

  function enterRoom(result) {
    state.roomCode = result.roomCode;
    state.token = result.resumeToken;
    state.playerId = result.playerId;
    state.current = "";
    state.activeRound = result.snapshot.room.mode === "vs" ? Number(result.snapshot.room.currentRound) || 0 : result.snapshot.me.currentWordIndex;
    state.snapshot = result.snapshot;
    sessionStorage.setItem(`sixth-sense.room.${state.roomCode}`, JSON.stringify({ token: state.token, playerId: state.playerId }));
    if (els.lobby.open) els.lobby.close();
    els.home.hidden = true;
    els.solo.hidden = true;
    els.screen.hidden = false;
    document.body.dataset.screen = "online";
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderSnapshot();
    playAudio("success");
    schedulePoll(100);
  }

  function leaveRoom() {
    clearTimeout(state.pollTimer);
    state.pollTimer = null;
    state.snapshot = null;
    state.current = "";
    clearTimeout(state.transitionTimer);
    els.roundTransition.hidden = true;
    els.screen.hidden = true;
    els.home.hidden = false;
    els.solo.hidden = true;
    document.body.dataset.screen = "home";
    window.scrollTo({ top: 0, behavior: "smooth" });
    playAudio("open");
  }

  function schedulePoll(delay = POLL_MS) {
    clearTimeout(state.pollTimer);
    state.pollTimer = setTimeout(poll, delay);
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

  function renderSnapshot() {
    const snapshot = state.snapshot;
    if (!snapshot) return;
    const room = snapshot.room;
    const nextRound = room.mode === "vs" ? Number(room.currentRound) || 0 : snapshot.me.currentWordIndex;
    const roundAdvanced = room.mode === "vs" && state.activeRound !== null && nextRound > state.activeRound;
    if (nextRound !== state.activeRound) state.current = "";
    state.activeRound = nextRound;
    els.kicker.textContent = room.mode === "vs" ? "One-on-one VS" : "Multiplayer Race";
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
    else els.status.textContent = `${room.endless ? `Round ${nextRound + 1} · Endless` : `Round ${Math.min(room.wordCount, nextRound + 1)} of ${room.wordCount}`} · First solve wins the point.`;
    els.start.hidden = !(room.status === "waiting" && snapshot.me.isHost && snapshot.players.length >= 2);
    renderBoard();
    renderKeyboard();
    renderProgress();
    if (roundAdvanced) showRoundTransition();
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
    els.roundKicker.textContent = winner ? `${winner.name} wins the point` : "Round complete";
    els.roundTitle.textContent = snapshot.room.status === "finished" ? "Match complete" : "New word";
    els.roundScore.textContent = players.map(player => `${player.name} ${player.score || 0}`).join(" · ");
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
    els.board.innerHTML = "";
    for (let rowIndex = 0; rowIndex < Core.MAX_GUESSES; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "board-row";
      row.setAttribute("role", "row");
      const prior = attempts[rowIndex];
      const letters = prior ? prior.guess : rowIndex === attempts.length ? state.current : "";
      for (let column = 0; column < Core.WORD_LENGTH; column += 1) {
        const tile = document.createElement("div");
        const letter = letters[column] || "";
        const status = prior?.score[column];
        tile.className = `tile${status ? ` ${status}` : ""}`;
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", status ? `${letter.toUpperCase()}, ${status}` : letter ? letter.toUpperCase() : "empty");
        tile.textContent = letter;
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
    const canPlay = state.snapshot?.room.status === "running" && !state.snapshot.me.finished && currentAttempts().length < Core.MAX_GUESSES && !state.busy;
    els.keyboard.innerHTML = "";
    KEY_ROWS.forEach(keys => {
      const row = document.createElement("div");
      row.className = "keyboard-row";
      [...keys].forEach(key => {
        const button = document.createElement("button");
        const letter = key.length === 1 ? key.toLowerCase() : key;
        const status = states[letter];
        button.type = "button";
        button.disabled = !canPlay;
        button.className = `key${key.length > 1 ? " wide" : ""}${status ? ` ${status}` : ""}`;
        button.dataset.onlineKey = key;
        button.setAttribute("aria-label", key === "BACK" ? "Delete letter" : key === "ENTER" ? "Submit guess" : `Letter ${key}${status ? `, ${status}` : ""}`);
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
    else if (/^[A-Z]$/.test(key) && state.current.length < Core.WORD_LENGTH) {
      state.current += key.toLowerCase();
      playAudio("letter", { semitone: (key.charCodeAt(0) - 65) % 7 });
    }
    else return;
    renderBoard();
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
    finally { state.busy = false; renderKeyboard(); }
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
    const sorted = [...snapshot.players].sort((a, b) => isVs
      ? (Number(b.score) - Number(a.score) || a.seat - b.seat)
      : (b.currentWordIndex - a.currentWordIndex || a.seat - b.seat));
    els.progress.innerHTML = "";
    sorted.forEach((player, rank) => {
      const card = document.createElement("article");
      card.className = `player-progress${player.id === snapshot.me.id ? " is-self" : ""}`;
      card.style.setProperty("--accent", player.accentHex);
      const avatar = document.createElement("span");
      avatar.className = `avatar-art avatar-${player.avatar}`;
      avatar.setAttribute("aria-hidden", "true");
      const copy = document.createElement("div");
      copy.className = "player-progress-copy";
      const completedWords = Math.min(player.currentWordIndex, snapshot.room.wordCount);
      const label = !isVs
        ? `${completedWords} / ${snapshot.room.wordCount} words`
        : `${Number(player.score) || 0} ${Number(player.score) === 1 ? "point" : "points"} · ${player.attempts.length} / ${Core.MAX_GUESSES} attempts`;
      copy.innerHTML = `<strong>${escapeHtml(player.name)}${player.id === snapshot.me.id ? " · You" : ""}</strong><small>${label}</small>`;
      if (!isVs) {
        const track = document.createElement("span");
        track.className = "race-track";
        track.innerHTML = `<i style="--progress:${Math.min(100, (completedWords / snapshot.room.wordCount) * 100)}%"></i>`;
        copy.appendChild(track);
      } else {
        if (!snapshot.room.endless) {
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
      place.textContent = isVs ? `${Number(player.score) || 0}pt` : player.finished ? "✓" : `#${rank + 1}`;
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
    finally { state.busy = false; els.start.disabled = false; }
  }

  document.querySelectorAll("[data-open-online]").forEach(button => button.addEventListener("click", () => openLobby(button.dataset.openOnline)));
  els.create.addEventListener("click", createRoom);
  els.join.addEventListener("click", joinRoom);
  els.joinCode.addEventListener("input", () => { els.joinCode.value = els.joinCode.value.replace(/[^a-z0-9]/gi, "").toUpperCase(); });
  els.start.addEventListener("click", startMatch);
  els.leave.addEventListener("click", leaveRoom);
  document.querySelector(".brand").addEventListener("click", () => { if (!els.screen.hidden) leaveRoom(); });
  document.addEventListener("keydown", event => {
    if (els.screen.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Enter") handleKey("ENTER");
    else if (event.key === "Backspace" || event.key === "Delete") handleKey("BACK");
    else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
  });
})();
