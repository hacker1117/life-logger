/**
 * 时间记录数据 Hook（NLP 输入模式，无计时器）
 */
import { useState, useEffect, useCallback } from 'react'
import type { TimeEntry, DayGroup } from '@/types'
import { timetrackDB, settingsDB } from '@/store/db'
import { getDateKey, formatDateLabel, uid } from '@/utils/date'

const DEFAULT_CATEGORIES = ['工作', '学习', '阅读', '社交', '运动', '休息']

function groupByDate(entries: TimeEntry[]): DayGroup<TimeEntry>[] {
  const map = new Map<string, TimeEntry[]>()
  for (const e of entries) {
    const key = getDateKey(e.createdAt)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, entries]) => ({
      dateKey,
      label: formatDateLabel(dateKey),
      entries,
    }))
}

export function useTimetrack() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const [data, savedCats] = await Promise.all([
        timetrackDB.getAll(),
        settingsDB.getCategories(),
      ])
      setEntries(data)
      if (savedCats && savedCats.length > 0) setCategories(savedCats)
      setLoading(false)
    })()
  }, [])

  const addEntry = useCallback(async (event: string, category: string, duration: number) => {
    const entry: TimeEntry = {
      id: uid(),
      event: event.trim(),
      category,
      duration,
      createdAt: Date.now(),
    }
    await timetrackDB.add(entry)
    setEntries(prev => [entry, ...prev])
  }, [])

  const removeEntry = useCallback(async (id: string) => {
    await timetrackDB.remove(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  const addCategory = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || categories.includes(trimmed)) return
    const updated = [...categories, trimmed]
    setCategories(updated)
    await settingsDB.setCategories(updated)
  }, [categories])

  const groups = groupByDate(entries)

  return { entries, groups, categories, loading, addEntry, removeEntry, addCategory }
}
