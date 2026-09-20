/**
 * 暖阳陪伴 - 后端 API 客户端
 * 与 FastAPI 后端通信，实现记忆的服务器端持久化
 * 后端地址可通过 VITE_API_BASE 或运行时 window.__API_BASE__ 覆盖
 */

// 后端基础地址（默认同源 /api，Docker 下由 nginx 反代到 backend:8000）
function getBase() {
  if (typeof window !== 'undefined' && window.__API_BASE__) {
    return window.__API_BASE__;
  }
  return '/api';
}

const BASE = getBase();

/**
 * 通用请求封装
 */
async function request(path, options = {}) {
  const url = BASE + path;
  const opts = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };
  const res = await fetch(url, opts);
  if (!res.ok) {
    throw new Error('请求失败：' + res.status);
  }
  return res.json();
}

/**
 * 获取全部记忆
 */
export async function fetchMemories() {
  try {
    const data = await request('/memory');
    return data.items || [];
  } catch (e) {
    // 后端不可用时静默降级（使用本地存储）
    return null;
  }
}

/**
 * 新增一条记忆
 */
export async function postMemory(text) {
  try {
    return await request('/memory', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    return null;
  }
}

/**
 * 清空记忆
 */
export async function clearMemory() {
  try {
    return await request('/memory', { method: 'DELETE' });
  } catch (e) {
    return null;
  }
}

export default {
  fetchMemories,
  postMemory,
  clearMemory,
};
