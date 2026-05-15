const { contextBridge, ipcRenderer } = require("electron");

const validStates = new Set([
  "idle",
  "wave",
  "record_ready",
  "collect",
  "success",
  "thinking",
  "writing",
  "happy",
  "confused",
  "angry",
  "sleep",
  "drag",
  "error",
]);

function normalizeState(state) {
  return validStates.has(state) ? state : "idle";
}

contextBridge.exposeInMainWorld("kojiDesktop", {
  showMainWindow: () => ipcRenderer.invoke("main-window:show"),
  hideMainWindow: () => ipcRenderer.invoke("main-window:hide"),
  toggleMainWindow: () => ipcRenderer.invoke("main-window:toggle"),
  setPetState: (state) => ipcRenderer.invoke("pet-state:set", normalizeState(state)),
  submitQuickRecord: (text, tag) => ipcRenderer.invoke("quick-record:add", { text, tag }),
  showPetContextMenu: () => ipcRenderer.invoke("show-pet-context-menu"),
  sendDesktopCommand: (command) => ipcRenderer.invoke("desktop-command:send", command),
  movePetWindow: (deltaX, deltaY) => ipcRenderer.invoke("pet-window:move", { deltaX, deltaY }),
  onPetStateChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, state) => callback(normalizeState(state));
    ipcRenderer.on("pet-state-changed", listener);
    return () => ipcRenderer.removeListener("pet-state-changed", listener);
  },
  onPetCommand: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, command) => callback(command);
    ipcRenderer.on("pet-command", listener);
    return () => ipcRenderer.removeListener("pet-command", listener);
  },
  onQuickRecord: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("quick-record:add", listener);
    return () => ipcRenderer.removeListener("quick-record:add", listener);
  },
  sendQuickRecordResult: (id, result) => ipcRenderer.send("quick-record:result", { id, result }),
  onDesktopCommand: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, command) => callback(command);
    ipcRenderer.on("desktop-command", listener);
    return () => ipcRenderer.removeListener("desktop-command", listener);
  },
  quitApp: () => ipcRenderer.invoke("app:quit"),
});
