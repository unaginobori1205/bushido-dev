# voice/stt

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Speech-to-text is provided by the OpenAI Realtime API session managed in `ai/openai` (transcription events on the same socket as the conversation) rather than a separate STT call. This directory is a placeholder in case a standalone/offline STT path is needed later (e.g. wake-word confirmation without a network round-trip).
