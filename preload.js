const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  getDatabaseStatus: () => ipcRenderer.invoke("database:get-status"),
  getDatabaseSettings: () => ipcRenderer.invoke("database:get-settings"),
  saveDatabaseSettings: (settings) => ipcRenderer.invoke("database:save-settings", settings),
});
