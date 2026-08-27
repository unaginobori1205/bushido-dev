# core/intent-router

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Classifies a transcribed utterance into an intent + slots (see the table in `docs/ARCHITECTURE.md` §4) and routes it to the owning module. MVP0.1 only needs a `conversation.reply` fallback; real routing starts at MVP0.2 (calendar).
