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

    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('archived') === 'true'
    const today = new Date().toISOString().split('T')[0]

    let query = ctx.adminSupabase
      .from('task_spaces')
      .select('*')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .or(`is_private.eq.false,owner_id.eq.${ctx.user.id}`)
      .order('sort_order', { ascending: true })

    if (!includeArchived) query = query.eq('is_archived', false)

    const { data: spaces, error } = await query
    if (error) throw error

    // Get closed status ids for this workspace (once, shared across spaces)
    const { data: statuses } = await ctx.adminSupabase
      .from('task_statuses')
      .select('id, is_closed')
      .eq('workspace_id', ctx.accessContext.workspaceId)

    const closedIds = new Set((statuses || []).filter(s => s.is_closed).map(s => s.id))

    const spacesWithCounts = await Promise.all((spaces || []).map(async (space) => {
      const { data: tasks } = await ctx.adminSupabase
        .from('tasks')
        .select('id, due_date, status_id')
        .eq('space_id', space.id)
        .eq('is_archived', false)

      const taskList = tasks || []
      const total = taskList.length
      const completed = taskList.filter(t => closedIds.has(t.status_id)).length
      const overdue = taskList.filter(t => t.due_date && t.due_date < today && !closedIds.has(t.status_id)).length

      return { ...space, task_count: total, completed_count: completed, overdue_count: overdue }
    }))

    return NextResponse.json({ spaces: spacesWithCounts })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()

    // Duplicate action
    if (body.action === 'duplicate') {
      const sourceId = String(body.source_id || '').trim()
      if (!sourceId) return NextResponse.json({ error: 'source_id obrigatório.' }, { status: 400 })

      const { data: source, error: srcErr } = await ctx.adminSupabase
        .from('task_spaces')
        .select('*')
        .eq('id', sourceId)
        .single()
      if (srcErr) throw srcErr

      const { data: newSpace, error: insErr } = await ctx.adminSupabase
        .from('task_spaces')
        .insert({
          workspace_id: ctx.accessContext.workspaceId,
          name: body.name || `${source.name} (cópia)`,
          description: source.description,
          color: source.color,
          icon: source.icon,
          is_private: source.is_private,
          owner_id: ctx.user.id,
          sort_order: 0,
          space_type: source.space_type,
          default_view: source.default_view || 'list',
        })
        .select('*')
        .single()
      if (insErr) throw insErr

      // Optionally copy tasks
      if (body.copy_tasks) {
        const { data: sourceTasks } = await ctx.adminSupabase
          .from('tasks')
          .select('*')
          .eq('space_id', sourceId)
          .eq('is_archived', false)

        if (sourceTasks && sourceTasks.length > 0) {
          const newTasks = sourceTasks.map(({ id, created_at, updated_at, ...t }) => ({
            ...t,
            space_id: newSpace.id,
            assignee_id: body.copy_assignees ? t.assignee_id : null,
          }))
          await ctx.adminSupabase.from('tasks').insert(newTasks)
        }
      }

      return NextResponse.json({ space: { ...newSpace, task_count: 0, completed_count: 0, overdue_count: 0 } })
    }

    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'name obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('task_spaces')
      .insert({
        workspace_id: ctx.accessContext.workspaceId,
        name,
        description: body.description || null,
        color: body.color || '#6366f1',
        icon: body.icon || 'bx-folder',
        is_private: Boolean(body.is_private),
        owner_id: ctx.user.id,
        sort_order: 0,
        space_type: body.space_type || 'standard',
        default_view: body.default_view || 'list',
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ space: { ...data, task_count: 0, completed_count: 0, overdue_count: 0 } })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString(), updated_by: ctx.user.id }
    if (body.name !== undefined) updates.name = String(body.name).trim()
    if (body.description !== undefined) updates.description = body.description
    if (body.color !== undefined) updates.color = String(body.color).trim()
    if (body.icon !== undefined) updates.icon = String(body.icon).trim()
    if (body.is_private !== undefined) updates.is_private = Boolean(body.is_private)
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)
    if (body.default_view !== undefined) updates.default_view = String(body.default_view)
    if (body.space_type !== undefined) updates.space_type = String(body.space_type)
    if (body.status_template_id !== undefined) updates.status_template_id = body.status_template_id || null
    if (body.is_archived !== undefined) {
      updates.is_archived = Boolean(body.is_archived)
      updates.archived_at = body.is_archived ? new Date().toISOString() : null
      updates.archived_by = body.is_archived ? ctx.user.id : null
    }

    const { data, error } = await ctx.adminSupabase
      .from('task_spaces')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', ctx.user.id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ space: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('task_spaces')
      .delete()
      .eq('id', id)
      .eq('owner_id', ctx.user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
