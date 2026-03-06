/**
 * 导出工具函数
 */
import type { KnowledgeEntry, TimeEntry, DayGroup } from '@/types'
import { formatTime, formatDuration } from './date'

/** 知识碎片导出为 Markdown */
export function exportKnowledgeMarkdown(groups: DayGroup<KnowledgeEntry>[]): string {
  return groups.map(g => {
    const header = `## ${g.label}`
    const items = g.entries.map(e => {
      const time = formatTime(e.createdAt)
      return `- [${time}] ${e.content}`
    }).join('\n')
    return `${header}\n\n${items}`
  }).join('\n\n---\n\n')
}

/** 时间记录导出为 CSV */
export function exportTimeCSV(groups: DayGroup<TimeEntry>[]): string {
  const header = '日期,时间,事件,分类,时长(分钟)'
  const rows = groups.flatMap(g =>
    g.entries.map(e => {
      const time = formatTime(e.createdAt)
      // 如果内容包含逗号或引号，用引号包裹
      const event = e.event.includes(',') || e.event.includes('"')
        ? `"${e.event.replace(/"/g, '""')}"`
        : e.event
      return `${g.dateKey},${time},${event},${e.category},${e.duration}`
    })
  )
  return [header, ...rows].join('\n')
}

/** 触发文件下载 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
