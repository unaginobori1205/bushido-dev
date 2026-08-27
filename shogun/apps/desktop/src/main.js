/**
 * SHOGUN desktop frontend — MVP0.1. Vanilla JS, no bundler (see
 * index.html's comment). Connects to core/orchestrator's WebSocket
 * (either the local dev server or a cloud-hosted one — see
 * docs/DEPLOYMENT.md and settings.js), captures mic audio once woken,
 * plays back streamed TTS audio, and renders the four MVP0.1 states.
 */
import { getSettings, buildWsUrl, initSettingsUI } from "./settings.js";

const dot = document.getElementById("dot");
const stateLabel = document.getElementById("state-label");
const transcriptEl = document.getElementById("transcript");
const connectionWarning = document.getElementById("connection-warning");

let ws = null;
let audioCtx = null;
let micStream = null;
let workletNode = null;
let playbackCursor = 0; // audioCtx.currentTime cursor for gapless sequential playback

function setState(state) {
  dot.dataset.state = state;
  stateLabel.textContent = { IDLE: "SHOGUN", LISTENING: "聞いています…", THINKING: "考えています…", SPEAKING: "話しています…", CONFIRMING: "確認中…", EXECUTING: "実行中…" }[state] ?? state;
  if (state === "IDLE") {
    stopMicCapture();
  }
}

function appendTranscript(prefix, text) {
  const line = document.createElement("div");
  line.textContent = `${prefix} ${text}`;
  transcriptEl.appendChild(line);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

// ---- Core WebSocket -------------------------------------------------

let reconnectTimer = null;

function connectCore() {
  clearTimeout(reconnectTimer);
  const { coreUrl, token } = getSettings();
  ws = new WebSocket(buildWsUrl(coreUrl, token));

  ws.addEventListener("open", () => {
    connectionWarning.hidden = true;
  });

  ws.addEventListener("close", () => {
    connectionWarning.hidden = false;
    // Simple bounded reconnect — the core process may be a local dev
    // server started a moment after the desktop shell, or a cloud host
    // that's momentarily unreachable; this just recovers either way.
    reconnectTimer = setTimeout(connectCore, 2000);
  });

  ws.addEventListener("error", () => {
    connectionWarning.hidden = false;
  });

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    switch (msg.type) {
      case "state":
        setState(msg.state);
        break;
      case "userTranscript":
        appendTranscript("🎤", msg.text);
        break;
      case "assistantTranscript":
        appendTranscript("🗾", msg.text);
        break;
      case "assistantAudio":
        playPcm16(msg.data);
        break;
      case "error":
        appendTranscript("⚠️", msg.message);
        break;
      default:
        break;
    }
  });
}

function sendToCore(payload) {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

// ---- Mic capture ------------------------------------------------------

async function startMicCapture() {
  if (micStream) return; // already capturing this session
  audioCtx ??= new AudioContext({ sampleRate: 24000 });
  await audioCtx.audioWorklet.addModule("./pcm-worklet.js");

  micStream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  const source = audioCtx.createMediaStreamSource(micStream);
  workletNode = new AudioWorkletNode(audioCtx, "pcm-capture-processor");
  workletNode.port.onmessage = (ev) => {
    const bytes = new Uint8Array(ev.data);
    sendToCore({ type: "audio", data: bytesToBase64(bytes) });
  };
  // Intentionally not connected to audioCtx.destination — we only want to
  // forward frames to core, never loop the mic back to the speakers.
  source.connect(workletNode);
}

function stopMicCapture() {
  micStream?.getTracks().forEach((t) => t.stop());
  micStream = null;
  workletNode?.disconnect();
  workletNode = null;
}

// ---- TTS playback -------------------------------------------------------

function playPcm16(base64) {
  audioCtx ??= new AudioContext({ sampleRate: 24000 });
  const bytes = base64ToBytes(base64);
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);

  const buffer = audioCtx.createBuffer(1, int16.length, 24000);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < int16.length; i++) channel[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff);

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  const startAt = Math.max(now, playbackCursor);
  source.start(startAt);
  playbackCursor = startAt + buffer.duration;
}

// ---- base64 helpers (Tauri's WebView has btoa/atob but not Buffer) ------

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ---- Wake / sleep, driven by the Rust tray/global-shortcut handler ------

async function onWake() {
  sendToCore({ type: "wake" });
  try {
    await startMicCapture();
  } catch (err) {
    appendTranscript("⚠️", `マイクにアクセスできません: ${err.message}`);
  }
}

connectCore();
initSettingsUI({
  onSave: () => {
    ws?.close();
    connectCore(); // reconnect immediately with the new settings instead of waiting for the 2s auto-retry
  },
});

if (window.__TAURI__) {
  const { listen } = window.__TAURI__.event;
  listen("shogun://wake", onWake);
  // "shogun://sleep" (panel hidden) is a UI-only hint; the *conversation*
  // SLEEP transition is driven by core detecting "おやすみ"/"終わり" in the
  // transcript (see core/orchestrator/server.ts) so closing the panel
  // doesn't itself discard an in-progress turn. We still stop the mic here
  // as a privacy measure the moment the panel is hidden.
  listen("shogun://sleep", stopMicCapture);
} else {
  // Running in a plain browser during frontend-only development — no tray/
  // shortcut, so let a click on the panel itself act as WAKE.
  document.getElementById("panel").addEventListener("click", onWake, { once: true });
}
