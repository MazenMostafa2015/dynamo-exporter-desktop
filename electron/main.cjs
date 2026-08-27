// Dynamo Exporter Desktop: keep the shell intentionally thin. The React/Vite app remains the source of truth for graph editing and .dyn serialization.
const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");

const isDev = Boolean(process.env.ELECTRON_START_URL);

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 980,
    minWidth: 1060,
    minHeight: 720,
    backgroundColor: "#f4f3ef",
    title: "Dynamo Exporter",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    window.loadURL(process.env.ELECTRON_START_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    window.loadFile(path.join(__dirname, "..", "dist", "public", "index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
