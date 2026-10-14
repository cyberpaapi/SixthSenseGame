/* Android-only local reminders. No push service or web notification permission. */
(function () {
  "use strict";
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return;
  const native = cap.registerPlugin("StreakReminders");
  const section = document.querySelector("#streak-reminder-settings");
  const toggle = document.querySelector("#streak-reminders");
  const status = document.querySelector("#streak-reminder-status");
  section.hidden = false;
  let queue = Promise.resolve();
  function render(state) {
    toggle.checked = Boolean(state.enabled);
    status.textContent = state.enabled ? (state.allowed
      ? "Fox reminders 12, 6 and 3 hours before Daily resets. Includes overnight reminders; Android may delay delivery."
      : "Blocked by Android. Allow Sixth Sense notifications in your phone’s app settings, or switch reminders off.")
      : "Optional fox reminders to save your Daily streak. Includes overnight reminders. Off until you enable them.";
  }
  function enqueue(action) {
    queue = queue.then(action).catch(() => {
      status.textContent = "Couldn’t update reminders. Reopen Settings and try again.";
    });
    return queue;
  }
  function sync() {
    return enqueue(async () => render(await native.sync(window.SixthSenseDailyStreak.state())));
  }
  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    toggle.disabled = true;
    void enqueue(async () => {
      // Save current progress before a permission dialog can background the app.
      await native.sync(window.SixthSenseDailyStreak.state());
      render(await native.setEnabled({ enabled }));
    }).finally(() => { toggle.disabled = false; });
  });
  async function openPendingDaily() {
    try {
      const launch = await native.consumeLaunch();
      if (launch.openDaily) {
        await window.SixthSenseNativeOnboarding;
        window.SixthSenseDailyStreak.open();
      }
    } catch (_) { /* Older native shells have no reminder bridge. */ }
  }
  document.addEventListener("sixth-sense-streak-change", sync);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { void sync(); void openPendingDaily(); } });
  document.addEventListener("sixth-sense-native-active", event => { if (event.detail?.isActive) { void sync(); void openPendingDaily(); } });
  void native.addListener("openDaily", openPendingDaily).catch(() => {});
  void sync();
  void openPendingDaily();
})();
