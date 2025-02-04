import type {SpineObject} from "../../extra";

declare global {
    interface Window {
        main: {
            handle(url: string): Promise<SpineObject[]>
        }
    }
}
