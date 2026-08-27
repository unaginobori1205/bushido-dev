# database

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Single local SQLite file (`better-sqlite3` + `drizzle-orm` migrations) backing `memory/daily`, `memory/long-term`, and the Action Log (spec §23: timestamp, user_request, intent, tool, parameters, permission_level, confirmation, result). Git-ignored — see `docs/SECURITY.md`. Target milestone: MVP0.1 (daily memory + action log), extended through later milestones.
