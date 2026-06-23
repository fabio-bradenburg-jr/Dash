import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { encryptPassword, decryptPassword } from '@/lib/server/access-encryption'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase, workspaceId: accessContext.workspaceId }
}

function sanitize(acc) {
  const { password_enc, ...rest } = acc
  return { ...rest, has_password: !!password_enc }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    const revealId = url.searchParams.get('reveal_id')

    if (!clientId) return NextResponse.json({ error: 'client_id obrigatório.' }, { status: 400 })

    const includeArchived = url.searchParams.get('include_archived') === 'true'

    let accQuery = ctx.adminSupabase
      .from('client_accesses')
      .select('*')
      .eq('workspace_id', ctx.workspaceId)
      .eq('client_id', clientId)
      .order('category')
      .order('sort_order')

    if (!includeArchived) accQuery = accQuery.eq('is_archived', false)

    const { data, error } = await accQuery

    if (error) throw error

    // If revealing a specific password, log it and return decrypted
    if (revealId) {
      const target = (data || []).find((a) => a.id === revealId)
      if (target) {
        await ctx.adminSupabase.from('client_access_logs').insert({
          access_id: revealId,
          workspace_id: ctx.workspaceId,
          user_id: ctx.user.id,
          action: 'viewed_password',
        })
        return NextResponse.json({ password: decryptPassword(target.password_enc) })
      }
      return NextResponse.json({ password: null })
    }

    return NextResponse.json({ accesses: (data || []).map(sanitize) })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { client_id, category, platform_name, icon, icon_color, login, password, url: accessUrl, notes, status } = body

    if (!client_id || !platform_name?.trim()) {
      return NextResponse.json({ error: 'client_id e platform_name são obrigatórios.' }, { status: 400 })
    }

    const { data: maxRow } = await ctx.adminSupabase
      .from('client_accesses')
      .select('sort_order')
      .eq('workspace_id', ctx.workspaceId)
      .eq('client_id', client_id)
      .eq('category', category || 'custom')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data, error } = await ctx.adminSupabase
      .from('client_accesses')
      .insert({
        workspace_id: ctx.workspaceId,
        client_id,
        category: category || 'custom',
        platform_name: platform_name.trim(),
        icon: icon || 'bx-globe',
        icon_color: icon_color || '#26c281',
        login: login?.trim() || null,
        password_enc: password ? encryptPassword(password) : null,
        url: accessUrl?.trim() || null,
        notes: notes?.trim() || null,
        status: status || 'active',
        sort_order: (maxRow?.sort_order ?? -1) + 1,
        created_by: ctx.user.id,
      })
      .select('*')
      .single()

    if (error) throw error

    await ctx.adminSupabase.from('client_access_logs').insert({
      access_id: data.id,
      workspace_id: ctx.workspaceId,
      user_id: ctx.user.id,
      action: 'created',
    })

    return NextResponse.json({ access: sanitize(data) })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { id, platform_name, icon, icon_color, login, password, url: accessUrl, notes, status, sort_order, is_archived } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    const changed = []

    if (platform_name !== undefined) { updates.platform_name = platform_name.trim(); changed.push('platform_name') }
    if (icon !== undefined) { updates.icon = icon; changed.push('icon') }
    if (icon_color !== undefined) { updates.icon_color = icon_color; changed.push('icon_color') }
    if (login !== undefined) { updates.login = login?.trim() || null; changed.push('login') }
    if (password !== undefined) { updates.password_enc = password ? encryptPassword(password) : null; changed.push('password') }
    if (accessUrl !== undefined) { updates.url = accessUrl?.trim() || null; changed.push('url') }
    if (notes !== undefined) { updates.notes = notes?.trim() || null; changed.push('notes') }
    if (status !== undefined) { updates.status = status; changed.push('status') }
    if (sort_order !== undefined) { updates.sort_order = Number(sort_order); changed.push('sort_order') }
    if (is_archived !== undefined) { updates.is_archived = !!is_archived; changed.push('is_archived') }

    const { data, error } = await ctx.adminSupabase
      .from('client_accesses')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)
      .select('*')
      .single()

    if (error) throw error

    await ctx.adminSupabase.from('client_access_logs').insert({
      access_id: id,
      workspace_id: ctx.workspaceId,
      user_id: ctx.user.id,
      action: 'updated',
      changed_fields: changed,
    })

    return NextResponse.json({ access: sanitize(data) })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    await ctx.adminSupabase.from('client_access_logs').insert({
      access_id: id,
      workspace_id: ctx.workspaceId,
      user_id: ctx.user.id,
      action: 'deleted',
    })

    const { error } = await ctx.adminSupabase
      .from('client_accesses')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
