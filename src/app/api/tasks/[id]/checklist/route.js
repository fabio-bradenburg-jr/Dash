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

async function verifyTaskAccess(adminSupabase, taskId, workspaceId) {
  const { data } = await adminSupabase.from('tasks').select('id').eq('id', taskId).eq('workspace_id', workspaceId).single()
  return !!data
}

export async function GET(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id: taskId } = await params
    const ok = await verifyTaskAccess(ctx.adminSupabase, taskId, ctx.accessContext.workspaceId)
    if (!ok) return NextResponse.json({ error: 'Task não encontrada.' }, { status: 404 })

    const { data, error } = await ctx.adminSupabase
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('sort_order')

    if (error) throw error
    return NextResponse.json({ items: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id: taskId } = await params
    const ok = await verifyTaskAccess(ctx.adminSupabase, taskId, ctx.accessContext.workspaceId)
    if (!ok) return NextResponse.json({ error: 'Task não encontrada.' }, { status: 404 })

    const body = await request.json()
    const label = String(body.label || '').trim()
    if (!label) return NextResponse.json({ error: 'label obrigatório.' }, { status: 400 })

    const { data: maxRow } = await ctx.adminSupabase
      .from('task_checklist_items')
      .select('sort_order')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sort_order = (maxRow?.sort_order ?? -1) + 1

    const { data, error } = await ctx.adminSupabase
      .from('task_checklist_items')
      .insert({ task_id: taskId, label, sort_order })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id: taskId } = await params
    const ok = await verifyTaskAccess(ctx.adminSupabase, taskId, ctx.accessContext.workspaceId)
    if (!ok) return NextResponse.json({ error: 'Task não encontrada.' }, { status: 404 })

    const body = await request.json()
    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = {}
    if (body.label !== undefined) updates.label = String(body.label).trim()
    if (body.is_done !== undefined) updates.is_done = Boolean(body.is_done)
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)
    if (body.assignee_id !== undefined) updates.assignee_id = body.assignee_id

    const { data, error } = await ctx.adminSupabase
      .from('task_checklist_items')
      .update(updates)
      .eq('id', id)
      .eq('task_id', taskId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id: taskId } = await params
    const ok = await verifyTaskAccess(ctx.adminSupabase, taskId, ctx.accessContext.workspaceId)
    if (!ok) return NextResponse.json({ error: 'Task não encontrada.' }, { status: 404 })

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('task_checklist_items')
      .delete()
      .eq('id', id)
      .eq('task_id', taskId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
