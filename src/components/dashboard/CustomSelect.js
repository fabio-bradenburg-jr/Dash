'use client'
import { useState, useEffect, useRef } from 'react'

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Selecionar...',
  icon,
  isLight = false,
  disabled = false,
  width,
  style = {},
}) {
  const [open, setOpen] = useState(false)
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
  const hoverBg = isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)'

  const selected = options.find(o => String(o.value) === String(value))

  return (
    <div ref={ref} style={{ position: 'relative', width, ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          background: bg, border: `1px solid ${border}`,
          borderRadius: 8, padding: '6px 10px', cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: 36, transition: 'border-color 0.15s', textAlign: 'left',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {icon && <i className={`bx ${icon}`} style={{ fontSize: 14, color: selected?.color || subtext, flexShrink: 0 }} />}
        {selected?.icon && !icon && <i className={`bx ${selected.icon}`} style={{ fontSize: 14, color: selected?.color || subtext, flexShrink: 0 }} />}
        <span style={{ flex: 1, fontSize: 13, color: selected ? (selected.color || text) : subtext, fontWeight: selected ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`bx bx-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: 14, color: subtext, flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 9000,
          background: bg, border: `1px solid ${border}`,
          borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          minWidth: '100%', overflow: 'hidden', padding: '4px',
        }}>
          {options.map(opt => {
            const sel = String(opt.value) === String(value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: sel ? (opt.color ? opt.color + '22' : 'rgba(38,194,129,0.12)') : 'transparent',
                  fontSize: 13, textAlign: 'left', transition: 'background 0.12s',
                  color: sel ? (opt.color || '#26c281') : text,
                  fontWeight: sel ? 600 : 400,
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = hoverBg }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.icon && <i className={`bx ${opt.icon}`} style={{ fontSize: 14, color: opt.color || subtext, flexShrink: 0 }} />}
                {opt.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />}
                <span style={{ flex: 1 }}>{opt.label}</span>
                {sel && <i className="bx bx-check" style={{ fontSize: 14, color: opt.color || '#26c281', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
