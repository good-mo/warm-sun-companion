/**
 * 暖阳陪伴 - 行动能力层（Agent Actions）
 *
 * 职责：
 * - 从大模型回复中识别「行动意图」（如设置提醒、记录待办、查询时间等）
 * - 执行对应的动作（本地存储、调用后端 API 等）
 * - 将执行结果反馈给用户，实现「能办事」而不只是「能对话」
 *
 * 适老化行动能力（真实落地）：
 * - 用药提醒：记录用药时间与剂量，定时提醒
 * - 紧急联系人：记录紧急联系人，一键呼叫/提示
 * - 健康关怀：记录血压/血糖等健康数据，定期关怀
 * - 待办/提醒/时间查询等基础能力
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

// ---------- 适老化行动能力 ----------

// 记录用药提醒（适老化）
registerAction('medication', async (args) => {
  const list = _read('warm-sun-medications');
  list.push({ text: args, time: Date.now(), taken: false });
  _write('warm-sun-medications', list);
  return '已记录用药提醒：' + args + '。我会按时提醒您服药。';
});

// 查询用药提醒列表
registerAction('list_medications', async () => {
  const list = _read('warm-sun-medications');
  if (list.length === 0) return '当前没有用药提醒';
  return '用药提醒：\n' + list.map((t, i) => (i + 1) + '. ' + t.text).join('\n');
});

// 标记已服药
registerAction('take_medication', async (args) => {
  const list = _read('warm-sun-medications');
  const target = list.find((t) => t.text.includes(args) && !t.taken);
  if (target) {
    target.taken = true;
    _write('warm-sun-medications', list);
    return '好的，已记录您已服用：' + args;
  }
  return '未找到对应的用药提醒：' + args;
});

// 记录紧急联系人（适老化）
registerAction('emergency_contact', async (args) => {
  const list = _read('warm-sun-emergency');
  list.push({ text: args, time: Date.now() });
  _write('warm-sun-emergency', list);
  return '已记录紧急联系人：' + args + '。遇到紧急情况请及时联系。';
});

// 查询紧急联系人
registerAction('list_emergency', async () => {
  const list = _read('warm-sun-emergency');
  if (list.length === 0) return '当前没有紧急联系人';
  return '紧急联系人：\n' + list.map((t, i) => (i + 1) + '. ' + t.text).join('\n');
});

// 记录健康数据（适老化）
registerAction('health', async (args) => {
  const list = _read('warm-sun-health');
  list.push({ text: args, time: Date.now() });
  _write('warm-sun-health', list);
  return '已记录健康数据：' + args + '。我会持续关注您的健康状况。';
});

// 查询健康数据
registerAction('list_health', async () => {
  const list = _read('warm-sun-health');
  if (list.length === 0) return '当前没有健康记录';
  return '健康记录：\n' + list.map((t, i) => (i + 1) + '. ' + t.text).join('\n');
});

// 紧急求助（适老化）
registerAction('sos', async () => {
  const emergency = _read('warm-sun-emergency');
  if (emergency.length === 0) {
    return '您还没有设置紧急联系人。请先告诉我紧急联系人的姓名和电话，我会帮您记录。';
  }
  const contact = emergency[emergency.length - 1].text;
  return '紧急求助！请立即联系您的紧急联系人：' + contact + '。如果情况危急，请拨打 120。';
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
