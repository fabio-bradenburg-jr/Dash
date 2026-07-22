import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext, isPrimaryAdminEmail } from '@/lib/server/access-control'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { logUserActivity } from '@/lib/server/user-activity'
import { materializeUserPages } from '@/lib/server/nav-permissions'

async function getAuthContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return { error: ctx.errorResponse }
  return { user: ctx.user, accessContext: ctx.accessContext, adminSupabase: ctx.adminSupabase }
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
    if (!ctx.accessContext.canManageUsers) return NextResponse.json({ error: 'Sem permissão para atribuir funções.' }, { status: 403 })
    const { workspaceId } = ctx.accessContext

    await ctx.adminSupabase.from('user_roles').delete().eq('user_id', user_id).eq('workspace_id', workspaceId)
    if (role_ids.length > 0) {
      await ctx.adminSupabase.from('user_roles').insert(
        role_ids.map(rid => ({ user_id, role_id: rid, workspace_id: workspaceId, is_primary: rid === primary_role_id }))
      )
    }

    // Modelo "função = páginas": atribuir a função materializa as páginas dela como
    // acessos do usuário. Sem função → zera as páginas. Não mexe em master/cliente.
    const effectivePrimaryId = primary_role_id || role_ids[0] || null
    const { data: targetProfile } = await ctx.adminSupabase
      .from('profiles').select('email, role').eq('id', user_id).eq('workspace_id', workspaceId).maybeSingle()

    if (targetProfile && !isPrimaryAdminEmail(targetProfile.email) && targetProfile.role !== 'master' && targetProfile.role !== 'cliente') {
      let rolePages = []
      let roleName = ''
      if (effectivePrimaryId) {
        const { data: primaryRole } = await ctx.adminSupabase
          .from('roles').select('pages, name').eq('id', effectivePrimaryId).eq('workspace_id', workspaceId).maybeSingle()
        rolePages = Array.isArray(primaryRole?.pages) ? primaryRole.pages : []
        roleName = primaryRole?.name || ''
      }
      // Usuários internos ficam num papel neutro; o acesso real vem das páginas.
      await ctx.adminSupabase.from('profiles').update({ role: 'visualizador' }).eq('id', user_id)
      await materializeUserPages(ctx.adminSupabase, workspaceId, user_id, rolePages)

      await logUserActivity(ctx.adminSupabase, {
        workspaceId, userId: user_id, actorId: ctx.user?.id || null,
        actorName: ctx.accessContext.profile?.full_name || ctx.accessContext.profile?.email || '',
        action: 'Função atribuída', detail: roleName ? `Função: ${roleName} (${rolePages.length} página(s)).` : 'Funções removidas.',
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
