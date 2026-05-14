const { contextBridge, ipcRenderer } = require("electron");

const validStates = new Set([
  "idle",
  "wave",
  "record_ready",
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
  onPetStateChanged: (callback) => {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, state) => callback(normalizeState(state));
    ipcRenderer.on("pet-state-changed", listener);
    return () => ipcRenderer.removeListener("pet-state-changed", listener);
  },
  quitApp: () => ipcRenderer.invoke("app:quit"),
});
