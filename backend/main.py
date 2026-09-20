# -*- coding: utf-8 -*-
"""
暖阳陪伴 - 后端服务
基于 FastAPI 的轻量级服务：
- 提供健康检查
- 提供陪伴记忆的存取接口（本地 JSON 或 SQLite 存储）
- 后续可扩展用户管理、对话记录、情绪分析等能力
"""
import json
import os
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MEMORY_FILE = DATA_DIR / "memory.json"

app = FastAPI(
    title="暖阳陪伴 API",
    description="基于魔珐星云具身交互智能SDK的AI数字人陪伴服务",
    version="1.0.0",
)

# 允许跨域（开发环境）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- 数据模型 ----------
class MemoryItem(BaseModel):
    text: str
    time: str = None


# ---------- 存储工具 ----------
def _ensure_data_dir():
    DATA_DIR.mkdir(exist_ok=True)


def _read_memory():
    _ensure_data_dir()
    if not MEMORY_FILE.exists():
        return []
    try:
        with MEMORY_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _write_memory(items):
    _ensure_data_dir()
    with MEMORY_FILE.open("w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)


# ---------- 健康检查 ----------
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "warm-sun-companion",
        "version": "1.0.0",
        "time": time.time(),
    }


# ---------- 记忆接口 ----------
@app.get("/api/memory")
def get_memory():
    """获取全部陪伴记忆"""
    return {
        "items": _read_memory(),
        "count": len(_read_memory()),
    }


@app.post("/api/memory")
def add_memory(item: MemoryItem):
    """新增一条陪伴记忆"""
    items = _read_memory()
    if item.time is None:
        item.time = time.strftime("%Y-%m-%d %H:%M:%S")
    items.append({"text": item.text, "time": item.time})
    _write_memory(items)
    return {"status": "ok", "count": len(items)}


@app.delete("/api/memory")
def clear_memory():
    """清空全部陪伴记忆"""
    _write_memory([])
    return {"status": "ok", "count": 0}