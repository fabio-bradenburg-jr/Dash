'use client'

import { useState, useEffect, useCallback } from 'react'

// Central de Modelos de tarefas: containers com tarefa principal (+ descrição) e subtarefas.
// Aplicar = escolher dia da semana, cliente e responsável → gera as tarefas no board.
// Layout no mesmo estilo do modal de checklist do Onboarding (hero emerald + cards de fase).

const WEEK_DAYS = [
  { key: 1, label: 'Segunda' }, { key: 2, label: 'Terça' }, { key: 3, label: 'Quarta' },
  { key: 4, label: 'Quinta' }, { key: 5, label: 'Sexta' },
]
const MODEL_COLORS = ['#26c281', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const ITEM_COLORS = ['#26c281', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16']

function dateOfWeekday(diaKey) {
  const now = new Date()
  const monday = new Date(now)
  const dow = (now.getDay() + 6) % 7 // 0 = segunda
  monday.setDate(now.getDate() - dow)
  const d = new Date(monday)
  d.setDate(monday.getDate() + (diaKey - 1))
  return d.toISOString().slice(0, 10)
}

const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 9, padding: '8px 11px', fontSize: '0.85rem', width: '100%', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: '0.68rem', color: '#26c281', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block', opacity: 0.85 }

export default function TaskModelsModal({ spaceId, clients, workspaceUsers, statuses, onClose, onApplied }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | edit | apply
  const [editing, setEditing] = useState(null)
  const [applying, setApplying] = useState(null)
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
    setItems([{ title: '', description: '', subtasks: [] }])
    setError(''); setView('edit')
  }
  function startEdit(model) {
    setEditing(model); setName(model.name); setColor(model.color || '#26c281')
    setItems((model.items || []).map(it => ({ title: it.title, description: it.description || '', subtasks: [...(it.subtasks || [])] })))
    setError(''); setView('edit')
  }
  function startApply(model) {
    setApplying(model); setApplyDia(1); setApplyClient(''); setApplyAssignee('')
    setError(''); setView('apply')
  }

  async function saveModel() {
    const cleanItems = items
      .map(it => ({ title: it.title.trim(), description: (it.description || '').trim(), subtasks: it.subtasks.map(s => s.trim()).filter(Boolean) }))
      .filter(it => it.title)
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
            description: item.description || null,
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

  const heroSubtitle = view === 'list'
    ? `${models.length} modelo(s) disponível(is)`
    : view === 'edit'
      ? (editing ? 'Editando modelo existente' : 'Novo container de tarefas')
      : 'Escolha dia, cliente e responsável'

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 720, borderRadius: 24, background: 'linear-gradient(160deg,#0f172a 0%,#0d1f17 100%)', border: '1px solid rgba(38,194,129,0.2)', boxShadow: '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(38,194,129,0.06)', overflow: 'hidden', marginBottom: 24 }}
      >
        {/* ── Hero header (estilo Onboarding) ── */}
        <div style={{ position: 'relative', padding: '28px 28px 22px', background: 'linear-gradient(135deg,rgba(38,194,129,0.1) 0%,rgba(34,197,94,0.04) 100%)', borderBottom: '1px solid rgba(38,194,129,0.12)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(38,194,129,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {view !== 'list' && (
              <button type="button" onClick={() => setView('list')} title="Voltar"
                style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 10 }}>
                <i className="bx bx-chevron-left" style={{ fontSize: 20 }}></i>
              </button>
            )}
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(38,194,129,0.16)', border: '1px solid rgba(38,194,129,0.4)', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 0 26px rgba(38,194,129,0.3)' }}>
              <i className="bx bx-package" style={{ fontSize: 26, color: '#26c281' }}></i>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#26c281', marginBottom: 4, opacity: 0.8 }}>Central de Modelos</div>
              <div style={{ fontWeight: 900, fontSize: '1.35rem', marginBottom: 4, lineHeight: 1.2, color: '#f1f5f9' }}>
                {view === 'list' ? 'Modelos de tarefas' : view === 'edit' ? (editing ? `Editar "${editing.name}"` : 'Novo modelo') : `Aplicar "${applying?.name}"`}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{heroSubtitle}</div>
            </div>
            <button type="button" onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <i className="bx bx-x" style={{ fontSize: 20 }}></i>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 28px 24px', maxHeight: '58vh', overflowY: 'auto' }}>
          {error && <div style={{ marginBottom: 14, padding: '9px 13px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.8rem' }}>{error}</div>}

          {/* LISTA */}
          {view === 'list' && (
            loading ? (
              <div style={{ textAlign: 'center', color: '#475569', padding: 28 }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: 22 }} /></div>
            ) : models.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '30px 12px' }}>
                <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(38,194,129,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <i className="bx bx-package" style={{ fontSize: 28, color: '#26c281', opacity: 0.7 }} />
                </span>
                <div style={{ fontSize: '0.92rem', marginBottom: 5, color: '#cbd5e1', fontWeight: 700 }}>Nenhum modelo ainda</div>
                <div style={{ fontSize: '0.8rem', maxWidth: 400, margin: '0 auto', lineHeight: 1.55 }}>Crie um container de tarefas (ex.: "Cliente novo") com a tarefa principal, descrição e as subtarefas do dia. Depois é só aplicar no dia que quiser, vinculado ao cliente.</div>
              </div>
            ) : models.map((m, mi) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, background: 'rgba(255,255,255,0.03)', marginBottom: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: `${m.color || '#26c281'}1f`, border: `1px solid ${m.color || '#26c281'}55`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <i className="bx bx-package" style={{ color: m.color || '#26c281', fontSize: 18 }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f1f5f9' }}>{m.name}</div>
                  <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{totalTasksOf(m)} tarefa(s) · {totalSubsOf(m)} subtarefa(s)</div>
                </div>
                <button type="button" onClick={() => startApply(m)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#26c281', border: 'none', color: '#04150d', padding: '7px 15px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 18px rgba(38,194,129,0.25)' }}>
                  <i className="bx bx-play" /> Aplicar
                </button>
                <button type="button" onClick={() => startEdit(m)} title="Editar" style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                  <i className="bx bx-edit" style={{ fontSize: 14 }} />
                </button>
                <button type="button" onClick={() => removeModel(m)} title="Remover" style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                  <i className="bx bx-trash" style={{ fontSize: 14 }} />
                </button>
              </div>
            ))
          )}

          {/* EDITOR */}
          {view === 'edit' && (
            <>
              <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Nome do modelo</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder='Ex.: "Cliente novo"' style={inp} autoFocus />
                </div>
                <div>
                  <label style={lbl}>Cor</label>
                  <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                    {MODEL_COLORS.map(c => (
                      <div key={c} onClick={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: color === c ? '3px solid #fff' : '3px solid transparent', boxSizing: 'border-box' }} />
                    ))}
                  </div>
                </div>
              </div>

              <label style={lbl}>Tarefas do modelo</label>
              {items.map((item, idx) => {
                const itemColor = ITEM_COLORS[idx % ITEM_COLORS.length]
                return (
                  <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', marginBottom: 11, background: 'rgba(255,255,255,0.025)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', background: `${itemColor}1f`, border: `1px solid ${itemColor}55`, display: 'grid', placeItems: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.72rem', color: itemColor }}>{idx + 1}</span>
                      <input
                        value={item.title}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, title: e.target.value } : it))}
                        placeholder="Tarefa principal…"
                        style={{ ...inp, fontWeight: 700 }}
                      />
                      <button type="button" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} title="Remover tarefa" style={{ background: 'none', border: 'none', color: '#7f1d1d', cursor: 'pointer', flexShrink: 0 }}>
                        <i className="bx bx-trash" style={{ fontSize: 16 }} />
                      </button>
                    </div>
                    <div style={{ marginLeft: 40, marginTop: 9 }}>
                      <textarea
                        value={item.description}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))}
                        placeholder="Descrição da tarefa (opcional)…"
                        rows={2}
                        style={{ ...inp, fontSize: '0.8rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, marginBottom: 8 }}
                      />
                      {item.subtasks.map((sub, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6 }}>
                          <i className="bx bx-subdirectory-right" style={{ color: itemColor, fontSize: 15, flexShrink: 0, opacity: 0.7 }} />
                          <input
                            value={sub}
                            onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, subtasks: it.subtasks.map((s, j) => j === sIdx ? e.target.value : s) } : it))}
                            placeholder="Subtarefa…"
                            style={{ ...inp, fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                          <button type="button" onClick={() => setItems(prev => prev.map((it, i) => i === idx ? { ...it, subtasks: it.subtasks.filter((_, j) => j !== sIdx) } : it))} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', flexShrink: 0 }}>
                            <i className="bx bx-x" style={{ fontSize: 14 }} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setItems(prev => prev.map((it, i) => i === idx ? { ...it, subtasks: [...it.subtasks, ''] } : it))}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: itemColor, cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, padding: 0 }}>
                        <i className="bx bx-plus" /> Subtarefa
                      </button>
                    </div>
                  </div>
                )
              })}
              <button type="button" onClick={() => setItems(prev => [...prev, { title: '', description: '', subtasks: [] }])}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', padding: '11px', borderRadius: 14, border: '1px dashed rgba(38,194,129,0.35)', background: 'rgba(38,194,129,0.04)', color: '#26c281', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700 }}>
                <i className="bx bx-plus" /> Adicionar tarefa
              </button>
            </>
          )}

          {/* APLICAR */}
          {view === 'apply' && applying && (
            <>
              <div style={{ marginBottom: 18, padding: '14px 16px', borderRadius: 14, background: `${applying.color || '#26c281'}10`, border: `1px solid ${applying.color || '#26c281'}30` }}>
                {(applying.items || []).map((it, i) => {
                  const itemColor = ITEM_COLORS[i % ITEM_COLORS.length]
                  return (
                    <div key={i} style={{ marginBottom: i < applying.items.length - 1 ? 10 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: `${itemColor}1f`, border: `1px solid ${itemColor}55`, display: 'grid', placeItems: 'center', flexShrink: 0, fontWeight: 800, fontSize: '0.64rem', color: itemColor }}>{i + 1}</span>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#e2e8f0' }}>{it.title}</span>
                        {it.subtasks?.length > 0 && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>· {it.subtasks.length} subtarefa(s)</span>}
                      </div>
                      {it.description && <div style={{ marginLeft: 33, fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.45 }}>{it.description}</div>}
                    </div>
                  )
                })}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Dia da semana</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {WEEK_DAYS.map(d => (
                    <button key={d.key} type="button" onClick={() => setApplyDia(d.key)}
                      style={{ flex: 1, padding: '9px 4px', borderRadius: 10, border: `1px solid ${applyDia === d.key ? '#26c281' : 'rgba(255,255,255,0.1)'}`, background: applyDia === d.key ? 'rgba(38,194,129,0.14)' : 'rgba(255,255,255,0.03)', color: applyDia === d.key ? '#26c281' : '#94a3b8', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                      {d.label.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 8 }}>
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
              <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0' }}>As tarefas entram no dia escolhido desta semana, já vinculadas ao cliente, com descrição e subtarefas dentro.</p>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', gap: 10, padding: '16px 28px 22px', borderTop: '1px solid rgba(38,194,129,0.1)', background: 'rgba(38,194,129,0.02)' }}>
          {view === 'list' && (
            <button type="button" onClick={startCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#04150d', padding: '9px 18px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 18px rgba(38,194,129,0.25)' }}>
              <i className="bx bx-plus" /> Novo modelo
            </button>
          )}
          {view === 'edit' && (
            <button type="button" onClick={saveModel} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#04150d', padding: '9px 18px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1, boxShadow: '0 6px 18px rgba(38,194,129,0.25)' }}>
              {busy ? 'Salvando…' : (editing ? 'Salvar modelo' : 'Criar modelo')}
            </button>
          )}
          {view === 'apply' && (
            <button type="button" onClick={applyModel} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#26c281', border: 'none', color: '#04150d', padding: '9px 18px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', opacity: busy ? 0.6 : 1, boxShadow: '0 6px 18px rgba(38,194,129,0.25)' }}>
              {busy ? 'Aplicando…' : 'Aplicar modelo'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '9px 18px', borderRadius: 99, fontSize: '0.85rem', cursor: 'pointer' }}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
