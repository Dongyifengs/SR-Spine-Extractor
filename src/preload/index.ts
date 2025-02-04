import { contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('demo', {
    count: (count: number) => {
        ipcRenderer.send("count", count);
    }
});