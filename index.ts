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
import {generate} from "escodegen";

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
type SpineProjectType<T> = {
    type: "ID",
    id: HoYoIdentify
} | {
    type: "DIRECT",
    data: T
} | {
    type: "VAR",
    name: string
}
type SpineDescription = {
    atlas: SpineProjectType<string>;
    json: SpineProjectType<unknown>;
    name: string;
};

type ResourceValue = {
    value: string | URL | object;
    type: "URL" | "CONTENT" | "VAR"
}
type ImageResourceDescription = {
    src: SpineProjectType<string>,
    id: string,
}
type ResourceMapEntry = ResourceValue & {
    id: HoYoIdentify;
};
type NameDefinition = {
    name: string;
    id: SpineProjectType<string>;
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
const handleFunction = (func: ESTree.FunctionExpression | ESTree.ArrowFunctionExpression, baseUrl: URL): ExportResult | null => {
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
    if (value.type !== "FunctionExpression" && value.type !== "ArrowFunctionExpression") return;
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
 * Object.values(Object.assign({"XXXX": XXXXXXX}))[0]
 */

const handleObjectValueAssignCall = <T>(node: ESTree.CallExpression): SpineProjectType<T> | null => {
    const args = node.arguments;
    if (args.length !== 1) return;
    const arg = args[0];
    if (arg.type !== "CallExpression") return;
    const callee = arg.callee;
    if (callee.type !== "MemberExpression") return;
    const obj = callee.object;
    const prop = callee.property;
    if (obj.type !== "Identifier" || prop.type !== "Identifier") return;
    if (obj.name !== "Object" || prop.name !== "assign") return;
    const callArgs = arg.arguments;
    if (callArgs.length !== 1) return;
    const callArg = callArgs[0];
    if (callArg.type !== "ObjectExpression") return;
    const properties = callArg.properties;
    if (properties.length !== 1) return;
    const firstProp = properties[0];
    if (firstProp.type !== "Property") return;
    const value = firstProp.value;
    if (value.type === "Identifier") {
        return {
            type: "VAR",
            name: value.name
        }
    } else if (value.type === "Literal" || value.type === "ObjectExpression") {
        try {
            const rawValue = (new Function(`return (${generate(value)})`))()
            return {
                type: "DIRECT",
                data: rawValue as T
            }
        } catch (e) {
        }
    }

    return;
}

/**
 * r(xxxx)
 */
const handleResourceFunctionCall = <T>(node: ESTree.CallExpression): SpineProjectType<T> | null => {
    const args = node.arguments;
    if (args.length !== 1) return;
    const arg = args[0];
    if (arg.type !== "Literal") return;
    return {
        type: "ID",
        id: arg.value as HoYoIdentify
    }
}
/**
 * XXXX: XXXX
 * @see handleAnimationObject
 */
const handleSpineProjectFunctionCall = <T>(node: ESTree.Property): SpineProjectType<T> | null => {
    const nodeValue = node.value;
    if (nodeValue.type === "MemberExpression") {
        const object = nodeValue.object;
        const property = nodeValue.property;
        if (object.type !== "CallExpression" || property.type !== "Literal") return;
        if (property.value !== 0) return;
        return handleObjectValueAssignCall(object);
    } else if (nodeValue.type === "CallExpression") {
        const callee = nodeValue.callee;
        if (callee.type === "Identifier") {
            return handleResourceFunctionCall(nodeValue);
        }
    }
    return;
}
/**
 * {
 *     atlas: XXXX,
 *     json: XXXX
 * }
 *
 */
const handleAnimationObject = (node: ESTree.ObjectExpression, parent: ESTree.Node | null): SpineDescription | null => {
    const [first, second] = node.properties;
    if (first.type !== "Property" || second.type !== "Property") return;
    const [firstKey, secondKey] = [first, second].map(e => e.key);
    if (firstKey.type !== "Identifier" || secondKey.type !== "Identifier") return;
    const keyList = [firstKey, secondKey].map(e => e.name);
    if (!keyList.includes("atlas") || !keyList.includes("json")) return;
    const atlasIndex = keyList.indexOf("atlas")
    const jsonIndex = keyList.indexOf("json")
    const values = [first, second].map(handleSpineProjectFunctionCall).filter(e => !!e);
    if (values.length !== 2) return;
    const atlasRes = values[atlasIndex] as SpineProjectType<string>;
    const jsonRes = values[jsonIndex] as SpineProjectType<unknown>;
    // Parent Key
    if (!parent || parent.type !== "Property") return;
    const parentKey = parent.key;
    if (parentKey.type !== "Identifier" && parentKey.type !== "Literal") return;
    if (parentKey.type === "Literal" && typeof parentKey.value !== "string") return;
    return {
        atlas: atlasRes,
        json: jsonRes,
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
    if (id.type !== "Literal") return;
    if (typeof id.value !== "string") return;
    if (type.type !== "Literal") return;
    if (type.value !== "image") return;
    if (src.type === "MemberExpression") {
        const object = src.object;
        const property = src.property;
        if (object.type !== "CallExpression" || property.type !== "Literal") return;
        if (property.value !== 0) return;
        const data = handleObjectValueAssignCall(object) as SpineProjectType<string>;
        return {id: id.value, src: data};
    } else if (src.type === "CallExpression") {
        const callee = src.callee;
        if (callee.type !== "Identifier") return;
        const args = src.arguments;
        if (args.length !== 1) return;
        const arg = args[0];
        if (arg.type !== "Literal") return;
        if (typeof arg.value !== "number" && typeof arg.value !== "string") return;
        return {id: id.value, src: {type: "ID", id: arg.value}};
    }
    return;
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
 *
 */
const handleResourceVar = (node: ESTree.AssignmentExpression): NameDefinition | null => {
    const left = node.left;
    const right = node.right;
    if (left.type !== "Identifier") return;
    if (right.type === "CallExpression") {
        const args = right.arguments;
        if (args.length !== 1) return;
        const arg = args[0];
        if (arg.type !== "Literal") return;
        const v = arg.value;
        if (typeof v !== "number" && typeof v !== "string") return;
        return {
            id: {
                type: "ID",
                id: v
            },
            name: left.name
        };
    }
}
/**
 *
 * var ug = r.p + "XXXXXX",
 * ...
 */
const handleResourceVarDef = (node: ESTree.VariableDeclarator, baseUrl: URL): NameDefinition | null => {
    if (node.id.type !== "Identifier") return;
    const right = node.init;
    if (!right) return;
    if (right.type === "BinaryExpression") {
        if (right.operator !== "+") return;
        const rightData = right.right;
        if (rightData.type !== "Literal") return;
        if (typeof rightData.value !== "string") return;
        return {
            id: {
                type: "DIRECT",
                data: new URL(rightData.value, baseUrl).toString()
            },
            name: node.id.name
        }
    }
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
            } else if (node.type === "VariableDeclarator") {
                const varResult = handleResourceVarDef(node, baseUrl);
                if (!varResult) return;
                result.names.push(varResult);
            }
        }
    })
    return result;
}

const remap = (original: ScriptHandleResult): SpineObject[] => {
    const getResourceObj = (id: HoYoIdentify, filter: (e: any) => boolean = () => true) => {
        const mainFilter = (e: ResourceMapEntry) => {
            if (e.id !== id) return false;
            if (e.type === "VAR") return true;
            return filter(e.value);
        }
        const resourceMapEntry = original.resourceMap.find(mainFilter);
        if (resourceMapEntry) return resourceMapEntry;
        return original.resourceLoadedMap.find(mainFilter);
    }
    const getResource = (id: HoYoIdentify, filter: (e: any) => boolean = () => true, counter: number = 0): (URL | string | object) | null => {
        if (counter > 5) return null;
        const obj = getResourceObj(id, filter);
        if (!obj) return null;
        if (obj.type !== "VAR") return obj.value;
        const resource = getNamedResource(obj.value as string, filter, counter)
        if (!resource) return null;
        return resource;
    }
    const getNamedResource = (name: string, filter: (e: any) => boolean = () => true, counter: number = 0): (URL | string | object) | null => {
        if (counter > 5) return null;
        const nameObj = original.names.filter(e => e.name === name);
        if (nameObj.length === 0) return null;
        return nameObj.map(e => e.id.type === "DIRECT" ? e.id.data : e.id.type === "ID" ? getResource(e.id.id, () => true, counter + 1) : getNamedResource(e.id.name, filter, counter + 1)).find(e => (!!e) && filter(e));
    }
    const getSpineResource = <T>(res: SpineProjectType<T>, filter: (e: any) => boolean = () => true): T | null => {
        if (res.type === "DIRECT") return res.data;
        if (res.type === "VAR") return
        return getResource(res.id, filter) as T | null;
    }
    const imagesData: Record<string, URL | string> = {};
    const imageFilter = (e: any) => e instanceof URL || (typeof e === "string" && (e.endsWith(".png") || e.startsWith("data:image/png;base64")));
    for (let image of original.images) {
        const res = (image.src.type === "DIRECT" ? image.src.data : image.src.type === "VAR" ? getNamedResource(image.src.name, imageFilter) : getResource(image.src.id, imageFilter)) as (URL | string) | null;
        if (!res) {
            console.warn(`图片：${image.id}缺少资源定义`);
            continue;
        }
        imagesData[image.id] = res;
    }
    const spineObjects: SpineObject[] = [];
    const jsonFilter = (e: any): boolean => {
        if (e instanceof URL) {
            console.log(e.href);
            return e.href.endsWith(".json");
        }
        console.log(e);
        return (typeof e === "object" || (typeof e === "string" && e.endsWith('.json')))
    }
    const atlasFilter = (e: any): boolean => {
        if (e instanceof URL) {
            return e.href.endsWith(".atlas");
        }
        return (typeof e === "string" && (e.endsWith('.atlas') || (e.includes(".png") && e.includes(":"))))
    }
    for (let spineDescription of original.spine) {
        if (spineDescription.name === "user_p08_yu_l") {
            console.log(spineDescription);
        }
        const jsonRes = getSpineResource(spineDescription.json, jsonFilter) as unknown;
        const atlasRes = getSpineResource(spineDescription.atlas, atlasFilter) as string;
        if (!jsonRes) {
            console.warn(`spine动画：${spineDescription.name} 缺少JSON文件 ${JSON.stringify(spineDescription.json)}`);
            continue;
        }
        if (!atlasRes) {
            console.warn(`spine动画：${spineDescription.name} 缺少atlas文件 ${JSON.stringify(spineDescription.atlas)}`);
            continue;
        }
        const res: ResourceDefinition[] = atlasRes.split("\n").filter(e => e.endsWith(".png"))
            .map(e => e.replace(".png", ""))
            .map(e => ({name: e, url: imagesData[e]}));
        res.forEach(e => {
            if (!e.url) {
                console.warn(`图片：${e.name}未找到对应内容!`)
            }
        })
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
    writeFileSync("raw_result.json", JSON.stringify(totalData, null, 2))
    console.log(`共检测到${totalData.spine.length}个spine项目`)
    return remap(totalData);
}

main("https://webstatic.mihoyo.com/ys/event/e20220928review_data/index.html?game_biz=hk4e_cn&mhy_presentation_style=fullscreen&mhy_auth_required=true&mhy_landscape=true&mhy_hide_status_bar=true&utm_source=mkt&utm_medium=web&utm_campaign=arti").catch(e => {
    console.error(e);
}).then(e => {
    writeFileSync("result.json", JSON.stringify(e, null, 2))
})