import { NextResponse } from 'next/server'
import { META_READ_CACHE } from '@/lib/server/cache-headers'
import { cookies } from 'next/headers'
import { formatInsightsWithConversions } from '@/lib/meta-metrics'
import { fetchMetaJson, normalizeMetaError } from '@/lib/server/meta-fetch'
import { resolveWorkspaceMetaAccessToken } from '@/lib/server/meta-connection'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext, isPrimaryAdminEmail, USER_ROLES } from '@/lib/server/access-control'
import { getDashboardState } from '@/lib/server/dashboard-store'
import { PLATFORM_AUTH_COOKIE } from '@/lib/saas/auth'
import { verifyLocalAccessToken } from '@/lib/server/platform-auth-fallback'

// CPL semanal (últimas 12 semanas) por cliente, direto da Meta.
// Resultados contados pelo objetivo da campanha — mesma regra do dash
// (getResultsForObjective de campaigns-overview).

const GHOST_AD_ACCOUNT_ID = '__ghost__'
const WEEKS_COUNT = 12

async function getDashboardAccessContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminSupabase = createAdminClient()
  if (user) {
    return { adminSupabase, accessContext: await getAccessContext(supabase, user, { adminSupabase }) }
  }

  const token = (await cookies()).get(PLATFORM_AUTH_COOKIE)?.value
  if (!token) return { errorResponse: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }

  const payload = await verifyLocalAccessToken(token)
  const userId = String(payload.sub || '').replace(/^supabase:/, '')
  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('id, email, full_name, role, ai_access_level, can_edit_integrations, workspace_id')
    .eq('id', userId)
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile?.workspace_id) {
    return { errorResponse: NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 404 }) }
  }

  const { data: workspace } = await adminSupabase
    .from('workspaces').select('id, name, owner_user_id').eq('id', profile.workspace_id).maybeSingle()

  const isPrimaryAdmin = isPrimaryAdminEmail(profile.email)
  const isWorkspaceOwner = Boolean(workspace?.owner_user_id && workspace.owner_user_id === profile.id)
  const role = isPrimaryAdmin ? USER_ROLES.MASTER : profile.role || USER_ROLES.VIEWER

  return {
    adminSupabase,
    accessContext: {
      profile, role, workspaceId: profile.workspace_id, workspace: workspace || null, isWorkspaceOwner,
      canManageUsers: isPrimaryAdmin || isWorkspaceOwner || role === USER_ROLES.MASTER,
      canManageClients: isPrimaryAdmin || isWorkspaceOwner || role === USER_ROLES.MASTER || role === USER_ROLES.OPERATOR,
      canEditIntegrations: isPrimaryAdmin || isWorkspaceOwner || role === USER_ROLES.MASTER || Boolean(profile.can_edit_integrations),
      canViewDashboard: isPrimaryAdmin || isWorkspaceOwner || role === USER_ROLES.MASTER || role === USER_ROLES.OPERATOR,
      canUseAi: profile.ai_access_level !== 'none',
      isClientRole: role === USER_ROLES.CLIENT,
      viewableClientIds: [], editableClientIds: [],
    },
  }
}

// Mesma regra de resultados por objetivo usada em campaigns-overview (o dado do dash)
function getResultsForObjective(objective, custom_metrics) {
  const m = custom_metrics || {}
  const leads = Number(m.leads || 0)
  const purchases = Number(m.purchases || 0)
  const messages = Number(m.messages || 0)
  const landingPageViews = Number(m.landingPageViews || 0)
  const clicks = Number(m.clicks || 0)

  switch ((objective || '').toUpperCase()) {
    case 'OUTCOME_LEADS': case 'LEAD_GENERATION':
      return leads
    case 'OUTCOME_SALES': case 'CONVERSIONS': case 'PRODUCT_CATALOG_SALES':
      return purchases || leads
    case 'MESSAGES':
      return messages || leads
    case 'OUTCOME_ENGAGEMENT': case 'POST_ENGAGEMENT': case 'PAGE_LIKES':
      return messages || leads || purchases
    case 'OUTCOME_TRAFFIC': case 'LINK_CLICKS': case 'TRAFFIC':
      return landingPageViews || clicks || leads || purchases
    default:
      return Math.max(purchases, leads, messages, landingPageViews) || clicks
  }
}

function isVisibleClient(client) {
  const status = String(client?.status || '').trim().toLowerCase()
  return Boolean(
    client?.id && client?.metaAdAccountId && client.metaAdAccountId !== GHOST_AD_ACCOUNT_ID &&
    client?.dashboardEnabled !== false && status !== 'churn' && status !== 'pausado'
  )
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}

// 12 janelas semanais (segunda→domingo), da mais antiga até a semana atual (parcial)
function buildWeekRanges() {
  const now = new Date()
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dow = (monday.getUTCDay() + 6) % 7 // 0 = segunda
  monday.setUTCDate(monday.getUTCDate() - dow)

  const ranges = []
  for (let i = WEEKS_COUNT - 1; i >= 0; i--) {
    const start = new Date(monday)
    start.setUTCDate(monday.getUTCDate() - i * 7)
    const end = new Date(start)
    end.setUTCDate(start.getUTCDate() + 6)
    const today = new Date()
    const until = end > today ? today : end
    ranges.push({ since: fmtDate(start), until: fmtDate(until) })
  }
  return ranges
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = []
  let index = 0
  async function worker() {
    while (index < items.length) {
      const current = index++
      results[current] = await mapper(items[current], current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function fetchClientWeeks({ client, token, ranges }) {
  const adAccountId = String(client.metaAdAccountId || '').replace(/^act_/, '')
  const since = ranges[0].since
  const until = ranges[ranges.length - 1].until

  const params = new URLSearchParams({
    access_token: token,
    fields: 'campaign_id,spend,impressions,clicks,actions,action_values,cost_per_action_type',
    level: 'campaign',
    limit: '500',
    time_increment: '7',
    action_attribution_windows: JSON.stringify(['7d_click', '1d_view']),
    use_unified_attribution_setting: 'true',
  })
  params.set('time_range', JSON.stringify({ since, until }))

  try {
    const [insights, campaignsData] = await Promise.all([
      fetchMetaJson(
        `https://graph.facebook.com/v19.0/act_${adAccountId}/insights?${params.toString()}`,
        'A Meta demorou para responder ao carregar o CPL semanal.',
        { maxPages: 6 }
      ),
      fetchMetaJson(
        `https://graph.facebook.com/v19.0/act_${adAccountId}/campaigns?fields=id,objective&limit=500&access_token=${encodeURIComponent(token)}`,
        'A Meta demorou para responder ao carregar objetivos.',
        { maxPages: 2 }
      ).catch(() => ({ data: [] })),
    ])

    const objectiveMap = new Map()
    ;((campaignsData?.data) || []).forEach((c) => { if (c.id) objectiveMap.set(c.id, c.objective || '') })

    // Agrupa buckets semanais (date_start) somando spend e resultados por objetivo
    const byWeek = new Map()
    ;((insights?.data) || []).forEach((rawRow) => {
      const key = rawRow.date_start
      if (!key) return
      const formatted = formatInsightsWithConversions(rawRow)
      const objective = objectiveMap.get(rawRow.campaign_id || '') || ''
      const bucket = byWeek.get(key) || { spend: 0, results: 0 }
      bucket.spend += Number.parseFloat(formatted.spend || 0)
      bucket.results += getResultsForObjective(objective, formatted.custom_metrics)
      byWeek.set(key, bucket)
    })

    const weeks = ranges.map((range) => {
      const bucket = byWeek.get(range.since) || { spend: 0, results: 0 }
      return {
        since: range.since,
        until: range.until,
        spend: Math.round(bucket.spend * 100) / 100,
        results: bucket.results,
        cpl: bucket.results > 0 ? Math.round((bucket.spend / bucket.results) * 100) / 100 : null,
      }
    })

    return {
      clientId: client.id,
      clientName: client.name || 'Cliente sem nome',
      clientLogoUrl: client.logoUrl || '',
      weeks,
      error: '',
    }
  } catch (error) {
    return {
      clientId: client.id,
      clientName: client.name || 'Cliente sem nome',
      clientLogoUrl: client.logoUrl || '',
      weeks: ranges.map((range) => ({ ...range, spend: 0, results: 0, cpl: null })),
      error: normalizeMetaError(error, 'Não foi possível carregar o CPL deste cliente.'),
    }
  }
}

export async function GET(request) {
  try {
    const token = await resolveWorkspaceMetaAccessToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Conecte uma conta da Meta para carregar o CPL.' }, { status: 400 })
    }

    const authorized = await getDashboardAccessContext()
    if (authorized.errorResponse) return authorized.errorResponse

    const { adminSupabase, accessContext } = authorized
    if (!accessContext.canViewDashboard && !accessContext.canManageClients) {
      return NextResponse.json({ error: 'Sem permissão para visualizar o CPL.' }, { status: 403 })
    }

    const dashboardState = await getDashboardState(adminSupabase, accessContext)
    const visibleClients = (dashboardState.clients || [])
      .filter(isVisibleClient)
      .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''), 'pt-BR'))

    const ranges = buildWeekRanges()
    const rows = await mapWithConcurrency(visibleClients, 3, (client) => fetchClientWeeks({ client, token, ranges }))

    return NextResponse.json({ updatedAt: new Date().toISOString(), ranges, rows }, { headers: META_READ_CACHE })
  } catch (error) {
    console.error('Meta CPL weeks error:', error)
    return NextResponse.json({ error: normalizeMetaError(error, 'Não foi possível carregar o CPL semanal.') }, { status: 500 })
  }
}
