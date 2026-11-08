# Electron Controller Overlay

A lightweight, standalone desktop application that displays a real-time, transparent Xbox controller overlay on top of your games. Designed specifically for game developers and streamers, this tool tracks controller inputs globally in the background without stealing window focus.

## Why This Exists
I wanted a simple desktop application to display a controller overlay when conducting demo presentations for a game project. 
I was surprised to discover the only options available were web based that required running tools like OBS in tandem. 
While developing this I discovered standard web-based Gamepad APIs (`navigator.getGamepads()`) are hardcoded in Chromium to freeze inputs the moment a window loses focus. This makes standard web-based controller overlays useless when you click into a fullscreen game like a Unity build. 

This application solves that by bypassing the browser sandbox, using native bindings to query the Windows XInput API directly, and streaming the data to the frontend.

## Tech Stack
* **[Electron](https://www.electronjs.org/)** - Desktop application framework.
* **[Node.js](https://nodejs.org/)** - Backend JavaScript runtime.
* **[Koffi](https://koffi.dev/)** - A fast, pre-compiled Foreign Function Interface (FFI) for Node.js.
* **HTML/CSS/JS** - Vanilla frontend with no heavy frameworks.

## How It Works

1. **`main.js` (The Backend)**: Instead of relying on the browser engine, the main process uses **Koffi** to dynamically load the native Windows `xinput1_4.dll`. It polls the hardware data, completely bypassing Chromium's security sandbox.
2. **`preload.js` (The Bridge)**: Exposes an API to the frontend so it can receive data streams without granting the DOM access to the underlying operating system.
3. **`renderer.js` & `styles.css` (The Frontend)**: Receives the sanitized input payload via Inter-Process Communication (IPC) and dynamically updates the UI. Features analog trigger gradient fills and dynamic thumbstick tilt shadows based on raw vector magnitudes.

## Installation

**Prerequisites:** 
* Windows 10/11 (Requires `xinput1_4.dll`)
* Node.js installed on your machine.

1. Clone or download this repository.
2. Open a terminal in the project directory.
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```

*(Note: Because this project uses `koffi` instead of native C++ modules, there is no need to install Python or Visual Studio Build Tools to run `npm install`!)*

## Usage
* **Positioning**: The overlay is borderless and transparent. Click and drag anywhere on the controller body to move it around your screen.
* **Scaling**: Click the `+` or `-` buttons on the floating UI panel to resize the overlay to fit your presentation layout.
* **Focus Protection**: The overlay is set to `focusable: false`. Clicking the scale buttons, using the close button, or dragging the overlay will **not** steal active focus from your game.

## Building
To build a standalone `.exe` that you can distribute:
```bash
npm run build
```
The compiled executable will be located in the `dist/win-unpacked/` folder.

## Platform Support
Currently, this application is **Windows-only**. It explicitly targets the native Windows XInput DLL to achieve zero-friction background polling. From my research porting to macOS or Linux would require writing an OS-platform router in `main.js` to read from `/dev/input` (Linux) or spawn a Sidecar Swift process (Mac). This may come in a future updates with further instructions. 
