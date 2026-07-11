import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { resolveAuthContext } from '@/lib/server/auth-context'

function isMissingRelationError(error) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST205' || message.includes('schema cache') || message.includes('could not find the table')
}

async function getContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return ctx
  if (!ctx.accessContext.canManageUsers || !ctx.accessContext.workspaceId) {
    return { errorResponse: NextResponse.json({ error: 'Sem permissão para gerenciar predefinições.' }, { status: 403 }) }
  }
  return { adminSupabase: ctx.adminSupabase, accessContext: ctx.accessContext }
}

export async function GET() {
  try {
    const ctx = await getContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const { adminSupabase, accessContext } = ctx

    const { data, error } = await adminSupabase
      .from('workspace_permission_presets')
      .select('id, name, modules, created_at')
      .eq('workspace_id', accessContext.workspaceId)
      .order('created_at', { ascending: true })

    if (error) {
      if (isMissingRelationError(error)) return NextResponse.json({ presets: [] })
      throw error
    }
    return NextResponse.json({ presets: data || [] })
  } catch (error) {
    console.error('Presets GET error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível listar as predefinições.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const { adminSupabase, accessContext } = ctx

    const body = await request.json().catch(() => ({}))
    const name = String(body.name || '').trim()
    const modules = Array.isArray(body.modules) ? body.modules.filter((m) => typeof m === 'string') : []
    if (!name) return NextResponse.json({ error: 'Informe um nome para a predefinição.' }, { status: 400 })

    const id = randomBytes(8).toString('hex')
    const { data, error } = await adminSupabase
      .from('workspace_permission_presets')
      .insert({ workspace_id: accessContext.workspaceId, id, name, modules })
      .select('id, name, modules, created_at')
      .maybeSingle()

    if (error) {
      if (isMissingRelationError(error)) {
        return NextResponse.json({ error: 'A tabela de predefinições ainda não foi criada. Rode a migration de usuários.' }, { status: 400 })
      }
      throw error
    }
    return NextResponse.json({ ok: true, preset: data })
  } catch (error) {
    console.error('Presets POST error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível salvar a predefinição.' }, { status: 500 })
  }
}
