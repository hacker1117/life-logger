import { useState, useRef, useCallback } from 'react'
import { useKnowledge } from '@/hooks/useKnowledge'
import { DayPicker } from '@/components/common/DayPicker'
import { formatTime, getTodayKey } from '@/utils/date'
import { exportKnowledgeMarkdown, downloadFile } from '@/utils/export'

export function KnowledgeTab() {
  const { groups, loading, addEntry, removeEntry } = useKnowledge()
  const [input, setInput] = useState('')
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    await addEntry(text)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, addEntry])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Desktop: Enter to submit, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleExport = () => {
    const md = exportKnowledgeMarkdown(displayGroups)
    const today = getTodayKey()
    downloadFile(md, `知识碎片_${today}.md`, 'text/markdown;charset=utf-8')
  }

  const displayGroups = filterDate
    ? groups.filter(g => g.dateKey === filterDate)
    : groups

  if (loading) return null

  return (
    <div className="tab-content">
      <div className="toolbar">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowDayPicker(true)}
        >
          📅 {filterDate ? groups.find(g => g.dateKey === filterDate)?.label : '全部日期'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {filterDate && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFilterDate(null)}
            >
              清除筛选
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
            <p>记录你每天学到的新知识<br />一事一记，聚沙成塔</p>
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
                  title="删除"
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

      <div className="input-row">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder="记录一条新知识…"
          rows={1}
        />
        <button className="btn btn-primary" onClick={handleSubmit}>
          记录
        </button>
      </div>

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
