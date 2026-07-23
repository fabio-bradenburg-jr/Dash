import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { resolveAuthContext } from '@/lib/server/auth-context'

async function getAuthContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return { error: ctx.errorResponse }
  return { user: ctx.user, accessContext: ctx.accessContext, adminSupabase: ctx.adminSupabase }
}

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { data, error } = await ctx.adminSupabase
      .from('workspace_nav_permissions')
      .select('user_id, page_key, granted')
      .eq('workspace_id', ctx.accessContext.workspaceId)

    if (error) throw error
    return NextResponse.json({ permissions: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    if (!ctx.accessContext.canManageUsers) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body = await request.json()
    const userId = String(body.userId || '').trim()
    if (!userId) return NextResponse.json({ error: 'userId obrigatório.' }, { status: 400 })

    // Modo em lote: substitui todas as páginas do usuário por `pages` (usado ao criar/editar).
    if (Array.isArray(body.pages)) {
      const { materializeUserPages } = await import('@/lib/server/nav-permissions')
      await materializeUserPages(ctx.adminSupabase, ctx.accessContext.workspaceId, userId, body.pages)
      return NextResponse.json({ ok: true })
    }

    // Modo individual: liga/desliga uma página.
    const pageKey = String(body.pageKey || '').trim()
    const granted = Boolean(body.granted)
    if (!pageKey) return NextResponse.json({ error: 'pageKey obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('workspace_nav_permissions')
      .upsert(
        { workspace_id: ctx.accessContext.workspaceId, user_id: userId, page_key: pageKey, granted, updated_at: new Date().toISOString() },
        { onConflict: 'workspace_id,user_id,page_key' }
      )

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
