import {createServer, UserConfig} from "vite"
import vue from '@vitejs/plugin-vue'

export const viteConfiguration: UserConfig = {
    root: "./src/vue",
    plugins: [vue()],
    base: "./",
    server: {host: "0.0.0.0"},
    build: {outDir: "../../build/vite"}
}
export const startingDevServer = async (): Promise<number> => {
    const server = await createServer(viteConfiguration);
    await server.listen();
    return server.config.server.port ? server.config.server.port : -1;
}