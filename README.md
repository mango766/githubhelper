<div align="center">

# 🚀 GitHub Helper

**发现热门仓库 & AI 代码助手**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub Release](https://img.shields.io/github/v/release/mango766/githubhelper)](https://github.com/mango766/githubhelper/releases/latest)
[![Chrome](https://img.shields.io/badge/Chrome-Compatible-green.svg)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-Compatible-orange.svg)](https://www.mozilla.org/firefox/)

⭐ 喜欢这个项目？给个 Star 吧！

[快速开始](#安装) · [功能特性](#功能特性) · [使用方法](#使用方法)

</div>

---

## 功能特性

### 🔥 Trending 仓库发现
- 浏览 GitHub 热门仓库
- 支持按时间范围筛选（今日/本周/本月）
- 关键词搜索过滤
- 显示 Star 数、语言、描述等信息

### 🤖 AI 代码助手
- 支持 **Ollama**（本地模型）和 **Gemini**（云端 API）
- 自动获取当前仓库上下文（README、文件结构）
- 智能代码问答和解释
- 聊天历史记录保存

### ⌨️ 快捷操作
- 快捷键 `Ctrl+Shift+G`（Mac: `Command+Shift+G`）快速打开/关闭侧边栏
- `Escape` 键关闭侧边栏
- 悬浮按钮一键切换

## 安装

### 快速安装（推荐）

从 [GitHub Releases](../../releases/latest) 下载最新版本：

- **Chrome / Edge**: 下载 `githubhelper-x.x.x-chrome.zip`
- **Firefox**: 下载 `githubhelper-x.x.x-firefox.zip`

然后解压并加载到浏览器（见下方「加载扩展」章节）。

---

### 从源码构建

```bash
# 克隆项目
git clone <repo-url>
cd githubhelper

# 安装依赖
npm install

# 开发模式（Chrome）
npm run dev

# 开发模式（Firefox）
npm run dev:firefox

# 构建生产版本（Chrome）
npm run build

# 构建生产版本（Firefox）
npm run build:firefox

# 打包 zip
npm run zip
npm run zip:firefox
```

### 加载扩展

#### Edge
1. 打开 `edge://extensions/`
2. 启用「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择 `.output/chrome-mv3` 目录

#### Chrome
1. 打开 `chrome://extensions/`
2. 启用「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `.output/chrome-mv3` 目录

#### Firefox
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「加载临时附加组件」
3. 选择 `.output/firefox-mv2` 目录中的 `manifest.json`

## 使用方法

### 基本使用
1. 访问任意 GitHub 页面
2. 点击页面右侧的悬浮按钮，或使用快捷键 `Ctrl+Shift+G`
3. 侧边栏将显示两个标签页：
   - **Trending**: 浏览热门仓库
   - **AI Chat**: 与 AI 助手对话

### 配置 AI 助手

#### 使用 Ollama（本地）
1. 安装 [Ollama](https://ollama.ai/)
2. 拉取模型：`ollama pull llama3` 或其他模型
3. 启动 Ollama 服务
4. 在扩展设置中选择 Ollama 并配置服务地址（默认 `http://localhost:11434`）

#### 使用 Gemini（云端）
1. 获取 [Google AI Studio](https://aistudio.google.com/) API Key
2. 在扩展设置中选择 Gemini
3. 输入 API Key 并选择模型

### AI Chat 功能
- 在 GitHub 仓库页面打开 AI Chat
- 扩展会自动加载仓库上下文（README、文件结构）
- 可以询问关于代码的问题，AI 会基于仓库内容回答

## 技术栈

- [WXT](https://wxt.dev/) - 浏览器扩展开发框架
- [React](https://react.dev/) - UI 框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- GitHub API - 数据获取

## 权限说明

- `storage`: 保存设置和聊天历史
- `https://github.com/*`: 访问 GitHub 页面
- `https://api.github.com/*`: 调用 GitHub API
- `https://generativelanguage.googleapis.com/*`: 调用 Gemini API
- `http://localhost:*/*`: 连接本地 Ollama 服务

