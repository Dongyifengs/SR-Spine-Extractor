import {app, BrowserWindow, Menu, ipcMain, dialog, shell} from "electron";
import {startingDevServer} from "./utils/DevUtils";
import {join, join as pathJoin} from "path";
import {handle, OutputConfig, SpineConfig} from "./extra";

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
        ipcMain.handle("handle", async (_, url: string, spineConfig: SpineConfig, outputConfig: OutputConfig) => {
            return await handle(url, spineConfig, outputConfig);
        })
    })

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow().then(() => {
                console.log("[electron] running")
            })
        }
    })
    ipcMain.handle("select-spine-path", async () => {
        const result = await dialog.showOpenDialog({
            title: "请选择你的Spine.com路径 - 仅限Windows版",
            properties: ['openFile'],
            filters: [{name: 'Spine文件-仅限Windows', extensions: ['com']}],
        });
        return result.canceled ? null : result.filePaths[0]
    })
    ipcMain.on("open-link", (event, url: string) => {
        shell.openExternal(url).then();
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})