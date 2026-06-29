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

// Resolve or create operation_week for a given week_start (YYYY-MM-DD)
async function resolveWeek(adminSupabase, workspaceId, weekStart) {
  // Normalize to Monday
  const [y, m, d] = weekStart.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = dt.getUTCDay()
  dt.setUTCDate(dt.getUTCDate() - (dow === 0 ? 6 : dow - 1))
  const monday = dt.toISOString().slice(0, 10)
  dt.setUTCDate(dt.getUTCDate() + 6)
  const sunday = dt.toISOString().slice(0, 10)

  const [d1, m1] = monday.split('-').slice(1).map(Number)
  const [d2, m2] = sunday.split('-').slice(1).map(Number)
  const label = `${String(d1).padStart(2, '0')}/${String(m1).padStart(2, '0')} a ${String(d2).padStart(2, '0')}/${String(m2).padStart(2, '0')}`

  const { data, error } = await adminSupabase
    .from('operation_weeks')
    .upsert({ workspace_id: workspaceId, week_start: monday, week_end: sunday, label }, { onConflict: 'workspace_id,week_start' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

// Resolve or create a task_space named "Plano de Ação - DD/MM a DD/MM"
async function resolveActionPlanSpace(adminSupabase, workspaceId, userId, weekLabel) {
  const name = `Plano de Ação - ${weekLabel}`

  const { data: existing } = await adminSupabase
    .from('task_spaces')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('name', name)
    .maybeSingle()

  if (existing) return existing.id

  const { data: maxRow } = await adminSupabase
    .from('task_spaces')
    .select('sort_order')
    .eq('workspace_id', workspaceId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await adminSupabase
    .from('task_spaces')
    .insert({
      workspace_id: workspaceId,
      owner_id: userId,
      name,
      description: `Planos de ação da semana ${weekLabel}`,
      color: '#26c281',
      icon: 'bx-calendar-check',
      is_private: false,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

// Resolve initial status for tasks
async function resolveInitialStatus(adminSupabase, workspaceId) {
  const { data } = await adminSupabase
    .from('task_status_items')
    .select('id, task_status_templates!inner(workspace_id, is_default)')
    .eq('task_status_templates.workspace_id', workspaceId)
    .eq('task_status_templates.is_default', true)
    .eq('is_initial', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data?.id || null
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    const weekId = url.searchParams.get('week_id')
    const weekStart = url.searchParams.get('week_start')

    let query = ctx.adminSupabase
      .from('action_plans')
      .select('*, operation_weeks(id, week_start, week_end, label)')
      .eq('workspace_id', ctx.workspaceId)
      .order('sort_order', { ascending: true })

    if (clientId) query = query.eq('client_id', clientId)
    if (weekId) query = query.eq('week_id', weekId)
    if (weekStart) {
      const week = await resolveWeek(ctx.adminSupabase, ctx.workspaceId, weekStart)
      query = query.eq('week_id', week.id)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ plans: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { client_id, title, description, responsible_id, due_date, week_start, task_id: externalTaskId, task_public_id: externalTaskPublicId } = body

    if (!client_id || !title?.trim()) {
      return NextResponse.json({ error: 'client_id e title são obrigatórios.' }, { status: 400 })
    }

    // 1. Resolve week (defaults to previous Monday if not given)
    const ws = week_start || (() => {
      const now = new Date()
      const dow = now.getUTCDay()
      now.setUTCDate(now.getUTCDate() - (dow === 0 ? 13 : dow + 6))
      return now.toISOString().slice(0, 10)
    })()

    const week = await resolveWeek(ctx.adminSupabase, ctx.workspaceId, ws)

    // 2. Sort order
    const { data: maxRow } = await ctx.adminSupabase
      .from('action_plans')
      .select('sort_order')
      .eq('week_id', week.id)
      .eq('client_id', client_id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const sort_order = (maxRow?.sort_order ?? -1) + 1

    // 3. Create action plan record
    const { data: plan, error: planError } = await ctx.adminSupabase
      .from('action_plans')
      .insert({
        workspace_id: ctx.workspaceId,
        client_id,
        week_id: week.id,
        title: title.trim(),
        description: description?.trim() || null,
        responsible_id: responsible_id || null,
        due_date: due_date || null,
        status: 'pending',
        sort_order,
        created_by: ctx.user.id,
      })
      .select('*')
      .single()

    if (planError) throw planError

    // 4. If an external task_id is provided, link it directly (task already created via modal)
    if (externalTaskId) {
      await ctx.adminSupabase
        .from('action_plans')
        .update({ task_id: externalTaskId, task_public_id: externalTaskPublicId || null })
        .eq('id', plan.id)
      plan.task_id = externalTaskId
      plan.task_public_id = externalTaskPublicId || null
      return NextResponse.json({ plan })
    }

    // Otherwise auto-create task in Central de Tarefas
    try {
      const spaceId = await resolveActionPlanSpace(ctx.adminSupabase, ctx.workspaceId, ctx.user.id, week.label)
      const statusId = await resolveInitialStatus(ctx.adminSupabase, ctx.workspaceId)

      const taskPayload = {
        workspace_id: ctx.workspaceId,
        title: title.trim(),
        description: description?.trim() || null,
        assignee_id: responsible_id || null,
        due_date: due_date || null,
        client_id,
        week_id: week.id,
        space_id: spaceId,
        status_id: statusId,
        priority: 'none',
        is_archived: false,
        created_by: ctx.user.id,
        sort_order: sort_order,
      }

      const { data: task, error: taskError } = await ctx.adminSupabase
        .from('tasks')
        .insert(taskPayload)
        .select('id, task_public_id')
        .single()

      if (!taskError && task) {
        await ctx.adminSupabase
          .from('action_plans')
          .update({ task_id: task.id })
          .eq('id', plan.id)

        plan.task_id = task.id
        plan.task_public_id = task.task_public_id

        // Notify responsible if assigned
        if (responsible_id && responsible_id !== ctx.user.id) {
          await ctx.adminSupabase.from('notifications').insert({
            workspace_id: ctx.workspaceId,
            recipient_id: responsible_id,
            actor_id: ctx.user.id,
            type: 'task_assigned',
            title: 'Nova tarefa atribuída',
            body: title.trim(),
            entity_type: 'task',
            entity_id: task.id,
            task_id: task.id,
            client_id,
            deep_link: `/tarefas/${task.task_public_id}`,
          })
        }
      }
    } catch (_) {
      // Task creation is best-effort; plan is already saved
    }

    return NextResponse.json({ plan: { ...plan, week } })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { id, title, description, responsible_id, due_date, status, sort_order } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = String(title).trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (responsible_id !== undefined) updates.responsible_id = responsible_id || null
    if (due_date !== undefined) updates.due_date = due_date || null
    if (status !== undefined) updates.status = status
    if (sort_order !== undefined) updates.sort_order = Number(sort_order)

    const { data, error } = await ctx.adminSupabase
      .from('action_plans')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)
      .select('*, operation_weeks(id, week_start, week_end, label)')
      .single()

    if (error) throw error

    // Sync to linked task if exists
    if (data.task_id) {
      const taskUpdates = {}
      if (updates.title) taskUpdates.title = updates.title
      if (updates.description !== undefined) taskUpdates.description = updates.description
      if (updates.responsible_id !== undefined) taskUpdates.assignee_id = updates.responsible_id
      if (updates.due_date !== undefined) taskUpdates.due_date = updates.due_date
      if (Object.keys(taskUpdates).length > 0) {
        await ctx.adminSupabase.from('tasks').update(taskUpdates).eq('id', data.task_id)
      }
    }

    return NextResponse.json({ plan: data })
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

    const { data: plan } = await ctx.adminSupabase
      .from('action_plans')
      .select('task_id')
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)
      .single()

    const { error } = await ctx.adminSupabase
      .from('action_plans')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error

    // Soft-delete linked task
    if (plan?.task_id) {
      await ctx.adminSupabase.from('tasks').update({ is_archived: true }).eq('id', plan.task_id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
