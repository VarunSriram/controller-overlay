use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use std::time::Duration;
use tauri::Manager;
use windows::Win32::UI::Input::XboxController::{XInputGetState, XINPUT_STATE};

#[derive(serde::Serialize)]
struct GamepadState {
    wButtons: u16,
    bLeftTrigger: u8,
    bRightTrigger: u8,
    sThumbLX: i16,
    sThumbLY: i16,
    sThumbRX: i16,
    sThumbRY: i16,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // 1. The Cancellation Token
            let is_running = Arc::new(AtomicBool::new(true));
            let is_running_clone = is_running.clone();
            
            // 2. Intercept window destruction and flip the flag
            // When JS calls app.exit(0), Tauri destroys this window, triggering this event
            if let Some(window) = app_handle.get_webview_window("main") {
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Destroyed = event {
                        is_running_clone.store(false, Ordering::Relaxed);
                    }
                });
            }
            
            // 3. The Controller Thread
            std::thread::spawn(move || {
                // Loop breaks cleanly when the flag is flipped
                while is_running.load(Ordering::Relaxed) {
                    let mut state = XINPUT_STATE::default();
                    
                    unsafe {
                        if XInputGetState(0, &mut state) == 0 {
                            let payload = GamepadState {
                                wButtons: state.Gamepad.wButtons.0,
                                bLeftTrigger: state.Gamepad.bLeftTrigger,
                                bRightTrigger: state.Gamepad.bRightTrigger,
                                sThumbLX: state.Gamepad.sThumbLX,
                                sThumbLY: state.Gamepad.sThumbLY,
                                sThumbRX: state.Gamepad.sThumbRX,
                                sThumbRY: state.Gamepad.sThumbRY,
                            };

                            if let Ok(json) = serde_json::to_string(&payload) {
                                if let Some(window) = app_handle.get_webview_window("main") {
                                    let js = format!("if (window.updateControllerData) window.updateControllerData({});", json);
                                    let _ = window.eval(&js);
                                }
                            }
                        }
                    }
                    std::thread::sleep(Duration::from_millis(16));
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}