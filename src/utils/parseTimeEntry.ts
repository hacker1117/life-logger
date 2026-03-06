/**
 * 自然语言时间记录解析器
 *
 * 支持样例：
 *   "和朋友吃饭聊天 15 分钟"
 *   "阅读《奇特的一生》，1.5 小时。"
 *   "摸鱼刷 twitter，二十五分钟"
 *   "写代码 2h30m"
 *   "开会 1小时20分"
 *   "睡觉8小时"
 *   "跑步 half an hour"
 *   "reading 45min"
 *   "lunch 1.5hours"
 *   "看番 两个半小时"
 */

/** 中文数字 → 阿拉伯数字 */
const CN_NUM_MAP: Record<string, number> = {
  零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15,
  十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20,
  二十一: 21, 二十二: 22, 二十三: 23, 二十四: 24, 二十五: 25,
  二十六: 26, 二十七: 27, 二十八: 28, 二十九: 29, 三十: 30,
  三十五: 35, 四十: 40, 四十五: 45, 五十: 50, 五十五: 55,
  半: 0.5, // "半小时" = 30分
}

/** 特殊表达 → 分钟 */
const SPECIAL_MAP: Array<[RegExp, number]> = [
  [/half\s*an?\s*hour/i,              30],
  [/quarter\s*(?:of\s*an?\s*)?hour/i, 15],
  [/两个?半小?时/,                    150],  // 两个半小时
  [/一个?半小?时/,                    90],   // 一个半小时
  [/半个?小?时/,                      30],   // 半小时 / 半个小时
  [/一个?小?时/,                      60],   // 一小时 / 一个小时
]

function cnToNum(s: string): number | null {
  // 尝试直接映射
  if (CN_NUM_MAP[s] !== undefined) return CN_NUM_MAP[s]
  // 尝试 "X十Y" 形式
  const tenMatch = s.match(/^([一二三四五六七八九]?)十([一二三四五六七八九]?)$/)
  if (tenMatch) {
    const tens = tenMatch[1] ? (CN_NUM_MAP[tenMatch[1]] ?? 1) : 1
    const ones = tenMatch[2] ? (CN_NUM_MAP[tenMatch[2]] ?? 0) : 0
    return tens * 10 + ones
  }
  return null
}

/** 将字符串中的中文数字替换成阿拉伯数字（用于后续正则） */
function normalizeCN(text: string): string {
  // 先处理多字中文数字（长的先替换，防止被短的截断）
  const keys = Object.keys(CN_NUM_MAP).sort((a, b) => b.length - a.length)
  let result = text
  for (const k of keys) {
    result = result.replaceAll(k, String(CN_NUM_MAP[k]))
  }
  return result
}

export interface ParsedTimeEntry {
  /** 事件描述（去除时间部分后的文本） */
  event: string
  /** 时长（分钟） */
  duration: number
}

/**
 * 解析一条时间记录的自然语言输入。
 * 返回 null 表示无法解析出时长。
 */
export function parseTimeEntry(raw: string): ParsedTimeEntry | null {
  const text = raw.trim()
  if (!text) return null

  // --- 1. 处理特殊短语 ---
  for (const [re, mins] of SPECIAL_MAP) {
    const flags = re.flags.includes('i') ? re.flags : re.flags + 'i'
    const m = text.match(new RegExp(`(.*)${re.source}(.*)`, flags))
    if (m) {
      const event = (m[1] + (m[2] ?? '')).replace(/[，,。.、\s]+$/, '').replace(/^[\s，,。.、]+/, '').trim()
      return { event: event || text, duration: mins }
    }
  }

  // --- 2. 标准化：把中文数字转成阿拉伯数字 ---
  const norm = normalizeCN(text)

  // 匹配数字部分（整数或小数）
  const NUM = '(\\d+(?:\\.\\d+)?)'

  // --- 3. 尝试各种格式 ---
  const patterns: Array<{ re: RegExp; calc: (m: RegExpMatchArray) => number }> = [
    // "2h30m" / "2h 30m" / "2小时30分钟" / "2小时30分"
    {
      re: new RegExp(`${NUM}\\s*(?:h(?:ours?)?|小时|hrs?)\\s*${NUM}\\s*(?:m(?:in(?:utes?)?)?|分钟?|mins?)`, 'i'),
      calc: m => Math.round(parseFloat(m[1]) * 60 + parseFloat(m[2])),
    },
    // "1.5小时" / "1.5h" / "1.5hours"
    {
      re: new RegExp(`${NUM}\\s*(?:h(?:ours?)?|小时|hrs?)`, 'i'),
      calc: m => Math.round(parseFloat(m[1]) * 60),
    },
    // "45分钟" / "45分" / "45min" / "45mins" / "45m"（必须有至少2位，避免误抓"m"结尾的词）
    {
      re: new RegExp(`${NUM}\\s*(?:分钟?|min(?:utes?)?s?|mins?)(?=[^a-zA-Z]|$)`, 'i'),
      calc: m => Math.round(parseFloat(m[1])),
    },
  ]

  for (const { re, calc } of patterns) {
    const m = norm.match(re)
    if (!m) continue
    const mins = calc(m)
    if (mins <= 0) continue

    // 从原始文本中去掉时间部分，得到事件描述
    // 找到匹配位置，把原文中对应范围删掉
    const start = m.index!
    const end = start + m[0].length
    // 从原始文本中去掉时间部分：用 normalizeCN 后的匹配位置对应回原文
    // 策略：在 norm 上找匹配范围，再映射回 text（两者长度因中文数字替换可能不同）
    // 简化：直接在 norm 上拼接 before+after，然后对照原文做同样的截断
    // 对于纯ASCII数字替换，norm 长度 ≤ text 长度，这里用 norm 的 before/after 位置反推
    const normBefore = norm.slice(0, start)
    const normAfter = norm.slice(end)
    // 找原文中对应的分割点：倒着找 normBefore 和 normAfter 中不变的边界字符
    // 最简可靠方式：直接把 norm 拼好再做清理
    const eventRaw = (normBefore + normAfter)
      .replace(/[，,。.、！!？?\s]+$/g, '')
      .replace(/^[，,。.、！!？?\s]+/g, '')
      .trim()
    // 还原：normalizeCN 只替换了数字，把残留的非文字字符（"分"、"钟"等孤立汉字）去掉
    // 清除末尾孤立的时间单位字符
    const event = eventRaw
      .replace(/[分钟时]+$/g, '')           // 末尾残留时间单位
      .replace(/[，,。.、！!？?\s]+$/g, '') // 再清一次尾部标点
      .trim()

    return { event: event || text, duration: mins }
  }

  return null
}

/** 将分钟数格式化为 "X小时Y分钟" 或 "Y分钟" */
export function formatDurationCN(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}
