# ai/claude

Implements the `CodingProvider` interface (see `../../docs/ARCHITECTURE.md`
§3) against the user's own Claude Code install, via headless
`claude -p "<instruction>" --output-format json [--resume <sessionId>]`.

## History / current state

This started, earlier in the same session as the SHOGUN design docs, as a
**standalone CLI called `voice-claude`**: a cross-platform, headless voice
assistant that streamed mic audio to the OpenAI Realtime API
(`gpt-realtime-2.1`), forwarded every transcribed utterance straight to
`claude -p`, and spoke the reply back through the speakers — muting the mic
while speaking (+ a short window after) to avoid the speaker's own audio
being picked back up, since a headless CLI has no OS-level echo
cancellation to rely on.

When the SHOGUN spec arrived, the decision was to **keep this code as the
base for SHOGUN's Claude Code connector** rather than rewrite it — so this
directory is where it now lives. Only the scaffolding (`package.json`,
`.env.example`) was moved so far; the actual `src/` (Realtime client, audio
I/O, Claude bridge, orchestration loop) is not written yet — see
`docs/IMPLEMENTATION_PLAN.md`, where finishing it is scoped to **MVP0.3**
("continue yesterday's work"), not MVP0.1 (MVP0.1 is OpenAI-only
conversation, no Claude Code).

Two things will change when this is finished as a SHOGUN module rather than
a standalone CLI:

- It stops owning its own top-level process/CLI entrypoint and instead
  exposes the `CodingProvider.run()` interface for `core/orchestrator` to
  call, gated by `core/permissions`.
- Session persistence (which Claude Code `session_id` to `--resume`) is
  keyed per SHOGUN project (`memory/projects/<slug>/`) instead of per
  filesystem `cwd`.

The `voice-claude`-as-standalone-CLI behavior (mic-mute mode, run from any
project directory, no SHOGUN UI required) is still a reasonable thing to
keep working on its own — see `interruption_mode: "mute-while-speaking"` in
`../openai`'s design — but is no longer the primary target; SHOGUN's desktop
app is.

## Verified against the real CLI (this session)

`claude -p "..." --output-format json [--resume <id>]` was smoke-tested in
this environment and returns a single JSON object with (at least)
`session_id`, `result`, `type: "result"`, `subtype`, `is_error` — this
matches what `ai/claude`'s bridge code will parse.
