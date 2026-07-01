import { NextResponse } from 'next/server'
import { resolveAuthContext } from '@/lib/server/auth-context'

function extractSheetId(input) {
  const s = String(input || '').trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s
  return null
}

// Extracts { gid, name } pairs from a Google Sheets HTML page (htmlview or pubhtml). Google embeds
// the sheet metadata differently depending on the page/account, and often as an *escaped* JSON
// string inside a <script> block (\"sheetId\":0,\"title\":\"Sheet1\" — with backslashes before the
// quotes), so every pattern here tolerates an optional backslash around the quotes.
function extractTabsFromHtml(html) {
  const tabs = []
  const seen = new Set()
  const add = (gid, name) => {
    if (gid && name && !seen.has(gid)) { seen.add(gid); tabs.push({ gid, name: name.trim() }) }
  }

  // Pattern 1: "sheetId":12345,"title":"Nome da Aba" — optionally backslash-escaped, in either order.
  const q = '\\\\?"'
  const p1a = new RegExp(`${q}sheetId${q}\\s*:\\s*(\\d+)[^{}]{0,120}?${q}title${q}\\s*:\\s*${q}([^"\\\\]+)${q}`, 'g')
  const p1b = new RegExp(`${q}title${q}\\s*:\\s*${q}([^"\\\\]+)${q}[^{}]{0,120}?${q}sheetId${q}\\s*:\\s*(\\d+)`, 'g')
  let m
  while ((m = p1a.exec(html)) !== null) add(m[1], m[2])
  while ((m = p1b.exec(html)) !== null) add(m[2], m[1])

  // Pattern 2: data-sheet-id + tab label (htmlview/pubhtml tab bar)
  if (!tabs.length) {
    const p2 = /id=["']sheet-button-(\d+)["'][^>]*>([^<]+)</g
    while ((m = p2.exec(html)) !== null) add(m[1], m[2])
  }

  // Pattern 3: gid in tab navigation links
  if (!tabs.length) {
    const p3 = /gid=(\d+)[^"']*["'][^>]*>([^<]{1,60})</g
    while ((m = p3.exec(html)) !== null) add(m[1], m[2])
  }

  return tabs
}

async function fetchHtmlSource(sheetId, path) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/${path}`
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' },
  })
  if (!res.ok) return ''
  const html = await res.text()
  if (/<title>Sign in/i.test(html) || /accounts\.google\.com/i.test(html)) return null
  return html
}

// Fetch the sheet HTML page and parse out tab names + gids. Tries the htmlview endpoint first
// (works for "anyone with the link" sharing) and falls back to pubhtml (works when the sheet was
// explicitly published to the web) since either can carry the tab metadata in a different shape.
async function fetchSheetTabs(sheetId) {
  const htmlview = await fetchHtmlSource(sheetId, 'htmlview')
  if (htmlview === null) {
    throw new Error('A planilha não está pública. Publique-a para leitura antes de usar o dashboard.')
  }

  let tabs = htmlview ? extractTabsFromHtml(htmlview) : []
  if (tabs.length) return tabs

  const pubhtml = await fetchHtmlSource(sheetId, 'pubhtml')
  if (pubhtml) tabs = extractTabsFromHtml(pubhtml)

  return tabs
}

export async function GET(request) {
  try {
    const authCtx = await resolveAuthContext()
    if (authCtx.errorResponse) return authCtx.errorResponse
    const { accessContext } = authCtx
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
