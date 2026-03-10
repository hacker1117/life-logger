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
  零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  十一: 11, 十二: 12, 十三: 13, 十四: 14, 十五: 15,
  十六: 16, 十七: 17, 十八: 18, 十九: 19, 二十: 20,
  二十一: 21, 二十二: 22, 二十三: 23, 二十四: 24, 二十五: 25,
  二十六: 26, 二十七: 27, 二十八: 28, 二十九: 29, 三十: 30,
  三十五: 35, 四十: 40, 四十五: 45, 五十: 50, 五十五: 55,
  半: 0.5,
}

/** 特殊表达 → 分钟 */
const SPECIAL_MAP: Array<[RegExp, number]> = [
  [/half\s*an?\s*hour/i, 30],
  [/quarter\s*(?:of\s*an?\s*)?hour/i, 15],
  [/两(?:个)?半小?时/, 150],
  [/一(?:个)?半小?时/, 90],
  [/半(?:个)?小?时/, 30],
]

function normalizeCN(text: string): string {
  const keys = Object.keys(CN_NUM_MAP).sort((a, b) => b.length - a.length)
  let result = text
  for (const k of keys) {
    result = result.replaceAll(k, String(CN_NUM_MAP[k]))
  }
  return result
}

function normalizeText(text: string): string {
  return normalizeCN(text)
    .replace(/[：:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripMatchedText(source: string, matched: string): string {
  const escaped = matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source
    .replace(new RegExp(escaped, 'i'), ' ')
    .replace(/[，,。.、；;！!？?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

  for (const [re, mins] of SPECIAL_MAP) {
    const flags = re.flags.includes('i') ? re.flags : re.flags + 'i'
    const m = text.match(new RegExp(`(.*)${re.source}(.*)`, flags))
    if (m) {
      const event = (m[1] + (m[2] ?? ''))
        .replace(/[，,。.、；;！!？?\s]+$/g, '')
        .replace(/^[\s，,。.、；;！!？?]+/g, '')
        .trim()
      return { event: event || text, duration: mins }
    }
  }

  const norm = normalizeText(text)
  const NUM = '(\\d+(?:\\.\\d+)?)'

  const patterns: Array<{ re: RegExp; calc: (m: RegExpMatchArray) => number }> = [
    // 2h30m / 2 小时 30 分钟 / 2个小时30分 / 1 小时 20 分钟
    {
      re: new RegExp(
        `${NUM}\\s*(?:个\\s*)?(?:h(?:ours?)?|小时|小時|hrs?)\\s*${NUM}\\s*(?:m(?:in(?:ute)?s?)?|分钟|分鐘|分|mins?)(?=[^a-zA-Z]|$)`,
        'i',
      ),
      calc: m => Math.round(parseFloat(m[1]) * 60 + parseFloat(m[2])),
    },
    // 2小时半 / 2 个小时半
    {
      re: new RegExp(`${NUM}\\s*(?:个\\s*)?(?:小时|小時|h(?:ours?)?|hrs?)\\s*半`, 'i'),
      calc: m => Math.round(parseFloat(m[1]) * 60 + 30),
    },
    // 1.5小时 / 2 小时 / 2个小时 / 2h / 1.5hours
    {
      re: new RegExp(`${NUM}\\s*(?:个\\s*)?(?:h(?:ours?)?|小时|小時|hrs?)(?=[^a-zA-Z]|$)`, 'i'),
      calc: m => Math.round(parseFloat(m[1]) * 60),
    },
    // 45分钟 / 45 分 / 45min / 45m
    {
      re: new RegExp(`${NUM}\\s*(?:m(?:in(?:ute)?s?)?|分钟|分鐘|分|mins?)(?=[^a-zA-Z]|$)`, 'i'),
      calc: m => Math.round(parseFloat(m[1])),
    },
  ]

  for (const { re, calc } of patterns) {
    const m = norm.match(re)
    if (!m) continue

    const duration = calc(m)
    if (!Number.isFinite(duration) || duration <= 0) continue

    const eventFromRaw = stripMatchedText(text, m[0])
    const eventFromNorm = stripMatchedText(norm, m[0])
    const event = (!eventFromRaw || eventFromRaw === text) && eventFromNorm
      ? eventFromNorm
      : (eventFromRaw || eventFromNorm || text)
    return { event, duration }
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
