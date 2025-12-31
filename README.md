<div align="center">

<img src="./public/icon.svg" width="80" alt="GitHub Helper">

# GitHub Helper

**浏览器插件 - 发现热门仓库 & AI 代码助手**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GitHub Release](https://img.shields.io/github/v/release/mango766/githubhelper)](https://github.com/mango766/githubhelper/releases/latest)
[![Chrome](https://img.shields.io/badge/Chrome-Compatible-green.svg)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/Firefox-Compatible-orange.svg)](https://www.mozilla.org/firefox/)

简体中文 | [English](./README.en.md)

[快速开始](#安装) · [功能特性](#功能特性) · [使用方法](#使用方法) · [常见问题](#常见问题)

</div>

> [!NOTE]
> 这是一个第三方浏览器扩展，与 GitHub 官方无关。

---

## Demo

<table align="center">
  <tr>
    <td align="center"><b>🔥 热榜</b><br><img src="./docs/demo-trending.png" width="320"></td>
    <td align="center"><b>🤖 AI 问答</b><br><img src="./docs/demo-chat.png" width="320"></td>
  </tr>
</table>

---

## 功能特性

### 🔥 Trending 仓库发现
- 浏览 GitHub 热门仓库
- 按时间范围筛选（今日/本周/本月）
- 关键词搜索过滤
- 显示 Star 数、语言、描述等信息

### 🤖 AI 代码助手
- 支持 **Ollama**（本地模型）和 **Gemini**（云端 API）
- 自动获取当前仓库上下文（README、文件结构）
- 智能代码问答和解释
- 聊天历史记录保存

### ⌨️ 快捷操作
| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+G` (Mac: `⌘+Shift+G`) | 打开/关闭侧边栏 |
| `Escape` | 关闭侧边栏 |

---

## 安装

### 快速安装（推荐）

从 [GitHub Releases](https://github.com/mango766/githubhelper/releases/latest) 下载最新版本：

| 浏览器 | 下载文件 |
|--------|----------|
| Chrome / Edge | `githubhelper-x.x.x-chrome.zip` |
| Firefox | `githubhelper-x.x.x-firefox.zip` |

### 加载扩展

<details>
<summary><b>Chrome</b></summary>

1. 打开 `chrome://extensions/`
2. 启用「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择解压后的目录

</details>

<details>
<summary><b>Edge</b></summary>

1. 打开 `edge://extensions/`
2. 启用「开发人员模式」
3. 点击「加载解压缩的扩展」
4. 选择解压后的目录

</details>

<details>
<summary><b>Firefox</b></summary>

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「加载临时附加组件」
3. 选择目录中的 `manifest.json`

</details>

### 从源码构建

```bash
git clone https://github.com/mango766/githubhelper.git
cd githubhelper
npm install

# 开发模式
npm run dev          # Chrome
npm run dev:firefox  # Firefox

# 构建生产版本
npm run build        # Chrome
npm run build:firefox

# 打包 zip
npm run zip
npm run zip:firefox
```

---

## 使用方法

1. 访问任意 GitHub 页面
2. 点击右侧悬浮按钮或按 `Ctrl+Shift+G`
3. 选择标签页：
   - **Trending**: 浏览热门仓库
   - **AI Chat**: 与 AI 助手对话

### 配置 AI 助手

#### Ollama（本地）
1. 安装 [Ollama](https://ollama.ai/)
2. 拉取模型：`ollama pull llama3`
3. 在扩展设置中配置服务地址（默认 `http://localhost:11434`）

#### Gemini（云端）
1. 获取 [Google AI Studio](https://aistudio.google.com/) API Key
2. 在扩展设置中输入 API Key 并选择模型

---

## 常见问题

<details>
<summary><b>Ollama 连接失败？</b></summary>

确保 Ollama 服务正在运行，并配置 CORS：
```bash
OLLAMA_ORIGINS="*" ollama serve
```

</details>

<details>
<summary><b>Gemini API 报错？</b></summary>

- 检查 API Key 是否正确
- 确认网络可访问 `generativelanguage.googleapis.com`

</details>

<details>
<summary><b>快捷键不生效？</b></summary>

- 可能与其他扩展冲突，在 `chrome://extensions/shortcuts` 中修改
- 确保当前页面是 GitHub 域名

</details>

---

## 权限说明

| 权限 | 用途 |
|------|------|
| `storage` | 保存设置和聊天历史 |
| `https://github.com/*` | 访问 GitHub 页面 |
| `https://api.github.com/*` | 调用 GitHub API |
| `https://generativelanguage.googleapis.com/*` | 调用 Gemini API |
| `http://localhost:*/*` | 连接本地 Ollama |

---

## 技术栈

[WXT](https://wxt.dev/) · [React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/)

---

## License

[MIT](./LICENSE)

⭐ 喜欢这个项目？给个 Star 吧！
