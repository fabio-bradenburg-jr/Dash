'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import RotinasView from '@/components/dashboard/RotinasView'
import TaskModelsModal from '@/components/dashboard/TaskModelsModal'
import NewTaskModal from '@/components/dashboard/NewTaskModal'
import { TaskDetailPanel } from '@/components/dashboard/TasksTab'

// Aba própria de Rotinas: uma única central, board semanal direto.
// Não usa o conceito de "espaços" da aba Tarefas — a central única é apenas
// o armazenamento por baixo (space_type 'rotinas'), transparente para o usuário.
export default function RotinasTab({ clients, workspaceUsers, isMaster, currentUserId }) {
  const [statuses, setStatuses] = useState([])
  const [tasks, setTasks] = useState([])
  const [customFields, setCustomFields] = useState([])
  const [internalUsers, setInternalUsers] = useState([])
  const [space, setSpace] = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [showModels, setShowModels] = useState(false)
  const [newTaskDia, setNewTaskDia] = useState(null) // dia (1-5) | null
  const [loading, setLoading] = useState(true)
  // Filtros por usuário do app e por função, com visões salvas
  const [filterUser, setFilterUser] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [savedViews, setSavedViews] = useState([])
  const [savingView, setSavingView] = useState(false)
  const [viewName, setViewName] = useState('')
  const [showSaveView, setShowSaveView] = useState(false)
  const ensuredRef = useRef(false)

  const loadStatuses = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/status-templates')
      const json = await res.json()
      if (json.templates?.length) {
        const tmpl = json.templates.find(t => t.is_default) || json.templates[0]
        setStatuses((tmpl.items || []).map(item => ({
          id: item.id, label: item.name, color: item.color,
          is_completed: item.is_completed, is_initial: item.is_initial, is_closed: item.is_closed,
          pauses_sla: item.pauses_sla, sort_order: item.sort_order,
        })))
      }
    } catch { /* ignore */ }
  }, [])

  const ensureSpace = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks/spaces')
      const json = await res.json()
      const rotinas = (json.spaces || []).find(s => s.space_type === 'rotinas')
      if (rotinas) { setSpace(rotinas); return }
      if (ensuredRef.current) return
      ensuredRef.current = true
      const createRes = await fetch('/api/tasks/spaces', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Rotinas', color: '#8b5cf6', icon: 'bx-refresh', space_type: 'rotinas', is_private: false }),
      })
      const created = await createRes.json()
      if (created.space) setSpace(created.space)
    } catch { /* ignore */ }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [taskRes, fieldsRes, usersRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks/custom-fields?entity_type=task'),
        fetch('/api/users'),
      ])
      const taskJson = await taskRes.json()
      const fieldsJson = await fieldsRes.json()
      if (taskJson.tasks) setTasks(taskJson.tasks)
      if (fieldsJson.fields) setCustomFields(fieldsJson.fields)
      if (usersRes.ok) { const u = await usersRes.json(); if (Array.isArray(u)) setInternalUsers(u) }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStatuses(); ensureSpace(); loadData() }, [loadStatuses, ensureSpace, loadData])

  const allUsers = internalUsers.length > 0 ? internalUsers : (workspaceUsers || [])

  // ── Filtros usuário/função + visões salvas ──
  const ROLE_LABELS = { master: 'Master', admin: 'Admin', operador: 'Operador', analista: 'Analista', gestor_resultado: 'Gestor de Resultado', visualizador: 'Visualizador', cliente: 'Cliente' }
  const funcaoOf = (userId) => {
    const u = allUsers.find(x => x.id === userId)
    if (!u) return null
    return u.assignedRole?.name || ROLE_LABELS[u.role] || u.role || null
  }
  const roleOptions = [...new Set(allUsers.map(u => u.assignedRole?.name || ROLE_LABELS[u.role] || u.role).filter(Boolean))]

  const taskFilter = useCallback((t) => {
    if (filterUser && t.assignee_id !== filterUser) return false
    if (filterRole && funcaoOf(t.assignee_id) !== filterRole) return false
    return true
  }, [filterUser, filterRole, allUsers]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadViews = useCallback(async () => {
    if (!space?.id) return
    try {
      const res = await fetch(`/api/tasks/views?space_id=${space.id}`)
      const json = await res.json()
      setSavedViews((json.views || []).filter(v => Array.isArray(v.filters) && v.filters.some(f => f.key === 'assignee' || f.key === 'role')))
    } catch { /* ignore */ }
  }, [space?.id])
  useEffect(() => { loadViews() }, [loadViews])

  async function saveCurrentView() {
    const name = viewName.trim()
    if (!name || !space?.id) return
    setSavingView(true)
    try {
      const filters = []
      if (filterUser) filters.push({ key: 'assignee', value: filterUser })
      if (filterRole) filters.push({ key: 'role', value: filterRole })
      const res = await fetch('/api/tasks/views', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, space_id: space.id, view_mode: 'list', filters }),
      })
      if (res.ok) { setViewName(''); setShowSaveView(false); await loadViews() }
    } finally { setSavingView(false) }
  }
  function applyView(v) {
    const f = Array.isArray(v.filters) ? v.filters : []
    setFilterUser(f.find(x => x.key === 'assignee')?.value || '')
    setFilterRole(f.find(x => x.key === 'role')?.value || '')
  }
  async function deleteView(id) {
    await fetch(`/api/tasks/views?id=${id}`, { method: 'DELETE' })
    setSavedViews(prev => prev.filter(v => v.id !== id))
  }

  const selStyle = { background: 'var(--bg-panel, #111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 7, padding: '6px 10px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }

  const handleTaskSaved = (task, type) => {
    if (type === 'create') setTasks(prev => [...prev, task])
    else setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t))
  }
  const handlePanelUpdate = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated, status: updated.status } : t))
  }

  return (
    <div style={{ minHeight: '100%', color: '#e2e8f0', position: 'relative' }}>
      {(loading || !space) ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 22 }}></i>
        </div>
      ) : (
        <>
        {/* ── Barra de filtros: usuário + função + visões salvas ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 0 0', flexWrap: 'wrap' }}>
          <i className="bx bx-filter-alt" style={{ color: '#64748b', fontSize: 16 }} />
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={selStyle}>
            <option value="">Todos os usuários</option>
            {allUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
          </select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={selStyle}>
            <option value="">Todas as funções</option>
            {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {(filterUser || filterRole) && (
            <>
              <button type="button" onClick={() => { setFilterUser(''); setFilterRole('') }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="bx bx-x" /> Limpar
              </button>
              {!showSaveView ? (
                <button type="button" onClick={() => setShowSaveView(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(38,194,129,0.1)', border: '1px solid rgba(38,194,129,0.3)', color: '#26c281', padding: '5px 11px', borderRadius: 7, fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer' }}>
                  <i className="bx bx-bookmark-plus" /> Salvar visão
                </button>
              ) : (
                <span style={{ display: 'inline-flex', gap: 6 }}>
                  <input value={viewName} onChange={e => setViewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveCurrentView()} placeholder="Nome da visão…" autoFocus
                    style={{ background: 'var(--bg-panel, #111113)', border: '1px solid rgba(38,194,129,0.4)', color: '#e2e8f0', borderRadius: 7, padding: '5px 10px', fontSize: '0.78rem', outline: 'none', width: 150 }} />
                  <button type="button" onClick={saveCurrentView} disabled={savingView || !viewName.trim()} style={{ background: '#26c281', border: 'none', color: '#04150d', padding: '5px 10px', borderRadius: 7, fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>{savingView ? '…' : 'Salvar'}</button>
                  <button type="button" onClick={() => { setShowSaveView(false); setViewName('') }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><i className="bx bx-x" /></button>
                </span>
              )}
            </>
          )}
          {savedViews.length > 0 && <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />}
          {savedViews.map(v => (
            <span key={v.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 99, padding: '4px 6px 4px 11px' }}>
              <button type="button" onClick={() => applyView(v)} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, padding: 0 }}>{v.name}</button>
              <button type="button" onClick={() => deleteView(v.id)} title="Remover visão" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 0 }}><i className="bx bx-x" style={{ fontSize: 13 }} /></button>
            </span>
          ))}
        </div>

        <RotinasView
          space={space}
          allTasks={tasks}
          statuses={statuses}
          workspaceUsers={allUsers}
          clients={clients}
          taskFilter={(filterUser || filterRole) ? taskFilter : null}
          hideBack
          hideDelete
          hideMembers
          onOpenModels={() => setShowModels(true)}
          onNewTask={(dia) => setNewTaskDia(dia || 1)}
          onOpenPanel={task => setSelectedTaskId(task.id)}
          onTaskSaved={handleTaskSaved}
          onBack={() => {}}
          onDeleteSpace={() => {}}
        />
        </>
      )}

      {newTaskDia != null && space && (
        <NewTaskModal
          rotinasMode
          rotinasSpaceId={space.id}
          initialDia={newTaskDia}
          clients={clients || []}
          workspaceUsers={allUsers}
          statuses={statuses}
          onClose={() => setNewTaskDia(null)}
          onSaved={(task) => setTasks(prev => [...prev, task])}
        />
      )}

      {showModels && space && (
        <TaskModelsModal
          spaceId={space.id}
          clients={clients}
          workspaceUsers={allUsers}
          statuses={statuses}
          onClose={() => setShowModels(false)}
          onApplied={(created) => setTasks(prev => [...prev, ...created])}
        />
      )}

      {selectedTaskId && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }} onClick={() => setSelectedTaskId(null)} />
          <TaskDetailPanel
            taskId={selectedTaskId}
            statuses={statuses}
            clients={clients}
            workspaceUsers={allUsers}
            onClose={() => setSelectedTaskId(null)}
            onUpdated={handlePanelUpdate}
            onDeleted={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
            isMaster={isMaster}
            customFields={customFields}
            currentUserId={currentUserId}
          />
        </>
      )}
    </div>
  )
}
