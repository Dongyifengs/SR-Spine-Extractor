"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const DevUtils_1 = require("./utils/DevUtils");
const path_1 = require("path");
const development = true;
const createWindow = async () => {
    electron_1.Menu.setApplicationMenu(null);
    const win = new electron_1.BrowserWindow({
        width: 1540,
        height: 836,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, "preload/index.js")
        }
    });
    if (development) {
        const serverPort = await (0, DevUtils_1.startingDevServer)();
        win.loadURL('http://127.0.0.1:' + serverPort).then(() => {
            win.webContents.openDevTools(); // openDevTool when it's open
            console.log("[electron] starting development on http://127.0.0.1:" + serverPort);
        });
    }
    else {
        win.loadFile((0, path_1.join)(__dirname, 'index.html')).then(() => {
            console.log("[electron] starting");
        });
    }
};
electron_1.app.whenReady().then(() => {
    createWindow().then(() => {
        console.log("[electron] running");
        electron_1.ipcMain.on("count", (event, count) => {
            console.log("The counter now are: ", count);
        });
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow().then(() => {
                console.log("[electron] running");
            });
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
