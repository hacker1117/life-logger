/**
 * SyncBar - 顶部状态条 + 设置面板
 * 显示同步状态，支持查看/复制/粘贴 syncKey
 */
import { useState } from 'react'
import type { SyncStatus } from '@/hooks/useSync'

interface Props {
  syncKey: string
  status: SyncStatus
  summary: string
  onSync: () => void
  onUpdateKey: (key: string) => void
}

const STATUS_ICON: Record<SyncStatus, string> = {
  idle:     '☁️',
  syncing:  '🔄',
  ok:       '✓',
  error:    '⚠️',
  disabled: '—',
}

export function SyncBar({ syncKey, status, summary, onSync, onUpdateKey }: Props) {
  const [showPanel, setShowPanel] = useState(false)
  const [inputKey, setInputKey]   = useState('')
  const [copied, setCopied]       = useState(false)

  const copyKey = async () => {
    await navigator.clipboard.writeText(syncKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const applyKey = () => {
    if (inputKey.trim()) {
      onUpdateKey(inputKey.trim())
      setInputKey('')
      setShowPanel(false)
    }
  }

  if (status === 'disabled') return null

  return (
    <>
      {/* 细状态条 */}
      <div className="sync-bar" onClick={() => setShowPanel(true)}>
        <span className={`sync-icon ${status}`}>{STATUS_ICON[status]}</span>
        {summary && <span className="sync-summary">{summary}</span>}
        <span className="sync-hint">云同步</span>
      </div>

      {/* 设置面板 */}
      {showPanel && (
        <div className="modal-overlay" onClick={() => setShowPanel(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>☁️ 云同步设置</h3>

            <div className="form-group">
              <label>此设备的同步密钥</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={syncKey}
                  style={{ flex: 1, fontSize: 13, fontFamily: 'monospace', color: 'var(--text-secondary)' }}
                />
                <button className="btn btn-ghost btn-sm" onClick={copyKey}>
                  {copied ? '✓ 已复制' : '复制'}
                </button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                把这串密钥复制到另一台设备，即可同步数据
              </p>
            </div>

            <div className="form-group">
              <label>粘贴另一台设备的密钥（覆盖当前）</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder="粘贴密钥…"
                  style={{ flex: 1, fontSize: 13, fontFamily: 'monospace' }}
                />
                <button className="btn btn-primary btn-sm" onClick={applyKey}>
                  应用
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onSync}>立即同步</button>
              <button className="btn btn-ghost" onClick={() => setShowPanel(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
