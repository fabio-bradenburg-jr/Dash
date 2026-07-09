'use client'

import { useState } from 'react'
import LeadsSheetMappingBlock from '@/components/dashboard/LeadsSheetMappingBlock'
import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function ClientesTab() {
  const [healthFilter, setHealthFilter] = useState('todos')
  const {
    clients,
    formatClientDate,
    isMaster,
    formatWeekRangeLabel,
    WEEKLY_HEALTH_BY_KEY,
    latestWeeklyHealthByClientId,
    operationAssignableUsers,
    CLIENT_DASHBOARD_INTEGRATION_OPTIONS,
    CLIENT_HEALTH_SORT_RANK,
    activeClient,
    activeClientDashboardHex,
    activeClientUsesManualCrm,
    activeIntegrations,
    adAccounts,
    agendorPipelineOptions,
    agendorPipelinesError,
    appAccentColor,
    canEditActiveClient,
    canEditClientRecord,
    clientSearch,
    setClientSearch,
    clientStatusFilter,
    setClientStatusFilter,
    closeCreateClientModal,
    createClientStep,
    setCreateClientStep,
    currentTheme,
    googleAdsAccounts,
    googleAdsConnection,
    handleAgendorPipelineToggle,
    handleAgendorQualifiedStageToggle,
    handleArchiveClient,
    handleClientDashboardHexChange,
    handleClientFieldChange,
    handleClientInlineFieldChange,
    handleClientLogoUpload,
    handleCreateClient,
    handleCreateClientGroup,
    handleIntegrationChange,
    handleLoadAgendorPipelines,
    handleNewClientLogoUpload,
    handleRemoveClient,
    handleSaveIntegrations,
    handleToggleManualCrmForActiveClient,
    handleToggleNewClientDashboardIntegration,
    hasMetaManualToken,
    hasMetaOauthConnection,
    isAgendorPipelinesLoading,
    isCreateClientGroupModalOpen,
    setIsCreateClientGroupModalOpen,
    isCreateClientModalOpen,
    isEditClientModalOpen,
    setIsEditClientModalOpen,
    isSavingIntegrations,
    newClientCnpj,
    setNewClientCnpj,
    newClientDashboardIntegrationKeys,
    newClientGoogleAdsAccountId,
    setNewClientGoogleAdsAccountId,
    newClientGroupName,
    setNewClientGroupName,
    newClientLeadsSheetUrl,
    setNewClientLeadsSheetUrl,
    newClientLogoUrl,
    setNewClientLogoUrl,
    newClientManualCrmEnabled,
    setNewClientManualCrmEnabled,
    newClientMetaAdAccountId,
    setNewClientMetaAdAccountId,
    newClientName,
    setNewClientName,
    newClientResultManagerUserId,
    setNewClientResultManagerUserId,
    normalizeCnpjInput,
    normalizedNewClientDashboardColor,
    setNewClientDashboardColor,
    openCreateClientModal,
    selectedAgendorPipelineIds,
    selectedAgendorPipelineLabels,
    selectedAgendorStageNames,
    setActiveClientId,
    setClientEditSection,
    visibleAgendorStageOptions,
  } = useDashboard()

  return (
    <>
        {(() => {
          const HEALTH_META = {
            integration: { label: 'Integração', color: '#8b5cf6' },
            critical: { label: 'Crítico', color: '#ef4444' },
            attention: { label: 'Atenção', color: '#f59e0b' },
            healthy: { label: 'Saudável', color: '#22c55e' },
            with_result: { label: 'Com resultado', color: '#3ba3ff' },
            churn: { label: 'Churn', color: '#7b8794' },
          }
          const TYPE_LABEL = { pdv: 'PDV', inside: 'Inside Sales', ecom: 'Ecom', ecommerce: 'Ecom' }
          const AVATAR_POOL = ['linear-gradient(135deg,#26C281,#4fdf9b)', 'linear-gradient(135deg,#3ba3ff,#6366f1)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#8b5cf6,#3ba3ff)', 'linear-gradient(135deg,#22c55e,#26C281)', 'linear-gradient(135deg,#ec4899,#8b5cf6)']
          const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
          const initialsOf = (name) => { const parts = String(name || '').replace(/[^A-Za-zÀ-ÿ ]/g, '').trim().split(/\s+/); return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?' }
          const hashIdx = (name) => { let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % AVATAR_POOL.length }

          const nonArchivedClients = clients.filter(c => !c.isArchived)
          const healthKeyOf = (client) => {
            if (String(client?.status || '').trim().toLowerCase() === 'churn') return 'churn'
            const rec = latestWeeklyHealthByClientId.get(client.id)
            return rec?.healthStatus && HEALTH_META[rec.healthStatus] ? rec.healthStatus : null
          }

          const counts = { todos: nonArchivedClients.length }
          Object.keys(HEALTH_META).forEach(k => { counts[k] = nonArchivedClients.filter(c => healthKeyOf(c) === k).length })

          const getClientHealthRank = (client) => {
            if (String(client?.status || '').trim().toLowerCase() === 'churn') return CLIENT_HEALTH_SORT_RANK.churn
            const latestRecord = latestWeeklyHealthByClientId.get(client.id)
            return CLIENT_HEALTH_SORT_RANK[latestRecord?.healthStatus] ?? CLIENT_HEALTH_SORT_RANK.empty
          }

          const displayClients = nonArchivedClients
            .filter((client) => {
              const query = clientSearch.trim().toLowerCase()
              const matchesSearch = !query || [client.name, client.cnpj, client.segment, client.trafficManager, client.metaAdAccountId]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
              const matchesHealth = healthFilter === 'todos' || healthKeyOf(client) === healthFilter
              return matchesSearch && matchesHealth
            })
            .sort((l, r) => {
              const rankCompare = getClientHealthRank(l) - getClientHealthRank(r)
              if (rankCompare) return rankCompare
              return String(l.name || '').localeCompare(String(r.name || ''), 'pt-BR')
            })

          const statDefs = [
            { key: 'todos', label: 'Total de clientes', color: '#26C281', value: counts.todos, sub: 'na carteira', accent: true },
            { key: 'healthy', label: 'Saudáveis', color: '#22c55e', value: counts.healthy, sub: 'sem riscos' },
            { key: 'with_result', label: 'Com resultado', color: '#3ba3ff', value: counts.with_result, sub: 'entregando ROI' },
            { key: 'attention', label: 'Em atenção', color: '#f59e0b', value: counts.attention, sub: 'monitorar' },
            { key: 'critical', label: 'Críticos', color: '#ef4444', value: counts.critical, sub: 'ação imediata' },
          ]
          const chipDefs = [['todos', 'Todos', null], ['critical', 'Crítico', '#ef4444'], ['attention', 'Atenção', '#f59e0b'], ['healthy', 'Saudável', '#22c55e'], ['with_result', 'Com resultado', '#3ba3ff'], ['integration', 'Integração', '#8b5cf6'], ['churn', 'Churn', '#7b8794']]

          const openEdit = (clientId) => { setActiveClientId(clientId); setClientEditSection('geral'); setIsEditClientModalOpen(true) }
          const GRID = '2.6fr 1.5fr 1fr 1.2fr 0.5fr 88px'
          const thStyle = { fontFamily: 'Inter', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(229,226,225,0.4)', fontWeight: 600 }

          return (
            <section className="weekly-dashboard-panel clients-panel" style={{ background: 'transparent', border: 'none' }}>
              {/* ── HERO ── */}
              <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderTop: '3px solid #26C281', borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.07),rgba(38,194,129,0.01))', padding: '26px 28px' }}>
                <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#26C281', fontWeight: 700, marginBottom: 9 }}>Sucesso do Cliente · Fonte de verdade</div>
                    <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.5vw,1.95rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Clientes</h1>
                    <p style={{ margin: '9px 0 0', color: 'rgba(229,226,225,0.62)', fontSize: '0.9rem', maxWidth: '52ch', lineHeight: 1.5 }}>Cadastro, saúde e acesso de toda a carteira. Cada cliente carrega links, responsáveis e flags que derivam sua classificação.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
                    <button type="button" onClick={openCreateClientModal} style={{ height: 42, padding: '0 18px', borderRadius: 99, border: 'none', background: '#26C281', color: '#04150d', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 24px rgba(38,194,129,0.28)' }}>
                      <span className="mi" style={{ fontSize: 19 }}>add</span>Novo cliente
                    </button>
                  </div>
                </div>
              </div>

              {/* ── STAT CARDS ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(148px,1fr))', gap: 12, marginTop: 22 }}>
                {statDefs.map((d) => (
                  <div key={d.key} style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px', borderRadius: 14, background: 'rgba(28,28,28,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `1px solid ${hexA(d.color, 0.35)}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: d.color, boxShadow: `0 0 10px ${d.color}` }} />
                      <span style={{ fontFamily: 'Inter', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.11em', color: 'rgba(229,226,225,0.4)', fontWeight: 600 }}>{d.label}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.7rem', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', color: d.accent ? '#26C281' : '#E5E2E1' }}>{d.value}</div>
                    <div style={{ fontFamily: 'Inter', fontSize: '0.64rem', color: 'rgba(229,226,225,0.4)', marginTop: 2 }}>{d.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── SEARCH + CHIPS ── */}
              <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 230, position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span className="mi" style={{ position: 'absolute', left: 14, fontSize: 19, color: 'rgba(229,226,225,0.4)', pointerEvents: 'none' }}>search</span>
                    <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar por cliente, responsável ou segmento…" style={{ width: '100%', height: 44, padding: '0 14px 0 42px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#E5E2E1', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {chipDefs.map(([k, label, color]) => {
                    const active = healthFilter === k
                    const base = { display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 10, fontFamily: 'Inter', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s' }
                    const style = active
                      ? { ...base, background: hexA(color || '#26C281', 0.15), border: `1px solid ${hexA(color || '#26C281', 0.4)}`, color: color || '#26C281' }
                      : { ...base, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(229,226,225,0.62)' }
                    return (
                      <button key={k} type="button" onClick={() => setHealthFilter(k)} style={style}>
                        {color && <span style={{ width: 7, height: 7, borderRadius: 99, background: color }} />}
                        <span>{label}</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.72, fontWeight: 700 }}>{counts[k] ?? 0}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── DIRECTORY TABLE ── */}
              {displayClients.length > 0 && (
                <>
                  <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 14, alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={thStyle}>Cliente</div>
                      <div style={thStyle}>Gestor de tráfego</div>
                      <div style={thStyle}>Tipo</div>
                      <div style={thStyle}>Saúde</div>
                      <div style={{ ...thStyle, textAlign: 'center' }}>Integr.</div>
                      <div></div>
                    </div>
                    {displayClients.map((client) => {
                      const hk = healthKeyOf(client)
                      const hm = hk ? HEALTH_META[hk] : null
                      const hasMeta = Boolean(client.metaAdAccountId)
                      const gestor = String(client.trafficManager || '').trim()
                      const typeLabel = TYPE_LABEL[String(client.salesModel || '').toLowerCase()] || null
                      const canEditRow = canEditClientRecord(client.id)
                      return (
                        <div key={client.id} onClick={() => openEdit(client.id)}
                          style={{ display: 'grid', gridTemplateColumns: GRID, gap: 14, alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background .12s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 11, background: AVATAR_POOL[hashIdx(client.name)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff', flex: 'none', overflow: 'hidden' }}>
                              {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialsOf(client.name)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</div>
                              <div style={{ fontFamily: 'Inter', fontSize: '0.68rem', color: 'rgba(229,226,225,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{client.segment || client.cnpj || 'Sem segmento'}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                            {gestor ? (
                              <>
                                <div style={{ width: 24, height: 24, borderRadius: 8, background: AVATAR_POOL[hashIdx(gestor)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.6rem', color: '#fff', flex: 'none' }}>{initialsOf(gestor)}</div>
                                <span style={{ fontSize: '0.82rem', color: 'rgba(229,226,225,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gestor}</span>
                              </>
                            ) : <span style={{ fontSize: '0.78rem', color: 'rgba(229,226,225,0.26)' }}>—</span>}
                          </div>
                          <div>
                            {typeLabel
                              ? <span style={{ fontFamily: 'Inter', fontSize: '0.64rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(229,226,225,0.62)', whiteSpace: 'nowrap' }}>{typeLabel}</span>
                              : <span style={{ fontSize: '0.78rem', color: 'rgba(229,226,225,0.26)' }}>—</span>}
                          </div>
                          <div>
                            {hm
                              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px 4px 9px', borderRadius: 99, background: hexA(hm.color, 0.13), color: hm.color, border: `1px solid ${hexA(hm.color, 0.3)}`, boxShadow: `0 0 14px ${hexA(hm.color, 0.18)}`, whiteSpace: 'nowrap' }}><span style={{ width: 6, height: 6, borderRadius: 99, background: hm.color, boxShadow: `0 0 8px ${hm.color}` }} />{hm.label}</span>
                              : <span style={{ fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(229,226,225,0.35)', whiteSpace: 'nowrap' }}>Sem registro</span>}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <span title={hasMeta ? 'Integração ativa' : 'Sem integração'} style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 99, background: hasMeta ? '#22c55e' : 'rgba(229,226,225,0.35)', boxShadow: hasMeta ? '0 0 8px rgba(34,197,94,0.6)' : 'none' }} />
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(client.id) }} title="Editar" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(229,226,225,0.62)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span className="mi" style={{ fontSize: 17 }}>edit</span>
                            </button>
                            {canEditRow && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleArchiveClient(client.id, true) }} title="Arquivar cliente" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(229,226,225,0.4)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="mi" style={{ fontSize: 17 }}>archive</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 12, fontFamily: 'Inter', fontSize: '0.7rem', color: 'rgba(229,226,225,0.4)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span>{displayClients.length} de {nonArchivedClients.length} cliente{nonArchivedClients.length === 1 ? '' : 's'}</span>
                    <span>Saúde derivada do controle semanal · atualizado agora</span>
                  </div>
                </>
              )}

              {/* ── EMPTY / NO RESULTS ── */}
              {displayClients.length === 0 && (
                nonArchivedClients.length === 0 ? (
                  <div style={{ marginTop: 20, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', padding: '52px 28px', textAlign: 'center' }}>
                    <div style={{ width: 66, height: 66, borderRadius: 99, background: 'rgba(38,194,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}><span className="mi" style={{ fontSize: 34, color: '#26C281' }}>groups</span></div>
                    <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 8 }}>Nenhum cliente ainda</div>
                    <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.9rem', margin: '0 auto 22px', maxWidth: '42ch', lineHeight: 1.55 }}>Cadastre o primeiro cliente para começar a acompanhar links, responsáveis e saúde da carteira.</p>
                    <button type="button" onClick={openCreateClientModal} style={{ height: 42, padding: '0 20px', borderRadius: 99, border: 'none', background: '#26C281', color: '#04150d', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}><span className="mi" style={{ fontSize: 19 }}>add</span>Cadastrar cliente</button>
                  </div>
                ) : (
                  <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', padding: '44px 28px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 99, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><span className="mi" style={{ fontSize: 28, color: 'rgba(229,226,225,0.4)' }}>search_off</span></div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Nenhum cliente encontrado</div>
                    <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.86rem', margin: '0 auto 18px', maxWidth: '40ch' }}>Nada corresponde à busca e ao filtro atuais.</p>
                    <button type="button" onClick={() => { setClientSearch(''); setHealthFilter('todos') }} style={{ height: 38, padding: '0 16px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#E5E2E1', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>Limpar filtros</button>
                  </div>
                )
              )}

              {/* ── ARCHIVED ── */}
              {clients.some(c => c.isArchived) && (() => {
                const archivedList = clients.filter(c => c.isArchived && (() => {
                  const query = clientSearch.trim().toLowerCase()
                  if (!query) return true
                  return [c.name, c.cnpj].filter(Boolean).some(v => String(v).toLowerCase().includes(query))
                })())
                if (!archivedList.length) return null
                return (
                  <details style={{ marginTop: 18, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', overflow: 'hidden' }}>
                    <summary style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: 'rgba(229,226,225,0.45)', userSelect: 'none', listStyle: 'none' }}>
                      <span className="mi" style={{ fontSize: 17 }}>archive</span>
                      Arquivados ({archivedList.length})
                      <span className="mi" style={{ marginLeft: 'auto', fontSize: 18 }}>expand_more</span>
                    </summary>
                    <div>
                      {archivedList.map(client => (
                        <div key={client.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', opacity: 0.6 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontWeight: 700, fontSize: '0.7rem', color: '#fff' }}>
                              {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initialsOf(client.name)}
                            </span>
                            <span>
                              <strong style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>{client.name}</strong>
                              <small style={{ fontSize: '0.72rem', opacity: 0.5 }}>{client.metaAdAccountId || client.cnpj || 'Arquivado'}</small>
                            </span>
                          </span>
                          {canEditClientRecord(client.id) && (
                            <button type="button" onClick={() => handleArchiveClient(client.id, false)} style={{ height: 34, padding: '0 14px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#E5E2E1', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="mi" style={{ fontSize: 16 }}>unarchive</span>Desarquivar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )
              })()}
            </section>
          )
        })()}

        {isEditClientModalOpen && activeClient && (
          <div className="modal-overlay" onClick={() => setIsEditClientModalOpen(false)}>
            <div className="modal-card modal-card-wide glass-panel modal-client-editor simple-client-modal" onClick={(event) => event.stopPropagation()} style={{ position: 'relative' }}>
              <button type="button" className="modal-close" onClick={() => setIsEditClientModalOpen(false)} aria-label="Fechar edição de cliente" style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                <i className="bx bx-x"></i>
              </button>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', borderBottom: '1px solid rgba(38,194,129,0.12)', padding: '20px 24px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 36 }}>
                  {activeClient.logoUrl ? (
                    <img src={activeClient.logoUrl} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 42, height: 42, borderRadius: 10, background: activeClient.dashboardColor ? activeClient.dashboardColor + '22' : 'rgba(38,194,129,0.12)', border: `1px solid ${activeClient.dashboardColor ? activeClient.dashboardColor + '44' : 'rgba(38,194,129,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="bx bx-building-house" style={{ fontSize: 20, color: activeClient.dashboardColor || '#26c281', opacity: 0.8 }}></i>
                    </span>
                  )}
                  <div>
                    <span className="management-hero-kicker" style={{ fontSize: '0.68rem', marginBottom: 2 }}><i className="bx bx-edit" style={{ marginRight: 4 }}></i>Editar cliente</span>
                    <h3 style={{ margin: '2px 0 3px', fontSize: '1.1rem', fontWeight: 900 }}>{activeClient.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.45 }}>Identifique, configure APIs e vincule a conta de anúncio.</p>
                  </div>
                </div>
              </div>

              <form className="client-editor-card" onSubmit={handleSaveIntegrations}>
                <div className="form-grid">
                  <div className="integration-block client-identity-block">
                    <div className="integration-heading">
                      <div className="integration-icon" style={{ color: currentTheme.main, borderColor: currentTheme.main + '33' }}>
                        <i className="bx bx-id-card"></i>
                      </div>
                      <div>
                        <h3>Cliente</h3>
                        <p>Dados mínimos para identificar a conta dentro do app.</p>
                      </div>
                    </div>
                    <div className="client-form-grid client-form-grid-3">
                      <div className="input-group">
                        <label>Nome do cliente</label>
                        <input type="text" value={activeClient.name} onChange={(event) => handleClientFieldChange('name', event.target.value)} placeholder="Nome do cliente" disabled={!canEditActiveClient} />
                      </div>
                      <div className="input-group">
                        <label>CNPJ</label>
                        <input type="text" value={activeClient.cnpj || ''} onChange={(event) => handleClientFieldChange('cnpj', event.target.value)} placeholder="00.000.000/0000-00" disabled={!canEditActiveClient} />
                      </div>
                      <div className="input-group">
                        <label>Gestor de Resultado</label>
                        <select className="client-select-input" value={activeClient.resultManagerUserId || ''} onChange={(event) => handleClientFieldChange('resultManagerUserId', event.target.value)} disabled={!canEditActiveClient}>
                          <option value="">Sem gestor selecionado</option>
                          {operationAssignableUsers.map((managedUser) => (
                            <option key={`client-result-manager-${managedUser.id}`} value={managedUser.id}>
                              {managedUser.full_name || managedUser.email || 'Usuário'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="client-logo-uploader">
                      <div className="client-logo-preview">
                        {activeClient.logoUrl ? <img src={activeClient.logoUrl} alt={`Logo ${activeClient.name}`} /> : <i className="bx bx-image-add"></i>}
                      </div>
                      <div className="client-logo-copy">
                        <label>Logo do cliente</label>
                        <p>Essa imagem aparece no topo do dashboard e ajuda a deixar a apresentação com a marca do cliente.</p>
                        <div className="client-logo-actions">
                          <label className="btn btn-secondary client-logo-upload-button">
                            <input type="file" accept="image/*" onChange={handleClientLogoUpload} disabled={!canEditActiveClient} />
                            {activeClient.logoUrl ? 'Trocar logo' : 'Subir logo'}
                          </label>
                          {activeClient.logoUrl && (
                            <button type="button" className="btn btn-secondary" onClick={() => handleClientFieldChange('logoUrl', '')} disabled={!canEditActiveClient}>
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="client-dashboard-color-picker">
                      <div>
                        <label>Cor do dashboard</label>
                        <p>Personalize a cor principal usada no dashboard deste cliente.</p>
                      </div>
                      <div className="client-dashboard-color-control">
                        <input
                          type="color"
                          value={activeClientDashboardHex}
                          onChange={(event) => handleClientDashboardHexChange('dashboardColor', event.target.value)}
                          disabled={!canEditActiveClient}
                          aria-label="Cor do dashboard do cliente"
                        />
                        <span>{activeClientDashboardHex.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="integration-block">
                    <div className="integration-heading">
                      <div className="integration-icon" style={{ color: '#0668E1', borderColor: '#0668E133' }}>
                        <i className="bx bxl-meta"></i>
                      </div>
                      <div>
                        <h3>Meta Ads</h3>
                        <p>Selecione uma das contas de anúncio disponíveis na credencial global.</p>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Conta de anúncio</label>
                      <select className="client-select-input" value={activeClient.metaAdAccountId || ''} onChange={(event) => handleClientFieldChange('metaAdAccountId', event.target.value)} disabled={!canEditActiveClient}>
                        <option value="">{hasMetaManualToken || hasMetaOauthConnection ? 'Selecione uma conta' : 'Conecte a Meta em Configurações'}</option>
                        <option value="__ghost__">👻 Conta fantasma (sem integração)</option>
                        {adAccounts.map((account) => (
                          <option key={account.id} value={account.id}>{account.name ? account.name + ' (' + account.id + ')' : account.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="integration-block">
                    <div className="integration-heading">
                      <div className="integration-icon" style={{ color: '#10b981', borderColor: '#10b98133' }}>
                        <i className="bx bxl-google"></i>
                      </div>
                      <div>
                        <h3>Google Ads</h3>
                        <p>Selecione uma das contas Google Ads disponíveis na conexão global.</p>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Conta Google Ads</label>
                      <select className="client-select-input" value={activeClient.googleAdsAccountId || ''} onChange={(event) => handleClientFieldChange('googleAdsAccountId', event.target.value)} disabled={!canEditActiveClient}>
                        <option value="">{googleAdsConnection.connected ? 'Selecione uma conta' : 'Conecte o Google Ads em Configurações'}</option>
                        {googleAdsAccounts.map((account) => (
                          <option key={account.id} value={account.id}>{account.name ? account.name + ' (' + account.id + ')' : account.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="integration-block leads-sheet-integration-block">
                    <div className="integration-heading">
                      <div className="integration-icon" style={{ color: '#22c55e', borderColor: '#22c55e33' }}>
                        <i className="bx bx-table"></i>
                      </div>
                      <div>
                        <h3>Planilha de Leads</h3>
                        <p>Cole o link de compartilhamento do Google Sheets para exibir dentro do app.</p>
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Link da planilha</label>
                      <input type="url" className="client-text-input" placeholder="https://docs.google.com/spreadsheets/d/..." value={activeClient.leadsSheetUrl || ''} onChange={(event) => handleClientFieldChange('leadsSheetUrl', event.target.value)} disabled={!canEditActiveClient} />
                    </div>
                    <LeadsSheetMappingBlock client={activeClient} onFieldChange={handleClientFieldChange} disabled={!canEditActiveClient} />
                  </div>

                  <div className="integration-block manual-crm-toggle-block">
                    <label className={'manual-crm-toggle ' + (activeClientUsesManualCrm ? 'active' : '')}>
                      <input type="checkbox" checked={activeClientUsesManualCrm} onChange={(event) => handleToggleManualCrmForActiveClient(event.target.checked)} disabled={!canEditActiveClient} />
                      <span className="manual-crm-switch" aria-hidden="true"></span>
                      <span>
                        <strong>Preencher CRM manualmente</strong>
                        <small>Ative para digitar oportunidades, qualificados, vendas e valor vendido diretamente nos cards do dashboard.</small>
                      </span>
                    </label>
                  </div>

                  {!activeClientUsesManualCrm && <div className="integration-block agendor-integration-block">
                    <div className="integration-heading">
                      <div className="integration-icon" style={{ color: '#f97316', borderColor: '#f9731633' }}>
                        <i className="bx bx-git-branch"></i>
                      </div>
                      <div>
                        <h3>Agendor</h3>
                        <p>Token/API e identificação do funil ou pipeline do cliente.</p>
                      </div>
                    </div>
                    <div className="client-form-grid client-form-grid-2 agendor-token-grid">
                      <div className="input-group">
                        <label>Token/API Agendor</label>
                        <input type="password" value={activeIntegrations.agendorToken || ''} onChange={(event) => handleIntegrationChange('agendorToken', event.target.value, 'integrations')} placeholder="Cole o token do Agendor" disabled={!canEditActiveClient} />
                      </div>
                      <div className="input-group agendor-load-action">
                        <label>&nbsp;</label>
                        <button type="button" className="btn btn-secondary" onClick={handleLoadAgendorPipelines} disabled={!canEditActiveClient || isAgendorPipelinesLoading || !String(activeIntegrations.agendorToken || '').trim()}>
                          {isAgendorPipelinesLoading ? 'Lendo...' : 'Ler pipelines'}
                        </button>
                      </div>
                    </div>

                    {agendorPipelinesError && <div className="form-alert agendor-inline-alert">{agendorPipelinesError}</div>}

                    <div className="agendor-selection-block">
                      <div className="agendor-selection-head">
                        <label>Pipelines para puxar para o dash</label>
                        <span>Escolha um ou mais funis do Agendor. O dashboard usará apenas os pipelines selecionados.</span>
                      </div>
                      <div className="stage-selector agendor-chip-list">
                        {agendorPipelineOptions.length ? (
                          agendorPipelineOptions.map((pipeline) => (
                            <label key={pipeline.id} className={'stage-chip ' + (selectedAgendorPipelineIds.includes(pipeline.id) ? 'active' : '')}>
                              <input type="checkbox" checked={selectedAgendorPipelineIds.includes(pipeline.id)} onChange={() => handleAgendorPipelineToggle(pipeline.id)} disabled={!canEditActiveClient} />
                              <span>{pipeline.label || pipeline.name || pipeline.id}</span>
                            </label>
                          ))
                        ) : selectedAgendorPipelineLabels.length ? (
                          selectedAgendorPipelineLabels.map((pipeline) => <span key={pipeline} className="stage-chip active"><span>{pipeline}</span></span>)
                        ) : (
                          <div className="stage-empty">Cole o token e clique em “Ler pipelines” para selecionar os funis disponíveis.</div>
                        )}
                      </div>
                    </div>

                    <div className="agendor-selection-block">
                      <div className="agendor-selection-head">
                        <label>Etapas consideradas qualificadas</label>
                        <span>Marque quais etapas dos pipelines selecionados contam como qualificado nas taxas comerciais.</span>
                      </div>
                      <div className="stage-selector agendor-chip-list">
                        {visibleAgendorStageOptions.length ? (
                          visibleAgendorStageOptions.map((stage) => {
                            const stageName = String(stage.name || stage.label || '').trim()
                            const checked = selectedAgendorStageNames.includes(stageName)
                            return (
                              <label key={stage.id || stage.label} className={'stage-chip ' + (checked ? 'active' : '')}>
                                <input type="checkbox" checked={checked} onChange={() => handleAgendorQualifiedStageToggle(stage)} disabled={!canEditActiveClient} />
                                <span>{stage.label || stage.name}</span>
                              </label>
                            )
                          })
                        ) : selectedAgendorStageNames.length ? (
                          selectedAgendorStageNames.map((stage) => <span key={stage} className="stage-chip active"><span>{stage}</span></span>)
                        ) : (
                          <div className="stage-empty">Depois de selecionar os pipelines, marque as etapas que devem contar como qualificadas.</div>
                        )}
                      </div>
                    </div>
                  </div>}

                </div>

                <div className="client-create-actions">
                  {canEditActiveClient && <button type="button" className="btn btn-secondary" onClick={() => handleRemoveClient(activeClient.id)}>Remover cliente</button>}
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditClientModalOpen(false)}>Fechar</button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingIntegrations || !canEditActiveClient}>{isSavingIntegrations ? 'Salvando...' : 'Salvar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreateClientModalOpen && (
          <div className="modal-overlay" onClick={closeCreateClientModal}>
            <div className="modal-card glass-panel modal-create-client simple-client-modal" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', borderBottom: '1px solid rgba(38,194,129,0.12)', padding: '20px 24px 16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <span className="management-hero-kicker" style={{ fontSize: '0.68rem', marginBottom: 4 }}><i className="bx bx-user-plus" style={{ marginRight: 4 }}></i>Novo cliente</span>
                    <h3 style={{ margin: '4px 0 4px', fontSize: '1.15rem', fontWeight: 900 }}>Cadastrar cliente</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.48 }}>
                      {createClientStep === 'identity' ? 'Preencha a identificação do cliente. As integrações vêm no próximo passo.' : 'Selecione as contas e fontes de dados para o dashboard deste cliente.'}
                    </p>
                  </div>
                  <button type="button" className="modal-close" onClick={closeCreateClientModal} aria-label="Fechar cadastro de cliente" style={{ flexShrink: 0, zIndex: 1 }}>
                    <i className="bx bx-x"></i>
                  </button>
                </div>
              </div>

              <div className="client-create-steps" style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }} aria-label="Etapas do cadastro">
                {[
                  { id: 'identity', label: '1. Identificação' },
                  { id: 'integrations', label: '2. Integrações' },
                ].map((step) => (
                  <span
                    key={step.id}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: createClientStep === step.id ? 'rgba(38,194,129,0.15)' : 'transparent', color: createClientStep === step.id ? '#26c281' : 'rgba(255,255,255,0.3)', border: `1px solid ${createClientStep === step.id ? 'rgba(38,194,129,0.35)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.15s' }}
                  >
                    {step.label}
                  </span>
                ))}
              </div>

              <form className="client-create-stack" onSubmit={handleCreateClient}>
                {createClientStep === 'identity' ? (
                  <>
                    <div className="client-create-inline client-create-identity-only">
                      <input type="text" value={newClientName} onChange={(event) => setNewClientName(event.target.value)} placeholder="Nome do cliente" disabled={!isMaster} />
                      <input type="text" value={newClientCnpj} onChange={(event) => setNewClientCnpj(normalizeCnpjInput(event.target.value))} placeholder="CNPJ opcional" disabled={!isMaster} />
                    </div>

                    <div className="input-group client-create-result-manager">
                      <label>Gestor de Resultado</label>
                      <select className="client-select-input" value={newClientResultManagerUserId} onChange={(event) => setNewClientResultManagerUserId(event.target.value)} disabled={!isMaster}>
                        <option value="">Selecionar depois</option>
                        {operationAssignableUsers.map((managedUser) => (
                          <option key={`new-client-result-manager-${managedUser.id}`} value={managedUser.id}>
                            {managedUser.full_name || managedUser.email || 'Usuário'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="client-logo-uploader client-logo-uploader-create">
                      <div className="client-logo-preview">
                        {newClientLogoUrl ? <img src={newClientLogoUrl} alt="Preview da logo do cliente" /> : <i className="bx bx-image-add"></i>}
                      </div>
                      <div className="client-logo-copy">
                        <label>Logo do cliente</label>
                        <p>Opcional: suba a marca agora para ela aparecer no dashboard do cliente.</p>
                        <div className="client-logo-actions">
                          <label className="btn btn-secondary client-logo-upload-button">
                            <input type="file" accept="image/*" onChange={handleNewClientLogoUpload} disabled={!isMaster} />
                            {newClientLogoUrl ? 'Trocar logo' : 'Subir logo'}
                          </label>
                          {newClientLogoUrl && (
                            <button type="button" className="btn btn-secondary" onClick={() => setNewClientLogoUrl('')} disabled={!isMaster}>
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="client-dashboard-color-picker client-dashboard-color-picker-create">
                      <div>
                        <label>Cor do dashboard</label>
                        <p>Essa cor será usada nos botões, destaques e visual do dashboard deste cliente.</p>
                      </div>
                      <div className="client-dashboard-color-control">
                        <input
                          type="color"
                          value={normalizedNewClientDashboardColor}
                          onChange={(event) => setNewClientDashboardColor(event.target.value.toUpperCase())}
                          disabled={!isMaster}
                          aria-label="Cor do dashboard do cliente"
                        />
                        <span>{normalizedNewClientDashboardColor}</span>
                      </div>
                    </div>

                    <div className="client-create-actions">
                      <button type="button" className="btn btn-secondary" onClick={closeCreateClientModal}>
                        Cancelar
                      </button>
                      <button type="button" className="btn btn-primary" disabled={!isMaster || !newClientName.trim()} onClick={() => setCreateClientStep('integrations')}>
                        Avançar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="client-create-integration-panel">
                      <div className="integration-block client-create-integration-card">
                        <div className="integration-heading">
                          <div className="integration-icon" style={{ color: '#0668E1', borderColor: '#0668E133' }}>
                            <i className="bx bxl-meta"></i>
                          </div>
                          <div>
                            <h3>Meta Ads</h3>
                            <p>Selecione a conta de anúncio disponível na credencial global.</p>
                          </div>
                        </div>
                        <div className="input-group">
                          <label>Conta de anúncio da Meta</label>
                          <select className="client-select-input" value={newClientMetaAdAccountId} onChange={(event) => setNewClientMetaAdAccountId(event.target.value)} disabled={!isMaster}>
                            <option value="">
                              {hasMetaManualToken || hasMetaOauthConnection ? 'Selecionar depois ou escolher agora' : 'Conecte a Meta em Configurações'}
                            </option>
                            {adAccounts.map((account) => (
                              <option key={account.id} value={account.id}>{account.name ? account.name + ' (' + account.id + ')' : account.id}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="integration-block client-create-integration-card">
                        <div className="integration-heading">
                          <div className="integration-icon" style={{ color: '#10b981', borderColor: '#10b98133' }}>
                            <i className="bx bxl-google"></i>
                          </div>
                          <div>
                            <h3>Google Ads</h3>
                            <p>Selecione a conta Google Ads disponível na conexão global.</p>
                          </div>
                        </div>
                        <div className="input-group">
                          <label>Conta Google Ads</label>
                          <select className="client-select-input" value={newClientGoogleAdsAccountId} onChange={(event) => setNewClientGoogleAdsAccountId(event.target.value)} disabled={!isMaster}>
                            <option value="">
                              {googleAdsConnection.connected ? 'Selecionar depois ou escolher agora' : 'Conecte o Google Ads em Configurações'}
                            </option>
                            {googleAdsAccounts.map((account) => (
                              <option key={account.id} value={account.id}>{account.name ? account.name + ' (' + account.id + ')' : account.id}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="integration-block client-create-integration-card">
                        <div className="integration-heading">
                          <div className="integration-icon" style={{ color: '#22c55e', borderColor: '#22c55e33' }}>
                            <i className="bx bx-table"></i>
                          </div>
                          <div>
                            <h3>Planilha de Leads</h3>
                            <p>Cole o link de compartilhamento do Google Sheets.</p>
                          </div>
                        </div>
                        <div className="input-group">
                          <label>Link da planilha</label>
                          <input type="url" className="client-text-input" placeholder="https://docs.google.com/spreadsheets/d/..." value={newClientLeadsSheetUrl || ''} onChange={(event) => setNewClientLeadsSheetUrl(event.target.value)} disabled={!isMaster} />
                        </div>
                      </div>

                      <div className="integration-block client-create-integration-card manual-crm-create-card">
                        <label className={'manual-crm-toggle ' + (newClientManualCrmEnabled ? 'active' : '')}>
                          <input type="checkbox" checked={newClientManualCrmEnabled} onChange={(event) => setNewClientManualCrmEnabled(event.target.checked)} disabled={!isMaster} />
                          <span className="manual-crm-switch" aria-hidden="true"></span>
                          <span>
                            <strong>CRM manual</strong>
                            <small>Ligue para preencher oportunidades, qualificados, vendas e valor vendido nos cards do dashboard.</small>
                          </span>
                        </label>
                      </div>

                      <div className="integration-block client-create-integration-card">
                        <div className="integration-heading">
                          <div className="integration-icon" style={{ color: appAccentColor, borderColor: appAccentColor + '33' }}>
                            <i className="bx bx-plug"></i>
                          </div>
                          <div>
                            <h3>Integrações do dashboard</h3>
                            <p>Escolha quais fontes aparecerão disponíveis para este cliente.</p>
                          </div>
                        </div>
                        <div className="client-create-integration-grid">
                          {CLIENT_DASHBOARD_INTEGRATION_OPTIONS.map((integration) => (
                            <label key={integration.key} className={'client-create-integration-option ' + (newClientDashboardIntegrationKeys.includes(integration.key) ? 'active' : '')}>
                              <input type="checkbox" checked={newClientDashboardIntegrationKeys.includes(integration.key)} onChange={() => handleToggleNewClientDashboardIntegration(integration.key)} disabled={!isMaster} />
                              <span>
                                <strong>{integration.label}</strong>
                                <small>{integration.description}</small>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="client-create-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => setCreateClientStep('identity')}>
                        Voltar
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={closeCreateClientModal}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={!isMaster || !newClientName.trim()}>
                        Criar cliente
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {isCreateClientGroupModalOpen && (
          <div className="modal-overlay" onClick={() => setIsCreateClientGroupModalOpen(false)}>
            <div className="modal-card glass-panel modal-create-client-group" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3>Novo grupo de clientes</h3>
                  <p>Monte grupos para liberar acesso em lote e organizar dashboards relacionados.</p>
                </div>
                <button type="button" className="modal-close" onClick={() => setIsCreateClientGroupModalOpen(false)} aria-label="Fechar cadastro de grupo">
                  <i className="bx bx-x"></i>
                </button>
              </div>

              <form className="client-create-stack" onSubmit={handleCreateClientGroup}>
                <div className="input-group">
                  <label>Nome do grupo</label>
                  <input
                    type="text"
                    value={newClientGroupName}
                    onChange={(event) => setNewClientGroupName(event.target.value)}
                    placeholder="Ex.: Franquias, Comercial, Clínicas..."
                    disabled={!isMaster}
                    autoFocus
                  />
                </div>
                <div className="client-create-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCreateClientGroupModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!isMaster || !newClientGroupName.trim()}>
                    Adicionar grupo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  )
}
