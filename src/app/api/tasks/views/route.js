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

const DEFAULT_COLUMNS = [
  { column_key: 'title',          label: 'Tarefa',        width: 280, is_visible: true,  is_pinned: true,  sort_order: 0 },
  { column_key: 'status',         label: 'Status',        width: 130, is_visible: true,  is_pinned: false, sort_order: 1 },
  { column_key: 'priority',       label: 'Prioridade',    width: 110, is_visible: true,  is_pinned: false, sort_order: 2 },
  { column_key: 'assignee',       label: 'Responsável',   width: 150, is_visible: true,  is_pinned: false, sort_order: 3 },
  { column_key: 'client',         label: 'Cliente',       width: 140, is_visible: true,  is_pinned: false, sort_order: 4 },
  { column_key: 'due_date',       label: 'Vencimento',    width: 120, is_visible: true,  is_pinned: false, sort_order: 5 },
  { column_key: 'task_public_id', label: 'ID',            width: 100, is_visible: true,  is_pinned: false, sort_order: 6 },
  { column_key: 'start_date',     label: 'Início',        width: 120, is_visible: false, is_pinned: false, sort_order: 7 },
  { column_key: 'created_at',     label: 'Criado em',     width: 130, is_visible: false, is_pinned: false, sort_order: 8 },
]

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const spaceId = new URL(request.url).searchParams.get('space_id')

    let query = ctx.adminSupabase
      .from('task_views')
      .select('*, task_view_columns(*)')
      .eq('owner_id', ctx.user.id)
      .order('created_at', { ascending: true })

    if (spaceId) query = query.eq('space_id', spaceId)
    else query = query.is('space_id', null)

    const { data, error } = await query
    if (error) throw error

    // Sort columns within each view
    const views = (data || []).map(v => ({
      ...v,
      columns: (v.task_view_columns || []).sort((a, b) => a.sort_order - b.sort_order),
    }))

    return NextResponse.json({ views })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { name, space_id, view_mode, group_by, filters, columns } = body

    if (!name?.trim()) return NextResponse.json({ error: 'name obrigatório.' }, { status: 400 })

    const { data: view, error: viewError } = await ctx.adminSupabase
      .from('task_views')
      .insert({
        workspace_id: ctx.workspaceId,
        owner_id: ctx.user.id,
        space_id: space_id || null,
        name: name.trim(),
        view_mode: view_mode || 'list',
        group_by: group_by || 'status',
        filters: filters || [],
      })
      .select('*')
      .single()

    if (viewError) throw viewError

    // Insert columns
    const colsToInsert = (columns || DEFAULT_COLUMNS).map((col, idx) => ({
      view_id: view.id,
      column_key: col.column_key,
      label: col.label,
      width: col.width || 160,
      is_visible: col.is_visible !== false,
      is_pinned: col.is_pinned || false,
      sort_order: col.sort_order ?? idx,
    }))

    const { data: cols } = await ctx.adminSupabase
      .from('task_view_columns')
      .insert(colsToInsert)
      .select('*')

    return NextResponse.json({ view: { ...view, columns: (cols || []).sort((a, b) => a.sort_order - b.sort_order) } })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { id, columns, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const allowed = ['name', 'view_mode', 'group_by', 'sort_by', 'sort_dir', 'filters', 'is_default']
    const updates = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (rest[key] !== undefined) updates[key] = rest[key]
    }

    const { data: view, error: viewError } = await ctx.adminSupabase
      .from('task_views')
      .update(updates)
      .eq('id', id)
      .eq('owner_id', ctx.user.id)
      .select('*')
      .single()

    if (viewError) throw viewError

    // Update columns if provided
    if (Array.isArray(columns)) {
      for (const col of columns) {
        const colUpdates = {}
        if (col.width !== undefined) colUpdates.width = col.width
        if (col.is_visible !== undefined) colUpdates.is_visible = col.is_visible
        if (col.is_pinned !== undefined) colUpdates.is_pinned = col.is_pinned
        if (col.sort_order !== undefined) colUpdates.sort_order = col.sort_order
        if (col.label !== undefined) colUpdates.label = col.label
        if (Object.keys(colUpdates).length > 0) {
          await ctx.adminSupabase
            .from('task_view_columns')
            .update(colUpdates)
            .eq('id', col.id)
        }
      }
    }

    const { data: cols } = await ctx.adminSupabase
      .from('task_view_columns')
      .select('*')
      .eq('view_id', id)
      .order('sort_order', { ascending: true })

    return NextResponse.json({ view: { ...view, columns: cols || [] } })
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
      .from('task_views')
      .delete()
      .eq('id', id)
      .eq('owner_id', ctx.user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
