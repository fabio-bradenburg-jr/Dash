import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { logUserActivity } from '@/lib/server/user-activity'

// Limite defensivo para o avatar em data URL (~2MB de imagem viram ~2.7MB em base64).
const MAX_AVATAR_LENGTH = 2_900_000

function isValidAvatar(value) {
  if (!value) return true // vazio = remover avatar
  if (value.length > MAX_AVATAR_LENGTH) return false
  return /^data:image\//i.test(value) || /^https?:\/\//i.test(value)
}

// PATCH { fullName, avatarUrl } — o próprio usuário edita nome e foto.
export async function PATCH(request) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse

    const { user, adminSupabase, accessContext } = ctx
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const fullName = String(body.fullName ?? '').trim()
    const avatarUrl = String(body.avatarUrl ?? '').trim()

    if (!fullName) {
      return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 })
    }
    if (fullName.length > 120) {
      return NextResponse.json({ error: 'Nome muito longo (máximo 120 caracteres).' }, { status: 400 })
    }
    if (!isValidAvatar(avatarUrl)) {
      return NextResponse.json({ error: 'Foto inválida ou grande demais (use uma imagem de até 2MB).' }, { status: 400 })
    }

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq('id', userId)

    if (profileError) throw profileError

    // Mantém o metadata do auth em sincronia (best-effort).
    try {
      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: fullName, avatar_url: avatarUrl },
      })
    } catch (metaError) {
      console.warn('me/profile auth metadata sync failed:', metaError?.message)
    }

    if (accessContext?.workspaceId) {
      await logUserActivity(adminSupabase, {
        workspaceId: accessContext.workspaceId,
        userId,
        actorId: userId,
        actorName: fullName,
        action: 'Perfil atualizado',
        detail: 'Nome/foto alterados pelo próprio usuário.',
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true, profile: { full_name: fullName, avatar_url: avatarUrl } })
  } catch (error) {
    console.error('me/profile PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível atualizar o perfil.' }, { status: 500 })
  }
}
