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

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext

    const url = new URL(request.url)
    const automation_id = url.searchParams.get('automation_id')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)

    if (!automation_id) return NextResponse.json({ error: 'automation_id obrigatório.' }, { status: 400 })

    // Verify the automation belongs to this workspace
    const { data: automation, error: checkErr } = await ctx.adminSupabase
      .from('automations')
      .select('id')
      .eq('id', automation_id)
      .eq('workspace_id', workspaceId)
      .maybeSingle()
    if (checkErr) throw checkErr
    if (!automation) return NextResponse.json({ error: 'Automação não encontrada.' }, { status: 404 })

    const { data, error } = await ctx.adminSupabase
      .from('automation_runs')
      .select('*')
      .eq('automation_id', automation_id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ runs: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
