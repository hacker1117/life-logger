/**
 * 日期工具函数
 */

/** 获取 YYYYMMDD 格式的日期键 */
export function getDateKey(timestamp: number): string {
  const d = new Date(timestamp)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

/** 获取今天的日期键 */
export function getTodayKey(): string {
  return getDateKey(Date.now())
}

/** YYYYMMDD → "2026年03月06日" */
export function formatDateLabel(dateKey: string): string {
  const y = dateKey.slice(0, 4)
  const m = dateKey.slice(4, 6)
  const d = dateKey.slice(6, 8)
  return `${y}年${m}月${d}日`
}

/** YYYYMMDD → "03/06 周四" 短格式 */
export function formatDateShort(dateKey: string): string {
  const y = parseInt(dateKey.slice(0, 4))
  const m = parseInt(dateKey.slice(4, 6)) - 1
  const d = parseInt(dateKey.slice(6, 8))
  const date = new Date(y, m, d)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${String(m + 1).padStart(2, '0')}/${String(d).padStart(2, '0')} ${weekdays[date.getDay()]}`
}

/** 分钟 → "2h 30m" 格式 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1m'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** 时间戳 → "14:30" */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 生成唯一ID */
export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
