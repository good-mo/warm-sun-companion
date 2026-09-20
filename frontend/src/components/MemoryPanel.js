/**
 * 记忆面板组件
 * 展示数字人陪伴过程中的记忆内容
 *
 * v2：按类型分类展示（名字/生日/偏好/健康/其他），空状态给出引导
 */
// 记忆分类规则：根据文本关键词归入类别
const CATEGORY_RULES = [
  { key: 'birthday', label: '🎂 生日', keywords: ['生日', '属', '生于'] },
  { key: 'name', label: '👤 名字', keywords: ['名字', '我叫', '称呼', '姓'] },
  { key: 'preference', label: '❤️ 偏好', keywords: ['喜欢', '最爱', '爱', '偏好', '爱吃', '爱喝'] },
  { key: 'health', label: '💊 健康', keywords: ['药', '血压', '血糖', '健康', '心脏', '医生'] },
  { key: 'family', label: '👨‍👩‍👧 家人', keywords: ['儿子', '女儿', '孙子', '孙女', '老伴', '家人', '孩子'] },
];

export class MemoryPanel {
  constructor(container) {
    this.container = container;
  }

  _categorize(text) {
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((k) => text.includes(k))) {
        return rule;
      }
    }
    return { key: 'other', label: '📝 其他' };
  }

  render(memories) {
    this.container.innerHTML = '';
    if (!memories || memories.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'memory-empty';
      empty.textContent = '暂无记忆\n';
      const hint = document.createElement('div');
      hint.className = 'memory-hint';
      hint.textContent = '告诉暖阳你的名字、生日或喜好，我会牢牢记住，下次见面就认得你啦 ☀️';
      empty.appendChild(hint);
      this.container.appendChild(empty);
      return;
    }

    // 按类别分组，同一类别内时间倒序
    const groups = new Map();
    memories.forEach((m, i) => {
      const cat = this._categorize(m.text || '');
      if (!groups.has(cat.key)) groups.set(cat.key, { label: cat.label, items: [] });
      groups.get(cat.key).items.push({ time: m.time, text: m.text, index: i });
    });

    // 类别顺序：容器插入顺序（birthday/name/preference/health/family/other）
    const order = ['birthday', 'name', 'preference', 'health', 'family', 'other'];
    [...groups.keys()]
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .forEach((key) => {
        const group = groups.get(key);
        group.items.sort((a, b) => (b.time || '') > (a.time || '') ? 1 : -1);

        const groupHeader = document.createElement('li');
        groupHeader.className = 'memory-group-header';
        groupHeader.textContent = group.label;
        this.container.appendChild(groupHeader);

        group.items.forEach((m) => {
          const li = document.createElement('li');
          li.className = 'memory-item';
          const time = m.time ? new Date(m.time).toLocaleString() : '';
          li.innerHTML = `<span class="memory-time">${escapeHtml(time)}</span><span class="memory-text">${escapeHtml(m.text)}</span>`;
          this.container.appendChild(li);
        });
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
