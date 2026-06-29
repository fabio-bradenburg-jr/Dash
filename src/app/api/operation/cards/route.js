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

    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    const lane = url.searchParams.get('lane')
    const includeArchived = url.searchParams.get('archived') === 'true'

    let query = ctx.adminSupabase
      .from('operation_cards')
      .select('*')
      .eq('workspace_id', ctx.workspaceId)
      .order('created_at', { ascending: true })

    if (!includeArchived) query = query.eq('is_archived', false)
    if (clientId) query = query.eq('client_id', clientId)
    if (lane) query = query.eq('lane', lane)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ cards: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { client_id, title, task_type, lane, status, priority, content, assignee_ids, tags, due_date, start_date } = body

    if (!client_id || !title?.trim()) {
      return NextResponse.json({ error: 'client_id e title são obrigatórios.' }, { status: 400 })
    }

    const task_code = `OP-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const { data, error } = await ctx.adminSupabase
      .from('operation_cards')
      .insert({
        workspace_id: ctx.workspaceId,
        task_code,
        client_id,
        title: title.trim(),
        task_type: task_type || 'Tarefa',
        lane: lane || 'ongoing',
        status: status || 'aberto',
        priority: priority || 'sem_prioridade',
        content: content?.trim() || null,
        assignee_ids: Array.isArray(assignee_ids) ? assignee_ids : [],
        tags: Array.isArray(tags) ? tags : [],
        due_date: due_date || null,
        start_date: start_date || null,
        created_by: ctx.user.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ card: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const allowed = ['title', 'content', 'lane', 'status', 'priority', 'task_type',
      'assignee_ids', 'tags', 'due_date', 'start_date', 'subtasks', 'comments',
      'custom_field_values', 'time_estimate_minutes', 'time_tracked_minutes',
      'time_tracker_started_at', 'segment', 'tier', 'squad', 'is_archived']

    const updates = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (rest[key] !== undefined) updates[key] = rest[key]
    }

    const { data, error } = await ctx.adminSupabase
      .from('operation_cards')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ card: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const hard = url.searchParams.get('hard') === 'true'

    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    if (hard) {
      const { error } = await ctx.adminSupabase
        .from('operation_cards')
        .delete()
        .eq('id', id)
        .eq('workspace_id', ctx.workspaceId)
      if (error) throw error
    } else {
      const { error } = await ctx.adminSupabase
        .from('operation_cards')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', ctx.workspaceId)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
