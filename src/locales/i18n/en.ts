// en-US.js
export default {
    // mainUI -> Text for the main page
    mainUI: {
        button: {
            paste: 'Paste',
            clear: 'Clear',
            parse: 'Parse'
        },
        table: {},
        text: {
            inputUrlPlaceholder: 'Please enter webpage URL:',
        },
        message: {
            pasteSuccess: 'Clipboard content pasted!',
            pasteError: 'Paste failed! Please check error: {error}',
            clearSuccess: 'Cleared!',
            developing: 'In development!',
            SettingsSavedSuccessfully: 'Settings saved successfully!'
        },
        log: {
            errOut: 'Error report: {error}'
        },
        language: {
            zh: 'Chinese',
            en: 'English',
            currentLanguage: 'Current language: {language}'
        }
    },
    settings: {
        table: {
            settings: 'Settings',
            spineLocation: 'Spine Location',
            ExportLocation: 'Export Location',
            outMaterialFile: 'Export Material Files',
            outSpineFile: 'Export Spine Files',
            outAllFile: 'Export All Page Files',
            theme: 'Theme',
            // numberOfSimultaneousFileProcessing: 'Number of Simultaneous File Processing',
            numberOfSimultaneousFileProcessing: 'NOSFP', // ↑ Number of Simultaneous File Processing
            Cancel: 'Cancel',
            Save: 'Save'
        },
        text: {
            EnterSpineLocation: 'Please enter Spine.com path',
            EnterExportLocation: 'Please enter output path',
            themeSelect: 'Theme selection (default light mode)',
            lightMode: 'Light Mode',
            darkMode: 'Dark Mode',
            dependingOnTheSystemSelection: 'Follow System Setting',
        }
    }
}