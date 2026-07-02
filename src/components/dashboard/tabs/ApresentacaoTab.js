'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { Doughnut, Line } from 'react-chartjs-2'
import CustomSelect from '@/components/dashboard/CustomSelect'
import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function ApresentacaoTab() {
  const {
    META_CAMPAIGN_TABLE_COLUMN_OPTIONS,
    META_RESULT_PERIOD_OPTIONS,
    METRIC_OPTIONS,
    metaResultPreviewKey,
    metaResultGrouping,
    extractMetaCampaignMetrics,
    activeClient,
    activeClientUsesManualCrm,
    activeClientVisibleIntegrationsSet,
    activeDraftDashboardTemplate,
    activeDraftFunnelSteps,
    activeDraftMetaAdIds,
    activeDraftMetaAdsetIds,
    activeDraftMetaCampaignIds,
    activeDraftRdLeadSources,
    activeMetaComparisonGroups,
    activeMetaResultPreviewConfig,
    availableFunnelMetrics,
    availableGoogleSheetsMetricOptions,
    availableMetaCampaignOptions,
    availableMetaResultFilters,
    breakdowns,
    campaignSearch,
    campaignSortBy,
    campaignSortOptions,
    campaignStatusFilter,
    canViewDashboard,
    crmSourceLabel,
    currentTheme,
    dashboardEligibleClients,
    dashboardEntryClientId,
    dashboardRef,
    defaultGoogleSheetsKpis,
    doughnutChartData,
    doughnutChartOptions,
    draftAvailableMetaAdOptions,
    draftAvailableMetaAdsetOptions,
    draftMetaCampaignTableColumnKeys,
    draftRdPipelineFilter,
    draftRdSellerFilter,
    errorMessage,
    filteredCampaigns,
    formatCampaignMetricValue,
    formatCurrency,
    formatDashboardMetricValue,
    formatGoogleAdsAccountLabel,
    formatMultiplier,
    formatNumber,
    formatPercent,
    funnelCards,
    getCampaignMetricValue,
    googleAdsCampaigns,
    googleAdsError,
    googleAdsKpis,
    googleAdsSummary,
    googleSheetsDashboardMetricCards,
    googleSheetsError,
    googleSheetsSummary,
    handleAddSheetsDashboardMetric,
    handleApplyDashboardFilters,
    handleConfirmDashboardEntry,
    handleFunnelDragStart,
    handleFunnelDrop,
    handleMetaAdFilterToggle,
    handleMetaAdsetFilterToggle,
    handleMetaCampaignFilterToggle,
    handleMetaResultFilterToggle,
    handleRdLeadSourceToggle,
    handleRemoveFunnelStep,
    handleSaveManualCrm,
    handleToggleMetaCampaignTableColumn,
    hasAnyPresentationData,
    hasGoogleAdsConfigured,
    hasMetaConfigured,
    hasNavAccess,
    hasPendingDashboardFilters,
    hasRdConfigured,
    hasSheetsConfigured,
    isApplyDashboardFiltersDisabled,
    isCampaignColumnLibraryOpen,
    isDashboardEntryModalOpen,
    isFunnelSectionOpen,
    isLoading,
    isManualCrmModalOpen,
    isMaster,
    isMetaAdFilterOpen,
    isMetaAdsetFilterOpen,
    isMetaCampaignFilterOpen,
    isRankingsLoading,
    isRdDiagnosticsOpen,
    isRdSourceFilterOpen,
    isSavingManualCrm,
    isSheetsMetricLibraryOpen,
    lineChartData,
    lineChartOptions,
    manualCrmForm,
    metaAdFilterSummary,
    metaAdsetFilterSummary,
    metaCampaignFilterSummary,
    metaRankingLayers,
    metaResultPreviewChartData,
    metaResultPreviewChartOptions,
    metaResultPreviewSeries,
    metaResultPreviewSummary,
    metaSummaryDashboardMetricCards,
    metric1,
    metric2,
    normalizedDraftMetaResultFilters,
    rankingsError,
    rdAgendorFunnelKpis,
    rdAppliedPipelineSummary,
    rdDiagnosticsSummary,
    rdLeadSourceFilterSummary,
    rdPipelineOptions,
    rdSummary,
    renderDashboardMetricGrid,
    renderFixedKpiGrid,
    renderMetaSummaryMetricGrid,
    replaceDraftFunnelSteps,
    selectedGoogleAdsAccount,
    selectedMetaCampaignTableColumns,
    setActiveTab,
    setCampaignSearch,
    setCampaignSortBy,
    setCampaignStatusFilter,
    setDashboardEntryClientId,
    setDraftRdPipelineFilter,
    setDraftRdSellerFilter,
    setIsCampaignColumnLibraryOpen,
    setIsDashboardEntryModalOpen,
    setIsFunnelSectionOpen,
    setIsManualCrmModalOpen,
    setIsMetaAdFilterOpen,
    setIsMetaAdsetFilterOpen,
    setIsMetaCampaignFilterOpen,
    setIsRdDiagnosticsOpen,
    setIsRdSourceFilterOpen,
    setIsSheetsMetricLibraryOpen,
    setManualCrmForm,
    setMetaRankingDrilldown,
    setMetaResultDrilldown,
    setMetaResultGrouping,
    setMetaResultPreviewKey,
    setMetaSecondaryResultDrilldown,
    setMetric1,
    setMetric2,
    visibleMetaConversionGroups,
  } = useDashboard()

  return (
    <>
        {(isMaster || hasNavAccess('apresentacao')) && (
          <div ref={dashboardRef} className="dashboard-pdf-export-area" data-dashboard-pdf-area="true">
            <section className="glass-panel hero-panel" style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div className="hero-copy">
                {activeClient?.logoUrl && (
                  <div className="hero-logo-wrap">
                    <img src={activeClient.logoUrl} alt={`Logo ${activeClient.name}`} className="hero-logo" />
                  </div>
                )}
                <span className="management-hero-kicker" style={{ color: currentTheme.main, borderColor: currentTheme.main }}>
                  <i className="bx bx-layout" style={{ marginRight: 5 }}></i>{`Dashboard ${activeClient?.name || 'do cliente'}`}
                </span>
                <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>{activeClient?.name || 'Selecione um cliente'}</h2>
              </div>
              {!activeClientUsesManualCrm && (
                <div className="hero-meta">
                  {!hasAnyPresentationData ? (
                  <div className="hero-stat hero-stat-empty">
                    <span>Nenhuma integração ativa</span>
                    <strong>Cadastre uma integração do cliente ou da operação</strong>
                  </div>
                ) : (
                  <>
                    {Boolean([
                      activeClientVisibleIntegrationsSet.has('google_ads') ? activeClient?.googleAdsAccountId : '',
                      activeClientVisibleIntegrationsSet.has('tiktok_ads') ? activeClient?.tiktokAdsAccountId : '',
                      activeClientVisibleIntegrationsSet.has('linkedin_ads') ? activeClient?.linkedInAdsAccountId : '',
                    ].filter(Boolean).length) && (
                      <div className="hero-stat">
                        <span>Outras contas de anúncio</span>
                        <strong>{[
                          activeClientVisibleIntegrationsSet.has('google_ads') ? activeClient?.googleAdsAccountId : '',
                          activeClientVisibleIntegrationsSet.has('tiktok_ads') ? activeClient?.tiktokAdsAccountId : '',
                          activeClientVisibleIntegrationsSet.has('linkedin_ads') ? activeClient?.linkedInAdsAccountId : '',
                        ].filter(Boolean).length} conta(s) vinculada(s)</strong>
                      </div>
                    )}
                    {hasSheetsConfigured && (
                      <div className="hero-stat">
                        <span>Google Sheets</span>
                        <strong>{googleSheetsSummary?.totalRows ? `${googleSheetsSummary.totalRows} linha(s) lida(s)` : 'Planilha conectada'}</strong>
                      </div>
                    )}
                  </>
                  )}
                </div>
              )}
            </section>

            {errorMessage && (
              <div className="api-error-banner" role="status">
                <i className="bx bx-error-circle"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            {!activeClient ? (
              !canViewDashboard ? (
              <div className="empty-panel glass-panel">
                <h3>Aguardando liberação</h3>
                <p>Seu usuário já existe, mas ainda não recebeu acesso a nenhum workspace ou dashboard. Peça ao master para liberar sua conta.</p>
              </div>
            ) : (
              <div className="empty-panel glass-panel">
                <h3>Crie um cliente primeiro</h3>
                <p>Use a aba de clientes para adicionar sua operação antes de abrir a apresentação.</p>
              </div>
            )
            ) : isLoading ? (
              <div className="empty-panel glass-panel">
                <h3>Sincronizando com as APIs</h3>
                <p>Estamos puxando os dados configurados para {activeClient.name}.</p>
              </div>
            ) : activeClient.dashboardEnabled === false ? (
              <div className="empty-panel glass-panel">
                <h3>Dashboard desativado para este cliente</h3>
                <p>Ative o dashboard no cadastro do cliente para liberar a apresentação executiva e as integrações visíveis.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('clientes')}>
                  Abrir clientes
                </button>
              </div>
            ) : !hasAnyPresentationData ? (
              <div className="empty-panel glass-panel">
                <h3>Defina a operação</h3>
                <p>Cadastre ao menos uma integração do cliente ou da operação para liberar a apresentação dinâmica do dashboard.</p>
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('clientes')}>
                  Abrir clientes
                </button>
              </div>
            ) : (
              <>
                {hasMetaConfigured && (
                  <section className="source-section">
                    <div className="source-section-header">
                    <div className="source-section-badge" style={{ color: '#0668E1', borderColor: '#0668E1' }}>
                      <i className="bx bxl-meta"></i>
                      <span>Meta Ads</span>
                    </div>
                    </div>
                <section className="glass-panel meta-filter-panel">
                  <div className="meta-filter-panel-head">
                    <div>
                      <span className="meta-filter-kicker">Leitura por objetivo</span>
                      <h2>Filtro por tipo de resultado</h2>
                      <p className="chart-subtitle">O relatório considera apenas campanhas que geraram o tipo de resultado selecionado.</p>
                    </div>
                    <span className="meta-filter-helper">Todos começam marcados por padrão.</span>
                  </div>
                  <div className="stage-selector meta-filter-chip-row">
                    {availableMetaResultFilters.map((filter) => (
                      <label key={filter.key} className={`stage-chip ${normalizedDraftMetaResultFilters.includes(filter.key) ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={normalizedDraftMetaResultFilters.includes(filter.key)}
                          onChange={() => handleMetaResultFilterToggle(filter.key)}
                        />
                        <span>{filter.label}</span>
                      </label>
                    ))}
                  </div>
                  {availableMetaCampaignOptions.length > 0 && (
                    <div className="meta-campaign-filter-collapsible">
                      <button
                        type="button"
                        className={`meta-campaign-filter-trigger ${isMetaCampaignFilterOpen ? 'open' : ''}`}
                        onClick={() => setIsMetaCampaignFilterOpen((current) => !current)}
                      >
                        <div>
                          <h3>Filtrar por campanha</h3>
                          <p>{metaCampaignFilterSummary}</p>
                        </div>
                        <span className="meta-campaign-filter-trigger-icon">
                          <i className={`bx ${isMetaCampaignFilterOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                        </span>
                      </button>
                      {isMetaCampaignFilterOpen && (
                        <div className="rd-source-filter-bar rd-source-filter-inline meta-campaign-filter-block">
                          <p className="meta-campaign-filter-note">
                            Selecione as campanhas específicas que quer considerar. Todas começam marcadas por padrão.
                          </p>
                          <div className="stage-selector meta-filter-chip-row">
                            {availableMetaCampaignOptions.map((campaign) => (
                              <label key={campaign.id} className={`stage-chip ${activeDraftMetaCampaignIds.includes(campaign.id) ? 'active' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={activeDraftMetaCampaignIds.includes(campaign.id)}
                                  onChange={() => handleMetaCampaignFilterToggle(campaign.id)}
                                />
                                <span>{campaign.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {draftAvailableMetaAdsetOptions.length > 0 && (
                    <div className="meta-campaign-filter-collapsible">
                      <button
                        type="button"
                        className={`meta-campaign-filter-trigger ${isMetaAdsetFilterOpen ? 'open' : ''}`}
                        onClick={() => setIsMetaAdsetFilterOpen((current) => !current)}
                      >
                        <div>
                          <h3>Filtrar por conjunto</h3>
                          <p>{metaAdsetFilterSummary}</p>
                        </div>
                        <span className="meta-campaign-filter-trigger-icon">
                          <i className={`bx ${isMetaAdsetFilterOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                        </span>
                      </button>
                      {isMetaAdsetFilterOpen && (
                        <div className="rd-source-filter-bar rd-source-filter-inline meta-campaign-filter-block">
                          <p className="meta-campaign-filter-note">
                            Os conjuntos seguem a campanha selecionada. Todos começam marcados por padrão.
                          </p>
                          <div className="stage-selector meta-filter-chip-row">
                            {draftAvailableMetaAdsetOptions.map((adset) => (
                              <label key={adset.id} className={`stage-chip ${activeDraftMetaAdsetIds.includes(adset.id) ? 'active' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={activeDraftMetaAdsetIds.includes(adset.id)}
                                  onChange={() => handleMetaAdsetFilterToggle(adset.id)}
                                />
                                <span>{adset.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {draftAvailableMetaAdOptions.length > 0 && (
                    <div className="meta-campaign-filter-collapsible">
                      <button
                        type="button"
                        className={`meta-campaign-filter-trigger ${isMetaAdFilterOpen ? 'open' : ''}`}
                        onClick={() => setIsMetaAdFilterOpen((current) => !current)}
                      >
                        <div>
                          <h3>Filtrar por anúncio</h3>
                          <p>{metaAdFilterSummary}</p>
                        </div>
                        <span className="meta-campaign-filter-trigger-icon">
                          <i className={`bx ${isMetaAdFilterOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                        </span>
                      </button>
                      {isMetaAdFilterOpen && (
                        <div className="rd-source-filter-bar rd-source-filter-inline meta-campaign-filter-block">
                          <p className="meta-campaign-filter-note">
                            Os anúncios seguem campanha e conjunto selecionados. Todos começam marcados por padrão.
                          </p>
                          <div className="stage-selector meta-filter-chip-row">
                            {draftAvailableMetaAdOptions.map((ad) => (
                              <label key={ad.id} className={`stage-chip ${activeDraftMetaAdIds.includes(ad.id) ? 'active' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={activeDraftMetaAdIds.includes(ad.id)}
                                  onChange={() => handleMetaAdFilterToggle(ad.id)}
                                />
                                <span>{ad.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
                <section className="glass-panel grouped-results">
                  <div className="section-header section-header-stack section-header-with-action">
                    <div>
                      <h2>Resumo de resultados</h2>
                      <p className="chart-subtitle">Os indicadores abaixo consideram somente as campanhas enquadradas no filtro de resultado ativo.</p>
                    </div>
                  </div>

                  <div className="template-metrics-shell">
                    <div className="result-group">
                      <div className="result-group-head">
                        <h3>Mídia e distribuição</h3>
                        <p>Visão geral do investimento e da entrega da campanha.</p>
                      </div>
                      {renderMetaSummaryMetricGrid(metaSummaryDashboardMetricCards)}
                    </div>

                    <div className="conversion-groups-grid">
                      {visibleMetaConversionGroups.map((group) => (
                        <article
                          key={group.key}
                          className={`conversion-group-card glass-panel ${group.resultValue > 0 ? 'conversion-group-card-active' : 'conversion-group-card-muted'}`}
                        >
                          <div className="conversion-group-head">
                            <div className={`icon-box ${group.tone}`}>
                              <i className={`bx ${group.icon}`}></i>
                            </div>
                            <div>
                              <h3>{group.title}</h3>
                              <p>{group.description}</p>
                            </div>
                          </div>
                          <div className="conversion-stats">
                            {group.stats.map((stat) => (
                              <div key={stat.label} className="conversion-stat">
                                <span>{stat.label}</span>
                                <strong>{stat.value}</strong>
                              </div>
                            ))}
                          </div>
                          {group.secondaryInsights ? (
                            <div className="conversion-group-footer">
                              <button
                                type="button"
                                className="conversion-group-secondary-trigger"
                                onClick={() => setMetaSecondaryResultDrilldown(group.key)}
                              >
                                <i className="bx bx-info-circle"></i>
                                Conversões extras
                              </button>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>

                    {activeMetaComparisonGroups.length > 0 && (
                    <div className="glass-panel meta-result-preview-panel">
                      <div className="meta-result-preview-head">
                        <div>
                          <span className="meta-result-preview-kicker">Comparativo de resultado</span>
                          <h3>{activeMetaResultPreviewConfig.title} x custo</h3>
                          <p>Leia a evolução do resultado junto com o custo no agrupamento que fizer mais sentido para decisão.</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary conversion-group-expand"
                          onClick={() => setMetaResultDrilldown({ key: activeMetaResultPreviewConfig.key })}
                        >
                          <i className="bx bx-expand-alt"></i>
                          Expandir gráfico
                        </button>
                      </div>

                      <div className="meta-result-preview-toolbar">
                        <div className="meta-result-preview-tabs">
                          {activeMetaComparisonGroups.map((group) => (
                            <button
                              key={`preview-${group.key}`}
                              type="button"
                              className={`meta-result-preview-tab ${metaResultPreviewKey === group.key ? 'active' : ''} ${group.resultValue > 0 ? 'meta-result-preview-tab-active-model' : 'meta-result-preview-tab-muted'}`}
                              onClick={() => setMetaResultPreviewKey(group.key)}
                            >
                              {group.title}
                            </button>
                          ))}
                        </div>

                        <div className="meta-result-periods">
                          {META_RESULT_PERIOD_OPTIONS.map((option) => (
                            <button
                              key={`inline-${option.value}`}
                              type="button"
                              className={`meta-result-period-btn ${metaResultGrouping === option.value ? 'active' : ''}`}
                              onClick={() => setMetaResultGrouping(option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="meta-result-summary meta-result-summary-inline">
                        <div className="monday-drilldown-stat glass-item">
                          <span>{activeMetaResultPreviewConfig.resultLabel}</span>
                          <strong>{formatNumber(metaResultPreviewSummary.totalResults)}</strong>
                        </div>
                        <div className="monday-drilldown-stat glass-item">
                          <span>{activeMetaResultPreviewConfig.costLabel}</span>
                          <strong>{formatCurrency(metaResultPreviewSummary.averageCost)}</strong>
                        </div>
                        <div className="monday-drilldown-stat glass-item">
                          <span>Investimento</span>
                          <strong>{formatCurrency(metaResultPreviewSummary.totalSpend)}</strong>
                        </div>
                      </div>

                      {metaResultPreviewSeries.length ? (
                        <div className="canvas-wrapper meta-result-inline-chart-wrapper">
                          <Line data={metaResultPreviewChartData} options={metaResultPreviewChartOptions} />
                        </div>
                      ) : (
                        <div className="ranking-empty">Sem histórico suficiente para montar esse comparativo no período atual.</div>
                      )}
                    </div>
                    )}
                  </div>

                </section>

                <section className="charts-section">
                  <div className="chart-container glass-panel main-chart">
                    <div className="chart-header chart-header-stack">
                      <div>
                        <h2>Evolução das métricas</h2>
                        <p className="chart-subtitle">Escolha as métricas que quer mostrar na apresentação desse cliente.</p>
                      </div>
                      <div className="chart-legend-custom">
                        <span className="legend-item">
                          <span className="dot" style={{ background: currentTheme.main, boxShadow: `0 0 8px ${currentTheme.main}` }}></span>
                          <select className="chart-metric-select" value={metric1} onChange={(event) => setMetric1(event.target.value)}>
                            {Object.entries(METRIC_OPTIONS).map(([key, metric]) => (
                              <option key={`metric-1-${key}`} value={key}>{metric.label}</option>
                            ))}
                          </select>
                        </span>
                        <span className="legend-item">
                          <span className="dot emerald"></span>
                          <select className="chart-metric-select" value={metric2} onChange={(event) => setMetric2(event.target.value)}>
                            {Object.entries(METRIC_OPTIONS).map(([key, metric]) => (
                              <option key={`metric-2-${key}`} value={key}>{metric.label}</option>
                            ))}
                          </select>
                        </span>
                      </div>
                    </div>
                    <div className="canvas-wrapper">
                      <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                  </div>

                  <div className="chart-container glass-panel secondary-chart">
                    <div className="chart-header chart-header-stack">
                      <div>
                        <h2>Distribuição de resultados</h2>
                        <p className="chart-subtitle">Leitura rápida do resultado da operação Meta desse cliente.</p>
                      </div>
                    </div>
                    <div className="canvas-wrapper donut-wrapper">
                      <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                    </div>
                  </div>
                </section>

                <section className="glass-panel funnel-section">
                  <div className="section-header section-header-stack section-header-with-action">
                    <div>
                      <h2>Funil de métricas</h2>
                      <p className="chart-subtitle">Arraste as métricas para montar a jornada manualmente. O sistema calcula a taxa de uma etapa para outra automaticamente.</p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary funnel-toggle-button"
                      onClick={() => setIsFunnelSectionOpen((current) => !current)}
                    >
                      <i className={"bx " + (isFunnelSectionOpen ? "bx-chevron-up" : "bx-chevron-down")}></i>
                      {isFunnelSectionOpen ? "Ocultar funil" : "Mostrar funil"}
                    </button>
                  </div>

                  {isFunnelSectionOpen && (
                    <div className="funnel-builder">
                    <div className="funnel-library">
                      <h3>Métricas disponíveis</h3>
                      <div className="funnel-chip-list">
                        {availableFunnelMetrics.map(([key, metric]) => (
                          <button
                            key={key}
                            type="button"
                            className="funnel-chip"
                            draggable
                            onDragStart={() => handleFunnelDragStart(key)}
                            onClick={() => replaceDraftFunnelSteps([...activeDraftFunnelSteps, key])}
                          >
                            <i className="bx bx-move"></i>
                            {metric.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className="funnel-dropzone"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleFunnelDrop(activeDraftFunnelSteps.length)}
                    >
                      {funnelCards.length === 0 ? (
                        <div className="funnel-empty">
                          Arraste métricas para cá para montar o funil do cliente.
                        </div>
                      ) : (
                        <div className="funnel-steps">
                          {funnelCards.map((step, index) => (
                            <React.Fragment key={step.key}>
                              <div
                                className="funnel-step"
                                draggable
                                onDragStart={() => handleFunnelDragStart(step.key, index)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => handleFunnelDrop(index)}
                              >
                                <div className="funnel-step-head">
                                  <span className="funnel-step-label">{step.label}</span>
                                  <button type="button" className="funnel-remove" onClick={() => handleRemoveFunnelStep(step.key)}>
                                    Remover
                                  </button>
                                </div>
                                <strong>{step.formattedValue}</strong>
                              </div>

                              {index < funnelCards.length - 1 && (
                                <div className="funnel-connector">
                                  <span>{funnelCards[index + 1]?.conversionRate === null ? 'Sem base anterior' : `${funnelCards[index + 1]?.conversionRate.toFixed(2).replace('.', ',')}% de conversão`}</span>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </section>

                <section className="rankings-grid meta-rankings-stack">
                  <div className="glass-panel ranking-card meta-ranking-card">
                    <div className="section-header section-header-stack">
                      <div>
                        <h2>Top 5 por estados</h2>
                        <p className="chart-subtitle">Ranking estadual separado pelo tipo de resultado ativo no topo do dashboard.</p>
                      </div>
                    </div>
                    <div className="meta-ranking-layer-stack">
                      {isRankingsLoading ? (
                        <div className="ranking-empty">Carregando ranking territorial...</div>
                      ) : rankingsError ? (
                        <div className="ranking-empty">{rankingsError}</div>
                      ) : (breakdowns.errors?.states && breakdowns.errors?.cities && !metaRankingLayers.some((layer) => layer.states.items.length)) ? (
                        <div className="ranking-empty">{breakdowns.errors.states || breakdowns.errors.cities}</div>
                      ) : !metaRankingLayers.some((layer) => layer.states.items.length) ? (
                        <div className="ranking-empty">Sem dados por estado suficientes para montar o ranking por resultado no período.</div>
                      ) : (
                        metaRankingLayers.map((layer) => (
                          <div key={`geo-layer-${layer.resultKey}`} className="meta-ranking-layer-section">
                            <div className="meta-ranking-layer-head">
                              <h3>{layer.states.title}</h3>
                              <p>{layer.states.description}</p>
                            </div>
                            <div className="geo-ranking-list-grid geo-ranking-list-grid-single">
                              <div className="geo-ranking-list-card glass-item">
                                <strong>{layer.states.title}</strong>
                                <div className="ranking-list">
                                  {layer.states.items.length === 0 ? (
                                    <div className="ranking-empty">{layer.states.emptyMessage}</div>
                                  ) : (
                                    layer.states.items.slice(0, 5).map((item, index) => (
                                      <button
                                        key={`${layer.resultKey}-state-${item.uf || item.label}-${index}`}
                                        type="button"
                                        className="ranking-row ranking-row-action meta-ranking-row geo-ranking-row"
                                        onClick={() => setMetaRankingDrilldown({ type: 'states', item, resultKey: layer.resultKey })}
                                      >
                                        <div className="age-ranking-main">
                                          <div className="age-ranking-position">#{index + 1}</div>
                                          <div className="ranking-main-column meta-ranking-main-column">
                                            <strong>{item.name || item.label}</strong>
                                            <span>{formatNumber(item.conversions)} {layer.resultLabel}</span>
                                          </div>
                                        </div>
                                        <div className="ranking-metrics meta-ranking-metrics">
                                          <b>{formatCurrency(item.averageCost)} / resultado</b>
                                          <span>{item.uf ? `UF ${item.uf}` : 'Estado'}</span>
                                          <small>Toque para comparar</small>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="glass-panel ranking-card meta-ranking-card">
                    <div className="section-header section-header-stack">
                      <div>
                        <h2>Top 5 por criativos</h2>
                        <p className="chart-subtitle">Camadas de criativos separadas pelo tipo de resultado ativo no topo do dashboard.</p>
                      </div>
                    </div>
                    <div className="meta-ranking-layer-stack">
                      {isRankingsLoading ? (
                        <div className="ranking-empty">Carregando ranking de criativos...</div>
                      ) : rankingsError ? (
                        <div className="ranking-empty">{rankingsError}</div>
                      ) : breakdowns.errors?.creatives ? (
                        <div className="ranking-empty">{breakdowns.errors.creatives}</div>
                      ) : !metaRankingLayers.some((layer) => layer.creatives.items.length) ? (
                        <div className="ranking-empty">Sem dados por criativo para os resultados ativos no período.</div>
                      ) : (
                        metaRankingLayers.map((layer) => (
                          <div key={`creatives-layer-${layer.resultKey}`} className="meta-ranking-layer-section">
                            <div className="meta-ranking-layer-head">
                              <h3>{layer.creatives.title}</h3>
                              <p>{layer.creatives.description}</p>
                            </div>
                            <div className="ranking-list">
                              {layer.creatives.items.length === 0 ? (
                                <div className="ranking-empty">{layer.creatives.emptyMessage}</div>
                              ) : (
                                layer.creatives.items.map((item, index) => (
                                  <button
                                    key={`${layer.resultKey}-${item.label}-${index}`}
                                    type="button"
                                    className="ranking-row ranking-row-action ranking-row-rich meta-ranking-row meta-ranking-row-rich"
                                    onClick={() => setMetaRankingDrilldown({ type: 'creatives', item, resultKey: layer.resultKey })}
                                  >
                                    <div className="creative-ranking-main">
                                      <div className="creative-thumb">
                                        {item.imageUrl ? (
                                          <>
                                            <img
                                              src={item.imageUrl}
                                              alt={item.label}
                                              onError={(event) => {
                                                event.currentTarget.hidden = true
                                                event.currentTarget.nextElementSibling.hidden = false
                                              }}
                                            />
                                            <span hidden>Sem imagem</span>
                                          </>
                                        ) : (
                                          <span>Sem imagem</span>
                                        )}
                                      </div>
                                      <div className="ranking-main-column meta-ranking-main-column">
                                        <strong>{item.label}</strong>
                                        <span>{formatNumber(item.conversions)} {layer.resultLabel}</span>
                                      </div>
                                    </div>
                                    <div className="ranking-metrics meta-ranking-metrics">
                                      <b>{formatCurrency(item.averageCost)} / resultado</b>
                                      <span>{formatCurrency(item.spend)} investidos</span>
                                      <small>Preview e comparativo</small>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="glass-panel ranking-card meta-ranking-card">
                    <div className="section-header section-header-stack">
                      <div>
                        <h2>Resultado por idade</h2>
                        <p className="chart-subtitle">Faixas etárias separadas pelo tipo de resultado ativo no topo do dashboard.</p>
                      </div>
                    </div>
                    <div className="meta-ranking-layer-stack">
                      {isRankingsLoading ? (
                        <div className="ranking-empty">Carregando ranking por idade...</div>
                      ) : rankingsError ? (
                        <div className="ranking-empty">{rankingsError}</div>
                      ) : breakdowns.errors?.ages ? (
                        <div className="ranking-empty">{breakdowns.errors.ages}</div>
                      ) : !metaRankingLayers.some((layer) => layer.ages.items.length) ? (
                        <div className="ranking-empty">Sem dados por idade para os resultados ativos no período.</div>
                      ) : (
                        metaRankingLayers.map((layer) => (
                          <div key={`ages-layer-${layer.resultKey}`} className="meta-ranking-layer-section">
                            <div className="meta-ranking-layer-head">
                              <h3>{layer.ages.title}</h3>
                              <p>{layer.ages.description}</p>
                            </div>
                            <div className="ranking-list">
                              {layer.ages.items.length === 0 ? (
                                <div className="ranking-empty">{layer.ages.emptyMessage}</div>
                              ) : (
                                layer.ages.items.map((item, index) => (
                                  <button
                                    key={`${layer.resultKey}-${item.label}-${index}`}
                                    type="button"
                                    className="ranking-row ranking-row-action meta-ranking-row age-ranking-row"
                                    onClick={() => setMetaRankingDrilldown({ type: 'ages', item, resultKey: layer.resultKey })}
                                  >
                                    <div className="age-ranking-main">
                                      <div className="age-ranking-position">#{index + 1}</div>
                                      <div className="ranking-main-column age-ranking-copy">
                                        <div className="meta-ranking-main-column age-ranking-title-row">
                                          <strong>{item.label}</strong>
                                          <span>{formatNumber(item.conversions)} {layer.resultLabel}</span>
                                        </div>
                                        <div className="age-ranking-bar-track" aria-hidden="true">
                                          <span className="age-ranking-bar-fill" style={{ width: `${item.intensity * 100}%` }}></span>
                                        </div>
                                        <small className="age-ranking-tag">{item.performanceLabel}</small>
                                      </div>
                                    </div>
                                    <div className="ranking-metrics meta-ranking-metrics age-ranking-metrics">
                                      <b>{formatCurrency(item.averageCost)} / resultado</b>
                                      <span>{formatPercent(item.conversionRateValue)} de conversão</span>
                                      <small>Toque para comparar</small>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                <section className="campaigns-section glass-panel">
                  <div className="section-header section-header-stack section-header-with-action">
                    <div>
                      <h2>Campanhas do cliente ({filteredCampaigns.length})</h2>
                      <p className="chart-subtitle">Tabela pronta para reunião, com base na conta Meta vinculada a {activeClient.name}.</p>
                    </div>
                    <div className="campaigns-section-actions">
                      <div className="campaigns-toolbar-row">
                        {activeDraftDashboardTemplate && (
                          <div className="campaign-column-controls">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setIsCampaignColumnLibraryOpen((current) => !current)}
                            >
                              <i className="bx bx-columns"></i>
                              Editar colunas
                            </button>
                          </div>
                        )}
                        <div className="campaign-filters">
                          <div className="search-box">
                            <i className="bx bx-search"></i>
                            <input type="text" placeholder="Buscar campanha" value={campaignSearch} onChange={(event) => setCampaignSearch(event.target.value)} />
                          </div>
                          <CustomSelect
                            options={[
                              { value: 'all', label: 'Todos os status' },
                              { value: 'ACTIVE', label: 'Ativas', color: '#26c281' },
                              { value: 'PAUSED', label: 'Pausadas', color: '#f59e0b' },
                              { value: 'ARCHIVED', label: 'Arquivadas', color: '#64748b' },
                            ]}
                            value={campaignStatusFilter}
                            onChange={setCampaignStatusFilter}
                            icon="bx-filter-alt"
                          />
                          <CustomSelect
                            options={campaignSortOptions.map(o => ({ value: o.value, label: o.label }))}
                            value={campaignSortBy}
                            onChange={setCampaignSortBy}
                            icon="bx-sort-down"
                          />
                        </div>
                      </div>
                      {activeDraftDashboardTemplate && isCampaignColumnLibraryOpen && (
                        <div className="metric-library-panel glass-item campaign-column-library">
                          <div>
                            <strong>Colunas da tabela</strong>
                            <p>Escolha as métricas que devem aparecer na tabela de campanhas deste modelo.</p>
                          </div>
                          <div className="campaign-column-grid">
                            {Object.entries(META_CAMPAIGN_TABLE_COLUMN_OPTIONS).map(([columnKey, column]) => {
                              const isSelected = draftMetaCampaignTableColumnKeys.includes(columnKey)
                              return (
                                <button
                                  key={columnKey}
                                  type="button"
                                  className={`metric-library-chip campaign-column-chip ${isSelected ? 'active' : ''}`}
                                  onClick={() => handleToggleMetaCampaignTableColumn(columnKey)}
                                >
                                  <span>{column.label}</span>
                                  <small>{column.description}</small>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Campanha</th>
                          {selectedMetaCampaignTableColumns.map((column) => (
                            <th key={`campaign-header-${column.key}`}>{column.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCampaigns.length === 0 ? (
                          <tr>
                            <td colSpan={2 + selectedMetaCampaignTableColumns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                              Nenhuma campanha encontrada para esse filtro.
                            </td>
                          </tr>
                        ) : (
                          filteredCampaigns.map((campaign, index) => {
                            const campaignMetrics = extractMetaCampaignMetrics(campaign)
                            const campaignSpend = campaignMetrics.spend
                            const campaignPurchases = campaignMetrics.purchases
                            const campaignLeads = campaignMetrics.leads
                            const campaignMessages = campaignMetrics.messages
                            const campaignCostPerPurchase = campaignMetrics.cost_per_purchase
                            const campaignCostPerLead = campaignMetrics.cost_per_lead
                            const campaignCostPerMessage = campaignMetrics.cost_per_message
                            const campaignConversions = campaignMetrics.totalConversions
                            const campaignCpa = campaignMetrics.cpa
                            const campaignRoas = campaignMetrics.roas
                            const isActive = campaign.status === 'ACTIVE'

                            return (
                              <tr key={campaign.id || index}>
                                <td>
                                  <span className={`status-badge ${isActive ? 'status-active' : 'status-paused'}`}>
                                    {isActive ? 'Ativa' : 'Pausada'}
                                  </span>
                                </td>
                                <td className="campaign-name">{campaign.name}</td>
                                {selectedMetaCampaignTableColumns.map((column) => {
                                  if (column.key === 'totalConversions') {
                                    return (
                                      <td key={`${campaign.id || index}-${column.key}`}>
                                        <strong>{formatNumber(campaignConversions)}</strong>
                                        <br />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                          {campaignPurchases} compras, {campaignLeads} leads, {campaignMessages} mensagens
                                        </span>
                                        <br />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                          CPA {formatCurrency(campaignCostPerPurchase)} · CPL {formatCurrency(campaignCostPerLead)} · CPMsg {formatCurrency(campaignCostPerMessage)}
                                        </span>
                                      </td>
                                    )
                                  }

                                  const metricValue = getCampaignMetricValue(campaign, column.key)
                                  return (
                                    <td
                                      key={`${campaign.id || index}-${column.key}`}
                                      style={column.key === 'roas' && metricValue >= 3 ? { color: 'var(--accent-emerald)' } : undefined}
                                    >
                                      {formatCampaignMetricValue(column.key, metricValue)}
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
                  </section>
                )}

                {hasGoogleAdsConfigured && (
                  <section className="source-section google-ads-source-section">
                    <div className="source-section-header">
                      <div className="source-section-badge" style={{ color: '#10b981', borderColor: '#10b981' }}>
                        <i className="bx bxl-google"></i>
                        <span>Google Ads</span>
                      </div>
                      <p className="source-section-copy">Leitura de investimento, tráfego e conversões da conta Google Ads vinculada a {activeClient.name}.</p>
                    </div>

                    <section className="glass-panel grouped-results google-ads-results">
                      <div className="section-header section-header-stack section-header-with-action">
                        <div>
                          <h2>Resumo do Google Ads</h2>
                          <p className="chart-subtitle">
                            Indicadores carregados da conta {selectedGoogleAdsAccount ? formatGoogleAdsAccountLabel(selectedGoogleAdsAccount) : 'selecionada'} no período atual.
                          </p>
                        </div>
                        {googleAdsSummary?.accountLabel && (
                          <span className="source-section-badge source-section-mini-badge" style={{ color: '#10b981', borderColor: '#10b981' }}>
                            {googleAdsSummary.accountLabel}
                          </span>
                        )}
                      </div>

                      {googleAdsError ? (
                        <div className="settings-callout error">{googleAdsError}</div>
                      ) : renderFixedKpiGrid(googleAdsKpis)}
                    </section>

                    <section className="campaigns-section glass-panel google-ads-campaigns-section">
                      <div className="section-header section-header-stack">
                        <div>
                          <h2>Campanhas Google Ads ({googleAdsCampaigns.length})</h2>
                          <p className="chart-subtitle">Tabela resumida por campanha, ordenada pelo maior investimento do período.</p>
                        </div>
                      </div>
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Status</th>
                              <th>Campanha</th>
                              <th>Investimento</th>
                              <th>Impressões</th>
                              <th>Cliques</th>
                              <th>CPC</th>
                              <th>CTR</th>
                              <th>Conversões</th>
                              <th>Custo/conv.</th>
                              <th>ROAS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {googleAdsCampaigns.length === 0 ? (
                              <tr>
                                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                  Nenhuma campanha com investimento ou entrega encontrada nesse período.
                                </td>
                              </tr>
                            ) : (
                              googleAdsCampaigns.map((campaign, index) => (
                                <tr key={campaign.id || index}>
                                  <td>
                                    <span className={`status-badge ${campaign.status === 'ENABLED' ? 'status-active' : 'status-paused'}`}>
                                      {campaign.status === 'ENABLED' ? 'Ativa' : campaign.status || 'Sem status'}
                                    </span>
                                  </td>
                                  <td className="campaign-name">{campaign.name}</td>
                                  <td>{formatCurrency(campaign.spend || 0)}</td>
                                  <td>{formatNumber(campaign.impressions || 0)}</td>
                                  <td>{formatNumber(campaign.clicks || 0)}</td>
                                  <td>{formatCurrency(campaign.cpc || 0)}</td>
                                  <td>{formatPercent(campaign.ctr || 0)}</td>
                                  <td>{formatDashboardMetricValue(campaign.conversions || 0, 'decimal')}</td>
                                  <td>{formatCurrency(campaign.costPerConversion || 0)}</td>
                                  <td style={(campaign.roas || 0) >= 3 ? { color: 'var(--accent-emerald)' } : undefined}>{formatMultiplier(campaign.roas || 0)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  </section>
                )}

                {hasSheetsConfigured && (
                  <section className="source-section">
                    <div className="source-section-header">
                      <div className="source-section-badge" style={{ color: '#22c55e', borderColor: '#22c55e' }}>
                        <i className="bx bx-spreadsheet"></i>
                        <span>Google Sheets</span>
                      </div>
                      <p className="source-section-copy">Leitura personalizada da planilha vinculada a este cliente, transformando colunas em cards do dashboard.</p>
                    </div>

                    <section className="glass-panel grouped-results">
                      <div className="section-header section-header-stack section-header-with-action">
                        <div>
                          <h2>Resumo da planilha</h2>
                          <p className="chart-subtitle">
                            Cada linha da planilha é tratada como um registro. A coluna de status funciona como pipeline e as colunas numéricas podem virar cards extras.
                          </p>
                        </div>
                        {activeDraftDashboardTemplate && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setIsSheetsMetricLibraryOpen((current) => !current)}
                            disabled={!availableGoogleSheetsMetricOptions.length}
                          >
                            <i className="bx bx-plus"></i>
                            Adicionar métrica
                          </button>
                        )}
                      </div>

                      {googleSheetsDashboardMetricCards.length > 0
                        ? renderDashboardMetricGrid(googleSheetsDashboardMetricCards, 'sheets')
                        : defaultGoogleSheetsKpis.length > 0
                          ? renderFixedKpiGrid(defaultGoogleSheetsKpis)
                          : (
                            <div className="ranking-empty">
                              A planilha foi lida, mas ainda não encontramos colunas numéricas para transformar em cards.
                            </div>
                          )}

                      {isSheetsMetricLibraryOpen && (
                        <div className="metric-library-panel glass-item">
                          <div>
                            <strong>Métricas do Google Sheets</strong>
                            <p>Adicione contagem total de registros, etapas do status e colunas numéricas da planilha como cards do modelo atual.</p>
                          </div>
                          <div className="metric-library-list">
                            {availableGoogleSheetsMetricOptions.length > 0 ? (
                              availableGoogleSheetsMetricOptions.map(([metricKey, metric]) => (
                                <button
                                  key={metricKey}
                                  type="button"
                                  className="metric-library-chip"
                                  onClick={() => handleAddSheetsDashboardMetric(metricKey)}
                                >
                                  <span>{metric.label}</span>
                                  <small>{metric.description}</small>
                                </button>
                              ))
                            ) : (
                              <div className="metric-library-empty">Todas as colunas numéricas da planilha já estão visíveis neste modelo.</div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="glass-panel sheets-preview-card">
                        <div className="section-header section-header-stack">
                          <div>
                            <h2>Preview da planilha</h2>
                            <p className="chart-subtitle">
                              {googleSheetsSummary?.totalRows
                                ? `${formatNumber(googleSheetsSummary.totalRows)} linha(s) lida(s) da planilha configurada para ${activeClient.name}.`
                                : 'Assim que a planilha responder, o preview aparece aqui.'}
                            </p>
                          </div>
                        </div>
                        {googleSheetsError ? (
                          <div className="settings-alert error">
                            {googleSheetsError}
                          </div>
                        ) : null}
                        {googleSheetsSummary?.statusSummary?.counts?.length > 0 && (
                          <div className="glass-item rd-diagnostic-panel">
                            <p className="meta-campaign-filter-note">
                              Pipeline da planilha pela coluna <b>{googleSheetsSummary.statusSummary.header}</b>.
                            </p>
                            <div className="pipeline-columns-grid">
                              {googleSheetsSummary.statusSummary.counts.map((status) => (
                                <div key={status.id} className="pipeline-column-card glass-item">
                                  <div>
                                    <strong>{status.label}</strong>
                                    <span>{formatNumber(status.count)} registro(s)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {googleSheetsSummary?.previewRows?.length ? (
                          <div className="table-container">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  {(googleSheetsSummary.headers || []).map((header) => (
                                    <th key={header}>{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {googleSheetsSummary.previewRows.map((row) => (
                                  <tr key={row.id}>
                                    {row.cells.map((cell) => (
                                      <td key={cell.key}>{cell.value || '-'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="ranking-empty">
                            Nenhuma linha de preview disponível. Verifique se a planilha tem cabeçalho e dados abaixo da linha informada.
                          </div>
                        )}
                      </div>
                    </section>
                  </section>
                )}


                {hasRdConfigured && (
                  <section className="source-section">
                    <div className="source-section-header">
                      <div className="source-section-badge" style={{ color: '#14b8a6', borderColor: '#14b8a6' }}>
                        <i className="bx bx-signal-5"></i>
                        <span>{crmSourceLabel}</span>
                      </div>
                      <p className="source-section-copy">Em seguida, entram os indicadores comerciais e de CRM vinculados ao cliente.</p>
                    </div>
                    {!activeClientUsesManualCrm && (
                      <div className="rd-crm-filter-panel">
                        <div className="rd-crm-filter-field">
                          <label>Funil</label>
                          <div className="hero-select-wrap">
                            <select value={draftRdPipelineFilter} onChange={(event) => setDraftRdPipelineFilter(event.target.value)} className="hero-select">
                              <option value="">Todos os funis</option>
                              {rdPipelineOptions.map((pipeline) => (
                                <option key={pipeline.id} value={pipeline.id}>
                                  {pipeline.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="rd-crm-filter-field">
                          <label>Vendedor</label>
                          <div className="hero-select-wrap">
                            <select value={draftRdSellerFilter} onChange={(event) => setDraftRdSellerFilter(event.target.value)} className="hero-select">
                              <option value="all">Todos os vendedores</option>
                              {(rdSummary?.sellers || []).map((seller) => (
                                <option key={seller.id} value={seller.id}>
                                  {seller.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  <section className="glass-panel grouped-results">
                      <div className="section-header section-header-stack section-header-with-action">
                        <div>
                          <h2>Resumo comercial</h2>
                          <p className="chart-subtitle">Os indicadores abaixo resumem o desempenho comercial identificado no {crmSourceLabel} para este cliente.</p>
                        </div>
                      </div>

                      <div className="template-metrics-shell">
                        {!!rdSummary?.availableSources?.length && (
                          <div className="meta-campaign-filter-collapsible rd-source-filter-collapsible">
                            <button
                              type="button"
                              className={`meta-campaign-filter-trigger ${isRdSourceFilterOpen ? 'open' : ''}`}
                              onClick={() => setIsRdSourceFilterOpen((current) => !current)}
                            >
                              <div>
                                <h3>Filtrar por origem</h3>
                                <p>{rdLeadSourceFilterSummary}</p>
                              </div>
                              <span className="meta-campaign-filter-trigger-icon">
                                <i className={`bx ${isRdSourceFilterOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                              </span>
                            </button>
                            {isRdSourceFilterOpen && (
                              <div className="rd-source-filter-bar rd-source-filter-inline">
                                <div>
                                  <p>Selecione as origens e UTMs que quer considerar na base das oportunidades, qualificação e conversão.</p>
                                </div>
                                <div className="rd-source-list">
                                  {rdSummary.availableSources.map((source) => (
                                    <label
                                      key={source}
                                      className={`result-filter-chip rd-source-list-item ${activeDraftRdLeadSources.includes(source) ? 'active' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={activeDraftRdLeadSources.includes(source)}
                                        onChange={() => handleRdLeadSourceToggle(source)}
                                      />
                                      <span>{source}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="crm-groups-grid">
                          <section className="crm-result-group crm-result-group-wide">
                            <div className="result-group-head">
                              <h3>Funil Meta + Agendor</h3>
                              <p>Leitura por safra: leads gerados no Meta e negócios criados no Agendor dentro do mesmo período selecionado.</p>
                            </div>
                            {renderFixedKpiGrid(rdAgendorFunnelKpis, { threeColumns: true })}
                          </section>
                        </div>

                        {rdSummary?.diagnostics && (
                          <div className="meta-campaign-filter-collapsible rd-diagnostics-collapsible">
                            <button
                              type="button"
                              className={`meta-campaign-filter-trigger ${isRdDiagnosticsOpen ? 'open' : ''}`}
                              onClick={() => setIsRdDiagnosticsOpen((current) => !current)}
                            >
                              <div>
                                <h3>Como as negociações estão sendo filtradas</h3>
                                <p>{rdDiagnosticsSummary}</p>
                              </div>
                              <span className="meta-campaign-filter-trigger-icon">
                                <i className={`bx ${isRdDiagnosticsOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
                              </span>
                            </button>
                            {isRdDiagnosticsOpen && (
                              <div className="rd-source-filter-bar rd-source-filter-inline rd-diagnostic-panel">
                                <p className="meta-campaign-filter-note">
                                  Esses números mostram em que etapa as negociações do RD estão sendo reduzidas antes de entrar nos cards finais.
                                </p>
                                <div className="rd-diagnostic-grid">
                                  <div className="conversion-stat">
                                    <span>Negociações recebidas do RD</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.allDeals?.totalDeals || 0)}</strong>
                                  </div>
                                  <div className="conversion-stat">
                                    <span>Negociações após o funil atual</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.pipelineDeals?.totalDeals || 0)}</strong>
                                  </div>
                                  <div className="conversion-stat">
                                    <span>Ganhas reconhecidas em todos os vendedores</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.allDeals?.wonClassified || 0)}</strong>
                                  </div>
                                  <div className="conversion-stat">
                                    <span>Ganhas no período após o funil atual</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.pipelineDeals?.wonClosedInRange || 0)}</strong>
                                  </div>
                                  <div className="conversion-stat">
                                    <span>Ganhas fechadas no período em todos os vendedores</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.allDeals?.wonClosedInRange || 0)}</strong>
                                  </div>
                                  <div className="conversion-stat">
                                    <span>Ganhas fechadas no período após filtro atual</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.filteredDeals?.wonClosedInRange || 0)}</strong>
                                  </div>
                                  <div className="conversion-stat">
                                    <span>Ganhas fora do período</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.filteredDeals?.wonClosedOutOfRange || 0)}</strong>
                                  </div>
                                  <div className="conversion-stat">
                                    <span>Ganhas sem data de fechamento</span>
                                    <strong>{formatNumber(rdSummary.diagnostics.filteredDeals?.wonWithoutCloseDate || 0)}</strong>
                                  </div>
                                </div>
                                <div className="rd-diagnostic-meta">
                                  <span>Filtro de funil: <b>{rdSummary.diagnostics.pipelineFilterApplied ? rdAppliedPipelineSummary : 'Todos os funis'}</b></span>
                                  <span>Filtro de vendedor: <b>{rdSummary.diagnostics.sellerFilterApplied ? 'Aplicado' : 'Todos os vendedores'}</b></span>
                                  <span>Filtro de origem: <b>{rdSummary.diagnostics.leadSourceFilterApplied ? 'Aplicado' : 'Nao afeta este bloco'}</b></span>
                                  <span>Filtro de etapas qualificadas: <b>{rdSummary.diagnostics.qualifiedStageFilterApplied ? 'Aplicado' : 'Nao afeta este bloco'}</b></span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </section>

                    {!!rdSummary?.sellerRanking?.length && (
                      <section className="glass-panel grouped-results">
                        <div className="section-header section-header-stack">
                          <div>
                            <h2>Destaque por vendedor</h2>
                            <p className="chart-subtitle">Ranking com base em receita ganha e negócios fechados na operação comercial.</p>
                          </div>
                        </div>

                        <div className="ranking-list">
                          {rdSummary.sellerRanking.map((seller) => (
                            <div key={seller.id} className="ranking-row">
                              <div>
                                <strong>{seller.name}</strong>
                                <span>
                                  {formatNumber(seller.wonDeals)} ganhos, {formatNumber(seller.openDeals)} em aberto, {formatNumber(seller.lostDeals)} perdidos
                                </span>
                              </div>
                              <b>{formatCurrency(seller.wonRevenue)}</b>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                  </section>
                )}
              </>
            )}
          </div>
        )}
        {hasPendingDashboardFilters && (
          <button
            type="button"
            className="floating-filter-apply"
            onClick={handleApplyDashboardFilters}
            disabled={isApplyDashboardFiltersDisabled}
          >
            Aplicar filtro
          </button>
        )}

        {isManualCrmModalOpen && activeClientUsesManualCrm && typeof document !== 'undefined' && createPortal(
          <div className="modal-overlay" onClick={() => setIsManualCrmModalOpen(false)}>
            <div className="modal-card glass-panel" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', borderBottom: '1px solid rgba(38,194,129,0.12)', padding: '20px 24px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div>
                  <h3>Dados manuais do CRM</h3>
                  <p>Preencha os números comerciais para este cliente quando o Agendor não estiver conectado.</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setIsManualCrmModalOpen(false)} aria-label="Fechar modal de CRM manual">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <form className="client-editor-card modal-client-editor" onSubmit={handleSaveManualCrm}>
                <div className="client-form-grid client-form-grid-2">
                  <div className="input-group">
                    <label>Oportunidades</label>
                    <input type="number" min="0" value={manualCrmForm.opportunityCount} onChange={(event) => setManualCrmForm((current) => ({ ...current, opportunityCount: event.target.value }))} placeholder="0" />
                  </div>
                  <div className="input-group">
                    <label>Qualificados</label>
                    <input type="number" min="0" value={manualCrmForm.qualifiedOpportunityCount} onChange={(event) => setManualCrmForm((current) => ({ ...current, qualifiedOpportunityCount: event.target.value }))} placeholder="0" />
                  </div>
                  <div className="input-group">
                    <label>Vendas</label>
                    <input type="number" min="0" value={manualCrmForm.wonOpportunityCount} onChange={(event) => setManualCrmForm((current) => ({ ...current, wonOpportunityCount: event.target.value }))} placeholder="0" />
                  </div>
                </div>

                <div className="input-group">
                  <label>Valor vendido</label>
                  <input type="number" min="0" step="0.01" value={manualCrmForm.wonRevenue} onChange={(event) => setManualCrmForm((current) => ({ ...current, wonRevenue: event.target.value }))} placeholder="0,00" />
                  <span className="field-helper">O ROAS comercial será calculado automaticamente com base no investimento Meta do período selecionado.</span>
                </div>

                <div className="client-editor-header">
                  <div>
                    <h3>Salvar no dashboard</h3>
                    <p>Esses valores entram no mesmo visual do CRM e recalculam as taxas automaticamente.</p>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSavingManualCrm}>
                    {isSavingManualCrm ? 'Salvando...' : 'Salvar dados manuais'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {isDashboardEntryModalOpen && dashboardEligibleClients.length > 1 && (
          <div className="modal-overlay" onClick={() => setIsDashboardEntryModalOpen(false)}>
            <div className="modal-card glass-panel dashboard-entry-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Selecionar dashboard</h3>
                  <p>Escolha qual dashboard você quer abrir nesta entrada.</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setIsDashboardEntryModalOpen(false)} aria-label="Fechar seleção de dashboard">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <div className="dashboard-entry-content">
                <div className="date-picker glass-item dashboard-entry-picker">
                  <i className="bx bx-user-pin"></i>
                  <select value={dashboardEntryClientId} onChange={(event) => setDashboardEntryClientId(event.target.value)}>
                    {dashboardEligibleClients.map((client) => (
                      <option key={`entry-${client.id}`} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsDashboardEntryModalOpen(false)}>
                    Agora não
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleConfirmDashboardEntry} disabled={!dashboardEntryClientId}>
                    Abrir dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  )
}
