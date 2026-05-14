const path = require("path");
const { app, BrowserWindow, ipcMain, screen } = require("electron");

let mainWindow = null;
let petWindow = null;
let isQuitting = false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 900,
    minHeight: 680,
    title: "Koji Report Pet",
    show: true,
    backgroundColor: "#fff8ee",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("close", (event) => {
    if (process.platform === "darwin" || !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

function getPetWindowBounds() {
  const { workArea } = screen.getPrimaryDisplay();
  const width = 220;
  const height = 260;
  return {
    width,
    height,
    x: Math.round(workArea.x + workArea.width - width - 28),
    y: Math.round(workArea.y + workArea.height - height - 42),
  };
}

function createPetWindow() {
  const bounds = getPetWindowBounds();
  petWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  petWindow.setAlwaysOnTop(true, "screen-saver");
  petWindow.loadFile("pet.html");

  petWindow.on("closed", () => {
    petWindow = null;
  });

  return petWindow;
}

function showMainWindow() {
  if (!mainWindow) createMainWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function hideMainWindow() {
  if (mainWindow) mainWindow.hide();
}

function toggleMainWindow() {
  if (!mainWindow || !mainWindow.isVisible()) {
    showMainWindow();
    return;
  }
  hideMainWindow();
}

function broadcastPetState(state) {
  [mainWindow, petWindow].forEach((windowRef) => {
    if (windowRef && !windowRef.isDestroyed()) {
      windowRef.webContents.send("pet-state-changed", state);
    }
  });
}

ipcMain.handle("main-window:show", () => showMainWindow());
ipcMain.handle("main-window:hide", () => hideMainWindow());
ipcMain.handle("main-window:toggle", () => toggleMainWindow());
ipcMain.handle("pet-state:set", (_event, state) => broadcastPetState(state));
ipcMain.handle("app:quit", () => {
  isQuitting = true;
  app.quit();
});

app.whenReady().then(() => {
  createMainWindow();
  createPetWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createPetWindow();
    } else {
      showMainWindow();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
