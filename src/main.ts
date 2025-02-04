import {app, BrowserWindow, Menu, ipcMain} from "electron";
import {startingDevServer} from "./utils/DevUtils";
import {join, join as pathJoin} from "path";
import {handle} from "./extra";

const development = true;
const createWindow = async () => {
    Menu.setApplicationMenu(null);
    const win = new BrowserWindow({
        width: 600,
        height: 400,
        resizable: false,
        webPreferences: {
            preload: join(__dirname, "preload/index.js")
        }
    })
    if (development) {
        const serverPort = await startingDevServer();
        win.loadURL('http://127.0.0.1:' + serverPort).then(() => {
            win.webContents.openDevTools(); // openDevTool when it's open
            console.log("[electron] starting development on http://127.0.0.1:" + serverPort);
        });
    } else {
        win.loadFile(pathJoin(__dirname, 'index.html')).then(() => {
            console.log("[electron] starting");
        });
    }
}

app.whenReady().then(() => {
    createWindow().then(() => {
        ipcMain.handle("handle", async (event, url: string) => {
            return await handle(url);
        })
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow().then(() => {
                console.log("[electron] running")
            })
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})