'use client'
import { useState, useMemo } from 'react'

const fmt = (n, d = 2) => (typeof n === 'number' ? n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '-')
const fmtCur = (n) => (typeof n === 'number' ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-')

function HealthBadge({ healthKey, WEEKLY_HEALTH_BY_KEY }) {
  const h = WEEKLY_HEALTH_BY_KEY[healthKey]
  if (!h) return <span style={{ fontSize: '0.72rem', color: '#6b7280', background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '2px 10px' }}>Sem classificacao</span>
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: h.color, background: `${h.color}22`, border: `1px solid ${h.color}55`, borderRadius: 20, padding: '2px 10px', letterSpacing: '0.02em' }}>
      {h.label}
    </span>
  )
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px', minWidth: 0, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 18 }}>
          <i className={`bx ${icon}`}></i>
        </span>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f9fafb', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ClientDrawer({ client, clientData, onClose, WEEKLY_HEALTH_BY_KEY }) {
  const { healthKey, adsRow, campaignRow, balanceRow } = clientData
  const h = WEEKLY_HEALTH_BY_KEY[healthKey]
  const campaigns = campaignRow?.campaigns || []
  const ads = adsRow?.ads || []
  const topAds = [...ads].sort((a, b) => (b.results || 0) - (a.results || 0)).slice(0, 3)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }} />
      <div
        style={{ position: 'relative', width: '100%', maxWidth: 540, height: '90vh', background: '#111827', borderLeft: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 20, overflowY: 'auto', padding: '28px 28px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {client.logoUrl && <img src={client.logoUrl} alt={client.name} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', background: 'rgba(255,255,255,0.06)' }} />}
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f9fafb' }}>{client.name}</div>
              <HealthBadge healthKey={healthKey} WEEKLY_HEALTH_BY_KEY={WEEKLY_HEALTH_BY_KEY} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 22, cursor: 'pointer', padding: 4 }}><i className="bx bx-x"></i></button>
        </div>

        {balanceRow && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Saldo da Conta</div>
            {balanceRow.accounts?.map((acc) => (
              <div key={acc.accountId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.82rem', color: '#d1d5db' }}>{acc.name || acc.accountId}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#26c281' }}>{fmtCur(acc.balance)}</span>
              </div>
            ))}
            {!balanceRow.accounts?.length && <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Sem saldo disponivel</span>}
          </div>
        )}

        {campaigns.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Campanhas ({campaigns.length})</div>
            {campaigns.slice(0, 8).map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#e5e7eb', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ fontSize: '0.7rem', color: c.status === 'ACTIVE' ? '#22c55e' : '#6b7280' }}>{c.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f9fafb' }}>{fmtCur(c.spend)}</div>
                  {c.results != null && <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{fmt(c.results, 0)} result.</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {topAds.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Top Criativos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topAds.map((ad) => (
                <div key={ad.adId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {ad.imageUrl
                    ? <img src={ad.imageUrl} alt={ad.label} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 8, background: 'rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}><i className="bx bx-image-alt" style={{ fontSize: 22 }}></i></div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: '#e5e7eb', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.label || 'Sem titulo'}</div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{fmt(ad.impressions, 0)} impr.</span>
                      <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{fmt(ad.clicks, 0)} cliques</span>
                      {ad.results != null && <span style={{ fontSize: '0.7rem', color: '#26c281', fontWeight: 700 }}>{fmt(ad.results, 0)} result.</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f9fafb', flexShrink: 0 }}>{fmtCur(ad.spend)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {campaigns.length === 0 && topAds.length === 0 && !balanceRow && (
          <div style={{ textAlign: 'center', color: '#4b5563', padding: '40px 0' }}>
            <i className="bx bx-data" style={{ fontSize: 40, marginBottom: 8 }}></i>
            <div style={{ fontSize: '0.9rem' }}>Nenhum dado disponivel para este cliente no periodo selecionado.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function ClientCard({ client, clientData, onClick, WEEKLY_HEALTH_BY_KEY }) {
  const { healthKey, adsRow, campaignRow, balanceRow } = clientData
  const h = WEEKLY_HEALTH_BY_KEY[healthKey]
  const totalSpend = campaignRow?.totals?.spend ?? adsRow?.ads?.reduce((s, a) => s + (a.spend || 0), 0) ?? null
  const totalResults = campaignRow?.totals?.results ?? adsRow?.ads?.reduce((s, a) => s + (a.results || 0), 0) ?? null
  const totalBalance = balanceRow?.accounts?.reduce((s, a) => s + (a.balance || 0), 0) ?? null
  const activeCampaigns = campaignRow?.campaigns?.filter((c) => c.status === 'ACTIVE').length ?? 0
  const accentColor = h?.color || '#6b7280'

  return (
    <div
      onClick={onClick}
      style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${accentColor}33`, borderLeft: `3px solid ${accentColor}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'background 0.15s, transform 0.15s', display: 'flex', flexDirection: 'column', gap: 12 }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {client.logoUrl
            ? <img src={client.logoUrl} alt={client.name} style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
            : <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor, fontSize: 16, flexShrink: 0 }}><i className="bx bx-user"></i></div>
          }
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</span>
        </div>
        <HealthBadge healthKey={healthKey} WEEKLY_HEALTH_BY_KEY={WEEKLY_HEALTH_BY_KEY} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f9fafb' }}>{totalSpend != null ? fmtCur(totalSpend) : '-'}</div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Investimento</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#26c281' }}>{totalResults != null ? fmt(totalResults, 0) : '-'}</div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Resultados</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: totalBalance != null && totalBalance < 50 ? '#ef4444' : '#f9fafb' }}>{totalBalance != null ? fmtCur(totalBalance) : '-'}</div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Saldo</div>
        </div>
      </div>
      {activeCampaigns > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{activeCampaigns} campanha{activeCampaigns !== 1 ? 's' : ''} ativa{activeCampaigns !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

const HEALTH_FILTER_OPTIONS = [
  { key: 'all', label: 'Todos' },
  { key: 'critical', label: 'Critico' },
  { key: 'attention', label: 'Atencao' },
  { key: 'integration', label: 'Integracao' },
  { key: 'healthy', label: 'Saudavel' },
  { key: 'with_result', label: 'Com resultado' },
  { key: 'churn', label: 'Churn' },
]

export default function PerformanceGeneralTab({
  clients,
  latestWeeklyHealthByClientId,
  adsOverviewRows,
  adsOverviewLoading,
  campaignOverviewRows,
  campaignOverviewLoading,
  adAccountBalanceRows,
  adAccountBalanceLoading,
  WEEKLY_HEALTH_BY_KEY,
  CLIENT_HEALTH_SORT_RANK,
  dateRange,
  draftDateRange,
  handleApplyDashboardFilters,
  DATE_PRESETS,
  customSince,
  customUntil,
  draftCustomSince,
  draftCustomUntil,
  setDraftDateRange,
  setDraftCustomSince,
  setDraftCustomUntil,
}) {
  const [healthFilter, setHealthFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [drawerClient, setDrawerClient] = useState(null)

  const adsMap = useMemo(() => {
    const m = {}
    for (const row of (adsOverviewRows || [])) m[row.clientId] = row
    return m
  }, [adsOverviewRows])

  const campaignMap = useMemo(() => {
    const m = {}
    for (const row of (campaignOverviewRows || [])) m[row.clientId] = row
    return m
  }, [campaignOverviewRows])

  const balanceMap = useMemo(() => {
    const m = {}
    for (const row of (adAccountBalanceRows || [])) m[row.clientId] = row
    return m
  }, [adAccountBalanceRows])

  const sortedClients = useMemo(() => {
    const filtered = (clients || []).filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
      const healthKey = latestWeeklyHealthByClientId?.get(c.id)?.healthKey || 'empty'
      if (healthFilter !== 'all' && healthKey !== healthFilter) return false
      return true
    })
    return [...filtered].sort((a, b) => {
      const hA = latestWeeklyHealthByClientId?.get(a.id)?.healthKey || 'empty'
      const hB = latestWeeklyHealthByClientId?.get(b.id)?.healthKey || 'empty'
      const rA = CLIENT_HEALTH_SORT_RANK[hA] ?? 99
      const rB = CLIENT_HEALTH_SORT_RANK[hB] ?? 99
      return rA - rB
    })
  }, [clients, latestWeeklyHealthByClientId, healthFilter, search, CLIENT_HEALTH_SORT_RANK])

  const stats = useMemo(() => {
    let totalSpend = 0, totalResults = 0, totalBalance = 0, activeClients = 0, criticalCount = 0, attentionCount = 0
    for (const c of (clients || [])) {
      const healthKey = latestWeeklyHealthByClientId?.get(c.id)?.healthKey || 'empty'
      if (healthKey === 'critical' || healthKey === 'integration') criticalCount++
      if (healthKey === 'attention') attentionCount++
      const camp = campaignMap[c.id]
      const adsR = adsMap[c.id]
      const bal = balanceMap[c.id]
      const spend = camp?.totals?.spend ?? adsR?.ads?.reduce((s, a) => s + (a.spend || 0), 0) ?? 0
      const results = camp?.totals?.results ?? adsR?.ads?.reduce((s, a) => s + (a.results || 0), 0) ?? 0
      totalSpend += spend
      totalResults += results
      if (bal?.accounts) totalBalance += bal.accounts.reduce((s, a) => s + (a.balance || 0), 0)
      if (spend > 0) activeClients++
    }
    return { totalSpend, totalResults, totalBalance, activeClients, criticalCount, attentionCount }
  }, [clients, latestWeeklyHealthByClientId, campaignMap, adsMap, balanceMap])

  const drawerClientData = useMemo(() => {
    if (!drawerClient) return null
    return {
      healthKey: latestWeeklyHealthByClientId?.get(drawerClient.id)?.healthKey || 'empty',
      adsRow: adsMap[drawerClient.id],
      campaignRow: campaignMap[drawerClient.id],
      balanceRow: balanceMap[drawerClient.id],
    }
  }, [drawerClient, latestWeeklyHealthByClientId, adsMap, campaignMap, balanceMap])

  const isLoading = adsOverviewLoading || campaignOverviewLoading || adAccountBalanceLoading

  const currentPresetLabel = DATE_PRESETS?.find((p) => p.value === dateRange)?.label || dateRange

  return (
    <section style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#26c281', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Performance</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f9fafb', margin: 0, lineHeight: 1.1 }}>Visao Geral</h2>
          <p style={{ fontSize: '0.82rem', color: '#6b7280', margin: '8px 0 0' }}>Saude e performance consolidada de todos os clientes</p>
        </div>
        {/* Period filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={draftDateRange}
            onChange={(e) => setDraftDateRange(e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
          >
            {(DATE_PRESETS || []).map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {draftDateRange === 'custom' && (
            <>
              <input type="date" value={draftCustomSince || ''} onChange={(e) => setDraftCustomSince(e.target.value)} style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', fontSize: '0.82rem', outline: 'none' }} />
              <input type="date" value={draftCustomUntil || ''} onChange={(e) => setDraftCustomUntil(e.target.value)} style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', fontSize: '0.82rem', outline: 'none' }} />
            </>
          )}
          <button
            onClick={handleApplyDashboardFilters}
            style={{ padding: '7px 18px', borderRadius: 9, border: 'none', background: '#26c281', color: '#000', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard icon="bx-dollar-circle" label="Investimento Total" value={fmtCur(stats.totalSpend)} sub={`${stats.activeClients} clientes com gasto`} color="#26c281" />
        <StatCard icon="bx-target-lock" label="Resultados" value={fmt(stats.totalResults, 0)} sub="no periodo selecionado" color="#1d8fff" />
        <StatCard icon="bx-wallet-alt" label="Saldo Total" value={fmtCur(stats.totalBalance)} sub="somatorio das contas" color="#f59e0b" />
        <StatCard icon="bx-error-circle" label="Criticos / Atencao" value={`${stats.criticalCount} / ${stats.attentionCount}`} sub="clientes que precisam de atencao" color="#ef4444" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#e5e7eb', fontSize: '0.82rem', outline: 'none', minWidth: 200 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {HEALTH_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setHealthFilter(opt.key)}
              style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${healthFilter === opt.key ? '#26c281' : 'rgba(255,255,255,0.1)'}`, background: healthFilter === opt.key ? '#26c28122' : 'rgba(255,255,255,0.04)', color: healthFilter === opt.key ? '#26c281' : '#9ca3af', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', color: '#4b5563', marginLeft: 'auto' }}>{sortedClients.length} cliente{sortedClients.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Client list */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#4b5563' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 32, marginBottom: 8 }}></i>
          <div style={{ fontSize: '0.85rem' }}>Carregando dados...</div>
        </div>
      )}
      {!isLoading && sortedClients.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#4b5563' }}>
          <i className="bx bx-search-alt" style={{ fontSize: 36, marginBottom: 10 }}></i>
          <div style={{ fontSize: '0.9rem' }}>Nenhum cliente encontrado</div>
        </div>
      )}
      {!isLoading && sortedClients.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {sortedClients.map((client) => {
            const healthKey = latestWeeklyHealthByClientId?.get(client.id)?.healthKey || 'empty'
            return (
              <ClientCard
                key={client.id}
                client={client}
                clientData={{ healthKey, adsRow: adsMap[client.id], campaignRow: campaignMap[client.id], balanceRow: balanceMap[client.id] }}
                onClick={() => setDrawerClient(client)}
                WEEKLY_HEALTH_BY_KEY={WEEKLY_HEALTH_BY_KEY}
              />
            )
          })}
        </div>
      )}

      {/* Drawer */}
      {drawerClient && drawerClientData && (
        <ClientDrawer
          client={drawerClient}
          clientData={drawerClientData}
          onClose={() => setDrawerClient(null)}
          WEEKLY_HEALTH_BY_KEY={WEEKLY_HEALTH_BY_KEY}
        />
      )}
    </section>
  )
}
