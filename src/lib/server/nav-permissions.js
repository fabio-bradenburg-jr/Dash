// Materializa as páginas de uma função nas permissões de navegação do usuário.
// No modelo "função = páginas", atribuir uma função grava as páginas dela como
// os acessos individuais do usuário (workspace_nav_permissions). Qualquer ajuste
// individual posterior que divergir dessa lista é o que chamamos de "Acesso Personalizado".
export async function materializeUserPages(adminSupabase, workspaceId, userId, pages) {
  await adminSupabase
    .from('workspace_nav_permissions')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  const list = Array.isArray(pages) ? pages.filter((p) => typeof p === 'string') : []
  if (list.length === 0) return

  const now = new Date().toISOString()
  await adminSupabase
    .from('workspace_nav_permissions')
    .insert(list.map((page_key) => ({
      workspace_id: workspaceId,
      user_id: userId,
      page_key,
      granted: true,
      updated_at: now,
    })))
}
