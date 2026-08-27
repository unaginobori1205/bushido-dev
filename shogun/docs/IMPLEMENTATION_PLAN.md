# SHOGUN — Implementation Plan

Status: **MVP0.1 implemented** — §6 was the plan, §8 records what was
actually built and where it deviated from this plan and why. See
`ARCHITECTURE.md` for the *why* behind the original design choices.

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
| Package management | ~~pnpm workspaces (monorepo)~~ → **single root package** (`shogun/package.json`) covering `config.ts`, `core/*`, `memory/*`, `database/*`, `ai/openai/*` | see §8 — deviated from the original plan: for MVP0.1's actual module count, one `tsconfig.json`/`node_modules` was simpler than per-module workspace packages with no real publishing boundary yet. `ai/claude` keeps its own separate `package.json` (unchanged, still just scaffolding). Revisit real workspace packages once module boundaries stabilize past MVP0.1. |
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

Nothing above executes code or requires the OpenAI key — this was the
docs-only pass. §8 covers the MVP0.1 implementation pass that followed.

## 8. MVP0.1 — what was actually built (this pass)

Status against the §6 task list:

1. **Monorepo scaffold** — done, but as a single root package rather than
   pnpm workspaces (see §2's Package management row). `shogun/package.json`,
   `shogun/tsconfig.json`, `vitest` for tests. No `eslint`/`prettier` yet —
   deferred as genuinely optional for MVP0.1 (nothing here is being
   published or worked on by multiple contributors yet); worth adding
   before MVP0.2 grows the codebase further.
2. **`apps/desktop` — Tauri init** — done (`apps/desktop/src-tauri/`):
   tray icon (left-click toggles the panel), global shortcut
   (`Cmd+Shift+J`), transparent/borderless always-on-top window positioned
   bottom-right at runtime (`position_bottom_right` in `main.rs`, since
   `tauri.conf.json` can't know the real screen size). **Verified with
   `cargo check` on Linux** (after installing `libwebkit2gtk-4.1-dev` etc.
   in this environment specifically to get real compiler feedback instead
   of guessing at the Tauri v2 API) — it compiles clean against the exact
   APIs used (`TrayIconBuilder`, `GlobalShortcutExt`, `Emitter`, window
   positioning). **Not** built or run as an actual macOS `.app` — see
   `apps/desktop/README.md`'s verification-gap list.
3. **`apps/desktop` — minimal UI** — done, plain HTML/CSS/JS (no
   bundler/framework — a deviation from §2's "TBD React or Svelte"; see
   `apps/desktop/src/index.html`'s comment for why this was simpler for
   four states and zero external dependencies).
4. **`ai/openai` — Realtime client** — done (`ai/openai/realtimeClient.ts`).
   One further deviation from the CLI it was ported from: MVP0.1 lets the
   Realtime model generate its **own** replies (`create_response: true`)
   since OpenAI *is* the persona here — the original `voice-claude`/
   `ai/claude` design suppressed that (`create_response: false`) because it
   substituted Claude Code's text instead, which doesn't apply until
   MVP0.3. `speak(text)` (verbatim out-of-band TTS) is still implemented
   for that future use. Mic capture is the WebView's `getUserMedia` +
   `AudioWorklet` (`apps/desktop/src/pcm-worklet.js`), resampled by
   constructing the `AudioContext` at `{ sampleRate: 24000 }` rather than
   hand-rolling a resampler.
5. **`core/orchestrator` — state machine** — done, split into a pure,
   fully unit-tested `stateMachine.ts` (8 tests) and a composition-root
   `server.ts` that wires it to `ai/openai`/memory/database and exposes
   the localhost WebSocket the desktop shell connects to.
6. **`memory/working`** — done, unit-tested (4 tests).
7. **`memory/daily`** — done, unit-tested (7 tests). Session-end detection
   is a regex on the transcript (`終わり|おやすみ|お疲れ様でした|バイバイ`)
   as planned; unexpected-quit autosave is a `socket.on("close")` handler.
8. **Session resume** — done: `server.ts` loads the latest prior daily
   record at startup and splices `summarizeDailyRecord()`'s output into
   the system prompt.
9. **Config/env + startup check** — done (`config.ts`, root-level per
   ARCHITECTURE.md §10, zod-validated). "Startup check" ended up being
   "fail fast with a readable error" (verified: missing `OPENAI_API_KEY`
   produces a clear `ZodError` naming the field, not a crash deep in a
   callback) rather than a separate `--check` flag/mic-permission probe —
   the CLI's `--check` doesn't have a direct GUI-app equivalent; a
   pre-flight mic-permission check is worth adding to the desktop shell
   later.
10. **Action Log** — done (`database/actionLog.ts`), wired into
    `server.ts` for every user transcript.
11. **`core/permissions` — interface only** — done, and given real unit
    tests (9 tests) even though nothing calls it yet in MVP0.1, since the
    logic (Level enum, CRITICAL confirmation heuristic) is cheap to verify
    now and expensive to get subtly wrong later.
12. **Dev/build docs** — done (`apps/desktop/README.md`,
    root `README.md` Setup section), with an explicit list of what could
    and couldn't be verified from this environment.

**Verification performed in this environment:**
`pnpm typecheck` (clean), `pnpm test` (28/28 passing across
`core/permissions`, `core/orchestrator/stateMachine`, `memory/daily`,
`memory/working`), a manual run of `core/orchestrator/server.ts` (fails
fast and clearly with no `OPENAI_API_KEY`; starts and listens correctly
with one set), and `cargo check` for the Tauri shell. **Not** performed
(no hardware/OS for it here): an actual mic→OpenAI→speaker round trip, a
built macOS `.app`, or real multi-monitor window positioning.

### Files added in this pass

```
shogun/package.json  shogun/tsconfig.json  shogun/config.ts
shogun/core/permissions/{index.ts,index.test.ts}
shogun/core/orchestrator/{stateMachine.ts,stateMachine.test.ts,server.ts}
shogun/memory/working/{index.ts,index.test.ts}
shogun/memory/daily/{index.ts,index.test.ts}
shogun/database/{db.ts,actionLog.ts}
shogun/ai/openai/realtimeClient.ts
shogun/apps/desktop/src-tauri/{Cargo.toml,build.rs,tauri.conf.json,Info.plist,src/main.rs,capabilities/default.json,icons/*.png}
shogun/apps/desktop/src/{index.html,style.css,main.js,pcm-worklet.js}
```

`shogun/apps/desktop/src-tauri/Cargo.lock` and `shogun/pnpm-lock.yaml` are
committed for reproducible builds. `shogun/apps/desktop/src-tauri/target/`
and `.../gen/` (Tauri's regenerated ACL schemas) are git-ignored — see
`.gitignore`.

Not touched in this pass, per §5's milestone boundaries: `ai/claude/src`
(MVP0.3), `voice/wake-word` (MVP0.1 follow-up), `mcp/*`, `integrations/*`
(MVP0.4), `memory/long-term`, `memory/projects` (MVP0.2/0.3).
