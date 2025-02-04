"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startingDevServer = exports.viteConfiguration = void 0;
const vite_1 = require("vite");
const plugin_vue_1 = __importDefault(require("@vitejs/plugin-vue"));
exports.viteConfiguration = {
    root: "./src/vue",
    plugins: [(0, plugin_vue_1.default)()],
    base: "./",
    server: { host: "0.0.0.0" },
    build: { outDir: "../../build/vite" }
};
const startingDevServer = async () => {
    const server = await (0, vite_1.createServer)(exports.viteConfiguration);
    await server.listen();
    return server.config.server.port ? server.config.server.port : -1;
};
exports.startingDevServer = startingDevServer;
