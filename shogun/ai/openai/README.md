# ai/openai

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Implements the `ConversationProvider` interface (see `docs/ARCHITECTURE.md` §3) against the OpenAI Realtime API (`gpt-realtime-2.1`): session config (semantic_vad turn detection, pcm16/24kHz audio, input transcription), mic streaming, TTS playback, and the `interruption_mode` (`barge-in` default / `mute-while-speaking`) config described in `docs/ARCHITECTURE.md` §6. Target milestone: MVP0.1. Ports the WebSocket/event-handling logic already written for `ai/claude`'s sibling `voice-claude` CLI.
