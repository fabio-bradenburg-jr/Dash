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
  return { user, accessContext, adminSupabase }
}

// GET /api/roles/users?user_id=xxx — get roles for a user
export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    if (!userId) return NextResponse.json({ error: 'user_id obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('user_roles')
      .select('role_id, is_primary, roles(id, name, color, icon)')
      .eq('user_id', userId)
      .eq('workspace_id', ctx.accessContext.workspaceId)
    if (error) throw error
    return NextResponse.json({ user_roles: data || [] })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/roles/users — assign roles to user
export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { user_id, role_ids = [], primary_role_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id obrigatório.' }, { status: 400 })
    const { workspaceId } = ctx.accessContext

    await ctx.adminSupabase.from('user_roles').delete().eq('user_id', user_id).eq('workspace_id', workspaceId)
    if (role_ids.length > 0) {
      await ctx.adminSupabase.from('user_roles').insert(
        role_ids.map(rid => ({ user_id, role_id: rid, workspace_id: workspaceId, is_primary: rid === primary_role_id }))
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
