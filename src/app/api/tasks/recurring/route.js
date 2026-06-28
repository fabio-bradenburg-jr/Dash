import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase, workspaceId: accessContext.workspaceId }
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCMonth(d.getUTCMonth() + n)
  return d.toISOString().split('T')[0]
}

function addYears(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCFullYear(d.getUTCFullYear() + n)
  return d.toISOString().split('T')[0]
}

function computeNextDate(task) {
  const base = task.due_date || new Date().toISOString().split('T')[0]
  const interval = task.recurring_interval || 1
  const type = task.recurring_type

  if (type === 'daily') return addDays(base, interval)
  if (type === 'weekly') {
    if (task.recurring_days?.length) {
      // Find next day-of-week after current
      const baseDow = new Date(base + 'T00:00:00Z').getUTCDay()
      const days = [...task.recurring_days].sort((a, b) => a - b)
      // Find next dow in the list after today
      const nextDow = days.find(d => d > baseDow) ?? days[0]
      const diff = nextDow > baseDow ? nextDow - baseDow : 7 - baseDow + nextDow
      return addDays(base, diff + (nextDow <= baseDow ? (interval - 1) * 7 : (interval - 1) * 7))
    }
    return addDays(base, 7 * interval)
  }
  if (type === 'monthly') return addMonths(base, interval)
  if (type === 'yearly') return addYears(base, interval)
  if (type === 'custom') return addDays(base, interval)
  return addDays(base, 7) // default weekly
}

// POST /api/tasks/recurring — generate next instance of a recurring task
export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { task_id } = await request.json()
    if (!task_id) return NextResponse.json({ error: 'task_id obrigatório.' }, { status: 400 })

    // Fetch the source task
    const { data: task, error: fetchErr } = await ctx.adminSupabase
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .eq('workspace_id', ctx.workspaceId)
      .single()

    if (fetchErr || !task) return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 })
    if (!task.is_recurring) return NextResponse.json({ error: 'Tarefa não é recorrente.' }, { status: 400 })

    // Check end conditions
    const occurrencesDone = (task.recurring_occurrences_done || 0) + 1
    if (task.recurring_end_type === 'after' && task.recurring_occurrences && occurrencesDone > task.recurring_occurrences) {
      // Disable recurrence
      await ctx.adminSupabase.from('tasks').update({ is_recurring: false }).eq('id', task_id)
      return NextResponse.json({ stopped: true, reason: 'max_occurrences' })
    }

    const nextDate = computeNextDate(task)

    if (task.recurring_end_type === 'on_date' && task.recurring_end_date && nextDate > task.recurring_end_date) {
      await ctx.adminSupabase.from('tasks').update({ is_recurring: false }).eq('id', task_id)
      return NextResponse.json({ stopped: true, reason: 'end_date' })
    }

    // Build new task payload
    const newTask = {
      workspace_id: ctx.workspaceId,
      title: task.title,
      space_id: task.space_id,
      status_item_id: null, // reset to no status (initial will be set)
      priority: task.priority,
      due_date: nextDate,
      dia_semana: task.dia_semana,
      recorrente: task.recorrente,
      is_recurring: true,
      recurring_type: task.recurring_type,
      recurring_interval: task.recurring_interval,
      recurring_days: task.recurring_days,
      recurring_end_type: task.recurring_end_type,
      recurring_end_date: task.recurring_end_date,
      recurring_occurrences: task.recurring_occurrences,
      recurring_occurrences_done: occurrencesDone,
      create_when: task.create_when,
      copy_description: task.copy_description,
      copy_checklist: task.copy_checklist,
      copy_assignees: task.copy_assignees,
      copy_attachments: task.copy_attachments,
      copy_subtasks: task.copy_subtasks,
      copy_tags: task.copy_tags,
      recurring_parent_id: task.recurring_parent_id || task.id,
      created_by: ctx.user.id,
      sort_order: task.sort_order,
    }

    if (task.copy_description) newTask.description = task.description
    if (task.copy_assignees) newTask.assignee_id = task.assignee_id

    // Get initial status
    const { data: initStatus } = await ctx.adminSupabase
      .from('task_status_items')
      .select('id')
      .eq('workspace_id', ctx.workspaceId)
      .eq('is_initial', true)
      .limit(1)
      .maybeSingle()

    if (initStatus) newTask.status_item_id = initStatus.id

    const { data: created, error: createErr } = await ctx.adminSupabase
      .from('tasks')
      .insert(newTask)
      .select('*, task_status_items(id, name, color)')
      .single()

    if (createErr) throw createErr

    // Copy checklist if needed
    if (task.copy_checklist) {
      const { data: checkItems } = await ctx.adminSupabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', task.id)
      if (checkItems?.length) {
        await ctx.adminSupabase.from('task_checklist_items').insert(
          checkItems.map(({ id, task_id, ...rest }) => ({ ...rest, task_id: created.id, is_done: false }))
        )
      }
    }

    // Update original task: mark last_generated_at
    await ctx.adminSupabase.from('tasks').update({
      last_generated_at: new Date().toISOString(),
      next_generation_at: nextDate,
      recurring_occurrences_done: occurrencesDone,
    }).eq('id', task.id)

    const si = created.task_status_items
    return NextResponse.json({
      task: {
        ...created,
        status_id: created.status_item_id ?? null,
        status: si ? { id: si.id, label: si.name, color: si.color } : null,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
