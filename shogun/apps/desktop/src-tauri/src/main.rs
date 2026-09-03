// SHOGUN desktop shell — MVP0.1.
//
// Deliberately thin (docs/ARCHITECTURE.md §2, §9): this Rust layer only
// owns the window/tray/global-shortcut/OS surface. Conversation logic,
// memory, and the OpenAI Realtime connection all live in the Node
// core (`core/orchestrator/server.ts`, run separately via `pnpm dev:core`
// during development); the frontend loaded into this window talks to it
// directly over a localhost WebSocket. See apps/desktop/README.md for the
// full dev-run instructions and the caveat that this file has only been
// `cargo check`ed on Linux, not built as a real macOS .app.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    tray::TrayIconBuilder, AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, WebviewWindow,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const WAKE_EVENT: &str = "shogun://wake";
const SLEEP_EVENT: &str = "shogun://sleep";

/// Places the panel in the bottom-right corner of the primary monitor,
/// matching the product spec's "画面右下からアニメーション" (spec §15).
/// tauri.conf.json can't compute this (it depends on the actual screen
/// size at runtime), so it's done here once, on first show.
fn position_bottom_right(window: &WebviewWindow) {
    let Ok(Some(monitor)) = window.primary_monitor() else {
        return;
    };
    let scale = monitor.scale_factor();
    let screen_size = monitor.size().to_logical::<f64>(scale);
    let Ok(win_size) = window.outer_size() else {
        return;
    };
    let win_size: LogicalSize<f64> = win_size.to_logical(scale);

    const MARGIN: f64 = 24.0;
    let x = (screen_size.width - win_size.width - MARGIN).max(0.0);
    let y = (screen_size.height - win_size.height - MARGIN).max(0.0);
    let _ = window.set_position(LogicalPosition::new(x, y));
}

/// Shared "the user just summoned SHOGUN" handler for both the tray icon
/// click and the global shortcut — toggles the panel and tells the
/// frontend to open a fresh conversation turn (WAKE, per
/// core/orchestrator/stateMachine.ts).
fn toggle_panel(app: &AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    let is_visible = window.is_visible().unwrap_or(false);
    if is_visible {
        let _ = window.hide();
        let _ = app.emit(SLEEP_EVENT, ());
    } else {
        position_bottom_right(&window);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = app.emit(WAKE_EVENT, ());
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();

            // Tray icon: left-click toggles the panel (MVP0.1's
            // click-to-open trigger — spec §25 item 2). True wake-word
            // activation is a follow-up milestone (docs/ARCHITECTURE.md §6),
            // not part of MVP0.1.
            TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().expect("bundled tray icon"))
                .tooltip("SHOGUN")
                .on_tray_icon_event(move |tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_panel(tray.app_handle());
                    }
                })
                .build(app)?;

            // Global shortcut fallback (works even when the tray isn't
            // reachable, e.g. no mouse). Cmd+Shift+J chosen to avoid common
            // OS-reserved combinations; revisit once real usage surfaces a
            // preference.
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyJ);
            let shortcut_handle = handle.clone();
            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    toggle_panel(&shortcut_handle);
                }
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running SHOGUN desktop shell");
}
