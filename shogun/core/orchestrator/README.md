# core/orchestrator

Status: **MVP0.1 implemented** (see `docs/IMPLEMENTATION_PLAN.md` §6). Unit-tested with vitest where the module is pure logic; `server.ts`/wiring code is exercised by a manual smoke run (see apps/desktop/README.md) rather than automated tests.

Owns the conversation state machine (IDLE→LISTENING→THINKING→SPEAKING→CONFIRMING→EXECUTING). Wires `ai/openai` (conversation), `core/intent-router` (classification), `core/permissions` (the ASK BEFORE ACT gate), and `memory/*`. No other module should talk to `ai/claude` or `mcp/client` directly — always through here. Target milestone: MVP0.1 (basic loop), grows through MVP0.2+.
