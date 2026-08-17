'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useDashboard } from '@/components/dashboard/DashboardContext'

const AC_INITIALS = (name) => { const p = String(name || '').trim().split(/\s+/); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?' }

// Classificações de saúde do cliente (espelham o playbook da Weekly - GR).
const STATUS_DEFS = [
  { id: 'saudavel', label: 'Saudável', color: '#22c55e' },
  { id: 'atencao', label: 'Atenção', color: '#f59e0b' },
  { id: 'critico', label: 'Crítico', color: '#ef4444' },
  { id: 'integracao', label: 'Integração', color: '#3b82f6' },
  { id: 'pausado', label: 'Pausado', color: '#64748b' },
]
const STATUS_BY_ID = Object.fromEntries(STATUS_DEFS.map((s) => [s.id, s]))

// Aceita "1.234,56", "1234.56", 1234.56 -> Number | null
function parseBR(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const cleaned = String(value).trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

const fmtBRL = (n) => (n === null || n === undefined || Number.isNaN(n))
  ? '—'
  : Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtInt = (n) => (n === null || n === undefined || Number.isNaN(n)) ? '—' : Number(n).toLocaleString('pt-BR')

// Semana atual (segunda-feira) em YYYY-MM-DD como default para "nova semana".
function currentWeekStart() {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // 0 = segunda
  d.setDate(d.getDate() - day)
  return d.toISOString().slice(0, 10)
}

function formatWeekLabel(iso) {
  if (!iso) return ''
  const [y, m, dd] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, dd))
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const EMPTY_FORM = { clientId: '', status: '', resumo: '', investimento: '', leads: '', planilha: '', acao: '' }

export default function AnaliseClientesTab() {
  const { clients } = useDashboard()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [addingWeek, setAddingWeek] = useState(false)
  const [newWeekValue, setNewWeekValue] = useState(currentWeekStart())
  const [form, setForm] = useState(null) // null = fechado; objeto = modal aberto
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const activeClients = useMemo(() => (clients || []).filter((c) => c?.id), [clients])
  const clientById = useMemo(() => Object.fromEntries(activeClients.map((c) => [c.id, c])), [activeClients])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client-analysis', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      setRecords(Array.isArray(data.records) ? data.records : [])
    } catch { setRecords([]) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Lista de semanas existentes (desc) + garante a selecionada.
  const weeks = useMemo(() => {
    const set = new Set(records.map((r) => r.week_start).filter(Boolean))
    if (selectedWeek) set.add(selectedWeek)
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [records, selectedWeek])

  // Seleciona a semana mais recente ao carregar.
  useEffect(() => {
    if (selectedWeek) return
    if (weeks.length > 0) setSelectedWeek(weeks[0])
    else setSelectedWeek(currentWeekStart())
  }, [weeks, selectedWeek])

  const weekRecords = useMemo(
    () => records.filter((r) => r.week_start === selectedWeek),
    [records, selectedWeek]
  )

  // Histórico de CPL por cliente (para mostrar tendência em cada card).
  const cplHistoryByClient = useMemo(() => {
    const map = {}
    records.forEach((r) => {
      if (r.cpl === null || r.cpl === undefined) return
      ;(map[r.client_id] = map[r.client_id] || []).push({ week: r.week_start, cpl: Number(r.cpl) })
    })
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.week.localeCompare(b.week)))
    return map
  }, [records])

  const filteredWeekRecords = useMemo(() => {
    return weekRecords
      .filter((r) => {
        if (statusFilter !== 'all' && (r.status || '') !== statusFilter) return false
        if (search) {
          const name = clientById[r.client_id]?.name || ''
          if (!name.toLowerCase().includes(search.toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => {
        const na = clientById[a.client_id]?.name || ''
        const nb = clientById[b.client_id]?.name || ''
        return na.localeCompare(nb, 'pt-BR')
      })
  }, [weekRecords, statusFilter, search, clientById])

  // Métricas da semana selecionada.
  const metrics = useMemo(() => {
    let inv = 0, leads = 0, withInv = 0
    const byStatus = { saudavel: 0, atencao: 0, critico: 0, integracao: 0, pausado: 0 }
    weekRecords.forEach((r) => {
      if (r.investimento != null) { inv += Number(r.investimento); withInv += 1 }
      if (r.leads != null) leads += Number(r.leads)
      if (r.status && byStatus[r.status] !== undefined) byStatus[r.status] += 1
    })
    const cpl = leads > 0 ? inv / leads : null
    return { inv, leads, cpl, count: weekRecords.length, withInv, byStatus }
  }, [weekRecords])

  const openNew = () => setForm({ ...EMPTY_FORM })
  const openEdit = (rec) => setForm({
    clientId: rec.client_id,
    status: rec.status || '',
    resumo: rec.resumo || '',
    investimento: rec.investimento != null ? String(rec.investimento).replace('.', ',') : '',
    leads: rec.leads != null ? String(rec.leads) : '',
    planilha: rec.planilha || '',
    acao: rec.acao || '',
    _editing: true,
  })

  const formCpl = useMemo(() => {
    if (!form) return null
    const inv = parseBR(form.investimento)
    const ld = parseBR(form.leads)
    return (inv != null && ld != null && ld > 0) ? inv / ld : null
  }, [form])

  const handleSave = async () => {
    if (!form?.clientId || !selectedWeek) return
    setSaving(true)
    try {
      const res = await fetch('/api/client-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId,
          weekStart: selectedWeek,
          status: form.status,
          resumo: form.resumo,
          investimento: parseBR(form.investimento),
          leads: parseBR(form.leads),
          planilha: form.planilha,
          acao: form.acao,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.record) {
        setRecords((prev) => {
          const idx = prev.findIndex((r) => r.id === data.record.id
            || (r.client_id === data.record.client_id && r.week_start === data.record.week_start))
          if (idx >= 0) { const next = [...prev]; next[idx] = data.record; return next }
          return [data.record, ...prev]
        })
        setForm(null)
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async (rec) => {
    if (!confirm(`Remover a análise de ${clientById[rec.client_id]?.name || 'cliente'} desta semana?`)) return
    setSaving(true)
    try {
      await fetch(`/api/client-analysis?id=${rec.id}`, { method: 'DELETE' })
      setRecords((prev) => prev.filter((r) => r.id !== rec.id))
    } finally { setSaving(false) }
  }

  // Clientes ainda sem análise nesta semana (para o seletor do formulário novo).
  const clientsForForm = useMemo(() => {
    const usedIds = new Set(weekRecords.map((r) => r.client_id))
    return activeClients.filter((c) => form?._editing ? c.id === form.clientId : !usedIds.has(c.id) || c.id === form?.clientId)
  }, [activeClients, weekRecords, form])

  return (
    <section className="weekly-dashboard-panel" style={{ background: 'transparent', border: 'none' }}>
      {/* HERO */}
      <div style={{ padding: '24px 26px 20px', border: '1px solid rgba(255,255,255,0.05)', borderBottom: '2px solid rgba(38,194,129,0.28)', borderRadius: 18, background: 'linear-gradient(135deg, rgba(38,194,129,0.09) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -70, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.18), transparent 68%)', pointerEvents: 'none' }} />
        <span className="management-hero-kicker"><i className="bx bx-line-chart" style={{ marginRight: 5 }}></i>Weekly - GR</span>
        <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Análise de Clientes</h2>
        <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Registro semanal de performance por cliente: investimento, leads, CPL, planilha e ação.</p>

        {/* Seletor de semana */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', margin: '18px 0 4px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>Semana</span>
          <select
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(129,216,167,0.25)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600 }}
          >
            {weeks.map((w) => (
              <option key={w} value={w}>{formatWeekLabel(w)}</option>
            ))}
          </select>
          {addingWeek ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="date" value={newWeekValue} onChange={(e) => setNewWeekValue(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid rgba(129,216,167,0.25)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.85rem' }} />
              <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => { if (newWeekValue) { setSelectedWeek(newWeekValue); setAddingWeek(false) } }}>Abrir</button>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 10px' }} onClick={() => setAddingWeek(false)}>×</button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => { setNewWeekValue(currentWeekStart()); setAddingWeek(true) }}>
              <i className="bx bx-plus"></i> Nova semana
            </button>
          )}
          <button type="button" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '7px 14px', marginLeft: 'auto' }} onClick={openNew} disabled={!selectedWeek}>
            <i className="bx bx-plus"></i> Adicionar análise
          </button>
          {saving && <span style={{ fontSize: '0.78rem', opacity: 0.5 }}>Salvando...</span>}
        </div>

        {/* Métricas da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, margin: '16px 0 4px' }}>
          {[
            { icon: 'bx-group', label: 'Clientes', value: metrics.count, color: '#94a3b8' },
            { icon: 'bx-dollar-circle', label: 'Investimento', value: fmtBRL(metrics.inv), color: '#818cf8' },
            { icon: 'bx-user-plus', label: 'Leads', value: fmtInt(metrics.leads), color: '#26c281' },
            { icon: 'bx-calculator', label: 'CPL médio', value: fmtBRL(metrics.cpl), color: '#4fdf9b' },
          ].map((m) => (
            <div key={m.label} className="management-stat-card" style={{ gap: 6 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className={`bx ${m.icon}`} style={{ color: m.color, fontSize: 13 }}></i>{m.label}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4, pointerEvents: 'none' }}></i>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..."
              style={{ width: '100%', padding: '8px 12px 8px 42px', borderRadius: 10, border: '1px solid rgba(129,216,167,0.18)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {[{ id: 'all', label: 'Todos', color: '#94a3b8', count: weekRecords.length }, ...STATUS_DEFS.map((s) => ({ ...s, count: metrics.byStatus[s.id] || 0 }))].map((f) => (
              <button key={f.id} type="button" onClick={() => setStatusFilter(f.id)}
                style={{ padding: '7px 12px', borderRadius: 99, border: `1px solid ${statusFilter === f.id ? (f.color + '66') : 'rgba(255,255,255,0.06)'}`, background: statusFilter === f.id ? (f.color + '22') : 'rgba(255,255,255,0.03)', color: statusFilter === f.id ? f.color : 'rgba(232,230,228,0.66)', fontFamily: 'Inter', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA DE ANÁLISES DA SEMANA */}
      <div style={{ padding: '22px 26px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.5, fontSize: '0.9rem' }}>Carregando análises...</div>
        ) : filteredWeekRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
            <i className="bx bx-line-chart" style={{ fontSize: 40, opacity: 0.25 }}></i>
            <p style={{ opacity: 0.55, margin: '10px 0 4px', fontSize: '0.95rem', fontWeight: 700 }}>Nenhuma análise nesta semana</p>
            <p style={{ opacity: 0.4, margin: 0, fontSize: '0.82rem' }}>Clique em “Adicionar análise” para registrar o primeiro cliente.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', alignItems: 'start' }}>
            {filteredWeekRecords.map((rec) => {
              const client = clientById[rec.client_id]
              const st = STATUS_BY_ID[rec.status]
              const history = cplHistoryByClient[rec.client_id] || []
              const idx = history.findIndex((h) => h.week === rec.week_start)
              const prev = idx > 0 ? history[idx - 1] : null
              const trend = (prev && rec.cpl != null) ? Number(rec.cpl) - prev.cpl : null
              return (
                <div key={rec.id} style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)', padding: 16, borderTop: st ? `3px solid ${st.color}` : '3px solid rgba(255,255,255,0.08)' }}>
                  {/* Cabeçalho do card */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(38,194,129,0.14)', border: '1px solid rgba(38,194,129,0.3)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden', fontWeight: 800, fontSize: '0.8rem', color: '#26c281' }}>
                      {client?.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} /> : AC_INITIALS(client?.name)}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client?.name || 'Cliente removido'}</div>
                      {st && <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: st.color }}>{st.label}</span>}
                    </div>
                    <button type="button" title="Editar" onClick={() => openEdit(rec)} className="btn-icon" style={{ color: '#94a3b8' }}><i className="bx bx-edit"></i></button>
                    <button type="button" title="Remover" onClick={() => handleDelete(rec)} className="btn-icon" style={{ color: '#f87171' }}><i className="bx bx-trash"></i></button>
                  </div>

                  {/* Números */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: 'Investimento', value: fmtBRL(rec.investimento) },
                      { label: 'Leads', value: fmtInt(rec.leads) },
                      { label: 'CPL', value: fmtBRL(rec.cpl) },
                    ].map((n) => (
                      <div key={n.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '8px 10px' }}>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.45 }}>{n.label}</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: 2 }}>{n.value}</div>
                      </div>
                    ))}
                  </div>
                  {trend != null && Math.abs(trend) > 0.005 && (
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, marginBottom: 10, color: trend > 0 ? '#ef4444' : '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className={`bx ${trend > 0 ? 'bx-trending-up' : 'bx-trending-down'}`}></i>
                      CPL {trend > 0 ? 'subiu' : 'caiu'} {fmtBRL(Math.abs(trend))} vs. semana anterior
                    </div>
                  )}

                  {/* Texto */}
                  {rec.resumo && <CardField label="Resumo" value={rec.resumo} />}
                  {rec.planilha && <CardField label="Planilha" value={rec.planilha} />}
                  {rec.acao && <CardField label="Ação" value={rec.acao} accent />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL FORMULÁRIO */}
      {form && typeof document !== 'undefined' && createPortal((
        <div onClick={() => setForm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 20, background: 'linear-gradient(160deg,#0f172a 0%,#0d1f17 100%)', border: '1px solid rgba(38,194,129,0.2)', boxShadow: '0 32px 100px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg,rgba(38,194,129,0.1) 0%,rgba(34,197,94,0.04) 100%)' }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#26c281', opacity: 0.8 }}>Análise · {formatWeekLabel(selectedWeek)}</div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', marginTop: 2 }}>{form._editing ? 'Editar análise' : 'Nova análise'}</div>
            </div>
            <div style={{ padding: '18px 24px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Cliente + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Cliente">
                  <select value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))} disabled={form._editing}
                    style={inputStyle}>
                    <option value="">Selecione...</option>
                    {clientsForForm.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={inputStyle}>
                    <option value="">—</option>
                    {STATUS_DEFS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </Field>
              </div>
              {/* Investimento / Leads / CPL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Investimento (R$)">
                  <input type="text" inputMode="decimal" value={form.investimento} onChange={(e) => setForm((f) => ({ ...f, investimento: e.target.value }))} placeholder="0,00" style={inputStyle} />
                </Field>
                <Field label="Leads">
                  <input type="text" inputMode="numeric" value={form.leads} onChange={(e) => setForm((f) => ({ ...f, leads: e.target.value }))} placeholder="0" style={inputStyle} />
                </Field>
                <Field label="CPL (auto)">
                  <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: 'rgba(38,194,129,0.08)', color: '#4fdf9b', fontWeight: 800 }}>{fmtBRL(formCpl)}</div>
                </Field>
              </div>
              <Field label="Resumo">
                <textarea value={form.resumo} onChange={(e) => setForm((f) => ({ ...f, resumo: e.target.value }))} rows={3} placeholder="Resumo da performance da semana..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
              </Field>
              <Field label="Planilha">
                <input type="text" value={form.planilha} onChange={(e) => setForm((f) => ({ ...f, planilha: e.target.value }))} placeholder="Ex.: Sendo preenchida / N/A / Não preenche" style={inputStyle} />
              </Field>
              <Field label="Ação">
                <textarea value={form.acao} onChange={(e) => setForm((f) => ({ ...f, acao: e.target.value }))} rows={2} placeholder="Próximas ações..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
              </Field>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => setForm(null)}>Cancelar</button>
              <button type="button" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 18px' }} disabled={!form.clientId || saving} onClick={handleSave}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </section>
  )
}

const inputStyle = { width: '100%', padding: '9px 11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.5 }}>{label}</span>
      {children}
    </label>
  )
}

function CardField({ label, value, accent }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: accent ? '#4fdf9b' : 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.82rem', lineHeight: 1.5, opacity: 0.85, whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  )
}
