'use client'

import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function SaldosTab() {
  const {
    formatNumber,
    formatCurrency,
    formatCurrencyByCode,
    formatClientDateTime,
    adAccountBalanceSummary,
    filteredAdAccountBalanceRows,
    adAccountBalanceError,
    adAccountBalanceLoading,
    adAccountBalanceRows,
    setAdAccountBalanceRows,
    adAccountBalanceSearch,
    setAdAccountBalanceSearch,
    adAccountBalanceBillingFilter,
    setAdAccountBalanceBillingFilter,
    adAccountBalanceCardFilter,
    setAdAccountBalanceCardFilter,
    adAccountBalanceValueFilter,
    setAdAccountBalanceValueFilter,
    adAccountBalanceDebtFilter,
    setAdAccountBalanceDebtFilter,
    adAccountBalanceUpdatedAt,
    setAdAccountBalanceRefreshNonce,
  } = useDashboard()

  return (
    <section className="ad-balance-page">
      <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <span className="management-hero-kicker"><i className="bx bx-wallet" style={{ marginRight: 5 }}></i>Controle financeiro de mídia</span>
          <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Saldo das contas de anúncio</h2>
          <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Separe contas pré-pagas por fundos disponíveis e contas pós-pagas por saldo devedor e forma de pagamento.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setAdAccountBalanceRefreshNonce((current) => current + 1)}
          disabled={adAccountBalanceLoading}
        >
          <i className={'bx ' + (adAccountBalanceLoading ? 'bx-loader-alt bx-spin' : 'bx-refresh')}></i>
          {adAccountBalanceLoading ? 'Atualizando' : 'Atualizar saldos'}
        </button>
      </div>

      {adAccountBalanceError && (
        <div className="api-error-banner" role="status">
          <i className="bx bx-error-circle"></i>
          <span>{adAccountBalanceError}</span>
        </div>
      )}

      <div className="ad-balance-summary-grid">
        <article className="ad-balance-summary-card glass-panel danger">
          <span>Pré-pago abaixo de R$ 100</span>
          <strong>{formatNumber(adAccountBalanceSummary.critical)}</strong>
          <small>Prioridade de recarga</small>
        </article>
        <article className="ad-balance-summary-card glass-panel warning">
          <span>Pré-pago entre R$ 100 e R$ 200</span>
          <strong>{formatNumber(adAccountBalanceSummary.attention)}</strong>
          <small>Acompanhar de perto</small>
        </article>
        <article className="ad-balance-summary-card glass-panel success">
          <span>Contas pós-pagas</span>
          <strong>{formatNumber(adAccountBalanceSummary.postpaid)}</strong>
          <small>{formatNumber(adAccountBalanceSummary.withCard)} com cartão</small>
        </article>
        <article className="ad-balance-summary-card glass-panel">
          <span>Saldo devedor total</span>
          <strong>{formatCurrency(adAccountBalanceSummary.pendingAmount)}</strong>
          <small>Contas pós-pagas com cobrança pendente</small>
        </article>
      </div>

      <section className="glass-panel ad-balance-table-card">
        <div className="ad-balance-toolbar">
          <div className="client-registry-search ad-balance-search">
            <i className="bx bx-search"></i>
            <input
              type="text"
              value={adAccountBalanceSearch}
              onChange={(event) => setAdAccountBalanceSearch(event.target.value)}
              placeholder="Buscar cliente, conta ou cartão..."
            />
          </div>
          <div className="ad-balance-filter-row">
            <label className="date-picker glass-item compact-filter">
              <i className="bx bx-transfer-alt"></i>
              <select value={adAccountBalanceBillingFilter} onChange={(event) => setAdAccountBalanceBillingFilter(event.target.value)}>
                <option value="all">Todos os tipos</option>
                <option value="prepaid">Pré-pago</option>
                <option value="postpaid">Pós-pago</option>
                <option value="unidentified">Não identificado</option>
              </select>
            </label>
            <label className="date-picker glass-item compact-filter">
              <i className="bx bx-credit-card"></i>
              <select value={adAccountBalanceCardFilter} onChange={(event) => setAdAccountBalanceCardFilter(event.target.value)}>
                <option value="all">Todas as formas</option>
                <option value="with_card">Com cartão</option>
                <option value="without_card">Sem cartão</option>
              </select>
            </label>
            <label className="date-picker glass-item compact-filter">
              <i className="bx bx-wallet"></i>
              <select value={adAccountBalanceValueFilter} onChange={(event) => setAdAccountBalanceValueFilter(event.target.value)}>
                <option value="all">Todos os fundos</option>
                <option value="critical">Fundos abaixo de R$ 100</option>
                <option value="attention">Fundos de R$ 100 a R$ 200</option>
                <option value="healthy">Fundos acima de R$ 200</option>
              </select>
            </label>
            <label className="date-picker glass-item compact-filter">
              <i className="bx bx-receipt"></i>
              <select value={adAccountBalanceDebtFilter} onChange={(event) => setAdAccountBalanceDebtFilter(event.target.value)}>
                <option value="all">Todos os débitos</option>
                <option value="with_debt">Com pendência</option>
                <option value="without_debt">Sem pendência</option>
              </select>
            </label>
          </div>
        </div>

        <div className="ad-balance-status-row">
          <span>{formatNumber(filteredAdAccountBalanceRows.length)} cliente(s) exibido(s)</span>
          {adAccountBalanceUpdatedAt && (
            <span>Atualizado em {formatClientDateTime(adAccountBalanceUpdatedAt)}</span>
          )}
        </div>

        <div className="ad-balance-cards-grid">
          {adAccountBalanceLoading && !adAccountBalanceRows.length ? (
            <div className="ad-balance-empty-cell" style={{ gridColumn: '1 / -1' }}>
              Carregando saldos das contas cadastradas...
            </div>
          ) : filteredAdAccountBalanceRows.length ? (
            filteredAdAccountBalanceRows.map((row) => {
              const billingUrl = row.accountId
                ? (() => {
                    const params = new URLSearchParams({ asset_id: row.accountId, placement: 'ads_manager' })
                    if (row.businessId) {
                      params.set('global_scope_id', row.businessId)
                      params.set('business_id', row.businessId)
                    }
                    return `https://adsmanager.facebook.com/adsmanager/billing_hub/accounts/details/?${params}`
                  })()
                : null
              return (
                <div key={`${row.clientId}-${row.accountId || 'empty'}`} className={'ad-balance-account-card ' + (row.tone || 'empty')}>
                  <div className="ad-balance-card-header">
                    <span className="ad-balance-client-icon">
                      {row.clientLogoUrl ? (
                        <img src={row.clientLogoUrl} alt={`Logo ${row.clientName}`} />
                      ) : (
                        <i className="bx bx-building-house"></i>
                      )}
                    </span>
                    <div className="ad-balance-card-client-info">
                      <strong>{row.clientName}</strong>
                      <small>{row.accountName || 'Sem conta vinculada'}</small>
                    </div>
                    {billingUrl && (
                      <a href={billingUrl} target="_blank" rel="noopener noreferrer" className="ad-balance-billing-link" title="Abrir configurações de verba no Meta Ads">
                        <i className="bx bx-link-external"></i>
                      </a>
                    )}
                  </div>

                  <div className="ad-balance-card-body">
                    <div className="ad-balance-card-funds">
                      <span className="ad-balance-card-funds-label">Fundos disponíveis</span>
                      <span className={'ad-balance-pill ' + (row.tone || 'empty')}>
                        {row.fundsAvailable == null ? (row.billingType === 'postpaid' ? 'Pós-pago' : '-') : formatCurrencyByCode(row.fundsAvailable, row.currency)}
                      </span>
                    </div>
                    {row.pendingAmount != null && (
                      <div className="ad-balance-card-pending">
                        <span className="ad-balance-card-funds-label">Saldo devedor</span>
                        <strong>{formatCurrencyByCode(row.pendingAmount, row.currency)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="ad-balance-card-footer">
                    <span className={'ad-balance-billing-badge ' + (row.billingType || 'empty')}>
                      <i className={'bx ' + (row.billingType === 'prepaid' ? 'bx-wallet' : row.billingType === 'postpaid' ? 'bx-credit-card' : 'bx-help-circle')}></i>
                      {row.billingTypeLabel || 'Não identificado'}
                    </span>
                    <span className={'ad-balance-payment-status ' + (row.statusTone || (row.accountId ? 'success' : 'empty'))} title={row.statusDescription || ''}>
                      <i className={'bx ' + (row.statusIcon || (row.accountId ? 'bx-check-circle' : 'bx-link-alt'))}></i>
                      {row.statusLabel || 'Sem status'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTop: '1px solid rgba(148,163,184,0.15)', paddingTop: 10, marginTop: 4 }}>
                    {row.accountId && (
                      <span style={{ fontSize: '0.72rem', color: 'rgba(148,163,184,0.6)', fontFamily: 'monospace' }}>act_{row.accountId}</span>
                    )}
                    <button
                      onClick={async () => {
                        const nextEnabled = row.balanceAlertsEnabled === false
                        setAdAccountBalanceRows((prev) =>
                          prev.map((r) => r.clientId === row.clientId ? { ...r, balanceAlertsEnabled: nextEnabled } : r)
                        )
                        try {
                          await fetch(`/api/clients/${row.clientId}/balance-alert`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ enabled: nextEnabled }),
                          })
                        } catch {
                          setAdAccountBalanceRows((prev) =>
                            prev.map((r) => r.clientId === row.clientId ? { ...r, balanceAlertsEnabled: row.balanceAlertsEnabled } : r)
                          )
                        }
                      }}
                      title={row.balanceAlertsEnabled !== false ? 'Notificações WhatsApp ativas — clique para desativar' : 'Notificações WhatsApp desativadas — clique para ativar'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px 4px 8px', borderRadius: 20,
                        border: row.balanceAlertsEnabled !== false ? '1.5px solid #10b981' : '1.5px solid #64748b',
                        background: row.balanceAlertsEnabled !== false ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                        color: row.balanceAlertsEnabled !== false ? '#10b981' : '#94a3b8',
                        fontSize: '0.73rem', fontWeight: 700,
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <i className={row.balanceAlertsEnabled !== false ? 'bx bx-bell' : 'bx bx-bell-off'} style={{ fontSize: '0.9rem' }}></i>
                      {row.balanceAlertsEnabled !== false ? 'Notif. ativa' : 'Desativada'}
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="ad-balance-empty-cell" style={{ gridColumn: '1 / -1' }}>
              Nenhum cliente encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
