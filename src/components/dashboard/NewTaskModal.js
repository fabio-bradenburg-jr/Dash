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

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DAYS_PT = ['D','S','T','Q','Q','S','S']
const WEEK_DAYS = [
  { key: 'sun', label: 'D' }, { key: 'mon', label: 'S' }, { key: 'tue', label: 'T' },
  { key: 'wed', label: 'Q' }, { key: 'thu', label: 'Q' }, { key: 'fri', label: 'S' },
  { key: 'sat', label: 'S' },
]

function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const today = new Date()
  const parsed = value ? new Date(value + 'T00:00:00') : null
  const [view, setView] = useState(() => {
    const d = parsed || today
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function prevMonth() {
    setView(v => {
      if (v.month === 0) return { year: v.year - 1, month: 11 }
      return { year: v.year, month: v.month - 1 }
    })
  }
  function nextMonth() {
    setView(v => {
      if (v.month === 11) return { year: v.year + 1, month: 0 }
      return { year: v.year, month: v.month + 1 }
    })
  }

  function getDays() {
    const firstDay = new Date(view.year, view.month, 1).getDay()
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }

  function selectDay(day) {
    if (!day) return
    const m = String(view.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${view.year}-${m}-${d}`)
    setOpen(false)
  }

  function isSelected(day) {
    if (!parsed || !day) return false
    return parsed.getFullYear() === view.year && parsed.getMonth() === view.month && parsed.getDate() === day
  }

  function isToday(day) {
    if (!day) return false
    return today.getFullYear() === view.year && today.getMonth() === view.month && today.getDate() === day
  }

  const displayValue = parsed
    ? parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : ''

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          ...INPUT_STYLE,
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          color: value ? '#e2e8f0' : '#475569',
        }}
      >
        <i className="bx bx-calendar" style={{ fontSize: 14, color: '#475569', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13 }}>{displayValue || 'Sem data de entrega'}</span>
        {value && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <i className="bx bx-x" style={{ fontSize: 14 }} />
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 99999,
          background: '#1a1a1f', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          width: 280, padding: '12px 14px', userSelect: 'none',
        }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button type="button" onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', borderRadius: 6, fontSize: 16, display: 'flex', alignItems: 'center' }}>
              <i className="bx bx-chevron-left" />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
              {MONTHS_PT[view.month]} {view.year}
            </span>
            <button type="button" onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 6px', borderRadius: 6, fontSize: 16, display: 'flex', alignItems: 'center' }}>
              <i className="bx bx-chevron-right" />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS_PT.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#475569', padding: '2px 0' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {getDays().map((day, i) => {
              const sel = isSelected(day)
              const tod = isToday(day)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={!day}
                  style={{
                    background: sel ? GREEN : tod ? GREEN + '22' : 'transparent',
                    border: tod && !sel ? `1px solid ${GREEN}55` : '1px solid transparent',
                    borderRadius: 6, color: sel ? '#fff' : day ? '#e2e8f0' : 'transparent',
                    fontSize: 12, fontWeight: sel ? 700 : 400,
                    padding: '5px 2px', cursor: day ? 'pointer' : 'default',
                    textAlign: 'center',
                  }}
                >
                  {day || ''}
                </button>
              )
            })}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 11, fontWeight: 600 }}
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date()
                onChange(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`)
                setOpen(false)
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: GREEN, fontSize: 11, fontWeight: 700 }}
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RecurrenceSection({ value, onChange }) {
  const [open, setOpen] = useState(!!value?.is_recurring)

  const rec = value || {}
  const type = rec.recurring_type || 'weekly'
  const interval = rec.recurring_interval || 1
  const days = rec.recurring_days || []
  const endType = rec.recurring_end_type || 'never'
  const endDate = rec.recurring_end_date || ''
  const occurrences = rec.recurring_occurrences || 3
  const createWhen = rec.create_when || 'on_completion'

  function update(patch) {
    onChange({ is_recurring: true, recurring_type: type, recurring_interval: interval, recurring_days: days, recurring_end_type: endType, recurring_end_date: endDate, recurring_occurrences: occurrences, create_when: createWhen, ...rec, ...patch })
  }

  function toggleOpen() {
    if (open) {
      onChange(null)
      setOpen(false)
    } else {
      onChange({ is_recurring: true, recurring_type: 'weekly', recurring_interval: 1, recurring_days: [], recurring_end_type: 'never', create_when: 'on_completion' })
      setOpen(true)
    }
  }

  function toggleDay(key) {
    const next = days.includes(key) ? days.filter(d => d !== key) : [...days, key]
    update({ recurring_days: next })
  }

  const TYPE_OPTIONS = [
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' },
    { value: 'yearly', label: 'Anualmente' },
  ]

  const selectStyle = { ...INPUT_STYLE, padding: '6px 8px', fontSize: 12 }
  const numStyle = { ...INPUT_STYLE, padding: '6px 8px', fontSize: 12, width: 60, textAlign: 'center' }

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
      <button
        type="button"
        onClick={toggleOpen}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          cursor: 'pointer', padding: 0, width: '100%',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: open ? GREEN : 'rgba(255,255,255,0.07)',
          border: open ? 'none' : '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.15s',
        }}>
          {open && <i className="bx bx-check" style={{ fontSize: 13, color: '#fff' }} />}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: open ? GREEN : '#94a3b8' }}>Repetir tarefa</div>
          {open && type && (
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
              {TYPE_OPTIONS.find(o => o.value === type)?.label}
              {interval > 1 ? ` a cada ${interval}` : ''}
            </div>
          )}
        </div>
        <i className={`bx bx-chevron-${open ? 'up' : 'down'}`} style={{ marginLeft: 'auto', fontSize: 14, color: '#475569' }} />
      </button>

      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Type + Interval */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={LABEL_STYLE}>Frequência</label>
              <select value={type} onChange={e => update({ recurring_type: e.target.value })} style={selectStyle}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>A cada</label>
              <input
                type="number" min={1} max={99}
                value={interval}
                onChange={e => update({ recurring_interval: Math.max(1, parseInt(e.target.value) || 1) })}
                style={numStyle}
              />
            </div>
          </div>

          {/* Day of week checkboxes */}
          {type === 'weekly' && (
            <div>
              <label style={LABEL_STYLE}>Dias da semana</label>
              <div style={{ display: 'flex', gap: 5 }}>
                {WEEK_DAYS.map(d => {
                  const sel = days.includes(d.key)
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: sel ? GREEN : 'rgba(255,255,255,0.05)',
                        border: sel ? 'none' : '1px solid rgba(255,255,255,0.12)',
                        color: sel ? '#fff' : '#94a3b8',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* End condition */}
          <div>
            <label style={LABEL_STYLE}>Fim da repetição</label>
            <select value={endType} onChange={e => update({ recurring_end_type: e.target.value })} style={selectStyle}>
              <option value="never">Nunca</option>
              <option value="occurrences">Após X ocorrências</option>
              <option value="date">Em uma data</option>
            </select>
          </div>

          {endType === 'occurrences' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Ocorrências:</label>
              <input
                type="number" min={1} max={999}
                value={occurrences}
                onChange={e => update({ recurring_occurrences: Math.max(1, parseInt(e.target.value) || 1) })}
                style={{ ...numStyle, width: 70 }}
              />
            </div>
          )}

          {endType === 'date' && (
            <div>
              <label style={LABEL_STYLE}>Data de término</label>
              <DatePicker value={endDate} onChange={v => update({ recurring_end_date: v })} />
            </div>
          )}

          {/* When to create */}
          <div>
            <label style={LABEL_STYLE}>Criar próxima instância</label>
            <select value={createWhen} onChange={e => update({ create_when: e.target.value })} style={selectStyle}>
              <option value="on_completion">Ao concluir a tarefa atual</option>
              <option value="on_creation">Ao criar a tarefa</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
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
  recurrence: null,
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
    requestAnimationFrame(() => setMounted(true))
    titleRef.current?.focus()
  }, [])

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

      if (form.recurrence?.is_recurring) {
        Object.assign(payload, {
          is_recurring: true,
          recurring_type: form.recurrence.recurring_type,
          recurring_interval: form.recurrence.recurring_interval || 1,
          recurring_days: form.recurrence.recurring_days || [],
          recurring_end_type: form.recurrence.recurring_end_type || 'never',
          recurring_end_date: form.recurrence.recurring_end_date || null,
          recurring_occurrences: form.recurrence.recurring_occurrences || null,
          create_when: form.recurrence.create_when || 'on_completion',
        })
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
    padding: 0,
    opacity: mounted ? 1 : 0,
    transition: 'opacity 0.18s ease',
  }

  const modalStyle = {
    background: '#111113',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'hidden',
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
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>

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
              <DatePicker value={form.due_date} onChange={v => setForm(prev => ({ ...prev, due_date: v }))} />
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

          {/* Recurrence */}
          <RecurrenceSection
            value={form.recurrence}
            onChange={rec => setForm(prev => ({ ...prev, recurrence: rec }))}
          />
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
