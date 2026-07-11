import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { logUserActivity } from '@/lib/server/user-activity'

async function getAuthorizedContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return ctx
  if (!ctx.accessContext.canManageUsers || !ctx.accessContext.workspaceId) {
    return { errorResponse: NextResponse.json({ error: 'Sem permissão para gerenciar usuários.' }, { status: 403 }) }
  }
  return { adminSupabase: ctx.adminSupabase, accessContext: ctx.accessContext, user: ctx.user }
}

// POST { action: 'reset' | 'resend' } — gera uma nova senha temporária.
export async function POST(request, context) {
  try {
    const authorized = await getAuthorizedContext()
    if (authorized.errorResponse) return authorized.errorResponse

    const { adminSupabase, accessContext, user } = authorized
    const { userId } = await context.params
    const body = await request.json().catch(() => ({}))
    const action = body.action === 'resend' ? 'resend' : 'reset'

    const { data: targetProfile } = await adminSupabase
      .from('profiles')
      .select('workspace_id, email, full_name')
      .eq('id', userId)
      .maybeSingle()

    if (!targetProfile || targetProfile.workspace_id !== accessContext.workspaceId) {
      return NextResponse.json({ error: 'Usuário não encontrado neste workspace.' }, { status: 403 })
    }

    const temporaryPassword = randomBytes(9).toString('base64url')
    const { error } = await adminSupabase.auth.admin.updateUserById(userId, { password: temporaryPassword })
    if (error) throw error

    if (action === 'resend') {
      try {
        const { error: statusError } = await adminSupabase.from('profiles').update({ status: 'invited' }).eq('id', userId)
        if (statusError && !String(statusError.message || '').toLowerCase().includes('status')) throw statusError
      } catch (statusError) {
        console.warn('resend status update failed:', statusError?.message)
      }
    }

    await logUserActivity(adminSupabase, {
      workspaceId: accessContext.workspaceId,
      userId,
      actorId: user?.id || null,
      actorName: accessContext.profile?.full_name || accessContext.profile?.email || '',
      action: action === 'resend' ? 'Convite reenviado' : 'Senha redefinida',
      detail: `${targetProfile.full_name || targetProfile.email}.`,
    })

    return NextResponse.json({
      ok: true,
      email: targetProfile.email,
      temporaryPassword,
      loginUrl: '/login',
    })
  } catch (error) {
    console.error('Users credentials POST error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível gerar novas credenciais.' }, { status: 500 })
  }
}
