import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { PLATFORM_AUTH_COOKIE } from '@/lib/saas/auth'
import { verifyLocalAccessToken } from '@/lib/server/platform-auth-fallback'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  if (user) {
    const accessContext = await getAccessContext(supabase, user, { adminSupabase })
    if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
    return { user, accessContext, adminSupabase }
  }

  const token = (await cookies()).get(PLATFORM_AUTH_COOKIE)?.value
  if (!token) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }

  const payload = await verifyLocalAccessToken(token)
  const userId = String(payload.sub || '').replace(/^supabase:/, '')
  const fakeUser = { id: userId }
  const accessContext = await getAccessContext(adminSupabase, fakeUser, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user: fakeUser, accessContext, adminSupabase }
}

function normDate(value) {
  const raw = String(value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : ''
}

// GET /api/client-lead-quality?from=YYYY-MM-DD&to=YYYY-MM-DD  (ou ?week_start=)
export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const weekStart = normDate(url.searchParams.get('week_start'))
    const from = normDate(url.searchParams.get('from'))
    const to = normDate(url.searchParams.get('to'))

    let query = ctx.adminSupabase
      .from('client_lead_quality_weeks')
      .select('client_id, week_start, days, updated_by, updated_at')
      .eq('workspace_id', ctx.accessContext.workspaceId)

    if (weekStart) query = query.eq('week_start', weekStart)
    else {
      if (from) query = query.gte('week_start', from)
      if (to) query = query.lte('week_start', to)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ records: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/client-lead-quality  { client_id, week_start, day (1-5), marked, byName }
export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const clientId = String(body.client_id || '').trim()
    const weekStart = normDate(body.week_start)
    const day = Number(body.day)
    const marked = !!body.marked
    const byName = String(body.byName || '').trim() || null

    if (!clientId || !weekStart) return NextResponse.json({ error: 'client_id e week_start obrigatórios.' }, { status: 400 })
    if (!Number.isInteger(day) || day < 1 || day > 7) return NextResponse.json({ error: 'day inválido.' }, { status: 400 })

    const workspaceId = ctx.accessContext.workspaceId
    const now = new Date().toISOString()

    // lê o registro atual para preservar os outros dias
    const { data: existing } = await ctx.adminSupabase
      .from('client_lead_quality_weeks')
      .select('id, days')
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .eq('week_start', weekStart)
      .maybeSingle()

    const days = (existing?.days && typeof existing.days === 'object') ? { ...existing.days } : {}
    if (marked) days[String(day)] = { by: ctx.user.id, byName, at: now }
    else delete days[String(day)]

    const { data, error } = await ctx.adminSupabase
      .from('client_lead_quality_weeks')
      .upsert(
        {
          workspace_id: workspaceId,
          client_id: clientId,
          week_start: weekStart,
          days,
          updated_by: ctx.user.id,
          updated_at: now,
          created_by: existing ? undefined : ctx.user.id,
        },
        { onConflict: 'workspace_id,client_id,week_start' }
      )
      .select('client_id, week_start, days, updated_by, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ record: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
