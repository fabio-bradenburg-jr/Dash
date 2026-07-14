'use client'

import { useState, useEffect, useCallback } from 'react'

// Central de Modelos de tarefas: containers com tarefa principal + subtarefas.
// Aplicar = escolher dia da semana, cliente e responsável → gera as tarefas no board.

const WEEK_DAYS = [
  { key: 1, label: 'Segunda' }, { key: 2, label: 'Terça' }, { key: 3, label: 'Quarta' },
  { key: 4, label: 'Quinta' }, { key: 5, label: 'Sexta' },
]
const MODEL_COLORS = ['#26c281', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function dateOfWeekday(diaKey) {
  const now = new Date()
  const monday = new Date(now)
  const dow = (now.getDay() + 6) % 7 // 0 = segunda
  monday.setDate(now.getDate() - dow)
  const d = new Date(monday)
  d.setDate(monday.getDate() + (diaKey - 1))
  return d.toISOString().slice(0, 10)
}

const inp = { background: 'var(--bg-panel,#111113)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 7, padding: '7px 10px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block' }

export default function TaskModelsModal({ spaceId, clients, workspaceUsers, statuses, onClose, onApplied }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | edit | apply
  const [editing, setEditing] = useState(null) // model being edited (null = novo)
  const [applying, setApplying] = useState(null) // model being applied
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // editor state
  const [name, setName] = useState('')
  const [color, setColor] = useState('#26c281')
  const [items, setItems] = useState([])

  // apply state
  const [applyDia, setApplyDia] = useState(1)
  const [applyClient, setApplyClient] = useState('')
  const [applyAssignee, setApplyAssignee] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/task-models')
      const json = await res.json()
      setModels(json.models || [])
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  function startCreate() {
    setEditing(null); setName(''); setColor('#26c281')
    setItems([{ title: '', subtasks: [] }])
    setError(''); setView('edit')
  }
  function startEdit(model) {
    setEditing(model); setName(model.name); setColor(model.color || '#26c281')
    setItems((model.items || []).map(it => ({ title: it.title, subtasks: [...(it.subtasks || [])] })))
    setError(''); setView('edit')
  }
  function startApply(model) {
    setApplying(model); setApplyDia(1); setApplyClient(''); setApplyAssignee('')
    setError(''); setView('apply')
  }

  async function saveModel() {
    const cleanItems = items.map(it => ({ title: it.title.trim(), subtasks: it.subtasks.map(s => s.trim()).filter(Boolean) })).filter(it => it.title)
    if (!name.trim()) { setError('Informe o nome do modelo.'); return }
    if (!cleanItems.length) { setError('Adicione pelo menos uma tarefa.'); return }
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/task-models', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(editing ? { id: editing.id } : {}), name: name.trim(), color, items: cleanItems }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Falha ao salvar o modelo.')
      await load(); setView('list')
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  async function removeModel(model) {
    if (!confirm(`Remover o modelo "${model.name}"?`)) return
    await fetch(`/api/task-models?id=${model.id}`, { method: 'DELETE' })
    await load()
  }

  async function applyModel() {
    if (!applying) return
    setBusy(true); setError('')
    try {
      const initialStatus = statuses.find(s => s.is_initial) || statuses[0]
      const created = []
      for (const item of (applying.items || [])) {
        const res = await fetch('/api/tasks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            space_id: spaceId,
            dia_semana: Number(applyDia),
            recorrente: 'once',
            client_id: applyClient || null,
            assignee_id: applyAssignee || null,
            due_date: dateOfWeekday(Number(applyDia)),
            status_id: initialStatus?.id || null,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.task) throw new Error(json.error || 'Falha ao criar tarefa do modelo.')
        created.push(json.task)
        for (const sub of (item.subtasks || [])) {
          await fetch('/api/tasks', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: sub,
              parent_task_id: json.task.id,
              client_id: applyClient || null,
              assignee_id: applyAssignee || null,
              status_id: initialStatus?.id || null,
            }),
          })
        }
      }
      onApplied?.(created)
      onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const totalTasksOf = (m) => (m.items || []).length
  const totalSubsOf = (m) => (m.items || []).reduce((s, it) => s + (it.subtasks?.length || 0), 0)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg-dark,#050506)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 640, maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          {view !== 'list' && (
            <button type="button" onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 18, padding: 0 }}>
              <i className="bx bx-chevron-left" />
            </button>
          )}
          <i className="bx bx-package" style={{ color: '#26c281', fontSize: 18 }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>
            {view === 'list' ? 'Modelos de tarefas' : view === 'edit' ? (editing ? 'Editar modelo' : 'Novo modelo') : `Aplicar "${applying?.name}"`}
          </h3>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>
            <i className="bx bx-x" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', minHeight: 0 }}>
          {error && <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.8rem' }}>{error}</div>}

          {/* LISTA */}
          {view === 'list' && (
            loading ? (
              <div style={{ textAlign: 'center', color: '#475569', padding: 24 }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: 20 }} /></div>
            ) : models.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '28px 12px' }}>
                <i className="bx bx-package" style={{ fontSize: 30, display: 'block', marginBottom: 10, opacity: 0.5 }} />
                <div style={{ fontSize: '0.88rem', marginBottom: 4, color: '#94a3b8', fontWeight: 600 }}>Nenhum modelo ainda</div>
                <div style={{ fontSize: '0.8rem', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>Crie um container de tarefas (ex.: "Cliente novo") com a tarefa principal e as subtarefas do dia. Depois é só aplicar no dia que quiser, vinculado ao cliente.</div>
              </div>
            ) : models.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, background: 'rgba(255,255,255,0.025)', marginBottom: 9 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: `${m.color || '#26c281'}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bx bx-package" style={{ color: m.color || '#26c281', fontSize: 17 }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>{m.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>{totalTasksOf(m)} tarefa(s) · {totalSubsOf(m)} subtarefa(s)</div>
                </div>
                <button type="button" onClick={() => startApply(m)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#26c281', border: 'none', color: '#04150d', padding: '6px 13px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                  <i className="bx bx-play" /> Aplicar
                </button>
                <button type="button" onClick={() => startEdit(m)} title="Editar" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                  <i className="bx bx-edit" style={{ fontSize: 14 }} />
                </button>
                <button type="button" onClick={() => removeModel(m)} title="Remover" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                  <i className="bx bx-trash" style={{ fontSize: 14 }} />
                </button>
              </div>
            ))
          )}

          {/* EDITOR */}
          {view === 'edit' && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Nome do modelo</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder='Ex.: "Cliente novo"' style={inp} autoFocus />
                </div>
                <div>
                  <label style={lbl}>Cor</label>
                  <div style={{ display: 'flex', gap: 6, paddingTop: 3 }}>
                    {MODEL_COLORS.map(c => (
                      <div key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid #fff' : '3px solid transparent', boxSizing: 'border-box' }} />
                    ))}
                  </div>
                </div>
              </div>

              <label style={lbl}>Tarefas do modelo</label>
              {items.map((item, idx) => (
                <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '11px 13px', marginBottom: 10, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <i className="bx bx-task" style={{ color: '#26c281', fontSize: 15, flexShrink: 0 }} />
                    <input
                      value={item.title}
                      onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))}
                      placeholder="Tarefa principal…"
                      style={{ ...inp, fontWeight: 600 }}
                    />
                    <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} title="Remover tarefa" style={{ background: 'none', border: 'none', color: '#7f1d1d', cursor: 'pointer', flexShrink: 0 }}>
                      <i className="bx bx-trash" style={{ fontSize: 15 }} />
                    </button>
                  </div>
                  <div style={{ marginLeft: 23, marginTop: 8 }}>
                    {item.subtasks.map((sub, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6 }}>
                        <i className="bx bx-subdirectory-right" style={{ color: '#475569', fontSize: 14, flexShrink: 0 }} />
                        <input
                          value={sub}
                          onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, subtasks: it.subtasks.map((s, j) => j === sIdx ? e.target.value : s) } : it))}
                          placeholder="Subtarefa…"
                          style={{ ...inp, fontSize: '0.8rem', padding: '5px 9px' }}
                        />
                        <button type="button" onClick={() => setItems(prev => prev.map((it, i) => i === idx ? { ...it, subtasks: it.subtasks.filter((_, j) => j !== sIdx) } : it))} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', flexShrink: 0 }}>
                          <i className="bx bx-x" style={{ fontSize: 14 }} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setItems(prev => prev.map((it, i) => i === idx ? { ...it, subtasks: [...it.subtasks, ''] } : it))}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#26c281', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 600, padding: 0 }}>
                      <i className="bx bx-plus" /> Subtarefa
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setItems(prev => [...prev, { title: '', subtasks: [] }])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', padding: '9px', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                <i className="bx bx-plus" /> Adicionar tarefa
              </button>
            </>
          )}

          {/* APLICAR */}
          {view === 'apply' && applying && (
            <>
              <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: `${applying.color || '#26c281'}12`, border: `1px solid ${applying.color || '#26c281'}33` }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0', marginBottom: 6 }}>{applying.name}</div>
                {(applying.items || []).map((it, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 3 }}>
                    <i className="bx bx-task" style={{ marginRight: 5, color: applying.color || '#26c281' }} />{it.title}
                    {it.subtasks?.length > 0 && <span style={{ color: '#475569' }}> · {it.subtasks.length} subtarefa(s)</span>}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Dia da semana</label>
                <div style={{ display: 'flex', gap: 7 }}>
                  {WEEK_DAYS.map(d => (
                    <button key={d.key} type="button" onClick={() => setApplyDia(d.key)}
                      style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `1px solid ${applyDia === d.key ? '#26c281' : 'rgba(255,255,255,0.1)'}`, background: applyDia === d.key ? 'rgba(38,194,129,0.13)' : 'rgba(255,255,255,0.03)', color: applyDia === d.key ? '#26c281' : '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                      {d.label.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                <div>
                  <label style={lbl}>Cliente</label>
                  <select value={applyClient} onChange={e => setApplyClient(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Sem cliente</option>
                    {(clients || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Responsável</label>
                  <select value={applyAssignee} onChange={e => setApplyAssignee(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Sem responsável</option>
                    {(workspaceUsers || []).map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                  </select>
                </div>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#475569', margin: '4px 0 0' }}>As tarefas entram no dia escolhido desta semana, já vinculadas ao cliente, com as subtarefas dentro.</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          {view === 'list' && (
            <button type="button" onClick={startCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#04150d', padding: '8px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
              <i className="bx bx-plus" /> Novo modelo
            </button>
          )}
          {view === 'edit' && (
            <button type="button" onClick={saveModel} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#04150d', padding: '8px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Salvando…' : (editing ? 'Salvar modelo' : 'Criar modelo')}
            </button>
          )}
          {view === 'apply' && (
            <button type="button" onClick={applyModel} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#04150d', padding: '8px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Aplicando…' : 'Aplicar modelo'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '8px 16px', borderRadius: 9, fontSize: '0.85rem', cursor: 'pointer' }}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
