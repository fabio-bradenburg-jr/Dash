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

// GET /api/roles — list roles with permission keys and user counts
export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext

    const { data: roles, error } = await ctx.adminSupabase
      .from('roles')
      .select(`
        *,
        role_permissions(permission_id, permissions(key, description, module)),
        user_roles(user_id)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) throw error

    const shaped = (roles || []).map(r => ({
      ...r,
      permission_keys: (r.role_permissions || []).map(rp => rp.permissions?.key).filter(Boolean),
      permissions_full: (r.role_permissions || []).map(rp => rp.permissions).filter(Boolean),
      user_count: (r.user_roles || []).length,
      role_permissions: undefined,
      user_roles: undefined,
    }))

    return NextResponse.json({ roles: shaped })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/roles — create role
export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const { workspaceId } = ctx.accessContext

    const { name, description, color, icon, is_active, base_role, permission_keys = [] } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório.' }, { status: 400 })
    const VALID_BASE = ['master', 'admin', 'operador', 'analista', 'gestor_resultado', 'visualizador', 'cliente']
    const safeBaseRole = VALID_BASE.includes(base_role) ? base_role : 'visualizador'

    const { data: role, error } = await ctx.adminSupabase
      .from('roles')
      .insert({ workspace_id: workspaceId, name: name.trim(), description, color: color || '#26c281', icon: icon || 'bx-user', is_active: is_active !== false, base_role: safeBaseRole })
      .select()
      .single()
    if (error) throw error

    if (permission_keys.length > 0) {
      const { data: perms } = await ctx.adminSupabase.from('permissions').select('id, key').in('key', permission_keys)
      if (perms?.length) {
        await ctx.adminSupabase.from('role_permissions').insert(perms.map(p => ({ role_id: role.id, permission_id: p.id })))
      }
    }

    return NextResponse.json({ role: { ...role, permission_keys, user_count: 0 } })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT /api/roles — update role
export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    const { workspaceId } = ctx.accessContext
    const { id, name, description, color, icon, is_active, base_role, permission_keys } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (color !== undefined) updates.color = color
    if (icon !== undefined) updates.icon = icon
    if (is_active !== undefined) updates.is_active = is_active
    const VALID_BASE = ['master', 'admin', 'operador', 'analista', 'gestor_resultado', 'visualizador', 'cliente']
    if (base_role !== undefined && VALID_BASE.includes(base_role)) updates.base_role = base_role

    const { data: role, error } = await ctx.adminSupabase
      .from('roles').update(updates).eq('id', id).eq('workspace_id', workspaceId).select().single()
    if (error) throw error

    if (Array.isArray(permission_keys)) {
      await ctx.adminSupabase.from('role_permissions').delete().eq('role_id', id)
      if (permission_keys.length > 0) {
        const { data: perms } = await ctx.adminSupabase.from('permissions').select('id, key').in('key', permission_keys)
        if (perms?.length) {
          await ctx.adminSupabase.from('role_permissions').insert(perms.map(p => ({ role_id: id, permission_id: p.id })))
        }
      }
    }

    return NextResponse.json({ role: { ...role, permission_keys: permission_keys || [], user_count: 0 } })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/roles?id=xxx
export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const transferTo = url.searchParams.get('transfer_to')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })
    const { workspaceId } = ctx.accessContext

    // Check system role
    const { data: role } = await ctx.adminSupabase.from('roles').select('is_system, name').eq('id', id).single()
    if (role?.is_system) return NextResponse.json({ error: 'Funções do sistema não podem ser excluídas.' }, { status: 403 })

    // Count users
    const { count } = await ctx.adminSupabase.from('user_roles').select('user_id', { count: 'exact', head: true }).eq('role_id', id)
    if (count > 0) {
      if (!transferTo) return NextResponse.json({ error: 'Existem usuários vinculados a esta função.', user_count: count }, { status: 409 })
      await ctx.adminSupabase.from('user_roles').update({ role_id: transferTo }).eq('role_id', id).eq('workspace_id', workspaceId)
    }

    const { error } = await ctx.adminSupabase.from('roles').delete().eq('id', id).eq('workspace_id', workspaceId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
