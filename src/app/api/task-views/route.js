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
  return { user, accessContext, adminSupabase }
}

// GET /api/task-views?space_id=xxx — list views visible to current user for a space
export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const url = new URL(request.url)
    const spaceId = url.searchParams.get('space_id')
    const { workspaceId } = ctx.accessContext

    let query = ctx.adminSupabase
      .from('task_views')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (spaceId) {
      // Include views for this space AND global views (space_id null)
      query = query.or(`space_id.eq.${spaceId},space_id.is.null`)
    }

    const { data, error } = await query
    if (error) throw error

    const userId = ctx.user.id
    const views = (data || []).filter(v => v.owner_id === userId || v.is_shared)
    return NextResponse.json({ views })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/task-views
export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const { name, space_id, config, is_shared, is_default_user, is_default_space } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
    const { workspaceId } = ctx.accessContext
    const userId = ctx.user.id

    // If setting as user default, unset others for this user+space
    if (is_default_user) {
      await ctx.adminSupabase.from('task_views')
        .update({ is_default_user: false })
        .eq('workspace_id', workspaceId)
        .eq('owner_id', userId)
        .eq('is_default_user', true)
      if (space_id) {
        await ctx.adminSupabase.from('task_views')
          .update({ is_default_user: false })
          .eq('workspace_id', workspaceId)
          .eq('space_id', space_id)
          .eq('is_default_user', true)
      }
    }
    if (is_default_space && space_id) {
      await ctx.adminSupabase.from('task_views')
        .update({ is_default_space: false })
        .eq('workspace_id', workspaceId)
        .eq('space_id', space_id)
    }

    const { data, error } = await ctx.adminSupabase
      .from('task_views')
      .insert({
        workspace_id: workspaceId,
        owner_id: userId,
        space_id: space_id || null,
        name: name.trim(),
        config: config || {},
        is_shared: !!is_shared,
        is_default_user: !!is_default_user,
        is_default_space: !!is_default_space,
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json({ view: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/task-views — update
export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const { id, name, config, is_shared, is_default_user, is_default_space } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })
    const { workspaceId } = ctx.accessContext
    const userId = ctx.user.id

    // Fetch existing to check ownership
    const { data: existing } = await ctx.adminSupabase.from('task_views').select('*').eq('id', id).single()
    if (!existing || existing.owner_id !== userId) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const updates = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (config !== undefined) updates.config = config
    if (is_shared !== undefined) updates.is_shared = is_shared
    if (is_default_user !== undefined) {
      if (is_default_user) {
        await ctx.adminSupabase.from('task_views')
          .update({ is_default_user: false })
          .eq('workspace_id', workspaceId)
          .eq('owner_id', userId)
          .neq('id', id)
      }
      updates.is_default_user = is_default_user
    }
    if (is_default_space !== undefined) {
      if (is_default_space && existing.space_id) {
        await ctx.adminSupabase.from('task_views')
          .update({ is_default_space: false })
          .eq('workspace_id', workspaceId)
          .eq('space_id', existing.space_id)
          .neq('id', id)
      }
      updates.is_default_space = is_default_space
    }

    const { data, error } = await ctx.adminSupabase
      .from('task_views').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ view: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/task-views?id=xxx
export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })
    const userId = ctx.user.id

    const { data: existing } = await ctx.adminSupabase.from('task_views').select('owner_id').eq('id', id).single()
    if (!existing || existing.owner_id !== userId) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const { error } = await ctx.adminSupabase.from('task_views').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
