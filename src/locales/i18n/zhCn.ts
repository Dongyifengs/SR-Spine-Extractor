// zh-CN.js
export default {
    // mainUI -> 页面首页的文本
    mainUI: {
        button: {
            paste: '粘贴',
            clear: '清除',
            parse: '解析',
            preview: '预览'
        },
        table: {

        },
        text: {
            inputUrlPlaceholder: '请输入网页地址：',
        },
        message: {
            pasteSuccess: '已粘贴剪贴板内容！',
            pasteError: '粘贴失败！请查看报错: {error}',
            clearSuccess: '已清除！',
            developing: '正在开发！',
            SettingsSavedSuccessfully: '设置已成功保存!'
        },
        log: {
            errOut: '错误报告：{error}'
        },
        language: {
            zh: '中文',
            en: '英文',
            currentLanguage: '当前语种为：{language}'
        }
    },
    settings: {
        table: {
            settings: '设置',
            spineLocation: 'Spine位置',
            ExportLocation: '导出位置',
            outMaterialFile: '导出素材文件',
            outSpineFile: '导出Spine文件',
            outAllFile: '导出页面所有文件',
            theme: '主题',
            numberOfSimultaneousFileProcessing: '同时文件处理数量',
            Cancel: '取消',
            Save: '保存'
        },
        text: {
            EnterSpineLocation: '请输入Spine.com的路径',
            EnterExportLocation : '请输入输出路径',
            themeSelect : '主题选择(默认亮色模式)',
            lightMode : '浅色模式',
            darkMode : '深色模式',
            dependingOnTheSystemSelection : '根据系统选择',
        },
        button: {
            select: '选择'
        },
        message: {
            selectSpineLocationError: '选择Spine位置错误',
            selectExportLocationError: '选择导出位置错误'

        },
        dialog: {
            selectSpineDirectory: '选择 Spine 目录',
            selectExportLocation: '选择导出位置'
        },
        log: {
            ErrorSelectingFileDirectory: '选择文件时出错：',
            ErrorSelectingOutDirectory: '选择输出目录时出错：',
        }
    }
}