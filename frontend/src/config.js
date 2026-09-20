/**
 * 魔珐星云 SDK 配置
 *
 * ⚠️ 安全说明：
 * 本文件会提交到公开仓库，因此只包含占位符。
 * 真实凭证请放在同目录下的 `config.local.js`（已被 .gitignore 忽略），
 * 格式见 `config.local.example.js`。运行时 `resolveConfig()` 会自动合并。
 *
 * 若未提供 `config.local.js`，则使用下方占位符（无法连接，仅用于演示）。
 */

// 默认配置（占位符，请勿在此填写真实凭证）
export const MOFA_CONFIG = {
  // 应用凭证（必填，从 config.local.js 加载）
  appId: 'your-app-id',
  appSecret: 'your-app-secret',

  // 网关服务器（必填，来自官方文档）
  gatewayServer: 'https://nebula-agent.xingyun3d.com/user/v1/ttsa_v2/session',

  // 引擎 ID
  asrId: 1,   // ASR 语音识别引擎
  llmId: 1,   // LLM 大模型引擎

  // 渲染配置
  hardwareAcceleration: 'default',
  enableClientInterrupt: true,   // 客户端打断
  enableDebugger: false,
  enableLogger: true,

  // 会话配置
  sessionSpeakReqId: 0,          // 会话说话请求 ID

  // 重连配置（断网自动重连）
  reconnect: {
    enabled: true,
    maxAttempts: 5,              // 最大重连次数
    initialDelayMs: 1000,        // 初始重连延迟
    maxDelayMs: 10000,           // 最大重连延迟
  },

  // 音频配置（回声消除 AEC）
  audio: {
    chunkMs: 40,
    inputEnabled: true,
    echoCancellationEnabled: true,
  },

  // 智能体特性
  features: {
    auto_send_asr_to_llm: true,  // ASR 结果自动发送给 LLM
    anti_interference: {
      semantic_judge_enabled: true,  // 语义判断（抗干扰）
    },
    speech_frontend: {
      enabled: true,
      enable_aec: true,          // 回声消除
      enable_speech_separation: true,  // 语音分离
    },
    vad_merge_mode: true,        // VAD 合并模式
    volume_and_repetition_text_detection: true,  // 音量与重复文本检测
  },

  // 数字人形象（可选，默认使用平台默认形象）
  avatarId: '',
};

/**
 * 解析最终配置：合并本地凭证（config.local.js）
 * 若本地凭证文件不存在，则回退到默认占位符配置。
 * @returns {Promise<object>} 合并后的配置
 */
export async function resolveConfig() {
  let local = {};
  try {
    // 动态加载本地凭证（gitignored，不随仓库提交）
    const mod = await import('./config.local.js');
    local = mod.default || mod.MOFA_CONFIG || {};
  } catch (e) {
    // 未提供 config.local.js，使用默认占位符
    local = {};
  }
  return {
    ...MOFA_CONFIG,
    ...local,
    reconnect: { ...MOFA_CONFIG.reconnect, ...(local.reconnect || {}) },
    audio: { ...MOFA_CONFIG.audio, ...(local.audio || {}) },
    features: {
      ...MOFA_CONFIG.features,
      ...(local.features || {}),
      anti_interference: {
        ...MOFA_CONFIG.features.anti_interference,
        ...((local.features || {}).anti_interference || {}),
      },
      speech_frontend: {
        ...MOFA_CONFIG.features.speech_frontend,
        ...((local.features || {}).speech_frontend || {}),
      },
    },
  };
}

export default MOFA_CONFIG;
