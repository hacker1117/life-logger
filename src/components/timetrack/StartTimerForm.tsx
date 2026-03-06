import { useState } from 'react'

interface Props {
  categories: string[]
  onStart: (event: string, category: string) => void
  onManualAdd: () => void
}

export function StartTimerForm({ categories, onStart, onManualAdd }: Props) {
  const [event, setEvent] = useState('')
  const [category, setCategory] = useState(categories[0] || '')

  const handleStart = () => {
    const text = event.trim()
    if (!text || !category) return
    onStart(text, category)
    setEvent('')
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <div className="form-group" style={{ marginBottom: 8 }}>
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
      <div className="input-row" style={{ padding: 0, background: 'none', border: 'none' }}>
        <input
          type="text"
          value={event}
          onChange={e => setEvent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleStart() }}
          placeholder="正在做什么…"
        />
        <button className="btn btn-primary" onClick={handleStart}>
          ▶ 开始
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onManualAdd}
          title="手动添加"
        >
          ✏️
        </button>
      </div>
    </div>
  )
}
