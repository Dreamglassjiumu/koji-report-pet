const path = require("path");
const { app, BrowserWindow, ipcMain, screen, Menu } = require("electron");

let mainWindow = null;
let petWindow = null;
let isQuitting = false;
let petBoundsMemory = null;
let petWindowMode = "compact";
let compactPetBoundsMemory = null;
let quickRecordRequestId = 0;

const petWindowSizes = {
  compact: { width: 260, height: 300 },
  quickInput: { width: 340, height: 520 },
};

const petStateLabels = [
  ["idle", "待机"],
  ["wave", "打招呼"],
  ["record_ready", "准备记录"],
  ["collect", "收集记录"],
  ["success", "成功"],
  ["thinking", "思考"],
  ["writing", "写日报"],
  ["happy", "开心"],
  ["confused", "疑惑"],
  ["angry", "催一下"],
  ["sleep", "困了"],
  ["drag", "拖动"],
  ["error", "报错"],
];

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

  mainWindow.setMenuBarVisibility(false);
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

function clampPetBounds(bounds) {
  const display = screen.getDisplayMatching(bounds);
  const { workArea } = display || screen.getPrimaryDisplay();
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;

  return {
    width,
    height,
    x: Math.round(Math.min(Math.max(bounds.x, minX), maxX)),
    y: Math.round(Math.min(Math.max(bounds.y, minY), maxY)),
  };
}

function getPetWindowBounds() {
  if (petBoundsMemory) return clampPetBounds(petBoundsMemory);
  const { workArea } = screen.getPrimaryDisplay();
  const { width, height } = petWindowSizes.compact;
  return {
    width,
    height,
    x: Math.round(workArea.x + workArea.width - width - 28),
    y: Math.round(workArea.y + workArea.height - height - 42),
  };
}

function setPetWindowMode(mode = "compact") {
  if (!petWindow || petWindow.isDestroyed()) return;
  const nextMode = mode === "quickInput" ? "quickInput" : "compact";
  const nextSize = petWindowSizes[nextMode];
  const currentBounds = petWindow.getBounds();

  if (nextMode === "quickInput" && petWindowMode !== "quickInput") {
    compactPetBoundsMemory = { ...currentBounds, ...petWindowSizes.compact };
  }

  const targetBounds = nextMode === "compact" && compactPetBoundsMemory
    ? { ...compactPetBoundsMemory, ...nextSize }
    : { ...currentBounds, ...nextSize };
  const safeBounds = clampPetBounds(targetBounds);

  petWindowMode = nextMode;
  petWindow.setBounds(safeBounds, false);
  petBoundsMemory = safeBounds;

  if (nextMode === "compact") {
    compactPetBoundsMemory = safeBounds;
  }
}

function createPetWindow() {
  const bounds = getPetWindowBounds();
  petWindow = new BrowserWindow({
    ...bounds,
    title: "Koji Pet",
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

  petWindow.on("moved", () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    petBoundsMemory = petWindow.getBounds();
    if (petWindowMode === "compact") compactPetBoundsMemory = petBoundsMemory;
  });

  petWindow.on("resized", () => {
    if (petWindow && !petWindow.isDestroyed()) petBoundsMemory = petWindow.getBounds();
  });

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

async function sendMainCommand(command) {
  showMainWindow();
  if (mainWindow.webContents.isLoading()) {
    await new Promise((resolve) => mainWindow.webContents.once("did-finish-load", resolve));
  }
  mainWindow.webContents.send("desktop-command", command);
}

async function requestQuickRecord(text, tag) {
  showMainWindow();
  if (mainWindow.webContents.isLoading()) {
    await new Promise((resolve) => mainWindow.webContents.once("did-finish-load", resolve));
  }
  const id = String(++quickRecordRequestId);
  const payload = { id, text, tag };
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve({ ok: false, message: "主窗口响应超时。" }), 3000);
    ipcMain.once(`quick-record:result:${id}`, (_event, result) => {
      clearTimeout(timeout);
      resolve(result || { ok: false, message: "记录失败。" });
    });
    mainWindow.webContents.send("quick-record:add", payload);
  });
}

function showPetContextMenu() {
  const menu = Menu.buildFromTemplate([
    { label: "Koji 菜单", enabled: false },
    { type: "separator" },
    { label: "快速记录", click: () => petWindow?.webContents.send("pet-command", "quick-record") },
    { label: "打开完整面板", click: () => showMainWindow() },
    { label: "隐藏完整面板", click: () => hideMainWindow() },
    { label: "查看今日记录", click: () => sendMainCommand("focus-today") },
    { type: "separator" },
    { label: "生成今日日报", click: () => { broadcastPetState("writing"); sendMainCommand("generate-report"); } },
    { label: "复制今日日报", click: () => sendMainCommand("copy-report") },
    { label: "复制给 GPT 润色", click: () => sendMainCommand("copy-gpt-prompt") },
    { label: "导出 TXT", click: () => sendMainCommand("export-txt") },
    { label: "导出 Markdown", click: () => sendMainCommand("export-markdown") },
    { label: "生成今日简报", click: () => { broadcastPetState("writing"); sendMainCommand("generate-brief"); } },
    { label: "生成周报素材", click: () => { broadcastPetState("writing"); sendMainCommand("generate-weekly"); } },
    { type: "separator" },
    {
      label: "Koji 动作",
      submenu: petStateLabels.map(([state, label]) => ({ label, click: () => broadcastPetState(state) })),
    },
    { type: "separator" },
    { label: "设置", click: () => sendMainCommand("focus-settings") },
    { label: "退出", click: () => { isQuitting = true; app.quit(); } },
  ]);
  menu.popup({ window: petWindow || mainWindow || undefined });
}

ipcMain.handle("main-window:show", () => showMainWindow());
ipcMain.handle("main-window:hide", () => hideMainWindow());
ipcMain.handle("main-window:toggle", () => toggleMainWindow());
ipcMain.handle("pet-state:set", (_event, state) => broadcastPetState(state));
ipcMain.handle("quick-record:add", (_event, { text, tag }) => requestQuickRecord(text, tag));
ipcMain.handle("show-pet-context-menu", () => showPetContextMenu());
ipcMain.handle("pet-window:set-mode", (_event, mode) => setPetWindowMode(mode));
ipcMain.handle("desktop-command:send", (_event, command) => sendMainCommand(command));
ipcMain.handle("pet-window:move", (_event, { deltaX = 0, deltaY = 0 }) => {
  if (!petWindow || petWindow.isDestroyed()) return;
  const [x, y] = petWindow.getPosition();
  petWindow.setPosition(Math.round(x + deltaX), Math.round(y + deltaY), false);
  petBoundsMemory = petWindow.getBounds();
  compactPetBoundsMemory = { ...petBoundsMemory, ...petWindowSizes.compact };
});
ipcMain.handle("app:quit", () => {
  isQuitting = true;
  app.quit();
});
ipcMain.on("quick-record:result", (_event, { id, result }) => {
  ipcMain.emit(`quick-record:result:${id}`, _event, result);
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
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
