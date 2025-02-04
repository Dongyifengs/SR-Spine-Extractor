export type ResourceDefinition = {
    name: string;
    url: string;
}
export type SpineObject = {
    resources: ResourceDefinition[],
    atlas: string;
    json: unknown;
}

declare async function handle(url: string): Promise<SpineObject[]>;