'use client'
import { useState, useEffect, useRef } from 'react'

const GREEN = '#26c281'
const CLIENT_COLORS = ['#3b82f6', '#26c281', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444', '#f97316']

function getClientColor(name) {
  if (!name) return '#334155'
  return CLIENT_COLORS[name.charCodeAt(0) % CLIENT_COLORS.length]
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function ClientAvatar({ name, size = 24 }) {
  const color = getClientColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, flexShrink: 0,
      background: color + '28', border: `1px solid ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color,
    }}>
      {getInitials(name)}
    </div>
  )
}

export default function ClientFilterPicker({ clients = [], value = '', onChange, isLight = false }) {
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

  const selected = clients.find(c => c.id === value)
  const filtered = clients.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const isActive = !!value
  const label = selected ? selected.name : 'Todos os clientes'
  const color = selected ? getClientColor(selected.name) : null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: bg, border: `1px solid ${isActive ? (color + '66') : border}`,
          borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
          minHeight: 34, transition: 'border-color 0.15s',
        }}
      >
        <i className="bx bx-buildings" style={{ fontSize: 15, color: isActive ? color : subtext, flexShrink: 0 }} />

        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ClientAvatar name={selected.name} size={18} />
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{selected.name}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, display: 'flex', alignItems: 'center', marginLeft: 2, opacity: 0.7 }}
            >
              <i className="bx bx-x" style={{ fontSize: 14 }} />
            </button>
          </div>
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
          width: 240, overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)', borderRadius: 7, padding: '5px 10px' }}>
              <i className="bx bx-search" style={{ fontSize: 14, color: subtext }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                style={{ background: 'none', border: 'none', outline: 'none', color: text, fontSize: 12, width: '100%' }}
              />
            </div>
          </div>

          {/* "Todos" option */}
          <div style={{ padding: '6px 8px', borderBottom: `1px solid ${border}` }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: !value ? GREEN + '18' : 'transparent',
                color: !value ? GREEN : subtext,
                fontSize: 12, fontWeight: 600, textAlign: 'left',
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(100,116,139,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bx bx-buildings" style={{ fontSize: 13, color: subtext }} />
              </div>
              <span>Todos os clientes</span>
              {!value && <i className="bx bx-check" style={{ marginLeft: 'auto', color: GREEN }} />}
            </button>
          </div>

          {/* Client list */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 8px' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 8px', fontSize: 12, color: subtext, textAlign: 'center' }}>Nenhum cliente encontrado</div>
            )}
            {filtered.map(c => {
              const sel = c.id === value
              const clr = getClientColor(c.name)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    background: sel ? clr + '18' : 'transparent',
                    fontSize: 12, textAlign: 'left', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = hoverBg }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
                >
                  <ClientAvatar name={c.name} size={26} />
                  <span style={{ flex: 1, fontWeight: sel ? 700 : 500, color: sel ? text : text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </span>
                  {sel && <i className="bx bx-check" style={{ color: clr, fontSize: 16, flexShrink: 0 }} />}
                </button>
              )
            })}
          </div>

          {/* Footer clear */}
          {value && (
            <div style={{ padding: '8px 12px', borderTop: `1px solid ${border}` }}>
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false) }}
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
