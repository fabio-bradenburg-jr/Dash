import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  const adminSupabase = createAdminClient()
  const accessContext = await getAccessContext(supabase, user, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user, accessContext, adminSupabase }
}

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { data } = await ctx.adminSupabase
      .from('action_space_settings')
      .select('*')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .maybeSingle()

    return NextResponse.json({ settings: data || null })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const updates = { workspace_id: ctx.accessContext.workspaceId, updated_at: new Date().toISOString() }

    const fields = ['default_space_name', 'default_color', 'default_view', 'default_assignee_ids',
      'auto_create_monday', 'auto_archive_after_weeks', 'default_status_template_id']
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f]
    }

    const { data, error } = await ctx.adminSupabase
      .from('action_space_settings')
      .upsert(updates, { onConflict: 'workspace_id' })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ settings: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
