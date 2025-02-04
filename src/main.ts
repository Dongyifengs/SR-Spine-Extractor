import {app, BrowserWindow, Menu, ipcMain} from "electron";
import {startingDevServer} from "./utils/DevUtils";
import {join, join as pathJoin} from "path";

const development = true;
const createWindow = async () => {
    Menu.setApplicationMenu(null);
    const win = new BrowserWindow({
        width: 1540,
        height: 836,
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
        console.log("[electron] running");
        ipcMain.on("count", (event, count: number) => {
            console.log("The counter now are: ", count);
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