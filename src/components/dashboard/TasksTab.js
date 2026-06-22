'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

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

const SPACE_COLORS = ['#6366f1', '#26c281', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

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
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#3b82f6']
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
      style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 8px', height: 40, gap: 8, cursor: 'pointer', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <StatusDot color={status?.color} size={10} />
      </div>
      <div
        style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        onClick={() => onOpenPanel(task)}
      >
        {task.title}
        {task.subtask_count > 0 && (
          <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#64748b', background: 'rgba(100,116,139,0.15)', borderRadius: 8, padding: '1px 6px' }}>
            {task.subtask_count}
          </span>
        )}
      </div>
      <div style={{ width: 120, flexShrink: 0, fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {client?.name || <span style={{ color: '#334155' }}>—</span>}
      </div>
      <div style={{ width: 36, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Avatar name={assignee?.full_name || assignee?.email} size={24} />
      </div>
      <div style={{ width: 90, flexShrink: 0, fontSize: '0.78rem', color: overdue ? '#ef4444' : (dueDateStr ? '#94a3b8' : '#334155'), textAlign: 'center' }}>
        {dueDateStr || '—'}
      </div>
      <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <PriorityFlag priority={task.priority} size={14} />
      </div>
      <div style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0, position: 'relative' }} ref={menuRef}>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 4, fontSize: 16 }}
        >
          <i className="bx bx-dots-horizontal-rounded"></i>
        </button>
        {menuOpen && (
          <div style={{ position: 'absolute', right: 0, top: '100%', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, zIndex: 100, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
            <button type="button" onClick={() => { setMenuOpen(false); onOpenPanel(task) }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem' }}>
              <i className="bx bx-pencil" style={{ marginRight: 8 }}></i>Editar
            </button>
            <button type="button" onClick={() => { setMenuOpen(false); onQuickUpdate(task.id, { is_archived: true }) }} style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'left', fontSize: '0.82rem' }}>
              <i className="bx bx-trash" style={{ marginRight: 8 }}></i>Arquivar
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
function NewSpaceModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', icon: 'bx-folder', is_private: false })
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

  const inputStyle = { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 440, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
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
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${!form.is_private ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: !form.is_private ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)', color: !form.is_private ? '#818cf8' : '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }}
              >
                <i className="bx bx-group" style={{ marginRight: 6 }}></i>Toda a equipe
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_private: true }))}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${form.is_private ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: form.is_private ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)', color: form.is_private ? '#818cf8' : '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s' }}
              >
                <i className="bx bx-lock" style={{ marginRight: 6 }}></i>Só eu
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving || !form.name.trim()} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: saving || !form.name.trim() ? 0.6 : 1 }}>
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
              <button type="submit" style={{ background: '#6366f1', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: '0.82rem', cursor: 'pointer' }}>Adicionar</button>
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
function TaskDetailPanel({ taskId, statuses, clients, workspaceUsers, onClose, onUpdated }) {
  const [task, setTask] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [subtasks, setSubtasks] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTitle, setEditTitle] = useState(false)
  const [titleVal, setTitleVal] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const [saving, setSaving] = useState(false)

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
  const selectStyle = { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: '0.85rem', width: '100%', outline: 'none' }

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 480, background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.08)', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.5)' }}>
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
            <div style={labelStyle}>Responsável</div>
            <select value={task.assignee_id || ''} onChange={e => updateField('assignee_id', e.target.value || null)} style={selectStyle}>
              <option value="">Nenhum</option>
              {(workspaceUsers || []).map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
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
              <button type="button" onClick={addCheckItem} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
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
              <button type="button" onClick={addSubtask} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
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
              <button type="button" onClick={addComment} style={{ background: '#6366f1', border: 'none', color: '#fff', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: '0.82rem' }}>
                Enviar
              </button>
            </div>
          </div>

          <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#334155' }}>
            Criado em {new Date(task.created_at).toLocaleDateString('pt-BR')}
            {saving && <span style={{ marginLeft: 8, color: '#6366f1' }}>Salvando...</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Home View ----
function HomeView({ tasks, statuses, spaces, workspaceUsers, onOpenPanel, onNewSpace, onSpaceClick }) {
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
            <i className="bx bx-collection" style={{ marginRight: 8, color: '#6366f1' }}></i>
            Meus Espacos
          </h3>
          <button
            type="button"
            onClick={onNewSpace}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
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
        </div>
      </div>
    </div>
  )
}

// ---- Space View ----
function SpaceView({ space, tasks, statuses, clients, workspaceUsers, onBack, onOpenPanel, onQuickUpdate, onAddTask }) {
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
          Espacos
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
            const firstStatus = statuses[0]
            if (firstStatus) onAddTask({ title: 'Nova tarefa', status_id: firstStatus.id, space_id: space.id })
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
        >
          <i className="bx bx-plus" style={{ fontSize: 16 }}></i>
          Nova Tarefa
        </button>
      </div>

      {/* Task groups by status */}
      {filteredByStatus.map(({ status, tasks: groupTasks }) => (
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

      {(() => {
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
    </div>
  )
}

// ---- Main Component ----
export default function TasksTab({ clients, workspaceUsers, isMaster, currentUserId }) {
  const [statuses, setStatuses] = useState([])
  const [tasks, setTasks] = useState([])
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [view, setView] = useState('home')
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [showNewSpaceModal, setShowNewSpaceModal] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, taskRes, spacesRes] = await Promise.all([
        fetch('/api/tasks/statuses'),
        fetch('/api/tasks'),
        fetch('/api/tasks/spaces'),
      ])
      const [statusJson, taskJson, spacesJson] = await Promise.all([statusRes.json(), taskRes.json(), spacesRes.json()])
      if (statusJson.statuses) setStatuses(statusJson.statuses)
      if (taskJson.tasks) setTasks(taskJson.tasks)
      if (spacesJson.spaces) setSpaces(spacesJson.spaces)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleAddTask(fields) {
    const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) })
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
    if (filterAssignee && t.assignee_id !== filterAssignee) return false
    if (filterClient && t.client_id !== filterClient) return false
    return true
  })

  const selectStyle = { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '5px 10px', fontSize: '0.82rem', outline: 'none' }

  return (
    <div style={{ minHeight: '100%', color: '#e2e8f0', position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 0 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, marginRight: 8 }}>
          <i className="bx bx-task" style={{ marginRight: 8, color: '#6366f1' }}></i>
          {view === 'space' && selectedSpace ? selectedSpace.name : 'Tarefas'}
        </h2>

        {view !== 'home' && (
          <>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={selectStyle}>
              <option value="">Todos os responsaveis</option>
              {(workspaceUsers || []).map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>

            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={selectStyle}>
              <option value="">Todos os clientes</option>
              {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {(filterAssignee || filterClient) && (
              <button type="button" onClick={() => { setFilterAssignee(''); setFilterClient('') }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}>
                <i className="bx bx-x"></i> Limpar filtros
              </button>
            )}
          </>
        )}

        <div style={{ flex: 1 }} />

        {view === 'home' && (
          <button
            type="button"
            onClick={() => setShowNewSpaceModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '7px 14px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <i className="bx bx-plus" style={{ fontSize: 16 }}></i>
            Novo Espaco
          </button>
        )}

        {view === 'home' && (
          <button
            type="button"
            onClick={() => {
              const firstStatus = statuses[0]
              if (firstStatus) handleAddTask({ title: 'Nova tarefa', status_id: firstStatus.id })
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6366f1', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
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
          />
        </>
      )}

      {/* New space modal */}
      {showNewSpaceModal && (
        <NewSpaceModal
          onClose={() => setShowNewSpaceModal(false)}
          onCreate={handleSpaceCreated}
        />
      )}
    </div>
  )
}
