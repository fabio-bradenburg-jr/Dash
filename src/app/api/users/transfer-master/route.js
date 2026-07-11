import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { AI_ACCESS_LEVELS, isPrimaryAdminEmail, USER_ROLES } from '@/lib/server/access-control'
import { logUserActivity } from '@/lib/server/user-activity'

// POST { targetUserId } — promove o alvo a Master. Só um Master atual pode transferir.
export async function POST(request) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse

    const { adminSupabase, accessContext, user } = ctx
    const actingRole = accessContext.role
    const actingIsMaster = actingRole === USER_ROLES.MASTER || isPrimaryAdminEmail(accessContext.profile?.email)
    if (!actingIsMaster || !accessContext.workspaceId) {
      return NextResponse.json({ error: 'Apenas um Master pode transferir o nível Master.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const targetUserId = String(body.targetUserId || '').trim()
    if (!targetUserId) {
      return NextResponse.json({ error: 'Informe o usuário que receberá o Master.' }, { status: 400 })
    }

    const { data: targetProfile, error: targetError } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, role, workspace_id')
      .eq('id', targetUserId)
      .maybeSingle()
    if (targetError) throw targetError
    if (!targetProfile || targetProfile.workspace_id !== accessContext.workspaceId) {
      return NextResponse.json({ error: 'Usuário não encontrado neste workspace.' }, { status: 403 })
    }

    // Promove o alvo a Master.
    const { error: promoteError } = await adminSupabase
      .from('profiles')
      .update({ role: USER_ROLES.MASTER, ai_access_level: AI_ACCESS_LEVELS.MASTER, can_edit_integrations: true })
      .eq('id', targetUserId)
    if (promoteError) throw promoteError

    // Rebaixa o Master atual para Admin — exceto a conta master principal (fabio@), que permanece Master.
    let demotedSelf = false
    if (user?.id && user.id !== targetUserId && !isPrimaryAdminEmail(accessContext.profile?.email)) {
      const { error: demoteError } = await adminSupabase
        .from('profiles')
        .update({ role: USER_ROLES.ADMIN })
        .eq('id', user.id)
      if (demoteError) throw demoteError
      demotedSelf = true
    }

    await logUserActivity(adminSupabase, {
      workspaceId: accessContext.workspaceId,
      userId: targetUserId,
      actorId: user?.id || null,
      actorName: accessContext.profile?.full_name || accessContext.profile?.email || '',
      action: 'Master transferido',
      detail: `${targetProfile.full_name || targetProfile.email} agora é Master.`,
    })

    return NextResponse.json({ ok: true, demotedSelf })
  } catch (error) {
    console.error('Transfer master error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível transferir o Master.' }, { status: 500 })
  }
}
