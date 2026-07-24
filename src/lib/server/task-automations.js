import { evaluateConditions, executeAction } from '@/lib/server/automation-engine'

// Dispara as automações de tarefa na hora do evento (inline), sem depender de
// cron/fila. Respeita o escopo por espaço: se o gatilho define config.space_id,
// a automação só roda para tarefas daquele espaço. Nunca lança — automação não
// pode quebrar a criação/edição da tarefa.
export async function runTaskAutomations(adminSupabase, { workspaceId, triggerType, task }) {
  if (!adminSupabase || !workspaceId || !triggerType || !task) return
  try {
    const { data: automations } = await adminSupabase
      .from('automations')
      .select('id, is_active, automation_triggers(trigger_type, config), automation_conditions(*), automation_actions(*)')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)

    if (!automations?.length) return

    const triggerData = {
      task_id: task.id,
      space_id: task.space_id ?? null,
      status_id: task.status_item_id ?? task.status_id ?? null,
      assignee_id: task.assignee_id ?? null,
      client_id: task.client_id ?? null,
      priority: task.priority ?? null,
      title: task.title ?? '',
      due_date: task.due_date ?? null,
      workspace_id: workspaceId,
    }

    for (const auto of automations) {
      try {
        const match = (auto.automation_triggers || []).find((t) => t.trigger_type === triggerType)
        if (!match) continue

        // Escopo por espaço: gatilho preso a um espaço só dispara nele.
        const scopedSpace = match.config?.space_id
        if (scopedSpace && scopedSpace !== triggerData.space_id) continue

        const conditions = (auto.automation_conditions || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        if (!evaluateConditions(conditions, triggerData)) continue

        const actions = (auto.automation_actions || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        for (const action of actions) {
          await executeAction(action, { adminSupabase, workspaceId, triggerData })
        }
      } catch {
        // uma automação com erro não interrompe as demais
      }
    }
  } catch {
    // silencioso: automação nunca quebra a operação da tarefa
  }
}
