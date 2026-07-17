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
  const accessContext = await getAccessContext(adminSupabase, { id: userId }, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user: { id: userId }, accessContext, adminSupabase }
}

const DEFAULT_CONFIG = {
  script: [
    { label: 'Implementado', color: '#26C281' },
    { label: 'Não implementado', color: '#f59e0b' },
    { label: 'Não se aplica', color: '#64748b' },
  ],
  crm: [
    { label: 'Implementado', color: '#26C281' },
    { label: 'Não implementado', color: '#f59e0b' },
    { label: 'Não se aplica', color: '#64748b' },
    { label: 'Outro CRM', color: '#3ba3ff' },
  ],
  audit: [
    { label: 'Não realizada', color: '#f59e0b' },
    { label: 'Realizada', color: '#26C281' },
  ],
}

function normList(value, fallback) {
  if (!Array.isArray(value)) return fallback
  const out = value
    .filter((o) => o && typeof o === 'object' && String(o.label || '').trim())
    .map((o) => ({ label: String(o.label).trim().slice(0, 60), color: /^#[0-9a-fA-F]{6}$/.test(String(o.color || '')) ? o.color : '#64748b' }))
  return out.length ? out : fallback
}

async function readPayload(adminSupabase, workspaceId) {
  const { data } = await adminSupabase.from('workspace_preferences').select('payload').eq('workspace_id', workspaceId).maybeSingle()
  return (data?.payload && typeof data.payload === 'object') ? data.payload : {}
}

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const payload = await readPayload(ctx.adminSupabase, ctx.accessContext.workspaceId)
    const cfg = payload.commercialStatusConfig || {}
    return NextResponse.json({
      config: {
        script: normList(cfg.script, DEFAULT_CONFIG.script),
        crm: normList(cfg.crm, DEFAULT_CONFIG.crm),
        audit: normList(cfg.audit, DEFAULT_CONFIG.audit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const config = {
      script: normList(body.script, DEFAULT_CONFIG.script),
      crm: normList(body.crm, DEFAULT_CONFIG.crm),
      audit: normList(body.audit, DEFAULT_CONFIG.audit),
    }
    const workspaceId = ctx.accessContext.workspaceId
    const payload = await readPayload(ctx.adminSupabase, workspaceId)
    const { error } = await ctx.adminSupabase
      .from('workspace_preferences')
      .upsert({ workspace_id: workspaceId, payload: { ...payload, commercialStatusConfig: config }, updated_at: new Date().toISOString() }, { onConflict: 'workspace_id' })
    if (error) throw error
    return NextResponse.json({ config })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
