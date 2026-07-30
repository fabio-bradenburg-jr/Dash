// Catálogo único de páginas do app usado pelo modelo de acesso "função = páginas".
// Fonte de verdade compartilhada entre a aba de Usuários (permissões por usuário)
// e a aba de Funções e Permissões (RolesTab). Cada chave corresponde exatamente
// à chave usada pelo hasNavAccess da sidebar (workspace_nav_permissions.page_key).
// Liberar a página dá acesso a tudo que ela mostra.
export const PAGE_MODULES = [
  // Geral
  { key: 'semanal', label: 'Controle da Operação', group: 'Geral' },
  { key: 'tarefas', label: 'Rotinas & Tarefas', group: 'Geral' },
  { key: 'comunicacao', label: 'Comunicação', group: 'Geral' },
  { key: 'qualidade-leads', label: 'Qualidade dos Leads', group: 'Geral' },
  { key: 'settings', label: 'Configurações', group: 'Geral' },
  // Sucesso do Cliente
  { key: 'clientes', label: 'Clientes', group: 'Sucesso do Cliente' },
  { key: 'onboarding', label: 'Onboarding', group: 'Sucesso do Cliente' },
  { key: 'offboarding', label: 'Offboarding', group: 'Sucesso do Cliente' },
  { key: 'acessos', label: 'Dados', group: 'Sucesso do Cliente' },
  // Comercial
  { key: 'comercial', label: 'Processo Comercial', group: 'Comercial' },
  // Performance
  { key: 'apresentacao', label: 'Dash', group: 'Performance' },
  { key: 'campanhas', label: 'Campanhas', group: 'Performance' },
  { key: 'anuncios', label: 'Anúncios', group: 'Performance' },
  { key: 'saldos', label: 'Saldos', group: 'Performance' },
  { key: 'funil', label: 'Funil', group: 'Performance' },
  { key: 'relatorios', label: 'Relatórios', group: 'Performance' },
  { key: 'relatorio-manual', label: 'Relatório Manual', group: 'Performance' },
  { key: 'planilha-leads', label: 'Planilha de Leads', group: 'Performance' },
  // Social Media
  { key: 'editorial-dash', label: 'Social · Painel', group: 'Social Media' },
  { key: 'editorial', label: 'Social · Calendário', group: 'Social Media' },
  { key: 'editorial-plans', label: 'Social · Planejamentos', group: 'Social Media' },
  // PAC
  { key: 'pac-dash', label: 'PAC · Painel', group: 'PAC' },
  { key: 'pac-calendario', label: 'PAC · Calendário', group: 'PAC' },
  { key: 'pac-tipos', label: 'PAC · Tipos', group: 'PAC' },
  // Administração (habilita gestão — quem tiver esta página gerencia usuários/funções)
  { key: 'usuarios', label: 'Usuários & Funções', group: 'Administração' },
]

export const ALL_PAGE_KEYS = PAGE_MODULES.map((m) => m.key)

// Agrupa as páginas na ordem de declaração, preservando os grupos.
export function pagesByGroup(extra = []) {
  const groups = []
  PAGE_MODULES.concat(extra).forEach((m) => {
    const name = m.group || 'Outros'
    const found = groups.find((g) => g.name === name)
    if (found) found.items.push(m)
    else groups.push({ name, items: [m] })
  })
  return groups
}
