/**
 * A terminal client for core/orchestrator — the whole system driven by
 * typing, with no microphone, no Tauri build and no Mac required.
 *
 * This exists because the voice path has a long setup tail (Rust toolchain,
 * macOS mic permission, WebView audio) and none of it is needed to find out
 * whether the *interesting* parts work: the persona, memory and session
 * recall, and Claude Code delegation with its spoken-confirmation gate.
 * Start core, run this, type at it.
 *
 *   pnpm dev:core          # terminal A
 *   pnpm cli               # terminal B
 *
 * Assistant audio still streams over the socket (core doesn't know or care
 * that its client has no speakers); this client ignores the audio frames and
 * prints the transcript of what was said instead.
 */
import { createInterface } from "node:readline";
import WebSocket from "ws";

const url = process.env.CORE_WS_URL ?? "ws://127.0.0.1:8787";
const token = process.env.CORE_AUTH_TOKEN ?? "";
const target = token ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}` : url;

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

/**
 * Lines typed (or piped) before the socket finishes connecting are held
 * here rather than sent into a CONNECTING socket, which throws. Piping
 * input — `printf '...' | pnpm cli` — delivers every line at once, well
 * before the connection is up, so this is the normal case for scripted
 * runs, not an edge case.
 */
const pending: string[] = [];
let open = false;

function sendText(text: string) {
  if (!open) {
    pending.push(text);
    return;
  }
  ws.send(JSON.stringify({ type: "text", text }));
}

console.log(dim(`connecting to ${url} …`));
const ws = new WebSocket(target);

const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });
let audioChunks = 0;

ws.on("open", () => {
  open = true;
  console.log(dim("connected. type a message, or Ctrl-C to quit.\n"));
  ws.send(JSON.stringify({ type: "wake" }));
  for (const queued of pending.splice(0)) sendText(queued);
  rl.prompt();
});

ws.on("message", (raw) => {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return;
  }
  switch (msg.type) {
    case "state":
      console.log(dim(`[${String(msg.state)}]`));
      break;
    case "userTranscript":
      // Echoed back by core; only interesting when it came from speech.
      break;
    case "assistantTranscript":
      console.log(`${bold("SHOGUN:")} ${String(msg.text)}`);
      break;
    case "assistantAudio":
      audioChunks++; // discarded — this client has no speakers
      break;
    case "taskStarted":
      console.log(dim(`🛠  delegating to Claude Code${msg.estimate ? ` (${String(msg.estimate)})` : ""}: ${String(msg.instruction)}`));
      break;
    case "taskFinished":
      console.log(`${msg.isError ? "⚠️ " : "✅"} ${String(msg.text)}`);
      break;
    case "error":
      console.error(`⚠️  ${String(msg.message)}`);
      break;
    default:
      break;
  }
  rl.prompt();
});

ws.on("close", (code, reason) => {
  open = false;
  console.log(dim(`\nconnection closed (${code}${reason.length ? `: ${reason.toString()}` : ""}). ${audioChunks} audio chunks were received and discarded.`));
  process.exit(0);
});

ws.on("error", (err) => {
  console.error(`⚠️  ${err.message}`);
  console.error(dim("is core running? start it with `pnpm dev:core` in another terminal."));
  process.exit(1);
});

rl.on("line", (line) => {
  const text = line.trim();
  if (text) sendText(text);
  else rl.prompt();
});

rl.on("SIGINT", () => {
  ws.close();
  rl.close();
});
