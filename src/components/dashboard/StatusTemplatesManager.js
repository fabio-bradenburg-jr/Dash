'use client'

import React, { useState, useEffect, useRef } from 'react'

const PALETTE = [
  '#ef4444','#dc2626','#f97316','#d97706','#eab308','#84cc16',
  '#22c55e','#16a34a','#14b8a6','#06b6d4','#38bdf8','#3b82f6',
  '#1d4ed8','#6366f1','#8b5cf6','#7c3aed','#ec4899','#db2777',
  '#a16207','#92400e','#d1d5db','#94a3b8','#475569','#1e293b',
  '#f1f5f9','#fef9c3','#dcfce7','#dbeafe','#ede9fe','#fce7f3',
]

function ColorPickerPopover({ color, onChange, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        zIndex: 3000,
        top: '100%',
        left: 0,
        marginTop: 4,
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: 10,
        boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
        width: 172,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
        {PALETTE.map(c => (
          <div
            key={c}
            onClick={() => { onChange(c); onClose() }}
            title={c}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: c,
              cursor: 'pointer',
              border: color === c ? '2px solid #fff' : '2px solid transparent',
              boxSizing: 'border-box',
              transition: 'transform 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>
    </div>
  )
}

function StatusItemRow({ item, canDelete, onUpdate, onDelete, dragHandlers }) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(item.name)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => { setNameVal(item.name) }, [item.name])

  function saveName() {
    setEditingName(false)
    const v = nameVal.trim()
    if (v && v !== item.name) onUpdate(item.id, { name: v })
    else setNameVal(item.name)
  }

  const badgeStyle = (active, color) => ({
    fontSize: '0.68rem',
    padding: '2px 7px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    background: active ? color + '30' : 'rgba(255,255,255,0.04)',
    color: active ? color : '#475569',
    border: `1px solid ${active ? color + '60' : 'rgba(255,255,255,0.08)'}`,
    userSelect: 'none',
    transition: 'all 0.15s',
  })

  return (
    <div
      draggable
      onDragStart={dragHandlers.onDragStart}
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
      data-id={item.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 6,
        cursor: 'grab',
      }}
    >
      {/* Drag handle */}
      <i className="bx bx-dots-vertical-rounded" style={{ fontSize: 16, color: '#334155', cursor: 'grab', flexShrink: 0 }} />

      {/* Color dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          onClick={() => setShowColorPicker(v => !v)}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: item.color,
            cursor: 'pointer',
            border: '2px solid rgba(255,255,255,0.15)',
            boxSizing: 'border-box',
            transition: 'transform 0.1s',
          }}
          title="Alterar cor"
        />
        {showColorPicker && (
          <ColorPickerPopover
            color={item.color}
            onChange={c => onUpdate(item.id, { color: c })}
            onClose={() => setShowColorPicker(false)}
          />
        )}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {editingName ? (
          <input
            ref={nameRef}
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNameVal(item.name) } }}
            autoFocus
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(38,194,129,0.4)',
              borderRadius: 5,
              color: '#e2e8f0',
              padding: '2px 7px',
              fontSize: '0.84rem',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <span
            onClick={() => setEditingName(true)}
            style={{ fontSize: '0.84rem', color: '#e2e8f0', cursor: 'text', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {item.name}
          </span>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <span
          style={badgeStyle(item.is_initial, '#22c55e')}
          onClick={() => onUpdate(item.id, { is_initial: !item.is_initial })}
          title="Status inicial — tarefas novas começam aqui"
        >
          Inicial
        </span>
        <span
          style={badgeStyle(item.is_completed, '#3b82f6')}
          onClick={() => onUpdate(item.id, { is_completed: !item.is_completed })}
          title="Status de conclusão"
        >
          Concluído
        </span>
        <span
          style={badgeStyle(item.pauses_sla, '#eab308')}
          onClick={() => onUpdate(item.id, { pauses_sla: !item.pauses_sla })}
          title="Pausa o SLA enquanto neste status"
        >
          Pausa SLA
        </span>
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => canDelete && onDelete(item)}
        disabled={!canDelete}
        style={{
          background: 'none',
          border: 'none',
          color: canDelete ? '#475569' : '#1e293b',
          cursor: canDelete ? 'pointer' : 'not-allowed',
          padding: 4,
          borderRadius: 4,
          fontSize: 16,
          flexShrink: 0,
          lineHeight: 1,
        }}
        title={canDelete ? 'Excluir status' : 'Precisa de pelo menos 1 status'}
      >
        ×
      </button>
    </div>
  )
}

export default function StatusTemplatesManager({ onClose, workspaceId, onTemplatesChange }) {
  const [templates, setTemplates] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Template name editing
  const [editingTemplateName, setEditingTemplateName] = useState(false)
  const [templateNameVal, setTemplateNameVal] = useState('')

  // Delete template flow
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [migrateTo, setMigrateTo] = useState('')

  // Delete item flow
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false)
  const [deleteItemTarget, setDeleteItemTarget] = useState(null)
  const [migrateItemTo, setMigrateItemTo] = useState('')

  // Drag state
  const dragItemId = useRef(null)

  const selected = templates.find(t => t.id === selectedId)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks/status-templates')
      const json = await res.json()
      if (json.templates) {
        setTemplates(json.templates)
        if (!selectedId && json.templates.length > 0) {
          setSelectedId(json.templates[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function notify(updated) {
    if (onTemplatesChange) onTemplatesChange(updated)
  }

  async function handleCreateTemplate() {
    setSaving(true)
    try {
      const res = await fetch('/api/tasks/status-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Novo Template', copy_from_id: selectedId || undefined }),
      })
      const json = await res.json()
      if (json.template) {
        const updated = [...templates, json.template]
        setTemplates(updated)
        setSelectedId(json.template.id)
        notify(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDuplicateTemplate() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks/status-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selected.name + ' (cópia)', copy_from_id: selected.id }),
      })
      const json = await res.json()
      if (json.template) {
        const updated = [...templates, json.template]
        setTemplates(updated)
        setSelectedId(json.template.id)
        notify(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  async function saveTemplateName() {
    setEditingTemplateName(false)
    if (!selected || !templateNameVal.trim() || templateNameVal === selected.name) {
      setTemplateNameVal(selected?.name || '')
      return
    }
    const res = await fetch('/api/tasks/status-templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'template', id: selected.id, name: templateNameVal.trim() }),
    })
    const json = await res.json()
    if (json.template) {
      const updated = templates.map(t => t.id === json.template.id ? { ...t, ...json.template } : t)
      setTemplates(updated)
      notify(updated)
    }
  }

  async function handleSetDefault() {
    if (!selected) return
    const res = await fetch('/api/tasks/status-templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'template', id: selected.id, is_default: true }),
    })
    const json = await res.json()
    if (json.template) {
      const updated = templates.map(t => ({
        ...t,
        is_default: t.id === json.template.id,
      }))
      setTemplates(updated)
      notify(updated)
    }
  }

  async function handleUpdateItem(itemId, changes) {
    const res = await fetch('/api/tasks/status-templates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity: 'item', id: itemId, ...changes }),
    })
    const json = await res.json()
    if (json.item) {
      const updated = templates.map(t => ({
        ...t,
        items: t.items.map(i => i.id === json.item.id ? { ...i, ...json.item } : i),
      }))
      setTemplates(updated)
      notify(updated)
    }
  }

  async function handleAddItem() {
    if (!selected) return
    const maxOrder = selected.items.reduce((max, i) => Math.max(max, i.sort_order), -1)
    const res = await fetch('/api/tasks/status-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity: 'item',
        template_id: selected.id,
        name: 'Novo Status',
        color: '#94a3b8',
        sort_order: maxOrder + 1,
      }),
    })
    const json = await res.json()
    if (json.item) {
      const updated = templates.map(t =>
        t.id === selected.id ? { ...t, items: [...t.items, json.item] } : t
      )
      setTemplates(updated)
      notify(updated)
    }
  }

  function requestDeleteItem(item) {
    setDeleteItemTarget(item)
    const others = selected.items.filter(i => i.id !== item.id)
    setMigrateItemTo(others[0]?.id || '')
    setShowDeleteItemConfirm(true)
  }

  async function confirmDeleteItem() {
    if (!deleteItemTarget) return
    setSaving(true)
    try {
      const body = { entity: 'item', id: deleteItemTarget.id }
      if (migrateItemTo) body.migrate_to_item_id = migrateItemTo
      const res = await fetch('/api/tasks/status-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.ok) {
        const updated = templates.map(t =>
          t.id === selected.id ? { ...t, items: t.items.filter(i => i.id !== deleteItemTarget.id) } : t
        )
        setTemplates(updated)
        notify(updated)
        setShowDeleteItemConfirm(false)
        setDeleteItemTarget(null)
      }
    } finally {
      setSaving(false)
    }
  }

  function requestDeleteTemplate() {
    const others = templates.filter(t => t.id !== selected.id)
    setMigrateTo(others[0]?.id || '')
    setDeleteTarget(selected)
    setShowDeleteConfirm(true)
  }

  async function confirmDeleteTemplate() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks/status-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, migrate_to_template_id: migrateTo }),
      })
      const json = await res.json()
      if (json.ok) {
        const updated = templates.filter(t => t.id !== deleteTarget.id)
        setTemplates(updated)
        if (updated.length > 0) setSelectedId(updated[0].id)
        notify(updated)
        setShowDeleteConfirm(false)
        setDeleteTarget(null)
      }
    } finally {
      setSaving(false)
    }
  }

  // Drag and drop for reordering items
  function handleDragStart(e, itemId) {
    dragItemId.current = itemId
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  async function handleDrop(e, targetItemId) {
    e.preventDefault()
    if (!dragItemId.current || dragItemId.current === targetItemId || !selected) return

    const items = [...selected.items]
    const fromIdx = items.findIndex(i => i.id === dragItemId.current)
    const toIdx = items.findIndex(i => i.id === targetItemId)
    if (fromIdx < 0 || toIdx < 0) return

    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)

    // Reassign sort_order
    const reordered = items.map((item, idx) => ({ ...item, sort_order: idx }))

    // Optimistically update
    const updated = templates.map(t =>
      t.id === selected.id ? { ...t, items: reordered } : t
    )
    setTemplates(updated)
    notify(updated)

    // Persist each reorder
    for (const item of reordered) {
      await fetch('/api/tasks/status-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'item', id: item.id, sort_order: item.sort_order }),
      })
    }

    dragItemId.current = null
  }

  const panelStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    zIndex: 2500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const modalStyle = {
    background: '#050506',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    width: '860px',
    maxWidth: '96vw',
    height: '580px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
    overflow: 'hidden',
  }

  return (
    <div style={panelStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bx bx-list-check" style={{ fontSize: 18, color: '#26c281' }}></i>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>Templates de Status</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22, padding: 4, borderRadius: 4, lineHeight: 1 }}
          >
            <i className="bx bx-x"></i>
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left sidebar */}
          <div style={{ width: 200, borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', flexShrink: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
              {loading ? (
                <div style={{ color: '#475569', fontSize: '0.8rem', padding: 10 }}>Carregando...</div>
              ) : templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: t.id === selectedId ? 'rgba(38,194,129,0.12)' : 'transparent',
                    border: `1px solid ${t.id === selectedId ? 'rgba(38,194,129,0.3)' : 'transparent'}`,
                    marginBottom: 4,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ flex: 1, fontSize: '0.84rem', color: t.id === selectedId ? '#26c281' : '#94a3b8', fontWeight: t.id === selectedId ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </span>
                    {t.is_default && (
                      <span style={{ fontSize: '0.6rem', background: 'rgba(38,194,129,0.2)', color: '#26c281', borderRadius: 5, padding: '1px 5px', flexShrink: 0, fontWeight: 700 }}>
                        Padrão
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 2 }}>
                    {t.items.length} status
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={handleCreateTemplate}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'rgba(38,194,129,0.1)',
                  border: '1px dashed rgba(38,194,129,0.3)',
                  color: '#26c281',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                <i className="bx bx-plus" style={{ fontSize: 14 }}></i>
                Novo Template
              </button>
            </div>
          </div>

          {/* Right main area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selected ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '0.85rem' }}>
                Selecione um template
              </div>
            ) : (
              <>
                {/* Template header */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {editingTemplateName ? (
                    <input
                      value={templateNameVal}
                      onChange={e => setTemplateNameVal(e.target.value)}
                      onBlur={saveTemplateName}
                      onKeyDown={e => { if (e.key === 'Enter') saveTemplateName(); if (e.key === 'Escape') { setEditingTemplateName(false); setTemplateNameVal(selected.name) } }}
                      autoFocus
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(38,194,129,0.4)',
                        borderRadius: 6,
                        color: '#f1f5f9',
                        padding: '4px 10px',
                        outline: 'none',
                        minWidth: 160,
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>{selected.name}</span>
                      <button
                        type="button"
                        onClick={() => { setEditingTemplateName(true); setTemplateNameVal(selected.name) }}
                        style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2, fontSize: 14, lineHeight: 1 }}
                      >
                        <i className="bx bx-pencil"></i>
                      </button>
                    </div>
                  )}

                  {selected.is_default ? (
                    <span style={{ fontSize: '0.72rem', background: 'rgba(38,194,129,0.2)', color: '#26c281', borderRadius: 8, padding: '2px 9px', fontWeight: 700 }}>
                      Padrão
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSetDefault}
                      style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, padding: '3px 10px', cursor: 'pointer' }}
                    >
                      Definir como padrão
                    </button>
                  )}

                  <div style={{ flex: 1 }} />

                  <button
                    type="button"
                    onClick={handleDuplicateTemplate}
                    disabled={saving}
                    style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <i className="bx bx-copy" style={{ fontSize: 13 }}></i>
                    Duplicar
                  </button>

                  <button
                    type="button"
                    onClick={requestDeleteTemplate}
                    disabled={templates.length <= 1 || saving}
                    title={templates.length <= 1 ? 'Precisa de pelo menos 1 template' : 'Excluir template'}
                    style={{
                      fontSize: '0.78rem',
                      background: templates.length <= 1 ? 'rgba(255,255,255,0.02)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${templates.length <= 1 ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.2)'}`,
                      color: templates.length <= 1 ? '#334155' : '#ef4444',
                      borderRadius: 7,
                      padding: '5px 11px',
                      cursor: templates.length <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <i className="bx bx-trash" style={{ fontSize: 13 }}></i>
                    Excluir
                  </button>
                </div>

                {/* Delete template confirm */}
                {showDeleteConfirm && deleteTarget && (
                  <div style={{ margin: '12px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.84rem', color: '#fca5a5', fontWeight: 600, marginBottom: 8 }}>
                      Mover tarefas deste template para:
                    </div>
                    <select
                      value={migrateTo}
                      onChange={e => setMigrateTo(e.target.value)}
                      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: '0.82rem', width: '100%', outline: 'none', marginBottom: 10 }}
                    >
                      {templates.filter(t => t.id !== deleteTarget.id).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={confirmDeleteTemplate}
                        disabled={saving || !migrateTo}
                        style={{ padding: '6px 14px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {saving ? 'Excluindo...' : 'Confirmar Exclusão'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null) }}
                        style={{ padding: '6px 14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete item confirm */}
                {showDeleteItemConfirm && deleteItemTarget && (
                  <div style={{ margin: '12px 18px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.84rem', color: '#fca5a5', fontWeight: 600, marginBottom: 8 }}>
                      Mover tarefas com "{deleteItemTarget.name}" para:
                    </div>
                    <select
                      value={migrateItemTo}
                      onChange={e => setMigrateItemTo(e.target.value)}
                      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: '0.82rem', width: '100%', outline: 'none', marginBottom: 10 }}
                    >
                      {selected.items.filter(i => i.id !== deleteItemTarget.id).map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={confirmDeleteItem}
                        disabled={saving}
                        style={{ padding: '6px 14px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {saving ? 'Excluindo...' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteItemConfirm(false); setDeleteItemTarget(null) }}
                        style={{ padding: '6px 14px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Items list */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
                  {selected.items.length === 0 && (
                    <div style={{ color: '#475569', fontSize: '0.82rem', marginBottom: 10 }}>Nenhum status. Adicione um abaixo.</div>
                  )}
                  {selected.items.map(item => (
                    <StatusItemRow
                      key={item.id}
                      item={item}
                      canDelete={selected.items.length > 1}
                      onUpdate={handleUpdateItem}
                      onDelete={requestDeleteItem}
                      dragHandlers={{
                        onDragStart: e => handleDragStart(e, item.id),
                        onDragOver: handleDragOver,
                        onDrop: e => handleDrop(e, item.id),
                      }}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={handleAddItem}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px dashed rgba(255,255,255,0.12)',
                      color: '#475569',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      width: '100%',
                      marginTop: 4,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
                  >
                    <i className="bx bx-plus" style={{ fontSize: 14 }}></i>
                    Adicionar Status
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
