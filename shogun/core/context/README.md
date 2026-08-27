# core/context

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Assembles the context handed to `ai/openai`/`ai/claude` for a turn: working memory, relevant daily/long-term/project memory, and clearly delimited external data (see `docs/SECURITY.md` — data vs. instructions). MVP0.1 needs only the working-memory buffer.
