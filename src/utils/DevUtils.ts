import {createServer, type UserConfig} from "vite"
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"

export const viteConfiguration: UserConfig = {
    root: "./src/vue",
    plugins: [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        Components({
            resolvers: [ElementPlusResolver()],
        }),
    ],
    base: "./",
    server: {host: "0.0.0.0"},
    build: {outDir: "../../build/vite"}
}
export const startingDevServer = async (): Promise<number> => {
    const server = await createServer(viteConfiguration);
    await server.listen();
    return server.config.server.port ? server.config.server.port : -1;
}