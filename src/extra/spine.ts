import {parsePage} from "./parser";
import {execSync} from "child_process";
import {OutputConfig, SpineConfig, SpineObject} from "./index";
import {rmSync, existsSync, mkdirSync, writeFileSync, renameSync} from "fs";
import {join, resolve, isAbsolute} from "path";

const getAbsolutePath = (relativePath: string): string => {
    if (isAbsolute(relativePath)) {
        return relativePath;
    }
    return resolve(relativePath);
}

export const handle = async (url: string, spineConfig: SpineConfig, outputConfig: OutputConfig) => {
    const projects = await parsePage(url, outputConfig.repeatPolicy);
    await toSpineProject(projects, spineConfig, outputConfig.path)
}

type SpineProjectTemp = {
    skeleton: {
        images: string,
        spine: string
    },
    bones: {
        scaleX?: number,
        scaleY?: number
    }[]
}
const handleSingleProject = async (project: SpineObject, {
    comFile,
    proxy
}: SpineConfig, outputPath: string, errorPath: string) => {
    const projectName = project.name;
    const projectBase = join(outputPath, projectName);
    mkdirSync(projectBase);
    const atlasPath = join(projectBase, `${projectName}.atlas`);
    const jsonPath = join(projectBase, `${projectName}.json`);
    const projectRawPath = join(projectBase, `raw.json`);
    const spineProjectFilePath = join(projectBase, `${projectName}.spine`);
    writeFileSync(projectRawPath, JSON.stringify(project, null, 4));
    const jsonData: SpineProjectTemp = project.json as SpineProjectTemp;
    jsonData['skeleton']['images'] = "./images";
    const projectSpineVersionRange = jsonData['skeleton']['spine'];
    const projectSpineVersion = projectSpineVersionRange.split("-").toReversed()[0];
    let scale = 1;
    for (const bone of jsonData['bones']) {
        const scaleX = bone["scaleX"];
        if (scaleX !== undefined) {
            scale = scaleX;
            break;
        }
        const scaleY = bone['scaleY'];
        if (scaleY !== undefined) {
            scale = scaleY;
            break;
        }
    }
    writeFileSync(jsonPath, JSON.stringify(jsonData, null, 4));
    writeFileSync(atlasPath, project.atlas);
    const imagesPath = join(projectBase, "images");
    mkdirSync(imagesPath);
    for (let resource of project.resources) {
        const resourcePath = join(projectBase, `${resource.name}.png`);
        const data = resource.url;
        if (typeof data === "string") {
            if (data.startsWith("data:image/png;base64")) {
                const imgData = Buffer.from(data.replace("data:image/png;base64", ""), "base64");
                writeFileSync(resourcePath, imgData);
                continue;
            }
        }
        const resp = (await fetch(data));
        writeFileSync(resourcePath, await resp.bytes());
    }
    try {
        console.log(`开始解开 ${projectName}`);
        execSync([`"${comFile}"`, ...(proxy ? ["-x", `${proxy.host}:${proxy.port}`] : []), "-u", projectSpineVersion, "-i", projectBase, "-o", imagesPath, "-c", atlasPath].join(' '), {stdio: 'ignore'});
        // console.log([`"${comFile}"`, ...(proxy ? ["-x", `${proxy.host}:${proxy.port}`] : []), "-u", projectSpineVersion, "-i", projectBase, "-o", imagesPath, "-c", atlasPath].join(' '))
        console.log(`开始创建项目 ${projectName}`);
        // console.log([`"${comFile}"`, ...(proxy ? ["-x", `${proxy.host}:${proxy.port}`] : []), "-u", projectSpineVersion, "-i", projectBase, "-o", spineProjectFilePath, "-s", `${scale}`, "-r", jsonPath].join(' '));
        execSync([`"${comFile}"`, ...(proxy ? ["-x", `${proxy.host}:${proxy.port}`] : []), "-u", projectSpineVersion, "-i", projectBase, "-o", spineProjectFilePath, "-s", `${scale}`, "-r", jsonPath].join(' '), {stdio: 'ignore'});
    } catch (e) {
        const errProjectPath = join(errorPath, projectName);
        renameSync(projectBase, errProjectPath);
        console.error(`项目：${projectName}创建失败！`);
    }
}
const toSpineProject = async (projects: SpineObject[], config: SpineConfig, outputPath: string) => {
    const absOutputPath = getAbsolutePath(outputPath);
    if (existsSync(absOutputPath)) {
        rmSync(absOutputPath, {recursive: true, force: true});
    }
    mkdirSync(absOutputPath, {recursive: true});
    const errPath = join(absOutputPath, "error")
    mkdirSync(errPath, {recursive: true});
    await Promise.all(projects.map(e => handleSingleProject(e, config, absOutputPath, errPath)));
}