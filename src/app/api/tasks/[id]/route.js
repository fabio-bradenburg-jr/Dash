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

export async function GET(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id } = await params

    const { data: task, error } = await ctx.adminSupabase
      .from('tasks')
      .select('*, task_status_items(id, name, color)')
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .single()

    if (error) throw error

    const [{ data: checklist }, { data: subtasks }, { data: comments }, { data: assignees }, { data: fieldValues }] = await Promise.all([
      ctx.adminSupabase.from('task_checklist_items').select('*').eq('task_id', id).order('sort_order'),
      ctx.adminSupabase.from('tasks').select('*, task_status_items(id, name, color)').eq('parent_task_id', id).eq('is_archived', false).order('sort_order'),
      ctx.adminSupabase.from('task_comments').select('*').eq('task_id', id).order('created_at'),
      ctx.adminSupabase.from('task_assignees').select('user_id, assigned_at').eq('task_id', id),
      ctx.adminSupabase.from('task_custom_field_values').select('field_id, value_text, value_number, value_date, value_bool, value_json').eq('task_id', id),
    ])

    // Expõe status_item_id como status_id para o frontend (modelo canônico task_status_items)
    const mapStatus = (t) => {
      const si = t.task_status_items
      return { ...t, status_id: t.status_item_id ?? t.status_id ?? null, status: si ? { id: si.id, label: si.name, color: si.color } : null }
    }

    return NextResponse.json({
      task: mapStatus(task),
      checklist: checklist || [],
      subtasks: (subtasks || []).map(mapStatus),
      comments: comments || [],
      assignees: (assignees || []).map(a => a.user_id),
      fieldValues: fieldValues || [],
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id } = await params
    const body = await request.json()

    const updates = { updated_at: new Date().toISOString() }
    const fields = ['title', 'description', 'priority', 'assignee_id', 'client_id', 'due_date', 'start_date', 'sort_order', 'is_archived']
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f]
    }
    // status_id vindo do frontend mapeia para status_item_id no banco (modelo canônico)
    if (body.status_id !== undefined) updates.status_item_id = body.status_id
    if (body.status_item_id !== undefined) updates.status_item_id = body.status_item_id

    // Snapshot antes da mudança, para o log de atividade (estilo ClickUp)
    const { data: before } = await ctx.adminSupabase
      .from('tasks')
      .select('title, description, status_item_id, priority, assignee_id, client_id, due_date, start_date, closed_at')
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .maybeSingle()

    // Rastreia fechamento/reabertura quando o status muda para/de um status "closed"
    const newStatusItemId = updates.status_item_id
    if (newStatusItemId !== undefined) {
      if (newStatusItemId) {
        const { data: statusItem } = await ctx.adminSupabase
          .from('task_status_items')
          .select('is_closed')
          .eq('id', newStatusItemId)
          .single()
        if (statusItem?.is_closed && !before?.closed_at) {
          updates.closed_at = new Date().toISOString()
          updates.closed_by = ctx.user.id
        } else if (!statusItem?.is_closed && before?.closed_at) {
          updates.closed_at = null
          updates.closed_by = null
        }
      } else if (before?.closed_at) {
        updates.closed_at = null
        updates.closed_by = null
      }
    }

    const { data, error } = await ctx.adminSupabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .select('*, task_status_items(id, name, color)')
      .single()

    if (error) throw error

    // Registra mudanças relevantes no task_activity_log (não bloqueia a resposta em caso de falha)
    try {
      if (before) {
        const beforeCompat = { ...before, status_id: before.status_item_id }
        const TRACKED = ['status_id', 'priority', 'assignee_id', 'client_id', 'due_date', 'start_date', 'title', 'description']
        const logs = TRACKED
          .filter(f => body[f] !== undefined && String(beforeCompat[f] ?? '') !== String(body[f] ?? ''))
          .map(f => ({
            task_id: id,
            workspace_id: ctx.accessContext.workspaceId,
            actor_id: ctx.user.id,
            action: `${f}_changed`,
            metadata: { field: f, from: beforeCompat[f] ?? null, to: body[f] ?? null },
          }))
        if (logs.length) await ctx.adminSupabase.from('task_activity_log').insert(logs)
      }
    } catch (logError) {
      console.warn('task activity log failed:', logError?.message)
    }

    // Sync multi-assignees if provided
    if (Array.isArray(body.assignee_ids)) {
      await ctx.adminSupabase.from('task_assignees').delete().eq('task_id', id)
      if (body.assignee_ids.length > 0) {
        await ctx.adminSupabase.from('task_assignees').insert(
          body.assignee_ids.map(uid => ({ task_id: id, user_id: uid, assigned_by: ctx.user.id }))
        )
      }
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

export async function DELETE(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id } = await params
    const hard = new URL(request.url).searchParams.get('hard') === 'true'

    if (hard) {
      // Log before deleting
      await ctx.adminSupabase.from('task_activity_log').insert({
        task_id: id,
        workspace_id: ctx.accessContext.workspaceId,
        actor_id: ctx.user.id,
        action: 'deleted',
        metadata: {},
      })
      const { error } = await ctx.adminSupabase.from('tasks').delete().eq('id', id).eq('workspace_id', ctx.accessContext.workspaceId)
      if (error) throw error
    } else {
      const { error } = await ctx.adminSupabase.from('tasks').update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        archived_by: ctx.user.id,
        updated_at: new Date().toISOString(),
      }).eq('id', id).eq('workspace_id', ctx.accessContext.workspaceId)
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
