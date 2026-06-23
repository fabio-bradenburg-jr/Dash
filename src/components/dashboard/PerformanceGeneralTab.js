'use client'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'

/* ── Health meta ── */
const HEALTH_META = {
  with_result: { label: 'Excelente',    color: '#1d8fff', glow: 'rgba(29,143,255,0.28)',  sortRank: 4 },
  healthy:     { label: 'Saudável',color: '#22c55e', glow: 'rgba(34,197,94,0.28)',   sortRank: 3 },
  attention:   { label: 'Atenção',color: '#f59e0b', glow: 'rgba(245,158,11,0.28)', sortRank: 2 },
  critical:    { label: 'Crítico', color: '#ef4444', glow: 'rgba(239,68,68,0.28)',   sortRank: 0 },
  integration: { label: 'Integração',color: '#8b5cf6', glow: 'rgba(139,92,246,0.28)', sortRank: 1 },
  churn:       { label: 'Churn',        color: '#64748b', glow: 'rgba(100,116,139,0.2)',  sortRank: 5 },
  empty:       { label: 'Sem dados',    color: '#374151', glow: 'rgba(55,65,81,0.15)',    sortRank: 6 },
}

const FILTER_OPTS = [
  { key: 'all',         label: 'Todos'                    },
  { key: 'critical',    label: 'Crítico'        },
  { key: 'attention',   label: 'Atenção' },
  { key: 'healthy',     label: 'Saudável'    },
  { key: 'with_result', label: 'Excelente'                },
  { key: 'integration', label: 'Integração' },
  { key: 'churn',       label: 'Churn'                    },
  { key: 'empty',       label: 'Sem dados'                },
]

/* ── Format utils ── */
const BRL = (n) =>
  typeof n === 'number' && isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '-'
const NUM = (n, d = 0) =>
  typeof n === 'number' && isFinite(n)
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
    : '-'
const PCT = (n) =>
  typeof n === 'number' && isFinite(n)
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
    : '-'
const fmtDate = (d) => {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}`
}
const getResults = (item) =>
  item?.results ?? item?.custom_metrics?.totalConversions ?? 0
const cprStr = (spend, results) => {
  if (typeof results === 'number' && results === 0) return 'Sem resultados'
  if (typeof spend === 'number' && typeof results === 'number' && results > 0) return BRL(spend / results)
  return '-'
}
const ctrStr = (clicks, impressions) =>
  typeof impressions === 'number' && impressions > 0
    ? PCT((clicks / impressions) * 100)
    : '-'

/* ── Design tokens ── */
const C = {
  accent:     '#26c281',
  surface:    '#111827',
  modalBg:    'linear-gradient(160deg,#0f172a 0%,#0d1f17 100%)',
  modalHero:  'linear-gradient(135deg,rgba(38,194,129,0.1) 0%,rgba(34,197,94,0.04) 100%)',
  border:     'rgba(255,255,255,0.08)',
  borderGlow: 'rgba(38,194,129,0.2)',
  text:       '#f9fafb',
  textSub:    '#9ca3af',
  textMute:   '#4b5563',
}
const LED = {
  glow:      '0 0 10px rgba(38,194,129,0.2), 0 0 20px rgba(38,194,129,0.08)',
  glowHover: '0 0 16px rgba(38,194,129,0.38), 0 0 32px rgba(38,194,129,0.14)',
  border:    '1px solid rgba(38,194,129,0.3)',
}

/* ── Round chart button ── */
function ChartIconBtn({ onClick, title, active }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(e) }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 28, borderRadius: '50%', border: 'none',
        background: active ? 'rgba(38,194,129,0.18)' : hov ? 'rgba(38,194,129,0.1)' : 'rgba(255,255,255,0.05)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: active ? C.accent : hov ? C.accent : 'rgba(241,241,241,0.4)',
        fontSize: 14, flexShrink: 0,
        boxShadow: active ? LED.glow : hov ? '0 0 8px rgba(38,194,129,0.22)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <i className="bx bx-line-chart" />
    </button>
  )
}

/* ── SVG line chart ── */
function LineChart({ data, width = 500, height = 160 }) {
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  if (!data || data.length < 2) {
    return (
      <div style={{ textAlign: 'center', color: C.textMute, padding: '28px 0', fontSize: '0.8rem' }}>
        Dados insuficientes para o gráfico no período selecionado.
      </div>
    )
  }

  const PAD = { top: 16, right: 16, bottom: 28, left: 52 }
  const W = width
  const H = height
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const n = data.length

  const maxResults = Math.max(...data.map((d) => d.results || 0), 1)
  const maxCpr     = Math.max(...data.map((d) => (d.results > 0 ? d.spend / d.results : 0)), 1)

  const xScale = (i) => PAD.left + (i / (n - 1)) * chartW
  const yScaleR = (v) => PAD.top + chartH - (v / maxResults) * chartH
  const yScaleCPR = (v) => PAD.top + chartH - (v / maxCpr) * chartH

  const pathR = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScaleR(d.results || 0).toFixed(1)}`).join(' ')
  const pathCPR = (() => {
    let cmd = ''
    let penUp = true
    data.forEach((d, i) => {
      if (d.results <= 0) { penUp = true; return }
      const cpr = d.spend / d.results
      cmd += `${penUp ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScaleCPR(cpr).toFixed(1)} `
      penUp = false
    })
    return cmd.trim()
  })()

  const gridLines = 4
  const ticksR = Array.from({ length: gridLines + 1 }, (_, i) => (maxResults / gridLines) * i)

  const handleMouseMove = (e) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = e.clientX - rect.left
    const relX = mouseX - PAD.left
    const idx = Math.max(0, Math.min(n - 1, Math.round((relX / chartW) * (n - 1))))
    const d = data[idx]
    setTooltip({ idx, x: xScale(idx), y: yScaleR(d.results || 0), d })
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', overflow: 'visible', display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid */}
        {ticksR.map((v, i) => {
          const y = yScaleR(v)
          return (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="inherit">
                {NUM(v)}
              </text>
            </g>
          )
        })}

        {/* X axis labels */}
        {data.map((d, i) => {
          if (n <= 10 || i % Math.ceil(n / 8) === 0 || i === n - 1) {
            return (
              <text key={i} x={xScale(i)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9} fontFamily="inherit">
                {fmtDate(d.date_start)}
              </text>
            )
          }
          return null
        })}

        {/* CPR line */}
        <path d={pathCPR} fill="none" stroke="#6b7280" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />

        {/* Results line */}
        <path d={pathR} fill="none" stroke={C.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* Hover vertical line */}
        {tooltip && (
          <line x1={tooltip.x} x2={tooltip.x} y1={PAD.top} y2={PAD.top + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="4 3" />
        )}

        {/* Dots on hover */}
        {tooltip && (
          <>
            <circle cx={tooltip.x} cy={yScaleR(tooltip.d.results || 0)} r={4} fill={C.accent} />
            <circle cx={tooltip.x} cy={yScaleCPR(tooltip.d.results > 0 ? tooltip.d.spend / tooltip.d.results : 0)} r={4} fill="#6b7280" />
          </>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: C.textSub }}>
          <span style={{ display: 'inline-block', width: 18, height: 2.5, borderRadius: 2, background: C.accent }} />
          Resultado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: C.textSub }}>
          <span style={{ display: 'inline-block', width: 18, height: 2, borderRadius: 2, background: '#6b7280' }} />
          Custo por resultado
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x / (500 / 100), 65) + '%',
          top: 0,
          transform: 'translate(-50%, 0)',
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid rgba(38,194,129,0.25)',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: '0.72rem',
          color: C.text,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontWeight: 700, color: C.textSub, marginBottom: 4 }}>{fmtDate(tooltip.d.date_start)}</div>
          <div style={{ color: C.accent, marginBottom: 2 }}>Resultado: <strong>{NUM(tooltip.d.results)}</strong></div>
          <div style={{ color: '#9ca3af' }}>CPR: <strong>{tooltip.d.results > 0 ? BRL(tooltip.d.spend / tooltip.d.results) : '-'}</strong></div>
          {tooltip.d.ctr != null && <div style={{ color: C.textSub }}>CTR: <strong>{PCT(tooltip.d.ctr * 100)}</strong></div>}
        </div>
      )}
    </div>
  )
}

/* ── Chart modal (with real daily data) ── */
function ChartModal({ title, entityId, metrics, dateRange, customSince, customUntil, metaRequestHeaders, onClose }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useMemo(() => {
    if (!entityId) { setLoading(false); return }
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ entityId })
    if (dateRange === 'custom' && customSince && customUntil) {
      params.set('since', customSince)
      params.set('until', customUntil)
    } else {
      params.set('date_preset', dateRange || 'last_7d')
    }
    fetch('/api/meta/campaign-daily?' + params.toString(), { headers: metaRequestHeaders || {} })
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setData(json.data || [])
      })
      .catch((e) => setError(e.message || 'Erro ao carregar dados.'))
      .finally(() => setLoading(false))
  }, [entityId, dateRange, customSince, customUntil])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', background: C.modalBg, border: '1px solid rgba(38,194,129,0.2)', boxShadow: '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(38,194,129,0.06)', borderRadius: 20, padding: '26px 28px', width: '94vw', maxWidth: 620, maxHeight: '82vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Evolução diária</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: C.text }}>{title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: C.textSub, fontSize: 20, cursor: 'pointer', padding: '5px 9px', lineHeight: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          ><i className="bx bx-x" /></button>
        </div>

        {/* Metric cards */}
        {metrics && metrics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + Math.min(metrics.length, 4) + ', 1fr)', gap: 8, marginBottom: 20 }}>
            {metrics.map((m, i) => (
              <MetricCard key={i} label={m.label} value={m.value} accent={m.accent} warn={m.warn} />
            ))}
          </div>
        )}

        {/* Chart area */}
        <div style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(190,201,191,0.12)', borderRadius: 14, padding: '18px 14px 12px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: C.textMute }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 28, color: C.accent, display: 'block', marginBottom: 8 }} />
              <span style={{ fontSize: '0.8rem' }}>Carregando dados diários...</span>
            </div>
          )}
          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#ef4444', fontSize: '0.8rem' }}>
              <i className="bx bx-error-circle" style={{ fontSize: 24, display: 'block', marginBottom: 6 }} />
              {error}
            </div>
          )}
          {!loading && !error && <LineChart data={data} />}
        </div>
      </div>
    </div>
  )
}

/* ── MetricCard ── */
function MetricCard({ label, value, accent, warn }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid ' + (accent ? 'rgba(38,194,129,0.3)' : warn ? 'rgba(239,68,68,0.25)' : C.border),
      borderRadius: 12, padding: '11px 13px', textAlign: 'center',
      boxShadow: accent ? LED.glow : warn ? '0 0 8px rgba(239,68,68,0.1)' : 'none',
    }}>
      <div style={{ fontSize: '0.97rem', fontWeight: 800, color: accent ? C.accent : warn ? '#ef4444' : C.text, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.6rem', color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 5 }}>{label}</div>
    </div>
  )
}

/* ── HealthBadge ── */
function HealthBadge({ healthKey, size }) {
  const h = HEALTH_META[healthKey] || HEALTH_META.empty
  const lg = size === 'lg'
  return (
    <span style={{
      fontSize: lg ? '0.78rem' : '0.67rem', fontWeight: 800,
      color: h.color, background: h.color + '18', border: '1px solid ' + h.color + '50',
      borderRadius: 20, padding: lg ? '4px 14px' : '2px 9px',
      letterSpacing: '0.03em', boxShadow: '0 0 8px ' + h.glow,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>{h.label}</span>
  )
}

/* ── Pill ── */
function Pill({ label, value, accent, warn }) {
  return (
    <span style={{ fontSize: '0.7rem', color: C.textSub }}>
      {label}: <strong style={{ color: accent ? C.accent : warn ? '#6b7280' : '#d1d5db' }}>{value}</strong>
    </span>
  )
}

/* ── SectionTitle ── */
function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
      <div style={{ width: 3, height: 14, borderRadius: 2, background: C.accent, boxShadow: '0 0 8px rgba(38,194,129,0.55)', flexShrink: 0 }} />
      <span style={{ fontSize: '0.67rem', fontWeight: 800, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</span>
    </div>
  )
}

/* ── EmptyBlock ── */
function EmptyBlock({ icon, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={'bx ' + (icon || 'bx-data')} style={{ color: C.textMute, fontSize: 18, flexShrink: 0 }} />
      <span style={{ fontSize: '0.77rem', color: C.textMute }}>{children}</span>
    </div>
  )
}

/* ── AdDetailModal ── */
function AdDetailModal({ ad, campaignName, adsetName, dateRange, customSince, customUntil, metaRequestHeaders, onClose }) {
  const [chart, setChart] = useState(false)
  const results = getResults(ad)
  const cpr = cprStr(ad.spend, results)
  const ctr = ctrStr(ad.clicks, ad.impressions)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', background: C.modalBg, border: '1px solid rgba(38,194,129,0.2)', boxShadow: '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(38,194,129,0.06)', borderRadius: 20, padding: '24px 26px', width: '92vw', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '0.63rem', color: C.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detalhes do Anúncio</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, color: C.textSub, fontSize: 20, cursor: 'pointer', padding: '5px 9px', lineHeight: 1 }}><i className="bx bx-x" /></button>
        </div>
        {ad.imageUrl
          ? <img src={ad.imageUrl} alt={ad.label || ad.name || ''} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid ' + C.border }} />
          : <div style={{ width: '100%', height: 80, borderRadius: 12, border: '1px solid ' + C.border, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMute, fontSize: 28 }}><i className="bx bx-image-alt" /></div>
        }
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text, marginBottom: 5 }}>{ad.label || ad.name || 'Anúncio sem título'}</div>
          {campaignName && <div style={{ fontSize: '0.72rem', color: C.textSub, marginBottom: 2 }}>Campanha: {campaignName}</div>}
          {adsetName && <div style={{ fontSize: '0.72rem', color: C.textSub }}>Conjunto: {adsetName}</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <MetricCard label="Investimento" value={BRL(ad.spend)} accent />
          <MetricCard label="Resultado" value={NUM(results)} />
          <MetricCard label="Custo por resultado" value={cpr} warn={results === 0} />
          <MetricCard label="CTR" value={ctr} />
          <MetricCard label="Impressões" value={NUM(ad.impressions)} />
          <MetricCard label="Cliques" value={NUM(ad.clicks)} />
          {ad.spend > 0 && ad.impressions > 0 && <MetricCard label="CPM" value={BRL((ad.spend / ad.impressions) * 1000)} />}
          {ad.spend > 0 && ad.clicks > 0 && <MetricCard label="CPC" value={BRL(ad.spend / ad.clicks)} />}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setChart(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 15px', border: LED.border, borderRadius: 9, background: 'rgba(38,194,129,0.08)', color: C.accent, fontWeight: 700, fontSize: '0.77rem', cursor: 'pointer', boxShadow: LED.glow }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = LED.glowHover }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = LED.glow }}
          >
            <i className="bx bx-line-chart" /> Ver gráfico do anúncio
          </button>
        </div>
        {chart && (
          <ChartModal
            title={ad.label || ad.name || 'Anúncio'}
            entityId={ad.adId}
            dateRange={dateRange}
            customSince={customSince}
            customUntil={customUntil}
            metaRequestHeaders={metaRequestHeaders}
            metrics={[
              { label: 'Investimento', value: BRL(ad.spend), accent: true },
              { label: 'Resultado',    value: NUM(results) },
              { label: 'Custo/result', value: cpr },
              { label: 'CTR',          value: ctr },
            ]}
            onClose={() => setChart(false)}
          />
        )}
      </div>
    </div>
  )
}

/* ── AdRow ── */
function AdRow({ ad, campaignName, adsetName, dateRange, customSince, customUntil, metaRequestHeaders }) {
  const [detail, setDetail]   = useState(false)
  const [chart, setChart]     = useState(false)
  const results = getResults(ad)
  const cpr = cprStr(ad.spend, results)
  const ctr = ctrStr(ad.clicks, ad.impressions)
  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
        onClick={() => setDetail(true)}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(38,194,129,0.05)'; e.currentTarget.style.borderColor = 'rgba(38,194,129,0.2)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
      >
        {ad.imageUrl
          ? <img src={ad.imageUrl} alt={ad.name || ''} style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.textMute }}><i className="bx bx-image-alt" style={{ fontSize: 13 }} /></div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{ad.name || ad.label || 'Anúncio'}</div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <Pill label="Invest." value={BRL(ad.spend)} accent />
            <Pill label="Result." value={NUM(results)} />
            <Pill label="CPR" value={cpr} warn={results === 0} />
            <Pill label="CTR" value={ctr} />
          </div>
        </div>
        <ChartIconBtn title="Ver gráfico do anúncio" active={chart} onClick={(e) => { e.stopPropagation(); setChart(true) }} />
        <i className="bx bx-right-arrow-alt" style={{ color: C.textMute, fontSize: 13, flexShrink: 0 }} />
      </div>
      {detail && (
        <AdDetailModal
          ad={ad} campaignName={campaignName} adsetName={adsetName}
          dateRange={dateRange} customSince={customSince} customUntil={customUntil}
          metaRequestHeaders={metaRequestHeaders}
          onClose={() => setDetail(false)}
        />
      )}
      {chart && !detail && (
        <ChartModal
          title={ad.name || ad.label || 'Anúncio'}
          entityId={ad.adId}
          dateRange={dateRange} customSince={customSince} customUntil={customUntil}
          metaRequestHeaders={metaRequestHeaders}
          metrics={[
            { label: 'Investimento', value: BRL(ad.spend), accent: true },
            { label: 'Resultado',    value: NUM(results) },
            { label: 'Custo/result', value: cpr },
            { label: 'CTR',          value: ctr },
          ]}
          onClose={() => setChart(false)}
        />
      )}
    </div>
  )
}

/* ── AdsetRow ── */
function AdsetRow({ adset, campaignName, dateRange, customSince, customUntil, metaRequestHeaders }) {
  const [expanded, setExpanded] = useState(false)
  const [chart, setChart]       = useState(false)
  const [hov, setHov]           = useState(false)
  const isActive = (adset.effectiveStatus || '').toUpperCase() === 'ACTIVE'
  const cpr = cprStr(adset.spend, adset.results)
  const ctr = ctrStr(adset.clicks, adset.impressions)
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, overflow: 'hidden', transition: 'border-color 0.15s', borderColor: hov ? 'rgba(38,194,129,0.2)' : 'rgba(255,255,255,0.06)' }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', cursor: 'pointer', background: hov ? 'rgba(38,194,129,0.03)' : 'rgba(255,255,255,0.015)', userSelect: 'none', transition: 'background 0.15s' }}
      >
        <i className={'bx bx-chevron-' + (expanded ? 'down' : 'right')} style={{ color: C.textMute, fontSize: 13, flexShrink: 0 }} />
        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: isActive ? '#22c55e' : '#64748b', boxShadow: isActive ? '0 0 5px #22c55e88' : 'none', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.77rem', fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{adset.name}</span>
            <span style={{ fontSize: '0.58rem', color: isActive ? '#22c55e' : C.textMute, background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', border: '1px solid ' + (isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.2)'), borderRadius: 20, padding: '1px 6px', fontWeight: 700 }}>
              {isActive ? 'Ativo' : 'Pausado'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Pill label="Invest." value={BRL(adset.spend)} accent />
            <Pill label="Result." value={NUM(adset.results)} />
            <Pill label="CPR" value={cpr} warn={adset.results === 0} />
            <Pill label="CTR" value={ctr} />
          </div>
        </div>
        <ChartIconBtn title="Ver gráfico do conjunto" active={chart} onClick={() => setChart(true)} />
      </div>
      {expanded && (adset.ads || []).length > 0 && (
        <div style={{ padding: '6px 11px 10px 26px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: '0.59rem', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Anúncios ({(adset.ads || []).length})</div>
          {(adset.ads || []).map((ad) => (
            <AdRow key={ad.adId} ad={ad} campaignName={campaignName} adsetName={adset.name} dateRange={dateRange} customSince={customSince} customUntil={customUntil} metaRequestHeaders={metaRequestHeaders} />
          ))}
        </div>
      )}
      {expanded && (adset.ads || []).length === 0 && (
        <div style={{ padding: '10px 11px 12px 26px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '0.73rem', color: C.textMute }}>Nenhum anúncio com gasto neste conjunto.</span>
        </div>
      )}
      {chart && (
        <ChartModal
          title={adset.name}
          entityId={adset.adsetId}
          dateRange={dateRange} customSince={customSince} customUntil={customUntil}
          metaRequestHeaders={metaRequestHeaders}
          metrics={[
            { label: 'Investimento', value: BRL(adset.spend), accent: true },
            { label: 'Resultado',    value: NUM(adset.results) },
            { label: 'Custo/result', value: cpr },
            { label: 'CTR',          value: ctr },
          ]}
          onClose={() => setChart(false)}
        />
      )}
    </div>
  )
}

/* ── CampaignRow ── */
function CampaignRow({ campaign, dateRange, customSince, customUntil, metaRequestHeaders }) {
  const [expanded, setExpanded] = useState(false)
  const [chart, setChart]       = useState(false)
  const [hov, setHov]           = useState(false)
  const isActive = (campaign.effectiveStatus || campaign.status || '').toUpperCase() === 'ACTIVE'
  const cpr = cprStr(campaign.spend, campaign.results)
  const ctr = ctrStr(campaign.clicks, campaign.impressions)
  return (
    <div style={{ border: '1px solid ' + (hov ? C.borderGlow : C.border), borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: hov ? LED.glow : 'none' }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', background: hov ? 'rgba(38,194,129,0.04)' : 'rgba(255,255,255,0.02)', userSelect: 'none', transition: 'background 0.15s' }}
      >
        <i className={'bx bx-chevron-' + (expanded ? 'down' : 'right')} style={{ color: C.textMute, fontSize: 15, flexShrink: 0 }} />
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: isActive ? '#22c55e' : '#64748b', boxShadow: isActive ? '0 0 5px #22c55e88' : 'none', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 255 }}>{campaign.name}</span>
            <span style={{ fontSize: '0.62rem', color: isActive ? '#22c55e' : C.textSub, background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', border: '1px solid ' + (isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.2)'), borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>
              {isActive ? 'Ativa' : 'Pausada'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Pill label="Invest." value={BRL(campaign.spend)} accent />
            <Pill label="Resultados" value={NUM(campaign.results)} />
            <Pill label="CPR" value={cpr} warn={campaign.results === 0} />
            <Pill label="Impr." value={NUM(campaign.impressions)} />
            <Pill label="Cliques" value={NUM(campaign.clicks)} />
            <Pill label="CTR" value={ctr} />
          </div>
        </div>
        <ChartIconBtn title="Ver gráfico da campanha" active={chart} onClick={() => setChart(true)} />
      </div>
      {expanded && (campaign.adsets || []).length > 0 && (
        <div style={{ padding: '8px 14px 12px 28px', background: 'rgba(0,0,0,0.12)', borderTop: '1px solid ' + C.border, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.61rem', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Conjuntos de anúncios ({(campaign.adsets || []).length})</div>
          {(campaign.adsets || []).map((adset) => (
            <AdsetRow key={adset.adsetId} adset={adset} campaignName={campaign.name} dateRange={dateRange} customSince={customSince} customUntil={customUntil} metaRequestHeaders={metaRequestHeaders} />
          ))}
        </div>
      )}
      {expanded && (campaign.adsets || []).length === 0 && (
        <div style={{ padding: '10px 14px 14px 28px', background: 'rgba(0,0,0,0.12)', borderTop: '1px solid ' + C.border }}>
          <span style={{ fontSize: '0.75rem', color: C.textMute }}>Nenhum conjunto de anúncios com gasto nesta campanha.</span>
        </div>
      )}
      {chart && (
        <ChartModal
          title={campaign.name}
          entityId={campaign.campaignId}
          dateRange={dateRange} customSince={customSince} customUntil={customUntil}
          metaRequestHeaders={metaRequestHeaders}
          metrics={[
            { label: 'Investimento', value: BRL(campaign.spend), accent: true },
            { label: 'Resultados',   value: NUM(campaign.results) },
            { label: 'Custo/result', value: cpr },
            { label: 'CTR',          value: ctr },
          ]}
          onClose={() => setChart(false)}
        />
      )}
    </div>
  )
}

/* ── ClientDetailModal ── */
function ClientDetailModal({ client, clientData, dateRangeLabel, dateRange, customSince, customUntil, metaRequestHeaders, onClose }) {
  const { healthKey, adsRow, campaignRow, balanceRow } = clientData
  const [selectedAd, setSelectedAd] = useState(null)
  const [sheetData, setSheetData] = useState(null)
  const [sheetLoading, setSheetLoading] = useState(false)

  useEffect(() => {
    const url = client.leadsSheetUrl || ''
    if (!url) return
    setSheetLoading(true)
    setSheetData(null)
    const params = new URLSearchParams({ url })
    if (client.googleSheetsHeaderRow) params.set('header_row', String(client.googleSheetsHeaderRow))
    fetch('/api/google-sheets/leads-analytics?' + params.toString())
      .then(r => r.json())
      .then(data => setSheetData(data?.overview ? data : null))
      .catch(() => setSheetData(null))
      .finally(() => setSheetLoading(false))
  }, [client.id])

  const h           = HEALTH_META[healthKey] || HEALTH_META.empty
  const campaigns   = campaignRow?.campaigns || []
  const adsRowAds   = adsRow?.ads || []
  const balanceAccs = balanceRow?.accounts || []

  const totalSpend   = campaignRow?.totals?.spend ?? adsRowAds.reduce((s, a) => s + (a.spend || 0), 0)
  const totalResults = campaignRow?.totals?.results ?? adsRowAds.reduce((s, a) => s + (getResults(a) || 0), 0)
  const totalBalance = balanceAccs.reduce((s, a) => s + (a.balance || 0), 0)
  const totalImpr    = adsRowAds.reduce((s, a) => s + (a.impressions || 0), 0)
  const totalClicks  = adsRowAds.reduce((s, a) => s + (a.clicks || 0), 0)

  const topAds = useMemo(() => {
    const allAds = []
    if (campaigns.length > 0) {
      campaigns.forEach((camp) => {
        (camp.adsets || []).forEach((adset) => {
          (adset.ads || []).forEach((ad) => allAds.push({ ...ad, _campaignName: camp.name, _adsetName: adset.name }))
        })
      })
    } else {
      adsRowAds.forEach((ad) => allAds.push(ad))
    }
    return [...allAds].sort((a, b) => {
      const rA = getResults(a) || 0, rB = getResults(b) || 0
      if (rB !== rA) return rB - rA
      const cA = rA > 0 ? (a.spend || 0) / rA : Infinity
      const cB = rB > 0 ? (b.spend || 0) / rB : Infinity
      return cA - cB
    }).slice(0, 5)
  }, [campaigns, adsRowAds])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: 860, borderRadius: 24, background: C.modalBg, border: '1px solid rgba(38,194,129,0.2)', boxShadow: '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(38,194,129,0.06)', overflow: 'hidden', marginBottom: 24 }}
      >
        {/* Hero header — same as onboarding */}
        <div style={{ position: 'relative', padding: '26px 28px 20px', background: C.modalHero, borderBottom: '1px solid rgba(38,194,129,0.12)' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(38,194,129,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(38,194,129,0.15)', border: '1.5px solid rgba(38,194,129,0.35)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 20px rgba(38,194,129,0.2)' }}>
              {client.logoUrl
                ? <img src={client.logoUrl} alt="" style={{ width: 52, height: 52, objectFit: 'cover' }} />
                : <i className="bx bx-building-house" style={{ color: C.accent, fontSize: 24 }} />
              }
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.accent, marginBottom: 4, opacity: 0.85 }}>Performance Geral</div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: 8, lineHeight: 1.2, color: C.text }}>{client.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <HealthBadge healthKey={healthKey} size="lg" />
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '2px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>{dateRangeLabel}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'grid', placeItems: 'center', flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = C.text }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            ><i className="bx bx-x" style={{ fontSize: 20 }} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 26 }}>

          {/* Resumo geral */}
          <div>
            <SectionTitle>Resumo Geral</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              <MetricCard label="Investimento" value={BRL(totalSpend)} accent />
              <MetricCard label="Resultados" value={NUM(totalResults)} />
              <MetricCard label="Custo por resultado" value={cprStr(totalSpend, totalResults)} warn={totalResults === 0} />
              <MetricCard label="Impressões" value={NUM(totalImpr)} />
              <MetricCard label="Cliques" value={NUM(totalClicks)} />
              <MetricCard label="CTR" value={ctrStr(totalClicks, totalImpr)} />
              {balanceAccs.length > 0 && <MetricCard label="Saldo total" value={BRL(totalBalance)} warn={totalBalance < 50} />}
            </div>
          </div>

          {/* Campanhas */}
          <div>
            <SectionTitle>{'Campanhas → Conjuntos → Anúncios (' + campaigns.length + ')'}</SectionTitle>
            {campaigns.length > 0
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {campaigns.map((c) => (
                    <CampaignRow
                      key={c.campaignId || c.id}
                      campaign={c}
                      dateRange={dateRange}
                      customSince={customSince}
                      customUntil={customUntil}
                      metaRequestHeaders={metaRequestHeaders}
                    />
                  ))}
                </div>
              : <EmptyBlock>Nenhuma campanha no período selecionado.</EmptyBlock>
            }
          </div>

          {/* Top 5 anuncios */}
          <div>
            <SectionTitle>Top 5 Anúncios</SectionTitle>
            {topAds.length > 0
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topAds.map((ad, idx) => {
                    const results = getResults(ad)
                    return (
                      <div
                        key={ad.adId || idx}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: 'rgba(255,255,255,0.03)', border: '1px solid ' + C.border, borderRadius: 12, transition: 'all 0.15s', cursor: 'pointer' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(38,194,129,0.05)'; e.currentTarget.style.borderColor = C.borderGlow; e.currentTarget.style.boxShadow = LED.glow }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
                        onClick={() => setSelectedAd(ad)}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: C.accent, width: 22, flexShrink: 0, textAlign: 'center' }}>{'#' + (idx + 1)}</div>
                        {ad.imageUrl
                          ? <img src={ad.imageUrl} alt={ad.name || ad.label || ''} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 42, height: 42, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMute, flexShrink: 0 }}><i className="bx bx-image-alt" /></div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{ad.name || ad.label || 'Sem título'}</div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Pill label="Invest." value={BRL(ad.spend)} accent />
                            <Pill label="Result." value={NUM(results)} />
                            <Pill label="CPR" value={cprStr(ad.spend, results)} warn={results === 0} />
                            <Pill label="CTR" value={ctrStr(ad.clicks, ad.impressions)} />
                          </div>
                        </div>
                        <ChartIconBtn
                          title="Ver gráfico do anúncio"
                          active={false}
                          onClick={(e) => { e.stopPropagation(); setSelectedAd({ ...ad, _openChart: true }) }}
                        />
                        <i className="bx bx-right-arrow-alt" style={{ color: C.textMute, fontSize: 17, flexShrink: 0 }} />
                      </div>
                    )
                  })}
                </div>
              : <EmptyBlock>Sem anúncios com dados no período selecionado.</EmptyBlock>
            }
          </div>

          {/* Top 5 estados */}
          <div>
            <SectionTitle>Top 5 Estados por Resultado</SectionTitle>
            <EmptyBlock icon="bx-map">Sem dados de localização no período selecionado. Esta métrica requer segmentação geográfica via API.</EmptyBlock>
          </div>

          {/* Top idades */}
          <div>
            <SectionTitle>Top Idades por Resultado</SectionTitle>
            <EmptyBlock icon="bx-user-circle">Sem dados de faixa etária no período selecionado. Esta métrica requer segmentação demográfica via API.</EmptyBlock>
          </div>

          {/* Saldos */}
          {balanceAccs.length > 0 && (
            <div>
              <SectionTitle>Saldos das Contas</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {balanceAccs.map((acc) => (
                  <div key={acc.accountId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (acc.balance < 50 ? 'rgba(239,68,68,0.25)' : C.border), borderRadius: 10, boxShadow: acc.balance < 50 ? '0 0 8px rgba(239,68,68,0.1)' : 'none' }}>
                    <span style={{ fontSize: '0.82rem', color: '#d1d5db' }}>{acc.name || acc.accountId}</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: acc.balance < 50 ? '#ef4444' : C.accent }}>{BRL(acc.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Planilha de Leads */}
          {client.leadsSheetUrl && (
            <div>
              <SectionTitle>Planilha de Leads</SectionTitle>
              {sheetLoading
                ? <EmptyBlock icon="bx-loader-alt">Carregando dados da planilha...</EmptyBlock>
                : !sheetData
                  ? <EmptyBlock icon="bx-table">Não foi possível carregar os dados da planilha.</EmptyBlock>
                  : (() => {
                    const ov = sheetData.overview || {}
                    const total = ov.total || 0
                    const pct = (v) => total > 0 ? ' ' + Math.round((v / total) * 100) + '%' : ''
                    const LEAD_METRICS = [
                      { label: 'Total de Leads',  value: total,            color: '#60a5fa', icon: 'bx-user-plus',   sub: '' },
                      { label: 'Público-alvo',    value: ov.publicoAlvo,   color: '#a78bfa', icon: 'bx-target-lock', sub: pct(ov.publicoAlvo) },
                      { label: 'Qualificados',    value: ov.qualified,     color: '#22c55e', icon: 'bx-check-shield', sub: pct(ov.qualified) },
                      { label: 'Convertidos',     value: ov.converted,     color: '#10b981', icon: 'bx-trophy',      sub: pct(ov.converted) },
                      { label: 'Perdidos',        value: ov.lost,          color: '#ef4444', icon: 'bx-x-circle',    sub: pct(ov.lost) },
                      { label: 'Sem Resposta',    value: ov.noreply,       color: '#f59e0b', icon: 'bx-time',        sub: pct(ov.noreply) },
                    ]
                    const topAdsSheet = (sheetData.ads || [])
                      .filter(a => (a.publicoAlvo || 0) > 0)
                      .sort((a, b) => (b.publicoAlvo || 0) - (a.publicoAlvo || 0))
                      .slice(0, 3)
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
                          {LEAD_METRICS.map((m) => (
                            <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + C.border, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: 10, background: m.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className={'bx ' + m.icon} style={{ color: m.color, fontSize: 17 }} />
                              </div>
                              <div>
                                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: m.color, lineHeight: 1.1 }}>
                                  {NUM(m.value || 0)}{m.sub && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.textSub, marginLeft: 4 }}>{m.sub}</span>}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: C.textSub, marginTop: 2 }}>{m.label}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {topAdsSheet.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textSub, marginBottom: 8 }}>Top 3 Criativos — Público Alvo</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {topAdsSheet.map((ad, idx) => (
                                <div key={ad.name || idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 13px', background: 'rgba(255,255,255,0.03)', border: '1px solid ' + C.border, borderRadius: 10 }}>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#a78bfa', width: 22, flexShrink: 0, textAlign: 'center' }}>{'#' + (idx + 1)}</div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.name || 'Sem título'}</div>
                                    <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '0.72rem', color: C.textSub }}>Leads: <strong style={{ color: C.text }}>{NUM(ad.total || 0)}</strong></span>
                                      <span style={{ fontSize: '0.72rem', color: C.textSub }}>Público-alvo: <strong style={{ color: '#a78bfa' }}>{NUM(ad.publicoAlvo || 0)}</strong></span>
                                      <span style={{ fontSize: '0.72rem', color: C.textSub }}>Qualif.: <strong style={{ color: '#22c55e' }}>{NUM(ad.qualified || 0)}</strong></span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()
              }
            </div>
          )}
        </div>
      </div>

      {selectedAd && (
        <AdDetailModal
          ad={selectedAd}
          campaignName={selectedAd._campaignName || null}
          adsetName={selectedAd._adsetName || null}
          dateRange={dateRange} customSince={customSince} customUntil={customUntil}
          metaRequestHeaders={metaRequestHeaders}
          onClose={() => setSelectedAd(null)}
        />
      )}
    </div>
  )
}

/* ── ClientCard ── */
function ClientCard({ client, clientData, onClick }) {
  const { healthKey, adsRow, campaignRow, balanceRow } = clientData
  const [hov, setHov] = useState(false)
  const h           = HEALTH_META[healthKey] || HEALTH_META.empty
  const ads         = adsRow?.ads || []
  const campaigns   = campaignRow?.campaigns || []
  const balanceAccs = balanceRow?.accounts || []
  const totalSpend   = campaignRow?.totals?.spend ?? ads.reduce((s, a) => s + (a.spend || 0), 0)
  const totalResults = campaignRow?.totals?.results ?? ads.reduce((s, a) => s + (getResults(a) || 0), 0)
  const totalBalance = balanceAccs.reduce((s, a) => s + (a.balance || 0), 0)
  const activeCamps  = campaigns.filter((c) => (c.effectiveStatus || c.status || '').toUpperCase() === 'ACTIVE').length
  const topAd        = [...ads].sort((a, b) => (getResults(b) || 0) - (getResults(a) || 0))[0]
  const lowBalance   = balanceAccs.length > 0 && totalBalance < 50

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid ' + (hov ? h.color + '55' : h.color + '28'),
        borderLeft: '3px solid ' + h.color,
        borderRadius: 16, padding: '18px 20px', cursor: 'pointer',
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: hov ? '0 0 20px ' + h.glow + ', 0 8px 24px rgba(0,0,0,0.3)' : 'none',
        transform: hov ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          {client.logoUrl
            ? <img src={client.logoUrl} alt={client.name} style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'contain', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            : <div style={{ width: 30, height: 30, borderRadius: 7, background: h.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: h.color, fontSize: 15, flexShrink: 0 }}><i className="bx bx-user" /></div>
          }
          <span style={{ fontWeight: 800, fontSize: '0.87rem', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</span>
        </div>
        <HealthBadge healthKey={healthKey} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: C.accent }}>{BRL(totalSpend)}</div>
          <div style={{ fontSize: '0.59rem', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Invest.</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: C.text }}>{NUM(totalResults)}</div>
          <div style={{ fontSize: '0.59rem', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Result.</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: totalResults > 0 ? C.text : C.textMute }}>{totalResults > 0 ? BRL(totalSpend / totalResults) : '-'}</div>
          <div style={{ fontSize: '0.59rem', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>CPR</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {activeCamps > 0 && (
            <span style={{ fontSize: '0.69rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.6)', display: 'inline-block' }} />
              {activeCamps} camp. ativa{activeCamps !== 1 ? 's' : ''}
            </span>
          )}
          {lowBalance && (
            <span style={{ fontSize: '0.69rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
              <i className="bx bx-error-circle" style={{ fontSize: 12 }} /> Saldo baixo
            </span>
          )}
          {balanceAccs.length > 0 && !lowBalance && (
            <span style={{ fontSize: '0.69rem', color: C.textSub }}>Saldo: <strong style={{ color: C.text }}>{BRL(totalBalance)}</strong></span>
          )}
        </div>
        <div style={{ fontSize: '0.68rem', color: C.accent, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700 }}>
          Ver detalhes <i className="bx bx-right-arrow-alt" />
        </div>
      </div>
      {topAd && (
        <div style={{ paddingTop: 10, borderTop: '1px solid ' + C.border, fontSize: '0.69rem', color: C.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <i className="bx bx-trophy" style={{ color: C.accent, marginRight: 4 }} />
          Top: <strong style={{ color: '#e5e7eb' }}>{topAd.label || topAd.name || 'Sem título'}</strong>
          {getResults(topAd) > 0 && <span style={{ color: C.textMute }}> — {NUM(getResults(topAd))} result.</span>}
        </div>
      )}
    </div>
  )
}

/* ── StatCard ── */
function StatCard({ icon, label, value, sub, color, warn }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid ' + (warn ? 'rgba(239,68,68,0.22)' : C.border), borderRadius: 16, padding: '18px 20px', flex: 1, minWidth: 0, boxShadow: warn ? '0 0 14px rgba(239,68,68,0.1)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 18, boxShadow: '0 0 10px ' + color + '33' }}>
          <i className={'bx ' + icon} />
        </span>
        <span style={{ fontSize: '0.66rem', color: C.textSub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.42rem', fontWeight: 900, color: warn ? '#ef4444' : C.text, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.69rem', color: C.textMute, marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

/* ── Main export ── */
export default function PerformanceGeneralTab({
  clients,
  latestWeeklyHealthByClientId,
  adsOverviewRows,
  adsOverviewLoading,
  campaignOverviewRows,
  campaignOverviewLoading,
  adAccountBalanceRows,
  adAccountBalanceLoading,
  dateRange,
  customSince,
  customUntil,
  draftDateRange,
  setDraftDateRange,
  draftCustomSince,
  setDraftCustomSince,
  draftCustomUntil,
  setDraftCustomUntil,
  handleApplyDashboardFilters,
  DATE_PRESETS,
  metaRequestHeaders,
}) {
  const [healthFilter, setHealthFilter] = useState('all')
  const [search, setSearch]             = useState('')
  const [activeModal, setActiveModal]   = useState(null)

  const adsMap = useMemo(() => {
    const m = {}
    for (const r of (adsOverviewRows || [])) m[r.clientId] = r
    return m
  }, [adsOverviewRows])

  const campaignMap = useMemo(() => {
    const m = {}
    for (const r of (campaignOverviewRows || [])) m[r.clientId] = r
    return m
  }, [campaignOverviewRows])

  const balanceMap = useMemo(() => {
    const m = {}
    for (const r of (adAccountBalanceRows || [])) m[r.clientId] = r
    return m
  }, [adAccountBalanceRows])

  const getClientData = (client) => ({
    healthKey:   latestWeeklyHealthByClientId?.get(client.id)?.healthStatus || 'empty',
    adsRow:      adsMap[client.id],
    campaignRow: campaignMap[client.id],
    balanceRow:  balanceMap[client.id],
  })

  const sortedClients = useMemo(() => {
    return (clients || [])
      .filter((c) => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
        const hk = latestWeeklyHealthByClientId?.get(c.id)?.healthKey || 'empty'
        if (healthFilter !== 'all' && hk !== healthFilter) return false
        return true
      })
      .sort((a, b) => {
        const hA = latestWeeklyHealthByClientId?.get(a.id)?.healthKey || 'empty'
        const hB = latestWeeklyHealthByClientId?.get(b.id)?.healthKey || 'empty'
        return (HEALTH_META[hA]?.sortRank ?? 99) - (HEALTH_META[hB]?.sortRank ?? 99)
      })
  }, [clients, latestWeeklyHealthByClientId, healthFilter, search])

  const stats = useMemo(() => {
    let totalSpend = 0, totalResults = 0, totalBalance = 0, criticalCount = 0, attentionCount = 0, activeCount = 0
    for (const c of (clients || [])) {
      const hk  = latestWeeklyHealthByClientId?.get(c.id)?.healthKey || 'empty'
      if (hk === 'critical' || hk === 'integration') criticalCount++
      if (hk === 'attention') attentionCount++
      const camp = campaignMap[c.id]
      const adsR = adsMap[c.id]
      const bal  = balanceMap[c.id]
      const spend   = camp?.totals?.spend ?? (adsR?.ads || []).reduce((s, a) => s + (a.spend || 0), 0)
      const results = camp?.totals?.results ?? (adsR?.ads || []).reduce((s, a) => s + (getResults(a) || 0), 0)
      totalSpend   += spend || 0
      totalResults += results || 0
      if (bal?.accounts) totalBalance += bal.accounts.reduce((s, a) => s + (a.balance || 0), 0)
      if (spend > 0) activeCount++
    }
    return { totalSpend, totalResults, totalBalance, criticalCount, attentionCount, activeCount }
  }, [clients, latestWeeklyHealthByClientId, campaignMap, adsMap, balanceMap])

  const isLoading   = adsOverviewLoading || campaignOverviewLoading || adAccountBalanceLoading
  const presetLabel = DATE_PRESETS?.find((p) => p.value === dateRange)?.label || dateRange

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 22px', display: 'flex', flexDirection: 'column', gap: 26 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.63rem', fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: '0 0 8px rgba(38,194,129,0.7)' }} />
            Performance
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: C.text, margin: 0, lineHeight: 1.1 }}>Visão Geral</h2>
          <p style={{ fontSize: '0.78rem', color: C.textMute, margin: '7px 0 0' }}>Saúde e performance consolidada de todos os clientes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={draftDateRange}
            onChange={(e) => setDraftDateRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid ' + C.border, background: 'rgba(255,255,255,0.05)', color: '#e5e7eb', fontSize: '0.79rem', outline: 'none', cursor: 'pointer' }}
          >
            {(DATE_PRESETS || []).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {draftDateRange === 'custom' && (
            <>
              <input type="date" value={draftCustomSince || ''} onChange={(e) => setDraftCustomSince(e.target.value)} style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid ' + C.border, background: 'rgba(255,255,255,0.05)', color: '#e5e7eb', fontSize: '0.79rem', outline: 'none' }} />
              <input type="date" value={draftCustomUntil || ''} onChange={(e) => setDraftCustomUntil(e.target.value)} style={{ padding: '8px 10px', borderRadius: 9, border: '1px solid ' + C.border, background: 'rgba(255,255,255,0.05)', color: '#e5e7eb', fontSize: '0.79rem', outline: 'none' }} />
            </>
          )}
          <button
            onClick={handleApplyDashboardFilters}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', background: C.accent, color: '#000', fontWeight: 800, fontSize: '0.79rem', cursor: 'pointer', boxShadow: LED.glow, whiteSpace: 'nowrap', transition: 'box-shadow 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = LED.glowHover }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = LED.glow }}
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard icon="bx-dollar-circle" label="Investimento Total"  value={BRL(stats.totalSpend)}   sub={stats.activeCount + ' clientes com investimento'} color={C.accent} />
        <StatCard icon="bx-target-lock"   label="Resultados"          value={NUM(stats.totalResults)} sub={'CPR médio: ' + (stats.totalResults > 0 ? BRL(stats.totalSpend / stats.totalResults) : '-')} color="#1d8fff" />
        <StatCard icon="bx-wallet-alt"    label="Saldo Total"         value={BRL(stats.totalBalance)} sub="somatório das contas ativas" color="#f59e0b" />
        <StatCard icon="bx-error-circle"  label="Críticos / Atenção" value={stats.criticalCount + ' / ' + stats.attentionCount} sub="clientes que precisam de atenção" color="#ef4444" warn={stats.criticalCount > 0} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '13px 15px', background: 'rgba(255,255,255,0.025)', border: '1px solid ' + C.border, borderRadius: 14 }}>
        <i className="bx bx-filter-alt" style={{ color: C.textSub, fontSize: 16, flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + C.border, background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', fontSize: '0.79rem', outline: 'none', minWidth: 170 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_OPTS.map((opt) => {
            const hm = HEALTH_META[opt.key]
            const isActive = healthFilter === opt.key
            const ac = hm?.color || C.accent
            const ag = hm?.glow  || 'rgba(38,194,129,0.2)'
            return (
              <button
                key={opt.key}
                onClick={() => setHealthFilter(opt.key)}
                style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: '1px solid ' + (isActive ? ac + '55' : C.border),
                  background: isActive ? ac + '15' : 'rgba(255,255,255,0.03)',
                  color: isActive ? ac : C.textSub,
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  boxShadow: isActive ? '0 0 8px ' + ag : 'none',
                  transition: 'all 0.15s',
                }}
              >{opt.label}</button>
            )
          })}
        </div>
        <span style={{ fontSize: '0.71rem', color: C.textMute, marginLeft: 'auto' }}>
          {sortedClients.length} cliente{sortedClients.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Client grid */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '54px 0', color: C.textMute }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 34, color: C.accent, marginBottom: 12, display: 'block' }} />
          <div style={{ fontSize: '0.83rem' }}>Carregando dados de performance...</div>
        </div>
      )}
      {!isLoading && sortedClients.length === 0 && (
        <div style={{ textAlign: 'center', padding: '54px 0', color: C.textMute }}>
          <i className="bx bx-search-alt" style={{ fontSize: 38, marginBottom: 10, display: 'block' }} />
          <div style={{ fontSize: '0.88rem' }}>Nenhum cliente encontrado com os filtros selecionados.</div>
        </div>
      )}
      {!isLoading && sortedClients.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {sortedClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              clientData={getClientData(client)}
              onClick={() => setActiveModal(client)}
            />
          ))}
        </div>
      )}

      {activeModal && (
        <ClientDetailModal
          client={activeModal}
          clientData={getClientData(activeModal)}
          dateRangeLabel={presetLabel}
          dateRange={dateRange}
          customSince={customSince}
          customUntil={customUntil}
          metaRequestHeaders={metaRequestHeaders}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}
