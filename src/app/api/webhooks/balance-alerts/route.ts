import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { fetchMetaJson, normalizeMetaError } from '@/lib/server/meta-fetch'
import { resolveWorkspaceForHost } from '@/lib/server/domain-config'

const THRESHOLDS = [50, 100, 150] // checked from lowest to highest; zero handled separately
// How many hours to wait before re-alerting the same account+threshold
const COOLDOWN_HOURS = 6
// Payment/account problems persist for days — re-alert less often than low-balance
const PAYMENT_COOLDOWN_HOURS = 24
// Sentinel "threshold" codes for payment/account alerts (kept negative so they never
// collide with the balance thresholds above). Reuses balance_alert_logs for dedup.
const PAYMENT_CODES = { disabled: -2, problem: -3, pending: -8 }
// Quiet hours in Brazil time (UTC-3): no alerts from 20:00 to 08:00
const QUIET_START_HOUR = 20
const QUIET_END_HOUR = 8

function normalizeAdAccountId(value: string) {
  return String(value || '').replace(/^act_/, '').replace(/\D/g, '')
}

function normalizeCurrencyAmount(value: unknown, currency = 'BRL') {
  const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND'])
  const num = Number(value || 0)
  if (!Number.isFinite(num)) return 0
  return ZERO_DECIMAL.has(String(currency).toUpperCase()) ? num : num / 100
}

async function getMetaTokenForWorkspace(adminSupabase: any, workspaceId: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('workspace_meta_connections')
    .select('access_token')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.access_token || null
}

async function fetchBalance(token: string, adAccountId: string) {
  const fields = 'balance,currency,is_prepay_account,account_status,funding_source_details'
  const url = `https://graph.facebook.com/v19.0/act_${adAccountId}?fields=${fields}&access_token=${encodeURIComponent(token)}`
  const account = await fetchMetaJson(url, 'Meta timeout ao buscar saldo.')
  const currency = account.currency || 'BRL'
  const accountStatus = Number(account.account_status)
  const isPrepay = account.is_prepay_account === true || account.is_prepay_account === 'true'
  if (!isPrepay) return { balance: null, currency, isPrepay, accountStatus }

  // Use funding_source_details balance when available (matches what the UI shows)
  const rawBalance = normalizeCurrencyAmount(account.balance, currency)
  const fundingDetails = account.funding_source_details
  let fundsAvailable = rawBalance

  if (fundingDetails) {
    const labelRaw = String(fundingDetails.display_string || fundingDetails.displayString || '')
    const labelLower = `${labelRaw} ${fundingDetails.type || ''}`.toLowerCase()
    const isStoredFunds = /saldo dispon[ií]vel|available balance|fundos|prepaid|prepay|balance/.test(labelLower)
    if (isStoredFunds) {
      const match = labelRaw.match(/(?:R\$|\$|€|£)?\s*(-?\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|-?\d+(?:\.\d+)?)/)
      if (match) {
        const normalized = match[1].replace(/\s/g, '').includes(',')
          ? match[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
          : match[1].replace(/\s/g, '')
        const parsed = Number(normalized)
        if (Number.isFinite(parsed)) fundsAvailable = parsed
      }
    }
  }

  return { balance: Math.max(fundsAvailable, 0), currency, isPrepay, accountStatus }
}

// Maps the Meta account_status to a payment/account problem alert (or null).
// 2 = disabled, 3 = unsettled charge (payment problem), 8 = pending settlement.
function resolvePaymentAlert(accountStatus: number, clientName: string, adAccountId: string) {
  if (accountStatus === 3) {
    return {
      code: PAYMENT_CODES.problem,
      message: `🔴 *Problema de Pagamento - Meta Ads*\n\nCliente: *${clientName}*\nConta: act_${adAccountId}\n\n⛔ A Meta sinalizou uma cobrança não liquidada. Regularize o pagamento para não pausar as campanhas.`,
    }
  }
  if (accountStatus === 2) {
    return {
      code: PAYMENT_CODES.disabled,
      message: `🚫 *Conta Desativada - Meta Ads*\n\nCliente: *${clientName}*\nConta: act_${adAccountId}\n\n⛔ A conta foi desativada/impedida de veicular. Verifique pagamento e status na Meta.`,
    }
  }
  if (accountStatus === 8) {
    return {
      code: PAYMENT_CODES.pending,
      message: `🟠 *Pagamento Pendente - Meta Ads*\n\nCliente: *${clientName}*\nConta: act_${adAccountId}\n\n⚠️ Conta aguardando liquidação de pagamento. Fique de olho para evitar pausa.`,
    }
  }
  return null
}

async function wasAlertedRecently(
  adminSupabase: any,
  workspaceId: string,
  adAccountId: string,
  threshold: number,
  cooldownHours: number = COOLDOWN_HOURS
): Promise<boolean> {
  const since = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString()
  const { data } = await adminSupabase
    .from('balance_alert_logs')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('ad_account_id', adAccountId)
    .eq('threshold', threshold)
    .gte('alerted_at', since)
    .limit(1)
    .maybeSingle()
  return Boolean(data)
}

async function recordAlert(
  adminSupabase: any,
  workspaceId: string,
  clientId: string,
  adAccountId: string,
  threshold: number,
  balance: number
) {
  await adminSupabase.from('balance_alert_logs').insert({
    workspace_id: workspaceId,
    client_id: clientId,
    ad_account_id: adAccountId,
    threshold,
    balance,
  })
}

export async function GET(request: Request) {
  const expectedSecret = process.env.BALANCE_ALERT_WEBHOOK_SECRET
  // Preferencialmente via header Authorization (não vaza em logs de URL);
  // mantém a query string como fallback para não quebrar agendadores atuais.
  const authHeader = request.headers.get('authorization') || ''
  const headerSecret = authHeader.replace(/^Bearer\s+/i, '')
  const querySecret = new URL(request.url).searchParams.get('secret')
  const provided = headerSecret || querySecret

  if (!expectedSecret || provided !== expectedSecret) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // Quiet hours check (Brazil UTC-3): no alerts between 20:00 and 08:00
  const nowBrazil = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const hourBrazil = nowBrazil.getUTCHours()
  const isQuietHour = hourBrazil >= QUIET_START_HOUR || hourBrazil < QUIET_END_HOUR
  if (isQuietHour) {
    return NextResponse.json({ alerts: [], count: 0, skipped: 'quiet_hours', checkedAt: new Date().toISOString() })
  }

  const adminSupabase = createAdminClient()

  const params = new URL(request.url).searchParams
  const zeroOnly = params.get('zero_only') === 'true'
  let workspaceIdFilter = params.get('workspace_id')

  // Filter by domain (e.g. domain=app.assessorialp.com.br)
  const domainParam = params.get('domain')
  if (domainParam && !workspaceIdFilter) {
    const { workspaceId } = await resolveWorkspaceForHost(adminSupabase, domainParam)
    if (!workspaceId) return NextResponse.json({ error: 'Domínio não encontrado.' }, { status: 404 })
    workspaceIdFilter = workspaceId
  }

  const workspacesQuery = adminSupabase.from('workspaces').select('id, name')
  if (workspaceIdFilter) workspacesQuery.eq('id', workspaceIdFilter)

  const { data: workspaces, error: wsError } = await workspacesQuery
  if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 })

  const alerts: any[] = []

  for (const workspace of workspaces || []) {
    const token = await getMetaTokenForWorkspace(adminSupabase, workspace.id)
    if (!token) continue

    // Get all active clients with a Meta ad account
    const { data: clients } = await adminSupabase
      .from('workspace_clients')
      .select('id, name, payload')
      .eq('workspace_id', workspace.id)

    const eligibleClients = (clients || []).filter((c: any) => {
      const status = String(c.payload?.status || '').toLowerCase()
      const alertsEnabled = c.payload?.balanceAlertsEnabled !== false // default true
      return c.payload?.metaAdAccountId && status !== 'churn' && status !== 'pausado' && alertsEnabled
    })

    for (const client of eligibleClients) {
      const adAccountId = normalizeAdAccountId(client.payload.metaAdAccountId)
      if (!adAccountId) continue

      try {
        const { balance, currency, isPrepay, accountStatus } = await fetchBalance(token, adAccountId)
        const clientName = client.name || client.payload?.name || 'Cliente'

        // Payment/account problem alerts — independentes do saldo e de pré/pós-pago.
        if (!zeroOnly) {
          const paymentAlert = resolvePaymentAlert(accountStatus, clientName, adAccountId)
          if (paymentAlert) {
            const alreadySent = await wasAlertedRecently(adminSupabase, workspace.id, adAccountId, paymentAlert.code, PAYMENT_COOLDOWN_HOURS)
            if (!alreadySent) {
              await recordAlert(adminSupabase, workspace.id, client.id, adAccountId, paymentAlert.code, balance ?? 0)
              alerts.push({
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                clientId: client.id,
                clientName,
                adAccountId,
                balance: balance ?? 0,
                currency,
                threshold: paymentAlert.code,
                kind: 'payment',
                message: paymentAlert.message,
              })
            }
          }
        }

        if (!isPrepay || balance === null) continue

        // Zero balance: highest priority, always check independently
        if (balance <= 0) {
          const alreadySent = await wasAlertedRecently(adminSupabase, workspace.id, adAccountId, 0)
          if (!alreadySent) {
            await recordAlert(adminSupabase, workspace.id, client.id, adAccountId, 0, balance)
            alerts.push({
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              clientId: client.id,
              clientName,
              adAccountId,
              balance,
              currency,
              threshold: 0,
              message: `🚨 *Saldo Zerado - Meta Ads*\n\nCliente: *${clientName}*\nConta: act_${adAccountId}\nSaldo atual: *R$ 0,00*\n\n⛔ As campanhas foram pausadas. Recarregue agora!`,
            })
          }
          continue // skip regular thresholds when balance is zero
        }

        // Skip regular thresholds when running in zero_only mode
        if (zeroOnly) continue

        // Regular thresholds: find the lowest triggered one
        for (const threshold of THRESHOLDS) {
          if (balance < threshold) {
            const alreadySent = await wasAlertedRecently(adminSupabase, workspace.id, adAccountId, threshold)
            if (!alreadySent) {
              await recordAlert(adminSupabase, workspace.id, client.id, adAccountId, threshold, balance)
              alerts.push({
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                clientId: client.id,
                clientName,
                adAccountId,
                balance,
                currency,
                threshold,
                message: threshold === 50
                ? `🔴 *Saldo Crítico - Meta Ads*\n\nCliente: *${clientName}*\nConta: act_${adAccountId}\nSaldo atual: *R$ ${balance.toFixed(2)}*\n\n⛔ As campanhas vão pausar em breve. Recarregue agora!`
                : threshold === 100
                  ? `🟠 *Saldo Baixo - Meta Ads*\n\nCliente: *${clientName}*\nConta: act_${adAccountId}\nSaldo atual: *R$ ${balance.toFixed(2)}*\n\n⚠️ Saldo abaixo de R$ 100. Providencie recarga para evitar pausa.`
                  : `🟡 *Aviso de Saldo - Meta Ads*\n\nCliente: *${clientName}*\nConta: act_${adAccountId}\nSaldo atual: *R$ ${balance.toFixed(2)}*\n\nSaldo abaixo de R$ 150. Fique de olho e recarregue em breve.`,
              })
            }
            break
          }
        }
      } catch {
        // Skip accounts with errors silently
      }
    }
  }

  return NextResponse.json({ alerts, count: alerts.length, checkedAt: new Date().toISOString() })
}
