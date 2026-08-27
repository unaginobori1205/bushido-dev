/**
 * Where to find core/orchestrator, and how to authenticate to it.
 *
 * MVP0.1 default is local dev (`ws://127.0.0.1:8787`, no token — see
 * core/orchestrator/auth.ts, which only allows a tokenless server on
 * loopback in the first place). Pointing this at a cloud-hosted core
 * (docs/DEPLOYMENT.md) just means changing these two values — no other
 * code in this app cares whether core is next door or on a server.
 *
 * Stored in localStorage rather than a settings file: this is a Tauri
 * WebView, and localStorage is the simplest thing that persists across
 * launches without adding a Rust-side settings command for MVP0.1.
 */

const STORAGE_KEY_URL = "shogun.coreUrl";
const STORAGE_KEY_TOKEN = "shogun.coreToken";
const DEFAULT_CORE_URL = "ws://127.0.0.1:8787";

export function getSettings() {
  return {
    coreUrl: localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_CORE_URL,
    token: localStorage.getItem(STORAGE_KEY_TOKEN) || "",
  };
}

export function saveSettings({ coreUrl, token }) {
  localStorage.setItem(STORAGE_KEY_URL, coreUrl || DEFAULT_CORE_URL);
  localStorage.setItem(STORAGE_KEY_TOKEN, token || "");
}

/** Appends `?token=...` for a token-protected core (see core/orchestrator/auth.ts). */
export function buildWsUrl(coreUrl, token) {
  if (!token) return coreUrl;
  const separator = coreUrl.includes("?") ? "&" : "?";
  return `${coreUrl}${separator}token=${encodeURIComponent(token)}`;
}

/**
 * Wires up the small gear-toggle settings form in index.html. Call once at
 * startup. `onSave` is invoked after the new values are persisted, so the
 * caller can reconnect.
 */
export function initSettingsUI({ onSave }) {
  const toggle = document.getElementById("settings-toggle");
  const panel = document.getElementById("settings-panel");
  const urlInput = document.getElementById("settings-core-url");
  const tokenInput = document.getElementById("settings-core-token");
  const saveButton = document.getElementById("settings-save");
  if (!toggle || !panel || !urlInput || !tokenInput || !saveButton) return; // markup not present (e.g. a stripped-down test page)

  const { coreUrl, token } = getSettings();
  urlInput.value = coreUrl;
  tokenInput.value = token;

  // Any click inside the settings panel (typing into the inputs included)
  // shouldn't bubble up to #panel's browser-fallback WAKE handler — see
  // the toggle handler's comment below for why that matters.
  panel.addEventListener("click", (event) => event.stopPropagation());

  toggle.addEventListener("click", (event) => {
    // Stop this from bubbling to #panel, which (outside Tauri, in the
    // plain-browser dev fallback — see main.js) treats a click anywhere
    // on the panel as WAKE. Also just correct behavior for a nested
    // control in general.
    event.stopPropagation();
    panel.hidden = !panel.hidden;
  });

  saveButton.addEventListener("click", (event) => {
    event.stopPropagation();
    saveSettings({ coreUrl: urlInput.value.trim(), token: tokenInput.value.trim() });
    panel.hidden = true;
    onSave?.();
  });
}
