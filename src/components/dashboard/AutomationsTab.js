'use client'
import { useState, useEffect, useCallback } from 'react'

const GREEN = '#26c281'
const ACCENT = '#6366f1'

// ── Trigger types ────────────────────────────────────────────
const TRIGGER_TYPES = [
  { value: 'task_created',          label: 'Tarefa criada' },
  { value: 'task_status_changed',   label: 'Status alterado' },
  { value: 'task_assignee_changed', label: 'Responsável alterado' },
  { value: 'task_priority_changed', label: 'Prioridade alterada' },
  { value: 'task_due_date_set',     label: 'Data de vencimento definida' },
  { value: 'task_overdue',          label: 'Tarefa vencida' },
  { value: 'task_completed',        label: 'Tarefa concluída' },
  { value: 'task_commented',        label: 'Comentário adicionado' },
  { value: 'task_due_soon',         label: 'Vencimento próximo' },
  { value: 'schedule_daily',        label: 'Diariamente (agendado)' },
  { value: 'schedule_weekly',       label: 'Semanalmente (agendado)' },
  { value: 'schedule_monthly',      label: 'Mensalmente (agendado)' },
  { value: 'client_created',        label: 'Cliente criado' },
  { value: 'manual',                label: 'Manual (executar agora)' },
]

const CONDITION_FIELDS = [
  { value: 'status_id',   label: 'Status' },
  { value: 'priority',    label: 'Prioridade' },
  { value: 'assignee_id', label: 'Responsável' },
  { value: 'client_id',   label: 'Cliente' },
  { value: 'due_date',    label: 'Vencimento' },
  { value: 'title',       label: 'Título' },
]

const CONDITION_OPERATORS = [
  { value: 'eq',          label: 'igual a' },
  { value: 'neq',         label: 'diferente de' },
  { value: 'contains',    label: 'contém' },
  { value: 'not_contains',label: 'não contém' },
  { value: 'is_null',     label: 'está vazio' },
  { value: 'is_not_null', label: 'não está vazio' },
  { value: 'gt',          label: 'maior que' },
  { value: 'lt',          label: 'menor que' },
  { value: 'due_soon',    label: 'vence em X dias' },
  { value: 'overdue',     label: 'está vencida' },
  { value: 'in',          label: 'está na lista' },
]

const ACTION_TYPES = [
  { value: 'change_status',     label: 'Alterar status',          icon: 'bx-transfer' },
  { value: 'change_assignee',   label: 'Alterar responsável',     icon: 'bx-user' },
  { value: 'change_priority',   label: 'Alterar prioridade',      icon: 'bx-flag' },
  { value: 'add_comment',       label: 'Adicionar comentário',    icon: 'bx-comment-add' },
  { value: 'send_notification', label: 'Enviar notificação',      icon: 'bx-bell' },
  { value: 'create_task',       label: 'Criar tarefa',            icon: 'bx-plus-circle' },
  { value: 'create_subtasks',   label: 'Criar subtarefas',        icon: 'bx-list-plus' },
  { value: 'move_task',         label: 'Mover para espaço',       icon: 'bx-transfer-alt' },
  { value: 'update_custom_field', label: 'Atualizar campo',       icon: 'bx-edit' },
]

const PRIORITY_OPTIONS = ['urgent', 'high', 'medium', 'low', 'none']

// ── Small helpers ────────────────────────────────────────────
function Pill({ label, color = GREEN }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {label}
    </span>
  )
}

function SectionCard({ title, icon, children, accent = GREEN }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <i className={`bx ${icon}`} style={{ color: accent, fontSize: 16 }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function Input({ value, onChange, placeholder, style = {} }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12,
        outline: 'none', width: '100%', boxSizing: 'border-box', ...style,
      }}
    />
  )
}

function Select({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 7, padding: '7px 10px', color: '#e2e8f0', fontSize: 12,
        outline: 'none', cursor: 'pointer', ...style,
      }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

// ── AutomationBuilder ────────────────────────────────────────
function AutomationBuilder({ automation, onSave, onCancel, spaces = [], statuses = [], users = [], defaultSpaceId = '' }) {
  const [name, setName] = useState(automation?.name || '')
  const [description, setDescription] = useState(automation?.description || '')
  const [isActive, setIsActive] = useState(automation?.is_active !== false)
  const [triggerType, setTriggerType] = useState(automation?.triggers?.[0]?.trigger_type || 'task_created')
  const [triggerConfig, setTriggerConfig] = useState(automation?.triggers?.[0]?.config || (defaultSpaceId ? { space_id: defaultSpaceId } : {}))
  const [conditions, setConditions] = useState(automation?.conditions || [])
  const [actions, setActions] = useState(automation?.actions || [{ action_type: 'send_notification', config: {}, sort_order: 0 }])
  const [saving, setSaving] = useState(false)

  function addCondition() {
    setConditions(prev => [...prev, { field: 'status_id', operator: 'eq', value: '', group_id: 0, sort_order: prev.length }])
  }

  function updateCondition(idx, patch) {
    setConditions(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  function removeCondition(idx) {
    setConditions(prev => prev.filter((_, i) => i !== idx))
  }

  function addAction() {
    setActions(prev => [...prev, { action_type: 'send_notification', config: {}, sort_order: prev.length }])
  }

  function updateAction(idx, patch) {
    setActions(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a))
  }

  function removeAction(idx) {
    setActions(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description,
        is_active: isActive,
        triggers: [{ trigger_type: triggerType, config: triggerConfig, sort_order: 0 }],
        conditions,
        actions,
      })
    } finally {
      setSaving(false)
    }
  }

  const noValueOps = ['is_null', 'is_not_null', 'overdue']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Input value={name} onChange={setName} placeholder="Nome da automação" style={{ fontSize: 15, fontWeight: 700, flex: 1 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', cursor: 'pointer', flexShrink: 0 }}>
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ accentColor: GREEN }} />
          Ativa
        </label>
      </div>
      <Input value={description} onChange={setDescription} placeholder="Descrição (opcional)" style={{ marginBottom: 16, fontSize: 12 }} />

      {/* WHEN */}
      <SectionCard title="QUANDO (gatilho)" icon="bx-zap" accent="#f59e0b">
        <Select value={triggerType} onChange={v => { setTriggerType(v); setTriggerConfig(c => (c.space_id ? { space_id: c.space_id } : {})) }}
          options={TRIGGER_TYPES} style={{ width: '100%' }} />
        {triggerType.startsWith('task_') && (
          <div style={{ marginTop: 10 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Aplicar no espaço</span>
            <Select value={triggerConfig.space_id || ''} onChange={v => setTriggerConfig(c => ({ ...c, space_id: v }))}
              options={[{ value: '', label: 'Todos os espaços' }, ...spaces.map(s => ({ value: s.id, label: s.name }))]}
              style={{ width: '100%' }} />
          </div>
        )}
        {triggerType === 'task_due_soon' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Dias antes:</span>
            <input type="number" min={1} max={30} value={triggerConfig.days || 3}
              onChange={e => setTriggerConfig({ days: Number(e.target.value) })}
              style={{ width: 60, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
          </div>
        )}
      </SectionCard>

      {/* IF */}
      <SectionCard title="SE (condições opcionais)" icon="bx-filter" accent={ACCENT}>
        {conditions.length === 0 && (
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Sem condições — a automação sempre executa quando o gatilho ocorrer.</div>
        )}
        {conditions.map((cond, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {idx > 0 && (
              <Select value={String(cond.group_id ?? 0)} onChange={v => updateCondition(idx, { group_id: Number(v) })}
                options={[{ value: '0', label: 'E' }, { value: String(idx), label: 'OU' }]}
                style={{ width: 55 }} />
            )}
            <Select value={cond.field} onChange={v => updateCondition(idx, { field: v })}
              options={CONDITION_FIELDS} style={{ flex: 1, minWidth: 100 }} />
            <Select value={cond.operator} onChange={v => updateCondition(idx, { operator: v })}
              options={CONDITION_OPERATORS} style={{ flex: 1, minWidth: 110 }} />
            {!noValueOps.includes(cond.operator) && (
              <Input value={cond.value || ''} onChange={v => updateCondition(idx, { value: v })}
                placeholder="valor" style={{ flex: 1, minWidth: 80 }} />
            )}
            <button onClick={() => removeCondition(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
              <i className="bx bx-trash" />
            </button>
          </div>
        ))}
        <button onClick={addCondition} style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 7, color: '#94a3b8', padding: '6px 12px', fontSize: 12, cursor: 'pointer', width: '100%', marginTop: 4 }}>
          + Adicionar condição
        </button>
      </SectionCard>

      {/* THEN */}
      <SectionCard title="ENTÃO (ações)" icon="bx-play" accent={GREEN}>
        {actions.map((action, idx) => (
          <ActionEditor key={idx} action={action} spaces={spaces} statuses={statuses} users={users}
            onChange={patch => updateAction(idx, patch)}
            onRemove={() => removeAction(idx)} />
        ))}
        <button onClick={addAction} style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 7, color: '#94a3b8', padding: '6px 12px', fontSize: 12, cursor: 'pointer', width: '100%', marginTop: 4 }}>
          + Adicionar ação
        </button>
      </SectionCard>

      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving || !name.trim()} style={{ background: GREEN, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Salvando...' : 'Salvar automação'}
        </button>
      </div>
    </div>
  )
}

// ── ActionEditor ─────────────────────────────────────────────
function ActionEditor({ action, onChange, onRemove, spaces, statuses, users }) {
  const { action_type, config } = action
  const at = ACTION_TYPES.find(a => a.value === action_type)

  function cfgChange(patch) {
    onChange({ ...action, config: { ...config, ...patch } })
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <i className={`bx ${at?.icon || 'bx-cog'}`} style={{ color: GREEN }} />
        <Select value={action_type} onChange={v => onChange({ ...action, action_type: v, config: {} })}
          options={ACTION_TYPES} style={{ flex: 1 }} />
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
          <i className="bx bx-trash" />
        </button>
      </div>

      {action_type === 'change_status' && (
        <Select value={config.status_id || ''} onChange={v => cfgChange({ status_id: v })}
          options={[{ value: '', label: 'Selecionar status...' }, ...statuses.map(s => ({ value: s.id, label: s.name }))]}
          style={{ width: '100%' }} />
      )}

      {action_type === 'change_assignee' && (
        <Select value={config.assignee_id || ''} onChange={v => cfgChange({ assignee_id: v })}
          options={[{ value: '', label: 'Selecionar responsável...' }, ...users.map(u => ({ value: u.id, label: u.full_name || u.email }))]}
          style={{ width: '100%' }} />
      )}

      {action_type === 'change_priority' && (
        <Select value={config.priority || 'medium'} onChange={v => cfgChange({ priority: v })}
          options={PRIORITY_OPTIONS.map(p => ({ value: p, label: p }))} style={{ width: '100%' }} />
      )}

      {action_type === 'add_comment' && (
        <textarea value={config.body || ''} onChange={e => cfgChange({ body: e.target.value })}
          placeholder="Texto do comentário. Use {{task.title}}, {{date}}, {{week}}..."
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', minHeight: 70 }} />
      )}

      {action_type === 'send_notification' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input value={config.title || ''} onChange={v => cfgChange({ title: v })} placeholder="Título da notificação" />
          <Input value={config.message || ''} onChange={v => cfgChange({ message: v })} placeholder="Mensagem. Use {{task.title}}, {{date}}..." />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!config.notify_assignee} onChange={e => cfgChange({ notify_assignee: e.target.checked })} style={{ accentColor: GREEN }} />
            Notificar responsável da tarefa
          </label>
        </div>
      )}

      {action_type === 'create_task' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input value={config.title || ''} onChange={v => cfgChange({ title: v })} placeholder="Título. Use {{task.title}}, {{date}}..." />
          <Select value={config.space_id || ''} onChange={v => cfgChange({ space_id: v })}
            options={[{ value: '', label: 'Mesmo espaço da tarefa' }, ...spaces.map(s => ({ value: s.id, label: s.name }))]}
            style={{ width: '100%' }} />
        </div>
      )}

      {action_type === 'create_subtasks' && (
        <textarea value={(config.titles || []).join('\n')} onChange={e => cfgChange({ titles: e.target.value.split('\n').filter(Boolean) })}
          placeholder="Uma subtarefa por linha..."
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none', resize: 'vertical', minHeight: 70 }} />
      )}

      {action_type === 'move_task' && (
        <Select value={config.space_id || ''} onChange={v => cfgChange({ space_id: v })}
          options={[{ value: '', label: 'Selecionar espaço...' }, ...spaces.map(s => ({ value: s.id, label: s.name }))]}
          style={{ width: '100%' }} />
      )}
    </div>
  )
}

// ── RecurringTaskBuilder ────────────────────────────────────
function RecurringTaskBuilder({ task, onSave, onCancel, spaces = [], statuses = [], users = [] }) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [spaceId, setSpaceId] = useState(task?.space_id || '')
  const [statusId, setStatusId] = useState(task?.status_id || '')
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [recurrenceType, setRecurrenceType] = useState(task?.recurrence_type || 'weekly')
  const [cfg, setCfg] = useState(task?.recurrence_config || { interval: 1, days_of_week: [1] })
  const [endType, setEndType] = useState(task?.end_type || 'never')
  const [endAfterN, setEndAfterN] = useState(task?.end_after_n || 10)
  const [endOnDate, setEndOnDate] = useState(task?.end_on_date || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(), description, space_id: spaceId || null,
        status_id: statusId || null, assignee_id: assigneeId || null, priority,
        recurrence_type: recurrenceType, recurrence_config: cfg,
        end_type: endType, end_after_n: endType === 'after_n' ? Number(endAfterN) : null,
        end_on_date: endType === 'on_date' ? endOnDate : null,
        is_active: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Input value={title} onChange={setTitle} placeholder="Título da tarefa recorrente" style={{ fontSize: 15, fontWeight: 700 }} />
      <Input value={description} onChange={setDescription} placeholder="Descrição (opcional)" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Select value={spaceId} onChange={setSpaceId}
          options={[{ value: '', label: 'Sem espaço' }, ...spaces.map(s => ({ value: s.id, label: s.name }))]}
          style={{ width: '100%' }} />
        <Select value={assigneeId} onChange={setAssigneeId}
          options={[{ value: '', label: 'Sem responsável' }, ...users.map(u => ({ value: u.id, label: u.full_name || u.email }))]}
          style={{ width: '100%' }} />
        <Select value={statusId} onChange={setStatusId}
          options={[{ value: '', label: 'Status inicial' }, ...statuses.map(s => ({ value: s.id, label: s.name }))]}
          style={{ width: '100%' }} />
        <Select value={priority} onChange={setPriority}
          options={PRIORITY_OPTIONS.map(p => ({ value: p, label: p }))} style={{ width: '100%' }} />
      </div>

      <SectionCard title="Recorrência" icon="bx-refresh" accent={ACCENT}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['daily', 'weekly', 'monthly', 'yearly', 'custom'].map(t => (
            <button key={t} onClick={() => { setRecurrenceType(t); setCfg({ interval: 1 }) }}
              style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${recurrenceType === t ? ACCENT + '88' : 'rgba(255,255,255,0.1)'}`, background: recurrenceType === t ? ACCENT + '18' : 'transparent', color: recurrenceType === t ? ACCENT : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
              {{ daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual', custom: 'Personalizado' }[t]}
            </button>
          ))}
        </div>

        {recurrenceType === 'weekly' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DOW.map((d, i) => (
              <button key={i} onClick={() => {
                const days = cfg.days_of_week || [1]
                setCfg({ ...cfg, days_of_week: days.includes(i) ? days.filter(x => x !== i) : [...days, i] })
              }} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${(cfg.days_of_week || [1]).includes(i) ? GREEN + '88' : 'rgba(255,255,255,0.1)'}`, background: (cfg.days_of_week || [1]).includes(i) ? GREEN + '18' : 'transparent', color: (cfg.days_of_week || [1]).includes(i) ? GREEN : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
                {d}
              </button>
            ))}
          </div>
        )}

        {recurrenceType === 'monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Dia:</span>
            <input type="number" min={1} max={31} value={cfg.day_of_month || 1}
              onChange={e => setCfg({ ...cfg, day_of_month: Number(e.target.value) })}
              style={{ width: 60, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>de cada mês</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>A cada:</span>
          <input type="number" min={1} value={cfg.interval || 1}
            onChange={e => setCfg({ ...cfg, interval: Number(e.target.value) })}
            style={{ width: 55, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{{ daily: 'dia(s)', weekly: 'semana(s)', monthly: 'mês(es)', yearly: 'ano(s)', custom: 'intervalo(s)' }[recurrenceType]}</span>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Termina:</span>
          {[{ v: 'never', l: 'Nunca' }, { v: 'after_n', l: 'Após N ocorrências' }, { v: 'on_date', l: 'Em data' }].map(({ v, l }) => (
            <button key={v} onClick={() => setEndType(v)}
              style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${endType === v ? ACCENT + '88' : 'rgba(255,255,255,0.1)'}`, background: endType === v ? ACCENT + '18' : 'transparent', color: endType === v ? ACCENT : '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
              {l}
            </button>
          ))}
          {endType === 'after_n' && (
            <input type="number" min={1} value={endAfterN} onChange={e => setEndAfterN(e.target.value)}
              style={{ width: 60, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
          )}
          {endType === 'on_date' && (
            <input type="date" value={endOnDate} onChange={e => setEndOnDate(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '5px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none' }} />
          )}
        </div>
      </SectionCard>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handleSave} disabled={saving || !title.trim()} style={{ background: ACCENT, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Salvando...' : 'Salvar tarefa recorrente'}
        </button>
      </div>
    </div>
  )
}

// ── Main AutomationsTab ──────────────────────────────────────
export default function AutomationsTab({ workspaceUsers = [], isMaster = false, defaultSpaceId = '' }) {
  const [tab, setTab] = useState('automations') // 'automations' | 'recurring'
  const [automations, setAutomations] = useState([])
  const [recurringTasks, setRecurringTasks] = useState([])
  const [spaces, setSpaces] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expandedRuns, setExpandedRuns] = useState(null)
  const [runs, setRuns] = useState([])
  const [runsLoading, setRunsLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [autoRes, recRes, spaceRes] = await Promise.all([
        fetch('/api/automations').then(r => r.json()),
        fetch('/api/recurring-tasks').then(r => r.json()),
        fetch('/api/tasks/spaces').then(r => r.json()),
      ])
      setAutomations((autoRes.automations || []).map(a => ({
        ...a,
        triggers: a.automation_triggers || [],
        conditions: a.automation_conditions || [],
        actions: a.automation_actions || [],
      })))
      setRecurringTasks(recRes.tasks || [])
      setSpaces(spaceRes.spaces || [])
      // collect statuses from spaces
      const allStatuses = (spaceRes.spaces || []).flatMap(s => s.statuses || [])
      const unique = [...new Map(allStatuses.map(s => [s.id, s])).values()]
      setStatuses(unique)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function saveAutomation(data) {
    if (editing?.id) {
      await fetch('/api/automations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...data }) })
    } else {
      await fetch('/api/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setShowBuilder(false)
    setEditing(null)
    loadData()
  }

  async function toggleActive(auto) {
    await fetch('/api/automations', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: auto.id, is_active: !auto.is_active }) })
    setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, is_active: !a.is_active } : a))
  }

  async function deleteAutomation(id) {
    if (!confirm('Remover automação?')) return
    await fetch(`/api/automations?id=${id}`, { method: 'DELETE' })
    setAutomations(prev => prev.filter(a => a.id !== id))
  }

  async function viewRuns(auto) {
    setExpandedRuns(auto.id === expandedRuns ? null : auto.id)
    if (auto.id === expandedRuns) return
    setRunsLoading(true)
    const res = await fetch(`/api/automations/runs?automation_id=${auto.id}`).then(r => r.json())
    setRuns(res.runs || [])
    setRunsLoading(false)
  }

  async function saveRecurring(data) {
    if (editing?.id) {
      await fetch('/api/recurring-tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...data }) })
    } else {
      await fetch('/api/recurring-tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    }
    setShowBuilder(false)
    setEditing(null)
    loadData()
  }

  async function toggleRecurring(task) {
    await fetch('/api/recurring-tasks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, is_active: !task.is_active }) })
    setRecurringTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_active: !t.is_active } : t))
  }

  async function deleteRecurring(id) {
    if (!confirm('Remover tarefa recorrente?')) return
    await fetch(`/api/recurring-tasks?id=${id}`, { method: 'DELETE' })
    setRecurringTasks(prev => prev.filter(t => t.id !== id))
  }

  const triggerLabel = type => TRIGGER_TYPES.find(t => t.value === type)?.label || type

  if (showBuilder) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => { setShowBuilder(false); setEditing(null) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <i className="bx bx-arrow-back" /> Voltar
        </button>
        <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, color: '#e2e8f0' }}>
          {tab === 'automations'
            ? (editing ? 'Editar automação' : 'Nova automação')
            : (editing ? 'Editar tarefa recorrente' : 'Nova tarefa recorrente')}
        </h2>
        {tab === 'automations'
          ? <AutomationBuilder automation={editing} onSave={saveAutomation} onCancel={() => { setShowBuilder(false); setEditing(null) }} spaces={spaces} statuses={statuses} users={workspaceUsers} defaultSpaceId={defaultSpaceId} />
          : <RecurringTaskBuilder task={editing} onSave={saveRecurring} onCancel={() => { setShowBuilder(false); setEditing(null) }} spaces={spaces} statuses={statuses} users={workspaceUsers} />
        }
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="bx bx-zap" style={{ color: GREEN }} /> Automações
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Automatize tarefas repetitivas com gatilhos, condições e ações.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowBuilder(true) }}
          style={{ background: GREEN, border: 'none', borderRadius: 9, color: '#fff', padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="bx bx-plus" /> {tab === 'automations' ? 'Nova automação' : 'Nova tarefa recorrente'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[{ v: 'automations', l: 'Automações', icon: 'bx-zap' }, { v: 'recurring', l: 'Recorrentes', icon: 'bx-refresh' }].map(({ v, l, icon }) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: tab === v ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === v ? '#e2e8f0' : '#64748b', transition: 'all 0.15s' }}>
            <i className={`bx ${icon}`} /> {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Carregando...</div>
      ) : tab === 'automations' ? (
        automations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <i className="bx bx-zap" style={{ fontSize: 48, color: '#334155', display: 'block', marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Nenhuma automação criada ainda.</div>
            <button onClick={() => setShowBuilder(true)}
              style={{ background: GREEN, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Criar primeira automação
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {automations.map(auto => (
              <div key={auto.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${auto.is_active ? 'rgba(38,194,129,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <i className="bx bx-zap" style={{ color: auto.is_active ? GREEN : '#475569', fontSize: 18, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auto.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Pill label={triggerLabel(auto.triggers?.[0]?.trigger_type)} color="#f59e0b" />
                      {auto.conditions?.length > 0 && <Pill label={`${auto.conditions.length} condição(ões)`} color={ACCENT} />}
                      <Pill label={`${auto.actions?.length || 0} ação(ões)`} color={GREEN} />
                      {auto.run_count > 0 && <span style={{ color: '#475569' }}>{auto.run_count} execuções</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => viewRuns(auto)} title="Ver execuções"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6, borderRadius: 6 }}>
                      <i className="bx bx-history" style={{ fontSize: 16 }} />
                    </button>
                    <button onClick={() => { setEditing(auto); setShowBuilder(true) }} title="Editar"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6, borderRadius: 6 }}>
                      <i className="bx bx-edit" style={{ fontSize: 16 }} />
                    </button>
                    <label style={{ display: 'flex', cursor: 'pointer', padding: 6 }}>
                      <input type="checkbox" checked={auto.is_active} onChange={() => toggleActive(auto)} style={{ accentColor: GREEN, width: 16, height: 16 }} />
                    </label>
                    <button onClick={() => deleteAutomation(auto.id)} title="Excluir"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 6, borderRadius: 6 }}>
                      <i className="bx bx-trash" style={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
                {expandedRuns === auto.id && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>Histórico de execuções</div>
                    {runsLoading ? (
                      <div style={{ color: '#64748b', fontSize: 12 }}>Carregando...</div>
                    ) : runs.length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: 12 }}>Nenhuma execução registrada.</div>
                    ) : (
                      runs.map(run => (
                        <div key={run.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                          <i className={`bx ${run.status === 'success' ? 'bx-check-circle' : run.status === 'error' ? 'bx-error-circle' : 'bx-time'}`}
                            style={{ color: run.status === 'success' ? GREEN : run.status === 'error' ? '#ef4444' : '#f59e0b', flexShrink: 0 }} />
                          <span style={{ color: '#94a3b8', flex: 1 }}>{new Date(run.created_at).toLocaleString('pt-BR')}</span>
                          {run.error_message && <span style={{ color: '#ef4444', fontSize: 11, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{run.error_message}</span>}
                          {Array.isArray(run.actions_log) && <span style={{ color: '#475569', fontSize: 11 }}>{run.actions_log.length} ação(ões)</span>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        // Recurring tasks tab
        recurringTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <i className="bx bx-refresh" style={{ fontSize: 48, color: '#334155', display: 'block', marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Nenhuma tarefa recorrente criada ainda.</div>
            <button onClick={() => setShowBuilder(true)}
              style={{ background: ACCENT, border: 'none', borderRadius: 8, color: '#fff', padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Criar primeira tarefa recorrente
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recurringTasks.map(task => (
              <div key={task.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${task.is_active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="bx bx-refresh" style={{ color: task.is_active ? ACCENT : '#475569', fontSize: 18, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Pill label={{ daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual', custom: 'Personalizado' }[task.recurrence_type] || task.recurrence_type} color={ACCENT} />
                    {task.next_run_at && <span>Próxima: {new Date(task.next_run_at).toLocaleDateString('pt-BR')}</span>}
                    {task.occurrence_count > 0 && <span>{task.occurrence_count} ocorrências</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => { setEditing(task); setShowBuilder(true) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6 }}>
                    <i className="bx bx-edit" style={{ fontSize: 16 }} />
                  </button>
                  <label style={{ display: 'flex', cursor: 'pointer', padding: 6 }}>
                    <input type="checkbox" checked={task.is_active} onChange={() => toggleRecurring(task)} style={{ accentColor: ACCENT, width: 16, height: 16 }} />
                  </label>
                  <button onClick={() => deleteRecurring(task.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 6 }}>
                    <i className="bx bx-trash" style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
