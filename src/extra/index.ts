export type ResourceDefinition = {
    name: string;
    url: URL | string;
}
export type SpineObject = {
    resources: ResourceDefinition[],
    atlas: string;
    json: unknown;
}

export async function handle(url: string): Promise<SpineObject[]> {
    return [];
}