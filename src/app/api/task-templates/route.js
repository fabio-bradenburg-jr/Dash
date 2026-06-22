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

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext

    const { data, error } = await ctx.adminSupabase
      .from('task_templates')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ task_templates: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const body = await request.json()

    const { name, fields } = body
    if (!name) return NextResponse.json({ error: 'name obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('task_templates')
      .insert({
        workspace_id: workspaceId,
        name,
        fields: fields || {},
        created_by: ctx.user.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ task_template: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const body = await request.json()
    const { id, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    if (fields.name !== undefined) updates.name = fields.name
    if (fields.fields !== undefined) updates.fields = fields.fields

    const { data, error } = await ctx.adminSupabase
      .from('task_templates')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ task_template: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('task_templates')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
