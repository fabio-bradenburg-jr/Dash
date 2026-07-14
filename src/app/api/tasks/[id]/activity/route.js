import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'

// GET /api/tasks/[id]/activity — histórico de mudanças da tarefa (estilo ClickUp)
export async function GET(_request, { params }) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse
    const { id } = await params

    const { data: task } = await ctx.adminSupabase
      .from('tasks')
      .select('id, created_at, created_by')
      .eq('id', id)
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .maybeSingle()
    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 })

    const { data, error } = await ctx.adminSupabase
      .from('task_activity_log')
      .select('id, actor_id, action, metadata, created_at')
      .eq('task_id', id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    // Evento sintético de criação no fim da linha do tempo
    const entries = [...(data || []), {
      id: 'created',
      actor_id: task.created_by || null,
      action: 'created',
      metadata: {},
      created_at: task.created_at,
    }]

    return NextResponse.json({ entries })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
