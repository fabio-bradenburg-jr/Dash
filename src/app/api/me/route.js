import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'

export async function GET() {
  try {
    const { errorResponse, accessContext } = await resolveAuthContext({ requireWorkspace: false })
    if (errorResponse) return errorResponse

    return NextResponse.json({
      profile: accessContext.profile,
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
