'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './clientes-v2.module.css'

/* ---------------- helpers ---------------- */

const HEALTH = {
  result: { label: 'Com resultado', color: 'var(--h-result)', bg: 'rgba(59,163,255,0.13)' },
  healthy: { label: 'Saudável', color: 'var(--h-healthy)', bg: 'rgba(34,197,94,0.13)' },
  attention: { label: 'Atenção', color: 'var(--h-attention)', bg: 'rgba(245,158,11,0.13)' },
  critical: { label: 'Crítico', color: 'var(--h-critical)', bg: 'rgba(239,68,68,0.13)' },
  integration: { label: 'Integração', color: 'var(--h-integration)', bg: 'rgba(139,92,246,0.13)' },
  churn: { label: 'Churn', color: 'var(--h-churn)', bg: 'rgba(123,135,148,0.13)' },
}

const HEALTH_FLAGS = [
  ['roiAboveOne', 'ROI acima da meta'],
  ['csatAboveFour', 'CSAT ≥ 4'],
  ['npsAboveSeven', 'NPS ≥ 7'],
  ['stakeholderAware', 'Stakeholder consciente'],
  ['adAccountsHealthy', 'Contas de anúncio ativas'],
  ['crmUsageProperly', 'CRM em uso'],
  ['clientParticipationAbove90', 'Participação > 90%'],
]

const SALES_MODEL_LABEL = {
  INSIDE_SALES: 'Inside Sales',
  ECOM: 'Ecom',
  PDV: 'PDV',
}

function initials(name = '') {
  const words = String(name).split(' ').filter((w) => w.length > 2)
  const base = words.length ? words.slice(0, 2) : String(name).split(' ')
  return base.map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function isYes(value) {
  const v = String(value ?? '').trim().toLowerCase()
  return v === 'sim' || v === 'ok' || v === 'true' || v === 'yes'
}

function deriveHealth(c) {
  const status = String(c.status ?? '').toLowerCase()
  if (c.isArchived || status.includes('churn')) return 'churn'
  if (status.includes('onboard') || status.includes('integ')) return 'integration'
  if (status.includes('risco')) return 'critical'
  const yes = HEALTH_FLAGS.reduce((n, [key]) => n + (isYes(c[key]) ? 1 : 0), 0)
  if (yes >= 6 && isYes(c.roiAboveOne)) return 'result'
  if (yes >= 5) return 'healthy'
  if (yes >= 3) return 'attention'
  return 'critical'
}

function typeLabel(c) {
  return SALES_MODEL_LABEL[c.salesModel] || c.salesModel || c.tier || '—'
}

function hasIntegration(c) {
  return Boolean(c.metaAdAccountId || c.googleAdsAccountId || c.linkedInAdsAccountId)
}

/* ---------------- component ---------------- */

const FILTERS = [
  ['all', 'Todos'],
  ['critical', 'Crítico'],
  ['attention', 'Atenção'],
  ['healthy', 'Saudável'],
  ['result', 'Com resultado'],
  ['integration', 'Integração'],
  ['churn', 'Churn'],
]

export default function ClientesV2View() {
  const [state, setState] = useState({ status: 'loading', clients: [], access: null, error: '' })
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState(null) // client or 'new' or null

  useEffect(() => {
    let alive = true
    fetch('/api/dashboard/state', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Erro ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!alive) return
        const clients = Array.isArray(data.clients) ? data.clients.filter((c) => !c.isArchived) : []
        setState({ status: 'ready', clients, access: data.access || null, error: '' })
      })
      .catch((err) => alive && setState({ status: 'error', clients: [], access: null, error: err.message }))
    return () => {
      alive = false
    }
  }, [])

  const enriched = useMemo(
    () => state.clients.map((c) => ({ ...c, _health: deriveHealth(c) })),
    [state.clients],
  )

  const counts = useMemo(() => {
    const base = { all: enriched.length, critical: 0, attention: 0, healthy: 0, result: 0, integration: 0, churn: 0 }
    enriched.forEach((c) => {
      base[c._health] = (base[c._health] || 0) + 1
    })
    return base
  }, [enriched])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enriched.filter((c) => {
      const okF = filter === 'all' || c._health === filter
      const hay = `${c.name} ${c.trafficManager || ''} ${c.projectManager || ''} ${c.segment || ''}`.toLowerCase()
      return okF && (!q || hay.includes(q))
    })
  }, [enriched, query, filter])

  useEffect(() => {
    if (!selected) return
    const onKey = (e) => e.key === 'Escape' && setSelected(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selected])

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* HERO */}
        <div className={styles.hero}>
          <div>
            <span className={styles.kicker}>
              <i className="bx bxs-group" />
              Sucesso do Cliente
            </span>
            <h1>Clientes</h1>
            <p>
              Cadastre clientes, organize grupos e defina quem enxerga cada dashboard.{' '}
              {state.status === 'ready' ? `${counts.all} contas na base ativa.` : 'Carregando base…'}
            </p>
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setSelected('new')}>
            <i className="bx bx-plus" />
            Novo cliente
          </button>
        </div>

        {/* STATS */}
        <div className={styles.stats}>
          <StatCard label="Total de clientes" value={counts.all} dot="var(--emerald)" />
          <StatCard label="Com resultado" value={counts.result} dot="var(--h-result)" color="var(--h-result)" />
          <StatCard label="Em atenção" value={counts.attention} dot="var(--h-attention)" color="var(--h-attention)" />
          <StatCard label="Crítico" value={counts.critical} dot="var(--h-critical)" color="var(--h-critical)" />
          <StatCard label="Em integração" value={counts.integration} dot="var(--h-integration)" color="var(--h-integration)" />
        </div>

        {/* TOOLBAR */}
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <i className="bx bx-search" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente, responsável ou segmento…"
              autoComplete="off"
            />
          </div>
          <div className={styles.chips}>
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`${styles.chip} ${filter === key ? styles.chipActive : ''}`}
                onClick={() => setFilter(key)}
              >
                {label} <span className={styles.c}>{counts[key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DIRECTORY */}
        <div className={styles.directory}>
          <div className={styles.tableScroll}>
            <div className={styles.thead}>
              <span>Cliente</span>
              <span className={styles.colOwner}>Gestor de tráfego</span>
              <span>Tipo</span>
              <span>Saúde</span>
              <span className={styles.colInteg}>Integração</span>
              <span />
            </div>

            {state.status === 'loading' && (
              <div style={{ padding: '8px 12px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={styles.skeleton} />
                ))}
              </div>
            )}

            {state.status === 'error' && (
              <div className={styles.state}>
                <i className="bx bx-error-circle" style={{ color: 'var(--h-critical)' }} />
                <p>Não foi possível carregar os clientes. {state.error}</p>
              </div>
            )}

            {state.status === 'ready' && visible.length === 0 && (
              <div className={styles.state}>
                <i className="bx bx-search-alt" />
                <p>Nenhum cliente corresponde à busca.</p>
              </div>
            )}

            {state.status === 'ready' &&
              visible.map((c) => {
                const h = HEALTH[c._health]
                const on = hasIntegration(c)
                return (
                  <div key={c.id} className={styles.trow} onClick={() => setSelected(c)}>
                    <div className={styles.client}>
                      <div className={styles.avatar}>{initials(c.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.clientName}>{c.name}</div>
                        <div className={styles.clientMeta}>{c.segment || c.subsegment || 'Sem segmento'}</div>
                      </div>
                    </div>
                    <div className={`${styles.owner} ${styles.colOwner}`}>
                      {c.trafficManager ? (
                        <>
                          <div className={`${styles.avatar} ${styles.oa}`}>{initials(c.trafficManager)}</div>
                          <span className={styles.ownerName}>{c.trafficManager}</span>
                        </>
                      ) : (
                        <span className={styles.ownerName} style={{ opacity: 0.5 }}>
                          Sem gestor
                        </span>
                      )}
                    </div>
                    <div>
                      <span className={styles.typeTag}>{typeLabel(c)}</span>
                    </div>
                    <div>
                      <span className={styles.health} style={{ color: h.color, background: h.bg }}>
                        <span className={styles.hd} />
                        {h.label}
                      </span>
                    </div>
                    <div className={`${styles.integ} ${on ? styles.integOn : styles.integOff} ${styles.colInteg}`}>
                      <span className={styles.id} />
                      {on ? 'Conectado' : 'Desconectado'}
                    </div>
                    <div className={styles.rowAction}>
                      <button
                        type="button"
                        aria-label="Editar"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelected(c)
                        }}
                      >
                        <i className="bx bx-edit-alt" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {selected && <ClientModal client={selected === 'new' ? null : selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function StatCard({ label, value, dot, color }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>
        <span className={styles.dt} style={{ background: dot }} />
        {label}
      </div>
      <div className={styles.statValue} style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  )
}

/* ---------------- modal ---------------- */

const LINK_FIELDS = [
  ['contractUrl', 'Contrato'],
  ['dashboardUrl', 'Dashboard'],
  ['driveUrl', 'Drive'],
  ['brandManualUrl', 'Manual de marca'],
]

const OWNER_FIELDS = [
  ['projectManager', 'Gestor de projetos'],
  ['trafficManager', 'Gestor de tráfego'],
  ['designer', 'Designer'],
  ['csOwner', 'CS / Atendimento'],
]

function ClientModal({ client, onClose }) {
  const isNew = !client
  const title = isNew ? 'Cadastrar cliente' : client.name
  const sub = isNew
    ? 'Preencha os dados da nova conta.'
    : `${typeLabel(client)} · ${client.segment || 'Sem segmento'}`

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title}>
        <div className={styles.modalHead}>
          <div className={styles.avatar}>{isNew ? '+' : initials(client.name)}</div>
          <div>
            <span className={styles.kicker}>
              <i className="bx bx-edit" />
              {isNew ? 'Novo cliente' : 'Editar cliente'}
            </span>
            <h3>{title}</h3>
            <div className={styles.modalSub}>{sub}</div>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Fechar">
            <i className="bx bx-x" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <Block icon="bx-buildings" title="Dados do cliente" desc="Identificação e segmentação.">
            <div className={styles.grid2}>
              <Field full label="Nome" value={client?.name} />
              <Field label="Segmento" value={client?.segment} />
              <Field label="Tipo" value={typeLabel(client || {})} isSelect options={['PDV', 'Inside Sales', 'Ecom']} />
            </div>
          </Block>

          <Block icon="bx-link" title="Links do cliente" desc="Contrato, dashboard, drive, manual de marca.">
            <div className={styles.grid2}>
              {LINK_FIELDS.map(([key, label]) => (
                <Field key={key} label={label} value={client?.[key]} placeholder="https://…" />
              ))}
            </div>
          </Block>

          <Block icon="bx-user-plus" title="Responsáveis" desc="Time alocado nesta conta.">
            <div className={styles.grid2}>
              {OWNER_FIELDS.map(([key, label]) => (
                <Field key={key} label={label} value={client?.[key]} placeholder="Nome do responsável" />
              ))}
            </div>
          </Block>

          <Block icon="bx-shield-quarter" title="Flags de saúde" desc="Sinais do health score semanal.">
            <div className={styles.flags}>
              {HEALTH_FLAGS.map(([key, label]) => {
                const ok = isYes(client?.[key])
                return (
                  <div key={key} className={styles.flag}>
                    <span>{label}</span>
                    <div className={styles.seg}>
                      <b className={ok ? styles.segOk : ''}>Ok</b>
                      <b className={!ok ? styles.segOk : ''} style={!ok ? { background: 'rgba(239,68,68,0.14)', color: 'var(--h-critical)' } : undefined}>
                        Risco
                      </b>
                    </div>
                  </div>
                )
              })}
            </div>
          </Block>
        </div>

        <div className={styles.modalFoot}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
            Cancelar
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
            <i className="bx bx-check" />
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}

function Block({ icon, title, desc, children }) {
  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <div className={styles.blockIcon}>
          <i className={`bx ${icon}`} />
        </div>
        <div>
          <h4>{title}</h4>
          <p>{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, placeholder, full, isSelect, options = [] }) {
  return (
    <div className={`${styles.field} ${full ? styles.full : ''}`}>
      <label>{label}</label>
      {isSelect ? (
        <select defaultValue={value || options[0]}>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input type="text" defaultValue={value || ''} placeholder={placeholder} />
      )}
    </div>
  )
}
