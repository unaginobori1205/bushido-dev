# apps/desktop

Status: **MVP0.1 implemented**, unverified on macOS (this environment has
no Mac / GUI hardware — see the verification note below).

Tauri v2 shell: tray icon (left-click toggles the panel), a global
shortcut (`Cmd+Shift+J`) as a fallback, a transparent/borderless
always-on-top WebView panel anchored to the bottom-right of the screen
(spec §15), and a plain HTML/CSS/JS frontend (no bundler — see
`src/index.html`'s comment) implementing the four MVP0.1 UI states
(IDLE/LISTENING/THINKING/SPEAKING).

This shell does **not** contain the conversation logic. It only owns the
window/tray/shortcut/mic-capture/audio-playback surface; everything else
(state machine, OpenAI Realtime connection, memory) runs as a separate
local process — `core/orchestrator/server.ts` — that the frontend talks to
over a plain WebSocket (`ws://127.0.0.1:8787`). See
`docs/ARCHITECTURE.md` §2 for why, and `core/orchestrator/server.ts`'s
header comment for the wire protocol.

## Running it (macOS)

Two processes, in two terminals, from the `shogun/` directory:

```bash
# 1. install core deps once
pnpm install

# 2. copy and fill in the env file (OPENAI_API_KEY at minimum)
cp .env.example .env

# 3. terminal A — the core (state machine, memory, OpenAI Realtime)
pnpm dev:core

# 4. terminal B — the desktop shell
cd apps/desktop/src-tauri
cargo tauri dev   # or: pnpm dlx @tauri-apps/cli dev, if you'd rather not install the CLI globally
```

The app starts hidden in the menu bar tray. Click the tray icon (or press
`Cmd+Shift+J`) to open the panel; the browser will then prompt for
microphone permission (macOS will also separately prompt at the OS level —
see the Info.plist note below).

## What's verified vs. not, from this environment

This session's sandbox has no Mac, no display, and no microphone/speaker,
so the following could **not** be end-to-end verified here and need
checking on a real Mac before relying on this:

- That `cargo tauri dev`/`cargo tauri build` actually produce a working
  macOS app (the Rust code was verified with `cargo check` **on Linux**,
  which caught real compile errors against the exact Tauri v2 API surface
  used — tray icon, global shortcut, window positioning — but Linux and
  macOS pull in different platform backends under the hood).
- That `Info.plist`'s `NSMicrophoneUsageDescription` actually gets merged
  into the bundled app's Info.plist by `tauri-build` and that macOS shows
  the mic permission prompt correctly.
- That `AudioContext({ sampleRate: 24000 })` + the `pcm-worklet.js`
  `AudioWorkletProcessor` produce clean, correctly-timed 24kHz PCM16 in
  Tauri's WKWebView specifically (this is standard Web Audio API, but
  WebView audio stacks have historically had quirks worth listening for).
- Real end-to-end audio quality/latency with the OpenAI Realtime API.
- The bottom-right window positioning math (`position_bottom_right` in
  `src/main.rs`) against a real multi-monitor / Retina-scaled setup.

## Icons

`icons/*.png` are flat-color placeholders generated for this PR just so
`tauri.conf.json`'s `bundle.icon` paths resolve to real files. Replace them
with real SHOGUN branding via the Tauri CLI's icon generator, which also
produces the `.icns`/`.ico` variants a full bundle wants:

```bash
cargo tauri icon path/to/source-1024x1024.png
```

## Known simplifications (see docs/ARCHITECTURE.md for the target state)

- No wake-word ("将軍"/"SHOGUN") detection yet — MVP0.1 is click/shortcut
  triggered only, per the spec's own MVP0.1 checklist. `voice/wake-word`
  (Porcupine) is the planned follow-up.
- No bundler/framework for the frontend — plain HTML/CSS/JS. Revisit once
  the UI grows past four states.
- The core process isn't packaged as a Tauri sidecar yet — it's a
  separately-run Node process during development. Bundling it into the
  shipped `.app` is a follow-up, not required for MVP0.1's "works via
  `pnpm dev` + `cargo tauri dev`" bar.
