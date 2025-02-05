import {contextBridge, ipcRenderer} from "electron";
import type {SpineObject} from "../extra";

contextBridge.exposeInMainWorld('main', {
    handle: async (url: string): Promise<SpineObject[]> => {
        return await ipcRenderer.invoke("handle", url) as SpineObject[];
    },
    selectSpinePath: async () => await ipcRenderer.invoke('select-spine-path')
});