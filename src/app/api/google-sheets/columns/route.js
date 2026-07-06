import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext, isPrimaryAdminEmail, USER_ROLES } from '@/lib/server/access-control'
import { PLATFORM_AUTH_COOKIE } from '@/lib/saas/auth'
import { verifyLocalAccessToken } from '@/lib/server/platform-auth-fallback'

/* ─── Sheet helpers (self-contained) ─────────────────────────────────── */
function extractSheetId(url) {
  const s = String(url || '').trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9-_]{20,}$/.test(s)) return s
  return null
}

function buildCsvUrls(url, gidOverride) {
  const s = String(url || '').trim()
  if (!s) throw new Error('URL inválida.')
  if (/\/export/i.test(s) && !gidOverride) return [s]
  const id = extractSheetId(s)
  if (!id) throw new Error('Não foi possível identificar a planilha.')
  const gid = gidOverride ?? (s.match(/[?#&]gid=(\d+)/) || [])[1] ?? '0'
  return [
    `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ]
}

function isErrorPayload(text) {
  const t = String(text || '').toLowerCase()
  return !t || /<html/i.test(t) || ['sign in', 'access denied', 'permission', 'you need access', 'solicite acesso', 'não autorizado'].some((s) => t.includes(s))
}

async function fetchSheetText(url, gidOverride) {
  for (const candidate of buildCsvUrls(url, gidOverride)) {
    const res = await fetch(candidate, { cache: 'no-store' })
    const text = await res.text()
    if (res.ok && text.trim() && !isErrorPayload(text)) return text
  }
  throw new Error('A planilha não está pública para leitura. Publique o Google Sheets para o app conseguir ler as colunas.')
}

function detectDelimiter(text) {
  const candidates = [',', ';', '\t']
  const lines = String(text || '').split(/\r?\n/).filter(Boolean).slice(0, 12)
  if (!lines.length) return ','
  const scores = candidates.map((d) => {
    const counts = lines.map((line) => {
      let inQ = false, n = 0
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQ = !inQ; continue }
        if (line[i] === d && !inQ) n++
      }
      return n
    })
    return { d, hits: counts.filter((c) => c > 0).length, total: counts.reduce((s, c) => s + c, 0) }
  })
  scores.sort((a, b) => b.hits - a.hits || b.total - a.total)
  return scores[0]?.hits > 0 ? scores[0].d : ','
}

function parseCsv(text, delimiter = ',', maxRows = 40) {
  const rows = []
  let cell = '', row = [], inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1]
    if (ch === '"') { if (inQ && nx === '"') { cell += '"'; i++ } else { inQ = !inQ } continue }
    if (ch === delimiter && !inQ) { row.push(cell); cell = ''; continue }
    if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && nx === '\n') i++
      row.push(cell); rows.push(row); cell = ''; row = []
      if (rows.length >= maxRows) return rows.map((r) => r.map((c) => String(c || '').trim()))
      continue
    }
    cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.map((r) => r.map((c) => String(c || '').trim())).filter((r) => r.some((c) => c))
}

// Discover the tabs (gid + human name) of a spreadsheet, best-effort.
async function fetchTabs(sheetId) {
  const tryUrl = async (path) => {
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/${path}`, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!res.ok) return ''
      return await res.text()
    } catch { return '' }
  }
  const html = (await tryUrl('htmlview')) || (await tryUrl('pubhtml'))
  const tabs = []
  const seen = new Set()
  if (html) {
    // htmlview renders a tab bar: <li id="sheet-button-<gid>" ...>Name</li>
    const nameRe = /sheet-button-(\d+)"[^>]*>\s*(?:<[^>]*>\s*)*([^<]+?)\s*</g
    let m
    while ((m = nameRe.exec(html)) !== null) {
      const gid = m[1], name = m[2].replace(/&amp;/g, '&').trim()
      if (!seen.has(gid) && name) { seen.add(gid); tabs.push({ gid, name }) }
    }
    if (!tabs.length) {
      const gidRe = /\\?"sheetId\\?"\s*:\s*(\d+)/g
      while ((m = gidRe.exec(html)) !== null) { const gid = m[1]; if (!seen.has(gid)) { seen.add(gid); tabs.push({ gid, name: 'Aba ' + gid }) } }
    }
  }
  return tabs.length ? tabs : [{ gid: '0', name: 'Aba principal' }]
}

const QUAL_RE = /^qualifica[cç][aã]o$|^qualif|^lead_status$|^status$|etapa|fase|pipeline|situa[cç][aã]o/i
const COUNTER_RE = /^contabilizador$|^contador$|^counter$/i

export async function GET(request) {
  try {
    const adminSupabase = createAdminClient()
    let accessContext = null
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (!userError && user) {
      accessContext = await getAccessContext(supabase, user, { adminSupabase })
    } else {
      const token = (await cookies()).get(PLATFORM_AUTH_COOKIE)?.value
      if (!token) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
      const payload = await verifyLocalAccessToken(token)
      const userId = String(payload.sub || '').replace(/^supabase:/, '')
      const { data: profile } = await adminSupabase
        .from('profiles').select('id, email, role, workspace_id').eq('id', userId).maybeSingle()
      if (!profile?.workspace_id) return NextResponse.json({ error: 'Workspace não encontrado.' }, { status: 404 })
      const isPrimaryAdmin = isPrimaryAdminEmail(profile.email)
      const role = isPrimaryAdmin ? USER_ROLES.MASTER : profile.role || USER_ROLES.VIEWER
      accessContext = { canViewDashboard: isPrimaryAdmin || role === USER_ROLES.MASTER || role === USER_ROLES.OPERATOR }
    }
    if (!accessContext?.canViewDashboard) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url') || ''
    const gid = searchParams.get('gid') || ''
    const headerRow = Math.max(1, Number(searchParams.get('header_row') || '1'))
    if (!url) return NextResponse.json({ error: 'URL não informada.' }, { status: 400 })

    const sheetId = extractSheetId(url)
    const tabs = sheetId ? await fetchTabs(sheetId) : [{ gid: '0', name: 'Aba principal' }]
    const chosenGid = gid && gid !== 'all' ? gid : (tabs[0]?.gid || '0')

    const text = await fetchSheetText(url, chosenGid)
    const delimiter = detectDelimiter(text)
    const rows = parseCsv(text, delimiter)
    const headerIndex = Math.min(headerRow - 1, Math.max(0, rows.length - 1))
    const headerCells = rows[headerIndex] || []
    const columns = headerCells.map((h, i) => String(h || '').trim() || `Coluna ${i + 1}`).filter(Boolean)

    const detected = {
      qualification: columns.find((h) => QUAL_RE.test(h)) || null,
      counter: columns.find((h) => COUNTER_RE.test(h)) || null,
    }

    return NextResponse.json({ tabs, gid: chosenGid, columns, detected })
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Não foi possível ler as colunas da planilha.' }, { status: 500 })
  }
}
