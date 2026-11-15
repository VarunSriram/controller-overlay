# Tauri Xbox Controller Overlay

[Download the Latest Version (Windows .exe)](https://github.com/VarunSriram/controller-overlay/releases/latest/download/controller-overlay.exe)

Standalone desktop application that displays a real-time, transparent Xbox controller overlay on top of your games. Designed specifically for game developers and streamers, this tool tracks controller inputs globally in the background without stealing window focus.

## Why This Exists
I wanted a simple desktop application to display a controller overlay when conducting demo presentations for a game project. I was surprised to discover the only options available were web-based, which required running tools like OBS in tandem. 

While developing this, I discovered standard web-based Gamepad APIs (`navigator.getGamepads()`) are hardcoded across modern browser engines and WebViews to freeze inputs the moment a window loses focus. This makes standard web-based controller overlays useless when you click into a fullscreen game like a Unity build. 

This application solves that by completely bypassing the webview's hardware APIs. It uses a natively compiled Rust backend to query the Windows XInput API directly in the background, streaming the raw data to a lightweight frontend at 60Hz.

This application solves that by completely bypassing the browser's hardware APIs. It uses a natively compiled Rust backend to query the Windows XInput API directly in the background, streaming the raw data to a lightweight frontend at 60Hz.

## Tech Stack
- **[Tauri v2](https://tauri.app/)**: Ultra-lightweight desktop application framework.
- **[Rust](https://www.rust-lang.org/)**: Backend logic, multi-threading, and hardware polling.
- **[Windows Crate](https://microsoft.github.io/windows-docs-rs/)**: Microsoft's official Rust bindings to directly access `xinput1_4.dll`.
- **HTML/CSS/JS**: Vanilla frontend with no bundlers or heavy JS frameworks.

## How It Works

1. **`src-tauri/src/lib.rs` (The Rust Backend)**: Instead of relying on the browser engine, Tauri spawns a 60Hz background thread that directly polls the legacy Windows XInput API. This guarantees continuous input reading regardless of which window holds focus, completely bypassing browser engine's security sandbox.
2. **IPC Data Injection**: The background thread serializes the hardware state into a JSON payload and safely injects it into the frontend window using `window.eval()`. It also manages a graceful shutdown lifecycle using atomic cancellation tokens.
3. **`renderer.js` & `styles.css` (The Frontend)**: Receives the raw hardware integers and normalizes them into web-friendly percentages. Features modern CSS `color-mix()` for analog trigger gradient fills and dynamic CSS box-shadows for directional thumbstick tilt highlights based on vector magnitudes.

## Installation

**Prerequisites:** 
- Windows 10/11 (Requires `xinput1_4.dll`)
- [Node.js](https://nodejs.org/) (To manage frontend dependencies and Tauri CLI)
- [Rust Toolchain](https://rustup.rs/) (To compile the backend)

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the application in development mode:
   ```bash
   npm run start
   ```

## Usage
- **Positioning**: The overlay is completely borderless and transparent. Click and drag anywhere on the controller body to move it around your screen.
- **Scaling**: Click the `+` or `-` buttons on the floating UI panel to resize the overlay to fit your presentation layout.

## Building
To build a standalone `.exe` that you can distribute:
```bash
npm run build
```
Once finished, your deliverables will be located in:
* **Standalone Portable Executable:** `src-tauri/target/release/controller-overlay.exe`
* **Windows Setup Installer:** `src-tauri/target/release/bundle/nsis/`

## Platform Support
Currently, this application is **Windows-only**. It explicitly targets the native Windows XInput DLL to achieve zero-friction background polling without fighting OS compositors or security prompts. 

Future updates for macOS or Linux support would involve swapping the XInput backend for a cross-platform Rust library (like `gilrs`), though macOS users may require explicit "Input Monitoring" security permissions to allow background hardware polling.
