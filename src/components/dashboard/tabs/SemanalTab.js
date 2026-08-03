'use client'

import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function SemanalTab() {
  const {
    activeClientDashboardHex,
    formatNumber,
    weeklyFormContent,
    weeklyPortfolioStats,
    weeklySummary,
    weeklyHealthRiskTarget,
    weeklySuccessMessage,
    WEEKLY_HEALTH_BY_KEY,
  } = useDashboard()

  const trackingMetrics = [
    {
      key: 'monitored',
      label: 'Clientes monitorados',
      value: formatNumber(weeklyPortfolioStats.monitoredClients),
      icon: 'bx-buildings',
      color: activeClientDashboardHex,
    },
    {
      key: 'healthy',
      label: 'Saudável',
      value: formatNumber(weeklyPortfolioStats.healthyCount),
      icon: 'bx-check-circle',
      color: WEEKLY_HEALTH_BY_KEY?.healthy?.color || '#10b981',
    },
    {
      key: 'attention',
      label: 'Atenção',
      value: formatNumber(weeklyPortfolioStats.attentionCount),
      icon: 'bx-error',
      color: WEEKLY_HEALTH_BY_KEY?.attention?.color || '#f59e0b',
    },
    {
      key: 'critical',
      label: 'Crítico',
      value: formatNumber(weeklyPortfolioStats.criticalCount),
      icon: 'bx-error-circle',
      color: WEEKLY_HEALTH_BY_KEY?.critical?.color || '#ef4444',
    },
    {
      key: 'result',
      label: 'Com resultado',
      value: formatNumber(weeklyPortfolioStats.withResultCount),
      icon: 'bx-trending-up',
      color: activeClientDashboardHex,
    },
    {
      key: 'churn',
      label: 'Churn',
      value: formatNumber(weeklyPortfolioStats.churnCount),
      icon: 'bx-user-minus',
      color: '#ef4444',
    },
  ]

  return (
    <section className="weekly-dashboard-panel weekly-panel-lean">
      <div className="weekly-lean-hero glass-panel">
        <span className="management-hero-kicker"><i className="bx bx-pulse" style={{ marginRight: 6 }}></i>Operação semanal</span>
        <h2>Controle da Operação</h2>
        <p>Impute os dados da semana comparando com as últimas 3 imputações. A saúde definida continua alimentando o restante do app.</p>
      </div>

      <div className="weekly-lean-metrics">
        {trackingMetrics.map((metric) => (
          <div key={metric.key} className="weekly-kpi-card glass-panel">
            <span><i className={'bx ' + metric.icon} style={{ color: metric.color }}></i>{metric.label}</span>
            <strong style={{ color: metric.color }}>{metric.value}</strong>
          </div>
        ))}
        <div className="weekly-kpi-card glass-panel">
          <span><i className="bx bx-target-lock"></i>Crítico + Atenção</span>
          <strong>{weeklySummary.healthCount ? formatNumber(weeklySummary.riskPercent) + '%' : '-'}</strong>
          <small className="weekly-lean-metric-note">Meta ≤ {formatNumber(weeklyHealthRiskTarget)}%</small>
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

      <div className="weekly-inline-cadastro glass-panel">
        {weeklyFormContent}
      </div>
    </section>
  )
}
