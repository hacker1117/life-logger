/**
 * 时间记录数据 Hook
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import type { TimeEntry, TimerState, DayGroup } from '@/types'
import { timetrackDB, timerDB, settingsDB } from '@/store/db'
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
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    event: '',
    category: '',
    startedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [elapsed, setElapsed] = useState(0) // seconds
  const intervalRef = useRef<number | null>(null)

  // 加载数据
  useEffect(() => {
    (async () => {
      const [data, savedTimer, savedCats] = await Promise.all([
        timetrackDB.getAll(),
        timerDB.get(),
        settingsDB.getCategories(),
      ])
      setEntries(data)
      if (savedCats) setCategories(savedCats)
      if (savedTimer && savedTimer.isRunning && savedTimer.startedAt) {
        setTimer(savedTimer)
        setElapsed(Math.floor((Date.now() - savedTimer.startedAt) / 1000))
      }
      setLoading(false)
    })()
  }, [])

  // 计时器 tick
  useEffect(() => {
    if (timer.isRunning && timer.startedAt) {
      intervalRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - timer.startedAt!) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsed(0)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timer.isRunning, timer.startedAt])

  /** 开始计时 */
  const startTimer = useCallback(async (event: string, category: string) => {
    const state: TimerState = {
      isRunning: true,
      event,
      category,
      startedAt: Date.now(),
    }
    setTimer(state)
    await timerDB.set(state)
  }, [])

  /** 停止计时并保存 */
  const stopTimer = useCallback(async () => {
    if (!timer.isRunning || !timer.startedAt) return
    const duration = Math.max(1, Math.round((Date.now() - timer.startedAt) / 60000))
    const entry: TimeEntry = {
      id: uid(),
      event: timer.event,
      category: timer.category,
      duration,
      startedAt: timer.startedAt,
      createdAt: timer.startedAt,
    }
    await timetrackDB.add(entry)
    setEntries(prev => [entry, ...prev])

    const cleared: TimerState = { isRunning: false, event: '', category: '', startedAt: null }
    setTimer(cleared)
    await timerDB.set(cleared)
  }, [timer])

  /** 取消计时 */
  const cancelTimer = useCallback(async () => {
    const cleared: TimerState = { isRunning: false, event: '', category: '', startedAt: null }
    setTimer(cleared)
    await timerDB.set(cleared)
  }, [])

  /** 手动添加记录 */
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

  /** 删除记录 */
  const removeEntry = useCallback(async (id: string) => {
    await timetrackDB.remove(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  /** 添加自定义分类 */
  const addCategory = useCallback(async (name: string) => {
    const updated = [...categories, name.trim()]
    setCategories(updated)
    await settingsDB.setCategories(updated)
  }, [categories])

  const groups = groupByDate(entries)

  return {
    entries, groups, categories, timer, elapsed, loading,
    startTimer, stopTimer, cancelTimer, addEntry, removeEntry, addCategory,
  }
}
