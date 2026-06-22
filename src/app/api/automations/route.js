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

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext

    const { data, error } = await ctx.adminSupabase
      .from('automations')
      .select(`
        *,
        automation_triggers(*),
        automation_conditions(*),
        automation_actions(* )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Sort nested arrays by sort_order
    const automations = (data || []).map(a => ({
      ...a,
      automation_conditions: (a.automation_conditions || []).sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0)),
      automation_actions: (a.automation_actions || []).sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0)),
    }))

    return NextResponse.json({ automations })
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

    const { name, description, is_active = true, triggers = [], conditions = [], actions = [] } = body
    if (!name) return NextResponse.json({ error: 'name obrigatório.' }, { status: 400 })

    // Insert automation
    const { data: automation, error: autoErr } = await ctx.adminSupabase
      .from('automations')
      .insert({ workspace_id: workspaceId, name, description, is_active, created_by: ctx.user.id })
      .select()
      .single()
    if (autoErr) throw autoErr

    const automationId = automation.id

    // Insert triggers
    if (triggers.length > 0) {
      const { error } = await ctx.adminSupabase
        .from('automation_triggers')
        .insert(triggers.map(t => ({ ...t, automation_id: automationId })))
      if (error) throw error
    }

    // Insert conditions
    if (conditions.length > 0) {
      const { error } = await ctx.adminSupabase
        .from('automation_conditions')
        .insert(conditions.map((c, i) => ({ ...c, automation_id: automationId, sort_order: c.sort_order ?? i })))
      if (error) throw error
    }

    // Insert actions
    if (actions.length > 0) {
      const { error } = await ctx.adminSupabase
        .from('automation_actions')
        .insert(actions.map((a, i) => ({ ...a, automation_id: automationId, sort_order: a.sort_order ?? i })))
      if (error) throw error
    }

    // Fetch full record
    const { data: full, error: fetchErr } = await ctx.adminSupabase
      .from('automations')
      .select('*, automation_triggers(*), automation_conditions(*), automation_actions(*)')
      .eq('id', automationId)
      .single()
    if (fetchErr) throw fetchErr

    return NextResponse.json({ automation: full }, { status: 201 })
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
    const { id, triggers, conditions, actions, ...fields } = body
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    // Update automation fields
    const updates = { updated_at: new Date().toISOString() }
    for (const f of ['name', 'description', 'is_active']) {
      if (fields[f] !== undefined) updates[f] = fields[f]
    }

    const { error: updateErr } = await ctx.adminSupabase
      .from('automations')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
    if (updateErr) throw updateErr

    // Replace triggers if provided
    if (triggers !== undefined) {
      await ctx.adminSupabase.from('automation_triggers').delete().eq('automation_id', id)
      if (triggers.length > 0) {
        const { error } = await ctx.adminSupabase
          .from('automation_triggers')
          .insert(triggers.map(t => ({ ...t, automation_id: id })))
        if (error) throw error
      }
    }

    // Replace conditions if provided
    if (conditions !== undefined) {
      await ctx.adminSupabase.from('automation_conditions').delete().eq('automation_id', id)
      if (conditions.length > 0) {
        const { error } = await ctx.adminSupabase
          .from('automation_conditions')
          .insert(conditions.map((c, i) => ({ ...c, automation_id: id, sort_order: c.sort_order ?? i })))
        if (error) throw error
      }
    }

    // Replace actions if provided
    if (actions !== undefined) {
      await ctx.adminSupabase.from('automation_actions').delete().eq('automation_id', id)
      if (actions.length > 0) {
        const { error } = await ctx.adminSupabase
          .from('automation_actions')
          .insert(actions.map((a, i) => ({ ...a, automation_id: id, sort_order: a.sort_order ?? i })))
        if (error) throw error
      }
    }

    // Fetch full updated record
    const { data: full, error: fetchErr } = await ctx.adminSupabase
      .from('automations')
      .select('*, automation_triggers(*), automation_conditions(*), automation_actions(*)')
      .eq('id', id)
      .single()
    if (fetchErr) throw fetchErr

    return NextResponse.json({ automation: full })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    const { workspaceId } = ctx.accessContext
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    const { error } = await ctx.adminSupabase
      .from('automations')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
