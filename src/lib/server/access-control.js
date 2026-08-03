export const USER_ROLES = {
  MASTER: 'master',
  ADMIN: 'admin',
  OPERATOR: 'operador',
  ANALISTA: 'analista',
  VIEWER: 'visualizador',
  CLIENT: 'cliente',
  GESTOR_RESULTADO: 'gestor_resultado',
}

export const AI_ACCESS_LEVELS = {
  MASTER: 'master',
  TEAM: 'team',
  NONE: 'none',
}

export const PRIMARY_ADMIN_EMAIL = 'fabio@assessorialp.com.br'
export const PRIMARY_ADMIN_EMAILS = ['fabio@assessorialp.com.br']
export const PREVIOUS_PRIMARY_ADMIN_EMAILS = []
export const ASSESSORIA_LP_MEMBER_EMAILS = []

// Colunas do perfil carregadas no contexto de acesso. Propositalmente SEM `avatar_url`:
// esse campo pode guardar uma imagem base64 de vários MB, e o contexto de acesso é
// resolvido em TODA requisição autenticada — trazer o avatar aqui multiplicava o egress
// do Supabase (foi o que estourou a cota). O avatar é buscado sob demanda em /api/me,
// onde a UI de fato precisa dele.
const PROFILE_CONTEXT_COLUMNS = 'id, email, full_name, role, team_id, created_at, updated_at, workspace_id, ai_access_level, can_edit_integrations, status'

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isPrimaryAdminEmail(email) {
  return PRIMARY_ADMIN_EMAILS.includes(normalizeEmail(email))
}

export function isPreviousPrimaryAdminEmail(email) {
  return PREVIOUS_PRIMARY_ADMIN_EMAILS.includes(normalizeEmail(email))
}

export function isAssessoriaLpMemberEmail(email) {
  return ASSESSORIA_LP_MEMBER_EMAILS.includes(normalizeEmail(email))
}

function isMissingRelationError(error) {
  const message = String(error?.message || '').toLowerCase()
  return error?.code === 'PGRST205' || message.includes('schema cache') || message.includes('could not find the table')
}

export async function resolveAssessoriaLpWorkspaceId(adminSupabase) {
  const { data: connectedWorkspace, error: connectionError } = await adminSupabase
    .from('workspace_meta_connections')
    .select('workspace_id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (connectionError && !isMissingRelationError(connectionError)) throw connectionError
  if (connectedWorkspace?.workspace_id) return connectedWorkspace.workspace_id

  const { data: namedWorkspace, error: namedWorkspaceError } = await adminSupabase
    .from('workspaces')
    .select('id')
    .eq('name', 'Assessoria LP')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (namedWorkspaceError) throw namedWorkspaceError
  return namedWorkspace?.id || null
}

function buildProfilePayload(user, role, workspaceId) {
  const resolvedRole = isPrimaryAdminEmail(user.email) ? USER_ROLES.MASTER : role

  return {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || '',
    role: resolvedRole,
    ai_access_level: resolvedRole === USER_ROLES.MASTER ? AI_ACCESS_LEVELS.MASTER : AI_ACCESS_LEVELS.TEAM,
    can_edit_integrations: resolvedRole === USER_ROLES.MASTER,
    workspace_id: workspaceId,
  }
}

export async function ensureUserProfile(adminSupabase, user) {
  const { data: existingProfile, error: profileError } = await adminSupabase
    .from('profiles')
    .select(PROFILE_CONTEXT_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (existingProfile) return existingProfile

  let workspaceId = null
  let role = USER_ROLES.MASTER

  if (isAssessoriaLpMemberEmail(user.email)) {
    workspaceId = await resolveAssessoriaLpWorkspaceId(adminSupabase)
    if (!workspaceId) {
      throw new Error('Workspace da Assessoria LP não encontrado para vincular este usuário.')
    }
    role = USER_ROLES.OPERATOR
  } else {
    const { data: createdWorkspace, error: workspaceError } = await adminSupabase
      .from('workspaces')
      .insert({
        name: user.user_metadata?.company_name || user.user_metadata?.full_name || user.email || 'Workspace principal',
        owner_user_id: user.id,
      })
      .select('*')
      .single()

    if (workspaceError) throw workspaceError

    workspaceId = createdWorkspace.id
  }

  const payload = buildProfilePayload(user, role, workspaceId)
  const { data: createdProfile, error: createProfileError } = await adminSupabase
    .from('profiles')
    .insert(payload)
    .select(PROFILE_CONTEXT_COLUMNS)
    .single()

  if (createProfileError) throw createProfileError

  return createdProfile
}

export async function getAccessContext(supabase, user, options = {}) {
  const adminSupabase = options.adminSupabase || null
  let profile = null

  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select(PROFILE_CONTEXT_COLUMNS)
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw profileError

  if (existingProfile) {
    profile = existingProfile
  } else if (adminSupabase) {
    profile = await ensureUserProfile(adminSupabase, user)
  } else {
    throw new Error('Perfil do usuário não encontrado.')
  }

  const isPrimaryAdmin = isPrimaryAdminEmail(profile.email || user.email)
  const role = isPrimaryAdmin ? USER_ROLES.MASTER : profile.role || USER_ROLES.VIEWER
  // IA não é mais controlada por nível ("liberada/bloqueada" foi removido).
  // Mantemos o campo por compatibilidade, sempre derivado do papel.
  const aiAccessLevel = role === USER_ROLES.MASTER ? AI_ACCESS_LEVELS.MASTER : AI_ACCESS_LEVELS.TEAM
  let workspaceId = profile.workspace_id || null
  let workspace = null

  if (isPrimaryAdmin && !workspaceId && adminSupabase) {
    const { data: firstWorkspace, error: firstWorkspaceError } = await adminSupabase
      .from('workspaces')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (firstWorkspaceError) throw firstWorkspaceError
    workspaceId = firstWorkspace?.id || null

    if (workspaceId) {
      await adminSupabase
        .from('profiles')
        .update({ role: USER_ROLES.MASTER, workspace_id: workspaceId, ai_access_level: AI_ACCESS_LEVELS.MASTER, can_edit_integrations: true })
        .eq('id', profile.id)
    }
  }

  if (workspaceId && adminSupabase) {
    const { data: workspaceData, error: workspaceError } = await adminSupabase
      .from('workspaces')
      .select('id, name, owner_user_id')
      .eq('id', workspaceId)
      .maybeSingle()

    if (workspaceError) throw workspaceError
    workspace = workspaceData || null
  }

  const isWorkspaceOwner = Boolean(workspace?.owner_user_id && workspace.owner_user_id === user.id)
  const isMasterLike = isPrimaryAdmin || isWorkspaceOwner || role === USER_ROLES.MASTER

  // Modelo de permissão por PÁGINA: papéis internos (tudo exceto 'cliente')
  // enxergam todos os clientes do workspace automaticamente — o controle de
  // acesso fica nas permissões de página/navegação, não em ACL por cliente.
  // O papel 'cliente' (login externo de cliente) mantém a ACL individual para
  // não vazar dados entre clientes.
  const viewableClientIds = new Set()
  const editableClientIds = new Set()
  // Páginas liberadas para o usuário (workspace_nav_permissions). No novo modelo,
  // é daqui que saem as capacidades de gestão dos usuários internos.
  const grantedPages = new Set()

  const isInternal = role !== USER_ROLES.CLIENT
  if (workspaceId && !isPrimaryAdmin && role !== USER_ROLES.MASTER && isInternal) {
    const { data: navRows, error: navError } = await (adminSupabase || supabase)
      .from('workspace_nav_permissions')
      .select('page_key, granted')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
    if (navError && !isMissingRelationError(navError)) throw navError
    ;(navRows || []).forEach((row) => { if (row.granted) grantedPages.add(row.page_key) })
  }

  if (workspaceId && !isPrimaryAdmin && role === USER_ROLES.CLIENT) {
    const [
      { data: directAccessData, error: directAccessError },
      { data: groupAccessData, error: groupAccessError },
      { data: groupMemberData, error: groupMemberError },
    ] = await Promise.all([
      supabase
        .from('user_client_access')
        .select('client_id, can_view, can_edit')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id),
      supabase
        .from('user_client_group_access')
        .select('group_id, can_view, can_edit')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id),
      supabase
        .from('workspace_client_group_members')
        .select('group_id, client_id')
        .eq('workspace_id', workspaceId),
    ])

    if (directAccessError) throw directAccessError
    if (groupAccessError && !isMissingRelationError(groupAccessError)) throw groupAccessError
    if (groupMemberError && !isMissingRelationError(groupMemberError)) throw groupMemberError

    const accessRows = directAccessData || []
    const groupAccessRows = isMissingRelationError(groupAccessError) ? [] : groupAccessData || []
    const groupMemberRows = isMissingRelationError(groupMemberError) ? [] : groupMemberData || []

    accessRows.filter((row) => row.can_view).forEach((row) => viewableClientIds.add(row.client_id))
    accessRows.filter((row) => row.can_edit).forEach((row) => editableClientIds.add(row.client_id))

    const membersByGroupId = new Map()
    groupMemberRows.forEach((row) => {
      const current = membersByGroupId.get(row.group_id) || []
      current.push(row.client_id)
      membersByGroupId.set(row.group_id, current)
    })
    groupAccessRows.forEach((row) => {
      const memberClientIds = membersByGroupId.get(row.group_id) || []
      if (row.can_view) memberClientIds.forEach((clientId) => viewableClientIds.add(clientId))
      if (row.can_edit) memberClientIds.forEach((clientId) => editableClientIds.add(clientId))
    })
  } else if (workspaceId && role !== USER_ROLES.CLIENT) {
    // Papel interno: todos os clientes do workspace são visíveis/editáveis.
    const clientReader = adminSupabase || supabase
    const { data: workspaceClients, error: workspaceClientsError } = await clientReader
      .from('workspace_clients')
      .select('id')
      .eq('workspace_id', workspaceId)

    if (workspaceClientsError && !isMissingRelationError(workspaceClientsError)) throw workspaceClientsError

    ;(workspaceClients || []).forEach((row) => {
      viewableClientIds.add(row.id)
      editableClientIds.add(row.id)
    })
  }

  return {
    profile,
    role,
    aiAccessLevel,
    workspaceId,
    workspace,
    isWorkspaceOwner,
    // Modelo "função = páginas": capacidades de gestão saem das páginas liberadas.
    // Master e admin principal (isPrimaryAdmin) sempre têm acesso total.
    canManageUsers: isMasterLike || grantedPages.has('usuarios'),
    canManageClients: isMasterLike || grantedPages.has('clientes'),
    canEditIntegrations: isMasterLike || grantedPages.has('settings'),
    canViewDashboard: isMasterLike || grantedPages.size > 0 || (role === USER_ROLES.CLIENT && viewableClientIds.size > 0),
    // IA liberada para master e todos os usuários internos; cliente externo só se tiver dashboards.
    canUseAi: isMasterLike || (role !== USER_ROLES.CLIENT) || viewableClientIds.size > 0,
    grantedPages: Array.from(grantedPages),
    isClientRole: role === USER_ROLES.CLIENT,
    viewableClientIds: Array.from(viewableClientIds),
    editableClientIds: Array.from(editableClientIds),
  }
}
