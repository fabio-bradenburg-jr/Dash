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
  { key: 'publicoAlvo', label: 'Público-alvo', color: '#a78bfa', icon: 'bx-target-lock',  source: 'pgl'  },
  { key: 'qualified',   label: 'Qualificados', color: '#34d399', icon: 'bx-check-shield', source: 'pgl'  },
  { key: 'converted',   label: 'Convertidos',  color: '#10b981', icon: 'bx-trophy',       source: 'pgl'  },
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
              <span className={`fn-stage-src fn-src-${stage.source}`}>{stage.source === 'meta' ? 'Meta' : 'PGL'}</span>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n) {
  if (!n && n !== 0) return '—'
  return `R$ ${Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getCprColor(cpr) {
  if (!cpr) return null
  if (cpr <= 50) return '#22c55e'
  if (cpr <= 100) return '#f59e0b'
  return '#ef4444'
}

// ─── Campaign Tree (same design as Campanhas tab) ─────────────────────────────

function CampaignTree({ metaRow, pglIndex, selCampaign, selAdset, selAd, onSelectCampaign, onSelectAdset, onSelectAd }) {
  const [expandedCampaigns, setExpandedCampaigns] = useState({})
  const [expandedAdsets, setExpandedAdsets] = useState({})

  const toggleCampaign = (id) => setExpandedCampaigns(p => ({ ...p, [id]: !p[id] }))
  const toggleAdset = (id) => setExpandedAdsets(p => ({ ...p, [id]: !p[id] }))

  const campaigns = metaRow?.campaigns || []

  if (!campaigns.length) {
    return <div className="fn-tree-empty">Sem campanhas no período selecionado.</div>
  }

  return (
    <div className="fn-tree-wrap">
      {/* Header row */}
      <div className="fn-tree-header">
        <span className="fn-tree-status-col" />
        <span className="fn-tree-name-col">Nome</span>
        <span className="fn-tree-cell">Investimento</span>
        <span className="fn-tree-cell">Resultados</span>
        <span className="fn-tree-cell">CPR</span>
        <span className="fn-tree-cell fn-pgl-col">Leads</span>
        <span className="fn-tree-cell fn-pgl-col">Púb. alvo</span>
        <span className="fn-tree-cell fn-pgl-col">Qualif.</span>
        <span className="fn-tree-cell fn-pgl-col">Conv.</span>
        <span className="fn-tree-cell fn-pgl-col">Taxa Q.</span>
        <span />
      </div>

      {campaigns.map((campaign, ci) => {
        const cid = campaign.campaignId || `c${ci}`
        const campCpr = campaign.results > 0 ? campaign.spend / campaign.results : null
        const campCprColor = getCprColor(campCpr)
        const campCrm = matchById(campaign.campaignId, campaign.name, pglIndex?.campaign || {})
        const campExpanded = expandedCampaigns[cid]
        const campSelected = selCampaign.has(cid)
        const adsets = campaign.adsets || []

        return (
          <div key={cid}>
            {/* Campaign row */}
            <div
              className={`fn-tree-row fn-tree-campaign${campSelected ? ' fn-tree-selected' : ''}`}
              onClick={e => onSelectCampaign(cid, e)}
            >
              <span className="fn-tree-status-col">
                <span className="fn-status-dot" style={{
                  background: campaign.effectiveStatus === 'ACTIVE' ? '#22c55e' : '#64748b',
                  boxShadow: campaign.effectiveStatus === 'ACTIVE' ? '0 0 5px #22c55e88' : 'none'
                }} />
              </span>
              <span className="fn-tree-name-col" title={campaign.name}>
                <span className="compact-level-badge compact-level-camp">Camp</span>
                <span className="fn-tree-name-text">{campaign.name || 'Sem nome'}</span>
              </span>
              <span className="fn-tree-cell">{formatCurrency(campaign.spend || 0)}</span>
              <span className="fn-tree-cell">{fmt(campaign.results || 0)}</span>
              <span className="fn-tree-cell" style={campCprColor ? { color: campCprColor, fontWeight: 600 } : undefined}>
                {campCpr ? formatCurrency(campCpr) : '—'}
              </span>
              <span className="fn-tree-cell fn-pgl-col" style={{ color: '#818cf8' }}>{fmt(campaign.results || 0)}</span>
              <span className="fn-tree-cell fn-pgl-col" style={{ color: '#a78bfa' }}>{fmt(campCrm?.publicoAlvo || 0)}</span>
              <span className="fn-tree-cell fn-pgl-col" style={{ color: '#34d399' }}>{fmt(campCrm?.qualified || 0)}</span>
              <span className="fn-tree-cell fn-pgl-col" style={{ color: '#10b981' }}>{fmt(campCrm?.converted || 0)}</span>
              <span className="fn-tree-cell fn-pgl-col" style={{ color: '#26c281' }}>
                {(campaign.results || 0) > 0 ? `${Math.round((campCrm?.qualified || 0) / campaign.results * 100)}%` : '—'}
              </span>
              <span className="fn-tree-expand-col" onClick={e => { e.stopPropagation(); if (adsets.length) toggleCampaign(cid) }}>
                {adsets.length > 0 && <span className="fn-expand-btn"><i className={`bx ${campExpanded ? 'bx-chevron-up' : 'bx-chevron-down'}`} /></span>}
              </span>
            </div>

            {/* Adsets */}
            {campExpanded && adsets.map((adset, ai) => {
              const aid = adset.adsetId || `a${ci}-${ai}`
              const adsetCpr = adset.results > 0 ? adset.spend / adset.results : null
              const adsetCrm = matchById(adset.adsetId, adset.name, pglIndex?.adset || {})
              const adsetExpanded = expandedAdsets[aid]
              const adsetSelected = selAdset.has(aid)
              const ads = adset.ads || []

              return (
                <div key={aid}>
                  <div
                    className={`fn-tree-row fn-tree-adset${adsetSelected ? ' fn-tree-selected' : ''}`}
                    onClick={e => onSelectAdset(aid, e)}
                  >
                    <span className="fn-tree-status-col">
                      <span className="fn-status-dot" style={{
                        background: adset.effectiveStatus === 'ACTIVE' ? '#22c55e' : '#64748b',
                        boxShadow: adset.effectiveStatus === 'ACTIVE' ? '0 0 5px #22c55e88' : 'none'
                      }} />
                    </span>
                    <span className="fn-tree-name-col fn-tree-adset-name" title={adset.name}>
                      <span className="compact-level-badge compact-level-adset">Conj</span>
                      <span className="fn-tree-name-text">{adset.name || 'Sem nome'}</span>
                    </span>
                    <span className="fn-tree-cell">{formatCurrency(adset.spend || 0)}</span>
                    <span className="fn-tree-cell">{fmt(adset.results || 0)}</span>
                    <span className="fn-tree-cell">{adsetCpr ? formatCurrency(adsetCpr) : '—'}</span>
                    <span className="fn-tree-cell fn-pgl-col" style={{ color: '#818cf8' }}>{fmt(adset.results || 0)}</span>
                    <span className="fn-tree-cell fn-pgl-col" style={{ color: '#a78bfa' }}>{fmt(adsetCrm?.publicoAlvo || 0)}</span>
                    <span className="fn-tree-cell fn-pgl-col" style={{ color: '#34d399' }}>{fmt(adsetCrm?.qualified || 0)}</span>
                    <span className="fn-tree-cell fn-pgl-col" style={{ color: '#10b981' }}>{fmt(adsetCrm?.converted || 0)}</span>
                    <span className="fn-tree-cell fn-pgl-col" style={{ color: '#26c281' }}>
                      {(adset.results || 0) > 0 ? `${Math.round((adsetCrm?.qualified || 0) / adset.results * 100)}%` : '—'}
                    </span>
                    <span className="fn-tree-expand-col" onClick={e => { e.stopPropagation(); if (ads.length) toggleAdset(aid) }}>
                      {ads.length > 0 && <span className="fn-expand-btn"><i className={`bx ${adsetExpanded ? 'bx-chevron-up' : 'bx-chevron-down'}`} /></span>}
                    </span>
                  </div>

                  {/* Ads */}
                  {adsetExpanded && ads.map((ad, adi) => {
                    const adid = ad.adId || `ad${ci}-${ai}-${adi}`
                    const adCpr = ad.results > 0 ? ad.spend / ad.results : null
                    const adCrm = matchById(ad.adId, ad.name, pglIndex?.ad || {})
                    const adSelected = selAd.has(adid)

                    return (
                      <div
                        key={adid}
                        className={`fn-tree-row fn-tree-ad${adSelected ? ' fn-tree-selected' : ''}`}
                        onClick={e => onSelectAd(adid, e)}
                      >
                        <span className="fn-tree-status-col">
                          <span className="fn-status-dot" style={{
                            width: 6, height: 6,
                            background: ad.spend > 0 ? '#22c55e' : '#64748b',
                            boxShadow: ad.spend > 0 ? '0 0 4px #22c55e88' : 'none'
                          }} />
                        </span>
                        <span className="fn-tree-name-col fn-tree-ad-name" title={ad.name}>
                          <span className="compact-level-badge compact-level-ad">Ad</span>
                          <span className="fn-tree-name-text">{ad.name || 'Sem nome'}</span>
                        </span>
                        <span className="fn-tree-cell">{formatCurrency(ad.spend || 0)}</span>
                        <span className="fn-tree-cell">{fmt(ad.results || 0)}</span>
                        <span className="fn-tree-cell">{adCpr ? formatCurrency(adCpr) : '—'}</span>
                        <span className="fn-tree-cell fn-pgl-col" style={{ color: '#818cf8' }}>{fmt(ad.results || 0)}</span>
                        <span className="fn-tree-cell fn-pgl-col" style={{ color: '#a78bfa' }}>{fmt(adCrm?.publicoAlvo || 0)}</span>
                        <span className="fn-tree-cell fn-pgl-col" style={{ color: '#34d399' }}>{fmt(adCrm?.qualified || 0)}</span>
                        <span className="fn-tree-cell fn-pgl-col" style={{ color: '#10b981' }}>{fmt(adCrm?.converted || 0)}</span>
                        <span className="fn-tree-cell fn-pgl-col" style={{ color: '#26c281' }}>
                          {(ad.results || 0) > 0 ? `${Math.round((adCrm?.qualified || 0) / ad.results * 100)}%` : '—'}
                        </span>
                        <span className="fn-tree-expand-col" />
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FunnelTab({ clients }) {
  const [selectedClientId, setSelectedClientId] = useState('')
  const [pglData, setpglData] = useState(null)
  const [pglLoading, setpglLoading] = useState(false)
  const [pglError, setpglError] = useState('')

  const [metaRow, setMetaRow] = useState(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState('')
  const [metaPeriod, setMetaPeriod] = useState('last_30d')
  const [metaCustomSince, setMetaCustomSince] = useState('')
  const [metaCustomUntil, setMetaCustomUntil] = useState('')

  // Cascade filters (by id) — Sets for multi-select
  const [selCampaign, setSelCampaign] = useState(new Set())
  const [selAdset, setSelAdset]       = useState(new Set())
  const [selAd, setSelAd]             = useState(new Set())
  const [hoveredStage, setHoveredStage] = useState(null)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)

  const [period, setPeriod] = useState('30d')
  const [customSince, setCustomSince] = useState('')
  const [customUntil, setCustomUntil] = useState('')

  // Meta breakdowns (creatives, states, ages, gender)
  const [breakdownsData, setBreakdownsData] = useState(null)
  const [breakdownsLoading, setBreakdownsLoading] = useState(false)
  const [breakdownsError, setBreakdownsError] = useState('')

  // Creative preview modal
  const [previewCreative, setPreviewCreative] = useState(null)
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  // Export
  const [isExportingFunnel, setIsExportingFunnel] = useState(false)

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
  useEffect(() => { setSelCampaign(new Set()); setSelAdset(new Set()); setSelAd(new Set()) }, [selectedClientId])

  const isMetaCustomPeriod = metaPeriod === 'custom'
  const metaCustomRangeReady = !isMetaCustomPeriod || Boolean(metaCustomSince && metaCustomUntil)

  const loadMeta = useCallback(async () => {
    if (!activeClient) return
    if (isMetaCustomPeriod && !metaCustomRangeReady) return
    setMetaLoading(true); setMetaError(''); setMetaRow(null)
    try {
      const params = new URLSearchParams(
        isMetaCustomPeriod
          ? { date_preset: 'custom', since: metaCustomSince, until: metaCustomUntil }
          : { date_preset: metaPeriod }
      )
      const res = await fetch(`/api/meta/campaigns-overview?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar dados do Meta.')
      setMetaRow((json.rows || []).find(r => r.clientId === activeClient.id) || null)
    } catch (e) { setMetaError(e.message) }
    finally { setMetaLoading(false) }
  }, [activeClient, metaPeriod, isMetaCustomPeriod, metaCustomRangeReady, metaCustomSince, metaCustomUntil])

  useEffect(() => { loadMeta() }, [loadMeta])

  const loadBreakdowns = useCallback(async () => {
    if (!activeClient?.metaAdAccountId) { setBreakdownsData(null); return }
    if (isMetaCustomPeriod && !metaCustomRangeReady) return
    setBreakdownsLoading(true); setBreakdownsError('')
    try {
      const params = new URLSearchParams({
        ad_account_id: activeClient.metaAdAccountId,
        ...(isMetaCustomPeriod
          ? { date_preset: 'custom', since: metaCustomSince, until: metaCustomUntil }
          : { date_preset: metaPeriod }),
      })
      if (selAd.size) params.set('ad_ids', Array.from(selAd).join(','))
      else if (selAdset.size) params.set('adset_ids', Array.from(selAdset).join(','))
      else if (selCampaign.size) params.set('campaign_ids', Array.from(selCampaign).join(','))
      const res = await fetch(`/api/meta/breakdowns?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar rankings do Meta.')
      setBreakdownsData(json)
    } catch (e) { setBreakdownsError(e.message) }
    finally { setBreakdownsLoading(false) }
  }, [activeClient, metaPeriod, isMetaCustomPeriod, metaCustomRangeReady, metaCustomSince, metaCustomUntil, selCampaign, selAdset, selAd])

  useEffect(() => { loadBreakdowns() }, [loadBreakdowns])

  const loadpgl = useCallback(async () => {
    if (!activeClient?.leadsSheetUrl) { setpglData(null); return }
    setpglLoading(true); setpglError('')
    try {
      const pad = n => String(n).padStart(2, '0')
      const fmtD = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
      const today = new Date()
      let since = '', until = ''
      if (period === '7d') { const s = new Date(today); s.setDate(s.getDate()-6); since = fmtD(s); until = fmtD(today) }
      else if (period === '30d') { const s = new Date(today); s.setDate(s.getDate()-29); since = fmtD(s); until = fmtD(today) }
      else if (period === 'month') { since = fmtD(new Date(today.getFullYear(), today.getMonth(), 1)); until = fmtD(today) }
      else if (period === 'custom') { since = customSince; until = customUntil }

      const params = new URLSearchParams({ url: activeClient.leadsSheetUrl, gid: activeClient.leadsSheetGid || 'all', header_row: activeClient.googleSheetsHeaderRow || 1 })
      if (since) params.set('since', since)
      if (until) params.set('until', until)
      const columnMap = activeClient.leadsSheetColumnMap || {}
      if (columnMap.name) params.set('col_name', columnMap.name)
      if (columnMap.phone) params.set('col_phone', columnMap.phone)
      if (columnMap.qualification) params.set('col_qualification', columnMap.qualification)
      if (columnMap.city) params.set('col_city', columnMap.city)
      if (columnMap.state) params.set('col_state', columnMap.state)
      if (columnMap.date) params.set('col_date', columnMap.date)
      if (columnMap.counter) params.set('col_counter', columnMap.counter)
      const res = await fetch(`/api/google-sheets/leads-analytics?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar PGL.')
      setpglData(json)
    } catch (e) { setpglError(e.message) }
    finally { setpglLoading(false) }
  }, [activeClient, period, customSince, customUntil])

  useEffect(() => { loadpgl() }, [loadpgl])

  // ─── PGL index by name ────────────────────────────────────────────────────

  const pglIndex = useMemo(() => {
    if (!pglData) return null
    const buildMaps = (items) => {
      const byName = new Map(), byId = new Map()
      for (const item of items || []) {
        byName.set(norm(item.name), item)
        // Leads sheets exported from Meta always carry campaign_id/adset_id/ad_id — when the
        // sheet has that column, prefer matching by id so it survives ad/campaign renames.
        if (item.id) byId.set(norm(item.id), item)
      }
      return { byName, byId }
    }
    return {
      campaign: buildMaps(pglData.campaigns),
      adset:    buildMaps(pglData.adsets),
      ad:       buildMaps(pglData.ads),
    }
  }, [pglData])

  // ─── Cascade options ──────────────────────────────────────────────────────

  const campaignOptions = useMemo(() => metaRow?.campaigns || [], [metaRow])

  const adsetOptions = useMemo(() => {
    if (!selCampaign.size) return metaRow?.campaigns?.flatMap(c => c.adsets || []) || []
    return campaignOptions.filter(c => selCampaign.has(c.campaignId)).flatMap(c => c.adsets || [])
  }, [selCampaign, campaignOptions, metaRow])

  const adOptions = useMemo(() => {
    if (!selAdset.size) return adsetOptions.flatMap(a => a.ads || [])
    return adsetOptions.filter(a => selAdset.has(a.adsetId)).flatMap(a => a.ads || [])
  }, [selAdset, adsetOptions])

  // ─── Funnel Meta values ───────────────────────────────────────────────────

  const funnelMeta = useMemo(() => {
    if (!metaRow) return { impressions: 0, clicks: 0, leads: 0, spend: 0 }
    let impressions = 0, clicks = 0, leads = 0, spend = 0
    const sum = items => { for (const it of items) { impressions += Number(it.impressions||0); clicks += Number(it.clicks||0); leads += Number(it.results||0); spend += Number(it.spend||0) } }
    if (selAd.size) sum(adOptions.filter(a => selAd.has(a.adId)))
    else if (selAdset.size) sum(adsetOptions.filter(a => selAdset.has(a.adsetId)))
    else if (selCampaign.size) sum(campaignOptions.filter(c => selCampaign.has(c.campaignId)))
    else sum(metaRow.campaigns || [])
    return { impressions, clicks, leads, spend }
  }, [metaRow, selCampaign, selAdset, selAd, campaignOptions, adsetOptions, adOptions])

  // ─── Funnel PGL values ────────────────────────────────────────────────────

  const funnelpgl = useMemo(() => {
    const empty = { publicoAlvo: 0, qualified: 0, converted: 0, lost: 0, noreply: 0 }
    if (!pglData) return empty
    const merge = items => items.reduce((acc, m) => ({
      publicoAlvo: acc.publicoAlvo + (m?.publicoAlvo || 0),
      qualified:   acc.qualified   + (m?.qualified   || 0),
      converted:   acc.converted   + (m?.converted   || 0),
      lost:        acc.lost        + (m?.lost         || 0),
      noreply:     acc.noreply     + (m?.noreply      || 0),
    }), { publicoAlvo: 0, qualified: 0, converted: 0, lost: 0, noreply: 0 })
    if (selAd.size) return merge(adOptions.filter(a => selAd.has(a.adId)).map(a => matchById(a.adId, a.name, pglIndex?.ad || {})))
    if (selAdset.size) return merge(adsetOptions.filter(a => selAdset.has(a.adsetId)).map(a => matchById(a.adsetId, a.name, pglIndex?.adset || {})))
    if (selCampaign.size) return merge(campaignOptions.filter(c => selCampaign.has(c.campaignId)).map(c => matchById(c.campaignId, c.name, pglIndex?.campaign || {})))
    return pglData.overview || empty
  }, [pglData, selCampaign, selAdset, selAd, campaignOptions, adsetOptions, adOptions, pglIndex])

  const stages = useMemo(() => [
    { ...STAGE_CONFIG[0], value: funnelMeta.impressions },
    { ...STAGE_CONFIG[1], value: funnelMeta.clicks },
    { ...STAGE_CONFIG[2], value: funnelMeta.leads },
    { ...STAGE_CONFIG[3], value: funnelpgl.publicoAlvo || 0 },
    { ...STAGE_CONFIG[4], value: funnelpgl.qualified || 0 },
    { ...STAGE_CONFIG[5], value: funnelpgl.converted || 0 },
  ], [funnelMeta, funnelpgl])

  const topValue = stages[0]?.value || 1

  const cpl      = funnelMeta.leads > 0 ? funnelMeta.spend / funnelMeta.leads : 0
  const ctr      = funnelMeta.impressions > 0 ? (funnelMeta.clicks / funnelMeta.impressions) * 100 : 0
  const cpc      = funnelMeta.clicks > 0 ? funnelMeta.spend / funnelMeta.clicks : 0
  const qualRate = funnelMeta.leads > 0 ? (funnelpgl.qualified || 0) / funnelMeta.leads : 0
  const convRate = funnelMeta.leads > 0 ? (funnelpgl.converted || 0) / funnelMeta.leads : 0
  const lostRate = funnelMeta.leads > 0 ? (funnelpgl.lost || 0) / funnelMeta.leads : 0

  const alerts = useMemo(() => {
    const list = []
    if (funnelMeta.clicks > 0 && funnelMeta.leads / funnelMeta.clicks < 0.01)
      list.push({ type: 'warning', text: `Taxa clique→lead muito baixa (${(funnelMeta.leads / funnelMeta.clicks * 100).toFixed(1)}%). Verifique o formulário.` })
    if (funnelMeta.leads > 10 && qualRate < 0.2)
      list.push({ type: 'warning', text: `Apenas ${Math.round(qualRate*100)}% dos leads qualificados. Alto volume, baixa qualidade.` })
    if ((funnelpgl.lost || 0) > (funnelpgl.qualified || 0))
      list.push({ type: 'critical', text: 'Mais leads perdidos do que qualificados. Gargalo na qualificação.' })
    if ((funnelpgl.noreply || 0) / Math.max(funnelMeta.leads, 1) > 0.4)
      list.push({ type: 'warning', text: `${Math.round((funnelpgl.noreply||0)/Math.max(funnelMeta.leads,1)*100)}% sem resposta. Possível falha no atendimento.` })
    if (funnelpgl.qualified > 0 && (funnelpgl.converted||0) / funnelpgl.qualified < 0.1)
      list.push({ type: 'info', text: `Taxa de fechamento baixa: ${Math.round((funnelpgl.converted||0)/funnelpgl.qualified*100)}% dos qualificados convertidos.` })
    return list
  }, [funnelMeta, funnelpgl, qualRate])

  // ─── Rankings with stable _id for selection ───────────────────────────────

  const campaignRanking = useMemo(() => (metaRow?.campaigns || []).map(c => {
    const pgl = matchById(c.campaignId, c.name, pglIndex?.campaign || {})
    return { _id: c.campaignId, name: c.name, leads: c.results||0, spend: c.spend||0,
      publicoAlvo: pgl?.publicoAlvo||0, qualified: pgl?.qualified||0, converted: pgl?.converted||0,
      qualRate: (c.results||0)>0 ? (pgl?.qualified||0)/(c.results||1) : 0 }
  }).sort((a,b) => b.leads - a.leads), [metaRow, pglIndex])

  const adsetRanking = useMemo(() => (metaRow?.campaigns?.flatMap(c => c.adsets||[]) || []).map(a => {
    const pgl = matchById(a.adsetId, a.name, pglIndex?.adset || {})
    return { _id: a.adsetId, name: a.name, leads: a.results||0, spend: a.spend||0,
      qualified: pgl?.qualified||0, converted: pgl?.converted||0 }
  }).sort((a,b) => b.leads - a.leads), [metaRow, pglIndex])

  const adRanking = useMemo(() => (metaRow?.campaigns?.flatMap(c => c.adsets?.flatMap(a => a.ads||[])||[]) || []).map(a => {
    const pgl = matchById(a.adId, a.name, pglIndex?.ad || {})
    return { _id: a.adId, name: a.name, leads: a.results||0, spend: a.spend||0,
      qualified: pgl?.qualified||0, converted: pgl?.converted||0 }
  }).sort((a,b) => b.leads - a.leads), [metaRow, pglIndex])

  const haspgl = Boolean(activeClient?.leadsSheetUrl)

  // ─── Top 5 breakdowns (Meta Ads) ───────────────────────────────────────────

  const topCreatives = useMemo(() => (breakdownsData?.creatives || []).slice(0, 5), [breakdownsData])
  const topStates = useMemo(() => (breakdownsData?.states || []).slice(0, 5), [breakdownsData])
  const topAges = useMemo(() => (breakdownsData?.ages || []).slice(0, 5), [breakdownsData])
  const genderBreakdown = useMemo(() => breakdownsData?.genders || [], [breakdownsData])

  const statesTotal = useMemo(() => (breakdownsData?.states || []).reduce((s, r) => s + (r.custom_metrics?.totalConversions || 0), 0), [breakdownsData])
  const agesTotal = useMemo(() => (breakdownsData?.ages || []).reduce((s, r) => s + (r.custom_metrics?.totalConversions || 0), 0), [breakdownsData])
  const gendersTotal = useMemo(() => genderBreakdown.reduce((s, r) => s + (r.custom_metrics?.totalConversions || 0), 0), [genderBreakdown])

  const GENDER_LABELS = { male: 'Masculino', female: 'Feminino', unknown: 'Não informado' }

  // ─── Creative preview modal ────────────────────────────────────────────────

  const openCreativePreview = useCallback((creative) => setPreviewCreative(creative), [])
  const closeCreativePreview = useCallback(() => { setPreviewCreative(null); setPreviewData(null); setPreviewError('') }, [])

  useEffect(() => {
    if (!previewCreative?.adId || !activeClient?.metaAdAccountId) {
      setPreviewData(null); setPreviewLoading(false); setPreviewError('')
      return
    }
    let cancelled = false
    const run = async () => {
      setPreviewData(null); setPreviewLoading(true); setPreviewError('')
      try {
        const params = new URLSearchParams({ ad_id: previewCreative.adId, ad_account_id: activeClient.metaAdAccountId })
        const res = await fetch(`/api/meta/creative-preview?${params}`)
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'Não foi possível carregar o preview deste criativo.')
        if (!cancelled) setPreviewData(json)
      } catch (e) {
        if (!cancelled) setPreviewError(e.message || 'Não foi possível carregar o preview deste criativo.')
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [previewCreative, activeClient])

  // ─── Export (CSV / PDF) ─────────────────────────────────────────────────────

  const funnelExportFileName = useMemo(() => {
    const base = `funil-${activeClient?.name || 'cliente'}`
    const stripped = base.normalize('NFD').split('').filter((ch) => ch.charCodeAt(0) < 0x0300 || ch.charCodeAt(0) > 0x036f).join('')
    return stripped
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .toLowerCase()
      .replace(/^-+|-+$/g, '')
  }, [activeClient])

  const buildFunnelExportRows = useCallback(() => {
    const rows = []
    rows.push({ Seção: 'Funil', Item: 'Impressões', Valor: fmt(funnelMeta.impressions) })
    rows.push({ Seção: 'Funil', Item: 'Cliques', Valor: fmt(funnelMeta.clicks) })
    rows.push({ Seção: 'Funil', Item: 'Leads', Valor: fmt(funnelMeta.leads) })
    rows.push({ Seção: 'Funil', Item: 'Público-alvo', Valor: fmt(funnelpgl.publicoAlvo || 0) })
    rows.push({ Seção: 'Funil', Item: 'Qualificados', Valor: fmt(funnelpgl.qualified || 0) })
    rows.push({ Seção: 'Funil', Item: 'Convertidos', Valor: fmt(funnelpgl.converted || 0) })
    rows.push({ Seção: 'Funil', Item: 'Perdidos', Valor: fmt(funnelpgl.lost || 0) })
    rows.push({ Seção: 'Funil', Item: 'Sem resposta', Valor: fmt(funnelpgl.noreply || 0) })
    rows.push({ Seção: 'Métricas', Item: 'Investimento', Valor: fmtMoney(funnelMeta.spend) })
    rows.push({ Seção: 'Métricas', Item: 'CTR', Valor: `${ctr.toFixed(2)}%` })
    rows.push({ Seção: 'Métricas', Item: 'CPC', Valor: fmtMoney(cpc) })
    rows.push({ Seção: 'Métricas', Item: 'CPL', Valor: fmtMoney(cpl) })
    rows.push({ Seção: 'Métricas', Item: 'Taxa de qualificação', Valor: `${Math.round(qualRate * 100)}%` })
    rows.push({ Seção: 'Métricas', Item: 'Taxa de conversão', Valor: `${Math.round(convRate * 100)}%` })
    rows.push({ Seção: 'Métricas', Item: 'Taxa de perda', Valor: `${Math.round(lostRate * 100)}%` })
    topCreatives.forEach((c, i) => rows.push({
      Seção: 'Top Criativos', Item: `${i + 1}. ${c.label}`,
      Valor: `Resultado: ${fmt(c.custom_metrics?.totalConversions || 0)} | Custo/resultado: ${c.custom_metrics?.cpa ? fmtMoney(c.custom_metrics.cpa) : '—'} | Investimento: ${fmtMoney(c.spend)} | CTR: ${(c.custom_metrics?.ctr || 0).toFixed(2)}%`,
    }))
    topStates.forEach((s, i) => rows.push({
      Seção: 'Top Estados', Item: `${i + 1}. ${s.label}`,
      Valor: `Resultados: ${fmt(s.custom_metrics?.totalConversions || 0)} (${pct(s.custom_metrics?.totalConversions || 0, statesTotal)})`,
    }))
    topAges.forEach((a, i) => rows.push({
      Seção: 'Top Idades', Item: `${i + 1}. ${a.label}`,
      Valor: `Resultados: ${fmt(a.custom_metrics?.totalConversions || 0)} (${pct(a.custom_metrics?.totalConversions || 0, agesTotal)})`,
    }))
    genderBreakdown.forEach((g) => rows.push({
      Seção: 'Gênero', Item: GENDER_LABELS[g.label] || g.label,
      Valor: `Resultados: ${fmt(g.custom_metrics?.totalConversions || 0)} (${pct(g.custom_metrics?.totalConversions || 0, gendersTotal)})`,
    }))
    return rows
  }, [funnelMeta, funnelpgl, ctr, cpc, cpl, qualRate, convRate, lostRate, topCreatives, topStates, topAges, genderBreakdown, statesTotal, agesTotal, gendersTotal])

  const handleExportFunnelCsv = useCallback(() => {
    const rows = buildFunnelExportRows()
    if (!rows.length) { window.alert('Nenhum dado encontrado para exportar no funil atual.'); return }
    const columns = ['Seção', 'Item', 'Valor']
    const escapeCsvCell = (value) => {
      const text = String(value ?? '')
      const escaped = text.replace(/"/g, '""')
      return /[";\n\r]/.test(escaped) ? `"${escaped}"` : escaped
    }
    const csv = '﻿' + [
      columns.join(';'),
      ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(';')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${funnelExportFileName}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }, [buildFunnelExportRows, funnelExportFileName])

  const handleExportFunnelPdf = useCallback(async () => {
    const rows = buildFunnelExportRows()
    if (!rows.length) { window.alert('Nenhum dado encontrado para exportar no funil atual.'); return }
    setIsExportingFunnel(true)
    try {
      const jsPdfModule = await import('jspdf')
      const JsPDF = jsPdfModule.default || jsPdfModule.jsPDF
      const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 32
      let y = margin

      pdf.setFillColor(38, 194, 129)
      pdf.rect(0, 0, pageWidth, 64, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(16)
      pdf.text(`Funil de Performance — ${activeClient?.name || ''}`, margin, 38)
      pdf.setFontSize(10)
      pdf.text(`Exportado em ${new Date().toLocaleString('pt-BR')}`, margin, 54)
      y = 64 + margin

      pdf.setTextColor(20, 20, 20)
      let currentSection = ''
      rows.forEach((row) => {
        if (y > pageHeight - margin) { pdf.addPage(); y = margin }
        if (row['Seção'] !== currentSection) {
          currentSection = row['Seção']
          y += 6
          pdf.setFillColor(230, 246, 239)
          pdf.roundedRect(margin, y - 12, pageWidth - margin * 2, 20, 4, 4, 'F')
          pdf.setFontSize(11)
          pdf.setTextColor(0, 87, 54)
          pdf.text(String(currentSection), margin + 8, y + 2)
          pdf.setTextColor(20, 20, 20)
          y += 20
        }
        pdf.setFontSize(9)
        const lines = pdf.splitTextToSize(`${row['Item']}: ${row['Valor']}`, pageWidth - margin * 2 - 8)
        pdf.text(lines, margin + 8, y)
        y += lines.length * 12 + 4
      })

      pdf.save(`${funnelExportFileName}.pdf`)
    } catch (e) {
      window.alert('Não consegui gerar o PDF agora. Tente exportar como CSV ou recarregar a página.')
    } finally {
      setIsExportingFunnel(false)
    }
  }, [buildFunnelExportRows, funnelExportFileName, activeClient])

  // Rótulo do filtro atual
  const filterLabel = useMemo(() => {
    if (selAd.size) {
      if (selAd.size > 1) return `${selAd.size} anúncios`
      return adOptions.find(a => selAd.has(a.adId))?.name || 'Anúncio'
    }
    if (selAdset.size) {
      if (selAdset.size > 1) return `${selAdset.size} conjuntos`
      return adsetOptions.find(a => selAdset.has(a.adsetId))?.name || 'Conjunto'
    }
    if (selCampaign.size) {
      if (selCampaign.size > 1) return `${selCampaign.size} campanhas`
      return campaignOptions.find(c => selCampaign.has(c.campaignId))?.name || 'Campanha'
    }
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
      {/* Main panel */}
      <div className="fn-main">

        {/* Header */}
        <div className="fn-header">
          <div>
            <span className="fn-kicker">Funil de Performance</span>
            <h2 className="fn-title">{activeClient?.name}</h2>
            {!haspgl && <p className="fn-no-pgl">Planilha não configurada — apenas dados Meta.</p>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Client picker */}
            <div className="fn-client-picker-wrap">
              <button type="button" className="fn-client-picker-btn" onClick={() => setClientPickerOpen(o => !o)}>
                {activeClient?.logoUrl
                  ? <img src={activeClient.logoUrl} alt="" className="fn-cp-logo" />
                  : <span className="fn-cp-avatar" style={{ background: activeClient?.dashboardColor || '#6366f1' }}>{(activeClient?.name||'?')[0].toUpperCase()}</span>
                }
                <span className="fn-cp-name">{activeClient?.name || 'Selecionar cliente'}</span>
                <i className="bx bx-chevron-down fn-cp-chevron" />
              </button>
              {clientPickerOpen && (
                <div className="fn-client-picker-dropdown">
                  {metaClients.map(c => (
                    <button key={c.id} type="button"
                      className={`fn-cp-option${activeClient?.id === c.id ? ' active' : ''}`}
                      onClick={() => { setSelectedClientId(c.id); setClientPickerOpen(false) }}
                    >
                      {c.logoUrl
                        ? <img src={c.logoUrl} alt="" className="fn-cp-logo" />
                        : <span className="fn-cp-avatar" style={{ background: c.dashboardColor || '#6366f1' }}>{(c.name||'?')[0].toUpperCase()}</span>
                      }
                      <span className="fn-cp-name">{c.name}</span>
                      {c.leadsSheetUrl && <i className="bx bx-spreadsheet" style={{ fontSize: 12, color: 'rgba(38,194,129,.6)', marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="fn-refresh" onClick={loadMeta} title="Atualizar Meta" disabled={metaLoading}>
              <i className={`bx bx-refresh${metaLoading ? ' bx-spin' : ''}`} />
            </button>
            <button type="button" className="fn-refresh" onClick={loadpgl} title="Atualizar PGL" disabled={pglLoading}>
              <i className={`bx bx-spreadsheet${pglLoading ? ' bx-spin' : ''}`} />
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleExportFunnelCsv} disabled={isExportingFunnel}>
              <i className="bx bx-download" /> Exportar CSV
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExportFunnelPdf} disabled={isExportingFunnel}>
              <i className={`bx ${isExportingFunnel ? 'bx-loader-alt bx-spin' : 'bx-file'}`} /> Exportar PDF
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
            { id: 'custom',   label: 'Personalizado' },
          ].map(p => (
            <button key={p.id} type="button"
              className={`fn-period-btn${metaPeriod === p.id ? ' active' : ''}`}
              onClick={() => setMetaPeriod(p.id)}>{p.label}</button>
          ))}
          {isMetaCustomPeriod && (<>
            <input type="date" className="fn-date-input" value={metaCustomSince} onChange={e => setMetaCustomSince(e.target.value)} />
            <span style={{ color: 'rgba(241,241,241,0.3)', fontSize: 12 }}>→</span>
            <input type="date" className="fn-date-input" value={metaCustomUntil} onChange={e => setMetaCustomUntil(e.target.value)} />
            <button type="button" className="fn-apply-btn" onClick={() => { loadMeta(); loadBreakdowns() }} disabled={!metaCustomSince || !metaCustomUntil}>Aplicar</button>
          </>)}
          {metaError && <span className="fn-inline-error"><i className="bx bx-error-circle" /> {metaError}</span>}
        </div>

        <div className="fn-period-bar">
          <span className="fn-period-label"><i className="bx bx-spreadsheet" /> PGL:</span>
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
            <button type="button" className="fn-apply-btn" onClick={loadpgl} disabled={!customSince || !customUntil}>Aplicar</button>
          </>)}
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

        {/* Body: campaign tree LEFT + funnel RIGHT */}
        <div className="fn-body">

          {/* Left column: campaign tree + top breakdowns */}
          <div className="fn-left-col">
          <div className="fn-tree-panel">
            <CampaignTree
              metaRow={metaRow}
              pglIndex={pglIndex}
              selCampaign={selCampaign}
              selAdset={selAdset}
              selAd={selAd}
              onSelectCampaign={(id, e) => {
                const multi = e?.metaKey || e?.ctrlKey
                setSelCampaign(prev => {
                  if (multi) { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }
                  return prev.has(id) && prev.size === 1 ? new Set() : new Set([id])
                })
                if (!multi) { setSelAdset(new Set()); setSelAd(new Set()) }
              }}
              onSelectAdset={(id, e) => {
                const multi = e?.metaKey || e?.ctrlKey
                setSelAdset(prev => {
                  if (multi) { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }
                  return prev.has(id) && prev.size === 1 ? new Set() : new Set([id])
                })
                if (!multi) { setSelAd(new Set()) }
              }}
              onSelectAd={(id, e) => {
                const multi = e?.metaKey || e?.ctrlKey
                setSelAd(prev => {
                  if (multi) { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }
                  return prev.has(id) && prev.size === 1 ? new Set() : new Set([id])
                })
              }}
            />
          </div>

          {/* Top breakdowns: Criativos, Estados, Idades, Gênero */}
          <div className="fn-breakdowns-row">
            {/* Top 5 Criativos */}
            <div className="fn-bd-card fn-bd-creatives">
              <div className="fn-bd-title">
                <span><i className="bx bx-images" /> Top 5 Criativos</span>
                {breakdownsLoading && <i className="bx bx-loader-alt bx-spin" />}
              </div>
              {breakdownsError && <div className="fn-bd-error"><i className="bx bx-error-circle" /> {breakdownsError}</div>}
              {!breakdownsError && topCreatives.length === 0 && !breakdownsLoading && (
                <div className="fn-bd-empty">Nenhum criativo com investimento no período.</div>
              )}
              {topCreatives.map((c, i) => (
                <button type="button" key={c.adId || i} className="fn-bd-creative-item" onClick={() => openCreativePreview(c)}>
                  <span className="fn-bd-rank">{i + 1}</span>
                  <span className="fn-bd-creative-thumb">
                    <img src={c.imageUrl} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  </span>
                  <span className="fn-bd-creative-info">
                    <strong title={c.label}>{c.label}</strong>
                    <span className="fn-bd-creative-metrics">
                      <span>Resultado: <b>{fmt(c.custom_metrics?.totalConversions || 0)}</b></span>
                      {c.custom_metrics?.cpa > 0 && <span>Custo/res.: <b>{fmtMoney(c.custom_metrics.cpa)}</b></span>}
                      <span>Invest.: <b>{fmtMoney(c.spend)}</b></span>
                      {c.custom_metrics?.ctr > 0 && <span>CTR: <b>{c.custom_metrics.ctr.toFixed(2)}%</b></span>}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {/* Top 5 Estados */}
            <div className="fn-bd-card">
              <div className="fn-bd-title">
                <span><i className="bx bx-map" /> Top 5 Estados</span>
                {breakdownsLoading && <i className="bx bx-loader-alt bx-spin" />}
              </div>
              {!breakdownsError && topStates.length === 0 && !breakdownsLoading && (
                <div className="fn-bd-empty">Sem dados de estado no período.</div>
              )}
              {topStates.map((s, i) => {
                const val = s.custom_metrics?.totalConversions || 0
                const barPct = statesTotal ? Math.max(4, (val / statesTotal) * 100) : 4
                return (
                  <div className="fn-bd-rank-item" key={s.label + i}>
                    <span className="fn-bd-rank">{i + 1}</span>
                    <span className="fn-bd-rank-info">
                      <span className="fn-bd-rank-label" title={s.label}>{s.label}</span>
                      <span className="fn-bd-rank-bar-track"><span className="fn-bd-rank-bar-fill" style={{ width: `${barPct}%` }} /></span>
                    </span>
                    <span className="fn-bd-rank-value">{fmt(val)}<small>{pct(val, statesTotal)}</small></span>
                  </div>
                )
              })}
            </div>

            {/* Top Idades */}
            <div className="fn-bd-card">
              <div className="fn-bd-title">
                <span><i className="bx bx-group" /> Top Idades</span>
                {breakdownsLoading && <i className="bx bx-loader-alt bx-spin" />}
              </div>
              {!breakdownsError && topAges.length === 0 && !breakdownsLoading && (
                <div className="fn-bd-empty">Sem dados de idade no período.</div>
              )}
              {topAges.map((a, i) => {
                const val = a.custom_metrics?.totalConversions || 0
                const barPct = agesTotal ? Math.max(4, (val / agesTotal) * 100) : 4
                return (
                  <div className="fn-bd-rank-item" key={a.label + i}>
                    <span className="fn-bd-rank">{i + 1}</span>
                    <span className="fn-bd-rank-info">
                      <span className="fn-bd-rank-label">{a.label}</span>
                      <span className="fn-bd-rank-bar-track"><span className="fn-bd-rank-bar-fill" style={{ width: `${barPct}%`, background: '#a78bfa' }} /></span>
                    </span>
                    <span className="fn-bd-rank-value">{fmt(val)}<small>{pct(val, agesTotal)}</small></span>
                  </div>
                )
              })}
            </div>

            {/* Gênero (compacto) */}
            <div className="fn-bd-card fn-bd-gender">
              <div className="fn-bd-title">
                <span><i className="bx bx-male-female" /> Gênero</span>
                {breakdownsLoading && <i className="bx bx-loader-alt bx-spin" />}
              </div>
              {!breakdownsError && genderBreakdown.length === 0 && !breakdownsLoading && (
                <div className="fn-bd-empty">Sem dados de gênero.</div>
              )}
              {genderBreakdown.map((g) => {
                const val = g.custom_metrics?.totalConversions || 0
                const barPct = gendersTotal ? Math.max(4, (val / gendersTotal) * 100) : 4
                return (
                  <div className="fn-bd-gender-item" key={g.label}>
                    <div className="fn-bd-gender-row">
                      <span>{GENDER_LABELS[g.label] || g.label || 'Não informado'}</span>
                      <span>{fmt(val)} <small>{pct(val, gendersTotal)}</small></span>
                    </div>
                    <span className="fn-bd-rank-bar-track"><span className="fn-bd-rank-bar-fill" style={{ width: `${barPct}%`, background: '#38bdf8' }} /></span>
                  </div>
                )
              })}
            </div>
          </div>
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
                  {(metaLoading || pglLoading) && <span className="fn-loading-pill"><i className="bx bx-loader-alt bx-spin" /></span>}
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

              {haspgl && (
                <div className="fn-pgl-losses">
                  <div className="fn-pgl-loss-item" style={{ borderColor: '#ef4444' }}>
                    <i className="bx bx-x-circle" style={{ color: '#ef4444' }} />
                    <div>
                      <div className="fn-pgl-loss-val">{fmt(funnelpgl.lost || 0)}</div>
                      <div className="fn-pgl-loss-label">Perdidos <span>{pct(funnelpgl.lost||0, funnelMeta.leads)}</span></div>
                    </div>
                  </div>
                  <div className="fn-pgl-loss-item" style={{ borderColor: '#f59e0b' }}>
                    <i className="bx bx-time" style={{ color: '#f59e0b' }} />
                    <div>
                      <div className="fn-pgl-loss-val">{fmt(funnelpgl.noreply || 0)}</div>
                      <div className="fn-pgl-loss-label">Sem resp. <span>{pct(funnelpgl.noreply||0, funnelMeta.leads)}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {pglError && (
                <div className="fn-pgl-error"><i className="bx bx-error-circle" /> {pglError}</div>
              )}
            </div>

            {/* Timeline */}
            {pglData?.timeline?.length > 0 && (
              <div className="fn-timeline-card">
                <div className="fn-timeline-title">Evolução Temporal</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={pglData.timeline} margin={{ left: 0, right: 12 }}>
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

      {/* Creative preview modal */}
      {previewCreative && (
        <div className="modal-overlay fn-preview-overlay" onClick={closeCreativePreview}>
          <div className="modal-card fn-preview-card" onClick={(e) => e.stopPropagation()}>
            <div className="fn-preview-header">
              <div>
                <span className="fn-preview-kicker">Preview do criativo</span>
                <h3>{previewCreative.label}</h3>
              </div>
              <button type="button" className="fn-preview-close" onClick={closeCreativePreview}>
                <i className="bx bx-x" />
              </button>
            </div>
            <div className="fn-preview-metrics">
              <span>Resultado: <b>{fmt(previewCreative.custom_metrics?.totalConversions || 0)}</b></span>
              {previewCreative.custom_metrics?.cpa > 0 && <span>Custo/resultado: <b>{fmtMoney(previewCreative.custom_metrics.cpa)}</b></span>}
              <span>Investimento: <b>{fmtMoney(previewCreative.spend)}</b></span>
              {previewCreative.custom_metrics?.ctr > 0 && <span>CTR: <b>{previewCreative.custom_metrics.ctr.toFixed(2)}%</b></span>}
            </div>
            <div className="fn-preview-body">
              {previewLoading && <div className="fn-preview-loading"><i className="bx bx-loader-alt bx-spin" /> Carregando preview...</div>}
              {!previewLoading && previewError && (
                <div className="fn-preview-empty">
                  <i className="bx bx-image-alt" />
                  <p>Preview não disponível para este criativo.</p>
                </div>
              )}
              {!previewLoading && !previewError && previewData?.previewHtml && (
                <div className="fn-preview-frame" dangerouslySetInnerHTML={{ __html: previewData.previewHtml }} />
              )}
              {!previewLoading && !previewError && !previewData?.previewHtml && (
                <div className="fn-preview-empty">
                  <i className="bx bx-image-alt" />
                  <p>Preview não disponível para este criativo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* ─── Layout ─── */
        .fn-root { display: flex; flex-direction: column; }

        /* ─── Client picker ─── */
        .fn-client-picker-wrap { position: relative; }
        .fn-client-picker-btn {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
          border-radius: 10px; color: #f1f1f1; cursor: pointer; padding: 6px 12px;
          font-size: 13px; font-weight: 600; transition: all .15s; max-width: 220px;
        }
        .fn-client-picker-btn:hover { background: rgba(255,255,255,.1); }
        .fn-cp-logo { width: 22px; height: 22px; border-radius: 5px; object-fit: cover; flex-shrink: 0; }
        .fn-cp-avatar { width: 22px; height: 22px; border-radius: 5px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
        .fn-cp-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
        .fn-cp-chevron { font-size: 14px; opacity: .6; flex-shrink: 0; }
        .fn-client-picker-dropdown {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
          background: #1a1f2e; border: 1px solid rgba(255,255,255,.12);
          border-radius: 12px; padding: 6px; display: flex; flex-direction: column; gap: 2px;
          min-width: 200px; max-height: 340px; overflow-y: auto;
          box-shadow: 0 12px 40px rgba(0,0,0,.5);
        }
        .fn-cp-option {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 8px; border: none;
          background: transparent; color: #f1f1f1; cursor: pointer; text-align: left; width: 100%;
          font-size: 13px; font-weight: 500; transition: background .12s;
        }
        .fn-cp-option:hover { background: rgba(255,255,255,.06); }
        .fn-cp-option.active { background: rgba(38,194,129,.1); color: #26c281; font-weight: 700; }

        /* ─── Main ─── */
        .fn-main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        .fn-header { display: flex; align-items: flex-start; justify-content: space-between; }
        .fn-kicker { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #26c281; background: rgba(38,194,129,.1); border: 1px solid rgba(38,194,129,.2); border-radius: 100px; padding: 2px 10px; display: inline-block; margin-bottom: 5px; }
        .fn-title { font-size: 20px; font-weight: 700; margin: 0; color: #f1f1f1; }
        .fn-no-pgl { font-size: 12px; color: rgba(241,241,241,.35); margin: 4px 0 0; }
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

        /* ─── Body: tree + funnel ─── */
        .fn-body { display: grid; grid-template-columns: 1fr 340px; gap: 14px; align-items: start; }
        .fn-left-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

        /* ─── Campaign Tree ─── */
        .fn-tree-panel { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; overflow: hidden; min-width: 0; }
        .fn-tree-wrap { overflow-x: auto; }
        .fn-tree-header {
          display: grid;
          grid-template-columns: 20px minmax(160px,1fr) 110px 90px 110px 72px 72px 72px 62px 68px 34px;
          align-items: center; gap: 8px; padding: 8px 16px;
          background: rgba(255,255,255,.03); border-bottom: 1px solid rgba(255,255,255,.06);
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
          color: rgba(241,241,241,.3); white-space: nowrap;
        }
        .fn-tree-row {
          display: grid;
          grid-template-columns: 20px minmax(160px,1fr) 110px 90px 110px 72px 72px 72px 62px 68px 34px;
          align-items: center; gap: 8px;
          padding: 6px 16px; cursor: pointer; transition: background .12s;
          border-bottom: 1px solid rgba(255,255,255,.03);
        }
        .fn-tree-row:last-child { border-bottom: none; }
        .fn-tree-campaign { border-left: 3px solid rgba(255,255,255,.1); background: transparent; margin: 1px 8px 1px 0; border-radius: 0 6px 6px 0; }
        .fn-tree-campaign:hover { background: rgba(255,255,255,.03); }
        .fn-tree-adset { padding-left: 20px; border-left: 2px solid rgba(255,255,255,.1); background: rgba(255,255,255,.015); margin: 1px 8px 1px 16px; border-radius: 0 5px 5px 0; }
        .fn-tree-adset:hover { background: rgba(255,255,255,.03); }
        .fn-tree-ad { padding-left: 20px; border-left: 1px dashed rgba(255,255,255,.08); background: transparent; margin: 1px 8px 1px 32px; border-radius: 0 5px 5px 0; }
        .fn-tree-ad:hover { background: rgba(255,255,255,.015); }
        .fn-tree-selected { background: rgba(38,194,129,.1) !important; outline: 1px solid rgba(38,194,129,.25); }
        .fn-tree-status-col { display: flex; align-items: center; justify-content: center; }
        .fn-status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .fn-tree-name-col { font-size: 12px; color: rgba(241,241,241,.75); overflow: hidden; font-weight: 600; display: flex; align-items: center; gap: 0; min-width: 0; }
        .fn-tree-name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
        .fn-tree-expand-col { display: flex; align-items: center; justify-content: center; }
        .fn-expand-btn { display: flex; align-items: center; justify-content: center; background: none; border: none; color: rgba(241,241,241,.4); font-size: 16px; transition: color .15s; cursor: pointer; padding: 4px; }
        .fn-expand-btn:hover { color: rgba(241,241,241,.8); }
        .fn-tree-adset-name { color: rgba(241,241,241,.55) !important; font-weight: 500; font-size: 11.5px; }
        .fn-tree-ad-name { color: rgba(241,241,241,.4) !important; font-weight: 400; font-size: 11px; }
        .fn-tree-cell { font-size: 12px; color: rgba(241,241,241,.6); white-space: nowrap; }
        .fn-pgl-col { font-size: 11.5px; }
        .fn-tree-empty { padding: 24px; font-size: 12px; color: rgba(241,241,241,.3); text-align: center; }

        /* Badge reuse from DashboardShell */
        .compact-level-badge { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: .05em; padding: 1px 5px; border-radius: 4px; margin-right: 6px; text-transform: uppercase; flex-shrink: 0; }
        .compact-level-camp  { background: rgba(38,194,129,.18); color: #26c281; border: 1px solid rgba(38,194,129,.3); }
        .compact-level-adset { background: rgba(96,165,250,.14); color: #60a5fa; border: 1px solid rgba(96,165,250,.25); }
        .compact-level-ad    { background: rgba(167,139,250,.12); color: #a78bfa; border: 1px solid rgba(167,139,250,.22); }

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
        .fn-src-pgl  { background: rgba(52,211,153,.15); color: #34d399; }
        .fn-stage-count { font-size: 18px; font-weight: 700; color: #f1f1f1; line-height: 1.1; }
        .fn-stage-bars { padding-left: 42px; }
        .fn-bar-track { width: 100%; height: 7px; background: rgba(255,255,255,.06); border-radius: 4px; overflow: hidden; margin-bottom: 3px; }
        .fn-bar-fill { height: 100%; border-radius: 4px; transition: width .4s ease; }
        .fn-stage-pcts { display: flex; gap: 10px; }
        .fn-pct-prev { font-size: 10px; font-weight: 600; }
        .fn-pct-top { font-size: 10px; color: rgba(241,241,241,.3); }

        /* PGL losses */
        .fn-pgl-losses { display: flex; gap: 8px; margin-top: 14px; }
        .fn-pgl-loss-item { flex: 1; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.03); border: 1px solid; border-radius: 9px; padding: 9px 10px; }
        .fn-pgl-loss-item i { font-size: 16px; flex-shrink: 0; }
        .fn-pgl-loss-val { font-size: 15px; font-weight: 700; color: #f1f1f1; }
        .fn-pgl-loss-label { font-size: 10px; color: rgba(241,241,241,.45); }
        .fn-pgl-loss-label span { margin-left: 4px; color: rgba(241,241,241,.25); }

        /* Timeline */
        .fn-timeline-card { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 16px 18px; }
        .fn-timeline-title { font-size: 12px; font-weight: 700; color: #f1f1f1; margin-bottom: 12px; }

        /* Tooltip */
        .fn-tooltip { background: rgba(15,20,18,.95); border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 9px 13px; font-size: 11px; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
        .fn-tooltip-label { font-weight: 700; color: #f1f1f1; margin-bottom: 5px; }
        .fn-tooltip-row { display: flex; justify-content: space-between; gap: 12px; line-height: 1.6; }

        /* ─── Top breakdowns ─── */
        .fn-breakdowns-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; align-items: start; }
        .fn-bd-creatives { grid-column: 1 / -1; }
        .fn-bd-card { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 9px; min-width: 0; }
        .fn-bd-title { font-size: 12px; font-weight: 700; color: #f1f1f1; display: flex; align-items: center; justify-content: space-between; }
        .fn-bd-title span:first-child { display: flex; align-items: center; gap: 6px; }
        .fn-bd-title i { font-size: 13px; color: #26c281; }
        .fn-bd-empty { font-size: 11.5px; color: rgba(241,241,241,.3); padding: 10px 0; text-align: center; }
        .fn-bd-error { font-size: 11px; color: #ef4444; display: flex; align-items: center; gap: 5px; }

        .fn-bd-rank-item { display: flex; align-items: center; gap: 8px; }
        .fn-bd-rank { width: 18px; height: 18px; border-radius: 5px; background: rgba(255,255,255,.06); color: rgba(241,241,241,.5); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fn-bd-rank-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .fn-bd-rank-label { font-size: 11.5px; color: rgba(241,241,241,.75); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fn-bd-rank-bar-track { width: 100%; height: 5px; background: rgba(255,255,255,.06); border-radius: 3px; overflow: hidden; }
        .fn-bd-rank-bar-fill { display: block; height: 100%; border-radius: 3px; background: #34d399; transition: width .3s ease; }
        .fn-bd-rank-value { font-size: 11px; font-weight: 700; color: #f1f1f1; text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
        .fn-bd-rank-value small { font-size: 9px; font-weight: 500; color: rgba(241,241,241,.3); }

        .fn-bd-creatives { grid-row: span 1; }
        .fn-bd-creative-item { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,.02); border: 1px solid rgba(255,255,255,.05); border-radius: 10px; padding: 8px 10px; cursor: pointer; transition: background .12s; text-align: left; width: 100%; }
        .fn-bd-creative-item:hover { background: rgba(255,255,255,.05); }
        .fn-bd-creative-thumb { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: rgba(255,255,255,.06); display: flex; align-items: center; justify-content: center; }
        .fn-bd-creative-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .fn-bd-creative-info { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .fn-bd-creative-info strong { font-size: 11.5px; color: rgba(241,241,241,.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fn-bd-creative-metrics { display: flex; flex-wrap: wrap; gap: 8px; font-size: 10px; color: rgba(241,241,241,.4); }
        .fn-bd-creative-metrics b { color: rgba(241,241,241,.75); font-weight: 700; }

        .fn-bd-gender { gap: 12px; }
        .fn-bd-gender-item { display: flex; flex-direction: column; gap: 5px; }
        .fn-bd-gender-row { display: flex; justify-content: space-between; font-size: 11px; color: rgba(241,241,241,.7); }
        .fn-bd-gender-row small { color: rgba(241,241,241,.3); margin-left: 4px; }

        /* ─── Creative preview modal ─── */
        .fn-preview-overlay { display: flex; align-items: center; justify-content: center; }
        .fn-preview-card { width: min(560px, 92vw); max-height: 86vh; overflow-y: auto; }
        .fn-preview-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 18px 20px 12px; border-bottom: 1px solid rgba(38,194,129,0.12); background: linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%); }
        .fn-preview-kicker { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #26c281; opacity: .85; }
        .fn-preview-header h3 { margin: 4px 0 0; font-size: 15px; font-weight: 800; color: #f1f1f1; }
        .fn-preview-close { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); border-radius: 9px; width: 32px; height: 32px; color: #ccc; font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .fn-preview-close:hover { background: rgba(255,255,255,.1); }
        .fn-preview-metrics { display: flex; flex-wrap: wrap; gap: 12px; font-size: 11.5px; color: rgba(241,241,241,.5); padding: 12px 20px 0; }
        .fn-preview-metrics b { color: #f1f1f1; font-weight: 700; }
        .fn-preview-body { padding: 16px 20px 20px; }
        .fn-preview-frame { border-radius: 12px; overflow: hidden; background: rgba(0,0,0,.2); min-height: 200px; }
        .fn-preview-frame iframe { width: 100%; border: none; min-height: 400px; }
        .fn-preview-loading { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 40px 0; color: rgba(241,241,241,.5); font-size: 13px; }
        .fn-preview-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 0; text-align: center; }
        .fn-preview-empty i { font-size: 36px; color: rgba(241,241,241,.15); }
        .fn-preview-empty p { margin: 0; font-size: 12.5px; color: rgba(241,241,241,.4); }

        /* Misc */
        .fn-pgl-error { font-size: 12px; color: #ef4444; display: flex; align-items: center; gap: 6px; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 8px; padding: 8px 12px; margin-top: 10px; }
        .fn-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px 24px; text-align: center; }
        .fn-empty-state i { font-size: 48px; color: rgba(241,241,241,.15); }
        .fn-empty-state h3 { font-size: 17px; font-weight: 700; margin: 0; color: rgba(241,241,241,.6); }
        .fn-empty-state p { font-size: 13px; color: rgba(241,241,241,.35); margin: 0; max-width: 360px; }

        /* Responsive */
        @media (max-width: 960px) {
          .fn-body { grid-template-columns: 1fr; }
          .fn-funnel-col { position: static; order: -1; }
        }
        @media (max-width: 1400px) {
          .fn-breakdowns-row { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .fn-breakdowns-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
