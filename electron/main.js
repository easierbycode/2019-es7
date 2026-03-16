const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icons", "icon-512.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(__dirname, "www", "phaser-game.html"));

  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript("window.__fitCanvas && window.__fitCanvas()");
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});
