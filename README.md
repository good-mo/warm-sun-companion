# 暖阳陪伴（Warm Sun Companion）

基于 **魔珐星云具身交互智能 SDK**（`@xmov/avatar`）打造的 AI 数字人陪伴应用。

## 功能

- 🧑‍🤝‍🧑 **数字人陪伴**：基于魔珐星云具身交互智能 SDK，渲染高清 3D 数字人
- 🎙️ **语音对话**：支持麦克风 ASR 语音识别、打断对话（端到端 E2E）
- 💬 **文本对话**：文本输入 → LLM 智能体 → 数字人语音播报（SSML）
- 🌞 **情绪关怀**：温暖的陪伴交互，支持晨安/晚安/心情关怀等场景
- 📝 **聊天记忆**：本地持久化解说记忆，越聊越懂你

## 技术栈

| 层 | 技术 |
|---|---|
| 数字人 | 魔珐星云 `@xmov/avatar` 2.3.x（`XingyunAvatarAgent` 星云智能体） |
| 前端 | HTML + CSS + JavaScript（原生，可离线运行） |
| 渲染 | WebGL（SDK 内置） |
| 后端（可选） | Python FastAPI（本地代理/资源服务） |

## 快速开始

### 1. 配置 SDK 凭证

> 🔐 **安全说明**：仓库中的 [`frontend/src/config.js`](frontend/src/config.js) 只包含占位符，**不包含真实凭证**。真实凭证保存在本地 `config.local.js`（已被 `.gitignore` 忽略，不会提交到仓库）。

**步骤：**

1. 复制模板文件为本地凭证文件：

   ```bash
   cd frontend/src
   cp config.local.example.js config.local.js
   ```

2. 在 `config.local.js` 中填入你的魔珐星云凭证：

   ```js
   export const MOFA_CONFIG = {
     appId: 'your-app-id',
     appSecret: 'your-app-secret',
     // ⚠️ 网关地址必须使用官方文档提供的真实地址
     gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa_v2/session',
     asrId: 1,   // ASR 引擎 ID
     llmId: 1,   // LLM 引擎 ID
   };
   ```

3. 运行时 [`resolveConfig()`](frontend/src/config.js) 会自动合并 `config.local.js` 与默认配置。

> **E2E 语音通道由 SDK 自动建立，无需手动配置 `e2eServer`。**
>
> ⚠️ **切勿将 `config.local.js` 提交到公开仓库**，否则会泄露你的 appId/appSecret。

### 2. 启动前端（无需 Node.js）

SDK 使用官方单文件版（`vendor/xmov-avatar/xmovAvatar_e2e.latest.js`，自动暴露 `window.XingyunAvatarAgent`），前端可直接用静态服务器运行（Vite 默认端口为 5173）：

```bash
cd frontend
python3 -m http.server 5173
```

访问 `http://localhost:5173` 即可体验。

> 若使用 Vite 开发（需 Node.js）：
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

## 项目结构

```
warm-sun-companion/
├── frontend/              # 前端（核心）
│   ├── index.html         # 入口页面
│   ├── src/
│   │   ├── main.js        # 应用入口
│   │   ├── config.js      # SDK 配置（占位符，公开）
│   │   ├── config.local.js        # 本地凭证（gitignored，不提交）
│   │   ├── config.local.example.js # 凭证模板（提交）
│   │   ├── core/
│   │   │   └── mofa-sdk.js    # 魔珐星云 SDK 封装
│   │   ├── components/    # UI 组件
│   │   │   ├── AvatarView.js    # 数字人视窗
│   │   │   ├── ChatPanel.js     # 聊天面板
│   │   │   ├── VoiceInput.js    # 语音输入
│   │   │   └── MemoryPanel.js   # 记忆面板
│   │   ├── styles/        # 样式
│   │   ├── types/         # SDK 类型参考
│   │   └── utils/         # 工具函数
│   ├── tests/             # 单元测试
│   └── vendor/            # SDK 本地包（官方单文件版）
│       └── xmov-avatar/
│           └── xmovAvatar_e2e.latest.js   # 官方端到端 SDK（暴露 window.XingyunAvatarAgent）
└── backend/               # 后端（可选）
    ├── main.py            # FastAPI 入口
    └── requirements.txt
```

## SDK 文档

- NPM: `@xmov/avatar`（`XmovAvatar` 基础 + `XingyunAvatarAgent` 星云智能体）
- 核心方法：`init()` / `ask()` / `speak(ssml)` / `startASR()` / `stopASR()` / `interrupt()` / `destroy()`
- 回调：`onAgentStateChange` / `onASRResult` / `onLLMResponse` / `onConversationChange` / `onError`

## 注意

- 需向魔珐申请 **appId / appSecret** 及网关地址，否则 SDK 无法连接
- 前端运行无需 Node.js（使用本地 vendor UMD）；仅 Vite 开发模式需要 Node.js
- 语音对话需浏览器支持麦克风权限（HTTPS 或 localhost）
