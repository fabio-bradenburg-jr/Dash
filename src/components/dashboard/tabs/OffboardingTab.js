'use client'

import { useState } from 'react'
import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function OffboardingTab() {
  const [pendingSummaryOpen, setPendingSummaryOpen] = useState(false)
  const {
    clients,
    isMaster,
    handleToggleOffboardingTask,
    persistReorder,
    offbDragRef,
    offbEditingItem,
    setOffbEditingItem,
    offbEditingPhase,
    setOffbEditingPhase,
    offbNewItem,
    setOffbNewItem,
    offbNewPhase,
    setOffbNewPhase,
    offboardingExpandedClient,
    setOffboardingExpandedClient,
    offboardingExpandedPhases,
    setOffboardingExpandedPhases,
    offboardingManageMode,
    setOffboardingManageMode,
    offboardingPhaseDefs,
    setOffboardingPhaseDefs,
    offboardingPhaseDefsLoaded,
    setOffboardingPhaseDefsLoaded,
    offboardingRecords,
    offboardingSearch,
    setOffboardingSearch,
    offboardingStatusFilter,
    setOffboardingStatusFilter,
  } = useDashboard()

  return (
    <>
        {(() => {
          const OFFBOARDING_PHASES_FALLBACK = [
            {
              id: 'off1', label: 'Etapa 1 — Comunicação Inicial', icon: 'bx-message-dots',
              tasks: [
                { id: 'off1_msg_inicial', label: 'Enviar mensagem inicial de offboarding (WhatsApp)' },
                { id: 'off1_data_final', label: 'Alinhar data final da operação' },
              ],
            },
            {
              id: 'off2', label: 'Etapa 2 — Transição de Acessos', icon: 'bx-transfer',
              tasks: [
                { id: 'off2_acesso_admin', label: 'Verificar se o cliente possui acesso administrador (BM, página, etc.)' },
                { id: 'off2_pausar_manter', label: 'Alinhar com cliente: pausar ou manter rodando' },
                { id: 'off2_pausar_camp', label: 'Pausar Campanhas (se aplicável)' },
                { id: 'off2_remover_equipe', label: 'Remover equipe LP do Gerenciador de Negócios' },
                { id: 'off2_remover_crm', label: 'Remover acessos de CRM / planilhas' },
                { id: 'off2_confirmar_controle', label: 'Confirmar que cliente mantém controle total' },
              ],
            },
            {
              id: 'off3', label: 'Etapa 3 — Encerramento Relacional', icon: 'bx-heart',
              tasks: [
                { id: 'off3_msg_agradecimento', label: 'Enviar mensagem final de agradecimento' },
                { id: 'off3_disponibilidade', label: 'Reforçar disponibilidade futura' },
                { id: 'off3_encerrar_wpp', label: 'Encerrar grupo do WhatsApp' },
              ],
            },
            {
              id: 'off4', label: 'Etapa 4 — Arquivamento Interno', icon: 'bx-archive',
              tasks: [
                { id: 'off4_remover_db', label: 'Remover cliente da Data Base' },
                { id: 'off4_remover_reportei', label: 'Remover cliente do Reportei' },
                { id: 'off4_arquivar_materiais', label: 'Arquivar materiais de criação' },
                { id: 'off4_remover_tarefas', label: 'Remover tarefas recorrentes do ClickUp' },
                { id: 'off4_doc_churn', label: 'Documentar motivo do churn' },
                { id: 'off4_doc_aprendizado', label: 'Documentar aprendizado envolvido com o cliente' },
              ],
            },
          ]
          const OFFBOARDING_PHASES = offboardingPhaseDefsLoaded ? offboardingPhaseDefs : OFFBOARDING_PHASES_FALLBACK
          const totalTasks = OFFBOARDING_PHASES.reduce((s, p) => s + p.tasks.length, 0)
          const allValidIds = new Set(OFFBOARDING_PHASES.flatMap((p) => p.tasks.map((t) => t.id)))
          const doneCount = (rec) => (Array.isArray(rec?.completed_tasks) ? rec.completed_tasks : []).filter((id) => allValidIds.has(id)).length
          const PHASE_COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#64748b']
          const churnClients = (clients || []).filter((c) => {
            const status = String(c?.status || '').trim().toLowerCase()
            return status === 'churn'
          }).sort((a, b) => {
            // Ordena pela Data de Entrada (mais recente primeiro); sem data vai para o fim.
            const da = String(a.startDate || '')
            const db = String(b.startDate || '')
            if (da && db) return db.localeCompare(da) || String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
            if (da) return -1
            if (db) return 1
            return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')
          })

          const filteredChurnClients = churnClients.filter((c) => {
            if (offboardingSearch && !String(c.name || '').toLowerCase().includes(offboardingSearch.toLowerCase())) return false
            if (offboardingStatusFilter !== 'all') {
              const rec = offboardingRecords.find((r) => r.client_id === c.id)
              const done = doneCount(rec)
              if (offboardingStatusFilter === 'complete' && done < totalTasks) return false
              if (offboardingStatusFilter === 'in_progress' && (done === 0 || done >= totalTasks)) return false
              if (offboardingStatusFilter === 'not_started' && done > 0) return false
            }
            return true
          })

          const totalDone = churnClients.reduce((s, c) => {
            const rec = offboardingRecords.find((r) => r.client_id === c.id)
            return s + doneCount(rec)
          }, 0)
          const completeCount = churnClients.filter((c) => {
            const rec = offboardingRecords.find((r) => r.client_id === c.id)
            return doneCount(rec) >= totalTasks
          }).length
          const inProgressCount = churnClients.filter((c) => {
            const rec = offboardingRecords.find((r) => r.client_id === c.id)
            const done = doneCount(rec)
            return done > 0 && done < totalTasks
          }).length
          const notStartedCount = churnClients.length - completeCount - inProgressCount
          const overallProgress = churnClients.length > 0 ? Math.min(100, Math.round((totalDone / (churnClients.length * totalTasks)) * 100)) : 0

          return (
            <section className="weekly-dashboard-panel onboarding-panel" style={{ background: 'transparent', border: 'none' }}>
              <div style={{ padding: '24px 26px 20px', border: '1px solid rgba(255,255,255,0.05)', borderBottom: '2px solid rgba(239,68,68,0.28)', borderRadius: 18, background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(239,68,68,0.01) 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -70, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.16), transparent 68%)', pointerEvents: 'none' }} />
                <span style={{ display: 'inline-block', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#ef4444', marginBottom: 6, opacity: 0.85 }}><i className="bx bx-log-out" style={{ marginRight: 5 }}></i>Offboarding</span>
                <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Offboarding de clientes</h2>
                <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Checklist de encerramento para clientes com status Churn.</p>
                {isMaster && (
                  <button type="button" className="btn btn-secondary" style={{ position: 'absolute', top: 28, right: 28, fontSize: '0.8rem', padding: '5px 12px', zIndex: 2 }} onClick={() => {
                    setOffboardingManageMode(v => !v)
                    if (!offboardingPhaseDefsLoaded) {
                      fetch('/api/onboarding-tasks/definitions?type=offboarding').then(r => r.json()).then(d => { if (d.phases) { setOffboardingPhaseDefs(d.phases); setOffboardingPhaseDefsLoaded(true) } })
                    }
                  }}>{offboardingManageMode ? 'Fechar' : 'Editar tarefas'}</button>
                )}

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 20 }}>
                  {[
                    { label: 'Clientes em Churn', value: churnClients.length, icon: 'bx-user-x', color: '#ef4444' },
                    { label: 'Concluídos', value: completeCount, icon: 'bx-check-circle', color: '#22c55e' },
                    { label: 'Em andamento', value: inProgressCount, icon: 'bx-loader-circle', color: '#f59e0b' },
                    { label: 'Não iniciados', value: notStartedCount, icon: 'bx-circle', color: '#64748b' },
                    { label: 'Tarefas concluídas', value: `${totalDone}/${churnClients.length * totalTasks}`, icon: 'bx-list-check', color: '#8b5cf6' },
                    { label: 'Progresso geral', value: `${overallProgress}%`, icon: 'bx-trending-up', color: '#06b6d4' },
                  ].map((m) => (
                    <div key={m.label} className="management-stat-card" style={{ borderColor: `${m.color}22` }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`bx ${m.icon}`} style={{ color: m.color, fontSize: 13 }}></i>
                        {m.label}
                      </span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Filter bar */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 20 }}>
                  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                    <i className="bx bx-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4, pointerEvents: 'none' }}></i>
                    <input
                      type="text"
                      value={offboardingSearch}
                      onChange={(e) => setOffboardingSearch(e.target.value)}
                      placeholder="Buscar cliente..."
                      style={{ width: '100%', padding: '8px 12px 8px 42px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'all', label: 'Todos', count: churnClients.length },
                      { id: 'complete', label: 'Concluídos', count: completeCount },
                      { id: 'in_progress', label: 'Em andamento', count: inProgressCount },
                      { id: 'not_started', label: 'Não iniciados', count: notStartedCount },
                    ].map((f) => (
                      <button key={f.id} type="button" onClick={() => setOffboardingStatusFilter(f.id)}
                        style={{ padding: '6px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: offboardingStatusFilter === f.id ? '#ef4444' : 'rgba(255,255,255,0.07)', color: offboardingStatusFilter === f.id ? '#fff' : 'inherit', whiteSpace: 'nowrap' }}>
                        {f.label} <span style={{ opacity: 0.7 }}>({f.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* OFFBOARDING MANAGE PANEL */}
              {offboardingManageMode && isMaster && (
                <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(239,68,68,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}><i className="bx bx-edit" style={{ marginRight: 8, color: '#ef4444' }}></i>Editar tarefas de offboarding</h3>
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} onClick={() => setOffbNewPhase({ label: '' })}><i className="bx bx-plus"></i> Nova fase</button>
                  </div>
                  {offbNewPhase && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="text" className="input-field" placeholder="Nome da fase" value={offbNewPhase.label} onChange={e => setOffbNewPhase(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.85rem', padding: '6px 10px' }} />
                      <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} disabled={!offbNewPhase.label.trim()} onClick={async () => {
                        const res = await fetch('/api/onboarding-tasks/definitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'phase', type: 'offboarding', label: offbNewPhase.label.trim(), icon: 'bx-check' }) })
                        const d = await res.json()
                        if (d.phase) { setOffboardingPhaseDefs(prev => [...prev, d.phase]); setOffbNewPhase(null) }
                      }}>Salvar</button>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => setOffbNewPhase(null)}>Cancelar</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {offboardingPhaseDefs.map((phase, phaseIdx) => (
                      <div key={phase.id}
                        draggable
                        onDragStart={() => { offbDragRef.current.phaseIdx = phaseIdx }}
                        onDragOver={e => { e.preventDefault(); offbDragRef.current.phaseOverIdx = phaseIdx }}
                        onDrop={() => {
                          const from = offbDragRef.current.phaseIdx; const to = offbDragRef.current.phaseOverIdx
                          if (from === to || from == null || to == null) return
                          setOffboardingPhaseDefs(prev => {
                            const arr = [...prev]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved)
                            persistReorder('phase', arr)
                            return arr
                          })
                          offbDragRef.current = {}
                        }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', cursor: 'grab' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                          <i className="bx bx-dots-vertical-rounded" style={{ fontSize: 18, opacity: 0.3, cursor: 'grab', flexShrink: 0 }}></i>
                          {offbEditingPhase?.id === phase.id ? (
                            <>
                              <input type="text" className="input-field" value={offbEditingPhase.label} onChange={e => setOffbEditingPhase(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px' }} />
                              <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={async () => {
                                const res = await fetch('/api/onboarding-tasks/definitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'phase', id: offbEditingPhase.id, label: offbEditingPhase.label }) })
                                const d = await res.json()
                                if (d.phase) { setOffboardingPhaseDefs(prev => prev.map(p => p.id === d.phase.id ? { ...p, label: d.phase.label } : p)); setOffbEditingPhase(null) }
                              }}>Salvar</button>
                              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setOffbEditingPhase(null)}>×</button>
                            </>
                          ) : (
                            <>
                              <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 700 }}>{phase.label}</span>
                              <button type="button" className="btn-icon" title="Editar fase" onClick={() => setOffbEditingPhase({ ...phase })} style={{ color: '#94a3b8' }}><i className="bx bx-edit"></i></button>
                              <button type="button" className="btn-icon" title="Excluir fase" onClick={async () => {
                                if (!confirm(`Excluir fase "${phase.label}" e todas as tarefas?`)) return
                                await fetch(`/api/onboarding-tasks/definitions?id=${phase.id}&entity=phase`, { method: 'DELETE' })
                                setOffboardingPhaseDefs(prev => prev.filter(p => p.id !== phase.id))
                              }} style={{ color: '#f87171' }}><i className="bx bx-trash"></i></button>
                              <button type="button" className="btn-icon" title="Nova tarefa" onClick={() => setOffbNewItem({ phaseId: phase.id, label: '' })} style={{ color: '#ef4444' }}><i className="bx bx-plus"></i></button>
                            </>
                          )}
                        </div>
                        {offbNewItem?.phaseId === phase.id && (
                          <div style={{ display: 'flex', gap: 8, padding: '8px 14px', background: 'rgba(239,68,68,0.05)', alignItems: 'center' }}>
                            <input type="text" className="input-field" placeholder="Nome da tarefa" value={offbNewItem.label} onChange={e => setOffbNewItem(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.82rem', padding: '4px 8px' }} />
                            <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} disabled={!offbNewItem.label.trim()} onClick={async () => {
                              const res = await fetch('/api/onboarding-tasks/definitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'item', phase_id: phase.id, label: offbNewItem.label.trim() }) })
                              const d = await res.json()
                              if (d.item) { setOffboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: [...(p.tasks || []), d.item] } : p)); setOffbNewItem(null) }
                            }}>Salvar</button>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setOffbNewItem(null)}>×</button>
                          </div>
                        )}
                        <div style={{ padding: '4px 0' }}>
                          {(phase.tasks || []).map((task, taskIdx) => (
                            <div key={task._id || task.id}
                              draggable
                              onDragStart={e => { e.stopPropagation(); offbDragRef.current = { taskPhaseId: phase.id, taskIdx } }}
                              onDragOver={e => { e.preventDefault(); e.stopPropagation(); offbDragRef.current.taskOverIdx = taskIdx }}
                              onDrop={e => {
                                e.stopPropagation()
                                const { taskPhaseId, taskIdx: from, taskOverIdx: to } = offbDragRef.current
                                if (taskPhaseId !== phase.id || from === to || from == null || to == null) return
                                setOffboardingPhaseDefs(prev => prev.map(p => {
                                  if (p.id !== phase.id) return p
                                  const arr = [...p.tasks]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved)
                                  persistReorder('item', arr.map(t => ({ id: t._id })))
                                  return { ...p, tasks: arr }
                                }))
                                offbDragRef.current = {}
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'grab' }}>
                              <i className="bx bx-dots-vertical-rounded" style={{ fontSize: 16, opacity: 0.25, cursor: 'grab', flexShrink: 0 }}></i>
                              {offbEditingItem?._id === task._id ? (
                                <>
                                  <input type="text" className="input-field" value={offbEditingItem.label} onChange={e => setOffbEditingItem(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.82rem', padding: '4px 8px' }} />
                                  <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={async () => {
                                    const res = await fetch('/api/onboarding-tasks/definitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'item', id: offbEditingItem._id, label: offbEditingItem.label }) })
                                    const d = await res.json()
                                    if (d.item) { setOffboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: p.tasks.map(t => t._id === d.item._id ? { ...t, label: d.item.label } : t) } : p)); setOffbEditingItem(null) }
                                  }}>Salvar</button>
                                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setOffbEditingItem(null)}>×</button>
                                </>
                              ) : (
                                <>
                                  <span style={{ flex: 1, fontSize: '0.82rem', opacity: 0.8 }}>{task.label}</span>
                                  <button type="button" className="btn-icon" onClick={() => setOffbEditingItem({ ...task })} style={{ color: '#94a3b8', fontSize: '0.9rem' }}><i className="bx bx-edit"></i></button>
                                  <button type="button" className="btn-icon" onClick={async () => {
                                    if (!confirm(`Excluir "${task.label}"?`)) return
                                    await fetch(`/api/onboarding-tasks/definitions?id=${task._id}&entity=item`, { method: 'DELETE' })
                                    setOffboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: p.tasks.filter(t => t._id !== task._id) } : p))
                                  }} style={{ color: '#f87171', fontSize: '0.9rem' }}><i className="bx bx-trash"></i></button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards */}
              <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {filteredChurnClients.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px 0', opacity: 0.5 }}>
                    {churnClients.length === 0 ? 'Nenhum cliente com status Churn encontrado.' : 'Nenhum cliente encontrado com este filtro.'}
                  </div>
                )}
                {filteredChurnClients.map((client) => {
                  const rec = offboardingRecords.find((r) => r.client_id === client.id)
                  const done = doneCount(rec)
                  const pct = totalTasks > 0 ? Math.min(100, Math.round((done / totalTasks) * 100)) : 0
                  const isComplete = done >= totalTasks
                  return (
                    <button key={client.id} type="button" onClick={() => { setOffboardingExpandedClient(client); setOffboardingExpandedPhases(new Set()) }}
                      style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: `1px solid ${isComplete ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.15)'}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', color: 'inherit', transition: 'border-color .15s,background .15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#ef4444' }}><i className="bx bx-user-x"></i></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>CHURN</div>
                        </div>
                        {isComplete && <i className="bx bx-check-circle" style={{ color: '#22c55e', fontSize: 20 }}></i>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6, opacity: 0.7 }}>
                        <span>{done}/{totalTasks} tarefas</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isComplete ? '#22c55e' : '#ef4444', borderRadius: 4, transition: 'width .3s' }}></div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Modal */}
              {offboardingExpandedClient && (() => {
                const client = offboardingExpandedClient
                const rec = offboardingRecords.find((r) => r.client_id === client.id)
                const completedSet = new Set((Array.isArray(rec?.completed_tasks) ? rec.completed_tasks : []).filter((id) => allValidIds.has(id)))
                const totalDoneClient = completedSet.size
                const pct = totalTasks > 0 ? Math.min(100, Math.round((totalDoneClient / totalTasks) * 100)) : 0
                return (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={() => setOffboardingExpandedClient(null)}>
                    <div style={{ background: 'linear-gradient(160deg,#1a0505 0%,#0f172a 100%)', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
                      onClick={(e) => e.stopPropagation()}>
                      {/* Modal header */}
                      <div style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.25) 0%,rgba(239,68,68,0.05) 100%)', padding: '24px 24px 20px', borderBottom: '1px solid rgba(239,68,68,0.15)', position: 'sticky', top: 0, backdropFilter: 'blur(12px)', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} /> : <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#ef4444' }}><i className="bx bx-user-x"></i></div>}
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, letterSpacing: 1 }}>OFFBOARDING · CHURN</div>
                              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{client.name}</div>
                            </div>
                          </div>
                          <button type="button" onClick={() => setOffboardingExpandedClient(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <i className="bx bx-x" style={{ fontSize: 20 }}></i>
                          </button>
                        </div>
                        <div style={{ marginTop: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6, opacity: 0.7 }}>
                            <span>{totalDoneClient}/{totalTasks} tarefas concluídas</span>
                            <span style={{ fontWeight: 700, color: '#ef4444' }}>{pct}%</span>
                          </div>
                          <div style={{ height: 7, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#22c55e' : 'linear-gradient(90deg,#ef4444,#f97316)', borderRadius: 6, transition: 'width .4s' }}></div>
                          </div>
                        </div>
                      </div>
                      {/* Phases */}
                      <div style={{ padding: '16px 24px 24px' }}>
                        {/* Resumo de pendências — só tarefas em aberto, por tópico */}
                        {(() => {
                          const openByPhase = OFFBOARDING_PHASES
                            .map((phase) => ({
                              phase,
                              openTasks: phase.tasks.filter((t) => !completedSet.has(t.id)),
                            }))
                            .filter((group) => group.openTasks.length > 0)
                          const totalOpen = openByPhase.reduce((sum, g) => sum + g.openTasks.length, 0)
                          return (
                            <div style={{ marginBottom: 14 }}>
                              <button
                                type="button"
                                onClick={() => setPendingSummaryOpen((v) => !v)}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: pendingSummaryOpen ? '12px 12px 0 0' : 12, background: totalOpen === 0 ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.08)', border: `1px solid ${totalOpen === 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.25)'}`, borderBottom: pendingSummaryOpen ? 'none' : undefined, cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
                              >
                                <span style={{ width: 30, height: 30, borderRadius: 9, background: totalOpen === 0 ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)', border: `1.5px solid ${totalOpen === 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                  <i className={`bx ${totalOpen === 0 ? 'bx-check-circle' : 'bx-list-check'}`} style={{ color: totalOpen === 0 ? '#22c55e' : '#ef4444', fontSize: 16 }}></i>
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: totalOpen === 0 ? '#22c55e' : 'rgba(255,255,255,0.85)' }}>Resumo de pendências</div>
                                  <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{totalOpen === 0 ? 'Nenhuma tarefa em aberto' : `${totalOpen} tarefa(s) em aberto em ${openByPhase.length} tópico(s)`}</div>
                                </div>
                                {totalOpen > 0 && <i className={`bx ${pendingSummaryOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`} style={{ fontSize: 18, opacity: 0.45 }}></i>}
                              </button>
                              {pendingSummaryOpen && totalOpen > 0 && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(239,68,68,0.25)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px 16px 14px' }}>
                                  {openByPhase.map(({ phase, openTasks }) => (
                                    <div key={phase.id} style={{ marginBottom: 12 }}>
                                      <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{phase.label}</div>
                                      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                                        {openTasks.map((task) => (
                                          <li key={task.id}>
                                            <button
                                              type="button"
                                              onClick={() => handleToggleOffboardingTask(client.id, task.id)}
                                              title="Concluir tarefa"
                                              style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, padding: '4px 6px', margin: 0, background: 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s, color 0.12s' }}
                                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)'; e.currentTarget.style.color = '#22c55e' }}
                                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
                                            >
                                              <i className="bx bx-circle" style={{ fontSize: 13, color: 'inherit', marginTop: 1, flexShrink: 0 }}></i>
                                              <span>{task.label}</span>
                                            </button>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                        {OFFBOARDING_PHASES.map((phase, pi) => {
                          const phaseColor = PHASE_COLORS[pi % PHASE_COLORS.length]
                          const phaseDone = phase.tasks.filter((t) => completedSet.has(t.id)).length
                          const isPhaseOpen = offboardingExpandedPhases.has(phase.id)
                          const togglePhase = () => setOffboardingExpandedPhases((prev) => { const next = new Set(prev); if (next.has(phase.id)) next.delete(phase.id); else next.add(phase.id); return next })
                          return (
                            <div key={phase.id} style={{ marginBottom: 12, border: `1px solid ${phaseColor}28`, borderRadius: 12, overflow: 'hidden' }}>
                              <button type="button" onClick={togglePhase} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: `${phaseColor}14`, border: 'none', cursor: 'pointer', color: 'inherit', textAlign: 'left' }}>
                                <i className={`bx ${phase.icon}`} style={{ color: phaseColor, fontSize: 18, flexShrink: 0 }}></i>
                                <span style={{ flex: 1, fontWeight: 700, fontSize: '0.88rem' }}>{phase.label}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{phaseDone}/{phase.tasks.length}</span>
                                <div style={{ width: 48, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginLeft: 8 }}>
                                  <div style={{ height: '100%', width: `${Math.round((phaseDone / phase.tasks.length) * 100)}%`, background: phaseColor, borderRadius: 3 }}></div>
                                </div>
                                <i className={`bx bx-chevron-${isPhaseOpen ? 'up' : 'down'}`} style={{ fontSize: 16, opacity: 0.5, marginLeft: 4 }}></i>
                              </button>
                              {isPhaseOpen && (
                                <div style={{ padding: '8px 14px 12px' }}>
                                  {phase.tasks.map((task) => {
                                    const checked = completedSet.has(task.id)
                                    return (
                                      <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <input type="checkbox" checked={checked} onChange={() => handleToggleOffboardingTask(client.id, task.id)} style={{ display: 'none' }} />
                                        <span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? phaseColor : 'rgba(255,255,255,0.2)'}`, background: checked ? phaseColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s', boxShadow: checked ? `0 0 8px ${phaseColor}80` : 'none' }}>
                                          {checked && <i className="bx bx-check" style={{ fontSize: 13, color: '#fff' }}></i>}
                                        </span>
                                        <span style={{ fontSize: '0.88rem', opacity: checked ? 0.5 : 0.9, textDecoration: checked ? 'line-through' : 'none', transition: 'opacity .15s' }}>{task.label}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </section>
          )
        })()}

        {offboardingManageMode && (
          <section className="glass-panel" style={{ margin: '0 0 24px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                <i className="bx bx-list-ul" style={{ marginRight: 8, color: '#ef4444' }}></i>
                Editar Tarefas de Offboarding
              </h3>
              <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} onClick={() => setOffbNewPhase({ label: '', icon: 'bx-check' })}>
                <i className="bx bx-plus"></i> Nova fase
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {offbNewPhase && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <strong style={{ fontSize: '0.85rem' }}>Nova fase</strong>
                  <input type="text" className="input-field" placeholder="Nome da fase" value={offbNewPhase.label} onChange={e => setOffbNewPhase(p => ({ ...p, label: e.target.value }))} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
                  <input type="text" className="input-field" placeholder="Ícone (ex: bx-check)" value={offbNewPhase.icon} onChange={e => setOffbNewPhase(p => ({ ...p, icon: e.target.value }))} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 14px' }} disabled={!offbNewPhase.label.trim()} onClick={async () => {
                      const res = await fetch('/api/onboarding-tasks/definitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'phase', type: 'offboarding', ...offbNewPhase }) })
                      const data = await res.json()
                      if (data.phase) { setOffboardingPhaseDefs(prev => [...prev, data.phase]); setOffbNewPhase(null) }
                    }}>Salvar</button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => setOffbNewPhase(null)}>Cancelar</button>
                  </div>
                </div>
              )}
              {(offboardingPhaseDefsLoaded ? offboardingPhaseDefs : []).map(phase => (
                <div key={phase.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 16px' }}>
                  {offbEditingPhase?.id === phase.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      <input type="text" className="input-field" value={offbEditingPhase.label} onChange={e => setOffbEditingPhase(p => ({ ...p, label: e.target.value }))} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
                      <input type="text" className="input-field" value={offbEditingPhase.icon} onChange={e => setOffbEditingPhase(p => ({ ...p, icon: e.target.value }))} style={{ fontSize: '0.85rem', padding: '6px 10px' }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 14px' }} onClick={async () => {
                          const res = await fetch('/api/onboarding-tasks/definitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'phase', id: offbEditingPhase.id, label: offbEditingPhase.label, icon: offbEditingPhase.icon }) })
                          const data = await res.json()
                          if (data.phase) { setOffboardingPhaseDefs(prev => prev.map(p => p.id === data.phase.id ? { ...p, label: data.phase.label, icon: data.phase.icon } : p)); setOffbEditingPhase(null) }
                        }}>Salvar</button>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => setOffbEditingPhase(null)}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <i className={`bx ${phase.icon}`} style={{ color: '#ef4444', fontSize: 16 }}></i>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem' }}>{phase.label}</span>
                      <button type="button" className="btn-icon" onClick={() => setOffbEditingPhase({ ...phase })} style={{ color: '#94a3b8', fontSize: '1rem' }}><i className="bx bx-edit"></i></button>
                      <button type="button" className="btn-icon" onClick={async () => {
                        if (!confirm(`Excluir fase "${phase.label}" e todas as suas tarefas?`)) return
                        await fetch(`/api/onboarding-tasks/definitions?entity=phase&id=${phase.id}`, { method: 'DELETE' })
                        setOffboardingPhaseDefs(prev => prev.filter(p => p.id !== phase.id))
                      }} style={{ color: '#ef4444', fontSize: '1rem' }}><i className="bx bx-trash"></i></button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
                    {offbNewItem?.phase_id === phase.id && (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 8 }}>
                        <input type="text" className="input-field" placeholder="Nome da tarefa" value={offbNewItem.label} onChange={e => setOffbNewItem(i => ({ ...i, label: e.target.value }))} style={{ flex: 1, fontSize: '0.82rem', padding: '4px 8px' }} />
                        <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} disabled={!offbNewItem.label.trim()} onClick={async () => {
                          const res = await fetch('/api/onboarding-tasks/definitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'item', phase_id: phase.id, label: offbNewItem.label }) })
                          const data = await res.json()
                          if (data.item) { setOffboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: [...p.tasks, data.item] } : p)); setOffbNewItem(null) }
                        }}>Salvar</button>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setOffbNewItem(null)}>Cancelar</button>
                      </div>
                    )}
                    {(phase.tasks || []).map(task => (
                      <div key={task._id || task.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {offbEditingItem?._id === task._id ? (
                          <>
                            <input type="text" className="input-field" value={offbEditingItem.label} onChange={e => setOffbEditingItem(i => ({ ...i, label: e.target.value }))} style={{ flex: 1, fontSize: '0.82rem', padding: '4px 8px' }} />
                            <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={async () => {
                              const res = await fetch('/api/onboarding-tasks/definitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'item', id: offbEditingItem._id, label: offbEditingItem.label }) })
                              const data = await res.json()
                              if (data.item) { setOffboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: p.tasks.map(t => t._id === data.item._id ? data.item : t) } : p)); setOffbEditingItem(null) }
                            }}>Salvar</button>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setOffbEditingItem(null)}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, fontSize: '0.83rem', opacity: 0.85 }}>{task.label}</span>
                            <button type="button" className="btn-icon" onClick={() => setOffbEditingItem({ ...task })} style={{ color: '#94a3b8', fontSize: '0.95rem' }}><i className="bx bx-edit"></i></button>
                            <button type="button" className="btn-icon" onClick={async () => {
                              if (!confirm(`Excluir tarefa "${task.label}"?`)) return
                              await fetch(`/api/onboarding-tasks/definitions?entity=item&id=${task._id}`, { method: 'DELETE' })
                              setOffboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: p.tasks.filter(t => t._id !== task._id) } : p))
                            }} style={{ color: '#ef4444', fontSize: '0.95rem' }}><i className="bx bx-trash"></i></button>
                          </>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px', alignSelf: 'flex-start', marginTop: 4 }} onClick={() => setOffbNewItem({ phase_id: phase.id, label: '' })}>
                      <i className="bx bx-plus"></i> Nova tarefa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
    </>
  )
}
