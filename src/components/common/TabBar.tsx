import type { TabType } from '@/types'

interface Props {
  active: TabType
  onChange: (tab: TabType) => void
}

export function TabBar({ active, onChange }: Props) {
  return (
    <div className="tab-bar">
      <button
        className={active === 'knowledge' ? 'active' : ''}
        onClick={() => onChange('knowledge')}
      >
        📝 知识碎片
      </button>
      <button
        className={active === 'timetrack' ? 'active' : ''}
        onClick={() => onChange('timetrack')}
      >
        ⏱ 时间记录
      </button>
    </div>
  )
}
