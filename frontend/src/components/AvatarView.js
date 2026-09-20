/**
 * 数字人视图组件
 * 负责数字人容器的展示与具身状态控制（聆听/思考/说话/情绪/动作）
 */
export class AvatarView {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = opts;
    // 复用 index.html 中已存在的状态条元素，未提供则动态创建
    this.stateEl = document.getElementById('avatar-state-label');
    this.emotionEl = document.getElementById('avatar-state-emotion');
    this.actionEl = document.getElementById('avatar-state-action');
    if (!this.stateEl) {
      this._createStateBar();
    }
  }

  /**
   * 动态创建状态条（当 index.html 未提供时兜底）
   */
  _createStateBar() {
    const bar = document.createElement('div');
    bar.className = 'avatar-state-bar';

    this.stateEl = document.createElement('span');
    this.stateEl.className = 'avatar-state-label';
    this.stateEl.id = 'avatar-state-label';

    this.emotionEl = document.createElement('span');
    this.emotionEl.className = 'avatar-state-emotion';
    this.emotionEl.id = 'avatar-state-emotion';

    this.actionEl = document.createElement('span');
    this.actionEl.className = 'avatar-state-action';
    this.actionEl.id = 'avatar-state-action';

    bar.appendChild(this.stateEl);
    bar.appendChild(this.emotionEl);
    bar.appendChild(this.actionEl);
    if (this.container) {
      this.container.appendChild(bar);
    }
  }

  /**
   * 展示具身状态（如 聆听中/思考中/说话中）
   */
  showState(label) {
    if (this.stateEl) {
      this.stateEl.textContent = label;
      this.stateEl.classList.add('active');
    }
  }

  /**
   * 展示具身状态（如 聆听中/思考中/说话中），并联动情绪
   * @param {string} label
   * @param {string} emotion 情绪标识（happy/sad/tired/anxious/lonely/angry）
   */
  showStateWithEmotion(label, emotion) {
    this.showState(label);
    if (emotion) {
      this.showEmotion(emotion);
    }
  }

  /**
   * 清除具身状态
   */
  clearState() {
    if (this.stateEl) {
      this.stateEl.textContent = '';
      this.stateEl.classList.remove('active');
    }
  }

  /**
   * 展示情绪状态（Emotion）
   * @param {string|{emotion:string,label:string,emoji:string}} emotion
   */
  showEmotion(emotion) {
    if (!emotion) {
      if (this.emotionEl) this.emotionEl.textContent = '';
      if (this.opts && this.opts.onEmotion) this.opts.onEmotion('');
      return;
    }
    let display = emotion;
    let key = emotion;
    if (typeof emotion === 'object') {
      display = (emotion.emoji ? emotion.emoji + ' ' : '') + (emotion.label || emotion.emotion || '');
      key = emotion.emotion || display;
    }
    if (this.emotionEl) {
      this.emotionEl.textContent = display;
      // 用 data-emotion 属性驱动情绪颜色
      this.emotionEl.dataset.emotion = key;
    }
    if (this.opts && this.opts.onEmotion) {
      this.opts.onEmotion(key);
    }
  }

  /**
   * 展示关键动作（KA）
   */
  showKeyAction(action) {
    if (this.actionEl) {
      this.actionEl.textContent = action || '';
    }
    if (this.opts && this.opts.onKeyAction) {
      this.opts.onKeyAction(action);
    }
  }

  setLoading(loading) {
    if (this.container) {
      this.container.classList.toggle('loading', loading);
    }
  }

  setVisible(visible) {
    if (this.container) {
      this.container.style.visibility = visible ? 'visible' : 'hidden';
    }
  }
}

export default AvatarView;
