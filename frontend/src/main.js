/**
 * 暖阳陪伴 - 前端主入口
 * 负责初始化数字人、绑定 UI 事件、管理对话与记忆
 *
 * 能力：
 * - 大模型理解与推理：通过上下文注入增强多轮对话
 * - 记忆与个性化：长期记忆抽取、最近对话上下文、后端持久化
 * - 具身智能协同：聆听/思考/说话/情绪/打断状态与对话有机结合
 * - 行动能力延伸：识别 LLM 动作标记并执行（待办/提醒等）
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

// 全局状态
const state = {
  companion: null,
  chat: null,
  memory: null,
  avatar: null,
  isListening: false,
  isAsking: false,
};

// 情绪/动作状态面板元素映射
function getEl(id) {
  return document.getElementById(id);
}

async function bootstrap() {
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
        // 具身协同：思考（Think）
        avatar.showState('思考中');
        setStatus('思考中...', 'thinking');
        // 注入记忆与上下文后发送
        const prompt = buildContextPrompt(result.text);
        companion.ask(prompt).catch(handleError);
      }
    },
    onLLMResponse: (response) => {
      // 具身协同：说话（Speak）
      if (response.event === 'chunk' && response.text) {
        chat.appendAssistant(response.text);
      } else if (response.event === 'done') {
        // 动作执行：识别 [ACTION:xxx] 标记并执行
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
      } else if (event.state === 'completed') {
        setStatus('在线', 'online');
      } else if (event.state === 'failed') {
        setStatus('对话失败', 'error');
        avatar.clearState();
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
    onRenderChange: (state) => {
      if (state === 'rendering') {
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
  const btnToggleMemory = getEl('btn-toggle-memory');

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
    setStatus('已打断', 'online');
    state.chat.addSystem('已打断当前对话');
  });

  btnToggleMemory.addEventListener('click', () => {
    const panel = getEl('memory-panel');
    panel.classList.toggle('collapsed');
    btnToggleMemory.textContent = panel.classList.contains('collapsed') ? '展开' : '收起';
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
  // 具身协同：思考
  if (state.avatar) state.avatar.showState('思考中');
  setStatus('思考中...', 'thinking');
  // 注入记忆与上下文
  const prompt = buildContextPrompt(text);
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
