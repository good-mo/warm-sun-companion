/**
 * 暖阳陪伴 - 适老化关怀模式（Elderly Care Mode）
 *
 * 职责：把「适老化普惠」从纸面论证落地为真实可运行的代码。
 * 通过一键切换「关怀模式」，为老年用户提供：
 * - 大字体 / 高对比度 / 大按钮（视觉适老化）
 * - 语音优先交互（听觉适老化）
 * - 简化界面（认知适老化）
 * - 无障碍支持（ARIA / 屏幕阅读器）
 *
 * 该模块通过给 <body> 添加 class 来切换 CSS 主题，并管理无障碍属性。
 */

// 存储键
const CARE_MODE_KEY = 'warm-sun-care-mode';

/**
 * 读取关怀模式是否开启
 * @returns {boolean}
 */
export function isCareMode() {
  try {
    return localStorage.getItem(CARE_MODE_KEY) === '1';
  } catch (e) {
    return false;
  }
}

/**
 * 设置关怀模式
 * @param {boolean} enabled
 */
export function setCareMode(enabled) {
  try {
    localStorage.setItem(CARE_MODE_KEY, enabled ? '1' : '0');
  } catch (e) {
    // 忽略存储失败
  }
  applyCareMode(enabled);
}

/**
 * 切换关怀模式，返回切换后的状态
 * @returns {boolean}
 */
export function toggleCareMode() {
  const next = !isCareMode();
  setCareMode(next);
  return next;
}

/**
 * 应用关怀模式到 DOM（添加/移除 class 与无障碍属性）
 * @param {boolean} enabled
 */
export function applyCareMode(enabled) {
  const body = document.body;
  if (!body) return;
  body.classList.toggle('care-mode', enabled);
  body.setAttribute('data-care-mode', enabled ? 'on' : 'off');

  // 无障碍：更新页面标题提示
  const title = document.querySelector('title');
  if (title) {
    title.textContent = enabled ? '暖阳陪伴 · 关怀模式' : '暖阳陪伴 · 数字人';
  }

  // 无障碍：为关键控件补充 aria-label（若缺失）
  const ariaMap = {
    'btn-voice': '语音输入',
    'btn-send': '发送',
    'btn-idle': '待机',
    'btn-listen': '聆听',
    'btn-think': '思考',
    'btn-interrupt': '打断',
    'btn-toggle-memory': '切换记忆面板',
  };
  Object.keys(ariaMap).forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', ariaMap[id]);
    }
  });

  // 无障碍：为状态条设置 aria-live，让屏幕阅读器播报状态变化
  const stateBar = document.getElementById('avatar-state-bar');
  if (stateBar) {
    stateBar.setAttribute('aria-live', 'polite');
    stateBar.setAttribute('role', 'status');
  }
  const statusText = document.getElementById('status-text');
  if (statusText) {
    statusText.setAttribute('aria-live', 'polite');
  }
}

/**
 * 初始化关怀模式（页面加载时调用）
 */
export function initCareMode() {
  applyCareMode(isCareMode());
}

export default {
  isCareMode,
  setCareMode,
  toggleCareMode,
  applyCareMode,
  initCareMode,
};
