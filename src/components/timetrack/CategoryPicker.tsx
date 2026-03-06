/**
 * CategoryPicker
 * 内联在条目卡片上，点击标签弹出选择面板
 */
import { useState, useRef, useEffect } from 'react'

interface Props {
  value?: string
  categories: string[]
  onChange: (cat: string | undefined) => void
}

export function CategoryPicker({ value, categories, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [newCat, setNewCat] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (cat: string) => {
    onChange(cat === value ? undefined : cat)  // 再次点击同一个 = 取消
    setOpen(false)
  }

  const handleAddNew = () => {
    const trimmed = newCat.trim()
    if (!trimmed) return
    onChange(trimmed)
    setNewCat('')
    setOpen(false)
  }

  return (
    <div className="category-picker" ref={ref}>
      {/* 触发按钮 */}
      <button
        className={`cat-badge ${value ? 'has-value' : 'empty'}`}
        onClick={() => setOpen(o => !o)}
        title={value ? `分类: ${value}` : '添加分类'}
      >
        {value ? (
          <><span className="cat-badge-text">{value}</span><span className="cat-badge-arrow">▾</span></>
        ) : (
          <span className="cat-badge-add">+ 分类</span>
        )}
      </button>

      {/* 下拉面板 */}
      {open && (
        <div className="cat-dropdown">
          <div className="cat-dropdown-list">
            {categories.map(c => (
              <button
                key={c}
                className={`cat-option ${value === c ? 'active' : ''}`}
                onClick={() => handleSelect(c)}
              >
                {c}
                {value === c && <span className="cat-check">✓</span>}
              </button>
            ))}
          </div>
          <div className="cat-dropdown-input">
            <input
              type="text"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddNew() }}
              placeholder="新分类…"
            />
            <button onClick={handleAddNew}>+</button>
          </div>
          {value && (
            <button
              className="cat-clear"
              onClick={() => { onChange(undefined); setOpen(false) }}
            >
              清除分类
            </button>
          )}
        </div>
      )}
    </div>
  )
}
