<template>
  <el-dropdown @command="handleSelect" trigger="click">
    <el-button>
      {{ $t(`message.language.${curLanguage}`) }}
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
            :command="'zh'"
            :disabled="curLanguage === 'zh'"
        >
          {{ $t('message.language.zh') }}
        </el-dropdown-item>
        <el-dropdown-item
            :command="'en'"
            :disabled="curLanguage === 'en'"
        >
          {{ $t('message.language.en') }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const { t, locale } = useI18n()

const handleSelect = (v: string) => {
  localStorage.setItem('language', v)
  locale.value = v
  ElMessage.success(
      t('message.language.currentLanguage', {
        language: t(`message.language.${v}`)  // 使用当前语言代码直接获取翻译
      })
  )
}

const curLanguage = computed(() => locale.value)
</script>