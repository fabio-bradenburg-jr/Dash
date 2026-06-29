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

// GET /api/permissions — all permissions + user overrides for ?user_id=xxx
export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    const { data: permissions, error } = await ctx.adminSupabase
      .from('permissions').select('*').order('module').order('description')
    if (error) throw error

    let overrides = []
    if (userId) {
      const { data } = await ctx.adminSupabase
        .from('user_permissions').select('permission_id, allowed').eq('user_id', userId).eq('workspace_id', ctx.accessContext.workspaceId)
      overrides = data || []
    }

    return NextResponse.json({ permissions: permissions || [], overrides })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/permissions — save user permission overrides
export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { user_id, overrides = [] } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'user_id obrigatório.' }, { status: 400 })
    const { workspaceId } = ctx.accessContext

    await ctx.adminSupabase.from('user_permissions').delete().eq('user_id', user_id).eq('workspace_id', workspaceId)
    if (overrides.length > 0) {
      await ctx.adminSupabase.from('user_permissions').insert(
        overrides.map(o => ({ user_id, permission_id: o.permission_id, workspace_id: workspaceId, allowed: o.allowed }))
      )
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
