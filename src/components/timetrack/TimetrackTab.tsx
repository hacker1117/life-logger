import { useState } from 'react'
import { useTimetrack } from '@/hooks/useTimetrack'
import { DayPicker } from '@/components/common/DayPicker'
import { TimerPanel } from './TimerPanel'
import { StartTimerForm } from './StartTimerForm'
import { ManualAddModal } from './ManualAddModal'
import { DayStats } from './DayStats'
import { formatTime, formatDuration, getTodayKey } from '@/utils/date'
import { exportTimeCSV, downloadFile } from '@/utils/export'

export function TimetrackTab() {
  const {
    groups, categories, timer, elapsed, loading,
    startTimer, stopTimer, cancelTimer, addEntry, removeEntry,
  } = useTimetrack()

  const [showDayPicker, setShowDayPicker] = useState(false)
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [showManualAdd, setShowManualAdd] = useState(false)

  const handleExport = () => {
    const csv = exportTimeCSV(displayGroups)
    const today = getTodayKey()
    downloadFile(csv, `时间记录_${today}.csv`, 'text/csv;charset=utf-8')
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
            导出 CSV
          </button>
        </div>
      </div>

      <div className="scroll-area">
        {/* Active timer */}
        <TimerPanel
          timer={timer}
          elapsed={elapsed}
          categories={categories}
          onStart={startTimer}
          onStop={stopTimer}
          onCancel={cancelTimer}
        />

        {displayGroups.length === 0 && !timer.isRunning && (
          <div className="empty-state">
            <div className="empty-icon">⏱</div>
            <p>记录你的时间花费<br />每天、每周、每月回顾</p>
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
                  title="删除"
                >
                  ×
                </button>
                <div className="entry-time">{formatTime(entry.createdAt)}</div>
                <div className="entry-content">{entry.event}</div>
                <div className="entry-meta">
                  <span className="cat-tag">{entry.category}</span>
                  <span>{formatDuration(entry.duration)}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom input area */}
      {!timer.isRunning && (
        <div style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          paddingBottom: 'calc(12px + var(--safe-bottom))',
        }}>
          <StartTimerForm
            categories={categories}
            onStart={startTimer}
            onManualAdd={() => setShowManualAdd(true)}
          />
        </div>
      )}

      {showDayPicker && (
        <DayPicker
          groups={groups}
          onSelect={setFilterDate}
          onClose={() => setShowDayPicker(false)}
        />
      )}

      {showManualAdd && (
        <ManualAddModal
          categories={categories}
          onSubmit={addEntry}
          onClose={() => setShowManualAdd(false)}
        />
      )}
    </div>
  )
}
