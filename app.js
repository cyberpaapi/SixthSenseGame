(function () {
  "use strict";

  const Core = window.SixthSenseCore;
  const STORAGE = {
    daily: "sixth-sense.daily.v1",
    practice: "sixth-sense.practice.v1",
    sprint: "sixth-sense.sprint.v1",
    insight: "sixth-sense.insight.v1",
    streak: "sixth-sense.streak-mode.v1",
    stats: "sixth-sense.stats.v1",
    settings: "sixth-sense.settings.v1",
    visited: "sixth-sense.visited.v1"
  };
  const MARKERS = { exact: "●", present: "◆", absent: "×" };
  const PRIORITY = { absent: 1, present: 2, exact: 3 };
  const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", ["ENTER", ..."ZXCVBNM", "BACK"]];
  const MODE_CONFIG = Object.freeze({
    daily: { label: "Daily Puzzle", ready: "Daily puzzle ready." },
    practice: { label: "Practice Puzzle", ready: "Practice puzzle ready." },
    sprint: { label: "Sprint Puzzle", ready: "Sprint started — 90 seconds." },
    insight: { label: "Insight Puzzle", ready: "Insight ready — clue and reveal unlocked." },
    streak: { label: "Streak Puzzle", ready: "Streak puzzle ready." }
  });
  const defaultSettings = { hard: false, contrast: false, dark: false, sound: true, logo: 1 };
  const defaultInventory = { sense: 0, peek: 0, clear: 0, skip: 0 };

  const els = {
    board: document.querySelector("#game-board"),
    keyboard: document.querySelector("#keyboard"),
    toast: document.querySelector("#toast"),
    clueButton: document.querySelector("#clue-button"),
    peekButton: document.querySelector("#peek-button"),
    clearButton: document.querySelector("#clear-button"),
    skipButton: document.querySelector("#skip-puzzle-button"),
    clueCopy: document.querySelector("#clue-copy"),
    gameModeLabel: document.querySelector("#game-mode-label"),
    modeDetail: document.querySelector("#mode-detail"),
    coinWallet: document.querySelector("#coin-wallet"),
    coinCount: document.querySelector("#coin-count"),
    statCoins: document.querySelector("#stat-coins"),
    streakProgressCount: document.querySelector("#streak-progress-count"),
    streakProgressMessage: document.querySelector("#streak-progress-message"),
    streakProgressFill: document.querySelector("#streak-progress-fill"),
    streakTrack: document.querySelector("#streak-track"),
    modeButtons: [...document.querySelectorAll(".mode-button")],
    homeScreen: document.querySelector("#home-screen"),
    gameScreen: document.querySelector("#game-screen"),
    brand: document.querySelector(".brand"),
    startButtons: [...document.querySelectorAll("[data-start-mode]")],
    skipDialog: document.querySelector("#skip-modal"),
    skipCopy: document.querySelector("#skip-copy"),
    confirmSkipButton: document.querySelector("#confirm-skip-button"),
    cancelSkipButton: document.querySelector("#cancel-skip-button"),
    shareButton: document.querySelector("#share-button"),
    newPracticeButton: document.querySelector("#new-practice-button"),
    nextPuzzleWrap: document.querySelector("#next-puzzle-wrap"),
    countdown: document.querySelector("#countdown"),
    celebration: document.querySelector("#celebration"),
    logoChoices: [...document.querySelectorAll("[data-logo-option]")],
    favicon: document.querySelector("#app-favicon"),
    settings: {
      hard: document.querySelector("#hard-mode"),
      contrast: document.querySelector("#contrast-mode"),
      dark: document.querySelector("#dark-mode"),
      sound: document.querySelector("#sound-mode")
    }
  };

  let mode = "daily";
  let game = null;
  let settings = loadJson(STORAGE.settings, defaultSettings);
  settings.logo = Math.min(9, Math.max(1, Math.floor(Number(settings.logo) || 1)));
  let stats = loadJson(STORAGE.stats, {
    played: 0, wins: 0, currentStreak: 0, maxStreak: 0,
    lastWinDate: null, distribution: Array(Core.MAX_GUESSES).fill(0), coins: Core.STARTING_COINS,
    streakRun: 0, bestModeStreak: 0
  });
  stats.coins = Number.isFinite(Number(stats.coins)) ? Math.max(0, Math.floor(Number(stats.coins))) : Core.STARTING_COINS;
  stats.distribution = Array.from({ length: Core.MAX_GUESSES }, (_, index) => Number(stats.distribution?.[index]) || 0);
  stats.inventory = Object.fromEntries(Object.keys(defaultInventory).map(kind => {
    const count = Number(stats.inventory?.[kind]);
    return [kind, Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0];
  }));
  let inputLocked = false;
  let toastTimer = null;
  let audioContext = null;

  function loadJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" ? { ...fallback, ...value } : { ...fallback };
    } catch (_) {
      return { ...fallback };
    }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Private browsing can deny storage. */ }
  }

  function emptyGame(answer, gameMode) {
    const nextGame = {
      version: 2,
      mode: gameMode,
      date: Core.dateKey(),
      puzzleNumber: Core.dayNumber(),
      answer: answer.word,
      clue: answer.clue,
      clueUsed: false,
      peekUsed: false,
      peekUses: 0,
      peekedPositions: [],
      clearUsed: false,
      clearUses: 0,
      eliminatedLetters: [],
      skipped: false,
      guesses: [],
      current: "",
      status: "playing",
      recorded: false,
      rewarded: false,
      modeRecorded: false,
      deadline: gameMode === "sprint" ? Date.now() + 90000 : null
    };
    if (gameMode === "insight") {
      const seed = [...answer.word].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
      nextGame.clueUsed = true;
      nextGame.peekedPositions = [seed % Core.WORD_LENGTH];
    }
    return nextGame;
  }

  function loadDailyGame() {
    const answer = Core.dailyAnswer();
    const saved = loadJson(STORAGE.daily, {});
    if (saved.date === Core.dateKey() && saved.answer === answer.word && Array.isArray(saved.guesses)) {
      return { ...emptyGame(answer, "daily"), ...saved, current: "" };
    }
    return emptyGame(answer, "daily");
  }

  function loadModeGame(gameMode, forceNew) {
    const saved = loadJson(STORAGE[gameMode], {});
    if (!forceNew && saved.mode === gameMode && saved.answer && saved.clue && Array.isArray(saved.guesses) && saved.status === "playing") {
      return { ...emptyGame({ word: saved.answer, clue: saved.clue }, gameMode), ...saved, current: "" };
    }
    return emptyGame(Core.practiceAnswer(Core.dailyAnswer().word), gameMode);
  }

  function saveGame() {
    saveJson(STORAGE[mode], game);
  }

  function showScreen(screen) {
    const gameVisible = screen === "game";
    els.homeScreen.hidden = gameVisible;
    els.gameScreen.hidden = !gameVisible;
    document.body.dataset.screen = screen;
    const skipLink = document.querySelector(".skip-link");
    skipLink.href = gameVisible ? "#game-board" : "#home-title";
    const destination = gameVisible ? els.gameScreen : els.homeScreen;
    destination.classList.remove("is-entering");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(() => destination.classList.add("is-entering"));
    }
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function setMode(nextMode, forceNew = false) {
    if (inputLocked) return;
    mode = MODE_CONFIG[nextMode] ? nextMode : "daily";
    game = mode === "daily" ? loadDailyGame() : loadModeGame(mode, forceNew);
    els.modeButtons.forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderAll();
    announce(MODE_CONFIG[mode].ready);
  }

  function renderAll() {
    renderBoard();
    renderKeyboard();
    renderLifelines();
    renderEconomy();
    renderStats();
    updateResultControls();
  }

  function renderBoard() {
    els.board.innerHTML = "";
    for (let rowIndex = 0; rowIndex < Core.MAX_GUESSES; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "board-row";
      row.setAttribute("role", "row");
      row.dataset.row = rowIndex;
      const prior = game.guesses[rowIndex];
      const letters = prior ? prior.guess : (rowIndex === game.guesses.length ? game.current : "");
      for (let col = 0; col < Core.WORD_LENGTH; col += 1) {
        const tile = document.createElement("div");
        const letter = letters[col] || "";
        const status = prior ? prior.score[col] : null;
        const peeked = !prior && rowIndex === game.guesses.length && !letter && game.peekedPositions.includes(col);
        tile.className = `tile${status ? ` ${status}` : ""}${peeked ? " peeked" : ""}`;
        tile.dataset.letter = letter;
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", status ? `${letter.toUpperCase()}, ${status}` : peeked ? `${game.answer[col].toUpperCase()}, revealed for position ${col + 1}` : (letter ? letter.toUpperCase() : "empty"));
        tile.textContent = peeked ? game.answer[col] : letter;
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
    game.eliminatedLetters.forEach(letter => { states[letter] = "absent"; });
    game.guesses.forEach(entry => entry.guess.split("").forEach((letter, index) => {
      const next = entry.score[index];
      if (!states[letter] || PRIORITY[next] > PRIORITY[states[letter]]) states[letter] = next;
    }));
    return states;
  }

  function renderKeyboard() {
    const states = keyStates();
    els.keyboard.innerHTML = "";
    KEY_ROWS.forEach(keys => {
      const row = document.createElement("div");
      row.className = "keyboard-row";
      [...keys].forEach(rawKey => {
        const key = typeof rawKey === "string" ? rawKey : rawKey;
        const button = document.createElement("button");
        const letter = key.length === 1 ? key.toLowerCase() : key;
        const status = states[letter];
        button.type = "button";
        button.className = `key${key.length > 1 ? " wide" : ""}${status ? ` ${status}` : ""}`;
        button.dataset.key = key;
        const statusLabel = status ? { exact: "correct position", present: "in the word", absent: "not in the word" }[status] : "untested";
        button.setAttribute("aria-label", key === "BACK" ? "Delete letter" : key === "ENTER" ? "Submit guess" : `Letter ${key}, ${statusLabel}`);
        if (key === "BACK") button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM11 9l6 6M17 9l-6 6"></path></svg>';
        else button.textContent = key;
        if (status) {
          const marker = document.createElement("small");
          marker.className = "key-marker";
          marker.textContent = MARKERS[status];
          marker.setAttribute("aria-hidden", "true");
          button.appendChild(marker);
        }
        button.addEventListener("click", () => handleKey(key));
        row.appendChild(button);
      });
      els.keyboard.appendChild(row);
    });
  }

  function remainingPeekPositions() {
    const exactPositions = new Set();
    game.guesses.forEach(entry => entry.score.forEach((status, index) => { if (status === "exact") exactPositions.add(index); }));
    return Array.from({ length: Core.WORD_LENGTH }, (_, index) => index)
      .filter(index => !exactPositions.has(index) && !game.peekedPositions.includes(index));
  }

  function remainingClearLetters() {
    const answerLetters = new Set(game.answer);
    const alreadyTested = new Set(game.guesses.flatMap(entry => entry.guess.split("")));
    const alreadyCleared = new Set(game.eliminatedLetters);
    return "abcdefghijklmnopqrstuvwxyz".split("")
      .filter(letter => !answerLetters.has(letter) && !alreadyTested.has(letter) && !alreadyCleared.has(letter));
  }

  function replayAnimation(element, className) {
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    element.addEventListener("animationend", () => element.classList.remove(className), { once: true });
  }

  function animateLifeline(kind, className) {
    replayAnimation(document.querySelector(`[data-lifeline="${kind}"]`), className);
  }

  function renderLifelines() {
    const playing = game.status === "playing";
    const buttons = { sense: els.clueButton, peek: els.peekButton, clear: els.clearButton, skip: els.skipButton };
    const names = { sense: "Sense", peek: "Peek", clear: "Clear", skip: "Skip" };
    const effectAvailable = { sense: true, peek: remainingPeekPositions().length > 0, clear: remainingClearLetters().length > 0, skip: true };
    Object.entries(buttons).forEach(([kind, button]) => {
      const item = button.closest(".lifeline-item");
      const stockBadge = button.querySelector(".lifeline-stock");
      const price = item.querySelector(".lifeline-price");
      const stored = stats.inventory[kind];
      const available = kind === "sense" && game.clueUsed ? Math.max(1, stored) : stored;
      const showStock = (stored > 0) || (playing && kind === "sense" && game.clueUsed);
      const showPrice = playing && effectAvailable[kind] && stored === 0 && !(kind === "sense" && game.clueUsed);
      button.disabled = !playing || !effectAvailable[kind];
      item.classList.toggle("is-stocked", showStock);
      item.classList.toggle("is-depleted", playing && !effectAvailable[kind]);
      stockBadge.hidden = !showStock;
      stockBadge.querySelector("b").textContent = available;
      price.hidden = !showPrice;
      if (game.clueUsed && kind === "sense") {
        button.setAttribute("aria-label", "Sense: show the clue again, unlocked for this puzzle");
        button.title = "Sense — show clue again";
      } else if (!effectAvailable[kind]) {
        const message = kind === "peek" ? "all useful positions revealed" : "no more impossible letters to remove";
        button.setAttribute("aria-label", `${names[kind]}: ${message}`);
        button.title = `${names[kind]} — ${message}`;
      } else if (stored > 0) {
        button.setAttribute("aria-label", `${names[kind]}: use one, ${stored} available`);
        button.title = `${names[kind]} — ${stored} available`;
      } else {
        button.setAttribute("aria-label", `${names[kind]}: buy for ${Core.LIFELINE_COSTS[kind]} coins`);
        button.title = `${names[kind]} — buy for ${Core.LIFELINE_COSTS[kind]} coins`;
      }
    });
    const notes = [];
    if (game.clueUsed) notes.push(`Sense: ${game.clue}`);
    if (game.peekedPositions.length) notes.push(`Peek: ${game.peekedPositions.map(position => `position ${position + 1} is ${game.answer[position].toUpperCase()}`).join("; ")}.`);
    if (game.eliminatedLetters.length) notes.push(`Cleared: ${game.eliminatedLetters.map(letter => letter.toUpperCase()).join(", ")}.`);
    els.clueCopy.textContent = notes.length ? notes.join(" ") : "Sense unlocks once. Peek, Clear, and Skip can be bought and used repeatedly.";
  }

  function renderEconomy() {
    updateModeStatus();
    els.coinCount.textContent = stats.coins;
    els.coinWallet.setAttribute("aria-label", `${stats.coins} coin${stats.coins === 1 ? "" : "s"}`);
    els.statCoins.textContent = stats.coins;
  }

  function updateModeStatus() {
    if (!game) return;
    els.gameModeLabel.textContent = MODE_CONFIG[mode].label;
    let detail = "";
    if (mode === "sprint") {
      const remaining = Math.max(0, Math.ceil((Number(game.deadline) - Date.now()) / 1000));
      detail = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
      if (remaining === 0 && game.status === "playing" && !els.gameScreen.hidden && !inputLocked) {
        game.status = "lost";
        game.current = "";
        saveGame();
        renderAll();
        completeGame(false);
        return;
      }
    } else if (mode === "insight") detail = "Clue + reveal";
    else if (mode === "streak") detail = `${stats.streakRun} win run`;
    els.modeDetail.hidden = !detail;
    els.modeDetail.textContent = detail;
  }

  function spendCoins(kind, label) {
    const cost = Core.LIFELINE_COSTS[kind];
    if (stats.coins < cost) {
      announce(`${label} needs ${cost} coins. You have ${stats.coins}.`);
      animateLifeline(kind, "is-unavailable");
      replayAnimation(els.coinWallet, "is-denied");
      return false;
    }
    stats.coins -= cost;
    saveJson(STORAGE.stats, stats);
    renderEconomy();
    replayAnimation(els.coinWallet, "is-spending");
    return true;
  }

  function buyLifeline(kind, label) {
    if (stats.inventory[kind] > 0) return true;
    if (!spendCoins(kind, label)) return false;
    stats.inventory[kind] += 1;
    saveJson(STORAGE.stats, stats);
    renderLifelines();
    renderEconomy();
    animateLifeline(kind, "is-purchased");
    announce(`${label} added — tap again to use it.`);
    playTone(570, .1, .025);
    return false;
  }

  function consumeLifeline(kind) {
    if (stats.inventory[kind] < 1) return false;
    stats.inventory[kind] -= 1;
    saveJson(STORAGE.stats, stats);
    renderEconomy();
    return true;
  }

  function handleKey(key) {
    if (els.gameScreen.hidden || inputLocked || game.status !== "playing" || document.querySelector("dialog[open]")) return;
    if (key === "ENTER") return submitGuess();
    if (key === "BACK") game.current = game.current.slice(0, -1);
    else if (/^[A-Z]$/.test(key) && game.current.length < Core.WORD_LENGTH) {
      game.current += key.toLowerCase();
      playTone(260 + (key.charCodeAt(0) - 65) * 7, .035, .025);
    } else return;
    saveGame();
    renderBoard();
    const lastTile = els.board.querySelector(`[data-row="${game.guesses.length}"] .tile[data-letter]:not([data-letter=""])`);
    if (lastTile && key !== "BACK") {
      lastTile.classList.add("is-pop");
      lastTile.addEventListener("animationend", () => lastTile.classList.remove("is-pop"), { once: true });
    }
  }

  function submitGuess() {
    const guess = game.current;
    if (guess.length !== Core.WORD_LENGTH) return invalid("Six letters make the signal.");
    if (!Core.isValidWord(guess)) return invalid("That word isn’t in the common-word list.");
    if (settings.hard) {
      const issue = Core.validateHardMode(guess, game.guesses);
      if (issue) return invalid(issue);
    }
    const score = Core.scoreGuess(guess, game.answer);
    game.guesses.push({ guess, score });
    game.current = "";
    const won = guess === game.answer;
    if (won) game.status = "won";
    else if (game.guesses.length >= Core.MAX_GUESSES) game.status = "lost";
    saveGame();
    revealLatestRow(won);
  }

  function revealLatestRow(won) {
    inputLocked = true;
    renderBoard();
    const row = els.board.querySelector(`[data-row="${game.guesses.length - 1}"]`);
    const tiles = [...row.children];
    tiles.forEach((tile, index) => setTimeout(() => {
      tile.classList.add("is-reveal");
      playTone(tile.classList.contains("exact") ? 520 : tile.classList.contains("present") ? 390 : 245, .055, .03);
    }, index * 105));
    setTimeout(() => {
      inputLocked = false;
      renderKeyboard();
      if (game.status === "playing") {
        return;
      }
      completeGame(won);
    }, tiles.length * 105 + 380);
  }

  function completeGame(won) {
    let reward = 0;
    if (won && !game.rewarded) {
      reward = Core.rewardForAttempts(game.guesses.length);
      stats.coins += reward;
      game.rewarded = true;
    }
    if (mode === "daily" && !game.recorded) {
      stats.played += 1;
      if (won) {
        stats.wins += 1;
        stats.distribution[game.guesses.length - 1] += 1;
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        stats.currentStreak = stats.lastWinDate === Core.dateKey(yesterday) ? stats.currentStreak + 1 : 1;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.lastWinDate = Core.dateKey();
      } else {
        stats.currentStreak = 0;
      }
      game.recorded = true;
    }
    if (mode === "streak" && !game.modeRecorded) {
      stats.streakRun = won ? stats.streakRun + 1 : 0;
      stats.bestModeStreak = Math.max(stats.bestModeStreak, stats.streakRun);
      game.modeRecorded = true;
    }
    saveJson(STORAGE.stats, stats);
    saveGame();
    renderLifelines();
    if (won) {
      announce(reward ? `Solved in ${game.guesses.length} — +${reward} coins!` : "Beautiful intuition.");
      celebrate();
      playWinSound();
    } else announce(`The word was ${game.answer.toUpperCase()}.`);
    renderStats();
    updateResultControls();
    setTimeout(() => document.querySelector("#stats-modal").showModal(), 800);
  }

  function invalid(message) {
    announce(message);
    const row = els.board.querySelector(`[data-row="${game.guesses.length}"]`);
    row.classList.remove("is-shaking");
    void row.offsetWidth;
    row.classList.add("is-shaking");
    playTone(150, .11, .035);
  }

  function announce(message, options = {}) {
    const duration = Number(options.duration) || 2600;
    const isHint = Boolean(options.hint);
    clearTimeout(toastTimer);
    els.toast.classList.remove("is-hint");
    if (isHint) {
      void els.toast.offsetWidth;
      els.toast.classList.add("is-hint");
    }
    els.toast.hidden = false;
    els.toast.textContent = message;
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
      els.toast.classList.remove("is-hint");
    }, duration);
  }

  function revealClue() {
    if (game.status !== "playing") return;
    if (!game.clueUsed) {
      if (!buyLifeline("sense", "Sense")) return;
      if (!consumeLifeline("sense")) return;
      game.clueUsed = true;
      saveGame();
    }
    renderLifelines();
    animateLifeline("sense", "is-used-now");
    announce(game.clue, { hint: true, duration: 5000 });
    playTone(620, .12, .03);
  }

  function revealPosition() {
    if (game.status !== "playing") return;
    const candidates = remainingPeekPositions();
    if (!candidates.length) {
      announce("Every useful position is already revealed.");
      animateLifeline("peek", "is-unavailable");
      return;
    }
    if (!buyLifeline("peek", "Peek")) return;
    if (!consumeLifeline("peek")) return;
    const seed = [...game.answer].reduce((sum, letter) => sum + letter.charCodeAt(0), game.guesses.length + game.peekedPositions.length * 17);
    const position = candidates[seed % candidates.length];
    game.peekUses = (Number(game.peekUses) || 0) + 1;
    game.peekedPositions = [...game.peekedPositions, position];
    saveGame();
    renderBoard();
    renderLifelines();
    replayAnimation(els.board.querySelector(`[data-row="${game.guesses.length}"] .tile:nth-child(${position + 1})`), "is-peek-reveal");
    animateLifeline("peek", "is-used-now");
    announce(`Position ${position + 1} is ${game.answer[position].toUpperCase()}.`);
    playTone(710, .15, .03);
  }

  function clearLetters() {
    if (game.status !== "playing") return;
    const candidates = remainingClearLetters();
    if (!candidates.length) {
      announce("There are no more impossible letters to remove.");
      animateLifeline("clear", "is-unavailable");
      return;
    }
    if (!buyLifeline("clear", "Clear")) return;
    if (!consumeLifeline("clear")) return;
    const seed = [...game.answer].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % candidates.length;
    const removed = [];
    for (let offset = 0; removed.length < Math.min(3, candidates.length); offset += 1) {
      const letter = candidates[(seed + offset) % candidates.length];
      if (!removed.includes(letter)) removed.push(letter);
    }
    game.clearUses = (Number(game.clearUses) || 0) + 1;
    game.eliminatedLetters = [...game.eliminatedLetters, ...removed];
    saveGame();
    renderKeyboard();
    renderLifelines();
    removed.forEach(letter => replayAnimation(els.keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`), "is-cleared-now"));
    animateLifeline("clear", "is-used-now");
    announce(`Removed ${removed.map(letter => letter.toUpperCase()).join(", ")}.`);
    playTone(330, .13, .03);
  }

  function openSkipConfirmation() {
    if (game.status !== "playing") return;
    if (!buyLifeline("skip", "Skip")) return;
    els.skipCopy.textContent = mode === "daily" ? "Use one Skip? Today’s answer will be revealed and it counts as a loss." : mode === "streak" ? "Use one Skip? This puzzle ends and your Streak run resets." : `Use one Skip? A fresh ${MODE_CONFIG[mode].label.toLowerCase()} will begin.`;
    els.skipDialog.showModal();
  }

  function performSkip() {
    if (!consumeLifeline("skip")) {
      closeDialog(els.skipDialog);
      return;
    }
    animateLifeline("skip", "is-used-now");
    closeDialog(els.skipDialog);
    if (mode !== "daily" && mode !== "streak") {
      setMode(mode, true);
      showScreen("game");
      announce(`Fresh ${MODE_CONFIG[mode].label.toLowerCase()} ready.`);
      return;
    }
    game.status = "lost";
    game.skipped = true;
    game.current = "";
    saveGame();
    renderAll();
    completeGame(false);
  }

  function renderStats() {
    const winrate = stats.played ? Math.round((stats.wins / stats.played) * 100) : 0;
    const streakStep = stats.currentStreak ? ((stats.currentStreak - 1) % 7) + 1 : 0;
    const daysRemaining = 7 - streakStep;
    els.streakProgressCount.textContent = stats.currentStreak;
    els.streakProgressMessage.textContent = daysRemaining === 0 ? "Full signal lit — keep it glowing" : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} to the full signal`;
    els.streakProgressFill.style.width = `${(streakStep / 7) * 100}%`;
    els.streakTrack.setAttribute("aria-valuenow", String(streakStep));
    els.streakTrack.setAttribute("aria-valuetext", `${stats.currentStreak} day streak; ${daysRemaining} days to the next seven-day signal`);
    document.querySelector("#stat-played").textContent = stats.played;
    document.querySelector("#stat-winrate").textContent = winrate;
    document.querySelector("#stat-streak").textContent = stats.currentStreak;
    document.querySelector("#stat-max-streak").textContent = stats.maxStreak;
    renderEconomy();
    const max = Math.max(1, ...stats.distribution);
    const distribution = document.querySelector("#distribution");
    distribution.innerHTML = "";
    stats.distribution.forEach((value, index) => {
      const row = document.createElement("div");
      row.className = "dist-row";
      row.innerHTML = `<span>${index + 1}</span><div class="dist-track"><div class="dist-bar" style="width:${Math.max(9, (value / max) * 100)}%">${value}</div></div>`;
      distribution.appendChild(row);
    });
  }

  function updateResultControls() {
    const finished = game.status !== "playing";
    els.shareButton.disabled = !finished;
    els.newPracticeButton.hidden = mode === "daily" || !finished;
    els.newPracticeButton.textContent = mode === "streak" ? "Next streak word" : `New ${MODE_CONFIG[mode].label.replace(" Puzzle", "").toLowerCase()} word`;
    els.nextPuzzleWrap.hidden = mode !== "daily";
  }

  async function shareResult() {
    if (game.status === "playing") return;
    const header = `Sixth Sense ${mode === "daily" ? `#${game.puzzleNumber}` : MODE_CONFIG[mode].label.replace(" Puzzle", "")} ${game.status === "won" ? `${game.guesses.length}/${Core.MAX_GUESSES}` : `—/${Core.MAX_GUESSES}`}`;
    const body = game.guesses.map(entry => entry.score.map(status => ({ exact: "●", present: "◆", absent: "·" }[status])).join("")).join("\n");
    const text = `${header}\n${body}\n\nFeel the word.`;
    try {
      if (navigator.share) await navigator.share({ title: "Sixth Sense", text });
      else await navigator.clipboard.writeText(text);
      announce(navigator.share ? "Result shared." : "Result copied.");
    } catch (error) {
      if (error.name !== "AbortError") announce("Couldn’t share—try copying again.");
    }
  }

  function celebrate() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    els.celebration.innerHTML = "";
    const colors = ["#ff766d", "#2e917e", "#e29955", "#a57acb", "#f3c85f"];
    for (let i = 0; i < 34; i += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
      piece.style.setProperty("--fall-time", `${1.8 + Math.random() * 1.5}s`);
      piece.style.animationDelay = `${Math.random() * .35}s`;
      els.celebration.appendChild(piece);
    }
    setTimeout(() => { els.celebration.innerHTML = ""; }, 3800);
  }

  function playTone(frequency, duration, volume) {
    if (!settings.sound) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) { /* Audio is an enhancement only. */ }
  }

  function playWinSound() {
    [440, 554, 659].forEach((note, index) => setTimeout(() => playTone(note, .22, .04), index * 120));
  }

  function applySettings() {
    document.body.classList.toggle("is-dark", Boolean(settings.dark));
    document.body.classList.toggle("high-contrast", Boolean(settings.contrast));
    Object.entries(els.settings).forEach(([key, input]) => { input.checked = Boolean(settings[key]); });
    const logoPath = `assets/logo-option-${settings.logo}.png`;
    document.querySelectorAll(".brand-logo").forEach(image => { image.src = logoPath; });
    els.favicon.href = logoPath;
    els.logoChoices.forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.logoOption) === settings.logo)));
    document.querySelector('meta[name="theme-color"]').content = settings.dark ? "#150933" : "#6d31ec";
  }

  function updateCountdown() {
    const now = new Date();
    const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    let seconds = Math.max(0, Math.floor((tomorrow - now.getTime()) / 1000));
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    els.countdown.textContent = [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
    updateModeStatus();
  }

  function closeDialog(dialog) {
    dialog.close();
    const trigger = document.querySelector(`[data-modal-open="${dialog.id}"]`);
    if (trigger) trigger.focus({ preventScroll: true });
  }

  function bindEvents() {
    els.modeButtons.forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));
    els.clueButton.addEventListener("click", revealClue);
    els.peekButton.addEventListener("click", revealPosition);
    els.clearButton.addEventListener("click", clearLetters);
    els.skipButton.addEventListener("click", openSkipConfirmation);
    els.confirmSkipButton.addEventListener("click", performSkip);
    els.cancelSkipButton.addEventListener("click", () => closeDialog(els.skipDialog));
    els.startButtons.forEach(button => button.addEventListener("click", () => { setMode(button.dataset.startMode); showScreen("game"); }));
    els.brand.addEventListener("click", event => { event.preventDefault(); showScreen("home"); });
    els.shareButton.addEventListener("click", shareResult);
    els.newPracticeButton.addEventListener("click", () => {
      closeDialog(document.querySelector("#stats-modal"));
      setMode(mode, true);
      showScreen("game");
    });
    els.logoChoices.forEach(button => button.addEventListener("click", () => {
      settings.logo = Number(button.dataset.logoOption);
      saveJson(STORAGE.settings, settings);
      applySettings();
      playTone(540 + settings.logo * 18, .08, .025);
    }));
    document.addEventListener("keydown", event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Enter") handleKey("ENTER");
      else if (event.key === "Backspace" || event.key === "Delete") handleKey("BACK");
      else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
    });
    document.querySelectorAll("[data-modal-open]").forEach(button => button.addEventListener("click", () => {
      const dialog = document.querySelector(`#${button.dataset.modalOpen}`);
      if (dialog.id === "stats-modal") { renderStats(); updateResultControls(); }
      dialog.showModal();
    }));
    document.querySelectorAll(".modal-close, .modal-got-it").forEach(button => button.addEventListener("click", () => closeDialog(button.closest("dialog"))));
    document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => {
      if (event.target === dialog) closeDialog(dialog);
    }));
    Object.entries(els.settings).forEach(([key, input]) => input.addEventListener("change", () => {
      settings[key] = input.checked;
      saveJson(STORAGE.settings, settings);
      applySettings();
      if (key === "sound" && settings.sound) playTone(480, .08, .03);
    }));
    window.addEventListener("pageshow", () => {
      if (mode === "daily" && game.date !== Core.dateKey()) setMode("daily");
    });
  }

  function init() {
    applySettings();
    bindEvents();
    setMode("daily");
    showScreen("home");
    updateCountdown();
    setInterval(updateCountdown, 1000);
    if (!localStorage.getItem(STORAGE.visited)) {
      try { localStorage.setItem(STORAGE.visited, "yes"); } catch (_) { /* no-op */ }
      setTimeout(() => document.querySelector("#help-modal").showModal(), 450);
    }
  }

  init();
})();
