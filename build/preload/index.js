"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('demo', {
    count: (count) => {
        electron_1.ipcRenderer.send("count", count);
    }
});
