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

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const today = new Date().toISOString().split('T')[0]

    // Get spaces for this workspace
    const { data: spaces, error } = await ctx.adminSupabase
      .from('task_spaces')
      .select('*')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .or(`is_private.eq.false,owner_id.eq.${ctx.user.id}`)
      .order('sort_order', { ascending: true })

    if (error) throw error

    // For each space, compute counts
    const spacesWithCounts = await Promise.all((spaces || []).map(async (space) => {
      const { data: tasks } = await ctx.adminSupabase
        .from('tasks')
        .select('id, due_date, status_id')
        .eq('space_id', space.id)
        .eq('is_archived', false)

      const taskList = tasks || []

      // Get closed status ids for this workspace
      const { data: statuses } = await ctx.adminSupabase
        .from('task_statuses')
        .select('id, is_closed')
        .eq('workspace_id', ctx.accessContext.workspaceId)

      const closedIds = new Set((statuses || []).filter(s => s.is_closed).map(s => s.id))

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

    const updates = {}
    if (body.name !== undefined) updates.name = String(body.name).trim()
    if (body.description !== undefined) updates.description = body.description
    if (body.color !== undefined) updates.color = String(body.color).trim()
    if (body.icon !== undefined) updates.icon = String(body.icon).trim()
    if (body.is_private !== undefined) updates.is_private = Boolean(body.is_private)
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)

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
