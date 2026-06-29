'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const GREEN = '#26c281'
const DARK = 'var(--bg-dark, #050506)'
const PANEL = 'var(--bg-panel, #111113)'
const BORDER = 'rgba(148,163,184,.12)'

const TYPE_ICONS = {
  mention: 'bx-at',
  comment: 'bx-comment',
  comment_reply: 'bx-comment-dots',
  task_assigned: 'bx-user-check',
  status_changed: 'bx-transfer',
  task_completed: 'bx-check-circle',
  due_soon: 'bx-time',
  overdue: 'bx-alarm-exclamation',
  new_task: 'bx-task',
}

const TYPE_COLORS = {
  mention: '#8b5cf6',
  comment: '#3b82f6',
  comment_reply: '#3b82f6',
  task_assigned: GREEN,
  status_changed: '#f59e0b',
  task_completed: GREEN,
  due_soon: '#f59e0b',
  overdue: '#ef4444',
  new_task: GREEN,
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function NotificationBell({ isLight = false, supabaseClient = null, inSidebar = false }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all | unread
  const panelRef = useRef(null)
  const channelRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const json = await res.json()
      setNotifications(json.notifications || [])
      setUnreadCount(json.unread_count || 0)
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Poll every 30s for new notifications (realtime fallback)
  useEffect(() => {
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'read' }),
    })
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read_all' }),
    })
  }

  const archive = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((c) => {
      const n = notifications.find((n) => n.id === id)
      return n && !n.is_read ? Math.max(0, c - 1) : c
    })
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'archive' }),
    })
  }

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id)
    if (n.deep_link) {
      setOpen(false)
      // Navigate to deep link — for now use hash-based navigation
      window.location.href = n.deep_link
    }
  }

  const visible = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications
  const bg = isLight ? '#fff' : PANEL
  const text = isLight ? '#0f172a' : '#e2e8f0'
  const subtext = isLight ? '#64748b' : '#94a3b8'
  const borderColor = isLight ? 'rgba(15,23,42,.1)' : BORDER

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); if (!open) loadNotifications() }}
        className={inSidebar ? 'nav-item nav-button' : undefined}
        data-tooltip={inSidebar ? 'Notificações' : undefined}
        aria-label="Notificações"
        style={inSidebar ? { position: 'relative' } : {
          position: 'relative', background: 'transparent', border: 'none',
          cursor: 'pointer', color: isLight ? '#475569' : '#94a3b8',
          padding: '6px 8px', borderRadius: 8, display: 'flex', alignItems: 'center',
          transition: 'color .15s',
        }}
      >
        <i className="bx bx-bell" style={{ fontSize: 20 }} />
        {inSidebar && <span className="nav-label">Notificações</span>}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: inSidebar ? 3 : 3,
            minWidth: 16, height: 16, borderRadius: 999,
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 60, left: 80,
          width: 360, maxHeight: 520,
          background: bg, border: `1px solid ${borderColor}`,
          borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.35)',
          display: 'flex', flexDirection: 'column',
          zIndex: 99999,
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: text }}>Notificações</span>
              {unreadCount > 0 && (
                <span style={{ background: GREEN + '22', color: GREEN, fontSize: 11, fontWeight: 700, borderRadius: 5, padding: '1px 7px' }}>
                  {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: GREEN, fontSize: 11, fontWeight: 600 }}
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, padding: '0 16px' }}>
            {['all', 'unread'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '8px 12px', fontSize: 12, fontWeight: 600,
                  color: filter === f ? GREEN : subtext,
                  borderBottom: filter === f ? `2px solid ${GREEN}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {f === 'all' ? 'Todas' : 'Não lidas'}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading && (
              <div style={{ padding: 20, textAlign: 'center', color: subtext, fontSize: 13 }}>Carregando...</div>
            )}
            {!loading && visible.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: subtext, fontSize: 13 }}>
                <i className="bx bx-bell-off" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: .5 }} />
                Nenhuma notificação
              </div>
            )}
            {visible.map((n) => {
              const icon = TYPE_ICONS[n.type] || 'bx-bell'
              const color = TYPE_COLORS[n.type] || GREEN
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    cursor: n.deep_link ? 'pointer' : 'default',
                    background: n.is_read ? 'transparent' : (isLight ? 'rgba(38,194,129,.06)' : 'rgba(38,194,129,.05)'),
                    borderBottom: `1px solid ${borderColor}`,
                    transition: 'background .12s',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <i className={`bx ${icon}`} style={{ fontSize: 16, color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: n.is_read ? 500 : 700, color: text, lineHeight: 1.4 }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: 11, color: subtext, flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                    </div>
                    {n.body && <p style={{ fontSize: 12, color: subtext, margin: '2px 0 0', lineHeight: 1.4 }}>{n.body}</p>}
                    {!n.is_read && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, display: 'inline-block', marginTop: 4 }} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); archive(n.id) }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: subtext, padding: 2, flexShrink: 0, opacity: .6 }}
                    title="Arquivar"
                  >
                    <i className="bx bx-x" style={{ fontSize: 16 }} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
