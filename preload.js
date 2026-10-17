const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  getDatabaseStatus: () => ipcRenderer.invoke('database:status'),
  getDatabaseSettings: () => ipcRenderer.invoke('database:settings'),
  saveDatabaseSettings: (settings) => ipcRenderer.invoke('database:save', settings),
});
