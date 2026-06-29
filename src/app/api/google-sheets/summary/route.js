import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'
import { readGoogleSheetSummary } from '@/lib/server/google-sheets'

export async function GET(request) {
  try {
    const authCtx = await resolveAuthContext()
    if (authCtx.errorResponse) return authCtx.errorResponse
    const { user, accessContext, adminSupabase } = authCtx

    if (!accessContext.canViewDashboard) {
      return NextResponse.json({ error: 'Sem permissão para acessar o dashboard.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sourceUrl = searchParams.get('url') || ''
    const headerRow = Number(searchParams.get('header_row') || '1')
    const statusColumn = searchParams.get('status_column') || ''

    const summary = await readGoogleSheetSummary({
      sourceUrl,
      headerRow,
      statusColumn,
    })

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Não foi possível ler a planilha do Google Sheets.' },
      { status: 500 }
    )
  }
}
