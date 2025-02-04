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

export async function handle(url: string): Promise<SpineObject[]> {
    return [];
}