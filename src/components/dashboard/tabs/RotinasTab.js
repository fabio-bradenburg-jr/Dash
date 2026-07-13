'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import RotinasView from '@/components/dashboard/RotinasView'
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
  const [loading, setLoading] = useState(true)
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
        <RotinasView
          space={space}
          allTasks={tasks}
          statuses={statuses}
          workspaceUsers={allUsers}
          hideBack
          hideDelete
          onOpenPanel={task => setSelectedTaskId(task.id)}
          onTaskSaved={handleTaskSaved}
          onBack={() => {}}
          onDeleteSpace={() => {}}
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
            isMaster={isMaster}
            customFields={customFields}
          />
        </>
      )}
    </div>
  )
}
