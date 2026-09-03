# ai/claude

Status: **implemented (MVP0.3)** — see `docs/IMPLEMENTATION_PLAN.md` §11.

Implements the `CodingProvider` interface (see `../../docs/ARCHITECTURE.md`
§3) against the user's own Claude Code install, via headless
`claude -p "<instruction>" --output-format json [--resume <sessionId>]`.

`claudeBridge.ts` spawns the CLI (argv, never a shell, so a spoken
instruction can't become shell syntax); `sessionStore.ts` remembers one
Claude session id per working directory so "continue yesterday's work"
resumes rather than restarts. Both are unit tested, and the bridge has
been run against the real `claude` CLI including session resume.

Delegation is off unless `CLAUDE_DELEGATION_ENABLED=true`, refuses to run
when core is cloud-hosted, and is gated by a spoken confirmation —
see `docs/SECURITY.md` and `core/orchestrator/server.ts`'s tool-call
handler.

## History / current state

This started, earlier in the same session as the SHOGUN design docs, as a
**standalone CLI called `voice-claude`**: a cross-platform, headless voice
assistant that streamed mic audio to the OpenAI Realtime API
(`gpt-realtime-2.1`), forwarded every transcribed utterance straight to
`claude -p`, and spoke the reply back through the speakers — muting the mic
while speaking (+ a short window after) to avoid the speaker's own audio
being picked back up, since a headless CLI has no OS-level echo
cancellation to rely on.

When the SHOGUN spec arrived, the decision was to **keep this idea as the
base for SHOGUN's Claude Code connector** rather than rewrite it — so this
directory is where it now lives, finished as MVP0.3.

What changed in becoming a SHOGUN module rather than a standalone CLI:

- No top-level process or CLI entrypoint of its own. It exposes
  `ClaudeBridge.run()` for `core/orchestrator` to call, gated by
  `core/permissions` and a spoken confirmation.
- The old standalone `package.json` and `.env.example` are gone: this is
  part of the root package now (the stale `"type": "commonjs"` would also
  have broken ESM resolution once compiled), and every `CLAUDE_*` setting
  lives in the root `.env.example`.
- Session persistence is keyed per working directory (`sessionStore.ts`)
  rather than a single global id, since Claude Code's own history is
  per-project. Keying per SHOGUN project (`memory/projects/<slug>/`) is
  still the eventual target once project memory exists.

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
