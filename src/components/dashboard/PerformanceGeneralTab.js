'use client'
import { useState, useMemo } from 'react'

/* ── Health meta ── */
const HEALTH_META = {
  with_result: { label: 'Excelente',    color: '#1d8fff', glow: 'rgba(29,143,255,0.28)',   sortRank: 4 },
  healthy:     { label: 'Saudável',color: '#22c55e', glow: 'rgba(34,197,94,0.28)',    sortRank: 3 },
  attention:   { label: 'Atenção', color: '#f59e0b', glow: 'rgba(245,158,11,0.28)', sortRank: 2 },
  critical:    { label: 'Crítico', color: '#ef4444', glow: 'rgba(239,68,68,0.28)',    sortRank: 0 },
  integration: { label: 'Integração', color: '#8b5cf6', glow: 'rgba(139,92,246,0.28)', sortRank: 1 },
  churn:       { label: 'Churn',        color: '#64748b', glow: 'rgba(100,116,139,0.2)',   sortRank: 5 },
  empty:       { label: 'Sem dados',    color: '#374151', glow: 'rgba(55,65,81,0.15)',     sortRank: 6 },
}

const FILTER_OPTS = [
  { key: 'all',         label: 'Todos'           },
  { key: 'critical',    label: 'Crítico'    },
  { key: 'attention',   label: 'Atenção' },
  { key: 'healthy',     label: 'Saudável'   },
  { key: 'with_result', label: 'Excelente'        },
  { key: 'integration', label: 'Integração' },
  { key: 'churn',       label: 'Churn'            },
  { key: 'empty',       label: 'Sem dados'        },
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
  surface2:   '#1a2235',
  border:     'rgba(255,255,255,0.08)',
  borderGlow: 'rgba(38,194,129,0.3)',
  text:       '#f9fafb',
  textSub:    '#9ca3af',
  textMute:   '#4b5563',
}
const LED = {
  glow:      '0 0 10px rgba(38,194,129,0.2), 0 0 20px rgba(38,194,129,0.08)',
  glowHover: '0 0 16px rgba(38,194,129,0.38), 0 0 32px rgba(38,194,129,0.14)',
  border:    '1px solid rgba(38,194,129,0.3)',
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

/* ── MetricCard ── */
function MetricCard({ label, value, accent, warn }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid ' + (accent ? C.borderGlow : warn ? 'rgba(239,68,68,0.25)' : C.border),
      borderRadius: 12, padding: '12px 14px', textAlign: 'center',
      boxShadow: accent ? LED.glow : warn ? '0 0 8px rgba(239,68,68,0.1)' : 'none',
    }}>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: accent ? C.accent : warn ? '#ef4444' : C.text, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.61rem', color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 5 }}>{label}</div>
    </div>
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
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <i className={'bx ' + (icon || 'bx-data')} style={{ color: C.textMute, fontSize: 18, flexShrink: 0 }} />
      <span style={{ fontSize: '0.77rem', color: C.textMute }}>{children}</span>
    </div>
  )
}

/* ── BarChart ── */
function BarChart({ items }) {
  if (!items || !items.length) return (
    <div style={{ textAlign: 'center', color: C.textMute, padding: 20, fontSize: '0.78rem' }}>Sem dados para o gráfico</div>
  )
  const max = Math.max(...items.map((i) => i.value || 0), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, padding: '0 4px' }}>
      {items.map((it, idx) => {
        const pct = Math.max(4, ((it.value || 0) / max) * 100)
        return (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: '0.58rem', color: C.textMute, textAlign: 'center', lineHeight: 1.1, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {typeof it.value === 'number' && it.value > 100 ? BRL(it.value) : NUM(it.value)}
            </div>
            <div style={{ width: '100%', height: pct + '%', background: it.color || C.accent, borderRadius: '4px 4px 0 0', boxShadow: '0 0 8px ' + (it.color || C.accent) + '44', minHeight: 4 }} />
            <div style={{ fontSize: '0.58rem', color: C.textMute, textAlign: 'center', lineHeight: 1.1, maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── ChartModal ── */
function ChartModal({ title, metrics, items, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', background: C.surface, border: LED.border, boxShadow: LED.glowHover + ', 0 24px 60px rgba(0,0,0,0.7)', borderRadius: 20, padding: '26px 28px', width: '92vw', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: '0.93rem', color: C.text }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}><i className="bx bx-x" /></button>
        </div>
        {metrics && metrics.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + Math.min(metrics.length, 4) + ', 1fr)', gap: 8, marginBottom: 22 }}>
            {metrics.map((m, i) => (
              <MetricCard key={i} label={m.label} value={m.value} accent={m.accent} warn={m.warn} />
            ))}
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '16px 12px' }}>
          <BarChart items={items} />
        </div>
      </div>
    </div>
  )
}

/* ── AdDetailModal ── */
function AdDetailModal({ ad, campaignName, adsetName, onClose }) {
  const [chartOpen, setChartOpen] = useState(false)
  const results = getResults(ad)
  const cpr = cprStr(ad.spend, results)
  const ctr = ctrStr(ad.clicks, ad.impressions)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', background: C.surface, border: LED.border, boxShadow: LED.glowHover + ', 0 24px 60px rgba(0,0,0,0.8)', borderRadius: 20, padding: '24px 26px', width: '92vw', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '0.63rem', color: C.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Detalhes do Anúncio</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textSub, fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}><i className="bx bx-x" /></button>
        </div>
        {ad.imageUrl
          ? <img src={ad.imageUrl} alt={ad.label || ad.name || ''} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid ' + C.border }} />
          : <div style={{ width: '100%', height: 90, borderRadius: 12, border: '1px solid ' + C.border, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMute, fontSize: 30 }}><i className="bx bx-image-alt" /></div>
        }
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: C.text, marginBottom: 6 }}>{ad.label || ad.name || 'Anúncio sem título'}</div>
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
          {ad.spend > 0 && ad.impressions > 0 && (
            <MetricCard label="CPM" value={BRL((ad.spend / ad.impressions) * 1000)} />
          )}
          {ad.spend > 0 && ad.clicks > 0 && (
            <MetricCard label="CPC" value={BRL(ad.spend / ad.clicks)} />
          )}
        </div>
        <button
          onClick={() => setChartOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', border: LED.border, borderRadius: 9, background: 'rgba(38,194,129,0.08)', color: C.accent, fontWeight: 700, fontSize: '0.77rem', cursor: 'pointer', boxShadow: LED.glow, width: 'fit-content' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = LED.glowHover }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = LED.glow }}
        >
          <i className="bx bx-bar-chart-alt-2" /> Ver gráfico do anúncio
        </button>
        {chartOpen && (
          <ChartModal
            title={'Gráfico: ' + (ad.label || ad.name || 'Anúncio')}
            metrics={[
              { label: 'Investimento', value: BRL(ad.spend), accent: true },
              { label: 'Resultado',    value: NUM(results) },
              { label: 'Custo/result', value: cpr },
              { label: 'CTR',          value: ctr },
            ]}
            items={[
              { label: 'Invest.',  value: ad.spend || 0,               color: C.accent  },
              { label: 'Cliques',  value: ad.clicks || 0,              color: '#1d8fff' },
              { label: 'Result.',  value: results || 0,                color: '#f59e0b' },
              { label: 'Impr./k',  value: (ad.impressions || 0) / 1000, color: '#8b5cf6' },
            ]}
            onClose={() => setChartOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

/* ── AdRow (inside adset) ── */
function AdRow({ ad, campaignName, adsetName, onChartClick }) {
  const [selectedAd, setSelectedAd] = useState(null)
  const results = getResults(ad)
  const cpr = cprStr(ad.spend, results)
  const ctr = ctrStr(ad.clicks, ad.impressions)
  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
        onClick={() => setSelectedAd(ad)}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(38,194,129,0.05)'; e.currentTarget.style.borderColor = C.borderGlow }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
      >
        {ad.imageUrl
          ? <img src={ad.imageUrl} alt={ad.name || ''} style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 34, height: 34, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: C.textMute }}><i className="bx bx-image-alt" style={{ fontSize: 14 }} /></div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{ad.name || ad.label || 'Anúncio'}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Pill label="Invest." value={BRL(ad.spend)} accent />
            <Pill label="Result." value={NUM(results)} />
            <Pill label="CPR" value={cpr} warn={results === 0} />
            <Pill label="CTR" value={ctr} />
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onChartClick({ ...ad, results }) }}
          style={{ flexShrink: 0, padding: '4px 8px', border: LED.border, borderRadius: 6, background: 'rgba(38,194,129,0.07)', color: C.accent, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, boxShadow: LED.glow }}
          title="Ver gráfico do anúncio"
        >
          <i className="bx bx-bar-chart-alt-2" />
        </button>
        <i className="bx bx-right-arrow-alt" style={{ color: C.textMute, fontSize: 14, flexShrink: 0 }} />
      </div>
      {selectedAd && (
        <AdDetailModal ad={selectedAd} campaignName={campaignName} adsetName={adsetName} onClose={() => setSelectedAd(null)} />
      )}
    </div>
  )
}

/* ── AdsetRow ── */
function AdsetRow({ adset, campaignName, onChartClick }) {
  const [expanded, setExpanded] = useState(false)
  const [hov, setHov] = useState(false)
  const isActive = (adset.effectiveStatus || '').toUpperCase() === 'ACTIVE'
  const cpr = cprStr(adset.spend, adset.results)
  const ctr = ctrStr(adset.clicks, adset.impressions)
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, overflow: 'hidden', transition: 'border-color 0.15s', borderColor: hov ? 'rgba(38,194,129,0.2)' : 'rgba(255,255,255,0.06)' }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', background: hov ? 'rgba(38,194,129,0.03)' : 'rgba(255,255,255,0.015)', userSelect: 'none', transition: 'background 0.15s' }}
      >
        <i className={'bx bx-chevron-' + (expanded ? 'down' : 'right')} style={{ color: C.textMute, fontSize: 13, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.77rem', fontWeight: 600, color: '#d1d5db', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 230 }}>{adset.name}</span>
            <span style={{ fontSize: '0.59rem', color: isActive ? '#22c55e' : C.textMute, background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', border: '1px solid ' + (isActive ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.2)'), borderRadius: 20, padding: '1px 6px', fontWeight: 700 }}>
              {isActive ? 'Ativo' : 'Pausado'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Pill label="Invest." value={BRL(adset.spend)} accent />
            <Pill label="Result." value={NUM(adset.results)} />
            <Pill label="CPR" value={cpr} warn={adset.results === 0} />
            <Pill label="CTR" value={ctr} />
            <Pill label="Impr." value={NUM(adset.impressions)} />
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onChartClick({ ...adset, name: adset.name, type: 'adset' }) }}
          style={{ flexShrink: 0, padding: '4px 8px', border: LED.border, borderRadius: 6, background: 'rgba(38,194,129,0.07)', color: C.accent, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, boxShadow: LED.glow }}
          title="Ver gráfico do conjunto"
        >
          <i className="bx bx-bar-chart-alt-2" /> Gráfico
        </button>
      </div>
      {expanded && (adset.ads || []).length > 0 && (
        <div style={{ padding: '6px 12px 10px 26px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: '0.6rem', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Anúncios</div>
          {(adset.ads || []).map((ad) => (
            <AdRow key={ad.adId} ad={ad} campaignName={campaignName} adsetName={adset.name} onChartClick={onChartClick} />
          ))}
        </div>
      )}
      {expanded && (adset.ads || []).length === 0 && (
        <div style={{ padding: '10px 12px 12px 26px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: '0.74rem', color: C.textMute }}>Nenhum anúncio com gasto neste conjunto.</span>
        </div>
      )}
    </div>
  )
}

/* ── CampaignRow ── */
function CampaignRow({ campaign, onChartClick }) {
  const [expanded, setExpanded] = useState(false)
  const [hov, setHov] = useState(false)
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.83rem', fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{campaign.name}</span>
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
        <button
          onClick={(e) => { e.stopPropagation(); onChartClick({ ...campaign, type: 'campaign' }) }}
          style={{ flexShrink: 0, padding: '5px 10px', border: LED.border, borderRadius: 7, background: 'rgba(38,194,129,0.07)', color: C.accent, fontSize: '0.69rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, boxShadow: LED.glow, whiteSpace: 'nowrap', transition: 'box-shadow 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = LED.glowHover }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = LED.glow }}
        >
          <i className="bx bx-bar-chart-alt-2" /> Gráfico
        </button>
      </div>
      {expanded && (campaign.adsets || []).length > 0 && (
        <div style={{ padding: '8px 14px 12px 28px', background: 'rgba(0,0,0,0.12)', borderTop: '1px solid ' + C.border, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.61rem', color: C.textMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Conjuntos de anúncios ({(campaign.adsets || []).length})</div>
          {(campaign.adsets || []).map((adset) => (
            <AdsetRow key={adset.adsetId} adset={adset} campaignName={campaign.name} onChartClick={onChartClick} />
          ))}
        </div>
      )}
      {expanded && (campaign.adsets || []).length === 0 && (
        <div style={{ padding: '10px 14px 14px 28px', background: 'rgba(0,0,0,0.12)', borderTop: '1px solid ' + C.border }}>
          <span style={{ fontSize: '0.75rem', color: C.textMute }}>Nenhum conjunto de anúncios com gasto nesta campanha.</span>
        </div>
      )}
    </div>
  )
}

/* ── ClientDetailModal ── */
function ClientDetailModal({ client, clientData, dateRangeLabel, onClose }) {
  const { healthKey, adsRow, campaignRow, balanceRow } = clientData
  const [activeChart, setActiveChart] = useState(null)
  const [selectedAd, setSelectedAd]   = useState(null)

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
          (adset.ads || []).forEach((ad) => {
            allAds.push({ ...ad, _campaignName: camp.name, _adsetName: adset.name })
          })
        })
      })
    } else {
      adsRowAds.forEach((ad) => allAds.push(ad))
    }
    return [...allAds].sort((a, b) => {
      const rA = getResults(a) || 0
      const rB = getResults(b) || 0
      if (rB !== rA) return rB - rA
      const cA = rA > 0 ? (a.spend || 0) / rA : Infinity
      const cB = rB > 0 ? (b.spend || 0) / rB : Infinity
      return cA - cB
    }).slice(0, 5)
  }, [campaigns, adsRowAds])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', background: C.surface, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(38,194,129,0.08), 0 32px 80px rgba(0,0,0,0.7)', borderRadius: 22, width: '96vw', maxWidth: 860, maxHeight: '93vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid ' + C.border, position: 'sticky', top: 0, background: C.surface, zIndex: 5, borderRadius: '22px 22px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              {client.logoUrl
                ? <img src={client.logoUrl} alt={client.name} style={{ width: 44, height: 44, borderRadius: 11, objectFit: 'contain', background: 'rgba(255,255,255,0.06)', border: '1px solid ' + C.border }} />
                : <div style={{ width: 44, height: 44, borderRadius: 11, background: h.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: h.color, fontSize: 20 }}><i className="bx bx-user" /></div>
              }
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '1.12rem', color: C.text, margin: 0 }}>{client.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <HealthBadge healthKey={healthKey} size="lg" />
                  <span style={{ fontSize: '0.7rem', color: C.textMute, background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '2px 10px', border: '1px solid ' + C.border }}>{dateRangeLabel}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid ' + C.border, borderRadius: 10, color: C.textSub, fontSize: 20, cursor: 'pointer', padding: '6px 10px', lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = C.text }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = C.textSub }}
            ><i className="bx bx-x" /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 26 }}>

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

          {/* Planilha */}
          <div>
            <SectionTitle>Resumo da Planilha</SectionTitle>
            <EmptyBlock icon="bx-table">Planilha não configurada ou sem dados no período selecionado.</EmptyBlock>
          </div>

          {/* Campanhas */}
          <div>
            <SectionTitle>{'Campanhas → Conjuntos → Anúncios (' + campaigns.length + ')'}</SectionTitle>
            {campaigns.length > 0
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {campaigns.map((c) => (
                    <CampaignRow key={c.campaignId || c.id} campaign={c} onChartClick={setActiveChart} />
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
                        onClick={() => setSelectedAd(ad)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid ' + C.border, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(38,194,129,0.05)'; e.currentTarget.style.borderColor = C.borderGlow; e.currentTarget.style.boxShadow = LED.glow }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: C.accent, width: 22, flexShrink: 0, textAlign: 'center' }}>{'#' + (idx + 1)}</div>
                        {ad.imageUrl
                          ? <img src={ad.imageUrl} alt={ad.name || ad.label || ''} style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 44, height: 44, borderRadius: 9, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMute, flexShrink: 0 }}><i className="bx bx-image-alt" /></div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.81rem', fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{ad.name || ad.label || 'Sem título'}</div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Pill label="Invest." value={BRL(ad.spend)} accent />
                            <Pill label="Result." value={NUM(results)} />
                            <Pill label="CPR" value={cprStr(ad.spend, results)} warn={results === 0} />
                            <Pill label="CTR" value={ctrStr(ad.clicks, ad.impressions)} />
                          </div>
                        </div>
                        <i className="bx bx-right-arrow-alt" style={{ color: C.textMute, fontSize: 18, flexShrink: 0 }} />
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

        </div>
      </div>

      {activeChart && (
        <ChartModal
          title={'Gráfico: ' + (activeChart.name || '')}
          metrics={[
            { label: 'Investimento', value: BRL(activeChart.spend), accent: true },
            { label: 'Resultados',   value: NUM(getResults(activeChart)) },
            { label: 'Custo/result', value: cprStr(activeChart.spend, getResults(activeChart)) },
            { label: 'Cliques',      value: NUM(activeChart.clicks) },
          ]}
          items={[
            { label: 'Invest.',  value: activeChart.spend || 0,                           color: C.accent  },
            { label: 'Cliques',  value: activeChart.clicks || 0,                          color: '#1d8fff' },
            { label: 'Result.',  value: getResults(activeChart) || 0,                     color: '#f59e0b' },
            { label: 'Impr./k',  value: (activeChart.impressions || 0) / 1000,            color: '#8b5cf6' },
          ]}
          onClose={() => setActiveChart(null)}
        />
      )}
      {selectedAd && (
        <AdDetailModal
          ad={selectedAd}
          campaignName={selectedAd._campaignName || null}
          adsetName={selectedAd._adsetName || null}
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
  draftDateRange,
  setDraftDateRange,
  draftCustomSince,
  setDraftCustomSince,
  draftCustomUntil,
  setDraftCustomUntil,
  handleApplyDashboardFilters,
  DATE_PRESETS,
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
    healthKey:   latestWeeklyHealthByClientId?.get(client.id)?.healthKey || 'empty',
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
      const hk      = latestWeeklyHealthByClientId?.get(c.id)?.healthKey || 'empty'
      if (hk === 'critical' || hk === 'integration') criticalCount++
      if (hk === 'attention') attentionCount++
      const camp    = campaignMap[c.id]
      const adsR    = adsMap[c.id]
      const bal     = balanceMap[c.id]
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
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}
