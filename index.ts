/**
 *                             _ooOoo_
 *                            o8888888o
 *                            88" . "88
 *                            (| -_- |)
 *                            O\  =  /O
 *                         ____/`---'\____
 *                       .'  \\|     |//  `.
 *                      /  \\|||  :  |||//  \
 *                     /  _||||| -:- |||||-  \
 *                     |   | \\\  -  /// |   |
 *                     | \_|  ''\---/''  |   |
 *                     \  .-\__  `-`  ___/-. /
 *                   ___`. .'  /--.--\  `. . __
 *                ."" '<  `.___\_<|>_/___.'  >'"".
 *               | | :  `- \`.;`\ _ /`;.`/ - ` : | |
 *               \  \ `-.   \_ __\ /__ _/   .-` /  /
 *          ======`-.____`-.___\_____/___.-`____.-'======
 *                             `=---='
 *          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *                     佛祖保佑        永无BUG
 *            佛曰:
 *                   写字楼里写字间，写字间里程序员；
 *                   程序人员写程序，又拿程序换酒钱。
 *                   酒醒只在网上坐，酒醉还来网下眠；
 *                   酒醉酒醒日复日，网上网下年复年。
 *                   但愿老死电脑间，不愿鞠躬老板前；
 *                   奔驰宝马贵者趣，公交自行程序员。
 *                   别人笑我忒疯癫，我笑自己命太贱；
 *                   不见满街漂亮妹，哪个归得程序员？
 */

import {parse} from "esprima-next";
import {traverse} from "estraverse";
import * as ESTree from "estree";
import {ResourceDefinition, SpineObject} from "./src/extra";
import {writeFileSync} from "fs";

type HoYoIdentify = number | string;

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
    atlas: HoYoIdentify;
    json: HoYoIdentify;
    name: string;
};
type ImageResourceDescription = {
    src: HoYoIdentify,
    id: string,
}
type ResourceValue = {
    value: string | URL | object;
    type: "URL" | "CONTENT" | "VAR"
}
type ResourceMapEntry = ResourceValue & {
    id: HoYoIdentify;
};
type NameDefinition = {
    name: string;
    id: HoYoIdentify;
}
type ScriptHandleResult = {
    spine: SpineDescription[],
    resourceMap: ResourceMapEntry[],
    resourceLoadedMap: ResourceMapEntry[]
    images: ImageResourceDescription[],
    names: NameDefinition[]
}

type PreloadResult<T> = {
    preload: boolean,
    data: T
}

type PropertyHandleResult = PreloadResult<ResourceMapEntry>;
type ExportResult = PreloadResult<ResourceValue>;

/**
 * function(e) {("use strict";)? e.exports = XXXXX;}
 */
const handleFunction = (func: ESTree.FunctionExpression, baseUrl: URL): ExportResult | null => {
    if (func.body.type !== "BlockStatement") return;
    const body = func.body.body.filter(e => !(e.type === "ExpressionStatement" && e.expression.type === "Literal" && e.expression.value === "use strict"));
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
        return {
            preload: false,
            data: {value: right.value, type: "CONTENT"}
        }
    } else if (right.type === "BinaryExpression") {
        if (right.operator !== "+") return;
        const url = right.right;
        if (url.type !== "Literal") return;
        if (typeof url.value !== "string") return;
        return {
            preload: false,
            data: {
                value: new URL("./" + url.value, baseUrl),
                type: "URL"
            }
        }
    } else if (right.type === "CallExpression") {
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
        return {
            preload: true,
            data: {
                value: JSON.parse(rawJsonText.value as string),
                type: "CONTENT"
            }
        }
    } else if (right.type === "Identifier") {
        return {
            preload: false,
            data: {value: right.name, type: "VAR"}
        }
    }
}

/**
 * XXXX: function(e) {e.exports = XXXX;}
 */
const handleProperty = (property: ESTree.Property, baseUrl: URL): PropertyHandleResult | null => {
    const key = property.key;
    if (key.type !== "Literal" && key.type !== "Identifier") return;
    const keyValue = key.type === "Literal" ? key.value : key.name;
    if (typeof keyValue !== "number" && typeof keyValue !== "string") return;
    const value = property.value;
    if (value.type !== "FunctionExpression") return;
    const result = handleFunction(value, baseUrl);
    if (!result) return null;
    return {
        preload: result.preload,
        data: {
            value: result.data.value,
            type: result.data.type,
            id: keyValue
        }
    };
}
/**
 * {
 *     atlas: r(xxxx),
 *     json: r(xxxx)
 * }
 */
const handleAnimationObject = (node: ESTree.ObjectExpression, parent: ESTree.Node | null): SpineDescription | null => {
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
    const [atlasIdValue, jsonIdValue] = [atlasId, jsonId].map(e => e.value as HoYoIdentify);
    if (!parent || parent.type !== "Property") return;
    const parentKey = parent.key;
    if (parentKey.type !== "Identifier" && parentKey.type !== "Literal") return;
    if (parentKey.type === "Literal" && typeof parentKey.value !== "string") return;
    return {
        atlas: atlasIdValue,
        json: jsonIdValue,
        name: (parentKey.type !== "Literal" ? parentKey.name : parentKey.value) as string,
    }
}
/**
 *{
 *     src: r(xxx),
 *     id: xxxxx,
 *     type: "image"
 *}
 */
const handleResourceObject = (node: ESTree.ObjectExpression): ImageResourceDescription | null => {
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
    if (typeof arg.value !== "number" && typeof arg.value !== "string") return;
    return {id: id.value, src: arg.value};
}

/**
 * function(e){XXXXXXXX}([function(e){.....},function(......])
 */
const handleResourceArray = (node: ESTree.CallExpression, baseUrl: URL): {
    resourceMap: ResourceMapEntry[],
    resourceLoadedMap: ResourceMapEntry[]
} | null => {
    if (node.arguments.length !== 1) return;
    const arg = node.arguments[0];
    if (arg.type !== "ArrayExpression") return;
    if (!arg.elements.every(e => e && e.type === "FunctionExpression")) return;
    const result = {
        resourceMap: [],
        resourceLoadedMap: []
    };
    arg.elements.forEach((e, index) => {
        if (e?.type !== "FunctionExpression") return;
        const res = handleFunction(e, baseUrl);
        if (!res) return;
        const resData: ResourceMapEntry = {
            type: res.data.type,
            value: res.data.value,
            id: index
        };
        if (res.preload) {
            result.resourceMap.push(resData);
        } else {
            result.resourceLoadedMap.push(resData);
        }
    });
    return result;
}


/**
 * ug = r(XXXXX),
 * ...
 */
const handleResourceVar = (node: ESTree.AssignmentExpression): NameDefinition | null => {
    const left = node.left;
    const right = node.right;
    if (left.type !== "Identifier") return;
    if (right.type !== "CallExpression") return;
    const args = right.arguments;
    if (args.length !== 1) return;
    const arg = args[0];
    if (arg.type !== "Literal") return;
    const v = arg.value;
    if (typeof v !== "number" && typeof v !== "string") return;
    return {
        id: v,
        name: left.name
    };
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
                    const animationObject = handleAnimationObject(node, parent);
                    if (!animationObject) return;
                    result.spine.push(animationObject);
                } else if (node.properties.length === 3) {
                    const resourceObject = handleResourceObject(node);
                    if (!resourceObject) return;
                    result.images.push(resourceObject);
                }
            } else if (node.type === "Property") {
                const property = handleProperty(node, baseUrl);
                if (!property) return;
                const propertyData = property.data;
                if (property.preload) {
                    result.resourceMap.push(propertyData);
                } else {
                    result.resourceLoadedMap.push(propertyData);
                }
            } else if (node.type === "CallExpression") {
                const resourceArrayResult = handleResourceArray(node, baseUrl);
                if (!resourceArrayResult) return;
                result.resourceMap.push(...resourceArrayResult.resourceMap);
                result.resourceLoadedMap.push(...resourceArrayResult.resourceLoadedMap);
            } else if (node.type === "AssignmentExpression") {
                const varResult = handleResourceVar(node);
                if (!varResult) return;
                result.names.push(varResult);
            }
        }
    })
    return result;
}

const remap = (original: ScriptHandleResult): SpineObject[] => {
    const getResourceObj = (id: HoYoIdentify) => {
        const resourceMapEntry = original.resourceMap.find(e => e.id === id);
        if (resourceMapEntry) return resourceMapEntry;
        return original.resourceLoadedMap.find(e => e.id === id);
    }
    const getResource = (id: HoYoIdentify, counter: number = 0): (URL | string | object) | null => {
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
            name: spineDescription.name,
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
    return remap(totalData);
}

main("https://act.hoyoverse.com/ys/event/e20241225hoyofair-97rgve/index.html").catch(e => {
    console.error(e);
}).then(e => {
    writeFileSync("result.json", JSON.stringify(e, null, 2))
})