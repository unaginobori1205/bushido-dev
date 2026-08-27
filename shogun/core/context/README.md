# core/context

Status: **partially covered by MVP0.1, not its own module yet.** What this
directory is meant to own — assembling the per-turn context from working
memory + relevant daily/long-term/project memory + clearly delimited
external data (see `docs/SECURITY.md` — data vs. instructions) — is, for
MVP0.1, small enough (working memory + a one-line daily recap) that it's
inlined directly in `core/orchestrator/server.ts`'s `loadSystemPrompt`
rather than factored out here. Likewise the root config loader
(`config.ts`) still lives at the repo root rather than under here — see
docs/ARCHITECTURE.md §10. Both should move into `core/context` once
long-term/project memory (MVP0.2+) makes "assemble the context" a real,
independently testable step instead of one string concatenation.
