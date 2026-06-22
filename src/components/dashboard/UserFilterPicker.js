'use client'
import { useState, useEffect, useRef } from 'react'

const GREEN = '#26c281'
const AVATAR_COLORS = ['#26c281', '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e']

function getAvatarColor(name) {
  if (!name) return '#334155'
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function UserAvatar({ user, size = 28 }) {
  const name = user?.full_name || user?.email || ''
  const color = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
    }} title={name}>
      {getInitials(name)}
    </div>
  )
}

// ── Chip ──────────────────────────────────────────────────────
function UserChip({ user, onRemove }) {
  const name = user?.full_name || user?.email || ''
  const color = getAvatarColor(name)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: color + '22', border: `1px solid ${color}44`,
      borderRadius: 999, padding: '2px 8px 2px 3px',
      fontSize: 12, fontWeight: 600, color,
    }}>
      <UserAvatar user={user} size={18} />
      <span>{name}</span>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onRemove(user.id) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2, opacity: 0.7 }}
      >
        <i className="bx bx-x" style={{ fontSize: 14 }} />
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function UserFilterPicker({ users = [], value = [], onChange, currentUserId, isLight = false }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const bg = isLight ? '#fff' : 'var(--bg-panel, #111113)'
  const border = isLight ? 'rgba(15,23,42,.1)' : 'rgba(255,255,255,0.1)'
  const text = isLight ? '#0f172a' : '#e2e8f0'
  const subtext = isLight ? '#64748b' : '#94a3b8'
  const hoverBg = isLight ? '#f8fafc' : 'rgba(255,255,255,0.04)'

  const filtered = users.filter(u => {
    const name = (u.full_name || u.email || '').toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const selectedUsers = users.filter(u => value.includes(u.id))
  const myUser = users.find(u => u.id === currentUserId)

  function toggle(userId) {
    if (value.includes(userId)) onChange(value.filter(id => id !== userId))
    else onChange([...value, userId])
  }

  function selectMine() {
    if (currentUserId) onChange([currentUserId])
    setOpen(false)
  }

  function selectAll() {
    onChange([])
    setOpen(false)
  }

  const label = value.length === 0
    ? 'Todos os responsáveis'
    : value.length === 1 && value[0] === currentUserId
      ? 'Minhas tarefas'
      : `${value.length} responsável(is)`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button + chips */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          background: bg, border: `1px solid ${value.length > 0 ? GREEN + '66' : border}`,
          borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
          minHeight: 34, transition: 'border-color 0.15s',
        }}
      >
        <i className="bx bx-user" style={{ fontSize: 15, color: value.length > 0 ? GREEN : subtext, flexShrink: 0 }} />

        {selectedUsers.length > 0 ? (
          selectedUsers.map(u => (
            <UserChip key={u.id} user={u} onRemove={id => onChange(value.filter(v => v !== id))} />
          ))
        ) : (
          <span style={{ fontSize: 12, color: subtext, fontWeight: 500 }}>{label}</span>
        )}

        <i className={`bx bx-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 14, color: subtext, marginLeft: 'auto', flexShrink: 0 }} />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9000,
          background: bg, border: `1px solid ${border}`,
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          width: 260, overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', borderRadius: 7, padding: '5px 10px' }}>
              <i className="bx bx-search" style={{ fontSize: 14, color: subtext }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar usuário..."
                style={{ background: 'none', border: 'none', outline: 'none', color: text, fontSize: 12, width: '100%' }}
              />
            </div>
          </div>

          {/* Quick options */}
          <div style={{ padding: '6px 8px', borderBottom: `1px solid ${border}` }}>
            {/* Minhas tarefas */}
            {myUser && (
              <button
                type="button"
                onClick={selectMine}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: value.length === 1 && value[0] === currentUserId ? GREEN + '18' : 'transparent',
                  color: value.length === 1 && value[0] === currentUserId ? GREEN : text,
                  fontSize: 12, fontWeight: 600, textAlign: 'left',
                }}
              >
                <UserAvatar user={myUser} size={24} />
                <span>Minhas tarefas</span>
                {value.length === 1 && value[0] === currentUserId && (
                  <i className="bx bx-check" style={{ marginLeft: 'auto', color: GREEN }} />
                )}
              </button>
            )}
            {/* Todos */}
            <button
              type="button"
              onClick={selectAll}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: value.length === 0 ? GREEN + '18' : 'transparent',
                color: value.length === 0 ? GREEN : subtext,
                fontSize: 12, fontWeight: 600, textAlign: 'left',
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(100,116,139,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bx bx-group" style={{ fontSize: 14, color: subtext }} />
              </div>
              <span>Todos os responsáveis</span>
              {value.length === 0 && <i className="bx bx-check" style={{ marginLeft: 'auto', color: GREEN }} />}
            </button>
          </div>

          {/* User list */}
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '6px 8px' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 8px', fontSize: 12, color: subtext, textAlign: 'center' }}>Nenhum usuário encontrado</div>
            )}
            {filtered.map(u => {
              const selected = value.includes(u.id)
              const name = u.full_name || u.email || ''
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: selected ? GREEN + '18' : 'transparent',
                    color: selected ? text : text,
                    fontSize: 12, textAlign: 'left', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = hoverBg }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
                >
                  <UserAvatar user={u} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: selected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    {u.role && <div style={{ fontSize: 10, color: subtext, textTransform: 'capitalize' }}>{u.role.replace('_', ' ')}</div>}
                  </div>
                  {selected && <i className="bx bx-check" style={{ color: GREEN, fontSize: 16, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          {value.length > 0 && (
            <div style={{ padding: '8px 12px', borderTop: `1px solid ${border}` }}>
              <button
                type="button"
                onClick={() => onChange([])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtext, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <i className="bx bx-x" style={{ fontSize: 14 }} /> Limpar filtro
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
