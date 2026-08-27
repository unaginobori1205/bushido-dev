# SHOGUN — Implementation Plan

Status: **design draft**. This is the answer to the "before you write MVP0.1
code" checklist (dependency candidates, security concerns, MVP0.1 task
breakdown, file list) — no MVP0.1 feature code has been written yet by
design; this session stopped at planning on purpose so the plan can be
reviewed first. See `ARCHITECTURE.md` for the *why* behind these choices.

## 1. Existing repository state (as surveyed before this plan)

- The repository (`bushido-dev`) had no SHOGUN-related code before this
  session — only an unrelated `records/` directory (personal notes), left
  untouched.
- One piece of reusable groundwork existed from earlier in this same
  session: a standalone CLI (`voice-claude`) that bridges the OpenAI
  Realtime API to headless Claude Code. It has been **moved, not rewritten**,
  into `ai/claude/` (see §6) as the seed of SHOGUN's Claude Code connector,
  per the "reuse existing implementation, don't rewrite from zero" directive.
  Its own `src/` is still empty — only `package.json` and `.env.example`
  exist so far; finishing it is scoped to MVP0.3 (§5), not MVP0.1.

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Desktop shell | Tauri v2 (Rust) + WebView (React or Svelte, TBD at implementation time) | see ARCHITECTURE.md §9 |
| Core logic (orchestrator, intent router, permissions, planner, memory, mcp client, integrations) | TypeScript, Node.js ≥ 18, run as a Tauri sidecar process | reuses `ai/claude`'s existing Node code; type safety matters once Intent Router / Permission Level / MCP schemas multiply |
| Package management | pnpm workspaces (monorepo) | multiple internal packages (`core/*`, `voice/*`, `ai/*`, `mcp/*`) without publishing them |
| Local storage | SQLite via `better-sqlite3` (+ `drizzle-orm` for schema/migrations) | single-user, offline-first, no server to operate |
| Realtime voice | OpenAI Realtime API, `gpt-realtime-2.1`, WebSocket | already implemented in `ai/claude`'s sibling CLI; same protocol reused in `ai/openai` |
| Wake word | Picovoice Porcupine (on-device) | see ARCHITECTURE.md §6 — must never stream idle audio to the cloud |
| Coding execution | headless `claude -p ... --output-format json [--resume <id>]` | matches how the user's normal Claude Code already runs; verified working in this environment (`session_id`/`result` JSON fields confirmed) |

## 3. Dependency candidates (by module, npm unless noted)

- `apps/desktop`: `@tauri-apps/cli`, `@tauri-apps/api` (+ Rust/Cargo toolchain, Xcode command line tools on macOS for code signing/build)
- `core/*`: `zod` (intent/schema validation), `typescript`, `tsx` or `ts-node` (dev run)
- `ai/openai`: `ws`, `dotenv` (already used by `ai/claude`)
- `ai/claude`: `ws`? no — child_process only (already scaffolded, no new deps needed)
- `mcp/client`: `@modelcontextprotocol/sdk`
- `memory` / `database`: `better-sqlite3`, `drizzle-orm`, `drizzle-kit` (migrations)
- `voice/wake-word`: `@picovoice/porcupine-node` (or the Rust binding if wake detection moves into the Tauri layer for lower latency — decide during MVP0.1 follow-up, not blocking)
- Dev tooling (root): `eslint`, `prettier`, `vitest` (unit tests for `core/intent-router`, `core/permissions`, `memory` — these are pure logic and can be tested without any GUI or hardware)

No dependency here requires a paid service beyond the OpenAI API key and the
user's existing Claude Code subscription/login.

## 4. Security concerns (input to `SECURITY.md`)

Summarized here, detailed in `docs/SECURITY.md`:

1. Secrets only in `.env` (git-ignored), never in source, never logged, never
   included in Action Log entries (§8 of `SECURITY.md`).
2. Mic must be provably off outside `LISTENING`/`SPEAKING` — enforced by
   only opening the Realtime WebSocket after a wake/click event, and always
   reflecting mic state in the UI.
3. Wake-word detection stays fully on-device (Porcupine) — no idle audio
   ever reaches OpenAI.
4. Permission Level check lives in exactly one chokepoint
   (`core/permissions`), called by the orchestrator before any side-effecting
   action — never re-implemented per integration.
5. Content pulled from email/calendar/web/files is **data**, never
   **instructions** — the prompt assembly layer must keep them in clearly
   labeled, non-executable blocks, the same discipline already used for
   external content elsewhere in this environment.
6. Loosening Claude Code's own permission mode for hands-free coding is a
   SHOGUN-level Permission decision (Level 2/3), not a default.
7. Local SQLite/Markdown memory can contain sensitive personal/business
   data — git-ignored by default; encryption-at-rest is future work, not
   MVP0.1.
8. Action Log (`database`) is append-only and excluded from any future sync
   feature by default.

## 5. MVP milestones (recap, per spec §25–29)

- **MVP0.1** — voice conversation with the OpenAI persona, history, session
  summary, "what did I do last time" recall. **No Claude Code, no MCP, no
  wake word yet** (spec's own checklist). ← this plan's implementation target.
- **MVP0.2** — Calendar read + Morning Briefing.
- **MVP0.3** — Claude Code connector wired into the Orchestrator
  ("continue yesterday's work") — this is where `ai/claude/src` gets
  finished.
- **MVP0.4** — MCP Tool Router (general integrations).
- **MVP0.5** — Proactive Assistant (unprompted suggestions, priority score).
- **MVP1.0** — full product vision (§30).

## 6. MVP0.1 — task breakdown

Scope is exactly the 8-item checklist from the spec: Mac 常駐, click-to-open
UI, voice input, AI conversation, voice reply, conversation history saved,
session summary saved on exit, "what did I do last time" recall on next
launch.

1. **Monorepo scaffold** — root `package.json` (pnpm workspaces), root
   `tsconfig.base.json`, `eslint`/`prettier` config, `docs/` (this set),
   module-stub `README.md`s (done this session — see §7 file list).
2. **`apps/desktop` — Tauri init** — macOS target, transparent
   always-on-top WebView anchored bottom-right, macOS menu-bar tray icon,
   global shortcut to toggle the panel (click-trigger per MVP0.1; wake-word
   is the immediate follow-up, not part of this milestone).
3. **`apps/desktop` — minimal UI** — states `IDLE / LISTENING / THINKING /
   SPEAKING` (CONFIRMING/EXECUTING are no-ops until MVP0.2+ since MVP0.1 has
   no side-effecting actions), per spec §15–16.
4. **`ai/openai` — Realtime client** — port the WebSocket session logic
   already written for `ai/claude`'s sibling `voice-claude` CLI
   (`session.update`, `semantic_vad`, transcription events, out-of-band
   speech responses) into a reusable package; swap the CLI's `sox`
   mic/speaker for the WebView's `getUserMedia` + `AudioWorklet` (browser
   context is available here, unlike the headless CLI).
5. **`core/orchestrator` — conversation state machine** — `IDLE →
   LISTENING → THINKING → SPEAKING → IDLE` loop wired to `ai/openai`. Loads
   `prompts/shogun-system.md` as the persona instructions.
6. **`memory/working`** — in-process rolling conversation buffer, capped
   length, fed back into each turn's context.
7. **`memory/daily`** — SQLite-backed daily record matching the spec §8
   JSON shape; written on an explicit "終わり"/"おやすみ" intent
   (simple keyword/intent match is enough for MVP0.1 — no full Intent
   Router yet) and on unexpected app quit (best-effort autosave).
8. **Session resume** — on launch, load the latest `daily_memory` row and
   splice a short recap into the persona's context so "前回何してた？"
   is answerable without a separate module.
9. **Config/env + startup check** — root `.env` loader
   (`OPENAI_API_KEY`, `SHOGUN_USER_NAME`, `SHOGUN_TIMEZONE`), a `--check`
   equivalent that verifies the key and mic permission before opening the
   panel, mirroring the CLI's own `--check` flag.
10. **Action Log (minimal)** — every conversation turn logged
    (`timestamp, transcript, intent="conversation", tool=null`) to
    `database/`, so the schema exists before EXECUTE-capable intents
    (MVP0.2+) need it.
11. **`core/permissions` — interface only** — the `PermissionLevel` enum
    and the single-chokepoint guard function, unused by MVP0.1's own
    intents (there are none above Level 0) but in place so MVP0.2 doesn't
    retrofit it.
12. **Dev/build docs** — how to `pnpm install`, run the Tauri dev shell, and
    package a local `.app` — written once MVP0.1 code exists (this
    environment cannot build/run a Tauri `.app`, so these steps must be
    verified on the user's own Mac).

## 7. Files/directories touched by this plan (this session)

Created (docs + skeleton only, per this session's scope):

```
shogun/README.md
shogun/.env.example
shogun/.gitignore
shogun/docs/ARCHITECTURE.md
shogun/docs/IMPLEMENTATION_PLAN.md   (this file)
shogun/docs/SECURITY.md
shogun/docs/MCP_REGISTRY.md
shogun/prompts/shogun-system.md
shogun/apps/desktop/README.md
shogun/core/{orchestrator,intent-router,permissions,planner,context}/README.md
shogun/voice/{wake-word,stt,tts}/README.md
shogun/ai/{openai,claude}/README.md          (ai/claude/ also has the moved voice-claude scaffold)
shogun/mcp/{client,registry}/README.md
shogun/memory/{working,daily,long-term,projects}/README.md
shogun/integrations/{calendar,gmail,github,n8n}/README.md
shogun/database/README.md
```

Moved (not rewritten):

```
voice-claude/  →  shogun/ai/claude/   (package.json, .env.example, empty src/)
```

Untouched: `records/` and everything else already in the repository.

Nothing above executes code or requires the OpenAI key — safe to review
before the MVP0.1 implementation pass, which will touch a much smaller,
concrete file list (announced at the start of that session, per the same
"list files before implementing" rule).
