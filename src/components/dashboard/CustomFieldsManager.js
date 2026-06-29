'use client'

import React, { useState, useEffect, useCallback } from 'react'
import CustomSelect from '@/components/dashboard/CustomSelect'

const FIELD_TYPES = [
  { value: 'text',        label: 'Texto curto',       icon: 'bx-text' },
  { value: 'textarea',    label: 'Texto longo',        icon: 'bx-align-left' },
  { value: 'number',      label: 'Número',             icon: 'bx-hash' },
  { value: 'currency',    label: 'Moeda',              icon: 'bx-dollar' },
  { value: 'date',        label: 'Data',               icon: 'bx-calendar' },
  { value: 'select',      label: 'Seleção única',      icon: 'bx-list-ul' },
  { value: 'multiselect', label: 'Seleção múltipla',   icon: 'bx-list-check' },
  { value: 'checkbox',    label: 'Checkbox',           icon: 'bx-checkbox-checked' },
  { value: 'url',         label: 'Link',               icon: 'bx-link' },
  { value: 'email',       label: 'E-mail',             icon: 'bx-envelope' },
  { value: 'phone',       label: 'Telefone',           icon: 'bx-phone' },
  { value: 'user',        label: 'Responsável/Pessoa', icon: 'bx-user' },
  { value: 'priority',    label: 'Prioridade',         icon: 'bx-flag' },
]

const COLORS = ['#26c281','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

const S = {
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' },
  label: { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block' },
  btn: (primary) => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: primary ? 'none' : '1px solid rgba(255,255,255,0.1)', background: primary ? '#26c281' : 'rgba(255,255,255,0.05)', color: primary ? '#fff' : '#94a3b8', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }),
}

function FieldTypeIcon({ type, size = 14 }) {
  const ft = FIELD_TYPES.find(t => t.value === type)
  return <i className={`bx ${ft?.icon || 'bx-list-plus'}`} style={{ fontSize: size }} />
}

function FieldForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    field_type: initial?.field_type || 'text',
    description: initial?.description || '',
    color: initial?.color || '#26c281',
    is_required: initial?.is_required || false,
    config: initial?.config || {},
  })
  const [newOption, setNewOption] = useState('')

  const isSelect = ['select','multiselect'].includes(form.field_type)
  const options = form.config?.options || []

  function addOption() {
    const val = newOption.trim()
    if (!val) return
    setForm(f => ({ ...f, config: { ...f.config, options: [...(f.config.options || []), { label: val, color: '#64748b' }] } }))
    setNewOption('')
  }

  function removeOption(idx) {
    setForm(f => ({ ...f, config: { ...f.config, options: (f.config.options || []).filter((_, i) => i !== idx) } }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={S.label}>Nome do campo *</label>
        <input style={S.input} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ex: Link do projeto" autoFocus />
      </div>

      <div>
        <label style={S.label}>Tipo</label>
        <CustomSelect
          options={FIELD_TYPES.map(t => ({ value: t.value, label: t.label }))}
          value={form.field_type}
          onChange={v => setForm(f => ({ ...f, field_type: v, config: {} }))}
          icon="bx-category"
        />
      </div>

      {isSelect && (
        <div>
          <label style={S.label}>Opções</label>
          {options.map((opt, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ flex: 1, fontSize: '0.83rem', background: 'rgba(255,255,255,0.04)', padding: '5px 10px', borderRadius: 6, color: '#e2e8f0' }}>{opt.label}</span>
              <button type="button" onClick={() => removeOption(idx)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: 2 }}><i className="bx bx-x" /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input style={{ ...S.input, flex: 1 }} value={newOption} onChange={e => setNewOption(e.target.value)} onKeyDown={e => e.key === 'Enter' && addOption()} placeholder="Nova opção..." />
            <button type="button" onClick={addOption} style={S.btn(false)}><i className="bx bx-plus" /></button>
          </div>
        </div>
      )}

      <div>
        <label style={S.label}>Cor</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => setForm(f => ({...f, color: c}))} style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', boxShadow: form.color === c ? `0 0 0 3px rgba(255,255,255,0.3)` : 'none', flexShrink: 0 }} />
          ))}
        </div>
      </div>

      <div>
        <label style={S.label}>Descrição (opcional)</label>
        <input style={S.input} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Descreva o campo..." />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" id="req" checked={form.is_required} onChange={e => setForm(f => ({...f, is_required: e.target.checked}))} style={{ accentColor: '#26c281', width: 14, height: 14 }} />
        <label htmlFor="req" style={{ fontSize: '0.83rem', color: '#94a3b8', cursor: 'pointer' }}>Campo obrigatório</label>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={S.btn(false)}>Cancelar</button>
        <button type="button" onClick={() => onSave(form)} disabled={!form.name.trim() || saving} style={{ ...S.btn(true), opacity: (!form.name.trim() || saving) ? 0.5 : 1 }}>
          {saving ? 'Salvando...' : (initial?.id ? 'Salvar' : 'Criar campo')}
        </button>
      </div>
    </div>
  )
}

export default function CustomFieldsManager() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tasks/custom-fields?entity_type=task')
      const json = await res.json()
      if (json.fields) setFields(json.fields)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(form) {
    setSaving(true)
    try {
      const res = await fetch('/api/tasks/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, entity_type: 'task', icon: FIELD_TYPES.find(t => t.value === form.field_type)?.icon || 'bx-list-plus' }),
      })
      const json = await res.json()
      if (json.field) { setFields(prev => [...prev, json.field]); setCreating(false) }
    } finally { setSaving(false) }
  }

  async function handleEdit(form) {
    setSaving(true)
    try {
      const res = await fetch('/api/tasks/custom-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing.id, ...form, icon: FIELD_TYPES.find(t => t.value === form.field_type)?.icon || editing.icon }),
      })
      const json = await res.json()
      if (json.field) { setFields(prev => prev.map(f => f.id === editing.id ? json.field : f)); setEditing(null) }
    } finally { setSaving(false) }
  }

  async function handleDelete(field) {
    const res = await fetch(`/api/tasks/custom-fields?id=${field.id}`, { method: 'DELETE' })
    if ((await res.json()).ok) {
      setFields(prev => prev.filter(f => f.id !== field.id))
      setConfirmDelete(null)
    }
  }

  if (loading) return <div style={{ padding: 24, color: '#64748b', fontSize: '0.85rem' }}>Carregando campos...</div>

  return (
    <div>
      {/* Field list */}
      {fields.length === 0 && !creating && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>
          <i className="bx bx-list-plus" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: '#334155' }} />
          Nenhum campo personalizado criado ainda.
        </div>
      )}

      {fields.map(field => {
        const ft = FIELD_TYPES.find(t => t.value === field.field_type)
        if (editing?.id === field.id) {
          return (
            <div key={field.id} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 12 }}>Editando: {field.name}</div>
              <FieldForm initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} saving={saving} />
            </div>
          )
        }
        return (
          <div key={field.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: (field.color || '#26c281') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`bx ${field.icon || 'bx-list-plus'}`} style={{ fontSize: 14, color: field.color || '#26c281' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{field.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ft?.label || field.field_type}{field.is_required && ' · Obrigatório'}</div>
            </div>
            {confirmDelete?.id === field.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Excluir?</span>
                <button type="button" onClick={() => handleDelete(field)} style={{ ...S.btn(false), padding: '4px 10px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)', fontSize: '0.78rem' }}>Sim</button>
                <button type="button" onClick={() => setConfirmDelete(null)} style={{ ...S.btn(false), padding: '4px 10px', fontSize: '0.78rem' }}>Não</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" onClick={() => setEditing(field)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 5, fontSize: 15 }} title="Editar"><i className="bx bx-pencil" /></button>
                <button type="button" onClick={() => setConfirmDelete(field)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 5, fontSize: 15 }} title="Excluir"><i className="bx bx-trash" /></button>
              </div>
            )}
          </div>
        )
      })}

      {/* Create form */}
      {creating ? (
        <div style={{ marginTop: 12, background: 'rgba(38,194,129,0.04)', border: '1px solid rgba(38,194,129,0.2)', borderRadius: 10, padding: '16px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#26c281', marginBottom: 12 }}>Novo campo personalizado</div>
          <FieldForm onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </div>
      ) : (
        <button type="button" onClick={() => setCreating(true)} style={{ ...S.btn(false), marginTop: 10, width: '100%', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <i className="bx bx-plus" /> Novo campo
        </button>
      )}
    </div>
  )
}
