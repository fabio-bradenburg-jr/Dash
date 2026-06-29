import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'

export async function GET(request) {
  try {
    const { errorResponse, accessContext, adminSupabase } = await resolveAuthContext()
    if (errorResponse) return errorResponse

    const accessId = new URL(request.url).searchParams.get('access_id')
    if (!accessId) return NextResponse.json({ error: 'access_id obrigatório.' }, { status: 400 })

    const { data, error: dbErr } = await adminSupabase
      .from('client_access_logs')
      .select('*')
      .eq('access_id', accessId)
      .eq('workspace_id', accessContext.workspaceId)
      .order('created_at', { ascending: false })
      .limit(30)

    if (dbErr) throw dbErr

    return NextResponse.json({ logs: data || [] })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
