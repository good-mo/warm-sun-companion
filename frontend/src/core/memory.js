/**
 * 暖阳陪伴 - 记忆与上下文管理模块
 *
 * 职责：
 * - 维护多轮对话历史（localStorage 持久化）
 * - 维护用户长期记忆（重要事实、偏好）
 * - 构建上下文注入提示词，增强大模型的多轮理解与个性化
 * - 从用户输入中抽取重要事实作为长期记忆
 *
 * 说明：魔珐星云 SDK 的 ask(text) 仅接受纯文本，多轮上下文需由业务侧
 * 在发送前注入到文本中，因此本模块负责把「记忆 + 最近对话」拼进提示词。
 */

// 存储键
const CONVERSATION_KEY = 'warm-sun-conversation';
const MEMORY_KEY = 'warm-sun-memory';

// 最近对话保留条数（避免提示词过长）
const MAX_CONVERSATION = 12;
// 长期记忆最多保留条数
const MAX_MEMORY = 20;

/**
 * 安全读取 localStorage JSON
 */
function _read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * 安全写入 localStorage JSON
 */
function _write(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    // 存储失败（如隐私模式）时静默忽略
  }
}

// ---------- 对话历史 ----------

export function loadConversation() {
  return _read(CONVERSATION_KEY);
}

export function saveConversation(list) {
  _write(CONVERSATION_KEY, list);
}

/**
 * 追加一条对话记录，并裁剪到最大长度
 * @param {string} role 'user' | 'assistant'
 * @param {string} text
 */
export function addConversation(role, text) {
  if (!text) return;
  const list = loadConversation();
  list.push({ role, text, time: Date.now() });
  if (list.length > MAX_CONVERSATION) {
    list.splice(0, list.length - MAX_CONVERSATION);
  }
  saveConversation(list);
}

export function clearConversation() {
  saveConversation([]);
}

// ---------- 长期记忆 ----------

export function loadMemories() {
  return _read(MEMORY_KEY);
}

export function saveMemories(list) {
  _write(MEMORY_KEY, list);
}

/**
 * 新增一条长期记忆（去重、裁剪）
 * @param {string} text
 */
export function addMemory(text) {
  if (!text) return;
  const list = loadMemories();
  // 去重：相同文本不重复添加
  const exists = list.some((m) => m.text === text);
  if (exists) return;
  list.push({ text, time: Date.now() });
  if (list.length > MAX_MEMORY) {
    list.splice(0, list.length - MAX_MEMORY);
  }
  saveMemories(list);
}

export function clearMemories() {
  saveMemories([]);
}

// ---------- 事实抽取（个性化） ----------

/**
 * 从用户输入中抽取重要事实，作为长期记忆
 * 支持：姓名、年龄、喜好、地点、职业、生日等常见模式
 * @param {string} text
 * @returns {string[]} 抽取到的事实列表
 */
export function extractMemories(text) {
  if (!text) return [];
  const facts = [];
  const patterns = [
    // 我叫/我是/我的名字是 X
    { re: /(?:我叫|我是|我的名字是|我的名字叫)\s*([\u4e00-\u9fa5A-Za-z]{1,10})/, tpl: '用户的名字是 $1' },
    // 我喜欢/我爱 X
    { re: /(?:我喜欢|我爱|我最喜欢)\s*([^，。！？]{1,20})/, tpl: '用户喜欢 $1' },
    // 我住在/我在 X
    { re: /(?:我住在|我住在|我在|我来自)\s*([^，。！？]{1,20})/, tpl: '用户来自/住在 $1' },
    // 我是 X（职业/身份）
    { re: /(?:我是|我是一名|我是一位)\s*([\u4e00-\u9fa5A-Za-z]{1,10}(?:师|生|员|工|生|人))/, tpl: '用户是 $1' },
    // 我的生日是 X
    { re: /(?:我的生日是|我生日是|我生日在)\s*([^，。！？]{1,20})/, tpl: '用户的生日是 $1' },
    // 我今年 X 岁
    { re: /(?:我今年|我)\s*(\d{1,3})\s*岁/, tpl: '用户今年 $1 岁' },
  ];

  patterns.forEach((p) => {
    const m = text.match(p.re);
    if (m && m[1]) {
      const fact = p.tpl.replace('$1', m[1]);
      if (facts.indexOf(fact) === -1) {
        facts.push(fact);
      }
    }
  });

  return facts;
}

// ---------- 上下文提示词构建 ----------

/**
 * 构建注入到 ask() 文本中的上下文提示词
 * 将长期记忆 + 最近对话 + 用户当前输入拼装，增强多轮理解与个性化
 * @param {string} userText 用户当前输入
 * @returns {string} 注入后的完整文本
 */
export function buildContextPrompt(userText) {
  const memories = loadMemories();
  const conversation = loadConversation();

  const parts = [];

  // 系统人设
  parts.push(
    '[系统] 你是"暖阳"，一位温暖、贴心、有记忆的AI陪伴数字人。' +
      '请用温暖、自然、口语化的语气与用户交流，适当关心用户，' +
      '并基于下面的记忆与对话上下文进行连贯的回应。'
  );

  // 长期记忆
  if (memories.length > 0) {
    const memLines = memories
      .slice(-8)
      .map((m) => '- ' + m.text)
      .join('\n');
    parts.push('[关于用户的记忆]\n' + memLines);
  }

  // 最近对话
  if (conversation.length > 0) {
    const convLines = conversation
      .slice(-8)
      .map((c) => (c.role === 'user' ? '用户: ' : '暖阳: ') + c.text)
      .join('\n');
    parts.push('[最近的对话]\n' + convLines);
  }

  // 用户当前输入
  parts.push('[用户当前输入]\n' + userText);

  return parts.join('\n\n');
}

export default {
  loadConversation,
  saveConversation,
  addConversation,
  clearConversation,
  loadMemories,
  saveMemories,
  addMemory,
  clearMemories,
  extractMemories,
  buildContextPrompt,
};
