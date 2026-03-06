import { useState } from 'react'

interface Props {
  categories: string[]
  onSubmit: (event: string, category: string, duration: number) => void
  onClose: () => void
}

export function ManualAddModal({ categories, onSubmit, onClose }: Props) {
  const [event, setEvent] = useState('')
  const [category, setCategory] = useState(categories[0] || '')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')

  const handleSubmit = () => {
    const text = event.trim()
    if (!text || !category) return
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    const total = h * 60 + m
    if (total <= 0) return
    onSubmit(text, category, total)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>手动添加</h3>

        <div className="form-group">
          <label>做了什么</label>
          <input
            type="text"
            value={event}
            onChange={e => setEvent(e.target.value)}
            placeholder="事件名称"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>分类</label>
          <div className="category-pills">
            {categories.map(c => (
              <button
                key={c}
                className={`category-pill ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>花了多长时间</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              inputMode="numeric"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="0"
              style={{ width: 80, textAlign: 'center' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>小时</span>
            <input
              type="number"
              inputMode="numeric"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              placeholder="0"
              style={{ width: 80, textAlign: 'center' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>分钟</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>
    </div>
  )
}
