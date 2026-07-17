'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'

/* ── Paleta Kinetic Emerald ── */
const C = {
  card: 'rgba(28,28,28,0.55)', border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.1)',
  field: 'rgba(255,255,255,0.04)',
  text: '#E5E2E1', text2: 'rgba(229,226,225,0.72)', text3: 'rgba(229,226,225,0.45)', text4: 'rgba(229,226,225,0.28)',
  accent: '#26C281', accentBright: '#4fdf9b',
  green: '#26C281', blue: '#3ba3ff', amber: '#f59e0b', red: '#ef4444', muted: '#64748b',
}
const hexA = (hex, a) => {
  const h = String(hex || '#64748b').replace('#', ''); const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
const initials = (name) => String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
const fmtBR = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''

const DEFAULT_CONFIG = {
  script: [
    { label: 'Implementado', color: '#26C281' },
    { label: 'Não implementado', color: '#f59e0b' },
    { label: 'Não se aplica', color: '#64748b' },
  ],
  crm: [
    { label: 'Implementado', color: '#26C281' },
    { label: 'Não implementado', color: '#f59e0b' },
    { label: 'Não se aplica', color: '#64748b' },
    { label: 'Outro CRM', color: '#3ba3ff' },
  ],
  audit: [
    { label: 'Não realizada', color: '#f59e0b' },
    { label: 'Realizada', color: '#26C281' },
  ],
}
const PALETTE = ['#26C281', '#3ba3ff', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#64748b']

const DEFAULT_REC = { script_status: 'Não implementado', script_date: null, crm_status: 'Não implementado', crm_date: null, audits: [], notes: '' }

const isArchivedClient = (c) => c?.isArchived === true || /churn|encerr|inativ|cancel/.test(String(c?.status || '').toLowerCase())
const isDoneStatus = (label) => { const l = String(label || '').toLowerCase(); return !!label && !/n[ãa]o implement|n[ãa]o realizad|pendente|n[ãa]o inici/.test(l) }
function progressOf(rec) {
  const audits = rec.audits || []
  const total = 2 + audits.length
  const done = (isDoneStatus(rec.script_status) ? 1 : 0) + (isDoneStatus(rec.crm_status) ? 1 : 0) + audits.filter(a => isDoneStatus(a.status)).length
  return Math.round((done / total) * 100)
}
const progColor = (p) => p >= 100 ? C.green : p >= 50 ? C.blue : p >= 25 ? C.amber : C.red

export default function ComercialProcessoTab({ clients = [], workspaceUsers = [], currentUserId, isMaster }) {
  const [records, setRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const [archivedOpen, setArchivedOpen] = useState(false)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [noteModal, setNoteModal] = useState(null)   // { clientId, auditId, label }
  const [noteDraft, setNoteDraft] = useState('')
  const [statusConfig, setStatusConfig] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [viewMode, setViewMode] = useState('processo') // processo | auditorias

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

  useEffect(() => {
    fetch('/api/client-commercial/config', { cache: 'no-store' }).then(r => r.json()).then(j => { if (j.config) setStatusConfig(j.config) }).catch(() => {})
  }, [])

  const cfg = statusConfig || DEFAULT_CONFIG
  const colorMap = useMemo(() => {
    const m = {}
    ;['script', 'crm', 'audit'].forEach(k => (cfg[k] || []).forEach(o => { m[o.label] = o.color }))
    return m
  }, [cfg])
  const scriptOptions = (cfg.script || []).map(o => o.label)
  const crmOptions = (cfg.crm || []).map(o => o.label)
  const auditOptions = (cfg.audit || []).map(o => o.label)

  const recFor = useCallback((id) => records[id] || DEFAULT_REC, [records])

  const save = useCallback(async (clientId, patch) => {
    setRecords(prev => ({ ...prev, [clientId]: { ...DEFAULT_REC, ...prev[clientId], ...patch } }))
    setSaving(true)
    try {
      await fetch('/api/client-commercial', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId, ...patch }) })
    } catch { /* otimista */ } finally { setSaving(false) }
  }, [])

  const saveAuditNote = () => {
    if (!noteModal) return
    const { clientId, auditId } = noteModal
    const rec = records[clientId] || DEFAULT_REC
    save(clientId, { audits: (rec.audits || []).map(a => a.id === auditId ? { ...a, note: noteDraft } : a) })
    setNoteModal(null)
  }

  const baseClients = useMemo(() => clients.filter(c => c && c.id && c.name), [clients])
  const filterBySearch = useCallback((list) => {
    if (!search.trim()) return list
    const q = search.trim().toLowerCase()
    return list.filter(c => c.name.toLowerCase().includes(q))
  }, [search])
  const activeClients = useMemo(() => filterBySearch(baseClients.filter(c => !isArchivedClient(c))).sort((a, b) => a.name.localeCompare(b.name)), [baseClients, filterBySearch])
  const archivedClients = useMemo(() => filterBySearch(baseClients.filter(c => isArchivedClient(c))).sort((a, b) => a.name.localeCompare(b.name)), [baseClients, filterBySearch])

  const dash = useMemo(() => {
    const pool = includeArchived ? baseClients : baseClients.filter(c => !isArchivedClient(c))
    const n = pool.length || 1
    const scriptOk = pool.filter(c => isDoneStatus(recFor(c.id).script_status) && recFor(c.id).script_status !== 'Não se aplica').length
    const crmOk = pool.filter(c => isDoneStatus(recFor(c.id).crm_status) && recFor(c.id).crm_status !== 'Não se aplica').length
    const audits = pool.reduce((a, c) => a + (recFor(c.id).audits || []).filter(x => isDoneStatus(x.status)).length, 0)
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
    const auditsDone = audits.filter(a => isDoneStatus(a.status)).length

    const addAudit = () => save(client.id, { audits: [...audits, { id: (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), label: `${audits.length + 1}ª Auditoria`, status: auditOptions[0] || 'Não realizada', date: null, note: '' }] })
    const updAudit = (id, patch) => save(client.id, { audits: audits.map(a => a.id === id ? { ...a, ...patch } : a) })
    const delAudit = (id) => save(client.id, { audits: audits.filter(a => a.id !== id) })

    return (
      <div style={{ borderBottom: `1px solid ${C.border}`, opacity: archived ? 0.62 : 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 10, alignItems: 'center', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, flex: 'none', background: client.dashboardColor || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem', color: '#fff', overflow: 'hidden' }}>
              {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(client.name)}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</span>
            {archived && <span style={{ flex: 'none', fontFamily: 'Inter', fontSize: '0.56rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 99, background: hexA('#64748b', 0.18), color: C.text3 }}>Arquivado</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <select value={rec.script_status} onChange={e => save(client.id, { script_status: e.target.value })} style={selStyle(colorMap[rec.script_status])}>
              {scriptOptions.map(s => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
              {!scriptOptions.includes(rec.script_status) && <option value={rec.script_status} style={{ color: '#000' }}>{rec.script_status}</option>}
            </select>
            <input type="date" value={rec.script_date || ''} onChange={e => save(client.id, { script_date: e.target.value || null })} style={dateStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <select value={rec.crm_status} onChange={e => save(client.id, { crm_status: e.target.value })} style={selStyle(colorMap[rec.crm_status])}>
              {crmOptions.map(s => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
              {!crmOptions.includes(rec.crm_status) && <option value={rec.crm_status} style={{ color: '#000' }}>{rec.crm_status}</option>}
            </select>
            <input type="date" value={rec.crm_date || ''} onChange={e => save(client.id, { crm_date: e.target.value || null })} style={dateStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {audits.length === 0 ? (
              <span style={{ fontFamily: 'Inter', fontSize: '0.68rem', color: C.text4 }}>Nenhuma auditoria</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: hexA(auditsDone === audits.length ? C.green : C.amber, 0.14), color: auditsDone === audits.length ? C.green : C.amber }}>
                <i className="bx bx-check-shield" style={{ fontSize: 13 }} />{auditsDone}/{audits.length} realizadas
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 2px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.82rem', color: progColor(pct), textAlign: 'right' }}>{pct}%</span>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: progColor(pct), transition: 'width 0.3s' }} /></div>
          </div>
          <button type="button" onClick={() => setExpanded(x => ({ ...x, [client.id]: !x[client.id] }))} title="Auditorias e observações" style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: isOpen ? hexA('#26C281', 0.12) : 'transparent', color: isOpen ? C.accent : C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={`bx bx-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: 18 }} />
          </button>
        </div>

        {isOpen && (
          <div style={{ padding: '4px 16px 16px 63px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'Inter', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700 }}>Auditorias</span>
                <button type="button" onClick={addAudit} style={{ display: 'flex', alignItems: 'center', gap: 4, height: 26, padding: '0 10px', borderRadius: 8, border: `1px dashed ${hexA('#26C281', 0.4)}`, background: 'transparent', color: C.accent, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.68rem', fontWeight: 600 }}><i className="bx bx-plus" />Adicionar</button>
              </div>
              {audits.length === 0 && <div style={{ fontFamily: 'Inter', fontSize: '0.72rem', color: C.text4 }}>Nenhuma auditoria criada.</div>}
              {audits.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input value={a.label} onChange={e => updAudit(a.id, { label: e.target.value })} style={{ flex: 1, minWidth: 0, height: 28, padding: '0 9px', borderRadius: 7, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'Inter', fontSize: '0.74rem', outline: 'none' }} />
                  <select value={a.status} onChange={e => updAudit(a.id, { status: e.target.value })} style={{ ...selStyle(colorMap[a.status]), width: 130, height: 28 }}>
                    {auditOptions.map(s => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
                    {!auditOptions.includes(a.status) && <option value={a.status} style={{ color: '#000' }}>{a.status}</option>}
                  </select>
                  <input type="date" value={a.date || ''} onChange={e => updAudit(a.id, { date: e.target.value || null })} style={{ ...dateStyle, width: 118, height: 28 }} />
                  <button type="button" onClick={() => { setNoteDraft(a.note || ''); setNoteModal({ clientId: client.id, auditId: a.id, label: a.label, clientName: client.name }) }} title={a.note ? 'Editar observação' : 'Adicionar observação'} style={{ background: a.note ? hexA('#26C281', 0.14) : 'none', border: 'none', color: a.note ? C.accent : C.text4, cursor: 'pointer', padding: 3, borderRadius: 6, display: 'flex' }}><i className="bx bx-edit" style={{ fontSize: 16 }} /></button>
                  <button type="button" onClick={() => delAudit(a.id)} title="Remover" style={{ background: 'none', border: 'none', color: C.text4, cursor: 'pointer', padding: 2 }}><i className="bx bx-trash" style={{ fontSize: 15 }} /></button>
                </div>
              ))}
            </div>
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

  /* ── Vista de Auditorias (matriz clientes × auditorias) ── */
  const auditClients = (includeArchived ? [...activeClients, ...archivedClients] : activeClients).filter(c => (recFor(c.id).audits || []).length > 0)
  const maxAudits = auditClients.reduce((m, c) => Math.max(m, (recFor(c.id).audits || []).length), 0)
  const AUDIT_GRID = `1.7fr repeat(${Math.max(1, maxAudits)}, 1fr)`

  return (
    <div style={{ width: '100%', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 0 28px' }}>
        {/* HERO */}
        <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.08),rgba(38,194,129,0.01))', padding: '22px 24px' }}>
          <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(38,194,129,0.10),transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, fontWeight: 700, marginBottom: 9 }}>
                <i className="bx bx-briefcase-alt-2" style={{ fontSize: 15 }} />Comercial
              </div>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.6vw,2rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Processo Comercial</h1>
              <p style={{ margin: '8px 0 0', color: C.text2, fontSize: '0.88rem', maxWidth: '58ch', lineHeight: 1.5 }}>Acompanhe script, CRM e auditorias de cada cliente. Vinculado ao cadastro principal — novos entram automaticamente e os arquivados ficam no final.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', background: C.field, border: `1px solid ${C.border2}`, borderRadius: 10, padding: 2, gap: 2 }}>
                {[{ k: 'processo', i: 'bx-table', l: 'Processo' }, { k: 'auditorias', i: 'bx-check-shield', l: 'Auditorias' }].map(({ k, i, l }) => (
                  <button key={k} type="button" onClick={() => setViewMode(k)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: viewMode === k ? C.accent : 'transparent', color: viewMode === k ? '#fff' : C.text3 }}>
                    <i className={`bx ${i}`} style={{ fontSize: 15 }} />{l}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setShowConfig(true)} title="Configurar status por coluna" style={{ height: 36, width: 36, borderRadius: 10, border: `1px solid ${C.border2}`, background: C.field, color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bx bx-cog" style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>
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

        {/* ── VISTA PROCESSO ── */}
        {viewMode === 'processo' && (
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
        )}

        {/* ── VISTA AUDITORIAS (matriz) ── */}
        {viewMode === 'auditorias' && (
          <div style={{ ...cardStyle, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: AUDIT_GRID, gap: 8, padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700 }}>
                  <span>Cliente</span>
                  {Array.from({ length: Math.max(1, maxAudits) }).map((_, i) => <span key={i} style={{ textAlign: 'center' }}>{i + 1}ª Auditoria</span>)}
                </div>
                {loading ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: C.text3 }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: 24, color: C.accent }} /></div>
                ) : auditClients.length === 0 ? (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: C.text3, fontSize: '0.86rem' }}>Nenhuma auditoria registrada ainda.</div>
                ) : auditClients.map(client => {
                  const audits = recFor(client.id).audits || []
                  return (
                    <div key={client.id} style={{ display: 'grid', gridTemplateColumns: AUDIT_GRID, gap: 8, alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${C.border}`, opacity: isArchivedClient(client) ? 0.62 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 7, flex: 'none', background: client.dashboardColor || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.58rem', color: '#fff', overflow: 'hidden' }}>{client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(client.name)}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</span>
                      </div>
                      {Array.from({ length: Math.max(1, maxAudits) }).map((_, i) => {
                        const a = audits[i]
                        if (!a) return <div key={i} style={{ textAlign: 'center', color: C.text4, fontSize: '0.9rem' }}>—</div>
                        const col = colorMap[a.status] || C.muted
                        const done = isDoneStatus(a.status)
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: hexA(col, 0.14), color: col }}>
                              <i className={`bx ${done ? 'bx-check' : 'bx-time-five'}`} style={{ fontSize: 13 }} />{a.status}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              {a.date && <span style={{ fontFamily: 'Inter', fontSize: '0.62rem', color: C.text3 }}>{fmtBR(a.date)}</span>}
                              {a.note && <button type="button" onClick={() => { setNoteDraft(a.note || ''); setNoteModal({ clientId: client.id, auditId: a.id, label: a.label, clientName: client.name }) }} title="Ver observação" style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', padding: 0, display: 'flex' }}><i className="bx bx-note" style={{ fontSize: 13 }} /></button>}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── POP-UP: observação da auditoria ── */}
      {noteModal && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setNoteModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <div onClick={e => e.stopPropagation()} style={{ ...cardStyle, width: '100%', maxWidth: 520, boxShadow: '0 30px 90px rgba(0,0,0,0.6)', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: hexA('#26C281', 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bx bx-edit" style={{ fontSize: 17, color: C.accent }} /></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Observação da auditoria</div>
                <div style={{ fontFamily: 'Inter', fontSize: '0.66rem', color: C.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{noteModal.clientName} · {noteModal.label}</div>
              </div>
              <button type="button" onClick={() => setNoteModal(null)} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border2}`, background: C.field, color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bx bx-x" style={{ fontSize: 19 }} /></button>
            </div>
            <div style={{ padding: 18 }}>
              <textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} autoFocus placeholder="Escreva a observação desta auditoria…"
                style={{ width: '100%', minHeight: 130, resize: 'vertical', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button type="button" onClick={() => setNoteModal(null)} style={{ height: 38, padding: '0 16px', borderRadius: 9, border: `1px solid ${C.border2}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem' }}>Cancelar</button>
                <button type="button" onClick={saveAuditNote} style={{ height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: C.accent, color: '#04150d', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 700 }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── POP-UP: configuração de status por coluna ── */}
      {showConfig && typeof document !== 'undefined' && createPortal(
        <StatusConfigModal
          initial={cfg}
          onClose={() => setShowConfig(false)}
          onSaved={(next) => { setStatusConfig(next); setShowConfig(false) }}
        />,
        document.body
      )}
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

function StatusConfigModal({ initial, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(initial)))
  const [saving, setSaving] = useState(false)
  const COLS = [{ k: 'script', l: 'Script' }, { k: 'crm', l: 'CRM' }, { k: 'audit', l: 'Auditorias' }]

  const upd = (col, i, patch) => setDraft(d => ({ ...d, [col]: d[col].map((o, idx) => idx === i ? { ...o, ...patch } : o) }))
  const add = (col) => setDraft(d => ({ ...d, [col]: [...d[col], { label: 'Novo status', color: PALETTE[d[col].length % PALETTE.length] }] }))
  const del = (col, i) => setDraft(d => ({ ...d, [col]: d[col].filter((_, idx) => idx !== i) }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/client-commercial/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
      const json = await res.json()
      onSaved(json.config || draft)
    } catch { onSaved(draft) } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, backdropFilter: 'blur(12px)', width: '100%', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 90px rgba(0,0,0,0.6)', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: hexA('#26C281', 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bx bx-cog" style={{ fontSize: 17, color: C.accent }} /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Status por coluna</div>
            <div style={{ fontFamily: 'Inter', fontSize: '0.66rem', color: C.text3 }}>Personalize os status disponíveis de Script, CRM e Auditorias</div>
          </div>
          <button type="button" onClick={onClose} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border2}`, background: C.field, color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bx bx-x" style={{ fontSize: 19 }} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16 }}>
          {COLS.map(({ k, l }) => (
            <div key={k} style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.field, padding: 12 }}>
              <div style={{ fontFamily: 'Inter', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700, marginBottom: 10 }}>{l}</div>
              {(draft[k] || []).map((o, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                  <input type="color" value={o.color} onChange={e => upd(k, i, { color: e.target.value })} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.border2}`, background: 'none', cursor: 'pointer', padding: 0, flex: 'none' }} />
                  <input value={o.label} onChange={e => upd(k, i, { label: e.target.value })} style={{ flex: 1, minWidth: 0, height: 30, padding: '0 9px', borderRadius: 7, border: `1px solid ${C.border2}`, background: 'rgba(0,0,0,0.2)', color: C.text, fontFamily: 'Inter', fontSize: '0.76rem', outline: 'none' }} />
                  <button type="button" onClick={() => del(k, i)} disabled={(draft[k] || []).length <= 1} title="Remover" style={{ background: 'none', border: 'none', color: C.text4, cursor: (draft[k] || []).length <= 1 ? 'default' : 'pointer', padding: 2, opacity: (draft[k] || []).length <= 1 ? 0.4 : 1 }}><i className="bx bx-trash" style={{ fontSize: 15 }} /></button>
                </div>
              ))}
              <button type="button" onClick={() => add(k)} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, height: 28, padding: '0 10px', borderRadius: 8, border: `1px dashed ${hexA('#26C281', 0.4)}`, background: 'transparent', color: C.accent, cursor: 'pointer', fontFamily: 'Inter', fontSize: '0.7rem', fontWeight: 600, width: '100%', justifyContent: 'center' }}><i className="bx bx-plus" />Adicionar status</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 18px', borderTop: `1px solid ${C.border}` }}>
          <button type="button" onClick={onClose} style={{ height: 38, padding: '0 16px', borderRadius: 9, border: `1px solid ${C.border2}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem' }}>Cancelar</button>
          <button type="button" onClick={save} disabled={saving} style={{ height: 38, padding: '0 18px', borderRadius: 9, border: 'none', background: C.accent, color: '#04150d', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}
