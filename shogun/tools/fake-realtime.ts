/**
 * A stand-in for the OpenAI Realtime API, for developing and testing the
 * orchestrator offline — no API key, no audio, no network.
 *
 *   pnpm fake:openai                                   # terminal A
 *   OPENAI_API_KEY=x OPENAI_REALTIME_URL=ws://127.0.0.1:8799 \
 *     CLAUDE_DELEGATION_ENABLED=true pnpm dev:core     # terminal B
 *   pnpm cli                                           # terminal C
 *
 * It is deliberately dumb: it does not understand language. It speaks the
 * event *shapes* the real API uses, and decides what to do from a keyword,
 * so the parts under test are ours — the tool-call plumbing, the
 * confirmation gate, the Claude Code bridge, the state machine — not
 * OpenAI's model.
 *
 * Typing a message containing "実行" / "作って" / "task" makes it propose a
 * delegation; "はい" / "yes" makes it confirm one. Anything else gets a
 * plain spoken reply.
 */
import { WebSocketServer, type WebSocket } from "ws";

const PORT = Number(process.env.FAKE_REALTIME_PORT ?? 8799);
const DELEGATE_WORDS = /(実行|作って|やって|task|build|make)/i;
const CONFIRM_WORDS = /^(はい|うん|お願い|yes|ok|やって)/i;

const wss = new WebSocketServer({ port: PORT });
console.log(`[fake-realtime] listening on ws://127.0.0.1:${PORT} — pretending to be the OpenAI Realtime API`);

let callCounter = 0;

function send(ws: WebSocket, event: Record<string, unknown>) {
  ws.send(JSON.stringify(event));
}

/** Mimics an audio-only reply: a transcript plus one silent audio frame. */
function speak(ws: WebSocket, text: string) {
  const responseId = `resp_${++callCounter}`;
  send(ws, { type: "response.output_audio.delta", response_id: responseId, delta: Buffer.alloc(480).toString("base64") });
  send(ws, { type: "response.output_audio_transcript.done", response_id: responseId, transcript: text });
  send(ws, { type: "response.done", response_id: responseId });
}

wss.on("connection", (ws) => {
  console.log("[fake-realtime] core connected");
  send(ws, { type: "session.created" });

  let pendingInstruction: string | null = null;

  ws.on("message", (raw) => {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (event.type === "session.update") {
      const session = event.session as Record<string, unknown>;
      const tools = (session.tools as Array<{ name?: string }> | undefined) ?? [];
      console.log(`[fake-realtime] session configured; tools offered: ${tools.map((t) => t.name).join(", ") || "(none)"}`);
      send(ws, { type: "session.updated" });
      return;
    }

    if (event.type === "conversation.item.create") {
      const item = event.item as Record<string, unknown>;

      if (item.type === "function_call_output") {
        const output = String(item.output ?? "");
        console.log(`[fake-realtime] tool result received: ${output.slice(0, 120)}`);
        // The real model decides what to say next; we just relay something
        // sensible so the transcript reads correctly.
        speak(ws, output.startsWith("NOT executed") ? "この内容で実行してよろしいですか？" : `完了しました。${output.slice(0, 200)}`);
        return;
      }

      const content = (item.content as Array<{ text?: string }> | undefined) ?? [];
      const text = content.map((c) => c.text ?? "").join(" ").trim();
      console.log(`[fake-realtime] user said: ${text}`);

      if (pendingInstruction && CONFIRM_WORDS.test(text)) {
        const callId = `call_${++callCounter}`;
        send(ws, {
          type: "response.function_call_arguments.done",
          call_id: callId,
          name: "delegate_to_claude_code",
          arguments: JSON.stringify({ instruction: pendingInstruction, estimate: "1分", confirmed: true }),
        });
        pendingInstruction = null;
        return;
      }

      if (DELEGATE_WORDS.test(text)) {
        pendingInstruction = text;
        speak(ws, "承知しました。1分ほどで終わる見込みです。");
        const callId = `call_${++callCounter}`;
        send(ws, {
          type: "response.function_call_arguments.done",
          call_id: callId,
          name: "delegate_to_claude_code",
          arguments: JSON.stringify({ instruction: text, estimate: "1分" }),
        });
        return;
      }

      speak(ws, `「${text}」について承りました。`);
    }
  });

  ws.on("close", () => console.log("[fake-realtime] core disconnected"));
});
