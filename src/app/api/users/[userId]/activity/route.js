import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'

function isMissingRelationError(error) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST205' || message.includes('schema cache') || message.includes('could not find the table')
}

// GET — histórico de atividade de um usuário.
export async function GET(_request, context) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse
    if (!ctx.accessContext.canManageUsers || !ctx.accessContext.workspaceId) {
      return NextResponse.json({ error: 'Sem permissão para ver a atividade.' }, { status: 403 })
    }

    const { adminSupabase, accessContext } = ctx
    const { userId } = await context.params

    const { data, error } = await adminSupabase
      .from('user_activity_log')
      .select('id, action, detail, actor_name, created_at')
      .eq('workspace_id', accessContext.workspaceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      if (isMissingRelationError(error)) return NextResponse.json({ entries: [] })
      throw error
    }

    return NextResponse.json({ entries: data || [] })
  } catch (error) {
    console.error('User activity GET error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível carregar a atividade.' }, { status: 500 })
  }
}
