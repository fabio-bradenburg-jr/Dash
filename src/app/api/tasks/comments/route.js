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

// Parse @mentions from comment body: @[Name](userId)
function extractMentions(body) {
  const matches = [...body.matchAll(/@\[([^\]]+)\]\(([^)]+)\)/g)]
  return matches.map((m) => ({ name: m[1], user_id: m[2] }))
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const taskId = new URL(request.url).searchParams.get('task_id')
    if (!taskId) return NextResponse.json({ error: 'task_id obrigatório.' }, { status: 400 })

    const { data, error } = await ctx.adminSupabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json({ comments: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { task_id, parent_id, body: commentBody } = body

    if (!task_id || !commentBody?.trim()) {
      return NextResponse.json({ error: 'task_id e body são obrigatórios.' }, { status: 400 })
    }

    // Verify task exists in workspace
    const { data: task } = await ctx.adminSupabase
      .from('tasks')
      .select('id, client_id, assignee_id, task_public_id, title')
      .eq('id', task_id)
      .eq('workspace_id', ctx.workspaceId)
      .maybeSingle()

    if (!task) return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 })

    const { data: comment, error: commentError } = await ctx.adminSupabase
      .from('task_comments')
      .insert({
        task_id,
        author_id: ctx.user.id,
        parent_id: parent_id || null,
        body: commentBody.trim(),
      })
      .select('*')
      .single()

    if (commentError) throw commentError

    // Process @mentions
    const mentions = extractMentions(commentBody)
    const notificationsToInsert = []

    for (const mention of mentions) {
      if (mention.user_id === ctx.user.id) continue
      await ctx.adminSupabase.from('task_mentions').insert({
        comment_id: comment.id,
        task_id,
        mentioned_user_id: mention.user_id,
      })
      notificationsToInsert.push({
        workspace_id: ctx.workspaceId,
        recipient_id: mention.user_id,
        actor_id: ctx.user.id,
        type: 'mention',
        title: 'Você foi mencionado',
        body: `Em ${task.task_public_id}: ${task.title}`,
        entity_type: 'comment',
        entity_id: comment.id,
        task_id,
        client_id: task.client_id,
        deep_link: `/tarefas/${task.task_public_id}`,
      })
    }

    // Notify task assignee of new comment (if not the author and not already mentioned)
    if (task.assignee_id && task.assignee_id !== ctx.user.id && !mentions.some((m) => m.user_id === task.assignee_id)) {
      notificationsToInsert.push({
        workspace_id: ctx.workspaceId,
        recipient_id: task.assignee_id,
        actor_id: ctx.user.id,
        type: parent_id ? 'comment_reply' : 'comment',
        title: parent_id ? 'Nova resposta em tarefa sua' : 'Novo comentário em tarefa sua',
        body: `${task.task_public_id}: ${task.title}`,
        entity_type: 'comment',
        entity_id: comment.id,
        task_id,
        client_id: task.client_id,
        deep_link: `/tarefas/${task.task_public_id}`,
      })
    }

    if (notificationsToInsert.length > 0) {
      await ctx.adminSupabase.from('notifications').insert(notificationsToInsert)
    }

    return NextResponse.json({ comment })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const body = await request.json()
    const { id, body: commentBody } = body

    if (!id || !commentBody?.trim()) {
      return NextResponse.json({ error: 'id e body são obrigatórios.' }, { status: 400 })
    }

    const { data, error } = await ctx.adminSupabase
      .from('task_comments')
      .update({ body: commentBody.trim(), edited_at: new Date().toISOString() })
      .eq('id', id)
      .eq('author_id', ctx.user.id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ comment: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('task_comments')
      .update({ is_deleted: true, body: '[comentário removido]' })
      .eq('id', id)
      .eq('author_id', ctx.user.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
