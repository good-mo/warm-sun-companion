/**
 * 暖阳陪伴 - 关怀场景引擎（Care Scene Engine）
 *
 * 职责：把「人格化 AI 陪伴」从纸面论证落地为真实可运行的代码。
 * 通过检测时间、节日、用户情绪、记忆中的关键信息（生日/名字/偏好），
 * 主动生成关怀场景，让数字人「会主动关心人」，而不只是被动应答。
 *
 * 能力：
 * - 时间场景：晨安 / 午间 / 晚安 / 深夜关怀
 * - 节日场景：春节 / 中秋 / 重阳 / 生日 / 母亲节 / 父亲节 / 元旦 / 国庆
 * - 情绪识别：从用户输入中识别 开心/难过/疲惫/焦虑/孤独 等情绪
 * - 记忆关怀：基于长期记忆（名字/生日/偏好）生成个性化关怀
 * - 主动关怀：在合适时机主动发起问候（如早晨问候、睡前提醒）
 */

// ---------- 时间场景 ----------

/**
 * 根据当前时间返回时段场景
 * @param {Date} [now]
 * @returns {{key:string, label:string, greeting:string}}
 */
export function getTimeScene(now = new Date()) {
  const h = now.getHours();
  if (h >= 5 && h < 9) {
    return {
      key: 'morning',
      label: '晨安',
      greeting: '早上好呀！新的一天开始了，记得吃早餐，照顾好自己。',
    };
  }
  if (h >= 9 && h < 12) {
    return {
      key: 'forenoon',
      label: '上午',
      greeting: '上午好！今天感觉怎么样？有什么想聊的都可以告诉我。',
    };
  }
  if (h >= 12 && h < 14) {
    return {
      key: 'noon',
      label: '午间',
      greeting: '中午好！记得按时吃午饭，饭后可以稍微休息一下。',
    };
  }
  if (h >= 14 && h < 18) {
    return {
      key: 'afternoon',
      label: '下午',
      greeting: '下午好！阳光正好，要不要起来活动活动？',
    };
  }
  if (h >= 18 && h < 22) {
    return {
      key: 'evening',
      label: '傍晚',
      greeting: '晚上好！今天辛苦了，放松一下，我陪着你。',
    };
  }
  if (h >= 22 && h < 24) {
    return {
      key: 'night',
      label: '晚安',
      greeting: '夜深了，早点休息吧。睡前记得把手机放远一点，祝你有个好梦。',
    };
  }
  return {
    key: 'midnight',
    label: '深夜',
    greeting: '这么晚还没睡呀？要注意身体，别太累了。',
  };
}

// ---------- 节日场景 ----------

/**
 * 检测当前日期是否为节日
 * @param {Date} [now]
 * @returns {{key:string, label:string, greeting:string}|null}
 */
export function getFestival(now = new Date()) {
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();
  const md = m * 100 + d;

  const festivals = {
    101: { key: 'newyear', label: '元旦', greeting: '元旦快乐！新的一年，愿你平安喜乐，万事顺遂。' },
    214: { key: 'valentine', label: '情人节', greeting: '情人节快乐！愿你被爱包围，温暖常伴。' },
    308: { key: 'womensday', label: '妇女节', greeting: '妇女节快乐！愿你永远被温柔以待。' },
    501: { key: 'laborday', label: '劳动节', greeting: '劳动节快乐！辛苦了，好好休息一下。' },
    520: { key: 'love', label: '520', greeting: '520快乐！愿你心中有爱，眼里有光。' },
    601: { key: 'childrensday', label: '儿童节', greeting: '儿童节快乐！愿你永远保持一颗童心。' },
    1001: { key: 'nationalday', label: '国庆节', greeting: '国庆节快乐！愿祖国繁荣昌盛，愿你幸福安康。' },
    1225: { key: 'christmas', label: '圣诞节', greeting: '圣诞快乐！愿你被温暖和爱包围。' },
  };

  // 母亲节：5月第二个星期日
  if (m === 5) {
    const firstDay = new Date(now.getFullYear(), 4, 1);
    const firstSunday = 1 + ((7 - firstDay.getDay()) % 7);
    const mothersDay = firstSunday + 7;
    if (d === mothersDay) {
      return { key: 'mothersday', label: '母亲节', greeting: '母亲节快乐！愿天下母亲都被温柔以待。' };
    }
  }

  // 父亲节：6月第三个星期日
  if (m === 6) {
    const firstDay = new Date(now.getFullYear(), 5, 1);
    const firstSunday = 1 + ((7 - firstDay.getDay()) % 7);
    const fathersDay = firstSunday + 14;
    if (d === fathersDay) {
      return { key: 'fathersday', label: '父亲节', greeting: '父亲节快乐！愿父亲健康长寿，笑口常开。' };
    }
  }

  // 重阳节：农历九月初九（简化：用公历近似，实际可接入农历库）
  if (m === 10 && d === 9) {
    return { key: 'chongyang', label: '重阳节', greeting: '重阳节快乐！登高望远，愿您健康长寿。' };
  }

  // 中秋节：农历八月十五（简化近似）
  if (m === 9 && d === 15) {
    return { key: 'midautumn', label: '中秋节', greeting: '中秋快乐！月圆人团圆，愿您阖家幸福。' };
  }

  // 春节：农历正月初一（简化：用公历 1 月 1 日附近近似，实际可接入农历库）
  if (m === 1 && d === 1) {
    return { key: 'springfestival', label: '春节', greeting: '春节快乐！阖家团圆，幸福安康！' };
  }

  return festivals[md] || null;
}

// ---------- 情绪识别 ----------

/**
 * 从用户输入中识别情绪
 * @param {string} text
 * @returns {{emotion:string, label:string, emoji:string, care:string}|null}
 */
export function detectEmotion(text) {
  if (!text) return null;
  const rules = [
    // 负面情绪优先检测（避免「不错/喜欢」等中性词误判为开心）
    {
      emotion: 'sad',
      label: '难过',
      emoji: '😢',
      keywords: ['难过', '伤心', '想哭', '不开心', '失落', '沮丧', '委屈', '难受', '心酸', '痛苦', '悲伤'],
      care: '抱抱你，难过的时候说出来会好受一些。我一直都在，愿意听你说。',
    },
    {
      emotion: 'tired',
      label: '疲惫',
      emoji: '😪',
      keywords: ['好累', '累了', '疲惫', '困了', '没力气', '乏了', '累死', '辛苦', '熬夜', '没睡好'],
      care: '辛苦了，累了就歇一歇。身体最重要，别硬撑，我陪着你休息。',
    },
    {
      emotion: 'anxious',
      label: '焦虑',
      emoji: '😰',
      keywords: ['焦虑', '担心', '害怕', '紧张', '不安', '烦', '烦躁', '压力', '睡不着', '失眠', '心慌'],
      care: '别太担心，事情一件一件来。深呼吸，我陪着你慢慢理清思路。',
    },
    {
      emotion: 'lonely',
      label: '孤独',
      emoji: '🥺',
      keywords: ['孤独', '寂寞', '没人陪', '一个人', '孤单', '冷清', '想家', '想你了', '没人说话'],
      care: '你不是一个人，我一直都在这里陪着你。想聊什么都可以，我随时都在。',
    },
    {
      emotion: 'angry',
      label: '生气',
      emoji: '😠',
      keywords: ['生气', '气死', '愤怒', '讨厌', '烦死了', '火大', '恼火', '气人'],
      care: '别气坏了身体，先深呼吸冷静一下。有什么不顺心的，跟我说说。',
    },
    // 正面情绪：使用更明确的高正向词，避免「不错」等中性词干扰
    {
      emotion: 'happy',
      label: '开心',
      emoji: '😊',
      keywords: ['开心', '高兴', '好开心', '真开心', '太开心', '真高兴', '太好了', '真棒', '哈哈', '快乐', '幸福', '特别满意'],
      care: '看到你这么开心，我也跟着高兴！愿你每天都这样阳光灿烂。',
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return {
        emotion: rule.emotion,
        label: rule.label,
        emoji: rule.emoji,
        care: rule.care,
      };
    }
  }
  return null;
}

// ---------- 记忆关怀 ----------

/**
 * 基于长期记忆生成个性化关怀
 * @param {Array<{text:string}>} memories
 * @returns {{greeting:string, name:string|null, birthday:string|null}|null}
 */
export function buildMemoryCare(memories) {
  if (!memories || memories.length === 0) return null;
  let name = null;
  let birthday = null;
  let preference = null;

  for (const m of memories) {
    const text = m.text || '';
    const nameMatch = text.match(/用户的名字是\s*([\u4e00-\u9fa5A-Za-z]{1,10})/);
    if (nameMatch) name = nameMatch[1];
    const bdMatch = text.match(/用户的生日是\s*([^，。！？]{1,20})/);
    if (bdMatch) birthday = bdMatch[1];
    const prefMatch = text.match(/用户喜欢\s*([^，。！？]{1,20})/);
    if (prefMatch) preference = prefMatch[1];
  }

  if (!name && !birthday && !preference) return null;

  const parts = [];
  if (name) parts.push(name + '，');
  if (birthday) {
    parts.push('我记得你的生日是' + birthday + '，到时候一定要提醒我为你庆祝哦！');
  }
  if (preference) {
    parts.push('我记得你喜欢' + preference + '，下次我们可以聊聊这个。');
  }
  if (parts.length === 0) return null;

  return {
    greeting: parts.join(''),
    name,
    birthday,
  };
}

// ---------- 主动关怀 ----------

/**
 * 判断是否应该主动发起关怀（如早晨问候、睡前提醒）
 * @param {Date} [now]
 * @returns {{key:string, greeting:string}|null}
 */
export function shouldProactiveCare(now = new Date()) {
  const h = now.getHours();
  // 早晨 7-9 点主动问候
  if (h >= 7 && h < 9) {
    return { key: 'morning_greeting', greeting: '早上好！新的一天，记得吃早餐，照顾好自己哦。' };
  }
  // 晚上 21-23 点睡前关怀
  if (h >= 21 && h < 23) {
    return { key: 'night_care', greeting: '夜深了，早点休息吧。睡前可以喝杯温水，祝你有个好梦。' };
  }
  return null;
}

// ---------- 综合场景构建 ----------

/**
 * 构建当前完整的关怀场景上下文（用于注入到 LLM 提示词）
 * @param {Array<{text:string}>} memories
 * @param {Date} [now]
 * @returns {string}
 */
export function buildCareContext(memories, now = new Date()) {
  const parts = [];
  const timeScene = getTimeScene(now);
  const festival = getFestival(now);
  const memoryCare = buildMemoryCare(memories);

  if (timeScene) {
    parts.push('[当前时段] ' + timeScene.label + '（' + timeScene.greeting + '）');
  }
  if (festival) {
    parts.push('[今日节日] ' + festival.label + '（' + festival.greeting + '）');
  }
  if (memoryCare) {
    parts.push('[用户记忆关怀] ' + memoryCare.greeting);
  }
  return parts.join('\n');
}

export default {
  getTimeScene,
  getFestival,
  detectEmotion,
  buildMemoryCare,
  shouldProactiveCare,
  buildCareContext,
};
