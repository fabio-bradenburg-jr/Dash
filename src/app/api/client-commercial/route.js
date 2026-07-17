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

const normStatus = (v, fallback) => { const s = String(v ?? '').trim().slice(0, 60); return s || fallback }

function normDate(value) {
  if (!value) return null
  const raw = String(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}
function normAudits(value) {
  const arr = Array.isArray(value) ? value : []
  return arr
    .filter((a) => a && typeof a === 'object')
    .map((a) => ({
      id: String(a.id || crypto.randomUUID()),
      label: String(a.label || 'Auditoria').slice(0, 80),
      status: normStatus(a.status, 'Não realizada'),
      date: normDate(a.date),
      note: String(a.note || ''),
    }))
}

// GET /api/client-commercial — todos os registros do workspace
export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { data, error } = await ctx.adminSupabase
      .from('client_commercial_process')
      .select('client_id, script_status, script_date, crm_status, crm_date, audits, notes, updated_at')
      .eq('workspace_id', ctx.accessContext.workspaceId)

    if (error) throw error
    return NextResponse.json({ records: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/client-commercial — upsert de um cliente (vínculo pelo client_id)
export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const clientId = String(body.client_id || '').trim()
    if (!clientId) return NextResponse.json({ error: 'client_id obrigatório.' }, { status: 400 })

    const workspaceId = ctx.accessContext.workspaceId
    const now = new Date().toISOString()

    const { data: existing } = await ctx.adminSupabase
      .from('client_commercial_process')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('client_id', clientId)
      .maybeSingle()

    const patch = { updated_by: ctx.user.id, updated_at: now }
    if (body.script_status !== undefined) patch.script_status = normStatus(body.script_status, 'Não implementado')
    if (body.script_date !== undefined) patch.script_date = normDate(body.script_date)
    if (body.crm_status !== undefined) patch.crm_status = normStatus(body.crm_status, 'Não implementado')
    if (body.crm_date !== undefined) patch.crm_date = normDate(body.crm_date)
    if (body.audits !== undefined) patch.audits = normAudits(body.audits)
    if (body.notes !== undefined) patch.notes = String(body.notes || '')

    const { data, error } = await ctx.adminSupabase
      .from('client_commercial_process')
      .upsert(
        {
          workspace_id: workspaceId,
          client_id: clientId,
          ...patch,
          created_by: existing ? undefined : ctx.user.id,
        },
        { onConflict: 'workspace_id,client_id' }
      )
      .select('client_id, script_status, script_date, crm_status, crm_date, audits, notes, updated_at')
      .single()

    if (error) throw error
    return NextResponse.json({ record: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
