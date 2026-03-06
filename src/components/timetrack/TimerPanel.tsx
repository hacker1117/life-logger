import type { TimerState } from '@/types'

interface Props {
  timer: TimerState
  elapsed: number // seconds
  categories: string[]
  onStart: (event: string, category: string) => void
  onStop: () => void
  onCancel: () => void
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TimerPanel({ timer, elapsed, onStop, onCancel }: Props) {
  if (!timer.isRunning) return null

  return (
    <div className="timer-display">
      <div className="timer-time">{formatElapsed(elapsed)}</div>
      <div className="timer-label">
        <span className="cat-tag">{timer.category}</span>
        {' '}{timer.event}
      </div>
      <div className="timer-actions">
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>取消</button>
        <button className="btn btn-primary" onClick={onStop}>⏹ 停止并保存</button>
      </div>
    </div>
  )
}
