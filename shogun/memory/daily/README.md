# memory/daily

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

One record per day (projects/decisions/completed_tasks/unfinished_tasks/important_people/notes — spec §8 schema) in the local SQLite DB (`database/`). Written on session end and read on next launch to answer '前回何してた？'. Target milestone: MVP0.1.
