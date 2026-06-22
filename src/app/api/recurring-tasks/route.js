import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { calcNextRun } from '@/lib/server/automation-engine'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext

    const { data, error } = await ctx.adminSupabase
      .from('recurring_tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ recurring_tasks: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const body = await request.json()

    const { name, recurrence_rule, template_id, is_active = true, end_date, max_occurrences } = body
    if (!name) return NextResponse.json({ error: 'name obrigatório.' }, { status: 400 })
    if (!recurrence_rule) return NextResponse.json({ error: 'recurrence_rule obrigatório.' }, { status: 400 })

    const next_run_at = calcNextRun(recurrence_rule).toISOString()

    const insert = {
      workspace_id: workspaceId,
      name,
      recurrence_rule,
      template_id: template_id || null,
      is_active,
      next_run_at,
      created_by: ctx.user.id,
    }
    if (end_date) insert.end_date = end_date
    if (max_occurrences != null) insert.max_occurrences = max_occurrences

    const { data, error } = await ctx.adminSupabase
      .from('recurring_tasks')
      .insert(insert)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ recurring_task: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const body = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    const allowed = ['name', 'recurrence_rule', 'template_id', 'is_active', 'end_date', 'max_occurrences']
    for (const f of allowed) {
      if (fields[f] !== undefined) updates[f] = fields[f]
    }

    // Recalculate next_run_at if recurrence_rule changed
    if (updates.recurrence_rule) {
      updates.next_run_at = calcNextRun(updates.recurrence_rule).toISOString()
    }

    const { data, error } = await ctx.adminSupabase
      .from('recurring_tasks')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ recurring_task: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const hard = url.searchParams.get('hard') === 'true'
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    if (hard) {
      const { error } = await ctx.adminSupabase
        .from('recurring_tasks')
        .delete()
        .eq('id', id)
        .eq('workspace_id', workspaceId)
      if (error) throw error
    } else {
      // Soft delete: deactivate
      const { error } = await ctx.adminSupabase
        .from('recurring_tasks')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('workspace_id', workspaceId)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
