import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'

export async function GET() {
  try {
    const { errorResponse, accessContext, adminSupabase, user } = await resolveAuthContext({ requireWorkspace: false })
    if (errorResponse) return errorResponse

    // `avatar_url` fica fora do accessContext (evita trafegar a imagem base64 em toda
    // requisição autenticada). Aqui, onde a UI exibe a foto, buscamos só essa coluna.
    let avatarUrl = ''
    try {
      const { data: avatarRow } = await adminSupabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user?.id)
        .maybeSingle()
      avatarUrl = avatarRow?.avatar_url || ''
    } catch (avatarError) {
      console.warn('Me route avatar fetch failed:', avatarError?.message)
    }

    return NextResponse.json({
      profile: { ...accessContext.profile, avatar_url: avatarUrl },
      access: {
        role: accessContext.role,
        canManageUsers: accessContext.canManageUsers,
        canManageClients: accessContext.canManageClients,
        canEditIntegrations: accessContext.canEditIntegrations,
        canViewDashboard: accessContext.canViewDashboard,
        canUseAi: accessContext.canUseAi,
        aiAccessLevel: accessContext.aiAccessLevel,
        isClientRole: accessContext.isClientRole,
        workspaceId: accessContext.workspaceId,
        viewableClientIds: accessContext.viewableClientIds,
        editableClientIds: accessContext.editableClientIds,
      },
    })
  } catch (error) {
    console.error('Me route error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível carregar o perfil.' }, { status: 500 })
  }
}
