import {contextBridge, ipcRenderer} from "electron";
import {OutputConfig, SpineConfig} from "../extra";

contextBridge.exposeInMainWorld('main', {
    handle: async (url: string, spineConfig: SpineConfig, outputConfig: OutputConfig): Promise<void> => {
        return await ipcRenderer.invoke("handle", url, spineConfig, outputConfig);
    },
    selectSpinePath: async () => await ipcRenderer.invoke('select-spine-path'),
    openLink(link: string) {
        ipcRenderer.send('open-link', link)
    }
});