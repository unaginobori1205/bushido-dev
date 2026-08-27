# apps/desktop

Status: **not implemented yet** — design only, see `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`.

Tauri v2 shell: tray icon, global shortcut, transparent bottom-right WebView panel, mic capture via `getUserMedia` + `AudioWorklet`, speaker playback. Hosts the UI states (IDLE/LISTENING/THINKING/SPEAKING/CONFIRMING/EXECUTING). Talks to the `core/orchestrator` sidecar over local IPC. Target milestone: MVP0.1. Must be built and run on macOS by the user — this repository's dev environment cannot build or launch a Tauri app.
