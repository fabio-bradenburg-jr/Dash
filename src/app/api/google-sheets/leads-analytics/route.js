import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/server/supabase-admin'
import { getAccessContext } from '@/lib/server/access-control'

// ─── Parsing Helpers ─────────────────────────────────────────────────────────

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
    return { d, hits: counts.filter(c => c > 0).length, total: counts.reduce((s, c) => s + c, 0) }
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
      if (inQ && nx === '"') { cell += '"'; i++; } else { inQ = !inQ; } continue
    }
    if (ch === delimiter && !inQ) { row.push(cell); cell = ''; continue }
    if ((ch === '\n' || ch === '\r') && !inQ) {
      if (ch === '\r' && nx === '\n') i++
      row.push(cell); rows.push(row); cell = ''; row = []; continue
    }
    cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.map(r => r.map(c => String(c || '').trim())).filter(r => r.some(c => c))
}

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
  return !t || /<html/i.test(t) || ['sign in', 'access denied', 'permission', 'you need access', 'solicite acesso', 'não autorizado'].some(s => t.includes(s))
}

async function fetchSheetText(url, gidOverride) {
  for (const candidate of buildCsvUrls(url, gidOverride)) {
    const res = await fetch(candidate, { cache: 'no-store' })
    const text = await res.text()
    if (res.ok && text.trim() && !isErrorPayload(text)) return { csvUrl: candidate, text }
  }
  throw new Error('A planilha não está pública para leitura. Publique o Google Sheets para que o app consiga importar os dados.')
}

async function fetchAllTabGids(sheetId) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`
  const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return []
  const html = await res.text()
  const gids = new Set()
  const p = /"sheetId"\s*:\s*(\d+)/g
  let m
  while ((m = p.exec(html)) !== null) gids.add(m[1])
  return Array.from(gids)
}

function mergeAnalytics(results) {
  // Merge multiple analyzeLeads results into one combined result
  const merge = (map, items) => {
    for (const item of items) {
      if (!map.has(item.name)) {
        map.set(item.name, { ...item, statusDist: [...item.statusDist] })
      } else {
        const existing = map.get(item.name)
        existing.total += item.total
        existing.qualified += item.qualified
        existing.converted += item.converted
        existing.lost += item.lost
        existing.noreply += item.noreply
        // merge statusDist
        for (const sd of item.statusDist) {
          const ex = existing.statusDist.find(x => x.label === sd.label)
          if (ex) ex.count += sd.count
          else existing.statusDist.push({ ...sd })
        }
      }
    }
  }
  const campaignMap = new Map(), adsetMap = new Map(), adMap = new Map(), sourceMap = new Map()
  const dateMap = new Map()
  let total = 0, qualified = 0, converted = 0, lost = 0, noreply = 0
  const statusCountsMap = new Map()

  for (const r of results) {
    if (!r) continue
    const ov = r.overview
    total += ov.total; qualified += ov.qualified; converted += ov.converted; lost += ov.lost; noreply += ov.noreply
    merge(campaignMap, r.campaigns || [])
    merge(adsetMap, r.adsets || [])
    merge(adMap, r.ads || [])
    merge(sourceMap, r.sources || [])
    for (const sd of r.statusDist || []) {
      statusCountsMap.set(sd.label, (statusCountsMap.get(sd.label) || 0) + sd.count)
    }
    for (const t of r.timeline || []) {
      const ex = dateMap.get(t.date)
      if (ex) { ex.total += t.total; ex.qualified += t.qualified; ex.converted += t.converted; ex.lost += t.lost }
      else dateMap.set(t.date, { ...t })
    }
  }

  const recompute = (bucket) => {
    const { total: t, qualified: q, converted: c, lost: l, noreply: n } = bucket
    bucket.qualRate = t ? q / t : 0
    bucket.convRate = t ? c / t : 0
    bucket.lostRate = t ? l / t : 0
    bucket.noReplyRate = t ? n / t : 0
    bucket.score = computeScore({ total: t, qualified: q, converted: c, lost: l, noreply: n })
    bucket.statusDist.sort((a, b) => b.count - a.count)
    return bucket
  }

  const toArr = (map) => Array.from(map.values()).map(recompute).sort((a, b) => b.total - a.total)
  const statusDist = Array.from(statusCountsMap.entries())
    .map(([label, count]) => ({ label, count, class: classifyStatus(label) }))
    .sort((a, b) => b.count - a.count)
  const timeline = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  const campaigns = toArr(campaignMap), adsets = toArr(adsetMap), ads = toArr(adMap), sources = toArr(sourceMap)

  const insights = []
  if (campaigns.length >= 2) {
    const topVol = campaigns[0]
    const topQual = [...campaigns].sort((a, b) => b.qualRate - a.qualRate)[0]
    insights.push({ type: 'info', text: `A campanha "${topVol.name}" gerou mais leads (${topVol.total}).` })
    if (topQual.name !== topVol.name && topQual.qualified > 0) {
      insights.push({ type: 'info', text: `Melhor qualificação: "${topQual.name}" (${Math.round(topQual.qualRate * 100)}%).` })
    }
  }
  const noReplyPct = total ? noreply / total : 0
  if (noReplyPct > 0.3) insights.push({ type: 'warning', text: `${Math.round(noReplyPct * 100)}% dos leads estão sem resposta.` })
  const lostPct = total ? lost / total : 0
  if (lostPct > 0.4) insights.push({ type: 'warning', text: `Alto índice de perdas: ${Math.round(lostPct * 100)}%.` })
  if (ads.length > 0) {
    const topAd = [...ads].sort((a, b) => b.qualRate - a.qualRate)[0]
    if (topAd.qualified > 0) insights.push({ type: 'success', text: `Melhor anúncio: "${topAd.name}" (${Math.round(topAd.qualRate * 100)}%).` })
  }

  return {
    overview: { total, qualified, converted, lost, noreply, other: total - qualified - lost - noreply, qualRate: total ? qualified/total : 0, convRate: total ? converted/total : 0, lostRate: total ? lost/total : 0, noReplyRate: total ? noreply/total : 0 },
    statusDist, campaigns, adsets, ads, sources, timeline, insights,
    alerts: noReplyPct > 0.5 ? [{ type: 'critical', text: 'Mais de 50% dos leads sem resposta.' }] : [],
    detectedColumns: results[0]?.detectedColumns || {},
    headers: results[0]?.headers || [],
  }
}

function resolveHeaders(rows, headerRow = 1) {
  const idx = Math.max(0, headerRow - 1)
  if (rows.length <= idx) return { headerIndex: 0, headers: [] }
  return {
    headerIndex: idx,
    headers: rows[idx].map((h, i) => String(h || '').trim() || `Coluna ${i + 1}`),
  }
}

// ─── Column Detection ─────────────────────────────────────────────────────────

const COLUMN_PATTERNS = {
  // Meta Leads sheet exact names first, then generic fallbacks
  campaign:      /^campaign_name$|^campanha$|^campaign$|utm_campaign/i,
  adset:         /^adset_name$|^conjunto$|^adset$|^ad.?set$|grupo.?(an[uú]ncio|an[uú]ncios)/i,
  ad:            /^ad_name$|^an[uú]ncio$|^ad$|^criativo$|^creative$/i,
  qualification: /^qualifica[cç][aã]o$|^qualif/i,           // primary: Qualificação column
  status:        /^lead_status$|^status$|etapa|fase|pipeline|situa[cç][aã]o/i,
  date:          /^created_time$|^data.?(qualifica|entrada)?$|^dt[_\s-]/i,
  source:        /^platform$|origem|source|utm_source|canal/i,
  reason:        /^motivo$|^reason$/i,
  seller:        /^vendedor$|^seller$/i,
}

function detectColumns(headers) {
  const detected = {}
  for (const [key, pattern] of Object.entries(COLUMN_PATTERNS)) {
    const idx = headers.findIndex(h => pattern.test(h))
    if (idx >= 0) detected[key] = idx
  }
  return detected
}

// ─── Date Parsing ─────────────────────────────────────────────────────────────

function parseDate(value) {
  const s = String(value || '').trim()
  if (!s) return null
  // dd/mm/yyyy or dd-mm-yyyy
  const dmY = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (dmY) {
    const [, d, m, y] = dmY
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y)
    const dt = new Date(year, parseInt(m) - 1, parseInt(d))
    return isNaN(dt) ? null : dt
  }
  // ISO or other JS-parseable
  const dt = new Date(s)
  return isNaN(dt) ? null : dt
}

function dateKey(dt) {
  if (!dt) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// ─── Quality Score ─────────────────────────────────────────────────────────────

const QUALIFIED_PATTERNS = /p[uú]blico.?alvo|qualificado|mql|sql|oportun|agendado|em.?negocia[cç]|proposta|fechado|venda/i
const CONVERTED_PATTERNS = /venda.?realizada|fechado|ganho|won|convertido|conversion/i
const LOST_PATTERNS = /perdido|desqualificado|n[aã]o.?qualificado|cancelado|lost|rejeitado/i
const NOREPLY_PATTERNS = /sem.?resposta|n[aã]o.?respondeu|no.?reply|inativo/i

function classifyStatus(status) {
  const s = String(status || '')
  if (CONVERTED_PATTERNS.test(s)) return 'converted'
  if (QUALIFIED_PATTERNS.test(s)) return 'qualified'
  if (LOST_PATTERNS.test(s)) return 'lost'
  if (NOREPLY_PATTERNS.test(s)) return 'noreply'
  return 'other'
}

function computeScore({ total, qualified, converted, lost, noreply }) {
  if (!total) return 0
  const qualRate = qualified / total
  const convRate = converted / total
  const lostRate = lost / total
  const noReplyRate = noreply / total
  const score = (qualRate * 40) + (convRate * 35) - (lostRate * 20) - (noReplyRate * 15)
  return Math.round(Math.max(0, Math.min(100, score * 100)))
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

function emptyBucket(name) {
  return { name, total: 0, qualified: 0, converted: 0, lost: 0, noreply: 0, statusDist: {} }
}

function addToBucket(bucket, statusClass, rawStatus) {
  bucket.total++
  if (statusClass === 'qualified' || statusClass === 'converted') bucket.qualified++
  if (statusClass === 'converted') bucket.converted++
  if (statusClass === 'lost') bucket.lost++
  if (statusClass === 'noreply') bucket.noreply++
  const label = rawStatus || 'Sem status'
  bucket.statusDist[label] = (bucket.statusDist[label] || 0) + 1
}

function finalizeBucket(bucket) {
  const { total, qualified, converted, lost, noreply } = bucket
  return {
    ...bucket,
    qualRate: total ? qualified / total : 0,
    convRate: total ? converted / total : 0,
    lostRate: total ? lost / total : 0,
    noReplyRate: total ? noreply / total : 0,
    score: computeScore({ total, qualified, converted, lost, noreply }),
    statusDist: Object.entries(bucket.statusDist)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  }
}

function bucketMapToArray(map) {
  return Array.from(map.values()).map(finalizeBucket).sort((a, b) => b.total - a.total)
}

// ─── Main Analytics Function ──────────────────────────────────────────────────

function analyzeLeads({ rows, cols, headers }) {
  const statusCounts = {}
  const campaignMap = new Map()
  const adsetMap = new Map()
  const adMap = new Map()
  const sourceMap = new Map()
  const dateMap = new Map()

  let total = 0, qualified = 0, converted = 0, lost = 0, noreply = 0

  for (const row of rows) {
    const campaign = cols.campaign !== undefined ? (row[cols.campaign] || 'Sem campanha') : null
    const adset = cols.adset !== undefined ? (row[cols.adset] || 'Sem conjunto') : null
    const ad = cols.ad !== undefined ? (row[cols.ad] || 'Sem anúncio') : null
    const source = cols.source !== undefined ? (row[cols.source] || 'Sem origem') : null
    // Use Qualificação as primary dimension; fall back to status
    const rawQual = cols.qualification !== undefined ? (row[cols.qualification] || '') : ''
    const rawStatus = cols.status !== undefined ? (row[cols.status] || '') : ''
    const rawClassifier = rawQual || rawStatus  // what we classify on
    const rawDate = cols.date !== undefined ? row[cols.date] : null

    const statusClass = classifyStatus(rawClassifier)

    total++
    if (statusClass === 'qualified' || statusClass === 'converted') qualified++
    if (statusClass === 'converted') converted++
    if (statusClass === 'lost') lost++
    if (statusClass === 'noreply') noreply++

    const statusLabel = rawClassifier || 'Sem qualificação'
    statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1

    if (campaign) {
      if (!campaignMap.has(campaign)) campaignMap.set(campaign, emptyBucket(campaign))
      addToBucket(campaignMap.get(campaign), statusClass, rawStatus)
    }
    if (adset) {
      const key = adset
      if (!adsetMap.has(key)) adsetMap.set(key, emptyBucket(adset))
      addToBucket(adsetMap.get(key), statusClass, rawStatus)
    }
    if (ad) {
      if (!adMap.has(ad)) adMap.set(ad, emptyBucket(ad))
      addToBucket(adMap.get(ad), statusClass, rawStatus)
    }
    if (source) {
      if (!sourceMap.has(source)) sourceMap.set(source, emptyBucket(source))
      addToBucket(sourceMap.get(source), statusClass, rawStatus)
    }

    const dt = rawDate ? parseDate(rawDate) : null
    if (dt) {
      const k = dateKey(dt)
      if (!dateMap.has(k)) dateMap.set(k, { date: k, total: 0, qualified: 0, converted: 0, lost: 0 })
      const d = dateMap.get(k)
      d.total++
      if (statusClass === 'qualified' || statusClass === 'converted') d.qualified++
      if (statusClass === 'converted') d.converted++
      if (statusClass === 'lost') d.lost++
    }
  }

  const timeline = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))

  const statusDist = Object.entries(statusCounts)
    .map(([label, count]) => ({ label, count, class: classifyStatus(label) }))
    .sort((a, b) => b.count - a.count)

  const campaigns = bucketMapToArray(campaignMap)
  const adsets = bucketMapToArray(adsetMap)
  const ads = bucketMapToArray(adMap)
  const sources = bucketMapToArray(sourceMap)

  // Insights
  const insights = []
  if (campaigns.length >= 2) {
    const topVol = campaigns[0]
    const topQual = [...campaigns].sort((a, b) => b.qualRate - a.qualRate)[0]
    insights.push({ type: 'info', text: `A campanha "${topVol.name}" gerou mais leads (${topVol.total}).` })
    if (topQual.name !== topVol.name && topQual.qualified > 0) {
      insights.push({ type: 'info', text: `Melhor qualificação: "${topQual.name}" (${Math.round(topQual.qualRate * 100)}%).` })
    }
  }
  const noReplyPct = total ? noreply / total : 0
  if (noReplyPct > 0.3) {
    insights.push({ type: 'warning', text: `${Math.round(noReplyPct * 100)}% dos leads estão sem resposta. Pode ser gargalo no atendimento.` })
  }
  const lostPct = total ? lost / total : 0
  if (lostPct > 0.4) {
    insights.push({ type: 'warning', text: `Alto índice de perdas: ${Math.round(lostPct * 100)}% dos leads foram perdidos.` })
  }
  if (ads.length > 0) {
    const topAd = [...ads].sort((a, b) => b.qualRate - a.qualRate)[0]
    if (topAd.qualified > 0) {
      insights.push({ type: 'success', text: `Melhor anúncio por qualificação: "${topAd.name}" (${Math.round(topAd.qualRate * 100)}%).` })
    }
  }

  // Alerts
  const alerts = []
  if (noReplyPct > 0.5) alerts.push({ type: 'critical', text: 'Mais de 50% dos leads sem resposta.' })
  const highLostCampaigns = campaigns.filter(c => c.lostRate > 0.5 && c.total >= 5)
  if (highLostCampaigns.length > 0) {
    alerts.push({ type: 'warning', text: `Campanhas com alto índice de perdas: ${highLostCampaigns.map(c => c.name).join(', ')}.` })
  }

  return {
    overview: {
      total, qualified, converted, lost, noreply,
      other: total - qualified - lost - noreply,
      qualRate: total ? qualified / total : 0,
      convRate: total ? converted / total : 0,
      lostRate: total ? lost / total : 0,
      noReplyRate: total ? noreply / total : 0,
    },
    statusDist,
    campaigns,
    adsets,
    ads,
    sources,
    timeline,
    insights,
    alerts,
    detectedColumns: {
      campaign: cols.campaign !== undefined ? headers[cols.campaign] : null,
      adset: cols.adset !== undefined ? headers[cols.adset] : null,
      ad: cols.ad !== undefined ? headers[cols.ad] : null,
      qualification: cols.qualification !== undefined ? headers[cols.qualification] : null,
      status: cols.status !== undefined ? headers[cols.status] : null,
      date: cols.date !== undefined ? headers[cols.date] : null,
      source: cols.source !== undefined ? headers[cols.source] : null,
    },
    headers,
  }
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const adminSupabase = createAdminClient()
    const accessContext = await getAccessContext(supabase, user, { adminSupabase })
    if (!accessContext.canViewDashboard) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sourceUrl = searchParams.get('url') || ''
    const headerRow = Number(searchParams.get('header_row') || '1')
    const gid = searchParams.get('gid') || null  // null = use URL gid, 'all' = all tabs

    if (!sourceUrl) return NextResponse.json({ error: 'URL não informada.' }, { status: 400 })

    const sheetId = extractSheetId(sourceUrl)

    async function analyzeGid(gidValue) {
      const { text } = await fetchSheetText(sourceUrl, gidValue)
      const delimiter = detectDelimiter(text)
      const allRows = parseCsv(text, delimiter)
      const { headerIndex, headers } = resolveHeaders(allRows, headerRow)
      const dataRows = allRows.slice(headerIndex + 1).filter(r => r.some(c => c))
      const cols = detectColumns(headers)
      return analyzeLeads({ rows: dataRows, cols, headers })
    }

    let analytics, totalRows

    if (gid === 'all' && sheetId) {
      const gids = await fetchAllTabGids(sheetId)
      const validGids = gids.length > 0 ? gids : ['0']
      const results = await Promise.all(validGids.map(g => analyzeGid(g).catch(() => null)))
      const validResults = results.filter(Boolean)
      if (!validResults.length) throw new Error('Não foi possível carregar nenhuma aba.')
      analytics = mergeAnalytics(validResults)
      totalRows = validResults.reduce((s, r) => s + r.overview.total, 0)
    } else {
      analytics = await analyzeGid(gid)
      totalRows = analytics.overview.total
    }

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      totalRows,
      ...analytics,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Não foi possível analisar a planilha.' },
      { status: 500 }
    )
  }
}
