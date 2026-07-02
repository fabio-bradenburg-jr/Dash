'use client'

import { createPortal } from 'react-dom'
import { Bar, Line } from 'react-chartjs-2'
import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function SemanalTab() {
  const {
    ALL_FILLED_WEEK_PERIODS,
    WEEKLY_HEALTH_BY_KEY,
    WEEKLY_HEALTH_OPTIONS,
    WEEKLY_PERIOD_OPTIONS,
    activeClientDashboardHex,
    clientsById,
    dashboardEligibleClients,
    formatCurrency,
    formatNumber,
    formatWeekRangeLabel,
    getMondayDateInputValue,
    handleDeleteSelectedWeeklyRecords,
    handleExportWeeklyTable,
    handleToggleWeeklyDeleteMode,
    handleToggleWeeklyHistoryCardSelection,
    handleWeeklyTableSort,
    isChurnListOpen,
    setIsChurnListOpen,
    isDeletingWeeklyRecords,
    isLightAppMode,
    isWeeklyDeleteMode,
    isWeeklyEntryModalOpen,
    setIsWeeklyEntryModalOpen,
    isWeeklyHistoryModalOpen,
    setIsWeeklyHistoryModalOpen,
    isWeeklyLoading,
    selectedWeeklyRecordIds,
    setWeeklyChartClientFilter,
    setWeeklyClientFilter,
    setWeeklyCustomSince,
    setWeeklyCustomUntil,
    setWeeklyFilledWeekStart,
    setWeeklyMonthFilter,
    setWeeklyPeriodPreset,
    setWeeklySuccessMessage,
    setWeeklyTableHealthFilter,
    setWeeklyTableSort,
    setWeeklyWeekStart,
    weeklyBarOptions,
    weeklyChartClientFilter,
    weeklyChartClientRows,
    weeklyChartOptions,
    weeklyClientFilter,
    weeklyCustomSince,
    weeklyCustomUntil,
    weeklyFilledWeekOptions,
    weeklyFilledWeekStart,
    weeklyFormContent,
    weeklyHealthChartData,
    weeklyHealthRiskTarget,
    weeklyHistoryCards,
    weeklyLatestRecords,
    weeklyLineChartData,
    weeklyLineChartRecords,
    weeklyModalCardStyle,
    weeklyModalCloseStyle,
    weeklyModalOverlayStyle,
    weeklyMonthFilter,
    weeklyPeriodPreset,
    weeklyPeriodWindow,
    weeklyPortfolioStats,
    weeklySelectedChartClientName,
    weeklySuccessMessage,
    weeklySummary,
    weeklyTableColumns,
    weeklyTableHealthFilter,
    weeklyTableRecords,
    weeklyTableSort,
    weeklyVisibleRecords,
  } = useDashboard()

  return (
    <section className="weekly-dashboard-panel">
      <div className="weekly-command-center glass-panel" style={{ borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="weekly-command-heading">
          <span className="management-hero-kicker"><i className="bx bx-pulse" style={{ marginRight: 5 }}></i>Operação semanal</span>
          <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Controle da Operação</h2>
          <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Leitura executiva da semana, saúde da carteira e custos de aquisição por cliente em uma rotina de segunda a domingo.</p>
        </div>

        {/* Churn card — grid-column 1, grid-row 2, aligns with weekly-command-grid */}
        {(() => {
          const hasChurn = weeklyPortfolioStats.churnedThisMonthCount > 0
          const color = hasChurn ? '#ef4444' : '#10b981'
          const bg = hasChurn ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'
          const border = hasChurn ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'
          const churnClients = (weeklyPortfolioStats.churnClientIdsList || []).map((id) => clientsById.get(id)).filter(Boolean)
          return (
            <div style={{
              gridColumn: 1, gridRow: 2,
              padding: '18px 20px', borderRadius: 16,
              border: `1.5px solid ${border}`, background: bg,
              display: 'flex', flexDirection: 'column', gap: 8,
              alignSelf: 'center', margin: '0 12px 12px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <i className={hasChurn ? 'bx bx-user-minus' : 'bx bx-user-check'} style={{ fontSize: '1.1rem' }}></i>
                  Churn do mês
                </div>
                {hasChurn && (
                  <button
                    type="button"
                    onClick={() => setIsChurnListOpen((v) => !v)}
                    style={{
                      width: 32, height: 32, borderRadius: '999px',
                      border: '1px solid rgba(239,68,68,0.35)',
                      background: 'rgba(239,68,68,0.12)',
                      display: 'grid', placeItems: 'center',
                      cursor: 'pointer', color: '#ef4444', fontSize: 16,
                      transition: 'background 0.15s, border-color 0.15s',
                      flexShrink: 0,
                    }}
                    title={isChurnListOpen ? 'Fechar lista' : 'Ver clientes em churn'}
                  >
                    <i className={isChurnListOpen ? 'bx bx-chevron-up' : 'bx bx-chevron-down'}></i>
                  </button>
                )}
              </div>
              <div style={{ fontSize: 'clamp(2.2rem,3.5vw,3rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: isLightAppMode ? '#0f172a' : '#f8fafc' }}>
                {weeklyPortfolioStats.monthlyChurnRate == null ? '—' : weeklyPortfolioStats.monthlyChurnRate.toFixed(1) + '%'}
              </div>
              <div style={{ fontSize: '0.88rem', color: isLightAppMode ? '#475569' : 'rgba(148,163,184,0.85)', lineHeight: 1.5 }}>
                <strong style={{ color: isLightAppMode ? '#0f172a' : '#f8fafc' }}>{weeklyPortfolioStats.churnedThisMonthCount}</strong> cliente{weeklyPortfolioStats.churnedThisMonthCount !== 1 ? 's' : ''} em churn
                {' '}de{' '}
                <strong style={{ color: isLightAppMode ? '#0f172a' : '#f8fafc' }}>{weeklyPortfolioStats.activeAtStartOfMonth}</strong> ativos no início do mês
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, color, fontWeight: 700, fontSize: '0.85rem' }}>
                <i className={hasChurn ? 'bx bx-error-circle' : 'bx bx-check-circle'} style={{ fontSize: '1rem' }}></i>
                {hasChurn ? `${weeklyPortfolioStats.churnedThisMonthCount} churn este mês` : 'Nenhum churn este mês'}
              </div>
              {isChurnListOpen && hasChurn && churnClients.length > 0 && (
                <div style={{
                  marginTop: 4, borderTop: '1px solid rgba(239,68,68,0.2)',
                  paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {churnClients.map((client) => (
                    <div key={client.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {client.logoUrl
                        ? <img src={client.logoUrl} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(239,68,68,0.25)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 10, color: '#ef4444', fontWeight: 800 }}>{String(client.name || '?')[0].toUpperCase()}</span>
                      }
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isLightAppMode ? '#1e293b' : '#f1f5f9' }}>{client.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
        <div className="weekly-command-filters">
          <label>
            <span>Carteira</span>
            <select value={weeklyClientFilter} onChange={(event) => setWeeklyClientFilter(event.target.value)}>
              <option value="all">Todos os clientes</option>
              {dashboardEligibleClients.map((client) => (
                <option key={'weekly-filter-' + client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Janela</span>
            <select value={weeklyPeriodPreset} onChange={(event) => setWeeklyPeriodPreset(event.target.value)}>
              {WEEKLY_PERIOD_OPTIONS.map((option) => (
                <option key={'weekly-period-' + option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {weeklyPeriodPreset === 'custom' && (
            <div className="weekly-custom-range-fields">
              <label>
                <span>Início</span>
                <input type="date" value={weeklyCustomSince} onChange={(event) => setWeeklyCustomSince(event.target.value)} />
              </label>
              <label>
                <span>Fim</span>
                <input type="date" value={weeklyCustomUntil} onChange={(event) => setWeeklyCustomUntil(event.target.value)} />
              </label>
            </div>
          )}
          {weeklyPeriodPreset === 'month' && (
            <label>
              <span>Mês</span>
              <input type="month" value={weeklyMonthFilter} onChange={(event) => setWeeklyMonthFilter(event.target.value)} />
            </label>
          )}
          {weeklyPeriodPreset === 'filled' && (
            <label>
              <span>Semana preenchida</span>
              <select value={weeklyFilledWeekStart} onChange={(event) => setWeeklyFilledWeekStart(event.target.value)} disabled={!weeklyFilledWeekOptions.length}>
                {weeklyFilledWeekOptions.length ? (
                  <>
                    <option value={ALL_FILLED_WEEK_PERIODS}>Todos os períodos preenchidos</option>
                    {weeklyFilledWeekOptions.map((option) => (
                      <option key={'weekly-filled-week-' + option.value} value={option.value}>{option.label}</option>
                    ))}
                  </>
                ) : (
                  <option value="">Nenhuma semana preenchida</option>
                )}
              </select>
            </label>
          )}
        </div>
        <div className="weekly-command-grid">
          <div className="weekly-command-rail">
            <div>
              <span>Clientes monitorados</span>
              <strong>{formatNumber(weeklyPortfolioStats.monitoredClients)}</strong>
            </div>
            <div>
              <span>Registros no filtro</span>
              <strong>{formatNumber(weeklyPortfolioStats.recordsCount)}</strong>
            </div>
            <div>
              <span>Clientes totais na base</span>
              <strong>{formatNumber(weeklyPortfolioStats.activeBaseClientsCount)}</strong>
            </div>
          </div>
          <div className="weekly-command-primary">
            <div>
              <span>Período ativo</span>
              <strong>{weeklyPeriodWindow.label}</strong>
              <small>{weeklyPortfolioStats.latestWeekLabel}</small>
            </div>
            <button type="button" className="btn btn-primary weekly-entry-button" onClick={() => { setWeeklySuccessMessage(''); setIsWeeklyEntryModalOpen(true) }} style={{ background: activeClientDashboardHex, borderColor: activeClientDashboardHex }}>
              <i className="bx bx-plus"></i>
              Cadastrar dados
            </button>
          </div>
        </div>
      </div>

      {weeklySuccessMessage && (
        <div
          className="form-success weekly-success"
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 18px',
            borderRadius: 18,
            border: '1px solid ' + activeClientDashboardHex + '66',
            background: activeClientDashboardHex + '18',
            color: 'var(--text-primary)',
            boxShadow: '0 18px 50px rgba(0,0,0,.18)',
          }}
        >
          <i className="bx bx-check-circle" style={{ color: activeClientDashboardHex, fontSize: 22 }}></i>
          <strong>{weeklySuccessMessage}</strong>
        </div>
      )}

      <div className="weekly-focus-strip weekly-goal-card glass-panel">
        <div className="weekly-goal-copy">
          <span className="eyebrow weekly-icon-label"><i className="bx bx-target-lock"></i>Meta operacional</span>
          <h2>{weeklyClientFilter === 'all' ? 'Visão consolidada da carteira' : clientsById.get(weeklyClientFilter)?.name || 'Cliente selecionado'}</h2>
          <p>O objetivo do time é manter Crítico + Atenção em até {formatNumber(weeklyHealthRiskTarget)}% da carteira. Ajuste essa meta nas configurações.</p>
        </div>
        <div className="weekly-risk-breakdown">
          <div><span>Integração</span><strong>{formatNumber(weeklyPortfolioStats.integrationCount)}</strong></div>
          <div><span>Crítico</span><strong>{formatNumber(weeklyPortfolioStats.criticalCount)}</strong></div>
          <div><span>Atenção</span><strong>{formatNumber(weeklyPortfolioStats.attentionCount)}</strong></div>
          <div><span>Saudável</span><strong>{formatNumber(weeklyPortfolioStats.healthyCount)}</strong></div>
          <div><span>Com resultado</span><strong>{formatNumber(weeklyPortfolioStats.withResultCount)}</strong></div>
          <div><span>Churn</span><strong>{formatNumber(weeklyPortfolioStats.churnCount)}</strong></div>
        </div>
        <div className={'weekly-risk-badge weekly-goal-badge ' + (weeklySummary.withinRiskTarget ? 'healthy' : 'critical')}>
          <span><i className="bx bx-error-circle"></i>Crítico + Atenção</span>
          <strong>{weeklySummary.healthCount ? formatNumber(weeklySummary.riskPercent) + '%' : '-'}</strong>
          <small>{weeklySummary.healthCount ? (weeklySummary.withinRiskTarget ? 'Dentro da meta' : 'Acima da meta') : 'Sem dados no período'}</small>
        </div>
      </div>

      <div className="weekly-health-overview">
        <div className="weekly-chart-card glass-panel">
          <div className="section-header section-header-stack">
            <div>
              <span className="eyebrow weekly-icon-label"><i className="bx bx-heart-circle"></i>Saúde</span>
              <h2>{weeklyClientFilter === 'all' ? 'Distribuição da saúde' : 'Mudança de saúde do cliente'}</h2>
              <p className="chart-subtitle">{weeklyClientFilter === 'all' ? 'Barras por status na semana selecionada.' : 'Barras por semana para acompanhar a evolução do cliente.'}</p>
            </div>
          </div>
          <div className="weekly-chart-body weekly-chart-body-small">
            {weeklyVisibleRecords.length ? <Bar data={weeklyHealthChartData} options={weeklyBarOptions} /> : <div className="ranking-empty">Sem saúde registrada ainda.</div>}
          </div>
        </div>
        <div className="weekly-kpi-grid weekly-kpi-grid-wide weekly-kpi-board">
          <div className="weekly-kpi-card glass-panel"><span><i className="bx bx-pulse"></i>Saúde média do período</span><strong>{weeklySummary.averageHealthLabel}</strong></div>
          <div className="weekly-kpi-card glass-panel"><span><i className="bx bx-wallet"></i>Investimento</span><strong>{formatCurrency(weeklySummary.investment)}</strong></div>
          <div className="weekly-kpi-card glass-panel"><span><i className="bx bx-user-plus"></i>Leads</span><strong>{formatNumber(weeklySummary.leads)}</strong></div>
          <div className="weekly-kpi-card glass-panel"><span><i className="bx bx-purchase-tag-alt"></i>CPL médio</span><strong>{weeklySummary.leads > 0 ? formatCurrency(weeklySummary.cpl) : '-'}</strong></div>
          <div className="weekly-kpi-card glass-panel"><span><i className="bx bx-filter-alt"></i>SQL</span><strong>{formatNumber(weeklySummary.sql)}</strong></div>
          <div className="weekly-kpi-card glass-panel"><span><i className="bx bx-credit-card"></i>Custo SQL</span><strong>{weeklySummary.sql > 0 ? formatCurrency(weeklySummary.costPerSql) : '-'}</strong></div>
        </div>
      </div>

      <div className="weekly-records-card glass-panel weekly-table-card" style={{ padding: '52px 64px' }}>
        <div className="weekly-table-toolbar" style={{ marginBottom: 56 }}>
          <div className="weekly-table-actions">
            <div className="weekly-table-filters">
              <label>
                <span><i className="bx bx-heart"></i>Saúde</span>
                <select value={weeklyTableHealthFilter} onChange={(event) => setWeeklyTableHealthFilter(event.target.value)}>
                  <option value="all">Todos os Status</option>
                  {WEEKLY_HEALTH_OPTIONS.map((option) => (
                    <option key={'weekly-table-health-' + option.key} value={option.key}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="weekly-export-actions">
              <button
                type="button"
                className="weekly-export-button weekly-export-button-outline"
                onClick={() => setIsWeeklyHistoryModalOpen(true)}
                style={{
                  minHeight: 42,
                  border: `1px solid ${activeClientDashboardHex}cc`,
                  borderRadius: 6,
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: activeClientDashboardHex,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0 18px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className="bx bx-history"></i>
                Ver histórico
              </button>
              <button
                type="button"
                className="weekly-export-button weekly-export-button-outline"
                onClick={() => handleExportWeeklyTable('csv')}
                disabled={!weeklyTableRecords.length}
                style={{
                  minHeight: 42,
                  border: `1px solid ${activeClientDashboardHex}cc`,
                  borderRadius: 6,
                  background: 'rgba(0, 0, 0, 0.12)',
                  color: activeClientDashboardHex,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0 18px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className="bx bx-download"></i>
                Exportar CSV
              </button>
              <button
                type="button"
                className="weekly-export-button"
                onClick={() => handleExportWeeklyTable('pdf')}
                disabled={!weeklyTableRecords.length}
                style={{
                  minHeight: 42,
                  border: `1px solid ${activeClientDashboardHex}cc`,
                  borderRadius: 6,
                  background: activeClientDashboardHex,
                  color: '#071006',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '0 18px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                <i className="bx bx-file"></i>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
        <div className="weekly-table-title-row" style={{ marginBottom: 28 }}>
          <div>
            <h2><i className="bx bx-table"></i>Tabela de Acompanhamento</h2>
            <p className="chart-subtitle">Visualize exatamente o que foi imputado no período selecionado, com filtro por cliente e saúde.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setWeeklyTableSort(current =>
                current.key === 'date'
                  ? { key: 'date', direction: current.direction === 'asc' ? 'desc' : 'asc' }
                  : { key: 'date', direction: 'asc' }
              )}
              title={weeklyTableSort.key === 'date' && weeklyTableSort.direction === 'desc' ? 'Mais recente → Mais antigo' : 'Mais antigo → Mais recente'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: '1px solid',
                borderColor: weeklyTableSort.key === 'date' ? 'rgba(38,194,129,0.5)' : 'rgba(255,255,255,0.12)',
                background: weeklyTableSort.key === 'date' ? 'rgba(38,194,129,0.1)' : 'transparent',
                color: weeklyTableSort.key === 'date' ? '#26c281' : '#94a3b8',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              <i className={`bx ${weeklyTableSort.key === 'date' && weeklyTableSort.direction === 'desc' ? 'bx-sort-down' : 'bx-sort-up'}`} style={{ fontSize: 16 }} />
              {weeklyTableSort.key === 'date' && weeklyTableSort.direction === 'desc' ? 'Mais recente' : 'Mais antigo'}
            </button>
            <span className="weekly-updated-pill"><i className="bx bx-time-five"></i>Atualizado há 15 min</span>
          </div>
        </div>
        {weeklyTableRecords.length ? (
          <div className="weekly-table-scroll">
            <table className="weekly-data-table">
              <thead>
                <tr>
                  {weeklyTableColumns.map((column) => {
                    const isSorted = weeklyTableSort.key === column.key
                    const sortLabel = isSorted
                      ? `Ordenado ${weeklyTableSort.direction === 'asc' ? 'crescente' : 'decrescente'}`
                      : 'Ordenar coluna'
                    return (
                      <th key={'weekly-table-column-' + column.key} aria-sort={isSorted ? (weeklyTableSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                        <button
                          type="button"
                          className={'weekly-table-sort-button ' + (isSorted ? 'is-active' : '')}
                          onClick={() => handleWeeklyTableSort(column.key)}
                          aria-label={`${sortLabel}: ${column.label}`}
                        >
                          <span><i className={'bx ' + column.icon}></i>{column.label}</span>
                          <i className={'bx ' + (isSorted ? (weeklyTableSort.direction === 'asc' ? 'bx-chevron-up' : 'bx-chevron-down') : 'bx-sort-alt-2')} aria-hidden="true"></i>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {weeklyTableRecords.map((record) => {
                  const client = clientsById.get(record.clientId)
                  const health = WEEKLY_HEALTH_BY_KEY[record.healthStatus] || WEEKLY_HEALTH_BY_KEY.attention
                  return (
                    <tr key={'weekly-table-' + record.id}>
                      <td>{formatWeekRangeLabel(record.weekStart, record.weekEnd)}</td>
                      <td><strong>{client?.name || 'Cliente removido'}</strong></td>
                      <td><span className="weekly-health-pill" style={{ borderColor: health.color + '66', color: health.color, background: health.color + '14' }}>{health.label}</span></td>
                      <td>{formatCurrency(record.investment || 0)}</td>
                      <td>{formatNumber(record.leads || 0)}</td>
                      <td>{record.leads > 0 ? formatCurrency(record.cpl || 0) : '-'}</td>
                      <td>{formatNumber(record.sql || 0)}</td>
                      <td>{record.sql > 0 ? formatCurrency(record.costPerSql || 0) : '-'}</td>
                      <td>{(record.actionItems || []).length ? record.actionItems.join(' | ') : 'Sem plano de ação'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ranking-empty">Nenhum registro encontrado para os filtros da tabela.</div>
        )}
      </div>

      <div className="weekly-chart-card glass-panel weekly-evolution-card">
        <div className="weekly-evolution-layout">
          <aside className="weekly-chart-client-list" aria-label="Clientes do gráfico de evolução">
            <div className="weekly-chart-client-list-head">
              <span><i className="bx bx-buildings"></i>Clientes</span>
              <strong>{formatNumber(weeklyChartClientRows.length)}</strong>
            </div>
            <button
              type="button"
              className={'weekly-chart-client-button ' + (weeklyChartClientFilter === 'all' ? 'is-active' : '')}
              onClick={() => setWeeklyChartClientFilter('all')}
            >
              <span>
                <strong>Carteira consolidada</strong>
                <small>{formatNumber(weeklyVisibleRecords.length)} registro(s)</small>
              </span>
              <b>{weeklySummary.leads > 0 ? formatCurrency(weeklySummary.cpl) : '-'}</b>
            </button>
            <div className="weekly-chart-client-scroll">
              {weeklyChartClientRows.length ? (
                weeklyChartClientRows.map((row) => (
                  <button
                    key={'weekly-chart-client-' + row.clientId}
                    type="button"
                    className={'weekly-chart-client-button ' + (weeklyChartClientFilter === row.clientId ? 'is-active' : '')}
                    onClick={() => setWeeklyChartClientFilter(row.clientId)}
                  >
                    <span>
                      <strong>{row.clientName}</strong>
                      <small>{formatNumber(row.recordsCount)} registro(s) · {formatNumber(row.leads)} leads · {formatNumber(row.sql)} SQL</small>
                    </span>
                    <b>{row.leads > 0 ? formatCurrency(row.investment / row.leads) : '-'}</b>
                  </button>
                ))
              ) : (
                <div className="ranking-empty">Nenhum cliente no período selecionado.</div>
              )}
            </div>
          </aside>
          <div className="weekly-evolution-main">
            <div className="section-header section-header-stack">
              <div>
                <span className="eyebrow weekly-icon-label"><i className="bx bx-line-chart"></i>Evolução</span>
                <h2>Investimento, leads, CPL, SQL e custo SQL</h2>
                <p className="chart-subtitle">Linha fracionada por semanas fechadas de segunda a domingo para {weeklySelectedChartClientName}.</p>
              </div>
            </div>
            <div className="weekly-chart-body weekly-evolution-chart-body">
              {weeklyLineChartRecords.length ? <Line data={weeklyLineChartData} options={weeklyChartOptions} /> : <div className="ranking-empty">Salve a primeira semana para liberar o gráfico de linha.</div>}
            </div>
          </div>
        </div>
      </div>

      {isWeeklyEntryModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay weekly-modal-overlay" style={weeklyModalOverlayStyle} role="presentation" onClick={() => setIsWeeklyEntryModalOpen(false)}>
          <div className="modal-card glass-panel simple-client-modal weekly-entry-modal" role="dialog" aria-modal="true" aria-label="Cadastrar dados da semana" onClick={(event) => event.stopPropagation()} style={weeklyModalCardStyle}>
            <button type="button" className="modal-close" style={weeklyModalCloseStyle} onClick={() => setIsWeeklyEntryModalOpen(false)} aria-label="Fechar">
              <i className="bx bx-x"></i>
            </button>
            {weeklyFormContent}
          </div>
        </div>,
        document.body
      )}

      {isWeeklyHistoryModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay weekly-modal-overlay" style={weeklyModalOverlayStyle} role="presentation" onClick={() => setIsWeeklyHistoryModalOpen(false)}>
          <div className="modal-card glass-panel weekly-history-modal" role="dialog" aria-modal="true" aria-label="Histórico de semanas registradas" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" style={weeklyModalCloseStyle} onClick={() => setIsWeeklyHistoryModalOpen(false)} aria-label="Fechar histórico">
              <i className="bx bx-x"></i>
            </button>
            <div className="weekly-history-heading">
              <div>
                <h2><i className="bx bx-history"></i> Histórico de Semanas Registradas</h2>
                <p className="chart-subtitle">Cada linha fica salva no Supabase e pode ser reaberta editando o mesmo cliente e semana.</p>
              </div>
              <div className="weekly-history-actions">
                {isWeeklyLoading && <span className="weekly-loading-pill">Carregando...</span>}
                {weeklyLatestRecords.length > 0 && (
                  <button type="button" className="weekly-history-button" onClick={handleToggleWeeklyDeleteMode} disabled={isDeletingWeeklyRecords}>
                    <i className={isWeeklyDeleteMode ? 'bx bx-x' : 'bx bx-trash'}></i>
                    {isWeeklyDeleteMode ? 'Cancelar seleção' : 'Excluir registros'}
                  </button>
                )}
                {isWeeklyDeleteMode && (
                  <button type="button" className="weekly-history-button weekly-history-button-danger" onClick={handleDeleteSelectedWeeklyRecords} disabled={isDeletingWeeklyRecords || !selectedWeeklyRecordIds.length}>
                    <i className="bx bx-check-shield"></i>
                    {isDeletingWeeklyRecords ? 'Excluindo...' : `Excluir selecionados (${selectedWeeklyRecordIds.length})`}
                  </button>
                )}
              </div>
            </div>
            {weeklyHistoryCards.length ? (
              <div className="weekly-history-grid">
                {weeklyHistoryCards.map((card) => {
                  const isSelected = card.recordIds.length > 0 && card.recordIds.every((id) => selectedWeeklyRecordIds.includes(id))
                  return (
                    <article key={card.id} className={`weekly-history-card ${isSelected ? 'selected' : ''}`}>
                      {isWeeklyDeleteMode && (
                        <label className="weekly-record-selector weekly-history-selector" aria-label={`Selecionar semana ${formatWeekRangeLabel(card.weekStart, card.weekEnd)}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleWeeklyHistoryCardSelection(card.recordIds)}
                          />
                          <span></span>
                        </label>
                      )}
                      <div className="weekly-history-card-title">
                        <strong>{formatWeekRangeLabel(card.weekStart, card.weekEnd)}</strong>
                        <span>{card.relativeLabel}</span>
                      </div>
                      <div className="weekly-history-card-metrics">
                        <div>
                          <span><i className="bx bx-wallet"></i>Total Investido</span>
                          <strong>{formatCurrency(card.investment)}</strong>
                        </div>
                        <div>
                          <span><i className="bx bx-purchase-tag-alt"></i>CPL Médio</span>
                          <strong>{card.leads > 0 ? formatCurrency(card.cpl) : '-'}</strong>
                        </div>
                      </div>
                      {isWeeklyDeleteMode && (
                        <div className="weekly-history-record-list">
                          {card.records.map((record) => {
                            const recordClientName = clientsById.get(record.clientId)?.name || 'Cliente removido'
                            const recordHealth = WEEKLY_HEALTH_BY_KEY[record.healthStatus]?.label || 'Sem saúde'
                            const isRecordSelected = selectedWeeklyRecordIds.includes(record.id)
                            return (
                              <label key={'weekly-history-record-' + record.id} className={`weekly-history-record-item ${isRecordSelected ? 'selected' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={isRecordSelected}
                                  onChange={() => handleToggleWeeklyHistoryCardSelection([record.id])}
                                />
                                <span className="weekly-history-record-check"></span>
                                <span className="weekly-history-record-copy">
                                  <strong>{recordClientName}</strong>
                                  <small>{recordHealth} • {formatCurrency(record.investment || 0)} • {formatNumber(record.leads || 0)} leads</small>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                      <button
                        type="button"
                        className="weekly-history-card-footer"
                        onClick={() => {
                          setWeeklyWeekStart(card.weekStart || getMondayDateInputValue())
                          setIsWeeklyHistoryModalOpen(false)
                        }}
                      >
                        <span>{formatNumber(card.clientsCount)} Clientes Monitorados</span>
                        <i className="bx bx-chevron-right"></i>
                      </button>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="weekly-history-empty">
                <i className="bx bx-calendar-x"></i>
                <strong>Nenhuma semana encontrada</strong>
                <span>Quando houver registros para o filtro atual, eles aparecem aqui em cards para reabrir e revisar.</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </section>
  )
}
