import type { DayGroup } from '@/types'
import { formatDateShort } from '@/utils/date'

interface Props<T> {
  groups: DayGroup<T>[]
  onSelect: (dateKey: string) => void
  onClose: () => void
}

export function DayPicker<T>({ groups, onSelect, onClose }: Props<T>) {
  return (
    <div className="day-picker-overlay" onClick={onClose}>
      <div className="day-picker-sheet" onClick={e => e.stopPropagation()}>
        <h3>选择日期查看</h3>
        {groups.length === 0 && (
          <p style={{ color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
            暂无记录
          </p>
        )}
        {groups.map(g => (
          <div
            key={g.dateKey}
            className="day-list-item"
            onClick={() => { onSelect(g.dateKey); onClose() }}
          >
            <span className="day-label">{g.label}</span>
            <span className="day-count">
              {formatDateShort(g.dateKey)} · {g.entries.length} 条
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
