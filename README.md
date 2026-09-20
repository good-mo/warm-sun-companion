# 暖阳陪伴（Warm Sun Companion）

> 基于 **魔珐星云具身交互智能 SDK**（`@xmov/avatar` / `XingyunAvatarAgent`）的 AI 数字人陪伴应用，面向老年用户提供有温度、可行动的陪伴体验。

[![CI](https://github.com/good-mo/warm-sun-companion/actions/workflows/ci.yml/badge.svg)](https://github.com/good-mo/warm-sun-companion/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 目录

- [项目背景](#项目背景)
- [功能介绍](#功能介绍)
- [技术方案](#技术方案)
- [快速开始](#快速开始)
- [配置说明（脱敏）](#配置说明脱敏)
- [测试](#测试)
- [CI / CD](#ci--cd)
- [部署指南](#部署指南)
- [项目结构](#项目结构)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

---

## 项目背景

中国已进入深度老龄化社会。大量独居 / 空巢老人面临 **情感陪伴缺失、健康照护不及时、数字产品不会用** 三大痛点。传统语音助手冰冷、工具化；纯文本聊天机器人缺乏"在场感"。

**暖阳陪伴** 通过数字人形象 + 大模型理解 + 情绪识别 + 主动关怀 + 适老化交互，把"陪伴"从口号变成真实可运行的软件：数字人会在清晨问候、识别低落情绪并安抚、记住名字与生日、帮你记药和联系紧急联系人。

本项目源自一次产品价值论证——从 **需求真实性、不可替代性（为何非数字人不可）、创意新颖度、社会与商业价值** 四个维度评估后，将论证中的每一个"痛点"都落实为可运行代码（见 [`core/care.js`](frontend/src/core/care.js) 等模块）。

## 功能介绍

- 🧑‍🤝‍🧑 **数字人陪伴**：基于魔珐星云具身交互智能 SDK，渲染高清 3D 数字人，支持聆听 / 思考 / 说话 / 打断等具身状态
- 🎙️ **语音对话**：麦克风 ASR 语音识别、打断对话（端到端 E2E），也支持文本输入
- 🌞 **关怀场景引擎**（[`core/care.js`](frontend/src/core/care.js)）：时间场景（晨安 / 晚安 / 深夜）、节日场景（元旦 / 春节 / 中秋 / 重阳 / 母亲节 / 父亲节等）、心情场景、生日与偏好记忆，主动发起有温度的问候
- 💛 **情绪识别与具身协同**：从用户输入识别 开心 / 难过 / 疲惫 / 焦虑 / 孤独 / 生气，联动状态条情绪可视化，并注入共情话术让 LLM 先安抚再回应
- 👵 **适老化关怀模式**（[`core/care-mode.js`](frontend/src/core/care-mode.js)）：一键切换大字体 / 高对比度 / 大按钮 / 语音优先，快捷键 `Alt+C`，记忆上次选择
- ♿ **无障碍支持**：按钮 `aria-label`、状态条 `aria-live`、键盘焦点可见（`focus-visible`）、屏幕阅读器播报
- 📝 **聊天记忆**：本地持久化 + 后端持久化，长期记忆抽取（姓名 / 生日 / 喜好 / 健康），按类别分组展示
- 🧭 **行动能力**（[`core/actions.js`](frontend/src/core/actions.js)）：待办 / 提醒 / 时间查询，以及适老化动作——用药提醒、健康记录、紧急联系人、SOS 求助

## 技术方案

| 层 | 技术 | 说明 |
|---|---|---|
| 数字人 | 魔珐星云 `@xmov/avatar` 2.3.x（`XingyunAvatarAgent`） | 本地 vendor 单文件版，无需 npm 也可运行 |
| 前端 | HTML + CSS + JavaScript（原生 ES Module） | 2 空格缩进，组件化（`components/`），逻辑模块化（`core/`） |
| 渲染 | WebGL（SDK 内置） | 高清 3D 数字人 |
| 大模型 | SDK 内置 LLM 引擎（`llmId` 配置） | 通过上下文注入实现个性化多轮对话 |
| 后端（可选） | Python FastAPI | 记忆持久化 `/api/memory`、健康检查 `/api/health` |
| 测试 | Vitest（单元测试） | [`tests/chat.test.js`](frontend/tests/chat.test.js) |
| CI | GitHub Actions | 见 [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| 部署 | Docker（`Dockerfile.*` + `docker-compose.yml`） | 一键容器化部署 |

### 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器 (前端)                        │
│  index.html → main.js（入口/编排）                        │
│    ├── components/  AvatarView · ChatPanel · MemoryPanel │
│    │                VoiceInput                           │
│    ├── core/        mofa-sdk(封装) · care(关怀)           │
│    │                care-mode(适老化) · memory · actions  │
│    │                api(后端调用)                          │
│    └── config.js    resolveConfig() 合并本地凭证           │
└───────────────┬────────────────────┬────────────────────┘
                │ 魔珐星云SDK          │ /api（HTTP 可选）
                ▼                    ▼
        ┌───────────────┐   ┌───────────────┐
        │ 魔珐星云云端服务 │   │ FastAPI 后端   │
        │ ASR/LLM/TTSA  │   │ 记忆持久化      │
        └───────────────┘   └───────────────┘
```

## 快速开始

### 1. 配置 SDK 凭证

> 🔐 **安全说明**：仓库中的 [`frontend/src/config.js`](frontend/src/config.js) 只包含占位符，**不包含真实凭证**。真实凭证保存在本地 `config.local.js`（已被 [`.gitignore`](.gitignore) 忽略，不会提交到仓库）。

**步骤：**

1. 复制模板文件为本地凭证文件：
   ```bash
   cd frontend/src
   cp config.local.example.js config.local.js
   ```

2. 在 `config.local.js` 中填入你的魔珐星云凭证（appId / appSecret，向魔珐星云申请）。

3. 运行时 [`resolveConfig()`](frontend/src/config.js) 会自动合并 `config.local.js` 与默认配置。

> ⚠️ **切勿将 `config.local.js` 提交到公开仓库**，否则会泄露你的 appId / appSecret。

### 2. 启动前端（无需 Node.js）

SDK 使用官方单文件版（`frontend/vendor/xmov-avatar/xmovAvatar_e2e.latest.js`，自动暴露 `window.XingyunAvatarAgent`）：

```bash
cd frontend
python3 -m http.server 5173
```

访问 `http://localhost:5173` 即可体验。

> 若使用 Vite 开发（需 Node.js ≥ 18）：
> ```bash
> cd frontend
> npm install
> npm run dev   # 默认 5173 端口
> ```

### 3. 启动后端服务（可选，FastAPI）

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

后端提供 `/api/health`、`/api/memory` 等接口，用于陪伴记忆的持久化存储。

### 4. 一键启动脚本

```bash
./start.sh   # 同时启动前端静态服务器 + 后端 FastAPI
```

## 配置说明（脱敏）

以下配置项均为 **占位符 / 示例**，真实值请放入 `config.local.js`（gitignored）。仓库中任何文件都**不应**包含真实凭证。

| 配置项 | 位置 | 说明 | 示例值（脱敏） |
|---|---|---|---|
| `appId` | `config.local.js` | 应用凭证 ID | `your-app-id` |
| `appSecret` | `config.local.js` | 应用凭证密钥 | `your-app-secret` |
| `gatewayServer` | `config.js` / `config.local.js` | 网关地址 | `https://nebula-agent.xingyun3d.com/user/v1/ttsa_v2/session` |
| `asrId` | `config.js` | ASR 引擎 ID | `1` |
| `llmId` | `config.js` | LLM 引擎 ID | `1` |
| `avatarId` | `config.local.js` | 数字人形象（可选） | `''` |
| `reconnect.*` | `config.js` | 断线重连参数 | `maxAttempts: 5` |
| `audio.*` | `config.js` | 回声消除等音频参数 | `echoCancellationEnabled: true` |
| `features.*` | `config.js` | 智能体特性开关 | `anti_interference.semantic_judge_enabled: true` |

> ❗ 若误将真实凭证提交到 git 历史，请立即：1) 在魔珐控制台**吊销并重新签发**凭证；2) 使用 `git filter-repo` 清理历史；3) 通知协作者轮换。

## 测试

```bash
cd frontend
npm install          # 首次
npm test             # vitest 单元测试（tests/*.test.js）
npm run build        # 构建验证
```

后端：

```bash
cd backend
python -m py_compile main.py
```

## CI / CD

仓库配置了 GitHub Actions 工作流（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)），在 `push` 到 `main` 与 `pull_request` 时自动执行：

| Job | 内容 |
|---|---|
| `frontend` | `npm install` → `npm test`（Vitest）→ `npm run build`（Vite） |
| `backend` | `pip install -r requirements.txt` → `python -m py_compile main.py` |

## 部署指南

### Docker Compose（推荐）

```bash
docker compose up -d --build
# 前端: http://localhost:5173
# 后端: http://localhost:8000/api/health
```

### 手动部署

1. **前端**：构建产物或静态文件托管到任意 Web 服务器（Nginx 配置见 [`deploy/nginx.conf`](deploy/nginx.conf)）。
2. **后端**：`uvicorn main:app --host 0.0.0.0 --port 8000`（生产建议使用 `gunicorn` + `uvicorn worker`）。
3. **配置**：确保 `config.local.js` 已配置真实凭证，且数据库 / 数据目录有写权限。

## 项目结构

```
warm-sun-companion/
├── .github/
│   ├── workflows/ci.yml         # CI 工作流
│   ├── ISSUE_TEMPLATE/          # Bug / Feature 模板
│   └── PULL_REQUEST_TEMPLATE.md # PR 模板
├── frontend/                    # 前端（核心）
│   ├── index.html               # 入口页面
│   ├── src/
│   │   ├── main.js              # 应用入口
│   │   ├── config.js            # SDK 配置（占位符，公开）
│   │   ├── config.local.js      # 本地凭证（gitignored，不提交）
│   │   ├── config.local.example.js  # 凭证模板（提交）
│   │   ├── core/                # 核心逻辑
│   │   │   ├── mofa-sdk.js      # 魔珐星云 SDK 封装
│   │   │   ├── care.js          # 关怀场景引擎（时间/节日/情绪/记忆关怀）
│   │   │   ├── care-mode.js     # 适老化关怀模式（大字体/无障碍）
│   │   │   ├── memory.js        # 记忆与上下文管理
│   │   │   ├── actions.js       # 行动能力（待办/提醒/用药/紧急联系）
│   │   │   └── api.js           # 后端接口封装
│   │   ├── components/          # UI 组件
│   │   │   ├── AvatarView.js    # 数字人视窗（含情绪可视化）
│   │   │   ├── ChatPanel.js     # 聊天面板（含打字动画）
│   │   │   ├── VoiceInput.js    # 语音输入
│   │   │   └── MemoryPanel.js   # 记忆面板（分类展示）
│   │   ├── styles/main.css      # 全局样式（含关怀模式主题）
│   │   ├── types/               # SDK 类型参考
│   │   └── utils/               # 工具函数
│   ├── tests/                   # 单元测试
│   ├── vendor/xmov-avatar/      # SDK 本地包（官方单文件版）
│   └── package.json
├── backend/                     # 后端（可选）
│   ├── main.py                  # FastAPI 入口
│   └── requirements.txt
├── deploy/nginx.conf            # Nginx 部署配置
├── Dockerfile.frontend          # 前端容器化
├── Dockerfile.backend           # 后端容器化
├── docker-compose.yml           # 一键容器化部署
├── start.sh                     # 一键启动脚本
├── LICENSE                      # MIT 许可证
├── THIRD_PARTY_NOTICES.md       # 第三方依赖与许可声明
├── CONTRIBUTING.md              # 贡献指南
└── README.md
```

## 贡献指南

欢迎参与贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解：

- 提交信息遵循 **Conventional Commits** 规范
- Bug / Feature 使用仓库提供的 [Issue 模板](.github/ISSUE_TEMPLATE/)
- PR 需通过 CI 检查
- 严禁提交敏感凭证

## SDK 文档

- NPM: `@xmov/avatar`（`XmovAvatar` 基础 + `XingyunAvatarAgent` 星云智能体）
- 核心方法：`init()` / `ask()` / `speak(ssml)` / `startASR()` / `stopASR()` / `interrupt()` / `destroy()`
- 回调：`onAgentStateChange` / `onASRResult` / `onLLMResponse` / `onConversationChange` / `onError`

## 注意

- 需向魔珐申请 **appId / appSecret** 及网关地址，否则 SDK 无法连接
- 前端运行无需 Node.js（使用本地 vendor UMD）；仅 Vite 开发 / 测试需要 Node.js（≥ 18）
- 语音对话需浏览器支持麦克风权限（HTTPS 或 localhost）

## 许可证

本项目采用 **MIT License**（[LICENSE](LICENSE)）。第三方依赖许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
> ⚠️ **例外**：魔珐星云 SDK（`@xmov/avatar`）为商业 SDK，其使用受魔珐官方许可约束，不随 MIT 授权分发。
