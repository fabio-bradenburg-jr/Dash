'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

const PLATFORMS = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'LinkedIn Ads', 'Outro']
const RESULT_TYPES = ['Leads', 'Conversas', 'Compras', 'Cliques', 'Agendamentos', 'Outro']

// ---- Formatters ----
function fmtCurrency(n) {
  if (n == null || n === '' || isNaN(n)) return '—'
  return Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtN(n) {
  if (n == null || n === '' || isNaN(n) || Number(n) === 0) return '—'
  return Number(n).toLocaleString('pt-BR')
}
function fmtPct(n) {
  if (n == null || n === '' || isNaN(n)) return '—'
  return Number(n).toFixed(2).replace('.', ',') + '%'
}
function fmtDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}
function fmtDatetime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function computeCampaign(c) {
  const inv = Number(c.investment) || 0
  const res = Number(c.result) || 0
  const imp = Number(c.impressions) || 0
  const clk = Number(c.clicks) || 0
  const reach = Number(c.reach) || 0
  return {
    cpr: res > 0 ? inv / res : null,
    ctr: imp > 0 && clk > 0 ? (clk / imp) * 100 : (c.ctr ? Number(c.ctr) : null),
    frequency: imp > 0 && reach > 0 ? imp / reach : null,
  }
}

function computeTotals(campaigns) {
  const inv = campaigns.reduce((s, c) => s + (Number(c.investment) || 0), 0)
  const res = campaigns.reduce((s, c) => s + (Number(c.result) || 0), 0)
  const reach = campaigns.reduce((s, c) => s + (Number(c.reach) || 0), 0)
  const imp = campaigns.reduce((s, c) => s + (Number(c.impressions) || 0), 0)
  const clk = campaigns.reduce((s, c) => s + (Number(c.clicks) || 0), 0)
  return {
    investment: inv,
    results: res,
    reach,
    impressions: imp,
    clicks: clk,
    cpr: res > 0 ? inv / res : null,
    ctr: imp > 0 && clk > 0 ? (clk / imp) * 100 : null,
  }
}

function newCampaign() {
  return {
    _id: Math.random().toString(36).slice(2),
    campaign_name: '',
    platform: 'Meta Ads',
    investment: '',
    result: '',
    result_type: 'Leads',
    reach: '',
    impressions: '',
    clicks: '',
  }
}

// ---- Styles ----
const S = {
  input: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0',
    borderRadius: 7,
    padding: '8px 11px',
    fontSize: '0.85rem',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 5,
    display: 'block',
  },
}

// ---- KPI Card ----
function KpiCard({ label, value, color = '#26c281', icon }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderTop: `3px solid ${color}`,
      borderRadius: 12,
      padding: '16px 20px',
    }}>
      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        {icon && <i className={`bx ${icon}`} style={{ fontSize: 12 }} />}{label}
      </div>
      <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
    </div>
  )
}

// ---- Report Preview ----
function ReportPreview({ report, campaigns }) {
  const totals = computeTotals(campaigns)
  const period = report.start_date && report.end_date
    ? `${fmtDate(report.start_date)} a ${fmtDate(report.end_date)}`
    : report.start_date ? `A partir de ${fmtDate(report.start_date)}` : ''

  const kpis = [
    { label: 'Investimento Total', value: fmtCurrency(totals.investment), color: '#26c281', icon: 'bx-dollar' },
    { label: 'Resultado Total', value: fmtN(totals.results) !== '—' ? fmtN(totals.results) : '0', color: '#3b82f6', icon: 'bx-target-lock' },
    { label: 'Custo por Resultado', value: totals.cpr ? fmtCurrency(totals.cpr) : '—', color: '#f59e0b', icon: 'bx-trending-down' },
    totals.reach > 0 && { label: 'Alcance Total', value: fmtN(totals.reach), color: '#8b5cf6', icon: 'bx-show' },
    totals.impressions > 0 && { label: 'Impressões', value: fmtN(totals.impressions), color: '#ec4899', icon: 'bx-eye' },
    totals.clicks > 0 && { label: 'Cliques', value: fmtN(totals.clicks), color: '#14b8a6', icon: 'bx-pointer' },
    totals.ctr && { label: 'CTR Médio', value: fmtPct(totals.ctr), color: '#f97316', icon: 'bx-mouse-alt' },
    (Number(report.total_revenue) > 0) && { label: 'Faturamento', value: fmtCurrency(report.total_revenue), color: '#22c55e', icon: 'bx-money' },
    (Number(report.vendas) > 0) && { label: 'Vendas', value: fmtN(report.vendas), color: '#22c55e', icon: 'bx-shopping-bag' },
  ].filter(Boolean)

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: '0.7rem', background: 'rgba(38,194,129,0.15)', color: '#26c281', border: '1px solid rgba(38,194,129,0.3)', padding: '3px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.06em' }}>
            📄 RELATÓRIO MANUAL
          </span>
        </div>
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#f1f5f9' }}>{report.title}</h2>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>
          {report.client_name}{period && ` · ${period}`}
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Campaigns table */}
      {campaigns.length > 0 && (
        <div style={{ padding: '0 28px 20px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Campanhas
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Campanha', 'Plataforma', 'Investimento', 'Resultado', 'CPR', 'Alcance', 'Impressões', 'Cliques', 'CTR', 'Frequência'].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const cc = computeCampaign(c)
                  return (
                    <tr key={c._id || c.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 500, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.campaign_name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        <span style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 8, fontSize: '0.75rem' }}>{c.platform}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#26c281', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtCurrency(c.investment)}</td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#e2e8f0' }}>{fmtN(c.result)}</span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: 5 }}>{c.result_type}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#f59e0b', whiteSpace: 'nowrap' }}>{cc.cpr ? fmtCurrency(cc.cpr) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{c.reach ? fmtN(c.reach) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{c.impressions ? fmtN(c.impressions) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{c.clicks ? fmtN(c.clicks) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{cc.ctr ? fmtPct(cc.ctr) : '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{cc.frequency ? cc.frequency.toFixed(2).replace('.', ',') : '—'}</td>
                    </tr>
                  )
                })}
                <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)', background: 'rgba(38,194,129,0.04)' }}>
                  <td style={{ padding: '10px 12px', color: '#f1f5f9', fontWeight: 700 }} colSpan={2}>Total</td>
                  <td style={{ padding: '10px 12px', color: '#26c281', fontWeight: 700 }}>{fmtCurrency(totals.investment)}</td>
                  <td style={{ padding: '10px 12px', color: '#f1f5f9', fontWeight: 700 }}>{totals.results > 0 ? fmtN(totals.results) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: 700 }}>{totals.cpr ? fmtCurrency(totals.cpr) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 700 }}>{totals.reach > 0 ? fmtN(totals.reach) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 700 }}>{totals.impressions > 0 ? fmtN(totals.impressions) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 700 }}>{totals.clicks > 0 ? fmtN(totals.clicks) : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 700 }}>{totals.ctr ? fmtPct(totals.ctr) : '—'}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales section */}
      {(Number(report.vendas) > 0 || Number(report.total_revenue) > 0) && (
        <div style={{ padding: '0 28px 20px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Vendas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {Number(report.vendas) > 0 && <KpiCard label="Vendas" value={fmtN(report.vendas)} color="#22c55e" icon="bx-shopping-bag" />}
            {Number(report.total_revenue) > 0 && <KpiCard label="Faturamento" value={fmtCurrency(report.total_revenue)} color="#22c55e" icon="bx-money" />}
            {Number(report.vendas) > 0 && Number(report.total_revenue) > 0 && (
              <KpiCard
                label="Ticket Médio"
                value={fmtCurrency(Number(report.ticket_medio) || Number(report.total_revenue) / Number(report.vendas))}
                color="#22c55e"
                icon="bx-receipt"
              />
            )}
          </div>
        </div>
      )}

      {/* Observations */}
      {report.observacoes && (
        <div style={{ padding: '0 28px 24px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Observações</div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 16px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {report.observacoes}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '14px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#26c281', flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: '#475569' }}>
          Assessoria LP · Relatório Manual
          {report.created_by_name ? ` · Criado por ${report.created_by_name}` : ''}
          {report.created_at ? ` · ${fmtDatetime(report.created_at)}` : ''}
        </span>
      </div>
    </div>
  )
}

// ---- Campaign Row in form ----
function CampaignRow({ campaign, onChange, onRemove, index, isOnly }) {
  const c = campaign
  const cc = computeCampaign(c)

  function f(field) {
    return (e) => onChange({ ...c, [field]: e.target.value })
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>Campanha {index + 1}</span>
        {!isOnly && (
          <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, padding: 2 }}>
            <i className="bx bx-trash" />
          </button>
        )}
      </div>

      {/* Row 1: name + platform */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={S.label}>Nome da Campanha *</label>
          <input style={S.input} value={c.campaign_name} onChange={f('campaign_name')} placeholder="Ex: Campanha Leads - Maio" />
        </div>
        <div>
          <label style={S.label}>Plataforma</label>
          <select style={S.input} value={c.platform} onChange={f('platform')}>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Row 2: investment + result + result_type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={S.label}>Investimento (R$) *</label>
          <input type="number" style={S.input} value={c.investment} onChange={f('investment')} placeholder="0,00" min={0} step="0.01" />
        </div>
        <div>
          <label style={S.label}>Resultado *</label>
          <input type="number" style={S.input} value={c.result} onChange={f('result')} placeholder="0" min={0} />
        </div>
        <div>
          <label style={S.label}>Tipo de Resultado</label>
          <select style={S.input} value={c.result_type} onChange={f('result_type')}>
            {RESULT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3: reach + impressions + clicks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={S.label}>Alcance</label>
          <input type="number" style={S.input} value={c.reach} onChange={f('reach')} placeholder="Opcional" min={0} />
        </div>
        <div>
          <label style={S.label}>Impressões</label>
          <input type="number" style={S.input} value={c.impressions} onChange={f('impressions')} placeholder="Opcional" min={0} />
        </div>
        <div>
          <label style={S.label}>Cliques</label>
          <input type="number" style={S.input} value={c.clicks} onChange={f('clicks')} placeholder="Opcional" min={0} />
        </div>
      </div>

      {/* Auto-computed metrics */}
      {(cc.cpr !== null || cc.ctr !== null || cc.frequency !== null) && (
        <div style={{ display: 'flex', gap: 16, padding: '10px 12px', background: 'rgba(38,194,129,0.05)', borderRadius: 7, fontSize: '0.8rem' }}>
          {cc.cpr !== null && (
            <span style={{ color: '#64748b' }}>CPR: <strong style={{ color: '#f59e0b' }}>{fmtCurrency(cc.cpr)}</strong></span>
          )}
          {cc.ctr !== null && (
            <span style={{ color: '#64748b' }}>CTR: <strong style={{ color: '#94a3b8' }}>{fmtPct(cc.ctr)}</strong></span>
          )}
          {cc.frequency !== null && (
            <span style={{ color: '#64748b' }}>Frequência: <strong style={{ color: '#94a3b8' }}>{cc.frequency.toFixed(2).replace('.', ',')}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Report Form Modal ----
function ReportFormModal({ initial, clients, onSave, onCancel, saving }) {
  const [step, setStep] = useState(1)
  const [info, setInfo] = useState({
    client_id: initial?.client_id || '',
    client_name: initial?.client_name || '',
    title: initial?.title || '',
    start_date: initial?.start_date || '',
    end_date: initial?.end_date || '',
  })
  const [campaigns, setCampaigns] = useState(() => {
    const existing = initial?.manual_report_campaigns
    if (existing && existing.length > 0) {
      return existing.map(c => ({ ...c, _id: c.id || Math.random().toString(36).slice(2) }))
    }
    return [newCampaign()]
  })
  const [salesData, setSalesData] = useState({
    vendas: initial?.vendas || '',
    total_revenue: initial?.total_revenue || '',
    ticket_medio: initial?.ticket_medio || '',
    observacoes: initial?.observacoes || '',
  })

  const totals = computeTotals(campaigns)

  function selectClient(id) {
    const client = clients.find(c => c.id === id)
    setInfo(prev => ({ ...prev, client_id: id, client_name: client?.name || '' }))
  }

  function addCampaign() {
    setCampaigns(prev => [...prev, newCampaign()])
  }

  function updateCampaign(idx, updated) {
    setCampaigns(prev => prev.map((c, i) => i === idx ? updated : c))
  }

  function removeCampaign(idx) {
    setCampaigns(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit() {
    onSave({
      ...info,
      campaigns,
      vendas: salesData.vendas ? Number(salesData.vendas) : 0,
      total_revenue: salesData.total_revenue ? Number(salesData.total_revenue) : 0,
      ticket_medio: salesData.ticket_medio ? Number(salesData.ticket_medio) : 0,
      observacoes: salesData.observacoes || null,
    })
  }

  const step1Valid = info.title.trim().length > 0
  const step2Valid = campaigns.every(c => c.campaign_name.trim())

  const STEPS = [
    { n: 1, label: 'Informações' },
    { n: 2, label: 'Campanhas' },
    { n: 3, label: 'Vendas & Obs.' },
  ]

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 3000 }} onClick={onCancel} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 680, maxWidth: '96vw',
        background: 'var(--bg-dark, #050506)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 3001,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 60px rgba(0,0,0,0.7)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bx bx-file" style={{ color: '#26c281' }} />
            {initial?.id ? 'Editar Relatório' : 'Novo Relatório Manual'}
          </span>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22 }}>
            <i className="bx bx-x" />
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', padding: '0 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {STEPS.map(s => (
            <button key={s.n} type="button" onClick={() => { if (s.n < step || (s.n === 2 && step1Valid) || s.n === step) setStep(s.n) }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 14px', background: 'none', border: 'none', borderBottom: step === s.n ? '2px solid #26c281' : '2px solid transparent', color: step === s.n ? '#26c281' : step > s.n ? '#94a3b8' : '#475569', cursor: 'pointer', fontSize: '0.82rem', fontWeight: step === s.n ? 700 : 500, marginBottom: -1 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: step > s.n ? '#26c281' : step === s.n ? 'rgba(38,194,129,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: step > s.n ? '#fff' : step === s.n ? '#26c281' : '#64748b' }}>
                {step > s.n ? <i className="bx bx-check" style={{ fontSize: 13 }} /> : s.n}
              </div>
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>

          {/* Step 1: Info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={S.label}>Cliente</label>
                <select style={S.input} value={info.client_id} onChange={e => selectClient(e.target.value)}>
                  <option value="">— Selecione o cliente —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Título do Relatório *</label>
                <input style={S.input} value={info.title} onChange={e => setInfo(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Meta Ads - Maio 2026" autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Data Inicial</label>
                  <input type="date" style={{ ...S.input, colorScheme: 'dark' }} value={info.start_date} onChange={e => setInfo(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Data Final</label>
                  <input type="date" style={{ ...S.input, colorScheme: 'dark' }} value={info.end_date} onChange={e => setInfo(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Campaigns */}
          {step === 2 && (
            <div>
              {campaigns.map((c, i) => (
                <CampaignRow
                  key={c._id}
                  campaign={c}
                  index={i}
                  isOnly={campaigns.length === 1}
                  onChange={updated => updateCampaign(i, updated)}
                  onRemove={() => removeCampaign(i)}
                />
              ))}
              <button type="button" onClick={addCampaign}
                style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', padding: '10px', border: '1px dashed rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', borderRadius: 9, cursor: 'pointer', fontSize: '0.83rem', marginTop: 4 }}>
                <i className="bx bx-plus" /> Adicionar Campanha
              </button>

              {/* Totals preview */}
              {campaigns.some(c => Number(c.investment) > 0) && (
                <div style={{ marginTop: 18, padding: '14px 16px', background: 'rgba(38,194,129,0.06)', border: '1px solid rgba(38,194,129,0.2)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#26c281', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Totais</div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.83rem' }}>
                    <span style={{ color: '#64748b' }}>Invest.: <strong style={{ color: '#26c281' }}>{fmtCurrency(totals.investment)}</strong></span>
                    <span style={{ color: '#64748b' }}>Resultado: <strong style={{ color: '#e2e8f0' }}>{fmtN(totals.results)}</strong></span>
                    {totals.cpr && <span style={{ color: '#64748b' }}>CPR: <strong style={{ color: '#f59e0b' }}>{fmtCurrency(totals.cpr)}</strong></span>}
                    {totals.reach > 0 && <span style={{ color: '#64748b' }}>Alcance: <strong style={{ color: '#94a3b8' }}>{fmtN(totals.reach)}</strong></span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Sales & Notes */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b' }}>Preencha os dados de vendas se houver. Todos os campos são opcionais.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={S.label}>Nº de Vendas</label>
                  <input type="number" style={S.input} value={salesData.vendas} onChange={e => setSalesData(p => ({ ...p, vendas: e.target.value }))} placeholder="0" min={0} />
                </div>
                <div>
                  <label style={S.label}>Faturamento (R$)</label>
                  <input type="number" style={S.input} value={salesData.total_revenue} onChange={e => setSalesData(p => ({ ...p, total_revenue: e.target.value }))} placeholder="0,00" min={0} step="0.01" />
                </div>
                <div>
                  <label style={S.label}>Ticket Médio (R$)</label>
                  <input type="number" style={S.input}
                    value={salesData.ticket_medio || (salesData.vendas && salesData.total_revenue ? (Number(salesData.total_revenue) / Number(salesData.vendas)).toFixed(2) : '')}
                    onChange={e => setSalesData(p => ({ ...p, ticket_medio: e.target.value }))}
                    placeholder="Auto" min={0} step="0.01" />
                </div>
              </div>
              <div>
                <label style={S.label}>Observações</label>
                <textarea
                  style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit', minHeight: 100 }}
                  value={salesData.observacoes}
                  onChange={e => setSalesData(p => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Adicione observações, contexto ou notas relevantes sobre o período..."
                  rows={4}
                />
              </div>

              {/* Preview summary */}
              <div style={{ marginTop: 8, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Resumo do Relatório</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.83rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Cliente</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{info.client_name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Período</span>
                    <span style={{ color: '#e2e8f0' }}>{info.start_date && info.end_date ? `${fmtDate(info.start_date)} a ${fmtDate(info.end_date)}` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Campanhas</span>
                    <span style={{ color: '#e2e8f0' }}>{campaigns.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Investimento Total</span>
                    <span style={{ color: '#26c281', fontWeight: 700 }}>{fmtCurrency(totals.investment)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Resultado Total</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{totals.results > 0 ? fmtN(totals.results) : '—'}</span>
                  </div>
                  {totals.cpr && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>CPR Médio</span>
                      <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmtCurrency(totals.cpr)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <button type="button" onClick={step > 1 ? () => setStep(s => s - 1) : onCancel}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 8, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}>
            {step > 1 ? <><i className="bx bx-chevron-left" /> Voltar</> : 'Cancelar'}
          </button>
          {step < 3 ? (
            <button type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !step1Valid}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#26c281', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 700, opacity: (step === 1 && !step1Valid) ? 0.5 : 1 }}>
              Próximo <i className="bx bx-chevron-right" />
            </button>
          ) : (
            <button type="button"
              onClick={handleSubmit}
              disabled={saving || !step1Valid}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#26c281', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: '0.83rem', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              <i className={`bx ${saving ? 'bx-loader-alt bx-spin' : 'bx-save'}`} />
              {saving ? 'Salvando...' : (initial?.id ? 'Salvar Alterações' : 'Criar Relatório')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ---- Preview Panel ----
function PreviewPanel({ report, onClose, onEdit }) {
  const [exporting, setExporting] = useState(false)
  const campaigns = report.manual_report_campaigns || []

  async function handleExportPDF() {
    setExporting(true)
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const el = document.getElementById('manual-report-preview-content')
      if (!el) return

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#050506',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width

      let position = 0
      let remaining = imgH
      let page = 0

      while (remaining > 0) {
        if (page > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -position, pageW, imgH)
        position += pageH
        remaining -= pageH
        page++
      }

      const filename = `${(report.client_name || 'relatorio').replace(/[^a-zA-Z0-9]/g, '-')}-manual.pdf`
      pdf.save(filename)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 3000 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 820, maxWidth: '96vw',
        background: 'var(--bg-dark, #050506)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        zIndex: 3001, display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 60px rgba(0,0,0,0.7)',
      }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="bx bx-show" style={{ color: '#26c281' }} /> Visualizar Relatório
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onEdit}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              <i className="bx bx-pencil" /> Editar
            </button>
            <button type="button" onClick={handleExportPDF} disabled={exporting}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: '#26c281', border: 'none', color: '#fff', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
              <i className={`bx ${exporting ? 'bx-loader-alt bx-spin' : 'bx-download'}`} />
              {exporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center' }}>
              <i className="bx bx-x" />
            </button>
          </div>
        </div>

        {/* Report content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div id="manual-report-preview-content">
            <ReportPreview report={report} campaigns={campaigns} />
          </div>
        </div>
      </div>
    </>
  )
}

// ---- Main Component ----
export default function ManualReportTab({ clients = [] }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editReport, setEditReport] = useState(null)
  const [previewReport, setPreviewReport] = useState(null)
  const [saving, setSaving] = useState(false)
  const [clientFilter, setClientFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (clientFilter) params.set('clientId', clientFilter)
      const res = await fetch(`/api/reports/manual?${params}`)
      const json = await res.json()
      if (json.reports) setReports(json.reports)
    } finally {
      setLoading(false)
    }
  }, [clientFilter])

  useEffect(() => { load() }, [load])

  async function handleSave(formData) {
    setSaving(true)
    try {
      const isEdit = !!editReport?.id
      const url = isEdit ? `/api/reports/manual/${editReport.id}` : '/api/reports/manual'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (json.report) {
        if (isEdit) {
          setReports(prev => prev.map(r => r.id === json.report.id ? json.report : r))
          setPreviewReport(json.report)
        } else {
          setReports(prev => [json.report, ...prev])
          setPreviewReport(json.report)
        }
        setShowForm(false)
        setEditReport(null)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(report) {
    const res = await fetch(`/api/reports/manual/${report.id}`, { method: 'DELETE' })
    if ((await res.json()).ok) {
      setReports(prev => prev.filter(r => r.id !== report.id))
      setConfirmDelete(null)
    }
  }

  function openEdit(report) {
    setEditReport(report)
    setPreviewReport(null)
    setShowForm(true)
  }

  const filtered = clientFilter ? reports.filter(r => r.client_id === clientFilter) : reports

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {clients.length > 0 && (
            <select
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              style={{ ...S.input, width: 200 }}
            >
              <option value="">Todos os clientes</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {clientFilter && (
            <button type="button" onClick={() => setClientFilter('')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bx bx-x" /> Limpar filtro
            </button>
          )}
        </div>
        <button type="button"
          onClick={() => { setEditReport(null); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#26c281', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
          <i className="bx bx-plus" /> Novo Relatório Manual
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 28 }} />
          <p style={{ marginTop: 10 }}>Carregando...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
          <i className="bx bx-file" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: '#334155' }} />
          <p style={{ margin: 0, fontWeight: 600, color: '#64748b' }}>Nenhum relatório manual criado</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.83rem' }}>Crie relatórios com dados inseridos manualmente para clientes sem integração automática.</p>
          <button type="button"
            onClick={() => { setEditReport(null); setShowForm(true) }}
            style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#26c281', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
            <i className="bx bx-plus" /> Criar primeiro relatório
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filtered.map(report => {
            const camps = report.manual_report_campaigns || []
            const totals = computeTotals(camps)
            const period = report.start_date && report.end_date
              ? `${fmtDate(report.start_date)} a ${fmtDate(report.end_date)}`
              : report.start_date ? fmtDate(report.start_date) : null

            return (
              <div key={report.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.68rem', background: 'rgba(38,194,129,0.12)', color: '#26c281', border: '1px solid rgba(38,194,129,0.25)', padding: '2px 8px', borderRadius: 12, fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0 }}>
                        Manual
                      </span>
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.title}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                      {report.client_name || '—'}{period && ` · ${period}`}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Invest.', value: fmtCurrency(totals.investment), color: '#26c281' },
                    { label: 'Resultado', value: totals.results > 0 ? fmtN(totals.results) : '—', color: '#3b82f6' },
                    { label: 'CPR', value: totals.cpr ? fmtCurrency(totals.cpr) : '—', color: '#f59e0b' },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: '0.83rem', fontWeight: 700, color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Meta info */}
                <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span><i className="bx bx-sitemap" style={{ marginRight: 3, fontSize: 11 }} />{camps.length} campanha{camps.length !== 1 ? 's' : ''}</span>
                  {report.created_by_name && <span><i className="bx bx-user" style={{ marginRight: 3, fontSize: 11 }} />{report.created_by_name}</span>}
                  <span style={{ marginLeft: 'auto' }}>{fmtDatetime(report.created_at)}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setPreviewReport(report)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', background: 'rgba(38,194,129,0.1)', border: '1px solid rgba(38,194,129,0.25)', color: '#26c281', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    <i className="bx bx-show" /> Ver Relatório
                  </button>
                  <button type="button" onClick={() => openEdit(report)}
                    style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 7, cursor: 'pointer', fontSize: 15 }}
                    title="Editar">
                    <i className="bx bx-pencil" />
                  </button>
                  {confirmDelete?.id === report.id ? (
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <button type="button" onClick={() => handleDelete(report)}
                        style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                        Excluir
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(null)}
                        style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 7, cursor: 'pointer', fontSize: '0.78rem' }}>
                        Não
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmDelete(report)}
                      style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: 7, cursor: 'pointer', fontSize: 15 }}
                      title="Excluir">
                      <i className="bx bx-trash" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <ReportFormModal
          initial={editReport}
          clients={clients}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditReport(null) }}
          saving={saving}
        />
      )}

      {/* Preview panel */}
      {previewReport && (
        <PreviewPanel
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onEdit={() => { openEdit(previewReport); setPreviewReport(null) }}
        />
      )}
    </div>
  )
}
