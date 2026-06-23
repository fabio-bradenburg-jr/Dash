import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase, workspaceId: accessContext.workspaceId }
}

// GET: list all spaces (+ access counts) for workspace
// POST: ensure a space exists for a client (upsert, idempotent)
// PUT: archive/unarchive a space

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const includeArchived = url.searchParams.get('include_archived') === 'true'

    let q = ctx.adminSupabase
      .from('client_password_spaces')
      .select('*')
      .eq('workspace_id', ctx.workspaceId)

    if (!includeArchived) q = q.eq('is_archived', false)

    const { data: spaces, error } = await q.order('created_at')
    if (error) throw error

    // Attach access counts per space
    const clientIds = (spaces || []).map((s) => s.client_id)
    let counts = {}
    if (clientIds.length > 0) {
      const { data: accesses } = await ctx.adminSupabase
        .from('client_accesses')
        .select('client_id, status')
        .eq('workspace_id', ctx.workspaceId)
        .eq('is_archived', false)
        .in('client_id', clientIds)

      ;(accesses || []).forEach((a) => {
        if (!counts[a.client_id]) counts[a.client_id] = { total: 0, active: 0, pending: 0, problem: 0 }
        counts[a.client_id].total++
        if (a.status === 'active') counts[a.client_id].active++
        if (a.status === 'pending') counts[a.client_id].pending++
        if (a.status === 'problem' || a.status === 'needs_update') counts[a.client_id].problem++
      })
    }

    const result = (spaces || []).map((s) => ({ ...s, counts: counts[s.client_id] || { total: 0, active: 0, pending: 0, problem: 0 } }))

    return NextResponse.json({ spaces: result })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Ensure space exists for a client (called on client creation or first access)
export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { client_id } = await request.json()
    if (!client_id) return NextResponse.json({ error: 'client_id obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('client_password_spaces')
      .upsert({ workspace_id: ctx.workspaceId, client_id }, { onConflict: 'workspace_id,client_id' })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ space: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Archive / unarchive
export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { client_id, is_archived } = await request.json()
    if (!client_id) return NextResponse.json({ error: 'client_id obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('client_password_spaces')
      .upsert({ workspace_id: ctx.workspaceId, client_id, is_archived: !!is_archived }, { onConflict: 'workspace_id,client_id' })
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ space: data })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
