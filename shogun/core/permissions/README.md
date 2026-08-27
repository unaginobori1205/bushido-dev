# core/permissions

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

The single chokepoint for the Permission Level model (0 READ / 1 PREPARE / 2 CONFIRM / 3 CRITICAL — see `docs/ARCHITECTURE.md` §5 and `docs/SECURITY.md`). Every side-effecting call from the orchestrator passes through here first. MVP0.1 only needs the enum + guard function scaffolded, since MVP0.1 has no Level 1+ intents.
