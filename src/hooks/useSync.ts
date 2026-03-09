/**
 * 云同步 Hook
 * - 管理 syncKey 的读写
 * - 提供手动同步触发
 * - App 启动时自动同步一次
 */
import { useState, useEffect, useCallback } from 'react'
import { getSyncKey, setSyncKey, syncAll } from '@/store/sync'
import { supabase } from '@/store/supabase'

export type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'disabled'

export function useSync(onSynced?: () => void) {
  const [syncKey, setSyncKeyState]   = useState('')
  const [status, setStatus]          = useState<SyncStatus>(supabase ? 'idle' : 'disabled')
  const [lastSync, setLastSync]      = useState<number>(0)
  const [summary, setSummary]        = useState('')

  useEffect(() => {
    getSyncKey().then(setSyncKeyState)
  }, [])

  const doSync = useCallback(async () => {
    if (!supabase) return
    setStatus('syncing')
    const since = lastSync
    const result = await syncAll(since)
    if (result.error) {
      setStatus('error')
      setSummary(result.error)
    } else {
      setStatus('ok')
      setLastSync(Date.now())
      setSummary(`↑${result.pushed} ↓${result.pulled}`)
      if (result.pulled > 0) onSynced?.()
    }
  }, [lastSync, onSynced])

  /** 首次加载自动同步 */
  useEffect(() => {
    if (supabase) doSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 用户粘贴新 sync key */
  const updateSyncKey = useCallback(async (key: string) => {
    await setSyncKey(key)
    setSyncKeyState(key)
    // 用新 key 做一次全量同步
    if (supabase) await syncAll(0)
    onSynced?.()
  }, [onSynced])

  return { syncKey, status, summary, lastSync, doSync, updateSyncKey }
}
