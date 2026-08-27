# SHOGUN — Personal AI Concierge OS

> ユーザー：「将軍」
> SHOGUN：「はい。」

SHOGUN is a persistent, voice-first AI concierge that runs on the user's
Mac: it understands the day (calendar, tasks, projects, past work), suggests
the next action instead of only answering questions, executes across
Claude Code / MCP tools / local systems, and learns over time — always
**asking before any action with external side effects** (ASK BEFORE ACT).

## Status

**MVP0.1 implemented.** `docs/ARCHITECTURE.md` and
`docs/IMPLEMENTATION_PLAN.md` were written first; MVP0.1 (voice
conversation with the OpenAI persona, working + daily memory, session
resume, Action Log) follows that plan — see `docs/IMPLEMENTATION_PLAN.md`
§6 for the task-by-task breakdown and which parts are unverified. The Node
core (`core/`, `memory/`, `database/`, `ai/openai/`) is typechecked and
unit-tested (`pnpm typecheck && pnpm test`, both run clean in this
environment); the Tauri desktop shell (`apps/desktop/`) compiles
(`cargo check`, verified on Linux) but has **not** been built or run as a
real macOS app — this environment has no Mac, display, or microphone, so
that verification is left to the user (see `apps/desktop/README.md`).
`ai/claude` (the Claude Code connector) is still just scaffolding, carried
over from an earlier standalone CLI in this same session — finishing it is
scoped to MVP0.3, not MVP0.1 (see `ai/claude/README.md`).

Read in this order:

1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, AI role
   split, permission model, voice/memory/MCP architecture.
2. [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — tech
   stack, dependency candidates, MVP0.1 task breakdown, file list.
3. [`docs/SECURITY.md`](docs/SECURITY.md) — the non-negotiable rules
   (secrets, mic privacy, permission enforcement, data-vs-instructions).
4. [`docs/MCP_REGISTRY.md`](docs/MCP_REGISTRY.md) — MCP server
   registration schema.
5. [`prompts/shogun-system.md`](prompts/shogun-system.md) — SHOGUN's core
   persona/system prompt.

## Repository layout

```
shogun/
├── apps/desktop/          Tauri (macOS) shell + UI
├── core/
│   ├── orchestrator/      conversation state machine
│   ├── intent-router/     utterance → intent → module
│   ├── permissions/       the ASK BEFORE ACT chokepoint (Level 0-3)
│   ├── planner/           next-action suggestions, memory promotion
│   └── context/           per-turn context assembly
├── voice/
│   ├── wake-word/         on-device "将軍"/"SHOGUN" detection
│   ├── stt/                (placeholder — STT lives in ai/openai today)
│   └── tts/                (placeholder — TTS lives in ai/openai today)
├── ai/
│   ├── openai/             conversation "brain" — Realtime API
│   └── claude/             coding "engineer" — headless Claude Code
├── mcp/
│   ├── client/              lightweight MCP client (Level-0 reads)
│   └── registry/            declarative server list + permission scope
├── memory/
│   ├── working/ daily/ long-term/ projects/
├── integrations/
│   ├── calendar/ gmail/ github/ n8n/
├── database/                local SQLite (memory + action log)
├── prompts/shogun-system.md
├── docs/
└── .env.example
```

Every module directory has its own `README.md` describing its
responsibility and target MVP milestone until real code lands there.

## Design principles carried through every module

- **ASK BEFORE ACT.** Read/prepare freely; anything with an external side
  effect goes through `core/permissions` first (Level 0–3).
- **Provider-adapter, not vendor lock-in.** `core/*` depends on small
  interfaces (`ConversationProvider`, `CodingProvider`) — OpenAI, Claude
  Code, and each MCP server are swappable implementations.
- **Reuse before rewrite.** `ai/claude` started life as a working
  standalone CLI in this session; it was moved and repositioned, not
  thrown away.
- **Local-first.** SQLite + Markdown, no server dependency, for a
  single-user Mac app.

## Setup

```bash
pnpm install
cp .env.example .env        # fill in OPENAI_API_KEY at minimum
pnpm typecheck && pnpm test # sanity check — should pass with no network/mic needed
pnpm dev:core                # terminal A — starts the local WS server on :8787
```

Then, in a second terminal, run the Tauri desktop shell — see
`apps/desktop/README.md` for `cargo tauri dev` instructions and, importantly,
what has and hasn't been verified for the macOS build from this environment.
