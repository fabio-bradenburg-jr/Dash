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
  return { user, accessContext, adminSupabase, workspaceId: accessContext.workspaceId }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const spaceId = new URL(request.url).searchParams.get('space_id')
    if (!spaceId) return NextResponse.json({ error: 'space_id obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('space_members')
      .select('*')
      .eq('space_id', spaceId)
      .eq('workspace_id', ctx.workspaceId)
      .order('sort_order', { ascending: true })

    if (error) throw error
    return NextResponse.json({ members: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    if (!body.space_id || !body.name) return NextResponse.json({ error: 'space_id e name obrigatórios.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('space_members')
      .insert({
        space_id: body.space_id,
        workspace_id: ctx.workspaceId,
        user_id: body.user_id || null,
        name: String(body.name).trim(),
        cargo: body.cargo || null,
        avatar_url: body.avatar_url || null,
        color: body.color || '#26c281',
        ativo: body.ativo !== false,
        sort_order: body.sort_order ?? 0,
        template_funcao: body.template_funcao || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ member: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    for (const f of ['name', 'cargo', 'avatar_url', 'color', 'ativo', 'sort_order', 'template_funcao', 'user_id']) {
      if (body[f] !== undefined) updates[f] = body[f]
    }

    const { data, error } = await ctx.adminSupabase
      .from('space_members')
      .update(updates)
      .eq('id', body.id)
      .eq('workspace_id', ctx.workspaceId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ member: data })
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
      .from('space_members')
      .delete()
      .eq('id', id)
      .eq('workspace_id', ctx.workspaceId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
