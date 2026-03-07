import { useState, useCallback } from 'react'
import type { TabType } from '@/types'
import { TabBar } from '@/components/common/TabBar'
import { SyncBar } from '@/components/common/SyncBar'
import { KnowledgeTab } from '@/components/knowledge/KnowledgeTab'
import { TimetrackTab } from '@/components/timetrack/TimetrackTab'
import { useSync } from '@/hooks/useSync'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('knowledge')
  const [reloadKey, setReloadKey] = useState(0)

  const triggerReload = useCallback(() => {
    setReloadKey(k => k + 1)
  }, [])

  const { syncKey, status, summary, doSync, updateSyncKey } = useSync(triggerReload)

  return (
    <div className="app-layout">
      <TabBar active={activeTab} onChange={setActiveTab} />
      <SyncBar
        syncKey={syncKey}
        status={status}
        summary={summary}
        onSync={doSync}
        onUpdateKey={updateSyncKey}
      />
      {activeTab === 'knowledge'
        ? <KnowledgeTab key={`k-${reloadKey}`} />
        : <TimetrackTab key={`t-${reloadKey}`} />
      }
    </div>
  )
}
