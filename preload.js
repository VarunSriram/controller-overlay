const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setScale: (scale) => ipcRenderer.send('set-scale', scale),
  closeApp: () => ipcRenderer.send('close-app'),
  onControllerData: (callback) => ipcRenderer.on('controller-data', callback)
});