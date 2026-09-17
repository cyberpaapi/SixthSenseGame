(function () {
  "use strict";
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  const native = cap.registerPlugin("SenseiMonetization");
  const app = cap.registerPlugin("App");
  const reward = document.querySelector("#reward-ad-button");
  const lastChanceAd = document.querySelector("#last-chance-ad");
  const lastChanceMessage = document.querySelector("#last-chance-ad-message");
  let lastChanceFeedback = "";
  const rewardMessage = document.querySelector("#reward-ad-message");
  const storeMessage = document.querySelector("#store-message");
  const purchase = document.querySelector("#remove-ads-button");
  const privacyOptions = document.querySelector("#ad-privacy-options");
  const ageDialog = document.querySelector("#age-band-modal");
  let state = {}, busy = false, recovering = false, bannerVisible = null, rewardFeedback = "", offerId = "";
  document.body.classList.add("is-native-app");
  document.querySelector("#mobile-store").hidden = false;

  let adCloseTimer;
  function signalRewardAd(active) {
    clearTimeout(adCloseTimer);
    const notify = () => document.dispatchEvent(new CustomEvent("sixth-sense-ad-active", { detail: active }));
    if (active) notify(); else adCloseTimer = setTimeout(notify, 500); // Allow native foreground callbacks to settle.
  }

  function render() {
    purchase.textContent = state.owned ? "Banner ads removed ✓" : state.price ? `Remove banner ads · ${state.price}` : "Remove banner ads · unavailable";
    purchase.disabled = state.owned || !state.eligible || !state.price || state.purchaseBusy;
    privacyOptions.hidden = !state.privacyOptionsRequired;
    storeMessage.textContent = state.message || "One-time purchase. Optional rewarded ads remain available.";
    let offer;
    try { offer = window.SixthSenseRewards?.offer(); } catch (_) { rewardMessage.textContent = "Free up storage before claiming a reward."; }
    const visible = Boolean(offer && state.eligible);
    document.querySelector("#reward-ad-offer").hidden = !visible;
    if (visible) {
      if (offerId !== offer.claimId) { offerId = offer.claimId; rewardFeedback = ""; }
      reward.disabled = busy || offer.claimed || offer.room <= 0 || state.rewardLoading;
      reward.textContent = offer.claimed ? "3× reward collected ✓" : offer.room <= 0 ? "Wallet full" : busy ? "Opening reward ad…" : state.rewardLoading ? "Loading reward ad…" : `Watch ad · ${offer.base * 3} solve coins total`;
      rewardMessage.textContent = rewardFeedback || (offer.claimed ? "Your extra coins are in your wallet." : `Optional · adds ${Math.min(offer.coins, offer.room)} coins. Other bonuses stay the same.`);
    }
    let lastChance;
    try { lastChance = window.SixthSenseLastChance?.offer(); } catch (_) { lastChanceFeedback = "Free up device storage before watching an ad."; }
    lastChanceAd.hidden = !state.eligible || !lastChance;
    lastChanceAd.disabled = busy || state.rewardLoading;
    lastChanceAd.textContent = busy ? "Opening reward ad…" : state.rewardLoading ? "Loading reward ad…" : "Watch ad · +1 try";
    lastChanceMessage.textContent = lastChanceFeedback;
    document.querySelector("#last-chance-buy").disabled = busy;
    document.querySelector("#last-chance-decline").disabled = busy;
    updateBanner();
  }
  async function recover() {
    if (recovering || !state.pendingReward?.claimId) return;
    recovering = true;
    try {
      const receipt = state.pendingReward;
      if (receipt.kind?.startsWith("last-chance")) await window.SixthSenseLastChance.applyReceipt(receipt);
      else window.SixthSenseRewards.applyReceipt(receipt);
      await native.acknowledgeReward({ claimId: receipt.claimId });
      rewardFeedback = ""; lastChanceFeedback = "";
      state = await native.getState();
    } catch (error) {
      if (state.pendingReward?.kind?.startsWith("last-chance")) lastChanceFeedback = "Reward saved. Check connection and device storage, then tap again to retry.";
      else rewardFeedback = "Reward saved. Free up device storage and reopen the app to collect it.";
    }
    finally { recovering = false; render(); }
  }
  function updateBanner() {
    const visible = ["home", "game", "online"].includes(document.body.dataset.screen) && !document.querySelector("dialog[open]") && !state.owned && state.eligible && !document.hidden;
    if (visible !== bannerVisible) {
      bannerVisible = visible;
      native.setBanner({ visible: Boolean(visible) }).catch(() => {});
    }
  }
  // Native banners reduce the WebView itself. Fit non-interactive tiles to the
  // remaining board space while keeping the keyboard and lifelines reachable.
  const fitBoards = () => {
    document.querySelectorAll(".board-wrap").forEach(wrap => {
      const board = wrap.querySelector(".board");
      if (!board || !wrap.clientHeight || !wrap.clientWidth) return;
      const bounds = wrap.getBoundingClientRect();
      const rows = board.children.length || window.SixthSenseCore.MAX_GUESSES;
      const padding = parseFloat(getComputedStyle(wrap).paddingRight) + parseFloat(getComputedStyle(wrap).paddingLeft);
      const size = Math.floor(Math.min(52, (bounds.width - padding - 25) / 6, (bounds.height - 2 - (rows - 1) * 4) / rows));
      board.style.setProperty("--native-tile-size", `${Math.max(12, size)}px`);
    });
  };
  const boardResize = new ResizeObserver(fitBoards);
  document.querySelectorAll(".board-wrap").forEach(wrap => {
    boardResize.observe(wrap);
    new MutationObserver(fitBoards).observe(wrap, { subtree: true, attributes: true, attributeFilter: ["class"], childList: true });
  });
  lastChanceAd.addEventListener("click", async () => {
    if (busy) return;
    if (state.pendingReward?.claimId) { await recover(); return; }
    let offer;
    try { offer = window.SixthSenseLastChance.offer(); } catch (_) { lastChanceFeedback = "Free up device storage before watching an ad."; render(); return; }
    if (!offer || !state.eligible) return;
    busy = true; lastChanceFeedback = ""; render(); window.SixthSenseAppLifecycle.pause();
    try {
      if (!state.rewardReady) {
        state = await native.prepareReward();
        lastChanceFeedback = "Loading an ad. Tap again when it is ready.";
      } else {
        signalRewardAd(true);
        state = await native.showReward(offer);
        if (state.pendingReward?.claimId) await recover();
        else lastChanceFeedback = "Ad closed before a reward was earned. No coins were spent.";
      }
    } catch (error) { lastChanceFeedback = error.message || "Ad unavailable. No coins were spent."; }
    finally { busy = false; signalRewardAd(false); window.SixthSenseAppLifecycle.resume(); render(); }
  });
  document.addEventListener("sixth-sense-last-chance-rendered", () => { lastChanceFeedback = ""; render(); if (!busy) recover(); });
  reward.addEventListener("click", async () => {
    if (busy) return;
    const offer = window.SixthSenseRewards.offer();
    if (!offer || offer.claimed || offer.room <= 0) return;
    if (!state.rewardReady) {
      await native.prepareReward();
      rewardFeedback = "Loading an ad. Tap again when it is ready; you can also continue playing."; render();
      return;
    }
    busy = true; rewardFeedback = ""; render(); window.SixthSenseAppLifecycle.pause();
    try {
      signalRewardAd(true);
      state = await native.showReward({ claimId: offer.claimId, coins: offer.coins });
      await recover();
      if (!window.SixthSenseRewards.offer()?.claimed) rewardFeedback = "Ad closed before a reward was earned. Your original coins are unchanged.";
    } catch (error) { rewardFeedback = error.message || "Ad unavailable. Your original coins are unchanged."; }
    finally { busy = false; signalRewardAd(false); window.SixthSenseAppLifecycle.resume(); render(); }
  });
  purchase.addEventListener("click", async () => {
    try { await native.purchaseRemoveAds(); } catch (error) { storeMessage.textContent = error.message; }
  });
  document.querySelector("#restore-purchases-button").addEventListener("click", async () => {
    try { await native.restorePurchases(); } catch (error) { storeMessage.textContent = error.message; }
  });
  privacyOptions.addEventListener("click", async () => {
    try { state = await native.privacyOptions(); render(); } catch (error) { storeMessage.textContent = error.message; }
  });
  document.querySelectorAll('[data-open-privacy]').forEach(button => button.addEventListener("click", () => {
    const frame = document.querySelector("[data-privacy-document]");
    if (!frame.getAttribute("src")) frame.src = frame.dataset.privacyDocument;
    document.querySelector("#privacy-modal").showModal();
  }));
  document.addEventListener("sixth-sense-result-rendered", render);
  new MutationObserver(updateBanner).observe(document.body, { attributes: true, attributeFilter: ["data-screen", "open"], subtree: true });
  document.addEventListener("visibilitychange", updateBanner);
  app.addListener("appStateChange", ({ isActive }) => {
    document.dispatchEvent(new CustomEvent("sixth-sense-native-active", { detail: isActive }));
    if (isActive) { if (!busy) window.SixthSenseAppLifecycle.resume(); native.getState().then(next => { state = next; render(); recover(); }); }
    else window.SixthSenseAppLifecycle.pause();
  });
  app.addListener("backButton", () => {
    if (busy || ageDialog.open) return;
    const dialog = [...document.querySelectorAll("dialog[open]")].pop();
    if (dialog) {
      const event = new Event("cancel", { cancelable: true });
      if (dialog.dispatchEvent(event)) dialog.close();
    } else if (document.body.dataset.screen === "home") app.exitApp();
    else window.SixthSenseAppLifecycle.back();
  });
  ageDialog.addEventListener("cancel", event => event.preventDefault());
  ageDialog.querySelectorAll("[data-age-band]").forEach(button => button.addEventListener("click", async () => {
    ageDialog.close(); state = await native.initialize({ ageBand: button.dataset.ageBand }); render(); recover();
  }));
  native.addListener("stateChanged", next => { state = next; render(); if (!busy) recover(); });
  native.getState().then(async next => {
    state = next;
    if (!state.ageBand) ageDialog.showModal();
    else state = await native.initialize({ ageBand: state.ageBand });
    render(); await recover();
  }).catch(() => { storeMessage.textContent = "Store services unavailable. You can keep playing."; });
})();
