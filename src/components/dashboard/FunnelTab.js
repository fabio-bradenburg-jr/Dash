'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return (n == null ? 0 : Number(n)).toLocaleString('pt-BR') }
function fmtMoney(n) { return `R$ ${(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function pct(a, b) { return b ? `${Math.round((a / b) * 100)}%` : '—' }
function pctNum(a, b) { return b ? Math.round((a / b) * 100) : 0 }
function norm(s) { return String(s || '').trim().toLowerCase() }

function matchById(metaId, metaName, sheetMap) {
  if (metaId && sheetMap.byId?.has(norm(metaId))) return sheetMap.byId.get(norm(metaId))
  if (metaName && sheetMap.byName?.has(norm(metaName))) return sheetMap.byName.get(norm(metaName))
  return null
}

// ─── Funnel Stage ─────────────────────────────────────────────────────────────

const STAGE_CONFIG = [
  { key: 'impressions', label: 'Impressões',  color: '#6b7280', icon: 'bx-show',         source: 'meta' },
  { key: 'clicks',      label: 'Cliques',      color: '#38bdf8', icon: 'bx-mouse-alt',    source: 'meta' },
  { key: 'leads',       label: 'Leads',        color: '#818cf8', icon: 'bx-user-plus',    source: 'meta' },
  { key: 'publicoAlvo', label: 'Público-alvo', color: '#a78bfa', icon: 'bx-target-lock',  source: 'crm'  },
  { key: 'qualified',   label: 'Qualificados', color: '#34d399', icon: 'bx-check-shield', source: 'crm'  },
  { key: 'converted',   label: 'Convertidos',  color: '#10b981', icon: 'bx-trophy',       source: 'crm'  },
]

function FunnelStage({ stage, value, prevValue, topValue, hover, onHover }) {
  const barPct = topValue ? Math.max(4, (value / topValue) * 100) : 4
  const lossPct = prevValue && prevValue > value ? pctNum(prevValue - value, prevValue) : 0
  const lossAbs = prevValue ? Math.max(0, prevValue - value) : 0
  return (
    <div
      className={`fn-stage${hover ? ' fn-stage-hover' : ''}`}
      onMouseEnter={() => onHover(stage.key)}
      onMouseLeave={() => onHover(null)}
    >
      {prevValue !== null && lossAbs > 0 && (
        <div className="fn-loss-row">
          <div className="fn-loss-line" />
          <div className="fn-loss-badge">
            <i className="bx bx-trending-down" />
            <span>{fmt(lossAbs)} perdidos ({lossPct}%)</span>
          </div>
        </div>
      )}
      <div className="fn-stage-body">
        <div className="fn-stage-meta">
          <div className="fn-stage-icon" style={{ color: stage.color, background: `${stage.color}18` }}>
            <i className={`bx ${stage.icon}`} />
          </div>
          <div className="fn-stage-info">
            <span className="fn-stage-label">
              {stage.label}
              <span className={`fn-stage-src fn-src-${stage.source}`}>{stage.source === 'meta' ? 'Meta' : 'CRM'}</span>
            </span>
            <span className="fn-stage-count">{fmt(value)}</span>
          </div>
        </div>
        <div className="fn-stage-bars">
          <div className="fn-bar-track">
            <div className="fn-bar-fill" style={{ width: `${barPct}%`, background: stage.color }} />
          </div>
          <div className="fn-stage-pcts">
            {prevValue !== null && prevValue > 0 && (
              <span className="fn-pct-prev" style={{ color: stage.color }}>{pct(value, prevValue)} da etapa anterior</span>
            )}
            {topValue > 0 && stage.key !== 'impressions' && (
              <span className="fn-pct-top">{pct(value, topValue)} das impressões</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, sub, color, icon }) {
  return (
    <div className="fn-card">
      <div className="fn-card-icon" style={{ color: color || '#60a5fa', background: `${color || '#60a5fa'}18` }}>
        <i className={`bx ${icon}`} />
      </div>
      <div>
        <div className="fn-card-value" style={{ color }}>{value}</div>
        <div className="fn-card-label">{label}</div>
        {sub && <div className="fn-card-sub">{sub}</div>}
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="fn-tooltip">
      <div className="fn-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="fn-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}:</span><strong>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  )
}

// ─── Collapsible Ranking Section ──────────────────────────────────────────────

function RankSection({ title, rows, cols, emptyMsg, selectedId, onSelect, defaultCollapsed = true }) {
  const [open, setOpen] = useState(!defaultCollapsed)
  return (
    <div className="fn-rank-section">
      <button type="button" className="fn-rank-header" onClick={() => setOpen(o => !o)}>
        <span className="fn-rank-title">{title}</span>
        <div className="fn-rank-header-right">
          {selectedId && <span className="fn-rank-active-badge">1 selecionado</span>}
          <i className={`bx ${open ? 'bx-chevron-up' : 'bx-chevron-down'}`} />
        </div>
      </button>
      {open && (
        <div className="fn-rank-table-wrap">
          {!rows?.length ? (
            <div className="fn-empty">{emptyMsg || 'Sem dados.'}</div>
          ) : (
            <table className="fn-rank-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  {cols.map(c => <th key={c.key}>{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r, i) => {
                  const isActive = selectedId && r._id === selectedId
                  return (
                    <tr
                      key={r._id || r.name || i}
                      className={`fn-rank-row${isActive ? ' fn-rank-row-active' : ''}`}
                      onClick={() => onSelect(isActive ? null : r._id)}
                      title="Clique para filtrar o funil"
                    >
                      <td className="fn-rank-num">{i + 1}</td>
                      <td className="fn-rank-name" title={r.name}>{r.name}</td>
                      {cols.map(c => (
                        <td key={c.key} style={{ color: c.color }}>
                          {c.render ? c.render(r) : fmt(r[c.key])}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FunnelTab({ clients }) {
  const [selectedClientId, setSelectedClientId] = useState('')
  const [crmData, setCrmData] = useState(null)
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmError, setCrmError] = useState('')

  const [metaRow, setMetaRow] = useState(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState('')
  const [metaPeriod, setMetaPeriod] = useState('last_30d')

  // Cascade filters (by id)
  const [selCampaign, setSelCampaign] = useState('')
  const [selAdset, setSelAdset]       = useState('')
  const [selAd, setSelAd]             = useState('')
  const [hoveredStage, setHoveredStage] = useState(null)

  const [period, setPeriod] = useState('30d')
  const [customSince, setCustomSince] = useState('')
  const [customUntil, setCustomUntil] = useState('')

  const metaClients = useMemo(() =>
    (clients || []).filter(c => c.metaAdAccountId && c.metaAdAccountId !== '__ghost__'),
    [clients]
  )
  const activeClient = useMemo(() =>
    metaClients.find(c => c.id === selectedClientId) || metaClients[0] || null,
    [metaClients, selectedClientId]
  )

  useEffect(() => {
    if (!selectedClientId && metaClients.length > 0) setSelectedClientId(metaClients[0].id)
  }, [metaClients, selectedClientId])

  // Reset cascade when client changes
  useEffect(() => { setSelCampaign(''); setSelAdset(''); setSelAd('') }, [selectedClientId])
  useEffect(() => { setSelAdset(''); setSelAd('') }, [selCampaign])
  useEffect(() => { setSelAd('') }, [selAdset])

  const loadMeta = useCallback(async () => {
    if (!activeClient) return
    setMetaLoading(true); setMetaError(''); setMetaRow(null)
    try {
      const params = new URLSearchParams({ date_preset: metaPeriod })
      const res = await fetch(`/api/meta/campaigns-overview?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar dados do Meta.')
      setMetaRow((json.rows || []).find(r => r.clientId === activeClient.id) || null)
    } catch (e) { setMetaError(e.message) }
    finally { setMetaLoading(false) }
  }, [activeClient, metaPeriod])

  useEffect(() => { loadMeta() }, [loadMeta])

  const loadCrm = useCallback(async () => {
    if (!activeClient?.leadsSheetUrl) { setCrmData(null); return }
    setCrmLoading(true); setCrmError('')
    try {
      const pad = n => String(n).padStart(2, '0')
      const fmtD = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      const today = new Date()
      let since = '', until = ''
      if (period === '7d') { const s = new Date(today); s.setDate(s.getDate()-6); since = fmtD(s); until = fmtD(today) }
      else if (period === '30d') { const s = new Date(today); s.setDate(s.getDate()-29); since = fmtD(s); until = fmtD(today) }
      else if (period === 'month') { since = fmtD(new Date(today.getFullYear(), today.getMonth(), 1)); until = fmtD(today) }
      else if (period === 'custom') { since = customSince; until = customUntil }

      const params = new URLSearchParams({ url: activeClient.leadsSheetUrl, gid: 'all', header_row: activeClient.googleSheetsHeaderRow || 1 })
      if (since) params.set('since', since)
      if (until) params.set('until', until)
      const res = await fetch(`/api/google-sheets/leads-analytics?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar CRM.')
      setCrmData(json)
    } catch (e) { setCrmError(e.message) }
    finally { setCrmLoading(false) }
  }, [activeClient, period, customSince, customUntil])

  useEffect(() => { loadCrm() }, [loadCrm])

  // ─── CRM index by name ────────────────────────────────────────────────────

  const crmIndex = useMemo(() => {
    if (!crmData) return null
    const campaignByName = new Map()
    for (const c of crmData.campaigns || []) campaignByName.set(norm(c.name), c)
    const adsetByName = new Map()
    for (const a of crmData.adsets || []) adsetByName.set(norm(a.name), a)
    const adByName = new Map()
    for (const a of crmData.ads || []) adByName.set(norm(a.name), a)
    return {
      campaign: { byName: campaignByName, byId: new Map() },
      adset:    { byName: adsetByName,    byId: new Map() },
      ad:       { byName: adByName,       byId: new Map() },
    }
  }, [crmData])

  // ─── Cascade options ──────────────────────────────────────────────────────

  const campaignOptions = useMemo(() => metaRow?.campaigns || [], [metaRow])

  const adsetOptions = useMemo(() => {
    if (!selCampaign) return metaRow?.campaigns?.flatMap(c => c.adsets || []) || []
    return campaignOptions.find(c => c.campaignId === selCampaign)?.adsets || []
  }, [selCampaign, campaignOptions, metaRow])

  const adOptions = useMemo(() => {
    if (!selAdset) return adsetOptions.flatMap(a => a.ads || [])
    return adsetOptions.find(a => a.adsetId === selAdset)?.ads || []
  }, [selAdset, adsetOptions])

  // ─── Funnel Meta values ───────────────────────────────────────────────────

  const funnelMeta = useMemo(() => {
    if (!metaRow) return { impressions: 0, clicks: 0, leads: 0, spend: 0 }
    let impressions = 0, clicks = 0, leads = 0, spend = 0
    const sum = items => { for (const it of items) { impressions += Number(it.impressions||0); clicks += Number(it.clicks||0); leads += Number(it.results||0); spend += Number(it.spend||0) } }
    if (selAd) sum(adOptions.filter(a => a.adId === selAd))
    else if (selAdset) { const a = adsetOptions.find(a => a.adsetId === selAdset); if (a) sum([a]) }
    else if (selCampaign) { const c = campaignOptions.find(c => c.campaignId === selCampaign); if (c) sum([c]) }
    else sum(metaRow.campaigns || [])
    return { impressions, clicks, leads, spend }
  }, [metaRow, selCampaign, selAdset, selAd, campaignOptions, adsetOptions, adOptions])

  // ─── Funnel CRM values ────────────────────────────────────────────────────

  const funnelCrm = useMemo(() => {
    const empty = { publicoAlvo: 0, qualified: 0, converted: 0, lost: 0, noreply: 0 }
    if (!crmData) return empty
    if (selAd) {
      const a = adOptions.find(a => a.adId === selAd)
      return (a ? matchById(a.adId, a.name, crmIndex?.ad || {}) : null) || empty
    }
    if (selAdset) {
      const a = adsetOptions.find(a => a.adsetId === selAdset)
      return (a ? matchById(a.adsetId, a.name, crmIndex?.adset || {}) : null) || empty
    }
    if (selCampaign) {
      const c = campaignOptions.find(c => c.campaignId === selCampaign)
      return (c ? matchById(c.campaignId, c.name, crmIndex?.campaign || {}) : null) || empty
    }
    return crmData.overview || empty
  }, [crmData, selCampaign, selAdset, selAd, campaignOptions, adsetOptions, adOptions, crmIndex])

  const stages = useMemo(() => [
    { ...STAGE_CONFIG[0], value: funnelMeta.impressions },
    { ...STAGE_CONFIG[1], value: funnelMeta.clicks },
    { ...STAGE_CONFIG[2], value: funnelMeta.leads },
    { ...STAGE_CONFIG[3], value: funnelCrm.publicoAlvo || 0 },
    { ...STAGE_CONFIG[4], value: funnelCrm.qualified || 0 },
    { ...STAGE_CONFIG[5], value: funnelCrm.converted || 0 },
  ], [funnelMeta, funnelCrm])

  const topValue = stages[0]?.value || 1

  const cpl      = funnelMeta.leads > 0 ? funnelMeta.spend / funnelMeta.leads : 0
  const ctr      = funnelMeta.impressions > 0 ? (funnelMeta.clicks / funnelMeta.impressions) * 100 : 0
  const cpc      = funnelMeta.clicks > 0 ? funnelMeta.spend / funnelMeta.clicks : 0
  const qualRate = funnelMeta.leads > 0 ? (funnelCrm.qualified || 0) / funnelMeta.leads : 0
  const convRate = funnelMeta.leads > 0 ? (funnelCrm.converted || 0) / funnelMeta.leads : 0
  const lostRate = funnelMeta.leads > 0 ? (funnelCrm.lost || 0) / funnelMeta.leads : 0

  const alerts = useMemo(() => {
    const list = []
    if (funnelMeta.clicks > 0 && funnelMeta.leads / funnelMeta.clicks < 0.01)
      list.push({ type: 'warning', text: `Taxa clique→lead muito baixa (${(funnelMeta.leads / funnelMeta.clicks * 100).toFixed(1)}%). Verifique o formulário.` })
    if (funnelMeta.leads > 10 && qualRate < 0.2)
      list.push({ type: 'warning', text: `Apenas ${Math.round(qualRate*100)}% dos leads qualificados. Alto volume, baixa qualidade.` })
    if ((funnelCrm.lost || 0) > (funnelCrm.qualified || 0))
      list.push({ type: 'critical', text: 'Mais leads perdidos do que qualificados. Gargalo na qualificação.' })
    if ((funnelCrm.noreply || 0) / Math.max(funnelMeta.leads, 1) > 0.4)
      list.push({ type: 'warning', text: `${Math.round((funnelCrm.noreply||0)/Math.max(funnelMeta.leads,1)*100)}% sem resposta. Possível falha no atendimento.` })
    if (funnelCrm.qualified > 0 && (funnelCrm.converted||0) / funnelCrm.qualified < 0.1)
      list.push({ type: 'info', text: `Taxa de fechamento baixa: ${Math.round((funnelCrm.converted||0)/funnelCrm.qualified*100)}% dos qualificados convertidos.` })
    return list
  }, [funnelMeta, funnelCrm, qualRate])

  // ─── Rankings with stable _id for selection ───────────────────────────────

  const campaignRanking = useMemo(() => (metaRow?.campaigns || []).map(c => {
    const crm = matchById(c.campaignId, c.name, crmIndex?.campaign || {})
    return { _id: c.campaignId, name: c.name, leads: c.results||0, spend: c.spend||0,
      publicoAlvo: crm?.publicoAlvo||0, qualified: crm?.qualified||0, converted: crm?.converted||0,
      qualRate: (c.results||0)>0 ? (crm?.qualified||0)/(c.results||1) : 0 }
  }).sort((a,b) => b.leads - a.leads), [metaRow, crmIndex])

  const adsetRanking = useMemo(() => (metaRow?.campaigns?.flatMap(c => c.adsets||[]) || []).map(a => {
    const crm = matchById(a.adsetId, a.name, crmIndex?.adset || {})
    return { _id: a.adsetId, name: a.name, leads: a.results||0, spend: a.spend||0,
      qualified: crm?.qualified||0, converted: crm?.converted||0 }
  }).sort((a,b) => b.leads - a.leads), [metaRow, crmIndex])

  const adRanking = useMemo(() => (metaRow?.campaigns?.flatMap(c => c.adsets?.flatMap(a => a.ads||[])||[]) || []).map(a => {
    const crm = matchById(a.adId, a.name, crmIndex?.ad || {})
    return { _id: a.adId, name: a.name, leads: a.results||0, spend: a.spend||0,
      qualified: crm?.qualified||0, converted: crm?.converted||0 }
  }).sort((a,b) => b.leads - a.leads), [metaRow, crmIndex])

  const hasCrm = Boolean(activeClient?.leadsSheetUrl)

  // Rótulo do filtro atual
  const filterLabel = useMemo(() => {
    if (selAd) return adOptions.find(a => a.adId === selAd)?.name || 'Anúncio'
    if (selAdset) return adsetOptions.find(a => a.adsetId === selAdset)?.name || 'Conjunto'
    if (selCampaign) return campaignOptions.find(c => c.campaignId === selCampaign)?.name || 'Campanha'
    return 'Todos'
  }, [selCampaign, selAdset, selAd, campaignOptions, adsetOptions, adOptions])

  if (metaClients.length === 0) {
    return (
      <div className="fn-empty-state">
        <i className="bx bx-filter-alt" />
        <h3>Nenhum cliente com Meta Ads</h3>
        <p>Configure uma conta do Meta Ads no cadastro do cliente para visualizar o funil.</p>
      </div>
    )
  }

  return (
    <div className="fn-root">
      {/* Left sidebar — client list */}
      <div className="fn-sidebar">
        <div className="fn-sidebar-label">Clientes</div>
        {metaClients.map(c => (
          <button key={c.id} type="button"
            className={`fn-client-btn${activeClient?.id === c.id ? ' active' : ''}`}
            onClick={() => setSelectedClientId(c.id)}
          >
            {c.logoUrl
              ? <img src={c.logoUrl} alt="" className="fn-client-logo" />
              : <span className="fn-client-avatar" style={{ background: c.dashboardColor || '#6366f1' }}>{(c.name||'?')[0].toUpperCase()}</span>
            }
            <span className="fn-client-name">{c.name}</span>
            {c.leadsSheetUrl && <i className="bx bx-spreadsheet fn-has-sheet" title="Planilha vinculada" />}
          </button>
        ))}
      </div>

      {/* Main panel */}
      <div className="fn-main">

        {/* Header */}
        <div className="fn-header">
          <div>
            <span className="fn-kicker">Funil de Performance</span>
            <h2 className="fn-title">{activeClient?.name}</h2>
            {!hasCrm && <p className="fn-no-crm">Planilha não configurada — apenas dados Meta.</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" className="fn-refresh" onClick={loadMeta} title="Atualizar Meta" disabled={metaLoading}>
              <i className={`bx bx-refresh${metaLoading ? ' bx-spin' : ''}`} />
            </button>
            <button type="button" className="fn-refresh" onClick={loadCrm} title="Atualizar CRM" disabled={crmLoading}>
              <i className={`bx bx-spreadsheet${crmLoading ? ' bx-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Period bars */}
        <div className="fn-period-bar">
          <span className="fn-period-label"><i className="bx bx-meta" /> Meta:</span>
          {[
            { id: 'last_7d',  label: '7 dias' },
            { id: 'last_14d', label: '14 dias' },
            { id: 'last_30d', label: '30 dias' },
            { id: 'last_90d', label: '90 dias' },
          ].map(p => (
            <button key={p.id} type="button"
              className={`fn-period-btn${metaPeriod === p.id ? ' active' : ''}`}
              onClick={() => setMetaPeriod(p.id)}>{p.label}</button>
          ))}
          {metaError && <span className="fn-inline-error"><i className="bx bx-error-circle" /> {metaError}</span>}
        </div>

        <div className="fn-period-bar">
          <span className="fn-period-label"><i className="bx bx-spreadsheet" /> CRM:</span>
          {[
            { id: 'all',    label: 'Tudo' },
            { id: '7d',     label: '7 dias' },
            { id: '30d',    label: '30 dias' },
            { id: 'month',  label: 'Este mês' },
            { id: 'custom', label: 'Personalizado' },
          ].map(p => (
            <button key={p.id} type="button"
              className={`fn-period-btn${period === p.id ? ' active' : ''}`}
              onClick={() => setPeriod(p.id)}>{p.label}</button>
          ))}
          {period === 'custom' && (<>
            <input type="date" className="fn-date-input" value={customSince} onChange={e => setCustomSince(e.target.value)} />
            <span style={{ color: 'rgba(241,241,241,0.3)', fontSize: 12 }}>→</span>
            <input type="date" className="fn-date-input" value={customUntil} onChange={e => setCustomUntil(e.target.value)} />
            <button type="button" className="fn-apply-btn" onClick={loadCrm} disabled={!customSince || !customUntil}>Aplicar</button>
          </>)}
        </div>

        {/* Cascade dropdowns */}
        <div className="fn-filters">
          <div className="fn-filter-group">
            <label>Campanha</label>
            <select value={selCampaign} onChange={e => setSelCampaign(e.target.value)}>
              <option value="">Todas ({campaignOptions.length})</option>
              {campaignOptions.map(c => <option key={c.campaignId} value={c.campaignId}>{c.name}</option>)}
            </select>
          </div>
          <div className="fn-filter-group">
            <label>Conjunto</label>
            <select value={selAdset} onChange={e => setSelAdset(e.target.value)} disabled={!adsetOptions.length}>
              <option value="">Todos ({adsetOptions.length})</option>
              {adsetOptions.map(a => <option key={a.adsetId} value={a.adsetId}>{a.name}</option>)}
            </select>
          </div>
          <div className="fn-filter-group">
            <label>Anúncio</label>
            <select value={selAd} onChange={e => setSelAd(e.target.value)} disabled={!adOptions.length}>
              <option value="">Todos ({adOptions.length})</option>
              {adOptions.map(a => <option key={a.adId} value={a.adId}>{a.name}</option>)}
            </select>
          </div>
          {(selCampaign || selAdset || selAd) && (
            <button type="button" className="fn-clear-filter" onClick={() => { setSelCampaign(''); setSelAdset(''); setSelAd('') }}>
              <i className="bx bx-x" /> Limpar
            </button>
          )}
        </div>

        {/* Metric cards */}
        <div className="fn-cards-row">
          <Card label="Investimento"   value={fmtMoney(funnelMeta.spend)}   icon="bx-money"        color="#26c281" />
          <Card label="CTR"            value={`${ctr.toFixed(2)}%`}          icon="bx-trending-up"  color="#38bdf8" />
          <Card label="CPC"            value={fmtMoney(cpc)}                 icon="bx-mouse-alt"    color="#60a5fa" />
          <Card label="CPL"            value={fmtMoney(cpl)}                 icon="bx-user-plus"    color="#818cf8" sub={funnelMeta.leads > 0 ? `${fmt(funnelMeta.leads)} leads` : ''} />
          <Card label="Taxa Qualif."   value={`${Math.round(qualRate*100)}%`} icon="bx-check-shield" color="#34d399" sub="leads → qualif." />
          <Card label="Taxa Conversão" value={`${Math.round(convRate*100)}%`} icon="bx-trophy"       color="#10b981" sub="leads → vendas" />
          <Card label="Taxa Perda"     value={`${Math.round(lostRate*100)}%`} icon="bx-x-circle"     color="#ef4444" />
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="fn-alerts">
            {alerts.map((a, i) => {
              const cfg = { warning: { icon: 'bx-error', color: '#f59e0b' }, critical: { icon: 'bx-error-circle', color: '#ef4444' }, info: { icon: 'bx-info-circle', color: '#60a5fa' } }[a.type] || {}
              return (
                <div key={i} className="fn-alert" style={{ borderLeftColor: cfg.color }}>
                  <i className={`bx ${cfg.icon}`} style={{ color: cfg.color }} />
                  <span>{a.text}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Body: rankings LEFT + funnel RIGHT */}
        <div className="fn-body">

          {/* Left: collapsible ranking tables */}
          <div className="fn-rankings">
            <RankSection
              title="Campanhas"
              rows={campaignRanking}
              selectedId={selCampaign}
              onSelect={id => { setSelCampaign(id || ''); setSelAdset(''); setSelAd('') }}
              defaultCollapsed={false}
              cols={[
                { key: 'leads',      label: 'Leads',     color: '#818cf8' },
                { key: 'publicoAlvo',label: 'Púb. alvo', color: '#a78bfa' },
                { key: 'qualified',  label: 'Qualif.',   color: '#34d399' },
                { key: 'converted',  label: 'Conv.',     color: '#10b981' },
                { key: 'qualRate',   label: 'Taxa Q.',   color: '#26c281', render: r => `${Math.round(r.qualRate*100)}%` },
              ]}
            />
            <RankSection
              title="Conjuntos"
              rows={adsetRanking}
              selectedId={selAdset}
              onSelect={id => { setSelAdset(id || ''); setSelAd('') }}
              cols={[
                { key: 'leads',     label: 'Leads',   color: '#818cf8' },
                { key: 'qualified', label: 'Qualif.', color: '#34d399' },
                { key: 'converted', label: 'Conv.',   color: '#10b981' },
              ]}
            />
            <RankSection
              title="Anúncios"
              rows={adRanking}
              selectedId={selAd}
              onSelect={id => setSelAd(id || '')}
              cols={[
                { key: 'leads',     label: 'Leads',   color: '#818cf8' },
                { key: 'qualified', label: 'Qualif.', color: '#34d399' },
                { key: 'converted', label: 'Conv.',   color: '#10b981' },
              ]}
            />
          </div>

          {/* Right: funnel */}
          <div className="fn-funnel-col">
            <div className="fn-funnel-wrap">
              <div className="fn-funnel-title">
                <span>Funil</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {filterLabel !== 'Todos' && (
                    <span className="fn-funnel-filter-badge" title={filterLabel}>
                      <i className="bx bx-filter-alt" /> {filterLabel.length > 22 ? filterLabel.slice(0, 22) + '…' : filterLabel}
                    </span>
                  )}
                  {(metaLoading || crmLoading) && <span className="fn-loading-pill"><i className="bx bx-loader-alt bx-spin" /></span>}
                </div>
              </div>

              {stages.map((s, i) => (
                <FunnelStage
                  key={s.key}
                  stage={s}
                  value={s.value}
                  prevValue={i > 0 ? stages[i - 1].value : null}
                  topValue={topValue}
                  isLast={i === stages.length - 1}
                  hover={hoveredStage === s.key}
                  onHover={setHoveredStage}
                />
              ))}

              {hasCrm && (
                <div className="fn-crm-losses">
                  <div className="fn-crm-loss-item" style={{ borderColor: '#ef4444' }}>
                    <i className="bx bx-x-circle" style={{ color: '#ef4444' }} />
                    <div>
                      <div className="fn-crm-loss-val">{fmt(funnelCrm.lost || 0)}</div>
                      <div className="fn-crm-loss-label">Perdidos <span>{pct(funnelCrm.lost||0, funnelMeta.leads)}</span></div>
                    </div>
                  </div>
                  <div className="fn-crm-loss-item" style={{ borderColor: '#f59e0b' }}>
                    <i className="bx bx-time" style={{ color: '#f59e0b' }} />
                    <div>
                      <div className="fn-crm-loss-val">{fmt(funnelCrm.noreply || 0)}</div>
                      <div className="fn-crm-loss-label">Sem resp. <span>{pct(funnelCrm.noreply||0, funnelMeta.leads)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {crmError && (
                <div className="fn-crm-error"><i className="bx bx-error-circle" /> {crmError}</div>
              )}
            </div>

            {/* Timeline */}
            {crmData?.timeline?.length > 0 && (
              <div className="fn-timeline-card">
                <div className="fn-timeline-title">Evolução Temporal</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={crmData.timeline} margin={{ left: 0, right: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} width={30} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="total"     name="Leads"    stroke="#818cf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="qualified" name="Qualif."  stroke="#34d399" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="converted" name="Conver."  stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="lost"      name="Perdidos" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ─── Layout ─── */
        .fn-root {
          display: grid;
          grid-template-columns: 176px 1fr;
          gap: 14px;
          align-items: start;
        }
        .fn-sidebar {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          position: sticky;
          top: 0;
          max-height: calc(100vh - 160px);
          overflow-y: auto;
        }
        .fn-sidebar-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: rgba(241,241,241,.3); padding: 4px 8px 8px; }
        .fn-client-btn { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 9px; border: 1px solid transparent; background: rgba(255,255,255,.04); color: inherit; cursor: pointer; text-align: left; transition: all .15s; width: 100%; }
        .fn-client-btn:hover { background: rgba(255,255,255,.07); }
        .fn-client-btn.active { background: rgba(38,194,129,.1); border-color: rgba(38,194,129,.3); }
        .fn-client-logo { width: 26px; height: 26px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .fn-client-avatar { width: 26px; height: 26px; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; }
        .fn-client-name { font-size: 12px; font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fn-has-sheet { font-size: 12px; color: rgba(38,194,129,.6); flex-shrink: 0; }

        /* ─── Main ─── */
        .fn-main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .fn-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .fn-kicker { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #26c281; background: rgba(38,194,129,.1); border: 1px solid rgba(38,194,129,.2); border-radius: 100px; padding: 2px 10px; display: inline-block; margin-bottom: 5px; }
        .fn-title { font-size: 20px; font-weight: 700; margin: 0; color: #f1f1f1; }
        .fn-no-crm { font-size: 12px; color: rgba(241,241,241,.35); margin: 4px 0 0; }
        .fn-refresh { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; color: #ccc; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all .15s; }
        .fn-refresh:hover { background: rgba(255,255,255,.1); }
        .fn-refresh:disabled { opacity: .4; cursor: not-allowed; }

        /* ─── Period bars ─── */
        .fn-period-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 8px 14px; }
        .fn-period-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(241,241,241,.35); display: flex; align-items: center; gap: 5px; flex-shrink: 0; white-space: nowrap; }
        .fn-period-btn { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 8px; color: rgba(241,241,241,.55); padding: 4px 11px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all .15s; }
        .fn-period-btn:hover { background: rgba(255,255,255,.09); color: #f1f1f1; }
        .fn-period-btn.active { background: rgba(38,194,129,.12); border-color: rgba(38,194,129,.3); color: #26c281; font-weight: 600; }
        .fn-date-input { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; color: #f1f1f1; padding: 4px 10px; font-size: 12px; outline: none; }
        .fn-apply-btn { background: rgba(38,194,129,.14); border: 1px solid rgba(38,194,129,.3); border-radius: 8px; color: #26c281; padding: 4px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .fn-apply-btn:disabled { opacity: .35; cursor: not-allowed; }
        .fn-inline-error { font-size: 11px; color: #ef4444; display: flex; align-items: center; gap: 4px; }

        /* ─── Filters ─── */
        .fn-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 12px 16px; }
        .fn-filter-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px; }
        .fn-filter-group label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(241,241,241,.35); }
        .fn-filter-group select { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; color: #f1f1f1; padding: 7px 10px; font-size: 13px; outline: none; cursor: pointer; }
        .fn-filter-group select:disabled { opacity: .4; cursor: not-allowed; }
        .fn-filter-group select:focus { border-color: rgba(38,194,129,.4); }
        .fn-clear-filter { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; color: #ef4444; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap; align-self: flex-end; }
        .fn-clear-filter:hover { background: rgba(239,68,68,.18); }

        /* ─── Cards ─── */
        .fn-cards-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        .fn-card { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 13px; padding: 12px 14px; }
        .fn-card-icon { width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .fn-card-value { font-size: 17px; font-weight: 700; line-height: 1.1; }
        .fn-card-label { font-size: 10px; color: rgba(241,241,241,.45); margin-top: 2px; }
        .fn-card-sub { font-size: 10px; color: rgba(241,241,241,.3); }

        /* ─── Alerts ─── */
        .fn-alerts { display: flex; flex-direction: column; gap: 6px; }
        .fn-alert { display: flex; align-items: flex-start; gap: 10px; border-left: 3px solid; padding: 9px 14px; background: rgba(255,255,255,.025); border-radius: 0 8px 8px 0; font-size: 12px; color: rgba(241,241,241,.8); line-height: 1.4; }
        .fn-alert i { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

        /* ─── Body: rankings + funnel ─── */
        .fn-body { display: grid; grid-template-columns: 1fr 360px; gap: 14px; align-items: start; }

        /* ─── Rankings ─── */
        .fn-rankings { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .fn-rank-section { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; overflow: hidden; }
        .fn-rank-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; background: transparent; border: none; color: inherit; cursor: pointer; }
        .fn-rank-header:hover { background: rgba(255,255,255,.03); }
        .fn-rank-header-right { display: flex; align-items: center; gap: 8px; }
        .fn-rank-title { font-size: 11px; font-weight: 700; color: rgba(241,241,241,.55); text-transform: uppercase; letter-spacing: .08em; }
        .fn-rank-active-badge { font-size: 10px; background: rgba(38,194,129,.15); color: #26c281; border: 1px solid rgba(38,194,129,.3); border-radius: 100px; padding: 2px 8px; font-weight: 600; }
        .fn-rank-table-wrap { overflow-x: auto; border-top: 1px solid rgba(255,255,255,.06); }
        .fn-rank-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .fn-rank-table th { text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgba(241,241,241,.3); padding: 7px 12px; border-bottom: 1px solid rgba(255,255,255,.05); }
        .fn-rank-table td { padding: 9px 12px; border-bottom: 1px solid rgba(255,255,255,.04); color: #e8e8e8; }
        .fn-rank-table tr:last-child td { border-bottom: none; }
        .fn-rank-row { cursor: pointer; transition: background .12s; }
        .fn-rank-row:hover td { background: rgba(255,255,255,.04); }
        .fn-rank-row-active td { background: rgba(38,194,129,.08) !important; }
        .fn-rank-row-active .fn-rank-num::before { content: '▶ '; color: #26c281; font-size: 8px; }
        .fn-rank-num { font-size: 11px; color: rgba(241,241,241,.25); font-weight: 700; width: 28px; }
        .fn-rank-name { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
        .fn-empty { font-size: 12px; color: rgba(241,241,241,.25); padding: 16px 0; text-align: center; }

        /* ─── Funnel column ─── */
        .fn-funnel-col { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 0; }
        .fn-funnel-wrap { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 16px; padding: 18px 20px; display: flex; flex-direction: column; gap: 0; }
        .fn-funnel-title { font-size: 13px; font-weight: 700; color: #f1f1f1; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .fn-funnel-filter-badge { font-size: 10px; font-weight: 600; background: rgba(38,194,129,.12); color: #26c281; border: 1px solid rgba(38,194,129,.25); border-radius: 100px; padding: 2px 9px; display: flex; align-items: center; gap: 4px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fn-loading-pill { font-size: 11px; color: rgba(241,241,241,.4); display: flex; align-items: center; gap: 4px; }

        /* Stage */
        .fn-stage { position: relative; }
        .fn-stage-hover .fn-bar-fill { filter: brightness(1.2); }
        .fn-loss-row { display: flex; align-items: center; gap: 10px; padding: 5px 0 5px 12px; }
        .fn-loss-line { width: 2px; height: 18px; background: rgba(255,255,255,.08); flex-shrink: 0; }
        .fn-loss-badge { display: flex; align-items: center; gap: 5px; font-size: 10px; color: rgba(241,241,241,.35); }
        .fn-loss-badge i { font-size: 11px; color: #ef4444; }
        .fn-stage-body { display: flex; flex-direction: column; gap: 5px; padding: 0 0 2px; }
        .fn-stage-meta { display: flex; align-items: center; gap: 10px; }
        .fn-stage-icon { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .fn-stage-info { min-width: 0; }
        .fn-stage-label { font-size: 11px; font-weight: 600; color: rgba(241,241,241,.7); display: flex; align-items: center; gap: 6px; }
        .fn-stage-src { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 1px 5px; border-radius: 100px; }
        .fn-src-meta { background: rgba(96,165,250,.15); color: #60a5fa; }
        .fn-src-crm  { background: rgba(52,211,153,.15); color: #34d399; }
        .fn-stage-count { font-size: 18px; font-weight: 700; color: #f1f1f1; line-height: 1.1; }
        .fn-stage-bars { padding-left: 42px; }
        .fn-bar-track { width: 100%; height: 7px; background: rgba(255,255,255,.06); border-radius: 4px; overflow: hidden; margin-bottom: 3px; }
        .fn-bar-fill { height: 100%; border-radius: 4px; transition: width .4s ease; }
        .fn-stage-pcts { display: flex; gap: 10px; }
        .fn-pct-prev { font-size: 10px; font-weight: 600; }
        .fn-pct-top { font-size: 10px; color: rgba(241,241,241,.3); }

        /* CRM losses */
        .fn-crm-losses { display: flex; gap: 8px; margin-top: 14px; }
        .fn-crm-loss-item { flex: 1; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.03); border: 1px solid; border-radius: 9px; padding: 9px 10px; }
        .fn-crm-loss-item i { font-size: 16px; flex-shrink: 0; }
        .fn-crm-loss-val { font-size: 15px; font-weight: 700; color: #f1f1f1; }
        .fn-crm-loss-label { font-size: 10px; color: rgba(241,241,241,.45); }
        .fn-crm-loss-label span { margin-left: 4px; color: rgba(241,241,241,.25); }

        /* Timeline */
        .fn-timeline-card { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 16px 18px; }
        .fn-timeline-title { font-size: 12px; font-weight: 700; color: #f1f1f1; margin-bottom: 12px; }

        /* Tooltip */
        .fn-tooltip { background: rgba(15,20,18,.95); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 9px 13px; font-size: 11px; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
        .fn-tooltip-label { font-weight: 700; color: #f1f1f1; margin-bottom: 5px; }
        .fn-tooltip-row { display: flex; justify-content: space-between; gap: 12px; line-height: 1.6; }

        /* Misc */
        .fn-crm-error { font-size: 12px; color: #ef4444; display: flex; align-items: center; gap: 6px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 8px 12px; margin-top: 10px; }
        .fn-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px 24px; text-align: center; }
        .fn-empty-state i { font-size: 48px; color: rgba(241,241,241,.15); }
        .fn-empty-state h3 { font-size: 17px; font-weight: 700; margin: 0; color: rgba(241,241,241,.6); }
        .fn-empty-state p { font-size: 13px; color: rgba(241,241,241,.35); margin: 0; max-width: 360px; }

        /* Responsive */
        @media (max-width: 960px) {
          .fn-root { grid-template-columns: 1fr; }
          .fn-sidebar { position: static; max-height: 140px; flex-direction: row; flex-wrap: wrap; overflow-x: auto; }
          .fn-body { grid-template-columns: 1fr; }
          .fn-funnel-col { position: static; order: -1; }
        }
      `}</style>
    </div>
  )
}
