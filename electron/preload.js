const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose any necessary IPC methods here
  // For now, most communication is directly via HTTP/WS to localhost:8000
});
