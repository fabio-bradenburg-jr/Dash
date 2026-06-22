'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: '#ef4444' },
  high: { label: 'Alta', color: '#f97316' },
  medium: { label: 'Média', color: '#eab308' },
  low: { label: 'Baixa', color: '#3b82f6' },
  none: { label: 'Sem prioridade', color: '#64748b' },
}

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

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isPast(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr + 'T00:00:00') < new Date(new Date().toDateString())
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
      {/* Status dot */}
      <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <StatusDot color={status?.color} size={10} />
      </div>

      {/* Title */}
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

      {/* Client */}
      <div style={{ width: 120, flexShrink: 0, fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {client?.name || <span style={{ color: '#334155' }}>—</span>}
      </div>

      {/* Assignee */}
      <div style={{ width: 36, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <Avatar name={assignee?.full_name || assignee?.email} size={24} />
      </div>

      {/* Due date */}
      <div style={{ width: 90, flexShrink: 0, fontSize: '0.78rem', color: overdue ? '#ef4444' : (dueDateStr ? '#94a3b8' : '#334155'), textAlign: 'center' }}>
        {dueDateStr || '—'}
      </div>

      {/* Priority */}
      <div style={{ width: 32, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <PriorityFlag priority={task.priority} size={14} />
      </div>

      {/* More */}
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
      {/* Group header */}
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
          {/* Column headers */}
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

          {/* Add task inline */}
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
      {/* Header */}
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
          {/* Title */}
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

          {/* Status */}
          <div style={fieldWrap}>
            <div style={labelStyle}>Status</div>
            <select value={task.status_id || ''} onChange={e => updateField('status_id', e.target.value || null)} style={selectStyle}>
              <option value="">Sem status</option>
              {statuses.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* Priority */}
          <div style={fieldWrap}>
            <div style={labelStyle}>Prioridade</div>
            <select value={task.priority} onChange={e => updateField('priority', e.target.value)} style={selectStyle}>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Assignee */}
          <div style={fieldWrap}>
            <div style={labelStyle}>Responsável</div>
            <select value={task.assignee_id || ''} onChange={e => updateField('assignee_id', e.target.value || null)} style={selectStyle}>
              <option value="">Nenhum</option>
              {(workspaceUsers || []).map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
          </div>

          {/* Client */}
          <div style={fieldWrap}>
            <div style={labelStyle}>Cliente</div>
            <select value={task.client_id || ''} onChange={e => updateField('client_id', e.target.value || null)} style={selectStyle}>
              <option value="">Nenhum</option>
              {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Due date */}
          <div style={fieldWrap}>
            <div style={labelStyle}>Data de vencimento</div>
            <input
              type="date"
              value={task.due_date || ''}
              onChange={e => updateField('due_date', e.target.value || null)}
              style={{ ...selectStyle, colorScheme: 'dark' }}
            />
          </div>

          {/* Description */}
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

          {/* Checklist */}
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

          {/* Subtasks */}
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

          {/* Comments */}
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

          {/* Meta */}
          <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#334155' }}>
            Criado em {new Date(task.created_at).toLocaleDateString('pt-BR')}
            {saving && <span style={{ marginLeft: 8, color: '#6366f1' }}>Salvando...</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Main Component ----
export default function TasksTab({ clients, workspaceUsers, isMaster }) {
  const [statuses, setStatuses] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterClient, setFilterClient] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statusRes, taskRes] = await Promise.all([
        fetch('/api/tasks/statuses'),
        fetch('/api/tasks'),
      ])
      const [statusJson, taskJson] = await Promise.all([statusRes.json(), taskRes.json()])
      if (statusJson.statuses) setStatuses(statusJson.statuses)
      if (taskJson.tasks) setTasks(taskJson.tasks)
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
          Tarefas
        </h2>

        {/* Filters */}
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={selectStyle}>
          <option value="">Todos os responsáveis</option>
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

        <div style={{ flex: 1 }} />

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
      </div>

      {loading && (
        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 24 }}></i>
        </div>
      )}

      {!loading && (
        <div style={{ paddingTop: 12 }}>
          {statuses.map(status => {
            const groupTasks = filteredTasks.filter(t => t.status_id === status.id)
            return (
              <StatusGroup
                key={status.id}
                status={status}
                tasks={groupTasks}
                statuses={statuses}
                clients={clients}
                workspaceUsers={workspaceUsers}
                onOpenPanel={task => setSelectedTaskId(task.id)}
                onQuickUpdate={handleQuickUpdate}
                onAddTask={handleAddTask}
              />
            )
          })}

          {/* Tasks with no status */}
          {(() => {
            const noStatus = filteredTasks.filter(t => !t.status_id)
            if (noStatus.length === 0) return null
            return (
              <StatusGroup
                key="no-status"
                status={{ id: null, label: 'Sem status', color: '#334155' }}
                tasks={noStatus}
                statuses={statuses}
                clients={clients}
                workspaceUsers={workspaceUsers}
                onOpenPanel={task => setSelectedTaskId(task.id)}
                onQuickUpdate={handleQuickUpdate}
                onAddTask={fields => handleAddTask({ ...fields, status_id: null })}
              />
            )
          })()}
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
    </div>
  )
}
