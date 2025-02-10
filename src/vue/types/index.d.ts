import type {SpineObject} from "../../extra";
import {OutputConfig, SpineConfig} from "../../extra";

declare global {
    interface Window {
        main: {
            handle(url: string, spineConfig: SpineConfig, outputConfig: OutputConfig): Promise<SpineObject[]>,
            selectSpinePath(): Promise<string>,
            openLink(link: string): void
        }
    }
}
