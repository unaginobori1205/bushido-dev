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
 *   ← { type: "taskStarted", instruction, estimate }   delegated to Claude Code
 *   ← { type: "taskFinished", isError, text }
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
import { parseDelegateIntent, toPendingAction } from "../intent-router/index.js";
import { ClaudeBridge, assertRunnableHere, parseExtraArgs } from "../../ai/claude/claudeBridge.js";
import { SessionStore } from "../../ai/claude/sessionStore.js";
import { requiresConfirmation } from "../permissions/index.js";
import { homedir } from "node:os";
import { join } from "node:path";

const SLEEP_PATTERN = /(終わり|おやすみ|お疲れ様でした|バイバイ)/;

function today(now: Date): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC; see SHOGUN_TIMEZONE note in config for a future improvement)
}

/**
 * Runtime guidance appended to the persona. Kept here rather than edited
 * into prompts/shogun-system.md because that file is the product spec's
 * persona verbatim (§19) — this is operational detail about *this* build's
 * capabilities, which changes as milestones land.
 */
function delegationGuidance(config: ReturnType<typeof getConfig>): string {
  if (!config.CLAUDE_DELEGATION_ENABLED) {
    return [
      "You currently have NO ability to run tasks on the user's computer — the delegation tool is disabled.",
      "If the user asks for work that would need it, say plainly that task execution is not enabled yet",
      "rather than pretending to start it.",
    ].join(" ");
  }
  return [
    `When the user asks for actual work on their computer, call ${"`delegate_to_claude_code`"}.`,
    "Before calling it, say out loud in one short sentence that you are starting, plus a rough time estimate.",
    "While it runs you stay available — keep answering the user normally.",
    "When it finishes you will be told the outcome; report it in two or three sentences, outcome first.",
    "Never read file contents, code, or long output aloud.",
  ].join(" ");
}

function loadSystemPrompt(recap: string, config: ReturnType<typeof getConfig>): string {
  const base = readFileSync(new URL("../../prompts/shogun-system.md", import.meta.url), "utf8");
  return [
    base,
    "---",
    `Context for this session — the user's most recent prior daily record:\n${recap}`,
    "---",
    delegationGuidance(config),
  ].join("\n\n");
}

async function main() {
  const config = getConfig();
  assertBindingIsSafe(config.CORE_WS_HOST, config.CORE_AUTH_TOKEN);
  const db = openDatabase(config.DATABASE_URL);
  const dailyMemory = new DailyMemory(db);
  const workingMemory = new WorkingMemory();

  const now = new Date();
  const recap = summarizeDailyRecord(dailyMemory.getLatestBefore(today(now)));
  const systemPrompt = loadSystemPrompt(recap, config);

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
  let lastUserTurnAt = 0;
  /** Instruction proposed but not yet confirmed, and when we asked. */
  let awaitingConfirmation: { instruction: string; askedAt: number } | null = null;

  const claudeCwd = config.CLAUDE_CWD || process.cwd();
  const claudeBridge = new ClaudeBridge({
    claudeBin: config.CLAUDE_BIN,
    cwd: claudeCwd,
    extraArgs: parseExtraArgs(config.CLAUDE_EXTRA_ARGS),
    timeoutMs: config.CLAUDE_TIMEOUT_MS,
    sessionStore: new SessionStore(config.CLAUDE_SESSION_FILE || join(homedir(), ".shogun", "claude-sessions.json")),
  });

  const send = (payload: Record<string, unknown>) => {
    if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(payload));
  };

  sm.onTransition((state) => send({ type: "state", state }));

  const saveSessionEnd = () => {
    const now = Date.now();
    dailyMemory.appendNote(today(new Date(now)), workingMemory.toTranscript().slice(0, 4000), now);
  };

  realtime.on("userTranscript", ({ text }) => {
    lastUserTurnAt = Date.now();
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

  /**
   * Delegation to Claude Code. The model decides *that* a turn is work
   * (core/intent-router); everything about whether it actually runs is
   * decided here, because a tool call is a request to act, not permission
   * to act (docs/ARCHITECTURE.md §5).
   *
   * Confirmation flow: the first call is always refused with "ask the user
   * first". Only a second call carrying confirmed:true — *and* with a real
   * user turn observed after that refusal — executes. That second condition
   * is the part the model can't fake: it can claim the user agreed, but it
   * can't manufacture a `conversation.item.input_audio_transcription`
   * event, so a self-confirming model still can't run anything.
   */
  realtime.on("toolCall", ({ callId, name, argumentsJson }) => {
    const intent = parseDelegateIntent(callId, name, argumentsJson);
    if (!intent) {
      realtime.sendToolResult(callId, "Malformed tool call — ignored. Ask the user to restate the task.");
      return;
    }

    if (!config.CLAUDE_DELEGATION_ENABLED) {
      realtime.sendToolResult(
        callId,
        "Task execution is not enabled on this install (CLAUDE_DELEGATION_ENABLED=false). Tell the user plainly; do not retry.",
      );
      return;
    }

    try {
      assertRunnableHere(config.CORE_WS_HOST);
    } catch (err) {
      realtime.sendToolResult(callId, err instanceof Error ? err.message : String(err));
      return;
    }

    const action = toPendingAction(intent);
    const needsConfirmation = requiresConfirmation(action) && config.CLAUDE_REQUIRE_CONFIRMATION;
    const userSpokeSinceAsking = awaitingConfirmation !== null && lastUserTurnAt > awaitingConfirmation.askedAt;

    if (needsConfirmation && !(intent.confirmed && userSpokeSinceAsking)) {
      awaitingConfirmation = { instruction: intent.instruction, askedAt: Date.now() };
      logAction(db, {
        timestamp: Date.now(),
        userRequest: intent.instruction,
        intent: "delegate_to_claude_code",
        tool: "claude-code",
        permissionLevel: action.level,
        confirmation: "requested",
        result: "awaiting confirmation",
      });
      realtime.sendToolResult(
        callId,
        "NOT executed yet. Read the task back to the user in one sentence and ask them to confirm out loud. " +
          "If they say yes, call this tool again with the same instruction and confirmed: true.",
      );
      return;
    }

    awaitingConfirmation = null;
    sm.handle("CONFIRMATION_NEEDED");
    sm.handle("CONFIRMED"); // → EXECUTING; the conversation stays live while this runs
    logAction(db, {
      timestamp: Date.now(),
      userRequest: intent.instruction,
      intent: "delegate_to_claude_code",
      tool: "claude-code",
      parameters: { cwd: claudeCwd, estimate: intent.estimate },
      permissionLevel: action.level,
      confirmation: config.CLAUDE_REQUIRE_CONFIRMATION ? "confirmed by user" : "standing consent (confirmation disabled)",
      result: "started",
    });
    send({ type: "taskStarted", instruction: intent.instruction, estimate: intent.estimate ?? null });
    console.log(`[shogun-core] delegating to Claude Code in ${claudeCwd}: ${intent.instruction}`);

    // Deliberately not awaited: the user keeps talking to SHOGUN while
    // Claude Code works, which is the whole point of delegating.
    void claudeBridge
      .run(intent.instruction)
      .then((result) => {
        logAction(db, {
          timestamp: Date.now(),
          userRequest: intent.instruction,
          intent: "delegate_to_claude_code",
          tool: "claude-code",
          permissionLevel: action.level,
          result: result.isError ? `error: ${result.text.slice(0, 500)}` : result.text.slice(0, 2000),
        });
        workingMemory.push({ role: "assistant", text: `[Claude Code] ${result.text}`.slice(0, 2000), at: Date.now() });
        send({ type: "taskFinished", isError: result.isError, text: result.text });
        sm.handle("EXECUTION_DONE");
        realtime.sendToolResult(callId, result.text.slice(0, 4000) || "(no output)");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[shogun-core] delegation failed:", message);
        send({ type: "taskFinished", isError: true, text: message });
        sm.handle("EXECUTION_DONE");
        realtime.sendToolResult(callId, `The task failed to run: ${message}`);
      });
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
        // Typed fallback (spec §16: "キーボード入力は補助"), and the path
        // tools/cli.ts uses to exercise the whole system without a mic.
        // Treated exactly like a spoken turn from here on — including
        // counting as a real user turn for delegation confirmation, which
        // is why lastUserTurnAt is set here too.
        const text = (msg.text as string | undefined)?.trim();
        if (!text) break;
        lastUserTurnAt = Date.now();
        workingMemory.push({ role: "user", text, at: Date.now() });
        logAction(db, { timestamp: Date.now(), userRequest: text, intent: "conversation", tool: null });
        send({ type: "userTranscript", text });
        sm.handle("USER_UTTERANCE");
        realtime.sendUserText(text);
        if (SLEEP_PATTERN.test(text)) {
          saveSessionEnd();
          sm.handle("SLEEP");
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
