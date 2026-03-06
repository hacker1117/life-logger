/**
 * 知识碎片数据 Hook
 */
import { useState, useEffect, useCallback } from 'react'
import type { KnowledgeEntry, DayGroup } from '@/types'
import { knowledgeDB } from '@/store/db'
import { getDateKey, formatDateLabel, uid } from '@/utils/date'

function groupByDate(entries: KnowledgeEntry[]): DayGroup<KnowledgeEntry>[] {
  const map = new Map<string, KnowledgeEntry[]>()
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
      entries, // already sorted desc from DB
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
    const entry: KnowledgeEntry = {
      id: uid(),
      content: content.trim(),
      createdAt: Date.now(),
    }
    await knowledgeDB.add(entry)
    setEntries(prev => [entry, ...prev])
  }, [])

  const removeEntry = useCallback(async (id: string) => {
    await knowledgeDB.remove(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  const groups = groupByDate(entries)

  return { entries, groups, loading, addEntry, removeEntry }
}
