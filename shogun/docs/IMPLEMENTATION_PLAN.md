# SHOGUN — Implementation Plan

Status: **MVP0.1 + MVP0.3 implemented** — §6 was the plan, §8 records what was
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
   ARCHITECTURE.md §12, zod-validated). "Startup check" ended up being
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
`pnpm typecheck` (clean), `pnpm test` (28/28 passing at the time across
`core/permissions`, `core/orchestrator/stateMachine`, `memory/daily`,
`memory/working` — see §9 for `core/orchestrator/auth`, added later and
bringing the total to 36), a manual run of `core/orchestrator/server.ts`
(fails fast and clearly with no `OPENAI_API_KEY`; starts and listens
correctly with one set), and `cargo check` for the Tauri shell. **Not**
performed (no hardware/OS for it here): an actual mic→OpenAI→speaker round
trip, a built macOS `.app`, or real multi-monitor window positioning.

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

## 9. Cloud-hosted core (post-MVP0.1 follow-up)

Not one of the original MVP0.1 checklist items — added afterward, in
response to a direct request to make `core/orchestrator` usable from the
cloud rather than only via `pnpm dev:core` on the user's own Mac. See
docs/ARCHITECTURE.md §11 for the design and docs/SECURITY.md's new
"Cloud-hosted core" section for the rules.

What was built:

- `config.ts` — two new fields, `CORE_WS_HOST` (bind address, default
  `127.0.0.1`) and `CORE_AUTH_TOKEN` (shared secret, default empty).
- `core/orchestrator/auth.ts` (new, pure, unit tested — 8 tests) —
  `assertBindingIsSafe` refuses to start a non-loopback server without a
  token; `authorize` checks each connection's `?token=` against it.
  `server.ts` calls both; a connection that fails `authorize` is closed
  (code 1008) before any OpenAI/session work happens for it.
- `apps/desktop/src/settings.js` (new) + a small ⚙ panel in `index.html`/
  `style.css` — lets the desktop app point at a different core URL/token
  without rebuilding, persisted in `localStorage`.
- `Dockerfile`, `.dockerignore`, `fly.toml`, `docs/DEPLOYMENT.md` (new) —
  a concrete way to actually run core on a persistent host (Fly.io
  walkthrough, plus a platform-agnostic Docker option), including why
  SQLite constrains this to a single always-on instance rather than a
  scale-to-zero/multi-instance deployment.

**Verification performed in this environment:** `pnpm typecheck` and
`pnpm test` (36/36, including the new `auth.test.ts`) both clean; a manual
run confirming `server.ts` refuses `CORE_WS_HOST=0.0.0.0` with no token
and starts correctly once one is set. **Not performed** here (no Docker
daemon, no Fly.io account in this environment): an actual `docker build`,
`fly deploy`, or a real desktop-app-to-cloud-core connection — see
docs/DEPLOYMENT.md's own verification note before relying on this for
daily use.

**Deliberately not done as part of this change:** wiring `ai/claude`
(Claude Code) into a cloud-hosted core. MVP0.1 doesn't call `ai/claude` at
all yet, and running the user's coding agent remotely is a bigger decision
than running the conversation loop remotely — see docs/DEPLOYMENT.md's
note on this, to be revisited explicitly when MVP0.3 wires Claude Code in.

## 10. Reference: the "Jarvis / voice-controlled Claude Code" walkthrough

The user pointed at a Japanese video walkthrough of building essentially
the same idea — GPT Realtime as the voice front end, Claude Code as the
hands — and asked that it be used as a reference. This environment can't
reach YouTube, so this section is written from the summary the user
pasted, not from the video itself.

**Where it matches what's already built** (useful as validation, no
change needed):

| Video's approach | SHOGUN today |
|---|---|
| GPT Realtime for listening + speaking, Claude Code for execution | Same split — `ai/openai` ("brain") + `ai/claude` ("engineer"), docs/ARCHITECTURE.md §3 |
| Mute the mic while the AI speaks and just after, to stop speaker bleed | `INTERRUPTION_MODE=mute-while-speaking` + `POST_SPEECH_MUTE_MS` (ARCHITECTURE.md §6); desktop default is barge-in instead, which is the same problem solved the other way |
| Global keyboard shortcut to toggle the system | `Cmd+Shift+J` in `apps/desktop/src-tauri/src/main.rs` |
| A floating desktop widget showing listening/speaking state | `apps/desktop/src/` panel, four MVP0.1 states |
| "Don't actually touch files until I say go" | The whole Permission Level 0–3 model (`core/permissions`, ASK BEFORE ACT) |
| API key via `.env`, never pasted into chat | docs/SECURITY.md's Secrets section |

**Where it differs on purpose** (not adopting):

- The video's persona is a deferential butler ("セバス", calls the user
  "マスター"). SHOGUN's own spec (§18) explicitly rejects that framing —
  "執事ではない。上司でもない。最高のパートナー" — so
  `prompts/shogun-system.md` stays as-is. The persona *is* a single file,
  though, so anyone who wants the butler version just edits that file.
- The video builds one script; SHOGUN is a module-per-concern layout
  because it's aimed at the larger concierge product (memory tiers, MCP,
  proactive suggestions), not only at voice-driven coding.

**Worth adopting** (small, concrete, and not yet present):

1. **Announce an ETA before starting a delegated task.** The video's
   assistant answers "かしこまりました。数分ほどお時間をいただきます"
   *before* handing off, so the user knows whether to wait or walk away.
   This belongs in the MVP0.3 orchestrator hand-off path, alongside the
   Permission-Level check — added to the MVP0.3 scope below.
2. **Recommend a sandboxed working directory by default.** The video
   suggests restricting execution to one isolated folder. SHOGUN already
   warns about loosening Claude Code's permission mode, but doesn't yet
   name the containment pattern — now called out in docs/SECURITY.md.
3. **Set cost expectations up front.** Realtime API voice is usage-billed
   while Claude Code rides the existing subscription; a rough per-session
   figure helps the user decide how freely to leave it running — now in
   the README.

MVP0.3 scope additions from the above (to be built when MVP0.3 starts,
not now):

- Before `CodingProvider.run()`, speak a short acknowledgement including a
  rough duration estimate, then hand off in the background.
- Keep the conversation responsive while the delegated task runs (the
  video's assistant stays conversational during execution) — the
  `EXECUTING` state already exists in `core/orchestrator/stateMachine.ts`
  for exactly this, but nothing drives it yet.

## 11. MVP0.3 — Claude Code delegation (built)

The "Jarvis" behaviour from §10's reference: say a task out loud, SHOGUN
hands it to Claude Code, keeps talking to you while it runs, then reports
back. Built after MVP0.1, skipping MVP0.2 (calendar) because this is what
the user actually asked for.

**How a task flows**

1. The Realtime session registers one function,
   `delegate_to_claude_code` (`core/intent-router`). The *model* decides a
   turn is work — no keyword matching on our side — and announces its ETA
   out loud in the same turn, which is how §10's "tell them how long"
   requirement is met.
2. `core/orchestrator/server.ts` receives the tool call and refuses it the
   first time, telling the model to read the task back and get a spoken
   yes.
3. Only a second call with `confirmed: true` **and** a real user turn
   observed after the refusal executes. The model can claim the user
   agreed; it cannot manufacture a transcription event, so a
   self-confirming model still runs nothing. `CLAUDE_REQUIRE_CONFIRMATION=false`
   waives this in favour of standing consent — documented as a Level 2/3
   decision, not a convenience toggle.
4. `ai/claude/claudeBridge.ts` spawns `claude -p "<task>" --output-format
   json [--resume <id>]` in `CLAUDE_CWD`, not awaited, so the conversation
   stays live (the `EXECUTING` state now has something driving it).
5. On completion the result goes back through
   `RealtimeClient.sendToolResult`, so SHOGUN summarises it in its own
   voice rather than reading Claude Code's output verbatim.

**Deliberate constraints**

- **Off by default** (`CLAUDE_DELEGATION_ENABLED=false`). The persona is
  told when it's disabled so it says so plainly instead of pretending to
  start work.
- **Local only.** `assertRunnableHere` refuses delegation when core is
  bound off-loopback: the user's Claude Code login and files are on their
  machine, so a cloud core would act on the wrong one. This closes the
  question §9 left open.
- **Session continuity per directory** (`ai/claude/sessionStore.ts`) —
  keyed by cwd, because Claude Code's history is per-project and resuming
  one project's session in another would continue the wrong conversation.

**Verification.** `ai/claude/claudeBridge.ts` was run against the **real**
`claude` CLI in this environment: a first call returned its answer and
persisted the session id, and a second call resumed that session with the
model still remembering the first turn. That is the one part of the voice
loop this environment *can* prove, and it works. The parts still unproven
are unchanged from §8 — anything requiring a microphone, speakers, a Mac,
or an outbound WebSocket to OpenAI.

Unit tests: 62 total (was 36) — `claudeBridge` (13), `sessionStore` (6),
`intent-router` (7) added.
