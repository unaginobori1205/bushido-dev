# SHOGUN — Personal AI Concierge OS

> ユーザー：「将軍」
> SHOGUN：「はい。」

SHOGUN is a persistent, voice-first AI concierge that runs on the user's
Mac: it understands the day (calendar, tasks, projects, past work), suggests
the next action instead of only answering questions, executes across
Claude Code / MCP tools / local systems, and learns over time — always
**asking before any action with external side effects** (ASK BEFORE ACT).

## Status

**Design phase.** `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`
lay out the target system and the MVP0.1 task breakdown; no MVP0.1 feature
code exists yet by design (this pass stopped at planning on purpose so the
plan can be reviewed before implementation starts). The one piece of
working groundwork is `ai/claude`'s scaffolding, carried over from an
earlier standalone CLI in this same session (see `ai/claude/README.md`).

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

Not runnable yet — MVP0.1 code hasn't been written. Once it exists,
`docs/IMPLEMENTATION_PLAN.md` §6 has the task list and this README's Setup
section will be filled in with `pnpm install` / dev-run / build steps.
Building and running the Tauri app requires a real Mac (Xcode command line
tools) — this cannot be done from this environment.
