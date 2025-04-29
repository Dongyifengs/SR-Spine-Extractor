<template>
  <el-input
      v-model="inputURLText"
      style="max-width: 300px"
      :placeholder="$t('mainUI.text.inputUrlPlaceholder')"
      class="inputURLClass"
  ></el-input>
  <el-button type="warning" @click="paste()">{{ $t("mainUI.button.paste") }}</el-button>
  <el-button type="danger" :disabled="!inputURLText" @click="clear()">{{ $t("mainUI.button.clear") }}</el-button>
  <el-button type="success" :disabled="!inputURLText" @click="parsing()">{{ $t("mainUI.button.parse") }}</el-button>
  <el-button type="success" @click="preview()">{{ $t("mainUI.button.preview") }}</el-button>
  <el-button type="primary" :icon="Setting" circle @click="showSettings = true"/>


  <!-- 设置页面 -->
  <el-dialog
      v-model="showSettings"
      :title="$t('settings.table.settings')"
      :modal="false"
      :close-on-click-modal="false"
      draggable
      width="500px"
  >
    <ChangeLan/>
    <el-form label-width="150px">
      <el-form-item :label="$t('settings.table.spineLocation')">
        <div style="display: flex; align-items: center; gap: 10px; width: 100%">
          <el-input
              v-model="settings.SpineLocation"
              :placeholder="$t('settings.text.EnterSpineLocation')"
              style="flex: 1"
          />
          <el-button @click="selectSpineLocation">
            {{ $t('settings.button.select') }}
          </el-button>
        </div>
      </el-form-item>

      <el-form-item :label="$t('settings.table.ExportLocation')">
        <div style="display: flex; align-items: center; gap: 10px; width: 100%">
          <el-input
              v-model="settings.exportLocation"
              :placeholder="$t('settings.text.EnterExportLocation')"
              style="flex: 1"
          />
          <el-button @click="selectExportLocation">
            {{ $t('settings.button.select') }}
          </el-button>

        </div>
      </el-form-item>

      <el-form-item :label="$t('settings.table.theme')">
        <el-select v-model="settings.theme" :placeholder="$t('settings.text.themeSelect')">
          <el-option :label="$t('settings.text.lightMode')" value="lightMode"/>
          <el-option :label="$t('settings.text.darkMode')" value="darkMode"/>
          <el-option :label="$t('settings.text.dependingOnTheSystemSelection')" value="dependingOnTheSystemSelection"/>
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('settings.table.outMaterialFile')">
        <el-switch v-model="settings.outMaterialFile"/>
      </el-form-item>

      <el-form-item :label="$t('settings.table.outSpineFile')">
        <el-switch v-model="settings.outSpineFile"/>
      </el-form-item>

      <el-form-item :label="$t('settings.table.outAllFile')">
        <el-switch v-model="settings.outAllFile"/>
      </el-form-item>

      <el-form-item :label="$t('settings.table.numberOfSimultaneousFileProcessing')">
        <el-input-number v-model="settings.numberOfSimultaneousFileProcessing" :min="1" :max="10"/>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showSettings = false">{{ $t('settings.table.Cancel') }}</el-button>
      <el-button type="primary" @click="saveSettings">{{ $t('settings.table.Save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {ElMessage} from 'element-plus'
import {Setting} from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/dark/css-vars.css';
import {open} from '@tauri-apps/plugin-dialog';
import {Command} from '@tauri-apps/plugin-shell'
import ChangeLan from './locales/Language.vue'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const inputURLText = ref('');
const showSettings = ref(false);

// 配置选项
const settings = ref({
  SpineLocation: '',
  exportLocation: '',
  theme: 'lightMode',
  outMaterialFile: false,
  outSpineFile: false,
  outAllFile: false,
  numberOfSimultaneousFileProcessing: 5,
})

// 粘贴功能
const paste = async () => {
  try {
    inputURLText.value = await navigator.clipboard.readText();
    ElMessage.success(t('mainUI.message.pasteSuccess'));
  } catch (error) {
    ElMessage.error(t('mainUI.message.pasteError', {error}));
  }
}

// 清除功能
const clear = async () => {
  inputURLText.value = '';
  ElMessage.success(t('mainUI.message.clearSuccess'));
}

// 解析功能
const parsing = async () => {
  ElMessage.success(t('mainUI.message.developing'));
}

// 预览功能
const preview = async () => {
  try {
    // 检查 Spine 路径
    if (!settings.value.SpineLocation) {
      ElMessage.warning('请先设置 Spine 可执行文件路径');
      return;
    }

    // 使用绝对路径更安全
    const jarPath = 'C:\\Users\\15459\\Downloads\\skeletonViewer-4.2.40.jar';

    // 创建命令对象
    const command = Command.create('java', [
      '-jar',
      jarPath
    ]);

    // 执行命令
    const result = await command.execute();

    // 处理结果
    if (result.code === 0) {
      ElMessage.success('Spine 预览器启动成功');
    } else {
      ElMessage.error(`启动失败: ${result.stderr}`);
    }

  } catch (error) {
    ElMessage.error(`预览时出错: ${error}`);
    console.error('执行命令出错:', error);
  }
}

// 保存设置
const saveSettings = () => {
  localStorage.setItem('appSettings', JSON.stringify(settings.value));
  ElMessage.success(t('mainUI.message.SettingsSavedSuccessfully'));
  showSettings.value = false;
}

// 加载页面加载本地设置数据
const loadSettings = () => {
  const savedSettings = localStorage.getItem('appSettings');
  if (savedSettings) {
    settings.value = JSON.parse(savedSettings);
  }
}

// 选择Spine路径功能
const selectSpineLocation = async () => {
  try {
    const selected = await open({
      directory: false,
      multiple: false,
      title: t('settings.dialog.selectSpineDirectory'),
    });

    if (selected) {
      // 在Tauri中，selected可能是字符串或字符串数组
      settings.value.SpineLocation = Array.isArray(selected) ? selected[0] : selected;
    }
  } catch (error) {
    ElMessage.error(t('settings.message.selectSpineLocationError', {error}));
    console.error(t('settings.log.ErrorSelectingFileDirectory'), error);
  }
}

// 选择输出目录功能
const selectExportLocation = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t('settings.dialog.selectExportLocation'),
    });

    if (selected) {
      // 在Tauri中，selected可能是字符串或字符串数组
      settings.value.exportLocation = Array.isArray(selected) ? selected[0] : selected;
    }
  } catch (error) {
    ElMessage.error(t('settings.message.selectExportLocationError', {error}));
    console.error(t('settings.log.ErrorSelectingOutDirectory'), error);
  }
}

onMounted(() => {
  loadSettings();
});

</script>