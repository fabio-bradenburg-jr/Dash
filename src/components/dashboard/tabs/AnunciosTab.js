'use client'

import { useDashboard } from '@/components/dashboard/DashboardContext'

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

  return (
    <section className="ads-overview-page">
      <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <span className="management-hero-kicker"><i className="bx bx-image-alt" style={{ marginRight: 5 }}></i>Criativos em veiculação</span>
          <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Top 5 anúncios por cliente</h2>
          <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Anúncios com investimento dentro do período selecionado, ordenados pela saúde da carteira para priorizar leitura.</p>
        </div>
        <div className="ads-overview-hero-actions">
          {draftDateRange === 'custom' && (
            <div className="date-picker glass-item custom-range ads-overview-custom-range">
              <input type="date" value={draftCustomSince} onChange={(event) => setDraftCustomSince(event.target.value)} />
              <span>Até</span>
              <input type="date" value={draftCustomUntil} onChange={(event) => setDraftCustomUntil(event.target.value)} />
            </div>
          )}
          <label className="ads-overview-period">
            <i className="bx bx-calendar"></i>
            <select value={draftDateRange} onChange={(event) => setDraftDateRange(event.target.value)}>
              {DATE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleApplyDashboardFilters}
            disabled={isApplyDashboardFiltersDisabled}
            className="btn btn-secondary"
          >
            <i className="bx bx-filter-alt"></i>
            Aplicar período
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAdsOverviewRefreshNonce((current) => current + 1)}
            disabled={adsOverviewLoading}
          >
            <i className={'bx ' + (adsOverviewLoading ? 'bx-loader-alt bx-spin' : 'bx-refresh')}></i>
            {adsOverviewLoading ? 'Atualizando' : 'Atualizar anúncios'}
          </button>
        </div>
      </div>

      {adsOverviewError && (
        <div className="api-error-banner" role="status">
          <i className="bx bx-error-circle"></i>
          <span>{adsOverviewError}</span>
        </div>
      )}

      <section className="glass-panel ads-overview-board">
        <div className="ads-overview-toolbar">
          <div className="client-registry-search ads-overview-search">
            <i className="bx bx-search"></i>
            <input
              type="text"
              value={adsOverviewSearch}
              onChange={(event) => setAdsOverviewSearch(event.target.value)}
              placeholder="Buscar cliente, gestor ou anúncio..."
            />
          </div>
          <label className="date-picker glass-item compact-filter">
            <i className="bx bx-user-check"></i>
            <select value={adsOverviewManagerFilter} onChange={(event) => setAdsOverviewManagerFilter(event.target.value)}>
              <option value="all">Todos os gestores</option>
              <option value="__none__">Sem gestor definido</option>
              {operationAssignableUsers.map((managedUser) => (
                <option key={`ads-manager-${managedUser.id}`} value={managedUser.id}>
                  {managedUser.full_name || managedUser.email || 'Usuário'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="ads-overview-status-row">
          <span>{formatNumber(filteredAdsOverviewRows.length)} cliente(s) exibido(s)</span>
          {adsOverviewUpdatedAt && (
            <span>Atualizado em {formatClientDateTime(adsOverviewUpdatedAt)}</span>
          )}
        </div>

        {adsOverviewLoading && !adsOverviewRows.length ? (
          <div className="ranking-empty ads-overview-empty">
            <i className="bx bx-loader-alt bx-spin"></i>
            Carregando top anúncios dos clientes ativos...
          </div>
        ) : filteredAdsOverviewRows.length ? (
          <div className="ads-overview-client-list">
            {filteredAdsOverviewRows.map((row) => {
              const latestHealthRecord = latestWeeklyHealthByClientId.get(row.clientId)
              const healthConfig = latestHealthRecord
                ? (WEEKLY_HEALTH_BY_KEY[latestHealthRecord.healthStatus] || WEEKLY_HEALTH_BY_KEY.attention)
                : null
              const ads = Array.isArray(row.ads) ? row.ads : []
              const isExpanded = adsOverviewExpandedClientIds.includes(row.clientId)
              const healthDetail = latestHealthRecord
                ? `Input semanal: ${formatWeekRangeLabel(latestHealthRecord.weekStart, latestHealthRecord.weekEnd)}`
                : 'Sem input semanal preenchido'

              return (
                <article key={`ads-client-${row.clientId}`} className={'ads-overview-client-card glass-item ' + (isExpanded ? 'expanded' : '')}>
                  <button type="button" className="ads-overview-client-head ads-overview-client-toggle" onClick={() => handleToggleAdsOverviewClient(row.clientId)} aria-expanded={isExpanded}>
                    <div className="ads-overview-client-identity">
                      <span className="ads-overview-client-logo">
                        {row.clientLogoUrl ? <img src={row.clientLogoUrl} alt={`Logo ${row.clientName}`} /> : <i className="bx bx-building-house"></i>}
                      </span>
                      <div>
                        <strong>{row.clientName}</strong>
                        <small>{row.resultManagerName || 'Sem gestor de resultado'} • {formatNumber(ads.length)} criativo(s)</small>
                      </div>
                    </div>
                    <div className="ads-overview-client-meta">
                      <span className={'simple-client-health compact ' + (healthConfig ? 'active ' + healthConfig.key : 'empty')} style={healthConfig ? { '--client-health-color': healthConfig.color } : undefined}>
                        <b>{healthConfig?.label || 'Sem saúde'}</b>
                        <small>{healthDetail}</small>
                      </span>
                      <span className="ads-overview-account">act_{row.metaAdAccountId}</span>
                      <span className="ads-overview-expand-button">
                        <i className={'bx ' + (isExpanded ? 'bx-chevron-up' : 'bx-chevron-down')}></i>
                      </span>
                    </div>
                  </button>

                  {isExpanded ? (
                    row.error ? (
                      <div className="api-error-banner ads-overview-client-error" role="status">
                        <i className="bx bx-error-circle"></i>
                        <span>{row.error}</span>
                      </div>
                    ) : ads.length ? (
                      <div className="ads-overview-ad-list">
                        {ads.map((ad, index) => {
                          const resultValue = getMetaBreakdownResultValue(ad, activeMetaRankingResultConfig?.resultMetricKey)
                          const averageCost = getMetaBreakdownAverageCost(ad, activeMetaRankingResultConfig?.resultMetricKey)

                          return (
                            <button
                              key={`${row.clientId}-${ad.adId || index}`}
                              type="button"
                              className="ads-overview-ad-row"
                              onClick={() => setAdsOverviewPreviewItem({
                                ...ad,
                                adAccountId: row.metaAdAccountId,
                                clientName: row.clientName,
                                resultLabel: activeMetaRankingResultConfig?.resultLabel || 'Resultados',
                                resultMetricKey: activeMetaRankingResultConfig?.resultMetricKey || 'totalConversions',
                              })}
                            >
                              <span className="ads-overview-ad-rank">#{index + 1}</span>
                              <span className="ads-overview-ad-thumb">
                                {ad.imageUrl ? <><img src={ad.imageUrl} alt={ad.label} loading="lazy" onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex' }} /><i className="bx bx-image-alt" style={{ display:'none' }}></i></> : <i className="bx bx-image-alt"></i>}
                              </span>
                              <span className="ads-overview-ad-copy">
                                <strong>{ad.label}</strong>
                                <small>{formatNumber(ad.impressions || 0)} impressões • {formatNumber(ad.clicks || 0)} cliques</small>
                              </span>
                              <span className="ads-overview-ad-metric">
                                <small>{activeMetaRankingResultConfig?.resultLabel || 'Resultados'}</small>
                                <strong>{formatNumber(resultValue)}</strong>
                              </span>
                              <span className="ads-overview-ad-metric">
                                <small>Custo</small>
                                <strong>{averageCost > 0 ? formatCurrency(averageCost) : '-'}</strong>
                              </span>
                              <span className="ads-overview-ad-metric">
                                <small>Investimento</small>
                                <strong>{formatCurrency(ad.spend || 0)}</strong>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="ads-overview-no-ads">
                        <i className="bx bx-low-vision"></i>
                        <span>Sem anúncios com investimento no período selecionado.</span>
                      </div>
                    )
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : (
          <div className="ranking-empty ads-overview-empty">
            Nenhum cliente encontrado para os filtros selecionados.
          </div>
        )}
      </section>
    </section>
  )
}
