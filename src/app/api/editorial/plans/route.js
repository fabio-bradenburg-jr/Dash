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

export async function GET() {
  try {
    const { errorResponse, adminSupabase, accessContext } = await getAuthorizedContext()
    if (errorResponse) return errorResponse
    const { workspaceId } = accessContext

    const { data: plans, error } = await adminSupabase
      .from('editorial_plans')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ plans: plans || [] })
  } catch (error) {
    console.error('Editorial plans GET error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao buscar planejamentos.' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { errorResponse, adminSupabase, accessContext } = await getAuthorizedContext()
    if (errorResponse) return errorResponse
    const { workspaceId, profile } = accessContext

    const body = await request.json()
    const { label, month, year, items } = body

    const { data: plan, error } = await adminSupabase
      .from('editorial_plans')
      .insert({
        workspace_id: workspaceId,
        label: label || '',
        month: Number.isFinite(month) ? month : null,
        year: Number.isFinite(year) ? year : null,
        items: Array.isArray(items) ? items : [],
        created_by: profile?.id || null,
        created_by_name: profile?.full_name || profile?.email || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Editorial plans POST error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao criar planejamento.' }, { status: 500 })
  }
}
