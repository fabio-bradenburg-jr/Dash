// Leitura das planilhas de leads (Google Sheets público via export CSV) e agregação
// por dia, usada pela aba "Monitor de Leads". Mesma técnica de leitura do endpoint
// /api/google-sheets/leads-analytics, focada apenas na contagem diária de leads.

const TIMEZONE = 'America/Sao_Paulo'

// Cache em memória por planilha (evita reler o Google Sheets a cada carregamento/poll).
const CACHE = new Map() // spreadsheetId -> { at: number, data }
const CACHE_TTL_MS = 5 * 60 * 1000

// ─── Parsing de CSV ────────────────────────────────────────────────────────────

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

function parseCsv(text, delimiter = ',') {
  const rows = []
  let cell = '', row = [], inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1]
    if (ch === '"') {
      if (inQ && nx === '"') { cell += '"'; i++ } else { inQ = !inQ }
      continue
    }
    if (ch === delimiter && !inQ) { row.push(cell); cell = ''; continue }
    if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && nx === '\n') i++
      row.push(cell); rows.push(row); cell = ''; row = []; continue
    }
    cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.map((r) => r.map((c) => String(c || '').trim())).filter((r) => r.some((c) => c))
}

function isErrorPayload(text) {
  const t = String(text || '').toLowerCase()
  return !t || /<html/i.test(t)
    || ['sign in', 'access denied', 'permission', 'you need access', 'solicite acesso', 'não autorizado'].some((s) => t.includes(s))
}

function csvUrls(spreadsheetId, gid) {
  return [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ]
}

async function fetchTabText(spreadsheetId, gid) {
  for (const url of csvUrls(spreadsheetId, gid)) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const text = await res.text()
      if (res.ok && text.trim() && !isErrorPayload(text)) return text
    } catch {
      // tenta próxima variante
    }
  }
  return null
}

async function fetchAllTabGids(spreadsheetId) {
  const tryUrl = async (path) => {
    try {
      const res = await fetch(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/${path}`, {
        cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      if (!res.ok) return []
      const html = await res.text()
      const gids = new Set()
      const p = /\\?"sheetId\\?"\s*:\s*(\d+)/g
      let m
      while ((m = p.exec(html)) !== null) gids.add(m[1])
      return Array.from(gids)
    } catch {
      return []
    }
  }
  const fromHtmlview = await tryUrl('htmlview')
  if (fromHtmlview.length) return fromHtmlview
  const fromPub = await tryUrl('pubhtml')
  return fromPub.length ? fromPub : ['0']
}

// ─── Datas ──────────────────────────────────────────────────────────────────────

function parseDate(value) {
  const s = String(value || '').trim()
  if (!s) return null

  const dmY = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/)
  if (dmY) {
    const [, d, m, y] = dmY
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10)
    const month = parseInt(m, 10), day = parseInt(d, 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dt = new Date(year, month - 1, day)
      return isNaN(dt.getTime()) ? null : dt
    }
  }

  const ymd = s.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})/)
  if (ymd) {
    const [, y, m, d] = ymd
    const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
    return isNaN(dt.getTime()) ? null : dt
  }

  const normalized = s.replace(/^(\d{4}-\d{2}-\d{2})\s/, '$1T')
  const dt = new Date(normalized)
  return isNaN(dt.getTime()) ? null : dt
}

// Chave de dia (YYYY-MM-DD) no fuso de Brasília, independente do fuso do servidor.
const KEY_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
})
function dateKey(dt) {
  if (!dt || isNaN(dt.getTime())) return null
  return KEY_FMT.format(dt)
}

export function todayKey() {
  return KEY_FMT.format(new Date())
}

const DATE_HEADER = /^created_time$|^data$|^data[_\s-]|^date$|created.?time|carimbo|timestamp|^dt[_\s-]/i

// Escolhe a coluna de data: primeiro por nome de cabeçalho; se não achar, a coluna
// cujos valores mais parecem datas (>=60% das linhas parseiam).
function pickDateColumn(headers, rows) {
  for (let i = 0; i < headers.length; i++) {
    if (DATE_HEADER.test(headers[i] || '')) return i
  }
  const sample = rows.slice(0, 40)
  let best = -1, bestRatio = 0
  for (let c = 0; c < headers.length; c++) {
    let ok = 0, seen = 0
    for (const row of sample) {
      const v = row[c]
      if (!v) continue
      seen++
      if (parseDate(v)) ok++
    }
    const ratio = seen ? ok / seen : 0
    if (seen >= 3 && ratio >= 0.6 && ratio > bestRatio) { bestRatio = ratio; best = c }
  }
  return best
}

// ─── Agregação por planilha ──────────────────────────────────────────────────────

async function computeSeriesForSpreadsheet(spreadsheetId) {
  const gids = await fetchAllTabGids(spreadsheetId)
  const dailyMap = new Map() // dateKey -> count
  let total = 0
  let rowsWithoutDate = 0
  let hadDateColumn = false
  let readAnyTab = false

  const texts = await Promise.all(gids.map((g) => fetchTabText(spreadsheetId, g)))

  for (const text of texts) {
    if (!text) continue
    readAnyTab = true
    const delimiter = detectDelimiter(text)
    const allRows = parseCsv(text, delimiter)
    if (allRows.length < 2) continue
    const headers = allRows[0].map((h, i) => String(h || '').trim() || `col${i}`)
    const headerKey = headers.map((h) => h.toLowerCase()).join('|')
    const dataRows = allRows.slice(1).filter((r) => r.some((c) => c))
    const dateCol = pickDateColumn(headers, dataRows)
    if (dateCol >= 0) hadDateColumn = true

    for (const row of dataRows) {
      // ignora linhas que repetem o cabeçalho (separadores no meio da planilha)
      if (row.map((c) => String(c || '').trim().toLowerCase()).join('|') === headerKey) continue
      const rawDate = dateCol >= 0 ? row[dateCol] : ''
      // Quando existe coluna de data, um lead é uma linha com data preenchida.
      if (dateCol >= 0 && !String(rawDate || '').trim()) continue
      total++
      const dt = rawDate ? parseDate(rawDate) : null
      const key = dateKey(dt)
      if (key) dailyMap.set(key, (dailyMap.get(key) || 0) + 1)
      else rowsWithoutDate++
    }
  }

  if (!readAnyTab) {
    const err = new Error('Planilha não está pública para leitura (habilite o compartilhamento como "qualquer pessoa com o link").')
    err.code = 'SHEET_UNREADABLE'
    throw err
  }

  return { dailyMap, total, rowsWithoutDate, hadDateColumn }
}

async function getSpreadsheetSeries(spreadsheetId) {
  const cached = CACHE.get(spreadsheetId)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data
  const data = await computeSeriesForSpreadsheet(spreadsheetId)
  CACHE.set(spreadsheetId, { at: Date.now(), data })
  return data
}

// ─── Utilidades de série ─────────────────────────────────────────────────────────

function addDaysKey(key, delta) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

// Série contínua (com zeros) do dia mais antigo pedido até hoje.
function buildContinuousSeries(dailyMap, sinceKey, untilKey) {
  const series = []
  let key = sinceKey
  let guard = 0
  while (key <= untilKey && guard < 4000) {
    series.push({ date: key, count: dailyMap.get(key) || 0 })
    key = addDaysKey(key, 1)
    guard++
  }
  return series
}

function lastLeadInfo(dailyMap, today) {
  const keys = Array.from(dailyMap.keys()).filter((k) => (dailyMap.get(k) || 0) > 0).sort()
  const lastLeadDate = keys.length ? keys[keys.length - 1] : null
  let daysSinceLast = null
  if (lastLeadDate) {
    const a = new Date(`${lastLeadDate}T00:00:00Z`).getTime()
    const b = new Date(`${today}T00:00:00Z`).getTime()
    daysSinceLast = Math.round((b - a) / 86400000)
  }
  return { lastLeadDate, daysSinceLast }
}

// Resumo compacto de um cliente para a visão geral.
export async function getClientOverview(client, { today }) {
  try {
    const { dailyMap, total, hadDateColumn } = await getSpreadsheetSeries(client.spreadsheetId)
    const todayCount = dailyMap.get(today) || 0
    const yesterdayCount = dailyMap.get(addDaysKey(today, -1)) || 0

    const sinceKey14 = addDaysKey(today, -13)
    const sparkline = buildContinuousSeries(dailyMap, sinceKey14, today)

    const last7 = sparkline.slice(-7).reduce((s, d) => s + d.count, 0)
    const last30 = buildContinuousSeries(dailyMap, addDaysKey(today, -29), today)
      .reduce((s, d) => s + d.count, 0)

    const { lastLeadDate, daysSinceLast } = lastLeadInfo(dailyMap, today)

    return {
      id: client.id,
      name: client.name,
      active: client.active,
      spreadsheetId: client.spreadsheetId,
      ok: true,
      total,
      hadDateColumn,
      todayCount,
      yesterdayCount,
      last7,
      last30,
      lastLeadDate,
      daysSinceLast,
      receivedToday: todayCount > 0,
      sparkline,
    }
  } catch (err) {
    return {
      id: client.id,
      name: client.name,
      active: client.active,
      spreadsheetId: client.spreadsheetId,
      ok: false,
      error: err.message || 'Falha ao ler a planilha.',
      code: err.code || 'ERROR',
    }
  }
}

// Detalhe diário de um cliente para o período pedido (com zeros).
export async function getClientDetail(client, { today, days }) {
  const { dailyMap, total, hadDateColumn, rowsWithoutDate } = await getSpreadsheetSeries(client.spreadsheetId)
  const sinceKey = addDaysKey(today, -(days - 1))
  const series = buildContinuousSeries(dailyMap, sinceKey, today)
  const { lastLeadDate, daysSinceLast } = lastLeadInfo(dailyMap, today)
  const periodTotal = series.reduce((s, d) => s + d.count, 0)
  const daysWithLeads = series.filter((d) => d.count > 0).length
  const daysWithout = series.filter((d) => d.count === 0).length

  return {
    id: client.id,
    name: client.name,
    active: client.active,
    spreadsheetId: client.spreadsheetId,
    today,
    days,
    total,
    hadDateColumn,
    rowsWithoutDate,
    todayCount: dailyMap.get(today) || 0,
    lastLeadDate,
    daysSinceLast,
    periodTotal,
    daysWithLeads,
    daysWithout,
    series,
  }
}
