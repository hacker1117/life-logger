import { useState } from 'react'
import { useKnowledge } from '@/hooks/useKnowledge'
import { DayPicker } from '@/components/common/DayPicker'
import { KnowledgeInput } from './KnowledgeInput'
import { formatTime, getTodayKey } from '@/utils/date'
import { exportKnowledgeMarkdown, downloadFile } from '@/utils/export'

export function KnowledgeTab() {
  const { groups, loading, addEntry, removeEntry } = useKnowledge()
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)

  const displayGroups = filterDate
    ? groups.filter(g => g.dateKey === filterDate)
    : groups

  const handleExport = () => {
    const md = exportKnowledgeMarkdown(displayGroups)
    downloadFile(md, `知识碎片_${getTodayKey()}.md`, 'text/markdown;charset=utf-8')
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
            导出 MD
          </button>
        </div>
      </div>

      <div className="scroll-area">
        {displayGroups.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💡</div>
            <p>记录每天学到的新知识<br />一事一记，聚沙成塔</p>
          </div>
        )}

        {displayGroups.map(group => (
          <div key={group.dateKey}>
            <div className="date-header">{group.label}</div>
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
                <div className="entry-content">{entry.content}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <KnowledgeInput onSubmit={addEntry} />

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
