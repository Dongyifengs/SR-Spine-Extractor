import {build} from "vite";
import {viteConfiguration} from "./DevUtils";
import {api} from '@electron-forge/core';
import {existsSync, rmSync, readdirSync, readFileSync, writeFileSync, cpSync} from "fs";
import {join, resolve} from "path";
import { spawnSync } from "child_process"

if (existsSync("./build/app")) {
    rmSync("./build/app", {recursive: true, force: true});
}

if (existsSync("./build/vite")) {
    rmSync("./build/vite", {recursive: true, force: true});
}

let mainJsContent = readFileSync("./build/main.js", {encoding: 'utf-8'});

mainJsContent = mainJsContent.replace("const development = true;", "const development = false;");

mainJsContent = mainJsContent.replaceAll(new RegExp('.* = require\\("./utils/DevUtils"\\);', 'g'), "");

writeFileSync("./build/main.js", mainJsContent);

const copy_file_list = readdirSync("./build");

build(viteConfiguration).then(() => {
    const vite_file_list = readdirSync("./build/vite");
    api.init({dir: "./build/app", interactive: true}).then(() => {
        const myPackage = JSON.parse(readFileSync("./package.json", {encoding: "utf-8"}));
        myPackage['scripts']['make'] = "electron-forge make";
        myPackage['devDependencies']['@electron/fuses'] = "^1.7.0";
        myPackage['devDependencies']['@electron-forge/plugin-fuses'] = '^7.2.0';
        myPackage['devDependencies']['@electron-forge/maker-zip'] = '^7.3.0';
        myPackage['devDependencies']['@electron-forge/cli'] = myPackage['devDependencies']['@electron-forge/core'];
        myPackage['main'] = "src/main.js";
        myPackage['config'] = {
            forge: {
                packagerConfig: {asar: true},
                makers: [{name: "@electron-forge/maker-zip", platforms: ["darwin", "linux", "win32"]}]
            }
        }
        writeFileSync("./build/app/package.json", JSON.stringify(myPackage));
        rmSync("./build/app/src/index.css");
        rmSync("./build/app/src/index.html");
        rmSync("./build/app/src/index.js");
        copy_file_list.forEach(v => {
            cpSync(join("./build/", v), join("./build/app/src", v), {recursive: true});
        });
        vite_file_list.forEach(v => {
            cpSync(join("./build/vite", v), join("./build/app/src", v), {recursive: true});
        });
    })
})