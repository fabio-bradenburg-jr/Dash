'use client'
import { useState, useEffect, useCallback } from 'react'

const STATUS_OPTIONS = [
  { key: 'pending', label: 'Pendente', color: '#94a3b8' },
  { key: 'in_progress', label: 'Em andamento', color: '#3b82f6' },
  { key: 'blocked', label: 'Bloqueado', color: '#ef4444' },
  { key: 'done', label: 'Concluído', color: '#26c281' },
]

const PRIORITY_OPTIONS = [
  { key: 'none', label: 'Sem prioridade', color: '#64748b' },
  { key: 'low', label: 'Baixa', color: '#22c55e' },
  { key: 'medium', label: 'Média', color: '#f59e0b' },
  { key: 'high', label: 'Alta', color: '#ef4444' },
  { key: 'urgent', label: 'Urgente', color: '#dc2626' },
]

const DARK = 'var(--bg-dark, #050506)'
const PANEL = 'var(--bg-panel, #111113)'
const BORDER = 'rgba(148,163,184,.12)'
const GREEN = '#26c281'

export default function ActionPlanManager({ clientId, weekStart, users = [], isLight = false, onCountChange }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [newPlan, setNewPlan] = useState({ title: '', responsible_id: '', due_date: '', description: '' })
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState({})

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

  const handleAdd = async () => {
    if (!newPlan.title.trim()) return
    setSavingId('new')
    try {
      const res = await fetch('/api/operation/action-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          week_start: weekStart,
          title: newPlan.title.trim(),
          description: newPlan.description.trim() || null,
          responsible_id: newPlan.responsible_id || null,
          due_date: newPlan.due_date || null,
        }),
      })
      const json = await res.json()
      if (json.plan) {
        const updated = [...plans, json.plan]
        setPlans(updated)
        onCountChange?.(updated.length)
        setNewPlan({ title: '', responsible_id: '', due_date: '', description: '' })
        setAdding(false)
      }
    } catch (_) {}
    setSavingId(null)
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

  return (
    <div style={{ width: '100%' }}>
      {/* Plan list */}
      {plans.length === 0 && !adding && (
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

      {/* New plan form */}
      {adding ? (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, padding: 14, background: inputBg, borderRadius: 10, border: `1px solid ${borderColor}` }}>
          <div>
            <span style={labelStyle}>Título do plano *</span>
            <input
              autoFocus
              style={inputStyle}
              value={newPlan.title}
              onChange={(e) => setNewPlan((p) => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Ajustar campanha de leads"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span style={labelStyle}>Responsável</span>
              <select
                style={inputStyle}
                value={newPlan.responsible_id}
                onChange={(e) => setNewPlan((p) => ({ ...p, responsible_id: e.target.value }))}
              >
                <option value="">Selecione</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </div>
            <div>
              <span style={labelStyle}>Prazo</span>
              <input
                type="date" style={inputStyle}
                value={newPlan.due_date}
                onChange={(e) => setNewPlan((p) => ({ ...p, due_date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <span style={labelStyle}>Descrição (opcional)</span>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
              value={newPlan.description}
              onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
              placeholder="Detalhes sobre o plano de ação..."
              rows={2}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              style={btnStyle(GREEN)}
              onClick={handleAdd}
              disabled={!newPlan.title.trim() || savingId === 'new'}
            >
              {savingId === 'new' ? 'Criando...' : '+ Criar e vincular tarefa'}
            </button>
            <button type="button" style={btnStyle('#64748b')} onClick={() => { setAdding(false); setNewPlan({ title: '', responsible_id: '', due_date: '', description: '' }) }}>
              Cancelar
            </button>
            <span style={{ fontSize: 11, color: subtext, marginLeft: 4 }}>
              Uma tarefa será criada automaticamente na Central de Tarefas
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
            background: 'transparent', border: `1px dashed ${GREEN}66`, borderRadius: 8,
            color: GREEN, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%',
            justifyContent: 'center',
          }}
        >
          <i className="bx bx-plus" /> Adicionar plano de ação
        </button>
      )}
    </div>
  )
}
