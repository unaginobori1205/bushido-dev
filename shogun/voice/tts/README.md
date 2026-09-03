# voice/tts

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Text-to-speech is provided by the same OpenAI Realtime API session (`ai/openai`), via out-of-band `response.create` calls with `conversation:"none"`, reusing the approach already implemented for the standalone `voice-claude` CLI now living in `ai/claude`. Placeholder for a future offline/alternate TTS provider.
