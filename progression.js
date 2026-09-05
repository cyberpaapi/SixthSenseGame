(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SixthSenseProgression = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const TRIO_REWARD = 60;
  const RANK_POINTS = 3000;
  const RANKS = ["Curious mind", "Pattern finder", "Word explorer", "Sharp thinker", "Signal seeker", "Sense master"];
  function mastery(points) {
    const total = Math.max(0, Math.floor(Number(points) || 0));
    const level = Math.floor(total / RANK_POINTS);
    return { level: level + 1, name: RANKS[Math.min(level, RANKS.length - 1)],
      current: total % RANK_POINTS, target: RANK_POINTS, remaining: RANK_POINTS - total % RANK_POINTS };
  }
  function trio(saved, date) {
    const current = saved?.date === date ? saved : {};
    const words = [...new Set(Array.isArray(current.words) ? current.words : [])]
      .filter(word => typeof word === "string" && /^[a-z]{6}$/.test(word)).slice(0, 3);
    return { date, words, claimed: Boolean(current.claimed) };
  }
  // Pure transition: persist the returned state alongside the credited balance.
  // No replay, skip, repeated word, or reopened result can earn another bonus.
  function recordSolve(saved, { date, word, won, replay = false, recorded = false }) {
    const state = trio(saved, date);
    if (!won || replay || recorded || !/^[a-z]{6}$/.test(word) || state.claimed || state.words.includes(word)) return { state, reward: 0 };
    if (state.words.length < 3) state.words.push(word);
    const reward = state.words.length === 3 ? TRIO_REWARD : 0;
    if (reward) state.claimed = true;
    return { state, reward };
  }
  return Object.freeze({ TRIO_REWARD, RANK_POINTS, mastery, trio, recordSolve });
});
