import {parse} from "esprima-next";
import {traverse} from "estraverse";
import {generate} from "escodegen";
import * as ESTree from "estree";
import {ResourceDefinition, SpineObject} from "./src/extra";

const getTextFromUrl = async (url: URL) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return await response.text();
}
const getScripts = (html: string): string[] => {
    const rewriter = new HTMLRewriter();
    const scriptsUrl: Set<string> = new Set();
    rewriter.on("script", {
        element(element: HTMLRewriterTypes.Element): void | Promise<void> {
            const src = element.getAttribute("src");
            if (src) {
                scriptsUrl.add(src);
            }
        }
    });
    rewriter.transform(html);
    return [...scriptsUrl];
}
type SpineDescription = {
    atlas: number;
    json: number;
    name: string;
};
type ImageResourceDescription = {
    src: number,
    id: string,
}
type ResourceMapEntry = {
    id: number;
    value: string | URL | object;
    type: "URL" | "CONTENT" | "VAR"
};
type NameDefinition = {
    name: string;
    id: number;
}
type ScriptHandleResult = {
    spine: SpineDescription[],
    resourceMap: ResourceMapEntry[],
    resourceLoadedMap: ResourceMapEntry[]
    images: ImageResourceDescription[],
    names: NameDefinition[]
}

const handleScriptTag = async (scriptUrl: URL, baseUrl: URL): Promise<ScriptHandleResult> => {
    const textFromUrl = await getTextFromUrl(scriptUrl);
    const ast = parse(textFromUrl) as unknown as ESTree.Program;
    const result: ScriptHandleResult = {
        spine: [],
        resourceMap: [],
        resourceLoadedMap: [],
        images: [],
        names: []
    };
    traverse(ast, {
        enter(node, parent) {
            if (node.type === "ObjectExpression") {
                if (node.properties.length === 2) {
                    const [first, second] = node.properties;
                    if (first.type !== "Property" || second.type !== "Property") return;
                    const [firstKey, secondKey] = [first, second].map(e => e.key);
                    if (firstKey.type !== "Identifier" || secondKey.type !== "Identifier") return;
                    const keyList = [firstKey, secondKey].map(e => e.name);
                    if (!keyList.includes("atlas") || !keyList.includes("json")) return;
                    const atlasProperty = node.properties[keyList.indexOf("atlas")] as ESTree.Property;
                    const jsonProperty = node.properties[keyList.indexOf("json")] as ESTree.Property;
                    const [atlasValue, jsonValue] = [atlasProperty, jsonProperty].map(e => e.value);
                    if (atlasValue.type !== "CallExpression" || jsonValue.type !== "CallExpression") return;
                    const [atlasArguments, jsonArguments] = [atlasValue, jsonValue].map(e => e.arguments);
                    if (atlasArguments.length !== 1 || jsonArguments.length !== 1) return;
                    const [atlasId, jsonId] = [atlasArguments, jsonArguments].map(e => e[0]);
                    if (atlasId.type !== "Literal" || jsonId.type !== "Literal") return;
                    const [atlasIdValue, jsonIdValue] = [atlasId, jsonId].map(e => e.value as number);
                    if (!parent || parent.type !== "Property") return;
                    const parentKey = parent.key;
                    if (parentKey.type !== "Identifier") return;
                    result.spine.push({
                        atlas: atlasIdValue,
                        json: jsonIdValue,
                        name: parentKey.name
                    })
                }
                if (node.properties.length === 3) {
                    const properties = node.properties.filter(e => e.type === "Property" && e.key.type === "Identifier");
                    const propertyNames = properties.map(e => ((e as ESTree.Property).key as ESTree.Identifier).name);
                    const [srcIndex, idIndex, typeIndex] = [propertyNames.indexOf("src"), propertyNames.indexOf("id"), propertyNames.indexOf("type")];
                    if (srcIndex === -1 || idIndex === -1 || typeIndex === -1) return;
                    const [src, id, type] = [properties[srcIndex] as ESTree.Property, properties[idIndex] as ESTree.Property, properties[typeIndex] as ESTree.Property].map(e => e.value);
                    if (src.type !== "CallExpression") return;
                    if (id.type !== "Literal") return;
                    if (typeof id.value !== "string") return;
                    if (type.type !== "Literal") return;
                    if (type.value !== "image") return;
                    if (src.arguments.length !== 1) return;
                    const arg = src.arguments[0];
                    if (arg.type !== "Literal") return;
                    if (typeof arg.value !== "number") return;
                    result.images.push({id: id.value, src: arg.value})
                }
            }
            if (node.type === "Property") {
                const key = node.key;
                if (key.type !== "Literal") return;
                const keyValue = key.value;
                if (typeof keyValue !== "number") return;
                const value = node.value;
                if (value.type !== "FunctionExpression") return;
                if (value.body.type !== "BlockStatement") return;
                const body = value.body.body.filter(e => !(e.type === "ExpressionStatement" && e.expression.type === "Literal" && e.expression.value === "use strict"));
                if (body.length !== 1) return;
                const firstLine = body[0];
                if (firstLine.type !== "ExpressionStatement") return;
                const firstExpress = firstLine.expression;
                if (firstExpress.type !== "AssignmentExpression") return;
                const left = firstExpress.left;
                if (left.type !== "MemberExpression") return;
                const leftProperty = left.property;
                if (leftProperty.type !== "Identifier") return;
                if (leftProperty.name !== "exports") return;
                const right = firstExpress.right;
                if (right.type === "Literal") {
                    if (typeof right.value !== "string") return;
                    result.resourceLoadedMap.push({id: keyValue, value: right.value, type: "CONTENT"});
                }
                if (right.type === "BinaryExpression") {
                    if (right.operator !== "+") return;
                    const url = right.right;
                    if (url.type !== "Literal") return;
                    if (typeof url.value !== "string") return;
                    result.resourceLoadedMap.push({
                        id: keyValue,
                        value: new URL("./" + url.value, baseUrl),
                        type: "URL"
                    });
                }
                if (right.type === "CallExpression") {
                    const callee = right.callee;
                    if (callee.type !== "MemberExpression") return;
                    const obj = callee.object;
                    const calleeProperty = callee.property;
                    if (obj.type !== "Identifier" || calleeProperty.type !== "Identifier") return;
                    if (obj.name !== "JSON" || calleeProperty.name !== "parse") return;
                    const args = right.arguments;
                    if (args.length !== 1) return;
                    const rawJsonText = args[0];
                    if (rawJsonText.type !== "Literal") return;
                    result.resourceMap.push({
                        id: keyValue,
                        value: JSON.parse(rawJsonText.value as string),
                        type: "CONTENT"
                    })
                }
            }
            if (node.type === "CallExpression") {
                if (node.arguments.length !== 1) return;
                const arg = node.arguments[0];
                if (arg.type !== "ArrayExpression") return;
                if (!arg.elements.every(e => e && e.type === "FunctionExpression")) return;
                arg.elements.forEach((e, index) => {
                    if (e?.type !== "FunctionExpression") return;
                    const body = e.body.body.filter(e => !(e.type === "ExpressionStatement" && e.expression.type === "Literal" && e.expression.value === "use strict"));
                    if (body.length !== 1) return;
                    const firstLine = body[0];
                    if (firstLine.type !== "ExpressionStatement") return;
                    const firstExpress = firstLine.expression;
                    if (firstExpress.type !== "AssignmentExpression") return;
                    const left = firstExpress.left;
                    if (left.type !== "MemberExpression") return;
                    const leftProperty = left.property;
                    if (leftProperty.type !== "Identifier") return;
                    if (leftProperty.name !== "exports") return;
                    const right = firstExpress.right;
                    if (right.type === "Identifier") {
                        result.resourceMap.push({id: index, value: right.name, type: "VAR"});
                    }
                    if (right.type === "Literal") {
                        if (typeof right.value !== "string") return;
                        result.resourceMap.push({id: index, value: right.value, type: "CONTENT"})
                    }
                    if (right.type === "CallExpression") {
                        const callee = right.callee;
                        if (callee.type !== "MemberExpression") return;
                        const obj = callee.object;
                        const calleeProperty = callee.property;
                        if (obj.type !== "Identifier" || calleeProperty.type !== "Identifier") return;
                        if (obj.name !== "JSON" || calleeProperty.name !== "parse") return;
                        const args = right.arguments;
                        if (args.length !== 1) return;
                        const rawJsonText = args[0];
                        if (rawJsonText.type !== "Literal") return;
                        result.resourceMap.push({
                            id: index,
                            value: JSON.parse(rawJsonText.value as string),
                            type: "CONTENT"
                        })
                    }
                });
            }
            if (node.type === "AssignmentExpression") {
                const left = node.left;
                const right = node.right;
                if (left.type !== "Identifier") return;
                if (right.type !== "CallExpression") return;
                const args = right.arguments;
                if (args.length !== 1) return;
                const arg = args[0];
                if (arg.type !== "Literal") return;
                const v = arg.value;
                if (typeof v !== "number") return;
                result.names.push({
                    id: v,
                    name: left.name
                });
            }
        }
    })
    return result;
}

const remap = (original: ScriptHandleResult): SpineObject[] => {
    const getResourceObj = (id: number) => {
        const resourceMapEntry = original.resourceMap.find(e => e.id === id);
        if (resourceMapEntry) return resourceMapEntry;
        return original.resourceLoadedMap.find(e => e.id === id);
    }
    const getResource = (id: number, counter: number = 0): (URL | string | object) | null => {
        if (counter > 5) return null;
        const obj = getResourceObj(id);
        if (!obj) return null;
        if (obj.type !== "VAR") return obj.value;
        const nameObj = original.names.filter(e => e.name === obj.value);
        if (nameObj.length === 0) return null;
        const resource = nameObj.map(e => getResource(e.id, counter + 1)).find(e => !!e);
        if (!resource) return null;
        return resource;
    }
    const imagesData: Record<string, URL | string> = {};
    for (let image of original.images) {
        const res = getResource(image.src) as (URL | string) | null;
        if (!res) {
            console.warn(`图片：${image.id}缺少资源定义`);
            continue;
        }
        imagesData[image.id] = res;
    }
    const spineObjects: SpineObject[] = [];
    for (let spineDescription of original.spine) {
        const jsonRes = getResource(spineDescription.json) as unknown;
        const atlasRes = getResource(spineDescription.atlas) as string;
        if (!jsonRes) {
            console.warn(`spine动画：${spineDescription.name} 缺少JSON文件`);
            continue;
        }
        if (!atlasRes) {
            console.warn(`spine动画：${spineDescription.name} 缺少atlas文件`);
            continue;
        }
        const res: ResourceDefinition[] = atlasRes.split("\n").filter(e => e.endsWith(".png"))
            .map(e => e.replace(".png", ""))
            .map(e => ({name: e, url: imagesData[e]}));
        spineObjects.push({
            atlas: atlasRes,
            json: jsonRes,
            resources: res
        });
    }
    return spineObjects;
}

const main = async (url: string) => {
    const baseUrl = new URL(url);
    const html = await getTextFromUrl(baseUrl);
    const scripts = (await Promise.all(getScripts(html).map(e => new URL(e, url)).map(e => handleScriptTag(e, baseUrl))));
    const totalData: ScriptHandleResult = {
        spine: [],
        images: [],
        names: [],
        resourceLoadedMap: [],
        resourceMap: []
    };
    for (let script of scripts) {
        totalData.spine.push(...script.spine);
        totalData.images.push(...script.images);
        totalData.names.push(...script.names);
        totalData.resourceLoadedMap.push(...script.resourceLoadedMap);
        totalData.resourceMap.push(...script.resourceMap);
    }
    console.log(totalData.spine)
    const data = remap(totalData);
}

main("https://webstatic.mihoyo.com/ys/event/e20220703prev-wiz6/index.html?game_biz=hk4e_cn&bbs_presentation_style=fullscreen&bbs_landscape=true&mhy_hide_status_bar=true&utm_source=bbs&utm_medium=mys&utm_campaign=arti").catch(e => {
    console.error(e);
})