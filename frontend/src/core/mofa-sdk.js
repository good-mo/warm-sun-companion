/**
 * 魔珐星云具身交互智能 SDK 封装
 * 基于 @xmov/avatar 的 XingyunAvatarAgent（星云智能体）
 *
 * 该封装层统一管理数字人的初始化、语音对话、ASR、打断等能力，
 * 并通过事件回调将 SDK 状态同步给上层 UI。
 *
 * 稳定性与容错能力：
 * - 断网自动重连（reconnect 配置）
 * - 网络状态监控（onNetworkInfo）
 * - 错误分类处理（permission/network/asr/brain/ttsa/quota/sdk）
 * - 客户端打断（enableClientInterrupt）
 * - 自动重试（ask 失败可重试）
 * - 资源下载进度回调
 *
 * 加载策略：
 * 1. 优先使用本地 vendor 的官方单文件版（无需 Node.js/npm，适合静态部署）
 * 2. 若通过 npm 安装，则回退到 ESM 模块 @xmov/avatar/agent
 */
import { resolveConfig } from '../config.js';

// 动态加载 SDK（支持 UMD 与 ESM 两种方式）
let XingyunAvatarAgent = null;

async function loadSDK() {
  if (XingyunAvatarAgent) return XingyunAvatarAgent;

  // 方式一：本地 vendor 官方单文件版（通过 <script> 引入，暴露 window.XingyunAvatarAgent）
  if (window.XingyunAvatarAgent) {
    XingyunAvatarAgent = window.XingyunAvatarAgent;
    return XingyunAvatarAgent;
  }

  // 方式二：npm ESM 模块
  try {
    const mod = await import('@xmov/avatar/agent');
    XingyunAvatarAgent = mod.default || mod.XingyunAvatarAgent;
  } catch (e) {
    // 方式三：UMD 全局变量（兼容旧版）
    if (window.XingyunAvatarAgentModule) {
      XingyunAvatarAgent = window.XingyunAvatarAgentModule;
    } else if (window.XmovAvatar) {
      XingyunAvatarAgent = window.XmovAvatar;
    } else {
      throw new Error(
        '未找到魔珐星云 SDK，请先安装 @xmov/avatar 或引入 vendor/xmov-avatar 下的 UMD 脚本'
      );
    }
  }
  return XingyunAvatarAgent;
}

/**
 * 暖阳陪伴数字人控制器
 * 封装 XingyunAvatarAgent 的完整生命周期
 */
export class MofaCompanion {
  constructor(container, callbacks = {}) {
    // container 可以是 DOM 元素或选择器字符串（官方 SDK 要求 DOM 元素）
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container;
    this.callbacks = callbacks;
    this.agent = null;
    this.agentState = 'idle';
    this.socketState = 'idle';
    this.asrState = 'idle';
    this.conversationState = 'idle';
    this.speakState = 'idle';
    this.semanticJudge = null;
    this.initialized = false;
    this.destroyed = false;
    this.networkInfo = null;
    this.lastError = null;
    this._askRetryCount = 0;
  }

  /**
   * 初始化数字人
   */
  async init() {
    const AgentClass = await loadSDK();
    // 解析最终配置（合并本地凭证 config.local.js）
    const cfg = await resolveConfig();

    this.agent = new AgentClass({
      container: this.container,
      appId: cfg.appId,
      appSecret: cfg.appSecret,
      gatewayServer: cfg.gatewayServer,
      asr_id: cfg.asrId,
      llm_id: cfg.llmId,
      session_speak_req_id: cfg.sessionSpeakReqId,
      hardwareAcceleration: cfg.hardwareAcceleration,
      enableClientInterrupt: cfg.enableClientInterrupt,
      enableDebugger: cfg.enableDebugger,
      enableLogger: cfg.enableLogger,
      reconnect: cfg.reconnect,
      audio: cfg.audio,
      features: cfg.features,
      agentCallbacks: {
        onAgentStateChange: (state) => {
          this.agentState = state;
          this._emit('onAgentStateChange', state);
        },
        onSocketStateChange: (state) => {
          this.socketState = state;
          this._emit('onSocketStateChange', state);
        },
        onASRStateChange: (state) => {
          this.asrState = state;
          this._emit('onASRStateChange', state);
        },
        onASRResult: (result) => {
          this._emit('onASRResult', result);
        },
        onLLMResponse: (response) => {
          this._emit('onLLMResponse', response);
        },
        onConversationChange: (event) => {
          this.conversationState = event.state;
          this._emit('onConversationChange', event);
        },
        onSpeakStateChange: (event) => {
          this.speakState = event.state;
          this._emit('onSpeakStateChange', event);
        },
        onSemanticJudgeResult: (result) => {
          this.semanticJudge = result;
          this._emit('onSemanticJudgeResult', result);
        },
        onRenderChange: (state) => {
          this._emit('onRenderChange', state);
        },
        onNetworkInfo: (info) => {
          this.networkInfo = info;
          this._emit('onNetworkInfo', info);
        },
        onError: (error) => {
          this.lastError = error;
          this._emit('onError', error);
        },
      },
    });

    // 初始化（建立连接，返回后进入 running）
    await this.agent.init({
      onDownloadProgress: (progress) => {
        this._emit('onDownloadProgress', progress);
      },
    });

    this.initialized = true;
    this._emit('onReady');
    return this.agent;
  }

  /**
   * 发送文本提问（触发 LLM 对话）
   * 支持失败自动重试（最多 2 次）
   */
  async ask(text, retry = true) {
    this._assertReady();
    try {
      const result = await this.agent.ask(text);
      this._askRetryCount = 0;
      return result;
    } catch (error) {
      // 网络类错误且未超过重试次数时自动重试
      if (retry && this._isRetryable(error) && this._askRetryCount < 2) {
        this._askRetryCount += 1;
        this._emit('onRetry', { text, attempt: this._askRetryCount, error });
        await this._delay(800 * this._askRetryCount);
        return this.ask(text, false);
      }
      this._askRetryCount = 0;
      throw error;
    }
  }

  /**
   * 直接让数字人说话（SSML 或纯文本）
   */
  speak(ssml) {
    this._assertReady();
    return this.agent.speak(ssml);
  }

  /**
   * 开始语音识别（ASR）
   */
  async startASR() {
    this._assertReady();
    return this.agent.startASR();
  }

  /**
   * 停止语音识别
   */
  async stopASR() {
    this._assertReady();
    return this.agent.stopASR();
  }

  /**
   * 打断当前对话/说话
   */
  interrupt() {
    this._assertReady();
    return this.agent.interrupt();
  }

  /**
   * 让数字人进入待机状态
   * 若 SDK 未暴露 idle()，则通过事件模拟（UI 状态同步）
   */
  idle() {
    this._assertReady();
    if (typeof this.agent.idle === 'function') {
      return this.agent.idle();
    }
    this._emit('onConversationChange', { state: 'idle' });
  }

  /**
   * 让数字人进入聆听状态
   * 若 SDK 未暴露 listen()，则通过事件模拟（UI 状态同步）
   */
  listen() {
    this._assertReady();
    if (typeof this.agent.listen === 'function') {
      this.agent.listen();
    }
    this._emit('onASRStateChange', 'listening');
  }

  /**
   * 让数字人进入思考状态
   * 若 SDK 未暴露 think()，则通过事件模拟（UI 状态同步）
   */
  think() {
    this._assertReady();
    if (typeof this.agent.think === 'function') {
      this.agent.think();
    }
    this._emit('onConversationChange', { state: 'asking' });
  }

  /**
   * 设置音量（0-1）
   */
  setVolume(volume) {
    this._assertReady();
    this.agent.setVolume(volume);
  }

  /**
   * 切换数字人可见性
   */
  changeAvatarVisible(visible) {
    this._assertReady();
    this.agent.changeAvatarVisible(visible);
  }

  /**
   * 获取当前智能体状态
   */
  getAgentState() {
    return this.agentState;
  }

  /**
   * 获取当前 socket 状态
   */
  getSocketState() {
    return this.socketState;
  }

  /**
   * 获取当前说话状态
   */
  getSpeakState() {
    return this.speakState;
  }

  /**
   * 获取最近一次语义判断结果（抗干扰）
   */
  getSemanticJudge() {
    return this.semanticJudge;
  }

  /**
   * 获取网络信息
   */
  getNetworkInfo() {
    return this.networkInfo;
  }

  /**
   * 获取最近一次错误
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * 判断是否处于断网/重连状态
   */
  isReconnecting() {
    return this.agentState === 'reconnecting' || this.socketState === 'error';
  }

  /**
   * 销毁数字人，释放资源
   */
  async destroy() {
    this.destroyed = true;
    if (this.agent) {
      try {
        await this.agent.destroy();
      } catch (e) {
        // 忽略销毁过程中的错误
      }
      this.agent = null;
      this.initialized = false;
    }
  }

  _assertReady() {
    if (!this.agent || !this.initialized) {
      throw new Error('数字人尚未初始化完成');
    }
    if (this.destroyed) {
      throw new Error('数字人已销毁');
    }
  }

  _emit(name, payload) {
    if (typeof this.callbacks[name] === 'function') {
      this.callbacks[name](payload);
    }
  }

  /**
   * 判断错误是否可重试（网络类）
   */
  _isRetryable(error) {
    if (!error) return false;
    const domain = error.domain || '';
    const code = error.code || '';
    // 网络、SDK 类错误可重试；权限、配额类不可重试
    return (
      domain === 'network' ||
      domain === 'sdk' ||
      code.includes('network') ||
      code.includes('timeout') ||
      code.includes('reconnect')
    );
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default MofaCompanion;
