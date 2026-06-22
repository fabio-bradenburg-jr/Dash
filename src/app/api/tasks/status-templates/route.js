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

async function getTemplatesWithItems(adminSupabase, workspaceId) {
  const { data: templates, error } = await adminSupabase
    .from('task_status_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) throw error

  if (!templates || templates.length === 0) return null

  // Get all items for these templates
  const templateIds = templates.map(t => t.id)
  const { data: items, error: itemsError } = await adminSupabase
    .from('task_status_items')
    .select('*')
    .in('template_id', templateIds)
    .order('sort_order', { ascending: true })

  if (itemsError) throw itemsError

  // Get task counts per item
  const itemIds = (items || []).map(i => i.id)
  let taskCounts = {}
  if (itemIds.length > 0) {
    const { data: taskCountRows } = await adminSupabase
      .from('tasks')
      .select('status_item_id')
      .in('status_item_id', itemIds)
      .eq('is_archived', false)

    for (const row of taskCountRows || []) {
      if (row.status_item_id) {
        taskCounts[row.status_item_id] = (taskCounts[row.status_item_id] || 0) + 1
      }
    }
  }

  return templates.map(tmpl => ({
    ...tmpl,
    items: (items || [])
      .filter(i => i.template_id === tmpl.id)
      .map(i => ({ ...i, task_count: taskCounts[i.id] || 0 })),
  }))
}

async function copyDefaultTemplate(adminSupabase, workspaceId) {
  // Get default template
  const { data: defaultTmpls } = await adminSupabase
    .from('task_status_templates')
    .select('*')
    .eq('workspace_id', 'default')
    .order('created_at', { ascending: true })

  if (!defaultTmpls || defaultTmpls.length === 0) return []

  const created = []
  for (const dt of defaultTmpls) {
    const { data: newTmpl, error: tmplErr } = await adminSupabase
      .from('task_status_templates')
      .insert({ workspace_id: workspaceId, name: dt.name, is_default: dt.is_default })
      .select('*')
      .single()
    if (tmplErr) throw tmplErr

    const { data: srcItems } = await adminSupabase
      .from('task_status_items')
      .select('*')
      .eq('template_id', dt.id)
      .order('sort_order', { ascending: true })

    if (srcItems && srcItems.length > 0) {
      const toInsert = srcItems.map(({ id: _id, template_id: _tid, created_at: _ca, ...rest }) => ({
        ...rest,
        template_id: newTmpl.id,
      }))
      const { data: newItems, error: itemsErr } = await adminSupabase
        .from('task_status_items')
        .insert(toInsert)
        .select('*')
      if (itemsErr) throw itemsErr
      created.push({ ...newTmpl, items: newItems || [] })
    } else {
      created.push({ ...newTmpl, items: [] })
    }
  }

  return created
}

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext

    let templates = await getTemplatesWithItems(ctx.adminSupabase, workspaceId)

    if (!templates) {
      // Copy from default
      templates = await copyDefaultTemplate(ctx.adminSupabase, workspaceId)
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const body = await request.json()

    // Create a new status item in a template
    if (body.entity === 'item') {
      const { template_id, name, color, sort_order } = body
      if (!template_id || !name) return NextResponse.json({ error: 'template_id e name obrigatórios.' }, { status: 400 })

      const { data, error } = await ctx.adminSupabase
        .from('task_status_items')
        .insert({
          template_id,
          name: String(name).trim(),
          color: String(color || '#94a3b8').trim(),
          sort_order: Number(sort_order ?? 0),
          is_initial: false,
          is_completed: false,
          pauses_sla: false,
        })
        .select('*')
        .single()

      if (error) throw error
      return NextResponse.json({ item: data })
    }

    // Create a new template
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'name obrigatório.' }, { status: 400 })

    const { data: newTmpl, error: tmplErr } = await ctx.adminSupabase
      .from('task_status_templates')
      .insert({ workspace_id: workspaceId, name, is_default: false })
      .select('*')
      .single()

    if (tmplErr) throw tmplErr

    let items = []

    if (body.copy_from_id) {
      const { data: srcItems } = await ctx.adminSupabase
        .from('task_status_items')
        .select('*')
        .eq('template_id', body.copy_from_id)
        .order('sort_order', { ascending: true })

      if (srcItems && srcItems.length > 0) {
        const toInsert = srcItems.map(({ id: _id, template_id: _tid, created_at: _ca, ...rest }) => ({
          ...rest,
          template_id: newTmpl.id,
        }))
        const { data: newItems, error: itemsErr } = await ctx.adminSupabase
          .from('task_status_items')
          .insert(toInsert)
          .select('*')
        if (itemsErr) throw itemsErr
        items = newItems || []
      }
    }

    return NextResponse.json({ template: { ...newTmpl, items } })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const body = await request.json()

    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    if (body.entity === 'item') {
      const updates = {}
      if (body.name !== undefined) updates.name = String(body.name).trim()
      if (body.color !== undefined) updates.color = String(body.color).trim()
      if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)
      if (body.is_initial !== undefined) updates.is_initial = Boolean(body.is_initial)
      if (body.is_completed !== undefined) updates.is_completed = Boolean(body.is_completed)
      if (body.pauses_sla !== undefined) updates.pauses_sla = Boolean(body.pauses_sla)

      const { data, error } = await ctx.adminSupabase
        .from('task_status_items')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return NextResponse.json({ item: data })
    }

    // Update template
    const updates = {}
    if (body.name !== undefined) updates.name = String(body.name).trim()
    if (body.is_default !== undefined) {
      updates.is_default = Boolean(body.is_default)
      if (updates.is_default) {
        // Unset other defaults for this workspace
        await ctx.adminSupabase
          .from('task_status_templates')
          .update({ is_default: false })
          .eq('workspace_id', workspaceId)
          .neq('id', id)
      }
    }

    const { data, error } = await ctx.adminSupabase
      .from('task_status_templates')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ template: data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const body = await request.json()

    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    if (body.entity === 'item') {
      const migrateToItemId = body.migrate_to_item_id
      if (migrateToItemId) {
        await ctx.adminSupabase
          .from('tasks')
          .update({ status_item_id: migrateToItemId })
          .eq('status_item_id', id)
      }
      const { error } = await ctx.adminSupabase
        .from('task_status_items')
        .delete()
        .eq('id', id)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    // Delete template — migrate tasks first
    const migrateToTemplateId = body.migrate_to_template_id
    if (!migrateToTemplateId) return NextResponse.json({ error: 'migrate_to_template_id obrigatório.' }, { status: 400 })

    // Get items in the template to be deleted
    const { data: deletedItems } = await ctx.adminSupabase
      .from('task_status_items')
      .select('id')
      .eq('template_id', id)

    if (deletedItems && deletedItems.length > 0) {
      // Get initial item of the target template
      const { data: targetInitial } = await ctx.adminSupabase
        .from('task_status_items')
        .select('id')
        .eq('template_id', migrateToTemplateId)
        .eq('is_initial', true)
        .limit(1)
        .maybeSingle()

      const { data: targetFirst } = !targetInitial ? await ctx.adminSupabase
        .from('task_status_items')
        .select('id')
        .eq('template_id', migrateToTemplateId)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle() : { data: null }

      const targetItemId = targetInitial?.id || targetFirst?.id
      if (targetItemId) {
        const deletedIds = deletedItems.map(i => i.id)
        await ctx.adminSupabase
          .from('tasks')
          .update({ status_item_id: targetItemId })
          .in('status_item_id', deletedIds)
      }
    }

    const { error } = await ctx.adminSupabase
      .from('task_status_templates')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
