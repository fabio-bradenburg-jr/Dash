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

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get('unread_only') === 'true'
    const archived = url.searchParams.get('archived') === 'true'
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100)

    let query = ctx.adminSupabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', ctx.user.id)
      .eq('is_archived', archived)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) query = query.eq('is_read', false)

    const { data, error } = await query
    if (error) throw error

    const { count } = await ctx.adminSupabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', ctx.user.id)
      .eq('is_read', false)
      .eq('is_archived', false)

    return NextResponse.json({ notifications: data || [], unread_count: count || 0 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { id, action } = body
    // action: 'read' | 'unread' | 'archive' | 'read_all'

    if (action === 'read_all') {
      await ctx.adminSupabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', ctx.user.id)
        .eq('is_read', false)
      return NextResponse.json({ ok: true })
    }

    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = {}
    if (action === 'read') updates.is_read = true
    if (action === 'unread') updates.is_read = false
    if (action === 'archive') { updates.is_archived = true; updates.is_read = true }

    const { error } = await ctx.adminSupabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .eq('recipient_id', ctx.user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
