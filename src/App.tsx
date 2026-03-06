import { useState } from 'react'
import type { TabType } from '@/types'
import { TabBar } from '@/components/common/TabBar'
import { KnowledgeTab } from '@/components/knowledge/KnowledgeTab'
import { TimetrackTab } from '@/components/timetrack/TimetrackTab'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('knowledge')

  return (
    <div className="app-layout">
      <TabBar active={activeTab} onChange={setActiveTab} />
      {activeTab === 'knowledge' ? <KnowledgeTab /> : <TimetrackTab />}
    </div>
  )
}
