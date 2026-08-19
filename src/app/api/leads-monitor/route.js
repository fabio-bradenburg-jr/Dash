import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { LEADS_MONITOR_CLIENTS, getLeadsMonitorClient } from '@/lib/leads-monitor-config'
import { getClientOverview, getClientDetail, todayKey } from '@/lib/server/leads-monitor'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const authCtx = await resolveAuthContext()
    if (authCtx.errorResponse) return authCtx.errorResponse
    const { accessContext } = authCtx

    if (!accessContext?.canViewDashboard) {
      return NextResponse.json({ error: 'Sem permissão para acessar o monitor de leads.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client') || ''
    const today = todayKey()

    // ── Detalhe de um cliente ──────────────────────────────────────────────
    if (clientId) {
      const client = getLeadsMonitorClient(clientId)
      if (!client) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 })
      const days = Math.min(Math.max(Number(searchParams.get('days') || '90'), 7), 366)
      const detail = await getClientDetail(client, { today, days })
      return NextResponse.json({ updatedAt: new Date().toISOString(), ...detail })
    }

    // ── Visão geral de todos os clientes ───────────────────────────────────
    const includeInactive = searchParams.get('inactive') === '1'
    const list = LEADS_MONITOR_CLIENTS.filter((c) => includeInactive || c.active)

    const clients = await Promise.all(list.map((c) => getClientOverview(c, { today })))

    const ok = clients.filter((c) => c.ok)
    const summary = {
      totalClients: clients.length,
      withLeadToday: ok.filter((c) => c.receivedToday).length,
      withoutLeadToday: ok.filter((c) => !c.receivedToday).length,
      unreadable: clients.filter((c) => !c.ok).length,
      totalToday: ok.reduce((s, c) => s + (c.todayCount || 0), 0),
    }

    return NextResponse.json({ updatedAt: new Date().toISOString(), today, summary, clients })
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Não foi possível carregar o monitor de leads.' },
      { status: 500 }
    )
  }
}
