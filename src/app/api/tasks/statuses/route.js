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
    const { workspaceId } = ctx.accessContext

    let { data, error } = await ctx.adminSupabase
      .from('task_statuses')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    // If no statuses for this workspace, seed from defaults
    if (!data || data.length === 0) {
      const { data: defaults } = await ctx.adminSupabase
        .from('task_statuses')
        .select('*')
        .eq('workspace_id', 'default')
        .order('sort_order', { ascending: true })

      if (defaults && defaults.length > 0) {
        const toInsert = defaults.map(({ id: _id, workspace_id: _wid, created_at: _ca, ...rest }) => ({
          ...rest,
          workspace_id: workspaceId,
        }))
        const { data: inserted, error: insertError } = await ctx.adminSupabase
          .from('task_statuses')
          .insert(toInsert)
          .select('*')
        if (insertError) throw insertError
        data = inserted
      }
    }

    return NextResponse.json({ statuses: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const label = String(body.label || '').trim()
    if (!label) return NextResponse.json({ error: 'label obrigatório.' }, { status: 400 })
    const color = String(body.color || '#94a3b8').trim()
    const is_closed = Boolean(body.is_closed)

    const { data: maxRow } = await ctx.adminSupabase
      .from('task_statuses')
      .select('sort_order')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sort_order = (maxRow?.sort_order ?? -1) + 1

    const { data, error } = await ctx.adminSupabase
      .from('task_statuses')
      .insert({ workspace_id: ctx.accessContext.workspaceId, label, color, sort_order, is_closed })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ status: data })
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
    if (body.label !== undefined) updates.label = String(body.label).trim()
    if (body.color !== undefined) updates.color = String(body.color).trim()
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)
    if (body.is_closed !== undefined) updates.is_closed = Boolean(body.is_closed)

    const { data, error } = await ctx.adminSupabase
      .from('task_statuses')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ status: data })
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
      .from('task_statuses')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
