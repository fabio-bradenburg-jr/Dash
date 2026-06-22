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

async function verifyTaskAccess(adminSupabase, taskId, workspaceId) {
  const { data } = await adminSupabase.from('tasks').select('id').eq('id', taskId).eq('workspace_id', workspaceId).single()
  return !!data
}

export async function GET(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id: taskId } = await params
    const ok = await verifyTaskAccess(ctx.adminSupabase, taskId, ctx.accessContext.workspaceId)
    if (!ok) return NextResponse.json({ error: 'Task não encontrada.' }, { status: 404 })

    const { data, error } = await ctx.adminSupabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at')

    if (error) throw error
    return NextResponse.json({ comments: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { id: taskId } = await params
    const ok = await verifyTaskAccess(ctx.adminSupabase, taskId, ctx.accessContext.workspaceId)
    if (!ok) return NextResponse.json({ error: 'Task não encontrada.' }, { status: 404 })

    const body = await request.json()
    const body_text = String(body.body || '').trim()
    if (!body_text) return NextResponse.json({ error: 'body obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('task_comments')
      .insert({ task_id: taskId, user_id: ctx.user.id, body: body_text })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ comment: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
