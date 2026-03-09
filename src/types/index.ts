/** 知识碎片条目 */
export interface KnowledgeEntry {
  id: string
  content: string
  createdAt: number // unix ms
  updatedAt: number
}

/** 时间记录条目 */
export interface TimeEntry {
  id: string
  event: string
  /** 分类（可选，用户主动设置） */
  category?: string
  /** 时长（分钟） */
  duration: number
  createdAt: number // unix ms
  updatedAt: number
}

/** Tab 类型 */
export type TabType = 'knowledge' | 'timetrack'

/** 按日期分组的数据 */
export interface DayGroup<T> {
  dateKey: string // YYYYMMDD
  label: string   // e.g. "2026年03月06日"
  entries: T[]
}
