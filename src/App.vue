<template>
  <el-button>{{ buttonText }}</el-button>
</template>

<script setup lang="ts">
import {ref} from "vue";

const buttonText = ref("这是一个测试按钮")
</script>

<style scoped>
* {
  margin: 0;
}
</style>