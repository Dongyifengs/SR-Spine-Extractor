import { createApp } from "vue";
import { createI18n } from 'vue-i18n'
import App from "./App.vue";
import 'element-plus/dist/index.css';
import zhCn from './locales/i18n/zhCn.ts'
import en from './locales/i18n/en'
import './Style.css'

const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('language') || 'zhCn',
    fallbackLocale: 'zhCn',
    messages: {
        zhCn: zhCn,
        en: en
    }
})


const app = createApp(App);
app.use(i18n)
app.mount("#app");
