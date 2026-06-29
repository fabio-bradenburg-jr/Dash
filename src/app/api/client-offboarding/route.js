import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { resolveAuthContext } from '@/lib/server/auth-context'

async function getAuthContext() {
  const ctx = await resolveAuthContext()
  if (ctx.errorResponse) return { error: ctx.errorResponse }
  return { user: ctx.user, accessContext: ctx.accessContext, adminSupabase: ctx.adminSupabase }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const { data, error } = await ctx.adminSupabase
      .from('client_offboarding_checklists')
      .select('*')
      .eq('workspace_id', ctx.accessContext.workspaceId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ records: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const clientId = String(body.clientId || '').trim()
    if (!clientId) return NextResponse.json({ error: 'clientId obrigatório.' }, { status: 400 })

    const completedTasks = Array.isArray(body.completedTasks) ? body.completedTasks : []
    const notes = String(body.notes || '')
    const now = new Date().toISOString()

    const { data, error } = await ctx.adminSupabase
      .from('client_offboarding_checklists')
      .upsert(
        {
          workspace_id: ctx.accessContext.workspaceId,
          client_id: clientId,
          completed_tasks: completedTasks,
          notes,
          updated_by: ctx.user.id,
          updated_at: now,
          created_by: ctx.user.id,
        },
        { onConflict: 'workspace_id,client_id' }
      )
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ record: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
