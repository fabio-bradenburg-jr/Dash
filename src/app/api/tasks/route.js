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
    const status_id = url.searchParams.get('status_id')
    const assignee_id = url.searchParams.get('assignee_id')
    const client_id = url.searchParams.get('client_id')
    const archived = url.searchParams.get('archived') === 'true'

    if (archived) {
      let query = ctx.adminSupabase
        .from('tasks')
        .select('*, task_status_items(id, name, color)')
        .eq('workspace_id', workspaceId)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false })

      if (status_id) query = query.eq('status_item_id', status_id)
      if (assignee_id) query = query.eq('assignee_id', assignee_id)
      if (client_id) query = query.eq('client_id', client_id)

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
    }

    let query = ctx.adminSupabase
      .from('tasks')
      .select(`
        *,
        task_status_items(id, name, color),
        subtask_count:tasks(count)
      `)
      .eq('workspace_id', workspaceId)
      .eq('is_archived', false)
      .is('parent_task_id', null)
      .order('sort_order', { ascending: true })

    if (status_id) query = query.eq('status_item_id', status_id)
    if (assignee_id) query = query.eq('assignee_id', assignee_id)
    if (client_id) query = query.eq('client_id', client_id)

    const { data, error } = await query
    if (error) throw error

    // Fetch subtask counts separately
    const taskIds = (data || []).map(t => t.id)
    let subtaskCounts = {}
    if (taskIds.length > 0) {
      const { data: subtasks } = await ctx.adminSupabase
        .from('tasks')
        .select('parent_task_id')
        .in('parent_task_id', taskIds)
        .eq('is_archived', false)
      if (subtasks) {
        for (const s of subtasks) {
          subtaskCounts[s.parent_task_id] = (subtaskCounts[s.parent_task_id] || 0) + 1
        }
      }
    }

    const tasks = (data || []).map(t => {
      const si = t.task_status_items
      return {
        ...t,
        // Expose status_item_id as status_id so the frontend needs no changes
        status_id: t.status_item_id ?? t.status_id ?? null,
        status: si ? { id: si.id, label: si.name, color: si.color } : null,
        subtask_count: subtaskCounts[t.id] || 0,
      }
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const title = String(body.title || '').trim()
    if (!title) return NextResponse.json({ error: 'title obrigatório.' }, { status: 400 })

    const { data: maxRow } = await ctx.adminSupabase
      .from('tasks')
      .select('sort_order')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sort_order = (maxRow?.sort_order ?? -1) + 1

    const insert = {
      workspace_id: ctx.accessContext.workspaceId,
      title,
      sort_order,
      created_by: ctx.user.id,
      priority: body.priority || 'none',
    }
    // status_id from frontend maps to status_item_id in DB
    if (body.status_id) insert.status_item_id = body.status_id
    if (body.status_item_id) insert.status_item_id = body.status_item_id
    if (body.assignee_id) insert.assignee_id = body.assignee_id
    if (body.client_id) insert.client_id = body.client_id
    if (body.due_date) insert.due_date = body.due_date
    if (body.description) insert.description = body.description
    if (body.parent_task_id) insert.parent_task_id = body.parent_task_id
    if (body.space_id) insert.space_id = body.space_id
    if (body.dia_semana !== undefined) insert.dia_semana = body.dia_semana
    if (body.recorrente) insert.recorrente = body.recorrente
    if (body.horario) insert.horario = body.horario
    if (body.ordem !== undefined) insert.ordem = body.ordem

    const { data, error } = await ctx.adminSupabase
      .from('tasks')
      .insert(insert)
      .select('*, task_status_items(id, name, color)')
      .single()

    if (error) throw error
    const si = data.task_status_items
    return NextResponse.json({ task: {
      ...data,
      status_id: data.status_item_id ?? null,
      status: si ? { id: si.id, label: si.name, color: si.color } : null,
    } })
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

    const updates = { updated_at: new Date().toISOString() }
    const fields = ['title', 'description', 'priority', 'assignee_id', 'client_id', 'due_date', 'start_date', 'sort_order', 'is_archived', 'parent_task_id', 'space_id', 'dia_semana', 'recorrente', 'horario', 'ordem', 'is_recurring', 'recurring_type', 'recurring_interval', 'recurring_days', 'recurring_end_type', 'recurring_end_date', 'recurring_occurrences', 'recurring_occurrences_done', 'create_when', 'copy_description', 'copy_checklist', 'copy_assignees', 'copy_attachments', 'copy_subtasks', 'copy_tags', 'last_generated_at', 'next_generation_at', 'recurring_parent_id']
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f]
    }
    // status_id from frontend maps to status_item_id in DB
    if (body.status_id !== undefined) updates.status_item_id = body.status_id
    if (body.status_item_id !== undefined) updates.status_item_id = body.status_item_id

    // Fetch current task state to handle closed/archived transitions
    const { data: currentTask } = await ctx.adminSupabase
      .from('tasks')
      .select('closed_at, archived_at, status_item_id')
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .single()

    // Handle status closed tracking
    const newStatusItemId = updates.status_item_id
    if (newStatusItemId !== undefined) {
      if (newStatusItemId) {
        // Check if the new status is a closed status
        const { data: statusItem } = await ctx.adminSupabase
          .from('task_status_items')
          .select('is_closed')
          .eq('id', newStatusItemId)
          .single()

        if (statusItem?.is_closed && !currentTask?.closed_at) {
          updates.closed_at = new Date().toISOString()
          updates.closed_by = ctx.user.id
        } else if (!statusItem?.is_closed && currentTask?.closed_at) {
          updates.closed_at = null
          updates.closed_by = null
        }
      } else {
        // Clearing status — also clear closed
        if (currentTask?.closed_at) {
          updates.closed_at = null
          updates.closed_by = null
        }
      }
    }

    // Handle archive/restore tracking
    if (body.is_archived === true && !currentTask?.archived_at) {
      updates.archived_at = new Date().toISOString()
      updates.archived_by = ctx.user.id
    } else if (body.is_archived === false && currentTask?.archived_at) {
      updates.archived_at = null
      updates.archived_by = null
    }

    const { data, error } = await ctx.adminSupabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .select('*, task_status_items(id, name, color)')
      .single()

    if (error) throw error

    // Log activity
    let action = null
    if (body.is_archived === true) action = 'archived'
    else if (body.is_archived === false && currentTask?.archived_at) action = 'restored'
    else if (newStatusItemId !== undefined) {
      if (updates.closed_at && !currentTask?.closed_at) action = 'closed'
      else if (!updates.closed_at && currentTask?.closed_at) action = 'reopened'
    }

    if (action) {
      await ctx.adminSupabase.from('task_activity_log').insert({
        task_id: id,
        workspace_id: ctx.accessContext.workspaceId,
        actor_id: ctx.user.id,
        action,
        metadata: {},
      })
    }

    const si = data.task_status_items
    return NextResponse.json({ task: {
      ...data,
      status_id: data.status_item_id ?? null,
      status: si ? { id: si.id, label: si.name, color: si.color } : null,
    } })
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
      // Log before deleting (cascade will remove the log entry too, but we log the intent)
      await ctx.adminSupabase.from('task_activity_log').insert({
        task_id: id,
        workspace_id: ctx.accessContext.workspaceId,
        actor_id: ctx.user.id,
        action: 'deleted',
        metadata: {},
      })

      const { error } = await ctx.adminSupabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('workspace_id', ctx.accessContext.workspaceId)
      if (error) throw error
    } else {
      const { error } = await ctx.adminSupabase
        .from('tasks')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: ctx.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('workspace_id', ctx.accessContext.workspaceId)
      if (error) throw error

      await ctx.adminSupabase.from('task_activity_log').insert({
        task_id: id,
        workspace_id: ctx.accessContext.workspaceId,
        actor_id: ctx.user.id,
        action: 'archived',
        metadata: {},
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
