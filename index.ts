import {Literal, parse, Property} from "esprima-next";
import {traverse} from "estraverse";
import {generate} from "escodegen";
import * as ESTree from "estree";

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
    value: string | object;
};
type ScriptHandleResult = {
    spine: SpineDescription[],
    resourceMap: ResourceMapEntry[],
    images: ImageResourceDescription[]
}
const handleScriptTag = async (scriptUrl: URL): Promise<ScriptHandleResult> => {
    const textFromUrl = await getTextFromUrl(scriptUrl);
    const ast = parse(textFromUrl) as ESTree.Program;
    const result: ScriptHandleResult = {
        spine: [],
        resourceMap: [],
        images: [],
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
                    if (type.type !== "Literal") return;
                    console.log(id.value)
                    console.log(generate(src))
                }
            }
            if (node.type === "Property") {
                const key = node.key;
                if (key.type !== "Literal") return;
                const keyValue = key.value;
                if (typeof keyValue !== "number") return;
                const value = node.value;
                if (value.type !== "FunctionExpression") return;
                traverse(value.body, {
                    enter(node) {
                        if (node.type !== "AssignmentExpression") return;
                        const left = node.left;
                        if (left.type !== "MemberExpression") return;
                        const leftProperty = left.property;
                        if (leftProperty.type !== "Identifier") return;
                        if (leftProperty.name !== "exports") return;
                        const right = node.right;
                        if (right.type !== "Literal") return;
                        const rightValue = right.value;
                        if (typeof rightValue !== "string") return;
                        // console.log(rightValue);
                    }
                })
            }
            if (node.type === "CallExpression") {
                if (node.arguments.length !== 1) return;
                const arg = node.arguments[0];
                if (arg.type !== "ArrayExpression") return;
                if (!arg.elements.every(e => e && e.type === "FunctionExpression")) return;
                const result = arg.elements.map(e => {
                    if (e?.type !== "FunctionExpression") return;
                    const body: ESTree.BlockStatement = e.body;
                    if (body.body.length !== 1) {
                        return;
                    }
                    const firstLine = body.body[0];
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
                        return right.value;
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
                        return JSON.parse(rawJsonText.value as string);
                    }
                });
                if (result.every(e => !e)) return;
                console.log(result.length);
            }
        }
    })
    return result;
}
const main = async (url: string) => {
    const baseUrl = new URL(url);
    const html = await getTextFromUrl(baseUrl);
    const scripts = (await Promise.all(getScripts(html).map(e => new URL(e, url)).map(handleScriptTag)));
    console.log(scripts);
}

main("https://act.mihoyo.com/sr/event/e20231215version-92kbcf/index.html?game_biz=hkrpg_cn&mhy_presentation_style=fullscreen&mhy_landscape=true&mhy_hide_status_bar=true&mode=fullscreen&utm_source=bbs&utm_medium=mys&utm_campaign=post").catch(e => {
    console.error(e);
})