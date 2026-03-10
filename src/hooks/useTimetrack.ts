/**
 * 时间记录数据 Hook
 * - 分类可选，不强制默认
 * - 支持单条更新分类
 * - 删除分类不影响已有记录
 */
import { useState, useEffect, useCallback } from 'react'
import type { TimeEntry, DayGroup } from '@/types'
import { timetrackDB, settingsDB } from '@/store/db'
import { syncDelete } from '@/store/sync'
import { getDateKey, formatDateLabel, uid } from '@/utils/date'

export const DEFAULT_CATEGORIES = ['工作', '学习', '阅读', '社交', '运动', '休息']

function groupByDate(entries: TimeEntry[]): DayGroup<TimeEntry>[] {
  const map = new Map<string, TimeEntry[]>()
  for (const e of entries) {
    const key = getDateKey(e.createdAt)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))          // 日期正序（旧→新）
    .map(([dateKey, items]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      entries: [...items].sort((a, b) => a.createdAt - b.createdAt), // 组内正序
    }))
}

export function useTimetrack() {
  const [entries, setEntries]     = useState<TimeEntry[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading]     = useState(true)

  const reload = useCallback(async () => {
    const data = await timetrackDB.getAll()
    setEntries(data)
  }, [])

  useEffect(() => {
    ;(async () => {
      const [data, savedCats] = await Promise.all([
        timetrackDB.getAll(),
        settingsDB.getCategories(),
      ])
      setEntries(data)
      if (savedCats && savedCats.length > 0) setCategories(savedCats)
      setLoading(false)
    })()
  }, [])

  /** 新增记录，category 可不传 */
  const addEntry = useCallback(async (
    event: string,
    duration: number,
    category?: string,
  ) => {
    const now = Date.now()
    const entry: TimeEntry = {
      id: uid(),
      event: event.trim(),
      duration,
      category,
      createdAt: now,
      updatedAt: now,
    }
    await timetrackDB.add(entry)
    setEntries(prev => [...prev, entry])
  }, [])

  /** 更新单条记录内容 */
  const updateEntry = useCallback(async (
    id: string,
    patch: Partial<Pick<TimeEntry, 'event' | 'duration' | 'category'>>,
  ) => {
    setEntries(prev => prev.map(e => {
      if (e.id !== id) return e
      const next: TimeEntry = {
        ...e,
        ...patch,
        event: patch.event !== undefined ? patch.event.trim() : e.event,
        updatedAt: Date.now(),
      }
      timetrackDB.put(next) // fire-and-forget
      return next
    }))
  }, [])

  /** 更新单条记录的分类（设为 undefined 即清除） */
  const updateCategory = useCallback(async (id: string, category: string | undefined) => {
    updateEntry(id, { category })
  }, [updateEntry])

  /** 删除记录 */
  const removeEntry = useCallback(async (id: string) => {
    await timetrackDB.remove(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    syncDelete('time_entries', id)  // fire-and-forget
  }, [])

  /** 添加自定义分类（不影响已有记录） */
  const addCategory = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    const updated = [...categories, trimmed]
    setCategories(updated)
    await settingsDB.setCategories(updated)
  }, [categories])

  /**
   * 删除分类定义（不修改已有条目上的 category 字段）
   */
  const removeCategory = useCallback(async (name: string) => {
    const updated = categories.filter(c => c !== name)
    setCategories(updated)
    await settingsDB.setCategories(updated)
    // 注意：已有记录上的 category 字段保持不变
  }, [categories])

  const groups = groupByDate(entries)

  return {
    entries, groups, categories, loading,
    addEntry, updateEntry, updateCategory, removeEntry,
    addCategory, removeCategory, reload,
  }
}
