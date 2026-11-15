use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use std::time::Duration;
use tauri::Manager;
use windows::Win32::UI::Input::XboxController::{XInputGetState, XINPUT_STATE};

#[derive(serde::Serialize)]
#[allow(non_snake_case)]
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
            
            let is_running = Arc::new(AtomicBool::new(true));
            let is_running_clone = is_running.clone();
            
            if let Some(window) = app_handle.get_webview_window("main") {
                // Force Windows to push the overlay to the top of the Z-order at runtime
                let _ = window.set_always_on_top(true);

                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Destroyed = event {
                        is_running_clone.store(false, Ordering::Relaxed);
                    }
                });
            }
            
            std::thread::spawn(move || {
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