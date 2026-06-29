import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { resolveAuthContext } from '@/lib/server/auth-context'

async function getAuthContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return { error: ctx.errorResponse }
  return { user: ctx.user, accessContext: ctx.accessContext, adminSupabase: ctx.adminSupabase, workspaceId: ctx.accessContext.workspaceId }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { data } = await ctx.adminSupabase
      .from('user_operation_context')
      .select('*')
      .eq('user_id', ctx.user.id)
      .eq('workspace_id', ctx.workspaceId)
      .maybeSingle()

    return NextResponse.json({ context: data || null })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { last_client_id, favorite_client_ids, recent_client_ids } = body

    // Load existing to merge recent_client_ids
    const { data: existing } = await ctx.adminSupabase
      .from('user_operation_context')
      .select('recent_client_ids, favorite_client_ids')
      .eq('user_id', ctx.user.id)
      .eq('workspace_id', ctx.workspaceId)
      .maybeSingle()

    const updates = { updated_at: new Date().toISOString() }
    if (last_client_id !== undefined) updates.last_client_id = last_client_id
    if (favorite_client_ids !== undefined) updates.favorite_client_ids = favorite_client_ids

    if (last_client_id) {
      const current = existing?.recent_client_ids || []
      const filtered = current.filter((id) => id !== last_client_id)
      updates.recent_client_ids = [last_client_id, ...filtered].slice(0, 10)
    } else if (recent_client_ids !== undefined) {
      updates.recent_client_ids = recent_client_ids
    }

    const { data, error } = await ctx.adminSupabase
      .from('user_operation_context')
      .upsert(
        { user_id: ctx.user.id, workspace_id: ctx.workspaceId, ...updates },
        { onConflict: 'user_id,workspace_id' }
      )
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ context: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
