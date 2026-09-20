/**
 * 魔珐星云 SDK 类型定义参考
 * 摘自 @xmov/avatar 的类型声明，供开发时参考
 */

/** 智能体状态 */
export const AGENT_STATES = {
  idle: '待机',
  initializing: '初始化中',
  ready: '就绪',
  running: '运行中',
  reconnecting: '重连中',
  stopped: '已停止',
  destroyed: '已销毁',
  failed: '异常',
};

/** ASR 状态 */
export const ASR_STATES = {
  idle: '空闲',
  'requesting-permission': '请求权限',
  starting: '启动中',
  listening: '聆听中',
  stopping: '停止中',
  failed: '失败',
};

/** 对话状态 */
export const CONVERSATION_STATES = {
  idle: '空闲',
  asking: '提问中',
  'speaking-directly': '直接对话',
  speaking: '说话中',
  completed: '完成',
  interrupted: '已打断',
  failed: '失败',
};

/** 渲染状态 */
export const RENDER_STATES = {
  init: '初始化',
  rendering: '渲染中',
  pausing: '暂停中',
  paused: '已暂停',
  resumed: '已恢复',
  stopped: '已停止',
};