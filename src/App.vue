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
        <el-input v-model="settings.SpineLocation" :placeholder="$t('settings.text.EnterSpineLocation')"/>
      </el-form-item>

      <el-form-item :label="$t('settings.table.ExportLocation')">
        <el-input v-model="settings.exportLocation" :placeholder="$t('settings.text.EnterExportLocation')"/>
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
import {ref} from "vue";
import {ElMessage} from 'element-plus'
import {Setting} from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/dark/css-vars.css';
import ChangeLan from './locales/Language.vue'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const inputURLText = ref('');
const showSettings = ref(true);

// 配置选项
const settings = ref({
  SpineLocation: '',
  exportLocation: '',
  theme: '',
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

// 保存设置
const saveSettings = () => {
  ElMessage.success(t('mainUI.message.SettingsSavedSuccessfully'));
  showSettings.value = false;
}
</script>