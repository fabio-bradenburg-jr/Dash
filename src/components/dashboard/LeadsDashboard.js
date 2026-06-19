'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ─── Palette ─────────────────────────────────────────────────────────────────

const STATUS_PALETTE = {
  qualified: '#22c55e',
  converted: '#10b981',
  lost: '#ef4444',
  noreply: '#f59e0b',
  other: '#6b7280',
}

const CHART_COLORS = ['#26c281', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#34d399', '#fb923c', '#38bdf8']

// ─── Formatters ───────────────────────────────────────────────────────────────

function pct(v) { return `${Math.round((v || 0) * 100)}%` }
function fmt(n) { return (n || 0).toLocaleString('pt-BR') }

// ─── Small Components ─────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color, icon }) {
  return (
    <div className="ld-metric-card">
      <div className="ld-metric-icon" style={{ color: color || '#26c281', background: `${color || '#26c281'}18` }}>
        <i className={`bx ${icon || 'bx-chart'}`} />
      </div>
      <div className="ld-metric-body">
        <div className="ld-metric-value" style={{ color: color }}>{value}</div>
        <div className="ld-metric-label">{label}</div>
        {sub && <div className="ld-metric-sub">{sub}</div>}
      </div>
    </div>
  )
}

function ScoreBadge({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <span className="ld-score" style={{ color, border: `1px solid ${color}30`, background: `${color}12` }}>
      {score}
    </span>
  )
}

function InsightCard({ type, text }) {
  const config = {
    info: { icon: 'bx-info-circle', color: '#60a5fa' },
    success: { icon: 'bx-check-circle', color: '#22c55e' },
    warning: { icon: 'bx-error', color: '#f59e0b' },
    critical: { icon: 'bx-error-circle', color: '#ef4444' },
  }[type] || { icon: 'bx-bulb', color: '#a78bfa' }
  return (
    <div className="ld-insight" style={{ borderLeftColor: config.color }}>
      <i className={`bx ${config.icon}`} style={{ color: config.color }} />
      <span>{text}</span>
    </div>
  )
}

function StatusDistBar({ dist, total }) {
  if (!dist?.length) return null
  return (
    <div className="ld-status-bar">
      {dist.map((s, i) => {
        const w = total ? (s.count / total) * 100 : 0
        const color = STATUS_PALETTE[s.class] || CHART_COLORS[i % CHART_COLORS.length]
        return w > 0 ? (
          <div
            key={s.label}
            className="ld-status-bar-seg"
            style={{ width: `${w}%`, background: color }}
            title={`${s.label}: ${s.count} (${pct(s.count / total)})`}
          />
        ) : null
      })}
    </div>
  )
}

function SectionHeader({ title, sub }) {
  return (
    <div className="ld-section-header">
      <h3 className="ld-section-title">{title}</h3>
      {sub && <span className="ld-section-sub">{sub}</span>}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="ld-tooltip">
      {label && <div className="ld-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="ld-tooltip-row" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <strong>{typeof p.value === 'number' ? fmt(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

// ─── Table with expandable status dist ───────────────────────────────────────

function PerformanceTable({ rows, label, emptyMsg }) {
  const [expanded, setExpanded] = useState(null)
  if (!rows?.length) return <div className="ld-empty">{emptyMsg || 'Sem dados.'}</div>
  return (
    <div className="ld-table-wrap">
      <table className="ld-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{label || 'Nome'}</th>
            <th>Leads</th>
            <th>Qualif.</th>
            <th>Conversão</th>
            <th>Perdidos</th>
            <th>Score</th>
            <th>Distribuição</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <>
              <tr
                key={row.name}
                className={expanded === i ? 'ld-row-expanded' : ''}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <td className="ld-rank">{i + 1}</td>
                <td className="ld-name" title={row.name}>{row.name}</td>
                <td><strong>{fmt(row.total)}</strong></td>
                <td style={{ color: '#22c55e' }}>{pct(row.qualRate)}</td>
                <td style={{ color: '#10b981' }}>{pct(row.convRate)}</td>
                <td style={{ color: '#ef4444' }}>{pct(row.lostRate)}</td>
                <td><ScoreBadge score={row.score} /></td>
                <td style={{ width: 120 }}><StatusDistBar dist={row.statusDist} total={row.total} /></td>
                <td><i className={`bx bx-chevron-${expanded === i ? 'up' : 'down'} ld-expand-icon`} /></td>
              </tr>
              {expanded === i && (
                <tr key={`${row.name}-exp`} className="ld-row-detail">
                  <td colSpan={9}>
                    <div className="ld-status-breakdown">
                      {(row.statusDist || []).map((s, j) => (
                        <div key={s.label} className="ld-status-chip">
                          <span
                            className="ld-status-dot"
                            style={{ background: CHART_COLORS[j % CHART_COLORS.length] }}
                          />
                          <span className="ld-status-chip-label">{s.label}</span>
                          <span className="ld-status-chip-count">{s.count}</span>
                          <span className="ld-status-chip-pct">{pct(s.count / row.total)}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({ data, filters, onChange }) {
  const { campaigns, adsets, ads, sources, statusDist } = data || {}

  const set = (key, val) => onChange({ ...filters, [key]: val })

  return (
    <div className="ld-filters">
      <div className="ld-filter-group">
        <label>Campanha</label>
        <select value={filters.campaign || ''} onChange={e => set('campaign', e.target.value)}>
          <option value="">Todas</option>
          {(campaigns || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div className="ld-filter-group">
        <label>Conjunto</label>
        <select value={filters.adset || ''} onChange={e => set('adset', e.target.value)}>
          <option value="">Todos</option>
          {(adsets || []).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
        </select>
      </div>
      <div className="ld-filter-group">
        <label>Anúncio</label>
        <select value={filters.ad || ''} onChange={e => set('ad', e.target.value)}>
          <option value="">Todos</option>
          {(ads || []).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
        </select>
      </div>
      <div className="ld-filter-group">
        <label>Qualificação</label>
        <select value={filters.status || ''} onChange={e => set('status', e.target.value)}>
          <option value="">Todas</option>
          {(statusDist || []).map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
        </select>
      </div>
      <div className="ld-filter-group">
        <label>Origem</label>
        <select value={filters.source || ''} onChange={e => set('source', e.target.value)}>
          <option value="">Todas</option>
          {(sources || []).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      {Object.values(filters).some(Boolean) && (
        <button
          type="button"
          className="ld-filter-clear"
          onClick={() => onChange({ campaign: '', adset: '', ad: '', status: '', source: '' })}
        >
          <i className="bx bx-x" /> Limpar
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeadsDashboard({ client }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('overview')
  const [filters, setFilters] = useState({ campaign: '', adset: '', ad: '', status: '', source: '' })

  // Tab state
  const [tabs, setTabs] = useState([])           // [{ gid, name }]
  const [tabsLoading, setTabsLoading] = useState(false)
  const [selectedGid, setSelectedGid] = useState('all')  // 'all' | gid string

  const sheetUrl = client?.leadsSheetUrl || ''
  const headerRow = client?.googleSheetsHeaderRow || 1

  // Fetch tab list when client changes
  useEffect(() => {
    if (!sheetUrl) return
    setTabsLoading(true)
    setTabs([])
    setSelectedGid('all')
    fetch(`/api/google-sheets/tabs?url=${encodeURIComponent(sheetUrl)}`)
      .then(r => r.json())
      .then(json => { if (json.tabs?.length) setTabs(json.tabs) })
      .catch(() => {})
      .finally(() => setTabsLoading(false))
  }, [sheetUrl])

  const load = useCallback(async () => {
    if (!sheetUrl) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ url: sheetUrl, header_row: headerRow })
      if (selectedGid && selectedGid !== 'all') params.set('gid', selectedGid)
      else if (selectedGid === 'all') params.set('gid', 'all')
      const res = await fetch(`/api/google-sheets/leads-analytics?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar dados.')
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [sheetUrl, headerRow, selectedGid])

  useEffect(() => { load() }, [load])

  // Apply filters (client-side on top-level breakdowns)
  const filtered = useMemo(() => {
    if (!data) return null
    const { campaign, adset, ad, status, source } = filters
    const filterBuckets = (buckets) => {
      if (!campaign && !adset && !ad && !status && !source) return buckets
      return buckets.map(b => {
        // Re-filter status dist
        const sd = b.statusDist.filter(s => !status || s.label === status)
        const total = sd.reduce((s, x) => s + x.count, 0)
        return { ...b, statusDist: sd, total }
      }).filter(b => b.total > 0)
    }
    return {
      ...data,
      campaigns: filterBuckets(campaign ? data.campaigns.filter(c => c.name === campaign) : data.campaigns),
      adsets: filterBuckets(adset ? data.adsets.filter(a => a.name === adset) : data.adsets),
      ads: filterBuckets(ad ? data.ads.filter(a => a.name === ad) : data.ads),
      sources: filterBuckets(source ? data.sources.filter(s => s.name === source) : data.sources),
    }
  }, [data, filters])

  const d = filtered || data

  if (!sheetUrl) {
    return (
      <div className="ld-empty-state">
        <i className="bx bx-table" />
        <h3>Planilha não configurada</h3>
        <p>Configure o link da planilha de leads no cadastro deste cliente → Integrações.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="ld-loading">
        <div className="ld-spinner" />
        <span>Analisando planilha de leads…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ld-empty-state ld-error-state">
        <i className="bx bx-error-circle" style={{ color: '#ef4444' }} />
        <h3>Não foi possível carregar</h3>
        <p>{error}</p>
        <button type="button" className="ld-btn-primary" onClick={load}>Tentar novamente</button>
      </div>
    )
  }

  if (!d) return null

  const { overview, statusDist, campaigns, adsets, ads, sources, timeline, insights, alerts, detectedColumns } = d

  const SECTIONS = [
    { id: 'overview', label: 'Visão Geral', icon: 'bx-grid-alt' },
    { id: 'campaigns', label: 'Campanhas', icon: 'bx-rocket', disabled: !campaigns?.length },
    { id: 'adsets', label: 'Conjuntos', icon: 'bx-layer', disabled: !adsets?.length },
    { id: 'ads', label: 'Anúncios', icon: 'bx-image', disabled: !ads?.length },
    { id: 'status', label: 'Qualificação', icon: 'bx-pie-chart-alt' },
    { id: 'timeline', label: 'Evolução', icon: 'bx-trending-up', disabled: !timeline?.length },
  ]

  return (
    <div className="ld-root">
      {/* Header */}
      <div className="ld-header">
        <div className="ld-header-left">
          <div className="ld-header-meta">
            <span className="ld-kicker">Dashboard de Leads</span>
            <h2 className="ld-title">{client?.name}</h2>
          </div>
          {(detectedColumns.campaign || detectedColumns.qualification || detectedColumns.status) && (
            <div className="ld-detected-cols">
              {detectedColumns.campaign && <span className="ld-col-tag"><i className="bx bx-rocket" /> {detectedColumns.campaign}</span>}
              {(detectedColumns.qualification || detectedColumns.status) && <span className="ld-col-tag"><i className="bx bx-check-shield" /> {detectedColumns.qualification || detectedColumns.status}</span>}
              {detectedColumns.date && <span className="ld-col-tag"><i className="bx bx-calendar" /> {detectedColumns.date}</span>}
              {detectedColumns.source && <span className="ld-col-tag"><i className="bx bx-globe" /> {detectedColumns.source}</span>}
            </div>
          )}
        </div>
        <button type="button" className="ld-refresh-btn" onClick={load} title="Atualizar">
          <i className="bx bx-refresh" />
        </button>
      </div>

      {/* Sheet Tab Selector */}
      {(tabs.length > 0 || tabsLoading) && (
        <div className="ld-tab-selector">
          <span className="ld-tab-selector-label">
            <i className="bx bx-spreadsheet" />
            Aba:
          </span>
          <div className="ld-sheet-tabs">
            <button
              type="button"
              className={`ld-sheet-tab${selectedGid === 'all' ? ' active' : ''}`}
              onClick={() => setSelectedGid('all')}
            >
              <i className="bx bx-layer" />
              Todas
            </button>
            {tabs.map(tab => (
              <button
                key={tab.gid}
                type="button"
                className={`ld-sheet-tab${selectedGid === tab.gid ? ' active' : ''}`}
                onClick={() => setSelectedGid(tab.gid)}
              >
                {tab.name}
              </button>
            ))}
            {tabsLoading && <span className="ld-tab-loading"><i className="bx bx-loader-alt bx-spin" /> Carregando abas…</span>}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts?.length > 0 && (
        <div className="ld-alerts">
          {alerts.map((a, i) => <InsightCard key={i} type={a.type} text={a.text} />)}
        </div>
      )}

      {/* Filters */}
      <FilterBar data={d} filters={filters} onChange={setFilters} />

      {/* Nav tabs */}
      <div className="ld-nav">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            type="button"
            className={`ld-nav-btn${activeSection === s.id ? ' active' : ''}${s.disabled ? ' disabled' : ''}`}
            onClick={() => !s.disabled && setActiveSection(s.id)}
          >
            <i className={`bx ${s.icon}`} />
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeSection === 'overview' && (
        <div className="ld-section">
          <div className="ld-metrics-grid">
            <MetricCard label="Total de Leads" value={fmt(overview.total)} icon="bx-user-plus" color="#60a5fa" />
            <MetricCard label="Qualificados" value={fmt(overview.qualified)} sub={pct(overview.qualRate)} icon="bx-check-shield" color="#22c55e" />
            <MetricCard label="Convertidos" value={fmt(overview.converted)} sub={pct(overview.convRate)} icon="bx-trophy" color="#10b981" />
            <MetricCard label="Perdidos" value={fmt(overview.lost)} sub={pct(overview.lostRate)} icon="bx-x-circle" color="#ef4444" />
            <MetricCard label="Sem Resposta" value={fmt(overview.noreply)} sub={pct(overview.noReplyRate)} icon="bx-time" color="#f59e0b" />
            <MetricCard label="Outros" value={fmt(overview.other)} icon="bx-dots-horizontal" color="#6b7280" />
          </div>

          {/* Status pie + top campaigns bar side by side */}
          <div className="ld-charts-row">
            <div className="ld-chart-card">
              <SectionHeader title="Distribuição por Status" />
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="label"
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90}
                    paddingAngle={2}
                  >
                    {(statusDist || []).map((s, i) => (
                      <Cell key={s.label} fill={STATUS_PALETTE[s.class] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(val) => <span style={{ fontSize: 11, color: '#ccc' }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {campaigns?.length > 0 && (
              <div className="ld-chart-card ld-chart-card-wide">
                <SectionHeader title="Leads por Campanha" sub="Top 10" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={campaigns.slice(0, 10)} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#ccc' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Leads" fill="#26c281" radius={[0, 4, 4, 0]}>
                      {campaigns.slice(0, 10).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Insights */}
          {insights?.length > 0 && (
            <div className="ld-chart-card">
              <SectionHeader title="Insights Automáticos" />
              <div className="ld-insights-list">
                {insights.map((ins, i) => <InsightCard key={i} type={ins.type} text={ins.text} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Campaigns ── */}
      {activeSection === 'campaigns' && (
        <div className="ld-section">
          <div className="ld-charts-row">
            <div className="ld-chart-card ld-chart-card-wide">
              <SectionHeader title="Qualificação por Campanha" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={campaigns.slice(0, 12)} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qualified" name="Qualif." fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" name="Converti." fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" name="Perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <PerformanceTable rows={campaigns} label="Campanha" emptyMsg="Nenhuma campanha detectada. Verifique se a planilha tem uma coluna 'Campanha'." />
        </div>
      )}

      {/* ── Adsets ── */}
      {activeSection === 'adsets' && (
        <div className="ld-section">
          <div className="ld-charts-row">
            <div className="ld-chart-card ld-chart-card-wide">
              <SectionHeader title="Leads por Conjunto de Anúncios" sub="Top 10" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={adsets.slice(0, 10)} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="qualified" name="Qualif." fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" name="Perdidos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <PerformanceTable rows={adsets} label="Conjunto" emptyMsg="Nenhum conjunto detectado. Verifique se a planilha tem uma coluna 'Conjunto' ou 'Adset'." />
        </div>
      )}

      {/* ── Ads ── */}
      {activeSection === 'ads' && (
        <div className="ld-section">
          <div className="ld-charts-row">
            <div className="ld-chart-card ld-chart-card-wide">
              <SectionHeader title="Ranking de Anúncios por Qualificação" sub="Top 10" />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[...ads].sort((a, b) => b.qualRate - a.qualRate).slice(0, 10)} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip content={<CustomTooltip />} formatter={(v) => `${Math.round(v * 100)}%`} />
                  <Bar dataKey="qualRate" name="Taxa Qualif." fill="#26c281" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="convRate" name="Taxa Conv." fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <PerformanceTable rows={ads} label="Anúncio" emptyMsg="Nenhum anúncio detectado. Verifique se a planilha tem uma coluna 'Anúncio' ou 'Ad'." />
        </div>
      )}

      {/* ── Status ── */}
      {activeSection === 'status' && (
        <div className="ld-section">
          <div className="ld-charts-row">
            <div className="ld-chart-card">
              <SectionHeader title="Pizza por Qualificação" />
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDist}
                    dataKey="count"
                    nameKey="label"
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={110}
                    paddingAngle={2}
                    label={({ label, percent }) => `${label} ${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {(statusDist || []).map((s, i) => (
                      <Cell key={s.label} fill={STATUS_PALETTE[s.class] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="ld-chart-card ld-chart-card-wide">
              <SectionHeader title="Contagem por Qualificação" />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusDist} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis dataKey="label" type="category" width={160} tick={{ fontSize: 11, fill: '#ccc' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]}>
                    {(statusDist || []).map((s, i) => (
                      <Cell key={s.label} fill={STATUS_PALETTE[s.class] || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status table */}
          <div className="ld-chart-card">
            <div className="ld-table-wrap">
              <table className="ld-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Quantidade</th>
                    <th>% do Total</th>
                    <th>Classificação</th>
                  </tr>
                </thead>
                <tbody>
                  {statusDist.map((s, i) => {
                    const color = STATUS_PALETTE[s.class] || CHART_COLORS[i % CHART_COLORS.length]
                    const classLabel = { qualified: 'Qualificado', converted: 'Convertido', lost: 'Perdido', noreply: 'Sem resposta', other: 'Outros' }[s.class] || 'Outros'
                    return (
                      <tr key={s.label}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                            {s.label}
                          </div>
                        </td>
                        <td><strong>{fmt(s.count)}</strong></td>
                        <td>{pct(s.count / overview.total)}</td>
                        <td><span className="ld-class-chip" style={{ color, borderColor: `${color}30`, background: `${color}12` }}>{classLabel}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      {activeSection === 'timeline' && timeline?.length > 0 && (
        <div className="ld-section">
          <div className="ld-chart-card">
            <SectionHeader title="Evolução de Leads ao Longo do Tempo" />
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeline} margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#888' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke="#60a5fa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="qualified" name="Qualif." stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="converted" name="Conver." stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="lost" name="Perdidos" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx global>{`
        .ld-root {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 4px 0 32px;
          min-height: 0;
        }

        /* Header */
        .ld-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .ld-header-left { display: flex; flex-direction: column; gap: 8px; }
        .ld-header-meta { display: flex; flex-direction: column; gap: 3px; }
        .ld-kicker {
          font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: #26c281;
          background: rgba(38,194,129,0.1); border: 1px solid rgba(38,194,129,0.2);
          border-radius: 100px; padding: 2px 10px; display: inline-block; width: fit-content;
        }
        .ld-title { font-size: 20px; font-weight: 700; margin: 0; color: #f1f1f1; }
        .ld-detected-cols { display: flex; flex-wrap: wrap; gap: 6px; }
        .ld-col-tag {
          font-size: 10px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;
          padding: 2px 8px; color: rgba(241,241,241,0.55);
        }
        .ld-refresh-btn {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; color: #ccc; cursor: pointer;
          width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
          font-size: 18px; transition: all .15s; flex-shrink: 0;
        }
        .ld-refresh-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

        /* Sheet tab selector */
        .ld-tab-selector {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 10px 14px;
        }
        .ld-tab-selector-label {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: rgba(241,241,241,0.35);
          white-space: nowrap; flex-shrink: 0;
        }
        .ld-sheet-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
        .ld-sheet-tab {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; color: rgba(241,241,241,0.55);
          padding: 6px 12px; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: all .15s; white-space: nowrap;
        }
        .ld-sheet-tab:hover { background: rgba(255,255,255,0.09); color: #f1f1f1; }
        .ld-sheet-tab.active {
          background: rgba(38,194,129,0.14); border-color: rgba(38,194,129,0.35);
          color: #26c281; font-weight: 600;
        }
        .ld-sheet-tab i { font-size: 13px; }
        .ld-tab-loading { font-size: 12px; color: rgba(241,241,241,0.3); display: flex; align-items: center; gap: 5px; }

        /* Alerts */
        .ld-alerts { display: flex; flex-direction: column; gap: 6px; }

        /* Filters */
        .ld-filters {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 14px 16px;
        }
        .ld-filter-group { display: flex; flex-direction: column; gap: 4px; }
        .ld-filter-group label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(241,241,241,0.4); }
        .ld-filter-group select {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; color: #f1f1f1; padding: 7px 10px; font-size: 13px;
          outline: none; cursor: pointer; min-width: 130px;
        }
        .ld-filter-group select:focus { border-color: rgba(38,194,129,0.4); }
        .ld-filter-clear {
          display: flex; align-items: center; gap: 4px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25);
          border-radius: 8px; color: #ef4444; padding: 7px 12px; font-size: 12px;
          cursor: pointer; font-weight: 600; transition: all .15s; align-self: flex-end;
        }

        /* Nav */
        .ld-nav {
          display: flex; gap: 4px; flex-wrap: wrap;
          border-bottom: 1px solid rgba(255,255,255,0.07); padding-bottom: 8px;
        }
        .ld-nav-btn {
          display: flex; align-items: center; gap: 6px;
          background: transparent; border: 1px solid transparent;
          border-radius: 8px; color: rgba(241,241,241,0.5);
          padding: 7px 13px; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all .15s;
        }
        .ld-nav-btn:hover:not(.disabled) { background: rgba(255,255,255,0.05); color: #f1f1f1; }
        .ld-nav-btn.active {
          background: rgba(38,194,129,0.12); border-color: rgba(38,194,129,0.3);
          color: #26c281; font-weight: 600;
        }
        .ld-nav-btn.disabled { opacity: 0.35; cursor: not-allowed; }
        .ld-nav-btn i { font-size: 15px; }

        /* Sections */
        .ld-section { display: flex; flex-direction: column; gap: 16px; }

        /* Metric cards */
        .ld-metrics-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;
        }
        .ld-metric-card {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 14px 16px;
        }
        .ld-metric-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .ld-metric-body { min-width: 0; }
        .ld-metric-value { font-size: 22px; font-weight: 700; line-height: 1.1; }
        .ld-metric-label { font-size: 11px; color: rgba(241,241,241,0.5); margin-top: 2px; }
        .ld-metric-sub { font-size: 11px; color: rgba(241,241,241,0.35); }

        /* Charts */
        .ld-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .ld-chart-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 18px 20px;
        }
        .ld-chart-card-wide { grid-column: span 1; }
        .ld-section-header { margin-bottom: 14px; display: flex; align-items: baseline; gap: 10px; }
        .ld-section-title { font-size: 14px; font-weight: 700; margin: 0; color: #f1f1f1; }
        .ld-section-sub { font-size: 11px; color: rgba(241,241,241,0.4); }

        /* Tooltip */
        .ld-tooltip {
          background: rgba(15,20,18,0.95); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 10px 14px; font-size: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .ld-tooltip-label { font-weight: 700; color: #f1f1f1; margin-bottom: 6px; font-size: 11px; }
        .ld-tooltip-row { display: flex; justify-content: space-between; gap: 12px; line-height: 1.6; }

        /* Table */
        .ld-table-wrap { overflow-x: auto; }
        .ld-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ld-table th {
          text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: rgba(241,241,241,0.4);
          padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .ld-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); color: #e8e8e8; }
        .ld-table tr:last-child td { border-bottom: none; }
        .ld-table tbody tr { cursor: pointer; transition: background .12s; }
        .ld-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .ld-table tbody tr.ld-row-expanded { background: rgba(38,194,129,0.05); }
        .ld-table tbody tr.ld-row-detail { background: rgba(255,255,255,0.02); cursor: default; }
        .ld-rank { font-size: 11px; color: rgba(241,241,241,0.3); font-weight: 600; width: 28px; }
        .ld-name { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; }
        .ld-expand-icon { font-size: 14px; color: rgba(241,241,241,0.3); }

        /* Score badge */
        .ld-score { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }

        /* Status bar */
        .ld-status-bar { display: flex; height: 6px; border-radius: 3px; overflow: hidden; width: 100%; }
        .ld-status-bar-seg { transition: width .3s; }

        /* Status breakdown */
        .ld-status-breakdown { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 0 4px; }
        .ld-status-chip {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 5px 10px; font-size: 11px;
        }
        .ld-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .ld-status-chip-label { color: rgba(241,241,241,0.7); }
        .ld-status-chip-count { font-weight: 700; color: #f1f1f1; }
        .ld-status-chip-pct { color: rgba(241,241,241,0.4); }

        /* Insights */
        .ld-insights-list { display: flex; flex-direction: column; gap: 8px; }
        .ld-insight {
          display: flex; align-items: flex-start; gap: 10px;
          border-left: 3px solid; padding: 10px 14px;
          background: rgba(255,255,255,0.03); border-radius: 0 8px 8px 0;
          font-size: 13px; color: rgba(241,241,241,0.8); line-height: 1.4;
        }
        .ld-insight i { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

        /* Class chip */
        .ld-class-chip { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; border: 1px solid; }

        /* Empty / Loading */
        .ld-empty { color: rgba(241,241,241,0.3); font-size: 13px; padding: 32px 16px; text-align: center; }
        .ld-empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 64px 24px; text-align: center;
        }
        .ld-empty-state i { font-size: 48px; color: rgba(241,241,241,0.2); }
        .ld-empty-state h3 { font-size: 17px; font-weight: 700; margin: 0; color: rgba(241,241,241,0.7); }
        .ld-empty-state p { font-size: 13px; color: rgba(241,241,241,0.4); margin: 0; max-width: 380px; line-height: 1.5; }
        .ld-error-state i { color: #ef4444; }
        .ld-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 14px; padding: 64px; color: rgba(241,241,241,0.4); font-size: 14px;
        }
        .ld-spinner {
          width: 32px; height: 32px; border: 3px solid rgba(38,194,129,0.2);
          border-top-color: #26c281; border-radius: 50%;
          animation: ld-spin 0.8s linear infinite;
        }
        @keyframes ld-spin { to { transform: rotate(360deg); } }

        .ld-btn-primary {
          background: #26c281; color: #000; font-weight: 700; font-size: 13px;
          border: none; border-radius: 10px; padding: 10px 20px; cursor: pointer;
          transition: opacity .15s;
        }
        .ld-btn-primary:hover { opacity: 0.85; }

        /* Responsive */
        @media (max-width: 768px) {
          .ld-charts-row { grid-template-columns: 1fr; }
          .ld-metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .ld-filters { gap: 8px; }
          .ld-filter-group select { min-width: 110px; }
        }
      `}</style>
    </div>
  )
}
