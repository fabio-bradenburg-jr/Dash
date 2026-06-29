import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'
import { PLATFORM_AUTH_COOKIE } from '@/lib/saas/auth'
import { verifyLocalAccessToken } from '@/lib/server/platform-auth-fallback'

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminSupabase = createAdminClient()

  if (user) {
    const accessContext = await getAccessContext(supabase, user, { adminSupabase })
    if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
    return { user, accessContext, adminSupabase }
  }

  const token = (await cookies()).get(PLATFORM_AUTH_COOKIE)?.value
  if (!token) return { error: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }

  const payload = await verifyLocalAccessToken(token)
  const userId = String(payload.sub || '').replace(/^supabase:/, '')
  const fakeUser = { id: userId }
  const accessContext = await getAccessContext(adminSupabase, fakeUser, { adminSupabase })
  if (!accessContext.workspaceId) return { error: NextResponse.json({ error: 'Sem workspace.' }, { status: 403 }) }
  return { user: fakeUser, accessContext, adminSupabase }
}

export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const type = new URL(request.url).searchParams.get('type') || 'onboarding'

    const { data: phases, error: phasesError } = await ctx.adminSupabase
      .from('onboarding_task_phases')
      .select('*')
      .eq('type', type)
      .order('sort_order', { ascending: true })

    if (phasesError) throw phasesError

    const phaseIds = (phases || []).map(p => p.id)
    let items = []
    if (phaseIds.length > 0) {
      const { data: itemsData, error: itemsError } = await ctx.adminSupabase
        .from('onboarding_task_items')
        .select('*')
        .in('phase_id', phaseIds)
        .order('sort_order', { ascending: true })
      if (itemsError) throw itemsError
      items = itemsData || []
    }

    const result = (phases || []).map(phase => ({
      ...phase,
      tasks: items.filter(i => i.phase_id === phase.id).map(i => ({ id: i.item_key, label: i.label, _id: i.id, sort_order: i.sort_order }))
    }))

    return NextResponse.json({ phases: result })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    if (!ctx.accessContext.canManageUsers) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const body = await request.json()

    if (body.entity === 'phase') {
      const label = String(body.label || '').trim()
      if (!label) return NextResponse.json({ error: 'label obrigatório.' }, { status: 400 })
      const type = String(body.type || 'onboarding').trim()
      const icon = String(body.icon || 'bx-check').trim()

      const { data: maxRow } = await ctx.adminSupabase
        .from('onboarding_task_phases')
        .select('sort_order')
        .eq('type', type)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      const sort_order = (maxRow?.sort_order ?? -1) + 1
      const phase_key = `phase_${Date.now()}`

      const { data, error } = await ctx.adminSupabase
        .from('onboarding_task_phases')
        .insert({ type, phase_key, label, icon, sort_order })
        .select('*')
        .single()
      if (error) throw error
      return NextResponse.json({ phase: { ...data, tasks: [] } })
    } else {
      // item
      const phase_id = String(body.phase_id || '').trim()
      const label = String(body.label || '').trim()
      if (!phase_id || !label) return NextResponse.json({ error: 'phase_id e label obrigatórios.' }, { status: 400 })

      const { data: maxRow } = await ctx.adminSupabase
        .from('onboarding_task_items')
        .select('sort_order')
        .eq('phase_id', phase_id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle()
      const sort_order = (maxRow?.sort_order ?? -1) + 1
      const item_key = `item_${Date.now()}`

      const { data, error } = await ctx.adminSupabase
        .from('onboarding_task_items')
        .insert({ phase_id, item_key, label, sort_order })
        .select('*')
        .single()
      if (error) throw error
      return NextResponse.json({ item: { id: data.item_key, _id: data.id, label: data.label, sort_order: data.sort_order } })
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    if (!ctx.accessContext.canManageUsers) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const body = await request.json()
    const id = String(body.id || '').trim()
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    if (body.entity === 'phase') {
      const updates = {}
      if (body.label !== undefined) updates.label = String(body.label).trim()
      if (body.icon !== undefined) updates.icon = String(body.icon).trim()
      if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)

      const { data, error } = await ctx.adminSupabase
        .from('onboarding_task_phases')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return NextResponse.json({ phase: data })
    } else {
      const updates = {}
      if (body.label !== undefined) updates.label = String(body.label).trim()
      if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)

      const { data, error } = await ctx.adminSupabase
        .from('onboarding_task_items')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return NextResponse.json({ item: { id: data.item_key, _id: data.id, label: data.label, sort_order: data.sort_order } })
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error
    if (!ctx.accessContext.canManageUsers) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const entity = url.searchParams.get('entity')
    if (!id) return NextResponse.json({ error: 'id obrigatório.' }, { status: 400 })

    if (entity === 'phase') {
      const { error } = await ctx.adminSupabase
        .from('onboarding_task_phases')
        .delete()
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await ctx.adminSupabase
        .from('onboarding_task_items')
        .delete()
        .eq('id', id)
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
