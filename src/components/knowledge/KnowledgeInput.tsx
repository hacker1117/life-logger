import { useState, useRef, useCallback } from 'react'

interface Props {
  onSubmit: (content: string) => void
}

export function KnowledgeInput({ onSubmit }: Props) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    const text = input.trim()
    if (!text) return
    onSubmit(text)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, onSubmit])

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
      <textarea
        ref={textareaRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="记录一条新知识…"
        rows={2}
      />
      <div className="input-row-actions" style={{ marginTop: 8 }}>
        <span className="input-hint">Enter 保存 · Shift+Enter 换行</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={!input.trim()}
          style={{ opacity: input.trim() ? 1 : 0.4 }}
        >
          记录
        </button>
      </div>
    </div>
  )
}
