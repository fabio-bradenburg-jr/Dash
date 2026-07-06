'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

/* ─── palette (Kinetic Emerald) ─────────────────────────────────────── */
const C = {
  accent: '#26c281', onAccent: '#04150d', primary: '#4fdf9b',
  meta: '#60a5fa', pgl: '#34d399',
  text: '#E5E2E1', text2: 'rgba(229,226,225,0.62)', text3: 'rgba(229,226,225,0.4)', text4: 'rgba(229,226,225,0.26)',
  field: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.1)',
  card: 'rgba(255,255,255,0.02)', panel: '#141416', err: '#ef4444', warn: '#f59e0b',
  sAlvo: '#a78bfa', sQual: '#34d399', sConv: '#10b981', sLead: '#818cf8', sClk: '#38bdf8',
}

/* ─── helpers ───────────────────────────────────────────────────────── */
const money0 = (n) => 'R$ ' + Math.round(n || 0).toLocaleString('pt-BR')
const money2 = (n) => 'R$ ' + (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num = (n) => (n || 0).toLocaleString('pt-BR')
const initials = (s) => { const p = String(s || '').trim().split(/\s+/); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() }
const hexA = (c, a) => { const n = parseInt(String(c).slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
const cprColor = (cpr) => { if (!cpr) return C.text3; if (cpr <= 50) return '#22c55e'; if (cpr <= 100) return C.warn; return C.err }
const getResults = (item) => {
  if (item?.results !== undefined && item.results !== null) return item.results
  const m = item?.custom_metrics
  if (!m) return 0
  const type = m.primaryConversionType || ''
  if (type === 'Compras') return m.purchases || 0
  if (type === 'Leads') return m.leads || 0
  if (type === 'Mensagens') return m.messages || 0
  return Math.max(m.purchases || 0, m.leads || 0, m.messages || 0) || 0
}
const norm = (s) => String(s || '').trim().toLowerCase()

// dashboard preset → since/until (mirrors PerformanceGeneralTab)
function presetToRange(dateRange, customSince, customUntil) {
  const today = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const f = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (dateRange === 'custom' && customSince && customUntil) return { since: customSince, until: customUntil }
  if (dateRange === 'today') return { since: f(today), until: f(today) }
  if (dateRange === 'yesterday') { const y = new Date(today); y.setDate(y.getDate() - 1); return { since: f(y), until: f(y) } }
  if (dateRange === 'last_7d') { const s = new Date(today); s.setDate(s.getDate() - 6); return { since: f(s), until: f(today) } }
  if (dateRange === 'last_14d') { const s = new Date(today); s.setDate(s.getDate() - 13); return { since: f(s), until: f(today) } }
  if (dateRange === 'last_30d') { const s = new Date(today); s.setDate(s.getDate() - 29); return { since: f(s), until: f(today) } }
  if (dateRange === 'this_month') return { since: f(new Date(today.getFullYear(), today.getMonth(), 1)), until: f(today) }
  if (dateRange === 'last_month') return { since: f(new Date(today.getFullYear(), today.getMonth() - 1, 1)), until: f(new Date(today.getFullYear(), today.getMonth(), 0)) }
  return { since: '', until: '' }
}

const STAGE_ICON = { alvo: 'bx-target-lock', qual: 'bx-badge-check', conv: 'bx-trophy', perdido: 'bx-x-circle', semresp: 'bx-time-five' }

// default status→stage config from the API's own classification
function defaultCfg(statusDist) {
  const byClass = (cls) => statusDist.filter((s) => s.class === cls).map((s) => s.label)
  const notLossNoresp = statusDist.filter((s) => s.class !== 'lost' && s.class !== 'noreply').map((s) => s.label)
  return {
    stages: [
      { key: 'alvo', label: 'Público-alvo', color: C.sAlvo, icon: STAGE_ICON.alvo, kind: 'funnel', statuses: notLossNoresp },
      { key: 'qual', label: 'Qualificados', color: C.sQual, icon: STAGE_ICON.qual, kind: 'funnel', statuses: [...new Set([...byClass('qualified'), ...byClass('converted')])] },
      { key: 'conv', label: 'Convertidos', color: C.sConv, icon: STAGE_ICON.conv, kind: 'funnel', statuses: byClass('converted') },
      { key: 'perdido', label: 'Perdidos', color: C.err, icon: STAGE_ICON.perdido, kind: 'loss', statuses: byClass('lost') },
      { key: 'semresp', label: 'Sem resposta', color: C.warn, icon: STAGE_ICON.semresp, kind: 'loss', statuses: byClass('noreply') },
    ],
  }
}

/* ─── mini line chart ───────────────────────────────────────────────── */
function TimelineChart({ series }) {
  const W = 1100, H = 220, padL = 10, padR = 10, padT = 12, padB = 22
  const n = series[0]?.vals.length || 0
  if (n < 2) return <div style={{ padding: '30px 0', textAlign: 'center', color: C.text3, fontSize: '0.82rem' }}>Sem série temporal suficiente.</div>
  const maxV = Math.max(1, ...series.flatMap((s) => s.vals))
  const x = (i) => padL + i * (W - padL - padR) / (n - 1)
  const y = (v) => padT + (1 - v / maxV) * (H - padT - padB)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 220, display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map((fr, i) => (
        <line key={i} x1={padL} x2={W - padR} y1={padT + fr * (H - padT - padB)} y2={padT + fr * (H - padT - padB)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {series.map((s, si) => (
        <polyline key={si} points={s.vals.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {series.flatMap((s, si) => s.vals.map((v, i) => <circle key={si + '-' + i} cx={x(i)} cy={y(v)} r={2.2} fill={s.color} />))}
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Funil de Performance — Meta Ads + Planilha de Leads (PGL)
   ═══════════════════════════════════════════════════════════════════════ */
export default function FunilPerformanceTab({
  clients = [],
  campaignOverviewRows = [],
  campaignOverviewLoading = false,
  metaRequestHeaders,
  dateRange,
  customSince,
  customUntil,
  draftDateRange,
  setDraftDateRange,
  handleApplyDashboardFilters,
  onRefreshCampaigns,
  DATE_PRESETS = [],
}) {
  const [selectedId, setSelectedId] = useState(null)
  const [selOpen, setSelOpen] = useState(false)
  const [selSearch, setSelSearch] = useState('')
  const [selected, setSelected] = useState({})       // meta node selection (path → true)
  const [expanded, setExpanded] = useState({})
  const [sheetData, setSheetData] = useState(null)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [demo, setDemo] = useState(null)
  const [cfgMap, setCfgMap] = useState({})           // clientId → { stages }
  const [statusMenu, setStatusMenu] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newStage, setNewStage] = useState('')
  const [modal, setModal] = useState(null)

  const client = useMemo(() => clients.find((c) => c.id === selectedId) || clients[0] || null, [clients, selectedId])
  useEffect(() => { if (!selectedId && clients[0]) setSelectedId(clients[0].id) }, [clients, selectedId])

  const campaignRow = useMemo(
    () => campaignOverviewRows.find((r) => r.clientId === client?.id) || null,
    [campaignOverviewRows, client],
  )
  const campaigns = campaignRow?.campaigns || []
  const hasPgl = !!client?.leadsSheetUrl

  /* leads-analytics fetch (per client) */
  useEffect(() => {
    if (!client?.leadsSheetUrl) { setSheetData(null); return }
    if (dateRange === 'custom' && (!customSince || !customUntil)) return
    let cancelled = false
    setSheetLoading(true)
    const { since, until } = presetToRange(dateRange, customSince, customUntil)
    const params = new URLSearchParams({ url: client.leadsSheetUrl, gid: 'all' })
    if (client.googleSheetsHeaderRow) params.set('header_row', String(client.googleSheetsHeaderRow))
    if (since) params.set('since', since)
    if (until) params.set('until', until)
    fetch('/api/google-sheets/leads-analytics?' + params.toString())
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSheetData(d?.overview ? d : null) })
      .catch(() => { if (!cancelled) setSheetData(null) })
      .finally(() => { if (!cancelled) setSheetLoading(false) })
    return () => { cancelled = true }
  }, [client?.id, client?.leadsSheetUrl, client?.googleSheetsHeaderRow, dateRange, customSince, customUntil])

  /* demographics (Meta breakdowns) */
  useEffect(() => {
    const acc = String(client?.metaAdAccountId || '').replace(/^act_/, '')
    if (!acc) { setDemo(null); return }
    if (dateRange === 'custom' && (!customSince || !customUntil)) return
    let cancelled = false
    const params = new URLSearchParams({ ad_account_id: acc })
    if (dateRange === 'custom' && customSince && customUntil) { params.set('since', customSince); params.set('until', customUntil) }
    else params.set('date_preset', dateRange || 'last_7d')
    fetch('/api/meta/breakdowns?' + params.toString(), { headers: metaRequestHeaders || {} })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setDemo(d?.states !== undefined ? d : null) })
      .catch(() => { if (!cancelled) setDemo(null) })
    return () => { cancelled = true }
  }, [client?.id, client?.metaAdAccountId, dateRange, customSince, customUntil, metaRequestHeaders])

  // reset selection when client changes
  useEffect(() => { setSelected({}); setExpanded({}); setStatusMenu(null) }, [client?.id])

  const statusDist = sheetData?.statusDist || []
  const cfg = useMemo(() => {
    if (cfgMap[client?.id]) return cfgMap[client.id]
    return defaultCfg(statusDist)
  }, [cfgMap, client, statusDist])

  const saveCfg = (next) => { if (client) setCfgMap((m) => ({ ...m, [client.id]: next })) }
  const statusCount = (label) => (statusDist.find((s) => s.label === label)?.count || 0)
  const stageSum = (st) => (st.statuses || []).reduce((a, l) => a + statusCount(l), 0)
  const toggleStatus = (stageKey, label) => {
    const next = JSON.parse(JSON.stringify(cfg))
    const st = next.stages.find((x) => x.key === stageKey); if (!st) return
    const i = st.statuses.indexOf(label)
    if (i >= 0) st.statuses.splice(i, 1); else st.statuses.push(label)
    saveCfg(next)
  }
  const addStage = () => {
    const name = newStage.trim(); if (!name) return
    const cols = ['#38bdf8', '#818cf8', '#f472b6', '#2dd4bf', '#fbbf24', '#c084fc']
    const next = JSON.parse(JSON.stringify(cfg))
    next.stages.push({ key: 's' + Date.now(), label: name, color: cols[next.stages.length % cols.length], icon: 'bx-flag', kind: 'funnel', statuses: [] })
    setNewStage(''); setAddOpen(false); saveCfg(next)
  }
  const removeStage = (key) => { const next = JSON.parse(JSON.stringify(cfg)); next.stages = next.stages.filter((x) => x.key !== key); saveCfg(next) }

  /* ── meta node tree + selection aggregation ── */
  const allNodes = useMemo(() => {
    const out = []
    campaigns.forEach((c) => {
      out.push({ path: c.campaignId || c.name, node: c, level: 0 })
      ;(c.adsets || []).forEach((s) => {
        const sp = (c.campaignId || c.name) + '>' + (s.adsetId || s.name)
        out.push({ path: sp, node: s, level: 1 })
        ;(s.ads || []).forEach((a) => out.push({ path: sp + '>' + (a.adId || a.name), node: a, level: 2 }))
      })
    })
    return out
  }, [campaigns])

  const metaAgg = useMemo(() => {
    const keys = ['impressions', 'clicks', 'spend']
    const acc = { impressions: 0, clicks: 0, spend: 0, results: 0 }
    const add = (n) => { keys.forEach((k) => { acc[k] += n[k] || 0 }); acc.results += getResults(n) || 0 }
    const paths = Object.keys(selected)
    if (paths.length === 0) {
      if (campaignRow?.totals) { acc.impressions = campaignRow.totals.impressions || 0; acc.clicks = campaignRow.totals.clicks || 0; acc.spend = campaignRow.totals.spend || 0; acc.results = campaignRow.totals.results || 0 }
      else campaigns.forEach(add)
    } else {
      paths.forEach((p) => { const hit = allNodes.find((x) => x.path === p); if (hit) add(hit.node) })
    }
    return acc
  }, [selected, campaigns, campaignRow, allNodes])

  // sheet buckets lookup for per-node PGL columns
  const sheetLookup = useMemo(() => {
    const map = { byId: {}, byName: {} }
    const feed = (arr) => (arr || []).forEach((b) => { if (b.id) map.byId[String(b.id)] = b; map.byName[norm(b.name)] = b })
    feed(sheetData?.campaigns); feed(sheetData?.adsets); feed(sheetData?.ads)
    return map
  }, [sheetData])
  const pglFor = (node) => {
    const id = node.campaignId || node.adsetId || node.adId
    return (id && sheetLookup.byId[String(id)]) || sheetLookup.byName[norm(node.name)] || null
  }

  /* ── funnel model ── */
  const totalPgl = hasPgl ? (sheetData?.overview?.total || 0) : 0
  const stageVal = (key) => { const st = cfg.stages.find((x) => x.key === key); return st ? stageSum(st) : 0 }
  const alvo = stageVal('alvo'), qual = stageVal('qual'), conv = stageVal('conv')
  const impr = metaAgg.impressions, clicks = metaAgg.clicks, inv = metaAgg.spend
  const ctr = impr ? (clicks / impr * 100) : 0, cpc = clicks ? (inv / clicks) : 0, cpl = totalPgl ? (inv / totalPgl) : 0
  const txQual = totalPgl ? (qual / totalPgl * 100) : 0, txConv = totalPgl ? (conv / totalPgl * 100) : 0
  const perdaPct = totalPgl ? ((totalPgl - conv) / totalPgl * 100) : 0

  const flow = [
    { label: 'Impressões', icon: 'bx-show', color: '#6b7280', origin: 'Meta', val: impr },
    { label: 'Cliques', icon: 'bx-mouse', color: C.sClk, origin: 'Meta', val: clicks },
    { label: 'Leads', icon: 'bx-user-plus', color: C.sLead, origin: 'PGL', val: totalPgl },
    ...(hasPgl ? cfg.stages.filter((x) => x.kind === 'funnel').map((st) => ({ label: st.label, icon: st.icon, color: st.color, origin: 'PGL', val: stageSum(st) })) : []),
  ]
  const funnel = flow.map((st, i) => {
    const prev = i > 0 ? flow[i - 1].val : null
    const dim = st.origin === 'PGL' && !hasPgl
    const loss = prev != null ? (prev - st.val) : 0
    return {
      ...st, dim,
      color: dim ? C.text3 : st.color,
      barH: dim ? 6 : Math.max(6, Math.round((impr > 0 ? st.val / impr : 0) * 60)),
      prevPct: prev != null ? (prev > 0 ? Math.round(st.val / prev * 100) : 0) + '% da etapa' : '100%',
      imprPct: impr > 0 ? (Math.round(st.val / impr * 1000) / 10) + '% impr.' : '',
      hasNext: i < flow.length - 1,
      hasLoss: i < flow.length - 1 && !dim && loss > 0 && prev > 0,
      lossPct: '-' + (prev > 0 ? Math.round(loss / prev * 100) : 0) + '%',
    }
  })
  const lossCards = hasPgl ? cfg.stages.filter((x) => x.kind === 'loss').map((st) => { const v = stageSum(st); return { label: st.label, icon: st.icon, color: st.color, value: num(v), pct: totalPgl ? Math.round(v / totalPgl * 100) + '%' : '—' } }) : []

  /* ── tree rows ── */
  const treeRows = []
  const badgeStyle = (kind) => { const map = { Camp: [C.primary, 0.16], Conj: [C.sClk, 0.16], Ad: [C.sAlvo, 0.16] }; const [col, a] = map[kind]; return { fontFamily: 'Inter', fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 5, background: hexA(col, a), color: col, flex: 'none' } }
  const isExp = (k) => (k in expanded) ? expanded[k] : (k.split('>').length === 1)
  const pushRow = (node, path, level, kind) => {
    const kids = node.adsets || node.ads || []
    const exp = isExp(path)
    const p = pglFor(node)
    const res = getResults(node)
    const cpr = res > 0 ? (node.spend || 0) / res : null
    treeRows.push({
      path, badge: kind, kind, level, name: node.name || 'Sem nome',
      active: (node.effectiveStatus === 'ACTIVE') || (node.status === 'ativa'),
      inv: money0(node.spend || 0), res: num(res), cpr: cpr ? money2(cpr) : '—', cprColor: cprColor(cpr),
      leads: hasPgl ? num(p?.total || 0) : '—', alvo: hasPgl ? num(p?.publicoAlvo || 0) : '—',
      qual: hasPgl ? num(p?.qualified || 0) : '—', conv: hasPgl ? num(p?.converted || 0) : '—',
      txq: hasPgl && p?.total ? Math.round((p.qualified || 0) / p.total * 100) + '%' : '—',
      expandable: kids.length > 0, exp, selected: !!selected[path], indent: level * 22,
    })
    if (exp) kids.forEach((k) => pushRow(k, path + '>' + (k.adsetId || k.adId || k.name), level + 1, kind === 'Camp' ? 'Conj' : 'Ad'))
  }
  campaigns.forEach((c) => pushRow(c, c.campaignId || c.name, 0, 'Camp'))

  const selectNode = (path, ev) => {
    const multi = ev && (ev.ctrlKey || ev.metaKey)
    setSelected((cur) => {
      if (multi) { const n = { ...cur }; if (n[path]) delete n[path]; else n[path] = true; return n }
      const only = cur[path] && Object.keys(cur).length === 1
      return only ? {} : { [path]: true }
    })
  }
  const nSel = Object.keys(selected).length

  /* ── metrics ── */
  const metrics = [
    { label: 'Investimento', icon: 'bx-dollar-circle', color: C.accent, value: money0(inv), sub: 'no período', vc: C.accent },
    { label: 'CTR', icon: 'bx-mouse', color: C.sClk, value: ctr.toFixed(2).replace('.', ',') + '%', sub: 'cliques/impr.' },
    { label: 'CPC', icon: 'bx-mouse-alt', color: C.meta, value: money2(cpc), sub: 'custo/clique' },
    { label: 'CPL', icon: 'bx-user-plus', color: C.sLead, value: hasPgl ? money2(cpl) : '—', sub: hasPgl ? totalPgl + ' leads' : 'sem PGL' },
    { label: 'Taxa Qualif.', icon: 'bx-badge-check', color: C.sQual, value: hasPgl ? Math.round(txQual) + '%' : '—', sub: 'leads → qualif.' },
    { label: 'Taxa Conversão', icon: 'bx-trophy', color: C.sConv, value: hasPgl ? Math.round(txConv) + '%' : '—', sub: 'leads → vendas' },
    { label: 'Taxa Perda', icon: 'bx-trending-down', color: C.err, value: hasPgl ? Math.round(perdaPct) + '%' : '—', sub: 'leads → perda' },
  ]

  /* ── alerts ── */
  const alerts = []
  if (hasPgl && totalPgl > 0) {
    if (txQual < 20) alerts.push({ color: C.err, icon: 'bx-error-circle', title: 'Gargalo de qualificação:', text: `apenas ${Math.round(txQual)}% dos leads são qualificados.` })
    else if (txQual < 45) alerts.push({ color: C.warn, icon: 'bx-error', title: 'Qualificação abaixo do ideal:', text: `${Math.round(txQual)}% dos leads qualificados.` })
    const closeRate = qual ? (conv / qual * 100) : 0
    if (closeRate < 40 && qual > 0) alerts.push({ color: C.sClk, icon: 'bx-info-circle', title: 'Taxa de fechamento baixa:', text: `${Math.round(closeRate)}% dos qualificados convertidos.` })
  }

  /* ── creatives (top 5 by results) ── */
  const creatives = useMemo(() => {
    const ads = allNodes.filter((x) => x.level === 2).map((x) => x.node)
    return [...ads].sort((a, b) => getResults(b) - getResults(a)).slice(0, 5).map((a, i) => {
      const res = getResults(a); const cpr = res > 0 ? (a.spend || 0) / res : null
      return { rank: '#' + (i + 1), rankColor: [C.primary, C.accent, C.sQual, C.text2, C.text3][i] || C.text3, name: a.name, res: num(res), cpr: money2(cpr), cprColor: cprColor(cpr), thumb: a.thumbnailUrl || a.creativeThumbnailUrl || a.imageUrl || null, video: !!(a.creativeType === 'VIDEO' || a.video), _ad: a }
    })
  }, [allNodes])

  /* ── demographics ── */
  const demoRows = (arr) => {
    const rows = (arr || []).map((r) => ({ label: r.label, v: (r.custom_metrics?.totalConversions ?? 0) || r.impressions || 0 }))
    const sum = rows.reduce((a, r) => a + r.v, 0) || 1
    return rows.slice(0, 5).map((r) => ({ label: r.label, pct: Math.round(r.v / sum * 100) }))
  }
  const states = demo ? demoRows(demo.states) : []
  const ages = demo ? demoRows(demo.ages) : []
  const genders = demo ? demoRows(demo.genders) : []

  /* ── timeline (from sheet) ── */
  const timeline = sheetData?.timeline || []
  const tSeries = [
    { color: C.sLead, label: 'Leads', vals: timeline.map((t) => t.total || 0) },
    { color: C.sQual, label: 'Qualif.', vals: timeline.map((t) => t.qualified || 0) },
    { color: C.sConv, label: 'Conver.', vals: timeline.map((t) => t.converted || 0) },
    { color: C.err, label: 'Perdidos', vals: timeline.map((t) => t.lost || 0) },
  ]

  /* ── weekly CPL (leads from sheet timeline, inv proportional) ── */
  const weekly = useMemo(() => {
    if (!timeline.length || !totalPgl) return []
    const nWeeks = Math.min(6, Math.max(1, Math.ceil(timeline.length / 7)))
    const chunk = Math.ceil(timeline.length / nWeeks)
    const out = []
    for (let w = 0; w < nWeeks; w++) {
      const slice = timeline.slice(w * chunk, (w + 1) * chunk)
      if (!slice.length) continue
      const wl = slice.reduce((a, t) => a + (t.total || 0), 0)
      const wi = Math.round(inv * (wl / totalPgl))
      out.push({ label: 'Sem ' + (w + 1), range: `${slice[0].date?.slice(5)}–${slice[slice.length - 1].date?.slice(5)}`, leads: num(wl), inv: money0(wi), cpl: money2(wl ? wi / wl : 0), cplColor: cprColor(wl ? wi / wl : 0), _cpl: wl ? wi / wl : 0 })
    }
    const maxCpl = Math.max(...out.map((x) => x._cpl), 1)
    return out.map((x) => ({ ...x, barPct: Math.round(x._cpl / maxCpl * 100) }))
  }, [timeline, totalPgl, inv])
  const avgCpl = totalPgl > 0 ? money2(inv / totalPgl) : '—'

  const usedStatuses = new Set(); cfg.stages.forEach((st) => (st.statuses || []).forEach((n) => usedStatuses.add(n)))
  const unmapped = statusDist.filter((s) => !usedStatuses.has(s.label))
  const filterBadge = nSel === 0 ? 'Cliente completo' : (nSel + ' seleç' + (nSel > 1 ? 'ões' : 'ão'))

  if (!client) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Nenhum cliente disponível.</div>
  }

  const iconBtn = { width: 42, height: 42, borderRadius: 11, border: `1px solid ${C.border2}`, background: C.field, color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }

  const clientOptions = clients.filter((c) => !selSearch || norm(c.name).includes(norm(selSearch)))

  return (
    <div className="funil-perf" style={{ minHeight: '100%', background: 'radial-gradient(ellipse 90% 55% at 55% -10%, rgba(38,194,129,0.06), transparent 60%)', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", overflowY: 'auto' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 20px 90px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.11em', color: C.accent, fontWeight: 700, background: hexA('#26c281', 0.12), border: `1px solid ${hexA('#26c281', 0.3)}`, padding: '5px 11px', borderRadius: 99, marginBottom: 11 }}>
              <i className="bx bx-filter-alt" style={{ fontSize: 14 }} />Funil de Performance
            </div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.6vw,2rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>{client.name}</h1>
            <p style={{ margin: '8px 0 0', color: C.text2, fontSize: '0.86rem' }}>{hasPgl ? 'Meta Ads + planilha de leads unidos no funil.' : 'Planilha não configurada — apenas dados Meta.'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setSelOpen((v) => !v)} style={{ height: 42, padding: '0 12px', borderRadius: 11, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: client.dashboardColor || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem', color: '#fff' }}>{initials(client.name)}</span>
                {client.name}<i className="bx bx-chevron-down" style={{ fontSize: 18, color: C.text3 }} />
              </button>
              {selOpen && (
                <div style={{ position: 'absolute', top: 48, right: 0, zIndex: 30, width: 280, background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 13, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                  <div style={{ padding: 10, borderBottom: `1px solid ${C.border}`, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <i className="bx bx-search" style={{ position: 'absolute', left: 20, fontSize: 16, color: C.text3 }} />
                    <input value={selSearch} onChange={(e) => setSelSearch(e.target.value)} placeholder="Buscar cliente…" style={{ width: '100%', height: 34, padding: '0 12px 0 33px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.82rem', outline: 'none' }} />
                  </div>
                  <div style={{ maxHeight: 280, overflowY: 'auto', padding: 6 }}>
                    {clientOptions.map((c) => (
                      <button key={c.id} type="button" onClick={() => { setSelectedId(c.id); setSelOpen(false); setSelSearch('') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px', borderRadius: 9, border: 'none', cursor: 'pointer', background: c.id === client.id ? hexA('#26c281', 0.1) : 'transparent', color: C.text }}>
                        <span style={{ width: 26, height: 26, borderRadius: 7, background: c.dashboardColor || C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.6rem', color: '#fff', flex: 'none' }}>{initials(c.name)}</span>
                        <span style={{ flex: 1, textAlign: 'left', fontSize: '0.84rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        {c.leadsSheetUrl && <i className="bx bx-spreadsheet" title="Tem planilha de leads" style={{ fontSize: 15, color: C.pgl }} />}
                        {c.id === client.id && <i className="bx bx-check" style={{ fontSize: 16, color: C.accent }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => onRefreshCampaigns?.()} title="Atualizar" style={iconBtn}><i className={'bx ' + (campaignOverviewLoading ? 'bx-loader-alt bx-spin' : 'bx-refresh')} style={{ fontSize: 18 }} /></button>
            {DATE_PRESETS.length > 0 && (
              <label style={{ ...iconBtn, width: 'auto', padding: '0 12px', gap: 6, color: C.text }}>
                <i className="bx bx-calendar" style={{ fontSize: 16, color: C.text3 }} />
                <select value={draftDateRange} onChange={(e) => { setDraftDateRange?.(e.target.value); setTimeout(() => handleApplyDashboardFilters?.(), 0) }} style={{ background: 'transparent', border: 'none', color: C.text, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}>
                  {DATE_PRESETS.map((p) => <option key={p.value} value={p.value} style={{ color: '#000' }}>{p.label}</option>)}
                </select>
              </label>
            )}
          </div>
        </div>

        {/* FUNNEL BAND */}
        <div style={{ marginTop: 16, border: `1px solid ${C.border}`, borderRadius: 16, background: 'linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))', padding: '18px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <i className="bx bx-filter-alt" style={{ fontSize: 19, color: C.accent }} />
              <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Jornada do funil</span>
              <span style={{ fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 600, padding: '4px 11px', borderRadius: 99, background: hexA('#26c281', 0.12), border: `1px solid ${hexA('#26c281', 0.3)}`, color: C.accent }}>{filterBadge}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.62rem', color: C.text2 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: C.meta }} />Meta Ads</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.62rem', color: C.text2 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: C.pgl }} />Planilha de leads</span>
            </div>
          </div>
          {sheetLoading && !sheetData ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: C.text3 }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: 26, color: C.accent }} /></div>
          ) : (
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'stretch', minWidth: 840 }}>
                {funnel.map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0, border: `1px solid ${st.dim ? C.border : hexA(st.color, 0.18)}`, borderTop: `2px solid ${st.color}`, borderRadius: 13, background: st.dim ? C.field : hexA(st.color, 0.05), padding: '13px 13px 12px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
                        <span style={{ width: 26, height: 26, borderRadius: 7, background: hexA(st.color === C.text3 ? '#6b7280' : st.color, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><i className={'bx ' + st.icon} style={{ fontSize: 15, color: st.color }} /></span>
                        <span style={{ fontFamily: 'Inter', fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 99, background: st.origin === 'Meta' ? hexA('#60a5fa', 0.16) : hexA('#34d399', 0.16), color: st.origin === 'Meta' ? C.meta : C.pgl }}>{st.origin}</span>
                      </div>
                      <div style={{ fontFamily: 'Inter', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: C.text3, fontWeight: 600, marginBottom: 3 }}>{st.label}</div>
                      <div style={{ fontWeight: 800, fontSize: '1.55rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: st.color, lineHeight: 1 }}>{st.dim ? '—' : num(st.val)}</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginTop: 12, minHeight: 60 }}><div style={{ width: '100%', height: st.barH, borderRadius: '7px 7px 0 0', background: `linear-gradient(180deg,${st.color},${hexA(st.color === C.text3 ? '#6b7280' : st.color, 0.15)})` }} /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: '0.58rem', color: C.text3, marginTop: 8 }}><span>↳ {st.dim ? '—' : st.prevPct}</span><span style={{ color: C.text4 }}>{st.imprPct}</span></div>
                    </div>
                    {st.hasNext && (
                      <div style={{ width: 54, flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 20 }}>
                        <i className="bx bx-chevron-right" style={{ fontSize: 20, color: C.text4 }} />
                        {st.hasLoss && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '4px 5px', borderRadius: 8, background: hexA('#ef4444', 0.1), border: `1px solid ${hexA('#ef4444', 0.22)}` }}>
                            <i className="bx bx-trending-down" style={{ fontSize: 12, color: C.err }} />
                            <span style={{ fontFamily: 'Inter', fontSize: '0.52rem', fontWeight: 700, color: C.err, whiteSpace: 'nowrap' }}>{st.lossPct}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasPgl && (lossCards.length > 0 || totalPgl > 0) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              {lossCards.map((lc, i) => (
                <div key={i} style={{ flex: 1, minWidth: 130, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 11, background: hexA(lc.color, 0.08), border: `1px solid ${hexA(lc.color, 0.22)}` }}>
                  <i className={'bx ' + lc.icon} style={{ fontSize: 20, color: lc.color }} />
                  <div><div style={{ fontWeight: 800, fontSize: '1.15rem', color: lc.color, fontVariantNumeric: 'tabular-nums' }}>{lc.value}</div><div style={{ fontFamily: 'Inter', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text3 }}>{lc.label} · {lc.pct}</div></div>
                </div>
              ))}
              {[{ label: 'Qualificação', icon: 'bx-badge-check', color: C.sQual, value: Math.round(txQual) + '%' }, { label: 'Conversão', icon: 'bx-trophy', color: C.sConv, value: Math.round(txConv) + '%' }].map((rt, i) => (
                <div key={'r' + i} style={{ flex: 1, minWidth: 130, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 11, background: C.field, border: `1px solid ${C.border}` }}>
                  <i className={'bx ' + rt.icon} style={{ fontSize: 20, color: rt.color }} />
                  <div><div style={{ fontWeight: 800, fontSize: '1.15rem', color: rt.color, fontVariantNumeric: 'tabular-nums' }}>{rt.value}</div><div style={{ fontFamily: 'Inter', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text3 }}>{rt.label}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* METRIC CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 11, marginTop: 14 }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ padding: '13px 14px', borderRadius: 13, background: C.card, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}><span style={{ width: 26, height: 26, borderRadius: 8, background: hexA(m.color, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><i className={'bx ' + m.icon} style={{ fontSize: 15, color: m.color }} /></span><span style={{ fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.text3, fontWeight: 600, lineHeight: 1.15 }}>{m.label}</span></div>
              <div style={{ fontWeight: 800, fontSize: '1.35rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: m.vc || C.text }}>{m.value}</div>
              <div style={{ fontFamily: 'Inter', fontSize: '0.6rem', color: C.text3, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ALERTS */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', borderRadius: 11, background: hexA(a.color, 0.08), borderLeft: `3px solid ${a.color}` }}>
                <i className={'bx ' + a.icon} style={{ fontSize: 19, color: a.color, flex: 'none' }} />
                <span style={{ fontSize: '0.84rem', color: C.text }}><strong style={{ color: a.color }}>{a.title}</strong> {a.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* TREE */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, overflow: 'hidden', marginTop: 16 }}>
          <div style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i className="bx bx-sitemap" style={{ fontSize: 18, color: C.accent }} /><span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Árvore de campanhas</span><span style={{ fontFamily: 'Inter', fontSize: '0.64rem', color: C.text3 }}>clique para filtrar o funil · ctrl/cmd multi-seleciona</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontFamily: 'Inter', fontSize: '0.66rem', color: C.text3 }}>{nSel === 0 ? 'Nenhuma seleção — funil do cliente' : (nSel + ' selecionada' + (nSel > 1 ? 's' : ''))}</span>
              {nSel > 0 && <button type="button" onClick={() => setSelected({})} style={{ height: 26, padding: '0 10px', borderRadius: 99, border: `1px solid ${C.border2}`, background: 'transparent', color: C.text2, fontFamily: 'Inter', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}>Limpar</button>}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 760 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 0.9fr 0.7fr 0.9fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr', gap: 8, padding: '9px 16px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 600 }}>
                <span>Campanha</span><span style={{ textAlign: 'right' }}>Invest.</span><span style={{ textAlign: 'right' }}>Result.</span><span style={{ textAlign: 'right' }}>CPR</span><span style={{ textAlign: 'right' }}>Leads</span><span style={{ textAlign: 'right' }}>Púb.</span><span style={{ textAlign: 'right' }}>Qual.</span><span style={{ textAlign: 'right' }}>Conv.</span><span style={{ textAlign: 'right' }}>Tx.Q</span>
              </div>
              {campaignOverviewLoading && !campaigns.length ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: C.text3 }}><i className="bx bx-loader-alt bx-spin" style={{ fontSize: 22 }} /></div>
              ) : !campaigns.length ? (
                <div style={{ padding: '30px 16px', textAlign: 'center', color: C.text3, fontSize: '0.84rem' }}>Sem campanhas no período.</div>
              ) : treeRows.map((r) => (
                <div key={r.path}>
                  <div onClick={(e) => selectNode(r.path, e)} style={{ display: 'grid', gridTemplateColumns: '2.1fr 0.9fr 0.7fr 0.9fr 0.6fr 0.6fr 0.6fr 0.6fr 0.6fr', gap: 8, alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', background: r.selected ? hexA('#26c281', 0.1) : 'transparent', boxShadow: r.selected ? `inset 2px 0 0 ${C.accent}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, paddingLeft: r.indent }}>
                      {r.expandable ? <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded((x) => ({ ...x, [r.path]: !isExp(r.path) })) }} style={{ border: 'none', background: 'none', color: C.text3, cursor: 'pointer', padding: 0, display: 'flex', flex: 'none' }}><i className={'bx ' + (r.exp ? 'bx-chevron-down' : 'bx-chevron-right')} style={{ fontSize: 16 }} /></button> : <span style={{ width: 16, flex: 'none' }} />}
                      <span style={badgeStyle(r.kind)}>{r.badge}</span>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: r.active ? '#22c55e' : '#6b7280', boxShadow: r.active ? '0 0 6px rgba(34,197,94,0.6)' : 'none', flex: 'none' }} />
                      <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                      {r.selected && <i className="bx bx-check-circle" style={{ fontSize: 14, color: C.accent, flex: 'none' }} />}
                    </div>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.76rem', fontVariantNumeric: 'tabular-nums' }}>{r.inv}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.76rem', fontVariantNumeric: 'tabular-nums' }}>{r.res}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.76rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: r.cprColor }}>{r.cpr}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.74rem', color: C.text2, fontVariantNumeric: 'tabular-nums' }}>{r.leads}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.74rem', color: C.text2, fontVariantNumeric: 'tabular-nums' }}>{r.alvo}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.74rem', color: C.text2, fontVariantNumeric: 'tabular-nums' }}>{r.qual}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.74rem', color: C.text2, fontVariantNumeric: 'tabular-nums' }}>{r.conv}</span>
                    <span style={{ textAlign: 'right', fontFamily: 'Inter', fontSize: '0.74rem', color: C.sQual, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.txq}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP CRIATIVOS + DEMOGRAPHICS */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><i className="bx bx-image" style={{ fontSize: 17, color: C.sAlvo }} /><span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Top 5 Criativos</span></div>
            {creatives.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {creatives.map((c, i) => (
                  <div key={i} onClick={() => setModal(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, cursor: 'pointer', border: `1px solid ${C.border}`, background: C.field }}>
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: c.rankColor, width: 16, flex: 'none' }}>{c.rank}</span>
                    <div style={{ width: 40, height: 40, borderRadius: 9, overflow: 'hidden', flex: 'none', position: 'relative', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.thumb ? <img src={c.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="bx bx-image" style={{ fontSize: 18, color: C.text4 }} />}
                      {c.video && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}><i className="bx bxs-right-arrow" style={{ fontSize: 12, color: '#fff' }} /></span>}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div><div style={{ fontFamily: 'Inter', fontSize: '0.62rem', color: c.cprColor, fontWeight: 600, marginTop: 1 }}>{c.cpr} · {c.res} res</div></div>
                  </div>
                ))}
              </div>
            ) : <div style={{ padding: '20px 0', textAlign: 'center', color: C.text3, fontSize: '0.82rem' }}>Sem anúncios no período.</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[{ t: 'Top Estados', icon: 'bx-map', color: C.sClk, rows: states }, { t: 'Top Idades', icon: 'bx-user', color: C.sAlvo, rows: ages }].map((blk, bi) => (
              <div key={bi} style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><i className={'bx ' + blk.icon} style={{ fontSize: 16, color: blk.color }} /><span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{blk.t}</span></div>
                {blk.rows.length ? blk.rows.map((r, i) => (
                  <div key={i} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: '0.72rem', marginBottom: 3 }}><span style={{ color: C.text2 }}>{r.label}</span><span style={{ fontWeight: 700 }}>{r.pct}%</span></div>
                    <div style={{ height: 6, borderRadius: 99, background: C.field, overflow: 'hidden' }}><div style={{ height: '100%', width: r.pct + '%', borderRadius: 99, background: blk.color }} /></div>
                  </div>
                )) : <div style={{ color: C.text3, fontSize: '0.78rem', fontFamily: 'Inter' }}>Sem dados de demografia.</div>}
              </div>
            ))}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, padding: 14, gridColumn: '1/-1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><i className="bx bx-male-female" style={{ fontSize: 16, color: C.meta }} /><span style={{ fontWeight: 700, fontSize: '0.84rem' }}>Gênero</span></div>
              {genders.length ? (
                <div style={{ display: 'flex', gap: 14 }}>
                  {genders.map((g, i) => (
                    <div key={i} style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter', fontSize: '0.72rem', marginBottom: 3 }}><span style={{ color: C.text2 }}>{g.label}</span><span style={{ fontWeight: 700 }}>{g.pct}%</span></div>
                      <div style={{ height: 8, borderRadius: 99, background: C.field, overflow: 'hidden' }}><div style={{ height: '100%', width: g.pct + '%', borderRadius: 99, background: C.meta }} /></div>
                    </div>
                  ))}
                </div>
              ) : <div style={{ color: C.text3, fontSize: '0.78rem', fontFamily: 'Inter' }}>Sem dados de gênero.</div>}
            </div>
          </div>
        </div>

        {/* TIMELINE */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, padding: '16px 18px', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><i className="bx bx-line-chart" style={{ fontSize: 18, color: C.accent }} /><span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Evolução Temporal</span></div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{tSeries.map((l, i) => <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.66rem', color: C.text2 }}><span style={{ width: 12, height: 3, borderRadius: 2, background: l.color }} />{l.label}</span>)}</div>
          </div>
          {hasPgl ? <TimelineChart series={tSeries} /> : <div style={{ padding: '30px 0', textAlign: 'center', color: C.text3, fontSize: '0.84rem' }}>Sem planilha de leads para a linha do tempo.</div>}
        </div>

        {/* WEEKLY CPL */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, padding: '16px 18px', marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><i className="bx bx-dollar-circle" style={{ fontSize: 18, color: C.sLead }} /><span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Custo por lead · semana a semana</span><span style={{ fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 600, padding: '4px 11px', borderRadius: 99, background: hexA('#26c281', 0.12), border: `1px solid ${hexA('#26c281', 0.3)}`, color: C.accent }}>{filterBadge}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 600 }}>CPL médio</span><span style={{ fontWeight: 800, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums', color: C.sLead }}>{avgCpl}</span></div>
          </div>
          {weekly.length ? (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: 10, minWidth: 640 }}>
                {weekly.map((w, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 96, border: `1px solid ${C.border}`, borderRadius: 12, background: C.field, padding: '12px 12px 10px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontFamily: 'Inter', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 700 }}>{w.label}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', color: C.text4, marginBottom: 9 }}>{w.range}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.3rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: w.cplColor, lineHeight: 1 }}>{w.cpl}</div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginTop: 10, minHeight: 44 }}><div style={{ width: '100%', height: w.barPct + '%', minHeight: 4, borderRadius: '6px 6px 0 0', background: w.cplColor, opacity: 0.85 }} /></div>
                    <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', color: C.text3, marginTop: 9, display: 'flex', justifyContent: 'space-between' }}><span>{w.leads} leads</span><span style={{ color: C.text4 }}>{w.inv}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ padding: '30px 20px', textAlign: 'center', color: C.text3, fontFamily: 'Inter', fontSize: '0.84rem' }}><i className="bx bx-line-chart-down" style={{ fontSize: 26, display: 'block', marginBottom: 8 }} />Sem leads no recorte selecionado.</div>}
        </div>

        {/* STATUS ATTRIBUTION */}
        {hasPgl && (
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, padding: '16px 18px', marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><i className="bx bx-list-check" style={{ fontSize: 18, color: C.pgl }} /><span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Atribuição de status (PGL)</span></div>
              <button type="button" onClick={() => { setAddOpen((v) => !v); setNewStage('') }} style={{ height: 32, padding: '0 12px', borderRadius: 99, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><i className="bx bx-plus" style={{ fontSize: 15 }} />Estágio</button>
            </div>
            <p style={{ margin: '0 0 12px', fontFamily: 'Inter', fontSize: '0.72rem', color: C.text3, lineHeight: 1.5 }}>Cada estágio soma os leads cujos status crus da planilha você atribuir. Clique em "Atribuir status" para escolher.</p>
            {addOpen && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="Nome do novo estágio (ex.: Reunião marcada)" style={{ flex: 1, height: 38, padding: '0 13px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.84rem', outline: 'none' }} />
                <button type="button" onClick={addStage} style={{ height: 38, padding: '0 16px', borderRadius: 99, border: 'none', background: C.accent, color: C.onAccent, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><i className="bx bx-check" style={{ fontSize: 16 }} />Adicionar</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 11 }}>
              {cfg.stages.map((st) => {
                const total = stageSum(st); const open = statusMenu === st.key
                const removable = st.kind === 'funnel' && !['alvo', 'qual', 'conv'].includes(st.key)
                return (
                  <div key={st.key} style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.field, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 7, background: hexA(st.color, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><i className={'bx ' + st.icon} style={{ fontSize: 15, color: st.color }} /></span>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.label}</span>
                      <span style={{ fontFamily: 'Inter', fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 99, background: hexA(st.color, 0.16), color: st.color }}>{st.kind === 'loss' ? 'Perda' : 'Funil'}</span>
                      {removable && <button type="button" onClick={() => removeStage(st.key)} title="Remover" style={{ border: 'none', background: 'none', color: C.text3, cursor: 'pointer', padding: 0, display: 'flex' }}><i className="bx bx-trash" style={{ fontSize: 15 }} /></button>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}><span style={{ fontWeight: 800, fontSize: '1.3rem', fontVariantNumeric: 'tabular-nums', color: st.color }}>{num(total)}</span><span style={{ fontFamily: 'Inter', fontSize: '0.6rem', color: C.text3 }}>leads atribuídos</span></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                      {(st.statuses || []).length ? st.statuses.map((label) => (
                        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.68rem', padding: '3px 8px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}` }}>
                          <span>{label}</span><span style={{ color: C.text3 }}>{num(statusCount(label))}</span>
                          <button type="button" onClick={() => toggleStatus(st.key, label)} style={{ border: 'none', background: 'none', color: C.text3, cursor: 'pointer', padding: 0, display: 'flex' }}><i className="bx bx-x" style={{ fontSize: 13 }} /></button>
                        </span>
                      )) : <span style={{ fontFamily: 'Inter', fontSize: '0.66rem', color: C.text4 }}>Nenhum status atribuído</span>}
                    </div>
                    <button type="button" onClick={() => setStatusMenu(open ? null : st.key)} style={{ width: '100%', height: 32, borderRadius: 9, border: `1px dashed ${C.border2}`, background: 'transparent', color: C.text2, fontFamily: 'Inter', fontWeight: 600, fontSize: '0.74rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><i className={'bx ' + (open ? 'bx-chevron-up' : 'bx-plus-circle')} style={{ fontSize: 15 }} />Atribuir status</button>
                    {open && (
                      <div style={{ marginTop: 8, border: `1px solid ${C.border2}`, borderRadius: 10, background: C.panel, overflow: 'hidden' }}>
                        {statusDist.map((o) => {
                          const on = (st.statuses || []).indexOf(o.label) >= 0
                          return (
                            <button key={o.label} type="button" onClick={() => toggleStatus(st.key, o.label)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', border: 'none', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', color: C.text, background: on ? hexA(st.color, 0.08) : 'transparent' }}>
                              <span style={{ width: 16, height: 16, borderRadius: 5, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? st.color : 'transparent', border: `1px solid ${on ? st.color : C.border2}` }}>{on && <i className="bx bx-check" style={{ fontSize: 12, color: '#fff' }} />}</span>
                              <span style={{ flex: 1, textAlign: 'left', fontSize: '0.78rem' }}>{o.label}</span>
                              <span style={{ fontFamily: 'Inter', fontSize: '0.68rem', color: C.text3 }}>{num(o.count)}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {unmapped.length > 0 && (
              <div style={{ marginTop: 12, padding: '11px 13px', borderRadius: 11, background: hexA('#f59e0b', 0.08), border: `1px solid ${hexA('#f59e0b', 0.22)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.warn, fontWeight: 700, marginBottom: 7 }}><i className="bx bx-error" style={{ fontSize: 14 }} />Status sem estágio</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {unmapped.map((u) => <span key={u.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.7rem', padding: '3px 9px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.text2 }}>{u.label} <span style={{ color: C.text3 }}>{num(u.count)}</span></span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATIVE MODAL */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, borderRadius: 20, background: C.panel, border: `1px solid ${C.border2}`, boxShadow: '0 30px 90px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ position: 'relative', background: '#000', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {modal.thumb ? <img src={modal.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} /> : <i className="bx bx-image" style={{ fontSize: 48, color: C.text4 }} />}
                {modal.video && <span style={{ position: 'relative', zIndex: 1, width: 60, height: 60, borderRadius: 99, background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bx bxs-right-arrow" style={{ fontSize: 24, color: '#fff', marginLeft: 3 }} /></span>}
              </div>
              <div style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div><div style={{ fontFamily: 'Inter', fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: C.accent, fontWeight: 700, marginBottom: 4 }}>Preview do criativo</div><div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>{modal.name}</div></div>
                  <button type="button" onClick={() => setModal(null)} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border2}`, background: C.field, color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><i className="bx bx-x" style={{ fontSize: 20 }} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 18 }}>
                  {[{ label: 'Resultado', value: modal.res, color: C.sLead }, { label: 'Custo/resultado', value: modal.cpr, color: modal.cprColor }, { label: 'Investimento', value: money0(modal._ad?.spend || 0), color: C.text }, { label: 'Impressões', value: num(modal._ad?.impressions || 0), color: C.sClk }].map((m, i) => (
                    <div key={i} style={{ background: C.field, borderRadius: 10, padding: '11px 13px' }}><div style={{ fontFamily: 'Inter', fontSize: '0.54rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text3, marginBottom: 4 }}>{m.label}</div><div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '1.02rem', fontVariantNumeric: 'tabular-nums', color: m.color }}>{m.value}</div></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
