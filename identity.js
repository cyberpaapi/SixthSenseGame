(function () {
  "use strict";
  const KEY = "sixth-sense.global-identity.v1";
  const NAME_KEY = "sixth-sense.online.identity.v1";
  const BASE = document.documentElement.dataset.multiplayerApi || "";
  let pending;
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } }
  function save(profile) {
    localStorage.setItem(KEY, JSON.stringify(profile));
    localStorage.setItem(NAME_KEY, JSON.stringify({ name: profile.name }));
    document.dispatchEvent(new CustomEvent("sixth-sense-global-identity", { detail: { id: profile.id, name: profile.name } }));
    return profile;
  }
  function newToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, "0")).join(""); }
  async function request(action, identityToken, name) {
    let response;
    try {
      response = await fetch(`${BASE}/api/identity`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, identityToken, name }), signal: AbortSignal.timeout(12000) });
    } catch (_) { throw new Error("Connect to the internet to reserve or restore your username. Your saved solo game is still available."); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id || !data.name) throw Object.assign(new Error(data.error || "The username service is unavailable. Please try again."), { status: response.status });
    return data;
  }
  function exclusive(task) {
    if (pending) return Promise.reject(new Error("Please wait for the current username request."));
    pending = task().finally(() => { pending = null; });
    return pending;
  }
  async function reserve(name) {
    return exclusive(async () => {
      const old = read(), token = old.token || newToken();
      localStorage.setItem(KEY, JSON.stringify({ ...old, token }));
      const profile = await request("claim", token, name);
      return save({ ...profile, token });
    });
  }
  async function restore(code) {
    const token = String(code || "").trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Paste the complete 64-character recovery code.");
    return exclusive(async () => save({ ...await request("restore", token), token }));
  }
  async function ensure(name) {
    if (pending) await pending;
    const current = read();
    if (current.id && current.name === name) return current;
    return reserve(name);
  }
  async function refresh() {
    const current = read();
    if (current.id && current.token) return restore(current.token);
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(NAME_KEY)) || {}; } catch (_) { /* first visit */ }
    if (saved.name) return ensure(saved.name);
    return null;
  }
  window.SixthSenseIdentity = { reserve, restore, ensure, refresh, read, credential: () => { const p = read(); return p.id ? p.token : undefined; } };
  window.addEventListener("storage", event => {
    if (event.key !== KEY) return;
    const profile = read();
    if (profile.id) document.dispatchEvent(new CustomEvent("sixth-sense-global-identity", { detail: { id: profile.id, name: profile.name } }));
  });
})();
