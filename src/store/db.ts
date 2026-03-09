/**
 * IndexedDB 存储层
 * 统一管理所有数据持久化
 */

const DB_NAME = 'life-logger'
const DB_VERSION = 2  // bump version for schema changes

const STORE_KNOWLEDGE = 'knowledge'
const STORE_TIMETRACK = 'timetrack'
const STORE_SETTINGS  = 'settings'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (event) => {
      const db = req.result
      const oldVersion = event.oldVersion

      if (oldVersion < 1) {
        const ks = db.createObjectStore(STORE_KNOWLEDGE, { keyPath: 'id' })
        ks.createIndex('createdAt', 'createdAt', { unique: false })
        const ts = db.createObjectStore(STORE_TIMETRACK, { keyPath: 'id' })
        ts.createIndex('createdAt', 'createdAt', { unique: false })
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' })
      }
      // v2: added updatedAt field to entries (handled in app layer)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror  = () => reject(req.error)
  })
}

async function getAllByDate<T extends { createdAt: number }>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = () => {
      const items = req.result as T[]
      items.sort((a, b) => b.createdAt - a.createdAt)
      resolve(items)
    }
    req.onerror = () => reject(req.error)
  })
}

async function addItem<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).add(item)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

async function putItem<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

async function removeItem(storeName: string, id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

async function getKV<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, 'readonly').objectStore(storeName).get(key)
    req.onsuccess = () => resolve(req.result?.value as T | undefined)
    req.onerror   = () => reject(req.error)
  })
}

async function setKV<T>(storeName: string, key: string, value: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put({ key, value })
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

// ---- Public API ----

import type { KnowledgeEntry, TimeEntry } from '@/types'

export const knowledgeDB = {
  getAll:  ()                     => getAllByDate<KnowledgeEntry>(STORE_KNOWLEDGE),
  add:     (item: KnowledgeEntry) => addItem(STORE_KNOWLEDGE, item),
  put:     (item: KnowledgeEntry) => putItem(STORE_KNOWLEDGE, item),
  remove:  (id: string)           => removeItem(STORE_KNOWLEDGE, id),
}

export const timetrackDB = {
  getAll:  ()                  => getAllByDate<TimeEntry>(STORE_TIMETRACK),
  add:     (item: TimeEntry)   => addItem(STORE_TIMETRACK, item),
  put:     (item: TimeEntry)   => putItem(STORE_TIMETRACK, item),
  remove:  (id: string)        => removeItem(STORE_TIMETRACK, id),
}

export const settingsDB = {
  getCategories:  ()                   => getKV<string[]>(STORE_SETTINGS, 'categories'),
  setCategories:  (cats: string[])     => setKV(STORE_SETTINGS, 'categories', cats),
  getSyncKey:     ()                   => getKV<string>(STORE_SETTINGS, 'syncKey'),
  setSyncKey:     (key: string)        => setKV(STORE_SETTINGS, 'syncKey', key),
}
