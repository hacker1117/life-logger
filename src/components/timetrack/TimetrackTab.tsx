import { useState } from 'react'
import { useTimetrack } from '@/hooks/useTimetrack'
import { DayPicker } from '@/components/common/DayPicker'
import { DayStats } from './DayStats'
import { TimeInput } from './TimeInput'
import { formatTime, getTodayKey } from '@/utils/date'
import { formatDurationCN } from '@/utils/parseTimeEntry'
import { exportTimeCSV, downloadFile } from '@/utils/export'

export function TimetrackTab() {
  const { groups, categories, loading, addEntry, removeEntry } = useTimetrack()
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)

  const displayGroups = filterDate
    ? groups.filter(g => g.dateKey === filterDate)
    : groups

  const handleExport = () => {
    const csv = exportTimeCSV(displayGroups)
    downloadFile(csv, `时间记录_${getTodayKey()}.csv`, 'text/csv;charset=utf-8')
  }

  if (loading) return null

  return (
    <div className="tab-content">
      <div className="toolbar">
        <button className="btn btn-ghost btn-sm" onClick={() => setShowDayPicker(true)}>
          📅 {filterDate ? groups.find(g => g.dateKey === filterDate)?.label : '全部日期'}
        </button>
        <div className="toolbar-right">
          {filterDate && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate(null)}>
              清除
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleExport}>
            导出 CSV
          </button>
        </div>
      </div>

      <div className="scroll-area">
        {displayGroups.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⏱</div>
            <p>用自然语言描述你在做什么<br />例如：「阅读半小时」</p>
          </div>
        )}

        {displayGroups.map(group => (
          <div key={group.dateKey}>
            <div className="date-header">{group.label}</div>
            <DayStats entries={group.entries} />
            {group.entries.map(entry => (
              <div key={entry.id} className="entry-card">
                <button
                  className="delete-btn"
                  onClick={() => removeEntry(entry.id)}
                  aria-label="删除"
                >
                  ×
                </button>
                <div className="entry-time">{formatTime(entry.createdAt)}</div>
                <div className="entry-content">{entry.event}</div>
                <div className="entry-meta">
                  <span className="cat-tag">{entry.category}</span>
                  <span className="duration-tag">{formatDurationCN(entry.duration)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <TimeInput categories={categories} onSubmit={addEntry} />

      {showDayPicker && (
        <DayPicker
          groups={groups}
          onSelect={setFilterDate}
          onClose={() => setShowDayPicker(false)}
        />
      )}
    </div>
  )
}
