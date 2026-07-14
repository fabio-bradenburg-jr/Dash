'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import CustomSelect from '@/components/dashboard/CustomSelect'

const DIAS = [
  { key: 1, label: 'Segunda', short: 'Seg' },
  { key: 2, label: 'Terça', short: 'Ter' },
  { key: 3, label: 'Quarta', short: 'Qua' },
  { key: 4, label: 'Quinta', short: 'Qui' },
  { key: 5, label: 'Sexta', short: 'Sex' },
  { key: 6, label: 'Sábado', short: 'Sáb' },
  { key: 0, label: 'Domingo', short: 'Dom' },
]

const DIAS_SEMANA = DIAS.slice(0, 5) // Mon-Fri default

const MEMBER_COLORS = ['#26c281', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const TEMPLATES_FUNCAO = {
  gestor_resultado: {
    label: 'Gestor de Resultado',
    icon: 'bx-target-lock',
    color: '#8b5cf6',
    tasks: [
      { title: 'Reunião de alinhamento com equipe', dia_semana: 1 },
      { title: 'Revisão de métricas e KPIs', dia_semana: 1 },
      { title: 'Acompanhamento de campanhas ativas', dia_semana: 2 },
      { title: 'Análise de resultados dos clientes', dia_semana: 3 },
      { title: 'Reunião de feedback com clientes', dia_semana: 4 },
      { title: 'Otimizações e ajustes de campanha', dia_semana: 4 },
      { title: 'Relatório semanal e próximos passos', dia_semana: 5 },
    ],
  },
  comercial: {
    label: 'Comercial',
    icon: 'bx-line-chart',
    color: '#26c281',
    tasks: [
      { title: 'Prospecção de novos clientes', dia_semana: 1 },
      { title: 'Follow-up de propostas enviadas', dia_semana: 2 },
      { title: 'Reuniões de vendas agendadas', dia_semana: 3 },
      { title: 'Atualização do CRM', dia_semana: 4 },
      { title: 'Revisão de pipeline da semana', dia_semana: 5 },
    ],
  },
  financeiro: {
    label: 'Financeiro',
    icon: 'bx-dollar-circle',
    color: '#f59e0b',
    tasks: [
      { title: 'Conciliação bancária', dia_semana: 1 },
      { title: 'Emissão de cobranças', dia_semana: 2 },
      { title: 'Controle de contas a pagar', dia_semana: 3 },
      { title: 'Relatório de fluxo de caixa', dia_semana: 4 },
      { title: 'Fechamento financeiro semanal', dia_semana: 5 },
    ],
  },
  cs: {
    label: 'CS',
    icon: 'bx-headphone',
    color: '#3b82f6',
    tasks: [
      { title: 'Check-in com clientes ativos', dia_semana: 1 },
      { title: 'Análise de NPS e satisfação', dia_semana: 2 },
      { title: 'Resolução de tickets abertos', dia_semana: 3 },
      { title: 'Reunião de sucesso com clientes', dia_semana: 4 },
      { title: 'Relatório de saúde dos clientes', dia_semana: 5 },
    ],
  },
  operacao: {
    label: 'Operação',
    icon: 'bx-cog',
    color: '#64748b',
    tasks: [
      { title: 'Revisão de processos da semana', dia_semana: 1 },
      { title: 'Checklist operacional diário', dia_semana: 2 },
      { title: 'Atualização de documentações', dia_semana: 3 },
      { title: 'Controle de qualidade', dia_semana: 4 },
      { title: 'Reunião de encerramento semanal', dia_semana: 5 },
    ],
  },
}

// ---- Utilities ----
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function fmtDate(d) {
  return d.toISOString().split('T')[0]
}

function fmtDisplay(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getWeekDates(monday) {
  return DIAS_SEMANA.map((dia, i) => ({
    ...dia,
    date: fmtDate(addDays(monday, i)),
    display: fmtDisplay(addDays(monday, i)),
  }))
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ---- Member Avatar ----
function MemberAvatar({ member, size = 32, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: member.color || '#26c281',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      flexShrink: 0,
      overflow: 'hidden',
      ...style,
    }}>
      {member.avatar_url
        ? <img src={member.avatar_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(member.name)}
    </div>
  )
}

// ---- Task Row in a day cell ----
function RotinasTaskRow({ task, statuses, onToggle, onOpenPanel, onDrag, isDragging }) {
  const status = statuses.find(s => s.id === task.status_id)
  const isCompleted = status?.is_completed || status?.is_closed
  const [hovered, setHovered] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('taskId', task.id); onDrag?.(task.id) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpenPanel(task)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 7px', borderRadius: 7,
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer', marginBottom: 4,
        opacity: isDragging ? 0.4 : 1,
        transition: 'background 0.1s, opacity 0.15s',
      }}
    >
      <div
        onClick={e => { e.stopPropagation(); onToggle(task) }}
        style={{
          width: 16, height: 16, borderRadius: '50%', border: `2px solid ${isCompleted ? '#26c281' : 'rgba(255,255,255,0.2)'}`,
          background: isCompleted ? '#26c281' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {isCompleted && <i className="bx bx-check" style={{ fontSize: 10, color: '#fff' }} />}
      </div>
      <span style={{
        fontSize: '0.78rem', color: isCompleted ? '#475569' : '#cbd5e1',
        textDecoration: isCompleted ? 'line-through' : 'none',
        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{task.title}</span>
      {task.horario && <span style={{ fontSize: '0.65rem', color: '#475569', flexShrink: 0 }}>{task.horario}</span>}
    </div>
  )
}

// ---- Day Cell ----
function DayCell({ dia, tasks, statuses, onToggle, onOpenPanel, onAddTask, onDropTask }) {
  const [dragOver, setDragOver] = useState(false)
  const [draggingId, setDraggingId] = useState(null)

  function handleDrop(e) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onDropTask(taskId, dia.key)
    setDragOver(false)
    setDraggingId(null)
  }

  const completed = tasks.filter(t => {
    const s = statuses.find(st => st.id === t.status_id)
    return s?.is_completed || s?.is_closed
  }).length

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      style={{
        minHeight: 120,
        background: dragOver ? 'rgba(38,194,129,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${dragOver ? 'rgba(38,194,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 10,
        padding: '8px 8px 4px',
        transition: 'border 0.15s, background 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.7rem', color: tasks.length > 0 ? '#94a3b8' : '#334155', fontWeight: 600 }}>
          {completed}/{tasks.length}
        </span>
        <button
          type="button"
          onClick={() => onAddTask(dia)}
          style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 14, padding: '1px 3px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
          title="Adicionar tarefa"
        >
          <i className="bx bx-plus" />
        </button>
      </div>
      <div style={{ flex: 1 }}>
        {tasks.map(t => (
          <RotinasTaskRow
            key={t.id}
            task={t}
            statuses={statuses}
            onToggle={onToggle}
            onOpenPanel={onOpenPanel}
            onDrag={setDraggingId}
            isDragging={draggingId === t.id}
          />
        ))}
      </div>
    </div>
  )
}

// ---- Productivity Bar ----
function ProdBar({ pct, color = '#26c281' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, height: 5, width: '100%', marginTop: 2 }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  )
}

// ---- Add/Edit Task Modal for Rotinas ----
function RotinasTaskModal({ spaceId, members, workspaceUsers, clients, statuses, initialDia, initialMemberId, onClose, onSave, existing }) {
  const [form, setForm] = useState({
    title: existing?.title || '',
    dia_semana: existing?.dia_semana ?? initialDia ?? 1,
    horario: existing?.horario || '',
    recorrente: existing?.recorrente || 'weekly',
    assignee_id: existing?.assignee_id || initialMemberId || '',
    client_id: existing?.client_id || '',
    priority: existing?.priority || 'none',
  })
  // Na criação, permite selecionar vários dias — cria uma tarefa por dia
  const [dias, setDias] = useState([initialDia ?? 1])
  const [checklistItems, setChecklistItems] = useState([])
  const [checklistInput, setChecklistInput] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleDia(key) {
    setDias(prev => prev.includes(key) ? (prev.length > 1 ? prev.filter(d => d !== key) : prev) : [...prev, key])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const basePayload = {
        title: form.title.trim(),
        space_id: spaceId,
        horario: form.horario || null,
        recorrente: form.recorrente,
        assignee_id: form.assignee_id || null,
        client_id: form.client_id || null,
        priority: form.priority,
      }
      const initialStatus = statuses.find(s => s.is_initial) || statuses[0]

      if (existing) {
        const res = await fetch('/api/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing.id, ...basePayload, dia_semana: Number(form.dia_semana) }),
        })
        const json = await res.json()
        if (json.task) { onSave(json.task, 'update'); onClose() }
      } else {
        for (const dia of dias) {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...basePayload, dia_semana: Number(dia), status_id: initialStatus?.id || null }),
          })
          const json = await res.json()
          if (json.task) {
            for (const label of checklistItems) {
              await fetch(`/api/tasks/${json.task.id}/checklist`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label }),
              }).catch(() => {})
            }
            onSave(json.task, 'create')
          }
        }
        onClose()
      }
    } finally { setSaving(false) }
  }

  const inp = { background: 'var(--bg-panel,#111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-dark,#050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 440, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
            {existing ? 'Editar Tarefa' : 'Nova Tarefa de Rotina'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>
            <i className="bx bx-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Título</label>
            <input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nome da tarefa..." style={inp} />
          </div>

          {existing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Dia da Semana</label>
                <CustomSelect
                  options={DIAS_SEMANA.map(d => ({ value: d.key, label: d.label }))}
                  value={form.dia_semana}
                  onChange={v => setForm(f => ({ ...f, dia_semana: Number(v) }))}
                  icon="bx-calendar"
                />
              </div>
              <div>
                <label style={lbl}>Horário</label>
                <input type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} style={inp} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Dias da Semana {dias.length > 1 && <span style={{ color: '#26c281', textTransform: 'none', letterSpacing: 0 }}>({dias.length} dias — uma tarefa por dia)</span>}</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {DIAS_SEMANA.map(d => (
                    <button key={d.key} type="button" onClick={() => toggleDia(d.key)}
                      style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: `1px solid ${dias.includes(d.key) ? '#26c281' : 'rgba(255,255,255,0.1)'}`, background: dias.includes(d.key) ? 'rgba(38,194,129,0.13)' : 'rgba(255,255,255,0.03)', color: dias.includes(d.key) ? '#26c281' : '#94a3b8', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 }}>
                      {String(d.label).slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Horário</label>
                <input type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} style={inp} />
              </div>
            </>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Recorrência</label>
            <CustomSelect
              options={[
                { value: 'weekly', label: 'Toda semana' },
                { value: 'biweekly', label: 'A cada 2 semanas' },
                { value: 'monthly', label: 'Mensal' },
                { value: 'once', label: 'Uma vez' },
              ]}
              value={form.recorrente}
              onChange={v => setForm(f => ({ ...f, recorrente: v }))}
              icon="bx-refresh"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Responsável</label>
            <CustomSelect
              options={[
                { value: '', label: 'Sem responsável' },
                ...(members.length > 0
                  ? members.map(m => ({ value: m.user_id || m.id, label: m.name + (m.cargo ? ` — ${m.cargo}` : '') }))
                  : (workspaceUsers || []).map(u => ({ value: u.id, label: u.full_name || u.email || u.id }))
                ),
              ]}
              value={form.assignee_id}
              onChange={v => setForm(f => ({ ...f, assignee_id: v }))}
              placeholder="Sem responsável"
              icon="bx-user"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Cliente</label>
            <CustomSelect
              options={[{ value: '', label: 'Sem cliente' }, ...((clients || []).map(c => ({ value: c.id, label: c.name })))]}
              value={form.client_id}
              onChange={v => setForm(f => ({ ...f, client_id: v }))}
              placeholder="Sem cliente"
              icon="bx-buildings"
            />
          </div>

          {!existing && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Checklist <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></label>
              {checklistItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <i className="bx bx-checkbox" style={{ color: '#26c281', fontSize: 16, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.82rem', color: '#cbd5e1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
                  <button type="button" onClick={() => setChecklistItems(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                    <i className="bx bx-x" style={{ fontSize: 14 }} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={checklistInput}
                  onChange={e => setChecklistInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && checklistInput.trim()) { e.preventDefault(); setChecklistItems(prev => [...prev, checklistInput.trim()]); setChecklistInput('') } }}
                  placeholder="Adicionar item da checklist…"
                  style={{ ...inp, fontSize: '0.82rem' }}
                />
                <button type="button" onClick={() => { if (checklistInput.trim()) { setChecklistItems(prev => [...prev, checklistInput.trim()]); setChecklistInput('') } }}
                  style={{ background: 'rgba(38,194,129,0.12)', border: '1px solid rgba(38,194,129,0.3)', color: '#26c281', borderRadius: 7, padding: '0 12px', cursor: 'pointer', flexShrink: 0 }}>
                  <i className="bx bx-plus" />
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#26c281', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              {saving ? 'Salvando...' : existing ? 'Salvar' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Add/Edit Member Modal ----
function MemberModal({ spaceId, workspaceUsers, onClose, onSave, existing }) {
  const [form, setForm] = useState({
    name: existing?.name || '',
    cargo: existing?.cargo || '',
    color: existing?.color || MEMBER_COLORS[0],
    user_id: existing?.user_id || '',
    ativo: existing?.ativo !== false,
    template_funcao: existing?.template_funcao || '',
  })
  const [applyTemplate, setApplyTemplate] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const payload = {
        space_id: spaceId,
        name: form.name.trim(),
        cargo: form.cargo || null,
        color: form.color,
        user_id: form.user_id || null,
        ativo: form.ativo,
        template_funcao: form.template_funcao || null,
      }

      let memberId = existing?.id
      if (existing) {
        const res = await fetch('/api/tasks/spaces/members', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing.id, ...payload }),
        })
        const json = await res.json()
        if (json.member) { memberId = json.member.id; onSave(json.member, 'update') }
      } else {
        const res = await fetch('/api/tasks/spaces/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json.member) { memberId = json.member.id; onSave(json.member, 'create') }
      }

      // Apply template tasks if selected
      if (applyTemplate && form.template_funcao && TEMPLATES_FUNCAO[form.template_funcao] && memberId) {
        const tmpl = TEMPLATES_FUNCAO[form.template_funcao]
        for (const t of tmpl.tasks) {
          await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: t.title,
              space_id: spaceId,
              dia_semana: t.dia_semana,
              assignee_id: form.user_id || null,
              recorrente: 'weekly',
            }),
          })
        }
        onSave(null, 'tasks_created')
      }

      onClose()
    } finally { setSaving(false) }
  }

  const inp = { background: 'var(--bg-panel,#111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 6, padding: '7px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-dark,#050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 480, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
            {existing ? 'Editar Membro' : 'Adicionar Membro'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>
            <i className="bx bx-x" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Vincular usuário do workspace</label>
            <CustomSelect
              options={[{ value: '', label: 'Sem vínculo' }, ...(workspaceUsers || []).map(u => ({ value: u.id, label: u.full_name || u.email }))]}
              value={form.user_id}
              onChange={v => {
                const u = workspaceUsers?.find(u => u.id === v)
                setForm(f => ({ ...f, user_id: v, name: u ? (u.full_name || u.email) : f.name }))
              }}
              placeholder="Sem vínculo"
              icon="bx-user-circle"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Nome</label>
            <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do colaborador..." style={inp} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Cargo / Função</label>
            <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex: Gestor de Resultado" style={inp} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Cor do card</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MEMBER_COLORS.map(c => (
                <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid #fff' : '3px solid transparent', boxSizing: 'border-box', transition: 'border 0.15s' }} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Template de Função</label>
            <CustomSelect
              options={[{ value: '', label: 'Sem template' }, ...Object.entries(TEMPLATES_FUNCAO).map(([k, v]) => ({ value: k, label: v.label }))]}
              value={form.template_funcao}
              onChange={v => setForm(f => ({ ...f, template_funcao: v }))}
              placeholder="Sem template"
              icon="bx-layout"
            />
          </div>

          {form.template_funcao && !existing && (
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(38,194,129,0.06)', border: '1px solid rgba(38,194,129,0.15)', borderRadius: 8, padding: '10px 14px' }}>
              <input type="checkbox" id="applyTmpl" checked={applyTemplate} onChange={e => setApplyTemplate(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label htmlFor="applyTmpl" style={{ fontSize: '0.83rem', color: '#94a3b8', cursor: 'pointer' }}>
                Aplicar tarefas do template <strong style={{ color: '#4ade80' }}>{TEMPLATES_FUNCAO[form.template_funcao]?.label}</strong>
              </label>
            </div>
          )}

          <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="ativo" checked={form.ativo} onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))} style={{ cursor: 'pointer' }} />
            <label htmlFor="ativo" style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' }}>Ativo</label>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#26c281', color: '#fff', cursor: saving ? 'wait' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              {saving ? 'Salvando...' : existing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Members Panel ----
function MembersPanel({ spaceId, members, workspaceUsers, onClose, onMembersChange }) {
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  async function handleDelete(id) {
    if (!confirm('Remover membro?')) return
    await fetch(`/api/tasks/spaces/members?id=${id}`, { method: 'DELETE' })
    onMembersChange(prev => prev.filter(m => m.id !== id))
  }

  async function handleToggleAtivo(member) {
    const res = await fetch('/api/tasks/spaces/members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, ativo: !member.ativo }),
    })
    const json = await res.json()
    if (json.member) onMembersChange(prev => prev.map(m => m.id === json.member.id ? json.member : m))
  }

  function handleSave(member, type) {
    if (!member) { return }
    if (type === 'create') onMembersChange(prev => [...prev, member])
    if (type === 'update') onMembersChange(prev => prev.map(m => m.id === member.id ? member : m))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2500, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: 400, maxWidth: '95vw', background: 'var(--bg-panel,#111113)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: 'var(--bg-panel,#111113)', zIndex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>
            <i className="bx bx-group" style={{ marginRight: 8, color: '#26c281' }} />
            Membros do Espaço
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>
            <i className="bx bx-x" />
          </button>
        </div>

        <div style={{ padding: 20, flex: 1 }}>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(38,194,129,0.12)', border: '1px solid rgba(38,194,129,0.3)', color: '#4ade80', padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: 18 }}
          >
            <i className="bx bx-user-plus" style={{ fontSize: 16 }} />
            Adicionar Membro
          </button>

          {members.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155', fontSize: '0.85rem' }}>
              <i className="bx bx-group" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
              Nenhum membro adicionado.
            </div>
          )}

          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <MemberAvatar member={m} size={36} style={{ opacity: m.ativo ? 1 : 0.4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: m.ativo ? '#f1f5f9' : '#475569' }}>{m.name}</div>
                {m.cargo && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.cargo}</div>}
                {m.template_funcao && TEMPLATES_FUNCAO[m.template_funcao] && (
                  <div style={{ fontSize: '0.68rem', color: TEMPLATES_FUNCAO[m.template_funcao].color, marginTop: 2 }}>
                    <i className={`bx ${TEMPLATES_FUNCAO[m.template_funcao].icon}`} style={{ marginRight: 3 }} />
                    {TEMPLATES_FUNCAO[m.template_funcao].label}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" title={m.ativo ? 'Desativar' : 'Ativar'} onClick={() => handleToggleAtivo(m)} style={{ background: 'none', border: 'none', color: m.ativo ? '#26c281' : '#475569', cursor: 'pointer', fontSize: 16, padding: 4 }}>
                  <i className={`bx ${m.ativo ? 'bx-toggle-right' : 'bx-toggle-left'}`} />
                </button>
                <button type="button" title="Editar" onClick={() => setEditTarget(m)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 15, padding: 4 }}>
                  <i className="bx bx-edit" />
                </button>
                <button type="button" title="Remover" onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', color: '#ef444480', cursor: 'pointer', fontSize: 15, padding: 4 }}>
                  <i className="bx bx-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(showAdd || editTarget) && (
        <MemberModal
          spaceId={spaceId}
          workspaceUsers={workspaceUsers}
          onClose={() => { setShowAdd(false); setEditTarget(null) }}
          onSave={(member, type) => { handleSave(member, type); setShowAdd(false); setEditTarget(null) }}
          existing={editTarget}
        />
      )}
    </div>
  )
}

// ---- Overview Grid ----
function OverviewGrid({ members, tasks, statuses, weekDates }) {
  const closedIds = new Set(statuses.filter(s => s.is_completed || s.is_closed).map(s => s.id))

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.07)', width: 180 }}>Usuário</th>
            {weekDates.map(d => (
              <th key={d.key} style={{ textAlign: 'center', padding: '8px 8px', color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.07)', minWidth: 60 }}>
                {d.short}<br /><span style={{ fontWeight: 400, fontSize: '0.65rem' }}>{d.display}</span>
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '8px 8px', color: '#64748b', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.07)', minWidth: 60 }}>%</th>
          </tr>
        </thead>
        <tbody>
          {members.filter(m => m.ativo).map((member, idx) => {
            const assigneeId = member.user_id || member.id
            const memberTasks = tasks.filter(t => t.assignee_id === assigneeId || t.assignee_id === member.id)
            const total = memberTasks.length
            const done = memberTasks.filter(t => closedIds.has(t.status_id)).length
            const pct = total > 0 ? Math.round((done / total) * 100) : 0

            return (
              <tr key={member.id} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MemberAvatar member={member} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{member.name}</div>
                      {member.cargo && <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{member.cargo}</div>}
                    </div>
                  </div>
                </td>
                {weekDates.map(d => {
                  const dayTasks = memberTasks.filter(t => t.dia_semana === d.key)
                  const dayDone = dayTasks.filter(t => closedIds.has(t.status_id)).length
                  const allDone = dayTasks.length > 0 && dayDone === dayTasks.length
                  const noneDone = dayTasks.length > 0 && dayDone === 0
                  const partial = dayTasks.length > 0 && !allDone && !noneDone
                  return (
                    <td key={d.key} style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {dayTasks.length === 0
                        ? <span style={{ color: '#1e293b', fontSize: 12 }}>—</span>
                        : <div>
                          <span style={{ fontSize: 18 }}>
                            {allDone ? '✅' : noneDone ? '❌' : '🔶'}
                          </span>
                          <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 1 }}>{dayDone}/{dayTasks.length}</div>
                        </div>
                      }
                    </td>
                  )
                })}
                <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontWeight: 700, color: pct >= 80 ? '#26c281' : pct >= 50 ? '#f59e0b' : '#ef4444', fontSize: '0.9rem' }}>{pct}%</div>
                  <ProdBar pct={pct} color={pct >= 80 ? '#26c281' : pct >= 50 ? '#f59e0b' : '#ef4444'} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ---- Delete Space Modal ----
function DeleteSpaceModal({ space, onClose, onDeleted }) {
  const [step, setStep] = useState(1)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const nameMatch = typed.trim() === space.name.trim()

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/tasks/spaces?id=${space.id}`, { method: 'DELETE' })
      onDeleted(space.id)
    } finally { setDeleting(false) }
  }

  const inp = { background: 'var(--bg-panel,#111113)', border: '1px solid rgba(239,68,68,0.3)', color: '#e2e8f0', borderRadius: 6, padding: '8px 10px', fontSize: '0.88rem', width: '100%', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-dark,#050506)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, width: 440, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bx bx-trash" style={{ fontSize: 18, color: '#ef4444' }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fca5a5' }}>Excluir Espaço</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Esta ação é irreversível</p>
          </div>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>
            <i className="bx bx-x" />
          </button>
        </div>
        {step === 1 && (
          <>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 14 }}>Para confirmar, digite o nome do espaço:</p>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '3px 8px', borderRadius: 5 }}>{space.name}</span>
            </div>
            <input autoFocus value={typed} onChange={e => setTyped(e.target.value)} placeholder={`Digite: ${space.name}`} style={inp} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
              <button type="button" disabled={!nameMatch} onClick={() => setStep(2)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: nameMatch ? '#ef4444' : 'rgba(239,68,68,0.2)', color: nameMatch ? '#fff' : '#64748b', cursor: nameMatch ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 600 }}>Continuar</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: '#fca5a5', fontWeight: 600 }}>Tem certeza? Isso vai apagar permanentemente:</p>
              <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.8' }}>
                <li>Todas as tarefas do espaço</li><li>Histórico e comentários</li><li>Anexos e checklists</li><li>Membros e automações</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
              <button type="button" disabled={deleting} onClick={handleDelete} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', cursor: deleting ? 'wait' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>{deleting ? 'Excluindo...' : 'Excluir Permanentemente'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---- Main RotinasView ----
export default function RotinasView({ space, allTasks, statuses, workspaceUsers, clients, taskFilter, onOpenPanel, onTaskSaved, onBack, onDeleteSpace, hideBack, hideDelete, hideMembers, onOpenModels }) {
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [mondayDate, setMondayDate] = useState(() => getMonday(new Date()))
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filterMemberId, setFilterMemberId] = useState('all')
  const [viewMode, setViewMode] = useState('week') // week | overview
  const [showMembersPanel, setShowMembersPanel] = useState(false)
  const [taskModal, setTaskModal] = useState(null) // { dia, memberId } | null
  const [editTask, setEditTask] = useState(null)

  const weekDates = getWeekDates(mondayDate)
  const spaceTasks = allTasks.filter(t => t.space_id === space.id).filter(t => !taskFilter || taskFilter(t))

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const res = await fetch(`/api/tasks/spaces/members?space_id=${space.id}`)
      const json = await res.json()
      if (json.members) setMembers(json.members)
    } finally { setLoadingMembers(false) }
  }, [space.id])

  useEffect(() => { loadMembers() }, [loadMembers])

  // Auto-renewal: reset recurring tasks at start of each new week
  useEffect(() => {
    const weekKey = fmtDate(mondayDate)
    const storageKey = `rotinas_renewed_${space.id}`
    const lastRenewed = localStorage.getItem(storageKey)
    if (lastRenewed === weekKey) return

    const recurringTasks = allTasks.filter(t => t.space_id === space.id && t.recorrente && t.recorrente !== 'once')
    if (recurringTasks.length === 0) { localStorage.setItem(storageKey, weekKey); return }

    const initialStatus = statuses.find(s => s.is_initial) || statuses[0]
    if (!initialStatus) return

    Promise.all(recurringTasks.map(t => {
      const currentStatus = statuses.find(s => s.id === t.status_id)
      if (!currentStatus?.is_completed && !currentStatus?.is_closed) return null
      return fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, status_id: initialStatus.id }),
      }).then(r => r.json()).then(json => json.task || null)
    })).then(results => {
      results.forEach(task => { if (task) onTaskSaved(task, 'update') })
      localStorage.setItem(storageKey, weekKey)
    })
  }, [space.id, mondayDate, allTasks, statuses, onTaskSaved])

  function getTasksForCell(diaKey, memberId) {
    return spaceTasks.filter(t => {
      if (t.dia_semana !== diaKey) return false
      if (memberId && memberId !== 'all') {
        const member = members.find(m => m.id === memberId || m.user_id === memberId)
        if (!member) return false
        return t.assignee_id === member.user_id || t.assignee_id === member.id
      }
      return true
    })
  }

  async function handleToggle(task) {
    const closedStatus = statuses.find(s => s.is_closed)
    const doneStatus = statuses.find(s => s.is_completed)
    const initialStatus = statuses.find(s => s.is_initial) || statuses[0]
    const currentStatus = statuses.find(s => s.id === task.status_id)
    const isCompleted = currentStatus?.is_completed || currentStatus?.is_closed
    const targetStatusId = isCompleted ? (initialStatus?.id || null) : (closedStatus?.id || doneStatus?.id || null)
    if (!targetStatusId) return
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status_id: targetStatusId }),
    })
    const json = await res.json()
    if (json.task) onTaskSaved(json.task, 'update')
  }

  async function handleDropTask(taskId, diaKey) {
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, dia_semana: diaKey }),
    })
    const json = await res.json()
    if (json.task) onTaskSaved(json.task, 'update')
  }

  // Productivity stats
  const closedIds = new Set(statuses.filter(s => s.is_completed || s.is_closed).map(s => s.id))
  const totalTasks = spaceTasks.length
  const doneTasks = spaceTasks.filter(t => closedIds.has(t.status_id)).length
  const overdueTasks = spaceTasks.filter(t => !closedIds.has(t.status_id) && t.due_date && t.due_date < fmtDate(new Date())).length
  const pctWeek = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const today = fmtDate(new Date())
  const weekStr = `${weekDates[0]?.display} — ${weekDates[weekDates.length - 1]?.display}`
  const thisMonday = fmtDate(getMonday(new Date()))
  const currentMondayStr = fmtDate(mondayDate)
  const isCurrentWeek = currentMondayStr === thisMonday
  const weekLabel = isCurrentWeek ? 'Esta semana' : (() => {
    const diff = Math.round((mondayDate - getMonday(new Date())) / (7 * 86400000))
    if (diff === -1) return 'Semana passada'
    if (diff === 1) return 'Próxima semana'
    return diff < 0 ? `${Math.abs(diff)} sem. atrás` : `Em ${diff} sem.`
  })()

  // Ranking
  const ranking = members
    .filter(m => m.ativo)
    .map(m => {
      const assigneeId = m.user_id || m.id
      const mt = spaceTasks.filter(t => t.assignee_id === assigneeId || t.assignee_id === m.id)
      const done = mt.filter(t => closedIds.has(t.status_id)).length
      const pct = mt.length > 0 ? Math.round((done / mt.length) * 100) : 0
      return { ...m, pct, done, total: mt.length }
    })
    .sort((a, b) => b.pct - a.pct)

  return (
    <div style={{ color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
        {!hideBack && (
          <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
            <i className="bx bx-chevron-left" style={{ fontSize: 18 }} /> Voltar
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: space.color }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f1f5f9' }}>{space.name}</span>
          <span style={{ fontSize: '0.72rem', background: 'rgba(38,194,129,0.12)', color: '#4ade80', borderRadius: 6, padding: '2px 8px' }}>Rotinas</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Week navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, overflow: 'hidden' }}>
          <button type="button" onClick={() => setMondayDate(d => addDays(d, -7))}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', fontSize: 18, lineHeight: 1 }}
            title="Semana anterior">
            <i className="bx bx-chevron-left" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px' }}>
            <i className="bx bx-calendar-week" style={{ color: '#26c281', fontSize: 14 }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isCurrentWeek ? '#4ade80' : '#94a3b8', lineHeight: 1.2 }}>{weekLabel}</div>
              <div style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.2 }}>{weekStr}</div>
            </div>
          </div>
          <button type="button" onClick={() => setMondayDate(d => addDays(d, 7))}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px 10px', display: 'flex', alignItems: 'center', fontSize: 18, lineHeight: 1 }}
            title="Próxima semana">
            <i className="bx bx-chevron-right" />
          </button>
          {!isCurrentWeek && (
            <button type="button" onClick={() => setMondayDate(getMonday(new Date()))}
              style={{ background: 'rgba(38,194,129,0.12)', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', color: '#26c281', cursor: 'pointer', padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700 }}
              title="Voltar para esta semana">
              Hoje
            </button>
          )}
        </div>

        {!hideDelete && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#ef444480', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef444480' }}
          >
            <i className="bx bx-trash" style={{ fontSize: 15 }} /> Excluir
          </button>
        )}

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 2, gap: 2 }}>
          {[
            { key: 'week', icon: 'bx-calendar-week', label: 'Semana' },
            { key: 'overview', icon: 'bx-grid-alt', label: 'Visão Geral' },
          ].map(({ key, icon, label }) => (
            <button key={key} type="button" onClick={() => setViewMode(key)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', background: viewMode === key ? '#26c281' : 'transparent', color: viewMode === key ? '#fff' : '#64748b' }}>
              <i className={`bx ${icon}`} style={{ fontSize: 15 }} />{label}
            </button>
          ))}
        </div>

        {onOpenModels && (
          <button type="button" onClick={onOpenModels} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(38,194,129,0.1)', border: '1px solid rgba(38,194,129,0.3)', color: '#26c281', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            <i className="bx bx-package" style={{ fontSize: 15 }} /> Modelos
          </button>
        )}

        <button type="button" onClick={() => setTaskModal({ dia: 1, memberId: null })} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#04150d', padding: '6px 14px', borderRadius: 7, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
          <i className="bx bx-plus" style={{ fontSize: 15 }} /> Nova Tarefa
        </button>

        {!hideMembers && (
          <button type="button" onClick={() => setShowMembersPanel(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 12px', borderRadius: 7, fontSize: '0.82rem', cursor: 'pointer' }}>
            <i className="bx bx-group" style={{ fontSize: 15 }} /> Membros ({members.filter(m => m.ativo).length})
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
        {[
          { label: 'Concluídas', value: doneTasks, color: '#26c281', icon: 'bx-check-circle' },
          { label: 'Pendentes', value: totalTasks - doneTasks, color: '#f59e0b', icon: 'bx-time-five' },
          { label: 'Atrasadas', value: overdueTasks, color: '#ef4444', icon: 'bx-error-circle' },
          { label: 'Total', value: totalTasks, color: '#64748b', icon: 'bx-task' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
            <i className={`bx ${s.icon}`} style={{ fontSize: 16, color: s.color }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', color: '#475569' }}>{s.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(38,194,129,0.06)', border: '1px solid rgba(38,194,129,0.15)', borderRadius: 8 }}>
          <i className="bx bx-trending-up" style={{ fontSize: 16, color: '#26c281' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#26c281' }}>{pctWeek}%</span>
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>Semana</span>
        </div>
      </div>

      {/* Member filter (week view) */}
      {viewMode === 'week' && members.length > 0 && (
        <div style={{ display: 'flex', gap: 6, padding: '10px 0', overflowX: 'auto', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setFilterMemberId('all')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, border: `1px solid ${filterMemberId === 'all' ? '#26c281' : 'rgba(255,255,255,0.1)'}`, background: filterMemberId === 'all' ? 'rgba(38,194,129,0.12)' : 'rgba(255,255,255,0.03)', color: filterMemberId === 'all' ? '#4ade80' : '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}>
            Todos
          </button>
          {members.filter(m => m.ativo).map(m => (
            <button key={m.id} type="button" onClick={() => setFilterMemberId(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, border: `1px solid ${filterMemberId === m.id ? m.color : 'rgba(255,255,255,0.08)'}`, background: filterMemberId === m.id ? `${m.color}1a` : 'rgba(255,255,255,0.02)', color: filterMemberId === m.id ? m.color : '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0 }}>
              <MemberAvatar member={m} size={18} />
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Week view */}
      {viewMode === 'week' && (
        <div style={{ paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weekDates.length}, 1fr)`, gap: 10 }}>
            {weekDates.map(d => {
              const isToday = d.date === today
              return (
                <div key={d.key}>
                  <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: isToday ? '#26c281' : '#64748b' }}>{d.short}</span>
                    <span style={{ fontSize: '0.65rem', color: isToday ? '#26c281' : '#334155' }}>{d.display}</span>
                    {isToday && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#26c281' }} />}
                  </div>
                  <DayCell
                    dia={d}
                    tasks={getTasksForCell(d.key, filterMemberId)}
                    statuses={statuses}
                    onToggle={handleToggle}
                    onOpenPanel={onOpenPanel}
                    onAddTask={dia => setTaskModal({ dia: dia.key, memberId: filterMemberId !== 'all' ? filterMemberId : '' })}
                    onDropTask={handleDropTask}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Overview grid */}
      {viewMode === 'overview' && (
        <div style={{ paddingTop: 16 }}>
          <OverviewGrid members={members} tasks={spaceTasks} statuses={statuses} weekDates={weekDates} />

          {/* Ranking */}
          {ranking.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                <i className="bx bx-trophy" style={{ marginRight: 6, color: '#f59e0b' }} />Ranking da Semana
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ranking.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: i === 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, minWidth: 180 }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#78716c', minWidth: 24 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                    </span>
                    <MemberAvatar member={m} size={32} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9' }}>{m.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.done}/{m.total} tarefas</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.95rem', color: m.pct >= 80 ? '#26c281' : m.pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {m.pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members Panel */}
      {showMembersPanel && (
        <MembersPanel
          spaceId={space.id}
          members={members}
          workspaceUsers={workspaceUsers}
          onClose={() => { setShowMembersPanel(false); loadMembers() }}
          onMembersChange={setMembers}
        />
      )}

      {/* Delete space modal */}
      {showDeleteModal && (
        <DeleteSpaceModal
          space={space}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={id => { onDeleteSpace?.(id); onBack() }}
        />
      )}

      {/* Add/Edit Task Modal */}
      {taskModal && (
        <RotinasTaskModal
          spaceId={space.id}
          members={members}
          workspaceUsers={workspaceUsers}
          clients={clients}
          statuses={statuses}
          initialDia={taskModal.dia}
          initialMemberId={taskModal.memberId}
          onClose={() => setTaskModal(null)}
          onSave={(task, type) => { onTaskSaved(task, type); setTaskModal(null) }}
        />
      )}

      {editTask && (
        <RotinasTaskModal
          spaceId={space.id}
          members={members}
          workspaceUsers={workspaceUsers}
          clients={clients}
          statuses={statuses}
          onClose={() => setEditTask(null)}
          onSave={(task, type) => { onTaskSaved(task, type); setEditTask(null) }}
          existing={editTask}
        />
      )}
    </div>
  )
}
