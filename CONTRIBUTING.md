# 贡献指南（Contributing）

感谢你对 **暖阳陪伴（Warm Sun Companion）** 的关注！请遵循以下规范参与协作。

## 分支与提交

- 主分支为 `main`，所有功能 / 修复通过 **Pull Request** 合并。
- 遵循 [Conventional Commits](https://www.conventionalcommits.org/) 提交信息格式：

  ```
  feat(scope): 描述          # 新功能
  fix(scope): 描述           # 缺陷修复
  docs(scope): 描述          # 文档
  style(scope): 描述         # 样式/无逻辑变更
  refactor(scope): 描述      # 重构
  test(scope): 描述          # 测试
  chore(scope): 描述         # 构建/工具/杂项
  ```

  示例：`feat(care): 新增深夜关怀场景`、`fix(avatar): 修复情绪状态未重置`

## 开发流程

1. `fork` 本仓库并在本地新建分支：`git checkout -b feat/your-feature`
2. 安装前端依赖并运行测试：

   ```bash
   cd frontend
   npm install
   npm test          # vitest 单元测试
   npm run build     # 构建验证
   ```

3. 后端改动时运行：

   ```bash
   cd backend
   python -m py_compile main.py
   ```

4. 本地验证通过后提交并推送，发起 Pull Request。
5. PR 需通过 CI 检查（见 `.github/workflows/ci.yml`）并至少 1 人 review。

## 敏感信息保护

- **严禁**提交真实凭证（appId / appSecret / Token）到仓库。
- 凭证统一放在 `frontend/src/config.local.js`（已被 `.gitignore` 忽略）。
- 需要新配置项时，同步更新 `config.local.example.js` 与 README。

## Issue 规范

- 提交 Issue 时请使用仓库中的模板（`bug` / `feature`）。
- 描述尽量包含：环境、复现步骤、期望与实际行为、相关日志。

## 代码风格

- 前端：原生 ES Module，2 空格缩进，组件使用 `export class`。
- 注释使用中文，文档使用中文。
- 尽量保持模块单一职责，新能力优先放入 `src/core/` 或 `src/components/`。
