/**
 * core/orchestrator — MVP0.1 composition root.
 *
 * Runs as a local Node process (`pnpm dev:core`) and exposes a plain
 * WebSocket server on `CORE_WS_PORT` (default 8787) that the Tauri
 * frontend (apps/desktop) connects to — see docs/ARCHITECTURE.md's
 * "local IPC" note. This file wires the already-unit-tested pieces
 * (ConversationStateMachine, WorkingMemory, DailyMemory, RealtimeClient)
 * together; it intentionally has little logic of its own to keep the
 * testable logic in those modules instead.
 *
 * Frontend ⇄ core wire protocol (JSON over the WebSocket):
 *   → { type: "wake" }                          user opened the panel
 *   → { type: "audio", data: "<base64 pcm16>" }  one mic chunk (24kHz)
 *   → { type: "text", text: "..." }              typed fallback input
 *   ← { type: "state", state: "IDLE"|... }
 *   ← { type: "userTranscript", text }
 *   ← { type: "assistantAudio", data: "<base64 pcm16>" }
 *   ← { type: "assistantTranscript", text }
 *   ← { type: "error", message }
 *
 * Cloud deployment (docs/DEPLOYMENT.md): this same process is what you run
 * on a small persistent host so it stays up when the user's Mac is off —
 * the desktop shell just points CORE_WS_URL at `wss://<host>/?token=...`
 * instead of `ws://127.0.0.1:8787`. Auth is a single shared secret
 * (CORE_AUTH_TOKEN) checked in `authorize()` below; see docs/SECURITY.md
 * for why that's the right amount of auth for a single-user personal
 * server and what it deliberately doesn't cover (no per-request
 * authorization levels — Permission Level, §5, is a separate, later
 * concern from "is this even SHOGUN's owner connecting at all").
 */
import { readFileSync } from "node:fs";
import { WebSocketServer, type WebSocket } from "ws";
import { getConfig } from "../../config.js";
import { openDatabase } from "../../database/db.js";
import { logAction } from "../../database/actionLog.js";
import { DailyMemory, summarizeDailyRecord } from "../../memory/daily/index.js";
import { WorkingMemory } from "../../memory/working/index.js";
import { RealtimeClient } from "../../ai/openai/realtimeClient.js";
import { ConversationStateMachine } from "./stateMachine.js";
import { assertBindingIsSafe, authorize } from "./auth.js";

const SLEEP_PATTERN = /(終わり|おやすみ|お疲れ様でした|バイバイ)/;

function today(now: Date): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC; see SHOGUN_TIMEZONE note in config for a future improvement)
}

function loadSystemPrompt(recap: string): string {
  const base = readFileSync(new URL("../../prompts/shogun-system.md", import.meta.url), "utf8");
  return `${base}\n\n---\n\nContext for this session — the user's most recent prior daily record:\n${recap}`;
}

async function main() {
  const config = getConfig();
  assertBindingIsSafe(config.CORE_WS_HOST, config.CORE_AUTH_TOKEN);
  const db = openDatabase(config.DATABASE_URL);
  const dailyMemory = new DailyMemory(db);
  const workingMemory = new WorkingMemory();

  const now = new Date();
  const recap = summarizeDailyRecord(dailyMemory.getLatestBefore(today(now)));
  const systemPrompt = loadSystemPrompt(recap);

  const wss = new WebSocketServer({ host: config.CORE_WS_HOST, port: config.CORE_WS_PORT });
  console.log(`[shogun-core] listening on ws://${config.CORE_WS_HOST}:${config.CORE_WS_PORT}${config.CORE_AUTH_TOKEN ? " (token required)" : ""}`);
  console.log(`[shogun-core] recap for this session:\n${recap}`);

  wss.on("connection", (socket, req) => {
    if (!authorize(req, config.CORE_AUTH_TOKEN)) {
      socket.close(1008, "unauthorized"); // policy violation — see docs/SECURITY.md
      return;
    }
    handleConnection(socket, config, systemPrompt, workingMemory, dailyMemory, db);
  });
}

async function handleConnection(
  socket: WebSocket,
  config: ReturnType<typeof getConfig>,
  systemPrompt: string,
  workingMemory: WorkingMemory,
  dailyMemory: DailyMemory,
  db: ReturnType<typeof openDatabase>,
) {
  const sm = new ConversationStateMachine();
  const realtime = new RealtimeClient(config, systemPrompt);
  let muted = false;
  let unmuteTimer: NodeJS.Timeout | null = null;

  const send = (payload: Record<string, unknown>) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload));
  };

  sm.onTransition((state) => send({ type: "state", state }));

  const saveSessionEnd = () => {
    const now = Date.now();
    dailyMemory.appendNote(today(new Date(now)), workingMemory.toTranscript().slice(0, 4000), now);
  };

  realtime.on("userTranscript", ({ text }) => {
    workingMemory.push({ role: "user", text, at: Date.now() });
    logAction(db, { timestamp: Date.now(), userRequest: text, intent: "conversation", tool: null });
    send({ type: "userTranscript", text });
    sm.handle("USER_UTTERANCE");

    if (SLEEP_PATTERN.test(text)) {
      saveSessionEnd();
      sm.handle("SLEEP");
    }
  });

  realtime.on("assistantTranscript", ({ text }) => {
    workingMemory.push({ role: "assistant", text, at: Date.now() });
    send({ type: "assistantTranscript", text });
  });

  realtime.on("speechStart", () => {
    sm.handle("ASSISTANT_SPEECH_START");
    if (config.INTERRUPTION_MODE === "mute-while-speaking") muted = true;
  });

  realtime.on("speechDelta", ({ audio }) => {
    send({ type: "assistantAudio", data: audio.toString("base64") });
  });

  realtime.on("speechEnd", () => {
    sm.handle("ASSISTANT_SPEECH_END");
    if (config.INTERRUPTION_MODE === "mute-while-speaking") {
      if (unmuteTimer) clearTimeout(unmuteTimer);
      unmuteTimer = setTimeout(() => {
        muted = false;
      }, config.POST_SPEECH_MUTE_MS);
    }
  });

  realtime.on("error", ({ error }) => {
    console.error("[shogun-core] realtime error:", error);
    send({ type: "error", message: error.message });
  });

  try {
    await realtime.connect();
  } catch (err) {
    // Connection failure already reached the client via the "error"
    // listener above (RealtimeClient emits before rejecting) — this catch
    // exists purely so a bad/expired OPENAI_API_KEY or an unreachable
    // Realtime API doesn't crash the whole server for every other
    // connected client. Close this one connection and stop.
    console.error("[shogun-core] failed to connect to OpenAI Realtime API:", err);
    socket.close(1011, "upstream connection failed");
    return;
  }

  socket.on("message", (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (msg.type) {
      case "wake":
        sm.handle("WAKE");
        break;
      case "audio": {
        if (muted) return; // interruption_mode: "mute-while-speaking" — drop, don't forward
        const b64 = msg.data as string | undefined;
        if (b64) realtime.appendAudio(Buffer.from(b64, "base64"));
        break;
      }
      case "text": {
        // Typed fallback (spec §16: "キーボード入力は補助"). Fed straight to
        // the model as an out-of-band nudge is unnecessary here — simplest
        // MVP0.1 handling is to just log+relay it the same as a transcript.
        const text = msg.text as string | undefined;
        if (text) {
          workingMemory.push({ role: "user", text, at: Date.now() });
          send({ type: "userTranscript", text });
          sm.handle("USER_UTTERANCE");
        }
        break;
      }
      default:
        break;
    }
  });

  socket.on("close", () => {
    saveSessionEnd(); // best-effort autosave on unexpected disconnect (task #7)
    realtime.close();
  });
}

main().catch((err) => {
  console.error("[shogun-core] fatal:", err);
  process.exit(1);
});
