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

// Normaliza um valor numérico opcional vindo do corpo (aceita "1.234,56" ou 1234.56).
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const cleaned = String(value).trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

const VALID_STATUS = new Set(['saudavel', 'atencao', 'critico', 'integracao', 'pausado'])

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { data, error } = await ctx.adminSupabase
      .from('client_weekly_analyses')
      .select('*')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .order('week_start', { ascending: false })

    if (error) throw error

    return NextResponse.json({ records: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const clientId = String(body.clientId || '').trim()
    const weekStart = String(body.weekStart || '').trim()
    if (!clientId) return NextResponse.json({ error: 'clientId obrigatório.' }, { status: 400 })
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return NextResponse.json({ error: 'weekStart inválido (use YYYY-MM-DD).' }, { status: 400 })

    const investimento = parseNumber(body.investimento)
    const leadsRaw = parseNumber(body.leads)
    const leads = leadsRaw === null ? null : Math.round(leadsRaw)
    // CPL sempre recalculado no servidor a partir de investimento/leads.
    const cpl = (investimento !== null && leads !== null && leads > 0) ? Number((investimento / leads).toFixed(2)) : null

    const statusRaw = String(body.status || '').trim().toLowerCase()
    const status = VALID_STATUS.has(statusRaw) ? statusRaw : null

    const now = new Date().toISOString()

    const { data, error } = await ctx.adminSupabase
      .from('client_weekly_analyses')
      .upsert(
        {
          workspace_id: ctx.accessContext.workspaceId,
          client_id: clientId,
          week_start: weekStart,
          status,
          resumo: String(body.resumo || ''),
          investimento,
          leads,
          cpl,
          planilha: String(body.planilha || ''),
          acao: String(body.acao || ''),
          updated_by: ctx.user.id,
          updated_at: now,
          created_by: ctx.user.id,
        },
        { onConflict: 'workspace_id,client_id,week_start' }
      )
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ record: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { searchParams } = new URL(request.url)
    const id = String(searchParams.get('id') || '').trim()
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('client_weekly_analyses')
      .delete()
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
