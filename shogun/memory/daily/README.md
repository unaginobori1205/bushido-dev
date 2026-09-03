# memory/daily

Status: **MVP0.1 implemented** (see `docs/IMPLEMENTATION_PLAN.md` §6). Unit-tested with vitest where the module is pure logic; `server.ts`/wiring code is exercised by a manual smoke run (see apps/desktop/README.md) rather than automated tests.

One record per day (projects/decisions/completed_tasks/unfinished_tasks/important_people/notes — spec §8 schema) in the local SQLite DB (`database/`). Written on session end and read on next launch to answer '前回何してた？'. Target milestone: MVP0.1.
