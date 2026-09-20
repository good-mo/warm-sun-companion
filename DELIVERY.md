# 暖阳陪伴（Warm Sun Companion）交付文档

> 基于魔珐星云具身交互智能 SDK 的 AI 数字人陪伴应用 —— 面向老年群体的「适老化」关怀型 AI 陪伴方案。
> 本文件为评审交付文档，与 [`README.md`](README.md) 互补：README 面向开发者，本文档面向交付评审。

---

## 0. 交付速览（评审核对表）

| 交付项 | 位置 | 状态 |
| --- | --- | --- |
| 项目说明（架构/创新点/价值） | 本文档第 1 章 | ✅ |
| 开源代码仓库 | `https://github.com/good-mo/warm-sun-companion` | ✅ 已推送 |
| 开源许可证 | [`LICENSE`](LICENSE)（MIT） | ✅ |
| 第三方依赖合规 | [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) | ✅ |
| 构建脚本 | [`docker-compose.yml`](docker-compose.yml)、[`Dockerfile.frontend`](Dockerfile.frontend)、[`Dockerfile.backend`](Dockerfile.backend) | ✅ |
| 启动脚本 | [`start.sh`](start.sh) | ✅ |
| Nginx 配置（SPA/代理/缓存） | [`deploy/nginx.conf`](deploy/nginx.conf) | ✅ |
| 演示视频脚本（3~5 分钟分镜） | [`scripts/DEMO_SCRIPT.md`](scripts/DEMO_SCRIPT.md) | ✅ |
| CI / CD | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | ✅ |
| 社区协作（Issue/PR 模板） | [`.github/`](.github/) | ✅ |

---

## 1. 项目说明

### 1.1 项目简介

「暖阳陪伴」是一款基于 **魔珐星云具身交互智能 SDK** 的 AI 数字人陪伴应用，聚焦"老年群体孤独陪伴、健康关怀、数字化鸿沟"三大社会痛点，将 AI 数字人技术落地为可感知、可验证、可运行的关怀场景：

- **对话陪伴**：数字人"暖阳"通过文本/语音与老人自然对话，具备真实情感反馈（情绪图标、状态灯）。
- **适老化普惠**：一键"关怀模式"切换大字体、高对比度、大按钮，配套无障碍 ARIA 支持与 Alt+C 快捷键。
- **长期记忆**：自动识别并分类记忆老人提到的名字、生日、喜好、健康信息，跨会话持续关怀（如按时段问候、节日提醒）。
- **真实可运行**：前端原生 ESM 模块（零构建依赖，Python 静态服务器即可运行），后端 FastAPI 提供记忆存储接口，Docker Compose 一键部署。

### 1.2 技术架构

| 层次 | 技术选型 | 职责 |
| --- | --- | --- |
| 前端交互层 | 原生 HTML/CSS/JavaScript（ESM 模块） | 页面结构、适老化 UI、无障碍 |
| 数字人能力层 | 魔珐星云具身交互智能 SDK（`XingyunAvatarAgent`） | 数字人驱动、语音 ASR/TTS、表情动作、状态回调 |
| 业务逻辑层 | `src/core/*`（care/memory/actions/care-mode/mofa-sdk/api） | 场景引擎、情绪识别、记忆抽取、关怀指令执行 |
| 界面组件层 | `src/components/*`（AvatarView/ChatPanel/MemoryPanel/VoiceInput） | 数字人视图、对话气泡、记忆面板、语音输入 |
| 后端服务层 | FastAPI + Pydantic + JSON 文件存储 | 健康检查、陪伴记忆存取（跨设备持久化） |
| 部署层 | Docker Compose + Nginx（反向代理/SPA/缓存） | 一键部署、同源 API 代理 |

```text
┌─────────────────────────────────────────────────────────────┐
│  浏览器 （关怀模式/标准模式，Alt+C 切换，WCAG AA 对比度）      │
├─────────────────────────────────────────────────────────────┤
│  前端 ESM 模块                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │AvatarView│ │ChatPanel │ │MemoryPanel│ │VoiceInput │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       └────────────┴─────┬──────┴────────────┘             │
│  ┌───────────────────────▼─────────────────────────┐       │
│  │ core: mofa-sdk(数字人) care(场景/情绪) memory     │       │
│  │       actions(指令) care-mode(适老化) api(后端)   │       │
│  └───────────────────────┬─────────────────────────┘       │
├───────────────────────────┼─────────────────────────────────┤
│                /api 代理（Nginx / Vite dev proxy）           │
├───────────────────────────┼─────────────────────────────────┤
│  魔珐星云具身交互智能 SDK   │   FastAPI 后端（记忆存取）           │
│  XingyunAvatarAgent        │   GET/POST/DELETE /api/memory    │
└───────────────────────────┴─────────────────────────────────┘
```

### 1.3 创新点

1. **四大价值主张的真实落地**（非纸面 PPT）：
   - 「陪伴不缺席」→ 记忆系统 + 主动关怀文案 + 时段/节日场景引擎；
   - 「健康守护，不止生理」→ 情绪识别 + 关怀话术 + 适老化界面；
   - 「不懂也能用」→ 关怀模式大字体/大按钮/语音优先/ARIA 无障碍；
   - 「家人更放心」→ 记忆面板分屏展示 + 跨会话记忆持久化 + 后端接口。
2. **零构建前端**：纯 ESM 原生 JS，无 Node 也可运行（`python3 -m http.server`），降低部署门槛；
3. **适老化设计落地 P0~P3 完整改造**：WCAG AA 对比度（`--text-light: #6b6b6b`）、48px+ 点击目标、`role="switch"` 关怀开关、`aria-live` 状态播报、Alt+C 快捷键；
4. **记忆分类引擎**：关键词规则将记忆自动归类（生日/姓名/偏好/健康/家庭/其他），面板分组展示；
5. **工程化规范**：MIT 许可证、GitHub Actions CI、Conventional Commits、Issue/PR 模板、第三方依赖合规清单。

### 1.4 项目价值

- **社会价值**：面向老龄化社会，为老年人提供有温度的 AI 陪伴与健康关怀，缩小数字鸿沟；
- **技术价值**：验证了"数字人 SDK + 前端工程化 + 适老化设计"的完整落地路径，可复用为数字人应用模板；
- **工程价值**：零构建、可容器化、可 CI 验证，符合开源协作规范，评审方可在标准环境一键运行。

---

## 2. 开源代码

### 2.1 仓库地址

```text
https://github.com/good-mo/warm-sun-companion
```

推荐分支：`main`。提交历史遵循 Conventional Commits：

```text
9b20b26 feat: 真实落实关怀痛点
7e733e2 feat: 界面全面优化（P0-P3 四阶段）
0860aed chore: 工程规范化（MIT许可证/CI/贡献指南/Issue-PR模板/README标准化）
5b06089 fix: 修复关怀模式按钮被遮挡
```

### 2.2 开源许可证

项目采用 **MIT License**（[`LICENSE`](LICENSE)），允许自由使用、修改、分发与商用，附带版权声明即可。

> 注意：数字人能力依赖**魔珐星云具身交互智能 SDK**（商业 SDK，见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)），该部分不随本项目源码开源，需向魔珐星云申请并以官方渠道接入。

### 2.3 第三方依赖管理

- 前端运行时/开发依赖：见 [`frontend/package.json`](frontend/package.json)（`@xmov/avatar`、`vite`、`vitest`），版本均锁定主版本并声明 `engines.node >= 18`；
- 后端依赖：见 [`backend/requirements.txt`](backend/requirements.txt)（`fastapi`、`uvicorn`、`pydantic`）；
- 合规清单：见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)；
- 敏感信息：凭证存放于被 `.gitignore` 忽略的 `frontend/src/config.local.js`（模板 [`config.local.example.js`](frontend/src/config.local.example.js)），仓库不含任何真实密钥。

---

## 3. 构建部署方法

### 3.1 环境要求

| 方式 | 依赖 | 最低版本 |
| --- | --- | --- |
| Docker Compose（推荐） | Docker + Docker Compose | Docker 24+ / Compose v2 |
| 手动部署（前端） | Python | 3.8+ |
| 手动部署（后端） | Python + venv | 3.10+ |
| 前端测试/构建（可选） | Node.js + npm | 18+ |

### 3.2 Docker Compose 一键部署（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/good-mo/warm-sun-companion.git
cd warm-sun-companion

# 2. 配置 SDK 凭证（必做）：复制模板并填入真实 appId/appSecret
cp frontend/src/config.local.example.js frontend/src/config.local.js
#    编辑 frontend/src/config.local.js，填入魔珐星云应用凭证

# 3. 一键构建并启动
docker compose up -d --build

# 4. 验证
curl -s http://localhost:8000/api/health
# {"status":"ok","service":"warm-sun-companion","version":"1.0.0",...}
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/
# 200

# 5. 访问
# 前端：http://localhost:5173
# 后端：http://localhost:8000/api/health
```

服务组成：

| 容器 | 镜像 | 端口 | 说明 |
| --- | --- | --- | --- |
| `warm-sun-frontend` | `nginx:1.27-alpine` | 5173→80 | 静态托管 + SPA 回退 + `/api` 反向代理 + 缓存 |
| `warm-sun-backend` | `python:3.11-slim` | 8000 | FastAPI 记忆存储（数据卷 `warm-sun-data` 持久化） |

### 3.3 手动部署（无 Docker 环境）

```bash
# 后端
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &

# 前端（零构建，直接静态服务器）
cd ../frontend
python3 -m http.server 5173 &
# 访问 http://localhost:5173
```

或使用一键脚本：

```bash
chmod +x start.sh && ./start.sh
```

### 3.4 配置说明（脱敏）

所有配置项均可在 `frontend/src/config.js` 查看，本地覆盖文件为 `frontend/src/config.local.js`（已 gitignore）：

| 配置项 | 说明 | 示例（脱敏） |
| --- | --- | --- |
| `MOFA_CONFIG.appId` | 魔珐星云应用 ID | `your-app-id` |
| `MOFA_CONFIG.appSecret` | 应用密钥 | `your-app-secret` |
| `reconnect.maxRetries` | 断线重连次数 | `5` |
| `audio.volume` | 默认音量 | `1.0` |
| `features.anti_interference` | 抗干扰（每轮重制上下文） | `{enabled: true}` |
| `features.speech_frontend` | 前端语音识别（可旁路 ASR） | `{enabled: false}` |

### 3.5 评审方验证清单

```bash
# ① 服务健康
curl -s http://localhost:8000/api/health | jq .status          # "ok"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/ # 200

# ② 记忆接口存取
curl -s -X POST http://localhost:8000/api/memory \
  -H "Content-Type: application/json" \
  -d '{"text":"喜欢喝绿茶"}'                                    # {"status":"ok","count":1}
curl -s http://localhost:8000/api/memory | jq .count            # 1

# ③ 前端自测（需 Node 18+）
cd frontend && npm install && npm test                          # 4 个用例通过
```

---

## 4. 演示视频指南

完整 3~5 分钟端到端录屏分镜脚本见 [`scripts/DEMO_SCRIPT.md`](scripts/DEMO_SCRIPT.md)，覆盖：

1. **启动与部署**（0:00~0:40）：Docker Compose 启动 → 健康检查 → 打开页面；
2. **对话/驱动发起**（0:40~1:40）：文本对话「今天陪我聊聊天」→ 数字人回复、状态灯变化；
3. **能力调用**（1:40~2:40）：表达喜好「记住了，我喜欢喝绿茶」→ 记忆面板自动分类新增；
4. **结果呈现**（2:40~4:00）：主动关怀问候、关怀模式切换（大字体/大按钮，无遮挡）、记忆面板分组展示；
5. **收尾**（4:00~4:30）：总结创新点与价值。

---

## 5. 测试与 CI

- **单元测试**：`frontend/tests/chat.test.js` 4 个用例（ChatPanel 消息渲染、HTML 转义、防抖），`npm test` 运行；
- **CI**（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）：
  - `frontend` job：Node 20 → `npm install` → `npm test` → `npm run build`；
  - `backend` job：Python 3.11 → `pip install` → `py_compile main.py`；
  - 触发：push / PR 到 `main`。

---

## 附录：项目目录结构

```text
warm-sun-companion/
├── frontend/
│   ├── index.html                # 页面骨架（关怀开关/聊天/记忆面板）
│   ├── package.json              # 依赖与脚本（license: MIT, vitest）
│   ├── vite.config.js            # 开发代理(/api → :8000)
│   ├── vitest.config.js          # 测试配置
│   ├── src/
│   │   ├── main.js               # 入口：SDK 初始化、事件绑定、指令执行
│   │   ├── config.js             # 配置（凭证占位，可被 local 覆盖）
│   │   ├── components/           # AvatarView / ChatPanel / MemoryPanel / VoiceInput
│   │   ├── core/                 # mofa-sdk / care / memory / actions / care-mode / api
│   │   ├── styles/main.css       # 全局样式 + 关怀模式适老化主题
│   │   ├── types/ utils/         # SDK 类型 / 工具函数
│   │   └── vendor/xmov-avatar/   # 魔珐星云 SDK（单文件 UMD，window.XingyunAvatarAgent）
│   └── tests/chat.test.js
├── backend/
│   ├── main.py                   # FastAPI：/api/health、/api/memory 存取
│   └── requirements.txt
├── deploy/nginx.conf              # SPA 回退 / API 代理 / 缓存
├── Dockerfile.frontend            # Nginx 托管静态资源
├── Dockerfile.backend             # Python 3.11 + uvicorn
├── docker-compose.yml             # 一键部署编排
├── start.sh                       # 本地一键启动脚本
├── docs/ 或 scripts/DEMO_SCRIPT.md# 演示录屏分镜
├── CONTRIBUTING.md                # 贡献指南
├── THIRD_PARTY_NOTICES.md         # 第三方依赖合规
├── .github/workflows/ci.yml       # CI：前端测试+构建 / 后端语法检查
├── .github/ISSUE_TEMPLATE/        # Bug / 功能需求模板
├── .github/PULL_REQUEST_TEMPLATE.md
└── LICENSE                        # MIT
```
