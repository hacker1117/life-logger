/**
 * 知识碎片数据 Hook
 */
import { useState, useEffect, useCallback } from 'react'
import type { KnowledgeEntry, DayGroup } from '@/types'
import { knowledgeDB } from '@/store/db'
import { syncDelete } from '@/store/sync'
import { getDateKey, formatDateLabel, uid } from '@/utils/date'

function groupByDate(entries: KnowledgeEntry[]): DayGroup<KnowledgeEntry>[] {
  const map = new Map<string, KnowledgeEntry[]>()
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

export function useKnowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const data = await knowledgeDB.getAll()
    setEntries(data)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const addEntry = useCallback(async (content: string) => {
    const now = Date.now()
    const entry: KnowledgeEntry = {
      id: uid(),
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
    }
    await knowledgeDB.add(entry)
    setEntries(prev => [...prev, entry])
  }, [])

  const removeEntry = useCallback(async (id: string) => {
    await knowledgeDB.remove(id)
    setEntries(prev => prev.filter(e => e.id !== id))
    syncDelete('knowledge_entries', id)  // fire-and-forget
  }, [])

  const groups = groupByDate(entries)

  return { entries, groups, loading, addEntry, removeEntry, reload }
}
