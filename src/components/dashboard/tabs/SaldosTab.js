'use client'

import { useDashboard } from '@/components/dashboard/DashboardContext'

/* Kinetic Emerald palette (Saldos design) */
const C = {
  accent: '#26C281', onAccent: '#003821',
  text: '#E5E2E1', text2: 'rgba(232,230,228,0.66)', text3: 'rgba(232,230,228,0.42)',
  glass: 'rgba(28,28,28,0.4)', border: 'rgba(255,255,255,0.05)', border2: 'rgba(255,255,255,0.1)',
  field: 'rgba(255,255,255,0.04)', ok: '#22c55e', warn: '#f59e0b', err: '#ef4444',
}
const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
const TONE_COLOR = { critical: C.err, danger: C.err, attention: C.warn, warning: C.warn, healthy: C.ok, success: C.ok, empty: '#94a3b8' }
const AVATAR_POOL = ['linear-gradient(135deg,#26C281,#4fdf9b)', 'linear-gradient(135deg,#3ba3ff,#6366f1)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#8b5cf6,#3ba3ff)', 'linear-gradient(135deg,#22c55e,#26C281)', 'linear-gradient(135deg,#ec4899,#8b5cf6)']
const initialsOf = (name) => { const p = String(name || '').trim().split(/\s+/); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?' }
const hashIdx = (name) => { let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % AVATAR_POOL.length }

const selectStyle = { height: 40, padding: '0 30px 0 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.field, color: C.text2, fontFamily: 'Inter', fontSize: '0.76rem', outline: 'none', appearance: 'none', cursor: 'pointer' }
const labelSm = { fontFamily: 'Inter', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text3, fontWeight: 600 }

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

  const summaryDefs = [
    { label: 'Pré-pago abaixo de R$ 100', icon: 'error_outline', color: C.err, value: formatNumber(adAccountBalanceSummary.critical), sub: 'Prioridade de recarga' },
    { label: 'Pré-pago entre R$ 100 e R$ 200', icon: 'schedule', color: C.warn, value: formatNumber(adAccountBalanceSummary.attention), sub: 'Acompanhar de perto' },
    { label: 'Contas pós-pagas', icon: 'credit_card', color: C.ok, value: formatNumber(adAccountBalanceSummary.postpaid), sub: `${formatNumber(adAccountBalanceSummary.withCard)} com cartão` },
    { label: 'Saldo devedor total', icon: 'paid', color: '#94a3b8', value: formatCurrency(adAccountBalanceSummary.pendingAmount), sub: 'Contas pós-pagas com cobrança pendente', neutral: true },
  ]

  const filterDefs = [
    { value: adAccountBalanceBillingFilter, onChange: setAdAccountBalanceBillingFilter, options: [['all', 'Todos os tipos'], ['prepaid', 'Pré-pago'], ['postpaid', 'Pós-pago'], ['unidentified', 'Não identificado']] },
    { value: adAccountBalanceCardFilter, onChange: setAdAccountBalanceCardFilter, options: [['all', 'Todas as formas'], ['with_card', 'Com cartão'], ['without_card', 'Sem cartão']] },
    { value: adAccountBalanceValueFilter, onChange: setAdAccountBalanceValueFilter, options: [['all', 'Todos os fundos'], ['critical', 'abaixo de R$ 100'], ['attention', 'R$ 100 a R$ 200'], ['healthy', 'acima de R$ 200']] },
    { value: adAccountBalanceDebtFilter, onChange: setAdAccountBalanceDebtFilter, options: [['all', 'Todos os débitos'], ['with_debt', 'Com pendência'], ['without_debt', 'Sem pendência']] },
  ]

  return (
    <section style={{ maxWidth: 1320, margin: '0 auto', width: '100%', color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderBottom: '2px solid rgba(38,194,129,0.24)', borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.08),rgba(38,194,129,0.01))', padding: '24px 26px' }}>
        <div style={{ position: 'absolute', top: -70, right: -40, width: 260, height: 260, borderRadius: 99, background: 'radial-gradient(circle,rgba(38,194,129,0.16),transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Inter', fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: C.accent, fontWeight: 700, marginBottom: 9 }}><span className="mi" style={{ fontSize: 15 }}>account_balance_wallet</span>Controle financeiro de mídia</div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.6vw,1.9rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Saldo das contas de anúncio</h1>
            <p style={{ margin: '9px 0 0', color: C.text2, fontSize: '0.9rem', maxWidth: '62ch', lineHeight: 1.5 }}>Separe contas pré-pagas por fundos disponíveis e pós-pagas por saldo devedor e forma de pagamento.</p>
          </div>
          <button
            type="button"
            onClick={() => setAdAccountBalanceRefreshNonce((current) => current + 1)}
            disabled={adAccountBalanceLoading}
            style={{ height: 38, padding: '0 16px', borderRadius: 99, border: 'none', background: C.accent, color: C.onAccent, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', cursor: adAccountBalanceLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 22px rgba(38,194,129,0.28)', flex: 'none', opacity: adAccountBalanceLoading ? 0.75 : 1 }}
          >
            <i className={'bx ' + (adAccountBalanceLoading ? 'bx-loader-alt bx-spin' : 'bx-refresh')} style={{ fontSize: 16 }}></i>
            {adAccountBalanceLoading ? 'Atualizando' : 'Atualizar saldos'}
          </button>
        </div>
      </div>

      {adAccountBalanceError && (
        <div role="status" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 15px', borderRadius: 12, background: hexA(C.err, 0.08), border: `1px solid ${hexA(C.err, 0.25)}`, color: C.text, fontSize: '0.85rem' }}>
          <i className="bx bx-error-circle" style={{ fontSize: 18, color: C.err }}></i>
          <span>{adAccountBalanceError}</span>
        </div>
      )}

      {/* ── SUMMARY ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 18 }}>
        {summaryDefs.map((s) => (
          <div key={s.label} style={{ position: 'relative', overflow: 'hidden', padding: '16px 17px', borderRadius: 16, background: C.glass, backdropFilter: 'blur(12px)', border: `1px solid ${C.border}`, borderTop: `2px solid ${s.neutral ? C.border2 : hexA(s.color, 0.4)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: hexA(s.color, 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span className="mi" style={{ fontSize: 17, color: s.color }}>{s.icon}</span></span>
              <span style={{ fontFamily: 'Inter', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: C.text3, fontWeight: 600, lineHeight: 1.2 }}>{s.label}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.65rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: s.neutral ? C.text : s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'Inter', fontSize: '0.66rem', color: C.text3, marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── BOARD ── */}
      <div style={{ marginTop: 18, border: `1px solid ${C.border}`, borderRadius: 16, background: C.glass, backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        {/* toolbar */}
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 13, fontSize: 17, color: C.text3, pointerEvents: 'none' }}></i>
            <input
              type="text"
              value={adAccountBalanceSearch}
              onChange={(event) => setAdAccountBalanceSearch(event.target.value)}
              placeholder="Buscar cliente, conta ou cartão…"
              style={{ width: '100%', height: 40, padding: '0 14px 0 40px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.field, color: C.text, fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
          {filterDefs.map((f, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select value={f.value} onChange={(event) => f.onChange(event.target.value)} style={selectStyle}>
                {f.options.map(([value, label]) => <option key={value} value={value} style={{ color: '#000' }}>{label}</option>)}
              </select>
              <i className="bx bx-chevron-down" style={{ position: 'absolute', right: 9, fontSize: 17, color: C.text3, pointerEvents: 'none' }}></i>
            </div>
          ))}
        </div>
        {/* status row */}
        <div style={{ padding: '9px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', fontFamily: 'Inter', fontSize: '0.7rem', color: C.text3 }}>
          <span>{formatNumber(filteredAdAccountBalanceRows.length)} cliente(s) exibido(s)</span>
          {adAccountBalanceUpdatedAt && <span>Atualizado em {formatClientDateTime(adAccountBalanceUpdatedAt)}</span>}
        </div>

        {adAccountBalanceLoading && !adAccountBalanceRows.length ? (
          <div style={{ padding: '70px 20px', textAlign: 'center', color: C.text2 }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 34, color: C.accent, display: 'inline-block' }}></i>
            <div style={{ marginTop: 14, fontSize: '0.9rem' }}>Atualizando saldos das contas…</div>
          </div>
        ) : !filteredAdAccountBalanceRows.length ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: C.text2 }}>
            <i className="bx bx-wallet-alt" style={{ fontSize: 34, color: C.text3 }}></i>
            <div style={{ marginTop: 12, fontWeight: 600 }}>Nenhum cliente encontrado para os filtros selecionados.</div>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 13 }}>
            {filteredAdAccountBalanceRows.map((row) => {
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
              const empty = !row.accountId
              const toneColor = TONE_COLOR[row.tone] || '#94a3b8'
              const isPost = row.billingType === 'postpaid'
              const cardBorder = !empty && !isPost && row.tone && TONE_COLOR[row.tone] !== '#94a3b8'
                ? hexA(toneColor, 0.28)
                : (!empty && isPost && row.pendingAmount > 0 ? hexA(C.warn, 0.2) : C.border)
              const cardBg = !empty && !isPost && row.tone && TONE_COLOR[row.tone] !== '#94a3b8'
                ? `linear-gradient(150deg, ${hexA(toneColor, 0.08)}, rgba(28,28,28,0.4))`
                : C.glass
              const typeMap = { prepaid: ['Pré-pago', 'bx-wallet', '#4fdf9b'], postpaid: ['Pós-pago', 'bx-credit-card', '#3ba3ff'] }
              const [tLabel, tIcon, tCol] = typeMap[row.billingType] || ['Não identificado', 'bx-help-circle', '#94a3b8']
              const notifOn = row.balanceAlertsEnabled !== false
              return (
                <div key={`${row.clientId}-${row.accountId || 'empty'}`} style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${cardBorder}`, borderRadius: 15, background: cardBg, padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {/* header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: AVATAR_POOL[hashIdx(row.clientName)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem', color: '#fff', flex: 'none', overflow: 'hidden' }}>
                      {row.clientLogoUrl ? <img src={row.clientLogoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialsOf(row.clientName)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.clientName}</div>
                      <div style={{ fontFamily: 'Inter', fontSize: '0.64rem', color: C.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.accountName || 'Sem conta vinculada'}</div>
                    </div>
                    {billingUrl && (
                      <a href={billingUrl} target="_blank" rel="noopener noreferrer" title="Abrir cobrança no Meta" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: C.field, color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', textDecoration: 'none' }}>
                        <i className="bx bx-link-external" style={{ fontSize: 15 }}></i>
                      </a>
                    )}
                  </div>
                  {/* body */}
                  {empty ? (
                    <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 9, color: C.text3, fontFamily: 'Inter', fontSize: '0.8rem' }}><i className="bx bx-unlink" style={{ fontSize: 20 }}></i>Sem conta de anúncio vinculada</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                          <span style={labelSm}>{isPost ? 'Modalidade' : 'Fundos disponíveis'}</span>
                          <span style={isPost
                            ? { fontFamily: 'Inter', fontWeight: 700, fontSize: '0.82rem', padding: '4px 12px', borderRadius: 99, background: hexA('#3ba3ff', 0.14), color: '#3ba3ff' }
                            : { fontFamily: 'Inter', fontWeight: 700, fontSize: '0.9rem', padding: '4px 12px', borderRadius: 99, background: hexA(toneColor, 0.15), color: toneColor, fontVariantNumeric: 'tabular-nums' }}>
                            {row.fundsAvailable == null ? (isPost ? 'Pós-pago' : '—') : formatCurrencyByCode(row.fundsAvailable, row.currency)}
                          </span>
                        </div>
                        {row.pendingAmount != null && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                            <span style={labelSm}>Saldo devedor</span>
                            <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: '0.88rem', color: C.text, fontVariantNumeric: 'tabular-nums' }}>{formatCurrencyByCode(row.pendingAmount, row.currency)}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.64rem', fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: hexA(tCol, 0.13), color: tCol }}><i className={'bx ' + tIcon} style={{ fontSize: 14 }}></i>{row.billingTypeLabel || tLabel}</span>
                        <span title={row.statusDescription || ''} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Inter', fontSize: '0.64rem', fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: row.statusTone === 'danger' || row.statusTone === 'critical' ? hexA(C.err, 0.13) : row.statusTone === 'warning' ? hexA(C.warn, 0.13) : hexA(C.ok, 0.13), color: row.statusTone === 'danger' || row.statusTone === 'critical' ? C.err : row.statusTone === 'warning' ? C.warn : C.ok }}>
                          <i className={'bx ' + (row.statusIcon || 'bx-check-shield')} style={{ fontSize: 14 }}></i>{row.statusLabel || 'Sem status'}
                        </span>
                      </div>
                    </>
                  )}
                  {/* footer */}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontFamily: 'Inter', fontSize: '0.68rem', color: C.text3, fontVariantNumeric: 'tabular-nums' }}>{row.accountId ? `act_${row.accountId}` : '—'}</span>
                    {row.accountId && (
                      <button
                        type="button"
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
                        title={notifOn ? 'Notificações WhatsApp ativas — clique para desativar' : 'Notificações WhatsApp desativadas — clique para ativar'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 11px', borderRadius: 99, fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer', border: `1px solid ${notifOn ? hexA(C.ok, 0.4) : C.border}`, background: notifOn ? hexA(C.ok, 0.13) : 'transparent', color: notifOn ? C.ok : C.text3 }}
                      >
                        <i className={notifOn ? 'bx bx-bell' : 'bx bx-bell-off'} style={{ fontSize: 14 }}></i>
                        {notifOn ? 'Notif. ativa' : 'Desativada'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
