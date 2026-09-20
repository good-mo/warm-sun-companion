/**
 * 对话面板组件
 * 负责渲染用户与数字人的对话消息
 */
export class ChatPanel {
  constructor(container) {
    this.container = container;
    this.messages = [];
    this.currentAssistant = null;
    this.typingEl = null;
  }

  addUser(text) {
    this._append('user', text);
  }

  addSystem(text) {
    this._append('system', text);
  }

  addAssistant(text) {
    this._append('assistant', text);
  }

  appendAssistant(text) {
    // 流式追加：如果当前有未完成的 assistant 消息，则追加
    if (this.currentAssistant) {
      this.currentAssistant.textContent += text;
      this._scrollToBottom();
    } else {
      this.addAssistant(text);
    }
  }

  finishAssistant() {
    this.currentAssistant = null;
  }

  /**
   * 显示"正在想…"打字动画（数字人思考时的加载反馈）
   */
  addTyping() {
    this.removeTyping();
    const item = document.createElement('div');
    item.className = 'msg msg-system msg-typing';
    const bubble = document.createElement('div');
    bubble.className = 'bubble typing-bubble';
    bubble.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span> 暖阳正在想…';
    item.appendChild(bubble);
    this.container.appendChild(item);
    this.typingEl = item;
    this._scrollToBottom();
  }

  /**
   * 移除"正在想…"打字动画
   */
  removeTyping() {
    if (this.typingEl && this.typingEl.parentNode) {
      this.typingEl.parentNode.removeChild(this.typingEl);
      this.typingEl = null;
    }
  }

  /**
   * 替换最后一条 assistant 消息的文本（如去除动作标记后）
   */
  replaceLastAssistant(text) {
    const last = this.messages[this.messages.length - 1];
    if (last && last.role === 'assistant') {
      last.text = text;
      const bubbles = this.container.querySelectorAll('.msg-assistant .bubble');
      const lastBubble = bubbles[bubbles.length - 1];
      if (lastBubble) {
        lastBubble.textContent = text;
      }
    }
  }

  getLastAssistantText() {
    const last = this.messages[this.messages.length - 1];
    return last && last.role === 'assistant' ? last.text : '';
  }

  _append(role, text) {
    const item = document.createElement('div');
    item.className = 'msg msg-' + role;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    item.appendChild(bubble);
    this.container.appendChild(item);

    this.messages.push({ role, text });
    if (role === 'assistant') {
      this.currentAssistant = bubble;
    }
    this._scrollToBottom();
  }

  _scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }
}

export default ChatPanel;
