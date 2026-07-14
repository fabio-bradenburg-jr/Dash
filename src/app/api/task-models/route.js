import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { resolveAuthContext } from '@/lib/server/auth-context'

// Modelos de tarefas (containers): nome + itens [{ title, subtasks: [string] }].
// Usados em Rotinas (e Tarefas) para gerar tarefas com subtarefas num dia/cliente.

async function getContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return ctx
  if (!ctx.accessContext.workspaceId) {
    return { errorResponse: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  }
  return { adminSupabase: ctx.adminSupabase, accessContext: ctx.accessContext, user: ctx.user }
}

function isMissingRelationError(error) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST205' || message.includes('schema cache') || message.includes('could not find the table')
}

function sanitizeItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((it) => ({
      title: String(it?.title || '').trim(),
      subtasks: Array.isArray(it?.subtasks) ? it.subtasks.map((s) => String(s || '').trim()).filter(Boolean) : [],
    }))
    .filter((it) => it.title)
}

export async function GET() {
  try {
    const ctx = await getContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const { data, error } = await ctx.adminSupabase
      .from('workspace_task_models')
      .select('id, name, color, items, created_at')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .order('created_at', { ascending: true })
    if (error) {
      if (isMissingRelationError(error)) return NextResponse.json({ models: [] })
      throw error
    }
    return NextResponse.json({ models: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const body = await request.json().catch(() => ({}))
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Informe o nome do modelo.' }, { status: 400 })

    const model = {
      workspace_id: ctx.accessContext.workspaceId,
      id: randomBytes(8).toString('hex'),
      name,
      color: String(body.color || '#26c281'),
      items: sanitizeItems(body.items),
      created_by: ctx.user?.id || null,
    }
    const { data, error } = await ctx.adminSupabase
      .from('workspace_task_models')
      .insert(model)
      .select('id, name, color, items, created_at')
      .single()
    if (error) throw error
    return NextResponse.json({ model: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    if (body.name !== undefined) updates.name = String(body.name).trim()
    if (body.color !== undefined) updates.color = String(body.color)
    if (body.items !== undefined) updates.items = sanitizeItems(body.items)

    const { data, error } = await ctx.adminSupabase
      .from('workspace_task_models')
      .update(updates)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .eq('id', id)
      .select('id, name, color, items, created_at')
      .single()
    if (error) throw error
    return NextResponse.json({ model: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('workspace_task_models')
      .delete()
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
