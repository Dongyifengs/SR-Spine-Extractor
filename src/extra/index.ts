import {handle as spineHandler} from "./spine";

export type ResourceDefinition = {
    name: string;
    url: URL | string;
}
export type SpineObject = {
    name: string,
    resources: ResourceDefinition[],
    atlas: string;
    json: unknown;
}
export type SpineConfig = {
    comFile: string,
    proxy?: {
        host: string,
        port: number,
    },
}
export type RepeatPolicy = "REMOVE" | "RENAME";
export type OutputConfig = {
    path: string,
    repeatPolicy: RepeatPolicy
}
export const handle = spineHandler;