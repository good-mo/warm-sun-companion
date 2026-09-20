import { test, expect } from 'vitest';
import { ChatPanel } from '../src/components/ChatPanel.js';
import { escapeHtml, debounce } from '../src/utils/helpers.js';

// 模拟 DOM
class FakeContainer {
  constructor() {
    this.children = [];
    this.scrollTop = 0;
    this.scrollHeight = 0;
  }
  appendChild(el) {
    this.children.push(el);
  }
}

class FakeElement {
  constructor() {
    this.children = [];
    this.textContent = '';
    this.className = '';
  }
  appendChild(el) {
    this.children.push(el);
  }
}

test('ChatPanel 添加用户消息', () => {
  const container = new FakeContainer();
  const panel = new ChatPanel(container);
  panel.addUser('你好');
  expect(container.children.length).toBe(1);
  expect(container.children[0].className).toContain('msg-user');
});

test('ChatPanel 流式追加助手消息', () => {
  const container = new FakeContainer();
  const panel = new ChatPanel(container);
  panel.addAssistant('你');
  panel.appendAssistant('好');
  expect(container.children.length).toBe(1);
  expect(panel.getLastAssistantText()).toBe('你好');
});

test('escapeHtml 转义特殊字符', () => {
  expect(escapeHtml('<script>alert(1)</script>')).toBe(
    '<script>alert(1)</script>'
  );
});

test('debounce 合并多次调用', async () => {
  let count = 0;
  const fn = debounce(() => {
    count += 1;
  }, 50);
  fn();
  fn();
  fn();
  await new Promise((r) => setTimeout(r, 80));
  expect(count).toBe(1);
});