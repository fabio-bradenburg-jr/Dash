'use client'
import { useState, useRef, useEffect } from 'react'

const GREEN = '#26c281'

const DEFAULT_COLUMNS = [
  { key: 'title',          label: 'Tarefa',        width: 280, visible: true,  pinned: true  },
  { key: 'status',         label: 'Status',        width: 130, visible: true,  pinned: false },
  { key: 'priority',       label: 'Prioridade',    width: 110, visible: true,  pinned: false },
  { key: 'assignee',       label: 'Responsável',   width: 150, visible: true,  pinned: false },
  { key: 'client',         label: 'Cliente',       width: 140, visible: true,  pinned: false },
  { key: 'due_date',       label: 'Vencimento',    width: 120, visible: true,  pinned: false },
  { key: 'task_public_id', label: 'ID',            width: 100, visible: true,  pinned: false },
  { key: 'start_date',     label: 'Início',        width: 120, visible: false, pinned: false },
  { key: 'created_at',     label: 'Criado em',     width: 130, visible: false, pinned: false },
]

export { DEFAULT_COLUMNS }

export default function ColumnManager({ columns, onChange, customFields = [], isLight = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const dragIdx = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const bg = isLight ? '#fff' : 'var(--bg-panel, #111113)'
  const border = isLight ? 'rgba(15,23,42,.1)' : 'rgba(255,255,255,0.08)'
  const text = isLight ? '#0f172a' : '#e2e8f0'
  const subtext = isLight ? '#64748b' : '#94a3b8'

  const allColumns = [
    ...columns,
    ...customFields
      .filter(f => !columns.find(c => c.key === `custom_field:${f.id}`))
      .map(f => ({ key: `custom_field:${f.id}`, label: f.name, width: 140, visible: false, pinned: false, isCustom: true, fieldType: f.field_type, color: f.color })),
  ]

  function toggleVisible(key) {
    onChange(allColumns.map(c => c.key === key ? { ...c, visible: !c.visible } : c))
  }

  function handleDragStart(idx) { dragIdx.current = idx }
  function handleDragOver(e, idx) {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === idx) return
    const next = [...allColumns]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(idx, 0, moved)
    dragIdx.current = idx
    onChange(next)
  }

  const visibleCount = allColumns.filter(c => c.visible).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: open ? GREEN + '18' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? GREEN + '44' : 'rgba(255,255,255,0.1)'}`,
          color: open ? GREEN : subtext, padding: '6px 12px', borderRadius: 7,
          fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <i className="bx bx-columns" style={{ fontSize: 15 }} />
        Colunas
        <span style={{ background: GREEN + '33', color: GREEN, borderRadius: 8, padding: '0 5px', fontSize: 11, fontWeight: 700 }}>{visibleCount}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9000,
          background: bg, border: `1px solid ${border}`,
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          width: 260, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: text }}>Gerenciar colunas</span>
            <button
              type="button"
              onClick={() => onChange(DEFAULT_COLUMNS)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtext, fontSize: 11 }}
            >
              Restaurar
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 8px' }}>
            {allColumns.map((col, idx) => (
              <div
                key={col.key}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 6px', borderRadius: 7, cursor: 'grab',
                  opacity: col.pinned ? 0.6 : 1,
                }}
              >
                <i className="bx bx-grid-vertical" style={{ fontSize: 15, color: subtext, flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.isCustom && <span style={{ fontSize: 10, color: col.color || GREEN, marginRight: 4 }}>●</span>}
                    {col.label}
                  </div>
                  {col.isCustom && <div style={{ fontSize: 10, color: subtext }}>{col.fieldType}</div>}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', cursor: col.pinned ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={col.visible}
                    disabled={col.pinned}
                    onChange={() => !col.pinned && toggleVisible(col.key)}
                    style={{ accentColor: GREEN, width: 14, height: 14 }}
                  />
                </label>
              </div>
            ))}
          </div>

          {customFields.length > 0 && (
            <div style={{ padding: '8px 14px', borderTop: `1px solid ${border}` }}>
              <div style={{ fontSize: 11, color: subtext }}>
                <i className="bx bx-plus-circle" style={{ marginRight: 4 }} />
                Campos personalizados incluídos automaticamente
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
