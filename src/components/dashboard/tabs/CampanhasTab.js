'use client'

import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function CampanhasTab() {
  const {
    isMaster,
    formatNumber,
    formatCurrency,
    formatClientDateTime,
    formatWeekRangeLabel,
    DATE_PRESETS,
    WEEKLY_HEALTH_BY_KEY,
    latestWeeklyHealthByClientId,
    draftDateRange,
    setDraftDateRange,
    draftCustomSince,
    setDraftCustomSince,
    draftCustomUntil,
    setDraftCustomUntil,
    handleApplyDashboardFilters,
    isApplyDashboardFiltersDisabled,
    campaignOverviewError,
    campaignOverviewLoading,
    campaignOverviewRows,
    campaignOverviewSearch,
    setCampaignOverviewSearch,
    campaignOverviewUpdatedAt,
    setCampaignOverviewRefreshNonce,
    campaignViewMode,
    setCampaignViewMode,
    filteredCampaignOverviewRows,
    campaignOverviewExpandedClientIds,
    campaignOverviewExpandedCampaignIds,
    campaignOverviewExpandedAdsetIds,
    handleToggleCampaignOverviewClient,
    handleToggleCampaignOverviewCampaign,
    handleToggleCampaignOverviewAdset,
    campaignChartOpenKeys,
    handleToggleCampaignChart,
    renderCampaignChart,
    cprBenchmarks,
    cprSettings,
    setDraftCprBenchmarks,
    setDraftCprSettings,
    setShowCprPanel,
    effectiveWorkspaceBranding,
  } = useDashboard()

  return (
          <section className="campaign-overview-page ads-overview-page">
            <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div>
                <span className="management-hero-kicker"><i className="bx bx-broadcast" style={{ marginRight: 5 }}></i>Mapa de mídia</span>
                <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Campanhas por cliente</h2>
                <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Clientes ordenados pela saúde do input semanal, com campanhas, conjuntos e anúncios ativos dentro do período selecionado.</p>
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
                  onClick={() => setCampaignOverviewRefreshNonce((current) => current + 1)}
                  disabled={campaignOverviewLoading}
                >
                  <i className={'bx ' + (campaignOverviewLoading ? 'bx-loader-alt bx-spin' : 'bx-refresh')}></i>
                  {campaignOverviewLoading ? 'Atualizando' : 'Atualizar campanhas'}
                </button>
                {isMaster && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setDraftCprBenchmarks({ ...cprBenchmarks })
                      setDraftCprSettings({ ...cprSettings })
                      setShowCprPanel(true)
                    }}
                  >
                    <i className="bx bx-target-lock"></i>
                    Média de CPR
                  </button>
                )}
              </div>
            </div>

            {campaignOverviewError && (
              <div className="api-error-banner" role="status">
                <i className="bx bx-error-circle"></i>
                <span>{campaignOverviewError}</span>
              </div>
            )}

            <section className="glass-panel ads-overview-board campaign-overview-board">
              <div className="ads-overview-toolbar campaign-overview-toolbar">
                <div className="client-registry-search ads-overview-search">
                  <i className="bx bx-search"></i>
                  <input
                    type="text"
                    value={campaignOverviewSearch}
                    onChange={(event) => setCampaignOverviewSearch(event.target.value)}
                    placeholder="Buscar cliente, campanha, conjunto ou anúncio..."
                  />
                </div>
                <div className="campaign-view-mode-toggle">
                  <button type="button" className={'campaign-view-btn' + (campaignViewMode === 'compact' ? ' active' : '')} onClick={() => setCampaignViewMode('compact')} title="Visualização compacta">
                    <i className="bx bx-table"></i>
                  </button>
                  <button type="button" className={'campaign-view-btn' + (campaignViewMode === 'list' ? ' active' : '')} onClick={() => setCampaignViewMode('list')} title="Visualização em lista">
                    <i className="bx bx-list-ul"></i>
                  </button>
                  <button type="button" className={'campaign-view-btn' + (campaignViewMode === 'grid' ? ' active' : '')} onClick={() => setCampaignViewMode('grid')} title="Visualização em grade">
                    <i className="bx bx-grid-alt"></i>
                  </button>
                </div>
              </div>

              <div className="ads-overview-status-row">
                <span>{formatNumber(filteredCampaignOverviewRows.length)} cliente(s) exibido(s)</span>
                {campaignOverviewUpdatedAt && (
                  <span>Atualizado em {formatClientDateTime(campaignOverviewUpdatedAt)}</span>
                )}
              </div>

              {campaignOverviewLoading && !campaignOverviewRows.length ? (
                <div className="ranking-empty ads-overview-empty">
                  <i className="bx bx-loader-alt bx-spin"></i>
                  Carregando campanhas dos clientes ativos...
                </div>
              ) : filteredCampaignOverviewRows.length ? (
                <>
                {campaignViewMode === 'compact' && (
                  <div className="campaign-compact-header">
                    <span className="campaign-compact-logo" />
                    <span className="campaign-compact-name">Cliente</span>
                    <span className="campaign-compact-cell">Investimento</span>
                    <span className="campaign-compact-cell">Resultados</span>
                    <span className="campaign-compact-cell">CPR</span>
                    <span className="campaign-compact-cell campaign-compact-meta">Meta CPR</span>
                    <span className="campaign-compact-health">Saúde</span>
                    <span style={{ width: 20 }} />
                  </div>
                )}
                <div className={`ads-overview-client-list campaign-overview-client-list campaign-view-${campaignViewMode}`}>
                  {filteredCampaignOverviewRows.map((row) => {
                    const latestHealthRecord = latestWeeklyHealthByClientId.get(row.clientId)
                    const healthConfig = latestHealthRecord
                      ? (WEEKLY_HEALTH_BY_KEY[latestHealthRecord.healthStatus] || WEEKLY_HEALTH_BY_KEY.attention)
                      : null
                    const campaigns = Array.isArray(row.campaigns) ? row.campaigns : []
                    const totals = row.totals || {}
                    const isExpanded = campaignOverviewExpandedClientIds.includes(row.clientId)
                    const clientCprBench = cprBenchmarks[row.clientId]
                    const getCprColor = (actualCpr) => {
                      if (!clientCprBench || clientCprBench <= 0 || !actualCpr || actualCpr <= 0) return null
                      const pct = ((actualCpr - clientCprBench) / clientCprBench) * 100
                      if (pct <= cprSettings.green_threshold) return '#22c55e'
                      if (pct <= cprSettings.yellow_threshold) return '#f59e0b'
                      return '#ef4444'
                    }
                    const clientActualCpr = totals.results > 0 ? (totals.spend || 0) / totals.results : null
                    const clientCprColor = getCprColor(clientActualCpr)
                    const healthDetail = latestHealthRecord
                      ? `Input semanal: ${formatWeekRangeLabel(latestHealthRecord.weekStart, latestHealthRecord.weekEnd)}`
                      : 'Sem input semanal preenchido'
                    const accentRgb = row.clientAccentRgb
                    const accentGlow = accentRgb
                      ? { '--card-accent-r': accentRgb.r, '--card-accent-g': accentRgb.g, '--card-accent-b': accentRgb.b }
                      : {}

                    const getObjectiveLabel = (objective) => {
                      switch ((objective || '').toUpperCase()) {
                        case 'OUTCOME_LEADS': case 'LEAD_GENERATION': return { result: 'Leads', cpr: 'Custo/lead' }
                        case 'OUTCOME_SALES': case 'CONVERSIONS': case 'PRODUCT_CATALOG_SALES': return { result: 'Compras', cpr: 'Custo/compra' }
                        case 'MESSAGES': return { result: 'Conversas', cpr: 'Custo/conversa' }
                        case 'OUTCOME_ENGAGEMENT': case 'POST_ENGAGEMENT': case 'PAGE_LIKES': return { result: 'Engajamento', cpr: 'Custo/eng.' }
                        case 'OUTCOME_TRAFFIC': case 'LINK_CLICKS': case 'TRAFFIC': return { result: 'Visitas', cpr: 'Custo/visita' }
                        case 'OUTCOME_AWARENESS': case 'REACH': case 'BRAND_AWARENESS': return { result: 'Alcance', cpr: 'CPM efetivo' }
                        case 'VIDEO_VIEWS': case 'OUTCOME_VIDEO_VIEWS': return { result: 'Visualizações', cpr: 'Custo/view' }
                        default: return { result: 'Resultados', cpr: 'Custo/resultado' }
                      }
                    }

                    if (campaignViewMode === 'grid') {
                      return (
                        <article key={`campaign-client-${row.clientId}`} className={'campaign-grid-card glass-item ' + (isExpanded ? 'expanded' : '') + (healthConfig ? ' health-' + healthConfig.key : '')} style={accentGlow}>
                          <button type="button" className="campaign-grid-card-head" onClick={() => handleToggleCampaignOverviewClient(row.clientId)} aria-expanded={isExpanded}>
                            <div className="campaign-grid-identity">
                              <span className="campaign-grid-logo">
                                {row.clientLogoUrl ? <img src={row.clientLogoUrl} alt={`Logo ${row.clientName}`} /> : <i className="bx bx-building-house"></i>}
                              </span>
                              <div className="campaign-grid-name">
                                <strong>{row.clientName}</strong>
                                <small>{row.isGhost ? '👻 Fantasma' : `${formatNumber(campaigns.length)} campanha(s)`}</small>
                              </div>
                              {healthConfig && (
                                <span className="campaign-grid-health-dot" style={{ background: healthConfig.color }} title={healthConfig.label} />
                              )}
                            </div>
                            <div className="campaign-grid-metrics">
                              <div className="campaign-grid-metric">
                                <span>Investimento</span>
                                <strong>{formatCurrency(totals.spend || 0)}</strong>
                              </div>
                              <div className="campaign-grid-metric">
                                <span>Resultados</span>
                                <strong>{formatNumber(totals.results || 0)}</strong>
                              </div>
                              <div className="campaign-grid-metric">
                                <span>CPR</span>
                                <strong style={clientCprColor ? { color: clientCprColor } : undefined}>
                                  {totals.results > 0 ? formatCurrency((totals.spend || 0) / totals.results) : '—'}
                                </strong>
                              </div>
                              {clientCprBench > 0 && (
                                <div className="campaign-grid-metric campaign-grid-meta" style={{ borderColor: `${clientCprColor || '#6b7280'}44` }}>
                                  <span style={{ color: clientCprColor || undefined }}>Meta</span>
                                  <strong style={{ color: clientCprColor || undefined }}>R${Number(clientCprBench).toFixed(2)}</strong>
                                </div>
                              )}
                            </div>
                            <div className="campaign-grid-footer">
                              <span className={'campaign-grid-health-badge ' + (healthConfig ? healthConfig.key : 'empty')} style={healthConfig ? { '--client-health-color': healthConfig.color } : undefined}>
                                {healthConfig?.label || 'Sem saúde'}
                              </span>
                              <i className={'bx ' + (isExpanded ? 'bx-chevron-up' : 'bx-chevron-down')}></i>
                            </div>
                          </button>
                          {isExpanded ? (
                            row.isGhost ? (
                              <div className="ads-overview-no-ads" style={{ padding: '20px 16px', opacity: 0.7, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <i className="bx bx-link-alt" style={{ fontSize: 24 }}></i>
                                <span style={{ fontSize: 12, textAlign: 'center' }}>Vincule a conta de anúncio real</span>
                              </div>
                            ) : null
                          ) : null}
                        </article>
                      )
                    }

                    if (campaignViewMode === 'compact') {
                      return (
                        <article key={`campaign-client-${row.clientId}`} className={'campaign-compact-row ' + (isExpanded ? 'expanded' : '') + (healthConfig ? ' health-' + healthConfig.key : '')} style={accentGlow}>
                          <button type="button" className="campaign-compact-head" onClick={() => handleToggleCampaignOverviewClient(row.clientId)} aria-expanded={isExpanded}>
                            <span className="campaign-compact-logo">
                              {row.clientLogoUrl ? <img src={row.clientLogoUrl} alt="" /> : <i className="bx bx-building-house"></i>}
                            </span>
                            <span className="campaign-compact-name">
                              <strong>{row.clientName}</strong>
                              <small>{row.isGhost ? '👻' : `${formatNumber(campaigns.length)} camp.`}</small>
                            </span>
                            <span className="campaign-compact-cell">{formatCurrency(totals.spend || 0)}</span>
                            <span className="campaign-compact-cell">{formatNumber(totals.results || 0)}</span>
                            <span className="campaign-compact-cell" style={clientCprColor ? { color: clientCprColor, fontWeight: 600 } : undefined}>
                              {totals.results > 0 ? formatCurrency((totals.spend || 0) / totals.results) : '—'}
                            </span>
                            <span className="campaign-compact-cell campaign-compact-meta">
                              {clientCprBench > 0 ? <span style={{ color: clientCprColor || 'rgba(241,241,241,0.4)' }}>R${Number(clientCprBench).toFixed(2)}</span> : '—'}
                            </span>
                            <span className="campaign-compact-health">
                              {healthConfig ? (
                                <span className="campaign-compact-health-pill" style={{ background: `${healthConfig.color}22`, color: healthConfig.color, borderColor: `${healthConfig.color}44` }}>{healthConfig.label}</span>
                              ) : <span className="campaign-compact-health-pill empty">—</span>}
                            </span>
                            <i className={'bx ' + (isExpanded ? 'bx-chevron-up' : 'bx-chevron-down')}></i>
                          </button>
                          {isExpanded && !row.isGhost && !row.error && campaigns.length > 0 && (
                            <div className="campaign-overview-tree campaign-compact-tree">
                              {campaigns.map((campaign, campaignIndex) => {
                                const campaignKey = `${row.clientId}:${campaign.campaignId || campaignIndex}`
                                const campCpr = campaign.results > 0 ? (campaign.spend || 0) / campaign.results : null
                                const campColor = getCprColor(campCpr)
                                const campLabel = getObjectiveLabel(campaign.objective)
                                const adsets = Array.isArray(campaign.adsets) ? campaign.adsets : []
                                const campaignExpanded = campaignOverviewExpandedCampaignIds.includes(campaignKey)
                                return (
                                  <div key={campaignKey}>
                                    <div className="campaign-compact-tree-row campaign-compact-tree-campaign" onClick={() => handleToggleCampaignOverviewCampaign(campaignKey)} style={{ cursor: 'pointer' }}>
                                      <span className="campaign-compact-tree-status">
                                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: campaign.effectiveStatus === 'ACTIVE' ? '#22c55e' : '#64748b', boxShadow: campaign.effectiveStatus === 'ACTIVE' ? '0 0 5px #22c55e88' : 'none' }} />
                                      </span>
                                      <span className="campaign-compact-tree-name" title={campaign.name}>
                                        <span className="compact-level-badge compact-level-camp">Camp</span>
                                        {campaign.name || 'Sem nome'}
                                      </span>
                                      <span className="campaign-compact-cell">{formatCurrency(campaign.spend || 0)}</span>
                                      <span className="campaign-compact-cell">{formatNumber(campaign.results || 0)}<span className="campaign-compact-obj-tag">{campLabel.result}</span></span>
                                      <span className="campaign-compact-cell" style={campColor ? { color: campColor, fontWeight: 600 } : undefined}>{campCpr ? formatCurrency(campCpr) : '—'}</span>
                                      <span className="campaign-compact-cell campaign-compact-meta" />
                                      <span className="campaign-compact-health" />
                                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                        <button type="button" className={'campaign-chart-icon-btn' + (campaignChartOpenKeys[campaignKey] ? ' active' : '')} onClick={() => handleToggleCampaignChart(campaignKey, campaign.campaignId)} title="Ver evolução diária">
                                          <i className="bx bx-line-chart"></i>
                                        </button>
                                        {adsets.length > 0 && <i className={'bx ' + (campaignExpanded ? 'bx-chevron-up' : 'bx-chevron-down')} style={{ fontSize: 14, color: 'rgba(241,241,241,0.4)', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleToggleCampaignOverviewCampaign(campaignKey) }} />}
                                      </span>
                                    </div>
                                    {campaignChartOpenKeys[campaignKey] && (
                                      <div className="campaign-chart-panel" style={{ margin: '0 16px 8px' }}>
                                        {renderCampaignChart(campaignKey, effectiveWorkspaceBranding.primaryColor)}
                                      </div>
                                    )}
                                    {campaignExpanded && adsets.map((adset, adsetIndex) => {
                                      const adsetKey = `${campaignKey}:${adset.adsetId || adsetIndex}`
                                      const adsetCpr = adset.results > 0 ? (adset.spend || 0) / adset.results : null
                                      const ads = Array.isArray(adset.ads) ? adset.ads : []
                                      const adsetExpanded = campaignOverviewExpandedAdsetIds.includes(adsetKey)
                                      return (
                                        <div key={adsetKey}>
                                          <div className="campaign-compact-tree-row campaign-compact-tree-adset" onClick={() => handleToggleCampaignOverviewAdset(adsetKey)} style={{ cursor: 'pointer' }}>
                                            <span className="campaign-compact-tree-status">
                                              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: adset.effectiveStatus === 'ACTIVE' ? '#22c55e' : '#64748b', boxShadow: adset.effectiveStatus === 'ACTIVE' ? '0 0 5px #22c55e88' : 'none' }} />
                                            </span>
                                            <span className="campaign-compact-tree-name campaign-compact-tree-adset-name" title={adset.name}>
                                              <span className="compact-level-badge compact-level-adset">Conj</span>
                                              {adset.name || 'Conjunto sem nome'}
                                            </span>
                                            <span className="campaign-compact-cell">{formatCurrency(adset.spend || 0)}</span>
                                            <span className="campaign-compact-cell">{formatNumber(adset.results || 0)}</span>
                                            <span className="campaign-compact-cell">{adsetCpr ? formatCurrency(adsetCpr) : '—'}</span>
                                            <span className="campaign-compact-cell campaign-compact-meta" />
                                            <span className="campaign-compact-health" />
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                                              <button type="button" className={'campaign-chart-icon-btn' + (campaignChartOpenKeys[adsetKey] ? ' active' : '')} onClick={() => handleToggleCampaignChart(adsetKey, adset.adsetId)} title="Ver evolução diária">
                                                <i className="bx bx-line-chart"></i>
                                              </button>
                                              {ads.length > 0 && <i className={'bx ' + (adsetExpanded ? 'bx-chevron-up' : 'bx-chevron-down')} style={{ fontSize: 13, color: 'rgba(241,241,241,0.35)', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleToggleCampaignOverviewAdset(adsetKey) }} />}
                                            </span>
                                          </div>
                                          {campaignChartOpenKeys[adsetKey] && (
                                            <div className="campaign-chart-panel" style={{ margin: '0 16px 8px 52px' }}>
                                              {renderCampaignChart(adsetKey, effectiveWorkspaceBranding.primaryColor)}
                                            </div>
                                          )}
                                          {adsetExpanded && ads.map((ad, adIndex) => {
                                            const adCpr = ad.results > 0 ? (ad.spend || 0) / ad.results : null
                                            return (
                                              <div key={ad.adId || adIndex} className="campaign-compact-tree-row campaign-compact-tree-ad">
                                                <span className="campaign-compact-tree-status">
                                                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: ad.spend > 0 ? '#22c55e' : '#64748b', boxShadow: ad.spend > 0 ? '0 0 4px #22c55e88' : 'none' }} />
                                                </span>
                                                <span className="campaign-compact-tree-name campaign-compact-tree-ad-name" title={ad.name}>
                                                  <span className="compact-level-badge compact-level-ad">Ad</span>
                                                  {ad.name || 'Anúncio sem nome'}
                                                </span>
                                                <span className="campaign-compact-cell">{formatCurrency(ad.spend || 0)}</span>
                                                <span className="campaign-compact-cell">{formatNumber(ad.results || 0)}</span>
                                                <span className="campaign-compact-cell">{adCpr ? formatCurrency(adCpr) : '—'}</span>
                                                <span className="campaign-compact-cell campaign-compact-meta" />
                                                <span className="campaign-compact-health" />
                                                <span />
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
                          )}
                          {isExpanded && row.isGhost && (
                            <div className="ads-overview-no-ads" style={{ padding: '12px 16px', opacity: 0.6, fontSize: 12 }}>Conta fantasma — sem integração.</div>
                          )}
                          {isExpanded && row.error && (
                            <div className="api-error-banner" style={{ margin: '0 12px 12px' }}><i className="bx bx-error-circle" /><span>{row.error}</span></div>
                          )}
                          {isExpanded && !row.isGhost && !row.error && campaigns.length === 0 && (
                            <div className="ads-overview-no-ads" style={{ padding: '12px 16px', opacity: 0.6, fontSize: 12 }}>Sem campanhas ativas no período.</div>
                          )}
                        </article>
                      )
                    }

                    // Default: list mode
                    return (
                      <article key={`campaign-client-${row.clientId}`} className={'ads-overview-client-card campaign-overview-client-card glass-item ' + (isExpanded ? 'expanded' : '')} style={accentGlow}>
                        <button type="button" className="ads-overview-client-head ads-overview-client-toggle campaign-overview-client-head" onClick={() => handleToggleCampaignOverviewClient(row.clientId)} aria-expanded={isExpanded}>
                          <div className="ads-overview-client-identity">
                            <span className="ads-overview-client-logo">
                              {row.clientLogoUrl ? <img src={row.clientLogoUrl} alt={`Logo ${row.clientName}`} /> : <i className="bx bx-building-house"></i>}
                            </span>
                            <div>
                              <strong>{row.clientName}</strong>
                              <small>{row.isGhost ? '👻 Conta fantasma · Sem integração' : `act_${row.metaAdAccountId} • ${formatNumber(campaigns.length)} campanha(s)`}</small>
                            </div>
                          </div>
                          <div className="campaign-overview-client-metrics">
                            <span className="campaign-overview-total-pill">
                              <small>Investimento</small>
                              <strong>{formatCurrency(totals.spend || 0)}</strong>
                            </span>
                            <span className="campaign-overview-total-pill">
                              <small>Resultados</small>
                              <strong>{formatNumber(totals.results || 0)}</strong>
                            </span>
                            <span className="campaign-overview-total-pill">
                              <small>Custo/resultado</small>
                              <strong style={clientCprColor ? { color: clientCprColor } : undefined}>{totals.results > 0 ? formatCurrency((totals.spend || 0) / totals.results) : '—'}</strong>
                            </span>
                            {clientCprBench > 0 && (
                              <span className="campaign-overview-total-pill" style={{ background: `${clientCprColor || '#6b7280'}18`, border: `1px solid ${clientCprColor || '#6b7280'}44` }}>
                                <small style={{ color: clientCprColor || 'rgba(241,241,241,0.5)' }}>Meta CPR</small>
                                <strong style={{ color: clientCprColor || 'rgba(241,241,241,0.7)' }}>R${Number(clientCprBench).toFixed(2)}</strong>
                              </span>
                            )}
                            <span className={'simple-client-health compact ' + (healthConfig ? 'active ' + healthConfig.key : 'empty')} style={healthConfig ? { '--client-health-color': healthConfig.color } : undefined}>
                              <b>{healthConfig?.label || 'Sem saúde'}</b>
                              <small>{healthDetail}</small>
                            </span>
                            <span className="ads-overview-expand-button">
                              <i className={'bx ' + (isExpanded ? 'bx-chevron-up' : 'bx-chevron-down')}></i>
                            </span>
                          </div>
                        </button>

                        {isExpanded ? (
                          row.isGhost ? (
                            <div className="ads-overview-no-ads" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 20px', opacity: 0.7 }}>
                              <i className="bx bx-link-alt" style={{ fontSize: 28 }}></i>
                              <span>Conta fantasma — vincule a conta de anúncio real no cadastro do cliente para ativar a integração.</span>
                            </div>
                          ) : row.error ? (
                            <div className="api-error-banner ads-overview-client-error" role="status">
                              <i className="bx bx-error-circle"></i>
                              <span>{row.error}</span>
                            </div>
                          ) : campaigns.length ? (
                            <div className="campaign-overview-tree">
                              {campaigns.map((campaign, campaignIndex) => {
                                const campaignKey = `${row.clientId}:${campaign.campaignId || campaignIndex}`
                                const campaignExpanded = campaignOverviewExpandedCampaignIds.includes(campaignKey)
                                const adsets = Array.isArray(campaign.adsets) ? campaign.adsets : []

                                return (
                                  <div key={campaignKey} className="campaign-overview-tree-group">
                                    <div className="campaign-row-wrap">
                                      <button type="button" className="campaign-overview-tree-row campaign-overview-campaign-row" onClick={() => handleToggleCampaignOverviewCampaign(campaignKey)} aria-expanded={campaignExpanded}>
                                        <span className="campaign-overview-row-title">
                                          <strong>
                                            <span
                                              title={campaign.effectiveStatus === 'ACTIVE' ? 'Ativa' : campaign.effectiveStatus === 'PAUSED' ? 'Pausada' : campaign.effectiveStatus || 'Status desconhecido'}
                                              style={{
                                                display: 'inline-block',
                                                width: 8, height: 8, borderRadius: '50%',
                                                background: campaign.effectiveStatus === 'ACTIVE' ? '#22c55e' : '#64748b',
                                                marginRight: 7, flexShrink: 0, verticalAlign: 'middle',
                                                boxShadow: campaign.effectiveStatus === 'ACTIVE' ? '0 0 6px #22c55e88' : 'none',
                                              }}
                                            />
                                            {campaign.name || 'Campanha sem nome'}
                                          </strong>
                                          <small>{formatNumber(adsets.length)} conjunto(s)</small>
                                        </span>
                                        <span className="campaign-overview-metric">
                                          <small>Investimento</small>
                                          <strong>{formatCurrency(campaign.spend || 0)}</strong>
                                        </span>
                                        <span className="campaign-overview-metric">
                                          <small>{getObjectiveLabel(campaign.objective).result}</small>
                                          <strong>{formatNumber(campaign.results || 0)}</strong>
                                        </span>
                                        {(() => {
                                          const campCpr = campaign.results > 0 ? (campaign.spend || 0) / campaign.results : null
                                          const campColor = getCprColor(campCpr)
                                          return (
                                            <span className="campaign-overview-metric" style={campColor ? { background: `${campColor}14`, borderRadius: 6, padding: '2px 6px' } : undefined}>
                                              <small style={campColor ? { color: campColor, opacity: 1 } : undefined}>{getObjectiveLabel(campaign.objective).cpr}</small>
                                              <strong style={campColor ? { color: campColor } : undefined}>{campCpr ? formatCurrency(campCpr) : '—'}</strong>
                                            </span>
                                          )
                                        })()}
                                        <span className="campaign-overview-metric">
                                          <small>Cliques</small>
                                          <strong>{formatNumber(campaign.clicks || 0)}</strong>
                                        </span>
                                        <span className="campaign-overview-metric">
                                          <small>Impressões</small>
                                          <strong>{formatNumber(campaign.impressions || 0)}</strong>
                                        </span>
                                      </button>
                                      <div className="campaign-row-actions">
                                        <span className="campaign-overview-chevron" onClick={() => handleToggleCampaignOverviewCampaign(campaignKey)} style={{cursor:'pointer',pointerEvents:'auto'}}>
                                          <i className={'bx ' + (campaignExpanded ? 'bx-chevron-up' : 'bx-chevron-down')}></i>
                                        </span>
                                        <button
                                          type="button"
                                          className={'campaign-chart-icon-btn' + (campaignChartOpenKeys[campaignKey] ? ' active' : '')}
                                          onClick={() => handleToggleCampaignChart(campaignKey, campaign.campaignId)}
                                          title="Ver evolução diária"
                                        >
                                          <i className="bx bx-line-chart"></i>
                                        </button>
                                      </div>
                                      {campaignChartOpenKeys[campaignKey] && (
                                        <div className="campaign-chart-panel">
                                          {renderCampaignChart(campaignKey, effectiveWorkspaceBranding.primaryColor)}
                                        </div>
                                      )}
                                    </div>

                                    {campaignExpanded ? (
                                      adsets.length ? (
                                        <div className="campaign-overview-adset-list">
                                          {adsets.map((adset, adsetIndex) => {
                                            const adsetKey = `${campaignKey}:${adset.adsetId || adsetIndex}`
                                            const adsetExpanded = campaignOverviewExpandedAdsetIds.includes(adsetKey)
                                            const ads = Array.isArray(adset.ads) ? adset.ads : []

                                            return (
                                              <div key={adsetKey} className="campaign-overview-tree-group">
                                                <div className="campaign-row-wrap">
                                                  <button type="button" className="campaign-overview-tree-row campaign-overview-adset-row" onClick={() => handleToggleCampaignOverviewAdset(adsetKey)} aria-expanded={adsetExpanded}>
                                                    <span className="campaign-overview-row-title">
                                                      <strong>{adset.name || 'Conjunto sem nome'}</strong>
                                                      <small>{formatNumber(ads.length)} anúncio(s)</small>
                                                    </span>
                                                    <span className="campaign-overview-metric">
                                                      <small>Investimento</small>
                                                      <strong>{formatCurrency(adset.spend || 0)}</strong>
                                                    </span>
                                                    <span className="campaign-overview-metric">
                                                      <small>Resultados</small>
                                                      <strong>{formatNumber(adset.results || 0)}</strong>
                                                    </span>
                                                    <span className="campaign-overview-metric">
                                                      <small>Custo/resultado</small>
                                                      <strong>{adset.results > 0 ? formatCurrency((adset.spend || 0) / adset.results) : '—'}</strong>
                                                    </span>
                                                    <span className="campaign-overview-metric">
                                                      <small>Cliques</small>
                                                      <strong>{formatNumber(adset.clicks || 0)}</strong>
                                                    </span>
                                                    <span className="campaign-overview-metric">
                                                      <small>Impressões</small>
                                                      <strong>{formatNumber(adset.impressions || 0)}</strong>
                                                    </span>
                                                  </button>
                                                  <div className="campaign-row-actions">
                                                    <span className="campaign-overview-chevron" onClick={() => handleToggleCampaignOverviewAdset(adsetKey)} style={{cursor:'pointer',pointerEvents:'auto'}}>
                                                      <i className={'bx ' + (adsetExpanded ? 'bx-chevron-up' : 'bx-chevron-down')}></i>
                                                    </span>
                                                    <button
                                                      type="button"
                                                      className={'campaign-chart-icon-btn' + (campaignChartOpenKeys[adsetKey] ? ' active' : '')}
                                                      onClick={() => handleToggleCampaignChart(adsetKey, adset.adsetId)}
                                                      title="Ver evolução diária"
                                                    >
                                                      <i className="bx bx-line-chart"></i>
                                                    </button>
                                                  </div>
                                                  {campaignChartOpenKeys[adsetKey] && (
                                                    <div className="campaign-chart-panel">
                                                      {renderCampaignChart(adsetKey, effectiveWorkspaceBranding.primaryColor)}
                                                    </div>
                                                  )}
                                                </div>

                                                {adsetExpanded ? (
                                                  ads.length ? (
                                                    <div className="campaign-overview-ad-list">
                                                      {ads.map((ad, adIndex) => {
                                                        const adKey = `${adsetKey}:${ad.adId || adIndex}`
                                                        return (
                                                        <div key={adKey} className="campaign-row-wrap">
                                                          <div className="campaign-overview-tree-row campaign-overview-ad-row">
                                                            <span className="campaign-overview-row-title">
                                                              <strong>{ad.name || 'Anúncio sem nome'}</strong>
                                                              <small>{ad.adId || 'Sem ID'}</small>
                                                            </span>
                                                            <span className="campaign-overview-metric">
                                                              <small>Investimento</small>
                                                              <strong>{formatCurrency(ad.spend || 0)}</strong>
                                                            </span>
                                                            <span className="campaign-overview-metric">
                                                              <small>Resultados</small>
                                                              <strong>{formatNumber(ad.results || 0)}</strong>
                                                            </span>
                                                            <span className="campaign-overview-metric">
                                                              <small>Custo/resultado</small>
                                                              <strong>{ad.results > 0 ? formatCurrency((ad.spend || 0) / ad.results) : '—'}</strong>
                                                            </span>
                                                            <span className="campaign-overview-metric">
                                                              <small>Cliques</small>
                                                              <strong>{formatNumber(ad.clicks || 0)}</strong>
                                                            </span>
                                                            <span className="campaign-overview-metric">
                                                              <small>Impressões</small>
                                                              <strong>{formatNumber(ad.impressions || 0)}</strong>
                                                            </span>
                                                          </div>
                                                          <div className="campaign-row-actions" style={{height:'64px'}}>
                                                            <button
                                                              type="button"
                                                              className={'campaign-chart-icon-btn' + (campaignChartOpenKeys[adKey] ? ' active' : '')}
                                                              onClick={() => handleToggleCampaignChart(adKey, ad.adId)}
                                                              title="Ver evolução diária"
                                                            >
                                                              <i className="bx bx-line-chart"></i>
                                                            </button>
                                                          </div>
                                                          {campaignChartOpenKeys[adKey] && (
                                                            <div className="campaign-chart-panel">
                                                              {renderCampaignChart(adKey, effectiveWorkspaceBranding.primaryColor)}
                                                            </div>
                                                          )}
                                                        </div>
                                                        )
                                                      })}
                                                    </div>
                                                  ) : (
                                                    <div className="ads-overview-no-ads campaign-overview-empty-node">
                                                      Sem anúncios ativos com investimento neste conjunto.
                                                    </div>
                                                  )
                                                ) : null}
                                              </div>
                                            )
                                          })}
                                        </div>
                                      ) : (
                                        <div className="ads-overview-no-ads campaign-overview-empty-node">
                                          Sem conjuntos ativos com investimento nesta campanha.
                                        </div>
                                      )
                                    ) : null}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="ads-overview-no-ads">
                              <i className="bx bx-low-vision"></i>
                              <span>Sem campanhas ativas com investimento no período selecionado.</span>
                            </div>
                          )
                        ) : null}
                      </article>
                    )
                  })}
                </div>
                </>
              ) : (
                <div className="ranking-empty ads-overview-empty">
                  Nenhum cliente encontrado para os filtros selecionados.
                </div>
              )}
            </section>
          </section>
  )
}
