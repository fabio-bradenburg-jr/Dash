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

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { data } = await ctx.adminSupabase
      .from('user_task_preferences')
      .select('*')
      .eq('user_id', ctx.user.id)
      .eq('workspace_id', ctx.workspaceId)
      .maybeSingle()

    return NextResponse.json({ preferences: data || null })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const allowed = ['filter_assignee_ids', 'filter_client_ids', 'last_space_id', 'default_view_mode', 'active_view_id']
    const updates = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await ctx.adminSupabase
      .from('user_task_preferences')
      .upsert(
        { user_id: ctx.user.id, workspace_id: ctx.workspaceId, ...updates },
        { onConflict: 'user_id,workspace_id' }
      )
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ preferences: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
