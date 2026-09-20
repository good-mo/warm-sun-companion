/**
 * 暖阳陪伴 - 行动能力层（Agent Actions）
 *
 * 职责：
 * - 从大模型回复中识别「行动意图」（如设置提醒、记录待办、查询时间等）
 * - 执行对应的动作（本地存储、调用后端 API 等）
 * - 将执行结果反馈给用户，实现「能办事」而不只是「能对话」
 *
 * 说明：魔珐星云 SDK 未暴露工具调用（tool calling）API，因此本模块采用
 * 「意图识别 + 动作分发」的轻量 Agent 方案：在 LLM 回复完成后，解析回复文本
 * 中的结构化动作标记（如 [ACTION:xxx]），并执行对应动作。
 */

// 动作注册表
const ACTIONS = {};

/**
 * 注册一个动作处理器
 * @param {string} name 动作名
 * @param {Function} handler 处理器，接收参数对象，返回 Promise<结果字符串>
 */
export function registerAction(name, handler) {
  ACTIONS[name] = handler;
}

/**
 * 从 LLM 回复文本中解析动作标记
 * 支持格式：[ACTION:name] 参数 [/ACTION]
 * 或 [ACTION:name]参数[/ACTION]
 * @param {string} text
 * @returns {Array<{name:string, args:string}>}
 */
export function parseActions(text) {
  if (!text) return [];
  const actions = [];
  const re = /\[ACTION:([a-zA-Z0-9_]+)\]([\s\S]*?)\[\/ACTION\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    actions.push({ name: m[1].trim(), args: m[2].trim() });
  }
  return actions;
}

/**
 * 从回复文本中移除动作标记，得到纯展示文本
 * @param {string} text
 * @returns {string}
 */
export function stripActions(text) {
  if (!text) return '';
  return text
    .replace(/\[ACTION:[a-zA-Z0-9_]+\][\s\S]*?\[\/ACTION\]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 执行回复文本中的所有动作
 * @param {string} text LLM 回复文本
 * @returns {Promise<Array<{name:string, result:string}>>}
 */
export async function executeActions(text) {
  const actions = parseActions(text);
  const results = [];
  for (const action of actions) {
    const handler = ACTIONS[action.name];
    if (handler) {
      try {
        const result = await handler(action.args);
        results.push({ name: action.name, result });
      } catch (e) {
        results.push({ name: action.name, result: '执行失败：' + ((e && e.message) || e) });
      }
    } else {
      results.push({ name: action.name, result: '未知动作：' + action.name });
    }
  }
  return results;
}

// ---------- 内置动作 ----------

// 记录待办事项
registerAction('todo', async (args) => {
  const list = _read('warm-sun-todos');
  list.push({ text: args, done: false, time: Date.now() });
  _write('warm-sun-todos', list);
  return '已记录待办：' + args;
});

// 设置提醒
registerAction('remind', async (args) => {
  const list = _read('warm-sun-reminders');
  list.push({ text: args, time: Date.now() });
  _write('warm-sun-reminders', list);
  return '已设置提醒：' + args;
});

// 查询当前时间
registerAction('time', async () => {
  const now = new Date();
  return '现在是 ' + now.toLocaleString('zh-CN');
});

// 查询待办列表
registerAction('list_todos', async () => {
  const list = _read('warm-sun-todos');
  if (list.length === 0) return '当前没有待办事项';
  return '待办事项：\n' + list.map((t, i) => (i + 1) + '. ' + t.text).join('\n');
});

// 查询提醒列表
registerAction('list_reminders', async () => {
  const list = _read('warm-sun-reminders');
  if (list.length === 0) return '当前没有提醒';
  return '提醒事项：\n' + list.map((t, i) => (i + 1) + '. ' + t.text).join('\n');
});

// 清空待办
registerAction('clear_todos', async () => {
  _write('warm-sun-todos', []);
  return '已清空待办事项';
});

// 清空提醒
registerAction('clear_reminders', async () => {
  _write('warm-sun-reminders', []);
  return '已清空提醒事项';
});

// ---------- 存储工具 ----------

function _read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function _write(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    // 忽略存储失败
  }
}

export default {
  registerAction,
  parseActions,
  stripActions,
  executeActions,
};
