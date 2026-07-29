import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { evaluateConditions, executeAction, calcNextRun, isRecurrenceExpired } from '@/lib/server/automation-engine'

function checkSecret(request) {
  const authHeader = request.headers.get('authorization') || ''
  const secret = process.env.CRON_SECRET
  // Fail-closed em produção: sem CRON_SECRET configurado, nega o acesso.
  // Em desenvolvimento, permite para facilitar testes locais.
  if (!secret) return process.env.NODE_ENV !== 'production'
  return authHeader === `Bearer ${secret}` || authHeader === secret
}

export async function GET(request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  const results = { automations: [], recurring_tasks: [], errors: [] }

  // ── 1. Process automation_queue ──────────────────────────────────────────

  try {
    const { data: queueItems, error: qErr } = await adminSupabase
      .from('automation_queue')
      .select('*, automations(*, automation_conditions(*), automation_actions(*))')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(50)

    if (qErr) throw qErr

    for (const item of queueItems || []) {
      const automation = item.automations
      if (!automation || !automation.is_active) {
        await adminSupabase.from('automation_queue').update({ status: 'skipped' }).eq('id', item.id)
        continue
      }

      // Mark as processing
      await adminSupabase.from('automation_queue').update({ status: 'processing' }).eq('id', item.id)

      const runInsert = {
        automation_id: automation.id,
        started_at: new Date().toISOString(),
        trigger_data: item.trigger_data || {},
      }
      const { data: run } = await adminSupabase.from('automation_runs').insert(runInsert).select().single()

      try {
        const triggerData = item.trigger_data || {}
        const conditions = (automation.automation_conditions || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        const actions = (automation.automation_actions || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

        // Evaluate conditions
        const conditionsMet = evaluateConditions(conditions, triggerData)
        if (!conditionsMet) {
          await adminSupabase.from('automation_runs').update({
            status: 'skipped',
            finished_at: new Date().toISOString(),
            result: { reason: 'conditions_not_met' },
          }).eq('id', run.id)
          await adminSupabase.from('automation_queue').update({ status: 'skipped' }).eq('id', item.id)
          results.automations.push({ queue_id: item.id, status: 'skipped', reason: 'conditions_not_met' })
          continue
        }

        // Execute actions sequentially
        const actionResults = []
        for (const action of actions) {
          const result = await executeAction(action, {
            adminSupabase,
            workspaceId: automation.workspace_id,
            triggerData,
          })
          actionResults.push({ action_type: action.action_type, result })
        }

        await adminSupabase.from('automation_runs').update({
          status: 'success',
          finished_at: new Date().toISOString(),
          result: { actions: actionResults },
        }).eq('id', run.id)
        await adminSupabase.from('automation_queue').update({ status: 'done' }).eq('id', item.id)
        results.automations.push({ queue_id: item.id, status: 'success' })
      } catch (actionErr) {
        await adminSupabase.from('automation_runs').update({
          status: 'error',
          finished_at: new Date().toISOString(),
          error_message: actionErr.message,
        }).eq('id', run?.id)
        await adminSupabase.from('automation_queue').update({
          status: 'error',
          error_message: actionErr.message,
        }).eq('id', item.id)
        results.errors.push({ queue_id: item.id, error: actionErr.message })
      }
    }
  } catch (err) {
    results.errors.push({ phase: 'automation_queue', error: err.message })
  }

  // ── 2. Process recurring_tasks ──────────────────────────────────────────

  try {
    const now = new Date().toISOString()
    const { data: recurringTasks, error: rtErr } = await adminSupabase
      .from('recurring_tasks')
      .select('*, task_templates(*)')
      .eq('is_active', true)
      .lte('next_run_at', now)

    if (rtErr) throw rtErr

    for (const rt of recurringTasks || []) {
      try {
        // Count existing occurrences
        const { count: occurrenceCount } = await adminSupabase
          .from('recurring_task_occurrences')
          .select('id', { count: 'exact', head: true })
          .eq('recurring_task_id', rt.id)

        const nextRun = calcNextRun(rt.recurrence_rule, new Date())
        const expired = isRecurrenceExpired(
          { end_date: rt.end_date, max_occurrences: rt.max_occurrences },
          occurrenceCount || 0,
          nextRun
        )

        // Create a task from the template fields
        const template = rt.task_templates
        const templateFields = template?.fields || {}
        const taskInsert = {
          workspace_id: rt.workspace_id,
          title: templateFields.title || rt.name,
          description: templateFields.description || null,
          priority: templateFields.priority || 'none',
          status_id: templateFields.status_id || null,
          assignee_id: templateFields.assignee_id || null,
          client_id: templateFields.client_id || null,
          due_date: templateFields.due_date || null,
          created_at: new Date().toISOString(),
        }
        const { data: task, error: taskErr } = await adminSupabase
          .from('tasks')
          .insert(taskInsert)
          .select()
          .single()
        if (taskErr) throw taskErr

        // Insert occurrence record
        await adminSupabase.from('recurring_task_occurrences').insert({
          recurring_task_id: rt.id,
          task_id: task.id,
          scheduled_for: rt.next_run_at,
          created_at: new Date().toISOString(),
        })

        // Update recurring task: advance next_run_at or deactivate if expired
        if (expired) {
          await adminSupabase
            .from('recurring_tasks')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', rt.id)
          results.recurring_tasks.push({ id: rt.id, status: 'expired', task_id: task.id })
        } else {
          await adminSupabase
            .from('recurring_tasks')
            .update({
              next_run_at: nextRun.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', rt.id)
          results.recurring_tasks.push({ id: rt.id, status: 'processed', task_id: task.id, next_run_at: nextRun.toISOString() })
        }
      } catch (rtItemErr) {
        results.errors.push({ recurring_task_id: rt.id, error: rtItemErr.message })
      }
    }
  } catch (err) {
    results.errors.push({ phase: 'recurring_tasks', error: err.message })
  }

  return NextResponse.json({ ok: true, results })
}

// Also allow POST for flexibility
export const POST = GET
