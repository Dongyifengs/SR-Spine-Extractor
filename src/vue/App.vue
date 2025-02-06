<template>
  <div class="main">
    <!-- 用户输入URL框 -->
    <div class="userInputUrlBox">
      <el-input v-model="userInputUrl" style="max-width: 600px" placeholder="请输入网页地址："
                class="input-with-select"></el-input>
      <el-button type="warning" @click="paste()">粘贴</el-button>
      <el-button type="danger" @click="clear()">清除</el-button>
      <el-button type="success" @click="parsing()">解析</el-button>
    </div>

    <!-- 选择框 -->
    <div class="userInputUrlTool">
      <el-checkbox v-model="outMaterialFile" label="导出素材文件[无需正版]" size="small" @change="saveCheckboxState"/>
      <el-checkbox v-model="outSpineFile" label="导出Spine文件[需要正版]" size="small" @change="saveCheckboxState"/>
      <el-checkbox v-model="outPageAllFile" label="导出页面所有文件" size="small" @change="saveCheckboxState"/>
      <el-button type="info" link size="small" @click="spinePath()">Spine路径设置</el-button>
    </div>

    <!-- 页面信息展示 -->
    <div class="enterYourInformation">
      <el-text type="primary">页面名称：</el-text>
      <el-text type="info">{{ pageName }}</el-text>
      <div class="exitYourInformationBox">
        <div class="exitYourInformationBox1">
          <div>
            <el-text type="primary">Spine最低版本：</el-text>
            <el-text type="info">{{ spineMinVersion }}</el-text>
          </div>
          <div>
            <el-text type="primary">Spine最高版本：</el-text>
            <el-text type="info">{{ spineMaxVersion }}</el-text>
          </div>
          <div>
            <el-text type="primary">Spine项目数：</el-text>
            <el-text type="info">{{ projectNum }}</el-text>
          </div>
        </div>
        <div class="exitYourInformationBox2">
          <div>
            <el-text type="primary">贴图数量：</el-text>
            <el-text type="info">{{ textureNum }}</el-text>
          </div>
          <div>
            <el-text type="primary">是否飘动异常：</el-text>
            <el-text type="info">{{ extraError }}</el-text>
          </div>
          <div>
            <el-text type="primary">网站构建时间：</el-text>
            <el-text type="info">{{ webBuildTime }}</el-text>
          </div>
        </div>
      </div>
    </div>

    <!-- 终端输出 -->
    <div class="terminalContainer">
      <div class="leftWindow">
        <div class="outExtraErrorLog">
          <span class="logText">飘动异常列表:</span><br>
          <span class="terminal">{{ outExtraErrorList }}</span><br>
        </div>
      </div>
      <div class="rightWindow">
        <div class="outLog">
          <span class="logText">软件输出日志:</span>
          <span class="terminal">{{ outLogText }}</span><br>
        </div>
      </div>
    </div>

    <!-- 警告提示 -->
    <div class="tips">
      <el-link type="info" @click="openLink('https://github.com/Dongyifengs/SR-Spine-Extractor/issues/new')" href="#">
        若出现网站无法正常解析，Spine无法正常识别的问题请点击此处跳转Github进行反馈
      </el-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 导入外部库
import {ref, onMounted, watch} from "vue";
import {ElMessage} from 'element-plus';
import 'element-plus/theme-chalk/dark/css-vars.css';

// 定义变量
const userInputUrl = ref(""); // 用户输入url地址的函数
const outMaterialFile = ref(false); // 导出素材文件的选择框
const outSpineFile = ref(false);  // 导出Spine文件的选择框
const outPageAllFile = ref(false);  // 导出页面所有文件的选择框

const pageName = ref("未知名称"); // 页面名称
const spineMinVersion = ref("未知版本");  // Spine最低版本
const spineMaxVersion = ref("未知版本");  // Spine最高版本
const projectNum = ref("未知数量"); // Spine项目数
const textureNum = ref("未知数量"); // 贴图数量
const extraError = ref("未知异常"); // 是否飘动异常
const webBuildTime = ref("未知时间"); // 网站构建时间

const outExtraErrorList = ref("");  // 飘动异常列表输出控制台
const outLogText = ref(""); // 软件输出日志控制台

const spineFilePath = ref(localStorage.getItem('spineFilePath') || '') // 用于存储Spine路径

const SRPEVersion = ref("0.0.1")  // 用于对外公开版本
const SRPEVersionNum = ref(0.01)  // 用于内部版本比较
const SRPEHtmlText = ref("SR Spine Extractor")  // 用户软件名称

// 页面名称渲染
watch(SRPEHtmlText, (e) => {
  document.title = e;
})
document.title = SRPEHtmlText.value + ` - v${SRPEVersion.value} -vNum:${SRPEVersionNum.value}`;

// 功能实现
// 粘贴功能
const paste = async () => {
  try {
    userInputUrl.value = await navigator.clipboard.readText();
    ElMessage.success("已粘贴剪贴板内容")
  } catch (error) {
    ElMessage.error("粘贴失败，请允许访问剪贴板" + error);
  }
}

// 清除功能
const clear = () => {
  userInputUrl.value = "";
  ElMessage.success("已清除");
}

// 解析功能
const parsing = () => {
  ElMessage("这是解析功能");
}

// 设置Spine路径按钮点击事件
const spinePath = async () => {
  const filePath = await window.main.selectSpinePath()
  if (!filePath) {
    ElMessage({type: 'info', message: '路径选择已取消'})
    return
  }

  localStorage.setItem('spineFilePath', `"${filePath}"`)
  spineFilePath.value = filePath

  ElMessage({
    type: 'success',
    message: `选择Spine路径为：${filePath}`,
  })
}

// 保存选择框状态到 localStorage
const saveCheckboxState = () => {
  localStorage.setItem('outMaterialFile', String(outMaterialFile.value));
  localStorage.setItem('outSpineFile', String(outSpineFile.value));
  localStorage.setItem('outPageAllFile', String(outPageAllFile.value));
}

// 从 localStorage 恢复选择框状态
const restoreCheckboxState = () => {
  const storedOutMaterialFile = localStorage.getItem('outMaterialFile');
  const storedOutSpineFile = localStorage.getItem('outSpineFile');
  const storedOutPageAllFile = localStorage.getItem('outPageAllFile');

  if (storedOutMaterialFile) {
    outMaterialFile.value = storedOutMaterialFile === 'true';
  }
  if (storedOutSpineFile) {
    outSpineFile.value = storedOutSpineFile === 'true';
  }
  if (storedOutPageAllFile) {
    outPageAllFile.value = storedOutPageAllFile === 'true';
  }
}

// url点击调用原生浏览器方法
const openLink = (link: string) => {
  window.main.openLink(link);
}

// 组件挂载时恢复状态
onMounted(() => {
  restoreCheckboxState();
});

</script>

<style scoped>

</style>