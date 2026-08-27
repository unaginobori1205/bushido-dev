/**
 * ai/openai — the ConversationProvider (docs/ARCHITECTURE.md §3) backed by
 * the OpenAI Realtime API (`gpt-realtime-2.1`, WebSocket). This is SHOGUN's
 * "brain" for MVP0.1: the model itself holds the SHOGUN persona
 * (prompts/shogun-system.md) and generates its own conversational replies
 * — unlike the original `voice-claude` CLI design (ai/claude), which
 * suppressed the model's own responses (`create_response:false`) so it
 * could substitute Claude Code's text instead. MVP0.1 has no Claude Code
 * in the loop, so the model's own reply is exactly what should be spoken.
 *
 * Session schema verified against current OpenAI Realtime API docs
 * (nested `session.audio.input`/`session.audio.output`, `semantic_vad`
 * turn detection, `response.output_audio.delta` event name,
 * out-of-band `response.create` with `conversation:"none"` for verbatim
 * TTS) — see docs/ARCHITECTURE.md §6 for the interruption_mode rationale.
 */
import { EventEmitter } from "node:events";
import WebSocket from "ws";
import type { ShogunConfig } from "../../config.js";

export interface RealtimeClientEvents {
  open: [];
  ready: [];
  userTranscript: [{ text: string }];
  assistantTranscript: [{ text: string }];
  speechStart: [];
  speechDelta: [{ audio: Buffer }];
  speechEnd: [];
  error: [{ error: Error }];
  close: [];
}

/** Minimal typed-EventEmitter wrapper — avoids a dependency for this alone. */
export declare interface RealtimeClient {
  on<K extends keyof RealtimeClientEvents>(event: K, listener: (...args: RealtimeClientEvents[K]) => void): this;
  emit<K extends keyof RealtimeClientEvents>(event: K, ...args: RealtimeClientEvents[K]): boolean;
}

export class RealtimeClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private activeResponseId: string | null = null;
  private speaking = false;

  constructor(private readonly config: ShogunConfig, private readonly systemInstructions: string) {
    super();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(this.config.OPENAI_REALTIME_MODEL)}`;
      const ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.config.OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1",
        },
      });
      this.ws = ws;

      ws.once("open", () => {
        this.emit("open");
        this.sendSessionUpdate();
        resolve();
      });
      ws.once("error", (err) => {
        this.emit("error", { error: err instanceof Error ? err : new Error(String(err)) });
        reject(err);
      });
      ws.on("message", (data) => this.handleMessage(data));
      ws.on("close", () => this.emit("close"));
    });
  }

  private send(event: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(event));
  }

  private sendSessionUpdate(): void {
    const barge = this.config.INTERRUPTION_MODE === "barge-in";
    this.send({
      type: "session.update",
      session: {
        type: "realtime",
        model: this.config.OPENAI_REALTIME_MODEL,
        output_modalities: ["audio"],
        instructions: this.systemInstructions,
        audio: {
          input: {
            format: { type: "audio/pcm", rate: 24000 },
            turn_detection: {
              type: this.config.TURN_DETECTION_TYPE,
              create_response: true,
              interrupt_response: barge,
            },
            transcription: {
              model: "gpt-4o-transcribe",
              language: this.config.OPENAI_REALTIME_LANGUAGE,
            },
          },
          output: {
            format: { type: "audio/pcm", rate: 24000 },
            voice: this.config.OPENAI_REALTIME_VOICE,
          },
        },
      },
    });
  }

  /** Streams one chunk of mic audio (already PCM16 @ 24kHz) to the model. */
  appendAudio(pcm16: Buffer): void {
    this.send({ type: "input_audio_buffer.append", audio: pcm16.toString("base64") });
  }

  /**
   * Forces the model to speak `text` verbatim as an out-of-band response —
   * does not touch the main conversation. Used for SHOGUN-generated text
   * (Morning Briefing, and later Claude Code replies) rather than the
   * model's own free-form reply.
   */
  speak(text: string): void {
    this.send({
      type: "response.create",
      response: {
        conversation: "none",
        output_modalities: ["audio"],
        instructions: `Read the following text aloud, verbatim, naturally and clearly. Do not add or remove anything, and do not continue the conversation on your own:\n\n${text}`,
      },
    });
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  private handleMessage(data: WebSocket.RawData): void {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(data.toString());
    } catch {
      return;
    }
    switch (event.type) {
      case "session.created":
      case "session.updated":
        this.emit("ready");
        break;
      case "conversation.item.input_audio_transcription.completed": {
        const text = (event.transcript as string | undefined)?.trim();
        if (text) this.emit("userTranscript", { text });
        break;
      }
      case "response.output_audio.delta": {
        const responseId = event.response_id as string | undefined;
        if (responseId && responseId !== this.activeResponseId) {
          this.activeResponseId = responseId;
        }
        if (!this.speaking) {
          this.speaking = true;
          this.emit("speechStart");
        }
        const b64 = event.delta as string | undefined;
        if (b64) this.emit("speechDelta", { audio: Buffer.from(b64, "base64") });
        break;
      }
      case "response.output_text.done": {
        const text = (event.text as string | undefined)?.trim();
        if (text) this.emit("assistantTranscript", { text });
        break;
      }
      case "response.done":
        if (this.speaking) {
          this.speaking = false;
          this.emit("speechEnd");
        }
        this.activeResponseId = null;
        break;
      case "error": {
        const message = ((event.error as Record<string, unknown> | undefined)?.message as string) ?? "Realtime API error";
        this.emit("error", { error: new Error(message) });
        break;
      }
      default:
        break;
    }
  }
}
