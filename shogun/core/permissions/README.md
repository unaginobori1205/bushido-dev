# core/permissions

Status: **MVP0.1 implemented** (see `docs/IMPLEMENTATION_PLAN.md` §6). Unit-tested with vitest where the module is pure logic; `server.ts`/wiring code is exercised by a manual smoke run (see apps/desktop/README.md) rather than automated tests.

The single chokepoint for the Permission Level model (0 READ / 1 PREPARE / 2 CONFIRM / 3 CRITICAL — see `docs/ARCHITECTURE.md` §5 and `docs/SECURITY.md`). Every side-effecting call from the orchestrator passes through here first. MVP0.1 only needs the enum + guard function scaffolded, since MVP0.1 has no Level 1+ intents.
