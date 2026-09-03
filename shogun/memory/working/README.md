# memory/working

Status: **MVP0.1 implemented** (see `docs/IMPLEMENTATION_PLAN.md` §6). Unit-tested with vitest where the module is pure logic; `server.ts`/wiring code is exercised by a manual smoke run (see apps/desktop/README.md) rather than automated tests.

In-process rolling buffer of the current conversation, capped in length, fed back into each turn's context via `core/context`. In-memory only — cleared when the conversation ends. Target milestone: MVP0.1.
