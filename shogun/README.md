# SHOGUN — Personal AI Concierge OS

> ユーザー：「将軍」
> SHOGUN：「はい。」

SHOGUN is a persistent, voice-first AI concierge that runs on the user's
Mac: it understands the day (calendar, tasks, projects, past work), suggests
the next action instead of only answering questions, executes across
Claude Code / MCP tools / local systems, and learns over time — always
**asking before any action with external side effects** (ASK BEFORE ACT).

## Status

**MVP0.1 + MVP0.3 implemented, and run end to end.** Conversation loop,
working + daily memory with session recall, Action Log, and Claude Code
delegation with a spoken confirmation gate.

The whole orchestration has actually been exercised — typed turn → model →
tool call → confirmation refused → yes → real `claude -p` run → result
reported back, with a real file on disk at the end — using the offline
harness below (`docs/IMPLEMENTATION_PLAN.md` §12). Only the OpenAI hop was
faked there.

Still unproven, and left to the user's Mac: real microphone capture, real
speaker playback, a built macOS `.app`, and the real OpenAI Realtime
socket (this environment's egress proxy blocks WebSocket upgrades
entirely). See `apps/desktop/README.md` for that checklist.

Read in this order:

1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, AI role
   split, permission model, voice/memory/MCP architecture.
2. [`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — tech
   stack, dependency candidates, MVP0.1 task breakdown, file list.
3. [`docs/SECURITY.md`](docs/SECURITY.md) — the non-negotiable rules
   (secrets, mic privacy, permission enforcement, data-vs-instructions).
4. [`docs/MCP_REGISTRY.md`](docs/MCP_REGISTRY.md) — MCP server
   registration schema.
5. [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — running `core/orchestrator`
   on a small always-on cloud host instead of (or alongside) local dev, so
   SHOGUN stays reachable when the Mac is off.
6. [`prompts/shogun-system.md`](prompts/shogun-system.md) — SHOGUN's core
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
├── Dockerfile, fly.toml      core/orchestrator, cloud-deployable (docs/DEPLOYMENT.md)
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
- **Single-user, not multi-tenant.** SQLite + Markdown storage; `core`
  runs either on the user's own Mac or on a small persistent host they
  control (docs/DEPLOYMENT.md) — never shared across users, never assumed
  to have more than one writer.

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

To run `core/orchestrator` on a small always-on cloud host instead of
(or in addition to) `pnpm dev:core` locally — so SHOGUN stays reachable
when the Mac is asleep or off — see `docs/DEPLOYMENT.md`. The desktop
app's ⚙ settings panel points it at either.

## Trying it without a Mac, a mic, or an OpenAI key

The voice path has a long setup tail. To exercise everything else — the
persona, memory and session recall, Claude Code delegation and its spoken
confirmation gate — three terminals and no hardware:

```bash
pnpm fake:openai                                    # stand-in for OpenAI Realtime
OPENAI_API_KEY=x OPENAI_REALTIME_URL=ws://127.0.0.1:8799 \
  CLAUDE_DELEGATION_ENABLED=true CLAUDE_CWD=~/shogun-sandbox pnpm dev:core
pnpm cli                                            # type at it
```

Ask it to create a file and say はい when it asks — Claude Code really
runs. See `docs/IMPLEMENTATION_PLAN.md` §12 for a transcript of this
working, and for what the fake deliberately does *not* prove.

## Running costs

Two separate bills, and only one of them scales with how much you talk:

- **OpenAI Realtime API** — usage-billed per minute of audio in/out. This
  is the one that grows: a few short exchanges in a morning is small
  change; leaving SHOGUN in conversation all day is a few dollars. Check
  OpenAI's current Realtime pricing rather than trusting any figure
  written here — it has changed before and will again.
- **Claude Code** (from MVP0.3, once `ai/claude` is wired in) — runs
  under the existing Claude subscription, so delegated coding tasks don't
  add per-task API charges.
- **Cloud host** (optional, docs/DEPLOYMENT.md) — one small always-on
  machine plus a 1GB volume.

Idle cost is near zero by design: the mic only opens after a wake/click,
and the Realtime socket is only opened for an active conversation
(docs/SECURITY.md), so SHOGUN sitting in the menu bar isn't billing you.
