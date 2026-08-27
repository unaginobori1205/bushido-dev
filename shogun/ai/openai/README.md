# ai/openai

Status: **MVP0.1 implemented** (see `docs/IMPLEMENTATION_PLAN.md` §6). Unit-tested with vitest where the module is pure logic; `server.ts`/wiring code is exercised by a manual smoke run (see apps/desktop/README.md) rather than automated tests.

Implements the `ConversationProvider` interface (see `docs/ARCHITECTURE.md` §3) against the OpenAI Realtime API (`gpt-realtime-2.1`): session config (semantic_vad turn detection, pcm16/24kHz audio, input transcription), mic streaming, TTS playback, and the `interruption_mode` (`barge-in` default / `mute-while-speaking`) config described in `docs/ARCHITECTURE.md` §6. Target milestone: MVP0.1. Ports the WebSocket/event-handling logic already written for `ai/claude`'s sibling `voice-claude` CLI.
