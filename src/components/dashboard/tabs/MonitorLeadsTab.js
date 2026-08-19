'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) { return (n || 0).toLocaleString('pt-BR') }

function fmtDateBR(key) {
  if (!key) return '—'
  const [y, m, d] = key.split('-')
  return `${d}/${m}/${y}`
}

function weekdayShort(key) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dt.getUTCDay()]
}

function daysAgoLabel(days) {
  if (days === null || days === undefined) return 'Nunca recebeu'
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return `Há ${days} dias`
}

// Cor da célula do heatmap conforme a contagem de leads no dia.
function heatColor(count) {
  if (count <= 0) return { bg: 'rgba(255,75,75,0.10)', border: 'rgba(255,75,75,0.22)' } // dia SEM lead
  if (count === 1) return { bg: 'rgba(38,194,129,0.22)', border: 'rgba(38,194,129,0.30)' }
  if (count <= 3) return { bg: 'rgba(38,194,129,0.42)', border: 'rgba(38,194,129,0.5)' }
  if (count <= 6) return { bg: 'rgba(38,194,129,0.65)', border: 'rgba(38,194,129,0.7)' }
  return { bg: '#26c281', border: '#4fdf9b' }
}

const PERIODS = [
  { id: 30, label: '30 dias' },
  { id: 60, label: '60 dias' },
  { id: 90, label: '90 dias' },
  { id: 180, label: '180 dias' },
]

// ─── Sparkline (mini barras dos últimos 14 dias) ────────────────────────────────

function Sparkline({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="mlt-spark" title="Últimos 14 dias">
      {data.map((d) => {
        const h = d.count > 0 ? Math.max(14, (d.count / max) * 100) : 6
        const c = heatColor(d.count)
        return (
          <span
            key={d.date}
            className="mlt-spark-bar"
            style={{ height: `${h}%`, background: d.count > 0 ? c.bg : 'rgba(255,255,255,0.06)' }}
            title={`${fmtDateBR(d.date)}: ${d.count} lead(s)`}
          />
        )
      })}
    </div>
  )
}

// ─── Card de cliente (visão geral) ──────────────────────────────────────────────

function ClientCard({ c, onOpen }) {
  if (!c.ok) {
    return (
      <button type="button" className="mlt-card mlt-card-error" onClick={() => onOpen(c)}>
        <div className="mlt-card-head">
          <span className="mlt-card-name">{c.name}</span>
          <span className="mlt-badge mlt-badge-error"><i className="bx bx-error" /> Sem leitura</span>
        </div>
        <p className="mlt-card-errmsg">{c.error}</p>
      </button>
    )
  }
  const statusClass = !c.active ? 'muted' : c.receivedToday ? 'ok' : 'warn'
  return (
    <button type="button" className={`mlt-card mlt-card-${statusClass}`} onClick={() => onOpen(c)}>
      <div className="mlt-card-head">
        <span className="mlt-card-name">
          <span className={`mlt-dot mlt-dot-${statusClass}`} />
          {c.name}
        </span>
        {!c.active
          ? <span className="mlt-badge mlt-badge-muted">Inativo</span>
          : c.receivedToday
            ? <span className="mlt-badge mlt-badge-ok"><i className="bx bx-check" /> Hoje</span>
            : <span className="mlt-badge mlt-badge-warn"><i className="bx bx-time-five" /> Sem lead hoje</span>}
      </div>

      <div className="mlt-card-today">
        <span className="mlt-card-today-num">{fmt(c.todayCount)}</span>
        <span className="mlt-card-today-lbl">lead{c.todayCount === 1 ? '' : 's'} hoje</span>
      </div>

      <Sparkline data={c.sparkline} />

      <div className="mlt-card-foot">
        <span className={c.daysSinceLast > 1 ? 'mlt-foot-warn' : ''}>
          <i className="bx bx-calendar-check" /> {daysAgoLabel(c.daysSinceLast)}
        </span>
        <span><i className="bx bx-trending-up" /> 7d: {fmt(c.last7)} · 30d: {fmt(c.last30)}</span>
      </div>
    </button>
  )
}

// ─── Heatmap tipo calendário ────────────────────────────────────────────────────

function CalendarHeatmap({ series }) {
  // Agrupa a série contínua em semanas (colunas), começando no domingo.
  const weeks = useMemo(() => {
    if (!series?.length) return []
    const cells = series.map((d) => {
      const [y, m, dd] = d.date.split('-').map(Number)
      const dow = new Date(Date.UTC(y, m - 1, dd)).getUTCDay()
      return { ...d, dow }
    })
    const cols = []
    let current = new Array(cells[0].dow).fill(null)
    for (const cell of cells) {
      current.push(cell)
      if (cell.dow === 6) { cols.push(current); current = [] }
    }
    if (current.length) { while (current.length < 7) current.push(null); cols.push(current) }
    return cols
  }, [series])

  return (
    <div className="mlt-heatmap-wrap">
      <div className="mlt-heatmap">
        <div className="mlt-heat-days">
          {['', 'Seg', '', 'Qua', '', 'Sex', ''].map((l, i) => (
            <span key={i} className="mlt-heat-daylabel">{l}</span>
          ))}
        </div>
        <div className="mlt-heat-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="mlt-heat-col">
              {week.map((cell, di) => {
                if (!cell) return <span key={di} className="mlt-heat-cell mlt-heat-empty" />
                const c = heatColor(cell.count)
                return (
                  <span
                    key={di}
                    className="mlt-heat-cell"
                    style={{ background: c.bg, borderColor: c.border }}
                    title={`${weekdayShort(cell.date)} ${fmtDateBR(cell.date)} — ${cell.count} lead(s)`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mlt-heat-legend">
        <span className="mlt-legend-item"><span className="mlt-heat-cell" style={{ background: heatColor(0).bg, borderColor: heatColor(0).border }} /> Sem lead</span>
        <span className="mlt-legend-item"><span className="mlt-heat-cell" style={{ background: heatColor(1).bg }} /> 1</span>
        <span className="mlt-legend-item"><span className="mlt-heat-cell" style={{ background: heatColor(3).bg }} /> 2-3</span>
        <span className="mlt-legend-item"><span className="mlt-heat-cell" style={{ background: heatColor(6).bg }} /> 4-6</span>
        <span className="mlt-legend-item"><span className="mlt-heat-cell" style={{ background: heatColor(9).bg }} /> 7+</span>
      </div>
    </div>
  )
}

// ─── Detalhe de um cliente ──────────────────────────────────────────────────────

function ClientDetail({ client, onBack }) {
  const [days, setDays] = useState(90)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/leads-monitor?client=${encodeURIComponent(client.id)}&days=${days}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar.')
      setData(json)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [client.id, days])

  useEffect(() => { load() }, [load])

  const recent = useMemo(() => (data?.series ? [...data.series].reverse() : []), [data])

  return (
    <div className="mlt-detail">
      <div className="mlt-detail-head">
        <button type="button" className="mlt-back" onClick={onBack}><i className="bx bx-arrow-back" /> Voltar</button>
        <div className="mlt-detail-title">
          <span className="mlt-kicker">Monitor de Leads</span>
          <h2>{client.name}{!client.active && <span className="mlt-badge mlt-badge-muted" style={{ marginLeft: 10 }}>Inativo</span>}</h2>
        </div>
        <div className="mlt-periods">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" className={`mlt-period${days === p.id ? ' active' : ''}`} onClick={() => setDays(p.id)}>{p.label}</button>
          ))}
        </div>
      </div>

      {loading && <div className="mlt-loading"><span className="mlt-spinner" /> Carregando histórico…</div>}
      {error && <div className="mlt-error-box"><i className="bx bx-error-circle" /> {error} <button type="button" onClick={load}>Tentar de novo</button></div>}

      {data && !loading && (
        <>
          {data.daysSinceLast > 1 && (
            <div className="mlt-alert">
              <i className="bx bx-error" />
              <span><strong>{client.name}</strong> está há <strong>{data.daysSinceLast} dias</strong> sem receber lead. Último lead em {fmtDateBR(data.lastLeadDate)}.</span>
            </div>
          )}

          <div className="mlt-stats">
            <div className="mlt-stat"><span className="mlt-stat-num">{fmt(data.todayCount)}</span><span className="mlt-stat-lbl">Hoje</span></div>
            <div className="mlt-stat"><span className="mlt-stat-num">{fmt(data.periodTotal)}</span><span className="mlt-stat-lbl">No período ({data.days}d)</span></div>
            <div className="mlt-stat"><span className="mlt-stat-num" style={{ color: '#4fdf9b' }}>{fmt(data.daysWithLeads)}</span><span className="mlt-stat-lbl">Dias com lead</span></div>
            <div className="mlt-stat"><span className="mlt-stat-num" style={{ color: '#FF6B6B' }}>{fmt(data.daysWithout)}</span><span className="mlt-stat-lbl">Dias sem lead</span></div>
            <div className="mlt-stat"><span className="mlt-stat-num">{daysAgoLabel(data.daysSinceLast)}</span><span className="mlt-stat-lbl">Último lead</span></div>
            <div className="mlt-stat"><span className="mlt-stat-num">{fmt(data.total)}</span><span className="mlt-stat-lbl">Total na planilha</span></div>
          </div>

          {!data.hadDateColumn && (
            <div className="mlt-note"><i className="bx bx-info-circle" /> Esta planilha não tem coluna de data reconhecida — o histórico diário pode ficar incompleto.</div>
          )}

          <div className="mlt-panel">
            <div className="mlt-panel-head"><h3>Calendário de chegada de leads</h3><span>Cada quadrado é um dia. Vermelho = nenhum lead chegou.</span></div>
            <CalendarHeatmap series={data.series} />
          </div>

          <div className="mlt-panel">
            <div className="mlt-panel-head"><h3>Histórico diário</h3><span>Do mais recente para o mais antigo</span></div>
            <div className="mlt-history">
              {recent.map((d) => (
                <div key={d.date} className={`mlt-hist-row${d.count === 0 ? ' mlt-hist-zero' : ''}`}>
                  <span className="mlt-hist-date">{weekdayShort(d.date)} · {fmtDateBR(d.date)}</span>
                  <span className="mlt-hist-bar-wrap">
                    <span className="mlt-hist-bar" style={{ width: `${Math.min(100, d.count * 12)}%`, background: heatColor(d.count).bg }} />
                  </span>
                  {d.count === 0
                    ? <span className="mlt-hist-count mlt-hist-count-zero">sem lead</span>
                    : <span className="mlt-hist-count">{fmt(d.count)} lead{d.count === 1 ? '' : 's'}</span>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <Styles />
    </div>
  )
}

// ─── Componente principal ───────────────────────────────────────────────────────

export default function MonitorLeadsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | without | with
  const [includeInactive, setIncludeInactive] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/leads-monitor${includeInactive ? '?inactive=1' : ''}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar.')
      setData(json)
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }, [includeInactive])

  useEffect(() => { load() }, [load])

  const clients = useMemo(() => {
    const list = data?.clients ? [...data.clients] : []
    // Ordena: sem lida (erro) primeiro, depois sem lead hoje, depois por leads hoje desc.
    list.sort((a, b) => {
      if (a.ok !== b.ok) return a.ok ? 1 : -1
      const ar = a.receivedToday ? 1 : 0
      const br = b.receivedToday ? 1 : 0
      if (ar !== br) return ar - br
      return (b.todayCount || 0) - (a.todayCount || 0)
    })
    if (filter === 'without') return list.filter((c) => c.ok && !c.receivedToday)
    if (filter === 'with') return list.filter((c) => c.ok && c.receivedToday)
    return list
  }, [data, filter])

  if (selected) {
    return <ClientDetail client={selected} onBack={() => setSelected(null)} />
  }

  const s = data?.summary

  return (
    <div className="mlt-root">
      <div className="mlt-head">
        <div>
          <span className="mlt-kicker">Monitor de Leads</span>
          <h2 className="mlt-title">Chegada diária de leads por cliente</h2>
          <p className="mlt-sub">Acompanhe todo dia quem recebeu lead e quem não recebeu. Clique num cliente para ver o histórico completo.</p>
        </div>
        <button type="button" className="mlt-refresh" onClick={load} title="Atualizar"><i className="bx bx-refresh" /></button>
      </div>

      {s && (
        <div className="mlt-summary">
          <div className="mlt-sum-card"><span className="mlt-sum-num">{fmt(s.totalToday)}</span><span className="mlt-sum-lbl">Leads hoje (total)</span></div>
          <div className="mlt-sum-card mlt-sum-ok"><span className="mlt-sum-num">{fmt(s.withLeadToday)}</span><span className="mlt-sum-lbl">Clientes com lead hoje</span></div>
          <div className="mlt-sum-card mlt-sum-warn"><span className="mlt-sum-num">{fmt(s.withoutLeadToday)}</span><span className="mlt-sum-lbl">Clientes sem lead hoje</span></div>
          {s.unreadable > 0 && <div className="mlt-sum-card mlt-sum-err"><span className="mlt-sum-num">{fmt(s.unreadable)}</span><span className="mlt-sum-lbl">Planilhas sem leitura</span></div>}
        </div>
      )}

      <div className="mlt-toolbar">
        <div className="mlt-filters">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'without', label: 'Sem lead hoje' },
            { id: 'with', label: 'Receberam hoje' },
          ].map((f) => (
            <button key={f.id} type="button" className={`mlt-chip${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>{f.label}</button>
          ))}
        </div>
        <label className="mlt-toggle">
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
          Incluir clientes inativos
        </label>
        {data?.updatedAt && <span className="mlt-updated">Atualizado {new Date(data.updatedAt).toLocaleTimeString('pt-BR')}</span>}
      </div>

      {loading && <div className="mlt-loading"><span className="mlt-spinner" /> Lendo planilhas de leads…</div>}
      {error && <div className="mlt-error-box"><i className="bx bx-error-circle" /> {error} <button type="button" onClick={load}>Tentar de novo</button></div>}

      {!loading && !error && (
        <div className="mlt-grid">
          {clients.map((c) => <ClientCard key={c.id} c={c} onOpen={setSelected} />)}
          {clients.length === 0 && <div className="mlt-empty">Nenhum cliente neste filtro.</div>}
        </div>
      )}
      <Styles />
    </div>
  )
}

// ─── Estilos (brandkit Kinetic Emerald) ─────────────────────────────────────────

function Styles() {
  return (
    <style jsx global>{`
      .mlt-root, .mlt-detail { display: flex; flex-direction: column; gap: 18px; padding: 4px 0 40px; }
      .mlt-kicker {
        font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
        color: #26c281; background: rgba(38,194,129,0.1); border: 1px solid rgba(38,194,129,0.2);
        border-radius: 100px; padding: 2px 10px; display: inline-block; width: fit-content;
      }
      .mlt-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .mlt-title { font-size: 22px; font-weight: 700; margin: 8px 0 4px; color: #E5E2E1; }
      .mlt-sub { font-size: 13px; color: rgba(229,226,225,0.5); margin: 0; max-width: 640px; }
      .mlt-refresh {
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
        color: #ccc; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center;
        justify-content: center; font-size: 20px; transition: all .15s; flex-shrink: 0;
      }
      .mlt-refresh:hover { background: rgba(38,194,129,0.14); color: #4fdf9b; box-shadow: 0 0 24px rgba(38,194,129,0.15); }

      /* Summary */
      .mlt-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .mlt-sum-card {
        background: rgba(28,28,28,0.4); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px 18px;
        display: flex; flex-direction: column; gap: 4px;
      }
      .mlt-sum-num { font-size: 28px; font-weight: 700; color: #E5E2E1; line-height: 1; }
      .mlt-sum-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(229,226,225,0.45); }
      .mlt-sum-ok { border-top: 3px solid #26c281; }
      .mlt-sum-ok .mlt-sum-num { color: #4fdf9b; }
      .mlt-sum-warn { border-top: 3px solid #FFB800; }
      .mlt-sum-warn .mlt-sum-num { color: #FFB800; }
      .mlt-sum-err { border-top: 3px solid #FF4B4B; }
      .mlt-sum-err .mlt-sum-num { color: #FF6B6B; }

      /* Toolbar */
      .mlt-toolbar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      .mlt-filters { display: flex; gap: 6px; }
      .mlt-chip {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9999px;
        color: rgba(229,226,225,0.55); padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer;
        transition: all .15s; text-transform: uppercase; letter-spacing: 0.04em;
      }
      .mlt-chip:hover { background: rgba(255,255,255,0.09); color: #E5E2E1; }
      .mlt-chip.active { background: rgba(38,194,129,0.16); border-color: rgba(38,194,129,0.4); color: #4fdf9b; }
      .mlt-toggle { display: flex; align-items: center; gap: 7px; font-size: 12px; color: rgba(229,226,225,0.55); cursor: pointer; }
      .mlt-toggle input { accent-color: #26c281; }
      .mlt-updated { font-size: 11px; color: rgba(229,226,225,0.35); margin-left: auto; }

      /* Grid + cards */
      .mlt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
      .mlt-card {
        text-align: left; background: rgba(28,28,28,0.4); backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px 18px;
        display: flex; flex-direction: column; gap: 12px; cursor: pointer; transition: all .15s; color: inherit;
      }
      .mlt-card:hover { border-color: rgba(38,194,129,0.3); box-shadow: 0 0 30px rgba(38,194,129,0.1); transform: translateY(-1px); }
      .mlt-card-warn { border-left: 3px solid #FFB800; }
      .mlt-card-ok { border-left: 3px solid #26c281; }
      .mlt-card-muted { opacity: 0.7; }
      .mlt-card-error { border-left: 3px solid #FF4B4B; }
      .mlt-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .mlt-card-name { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #E5E2E1; }
      .mlt-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .mlt-dot-ok { background: #26c281; box-shadow: 0 0 8px rgba(38,194,129,0.6); }
      .mlt-dot-warn { background: #FFB800; }
      .mlt-dot-muted { background: rgba(255,255,255,0.25); }
      .mlt-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 9px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
      .mlt-badge-ok { color: #003821; background: #26c281; }
      .mlt-badge-warn { color: #4a3500; background: #FFB800; }
      .mlt-badge-muted { color: rgba(229,226,225,0.6); background: rgba(255,255,255,0.08); }
      .mlt-badge-error { color: #FF6B6B; background: rgba(255,75,75,0.14); }
      .mlt-card-today { display: flex; align-items: baseline; gap: 8px; }
      .mlt-card-today-num { font-size: 34px; font-weight: 800; color: #E5E2E1; line-height: 1; }
      .mlt-card-today-lbl { font-size: 12px; color: rgba(229,226,225,0.45); }
      .mlt-card-foot { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: rgba(229,226,225,0.5); }
      .mlt-card-foot i { margin-right: 4px; }
      .mlt-foot-warn { color: #FFB800; font-weight: 600; }
      .mlt-card-errmsg { font-size: 11px; color: rgba(229,226,225,0.5); margin: 0; line-height: 1.4; }

      /* Sparkline */
      .mlt-spark { display: flex; align-items: flex-end; gap: 3px; height: 40px; }
      .mlt-spark-bar { flex: 1; border-radius: 2px 2px 0 0; min-height: 3px; transition: height .2s; }

      /* Detail */
      .mlt-detail-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
      .mlt-back {
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 9999px;
        color: #E5E2E1; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
      }
      .mlt-back:hover { background: rgba(255,255,255,0.1); }
      .mlt-detail-title h2 { font-size: 22px; font-weight: 700; margin: 6px 0 0; color: #E5E2E1; display: flex; align-items: center; }
      .mlt-periods { display: flex; gap: 4px; margin-left: auto; }
      .mlt-period {
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 9999px;
        color: rgba(229,226,225,0.55); padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;
      }
      .mlt-period.active { background: rgba(38,194,129,0.16); border-color: rgba(38,194,129,0.4); color: #4fdf9b; }

      .mlt-alert {
        display: flex; align-items: center; gap: 10px; padding: 12px 16px;
        background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.25); border-radius: 12px;
        color: #FFD666; font-size: 13px;
      }
      .mlt-alert i { font-size: 18px; }

      .mlt-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
      .mlt-stat {
        background: rgba(28,28,28,0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 3px;
      }
      .mlt-stat-num { font-size: 22px; font-weight: 700; color: #E5E2E1; line-height: 1.1; }
      .mlt-stat-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(229,226,225,0.45); }

      .mlt-note, .mlt-panel { }
      .mlt-note { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(229,226,225,0.5); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 10px 14px; }

      .mlt-panel { background: rgba(28,28,28,0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 18px 20px; }
      .mlt-panel-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
      .mlt-panel-head h3 { font-size: 15px; font-weight: 700; margin: 0; color: #E5E2E1; }
      .mlt-panel-head span { font-size: 11px; color: rgba(229,226,225,0.4); }

      /* Heatmap */
      .mlt-heatmap-wrap { display: flex; flex-direction: column; gap: 12px; }
      .mlt-heatmap { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
      .mlt-heat-days { display: flex; flex-direction: column; gap: 4px; padding-top: 0; flex-shrink: 0; }
      .mlt-heat-daylabel { height: 15px; font-size: 9px; color: rgba(229,226,225,0.35); display: flex; align-items: center; }
      .mlt-heat-grid { display: flex; gap: 4px; }
      .mlt-heat-col { display: flex; flex-direction: column; gap: 4px; }
      .mlt-heat-cell { width: 15px; height: 15px; border-radius: 3px; border: 1px solid transparent; flex-shrink: 0; }
      .mlt-heat-empty { background: transparent; border-color: transparent; }
      .mlt-heat-legend { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      .mlt-legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(229,226,225,0.5); }
      .mlt-legend-item .mlt-heat-cell { width: 13px; height: 13px; }

      /* History */
      .mlt-history { display: flex; flex-direction: column; gap: 2px; max-height: 460px; overflow-y: auto; }
      .mlt-hist-row { display: flex; align-items: center; gap: 12px; padding: 7px 8px; border-radius: 8px; }
      .mlt-hist-row:hover { background: rgba(255,255,255,0.03); }
      .mlt-hist-zero { opacity: 0.75; }
      .mlt-hist-date { width: 130px; flex-shrink: 0; font-size: 12px; color: rgba(229,226,225,0.7); text-transform: capitalize; }
      .mlt-hist-bar-wrap { flex: 1; height: 8px; background: rgba(255,255,255,0.04); border-radius: 4px; overflow: hidden; }
      .mlt-hist-bar { display: block; height: 100%; border-radius: 4px; min-width: 2px; }
      .mlt-hist-count { width: 80px; text-align: right; flex-shrink: 0; font-size: 12px; font-weight: 600; color: #E5E2E1; }
      .mlt-hist-count-zero { color: #FF6B6B; font-weight: 500; }

      /* States */
      .mlt-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 48px; color: rgba(229,226,225,0.5); font-size: 14px; }
      .mlt-spinner { width: 26px; height: 26px; border: 3px solid rgba(38,194,129,0.2); border-top-color: #26c281; border-radius: 50%; animation: mlt-spin .8s linear infinite; }
      @keyframes mlt-spin { to { transform: rotate(360deg); } }
      .mlt-error-box { display: flex; align-items: center; gap: 10px; padding: 16px 18px; background: rgba(255,75,75,0.08); border: 1px solid rgba(255,75,75,0.2); border-radius: 12px; color: #FF6B6B; font-size: 13px; }
      .mlt-error-box button { margin-left: auto; background: rgba(255,255,255,0.08); border: none; border-radius: 8px; color: #E5E2E1; padding: 6px 12px; cursor: pointer; font-size: 12px; }
      .mlt-empty { grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(229,226,225,0.35); font-size: 13px; }

      @media (max-width: 640px) {
        .mlt-periods { margin-left: 0; width: 100%; }
        .mlt-updated { margin-left: 0; width: 100%; }
      }
    `}</style>
  )
}
