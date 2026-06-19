import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

function extractSheetId(input) {
  const s = String(input || '').trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s
  return null
}

// Fetch the sheet HTML page and parse out tab names + gids from the embedded JS
async function fetchSheetTabs(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
  })

  if (!res.ok) throw new Error('Não foi possível acessar a planilha. Verifique se está pública.')

  const html = await res.text()

  if (/<title>Sign in/i.test(html) || /accounts\.google\.com/i.test(html)) {
    throw new Error('A planilha não está pública. Publique-a para leitura antes de usar o dashboard.')
  }

  const tabs = []
  const seen = new Set()

  // Pattern 1: "sheetId":12345,"title":"Nome da Aba"
  const p1 = /"sheetId"\s*:\s*(\d+)\s*,\s*"title"\s*:\s*"([^"]+)"/g
  let m
  while ((m = p1.exec(html)) !== null) {
    const gid = m[1]
    const name = m[2]
    if (!seen.has(gid)) { seen.add(gid); tabs.push({ gid, name }) }
  }

  // Pattern 2: data-sheet-id + tab label (htmlview format)
  if (!tabs.length) {
    const p2 = /id="sheet-button-(\d+)"[^>]*>([^<]+)</g
    while ((m = p2.exec(html)) !== null) {
      const gid = m[1]
      const name = m[2].trim()
      if (!seen.has(gid)) { seen.add(gid); tabs.push({ gid, name }) }
    }
  }

  // Pattern 3: gid in tab navigation links
  if (!tabs.length) {
    const p3 = /gid=(\d+)[^"]*"[^>]*>([^<]{1,60})</g
    while ((m = p3.exec(html)) !== null) {
      const gid = m[1]
      const name = m[2].trim()
      if (name && !seen.has(gid)) { seen.add(gid); tabs.push({ gid, name }) }
    }
  }

  return tabs
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const adminSupabase = createAdminClient()
    const accessContext = await getAccessContext(supabase, user, { adminSupabase })
    if (!accessContext.canViewDashboard) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url') || ''
    const sheetId = extractSheetId(url)

    if (!sheetId) return NextResponse.json({ error: 'URL inválida.' }, { status: 400 })

    const tabs = await fetchSheetTabs(sheetId)

    return NextResponse.json({ sheetId, tabs })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Erro ao buscar abas.' }, { status: 500 })
  }
}
