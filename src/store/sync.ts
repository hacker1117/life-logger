/**
 * 云同步层 - 增量双向同步
 *
 * 策略：last-write-wins，以 updated_at 时间戳判断哪端更新
 * 同步密钥（syncKey）= 用户数据隔离标识，两台设备填同一个 key 即可共享
 */
import { supabase } from './supabase'
import { knowledgeDB, timetrackDB, settingsDB } from './db'
import type { KnowledgeEntry, TimeEntry } from '@/types'
import { uid } from '@/utils/date'

// ---------- 同步 Key 管理 ----------

/** 获取（或生成）本设备的 sync key */
export async function getSyncKey(): Promise<string> {
  const saved = await settingsDB.getSyncKey()
  if (saved) return saved
  const key = uid() + uid()   // 生成一个随机 32 位 key
  await settingsDB.setSyncKey(key)
  return key
}

/** 覆盖 sync key（用户手动粘贴另一台设备的 key） */
export async function setSyncKey(key: string): Promise<void> {
  await settingsDB.setSyncKey(key.trim())
}

// ---------- 同步状态 ----------

interface SyncResult {
  pushed: number
  pulled: number
  error?: string
}

// ---------- 知识碎片同步 ----------

async function syncKnowledge(syncKey: string, since: number): Promise<{ pushed: number; pulled: number }> {
  if (!supabase) return { pushed: 0, pulled: 0 }

  // 1. 拉取远端 since 之后的变更
  const { data: remote, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('sync_key', syncKey)
    .gt('updated_at', since)

  if (error) throw error

  // 2. 应用远端变更到本地
  const local = await knowledgeDB.getAll()
  const localMap = new Map(local.map(e => [e.id, e]))
  let pulled = 0

  for (const r of (remote ?? [])) {
    const entry: KnowledgeEntry = {
      id: r.id,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
    const existing = localMap.get(r.id)
    if (r.deleted) {
      if (existing) await knowledgeDB.remove(r.id)
    } else if (!existing || existing.updatedAt < entry.updatedAt) {
      await knowledgeDB.put(entry)
      pulled++
    }
  }

  // 3. 推送本地变更（本地 updated_at > since 的）
  const toUpload = local.filter(e => e.updatedAt > since)
  let pushed = 0

  if (toUpload.length > 0) {
    const rows = toUpload.map(e => ({
      id:         e.id,
      sync_key:   syncKey,
      content:    e.content,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
      deleted:    false,
    }))
    const { error: upErr } = await supabase
      .from('knowledge_entries')
      .upsert(rows, { onConflict: 'id' })
    if (upErr) throw upErr
    pushed = rows.length
  }

  return { pushed, pulled }
}

// ---------- 时间记录同步 ----------

async function syncTimetrack(syncKey: string, since: number): Promise<{ pushed: number; pulled: number }> {
  if (!supabase) return { pushed: 0, pulled: 0 }

  const { data: remote, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('sync_key', syncKey)
    .gt('updated_at', since)

  if (error) throw error

  const local = await timetrackDB.getAll()
  const localMap = new Map(local.map(e => [e.id, e]))
  let pulled = 0

  for (const r of (remote ?? [])) {
    const entry: TimeEntry = {
      id:        r.id,
      event:     r.event,
      category:  r.category ?? undefined,
      duration:  r.duration,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
    const existing = localMap.get(r.id)
    if (r.deleted) {
      if (existing) await timetrackDB.remove(r.id)
    } else if (!existing || existing.updatedAt < entry.updatedAt) {
      await timetrackDB.put(entry)
      pulled++
    }
  }

  const toUpload = local.filter(e => e.updatedAt > since)
  let pushed = 0

  if (toUpload.length > 0) {
    const rows = toUpload.map(e => ({
      id:         e.id,
      sync_key:   syncKey,
      event:      e.event,
      category:   e.category ?? null,
      duration:   e.duration,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
      deleted:    false,
    }))
    const { error: upErr } = await supabase
      .from('time_entries')
      .upsert(rows, { onConflict: 'id' })
    if (upErr) throw upErr
    pushed = rows.length
  }

  return { pushed, pulled }
}

// ---------- 主同步入口 ----------

/** 执行一次完整同步，返回结果摘要 */
export async function syncAll(since = 0): Promise<SyncResult> {
  if (!supabase) return { pushed: 0, pulled: 0, error: 'Supabase 未配置' }

  try {
    const syncKey = await getSyncKey()
    const [k, t] = await Promise.all([
      syncKnowledge(syncKey, since),
      syncTimetrack(syncKey, since),
    ])
    return {
      pushed: k.pushed + t.pushed,
      pulled: k.pulled + t.pulled,
    }
  } catch (e) {
    console.error('[sync]', e)
    return { pushed: 0, pulled: 0, error: String(e) }
  }
}

/** 将删除操作同步到云端（软删除） */
export async function syncDelete(table: 'knowledge_entries' | 'time_entries', id: string) {
  if (!supabase) return
  const syncKey = await getSyncKey()
  await supabase
    .from(table)
    .upsert({ id, sync_key: syncKey, deleted: true, updated_at: Date.now() }, { onConflict: 'id' })
}
