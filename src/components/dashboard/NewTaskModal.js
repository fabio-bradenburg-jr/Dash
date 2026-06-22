'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const GREEN = '#26c281'

const INPUT_STYLE = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  padding: '8px 10px',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 4,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const EMPTY_FORM = (defaultContext = {}) => ({
  title: '',
  description: '',
  status_id: defaultContext.status_id || '',
  assignee_id: '',
  client_id: defaultContext.client_id || '',
  space_id: defaultContext.space_id || '',
  priority: 'none',
  due_date: '',
  tags: [],
})

export default function NewTaskModal({
  onClose,
  onSaved,
  defaultContext = {},
  spaces = [],
  clients = [],
  workspaceUsers = [],
  statuses = [],
  customFields = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM(defaultContext))
  const [tagInput, setTagInput] = useState('')
  const [titleError, setTitleError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingAnother, setSavingAnother] = useState(false)
  const [mounted, setMounted] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    // Trigger animation
    requestAnimationFrame(() => setMounted(true))
    titleRef.current?.focus()
  }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [form])

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (field === 'title') setTitleError(false)
  }

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim()
      if (!form.tags.includes(tag)) {
        setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  const handleSave = useCallback(async (saveAnother = false) => {
    if (!form.title.trim()) {
      setTitleError(true)
      titleRef.current?.focus()
      return
    }

    if (saveAnother) setSavingAnother(true)
    else setSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description || null,
        status_id: form.status_id || null,
        assignee_id: form.assignee_id || null,
        client_id: form.client_id || null,
        space_id: form.space_id || null,
        priority: form.priority !== 'none' ? form.priority : null,
        due_date: form.due_date || null,
        tags: form.tags.length > 0 ? form.tags : null,
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      const task = json.task || json

      if (onSaved) onSaved(task)

      if (saveAnother) {
        // Reset form but keep context pre-fills
        setForm(EMPTY_FORM(defaultContext))
        setTagInput('')
        setTitleError(false)
        titleRef.current?.focus()
      } else {
        onClose()
      }
    } catch (err) {
      console.error('Erro ao salvar tarefa:', err)
    } finally {
      setSaving(false)
      setSavingAnother(false)
    }
  }, [form, defaultContext, onSaved, onClose])

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 100000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    opacity: mounted ? 1 : 0,
    transition: 'opacity 0.18s ease',
  }

  const modalStyle = {
    background: '#111113',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
    transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
    opacity: mounted ? 1 : 0,
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  }

  const isBusy = saving || savingAnother

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>Nova Tarefa</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
          >
            <i className="bx bx-x" style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <div>
            <label style={LABEL_STYLE}>Título *</label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="Nome da tarefa..."
              style={{
                ...INPUT_STYLE,
                border: titleError ? '1px solid #ef4444' : INPUT_STYLE.border,
              }}
            />
            {titleError && (
              <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'block' }}>O título é obrigatório</span>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={LABEL_STYLE}>Descrição</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              placeholder="Adicione uma descrição..."
              rows={3}
              style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>

          {/* Status + Assignee */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Status</label>
              <select value={form.status_id} onChange={set('status_id')} style={INPUT_STYLE}>
                <option value="">Sem status</option>
                {statuses.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Responsável</label>
              <select value={form.assignee_id} onChange={set('assignee_id')} style={INPUT_STYLE}>
                <option value="">Sem responsável</option>
                {workspaceUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Client + Space */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Cliente</label>
              <select value={form.client_id} onChange={set('client_id')} style={INPUT_STYLE}>
                <option value="">Sem cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Espaço</label>
              <select value={form.space_id} onChange={set('space_id')} style={INPUT_STYLE}>
                <option value="">Sem espaço</option>
                {spaces.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority + Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={LABEL_STYLE}>Prioridade</label>
              <select value={form.priority} onChange={set('priority')} style={INPUT_STYLE}>
                <option value="none">Sem prioridade</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Data de entrega</label>
              <input
                type="date"
                value={form.due_date}
                onChange={set('due_date')}
                style={{ ...INPUT_STYLE, colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={LABEL_STYLE}>Tags</label>
            <div style={{
              ...INPUT_STYLE,
              display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 38,
              padding: '6px 10px', alignItems: 'center',
            }}>
              {form.tags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: GREEN + '22', color: GREEN,
                  borderRadius: 5, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: GREEN, padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                  >
                    <i className="bx bx-x" style={{ fontSize: 14 }} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={form.tags.length === 0 ? 'Digite e pressione Enter...' : ''}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#e2e8f0', fontSize: 13, flex: 1, minWidth: 80,
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
              borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isBusy}
            style={{
              background: 'transparent',
              border: `1px solid ${GREEN}`,
              color: GREEN,
              borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {savingAnother && <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 14 }} />}
            Salvar e criar outra
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isBusy}
            style={{
              background: GREEN,
              border: 'none',
              color: '#fff',
              borderRadius: 7, padding: '8px 18px', fontSize: 13, fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              opacity: isBusy ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {saving && <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 14 }} />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
