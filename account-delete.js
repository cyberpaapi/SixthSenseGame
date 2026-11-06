(function () {
  "use strict";
  const dialog = document.querySelector("#account-delete-modal");
  const form = document.querySelector("#account-delete-form");
  const input = document.querySelector("#account-delete-confirmation");
  const message = document.querySelector("#account-delete-message");
  const submit = form.querySelector('[type="submit"]');
  const cancel = dialog.querySelector('[data-delete-cancel]');
  let busy = false;
  document.querySelector("#account-delete-open").addEventListener("click", () => {
    form.reset(); submit.disabled = true; message.textContent = "";
    dialog.showModal(); cancel.focus();
  });
  input.addEventListener("input", () => { submit.disabled = busy || input.value !== "DELETE"; });
  cancel.addEventListener("click", () => { if (!busy) dialog.close(); });
  dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (busy || input.value !== "DELETE") return;
    const identityToken = window.SixthSenseIdentity.credential();
    if (!identityToken) { message.textContent = "Restore your username with its recovery code first. Guest solo play has no multiplayer account to delete."; return; }
    busy = true; submit.disabled = cancel.disabled = true; input.disabled = true;
    message.textContent = "Deleting your multiplayer account…";
    try {
      const base = document.documentElement.dataset.multiplayerApi || "";
      const response = await fetch(`${base}/api/delete-identity`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ identityToken, confirmation: "DELETE" }), signal: AbortSignal.timeout(20000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.deleted !== true) throw new Error(result.error || "Your account could not be deleted. Please try again.");
      // Preserve solo progress, wallets and paid delivery ledgers on this device.
      for (const key of ["sixth-sense.global-identity.v1", "sixth-sense.online.identity.v1", "sixth-sense.active-room.v1", "sixth-sense.room-seats.v1", "sixth-sense.online-rewards.v1", "sixth-sense.presence.v1"]) localStorage.removeItem(key);
      location.reload();
    } catch (error) {
      message.textContent = error.name === "TimeoutError" || error.name === "TypeError"
        ? "Connect to the internet and try again. If deletion already completed, retrying is safe."
        : error.message;
      busy = false; submit.disabled = input.value !== "DELETE"; cancel.disabled = input.disabled = false;
    }
  });
})();
