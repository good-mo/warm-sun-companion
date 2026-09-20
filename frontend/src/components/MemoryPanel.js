/**
 * 记忆面板组件
 * 展示数字人陪伴过程中的记忆内容
 */
export class MemoryPanel {
  constructor(container) {
    this.container = container;
  }

  render(memories) {
    this.container.innerHTML = '';
    if (!memories || memories.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'memory-empty';
      empty.textContent = '暂无记忆';
      this.container.appendChild(empty);
      return;
    }
    memories.forEach((m) => {
      const li = document.createElement('li');
      li.className = 'memory-item';
      const time = new Date(m.time).toLocaleString();
      li.innerHTML = `<span class="memory-time">${time}</span><span class="memory-text">${escapeHtml(m.text)}</span>`;
      this.container.appendChild(li);
    });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

export default MemoryPanel;
