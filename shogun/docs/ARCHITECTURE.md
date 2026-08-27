# SHOGUN — Architecture

Status: **design draft (pre-implementation)**. This document describes the target
architecture for SHOGUN, a personal AI concierge OS that runs on the user's Mac.
It is written before any MVP code exists so that implementation can start from a
shared, reviewable plan (see `IMPLEMENTATION_PLAN.md` for the sequencing).

## 1. What SHOGUN is

SHOGUN is not a chat app. It is a persistent, voice-first concierge that:

- **understands** the user's day (calendar, tasks, projects, past sessions, mail),
- **plans** the next best action instead of only answering questions,
- **executes** across external systems (Claude Code, MCP tools, local files),
- **learns** the user's patterns over time,
- and never takes an action with external side effects without confirmation
  (**ASK BEFORE ACT**, see §5).

## 2. High-level architecture

```
                              USER
                                │
                    voice (mic)  │  voice (speaker)
                                ▼
                    ┌───────────────────────┐
                    │   apps/desktop (Tauri) │  tray icon, global shortcut,
                    │   WebView UI           │  bottom-right panel, mic capture
                    └───────────┬────────────┘  via getUserMedia in the WebView
                                │ local IPC (Tauri commands / WS on localhost)
                                ▼
                    ┌───────────────────────┐
                    │   core/orchestrator    │  conversation state machine
                    │   (Node.js sidecar)    │  IDLE→LISTENING→THINKING→
                    └───────────┬────────────┘  SPEAKING→CONFIRMING→EXECUTING
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
     core/intent-router  core/permissions     core/planner
              │                 │                  │
              └────────┬────────┴─────────┬────────┘
                       ▼                  ▼
              ┌────────────────┐  ┌────────────────┐
              │ ai/openai       │  │ ai/claude       │
              │ (Realtime API,  │  │ (headless       │
              │  "brain")       │  │  `claude -p`,   │
              │                 │  │  "engineer")    │
              └────────┬────────┘  └────────┬────────┘
                       │                    │
                       ▼                    ▼
              ┌──────────────────────────────────┐
              │            mcp/client              │  calendar / gmail / drive /
              │      (SHOGUN's own light MCP)      │  github / notion / n8n / …
              └──────────────────┬──────────────────┘
                                 ▼
                          memory/ (working, daily,
                          long-term, projects)
                                 ▼
                          database/ (local SQLite)
```

Everything below `apps/desktop` runs as a local Node.js/TypeScript **sidecar
process** launched by the Tauri shell. The Tauri/Rust layer is kept
intentionally thin (window, tray, global shortcut, mic/speaker via the
WebView's Web Audio APIs, IPC) so that the bulk of the logic — the part that
changes fastest — stays in TypeScript, reuses the `ai/claude` connector
already scaffolded, and is testable without a GUI.

## 3. AI role split (Provider Adapter pattern)

Per the product spec, two model providers play different roles, and neither
is hard-wired into `core/*`:

- **`ai/openai`** — conversation, intent understanding, the SHOGUN persona,
  next-action suggestions. Talks to the OpenAI Realtime API
  (`gpt-realtime-2.1`) for combined STT + reasoning-light dialogue + TTS in
  one WebSocket, the same protocol already implemented in `ai/claude`'s
  sibling module for the standalone `voice-claude` CLI.
- **`ai/claude`** — coding work: program changes, refactors, tests, git
  operations, repository understanding. Talks to the user's own Claude Code
  install via headless `claude -p` (see `ai/claude/src`, already scaffolded).

`core/orchestrator` never calls OpenAI or Claude Code directly — it depends
on two small interfaces so a provider can be swapped without touching the
orchestrator:

```ts
interface ConversationProvider {
  connect(onEvent: (e: ConversationEvent) => void): Promise<void>;
  sendUserAudio(pcm16: Buffer): void;
  speak(text: string): Promise<void>;
  close(): Promise<void>;
}

interface CodingProvider {
  run(instruction: string, opts: { cwd: string; sessionId?: string }): Promise<{
    text: string;
    sessionId: string;
  }>;
}
```

`mcp/client` is similarly abstracted so the registry (`mcp/registry`,
§7) can add or remove MCP servers without code changes anywhere else.

## 4. Intent Router

`core/intent-router` classifies each user utterance (already transcribed by
`ai/openai`) into an intent + slots, e.g.:

| Utterance                         | Intent            | Routed to                          |
|------------------------------------|--------------------|-------------------------------------|
| 「今日何ある？」                   | `calendar.read`    | `mcp/client` → calendar (Level 0)   |
| 「昨日の続きをやろう」             | `project.resume`   | `memory/projects` + `ai/claude`     |
| 「田中さんにメール作って」         | `email.draft`      | `mcp/client` → gmail draft (Level 1)|
| 「送って」（直前のdraft文脈で）    | `email.send`       | `mcp/client` → gmail send (Level 2) |
| 「このファイル消して」             | `file.delete`      | filesystem (Level 3)                |

Classification for MVP0.1 is a single OpenAI call (structured output / tool
call) against a small fixed intent list; it grows into a proper router as
more integrations land (MVP0.2+). Unmatched utterances fall back to a plain
`conversation.reply` intent handled entirely by `ai/openai`.

## 5. Permission model (ASK BEFORE ACT)

Every intent handler declares a `PermissionLevel` (`core/permissions`):

```
0 READ      — auto-run, no side effects (calendar/read, files/read, git/status)
1 PREPARE   — auto-run, produces a draft that is *not yet sent* (email draft,
              proposal text, code diff, schedule proposal)
2 CONFIRM   — requires an explicit yes from the user in the same session
              before executing (send email, create calendar event, git commit,
              MCP write)
3 CRITICAL  — requires a *specific* confirmation that restates the action
              (delete file, git push, prod change, payment, contract,
              bulk email, account change) — a bare "はい" is not enough;
              the orchestrator must read back what will happen.
```

This check happens in exactly one place: `core/permissions` is called by
`core/orchestrator` right before any `CodingProvider.run`, `mcp/client` write
call, or filesystem/shell action — never inside an individual integration.
That is a deliberate constraint so no future integration can accidentally
skip confirmation. Loosening Claude Code's own `--permission-mode` (e.g. to
`acceptEdits`/`bypassPermissions` for hands-free coding sessions) is treated
as *SHOGUN's* Level 2/3 decision, made per project/trust level — never a
default.

State machine (`core/orchestrator`, mirrors UI states in §16 of the spec):

```
IDLE → LISTENING → THINKING → (SPEAKING | CONFIRMING) → EXECUTING → IDLE
```

`CONFIRMING` is its own state (not folded into `THINKING`) so the UI can show
a distinct affordance and so a "はい/いいえ" reply is parsed against the
pending action rather than as a new free-form utterance.

## 6. Voice layer — two different audio problems, kept separate

The spec's demo ("将軍" wakes the app from full idle) and the earlier
`voice-claude` CLI ("mute the mic while the AI is speaking so external
speakers don't get picked up") describe **two different concerns** that must
not be conflated:

1. **Wake detection (idle → active).** This must run **fully on-device**,
   continuously, with no audio leaving the machine — both for privacy and
   because streaming every idle moment to the OpenAI Realtime API would be
   expensive and unnecessary. Recommendation: **Picovoice Porcupine**
   (`voice/wake-word`), with a custom-trained keyword for "将軍"/"SHOGUN"
   (free for personal/local use, macOS-native, no network call to detect the
   wake word itself). Only *after* a wake event does the app open the OpenAI
   Realtime WebSocket. MVP0.1 itself only requires a **click/global-shortcut
   trigger** (per the MVP0.1 checklist) — Porcupine wake-word wiring is
   scoped as the immediate follow-up once MVP0.1's conversation loop works,
   not a blocker for it.

2. **Echo/feedback handling while SHOGUN is speaking.** The original
   `voice-claude` CLI (headless, external speakers, no OS-level echo
   cancellation) solves this by **muting the mic while audio plays + for a
   short window after**. The SHOGUN desktop spec instead asks for **natural
   barge-in** (§17 of the spec: "if SHOGUN is speaking and the user starts
   talking, stop"), which assumes the built-in mic/speaker (or headphones)
   and OS-level echo handling. These are contradictory defaults for
   different hardware setups, so both are supported as a config option in
   `ai/openai`'s session config:

   ```
   interruption_mode: "barge-in" | "mute-while-speaking"
   ```

   Default for the desktop app is `"barge-in"` (matches the product vision).
   `"mute-while-speaking"` — the exact behavior already built for the
   standalone CLI — remains available for users on external speakers without
   AEC. `ai/claude`'s sibling `voice-claude` CLI keeps its own default of
   `mute-while-speaking` since it targets headless/CLI use.

3. **STT + TTS** for the active conversation is the OpenAI Realtime API
   (`gpt-realtime-2.1`), reusing the event handling already implemented for
   `voice-claude` (`session.update` with `audio.input`/`audio.output`,
   `semantic_vad` turn detection, `conversation.item.input_audio_transcription.completed`
   for user text, out-of-band `response.create` with `conversation:"none"`
   for text-to-speech-only turns). Inside the Tauri WebView, mic capture uses
   `getUserMedia` + an `AudioWorklet` resampling to 24kHz PCM16 instead of
   the CLI's `sox` subprocess, since a real browser engine is available.

## 7. MCP layer

`mcp/registry` holds a declarative list of configured MCP servers and their
permission scope (read-only vs read-write), matching the spec's example in
§22. `mcp/client` connects to them via the official MCP TypeScript SDK.

**Reuse note (important cost/complexity finding):** the Claude Code CLI
already ships with first-class MCP client support, and in this project's own
Claude Code Remote session Calendar/Gmail/Drive/GitHub/Notion/n8n MCP
servers are *already* connected at the account level. Rather than
re-implementing a full MCP client stack in `mcp/client` from day one, MVP0.4
should split by cost:

- **Frequent, latency-sensitive Level-0 reads** used constantly (today's
  calendar, task list) — direct, lightweight MCP client calls from
  `core/orchestrator` for a snappy Morning Briefing etc.
- **Everything else (writes, complex multi-step tool use, anything
  coding-adjacent)** — delegate to `ai/claude` (headless Claude Code), which
  already has broad MCP + tool access, instead of duplicating each
  integration inside SHOGUN. `integrations/*` then becomes thin
  intent→prompt adapters rather than full API clients.

This trades a little latency (spawning `claude -p` is heavier than a direct
MCP call) for a large reduction in integration code to build and maintain.
Revisit per-integration if latency becomes a problem.

## 8. Memory architecture

Four tiers, all local-first (no cloud DB required for MVP):

| Tier | Contents | Lifetime | Storage (MVP) |
|---|---|---|---|
| **Working** (`memory/working`) | current conversation buffer | session only, in-process | in-memory |
| **Daily** (`memory/daily`) | today's projects/decisions/done/pending/notes (spec §8 schema) | rolling, one record/day | SQLite table `daily_memory` |
| **Long-term** (`memory/long-term`) | stable facts: role, projects, tools, preferences, recurring behavior, key people, goals | indefinite, but *curated* | SQLite table `long_term_memory` (see below) |
| **Project** (`memory/projects`) | per-project `PROJECT.md`/`STATUS.md`/`NEXT_ACTIONS.md`/`DECISIONS.md`/`SESSION_LOG.md` | indefinite | plain Markdown files under `memory/projects/<slug>/`, mirroring the spec's example — human-readable and diffable, also directly consumable by Claude Code |

**Not everything is kept forever** (spec §2 LEARN, explicit constraint).
Long-term memory writes go through a lightweight "is this worth
remembering?" filter (an LLM call classifying candidate facts as
ephemeral/notable/durable) before being promoted from Daily to Long-term —
this is a planner task, not automatic accumulation of every utterance.

`database/` is a single local SQLite file (`better-sqlite3` /
`drizzle-orm`). SQLite is chosen over a server DB because SHOGUN is a
single-user, single-machine, offline-capable app — no server to run or
secure. Encryption-at-rest for the DB and memory files is flagged as
future work (§ SECURITY.md), not required for MVP0.1.

## 9. Desktop shell

**Tauri (v2)** over Electron, per the spec's own priorities (§14: 軽量・高速・
常駐可能・透明UI): smaller memory footprint for a background/tray app,
native macOS menu-bar integration, and a Rust shell thin enough that nearly
all logic still lives in the reused/portable TypeScript sidecar. Electron
remains a fallback if a Tauri-specific blocker appears (e.g. a required
native module with no Tauri-compatible binding) — call this out explicitly
if it happens rather than silently switching.

## 10. Open decisions carried into IMPLEMENTATION_PLAN.md

- Exact wake-word trigger phrase set ("将軍" / "SHOGUN" / both) and Porcupine
  keyword training flow.
- Whether MVP0.1's OpenAI persona already loads `prompts/shogun-system.md`
  verbatim, or a trimmed MVP subset.
- Local port/IPC transport between the Tauri shell and the Node sidecar
  (localhost WebSocket vs Tauri's `shell`/`sidecar` command API).
