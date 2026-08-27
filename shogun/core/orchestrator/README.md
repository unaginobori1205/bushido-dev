# core/orchestrator

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Owns the conversation state machine (IDLE→LISTENING→THINKING→SPEAKING→CONFIRMING→EXECUTING). Wires `ai/openai` (conversation), `core/intent-router` (classification), `core/permissions` (the ASK BEFORE ACT gate), and `memory/*`. No other module should talk to `ai/claude` or `mcp/client` directly — always through here. Target milestone: MVP0.1 (basic loop), grows through MVP0.2+.
