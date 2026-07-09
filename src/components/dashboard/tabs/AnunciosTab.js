'use client'

import { useDashboard } from '@/components/dashboard/DashboardContext'

/* Kinetic Emerald palette (Anúncios design) */
const C = {
  accent: '#26C281', onAccent: '#003821',
  text: '#E5E2E1', text2: 'rgba(232,230,228,0.66)', text3: 'rgba(232,230,228,0.42)',
  glass: 'rgba(28,28,28,0.4)', border: 'rgba(255,255,255,0.05)', border2: 'rgba(255,255,255,0.1)',
  field: 'rgba(255,255,255,0.04)', ok: '#22c55e', warn: '#f59e0b', err: '#ef4444',
}
const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
const AVATAR_POOL = ['linear-gradient(135deg,#26C281,#4fdf9b)', 'linear-gradient(135deg,#3ba3ff,#6366f1)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#8b5cf6,#3ba3ff)', 'linear-gradient(135deg,#22c55e,#26C281)', 'linear-gradient(135deg,#ec4899,#8b5cf6)']
const initialsOf = (name) => { const p = String(name || '').trim().split(/\s+/); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?' }
const hashIdx = (name) => { let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % AVATAR_POOL.length }
const RANK_COLORS = ['#4fdf9b', '#26C281', '#22c55e', 'rgba(232,230,228,0.66)', 'rgba(232,230,228,0.42)']

export default function AnunciosTab() {
  const {
    formatNumber,
    formatCurrency,
    formatClientDateTime,
    formatWeekRangeLabel,
    getMetaBreakdownResultValue,
    getMetaBreakdownAverageCost,
    DATE_PRESETS,
    WEEKLY_HEALTH_BY_KEY,
    draftDateRange,
    setDraftDateRange,
    draftCustomSince,
    setDraftCustomSince,
    draftCustomUntil,
    setDraftCustomUntil,
    handleApplyDashboardFilters,
    isApplyDashboardFiltersDisabled,
    adsOverviewError,
    adsOverviewLoading,
    adsOverviewRows,
    adsOverviewSearch,
    setAdsOverviewSearch,
    adsOverviewManagerFilter,
    setAdsOverviewManagerFilter,
    adsOverviewUpdatedAt,
    adsOverviewExpandedClientIds,
    setAdsOverviewRefreshNonce,
    setAdsOverviewPreviewItem,
    filteredAdsOverviewRows,
    handleToggleAdsOverviewClient,
    activeMetaRankingResultConfig,
    operationAssignableUsers,
    latestWeeklyHealthByClientId,
  } = useDashboard()

  const dateInputStyle = { height: 38, padding: '0 11px', borderRadius: 99, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', width: '100%', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderBottom: '2px solid rgba(38,194,129,0.24)', borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.08),rgba(38,194,129,0.01))', padding: '24px 26px' }}>
        <div style={{ position: 'absolute', top: -70, right: -40, width: 260, height: 260, borderRadius: 99, background: 'radial-gradient(circle,rgba(38,194,129,0.16),transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, fontWeight: 700, marginBottom: 9 }}><i className="bx bx-image-alt" style={{ fontSize: 15 }}></i>Criativos em veiculação</div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.6vw,1.9rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Top 5 anúncios por cliente</h1>
            <p style={{ margin: '9px 0 0', color: C.text2, fontSize: '0.9rem', maxWidth: '60ch', lineHeight: 1.5 }}>Anúncios com investimento no período, ordenados pela saúde da carteira para priorizar leitura.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select value={draftDateRange} onChange={(event) => setDraftDateRange(event.target.value)} style={{ height: 38, padding: '0 32px 0 14px', borderRadius: 99, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, outline: 'none', appearance: 'none', cursor: 'pointer' }}>
                {DATE_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value} style={{ color: '#000' }}>{preset.label}</option>
                ))}
              </select>
              <i className="bx bx-chevron-down" style={{ position: 'absolute', right: 11, fontSize: 18, color: C.text3, pointerEvents: 'none' }}></i>
            </div>
            {draftDateRange === 'custom' && (
              <>
                <input type="date" value={draftCustomSince} onChange={(event) => setDraftCustomSince(event.target.value)} style={dateInputStyle} />
                <input type="date" value={draftCustomUntil} onChange={(event) => setDraftCustomUntil(event.target.value)} style={dateInputStyle} />
              </>
            )}
            <button
              type="button"
              onClick={handleApplyDashboardFilters}
              disabled={isApplyDashboardFiltersDisabled}
              style={{ height: 38, padding: '0 14px', borderRadius: 99, border: `1px solid ${C.border2}`, background: C.field, color: C.text, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem', cursor: isApplyDashboardFiltersDisabled ? 'not-allowed' : 'pointer', opacity: isApplyDashboardFiltersDisabled ? 0.55 : 1 }}
            >
              Aplicar período
            </button>
            <button
              type="button"
              onClick={() => setAdsOverviewRefreshNonce((current) => current + 1)}
              disabled={adsOverviewLoading}
              style={{ height: 38, padding: '0 16px', borderRadius: 99, border: 'none', background: C.accent, color: C.onAccent, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', cursor: adsOverviewLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 22px rgba(38,194,129,0.28)', opacity: adsOverviewLoading ? 0.75 : 1 }}
            >
              <i className={'bx ' + (adsOverviewLoading ? 'bx-loader-alt bx-spin' : 'bx-refresh')} style={{ fontSize: 16 }}></i>
              {adsOverviewLoading ? 'Atualizando' : 'Atualizar anúncios'}
            </button>
          </div>
        </div>
      </div>

      {adsOverviewError && (
        <div role="status" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', borderRadius: 12, background: hexA(C.err, 0.08), border: `1px solid ${hexA(C.err, 0.25)}`, color: C.text, fontSize: '0.85rem' }}>
          <i className="bx bx-error-circle" style={{ fontSize: 18, color: C.err }}></i>
          <span>{adsOverviewError}</span>
        </div>
      )}

      {/* ── BOARD ── */}
      <div style={{ marginTop: 18, border: `1px solid ${C.border}`, borderRadius: 16, background: C.glass, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        {/* toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 13, fontSize: 17, color: C.text3, pointerEvents: 'none' }}></i>
            <input
              type="text"
              value={adsOverviewSearch}
              onChange={(event) => setAdsOverviewSearch(event.target.value)}
              placeholder="Buscar cliente, gestor ou anúncio…"
              style={{ width: '100%', height: 40, padding: '0 14px 0 40px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select value={adsOverviewManagerFilter} onChange={(event) => setAdsOverviewManagerFilter(event.target.value)} style={{ height: 40, padding: '0 32px 0 13px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.field, color: C.text2, fontFamily: 'Inter', fontSize: '0.8rem', outline: 'none', appearance: 'none', cursor: 'pointer' }}>
              <option value="all" style={{ color: '#000' }}>Todos os gestores</option>
              <option value="__none__" style={{ color: '#000' }}>Sem gestor definido</option>
              {operationAssignableUsers.map((managedUser) => (
                <option key={`ads-manager-${managedUser.id}`} value={managedUser.id} style={{ color: '#000' }}>
                  {managedUser.full_name || managedUser.email || 'Usuário'}
                </option>
              ))}
            </select>
            <i className="bx bx-chevron-down" style={{ position: 'absolute', right: 10, fontSize: 18, color: C.text3, pointerEvents: 'none' }}></i>
          </div>
        </div>
        {/* status row */}
        <div style={{ padding: '9px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontFamily: 'Inter', fontSize: '0.7rem', color: C.text3 }}>
          <span>{formatNumber(filteredAdsOverviewRows.length)} cliente(s) exibido(s)</span>
          {adsOverviewUpdatedAt && <span>Atualizado em {formatClientDateTime(adsOverviewUpdatedAt)}</span>}
        </div>

        {adsOverviewLoading && !adsOverviewRows.length ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', color: C.text2 }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 34, color: C.accent, display: 'inline-block' }}></i>
            <div style={{ marginTop: 14, fontSize: '0.9rem' }}>Carregando top anúncios dos clientes ativos…</div>
          </div>
        ) : !filteredAdsOverviewRows.length ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: C.text2 }}>
            <i className="bx bx-search-alt" style={{ fontSize: 34, color: C.text3 }}></i>
            <div style={{ marginTop: 12, fontWeight: 600 }}>Nenhum cliente encontrado</div>
            <div style={{ fontFamily: 'Inter', fontSize: '0.8rem', color: C.text3, marginTop: 4 }}>Ajuste a busca ou o filtro de gestor.</div>
          </div>
        ) : (
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredAdsOverviewRows.map((row) => {
              const latestHealthRecord = latestWeeklyHealthByClientId.get(row.clientId)
              const healthConfig = latestHealthRecord
                ? (WEEKLY_HEALTH_BY_KEY[latestHealthRecord.healthStatus] || WEEKLY_HEALTH_BY_KEY.attention)
                : null
              const healthColor = healthConfig?.color || '#64748b'
              const healthLabel = healthConfig?.label || 'Sem saúde'
              const ads = Array.isArray(row.ads) ? row.ads : []
              const isExpanded = adsOverviewExpandedClientIds.includes(row.clientId)
              const healthDetail = latestHealthRecord
                ? `Input semanal: ${formatWeekRangeLabel(latestHealthRecord.weekStart, latestHealthRecord.weekEnd)}`
                : 'Sem input semanal'
              const isCritical = latestHealthRecord?.healthStatus === 'critical'

              return (
                <div key={`ads-client-${row.clientId}`} style={{ border: `1px solid ${isCritical ? hexA(C.err, 0.22) : C.border}`, borderRadius: 14, background: 'rgba(255,255,255,0.015)', overflow: 'hidden' }}>
                  {/* header */}
                  <div
                    onClick={() => handleToggleAdsOverviewClient(row.clientId)}
                    role="button"
                    aria-expanded={isExpanded}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', flexWrap: 'wrap' }}
                  >
                    <i className={'bx ' + (isExpanded ? 'bx-chevron-down' : 'bx-chevron-right')} style={{ fontSize: 20, color: C.text3, flex: 'none' }}></i>
                    <span style={{ width: 38, height: 38, borderRadius: 10, background: AVATAR_POOL[hashIdx(row.clientName)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.76rem', color: '#fff', flex: 'none', overflow: 'hidden' }}>
                      {row.clientLogoUrl ? <img src={row.clientLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialsOf(row.clientName)}
                    </span>
                    <div style={{ minWidth: 130 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{row.clientName}</div>
                      <div style={{ fontFamily: 'Inter', fontSize: '0.64rem', color: C.text3, marginTop: 1 }}>{(row.resultManagerName || 'Sem gestor')} • {formatNumber(ads.length)} criativo{ads.length === 1 ? '' : 's'}</div>
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Inter', fontSize: '0.64rem', color: C.text3, background: C.field, padding: '5px 10px', borderRadius: 99 }}>act_{row.metaAdAccountId}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 12, background: hexA(healthColor, 0.1), border: `1px solid ${hexA(healthColor, 0.25)}`, color: healthColor }}>
                        <span style={{ width: 8, height: 8, borderRadius: 99, background: healthColor, boxShadow: `0 0 8px ${healthColor}` }} />
                        <span>
                          <span style={{ display: 'block', fontWeight: 700, fontSize: '0.78rem' }}>{healthLabel}</span>
                          <span style={{ fontFamily: 'Inter', fontSize: '0.56rem', color: C.text3 }}>{healthDetail}</span>
                        </span>
                      </span>
                    </div>
                  </div>
                  {/* ads */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${C.border}` }}>
                      {row.error ? (
                        <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', color: C.err, fontSize: '0.84rem' }}>
                          <i className="bx bx-error-circle" style={{ fontSize: 18 }}></i>
                          <span>{row.error}</span>
                        </div>
                      ) : ads.length ? (
                        ads.map((ad, index) => {
                          const resultValue = getMetaBreakdownResultValue(ad, activeMetaRankingResultConfig?.resultMetricKey)
                          const averageCost = getMetaBreakdownAverageCost(ad, activeMetaRankingResultConfig?.resultMetricKey)
                          return (
                            <div
                              key={`${row.clientId}-${ad.adId || index}`}
                              role="button"
                              onClick={() => setAdsOverviewPreviewItem({
                                ...ad,
                                adAccountId: row.metaAdAccountId,
                                clientName: row.clientName,
                                resultLabel: activeMetaRankingResultConfig?.resultLabel || 'Resultados',
                                resultMetricKey: activeMetaRankingResultConfig?.resultMetricKey || 'totalConversions',
                              })}
                              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                            >
                              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: RANK_COLORS[index] || C.text3, width: 26, flex: 'none' }}>#{index + 1}</span>
                              <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flex: 'none', background: C.field, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                {ad.imageUrl
                                  ? <><img src={ad.imageUrl} alt={ad.label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex' }} /><i className="bx bx-image-alt" style={{ display: 'none', fontSize: 24, color: C.text3 }}></i></>
                                  : <i className="bx bx-image-alt" style={{ fontSize: 24, color: C.text3 }}></i>}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.label}</div>
                                <div style={{ fontFamily: 'Inter', fontSize: '0.66rem', color: C.text3, marginTop: 2 }}>{formatNumber(ad.impressions || 0)} impressões • {formatNumber(ad.clicks || 0)} cliques</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <div style={{ textAlign: 'right', minWidth: 56 }}>
                                  <div style={{ fontFamily: 'Inter', fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text3 }}>{activeMetaRankingResultConfig?.resultLabel || 'Resultados'}</div>
                                  <div style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '0.86rem', fontVariantNumeric: 'tabular-nums' }}>{formatNumber(resultValue)}</div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 66 }}>
                                  <div style={{ fontFamily: 'Inter', fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text3 }}>Custo</div>
                                  <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.84rem', fontVariantNumeric: 'tabular-nums', color: C.text2 }}>{averageCost > 0 ? formatCurrency(averageCost) : '—'}</div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 70 }}>
                                  <div style={{ fontFamily: 'Inter', fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: C.text3 }}>Investimento</div>
                                  <div style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '0.84rem', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(ad.spend || 0)}</div>
                                </div>
                                <i className="bx bx-chevron-right" style={{ fontSize: 19, color: C.text3, flex: 'none' }}></i>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ padding: '34px 20px', textAlign: 'center', fontFamily: 'Inter', fontSize: '0.82rem', color: C.text3 }}>
                          <i className="bx bx-image" style={{ fontSize: 26, display: 'block', marginBottom: 8 }}></i>
                          Sem anúncios com investimento no período selecionado.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
