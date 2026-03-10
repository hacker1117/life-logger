import { useEffect, useMemo, useRef, useState } from 'react'
import { useTimetrack } from '@/hooks/useTimetrack'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'
import { DayPicker } from '@/components/common/DayPicker'
import { DayStats } from './DayStats'
import { TimeInput } from './TimeInput'
import { CategoryPicker } from './CategoryPicker'
import { formatTime, getTodayKey } from '@/utils/date'
import { formatDurationCN, parseTimeEntry } from '@/utils/parseTimeEntry'
import { exportTimeCSV, downloadFile } from '@/utils/export'
import type { TimeEntry } from '@/types'

function EditEntryModal({
  entry,
  categories,
  onClose,
  onSave,
}: {
  entry: TimeEntry
  categories: string[]
  onClose: () => void
  onSave: (patch: { event: string; duration: number; category?: string }) => void
}) {
  const [input, setInput] = useState(`${entry.event}\n${formatDurationCN(entry.duration)}`)
  const [category, setCategory] = useState<string | undefined>(entry.category)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`
    textareaRef.current.focus()
  }, [])

  const parsed = useMemo(() => (input.trim() ? parseTimeEntry(input) : null), [input])
  const canSave = !!parsed

  const handleChange = (value: string) => {
    setInput(value)
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`
  }

  const handleSave = () => {
    if (!parsed) return
    onSave({ event: parsed.event, duration: parsed.duration, category })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>编辑记录</h3>

        <div className="form-group">
          <label>内容（支持换行，保留时间描述）</label>
          <textarea
            ref={textareaRef}
            className="modal-textarea"
            value={input}
            onChange={e => handleChange(e.target.value)}
            placeholder={'例如：\n和客户开需求会\n1小时20分钟'}
            rows={4}
          />
        </div>

        <div className="form-group">
          <label>分类</label>
          <div className="category-pills">
            <button
              className={`category-pill ${!category ? 'active' : ''}`}
              onClick={() => setCategory(undefined)}
            >
              无
            </button>
            {categories.map(c => (
              <button
                key={c}
                className={`category-pill ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(category === c ? undefined : c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {input.trim() && (
          canSave ? (
            <div className="parse-preview">
              <span className="preview-event">✓ {parsed!.event}</span>
              <span className="preview-duration">{formatDurationCN(parsed!.duration)}</span>
            </div>
          ) : (
            <div className="parse-error">未能识别时长，请包含时间描述（如“2小时”“1小时20分钟”“30分钟”）</div>
          )
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!canSave}>保存</button>
        </div>
      </div>
    </div>
  )
}

export function TimetrackTab() {
  const {
    groups, categories, loading,
    addEntry, updateEntry, updateCategory, removeEntry,
  } = useTimetrack()

  const [showDayPicker, setShowDayPicker] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const displayGroups = filterDate
    ? groups.filter(g => g.dateKey === filterDate)
    : groups

  const scrollRef = useScrollToBottom(loading ? null : displayGroups)

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

      <div className="scroll-area" ref={scrollRef}>
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
              <div
                key={entry.id}
                className="entry-card entry-card-editable"
                onClick={() => setEditingEntry(entry)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setEditingEntry(entry)
                  }
                }}
              >
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeEntry(entry.id)
                  }}
                  aria-label="删除"
                >×</button>

                <div className="entry-time">{formatTime(entry.createdAt)}</div>
                <div className="entry-content">{entry.event}</div>

                <div className="entry-meta">
                  <CategoryPicker
                    value={entry.category}
                    categories={categories}
                    onChange={cat => updateCategory(entry.id, cat)}
                  />
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

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          categories={categories}
          onClose={() => setEditingEntry(null)}
          onSave={(patch) => updateEntry(editingEntry.id, patch)}
        />
      )}
    </div>
  )
}
