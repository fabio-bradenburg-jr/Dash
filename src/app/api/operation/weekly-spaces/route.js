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

function formatDateBR(dateStr) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// GET ?week_start=YYYY-MM-DD — find or create the weekly space
export async function GET(request) {
  try {
    const ctx = await getAuthContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    const weekStart = url.searchParams.get('week_start')
    if (!weekStart) return NextResponse.json({ error: 'week_start obrigatório.' }, { status: 400 })

    // Calculate week_end (Sunday = week_start + 6 days)
    const startDate = new Date(weekStart + 'T00:00:00')
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    const weekEnd = endDate.toISOString().split('T')[0]

    const { workspaceId } = ctx.accessContext

    // Check if weekly_action_space already exists for this week
    const { data: existing } = await ctx.adminSupabase
      .from('weekly_action_spaces')
      .select('*, task_spaces(*)')
      .eq('workspace_id', workspaceId)
      .eq('week_start', weekStart)
      .maybeSingle()

    if (existing?.task_spaces) {
      return NextResponse.json({ space: existing.task_spaces, weekly_space: existing, created: false })
    }

    // Load settings to get space name template
    const { data: settings } = await ctx.adminSupabase
      .from('action_space_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    const spaceName = `${settings?.default_space_name || 'Plano de Ação'} - ${formatDateBR(weekStart)} a ${formatDateBR(weekEnd)}`
    const color = settings?.default_color || '#26c281'

    // Create the task space
    const { data: space, error: spaceErr } = await ctx.adminSupabase
      .from('task_spaces')
      .insert({
        workspace_id: workspaceId,
        name: spaceName,
        color,
        icon: 'bx-calendar-check',
        is_private: false,
        owner_id: ctx.user.id,
        sort_order: 0,
      })
      .select('*')
      .single()

    if (spaceErr) throw spaceErr

    // Record in weekly_action_spaces
    const { data: weeklySpace, error: weeklyErr } = await ctx.adminSupabase
      .from('weekly_action_spaces')
      .insert({
        workspace_id: workspaceId,
        task_space_id: space.id,
        week_start: weekStart,
        week_end: weekEnd,
      })
      .select('*')
      .single()

    if (weeklyErr) throw weeklyErr

    return NextResponse.json({ space, weekly_space: weeklySpace, created: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET list of all weekly spaces
export async function POST() {
  return NextResponse.json({ error: 'Use GET with week_start param.' }, { status: 405 })
}
