'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'

/* ── Paleta Kinetic Emerald (Assessoria LP) ── */
const C = {
  card: 'rgba(28,28,28,0.55)', card2: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.1)',
  field: 'rgba(255,255,255,0.04)',
  text: '#E5E2E1', text2: 'rgba(229,226,225,0.72)', text3: 'rgba(229,226,225,0.45)', text4: 'rgba(229,226,225,0.28)',
  accent: '#26C281', accentBright: '#4fdf9b', onAccent: '#04150d',
  green: '#26C281', yellow: '#FFB800', red: '#FF4B4B',
}
const hexA = (hex, a) => {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

const DIAS = [
  { key: 1, short: 'Seg' }, { key: 2, short: 'Ter' }, { key: 3, short: 'Qua' },
  { key: 4, short: 'Qui' }, { key: 5, short: 'Sex' },
]

/* ── Datas ── */
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setHours(0, 0, 0, 0)
  d.setDate(diff)
  return d
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d }
function fmtDate(d) {
  const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`
}
function fmtDisplay(d) {
  const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function initials(name) {
  return String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/* ── Classificação por nº de comunicações ── */
function colorForCount(c) { return c >= 5 ? C.green : c >= 3 ? C.yellow : C.red }
function statusTextForCount(c) { return c >= 5 ? 'Boa frequência' : c >= 3 ? 'Atenção' : 'Baixa comunicação' }
function colorForPct(p) { return p >= 100 ? C.green : p >= 60 ? C.yellow : C.red }

function isInactiveClient(client) {
  const s = String(client?.status || client?.healthStatus || '').toLowerCase()
  if (client?.active === false) return true
  return /churn|encerr|inativ|cancel|desativ|arquiv/.test(s)
}

export default function ComunicacaoTab({ clients = [], workspaceUsers = [], currentUserId, isMaster }) {
  const currentUserName = useMemo(
    () => workspaceUsers.find(u => u.id === currentUserId)?.full_name
      || workspaceUsers.find(u => u.id === currentUserId)?.email || 'Você',
    [workspaceUsers, currentUserId]
  )

  const [weekStart, setWeekStart] = useState(() => fmtDate(getMonday(new Date())))
  const [records, setRecords] = useState({})   // `${client_id}|${week_start}` → days {}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')       // all | green | yellow | red
  const [responsavelFilter, setResponsavelFilter] = useState('')
  const [hideInactive, setHideInactive] = useState(true)
  const [periodMode, setPeriodMode] = useState('week')          // week | month
  const [monthFilter, setMonthFilter] = useState(() => fmtDate(new Date()).slice(0, 7))

  const todayMonday = fmtDate(getMonday(new Date()))
  const isCurrentWeek = weekStart === todayMonday

  /* janela de semanas carregada (para dashboard/heatmap/evolução) */
  const HEAT_WEEKS = 6
  const weeksWindow = useMemo(() => {
    const out = []
    for (let i = HEAT_WEEKS - 1; i >= 0; i--) out.push(fmtDate(addDays(new Date(weekStart + 'T00:00:00'), -7 * i)))
    return out
  }, [weekStart])

  const monthWeeks = useMemo(() => {
    if (periodMode !== 'month') return []
    const [y, m] = monthFilter.split('-').map(Number)
    const first = getMonday(new Date(y, m - 1, 1))
    const out = []
    let cur = new Date(first)
    for (let i = 0; i < 6; i++) {
      const ws = fmtDate(cur)
      // inclui a semana se qualquer dia dela cai no mês
      const mondayMonth = cur.getMonth()
      const friday = addDays(cur, 4)
      if (mondayMonth === m - 1 || friday.getMonth() === m - 1) out.push(ws)
      cur = addDays(cur, 7)
    }
    return out
  }, [periodMode, monthFilter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let from, to
      if (periodMode === 'month' && monthWeeks.length) {
        from = monthWeeks[0]; to = monthWeeks[monthWeeks.length - 1]
      } else {
        from = weeksWindow[0]; to = weeksWindow[weeksWindow.length - 1]
      }
      const res = await fetch(`/api/client-communication?from=${from}&to=${to}`, { cache: 'no-store' })
      const json = await res.json()
      const map = {}
      for (const r of (json.records || [])) {
        map[`${r.client_id}|${r.week_start}`] = (r.days && typeof r.days === 'object') ? r.days : {}
      }
      setRecords(map)
    } catch { setRecords({}) } finally { setLoading(false) }
  }, [weeksWindow, monthWeeks, periodMode])

  useEffect(() => { load() }, [load])

  /* conta comunicações (Seg-Sex) de um cliente numa semana, respeitando filtro de responsável */
  const countFor = useCallback((clientId, wStart) => {
    const days = records[`${clientId}|${wStart}`] || {}
    let n = 0
    for (const d of DIAS) {
      const entry = days[String(d.key)]
      if (!entry) continue
      if (responsavelFilter && entry.by !== responsavelFilter) continue
      n++
    }
    return n
  }, [records, responsavelFilter])

  const monthAvgPct = useCallback((clientId) => {
    if (!monthWeeks.length) return 0
    const sum = monthWeeks.reduce((a, w) => a + countFor(clientId, w) * 20, 0)
    return Math.round(sum / monthWeeks.length)
  }, [monthWeeks, countFor])

  /* clientes visíveis (filtro de inativos + busca) */
  const visibleClients = useMemo(() => {
    let list = clients.filter(c => c && c.id && c.name)
    if (hideInactive) list = list.filter(c => !isInactiveClient(c))
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(c => c.name.toLowerCase().includes(q)) }
    // filtro por status de cor (com base na semana/mês vigente)
    if (statusFilter !== 'all') {
      list = list.filter(c => {
        const pct = periodMode === 'month' ? monthAvgPct(c.id) : countFor(c.id, weekStart) * 20
        const color = colorForPct(pct)
        return (statusFilter === 'green' && color === C.green) || (statusFilter === 'yellow' && color === C.yellow) || (statusFilter === 'red' && color === C.red)
      })
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [clients, hideInactive, search, statusFilter, periodMode, monthAvgPct, countFor, weekStart])

  /* ── Dashboard ── */
  const dash = useMemo(() => {
    const base = clients.filter(c => c && c.id && c.name && (!hideInactive || !isInactiveClient(c)))
    const pctOf = (c) => periodMode === 'month' ? monthAvgPct(c.id) : countFor(c.id, weekStart) * 20
    const pcts = base.map(c => ({ c, pct: pctOf(c) }))
    const total = base.reduce((a, c) => a + (periodMode === 'month'
      ? monthWeeks.reduce((s, w) => s + countFor(c.id, w), 0)
      : countFor(c.id, weekStart)), 0)
    const avg = pcts.length ? Math.round(pcts.reduce((a, x) => a + x.pct, 0) / pcts.length) : 0
    const green = pcts.filter(x => colorForPct(x.pct) === C.green).length
    const yellow = pcts.filter(x => colorForPct(x.pct) === C.yellow).length
    const red = pcts.filter(x => colorForPct(x.pct) === C.red).length
    const sorted = [...pcts].sort((a, b) => b.pct - a.pct)
    const topC = sorted[0]
    const bottomC = sorted.length > 1 ? sorted[sorted.length - 1] : null
    // evolução (média por semana na janela)
    const evo = weeksWindow.map(w => {
      const arr = base.map(c => countFor(c.id, w) * 20)
      return arr.length ? Math.round(arr.reduce((a, v) => a + v, 0) / arr.length) : 0
    })
    const prevWeek = fmtDate(addDays(new Date(weekStart + 'T00:00:00'), -7))
    const prevAvgArr = base.map(c => countFor(c.id, prevWeek) * 20)
    const prevAvg = prevAvgArr.length ? Math.round(prevAvgArr.reduce((a, v) => a + v, 0) / prevAvgArr.length) : 0
    const curAvg = periodMode === 'month' ? avg : (base.length ? Math.round(base.map(c => countFor(c.id, weekStart) * 20).reduce((a, v) => a + v, 0) / base.length) : 0)
    return { total, avg, green, yellow, red, topC, bottomC, evo, delta: curAvg - prevAvg }
  }, [clients, hideInactive, periodMode, monthAvgPct, countFor, weekStart, weeksWindow, monthWeeks])

  /* ── toggle de dia (só no modo semana) ── */
  const toggleDay = useCallback(async (clientId, day) => {
    const key = `${clientId}|${weekStart}`
    const cur = records[key] || {}
    const marked = !cur[String(day)]
    setRecords(prev => {
      const next = { ...prev }
      const d = { ...(next[key] || {}) }
      if (marked) d[String(day)] = { by: currentUserId, byName: currentUserName, at: new Date().toISOString() }
      else delete d[String(day)]
      next[key] = d
      return next
    })
    setSaving(true)
    try {
      await fetch('/api/client-communication', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, week_start: weekStart, day, marked, byName: currentUserName }),
      })
    } catch { /* mantém otimista */ } finally { setSaving(false) }
  }, [records, weekStart, currentUserId, currentUserName])

  const weekLabel = (() => {
    const diff = Math.round((new Date(weekStart + 'T00:00:00') - new Date(todayMonday + 'T00:00:00')) / (7 * 86400000))
    if (diff === 0) return 'Esta semana'
    if (diff === -1) return 'Semana passada'
    if (diff === 1) return 'Próxima semana'
    return diff < 0 ? `${Math.abs(diff)} sem. atrás` : `Em ${diff} sem.`
  })()
  const weekRange = `${fmtDisplay(weekStart)} — ${fmtDisplay(addDays(new Date(weekStart + 'T00:00:00'), 4))}`

  const responsavelOptions = workspaceUsers.filter(u => u && u.id)

  /* estilos utilitários */
  const cardStyle = { border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
  const selStyle = { height: 36, padding: '0 12px', borderRadius: 9, border: `1px solid ${C.border2}`, background: C.field, color: C.text2, fontFamily: 'Inter,inherit', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }
  const navBtn = { background: C.field, border: `1px solid ${C.border2}`, borderRadius: 9, color: C.text2, cursor: 'pointer', padding: '7px 10px', display: 'flex', alignItems: 'center' }

  return (
    <div style={{ width: '100%', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 0 28px' }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderTop: `3px solid ${C.accent}`, borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.08),rgba(38,194,129,0.01))', padding: '22px 24px' }}>
          <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(38,194,129,0.10),transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, fontWeight: 700, marginBottom: 9 }}>
                <i className="bx bx-conversation" style={{ fontSize: 15 }} />Frequência de comunicação
              </div>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.6vw,2rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Comunicação</h1>
              <p style={{ margin: '8px 0 0', color: C.text2, fontSize: '0.88rem', maxWidth: '60ch', lineHeight: 1.5 }}>Acompanhe se a equipe enviou mensagem no grupo de cada cliente, dia a dia. Marque Sim/Não e veja a frequência semanal da carteira.</p>
            </div>
            {/* Alternador de período + navegação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', background: C.field, border: `1px solid ${C.border2}`, borderRadius: 10, padding: 2, gap: 2 }}>
                {[{ k: 'week', i: 'bx-calendar-week', l: 'Semana' }, { k: 'month', i: 'bx-calendar', l: 'Mês' }].map(({ k, i, l }) => (
                  <button key={k} type="button" onClick={() => setPeriodMode(k)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: periodMode === k ? C.accent : 'transparent', color: periodMode === k ? '#fff' : C.text3 }}>
                    <i className={`bx ${i}`} style={{ fontSize: 15 }} />{l}
                  </button>
                ))}
              </div>
              {periodMode === 'week' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button type="button" onClick={() => setWeekStart(fmtDate(addDays(new Date(weekStart + 'T00:00:00'), -7)))} title="Semana anterior" style={navBtn}><i className="bx bx-chevron-left" style={{ fontSize: 18 }} /></button>
                  <div style={{ textAlign: 'center', minWidth: 148 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isCurrentWeek ? C.accentBright : C.text2 }}>{weekLabel}</div>
                    <div style={{ fontSize: '0.68rem', color: C.text4 }}>{weekRange}</div>
                  </div>
                  <button type="button" onClick={() => setWeekStart(fmtDate(addDays(new Date(weekStart + 'T00:00:00'), 7)))} title="Próxima semana" style={navBtn}><i className="bx bx-chevron-right" style={{ fontSize: 18 }} /></button>
                  <input type="date" value={weekStart} onChange={e => e.target.value && setWeekStart(fmtDate(getMonday(new Date(e.target.value + 'T00:00:00'))))} style={{ ...selStyle, colorScheme: 'dark', width: 140 }} />
                  {!isCurrentWeek && <button type="button" onClick={() => setWeekStart(todayMonday)} style={{ ...navBtn, color: C.accent, borderColor: hexA('#26C281', 0.4), fontSize: '0.72rem', fontWeight: 700, padding: '7px 11px' }}>Hoje</button>}
                </div>
              ) : (
                <input type="month" value={monthFilter} onChange={e => e.target.value && setMonthFilter(e.target.value)} style={{ ...selStyle, colorScheme: 'dark', width: 170 }} />
              )}
            </div>
          </div>
        </div>

        {/* ── DASHBOARD ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
          <StatCard icon="bx-line-chart" color={C.accent} label="Média geral" value={`${dash.avg}%`} sub={periodMode === 'month' ? 'no mês' : 'na semana'} big />
          <StatCard icon="bx-message-rounded-check" color={C.accentBright} label="Comunicações" value={dash.total} sub="total no período" />
          <StatCard icon="bx-check-circle" color={C.green} label="Boa frequência" value={dash.green} sub="clientes no verde" />
          <StatCard icon="bx-error" color={C.yellow} label="Atenção" value={dash.yellow} sub="clientes no amarelo" />
          <StatCard icon="bx-error-circle" color={C.red} label="Baixa" value={dash.red} sub="clientes no vermelho" />
          <StatCard icon="bx-trending-up" color={dash.delta >= 0 ? C.green : C.red} label="vs. anterior" value={`${dash.delta >= 0 ? '+' : ''}${dash.delta}%`} sub="média semanal" />
        </div>

        {/* Destaques + evolução */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12, marginTop: 12 }}>
          <HighlightCard icon="bx-crown" color={C.green} title="Maior frequência" client={dash.topC?.c} pct={dash.topC?.pct} />
          <HighlightCard icon="bx-down-arrow-alt" color={C.red} title="Menor frequência" client={dash.bottomC?.c} pct={dash.bottomC?.pct} />
          <div style={{ ...cardStyle, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: hexA('#26C281', 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bx bx-bar-chart-alt-2" style={{ fontSize: 15, color: C.accent }} /></span>
              <span style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, fontWeight: 700 }}>Evolução ({HEAT_WEEKS} semanas)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52 }}>
              {dash.evo.map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${v}%`}>
                  <div style={{ width: '100%', height: Math.max(4, v * 0.44), borderRadius: '4px 4px 0 0', background: colorForPct(v), opacity: i === dash.evo.length - 1 ? 1 : 0.55 }} />
                  <span style={{ fontFamily: 'Inter', fontSize: '0.54rem', color: C.text4 }}>{fmtDisplay(weeksWindow[i]).slice(0, 5)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FILTROS ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 11, fontSize: 15, color: C.text3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente…" style={{ ...selStyle, paddingLeft: 32, width: 200 }} />
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[{ k: 'all', l: 'Todos', col: C.text2 }, { k: 'green', l: 'Verde', col: C.green }, { k: 'yellow', l: 'Amarelo', col: C.yellow }, { k: 'red', l: 'Vermelho', col: C.red }].map(s => (
              <button key={s.k} type="button" onClick={() => setStatusFilter(s.k)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 99, border: `1px solid ${statusFilter === s.k ? s.col : C.border2}`, background: statusFilter === s.k ? hexA(s.col === C.text2 ? '#ffffff' : s.col, 0.12) : 'transparent', color: statusFilter === s.k ? (s.col === C.text2 ? C.text : s.col) : C.text3, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                {s.k !== 'all' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.col }} />}{s.l}
              </button>
            ))}
          </div>
          <select value={responsavelFilter} onChange={e => setResponsavelFilter(e.target.value)} style={selStyle}>
            <option value="">Todos os responsáveis</option>
            {responsavelOptions.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
          </select>
          <button type="button" onClick={() => setHideInactive(v => !v)} style={{ ...selStyle, display: 'flex', alignItems: 'center', gap: 6, color: hideInactive ? C.accent : C.text3, borderColor: hideInactive ? hexA('#26C281', 0.4) : C.border2 }}>
            <i className={`bx ${hideInactive ? 'bx-check-square' : 'bx-square'}`} style={{ fontSize: 15 }} />Ocultar inativos
          </button>
          {saving && <span style={{ fontSize: '0.72rem', color: C.accent, display: 'flex', alignItems: 'center', gap: 4 }}><i className="bx bx-loader-alt bx-spin" />Salvando…</span>}
        </div>

        {/* ── TABELA ── */}
        <div style={{ ...cardStyle, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: periodMode === 'week' ? 860 : 720 }}>
              {/* cabeçalho */}
              <div style={{ display: 'grid', gridTemplateColumns: periodMode === 'week' ? '2fr repeat(5, 0.7fr) 1.4fr 1.2fr' : `2fr repeat(${monthWeeks.length || 1}, 0.7fr) 1.4fr`, gap: 8, padding: '11px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700 }}>
                <span>Cliente</span>
                {periodMode === 'week'
                  ? (<>{DIAS.map(d => <span key={d.key} style={{ textAlign: 'center' }}>{d.short}</span>)}<span style={{ textAlign: 'center' }}>Frequência</span><span style={{ textAlign: 'center' }}>Status</span></>)
                  : (<>{monthWeeks.map(w => <span key={w} style={{ textAlign: 'center' }}>{fmtDisplay(w).slice(0, 5)}</span>)}<span style={{ textAlign: 'center' }}>Média mês</span></>)}
              </div>

              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: C.text3 }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: 24, color: C.accent }} /></div>
              ) : visibleClients.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: C.text3, fontSize: '0.86rem' }}>Nenhum cliente no filtro.</div>
              ) : visibleClients.map(client => {
                const count = countFor(client.id, weekStart)
                const pct = periodMode === 'month' ? monthAvgPct(client.id) : count * 20
                const color = colorForPct(pct)
                const days = records[`${client.id}|${weekStart}`] || {}
                return (
                  <div key={client.id} style={{ display: 'grid', gridTemplateColumns: periodMode === 'week' ? '2fr repeat(5, 0.7fr) 1.4fr 1.2fr' : `2fr repeat(${monthWeeks.length || 1}, 0.7fr) 1.4fr`, gap: 8, alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${C.border}` }}>
                    {/* cliente */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, flex: 'none', background: client.dashboardColor || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem', color: '#fff', overflow: 'hidden' }}>
                        {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(client.name)}
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</span>
                    </div>

                    {periodMode === 'week' ? (
                      <>
                        {DIAS.map(d => {
                          const entry = days[String(d.key)]
                          const on = !!entry && (!responsavelFilter || entry.by === responsavelFilter)
                          const who = entry ? `${entry.byName || 'Equipe'}${entry.at ? ' · ' + new Date(entry.at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}` : 'Marcar como enviado'
                          return (
                            <div key={d.key} style={{ display: 'flex', justifyContent: 'center' }}>
                              <button type="button" onClick={() => toggleDay(client.id, d.key)} title={who}
                                style={{ width: 34, height: 26, borderRadius: 8, cursor: 'pointer', border: `1px solid ${on ? C.green : C.border2}`, background: on ? hexA('#26C281', 0.18) : C.field, color: on ? C.accentBright : C.text4, fontFamily: 'Inter', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, transition: 'all 0.12s' }}>
                                <i className={`bx ${on ? 'bx-check' : 'bx-x'}`} style={{ fontSize: 14 }} />
                              </button>
                            </div>
                          )
                        })}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'Inter', fontSize: '0.62rem', color: C.text3 }}>{count}/5</span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color }}>{pct}%</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color, transition: 'width 0.3s' }} /></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 700, padding: '4px 9px', borderRadius: 99, background: hexA(color, 0.12), color, whiteSpace: 'nowrap' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />{statusTextForCount(count)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {monthWeeks.map(w => {
                          const c = countFor(client.id, w); const p = c * 20; const col = colorForPct(p)
                          return <div key={w} style={{ display: 'flex', justifyContent: 'center' }}><span title={`${fmtDisplay(w)} · ${p}%`} style={{ width: 30, height: 22, borderRadius: 6, background: hexA(col, 0.16), color: col, fontFamily: 'Inter', fontSize: '0.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c}</span></div>
                        })}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color, textAlign: 'right' }}>{pct}%</span>
                          <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color }} /></div>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── MAPA DE CALOR ── */}
        {!loading && visibleClients.length > 0 && (
          <div style={{ ...cardStyle, marginTop: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14, flexWrap: 'wrap' }}>
              <i className="bx bx-grid-alt" style={{ fontSize: 18, color: C.accent }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Mapa de calor · comunicação por semana</span>
              <div style={{ display: 'flex', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
                {[{ c: C.green, l: 'Alta' }, { c: C.yellow, l: 'Média' }, { c: C.red, l: 'Baixa' }].map(x => (
                  <span key={x.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.64rem', color: C.text2 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: x.c }} />{x.l}</span>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 620 }}>
                <div style={{ display: 'grid', gridTemplateColumns: `1.6fr repeat(${weeksWindow.length}, 1fr)`, gap: 6, marginBottom: 6, fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text3, fontWeight: 700 }}>
                  <span>Cliente</span>{weeksWindow.map(w => <span key={w} style={{ textAlign: 'center' }}>{fmtDisplay(w).slice(0, 5)}</span>)}
                </div>
                {visibleClients.map(client => (
                  <div key={client.id} style={{ display: 'grid', gridTemplateColumns: `1.6fr repeat(${weeksWindow.length}, 1fr)`, gap: 6, marginBottom: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.76rem', color: C.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</span>
                    {weeksWindow.map(w => {
                      const c = countFor(client.id, w); const p = c * 20; const col = colorForPct(p)
                      return <div key={w} title={`${fmtDisplay(w)} · ${p}% (${c}/5)`} style={{ height: 30, borderRadius: 7, background: hexA(col, 0.14 + (p / 100) * 0.5), border: `1px solid ${hexA(col, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 800, color: col }}>{c}</div>
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Cards auxiliares ── */
function StatCard({ icon, color, label, value, sub, big }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, backdropFilter: 'blur(12px)', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, background: hexA(color, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><i className={`bx ${icon}`} style={{ fontSize: 15, color }} /></span>
        <span style={{ fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, fontWeight: 700, lineHeight: 1.15 }}>{label}</span>
      </div>
      <div style={{ fontWeight: 900, fontSize: big ? '1.5rem' : '1.35rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: big ? color : C.text }}>{value}</div>
      <div style={{ fontFamily: 'Inter', fontSize: '0.6rem', color: C.text3, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function HighlightCard({ icon, color, title, client, pct }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, backdropFilter: 'blur(12px)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 40, height: 40, borderRadius: 11, background: hexA(color, 0.14), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><i className={`bx ${icon}`} style={{ fontSize: 21, color }} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, fontWeight: 700 }}>{title}</div>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client?.name || '—'}</div>
      </div>
      {client && <div style={{ fontWeight: 900, fontSize: '1.1rem', color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>}
    </div>
  )
}
