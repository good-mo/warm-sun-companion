/**
 * 本地凭证配置模板（示例）
 *
 * 使用方法：
 * 1. 复制本文件为 `config.local.js`（同目录下）
 * 2. 在 `config.local.js` 中填入你的真实凭证
 * 3. `config.local.js` 已被 .gitignore 忽略，不会提交到仓库
 *
 * ⚠️ 请勿将真实凭证提交到公开仓库！
 */
export const MOFA_CONFIG = {
  // 应用凭证（必填，向魔珐星云申请）
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

export default MOFA_CONFIG;
