import type { TimeEntry } from '@/types'
import { formatDurationCN } from '@/utils/parseTimeEntry'

interface Props {
  entries: TimeEntry[]
}

export function DayStats({ entries }: Props) {
  if (entries.length === 0) return null

  const byCategory = new Map<string, number>()
  let total = 0
  for (const e of entries) {
    total += e.duration
    if (e.category) {
      byCategory.set(e.category, (byCategory.get(e.category) || 0) + e.duration)
    }
  }

  return (
    <div className="stats-bar">
      <div className="stat-chip">
        合计 <span className="stat-value">{formatDurationCN(total)}</span>
      </div>
      {Array.from(byCategory.entries()).map(([cat, mins]) => (
        <div key={cat} className="stat-chip">
          {cat} <span className="stat-value">{formatDurationCN(mins)}</span>
        </div>
      ))}
    </div>
  )
}
