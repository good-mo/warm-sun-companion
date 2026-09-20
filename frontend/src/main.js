/**
 * 暖阳陪伴 - 前端主入口
 * 负责初始化数字人、绑定 UI 事件、管理对话与记忆
 *
 * 能力：
 * - 大模型理解与推理：通过上下文注入增强多轮对话
 * - 记忆与个性化：长期记忆抽取、最近对话上下文、后端持久化
 * - 具身智能协同：聆听/思考/说话/情绪/打断状态与对话有机结合
 * - 行动能力延伸：识别 LLM 动作标记并执行（待办/提醒/用药/紧急联系等）
 * - 关怀场景引擎：时间/节日/心情/生日/偏好的主动关怀（有温度的陪伴）
 * - 适老化关怀模式：大字体/高对比度/语音优先/无障碍（一键切换）
 * - 界面优化：品牌标识、开发者模式、打字动画、记忆分类、无障碍
 */
import { MofaCompanion } from './core/mofa-sdk.js';
import { ChatPanel } from './components/ChatPanel.js';
import { MemoryPanel } from './components/MemoryPanel.js';
import { AvatarView } from './components/AvatarView.js';
import {
  loadMemories,
  addMemory as saveLongMemory,
  extractMemories,
  addConversation,
  loadConversation,
  buildContextPrompt,
  clearConversation,
  clearMemories,
} from './core/memory.js';
import { executeActions, stripActions } from './core/actions.js';
import { fetchMemories, postMemory } from './core/api.js';
import { detectEmotion, getTimeScene, getFestival, buildMemoryCare, shouldProactiveCare } from './core/care.js';
import { initCareMode, toggleCareMode, isCareMode, syncCareModeUI } from './core/care-mode.js';

// 全局状态
const state = {
  companion: null,
  chat: null,
  memory: null,
  avatar: null,
  isListening: false,
  isAsking: false,
  lastEmotion: null,
  proactiveShown: false,
};

// 情绪 → 具身展示映射（联动 AvatarView 状态条）
const EMOTION_UI = {
  happy: { label: '开心', emoji: '😊' },
  sad: { label: '难过', emoji: '😢' },
  tired: { label: '疲惫', emoji: '😪' },
  anxious: { label: '焦虑', emoji: '😰' },
  lonely: { label: '孤独', emoji: '🥺' },
  angry: { label: '生气', emoji: '😠' },
};

// 情绪 → 数字人具身动作联动（若 SDK 支持对应动作）
const EMOTION_ACTION = {
  happy: 'smile',
  sad: 'comfort',
  tired: 'yawn',
  anxious: 'soothe',
  lonely: 'hug',
  angry: 'calm',
};

function getEl(id) {
  return document.getElementById(id);
}

/**
 * 处理用户情绪：识别 → 具身可视化 → 共情插话 → 注入提示词
 * @param {string} text
 * @returns {string} 注入到提示词的情绪提示语句
 */
function handleEmotion(text) {
  const emotion = detectEmotion(text);
  if (!emotion) return '';
  state.lastEmotion = emotion.emotion;

  // 具身协同：在状态条展示情绪（大图标 + 文案）
  if (state.avatar) {
    state.avatar.showEmotion({
      emotion: emotion.emotion,
      label: emotion.label,
      emoji: emotion.emoji,
    });
  }

  // 插入一条共情的系统提示（真实落地的「接住情绪」）
  if (state.chat) {
    state.chat.addSystem(emotion.emoji + ' 暖阳感受到你的' + emotion.label + '心情');
  }

  // 注入提示词：让 LLM 的回复带上共情
  return (
    '[情绪识别] 用户当前情绪可能是「' + emotion.label + '」。' +
    '请先共情安抚（例如：' + emotion.care + '），再自然地继续对话。'
  );
}

/**
 * 主动关怀：页面加载后，根据时间/节日/记忆生成一段暖阳的主动问候
 * 每次会话只主动发起一次（避免打扰）
 */
function maybeProactiveCare() {
  if (state.proactiveShown) return;
  state.proactiveShown = true;

  const memories = loadMemories();
  const greetings = [];

  const festival = getFestival();
  if (festival) {
    greetings.push(festival.greeting);
  }
  const timeScene = getTimeScene();
  if (timeScene && timeScene.key === 'morning') {
    greetings.push(timeScene.greeting);
  }
  const memoryCare = buildMemoryCare(memories);
  if (memoryCare) {
    greetings.push('我记得" ' + memoryCare.greeting + ' "');
  }

  if (greetings.length > 0) {
    const greeting = greetings.join(' ');
    // 延迟 1.2s，等界面稳定后显示，并尝试让数字人开口说话
    setTimeout(() => {
      if (state.chat) {
        state.chat.addSystem('☀️ ' + greeting);
      }
      if (state.companion && state.companion.getAgentState && state.companion.getAgentState() === 'running') {
        try {
          state.companion.speak(greeting);
        } catch (e) {
          // 若 SDK 不支持直接 speak，仅展示文本（优雅降级）
        }
      }
    }, 1200);
  }
}

async function bootstrap() {
  // 初始化关怀模式（读取 localStorage 并应用 class/无障碍属性 + switch UI）
  initCareMode();

  // 初始化记忆面板切换按钮状态（面板默认展开，按钮显示「收起」）
  const memToggleInit = getEl('btn-toggle-memory');
  if (memToggleInit) {
    memToggleInit.textContent = '✕ 收起';
    memToggleInit.setAttribute('aria-expanded', 'true');
  }

  const chat = new ChatPanel(getEl('chat-messages'));
  const memory = new MemoryPanel(getEl('memory-list'));
  // AvatarView 内部管理具身状态条（聆听/思考/说话 + 情绪 + 关键动作）
  const avatar = new AvatarView(getEl('avatar-container'));

  state.chat = chat;
  state.memory = memory;
  state.avatar = avatar;

  // 加载记忆（优先后端持久化，失败则回退本地）
  let memories = loadMemories();
  memory.render(memories);
  fetchMemories().then((serverMemories) => {
    if (serverMemories && serverMemories.length > 0) {
      memories = serverMemories;
      memory.render(memories);
    }
  });

  // 初始化数字人
  const companion = new MofaCompanion('avatar-container', {
    onReady: () => {
      setStatus('在线', 'online');
      chat.addSystem('暖阳已上线，很高兴见到你！');
      // 主动关怀：上线后根据时间/节日/记忆问候
      maybeProactiveCare();
    },
    onAgentStateChange: (s) => {
      setStatus(mapAgentState(s), mapStateClass(s));
      if (s === 'reconnecting') {
        chat.addSystem('网络波动，正在重连...');
      } else if (s === 'running') {
        chat.addSystem('连接已恢复');
      }
    },
    onSocketStateChange: (s) => {
      if (s === 'error') {
        setStatus('连接异常', 'error');
      }
    },
    onASRStateChange: (s) => {
      // 具身协同：聆听（Listen）
      if (s === 'listening') {
        setStatus('聆听中...', 'listening');
        avatar.showState('聆听中');
      } else if (s === 'failed') {
        setStatus('识别失败', 'error');
        avatar.clearState();
        chat.addSystem('语音识别失败，请检查麦克风权限');
      } else if (s === 'idle' || s === 'stopping') {
        avatar.clearState();
      }
    },
    onASRResult: (result) => {
      if (result.isFinal) {
        chat.addUser(result.text);
        // 记录用户对话
        addConversation('user', result.text);
        // 自动抽取并记忆用户偏好
        const facts = extractMemories(result.text);
        facts.forEach((f) => saveLongMemory(f));
        if (facts.length > 0) {
          memory.render(loadMemories());
        }
        // 情绪识别与具身可视化
        const emotionHint = handleEmotion(result.text);
        // 具身协同：思考（Think）+ 打字动画
        avatar.showState('思考中');
        chat.addTyping();
        setStatus('思考中...', 'thinking');
        // 注入记忆 + 情绪 + 上下文后发送
        const base = buildContextPrompt(result.text);
        const prompt = emotionHint ? base + '\n\n' + emotionHint : base;
        companion.ask(prompt).catch(handleError);
      }
    },
    onLLMResponse: (response) => {
      // 具身协同：说话（Speak）
      if (response.event === 'chunk' && response.text) {
        chat.removeTyping();
        chat.appendAssistant(response.text);
      } else if (response.event === 'done') {
        chat.removeTyping();
        // 动作执行：识别 [ACTION:xxx] 标记并执行（含适老化动作：用药/紧急联系等）
        const text = chat.getLastAssistantText();
        executeActions(text).then((results) => {
          results.forEach((r) => {
            chat.addSystem('✅ ' + r.result);
          });
        });
        // 记录暖阳回复（去掉动作标记后的纯文本）
        const cleaned = stripActions(text);
        chat.replaceLastAssistant(cleaned);
        addConversation('assistant', cleaned);
        // 记录到长期记忆
        saveLongMemory(cleaned);
        memory.render(loadMemories());
        state.isAsking = false;
        avatar.clearState();
        // 回复完成后重置情绪展示
        setTimeout(() => {
          avatar.showEmotion('');
        }, 3000);
        setStatus('在线', 'online');
      }
    },
    onConversationChange: (event) => {
      if (event.state === 'speaking') {
        setStatus('说话中...', 'speaking');
        avatar.showState('说话中');
      } else if (event.state === 'asking') {
        setStatus('思考中...', 'thinking');
        avatar.showState('思考中');
      } else if (event.state === 'interrupted') {
        setStatus('已打断', 'online');
        avatar.clearState();
        chat.removeTyping();
      } else if (event.state === 'completed') {
        setStatus('在线', 'online');
      } else if (event.state === 'failed') {
        setStatus('对话失败', 'error');
        avatar.clearState();
        chat.removeTyping();
      }
    },
    onSpeakStateChange: (event) => {
      // 具身协同：说话状态
      if (event.state === 'start') {
        avatar.showState('说话中');
      } else if (event.state === 'end') {
        avatar.clearState();
      }
    },
    onSemanticJudgeResult: (result) => {
      // 具身协同：语义判断（抗干扰）
      if (result && !result.meaningful) {
        chat.addSystem('（未识别到有效指令，已忽略）');
      }
    },
    onRenderChange: (s) => {
      if (s === 'rendering') {
        avatar.setLoading(false);
        setStatus('渲染中', 'online');
      }
    },
    onNetworkInfo: (info) => {
      if (info && info.networkStatus === false) {
        setStatus('网络断开', 'error');
        chat.addSystem('网络已断开，正在尝试恢复...');
      } else if (info && info.downlink < 0.5) {
        setStatus('弱网', 'warning');
      }
    },
    onDownloadProgress: (progress) => {
      setStatus('加载资源 ' + progress.toFixed(0) + '%', 'loading');
    },
    onRetry: ({ attempt }) => {
      chat.addSystem('网络波动，正在重试（第 ' + attempt + ' 次）...');
    },
    onError: (error) => {
      handleError(error);
    },
  });

  state.companion = companion;

  try {
    await companion.init();
  } catch (e) {
    setStatus('初始化失败', 'error');
    chat.addSystem('数字人初始化失败：' + ((e && e.message) || e));
  }

  bindEvents();
}

function bindEvents() {
  const textInput = getEl('text-input');
  const btnSend = getEl('btn-send');
  const btnVoice = getEl('btn-voice');
  const btnIdle = getEl('btn-idle');
  const btnListen = getEl('btn-listen');
  const btnThink = getEl('btn-think');
  const btnInterrupt = getEl('btn-interrupt');
  const btnDebug = getEl('btn-debug');
  const btnToggleMemory = getEl('btn-toggle-memory');
  const btnCloseMemory = getEl('btn-close-memory');
  const btnCareMode = getEl('btn-care-mode');

  btnSend.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (!text) return;
    sendText(text);
    textInput.value = '';
  });

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = textInput.value.trim();
      if (!text) return;
      sendText(text);
      textInput.value = '';
    }
  });

  btnVoice.addEventListener('click', async () => {
    if (!state.companion) return;
    if (state.isListening) {
      await state.companion.stopASR();
      state.isListening = false;
      btnVoice.classList.remove('active');
    } else {
      try {
        await state.companion.startASR();
        state.isListening = true;
        btnVoice.classList.add('active');
        if (state.avatar) state.avatar.showState('聆听中');
      } catch (e) {
        handleError(e);
      }
    }
  });

  // 开发者模式：切换调试控件显示/隐藏
  if (btnDebug) {
    btnDebug.addEventListener('click', () => {
      const controls = getEl('avatar-controls');
      if (!controls) return;
      const willShow = controls.hidden;
      controls.hidden = !willShow;
      btnDebug.classList.toggle('active', willShow);
      if (willShow && state.chat) {
        state.chat.addSystem('开发者模式已开启（显示调试控件）');
      }
    });
  }

  // 待机：停止当前对话/说话，回到待命状态
  btnIdle.addEventListener('click', () => {
    if (!state.companion) return;
    if (state.companion.getAgentState() === 'running') {
      try {
        state.companion.idle();
      } catch (e) {
        // 若 SDK 不支持 idle()，仅做 UI 状态同步
      }
    }
    state.isAsking = false;
    state.isListening = false;
    btnVoice.classList.remove('active');
    if (state.avatar) state.avatar.clearState();
    if (state.chat) state.chat.removeTyping();
    setStatus('待机', 'online');
    state.chat.addSystem('暖阳进入待机状态');
  });

  // 聆听：进入聆听状态（若 SDK 支持则驱动，否则 UI 同步）
  btnListen.addEventListener('click', () => {
    if (!state.companion) return;
    state.isAsking = false;
    try {
      state.companion.listen();
    } catch (e) {
      // ignore
    }
    if (state.avatar) state.avatar.showState('聆听中');
    setStatus('聆听中...', 'listening');
    state.chat.addSystem('暖阳正在聆听...');
  });

  // 思考：进入思考状态（若 SDK 支持则驱动，否则 UI 同步）
  btnThink.addEventListener('click', () => {
    if (!state.companion) return;
    state.isAsking = false;
    try {
      state.companion.think();
    } catch (e) {
      // ignore
    }
    if (state.avatar) state.avatar.showState('思考中');
    state.chat.addTyping();
    setStatus('思考中...', 'thinking');
    state.chat.addSystem('暖阳正在思考...');
  });
  // 打断：中断当前对话/说话
  btnInterrupt.addEventListener('click', () => {
    if (!state.companion) return;
    try {
      state.companion.interrupt();
    } catch (e) {
      // ignore
    }
    state.isAsking = false;
    if (state.avatar) state.avatar.clearState();
    if (state.chat) state.chat.removeTyping();
    setStatus('已打断', 'online');
    state.chat.addSystem('已打断当前对话');
  });

  // 关怀模式切换：适老化大字体/高对比度一键切换（switch UI 由 care-mode.js 同步）
  btnCareMode.addEventListener('click', () => {
    const enabled = toggleCareMode();
    syncCareModeUI(enabled);
    state.chat.addSystem(enabled ? '已开启关怀模式（大字体·高对比度·语音优先）' : '已切换为标准模式');
  });

  // 记忆面板折叠：对话面板头部按钮 + 关闭按钮都可用
  const toggleMemoryPanel = () => {
    const panel = getEl('memory-panel');
    if (!panel) return;
    const collapsed = panel.classList.toggle('collapsed');
    btnToggleMemory.textContent = collapsed ? '📖 记忆' : '✕';
    btnToggleMemory.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  };
  btnToggleMemory.addEventListener('click', toggleMemoryPanel);
  if (btnCloseMemory) {
    btnCloseMemory.addEventListener('click', toggleMemoryPanel);
  }

  // 键盘无障碍：支持用快捷键切换关怀模式（Alt+C）
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      btnCareMode.click();
    }
  });
}

function sendText(text) {
  if (!state.companion) return;
  if (state.isAsking) {
    state.chat.addSystem('请稍等，暖阳正在回复中...');
    return;
  }
  state.isAsking = true;
  state.chat.addUser(text);
  // 记录用户对话
  addConversation('user', text);
  // 抽取记忆
  const facts = extractMemories(text);
  facts.forEach((f) => saveLongMemory(f));
  if (facts.length > 0) {
    state.memory.render(loadMemories());
  }
  // 情绪识别与具身可视化
  const emotionHint = handleEmotion(text);
  // 具身协同：思考 + 打字动画（加载反馈）
  if (state.avatar) state.avatar.showState('思考中');
  if (state.chat) state.chat.addTyping();
  setStatus('思考中...', 'thinking');
  // 注入记忆 + 情绪 + 上下文
  const base = buildContextPrompt(text);
  const prompt = emotionHint ? base + '\n\n' + emotionHint : base;
  state.companion.ask(prompt).catch(handleError);
}

function addMemory(text) {
  saveLongMemory(text);
  state.memory.render(loadMemories());
  // 同步到后端持久化（失败静默降级）
  postMemory(text);
}

function setStatus(text, cls) {
  const dot = getEl('status-dot');
  const label = getEl('status-text');
  if (!label) return;
  label.textContent = text;
  dot.className = 'status-dot ' + (cls || '');
}

function mapAgentState(s) {
  const map = {
    idle: '待机',
    initializing: '初始化中',
    ready: '就绪',
    running: '运行中',
    reconnecting: '重连中',
    stopped: '已停止',
    destroyed: '已销毁',
    failed: '异常',
  };
  return map[s] || s;
}

function mapStateClass(s) {
  if (s === 'ready' || s === 'running') return 'online';
  if (s === 'reconnecting') return 'warning';
  if (s === 'failed') return 'error';
  return '';
}

function handleError(error) {
  console.error('[暖阳陪伴]', error);
  if (!state.chat) return;
  const domain = error && error.domain;
  let msg = ((error && error.message) || error);
  // 根据错误域给出更友好的提示
  if (domain === 'permission') {
    msg = '麦克风权限被拒绝，请在浏览器设置中允许访问麦克风';
  } else if (domain === 'network') {
    msg = '网络连接异常，请检查网络后重试';
  } else if (domain === 'quota') {
    msg = '服务配额已用尽，请联系管理员';
  } else if (domain === 'asr') {
    msg = '语音识别服务异常';
  } else if (domain === 'brain') {
    msg = '大模型服务异常';
  } else if (domain === 'ttsa') {
    msg = '语音合成服务异常';
  }
  state.chat.addSystem('出错了：' + msg);
}

// 启动
bootstrap();
