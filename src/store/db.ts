/**
 * IndexedDB 存储层
 * 统一管理所有数据持久化，上层通过 store 接口访问
 */

const DB_NAME = 'daily-record'
const DB_VERSION = 1

const STORE_KNOWLEDGE = 'knowledge'
const STORE_TIMETRACK = 'timetrack'
const STORE_TIMER = 'timer'
const STORE_SETTINGS = 'settings'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_KNOWLEDGE)) {
        const ks = db.createObjectStore(STORE_KNOWLEDGE, { keyPath: 'id' })
        ks.createIndex('createdAt', 'createdAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_TIMETRACK)) {
        const ts = db.createObjectStore(STORE_TIMETRACK, { keyPath: 'id' })
        ts.createIndex('createdAt', 'createdAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(STORE_TIMER)) {
        db.createObjectStore(STORE_TIMER, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** 通用：获取某个 store 的所有记录，按 createdAt 降序 */
async function getAllByDate<T extends { createdAt: number }>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => {
      const items = req.result as T[]
      items.sort((a, b) => b.createdAt - a.createdAt)
      resolve(items)
    }
    req.onerror = () => reject(req.error)
  })
}

/** 通用：添加记录 */
async function add<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).add(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 通用：删除记录 */
async function remove(storeName: string, id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** 通用：更新记录 */
async function put<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** KV 读取 */
async function getKV<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).get(key)
    req.onsuccess = () => resolve(req.result?.value as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

/** KV 写入 */
async function setKV<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put({ key, value })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ---- 对外接口 ----

import type { KnowledgeEntry, TimeEntry, TimerState } from '@/types'

export const knowledgeDB = {
  getAll: () => getAllByDate<KnowledgeEntry>(STORE_KNOWLEDGE),
  add: (item: KnowledgeEntry) => add(STORE_KNOWLEDGE, item),
  remove: (id: string) => remove(STORE_KNOWLEDGE, id),
}

export const timetrackDB = {
  getAll: () => getAllByDate<TimeEntry>(STORE_TIMETRACK),
  add: (item: TimeEntry) => add(STORE_TIMETRACK, item),
  remove: (id: string) => remove(STORE_TIMETRACK, id),
  update: (item: TimeEntry) => put(STORE_TIMETRACK, item),
}

export const timerDB = {
  get: () => getKV<TimerState>(STORE_TIMER, 'current'),
  set: (state: TimerState) => setKV(STORE_TIMER, 'current', state),
}

export const settingsDB = {
  getCategories: () => getKV<string[]>(STORE_SETTINGS, 'categories'),
  setCategories: (cats: string[]) => setKV(STORE_SETTINGS, 'categories', cats),
}
