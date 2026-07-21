import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { logUserActivity } from '@/lib/server/user-activity'
import { supabaseUrl, supabasePublishableKey } from '@/lib/supabase/config'

// POST { currentPassword, newPassword } — o próprio usuário troca a senha.
export async function POST(request) {
  try {
    const ctx = await resolveAuthContext()
    if (ctx.errorResponse) return ctx.errorResponse

    const { user, adminSupabase, accessContext } = ctx
    const userId = user?.id
    const email = String(accessContext?.profile?.email || user?.email || '').trim().toLowerCase()
    if (!userId) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const currentPassword = String(body.currentPassword ?? '')
    const newPassword = String(body.newPassword ?? '')

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'A nova senha precisa ter pelo menos 8 caracteres.' }, { status: 400 })
    }
    if (!currentPassword) {
      return NextResponse.json({ error: 'Informe sua senha atual.' }, { status: 400 })
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'A nova senha precisa ser diferente da atual.' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'Não foi possível identificar seu e-mail para validar a senha.' }, { status: 400 })
    }

    // Valida a senha atual com um cliente isolado (não mexe na sessão via cookies).
    const verifyClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error: signInError } = await verifyClient.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 })
    }

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(userId, { password: newPassword })
    if (updateError) throw updateError

    if (accessContext?.workspaceId) {
      await logUserActivity(adminSupabase, {
        workspaceId: accessContext.workspaceId,
        userId,
        actorId: userId,
        actorName: accessContext.profile?.full_name || email,
        action: 'Senha alterada',
        detail: 'Senha trocada pelo próprio usuário.',
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('me/password POST error:', error)
    return NextResponse.json({ error: error.message || 'Não foi possível alterar a senha.' }, { status: 500 })
  }
}
