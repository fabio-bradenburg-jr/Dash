import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { PLATFORM_AUTH_COOKIE } from '@/lib/saas/auth'
import { verifyLocalAccessToken } from '@/lib/server/platform-auth-fallback'

/**
 * Resolves auth context supporting both Supabase sessions and platform JWT cookies.
 * Returns { user, accessContext, adminSupabase } or { errorResponse }.
 */
export async function resolveAuthContext({ requireWorkspace = true } = {}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  if (user) {
    const accessContext = await getAccessContext(supabase, user, { adminSupabase })
    if (requireWorkspace && !accessContext.workspaceId) {
      return { errorResponse: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
    }
    return { user, accessContext, adminSupabase }
  }

  const token = (await cookies()).get(PLATFORM_AUTH_COOKIE)?.value
  if (!token) {
    return { errorResponse: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  }

  const payload = await verifyLocalAccessToken(token)
  const userId = String(payload.sub || '').replace(/^supabase:/, '')
  const fakeUser = { id: userId }
  const accessContext = await getAccessContext(adminSupabase, fakeUser, { adminSupabase })

  if (requireWorkspace && !accessContext.workspaceId) {
    return { errorResponse: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  }

  return { user: fakeUser, accessContext, adminSupabase }
}
