import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    const adminSupabase = createAdminClient()
    const accessContext = await getAccessContext(supabase, user, { adminSupabase })
    if (!accessContext.workspaceId) return NextResponse.json({ error: 'Sem workspace.' }, { status: 403 })

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
