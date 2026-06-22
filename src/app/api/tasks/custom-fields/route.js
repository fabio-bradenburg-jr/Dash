import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase, workspaceId: accessContext.workspaceId }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const entityType = url.searchParams.get('entity_type') || 'task'
    const spaceId = url.searchParams.get('space_id')

    let query = ctx.adminSupabase
      .from('custom_fields')
      .select('*')
      .eq('workspace_id', ctx.workspaceId)
      .eq('entity_type', entityType)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })

    if (spaceId) {
      query = query.or(`space_id.is.null,space_id.eq.${spaceId}`)
    } else {
      query = query.is('space_id', null)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ fields: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    if (!ctx.accessContext.canManageUsers) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body = await request.json()
    const { name, field_type, entity_type, space_id, description, icon, color, is_required, default_value, config } = body

    if (!name?.trim() || !field_type) {
      return NextResponse.json({ error: 'name e field_type são obrigatórios.' }, { status: 400 })
    }

    const { data: maxRow } = await ctx.adminSupabase
      .from('custom_fields')
      .select('sort_order')
      .eq('workspace_id', ctx.workspaceId)
      .eq('entity_type', entity_type || 'task')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data, error } = await ctx.adminSupabase
      .from('custom_fields')
      .insert({
        workspace_id: ctx.workspaceId,
        name: name.trim(),
        field_type,
        entity_type: entity_type || 'task',
        space_id: space_id || null,
        description: description?.trim() || null,
        icon: icon || 'bx-list-plus',
        color: color || '#26c281',
        is_required: is_required || false,
        default_value: default_value || null,
        config: config || {},
        sort_order: (maxRow?.sort_order ?? -1) + 1,
        created_by: ctx.user.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ field: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    if (!ctx.accessContext.canManageUsers) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const allowed = ['name', 'description', 'icon', 'color', 'is_required', 'default_value', 'config', 'sort_order', 'is_archived']
    const updates = { updated_at: new Date().toISOString() }
    for (const key of allowed) {
      if (rest[key] !== undefined) updates[key] = rest[key]
    }

    const { data, error } = await ctx.adminSupabase
      .from('custom_fields')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ field: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    if (!ctx.accessContext.canManageUsers) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    // Soft delete
    const { error } = await ctx.adminSupabase
      .from('custom_fields')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
