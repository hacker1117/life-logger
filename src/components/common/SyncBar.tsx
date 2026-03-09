/**
 * SyncBar - 顶部状态条 + 一键同步按钮 + 设置面板
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

  const handleQuickSync = (e: React.MouseEvent) => {
    e.stopPropagation()   // 不触发打开面板
    onSync()
  }

  if (status === 'disabled') return null

  return (
    <>
      {/* 状态条：左侧点击打开设置，右侧一键同步按钮 */}
      <div className="sync-bar">
        {/* 左侧：状态信息，点击打开设置 */}
        <div className="sync-bar-left" onClick={() => setShowPanel(true)}>
          <span className={`sync-icon ${status}`}>{STATUS_ICON[status]}</span>
          {summary && <span className="sync-summary">{summary}</span>}
          <span className="sync-hint">云同步 ›</span>
        </div>

        {/* 右侧：一键同步按钮 */}
        <button
          className="sync-now-btn"
          onClick={handleQuickSync}
          disabled={status === 'syncing'}
          title="立即同步"
        >
          {status === 'syncing' ? '同步中…' : '↻ 同步'}
        </button>
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
              <button className="btn btn-ghost" onClick={() => { onSync(); setShowPanel(false) }}>
                立即同步
              </button>
              <button className="btn btn-ghost" onClick={() => setShowPanel(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
