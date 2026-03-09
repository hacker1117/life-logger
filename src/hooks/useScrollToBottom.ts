/**
 * 首次数据加载完成后自动滚到底部
 * 后续新增条目时也滚到底部
 */
import { useEffect, useRef } from 'react'

export function useScrollToBottom(trigger: unknown) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight
    }
  }, [trigger])

  return ref
}
