import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { readClickUpSummary } from '@/lib/server/clickup'

export async function GET(request) {
  try {
    const authCtx = await resolveAuthContext()
    if (authCtx.errorResponse) return authCtx.errorResponse
    const { user, accessContext, adminSupabase } = authCtx

    if (!accessContext.canViewDashboard) {
      return NextResponse.json({ error: 'Sem permissão para acessar o dashboard.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const listIds = searchParams.get('list_ids') || ''
    const token = request.headers.get('x-clickup-token') || ''

    const summary = await readClickUpSummary({
      token,
      listIds,
    })

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Não foi possível carregar os dados do ClickUp.' },
      { status: 500 }
    )
  }
}
