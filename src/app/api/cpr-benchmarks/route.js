import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase }
}

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const wid = ctx.accessContext.workspaceId

    const [{ data: benchmarks }, { data: settings }] = await Promise.all([
      ctx.adminSupabase.from('cpr_benchmarks').select('*').eq('workspace_id', wid),
      ctx.adminSupabase.from('cpr_settings').select('*').eq('workspace_id', wid).maybeSingle(),
    ])

    return NextResponse.json({
      benchmarks: benchmarks || [],
      settings: settings || { green_threshold: 15, yellow_threshold: 35 },
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const wid = ctx.accessContext.workspaceId
    const body = await request.json()

    // Save benchmarks (array of { client_id, benchmark_cpr })
    if (Array.isArray(body.benchmarks)) {
      for (const b of body.benchmarks) {
        await ctx.adminSupabase.from('cpr_benchmarks').upsert(
          { workspace_id: wid, client_id: b.client_id, benchmark_cpr: b.benchmark_cpr, updated_at: new Date().toISOString() },
          { onConflict: 'workspace_id,client_id' }
        )
      }
    }

    // Save settings
    if (body.settings) {
      await ctx.adminSupabase.from('cpr_settings').upsert(
        { workspace_id: wid, green_threshold: body.settings.green_threshold, yellow_threshold: body.settings.yellow_threshold, updated_at: new Date().toISOString() },
        { onConflict: 'workspace_id' }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
