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
  return { user, accessContext, adminSupabase }
}

export async function GET(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id } = await params

    const { data: task, error } = await ctx.adminSupabase
      .from('tasks')
      .select('*, task_statuses(id, label, color)')
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .single()

    if (error) throw error

    const [{ data: checklist }, { data: subtasks }, { data: comments }] = await Promise.all([
      ctx.adminSupabase.from('task_checklist_items').select('*').eq('task_id', id).order('sort_order'),
      ctx.adminSupabase.from('tasks').select('*, task_statuses(id, label, color)').eq('parent_task_id', id).eq('is_archived', false).order('sort_order'),
      ctx.adminSupabase.from('task_comments').select('*').eq('task_id', id).order('created_at'),
    ])

    return NextResponse.json({
      task: { ...task, status: task.task_statuses || null },
      checklist: checklist || [],
      subtasks: (subtasks || []).map(s => ({ ...s, status: s.task_statuses || null })),
      comments: comments || [],
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
    const fields = ['title', 'description', 'status_id', 'priority', 'assignee_id', 'client_id', 'due_date', 'start_date', 'sort_order', 'is_archived']
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f]
    }

    const { data, error } = await ctx.adminSupabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .select('*, task_statuses(id, label, color)')
      .single()

    if (error) throw error
    return NextResponse.json({ task: { ...data, status: data.task_statuses || null } })
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
      const { error } = await ctx.adminSupabase.from('tasks').delete().eq('id', id).eq('workspace_id', ctx.accessContext.workspaceId)
      if (error) throw error
    } else {
      const { error } = await ctx.adminSupabase.from('tasks').update({ is_archived: true, updated_at: new Date().toISOString() }).eq('id', id).eq('workspace_id', ctx.accessContext.workspaceId)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
