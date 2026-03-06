/**
 * 时间记录输入 - 自然语言解析，分类可选
 */
import { useState, useRef, useCallback } from 'react'
import { parseTimeEntry, formatDurationCN } from '@/utils/parseTimeEntry'

interface Props {
  categories: string[]
  onSubmit: (event: string, duration: number, category?: string) => void
}

export function TimeInput({ categories, onSubmit }: Props) {
  const [input, setInput]       = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const parsed = input.trim() ? parseTimeEntry(input) : null
  const canSubmit = !!parsed

  const handleSubmit = useCallback(() => {
    if (!parsed) return
    onSubmit(parsed.event, parsed.duration, category)
    setInput('')
    setCategory(undefined)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [parsed, category, onSubmit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  return (
    <div className="input-area">
      {/* 可选分类 */}
      <div className="category-pills" style={{ marginBottom: 8 }}>
        <span className="input-hint" style={{ alignSelf: 'center', marginRight: 4 }}>分类：</span>
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

      {/* 输入框 */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={'直接描述，例如：\n"和朋友吃饭 1.5小时"\n"阅读《奇特的一生》二十五分钟"'}
        rows={2}
      />

      {/* 实时解析预览 */}
      {input.trim() && (
        canSubmit ? (
          <div className="parse-preview">
            <span className="preview-event">✓ {parsed!.event}</span>
            <span className="preview-duration">{formatDurationCN(parsed!.duration)}</span>
          </div>
        ) : (
          <div className="parse-error">未能识别时长，请包含时间描述（如"30分钟"、"1小时"）</div>
        )
      )}

      <div className="input-row-actions" style={{ marginTop: 8 }}>
        <span className="input-hint">Enter 保存 · Shift+Enter 换行</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.4 }}
        >
          记录
        </button>
      </div>
    </div>
  )
}
