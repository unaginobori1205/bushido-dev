# database

Status: **MVP0.1 implemented** (see `docs/IMPLEMENTATION_PLAN.md` §6). Unit-tested with vitest where the module is pure logic; `server.ts`/wiring code is exercised by a manual smoke run (see apps/desktop/README.md) rather than automated tests.

Single local SQLite file (`better-sqlite3` + `drizzle-orm` migrations) backing `memory/daily`, `memory/long-term`, and the Action Log (spec §23: timestamp, user_request, intent, tool, parameters, permission_level, confirmation, result). Git-ignored — see `docs/SECURITY.md`. Target milestone: MVP0.1 (daily memory + action log), extended through later milestones.
