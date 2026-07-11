// Registro de atividade de usuários. Silencioso e defensivo: se a tabela
// user_activity_log ainda não existir (migration pendente), apenas ignora.

export async function logUserActivity(adminSupabase, entry) {
  try {
    if (!adminSupabase || !entry?.workspaceId || !entry?.action) return
    await adminSupabase.from('user_activity_log').insert({
      workspace_id: entry.workspaceId,
      user_id: entry.userId || null,
      actor_id: entry.actorId || null,
      actor_name: entry.actorName || '',
      action: entry.action,
      detail: entry.detail || '',
    })
  } catch (error) {
    // Nunca deixa o log quebrar a operação principal.
    console.warn('logUserActivity failed:', error?.message)
  }
}
