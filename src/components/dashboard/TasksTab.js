'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import StatusTemplatesManager from '@/components/dashboard/StatusTemplatesManager'
import UserFilterPicker from '@/components/dashboard/UserFilterPicker'
import ColumnManager, { DEFAULT_COLUMNS } from '@/components/dashboard/ColumnManager'
import AutomationsTab from '@/components/dashboard/AutomationsTab'
import NewTaskModal from '@/components/dashboard/NewTaskModal'
import ArchivedTasksPanel from '@/components/dashboard/ArchivedTasksPanel'
import CustomFieldsManager from '@/components/dashboard/CustomFieldsManager'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: '#ef4444' },
  high: { label: 'Alta', color: '#f97316' },
  medium: { label: 'Média', color: '#eab308' },
  low: { label: 'Baixa', color: '#3b82f6' },
  none: { label: 'Sem prioridade', color: '#64748b' },
}

const SPACE_ICONS = [
  { value: 'bx-folder', label: 'Pasta' },
  { value: 'bx-code-alt', label: 'Código' },
  { value: 'bx-briefcase', label: 'Trabalho' },
  { value: 'bx-star', label: 'Estrela' },
  { value: 'bx-rocket', label: 'Rocket' },
]

const SPACE_COLORS = ['#26c281', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function PriorityFlag({ priority, size = 14 }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.none
  if (priority === 'none') {
    return <i className="bx bx-flag" style={{ fontSize: size, color: cfg.color }} title={cfg.label}></i>
  }
  return <i className="bx bxs-flag" style={{ fontSize: size, color: cfg.color }} title={cfg.label}></i>
}

function Avatar({ name, size = 26 }) {
  if (!name) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#334155', flexShrink: 0 }} />
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['#26c281', '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#8b5cf6']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }} title={name}>
      {initials}
    </div>
  )
}

function StatusDot({ color, size = 12 }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', background: color || '#94a3b8', flexShrink: 0 }} />
}

function StatusPill({ status }) {
  if (!status) return <span style={{ fontSize: '0.72rem', color: '#475569' }}>—</span>
  return (
    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, background: (status.color || '#334155') + '33', color: status.color || '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status.label}
    </span>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isPast(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString())
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function offsetDayStr(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

// ---- Assignee Multi-Picker ----
function AssigneePicker({ assigneeIds = [], workspaceUsers = [], onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const selected = workspaceUsers.filter(u => assigneeIds.includes(u.id))

  function toggle(uid) {
    const next = assigneeIds.includes(uid) ? assigneeIds.filter(id => id !== uid) : [...assigneeIds, uid]
    onChange(next)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', minHeight: 34 }}
      >
        {selected.length === 0 ? (
          <span style={{ fontSize: '0.83rem', color: '#475569' }}>Sem responsável</span>
        ) : (
          <div style={{ display: 'flex', gap: -4, flexWrap: 'wrap', gap: 4 }}>
            {selected.map(u => <Avatar key={u.id} name={u.full_name || u.email} size={22} />)}
          </div>
        )}
        <i className="bx bx-chevron-down" style={{ marginLeft: 'auto', color: '#64748b', fontSize: 14 }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bg-dark, #050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, zIndex: 200, minWidth: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: 240, overflowY: 'auto' }}>
          {workspaceUsers.length === 0 && <div style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#475569' }}>Sem usuários</div>}
          {workspaceUsers.map(u => {
            const checked = assigneeIds.includes(u.id)
            return (
              <div
                key={u.id}
                onClick={() => toggle(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', background: checked ? 'rgba(38,194,129,0.08)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent' }}
              >
                <Avatar name={u.full_name || u.email} size={24} />
                <span style={{ flex: 1, fontSize: '0.83rem', color: '#e2e8f0' }}>{u.full_name || u.email}</span>
                {checked && <i className="bx bx-check" style={{ color: '#26c281', fontSize: 16 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- Custom Field Value Editor ----
function CustomFieldValue({ field, value, onChange }) {
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
  const options = field.config?.options || []

  switch (field.field_type) {
    case 'text':
    case 'url':
    case 'email':
    case 'phone':
      return <input style={inputStyle} value={value || ''} onChange={e => onChange(e.target.value || null)} placeholder={field.name} />
    case 'textarea':
      return <textarea style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} value={value || ''} onChange={e => onChange(e.target.value || null)} rows={2} placeholder={field.name} />
    case 'number':
    case 'currency':
      return <input type="number" style={inputStyle} value={value ?? ''} onChange={e => onChange(e.target.value !== '' ? Number(e.target.value) : null)} placeholder="0" />
    case 'date':
      return <input type="date" style={{ ...inputStyle, colorScheme: 'dark' }} value={value || ''} onChange={e => onChange(e.target.value || null)} />
    case 'checkbox':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#26c281', width: 16, height: 16 }} />
          <span style={{ fontSize: '0.83rem', color: value ? '#26c281' : '#64748b' }}>{value ? 'Sim' : 'Não'}</span>
        </div>
      )
    case 'select':
      return (
        <select style={inputStyle} value={value || ''} onChange={e => onChange(e.target.value || null)}>
          <option value="">—</option>
          {options.map((o, i) => <option key={i} value={o.label}>{o.label}</option>)}
        </select>
      )
    case 'multiselect': {
      const selected = Array.isArray(value) ? value : []
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {options.map((o, i) => {
            const on = selected.includes(o.label)
            return (
              <button key={i} type="button" onClick={() => onChange(on ? selected.filter(v => v !== o.label) : [...selected, o.label])}
                style={{ padding: '3px 10px', borderRadius: 12, border: '1px solid', borderColor: on ? '#26c281' : 'rgba(255,255,255,0.12)', background: on ? 'rgba(38,194,129,0.15)' : 'transparent', color: on ? '#26c281' : '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: on ? 700 : 400 }}>
                {o.label}
              </button>
            )
          })}
        </div>
      )
    }
    case 'priority': {
      const PRIORITIES = [{ v:'urgent',l:'Urgente',c:'#ef4444'},{v:'high',l:'Alta',c:'#f97316'},{v:'medium',l:'Média',c:'#eab308'},{v:'low',l:'Baixa',c:'#3b82f6'},{v:'none',l:'Sem prioridade',c:'#64748b'}]
      return (
        <select style={inputStyle} value={value || 'none'} onChange={e => onChange(e.target.value)}>
          {PRIORITIES.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
        </select>
      )
    }
    default:
      return <input style={inputStyle} value={value || ''} onChange={e => onChange(e.target.value || null)} />
  }
}

// ---- Task Settings Panel ----
function TaskSettingsPanel({ onClose, onStatusChange, isMaster }) {
  const [tab, setTab] = useState('status')

  const tabs = [
    { key: 'status', label: 'Status', icon: 'bx-circle' },
    { key: 'fields', label: 'Campos', icon: 'bx-list-plus' },
    { key: 'prefs', label: 'Preferências', icon: 'bx-slider' },
    ...(isMaster ? [{ key: 'columns', label: 'Colunas', icon: 'bx-columns' }] : []),
  ]

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} onClick={onClose} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '95vw', background: 'var(--bg-dark, #050506)', borderLeft: '1px solid rgba(255,255,255,0.08)', zIndex: 2001, display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 48px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bx bx-cog" style={{ color: '#26c281' }} /> Configurações de Tarefas
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}><i className="bx bx-x" /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 16px' }}>
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #26c281' : '2px solid transparent', color: tab === t.key ? '#26c281' : '#64748b', cursor: 'pointer', fontSize: '0.83rem', fontWeight: tab === t.key ? 700 : 500, marginBottom: -1 }}>
              <i className={`bx ${t.icon}`} style={{ fontSize: 15 }} />{t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {tab === 'status' && (
            <StatusTemplatesManager onClose={() => { onStatusChange(); onClose() }} />
          )}
          {tab === 'fields' && <CustomFieldsManager />}
          {tab === 'columns' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 0 }}>
                As colunas do quadro Kanban correspondem aos <strong>status</strong> configurados na aba Status. Para criar, renomear ou reordenar colunas, edite os status na aba ao lado.
              </p>
              <button type="button" onClick={() => setTab('status')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(38,194,129,0.12)', border: '1px solid rgba(38,194,129,0.3)', color: '#26c281', padding: '8px 16px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <i className="bx bx-circle" /> Ir para Status
              </button>
            </div>
          )}
          {tab === 'prefs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Preferências de visualização são salvas automaticamente ao usar os controles da barra de ferramentas (filtros, modo de visualização, tarefas fechadas).</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ---- Inline Field Editor (for task row quick edits) ----
function InlineStatusPicker({ task, statuses, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const status = statuses.find(s => s.id === task.status_id)
  useEffect(() => {
    if (!open) return
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={e => { e.stopPropagation(); setOpen(v => !v) }} style={{ cursor: 'pointer' }}>
        {status ? (
          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, background: status.color + '33', color: status.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{status.label}</span>
        ) : (
          <span style={{ fontSize: '0.72rem', color: '#334155' }}>—</span>
        )}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: 'var(--bg-dark, #050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, zIndex: 300, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div onClick={e => { e.stopPropagation(); onChange(null); setOpen(false) }} style={{ padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem', color: '#475569' }}>Sem status</div>
          {statuses.map(s => (
            <div key={s.id} onClick={e => { e.stopPropagation(); onChange(s.id); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem', color: '#e2e8f0', background: task.status_id === s.id ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />{s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InlinePriorityPicker({ task, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={e => { e.stopPropagation(); setOpen(v => !v) }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
        <PriorityFlag priority={task.priority} size={14} />
      </div>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-dark, #050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, zIndex: 300, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
            <div key={k} onClick={e => { e.stopPropagation(); onChange(k); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: '0.82rem', color: v.color, background: task.priority === k ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
              <i className={`bx bx${k === 'none' ? '' : 's'}-flag`} style={{ fontSize: 14, color: v.color }} />{v.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InlineAssigneePicker({ task, workspaceUsers, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const assignee = workspaceUsers?.find(u => u.id === task.assignee_id)
  useEffect(() => {
    if (!open) return
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={e => { e.stopPropagation(); setOpen(v => !v) }} style={{ cursor: 'pointer' }}>
        <Avatar name={assignee?.full_name || assignee?.email} size={24} />
      </div>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--bg-dark, #050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, zIndex: 300, minWidth: 180, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div onClick={e => { e.stopPropagation(); onChange(null); setOpen(false) }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.82rem', color: '#475569' }}>Sem responsável</div>
          {(workspaceUsers || []).map(u => (
            <div key={u.id} onClick={e => { e.stopPropagation(); onChange(u.id); setOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', background: task.assignee_id === u.id ? 'rgba(38,194,129,0.08)' : 'transparent' }}>
              <Avatar name={u.full_name || u.email} size={22} />
              <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>{u.full_name || u.email}</span>
              {task.assignee_id === u.id && <i className="bx bx-check" style={{ color: '#26c281', fontSize: 14, marginLeft: 'auto' }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Task Row ----
function TaskRow({ task, statuses, clients, workspaceUsers, onOpenPanel, onQuickUpdate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const status = statuses.find(s => s.id === task.status_id)
  const client = clients?.find(c => c.id === task.client_id)
  const assignee = workspaceUsers?.find(u => u.id === task.assignee_id)
  const dueDateStr = task.due_date ? formatDate(task.due_date) : null
  const overdue = isPast(task.due_date)

  useEffect(() => {
    if (!menuOpen) return
    function handle(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [menuOpen])

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 8px', height: 44, gap: 8, transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Status inline picker */}
      <div style={{ width: 100, flexShrink: 0 }}>
        <InlineStatusPicker task={task} statuses={statuses} onChange={val => onQuickUpdate(task.id, { status_id: val })} />
      </div>
      {/* Title */}
      <div
        style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: '#e2e8f0' }}
        onClick={() => onOpenPanel(task)}
      >
        {task.title}
        {task.subtask_count > 0 && (
          <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#64748b', background: 'rgba(100,116,139,0.15)', borderRadius: 8, padding: '1px 6px' }}>
            {task.subtask_count}
          </span>
        )}
      </div>
      {/* Client */}
      <div style={{ width: 110, flexShrink: 0, fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {client?.name || <span style={{ color: '#334155' }}>—</span>}
      </div>
      {/* Assignee inline picker */}
      <div style={{ width: 36, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <InlineAssigneePicker task={task} workspaceUsers={workspaceUsers} onChange={val => onQuickUpdate(task.id, { assignee_id: val })} />
      </div>
      {/* Due date */}
      <div style={{ width: 90, flexShrink: 0, fontSize: '0.78rem', color: overdue ? '#ef4444' : (dueDateStr ? '#94a3b8' : '#334155'), textAlign: 'center' }}>
        {dueDateStr || '—'}
      </div>
      {/* Priority inline picker */}
      <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <InlinePriorityPicker task={task} onChange={val => onQuickUpdate(task.id, { priority: val })} />
      </div>
      {/* Menu */}
      <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0, position: 'relative' }} ref={menuRef}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: 16 }}
        >
          <i className="bx bx-dots-horizontal-rounded"></i>
        </button>
        {menuOpen && (
          <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, zIndex: 100, minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <button type="button" onClick={() => { setMenuOpen(false); onOpenPanel(task) }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem' }}>
              <i className="bx bx-expand-alt" style={{ marginRight: 8 }}></i>Abrir detalhes
            </button>
            <button type="button" onClick={() => { setMenuOpen(false); onQuickUpdate(task.id, { is_archived: true }) }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem' }}>
              <i className="bx bx-archive" style={{ marginRight: 8 }}></i>Arquivar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Home priority task row ----
function PriorityTaskRow({ task, statuses, spaces, workspaceUsers, onOpenPanel, sectionColor }) {
  const status = statuses.find(s => s.id === task.status_id)
  const assignee = workspaceUsers?.find(u => u.id === task.assignee_id)
  const space = spaces?.find(s => s.id === task.space_id)
  const dueDateStr = task.due_date ? formatDate(task.due_date) : null
  const overdue = isPast(task.due_date)

  return (
    <div
      onClick={() => onOpenPanel(task)}
      style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: 38, gap: 10, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {sectionColor && (
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: sectionColor, flexShrink: 0, boxShadow: `0 0 6px ${sectionColor}99` }} />
      )}
      <div style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e2e8f0' }}>
        {task.title}
      </div>
      {space && (
        <div style={{ flexShrink: 0, fontSize: '0.72rem', color: space.color, background: space.color + '20', borderRadius: 8, padding: '1px 7px', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <i className={`bx ${space.icon}`} style={{ marginRight: 4, fontSize: 10 }}></i>{space.name}
        </div>
      )}
      <div style={{ flexShrink: 0 }}>
        <Avatar name={assignee?.full_name || assignee?.email} size={22} />
      </div>
      <div style={{ width: 32, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <PriorityFlag priority={task.priority} size={13} />
      </div>
      <div style={{ width: 80, flexShrink: 0, fontSize: '0.75rem', color: overdue ? '#ef4444' : '#64748b', textAlign: 'right' }}>
        {dueDateStr || '—'}
      </div>
      <div style={{ flexShrink: 0 }}>
        <StatusPill status={status} />
      </div>
    </div>
  )
}

// ---- Priority Section ----
function PrioritySection({ title, color, tasks, statuses, spaces, workspaceUsers, onOpenPanel, defaultExpanded = true }) {
  const [collapsed, setCollapsed] = useState(!defaultExpanded)

  return (
    <div style={{ marginBottom: 8, borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0', background: 'rgba(255,255,255,0.02)' }}>
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', userSelect: 'none' }}
      >
        <i className={`bx bx-chevron-${collapsed ? 'right' : 'down'}`} style={{ fontSize: 15, color: '#64748b' }}></i>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: '0.73rem', color: '#64748b', background: 'rgba(100,116,139,0.15)', borderRadius: 10, padding: '0 7px' }}>
          {tasks.length}
        </span>
      </div>
      {!collapsed && tasks.length === 0 && (
        <div style={{ padding: '6px 12px 10px 28px', fontSize: '0.8rem', color: '#334155' }}>Nenhuma tarefa</div>
      )}
      {!collapsed && tasks.map(task => (
        <PriorityTaskRow
          key={task.id}
          task={task}
          statuses={statuses}
          spaces={spaces}
          workspaceUsers={workspaceUsers}
          onOpenPanel={onOpenPanel}
          sectionColor={color}
        />
      ))}
    </div>
  )
}

// ---- Space Card ----
function SpaceCard({ space, onClick }) {
  const [hovered, setHovered] = useState(false)
  const pct = space.task_count > 0 ? Math.round((space.completed_count / space.task_count) * 100) : 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: `4px solid ${space.color}`,
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        cursor: 'pointer',
        padding: '14px 16px',
        transition: 'background 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? `0 0 18px ${space.color}30` : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className={`bx ${space.icon}`} style={{ fontSize: 20, color: space.color }}></i>
        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{space.name}</span>
        {space.is_private && (
          <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, padding: '2px 7px', flexShrink: 0 }}>
            <i className="bx bx-lock" style={{ marginRight: 3, fontSize: 10 }}></i>Privado
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem' }}>
        <span style={{ color: '#64748b' }}>{space.task_count} tarefa{space.task_count !== 1 ? 's' : ''}</span>
        {space.overdue_count > 0 && <span style={{ color: '#ef4444', fontWeight: 600 }}>{space.overdue_count} atrasada{space.overdue_count !== 1 ? 's' : ''}</span>}
        <span style={{ color: '#22c55e' }}>{space.completed_count} concluída{space.completed_count !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 4 }}>
        <div style={{ height: '100%', background: space.color, borderRadius: 4, width: `${pct}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ fontSize: '0.72rem', color: '#475569' }}>{pct}% concluído</div>
    </div>
  )
}

// ---- New Space Modal ----
const WEEKLY_TEMPLATE_TASKS = [
  { title: 'Reunião de alinhamento semanal', due_offset: 0 },
  { title: 'Revisar métricas da semana anterior', due_offset: 0 },
  { title: 'Atualizar relatório de resultados', due_offset: 1 },
  { title: 'Acompanhar campanhas ativas', due_offset: 2 },
  { title: 'Reunião de feedback com cliente', due_offset: 3 },
  { title: 'Otimizações e ajustes de campanha', due_offset: 4 },
  { title: 'Fechamento semanal e próximos passos', due_offset: 6 },
]

function TemplateSemanalModal({ onClose, onCreate, workspaceUsers, statuses }) {
  const [spaceName, setSpaceName] = useState('Espaço Semanal')
  const [assigneeId, setAssigneeId] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!spaceName.trim()) return
    setSaving(true)
    try {
      const spaceRes = await fetch('/api/tasks/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: spaceName.trim(), color: '#3b82f6', icon: 'bx-calendar-week', is_private: false }),
      })
      const spaceJson = await spaceRes.json()
      if (!spaceJson.space) throw new Error('Erro ao criar espaço')
      const space = spaceJson.space

      const initialStatus = statuses.find(s => s.is_initial) || statuses[0]
      const today = new Date()

      for (const tmpl of WEEKLY_TEMPLATE_TASKS) {
        const due = new Date(today)
        due.setDate(due.getDate() + tmpl.due_offset)
        const dueStr = due.toISOString().split('T')[0]
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: tmpl.title,
            space_id: space.id,
            status_id: initialStatus?.id || null,
            assignee_id: assigneeId || null,
            due_date: dueStr,
          }),
        })
      }
      onCreate(space)
      onClose()
    } finally { setSaving(false) }
  }

  const inputStyle = { background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-dark, #050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 460, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
              <i className="bx bx-calendar-week" style={{ marginRight: 8, color: '#3b82f6' }}></i>
              Espaço Semanal
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Cria um espaço com tarefas pré-definidas para a semana</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome do espaço</label>
            <input
              value={spaceName}
              onChange={e => setSpaceName(e.target.value)}
              placeholder="Ex: Semana 01 - Janeiro"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Responsável</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={inputStyle}>
              <option value="">Sem responsável</option>
              {(workspaceUsers || []).map(u => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 22, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Tarefas do modelo</div>
            {WEEKLY_TEMPLATE_TASKS.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < WEEKLY_TEMPLATE_TASKS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <i className="bx bx-check-circle" style={{ color: '#3b82f6', fontSize: 14 }}></i>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{t.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#475569' }}>+{t.due_offset}d</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#3b82f6', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              {saving ? 'Criando...' : 'Criar Espaço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewSpaceModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#26c281', icon: 'bx-folder', is_private: false })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks/spaces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (json.space) { onCreate(json.space); onClose() }
    } finally { setSaving(false) }
  }

  const inputStyle = { background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-dark, #050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 440, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Novo Espaço</h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>
            <i className="bx bx-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Nome</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nome do espaço..."
              style={inputStyle}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição opcional..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Cor</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SPACE_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', transition: 'border 0.15s', boxSizing: 'border-box' }}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Ícone</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SPACE_ICONS.map(ic => (
                <div
                  key={ic.value}
                  onClick={() => setForm(f => ({ ...f, icon: ic.value }))}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: form.icon === ic.value ? form.color + '33' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.icon === ic.value ? form.color : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.15s' }}
                >
                  <i className={`bx ${ic.value}`} style={{ fontSize: 18, color: form.icon === ic.value ? form.color : '#64748b' }}></i>
                  <span style={{ fontSize: '0.65rem', color: form.icon === ic.value ? form.color : '#64748b' }}>{ic.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Visibilidade</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_private: false }))}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${!form.is_private ? '#26c281' : 'rgba(255,255,255,0.08)'}`, background: !form.is_private ? 'rgba(38,194,129,0.12)' : 'rgba(255,255,255,0.03)', color: !form.is_private ? '#4ade80' : '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }}
              >
                <i className="bx bx-group" style={{ marginRight: 6 }}></i>Toda a equipe
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_private: true }))}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${form.is_private ? '#26c281' : 'rgba(255,255,255,0.08)'}`, background: form.is_private ? 'rgba(38,194,129,0.12)' : 'rgba(255,255,255,0.03)', color: form.is_private ? '#4ade80' : '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }}
              >
                <i className="bx bx-lock" style={{ marginRight: 6 }}></i>Só eu
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || !form.name.trim()} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#26c281', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: saving || !form.name.trim() ? 0.6 : 1 }}>
              {saving ? 'Criando...' : 'Criar Espaço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Status Group ----
function StatusGroup({ status, tasks, statuses, clients, workspaceUsers, onOpenPanel, onQuickUpdate, onAddTask }) {
  const [collapsed, setCollapsed] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (addingTask && inputRef.current) inputRef.current.focus()
  }, [addingTask])

  function handleAddSubmit(e) {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) { setAddingTask(false); return }
    onAddTask({ title, status_id: status.id })
    setNewTitle('')
    setAddingTask(false)
  }

  return (
    <div style={{ marginBottom: 2 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', userSelect: 'none', borderRadius: 4 }}
        onClick={() => setCollapsed(v => !v)}
      >
        <i className={`bx bx-chevron-${collapsed ? 'right' : 'down'}`} style={{ fontSize: 16, color: '#64748b' }}></i>
        <StatusDot color={status.color} size={10} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{status.label}</span>
        <span style={{ fontSize: '0.75rem', color: '#64748b', background: 'rgba(100,116,139,0.15)', borderRadius: 10, padding: '0 7px', minWidth: 20, textAlign: 'center' }}>
          {tasks.length}
        </span>
      </div>

      {!collapsed && (
        <>
          {tasks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)', height: 30 }}>
              <div style={{ width: 28, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: '0.72rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nome</div>
              <div style={{ width: 120, flexShrink: 0, fontSize: '0.72rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Cliente</div>
              <div style={{ width: 36, flexShrink: 0, fontSize: '0.72rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>Resp.</div>
              <div style={{ width: 90, flexShrink: 0, fontSize: '0.72rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>Vencimento</div>
              <div style={{ width: 32, flexShrink: 0, fontSize: '0.72rem', color: '#475569', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>Prior.</div>
              <div style={{ width: 28, flexShrink: 0 }} />
            </div>
          )}

          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              statuses={statuses}
              clients={clients}
              workspaceUsers={workspaceUsers}
              onOpenPanel={onOpenPanel}
              onQuickUpdate={onQuickUpdate}
            />
          ))}

          {tasks.length === 0 && (
            <div style={{ padding: '10px 40px', fontSize: '0.8rem', color: '#334155' }}>Nenhuma tarefa</div>
          )}

          {addingTask ? (
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', gap: 8 }}>
              <div style={{ width: 28, flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onBlur={handleAddSubmit}
                onKeyDown={e => { if (e.key === 'Escape') { setAddingTask(false); setNewTitle('') } }}
                placeholder="Nome da tarefa..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, color: '#e2e8f0', padding: '5px 10px', fontSize: '0.85rem', outline: 'none' }}
              />
              <button type="submit" style={{ background: '#26c281', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: '0.82rem', cursor: 'pointer' }}>Adicionar</button>
              <button type="button" onClick={() => { setAddingTask(false); setNewTitle('') }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}>
                <i className="bx bx-x" style={{ fontSize: 18 }}></i>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingTask(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 36px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.82rem', width: '100%', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}
            >
              <i className="bx bx-plus" style={{ fontSize: 14 }}></i>
              Adicionar Tarefa
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ---- Side Panel ----
function TaskDetailPanel({ taskId, statuses, clients, workspaceUsers, onClose, onUpdated, isMaster, customFields }) {
  const [task, setTask] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [comments, setComments] = useState([])
  const [assigneeIds, setAssigneeIds] = useState([])
  const [fieldValues, setFieldValues] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTitle, setEditTitle] = useState(false)
  const [titleVal, setTitleVal] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmHardDelete, setConfirmHardDelete] = useState(false)
  const [hardDeleting, setHardDeleting] = useState(false)

  async function handleHardDelete() {
    setHardDeleting(true)
    try {
      await fetch(`/api/tasks/${taskId}?hard=true`, { method: 'DELETE' })
      onClose()
    } finally {
      setHardDeleting(false)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`)
      const json = await res.json()
      if (json.task) {
        setTask(json.task)
        setTitleVal(json.task.title)
        setChecklist(json.checklist || [])
        setSubtasks(json.subtasks || [])
        setComments(json.comments || [])
        setAssigneeIds(json.assignees || (json.task.assignee_id ? [json.task.assignee_id] : []))
        setFieldValues(json.fieldValues || [])
      }
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => { load() }, [load])

  async function updateField(field, value) {
    setSaving(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) })
      const json = await res.json()
      if (json.task) { setTask(json.task); onUpdated(json.task) }
    } finally { setSaving(false) }
  }

  async function updateAssignees(ids) {
    setAssigneeIds(ids)
    // Keep assignee_id as first for backwards compat
    const primaryId = ids[0] || null
    setSaving(true)
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee_id: primaryId, assignee_ids: ids }),
      })
      onUpdated({ ...task, assignee_id: primaryId })
    } finally { setSaving(false) }
  }

  async function updateCustomField(fieldId, value) {
    setFieldValues(prev => {
      const existing = prev.find(v => v.field_id === fieldId)
      if (existing) return prev.map(v => v.field_id === fieldId ? { ...v, _value: value } : v)
      return [...prev, { field_id: fieldId, _value: value }]
    })
    await fetch('/api/tasks/custom-fields/values', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, field_id: fieldId, value }),
    })
  }

  function getFieldValue(fieldId, fieldType) {
    const row = fieldValues.find(v => v.field_id === fieldId)
    if (!row) return null
    if (row._value !== undefined) return row._value
    if (['text','textarea','url','email','phone','select','user'].includes(fieldType)) return row.value_text
    if (['number','currency'].includes(fieldType)) return row.value_number
    if (fieldType === 'date') return row.value_date
    if (fieldType === 'checkbox') return row.value_bool
    if (fieldType === 'multiselect') return row.value_json
    return row.value_text
  }

  async function saveTitle() {
    setEditTitle(false)
    if (titleVal.trim() && titleVal !== task.title) await updateField('title', titleVal.trim())
    else setTitleVal(task?.title || '')
  }

  async function addCheckItem() {
    const label = newCheckItem.trim()
    if (!label) return
    setNewCheckItem('')
    const res = await fetch(`/api/tasks/${taskId}/checklist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) })
    const json = await res.json()
    if (json.item) setChecklist(prev => [...prev, json.item])
  }

  async function toggleCheckItem(item) {
    const res = await fetch(`/api/tasks/${taskId}/checklist`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, is_done: !item.is_done }) })
    const json = await res.json()
    if (json.item) setChecklist(prev => prev.map(c => c.id === item.id ? json.item : c))
  }

  async function deleteCheckItem(itemId) {
    await fetch(`/api/tasks/${taskId}/checklist?id=${itemId}`, { method: 'DELETE' })
    setChecklist(prev => prev.filter(c => c.id !== itemId))
  }

  async function addComment() {
    const body = newComment.trim()
    if (!body) return
    setNewComment('')
    const res = await fetch(`/api/tasks/${taskId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
    const json = await res.json()
    if (json.comment) setComments(prev => [...prev, json.comment])
  }

  async function addSubtask() {
    const title = newSubtask.trim()
    if (!title) return
    setNewSubtask('')
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, parent_task_id: taskId, status_id: task?.status_id || null }) })
    const json = await res.json()
    if (json.task) setSubtasks(prev => [...prev, json.task])
  }

  const doneCount = checklist.filter(c => c.is_done).length
  const checkPct = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0

  const labelStyle = { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }
  const fieldWrap = { marginBottom: 16 }
  const selectStyle = { background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: '0.85rem', width: '100%', outline: 'none' }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 480, background: 'var(--bg-dark, #050506)', borderLeft: '1px solid rgba(255,255,255,0.08)', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Detalhes da tarefa</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 4 }}>
          <i className="bx bx-x"></i>
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 24, color: '#64748b', fontSize: '0.85rem' }}>Carregando...</div>
      ) : !task ? (
        <div style={{ padding: 24, color: '#ef4444', fontSize: '0.85rem' }}>Tarefa não encontrada.</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ marginBottom: 20 }}>
            {editTitle ? (
              <input
                value={titleVal}
                onChange={e => setTitleVal(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(false); setTitleVal(task.title) } }}
                autoFocus
                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.5)', borderRadius: 6, color: '#f1f5f9', padding: '6px 10px', outline: 'none' }}
              />
            ) : (
              <h2
                onClick={() => setEditTitle(true)}
                style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', cursor: 'text', lineHeight: 1.3 }}
              >
                {task.title}
              </h2>
            )}
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Status</div>
            <select value={task.status_id || ''} onChange={e => updateField('status_id', e.target.value || null)} style={selectStyle}>
              <option value="">Sem status</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Prioridade</div>
            <select value={task.priority} onChange={e => updateField('priority', e.target.value)} style={selectStyle}>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Responsável{assigneeIds.length > 1 ? ` (${assigneeIds.length})` : ''}</div>
            <AssigneePicker
              assigneeIds={assigneeIds}
              workspaceUsers={workspaceUsers || []}
              onChange={updateAssignees}
            />
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Cliente</div>
            <select value={task.client_id || ''} onChange={e => updateField('client_id', e.target.value || null)} style={selectStyle}>
              <option value="">Nenhum</option>
              {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Data de vencimento</div>
            <input
              type="date"
              value={task.due_date || ''}
              onChange={e => updateField('due_date', e.target.value || null)}
              style={{ ...selectStyle, colorScheme: 'dark' }}
            />
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Descrição</div>
            <textarea
              defaultValue={task.description || ''}
              onBlur={e => { if (e.target.value !== (task.description || '')) updateField('description', e.target.value) }}
              placeholder="Adicione uma descrição..."
              rows={3}
              style={{ ...selectStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {/* Custom Fields */}
          {(customFields || []).length > 0 && (
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ ...labelStyle, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="bx bx-list-plus" style={{ fontSize: 12 }} /> Campos Personalizados
              </div>
              {(customFields || []).map(field => (
                <div key={field.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: field.color || '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`bx ${field.icon || 'bx-list-plus'}`} style={{ fontSize: 11 }} />{field.name}
                    {field.is_required && <span style={{ color: '#ef4444' }}>*</span>}
                  </div>
                  <CustomFieldValue
                    field={field}
                    value={getFieldValue(field.id, field.field_type)}
                    onChange={val => updateCustomField(field.id, val)}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={fieldWrap}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={labelStyle}>Checklist {checklist.length > 0 && `${doneCount}/${checklist.length}`}</div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{checkPct}%</span>
            </div>
            {checklist.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 4, marginBottom: 10 }}>
                <div style={{ height: '100%', background: '#22c55e', borderRadius: 4, width: `${checkPct}%`, transition: 'width 0.3s' }} />
              </div>
            )}
            {checklist.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <input
                  type="checkbox"
                  checked={item.is_done}
                  onChange={() => toggleCheckItem(item)}
                  style={{ accentColor: '#22c55e', width: 14, height: 14, flexShrink: 0 }}
                />
                <span style={{ flex: 1, fontSize: '0.83rem', color: item.is_done ? '#475569' : '#cbd5e1', textDecoration: item.is_done ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
                <button type="button" onClick={() => deleteCheckItem(item.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2 }}>
                  <i className="bx bx-x" style={{ fontSize: 14 }}></i>
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCheckItem()}
                placeholder="Adicionar item..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#e2e8f0', padding: '5px 8px', fontSize: '0.82rem', outline: 'none' }}
              />
              <button type="button" onClick={addCheckItem} style={{ background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
                <i className="bx bx-plus"></i>
              </button>
            </div>
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Subtarefas ({subtasks.length})</div>
            {subtasks.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.83rem', color: '#cbd5e1' }}>
                <StatusDot color={statuses.find(st => st.id === s.status_id)?.color} size={8} />
                {s.title}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSubtask()}
                placeholder="Adicionar subtarefa..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#e2e8f0', padding: '5px 8px', fontSize: '0.82rem', outline: 'none' }}
              />
              <button type="button" onClick={addSubtask} style={{ background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
                <i className="bx bx-plus"></i>
              </button>
            </div>
          </div>

          <div style={fieldWrap}>
            <div style={labelStyle}>Comentários ({comments.length})</div>
            {comments.map(c => (
              <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: 3 }}>
                  {new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{ fontSize: '0.83rem', color: '#cbd5e1' }}>{c.body}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()}
                placeholder="Escrever comentário..."
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#e2e8f0', padding: '5px 8px', fontSize: '0.82rem', outline: 'none' }}
              />
              <button type="button" onClick={addComment} style={{ background: '#26c281', border: 'none', color: '#fff', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
                Enviar
              </button>
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#334155' }}>
            Criado em {new Date(task.created_at).toLocaleDateString('pt-BR')}
            {saving && <span style={{ marginLeft: 8, color: '#26c281' }}>Salvando...</span>}
          </div>

          {isMaster && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {!confirmHardDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmHardDelete(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.35)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  <i className="bx bx-trash" /> Excluir definitivamente
                </button>
              ) : (
                <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
                  <div style={{ fontSize: '0.82rem', color: '#fca5a5', marginBottom: 10 }}>
                    Tem certeza? Esta ação não pode ser desfeita.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleHardDelete}
                      disabled={hardDeleting}
                      style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, opacity: hardDeleting ? 0.6 : 1 }}
                    >
                      {hardDeleting ? 'Excluindo...' : 'Sim, excluir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmHardDelete(false)}
                      style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Home View ----
function HomeView({ tasks, statuses, spaces, workspaceUsers, onOpenPanel, onNewSpace, onSpaceClick, onGrTasksClick }) {
  const today = todayStr()
  const tomorrow = offsetDayStr(1)
  const day2 = offsetDayStr(2)
  const day7 = offsetDayStr(7)

  const closedIds = new Set(statuses.filter(s => s.is_closed).map(s => s.id))
  const openTasks = tasks.filter(t => !closedIds.has(t.status_id))

  const overdue = openTasks.filter(t => t.due_date && t.due_date < today)
  const todayTasks = openTasks.filter(t => t.due_date === today)
  const tomorrowTasks = openTasks.filter(t => t.due_date === tomorrow)
  const next7 = openTasks.filter(t => t.due_date && t.due_date >= day2 && t.due_date <= day7)

  return (
    <div>
      {/* Priority sections */}
      <div style={{ marginBottom: 28 }}>
        <PrioritySection title="Atrasadas" color="#ef4444" tasks={overdue} statuses={statuses} spaces={spaces} workspaceUsers={workspaceUsers} onOpenPanel={onOpenPanel} />
        <PrioritySection title="Hoje" color="#f97316" tasks={todayTasks} statuses={statuses} spaces={spaces} workspaceUsers={workspaceUsers} onOpenPanel={onOpenPanel} />
        <PrioritySection title="Amanha" color="#eab308" tasks={tomorrowTasks} statuses={statuses} spaces={spaces} workspaceUsers={workspaceUsers} onOpenPanel={onOpenPanel} defaultExpanded={false} />
        <PrioritySection title="Proximos 7 dias" color="#3b82f6" tasks={next7} statuses={statuses} spaces={spaces} workspaceUsers={workspaceUsers} onOpenPanel={onOpenPanel} defaultExpanded={false} />
      </div>

      {/* Spaces */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#94a3b8' }}>
            <i className="bx bx-collection" style={{ marginRight: 8, color: '#26c281' }}></i>
            Meus Espacos
          </h3>
          <button
            type="button"
            onClick={onNewSpace}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(38,194,129,0.15)', border: '1px solid rgba(38,194,129,0.3)', color: '#4ade80', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <i className="bx bx-plus" style={{ fontSize: 14 }}></i>
            Novo Espaco
          </button>
        </div>

        {spaces.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155', fontSize: '0.85rem' }}>
            <i className="bx bx-folder-open" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}></i>
            Nenhum espaco criado ainda.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {spaces.map(space => (
            <SpaceCard key={space.id} space={space} onClick={() => onSpaceClick(space)} />
          ))}
          {onGrTasksClick && (
            <GrSpaceCard onClick={onGrTasksClick} />
          )}
        </div>
      </div>
    </div>
  )
}

function GrSpaceCard({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        borderTop: '4px solid #8b5cf6',
        background: hovered ? 'rgba(139,92,246,0.10)' : 'rgba(139,92,246,0.04)',
        cursor: 'pointer',
        padding: '14px 16px',
        transition: 'background 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? '0 0 18px #8b5cf630' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="bx bx-target-lock" style={{ fontSize: 20, color: '#8b5cf6' }}></i>
        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9', flex: 1 }}>G.R. Tarefas</span>
        <span style={{ fontSize: '0.68rem', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', borderRadius: 8, padding: '2px 7px', flexShrink: 0 }}>GR</span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Tarefas do Gestor de Resultado</div>
      <div style={{ fontSize: '0.72rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 4 }}>
        <i className="bx bx-right-arrow-alt"></i> Abrir módulo
      </div>
    </div>
  )
}

// ---- Space View ----
// ---- Board View (Kanban) ----
function BoardView({ spaceTasks, statuses, clients, workspaceUsers, onOpenPanel, onQuickUpdate, onAddTask, spaceId }) {
  const CARD_WIDTH = 260

  function handleDrop(e, statusId) {
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onQuickUpdate(taskId, { status_id: statusId })
  }

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
      {statuses.map(status => {
        const colTasks = spaceTasks.filter(t => t.status_id === status.id)
        return (
          <div
            key={status.id}
            style={{ minWidth: CARD_WIDTH, maxWidth: CARD_WIDTH, flexShrink: 0 }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(e, status.id)}
          >
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 10px', marginBottom: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', borderTop: `3px solid ${status.color}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>{status.label}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', background: 'rgba(100,116,139,0.18)', borderRadius: 8, padding: '0 6px' }}>{colTasks.length}</span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colTasks.map(task => {
                const assignee = workspaceUsers?.find(u => u.id === task.assignee_id)
                const client = clients?.find(c => c.id === task.client_id)
                const overdue = isPast(task.due_date)
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('taskId', task.id)}
                    onClick={() => onOpenPanel(task)}
                    style={{
                      background: 'var(--bg-panel, #111113)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.15s, transform 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,0,0,0.4)`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</div>
                    {client && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <i className="bx bx-building" style={{ marginRight: 4 }} />{client.name}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                      <PriorityFlag priority={task.priority} size={13} />
                      {task.due_date && (
                        <span style={{ fontSize: '0.72rem', color: overdue ? '#ef4444' : '#64748b' }}>
                          <i className="bx bx-calendar" style={{ marginRight: 3 }} />{formatDate(task.due_date)}
                        </span>
                      )}
                      <div style={{ flex: 1 }} />
                      <Avatar name={assignee?.full_name || assignee?.email} size={22} />
                    </div>
                    {task.subtask_count > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="bx bx-list-check" style={{ fontSize: 12 }} />{task.subtask_count} subtarefas
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add task inline */}
              <button
                type="button"
                onClick={() => onAddTask({ title: 'Nova tarefa', status_id: status.id, space_id: spaceId })}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, color: '#475569', cursor: 'pointer', fontSize: '0.8rem', width: '100%', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#26c28166'; e.currentTarget.style.color = '#26c281' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#475569' }}
              >
                <i className="bx bx-plus" style={{ fontSize: 14 }} /> Adicionar
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- Table View ----
function TableView({ spaceTasks, statuses, clients, workspaceUsers, onOpenPanel, onQuickUpdate, columns = [] }) {
  const PRIORITY_LABELS = { urgent: 'Urgente', high: 'Alta', medium: 'Média', low: 'Baixa', none: '—' }
  const PRIORITY_COLORS = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6', none: '#64748b' }

  const visibleCols = columns.filter(c => c.visible)
  const thStyle = { padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap', userSelect: 'none' }
  const tdStyle = { padding: '10px 12px', fontSize: '0.83rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' }

  function renderCell(task, colKey) {
    const status = statuses.find(s => s.id === task.status_id)
    const assignee = workspaceUsers?.find(u => u.id === task.assignee_id)
    const client = clients?.find(c => c.id === task.client_id)
    const overdue = isPast(task.due_date)

    switch (colKey) {
      case 'title':
        return (
          <td key={colKey} style={{ ...tdStyle, fontWeight: 600, color: '#f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusDot color={status?.color} size={8} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{task.title}</span>
              {task.subtask_count > 0 && <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(100,116,139,0.15)', borderRadius: 8, padding: '0 5px', flexShrink: 0 }}>{task.subtask_count}</span>}
            </div>
          </td>
        )
      case 'status':
        return (
          <td key={colKey} style={tdStyle}>
            {status ? <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 8, background: status.color + '22', color: status.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{status.label}</span> : <span style={{ color: '#334155' }}>—</span>}
          </td>
        )
      case 'priority':
        return (
          <td key={colKey} style={tdStyle}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: PRIORITY_COLORS[task.priority] || '#64748b' }}>{PRIORITY_LABELS[task.priority] || '—'}</span>
          </td>
        )
      case 'assignee':
        return (
          <td key={colKey} style={tdStyle}>
            {assignee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={assignee.full_name || assignee.email} size={22} />
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{assignee.full_name || assignee.email}</span>
              </div>
            ) : <span style={{ color: '#334155' }}>—</span>}
          </td>
        )
      case 'client':
        return <td key={colKey} style={{ ...tdStyle, color: '#94a3b8', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client?.name || <span style={{ color: '#334155' }}>—</span>}</td>
      case 'due_date':
        return <td key={colKey} style={{ ...tdStyle, color: overdue ? '#ef4444' : '#94a3b8', whiteSpace: 'nowrap' }}>{task.due_date ? formatDate(task.due_date) : <span style={{ color: '#334155' }}>—</span>}</td>
      case 'start_date':
        return <td key={colKey} style={{ ...tdStyle, color: '#94a3b8', whiteSpace: 'nowrap' }}>{task.start_date ? formatDate(task.start_date) : <span style={{ color: '#334155' }}>—</span>}</td>
      case 'task_public_id':
        return <td key={colKey} style={{ ...tdStyle, color: '#26c281', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{task.task_public_id || '—'}</td>
      case 'created_at':
        return <td key={colKey} style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{task.created_at ? formatDate(task.created_at.slice(0, 10)) : '—'}</td>
      default:
        // Custom field columns
        return <td key={colKey} style={{ ...tdStyle, color: '#64748b' }}>—</td>
    }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {visibleCols.map(col => (
              <th key={col.key} style={{ ...thStyle, width: col.width }}>
                {col.isCustom && <span style={{ color: col.color || '#26c281', marginRight: 5 }}>●</span>}
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spaceTasks.length === 0 && (
            <tr><td colSpan={visibleCols.length} style={{ ...tdStyle, textAlign: 'center', color: '#334155', padding: 32 }}>Nenhuma tarefa neste espaço</td></tr>
          )}
          {spaceTasks.map(task => (
            <tr
              key={task.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onOpenPanel(task)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {visibleCols.map(col => renderCell(task, col.key))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---- Calendar View ----
function CalendarView({ spaceTasks, statuses, onOpenPanel }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1
  const todayISO = todayStr()

  const tasksByDay = {}
  spaceTasks.forEach(t => {
    if (t.due_date) {
      const key = t.due_date.slice(0, 10)
      if (!tasksByDay[key]) tasksByDay[key] = []
      tasksByDay[key].push(t)
    }
  })

  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const cells = []
  for (let i = 0; i < paddingDays; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: 16 }}>
          <i className="bx bx-chevron-left" />
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', textTransform: 'capitalize', minWidth: 160, textAlign: 'center' }}>{monthLabel}</span>
        <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: 16 }}>
          <i className="bx bx-chevron-right" />
        </button>
        <button type="button" onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#64748b', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem' }}>
          Hoje
        </button>
        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#64748b' }}>
          {spaceTasks.filter(t => t.due_date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} tarefa(s) no mês
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', background: 'rgba(255,255,255,0.03)' }}>{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} style={{ background: 'var(--bg-dark, #050506)', minHeight: 80 }} />
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = tasksByDay[iso] || []
          const isToday = iso === todayISO
          return (
            <div
              key={iso}
              style={{ background: 'var(--bg-dark, #050506)', minHeight: 80, padding: '6px 6px', border: isToday ? '1px solid #26c28144' : 'none', position: 'relative' }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: isToday ? 800 : 400, color: isToday ? '#26c281' : '#64748b', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{day}</span>
                {dayTasks.length > 0 && <span style={{ fontSize: '0.65rem', color: '#26c281', fontWeight: 700 }}>{dayTasks.length}</span>}
              </div>
              {dayTasks.slice(0, 3).map(task => {
                const status = statuses.find(s => s.id === task.status_id)
                return (
                  <div
                    key={task.id}
                    onClick={() => onOpenPanel(task)}
                    style={{ fontSize: '0.68rem', background: (status?.color || '#26c281') + '22', color: status?.color || '#26c281', borderRadius: 4, padding: '2px 5px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: 600 }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                )
              })}
              {dayTasks.length > 3 && <div style={{ fontSize: '0.65rem', color: '#64748b', paddingTop: 2 }}>+{dayTasks.length - 3} mais</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- SpaceView (with view mode switcher) ----
function SpaceView({ space, tasks, statuses, clients, workspaceUsers, onBack, onOpenPanel, onQuickUpdate, onAddTask, onNewTask, viewMode, columns }) {
  const spaceTasks = tasks.filter(t => t.space_id === space.id)

  const filteredByStatus = statuses.map(status => ({
    status,
    tasks: spaceTasks.filter(t => t.status_id === status.id),
  }))

  return (
    <div>
      {/* Space header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
        >
          <i className="bx bx-arrow-back" style={{ fontSize: 16 }}></i>
          Espaços
        </button>
        <span style={{ color: '#334155' }}>/</span>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: space.color, flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>{space.name}</span>
          {space.description && <span style={{ marginLeft: 10, fontSize: '0.8rem', color: '#64748b' }}>{space.description}</span>}
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => {
            if (onNewTask) onNewTask({ space_id: space.id, status_id: statuses[0]?.id })
            else if (onAddTask) { const firstStatus = statuses[0]; if (firstStatus) onAddTask({ title: 'Nova tarefa', status_id: firstStatus.id, space_id: space.id }) }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <i className="bx bx-plus" style={{ fontSize: 16 }}></i>
          Nova Tarefa
        </button>
      </div>

      {/* Task content by viewMode */}
      {viewMode === 'list' && filteredByStatus.map(({ status, tasks: groupTasks }) => (
        <StatusGroup
          key={status.id}
          status={status}
          tasks={groupTasks}
          statuses={statuses}
          clients={clients}
          workspaceUsers={workspaceUsers}
          onOpenPanel={onOpenPanel}
          onQuickUpdate={onQuickUpdate}
          onAddTask={fields => onAddTask({ ...fields, space_id: space.id })}
        />
      ))}

      {viewMode === 'list' && (() => {
        const noStatus = spaceTasks.filter(t => !t.status_id)
        if (noStatus.length === 0) return null
        return (
          <StatusGroup
            key="no-status"
            status={{ id: null, label: 'Sem status', color: '#334155' }}
            tasks={noStatus}
            statuses={statuses}
            clients={clients}
            workspaceUsers={workspaceUsers}
            onOpenPanel={onOpenPanel}
            onQuickUpdate={onQuickUpdate}
            onAddTask={fields => onAddTask({ ...fields, status_id: null, space_id: space.id })}
          />
        )
      })()}

      {viewMode === 'board' && (
        <BoardView
          spaceTasks={spaceTasks}
          statuses={statuses}
          clients={clients}
          workspaceUsers={workspaceUsers}
          onOpenPanel={onOpenPanel}
          onQuickUpdate={onQuickUpdate}
          onAddTask={onAddTask}
          spaceId={space.id}
        />
      )}

      {viewMode === 'table' && (
        <TableView
          spaceTasks={spaceTasks}
          statuses={statuses}
          clients={clients}
          workspaceUsers={workspaceUsers}
          onOpenPanel={onOpenPanel}
          onQuickUpdate={onQuickUpdate}
          columns={columns}
        />
      )}

      {viewMode === 'calendar' && (
        <CalendarView
          spaceTasks={spaceTasks}
          statuses={statuses}
          onOpenPanel={onOpenPanel}
        />
      )}
    </div>
  )
}

// ---- Main Component ----
export default function TasksTab({ clients, workspaceUsers, isMaster, currentUserId, onGrTasksClick }) {
  const [statuses, setStatuses] = useState([])
  const [tasks, setTasks] = useState([])
  const [spaces, setSpaces] = useState([])
  const [customFields, setCustomFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  // Multi-user filter — defaults to current user (Minhas tarefas)
  const [filterAssignees, setFilterAssignees] = useState(() => currentUserId ? [currentUserId] : [])
  const [filterClient, setFilterClient] = useState('')
  const [view, setView] = useState('home')
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [viewMode, setViewMode] = useState('list') // list | board | table | calendar
  const [columns, setColumns] = useState(DEFAULT_COLUMNS)
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false)
  const [showStatusManager, setShowStatusManager] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAutomations, setShowAutomations] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showClosedTasks, setShowClosedTasks] = useState(false)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [newTaskContext, setNewTaskContext] = useState({})
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)

  const loadStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/status-templates')
      const json = await res.json()
      if (json.templates?.length) {
        const defaultTmpl = json.templates.find(t => t.is_default) || json.templates[0]
        setStatuses((defaultTmpl.items || []).map(item => ({
          id: item.id,
          label: item.name,
          color: item.color,
          is_completed: item.is_completed,
          is_initial: item.is_initial,
          is_closed: item.is_closed,
          pauses_sla: item.pauses_sla,
          sort_order: item.sort_order,
        })))
      }
    } catch {}
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [taskRes, spacesRes, fieldsRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks/spaces'),
        fetch('/api/tasks/custom-fields?entity_type=task'),
      ])
      const [taskJson, spacesJson, fieldsJson] = await Promise.all([taskRes.json(), spacesRes.json(), fieldsRes.json()])
      if (taskJson.tasks) setTasks(taskJson.tasks)
      if (spacesJson.spaces) setSpaces(spacesJson.spaces)
      if (fieldsJson.fields) setCustomFields(fieldsJson.fields)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load user preferences (filter + columns + last view)
  useEffect(() => {
    fetch('/api/tasks/preferences').then(r => r.json()).then(json => {
      if (json.preferences) {
        const prefs = json.preferences
        if (Array.isArray(prefs.filter_assignee_ids) && prefs.filter_assignee_ids.length > 0) {
          setFilterAssignees(prefs.filter_assignee_ids)
        }
        if (prefs.default_view_mode) setViewMode(prefs.default_view_mode)
        if (prefs.show_closed_tasks !== undefined) setShowClosedTasks(!!prefs.show_closed_tasks)
      }
      setPrefsLoaded(true)
    }).catch(() => setPrefsLoaded(true))
  }, [])

  // Persist user preferences when filters/viewMode change
  const savePrefsTimeout = useRef(null)
  useEffect(() => {
    if (!prefsLoaded) return
    clearTimeout(savePrefsTimeout.current)
    savePrefsTimeout.current = setTimeout(() => {
      fetch('/api/tasks/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter_assignee_ids: filterAssignees, default_view_mode: viewMode, show_closed_tasks: showClosedTasks }),
      }).catch(() => {})
    }, 800)
  }, [filterAssignees, viewMode, showClosedTasks, prefsLoaded])

  useEffect(() => { loadData(); loadStatuses() }, [loadData, loadStatuses])

  async function handleAddTask(fields) {
    // Default assignee to current user so the task remains visible under "Minhas tarefas" filter
    const payload = {
      assignee_id: currentUserId || null,
      ...fields,
    }
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (json.task) setTasks(prev => [...prev, json.task])
  }

  async function handleQuickUpdate(taskId, updates) {
    const res = await fetch('/api/tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: taskId, ...updates }) })
    const json = await res.json()
    if (json.task) {
      if (updates.is_archived) setTasks(prev => prev.filter(t => t.id !== taskId))
      else setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...json.task } : t))
    }
  }

  function handlePanelUpdate(updatedTask) {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask, status: updatedTask.status } : t))
  }

  function handleSpaceCreated(space) {
    setSpaces(prev => [...prev, space])
  }

  const filteredTasks = tasks.filter(t => {
    if (filterAssignees.length > 0 && !filterAssignees.includes(t.assignee_id)) return false
    if (filterClient && t.client_id !== filterClient) return false
    if (!showClosedTasks && t.closed_at) return false
    return true
  })

  const selectStyle = { background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: '0.82rem', outline: 'none' }

  return (
    <div style={{ minHeight: '100%', color: '#e2e8f0', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, marginRight: 8 }}>
          <i className="bx bx-task" style={{ marginRight: 8, color: '#26c281' }}></i>
          {view === 'space' && selectedSpace ? selectedSpace.name : 'Tarefas'}
        </h2>

        {/* User filter — always visible */}
        <UserFilterPicker
          users={workspaceUsers || []}
          value={filterAssignees}
          onChange={setFilterAssignees}
          currentUserId={currentUserId}
        />

        {/* Client filter */}
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={selectStyle}>
          <option value="">Todos os clientes</option>
          {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {(filterAssignees.length > 0 || filterClient) && (
          <button type="button" onClick={() => { setFilterAssignees([]); setFilterClient('') }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 3 }}>
            <i className="bx bx-x"></i> Limpar
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* View mode switcher — shown when inside a space */}
        {view === 'space' && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 2, gap: 2 }}>
            {[
              { key: 'list', icon: 'bx-list-ul', label: 'Lista' },
              { key: 'board', icon: 'bx-columns', label: 'Board' },
              { key: 'table', icon: 'bx-table', label: 'Tabela' },
              { key: 'calendar', icon: 'bx-calendar', label: 'Calendário' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setViewMode(key)}
                title={label}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                  background: viewMode === key ? '#26c281' : 'transparent',
                  color: viewMode === key ? '#fff' : '#64748b',
                }}
              >
                <i className={`bx ${icon}`} style={{ fontSize: 15 }} />
                <span style={{ display: 'none' }}>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Column manager — visible in table view */}
        {view === 'space' && viewMode === 'table' && (
          <ColumnManager
            columns={columns}
            onChange={setColumns}
            customFields={customFields}
          />
        )}

        <button
          type="button"
          onClick={() => setShowSettings(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          <i className="bx bx-cog"></i> Configurações
        </button>

        {/* Toggle fechadas */}
        <button
          type="button"
          onClick={() => setShowClosedTasks(v => !v)}
          title={showClosedTasks ? 'Ocultar tarefas fechadas' : 'Mostrar tarefas fechadas'}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: showClosedTasks ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showClosedTasks ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.1)'}`, color: showClosedTasks ? '#6366f1' : '#94a3b8', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s' }}
        >
          <i className={`bx ${showClosedTasks ? 'bx-show' : 'bx-hide'}`}></i> Fechadas
        </button>

        {/* Arquivadas */}
        <button
          type="button"
          onClick={() => setShowArchived(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer' }}
        >
          <i className="bx bx-archive"></i> Arquivadas
        </button>

        {isMaster && (
          <button
            type="button"
            onClick={() => setShowAutomations(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: showAutomations ? 'rgba(38,194,129,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${showAutomations ? 'rgba(38,194,129,0.35)' : 'rgba(255,255,255,0.1)'}`, color: showAutomations ? '#26c281' : '#94a3b8', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <i className="bx bx-zap"></i> Automações
          </button>
        )}

        {view === 'home' && (
          <button
            type="button"
            onClick={() => setShowTemplatesModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '7px 14px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <i className="bx bx-layout" style={{ fontSize: 16 }}></i>
            Modelos
          </button>
        )}

        {view === 'home' && (
          <button
            type="button"
            onClick={() => setShowNewSpaceModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(38,194,129,0.12)', border: '1px solid rgba(38,194,129,0.3)', color: '#4ade80', padding: '7px 14px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <i className="bx bx-plus" style={{ fontSize: 16 }}></i>
            Novo Espaco
          </button>
        )}

        {view === 'home' && (
          <button
            type="button"
            onClick={() => { setNewTaskContext({}); setShowNewTaskModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <i className="bx bx-plus" style={{ fontSize: 16 }}></i>
            Nova Tarefa
          </button>
        )}
      </div>

      {loading && (
        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 24 }}></i>
        </div>
      )}

      {!loading && view === 'home' && (
        <div style={{ paddingTop: 16 }}>
          <HomeView
            tasks={tasks}
            statuses={statuses}
            spaces={spaces}
            workspaceUsers={workspaceUsers}
            onOpenPanel={task => setSelectedTaskId(task.id)}
            onNewSpace={() => setShowNewSpaceModal(true)}
            onSpaceClick={space => { setSelectedSpace(space); setView('space') }}
            onGrTasksClick={onGrTasksClick || null}
          />
        </div>
      )}

      {!loading && view === 'space' && selectedSpace && (
        <div style={{ paddingTop: 12 }}>
          <SpaceView
            space={selectedSpace}
            tasks={filteredTasks}
            statuses={statuses}
            clients={clients}
            workspaceUsers={workspaceUsers}
            onBack={() => { setView('home'); setSelectedSpace(null) }}
            onOpenPanel={task => setSelectedTaskId(task.id)}
            onQuickUpdate={handleQuickUpdate}
            onAddTask={handleAddTask}
            onNewTask={ctx => { setNewTaskContext(ctx); setShowNewTaskModal(true) }}
            viewMode={viewMode}
            columns={columns}
          />
        </div>
      )}

      {/* Side panel */}
      {selectedTaskId && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }}
            onClick={() => setSelectedTaskId(null)}
          />
          <TaskDetailPanel
            taskId={selectedTaskId}
            statuses={statuses}
            clients={clients}
            workspaceUsers={workspaceUsers}
            onClose={() => setSelectedTaskId(null)}
            onUpdated={handlePanelUpdate}
            isMaster={isMaster}
            customFields={customFields}
          />
        </>
      )}

      {showStatusManager && (
        <StatusTemplatesManager
          onClose={() => { setShowStatusManager(false); loadStatuses() }}
        />
      )}

      {showSettings && (
        <TaskSettingsPanel
          onClose={() => setShowSettings(false)}
          onStatusChange={() => loadStatuses()}
          isMaster={isMaster}
        />
      )}

      {/* New space modal */}
      {showNewSpaceModal && (
        <NewSpaceModal
          onClose={() => setShowNewSpaceModal(false)}
          onCreate={handleSpaceCreated}
        />
      )}

      {/* Templates modal */}
      {showTemplatesModal && (
        <TemplateSemanalModal
          onClose={() => setShowTemplatesModal(false)}
          onCreate={space => { handleSpaceCreated(space); loadData() }}
          workspaceUsers={workspaceUsers}
          statuses={statuses}
        />
      )}

      {/* Automations overlay — z-index above notification bell (10000) */}
      {showAutomations && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10001 }}
            onClick={() => setShowAutomations(false)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 10002,
            width: '780px', maxWidth: '95vw',
            background: 'var(--bg-panel, #111113)',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: 'var(--bg-panel, #111113)', zIndex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bx bx-zap"></i> Automações
              </span>
              <button onClick={() => setShowAutomations(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 20, display: 'flex', alignItems: 'center' }}>
                <i className="bx bx-x" />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <AutomationsTab workspaceUsers={workspaceUsers || []} isMaster={isMaster} />
            </div>
          </div>
        </>
      )}

      {showNewTaskModal && (
        <NewTaskModal
          onClose={() => setShowNewTaskModal(false)}
          onSaved={(task) => {
            setTasks(prev => [...prev, task])
          }}
          defaultContext={newTaskContext}
          spaces={spaces}
          clients={clients}
          workspaceUsers={workspaceUsers || []}
          statuses={statuses}
          customFields={customFields}
        />
      )}

      {showArchived && (
        <ArchivedTasksPanel
          workspaceUsers={workspaceUsers || []}
          clients={clients || []}
          spaces={spaces}
          statuses={statuses}
          onClose={() => setShowArchived(false)}
          onRestored={(task) => {
            setTasks(prev => [...prev, task])
          }}
          isMaster={isMaster}
        />
      )}
    </div>
  )
}
