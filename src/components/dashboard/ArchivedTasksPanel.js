'use client'

import React, { useState, useEffect, useCallback } from 'react'

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

function StatusPill({ status }) {
  if (!status) return <span style={{ fontSize: '0.72rem', color: '#475569' }}>—</span>
  return (
    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 10, background: (status.color || '#334155') + '33', color: status.color || '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status.label}
    </span>
  )
}

function formatDatetime(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ArchivedTasksPanel({ workspaceUsers, clients, spaces, statuses, onClose, onRestored, isMaster }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSpace, setFilterSpace] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [sort, setSort] = useState('recent')
  const [confirmDelete, setConfirmDelete] = useState(null) // task id
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(null) // task id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterSpace) params.set('space_id', filterSpace)
      if (filterClient) params.set('client_id', filterClient)
      if (filterAssignee) params.set('assignee_id', filterAssignee)
      params.set('sort', sort)
      const res = await fetch(`/api/tasks/archived?${params}`)
      const json = await res.json()
      if (json.tasks) setTasks(json.tasks)
    } finally {
      setLoading(false)
    }
  }, [search, filterSpace, filterClient, filterAssignee, sort])

  useEffect(() => { load() }, [load])

  async function handleRestore(task) {
    setRestoring(task.id)
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, is_archived: false }),
      })
      const json = await res.json()
      if (json.task) {
        setTasks(prev => prev.filter(t => t.id !== task.id))
        if (onRestored) onRestored(json.task)
      }
    } finally {
      setRestoring(null)
    }
  }

  async function handleHardDelete(taskId) {
    setDeleting(true)
    try {
      await fetch(`/api/tasks?id=${taskId}&hard=true`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setConfirmDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '6px 10px', fontSize: '0.82rem', outline: 'none' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10001 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 10002,
        width: 780, maxWidth: '95vw',
        background: '#111113',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            📦 Tarefas Arquivadas
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 20, display: 'flex', alignItems: 'center' }}>
            <i className="bx bx-x" />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tarefas arquivadas..."
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap', flexShrink: 0 }}>
          <select value={filterSpace} onChange={e => setFilterSpace(e.target.value)} style={selectStyle}>
            <option value="">Todos os espaços</option>
            {(spaces || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={selectStyle}>
            <option value="">Todos os clientes</option>
            {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={selectStyle}>
            <option value="">Todos os responsáveis</option>
            {(workspaceUsers || []).map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
          </select>

          <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigas</option>
            <option value="completed">Por conclusão</option>
          </select>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 24 }}></i>
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: '#475569' }}>
              <i className="bx bx-archive" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}></i>
              <div style={{ fontSize: '0.9rem' }}>Nenhuma tarefa arquivada encontrada.</div>
            </div>
          )}

          {!loading && tasks.map(task => {
            const space = spaces?.find(s => s.id === task.space_id)
            const assignee = workspaceUsers?.find(u => u.id === task.assignee_id)
            const isConfirming = confirmDelete === task.id
            const isRestoring = restoring === task.id

            return (
              <div key={task.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Space dot */}
                  {space && (
                    <div title={space.name} style={{ width: 8, height: 8, borderRadius: '50%', background: space.color, flexShrink: 0 }} />
                  )}

                  {/* Title */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>
                      Arquivado em {formatDatetime(task.archived_at)}
                      {space && <span style={{ marginLeft: 8, color: space.color }}>{space.name}</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ flexShrink: 0 }}>
                    <StatusPill status={task.status} />
                  </div>

                  {/* Assignee */}
                  <Avatar name={assignee?.full_name || assignee?.email} size={24} />

                  {/* Restore button */}
                  <button
                    type="button"
                    onClick={() => handleRestore(task)}
                    disabled={isRestoring}
                    style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 6, border: '1px solid #26c281', background: 'transparent', color: '#26c281', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, opacity: isRestoring ? 0.6 : 1 }}
                  >
                    {isRestoring ? 'Restaurando...' : 'Restaurar'}
                  </button>

                  {/* Hard delete (master only) */}
                  {isMaster && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(isConfirming ? null : task.id)}
                      style={{ flexShrink: 0, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      title="Excluir definitivamente"
                    >
                      <i className="bx bx-trash" />
                    </button>
                  )}
                </div>

                {/* Inline confirmation */}
                {isConfirming && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
                    <div style={{ fontSize: '0.82rem', color: '#fca5a5', marginBottom: 10 }}>
                      Tem certeza? Esta ação não pode ser desfeita.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleHardDelete(task.id)}
                        disabled={deleting}
                        style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, opacity: deleting ? 0.6 : 1 }}
                      >
                        {deleting ? 'Excluindo...' : 'Sim, excluir'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
