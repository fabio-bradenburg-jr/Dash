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

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const space_id = url.searchParams.get('space_id')
    const client_id = url.searchParams.get('client_id')
    const assignee_id = url.searchParams.get('assignee_id')
    const sort = url.searchParams.get('sort') || 'recent'

    let query = ctx.adminSupabase
      .from('tasks')
      .select('*, task_status_items(id, name, color)')
      .eq('workspace_id', workspaceId)
      .eq('is_archived', true)

    if (search) query = query.ilike('title', `%${search}%`)
    if (space_id) query = query.eq('space_id', space_id)
    if (client_id) query = query.eq('client_id', client_id)
    if (assignee_id) query = query.eq('assignee_id', assignee_id)

    if (sort === 'oldest') {
      query = query.order('archived_at', { ascending: true })
    } else if (sort === 'completed') {
      query = query.order('closed_at', { ascending: false, nullsFirst: false })
    } else {
      query = query.order('archived_at', { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error

    const tasks = (data || []).map(t => {
      const si = t.task_status_items
      return {
        ...t,
        status_id: t.status_item_id ?? t.status_id ?? null,
        status: si ? { id: si.id, label: si.name, color: si.color } : null,
      }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
