'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import NewTaskModal from '@/components/dashboard/NewTaskModal'

const STATUS_OPTIONS = [
  { key: 'pending', label: 'Pendente', color: '#94a3b8' },
  { key: 'in_progress', label: 'Em andamento', color: '#3b82f6' },
  { key: 'blocked', label: 'Bloqueado', color: '#ef4444' },
  { key: 'done', label: 'Concluído', color: '#26c281' },
]

const DARK = 'var(--bg-dark, #050506)'
const PANEL = 'var(--bg-panel, #111113)'
const BORDER = 'rgba(148,163,184,.12)'
const GREEN = '#26c281'

export default function ActionPlanManager({ clientId, weekStart, users = [], isLight = false, onCountChange, statuses = [], clients = [] }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [weeklySpaceId, setWeeklySpaceId] = useState(null)
  const [loadingSpace, setLoadingSpace] = useState(false)
  const weeklySpaceCache = useRef({})

  const loadPlans = useCallback(async () => {
    if (!clientId || !weekStart) return
    setLoading(true)
    try {
      const res = await fetch(`/api/operation/action-plans?client_id=${clientId}&week_start=${weekStart}`)
      const json = await res.json()
      const list = json.plans || []
      setPlans(list)
      onCountChange?.(list.length)
    } catch (_) {
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [clientId, weekStart, onCountChange])

  useEffect(() => { loadPlans() }, [loadPlans])

  // When weekStart changes, reset cached space for that week (or reuse if already found)
  useEffect(() => {
    if (!weekStart) return
    if (weeklySpaceCache.current[weekStart]) {
      setWeeklySpaceId(weeklySpaceCache.current[weekStart])
    } else {
      setWeeklySpaceId(null)
    }
  }, [weekStart])

  const ensureWeeklySpace = async () => {
    if (weeklySpaceId) return weeklySpaceId
    if (weeklySpaceCache.current[weekStart]) {
      setWeeklySpaceId(weeklySpaceCache.current[weekStart])
      return weeklySpaceCache.current[weekStart]
    }
    setLoadingSpace(true)
    try {
      const res = await fetch(`/api/operation/weekly-spaces?week_start=${weekStart}`)
      const json = await res.json()
      if (json.space) {
        const id = json.space.id
        weeklySpaceCache.current[weekStart] = id
        setWeeklySpaceId(id)
        return id
      }
    } finally {
      setLoadingSpace(false)
    }
    return null
  }

  const handleOpenTaskModal = async () => {
    const spaceId = await ensureWeeklySpace()
    setShowTaskModal(true)
  }

  const handleTaskSaved = async (task) => {
    // Link the created task to action_plans
    try {
      const res = await fetch('/api/operation/action-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          week_start: weekStart,
          title: task.title,
          description: task.description || null,
          responsible_id: task.assignee_id || null,
          due_date: task.due_date || null,
          task_id: task.id,
          task_public_id: task.task_public_id || null,
        }),
      })
      const json = await res.json()
      if (json.plan) {
        const updated = [...plans, json.plan]
        setPlans(updated)
        onCountChange?.(updated.length)
      }
    } catch (_) {}
    setShowTaskModal(false)
  }

  const handleStatusChange = async (plan, status) => {
    const updated = plans.map((p) => p.id === plan.id ? { ...p, status } : p)
    setPlans(updated)
    await fetch('/api/operation/action-plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, status }),
    })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este plano de ação?')) return
    const updated = plans.filter((p) => p.id !== id)
    setPlans(updated)
    onCountChange?.(updated.length)
    await fetch(`/api/operation/action-plans?id=${id}`, { method: 'DELETE' })
  }

  const handleEdit = async (id) => {
    setSavingId(id)
    await fetch('/api/operation/action-plans', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editDraft }),
    })
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, ...editDraft } : p))
    setEditingId(null)
    setSavingId(null)
  }

  const bg = isLight ? '#fff' : PANEL
  const text = isLight ? '#0f172a' : '#e2e8f0'
  const subtext = isLight ? '#64748b' : '#94a3b8'
  const inputBg = isLight ? '#f8fafc' : 'rgba(255,255,255,.04)'
  const borderColor = isLight ? 'rgba(15,23,42,.1)' : BORDER

  const rowStyle = {
    display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
    borderBottom: `1px solid ${borderColor}`,
  }
  const inputStyle = {
    background: inputBg, border: `1px solid ${borderColor}`, borderRadius: 8,
    color: text, padding: '7px 10px', fontSize: 13, width: '100%', outline: 'none',
  }
  const labelStyle = { fontSize: 11, fontWeight: 600, color: subtext, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 4, display: 'block' }
  const btnStyle = (color) => ({
    background: color, border: 'none', borderRadius: 7, color: '#fff',
    padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  })

  if (loading) {
    return <div style={{ color: subtext, fontSize: 13, padding: '12px 0' }}>Carregando planos...</div>
  }

  // Default context for the task modal
  const taskDefaultContext = {
    space_id: weeklySpaceId || undefined,
    client_id: clientId || undefined,
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Plan list */}
      {plans.length === 0 && (
        <div style={{ color: subtext, fontSize: 13, padding: '10px 0', fontStyle: 'italic' }}>
          Nenhum plano de ação para esta semana.
        </div>
      )}

      {plans.map((plan) => {
        const status = STATUS_OPTIONS.find((s) => s.key === plan.status) || STATUS_OPTIONS[0]
        const responsible = users.find((u) => u.id === plan.responsible_id)
        const isEditing = editingId === plan.id
        const isSaving = savingId === plan.id

        return (
          <div key={plan.id} style={rowStyle}>
            {/* Status dot */}
            <button
              type="button"
              title={`Status: ${status.label}`}
              onClick={() => {
                const idx = STATUS_OPTIONS.findIndex((s) => s.key === plan.status)
                handleStatusChange(plan, STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length].key)
              }}
              style={{
                width: 18, height: 18, borderRadius: '50%', background: status.color,
                border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 2,
                boxShadow: `0 0 8px ${status.color}66`,
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    style={inputStyle} value={editDraft.title ?? plan.title}
                    onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Título do plano"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select
                      style={inputStyle}
                      value={editDraft.responsible_id ?? plan.responsible_id ?? ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, responsible_id: e.target.value || null }))}
                    >
                      <option value="">Responsável</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                    </select>
                    <input
                      type="date" style={inputStyle}
                      value={editDraft.due_date ?? plan.due_date ?? ''}
                      onChange={(e) => setEditDraft((d) => ({ ...d, due_date: e.target.value || null }))}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" style={btnStyle(GREEN)} onClick={() => handleEdit(plan.id)} disabled={isSaving}>
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button type="button" style={btnStyle('#64748b')} onClick={() => setEditingId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: text }}>{plan.title}</span>
                    {plan.task_public_id && (
                      <span style={{ fontSize: 11, color: GREEN, fontWeight: 700, letterSpacing: '.3px' }}>{plan.task_public_id}</span>
                    )}
                    <span style={{ fontSize: 11, background: status.color + '22', color: status.color, borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                      {status.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                    {responsible && (
                      <span style={{ fontSize: 11, color: subtext }}>
                        <i className="bx bx-user" style={{ marginRight: 3 }} />{responsible.full_name || responsible.email}
                      </span>
                    )}
                    {plan.due_date && (
                      <span style={{ fontSize: 11, color: subtext }}>
                        <i className="bx bx-calendar" style={{ marginRight: 3 }} />
                        {new Date(plan.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {!isEditing && (
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => { setEditingId(plan.id); setEditDraft({}) }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: subtext, padding: 4 }}
                  title="Editar"
                >
                  <i className="bx bx-edit" style={{ fontSize: 14 }} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(plan.id)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                  title="Excluir"
                >
                  <i className="bx bx-trash" style={{ fontSize: 14 }} />
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Add task button */}
      <button
        type="button"
        onClick={handleOpenTaskModal}
        disabled={loadingSpace || !clientId || !weekStart}
        style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: `1px dashed ${GREEN}66`, borderRadius: 8,
          color: GREEN, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%',
          justifyContent: 'center', opacity: loadingSpace ? 0.6 : 1,
        }}
      >
        <i className={`bx ${loadingSpace ? 'bx-loader-alt bx-spin' : 'bx-plus'}`} />
        {loadingSpace ? 'Preparando espaço...' : 'Adicionar tarefa ao Plano de Ação'}
      </button>

      {showTaskModal && (
        <NewTaskModal
          onClose={() => setShowTaskModal(false)}
          onSaved={handleTaskSaved}
          defaultContext={taskDefaultContext}
          spaces={[]}
          clients={clients}
          workspaceUsers={users}
          statuses={statuses}
          customFields={[]}
        />
      )}
    </div>
  )
}
