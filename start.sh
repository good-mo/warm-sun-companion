#!/usr/bin/env bash
# 暖阳陪伴 - 一键启动脚本
# 启动前端静态服务器 + 后端 FastAPI 服务

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "  暖阳陪伴 · Warm Sun Companion"
echo "=========================================="

# 启动后端
echo "[1/2] 启动后端服务 (FastAPI) ..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "      后端 PID: $BACKEND_PID"

# 启动前端（Vite 开发服务器默认端口 5173，本环境无 Node，用 Python 静态服务器替代）
echo "[2/2] 启动前端静态服务器 ..."
cd "$ROOT_DIR/frontend"
python3 -m http.server 5173 &
FRONTEND_PID=$!
echo "      前端 PID: $FRONTEND_PID"

echo ""
echo "前端: http://localhost:5173"
echo "后端: http://localhost:8000/api/health"
echo "按 Ctrl+C 停止所有服务"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
