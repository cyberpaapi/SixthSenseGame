(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SixthSenseStreak = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const DAY = 86400000;
  function snapshot(stats, now = Date.now()) {
    const date = stats.lastWinDate;
    const last = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(date + "T00:00:00Z") : NaN;
    const today = Math.floor(now / DAY) * DAY;
    const count = Math.max(0, Math.floor(Number(stats.currentStreak) || 0));
    const active = Number.isFinite(last) && (last === today || last === today - DAY) && count > 0;
    return { count: active ? count : 0, deadline: active ? last + 2 * DAY : 0 };
  }
  function win(stats, now = Date.now()) {
    const today = new Date(now).toISOString().slice(0, 10);
    const previous = new Date(now - DAY).toISOString().slice(0, 10);
    if (stats.lastWinDate === today) return false;
    const continues = stats.lastWinDate === previous && stats.currentStreak > 0;
    stats.currentStreak = continues ? stats.currentStreak + 1 : 1;
    if (!continues) stats.lastDailyRewardStreak = 0;
    stats.lastWinDate = today;
    stats.maxStreak = Math.max(Number(stats.maxStreak) || 0, stats.currentStreak);
    return true;
  }
  function expire(stats, now = Date.now()) {
    if (Number(stats.currentStreak) > 0 && snapshot(stats, now).count === 0) {
      stats.currentStreak = 0;
      stats.lastDailyRewardStreak = 0;
      return true;
    }
    return false;
  }
  return { snapshot, win, expire };
});
