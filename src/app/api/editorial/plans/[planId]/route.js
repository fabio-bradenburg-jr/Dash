import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { PLATFORM_AUTH_COOKIE } from '@/lib/saas/auth'
import { verifyLocalAccessToken } from '@/lib/server/platform-auth-fallback'

async function getAuthorizedContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  if (user) {
    const accessContext = await getAccessContext(supabase, user, { adminSupabase })
    return { adminSupabase, accessContext }
  }

  const token = (await cookies()).get(PLATFORM_AUTH_COOKIE)?.value
  if (!token) return { errorResponse: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }

  const payload = await verifyLocalAccessToken(token)
  const userId = String(payload.sub || '').replace(/^supabase:/, '')
  const { data: profile } = await adminSupabase.from('profiles').select('id, email, full_name, role, workspace_id').eq('id', userId).maybeSingle()
  if (!profile?.workspace_id) return { errorResponse: NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 404 }) }

  return {
    adminSupabase,
    accessContext: { workspaceId: profile.workspace_id, role: profile.role, profile },
  }
}

export async function PATCH(request, { params }) {
  try {
    const { planId } = await params
    const { errorResponse, adminSupabase, accessContext } = await getAuthorizedContext()
    if (errorResponse) return errorResponse
    const { workspaceId } = accessContext

    const body = await request.json()
    const updates = {}
    if (body.label !== undefined) updates.label = body.label
    if (body.month !== undefined) updates.month = Number.isFinite(body.month) ? body.month : null
    if (body.year !== undefined) updates.year = Number.isFinite(body.year) ? body.year : null
    if (body.items !== undefined) updates.items = Array.isArray(body.items) ? body.items : []
    updates.updated_at = new Date().toISOString()

    const { data: plan, error } = await adminSupabase
      .from('editorial_plans')
      .update(updates)
      .eq('id', planId)
      .eq('workspace_id', workspaceId)
      .select()
      .single()

    if (error) throw error
    if (!plan) return NextResponse.json({ error: 'Planejamento não encontrado.' }, { status: 404 })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Editorial plans PATCH error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao atualizar planejamento.' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { planId } = await params
    const { errorResponse, adminSupabase, accessContext } = await getAuthorizedContext()
    if (errorResponse) return errorResponse
    const { workspaceId } = accessContext

    const { error } = await adminSupabase
      .from('editorial_plans')
      .delete()
      .eq('id', planId)
      .eq('workspace_id', workspaceId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Editorial plans DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao deletar planejamento.' }, { status: 500 })
  }
}
