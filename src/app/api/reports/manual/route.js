import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase, workspaceId: accessContext.workspaceId }
}

function buildCampaignRows(reportId, campaigns) {
  return (campaigns || []).map((c, i) => ({
    report_id: reportId,
    platform: c.platform || 'Meta Ads',
    campaign_name: c.campaign_name || '',
    investment: Number(c.investment) || 0,
    result: Number(c.result) || 0,
    result_type: c.result_type || 'Leads',
    reach: c.reach ? Number(c.reach) : null,
    impressions: c.impressions ? Number(c.impressions) : null,
    clicks: c.clicks ? Number(c.clicks) : null,
    ctr: c.ctr ? Number(c.ctr) : null,
    frequency: c.frequency ? Number(c.frequency) : null,
    cpr: Number(c.result) > 0 ? Number(c.investment) / Number(c.result) : null,
    sort_order: i,
  }))
}

function computeTotals(campaigns) {
  const c = campaigns || []
  return {
    total_investment: c.reduce((s, x) => s + (Number(x.investment) || 0), 0),
    total_results: c.reduce((s, x) => s + (Number(x.result) || 0), 0),
    total_reach: c.reduce((s, x) => s + (Number(x.reach) || 0), 0),
    total_impressions: c.reduce((s, x) => s + (Number(x.impressions) || 0), 0),
    total_clicks: c.reduce((s, x) => s + (Number(x.clicks) || 0), 0),
  }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const since = searchParams.get('since')
    const until = searchParams.get('until')

    let query = ctx.adminSupabase
      .from('manual_reports')
      .select('*, manual_report_campaigns(*)')
      .eq('workspace_id', ctx.workspaceId)
      .order('created_at', { ascending: false })

    if (clientId) query = query.eq('client_id', clientId)
    if (since) query = query.gte('created_at', since)
    if (until) query = query.lte('created_at', until + 'T23:59:59Z')

    const { data, error } = await query.limit(200)
    if (error) throw error

    return NextResponse.json({ reports: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { title, client_id, client_name, start_date, end_date, campaigns, opportunity_count, qualified_opportunity_count, won_opportunity_count, won_revenue, observacoes } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório.' }, { status: 400 })

    const totals = computeTotals(campaigns)

    const { data: report, error: repErr } = await ctx.adminSupabase
      .from('manual_reports')
      .insert({
        workspace_id: ctx.workspaceId,
        client_id: client_id || null,
        client_name: client_name || '',
        title: title.trim(),
        start_date: start_date || null,
        end_date: end_date || null,
        ...totals,
        opportunity_count: Number(opportunity_count) || 0,
        qualified_opportunity_count: Number(qualified_opportunity_count) || 0,
        won_opportunity_count: Number(won_opportunity_count) || 0,
        won_revenue: Number(won_revenue) || 0,
        observacoes: observacoes || null,
        created_by: ctx.user.id,
        created_by_name: ctx.accessContext.profile?.full_name || ctx.accessContext.profile?.email || '',
      })
      .select('*')
      .single()

    if (repErr) throw repErr

    const rows = buildCampaignRows(report.id, campaigns)
    if (rows.length > 0) {
      const { error: campErr } = await ctx.adminSupabase.from('manual_report_campaigns').insert(rows)
      if (campErr) throw campErr
    }

    const { data: full } = await ctx.adminSupabase
      .from('manual_reports')
      .select('*, manual_report_campaigns(*)')
      .eq('id', report.id)
      .single()

    return NextResponse.json({ report: full })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
