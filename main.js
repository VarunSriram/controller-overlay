const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const koffi = require('koffi');

const lib = koffi.load('xinput1_4.dll');

const XINPUT_GAMEPAD = koffi.struct('XINPUT_GAMEPAD', {
  wButtons: 'uint16_t',
  bLeftTrigger: 'uint8_t',
  bRightTrigger: 'uint8_t',
  sThumbLX: 'int16_t',
  sThumbLY: 'int16_t',
  sThumbRX: 'int16_t',
  sThumbRY: 'int16_t'
});

const XINPUT_STATE = koffi.struct('XINPUT_STATE', {
  dwPacketNumber: 'uint32_t',
  Gamepad: XINPUT_GAMEPAD
});

const XInputGetState = lib.func('uint32_t __stdcall XInputGetState(uint32_t dwUserIndex, _Out_ XINPUT_STATE *pState)');

function createWindow () {
  const win = new BrowserWindow({
    width: 650, height: 520, transparent: true, frame: false,
    alwaysOnTop: true, focusable: false, resizable: false,
    webPreferences: { 
      nodeIntegration: false,     
      contextIsolation: true,     
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile('overlay.html');

  ipcMain.on('set-scale', (event, scale) => {
    const newWidth = Math.round(650 * scale);
    const newHeight = Math.round(520 * scale);
    win.setSize(newWidth, newHeight);
  });

  ipcMain.on('close-app', () => {
    app.quit();
  });

  const pollingInterval = setInterval(() => {
    let state = {};
    if (XInputGetState(0, state) === 0) {
      // Safety check: Only send data if the window hasn't been destroyed yet
      if (!win.isDestroyed()) {
        win.webContents.send('controller-data', state.Gamepad);
      }
    }
  }, 16);

  win.on('closed', () => {
    clearInterval(pollingInterval);
  });
}

app.disableHardwareAcceleration();
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });