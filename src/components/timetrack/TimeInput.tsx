/**
 * 时间记录输入组件 - 自然语言解析模式
 * 用户直接输入描述，实时解析出事件和时长
 */
import { useState, useRef, useCallback } from 'react'
import { parseTimeEntry, formatDurationCN } from '@/utils/parseTimeEntry'

interface Props {
  categories: string[]
  onSubmit: (event: string, category: string, duration: number) => void
}

export function TimeInput({ categories, onSubmit }: Props) {
  const [input, setInput] = useState('')
  const [category, setCategory] = useState(categories[0] || '工作')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const parsed = input.trim() ? parseTimeEntry(input) : null

  const handleSubmit = useCallback(() => {
    if (!parsed) return
    onSubmit(parsed.event, category, parsed.duration)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
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

  const hasInput = input.trim().length > 0
  const canSubmit = !!parsed

  return (
    <div className="input-area">
      {/* 分类选择 */}
      <div className="category-pills" style={{ marginBottom: 8 }}>
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

      {/* 输入框 */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={'直接描述你做了什么，例如：\n"和朋友吃饭 1.5小时"\n"阅读《奇特的一生》二十五分钟"'}
        rows={2}
      />

      {/* 解析预览 */}
      {hasInput && (
        canSubmit ? (
          <div className="parse-preview">
            <span className="preview-event">✓ {parsed!.event}</span>
            <span className="preview-duration">{formatDurationCN(parsed!.duration)}</span>
          </div>
        ) : (
          <div className="parse-error">未能识别时长，请包含时间描述（如"30分钟"、"1小时"）</div>
        )
      )}

      {/* 操作栏 */}
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
