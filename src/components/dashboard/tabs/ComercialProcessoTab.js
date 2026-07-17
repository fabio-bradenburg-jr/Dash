'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'

/* ── Paleta Kinetic Emerald ── */
const C = {
  card: 'rgba(28,28,28,0.55)', border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.1)',
  field: 'rgba(255,255,255,0.04)',
  text: '#E5E2E1', text2: 'rgba(229,226,225,0.72)', text3: 'rgba(229,226,225,0.45)', text4: 'rgba(229,226,225,0.28)',
  accent: '#26C281', accentBright: '#4fdf9b',
  green: '#26C281', blue: '#3ba3ff', amber: '#f59e0b', red: '#ef4444', muted: '#64748b',
}
const hexA = (hex, a) => {
  const h = hex.replace('#', ''); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
const initials = (name) => String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
const fmtBR = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

const SCRIPT_STATUSES = ['Implementado', 'Não implementado', 'Não se aplica']
const CRM_STATUSES = ['Implementado', 'Não implementado', 'Não se aplica', 'Outro CRM']
const STATUS_COLOR = {
  'Implementado': C.green, 'Outro CRM': C.blue, 'Não implementado': C.amber,
  'Não se aplica': C.muted, 'Realizada': C.green, 'Não realizada': C.amber,
}
const DEFAULT_REC = { script_status: 'Não implementado', script_date: null, crm_status: 'Não implementado', crm_date: null, audits: [], notes: '' }

const isArchivedClient = (c) => c?.isArchived === true || /churn|encerr|inativ|cancel/.test(String(c?.status || '').toLowerCase())
const stepDone = (status) => !!status && status !== 'Não implementado' && status !== 'Não realizada'
function progressOf(rec) {
  const audits = rec.audits || []
  const total = 2 + audits.length
  const done = (stepDone(rec.script_status) ? 1 : 0) + (stepDone(rec.crm_status) ? 1 : 0) + audits.filter(a => a.status === 'Realizada').length
  return Math.round((done / total) * 100)
}
const progColor = (p) => p >= 100 ? C.green : p >= 50 ? C.blue : p >= 25 ? C.amber : C.red

export default function ComercialProcessoTab({ clients = [], workspaceUsers = [], currentUserId, isMaster }) {
  const [records, setRecords] = useState({})    // client_id → record
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})  // client_id → bool
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [includeArchived, setIncludeArchived] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/client-commercial', { cache: 'no-store' })
      const json = await res.json()
      const map = {}
      for (const r of (json.records || [])) map[r.client_id] = { ...DEFAULT_REC, ...r, audits: Array.isArray(r.audits) ? r.audits : [] }
      setRecords(map)
    } catch { setRecords({}) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const recFor = useCallback((id) => records[id] || DEFAULT_REC, [records])

  const save = useCallback(async (clientId, patch) => {
    setRecords(prev => ({ ...prev, [clientId]: { ...DEFAULT_REC, ...prev[clientId], ...patch } }))
    setSaving(true)
    try {
      await fetch('/api/client-commercial', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ...patch }),
      })
    } catch { /* mantém otimista */ } finally { setSaving(false) }
  }, [])

  const baseClients = useMemo(() => clients.filter(c => c && c.id && c.name), [clients])
  const filterBySearch = useCallback((list) => {
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter(c => c.name.toLowerCase().includes(q))
  }, [search])

  const activeClients = useMemo(() => filterBySearch(baseClients.filter(c => !isArchivedClient(c))).sort((a, b) => a.name.localeCompare(b.name)), [baseClients, filterBySearch])
  const archivedClients = useMemo(() => filterBySearch(baseClients.filter(c => isArchivedClient(c))).sort((a, b) => a.name.localeCompare(b.name)), [baseClients, filterBySearch])

  /* ── Dashboard (ativos + arquivados se filtro ligado) ── */
  const dash = useMemo(() => {
    const pool = includeArchived ? baseClients : baseClients.filter(c => !isArchivedClient(c))
    const n = pool.length || 1
    const scriptOk = pool.filter(c => recFor(c.id).script_status === 'Implementado').length
    const crmOk = pool.filter(c => ['Implementado', 'Outro CRM'].includes(recFor(c.id).crm_status)).length
    const audits = pool.reduce((a, c) => a + (recFor(c.id).audits || []).filter(x => x.status === 'Realizada').length, 0)
    const avg = Math.round(pool.reduce((a, c) => a + progressOf(recFor(c.id)), 0) / n)
    return { total: pool.length, scriptPct: Math.round(scriptOk / n * 100), crmPct: Math.round(crmOk / n * 100), audits, avg }
  }, [baseClients, includeArchived, recFor])

  const GRID = '1.7fr 1.25fr 1.25fr 1.4fr 1fr 38px'
  const cardStyle = { border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, backdropFilter: 'blur(12px)' }
  const selStyle = (color) => ({ height: 30, padding: '0 8px', borderRadius: 8, border: `1px solid ${C.border2}`, background: C.field, color: color || C.text2, fontFamily: 'Inter,inherit', fontSize: '0.74rem', fontWeight: 600, outline: 'none', cursor: 'pointer', width: '100%' })
  const dateStyle = { height: 26, padding: '0 6px', borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.text3, fontFamily: 'Inter,inherit', fontSize: '0.66rem', outline: 'none', colorScheme: 'dark', width: '100%' }

  function ClientRow({ client, archived }) {
    const rec = recFor(client.id)
    const pct = progressOf(rec)
    const isOpen = !!expanded[client.id]
    const audits = rec.audits || []
    const auditsDone = audits.filter(a => a.status === 'Realizada').length

    const addAudit = () => {
      const label = `${audits.length + 1}ª Auditoria`
      save(client.id, { audits: [...audits, { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), label, status: 'Não realizada', date: null }] })
    }
    const updAudit = (id, patch) => save(client.id, { audits: audits.map(a => a.id === id ? { ...a, ...patch } : a) })
    const delAudit = (id) => save(client.id, { audits: audits.filter(a => a.id !== id) })

    return (
      <div style={{ borderBottom: `1px solid ${C.border}`, opacity: archived ? 0.62 : 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, alignItems: 'center', padding: '10px 16px' }}>
          {/* cliente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, flex: 'none', background: client.dashboardColor || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem', color: '#fff', overflow: 'hidden' }}>
              {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(client.name)}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</span>
            {archived && <span style={{ flex: 'none', fontFamily: 'Inter', fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 99, background: hexA('#64748b', 0.18), color: C.text3 }}>Arquivado</span>}
          </div>
          {/* script */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <select value={rec.script_status} onChange={e => save(client.id, { script_status: e.target.value })} style={selStyle(STATUS_COLOR[rec.script_status])}>
              {SCRIPT_STATUSES.map(s => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
            </select>
            <input type="date" value={rec.script_date || ''} onChange={e => save(client.id, { script_date: e.target.value || null })} style={dateStyle} />
          </div>
          {/* crm */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <select value={rec.crm_status} onChange={e => save(client.id, { crm_status: e.target.value })} style={selStyle(STATUS_COLOR[rec.crm_status])}>
              {CRM_STATUSES.map(s => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
            </select>
            <input type="date" value={rec.crm_date || ''} onChange={e => save(client.id, { crm_date: e.target.value || null })} style={dateStyle} />
          </div>
          {/* auditorias resumo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {audits.length === 0 ? (
              <span style={{ fontFamily: 'Inter', fontSize: '0.68rem', color: C.text4 }}>Nenhuma auditoria</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: hexA(auditsDone === audits.length && audits.length ? C.green : C.amber, 0.14), color: auditsDone === audits.length && audits.length ? C.green : C.amber }}>
                <i className="bx bx-check-shield" style={{ fontSize: 13 }} />{auditsDone}/{audits.length} realizadas
              </span>
            )}
          </div>
          {/* progresso */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 2px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.82rem', color: progColor(pct), textAlign: 'right' }}>{pct}%</span>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: progColor(pct), transition: 'width 0.3s' }} /></div>
          </div>
          {/* expand */}
          <button type="button" onClick={() => setExpanded(x => ({ ...x, [client.id]: !x[client.id] }))} title="Auditorias e observações" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: isOpen ? hexA('#26C281', 0.12) : 'transparent', color: isOpen ? C.accent : C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`bx bx-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 18 }} />
          </button>
        </div>

        {isOpen && (
          <div style={{ padding: '4px 16px 16px 63px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
            {/* auditorias */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Inter', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700 }}>Auditorias</span>
                <button type="button" onClick={addAudit} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 26, padding: '0 10px', borderRadius: 8, border: `1px dashed ${hexA('#26C281', 0.4)}`, background: 'transparent', color: C.accent, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.68rem', fontWeight: 600 }}><i className="bx bx-plus" />Adicionar</button>
              </div>
              {audits.length === 0 && <div style={{ fontFamily: 'Inter', fontSize: '0.72rem', color: C.text4 }}>Nenhuma auditoria criada.</div>}
              {audits.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input value={a.label} onChange={e => updAudit(a.id, { label: e.target.value })} style={{ flex: 1, minWidth: 0, height: 28, padding: '0 9px', borderRadius: 7, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'Inter', fontSize: '0.74rem', outline: 'none' }} />
                  <select value={a.status} onChange={e => updAudit(a.id, { status: e.target.value })} style={{ ...selStyle(STATUS_COLOR[a.status]), width: 120, height: 28 }}>
                    <option value="Não realizada" style={{ color: '#000' }}>Não realizada</option>
                    <option value="Realizada" style={{ color: '#000' }}>Realizada</option>
                  </select>
                  <input type="date" value={a.date || ''} onChange={e => updAudit(a.id, { date: e.target.value || null })} style={{ ...dateStyle, width: 120, height: 28 }} />
                  <button type="button" onClick={() => delAudit(a.id)} title="Remover" style={{ background: 'none', border: 'none', color: C.text4, cursor: 'pointer', padding: 2 }}><i className="bx bx-trash" style={{ fontSize: 15 }} /></button>
                </div>
              ))}
            </div>
            {/* observações */}
            <div>
              <span style={{ fontFamily: 'Inter', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700, display: 'block', marginBottom: 8 }}>Observações</span>
              <textarea defaultValue={rec.notes} onBlur={e => { if (e.target.value !== rec.notes) save(client.id, { notes: e.target.value }) }} placeholder="Notas do processo comercial deste cliente…"
                style={{ width: '100%', minHeight: 76, resize: 'vertical', padding: '8px 10px', borderRadius: 9, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ width: '100%', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 0 28px' }}>
        {/* HERO */}
        <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.08),rgba(38,194,129,0.01))', padding: '22px 24px' }}>
          <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(38,194,129,0.10),transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, fontWeight: 700, marginBottom: 9 }}>
            <i className="bx bx-briefcase-alt-2" style={{ fontSize: 15 }} />Comercial
          </div>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.6vw,2rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Processo Comercial</h1>
          <p style={{ margin: '8px 0 0', color: C.text2, fontSize: '0.88rem', maxWidth: '64ch', lineHeight: 1.5 }}>Acompanhe script, CRM e auditorias de cada cliente. Vinculado ao cadastro principal — clientes novos entram automaticamente e os arquivados ficam agrupados no final.</p>
        </div>

        {/* DASHBOARD */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
          <Stat icon="bx-buildings" color={C.accent} label="Clientes" value={dash.total} sub={includeArchived ? 'incl. arquivados' : 'ativos'} big />
          <Stat icon="bx-code-block" color={C.green} label="Script" value={`${dash.scriptPct}%`} sub="implementado" />
          <Stat icon="bx-server" color={C.blue} label="CRM" value={`${dash.crmPct}%`} sub="implementado" />
          <Stat icon="bx-check-shield" color={C.accentBright} label="Auditorias" value={dash.audits} sub="realizadas" />
          <Stat icon="bx-line-chart" color={progColor(dash.avg)} label="Progresso médio" value={`${dash.avg}%`} sub="da carteira" />
        </div>

        {/* FILTROS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 11, fontSize: 15, color: C.text3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente…" style={{ height: 36, paddingLeft: 32, paddingRight: 12, borderRadius: 9, border: `1px solid ${C.border2}`, background: C.field, color: C.text2, fontFamily: 'Inter,inherit', fontSize: '0.8rem', outline: 'none', width: 220 }} />
          </div>
          <button type="button" onClick={() => setIncludeArchived(v => !v)} title="Incluir arquivados nos indicadores" style={{ height: 36, padding: '0 12px', borderRadius: 9, border: `1px solid ${includeArchived ? hexA('#26C281', 0.4) : C.border2}`, background: C.field, color: includeArchived ? C.accent : C.text3, cursor: 'pointer', fontFamily: 'Inter,inherit', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className={`bx ${includeArchived ? 'bx-check-square' : 'bx-square'}`} style={{ fontSize: 15 }} />Arquivados no dashboard
          </button>
          {saving && <span style={{ fontSize: '0.72rem', color: C.accent, display: 'flex', alignItems: 'center', gap: 4 }}><i className="bx bx-loader-alt bx-spin" />Salvando…</span>}
        </div>

        {/* TABELA */}
        <div style={{ ...cardStyle, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 880 }}>
              <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700 }}>
                <span>Cliente</span><span>Script</span><span>CRM</span><span>Auditorias</span><span style={{ textAlign: 'right' }}>Progresso</span><span />
              </div>

              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: C.text3 }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: 24, color: C.accent }} /></div>
              ) : activeClients.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: C.text3, fontSize: '0.86rem' }}>Nenhum cliente ativo.</div>
              ) : activeClients.map(c => <ClientRow key={c.id} client={c} archived={false} />)}

              {/* seção arquivados */}
              {archivedClients.length > 0 && (
                <div>
                  <button type="button" onClick={() => setArchivedOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '11px 16px', background: 'rgba(255,255,255,0.02)', border: 'none', borderTop: `1px solid ${C.border}`, color: C.text2, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <i className={`bx bx-chevron-${archivedOpen ? 'down' : 'right'}`} style={{ fontSize: 18, color: C.text3 }} />
                    <i className="bx bx-archive" style={{ fontSize: 16, color: C.text3 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>Arquivados</span>
                    <span style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: C.text3, background: hexA('#64748b', 0.18), borderRadius: 99, padding: '1px 9px' }}>{archivedClients.length}</span>
                  </button>
                  {archivedOpen && archivedClients.map(c => <ClientRow key={c.id} client={c} archived={true} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, color, label, value, sub, big }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, backdropFilter: 'blur(12px)', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: hexA(color, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><i className={`bx ${icon}`} style={{ fontSize: 15, color }} /></span>
        <span style={{ fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontWeight: 900, fontSize: big ? '1.5rem' : '1.35rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: big ? color : C.text }}>{value}</div>
      <div style={{ fontFamily: 'Inter', fontSize: '0.6rem', color: C.text3, marginTop: 2 }}>{sub}</div>
    </div>
  )
}
