"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const DevUtils_1 = require("./DevUtils");
const core_1 = require("@electron-forge/core");
const fs_1 = require("fs");
const path_1 = require("path");
if ((0, fs_1.existsSync)("./build/app")) {
    (0, fs_1.rmSync)("./build/app", { recursive: true, force: true });
}
if ((0, fs_1.existsSync)("./build/vite")) {
    (0, fs_1.rmSync)("./build/vite", { recursive: true, force: true });
}
let mainJsContent = (0, fs_1.readFileSync)("./build/main.js", { encoding: 'utf-8' });
mainJsContent = mainJsContent.replace("const development = true;", "const development = false;");
mainJsContent = mainJsContent.replaceAll(new RegExp('.* = require\\("./utils/DevUtils"\\);', 'g'), "");
(0, fs_1.writeFileSync)("./build/main.js", mainJsContent);
const copy_file_list = (0, fs_1.readdirSync)("./build");
(0, vite_1.build)(DevUtils_1.viteConfiguration).then(() => {
    const vite_file_list = (0, fs_1.readdirSync)("./build/vite");
    core_1.api.init({ dir: "./build/app", interactive: true }).then(() => {
        const myPackage = JSON.parse((0, fs_1.readFileSync)("./package.json", { encoding: "utf-8" }));
        myPackage['scripts']['make'] = "electron-forge make";
        myPackage['devDependencies']['@electron/fuses'] = "^1.7.0";
        myPackage['devDependencies']['@electron-forge/plugin-fuses'] = '^7.2.0';
        myPackage['devDependencies']['@electron-forge/maker-zip'] = '^7.3.0';
        myPackage['devDependencies']['@electron-forge/cli'] = myPackage['devDependencies']['@electron-forge/core'];
        myPackage['main'] = "src/main.js";
        myPackage['config'] = {
            forge: {
                packagerConfig: { asar: true },
                makers: [{ name: "@electron-forge/maker-zip", platforms: ["darwin", "linux", "win32"] }]
            }
        };
        (0, fs_1.writeFileSync)("./build/app/package.json", JSON.stringify(myPackage));
        (0, fs_1.rmSync)("./build/app/src/index.css");
        (0, fs_1.rmSync)("./build/app/src/index.html");
        (0, fs_1.rmSync)("./build/app/src/index.js");
        copy_file_list.forEach(v => {
            (0, fs_1.cpSync)((0, path_1.join)("./build/", v), (0, path_1.join)("./build/app/src", v), { recursive: true });
        });
        vite_file_list.forEach(v => {
            (0, fs_1.cpSync)((0, path_1.join)("./build/vite", v), (0, path_1.join)("./build/app/src", v), { recursive: true });
        });
    });
});
