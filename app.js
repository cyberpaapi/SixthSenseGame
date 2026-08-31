(function () {
  "use strict";

  const Core = window.SixthSenseCore;
  const ANSWER_WORDS = new Set(Core.ANSWERS.map(item => item.word));
  const STORAGE = {
    daily: "sixth-sense.daily.v1",
    practice: "sixth-sense.practice.v1",
    sprint: "sixth-sense.sprint.v1",
    insight: "sixth-sense.insight.v1",
    streak: "sixth-sense.streak-mode.v1",
    adventure: "sixth-sense.adventure.v1",
    stats: "sixth-sense.stats.v1",
    settings: "sixth-sense.settings.v1",
    identity: "sixth-sense.online.identity.v1",
    visited: "sixth-sense.visited.v1"
  };
  const MARKERS = { exact: "●", present: "◆", absent: "×" };
  const PRIORITY = { absent: 1, present: 2, exact: 3 };
  const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", [..."ZXCVBNM", "BACK"]];
  const BASE_AVATARS = ["fox", "owl", "axolotl", "panda", "tiger", "koala", "frog", "rabbit", "penguin"];
  const PREMIUM_AVATARS = ["red-panda", "capybara", "raccoon", "snow-leopard", "phoenix", "dragon", "unicorn", "otter", "chameleon"];
  const AVATARS = [...BASE_AVATARS, ...PREMIUM_AVATARS];
  const DECORATIONS = ["none", "aurora", "sunburst", "prism", "champion"];
  const DAILY_STREAK_REWARD = 300;
  const ECONOMY_VERSION = 2;
  const ACCENTS = Object.freeze({ coral: "#ff4f83", mango: "#ff9f2f", sun: "#f3cf32", leaf: "#22b66f", aqua: "#08b9c8", sky: "#347cf4", violet: "#7c45e8", berry: "#d83cac" });
  const ADVENTURE_TIERS = Object.freeze({
    easy: { title: "Sky Garden", art: "assets/adventure-zone-sky-ladder-v1.webp", alt: "An endless golden ladder rising through the current Adventure zone" },
    medium: { title: "Ember Canopy", art: "assets/adventure-zone-ember-ladder-v1.webp", alt: "An endless golden ladder rising through the current Adventure zone" },
    extreme: { title: "Cosmic Prism", art: "assets/adventure-zone-cosmic-ladder-v1.webp", alt: "An endless golden ladder rising through the current Adventure zone" }
  });
  const MODE_CONFIG = Object.freeze({
    daily: { label: "Daily Puzzle", ready: "Daily puzzle ready." },
    practice: { label: "Practice Puzzle", ready: "Practice puzzle ready." },
    sprint: { label: "Time Tackle", ready: "Time Tackle started — ten minutes." },
    insight: { label: "Insight Puzzle", ready: "Insight ready — clue and reveal unlocked." },
    streak: { label: "Streak Puzzle", ready: "Streak puzzle ready." },
    adventure: { label: "Adventure Puzzle", ready: "Adventure level ready." }
  });
  const defaultSettings = { hard: false, contrast: false, dark: false, music: true, effects: true, avatar: "fox", accent: "coral", decoration: "none", unlockedAvatars: [], unlockedDecorations: [] };
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
    dailyRewardEarned: document.querySelector("#daily-reward-earned"),
    streakProgressCount: document.querySelector("#streak-progress-count"),
    streakProgressMessage: document.querySelector("#streak-progress-message"),
    streakProgressFill: document.querySelector("#streak-progress-fill"),
    streakTrack: document.querySelector("#streak-track"),
    streakRewardPreview: document.querySelector("#streak-reward-preview"),
    modeButtons: [...document.querySelectorAll(".mode-button")],
    homeScreen: document.querySelector("#home-screen"),
    gameScreen: document.querySelector("#game-screen"),
    adventureScreen: document.querySelector("#adventure-screen"),
    adventureOpenButtons: [...document.querySelectorAll("[data-open-adventure-map]")],
    adventureBack: document.querySelector("#adventure-back"),
    adventurePlay: document.querySelector("#adventure-play"),
    adventurePath: document.querySelector("#adventure-level-path"),
    adventurePagePrevious: document.querySelector("#adventure-page-previous"),
    adventurePageNext: document.querySelector("#adventure-page-next"),
    adventurePageStatus: document.querySelector("#adventure-page-status"),
    adventureLockVeil: document.querySelector("#adventure-lock-veil"),
    adventureFeatureArt: document.querySelector("#adventure-feature-art"),
    adventureMapArt: document.querySelector("#adventure-map-art"),
    brand: document.querySelector(".brand"),
    profileTrigger: document.querySelector("#profile-trigger"),
    profileDialog: document.querySelector("#profile-modal"),
    profileAvatar: document.querySelector("#profile-avatar"),
    profileName: document.querySelector("#profile-name"),
    profileZone: document.querySelector("#profile-zone"),
    profileWordsSolved: document.querySelector("#profile-words-solved"),
    profileTotalSolves: document.querySelector("#profile-total-solves"),
    profileBestAttempts: document.querySelector("#profile-best-attempts"),
    profileBestStreak: document.querySelector("#profile-best-streak"),
    profileFastestWord: document.querySelector("#profile-fastest-word"),
    profileFastestTime: document.querySelector("#profile-fastest-time"),
    profileCoins: document.querySelector("#profile-coins"),
    profileCustomize: document.querySelector("#profile-customize"),
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
    resultDialog: document.querySelector("#result-modal"),
    resultConfetti: document.querySelector("#result-confetti"),
    resultExit: document.querySelector("#result-exit"),
    resultKicker: document.querySelector("#result-kicker"),
    resultTitle: document.querySelector("#result-title"),
    resultSummary: document.querySelector("#result-summary"),
    resultWord: document.querySelector("#result-word"),
    resultAttempts: document.querySelector("#result-attempts"),
    resultAttemptIcon: document.querySelector(".result-attempt-icon"),
    resultCoins: document.querySelector("#result-coins"),
    resultPoints: document.querySelector("#result-points"),
    resultStreakReward: document.querySelector("#result-streak-reward"),
    resultPrimary: document.querySelector("#result-primary"),
    hintDialog: document.querySelector("#hint-modal"),
    hintDialogCopy: document.querySelector("#hint-dialog-copy"),
    hintOkButton: document.querySelector("#hint-ok-button"),
    leaveGameDialog: document.querySelector("#leave-game-modal"),
    leaveGameCopy: document.querySelector("#leave-game-copy"),
    leaveGameCancel: document.querySelector("#leave-game-cancel"),
    leaveGameConfirm: document.querySelector("#leave-game-confirm"),
    lastChanceDialog: document.querySelector("#last-chance-modal"),
    lastChanceCopy: document.querySelector("#last-chance-copy"),
    lastChanceBuy: document.querySelector("#last-chance-buy"),
    lastChanceDecline: document.querySelector("#last-chance-decline"),
    avatarChoices: [...document.querySelectorAll("[data-avatar-option]")],
    decorationChoices: [...document.querySelectorAll("[data-decoration-option]")],
    accentChoices: [...document.querySelectorAll("[data-accent-option]")],
    usernameDialog: document.querySelector("#username-modal"),
    usernameForm: document.querySelector("#username-onboarding-form"),
    usernameInput: document.querySelector("#username-onboarding-input"),
    usernameMessage: document.querySelector("#username-onboarding-message"),
    settingsUsername: document.querySelector("#settings-username"),
    settingsUsernameSave: document.querySelector("#save-settings-username"),
    settingsUsernameMessage: document.querySelector("#settings-username-message"),
    settingsDialog: document.querySelector("#settings-modal"),
    identityStudio: document.querySelector(".identity-studio"),
    brandPlayerAvatar: document.querySelector("#brand-player-avatar"),
    favicon: document.querySelector("#app-favicon"),
    settings: {
      hard: document.querySelector("#hard-mode"),
      contrast: document.querySelector("#contrast-mode"),
      dark: document.querySelector("#dark-mode"),
      music: document.querySelector("#music-mode"),
      effects: document.querySelector("#effects-mode")
    }
  };

  let mode = "daily";
  let game = null;
  let settings = loadSettings();
  settings.unlockedAvatars = [...new Set(Array.isArray(settings.unlockedAvatars) ? settings.unlockedAvatars : [])].filter(avatar => PREMIUM_AVATARS.includes(avatar));
  settings.unlockedDecorations = [...new Set(Array.isArray(settings.unlockedDecorations) ? settings.unlockedDecorations : [])].filter(decoration => DECORATIONS.includes(decoration) && decoration !== "none");
  settings.avatar = AVATARS.includes(settings.avatar) && (BASE_AVATARS.includes(settings.avatar) || settings.unlockedAvatars.includes(settings.avatar)) ? settings.avatar : "fox";
  settings.decoration = DECORATIONS.includes(settings.decoration) && (settings.decoration === "none" || settings.unlockedDecorations.includes(settings.decoration)) ? settings.decoration : "none";
  settings.accent = ACCENTS[settings.accent] ? settings.accent : "coral";
  let playerIdentity = loadJson(STORAGE.identity, { name: "" });
  playerIdentity.name = cleanUsername(playerIdentity.name);
  const storedStatsText = localStorage.getItem(STORAGE.stats);
  const hadSavedStats = storedStatsText !== null;
  let storedEconomyVersion = ECONOMY_VERSION;
  let storedStatsHasCoins = false;
  if (hadSavedStats) {
    try {
      const storedStats = JSON.parse(storedStatsText) || {};
      storedEconomyVersion = Math.max(1, Math.floor(Number(storedStats.economyVersion) || 1));
      storedStatsHasCoins = Object.hasOwn(storedStats, "coins");
    }
    catch (_) { storedEconomyVersion = 1; }
  }
  let stats = loadJson(STORAGE.stats, {
    played: 0, wins: 0, currentStreak: 0, maxStreak: 0,
    lastWinDate: null, distribution: Array(Core.MAX_GUESSES).fill(0), coins: Core.STARTING_COINS,
    streakRun: 0, bestModeStreak: 0, totalSolves: 0, totalPoints: 0, bestSolveAttempts: null, fastestSolve: null,
    economyVersion: ECONOMY_VERSION
  });
  stats.coins = Number.isFinite(Number(stats.coins)) ? Math.max(0, Math.floor(Number(stats.coins))) : Core.STARTING_COINS;
  if (hadSavedStats && storedStatsHasCoins && storedEconomyVersion < ECONOMY_VERSION) stats.coins *= 10;
  stats.economyVersion = ECONOMY_VERSION;
  stats.totalPoints = Number.isFinite(Number(stats.totalPoints)) ? Math.max(0, Math.floor(Number(stats.totalPoints))) : 0;
  stats.distribution = Array.from({ length: Core.MAX_GUESSES }, (_, index) => Number(stats.distribution?.[index]) || 0);
  stats.inventory = Object.fromEntries(Object.keys(defaultInventory).map(kind => {
    const count = Number(stats.inventory?.[kind]);
    return [kind, Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0];
  }));
  stats.completedWords = [...new Set(Array.isArray(stats.completedWords) ? stats.completedWords : [])]
    .filter(word => typeof word === "string" && ANSWER_WORDS.has(word));
  stats.totalSolves = Math.max(Number(stats.wins) || 0, Number.isFinite(Number(stats.totalSolves)) ? Math.max(0, Math.floor(Number(stats.totalSolves))) : 0);
  const historicalBestAttempts = stats.distribution.findIndex(value => value > 0) + 1 || null;
  stats.bestSolveAttempts = Number.isInteger(Number(stats.bestSolveAttempts)) && Number(stats.bestSolveAttempts) >= 1 && Number(stats.bestSolveAttempts) <= Core.MAX_GUESSES + 1 ? Number(stats.bestSolveAttempts) : historicalBestAttempts;
  stats.fastestSolve = stats.fastestSolve && ANSWER_WORDS.has(stats.fastestSolve.word) && Number.isFinite(Number(stats.fastestSolve.ms))
    ? { word: stats.fastestSolve.word, ms: Math.max(1000, Math.floor(Number(stats.fastestSolve.ms))) }
    : null;
  stats.adventure = {
    seed: Number.isInteger(Number(stats.adventure?.seed)) && Number(stats.adventure.seed) > 0 ? Number(stats.adventure.seed) >>> 0 : createAdventureSeed(),
    level: Math.max(0, Math.min(Core.ADVENTURE_TOTAL, Math.floor(Number(stats.adventure?.level) || 0)))
  };
  stats.lastDailyRewardStreak = Math.max(0, Math.floor(Number(stats.lastDailyRewardStreak) || 0));
  saveJson(STORAGE.stats, stats);
  let inputLocked = false;
  let toastTimer = null;
  let audioContext = null;
  let audioUnlocked = false;
  let effectsGain = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;
  let nextMusicAt = 0;
  let scheduledEffectCount = 0;
  let lastAdventureMapLevel = null;
  let adventurePageStart = 0;
  let selectedAdventureLevel = 0;
  let adventureTouchStartX = null;
  let showHelpAfterUsername = false;
  let historyReady = false;
  let pendingLeave = null;
  let allowNextPop = false;

  function loadJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === "object" ? { ...fallback, ...value } : { ...fallback };
    } catch (_) {
      return { ...fallback };
    }
  }

  function cleanUsername(value) {
    return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 18);
  }

  function usernameValidation(value) {
    const name = cleanUsername(value);
    if (name.length < 2) return { name, error: "Use at least two characters." };
    if (!/[\p{L}\p{N}]/u.test(name)) return { name, error: "Include at least one letter or number." };
    return { name, error: "" };
  }

  function saveUsername(value, messageElement) {
    const result = usernameValidation(value);
    if (result.error) {
      messageElement.textContent = result.error;
      return false;
    }
    playerIdentity = { name: result.name };
    saveJson(STORAGE.identity, playerIdentity);
    messageElement.textContent = "Saved.";
    applySettings();
    renderProfile();
    playEffect("choice");
    return true;
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE.settings)) || {};
      const legacySound = typeof saved.sound === "boolean" ? saved.sound : true;
      const next = {
        ...defaultSettings,
        ...saved,
        music: typeof saved.music === "boolean" ? saved.music : legacySound,
        effects: typeof saved.effects === "boolean" ? saved.effects : legacySound
      };
      delete next.sound;
      return next;
    } catch (_) {
      return { ...defaultSettings };
    }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Private browsing can deny storage. */ }
  }

  function createAdventureSeed() {
    try {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return value[0] || 1;
    } catch (_) {
      return ((Date.now() ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0) || 1;
    }
  }

  function emptyGame(answer, gameMode) {
    const nextGame = {
      version: 3,
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
      adventureReplay: false,
      extraAttemptPurchased: false,
      lastChanceOffered: false,
      guesses: [],
      current: "",
      status: "playing",
      recorded: false,
      rewarded: false,
      pointsRewarded: false,
      modeRecorded: false,
      personalRecorded: false,
      startedAt: Date.now(),
      deadline: gameMode === "sprint" ? Date.now() + 600000 : null
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
    const adventureLevelMatches = gameMode !== "adventure" || Number(saved.adventureLevel) === stats.adventure.level;
    if (!forceNew && adventureLevelMatches && saved.mode === gameMode && saved.answer && saved.clue && Array.isArray(saved.guesses) && ["playing", "last-chance"].includes(saved.status)) {
      return { ...emptyGame({ word: saved.answer, clue: saved.clue }, gameMode), ...saved, current: "" };
    }
    if (gameMode === "adventure") {
      const next = emptyGame(Core.adventureAnswer(stats.adventure.level, stats.adventure.seed), gameMode);
      next.adventureLevel = stats.adventure.level;
      next.adventureSeed = stats.adventure.seed;
      return next;
    }
    return emptyGame(Core.practiceAnswer(Core.dailyAnswer().word, Math.random, stats.completedWords), gameMode);
  }

  function saveGame() {
    saveJson(STORAGE[mode], game);
  }

  function pushScreenState(screen, replace = false) {
    if (!historyReady) return;
    const state = { sixthSense: true, screen };
    if (replace) history.replaceState(state, "", location.href);
    else if (history.state?.screen !== screen) history.pushState(state, "", location.href);
  }

  function showScreen(screen, options = {}) {
    const gameVisible = screen === "game";
    const adventureVisible = screen === "adventure";
    els.homeScreen.hidden = screen !== "home";
    els.gameScreen.hidden = !gameVisible;
    els.adventureScreen.hidden = !adventureVisible;
    document.body.dataset.screen = screen;
    const skipLink = document.querySelector(".skip-link");
    skipLink.href = gameVisible ? "#game-board" : adventureVisible ? "#adventure-map-title" : "#home-title";
    const destination = gameVisible ? els.gameScreen : adventureVisible ? els.adventureScreen : els.homeScreen;
    destination.classList.remove("is-entering");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      requestAnimationFrame(() => destination.classList.add("is-entering"));
    }
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (!options.fromHistory) pushScreenState(screen, Boolean(options.replaceHistory));
  }

  function currentScreen() {
    return document.body.dataset.screen || "home";
  }

  function restoreCurrentHistoryState() {
    history.pushState({ sixthSense: true, screen: currentScreen() }, "", location.href);
  }

  function defaultLeaveTarget() {
    return mode === "adventure" ? "adventure" : "home";
  }

  function requestSoloLeave(target = defaultLeaveTarget(), fromHistory = false) {
    pendingLeave = { target, fromHistory };
    els.leaveGameCopy.textContent = mode === "daily"
      ? "Your current Daily guesses are saved. You can return before today ends."
      : mode === "adventure"
        ? "Your guesses are saved. Leave this puzzle and return to the Adventure map?"
        : "Your current guesses are saved, and you can return to this puzzle later.";
    if (!els.leaveGameDialog.open) els.leaveGameDialog.showModal();
    setTimeout(() => els.leaveGameCancel.focus({ preventScroll: true }), 60);
  }

  function cancelSoloLeave() {
    pendingLeave = null;
    if (els.leaveGameDialog.open) els.leaveGameDialog.close();
  }

  function confirmSoloLeave() {
    const navigation = pendingLeave;
    pendingLeave = null;
    if (els.leaveGameDialog.open) els.leaveGameDialog.close();
    if (navigation?.fromHistory) {
      allowNextPop = true;
      history.back();
      return;
    }
    showScreen(navigation?.target || defaultLeaveTarget());
    playEffect("open");
  }

  function closeTopDialogForBack(dialog) {
    if (dialog === els.resultDialog) {
      dialog.close();
      return true;
    }
    if (dialog === els.usernameDialog || dialog === els.lastChanceDialog || dialog.id === "online-skip-result-modal") return false;
    dialog.close();
    return true;
  }

  function handleBrowserBack(event) {
    const target = event.state?.sixthSense ? event.state.screen : "home";
    if (allowNextPop) {
      allowNextPop = false;
      if (target === "adventure") {
        showScreen("adventure", { fromHistory: true });
        renderAdventure({ animateProgress: mode === "adventure" });
      } else showScreen(target === "game" ? "game" : "home", { fromHistory: true });
      return;
    }
    const openDialog = document.querySelector("dialog[open]");
    if (openDialog && openDialog !== els.leaveGameDialog && openDialog.id !== "online-leave-modal") {
      closeTopDialogForBack(openDialog);
      restoreCurrentHistoryState();
      return;
    }
    if (currentScreen() === "online") {
      restoreCurrentHistoryState();
      pendingLeave = { target, fromHistory: true, online: true };
      document.dispatchEvent(new CustomEvent("sixth-sense-request-online-leave"));
      return;
    }
    if (currentScreen() === "game" && ["playing", "last-chance"].includes(game?.status)) {
      restoreCurrentHistoryState();
      requestSoloLeave(target, true);
      return;
    }
    if (currentScreen() === "home" && target === "home") {
      restoreCurrentHistoryState();
      return;
    }
    if (target === "adventure") {
      showScreen("adventure", { fromHistory: true });
      renderAdventure({ animateProgress: mode === "adventure" });
    } else showScreen(target === "game" ? "game" : "home", { fromHistory: true });
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

  function enterSoloMode(nextMode) {
    setMode(nextMode);
    showScreen("game");
    playEffect("start");
    if (game.status === "last-chance") setTimeout(openLastChanceDialog, 180);
    else if (game.status !== "playing") setTimeout(() => openCurrentResult(game.status === "won"), 180);
  }

  function renderAll() {
    renderBoard();
    renderKeyboard();
    renderLifelines();
    renderEconomy();
    renderStats();
    updateResultControls();
  }

  function adventureState() {
    const progress = Core.adventureProgress(stats.adventure.level);
    return { progress, tier: ADVENTURE_TIERS[progress.tier] };
  }

  function renderAdventure(options = {}) {
    const { progress, tier } = adventureState();
    const animateProgress = Boolean(options.animateProgress) && !progress.complete && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const currentIndex = progress.complete ? Core.ADVENTURE_TOTAL - 1 : progress.level;
    const visibleCapacity = Math.min(8, Core.ADVENTURE_TOTAL);
    if (options.resetPage || adventurePageStart < 0 || adventurePageStart >= Core.ADVENTURE_TOTAL) {
      adventurePageStart = Math.floor(currentIndex / visibleCapacity) * visibleCapacity;
      selectedAdventureLevel = currentIndex;
    }
    const start = adventurePageStart;
    const end = Math.min(Core.ADVENTURE_TOTAL - 1, start + visibleCapacity - 1);
    const visibleCount = end - start + 1;
    if (selectedAdventureLevel < start || selectedAdventureLevel > end || selectedAdventureLevel > currentIndex) selectedAdventureLevel = Math.min(currentIndex, end);
    const pageProgress = Core.adventureProgress(start);
    const pageTier = start <= currentIndex && currentIndex <= end ? tier : ADVENTURE_TIERS[pageProgress.tier];
    if (els.adventureFeatureArt.getAttribute("src") !== tier.art) els.adventureFeatureArt.setAttribute("src", tier.art);
    if (els.adventureMapArt.getAttribute("src") !== pageTier.art) els.adventureMapArt.setAttribute("src", pageTier.art);
    els.adventureMapArt.alt = pageTier.alt;
    const selectedIsReplay = progress.complete || selectedAdventureLevel < currentIndex;
    els.adventurePlay.disabled = selectedAdventureLevel > currentIndex;
    els.adventurePlay.textContent = selectedIsReplay ? "Replay" : "Play";
    els.adventurePagePrevious.disabled = start === 0;
    els.adventurePageNext.disabled = end >= Core.ADVENTURE_TOTAL - 1;
    els.adventurePageStatus.textContent = `Showing Adventure levels ${start + 1} through ${end + 1}${start > currentIndex ? ", locked" : ""}.`;
    els.adventureLockVeil.hidden = start <= currentIndex;
    const ladderStep = 64 / 6;
    const rungPositions = Array.from({ length: visibleCapacity }, (_, index) => 82 - (index * ladderStep));
    els.adventurePath.innerHTML = "";
    for (let offset = 0; offset < visibleCount; offset += 1) {
      const levelIndex = start + offset;
      const levelNumber = levelIndex + 1;
      const nodeProgress = Core.adventureProgress(levelIndex);
      const top = rungPositions[offset];
      const node = document.createElement("button");
      const isComplete = levelIndex < currentIndex || progress.complete;
      const isCurrent = levelIndex === currentIndex && !progress.complete;
      const isLocked = levelIndex > currentIndex;
      const isSelected = levelIndex === selectedAdventureLevel && !isLocked;
      node.type = "button";
      node.className = `adventure-level-node${isComplete ? " is-complete" : ""}${isCurrent ? " is-current" : ""}${isLocked ? " is-locked" : ""}${isSelected && !isCurrent ? " is-selected" : ""}`;
      node.dataset.tier = nodeProgress.tier;
      node.style.left = "50%";
      node.style.top = `${top}%`;
      node.disabled = isLocked;
      node.setAttribute("aria-label", isComplete ? `Adventure level ${levelNumber}, complete` : isCurrent ? `Adventure level ${levelNumber}, current level` : `Adventure level ${levelNumber}, locked`);
      if (isCurrent) {
        node.setAttribute("aria-current", "step");
        node.innerHTML = `<span class="avatar-art avatar-${settings.avatar}${animateProgress ? " is-climbing" : ""}" data-decoration="${settings.decoration}" aria-hidden="true"></span><small aria-hidden="true">${levelNumber.toLocaleString()}</small>`;
        node.addEventListener("click", () => { selectedAdventureLevel = levelIndex; renderAdventure(); });
      } else {
        node.textContent = isComplete ? "✓" : levelNumber.toLocaleString();
        if (!isComplete && levelNumber > 999) node.style.fontSize = levelNumber > 9999 ? "7px" : "8px";
        if (isComplete) node.addEventListener("click", () => { selectedAdventureLevel = levelIndex; renderAdventure(); });
      }
      els.adventurePath.append(node);
      if (isCurrent && animateProgress) {
        node.querySelector(".avatar-art").style.setProperty("--climb-distance", `${Math.max(56, els.adventurePath.clientHeight * ladderStep / 100)}px`);
      }
    }
  }

  function openAdventureMap() {
    const currentLevel = stats.adventure.level;
    const animateProgress = lastAdventureMapLevel !== null && currentLevel === lastAdventureMapLevel + 1;
    showScreen("adventure");
    renderAdventure({ animateProgress, resetPage: true });
    lastAdventureMapLevel = currentLevel;
    playEffect("room");
  }

  function startAdventureLevel() {
    const currentLevel = Math.min(Core.ADVENTURE_TOTAL - 1, stats.adventure.level);
    if (selectedAdventureLevel > currentLevel) return;
    if (selectedAdventureLevel < stats.adventure.level || Core.adventureProgress(stats.adventure.level).complete) {
      const answer = Core.adventureAnswer(selectedAdventureLevel, stats.adventure.seed);
      game = emptyGame(answer, "adventure");
      mode = "adventure";
      game.adventureLevel = selectedAdventureLevel;
      game.adventureSeed = stats.adventure.seed;
      game.adventureReplay = true;
      saveGame();
      renderAll();
    } else setMode("adventure");
    showScreen("game");
    playEffect("start");
  }

  function changeAdventurePage(direction) {
    const capacity = Math.min(8, Core.ADVENTURE_TOTAL);
    const next = Math.max(0, Math.min(Math.floor((Core.ADVENTURE_TOTAL - 1) / capacity) * capacity, adventurePageStart + direction * capacity));
    if (next === adventurePageStart) return;
    adventurePageStart = next;
    renderAdventure();
    playEffect("open");
  }

  function renderBoard() {
    els.board.innerHTML = "";
    const rowCount = Core.MAX_GUESSES + (game.extraAttemptPurchased ? 1 : 0);
    els.board.setAttribute("aria-label", `${rowCount} rows of six-letter guesses`);
    els.board.classList.toggle("has-extra-row", rowCount > Core.MAX_GUESSES);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
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
        button.setAttribute("aria-label", key === "BACK" ? "Delete letter" : `Letter ${key}, ${statusLabel}`);
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
      price.querySelector("b").textContent = Core.LIFELINE_COSTS[kind];
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
        button.setAttribute("aria-label", `${names[kind]}: buy and use for ${Core.LIFELINE_COSTS[kind]} coins`);
        button.title = `${names[kind]} — buy and use for ${Core.LIFELINE_COSTS[kind]} coins`;
      }
    });
    const notes = [];
    if (game.clueUsed) notes.push(`Sense: ${game.clue}`);
    if (game.peekedPositions.length) notes.push(`Peek: ${game.peekedPositions.map(position => `position ${position + 1} is ${game.answer[position].toUpperCase()}`).join("; ")}.`);
    if (game.eliminatedLetters.length) notes.push(`Cleared: ${game.eliminatedLetters.map(letter => letter.toUpperCase()).join(", ")}.`);
    els.clueCopy.textContent = notes.length ? notes.join(" ") : "Tap a lifeline to use it; if needed, its price is charged in the same tap.";
  }

  function renderEconomy() {
    updateModeStatus();
    els.coinCount.textContent = stats.coins;
    els.coinWallet.setAttribute("aria-label", `${stats.coins} coin${stats.coins === 1 ? "" : "s"}`);
    els.statCoins.textContent = stats.coins;
    document.dispatchEvent(new CustomEvent("sixth-sense-economy-change", { detail: { coins: stats.coins, inventory: { ...stats.inventory } } }));
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
    return spendAmount(cost, label, kind);
  }

  function spendAmount(cost, label, lifelineKind = "") {
    if (stats.coins < cost) {
      announce(`${label} needs ${cost} coins. You have ${stats.coins}.`);
      if (lifelineKind) animateLifeline(lifelineKind, "is-unavailable");
      replayAnimation(els.coinWallet, "is-denied");
      playEffect("denied");
      return false;
    }
    stats.coins -= cost;
    saveJson(STORAGE.stats, stats);
    renderEconomy();
    replayAnimation(els.coinWallet, "is-spending");
    return true;
  }

  function creditCoins(amount, label = "Reward") {
    const coins = Math.max(0, Math.floor(Number(amount) || 0));
    if (!coins) return false;
    stats.coins += coins;
    saveJson(STORAGE.stats, stats);
    renderEconomy();
    replayAnimation(els.coinWallet, "is-earning");
    announce(`${label} · +${coins} coins`);
    playEffect("purchase");
    return true;
  }

  function openLastChanceDialog() {
    els.lastChanceCopy.textContent = `Unlock one final attempt for ${Core.LAST_CHANCE_COST} coins. The ad option is coming later.`;
    els.lastChanceBuy.innerHTML = `<span class="coin-symbol" aria-hidden="true"></span> Continue · ${Core.LAST_CHANCE_COST}`;
    if (!els.lastChanceDialog.open) els.lastChanceDialog.showModal();
    setTimeout(() => els.lastChanceBuy.focus({ preventScroll: true }), 50);
  }

  function buySoloLastChance() {
    if (game.status !== "last-chance" || !spendAmount(Core.LAST_CHANCE_COST, "Last Chance")) return;
    game.extraAttemptPurchased = true;
    game.lastChanceOffered = true;
    game.status = "playing";
    saveGame();
    closeDialog(els.lastChanceDialog);
    renderAll();
    playEffect("success");
  }

  function declineSoloLastChance() {
    if (game.status !== "last-chance") return closeDialog(els.lastChanceDialog);
    game.status = "lost";
    saveGame();
    closeDialog(els.lastChanceDialog);
    renderAll();
    completeGame(false);
  }

  function buyLifeline(kind, label) {
    if (stats.inventory[kind] > 0) return true;
    if (!spendCoins(kind, label)) return false;
    stats.inventory[kind] += 1;
    saveJson(STORAGE.stats, stats);
    renderLifelines();
    renderEconomy();
    animateLifeline(kind, "is-purchased");
    playEffect("purchase");
    return true;
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
    if (key === "BACK") {
      if (!game.current) return;
      game.current = game.current.slice(0, -1);
      playEffect("delete");
    }
    else if (/^[A-Z]$/.test(key) && game.current.length < Core.WORD_LENGTH) {
      game.current += key.toLowerCase();
      playEffect("letter", { semitone: (key.charCodeAt(0) - 65) % 7 });
    } else return;
    saveGame();
    renderBoard();
    const lastTile = els.board.querySelector(`[data-row="${game.guesses.length}"] .tile[data-letter]:not([data-letter=""])`);
    if (lastTile && key !== "BACK") {
      lastTile.classList.add("is-pop");
      lastTile.addEventListener("animationend", () => lastTile.classList.remove("is-pop"), { once: true });
    }
    if (key !== "BACK" && game.current.length === Core.WORD_LENGTH) submitGuess();
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
    else if (game.guesses.length >= Core.MAX_GUESSES + (game.extraAttemptPurchased ? 1 : 0)) {
      game.status = !game.extraAttemptPurchased && game.guesses.length === Core.MAX_GUESSES ? "last-chance" : "lost";
      game.lastChanceOffered = game.status === "last-chance";
    }
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
      playEffect(tile.classList.contains("exact") ? "exact" : tile.classList.contains("present") ? "present" : "absent");
    }, index * 105));
    setTimeout(() => {
      inputLocked = false;
      renderKeyboard();
      if (game.status === "playing") return;
      if (game.status === "last-chance") return openLastChanceDialog();
      completeGame(won);
    }, tiles.length * 105 + 380);
  }

  function completeGame(won) {
    let reward = 0;
    let points = 0;
    let streakReward = 0;
    if (won && !game.rewarded && !game.adventureReplay) {
      reward = Core.rewardForAttempts(game.guesses.length);
      stats.coins += reward;
      game.solveReward = reward;
      game.rewarded = true;
    }
    if (won && !game.pointsRewarded && !game.adventureReplay) {
      points = Core.pointsForAttempts(game.guesses.length);
      stats.totalPoints += points;
      game.solvePoints = points;
      game.pointsRewarded = true;
    }
    if (won && !stats.completedWords.includes(game.answer)) stats.completedWords.push(game.answer);
    if (won && !game.personalRecorded && !game.adventureReplay) {
      const elapsed = Math.max(1000, Date.now() - (Number(game.startedAt) || Date.now()));
      stats.totalSolves += 1;
      stats.bestSolveAttempts = stats.bestSolveAttempts === null ? game.guesses.length : Math.min(stats.bestSolveAttempts, game.guesses.length);
      if (!stats.fastestSolve || elapsed < stats.fastestSolve.ms) stats.fastestSolve = { word: game.answer, ms: elapsed };
      game.personalRecorded = true;
    }
    if (mode === "daily" && !game.recorded) {
      stats.played += 1;
      if (won) {
        stats.wins += 1;
        stats.distribution[Math.min(Core.MAX_GUESSES, game.guesses.length) - 1] += 1;
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        stats.currentStreak = stats.lastWinDate === Core.dateKey(yesterday) ? stats.currentStreak + 1 : 1;
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
        stats.lastWinDate = Core.dateKey();
        if (stats.currentStreak % 7 === 0 && stats.lastDailyRewardStreak < stats.currentStreak) {
          streakReward = DAILY_STREAK_REWARD;
          stats.coins += streakReward;
          stats.lastDailyRewardStreak = stats.currentStreak;
          game.streakReward = streakReward;
        }
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
    if (mode === "adventure" && (won || game.skipped) && !game.modeRecorded && !game.adventureReplay) {
      if (Number(game.adventureLevel) === stats.adventure.level) stats.adventure.level = Math.min(Core.ADVENTURE_TOTAL, stats.adventure.level + 1);
      game.modeRecorded = true;
    }
    saveJson(STORAGE.stats, stats);
    saveGame();
    renderLifelines();
    if (won) {
      const totalReward = reward + streakReward;
      announce(totalReward ? `Solved in ${game.guesses.length} — +${totalReward} coins!` : "Beautiful intuition.");
      celebrate();
      playEffect("win");
      try { navigator.vibrate?.([22, 34, 48]); } catch (_) { /* Haptics are an optional enhancement. */ }
    } else {
      announce(`The word was ${game.answer.toUpperCase()}.`);
      playEffect("lose");
    }
    renderStats();
    updateResultControls();
    renderResult(won, reward, streakReward, points);
    setTimeout(() => openCurrentResult(won), 680);
  }

  function openCurrentResult(won = game.status === "won") {
    renderResult(won, Number(game.solveReward) || 0, Number(game.streakReward) || 0, Number(game.solvePoints) || 0);
    if (!els.resultDialog.open) els.resultDialog.showModal();
    if (won) celebrateResultDialog();
    els.resultPrimary.focus({ preventScroll: true });
  }

  function invalid(message) {
    announce(message);
    const row = els.board.querySelector(`[data-row="${game.guesses.length}"]`);
    row.classList.remove("is-shaking");
    void row.offsetWidth;
    row.classList.add("is-shaking");
    playEffect("invalid");
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
    showHintDialog(game.clue);
    playEffect("hint");
  }

  function showHintDialog(clue) {
    els.hintDialogCopy.textContent = String(clue || "Listen for the pattern in the word.");
    if (!els.hintDialog.open) els.hintDialog.showModal();
    setTimeout(() => els.hintOkButton.focus({ preventScroll: true }), 40);
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
    playEffect("peek");
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
    playEffect("clear");
  }

  function openSkipConfirmation() {
    if (game.status !== "playing") return;
    const purchaseCopy = stats.inventory.skip > 0 ? "Use one Skip?" : `Buy and use one Skip for ${Core.LIFELINE_COSTS.skip} coins?`;
    els.skipCopy.textContent = mode === "daily" ? `${purchaseCopy} Today’s answer will be revealed and it counts as a loss.` : mode === "streak" ? `${purchaseCopy} The answer will be revealed with no reward, and your run resets after OK.` : mode === "adventure" ? `${purchaseCopy} The answer will be revealed with no reward, and your token moves after OK.` : `${purchaseCopy} The answer will be revealed with no reward. Continue after pressing OK.`;
    els.skipDialog.showModal();
  }

  function performSkip() {
    if (!buyLifeline("skip", "Skip")) {
      closeDialog(els.skipDialog);
      return;
    }
    if (!consumeLifeline("skip")) {
      closeDialog(els.skipDialog);
      return;
    }
    animateLifeline("skip", "is-used-now");
    playEffect("skip");
    closeDialog(els.skipDialog);
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
    els.streakProgressMessage.textContent = daysRemaining === 0 ? `Reward unlocked · +${DAILY_STREAK_REWARD} coins` : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} to +${DAILY_STREAK_REWARD} coins`;
    els.streakProgressFill.style.width = `${(streakStep / 7) * 100}%`;
    els.streakTrack.setAttribute("aria-valuenow", String(streakStep));
    els.streakTrack.setAttribute("aria-valuetext", `${stats.currentStreak} day streak; ${daysRemaining} days to the next seven-day signal`);
    els.streakRewardPreview.classList.toggle("is-earned", daysRemaining === 0);
    els.dailyRewardEarned.hidden = !(mode === "daily" && Number(game?.streakReward) > 0);
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
    renderProfile();
    renderAdventure();
  }

  function formatSolveTime(milliseconds) {
    const seconds = Math.max(1, Number(milliseconds) || 0) / 1000;
    if (seconds < 60) return `${seconds < 10 ? seconds.toFixed(1) : Math.round(seconds)}s`;
    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    return `${minutes}:${String(roundedSeconds % 60).padStart(2, "0")}`;
  }

  function renderProfile() {
    const { progress } = adventureState();
    const bestStreak = Math.max(Number(stats.maxStreak) || 0, Number(stats.bestModeStreak) || 0);
    decorateAvatar(els.profileAvatar);
    els.profileName.textContent = playerIdentity.name || "Player";
    els.profileZone.textContent = progress.complete ? "Adventure complete" : "Adventure in progress";
    els.profileWordsSolved.textContent = stats.completedWords.length.toLocaleString();
    els.profileTotalSolves.textContent = stats.totalSolves.toLocaleString();
    els.profileBestAttempts.textContent = stats.bestSolveAttempts ? `${stats.bestSolveAttempts} ${stats.bestSolveAttempts === 1 ? "try" : "tries"}` : "—";
    els.profileBestStreak.textContent = bestStreak.toLocaleString();
    els.profileFastestWord.textContent = stats.fastestSolve ? stats.fastestSolve.word.toUpperCase() : "—";
    els.profileFastestTime.textContent = stats.fastestSolve ? `Solved in ${formatSolveTime(stats.fastestSolve.ms)}` : "No timed solve yet";
    els.profileCoins.textContent = stats.coins.toLocaleString();
  }

  function updateResultControls() {
    const finished = game.status !== "playing";
    els.shareButton.disabled = !finished;
    els.newPracticeButton.hidden = mode === "daily" || !finished;
    els.newPracticeButton.textContent = mode === "streak" ? "Next streak word" : mode === "adventure" ? (game.status === "won" ? "Continue the trail" : "Return to this level") : `New ${MODE_CONFIG[mode].label.replace(" Puzzle", "").toLowerCase()} word`;
    els.nextPuzzleWrap.hidden = mode !== "daily";
  }

  function resultPerformance(attempts) {
    return [
      { title: "Pure intuition", summary: "One read. One answer. That is a rare signal." },
      { title: "Brilliant read", summary: "You found the pattern almost instantly." },
      { title: "Sharp deduction", summary: "Fast, focused, and beautifully read." },
      { title: "Strong signal", summary: "Every clue landed exactly where it needed to." },
      { title: "Signal secured", summary: "Patient deduction turned noise into an answer." },
      { title: "Clutch finish", summary: "You held the thread and closed it out." },
      { title: "Last-chance legend", summary: "Seven tries, zero surrender. Signal found." },
      { title: "Encore secured", summary: "The extra signal paid off. One final read found the word." }
    ][Math.max(0, Math.min(Core.MAX_GUESSES, attempts - 1))];
  }

  function renderResult(won, reward = Number(game.solveReward) || 0, streakReward = Number(game.streakReward) || 0, points = Number(game.solvePoints) || 0) {
    const attempts = game.guesses.length;
    const performance = resultPerformance(Math.max(1, attempts));
    const earned = won ? reward + streakReward : 0;
    els.resultDialog.classList.toggle("is-loss", !won);
    els.resultKicker.textContent = game.skipped ? "Word revealed" : game.adventureReplay ? "Replay complete" : won ? "Puzzle complete" : "Signal ended";
    els.resultTitle.textContent = game.skipped ? "No reward this time" : won ? performance.title : "Signal missed";
    els.resultSummary.textContent = game.skipped ? "Take in the answer, then continue when you are ready." : won ? performance.summary : "The answer is yours now. Carry the pattern into the next word.";
    els.resultWord.setAttribute("aria-label", `${won ? "Solved word" : "Answer"}: ${game.answer.toUpperCase()}`);
    els.resultWord.innerHTML = [...game.answer.toUpperCase()].map((letter, index) => `<span style="--letter-delay:${.08 + index * .055}s">${letter}</span>`).join("");
    els.resultAttemptIcon.textContent = won ? String(attempts) : "×";
    els.resultAttempts.textContent = won ? `Solved in ${attempts}` : `${attempts} ${attempts === 1 ? "try" : "tries"} used`;
    els.resultCoins.textContent = won ? `+${earned} ${earned === 1 ? "coin" : "coins"}` : "No coins";
    els.resultPoints.textContent = won ? `+${points} ${points === 1 ? "point" : "points"}` : "No points";
    els.resultStreakReward.hidden = !(won && streakReward > 0);
    els.resultPrimary.textContent = "OK";
  }

  function exitResult() {
    if (els.resultDialog.open) els.resultDialog.close();
    if (mode === "adventure") openAdventureMap();
    else if (game.skipped && mode !== "daily") {
      setMode(mode, true);
      showScreen("game");
    }
    else showScreen("home");
  }

  function continueFromResult() {
    exitResult();
  }

  async function shareResult() {
    if (game.status === "playing") return;
    const maximum = Core.MAX_GUESSES + (game.extraAttemptPurchased ? 1 : 0);
    const header = `Sixth Sense ${mode === "daily" ? `#${game.puzzleNumber}` : MODE_CONFIG[mode].label.replace(" Puzzle", "")} ${game.status === "won" ? `${game.guesses.length}/${maximum}` : `—/${maximum}`}`;
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
    const colors = ["#ff4f83", "#16b987", "#ffbf2f", "#7754e8", "#20b9e8", "#ff7438"];
    for (let i = 0; i < 44; i += 1) {
      const piece = document.createElement("i");
      piece.className = "confetti";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty("--drift", `${Math.random() * 240 - 120}px`);
      piece.style.setProperty("--fall-time", `${1.7 + Math.random() * 1.4}s`);
      piece.style.setProperty("--confetti-width", `${5 + Math.random() * 7}px`);
      piece.style.setProperty("--confetti-height", `${9 + Math.random() * 11}px`);
      piece.style.animationDelay = `${Math.random() * .42}s`;
      els.celebration.appendChild(piece);
    }
    for (let i = 0; i < 30; i += 1) {
      const burst = document.createElement("i");
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * .18;
      const distance = 130 + Math.random() * 230;
      burst.className = "confetti is-burst";
      burst.style.background = colors[(i + 2) % colors.length];
      burst.style.setProperty("--burst-x", `${Math.cos(angle) * distance}px`);
      burst.style.setProperty("--burst-y", `${Math.sin(angle) * distance}px`);
      burst.style.setProperty("--burst-rotate", `${480 + Math.random() * 620}deg`);
      burst.style.setProperty("--burst-time", `${.7 + Math.random() * .45}s`);
      burst.style.setProperty("--confetti-width", `${5 + Math.random() * 6}px`);
      burst.style.setProperty("--confetti-height", `${8 + Math.random() * 9}px`);
      els.celebration.appendChild(burst);
    }
    ["#5be3bd", "#ffd54f"].forEach((color, index) => {
      const ring = document.createElement("i");
      ring.className = "celebration-ring";
      ring.style.setProperty("--ring-color", color);
      ring.style.animationDelay = `${index * .13}s`;
      els.celebration.appendChild(ring);
    });
    for (let i = 0; i < 12; i += 1) {
      const spark = document.createElement("i");
      const angle = (Math.PI * 2 * i) / 12;
      spark.className = "celebration-spark";
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * (90 + Math.random() * 90)}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * (90 + Math.random() * 90)}px`);
      spark.style.setProperty("--spark-color", colors[i % colors.length]);
      spark.style.setProperty("--spark-delay", `${.03 + Math.random() * .12}s`);
      els.celebration.appendChild(spark);
    }
    setTimeout(() => { els.celebration.innerHTML = ""; }, 3600);
  }

  function celebrateResultDialog() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    els.resultConfetti.innerHTML = "";
    const colors = ["#ff4f83", "#13ad79", "#ffbf2f", "#7754e8", "#22bde0"];
    for (let index = 0; index < 26; index += 1) {
      const piece = document.createElement("i");
      piece.style.left = `${4 + Math.random() * 92}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--result-drift", `${Math.random() * 90 - 45}px`);
      piece.style.setProperty("--result-fall", `${1.35 + Math.random() * .75}s`);
      piece.style.setProperty("--result-delay", `${Math.random() * .28}s`);
      piece.style.setProperty("--result-rotate", `${360 + Math.random() * 520}deg`);
      els.resultConfetti.appendChild(piece);
    }
    setTimeout(() => { els.resultConfetti.innerHTML = ""; }, 2500);
  }

  function ensureAudio() {
    if (audioContext) return audioContext;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -22;
      compressor.knee.value = 18;
      compressor.ratio.value = 5;
      compressor.attack.value = .008;
      compressor.release.value = .22;
      effectsGain = audioContext.createGain();
      musicGain = audioContext.createGain();
      effectsGain.gain.value = settings.effects ? .82 : .0001;
      musicGain.gain.value = .0001;
      effectsGain.connect(compressor);
      musicGain.connect(compressor);
      compressor.connect(audioContext.destination);
      return audioContext;
    } catch (_) {
      return null;
    }
  }

  function scheduleTone({ frequency, endFrequency = frequency, duration = .12, volume = .035, wave = "sine", attack = .008, pan = 0, filter = 0, at }, destination) {
    const context = ensureAudio();
    if (!context || !destination) return;
    const start = Number.isFinite(at) ? at : context.currentTime + .004;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(Math.max(24, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, endFrequency), start + duration);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + Math.min(attack, duration / 3));
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    let tail = oscillator;
    if (filter) {
      const toneFilter = context.createBiquadFilter();
      toneFilter.type = "lowpass";
      toneFilter.frequency.value = filter;
      tail.connect(toneFilter);
      tail = toneFilter;
    }
    tail.connect(envelope);
    if (context.createStereoPanner) {
      const panner = context.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      envelope.connect(panner).connect(destination);
    } else envelope.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .025);
  }

  function scheduleNoise({ duration = .16, volume = .025, filter = 900, at }, destination) {
    const context = ensureAudio();
    if (!context || !destination) return;
    const start = Number.isFinite(at) ? at : context.currentTime + .004;
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) samples[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
    const source = context.createBufferSource();
    const toneFilter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = buffer;
    toneFilter.type = "bandpass";
    toneFilter.frequency.value = filter;
    toneFilter.Q.value = .8;
    envelope.gain.setValueAtTime(volume, start);
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(toneFilter).connect(envelope).connect(destination);
    source.start(start);
    source.stop(start + duration + .02);
  }

  function playEffect(name, detail = {}) {
    if (!settings.effects) return;
    const context = ensureAudio();
    if (!context) return;
    if (context.state === "suspended") context.resume().catch(() => {});
    const now = context.currentTime + .008;
    const tone = options => scheduleTone({ at: now, ...options }, effectsGain);
    const later = (delay, options) => scheduleTone({ at: now + delay, ...options }, effectsGain);
    scheduledEffectCount += 1;
    if (name === "letter") {
      const pitch = 250 * Math.pow(2, (Number(detail.semitone) || 0) / 18);
      tone({ frequency: pitch, endFrequency: pitch * 1.32, duration: .055, volume: .026, wave: "triangle", filter: 1800 });
    } else if (name === "delete") {
      tone({ frequency: 230, endFrequency: 120, duration: .075, volume: .025, wave: "triangle", filter: 1200 });
    } else if (name === "exact") {
      tone({ frequency: 660, endFrequency: 760, duration: .11, volume: .031, wave: "sine", pan: .12 });
      later(.035, { frequency: 990, duration: .1, volume: .013, wave: "sine", pan: -.12 });
    } else if (name === "present") {
      tone({ frequency: 430, endFrequency: 510, duration: .11, volume: .029, wave: "triangle", filter: 2100 });
    } else if (name === "absent") {
      tone({ frequency: 210, endFrequency: 165, duration: .09, volume: .021, wave: "sine", filter: 850 });
    } else if (name === "invalid" || name === "denied") {
      tone({ frequency: name === "denied" ? 170 : 145, endFrequency: 92, duration: .18, volume: .038, wave: "sawtooth", filter: 640 });
      later(.07, { frequency: 120, endFrequency: 88, duration: .13, volume: .02, wave: "triangle", filter: 520 });
    } else if (name === "purchase") {
      tone({ frequency: 784, duration: .13, volume: .032, wave: "sine" });
      later(.075, { frequency: 1175, duration: .18, volume: .03, wave: "sine" });
      later(.13, { frequency: 1568, duration: .16, volume: .018, wave: "sine" });
    } else if (name === "hint") {
      [523, 659, 784].forEach((frequency, index) => later(index * .045, { frequency, endFrequency: frequency * 1.03, duration: .34, volume: .018, wave: "sine", pan: (index - 1) * .28 }));
    } else if (name === "peek") {
      [587, 740, 988].forEach((frequency, index) => later(index * .065, { frequency, duration: .19, volume: .026 - index * .004, wave: "triangle", filter: 2600 }));
    } else if (name === "clear") {
      scheduleNoise({ at: now, duration: .22, volume: .026, filter: 1050 }, effectsGain);
      tone({ frequency: 360, endFrequency: 170, duration: .22, volume: .024, wave: "triangle", filter: 1300 });
    } else if (name === "skip") {
      [659, 494, 370].forEach((frequency, index) => later(index * .065, { frequency, endFrequency: frequency * .93, duration: .15, volume: .024, wave: "triangle", filter: 1900 }));
    } else if (name === "win") {
      tone({ frequency: 196, endFrequency: 261.63, duration: .48, volume: .047, wave: "triangle", filter: 900 });
      scheduleNoise({ at: now + .015, duration: .11, volume: .018, filter: 1500 }, effectsGain);
      [523, 659, 784, 1047].forEach((frequency, index) => later(.035 + index * .085, { frequency, duration: .5, volume: .042 - index * .004, wave: index < 2 ? "triangle" : "sine", pan: index % 2 ? .28 : -.28, filter: 3300 }));
      [1319, 1568, 2093, 2637].forEach((frequency, index) => later(.24 + index * .065, { frequency, duration: .28, volume: .014 - index * .0015, wave: "sine", pan: .48 - index * .32 }));
      [784, 988, 1175].forEach((frequency, index) => later(.52 + index * .075, { frequency, duration: .38, volume: .022 - index * .003, wave: "triangle", pan: (index - 1) * .28, filter: 2800 }));
      scheduleNoise({ at: now + .5, duration: .2, volume: .012, filter: 2300 }, effectsGain);
    } else if (name === "lose") {
      [330, 262, 196].forEach((frequency, index) => later(index * .12, { frequency, endFrequency: frequency * .9, duration: .28, volume: .029, wave: "triangle", filter: 1300 }));
    } else if (name === "start" || name === "room" || name === "open") {
      tone({ frequency: name === "room" ? 392 : 440, endFrequency: name === "open" ? 520 : 660, duration: .15, volume: .025, wave: "sine" });
      later(.055, { frequency: name === "room" ? 587 : 784, duration: .18, volume: .017, wave: "triangle", filter: 2300 });
    } else if (name === "submit" || name === "success" || name === "choice") {
      tone({ frequency: 440, endFrequency: 554, duration: .1, volume: .024, wave: "triangle", filter: 2200 });
      later(.055, { frequency: name === "choice" ? 659 : 740, duration: .13, volume: .018, wave: "sine" });
    }
  }

  function scheduleMusicStep() {
    const context = ensureAudio();
    if (!context || !settings.music || document.hidden) return;
    const progression = [
      [261.63, 329.63, 392, 493.88],
      [220, 261.63, 329.63, 392],
      [174.61, 220, 261.63, 329.63],
      [196, 246.94, 293.66, 392]
    ];
    while (nextMusicAt < context.currentTime + .7) {
      const chord = progression[Math.floor(musicStep / 8) % progression.length];
      const withinChord = musicStep % 8;
      const arpIndex = [0, 2, 1, 3, 2, 1, 0, 2][withinChord];
      scheduleTone({ frequency: chord[arpIndex] * 2, endFrequency: chord[arpIndex] * 2.015, duration: .34, volume: .011, wave: "triangle", attack: .018, pan: withinChord % 2 ? .22 : -.22, filter: 2300, at: nextMusicAt }, musicGain);
      if (withinChord % 4 === 0) scheduleTone({ frequency: chord[0] / 2, endFrequency: chord[0] / 2.02, duration: .46, volume: .018, wave: "sine", attack: .012, filter: 520, at: nextMusicAt }, musicGain);
      if (withinChord === 0) chord.forEach((frequency, index) => scheduleTone({ frequency, endFrequency: frequency * 1.004, duration: 3.15, volume: .0048, wave: "sine", attack: .34, pan: (index - 1.5) * .24, filter: 1500, at: nextMusicAt }, musicGain));
      nextMusicAt += .42;
      musicStep = (musicStep + 1) % 32;
    }
  }

  function startMusic() {
    if (!settings.music || !audioUnlocked || document.hidden || musicTimer) return;
    const context = ensureAudio();
    if (!context) return;
    if (context.state === "suspended") context.resume().catch(() => {});
    const now = context.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(Math.max(.0001, musicGain.gain.value), now);
    musicGain.gain.exponentialRampToValueAtTime(.82, now + .45);
    nextMusicAt = now + .08;
    scheduleMusicStep();
    musicTimer = window.setInterval(scheduleMusicStep, 250);
  }

  function stopMusic() {
    if (musicTimer) window.clearInterval(musicTimer);
    musicTimer = null;
    if (!audioContext || !musicGain) return;
    const now = audioContext.currentTime;
    musicGain.gain.cancelScheduledValues(now);
    musicGain.gain.setValueAtTime(Math.max(.0001, musicGain.gain.value), now);
    musicGain.gain.exponentialRampToValueAtTime(.0001, now + .18);
  }

  function unlockAudio() {
    audioUnlocked = true;
    const context = ensureAudio();
    if (!context) return;
    const begin = () => { if (settings.music) startMusic(); };
    if (context.state === "suspended") context.resume().then(begin).catch(() => {});
    else begin();
  }

  function syncAudioSettings() {
    if (effectsGain && audioContext) effectsGain.gain.setTargetAtTime(settings.effects ? .82 : .0001, audioContext.currentTime, .025);
    if (settings.music) startMusic();
    else stopMusic();
  }

  function decorateAvatar(element, avatar = settings.avatar, decoration = settings.decoration) {
    if (!element) return;
    element.className = `avatar-art avatar-${avatar}`;
    element.dataset.decoration = decoration || "none";
  }

  function renderIdentityShop() {
    els.avatarChoices.forEach(button => {
      const avatar = button.dataset.avatarOption;
      const unlocked = BASE_AVATARS.includes(avatar) || settings.unlockedAvatars.includes(avatar);
      button.classList.toggle("is-locked", !unlocked);
      button.setAttribute("aria-pressed", String(unlocked && avatar === settings.avatar));
      const price = button.querySelector(":scope > small");
      if (price) price.hidden = unlocked;
      button.setAttribute("aria-label", unlocked ? `Choose ${avatar.replaceAll("-", " ")} avatar` : `Unlock ${avatar.replaceAll("-", " ")} avatar for ${button.dataset.unlockCost} coins`);
    });
    els.decorationChoices.forEach(button => {
      const decoration = button.dataset.decorationOption;
      const unlocked = decoration === "none" || settings.unlockedDecorations.includes(decoration);
      button.classList.toggle("is-locked", !unlocked);
      button.setAttribute("aria-pressed", String(unlocked && decoration === settings.decoration));
      const price = button.querySelector(":scope > small");
      if (price && decoration !== "none") price.hidden = unlocked;
      decorateAvatar(button.querySelector(".avatar-art"), settings.avatar, decoration);
    });
  }

  function applySettings() {
    document.body.classList.toggle("is-dark", Boolean(settings.dark));
    document.body.classList.toggle("high-contrast", Boolean(settings.contrast));
    Object.entries(els.settings).forEach(([key, input]) => { input.checked = Boolean(settings[key]); });
    document.documentElement.style.setProperty("--player-accent", ACCENTS[settings.accent]);
    document.body.dataset.playerAvatar = settings.avatar;
    decorateAvatar(els.brandPlayerAvatar);
    decorateAvatar(els.profileAvatar);
    els.profileTrigger.setAttribute("aria-label", `Open ${playerIdentity.name || "your"} player profile`);
    els.settingsUsername.value = playerIdentity.name;
    renderIdentityShop();
    els.accentChoices.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.accentOption === settings.accent)));
    document.querySelector('meta[name="theme-color"]').content = settings.dark ? "#150933" : "#6d31ec";
    syncAudioSettings();
    document.dispatchEvent(new CustomEvent("sixth-sense-identity-change", { detail: { name: playerIdentity.name, avatar: settings.avatar, accent: settings.accent, decoration: settings.decoration } }));
  }

  function unlockCosmetic(button, type) {
    const value = type === "avatar" ? button.dataset.avatarOption : button.dataset.decorationOption;
    const unlocked = type === "avatar" ? BASE_AVATARS.includes(value) || settings.unlockedAvatars.includes(value) : value === "none" || settings.unlockedDecorations.includes(value);
    if (!unlocked) {
      const cost = Math.max(0, Number(button.dataset.unlockCost) || 0);
      if (stats.coins < cost) {
        els.settingsUsernameMessage.textContent = `${value.replaceAll("-", " ")} needs ${cost} coins. You have ${stats.coins}.`;
        replayAnimation(button, "is-unavailable");
        replayAnimation(els.coinWallet, "is-denied");
        playEffect("denied");
        return;
      }
      stats.coins -= cost;
      if (type === "avatar") settings.unlockedAvatars.push(value);
      else settings.unlockedDecorations.push(value);
      els.settingsUsernameMessage.textContent = `${value.replaceAll("-", " ")} unlocked and equipped.`;
      saveJson(STORAGE.stats, stats);
      renderEconomy();
      replayAnimation(els.coinWallet, "is-spending");
      playEffect("purchase");
    }
    if (type === "avatar") settings.avatar = value;
    else settings.decoration = value;
    saveJson(STORAGE.settings, settings);
    applySettings();
    renderAdventure();
    playEffect("choice", { semitone: Math.max(0, AVATARS.indexOf(settings.avatar)) });
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
    const trigger = dialog.id === "profile-modal" ? els.profileTrigger : document.querySelector(`[data-modal-open="${dialog.id}"]`);
    if (trigger) trigger.focus({ preventScroll: true });
  }

  function bindEvents() {
    els.usernameForm.addEventListener("submit", event => {
      event.preventDefault();
      if (!saveUsername(els.usernameInput.value, els.usernameMessage)) return;
      els.usernameDialog.close();
      if (showHelpAfterUsername) {
        showHelpAfterUsername = false;
        setTimeout(() => document.querySelector("#help-modal").showModal(), 180);
      }
    });
    els.settingsUsernameSave.addEventListener("click", () => saveUsername(els.settingsUsername.value, els.settingsUsernameMessage));
    els.settingsUsername.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveUsername(els.settingsUsername.value, els.settingsUsernameMessage);
      }
    });
    els.usernameDialog.addEventListener("cancel", event => event.preventDefault());
    els.modeButtons.forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));
    els.clueButton.addEventListener("click", revealClue);
    els.peekButton.addEventListener("click", revealPosition);
    els.clearButton.addEventListener("click", clearLetters);
    els.skipButton.addEventListener("click", openSkipConfirmation);
    els.confirmSkipButton.addEventListener("click", performSkip);
    els.cancelSkipButton.addEventListener("click", () => closeDialog(els.skipDialog));
    els.startButtons.forEach(button => button.addEventListener("click", () => enterSoloMode(button.dataset.startMode)));
    els.adventureOpenButtons.forEach(button => button.addEventListener("click", openAdventureMap));
    els.adventureBack.addEventListener("click", () => { showScreen("home"); playEffect("open"); });
    els.adventurePlay.addEventListener("click", startAdventureLevel);
    els.adventurePagePrevious.addEventListener("click", () => changeAdventurePage(-1));
    els.adventurePageNext.addEventListener("click", () => changeAdventurePage(1));
    els.adventurePath.addEventListener("touchstart", event => { adventureTouchStartX = event.touches[0]?.clientX ?? null; }, { passive: true });
    els.adventurePath.addEventListener("touchend", event => {
      if (adventureTouchStartX === null) return;
      const distance = (event.changedTouches[0]?.clientX ?? adventureTouchStartX) - adventureTouchStartX;
      adventureTouchStartX = null;
      if (Math.abs(distance) >= 58) changeAdventurePage(distance < 0 ? 1 : -1);
    }, { passive: true });
    els.brand.addEventListener("click", event => {
      event.preventDefault();
      if (document.body.dataset.screen === "online") {
        document.dispatchEvent(new CustomEvent("sixth-sense-request-online-leave"));
        return;
      }
      if (document.body.dataset.screen === "game" && ["playing", "last-chance"].includes(game.status)) {
        requestSoloLeave();
        return;
      }
      showScreen("home");
      playEffect("open");
    });
    els.profileTrigger.addEventListener("click", () => { renderProfile(); els.profileDialog.showModal(); playEffect("open"); });
    els.profileCustomize.addEventListener("click", () => {
      closeDialog(els.profileDialog);
      els.settingsDialog.showModal();
      setTimeout(() => els.identityStudio.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 80);
      playEffect("open");
    });
    els.resultExit.addEventListener("click", exitResult);
    els.resultPrimary.addEventListener("click", continueFromResult);
    els.hintOkButton.addEventListener("click", () => closeDialog(els.hintDialog));
    els.lastChanceBuy.addEventListener("click", () => document.body.dataset.screen === "online" ? document.dispatchEvent(new CustomEvent("sixth-sense-online-last-chance", { detail: { decision: "purchase" } })) : buySoloLastChance());
    els.lastChanceDecline.addEventListener("click", () => document.body.dataset.screen === "online" ? document.dispatchEvent(new CustomEvent("sixth-sense-online-last-chance", { detail: { decision: "decline" } })) : declineSoloLastChance());
    els.lastChanceDialog.addEventListener("cancel", event => event.preventDefault());
    els.leaveGameCancel.addEventListener("click", cancelSoloLeave);
    els.leaveGameConfirm.addEventListener("click", confirmSoloLeave);
    els.leaveGameDialog.addEventListener("cancel", event => { event.preventDefault(); cancelSoloLeave(); });
    els.leaveGameDialog.addEventListener("close", () => { if (pendingLeave && !pendingLeave.online) pendingLeave = null; });
    els.resultDialog.addEventListener("cancel", event => {
      event.preventDefault();
      exitResult();
    });
    els.shareButton.addEventListener("click", shareResult);
    els.newPracticeButton.addEventListener("click", () => {
      closeDialog(document.querySelector("#stats-modal"));
      if (mode === "adventure") {
        openAdventureMap();
        return;
      }
      setMode(mode, true);
      showScreen("game");
    });
    els.avatarChoices.forEach(button => button.addEventListener("click", () => unlockCosmetic(button, "avatar")));
    els.decorationChoices.forEach(button => button.addEventListener("click", () => unlockCosmetic(button, "decoration")));
    els.accentChoices.forEach(button => button.addEventListener("click", () => {
      settings.accent = button.dataset.accentOption;
      saveJson(STORAGE.settings, settings);
      applySettings();
      playEffect("choice");
    }));
    document.addEventListener("keydown", event => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target.matches("input, textarea, select")) return;
      if (event.key === "Enter") handleKey("ENTER");
      else if (event.key === "Backspace" || event.key === "Delete") handleKey("BACK");
      else if (/^[a-zA-Z]$/.test(event.key)) handleKey(event.key.toUpperCase());
    });
    document.querySelectorAll("[data-modal-open]").forEach(button => button.addEventListener("click", () => {
      const dialog = document.querySelector(`#${button.dataset.modalOpen}`);
      if (dialog.id === "stats-modal") { renderStats(); updateResultControls(); }
      dialog.showModal();
      playEffect("open");
    }));
    document.querySelectorAll(".modal-close, .modal-got-it").forEach(button => button.addEventListener("click", () => closeDialog(button.closest("dialog"))));
    document.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => {
      if (event.target !== dialog || dialog === els.usernameDialog) return;
      if (dialog === els.resultDialog) exitResult();
      else closeDialog(dialog);
    }));
    Object.entries(els.settings).forEach(([key, input]) => input.addEventListener("change", () => {
      settings[key] = input.checked;
      saveJson(STORAGE.settings, settings);
      applySettings();
      if ((key === "effects" && settings.effects) || (key === "music" && settings.music && settings.effects)) playEffect("choice");
    }));
    document.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
    document.addEventListener("keydown", unlockAudio, { once: true, capture: true });
    document.addEventListener("touchmove", event => {
      if (event.touches.length > 1 && ["game", "online"].includes(document.body.dataset.screen)) event.preventDefault();
    }, { passive: false });
    document.addEventListener("gesturestart", event => {
      if (["game", "online"].includes(document.body.dataset.screen)) event.preventDefault();
    }, { passive: false });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopMusic();
      else if (audioUnlocked && settings.music) startMusic();
    });
    window.addEventListener("pageshow", () => {
      if (mode === "daily" && game.date !== Core.dateKey()) setMode("daily");
    });
    window.addEventListener("popstate", handleBrowserBack);
  }

  function init() {
    window.SixthSenseAudio = {
      play: playEffect,
      unlock: unlockAudio,
      state: () => ({ music: Boolean(settings.music), effects: Boolean(settings.effects), unlocked: audioUnlocked, musicRunning: Boolean(musicTimer), scheduledEffects: scheduledEffectCount })
    };
    window.SixthSenseAdventure = {
      state: () => ({ ...stats.adventure, ...Core.adventureProgress(stats.adventure.level) })
    };
    window.SixthSenseEconomy = {
      state: () => ({ coins: stats.coins, inventory: { ...stats.inventory }, costs: { ...Core.LIFELINE_COSTS } }),
      purchase: kind => {
        if (!Object.hasOwn(defaultInventory, kind) || stats.inventory[kind] > 0) return false;
        if (!spendCoins(kind, kind[0].toUpperCase() + kind.slice(1))) return false;
        stats.inventory[kind] += 1;
        saveJson(STORAGE.stats, stats);
        renderLifelines();
        renderEconomy();
        playEffect("purchase");
        return true;
      },
      consume: kind => {
        const consumed = consumeLifeline(kind);
        if (consumed) {
          renderLifelines();
          renderEconomy();
        }
        return consumed;
      },
      spend: (amount, label = "Purchase") => spendAmount(Math.max(0, Math.floor(Number(amount) || 0)), label),
      credit: (amount, label = "Reward") => creditCoins(amount, label)
    };
    window.SixthSenseDialogs = { showHint: showHintDialog };
    window.SixthSenseCelebration = celebrate;
    window.SixthSenseNavigation = {
      onlineEntered: () => pushScreenState("online"),
      onlineLeaveCancelled: () => { if (pendingLeave?.online) pendingLeave = null; },
      onlineLeft: () => {
        const wasHistoryBack = Boolean(pendingLeave?.online && pendingLeave.fromHistory);
        pendingLeave = null;
        if (wasHistoryBack) {
          allowNextPop = true;
          history.back();
        } else pushScreenState("home");
      }
    };
    history.replaceState({ sixthSense: true, screen: "home", root: true }, "", location.href);
    history.pushState({ sixthSense: true, screen: "home" }, "", location.href);
    historyReady = true;
    applySettings();
    bindEvents();
    setMode("daily");
    showScreen("home");
    updateCountdown();
    setInterval(updateCountdown, 1000);
    const firstVisit = !localStorage.getItem(STORAGE.visited);
    if (firstVisit) {
      try { localStorage.setItem(STORAGE.visited, "yes"); } catch (_) { /* no-op */ }
    }
    if (!playerIdentity.name) {
      showHelpAfterUsername = firstVisit;
      setTimeout(() => { els.usernameInput.value = ""; els.usernameDialog.showModal(); els.usernameInput.focus(); }, 260);
    } else if (firstVisit) {
      setTimeout(() => document.querySelector("#help-modal").showModal(), 450);
    }
  }

  init();
})();
