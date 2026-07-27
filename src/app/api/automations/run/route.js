import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { evaluateConditions, executeAction } from '@/lib/server/automation-engine'

// Executa uma automação na hora (gatilho manual / "Executar agora").
export async function POST(request) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse
    if (!ctx.accessContext?.canManageUsers) {
      return NextResponse.json({ error: 'Sem permissão para executar automações.' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const admin = ctx.adminSupabase
    const { workspaceId } = ctx.accessContext

    const { data: auto, error } = await admin
      .from('automations')
      .select('*, automation_conditions(*), automation_actions(*)')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single()
    if (error) throw error
    if (!auto) return NextResponse.json({ error: 'Automação não encontrada.' }, { status: 404 })

    const triggerData = { workspace_id: workspaceId, manual: true }
    const conditions = (auto.automation_conditions || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    if (!evaluateConditions(conditions, triggerData)) {
      return NextResponse.json({ ok: true, skipped: 'condições não atendidas', results: [] })
    }

    const actions = (auto.automation_actions || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const results = []
    for (const action of actions) {
      try {
        results.push({ action_type: action.action_type, result: await executeAction(action, { adminSupabase: admin, workspaceId, triggerData }) })
      } catch (e) {
        results.push({ action_type: action.action_type, error: e.message })
      }
    }

    return NextResponse.json({ ok: true, results })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
