# SR-Spine-Extractor
# 当前Meadme为临时版本，尚未上线正式版

[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[English Readme](https://github.com/Dongyifengs/SR-Spine-Extractor/blob/main/README.md)

## 项目简介

`SR-Spine-Extractor` 是一个用于提取《崩坏：星穹铁道》专题展示页中与 Spine 项目相关内容的工具。它可以直接提取 Spine 项目的相关文件（如 `.atlas`, `.png`, `.skel`, `.json`），并利用已安装的正版 Spine 自动将这些文件打包为 `.spine` 文件。此外，工具还支持从用户输入的网页地址中保存所有元素，包括 `mp3`, `mp4`, `js` 等网页中的所有资源。

## 主要功能

- **提取 Spine 项目文件**：自动提取 `.atlas`, `.png`, `.skel`, `.json` 等文件。
- **自动打包为 `.spine` 文件**：依赖已安装的正版 Spine 软件，将提取的文件打包成 `.spine` 文件。
- **保存网页所有元素**：支持从指定网页地址中保存所有元素，包括多媒体文件和脚本。
- **开放协作**：基于 GPL-3.0 许可证，欢迎社区贡献代码、反馈问题和提出改进建议。

## 项目地址

[GitHub 仓库](https://github.com/Dongyifengs/SR-Spine-Extractor/)

## 安装与使用

### 前置条件

- 安装 [Bun](https://bun.sh/) 作为运行环境。
- 若需要自动打包 `.spine` 文件，需安装正版 [Spine](http://esotericsoftware.com/) 软件。

### 安装步骤

1. 克隆仓库：

   ```bash
   git clone https://github.com/Dongyifengs/SR-Spine-Extractor.git
   ```

2. 进入项目目录：

   ```bash
   cd SR-Spine-Extractor
   ```

3. 安装依赖：

   ```bash
   bun install
   ```

### 使用方法

运行主程序并提供目标网页地址：

```bash
bun run main.js <网页地址>
```

例如：

```bash
bun run main.js https://example.com/page
```

工具将自动提取相关文件并根据需要打包为 `.spine` 文件。

## 贡献指南

欢迎大家一起开发和完善本项目！请按照以下步骤进行贡献：

1. Fork 本仓库。
2. 创建您的特性分支 (`git checkout -b feature/新特性`)。
3. 提交您的更改 (`git commit -m '添加新特性'`)。
4. 推送到分支 (`git push origin feature/新特性`)。
5. 创建一个新的 Pull Request。

有关详细信息，请参阅 [贡献指南](CONTRIBUTING.md)。

## 许可证

本项目采用 [GPL-3.0 许可证](https://www.gnu.org/licenses/gpl-3.0.en.html)。

## 鸣谢

- 感谢 [JetBrains](https://www.jetbrains.com/) 提供的开发工具支持。

## 联系方式

如有任何问题、反馈或侵权声明，请通过以下邮箱联系：

- `1545929126@qq.com`
- `dongyifengs@gmail.com`

**注意**：本项目仅供个人学习和参考使用，禁止任何商业用途。若有侵权，请及时联系删除。