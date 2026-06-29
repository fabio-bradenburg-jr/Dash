import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { readMondaySummary } from '@/lib/server/monday'

export async function GET(request) {
  try {
    const authCtx = await resolveAuthContext()
    if (authCtx.errorResponse) return authCtx.errorResponse
    const { user, accessContext, adminSupabase } = authCtx

    if (!accessContext.canViewDashboard) {
      return NextResponse.json({ error: 'Sem permissão para acessar o dashboard.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const boardIds = searchParams.get('board_ids') || ''
    const since = searchParams.get('since') || ''
    const until = searchParams.get('until') || ''
    const owner = searchParams.get('owner') || ''
    const token = request.headers.get('x-monday-token') || ''

    const summary = await readMondaySummary({
      token,
      boardIds,
      since,
      until,
      owner,
    })

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Não foi possível carregar os dados do Monday.' },
      { status: 500 }
    )
  }
}
