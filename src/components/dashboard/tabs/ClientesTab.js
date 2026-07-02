'use client'

import LeadsSheetMappingBlock from '@/components/dashboard/LeadsSheetMappingBlock'
import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function ClientesTab() {
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
          const nonArchivedClients = clients.filter(c => !c.isArchived)
          const ativosCount = nonArchivedClients.filter(c => { const st = String(c.status || '').trim().toLowerCase(); return st === 'ativo' || st === '' }).length
          const pausadosCount = nonArchivedClients.filter(c => String(c.status || '').trim().toLowerCase() === 'pausado').length
          const churnCount = nonArchivedClients.filter(c => String(c.status || '').trim().toLowerCase() === 'churn').length
          const archivedCount = clients.filter(c => c.isArchived).length

          const getClientHealthRank = (client) => {
            if (String(client?.status || '').trim().toLowerCase() === 'churn') return CLIENT_HEALTH_SORT_RANK.churn
            const latestRecord = latestWeeklyHealthByClientId.get(client.id)
            return CLIENT_HEALTH_SORT_RANK[latestRecord?.healthStatus] ?? CLIENT_HEALTH_SORT_RANK.empty
          }

          const displayClients = nonArchivedClients
            .filter((client) => {
              const query = clientSearch.trim().toLowerCase()
              const matchesSearch = !query || [client.name, client.cnpj, client.metaAdAccountId, client.agendorAccountId]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
              const st = String(client.status || '').trim().toLowerCase()
              const matchesStatus = clientStatusFilter === 'all'
                ? true
                : clientStatusFilter === 'ativo' ? (st === 'ativo' || st === '')
                : clientStatusFilter === 'pausado' ? st === 'pausado'
                : clientStatusFilter === 'churn' ? st === 'churn'
                : true
              return matchesSearch && matchesStatus
            })
            .sort((l, r) => {
              const rankCompare = getClientHealthRank(l) - getClientHealthRank(r)
              if (rankCompare) return rankCompare
              return String(l.name || '').localeCompare(String(r.name || ''), 'pt-BR')
            })

          return (
            <section className="weekly-dashboard-panel clients-panel">
              {/* ── Hero header ── */}
              <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <span className="management-hero-kicker"><i className="bx bx-buildings" style={{ marginRight: 5 }}></i>Clientes</span>
                    <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Gestão de clientes</h2>
                    <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Gerencie os clientes cadastrados, acompanhe status e acesse rapidamente as integrações.</p>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7 }} onClick={openCreateClientModal}>
                    <i className="bx bx-user-plus"></i>
                    Novo cliente
                  </button>
                </div>

                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, margin: '20px 0 4px' }}>
                  {[
                    { icon: 'bx-group', label: 'Total de clientes', value: nonArchivedClients.length, color: '#94a3b8' },
                    { icon: 'bx-check-circle', label: 'Ativos', value: ativosCount, color: '#22c55e' },
                    { icon: 'bx-pause-circle', label: 'Pausados', value: pausadosCount, color: '#f59e0b' },
                    { icon: 'bx-x-circle', label: 'Churn', value: churnCount, color: '#ef4444' },
                    { icon: 'bx-archive', label: 'Arquivados', value: archivedCount, color: '#64748b' },
                  ].map((m) => (
                    <div key={m.label} className="management-stat-card" style={{ gap: 6 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`bx ${m.icon}`} style={{ color: m.color, fontSize: 13 }}></i>
                        {m.label}
                      </span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Filter bar */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
                  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                    <i className="bx bx-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4, pointerEvents: 'none' }}></i>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Buscar por nome, CNPJ ou conta..."
                      style={{ width: '100%', padding: '8px 12px 8px 42px', borderRadius: 10, border: '1px solid rgba(129,216,167,0.18)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {[
                      { id: 'all', label: 'Todos', count: nonArchivedClients.length },
                      { id: 'ativo', label: 'Ativos', count: ativosCount },
                      { id: 'pausado', label: 'Pausados', count: pausadosCount },
                      { id: 'churn', label: 'Churn', count: churnCount },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setClientStatusFilter(f.id)}
                        style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${clientStatusFilter === f.id ? 'rgba(38,194,129,0.4)' : 'rgba(255,255,255,0.08)'}`, background: clientStatusFilter === f.id ? 'rgba(38,194,129,0.15)' : 'transparent', color: clientStatusFilter === f.id ? '#26c281' : 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                      >
                        {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Client list ── */}
              <div style={{ padding: '0 0 8px' }}>
                {/* Table header */}
                {displayClients.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 120px 130px', gap: 12, padding: '12px 24px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Cliente', 'Status', 'Saúde', 'Integrações', 'Ações'].map(h => (
                      <span key={h} style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.35 }}>{h}</span>
                    ))}
                  </div>
                )}

                {displayClients.map((client) => {
                  const metaAccount = adAccounts.find((account) => account.id === client.metaAdAccountId)
                  const hasMeta = Boolean(client.metaAdAccountId)
                  const hasAgendor = Boolean(client.agendorAccountId || client.integrations?.agendorToken)
                  const hasLeadsSheet = Boolean(client.leadsSheetUrl && String(client.leadsSheetUrl).trim())
                  const isChurnClient = String(client.status || '').trim().toLowerCase() === 'churn'
                  const latestHealthRecord = latestWeeklyHealthByClientId.get(client.id)
                  const latestHealth = isChurnClient
                    ? { key: 'churn', label: 'Churn', color: '#64748b' }
                    : latestHealthRecord
                      ? (WEEKLY_HEALTH_BY_KEY[latestHealthRecord.healthStatus] || WEEKLY_HEALTH_BY_KEY.attention)
                      : null
                  const healthDetail = isChurnClient
                    ? (client.churnDate ? `Churn em ${formatClientDate(client.churnDate)}` : 'Cliente churn')
                    : latestHealth
                      ? formatWeekRangeLabel(latestHealthRecord.weekStart, latestHealthRecord.weekEnd)
                      : 'Aguardando semanal'

                  return (
                    <div
                      key={client.id}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 120px 130px', gap: 12, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Name cell */}
                      <button
                        type="button"
                        onClick={() => { setActiveClientId(client.id); setClientEditSection('geral'); setIsEditClientModalOpen(true) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0, minWidth: 0 }}
                      >
                        <span style={{ width: 40, height: 40, borderRadius: 10, background: client.dashboardColor ? client.dashboardColor + '22' : 'rgba(38,194,129,0.12)', border: `1px solid ${client.dashboardColor ? client.dashboardColor + '44' : 'rgba(38,194,129,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {client.logoUrl
                            ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <i className="bx bx-building-house" style={{ fontSize: 18, color: client.dashboardColor || '#26c281', opacity: 0.8 }}></i>}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <strong style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</strong>
                          <small style={{ fontSize: '0.75rem', opacity: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{metaAccount?.name || client.metaAdAccountId || client.cnpj || 'Sem conta vinculada'}</small>
                        </span>
                      </button>

                      {/* Status cell */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: '0.65rem', opacity: 0.35, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
                          <select
                            value={['Ativo', 'Pausado', 'Churn'].includes(client.status) ? client.status : 'Ativo'}
                            onChange={(e) => handleClientInlineFieldChange(client.id, 'status', e.target.value)}
                            disabled={!canEditClientRecord(client.id)}
                            aria-label={`Status de ${client.name}`}
                            style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: 'inherit', fontSize: '0.82rem', cursor: canEditClientRecord(client.id) ? 'pointer' : 'default' }}
                          >
                            <option value="Ativo">Ativo</option>
                            <option value="Pausado">Pausado</option>
                            <option value="Churn">Churn</option>
                          </select>
                        </label>
                        {isChurnClient && (
                          <input
                            type="date"
                            value={client.churnDate || ''}
                            onChange={(e) => handleClientInlineFieldChange(client.id, 'churnDate', e.target.value)}
                            disabled={!canEditClientRecord(client.id)}
                            title="Data do churn"
                            style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)', color: 'inherit', fontSize: '0.78rem', width: '100%', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>

                      {/* Health cell */}
                      <span
                        title={isChurnClient ? 'Cliente marcado como Churn' : latestHealth ? `Último semanal: ${healthDetail}` : 'Sem registro semanal'}
                        style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: latestHealth ? (latestHealth.color + '18') : 'rgba(255,255,255,0.05)', color: latestHealth ? latestHealth.color : 'rgba(255,255,255,0.3)', border: `1px solid ${latestHealth ? latestHealth.color + '35' : 'rgba(255,255,255,0.08)'}`, width: 'fit-content' }}>
                          <i className={`bx ${isChurnClient ? 'bx-x-circle' : latestHealth ? 'bx-heart' : 'bx-time'}`} style={{ fontSize: 12 }}></i>
                          {latestHealth?.label || 'Sem registro'}
                        </span>
                        <small style={{ fontSize: '0.7rem', opacity: 0.35, paddingLeft: 2 }}>{healthDetail}</small>
                      </span>

                      {/* Integrations cell */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} aria-label="Integrações do cliente">
                        {[
                          { active: hasMeta, icon: 'bx bxl-meta', title: hasMeta ? 'Meta conectada' : 'Meta não conectada', color: '#0668E1' },
                          { active: hasAgendor, icon: 'bx bx-git-branch', title: hasAgendor ? 'Agendor cadastrado' : 'Agendor não cadastrado', color: '#f97316' },
                          { active: hasLeadsSheet, icon: 'bx bx-table', title: hasLeadsSheet ? 'Planilha de leads cadastrada' : 'Sem planilha de leads', color: '#22c55e' },
                        ].map((integ, idx) => (
                          <span
                            key={idx}
                            title={integ.title}
                            style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: integ.active ? integ.color + '18' : 'rgba(255,255,255,0.04)', color: integ.active ? integ.color : 'rgba(255,255,255,0.2)', border: `1px solid ${integ.active ? integ.color + '35' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.15s' }}
                          >
                            <i className={integ.icon}></i>
                          </span>
                        ))}
                      </div>

                      {/* Actions cell */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                          onClick={() => { setActiveClientId(client.id); setClientEditSection('geral'); setIsEditClientModalOpen(true) }}
                        >
                          <i className="bx bx-edit" style={{ marginRight: 4 }}></i>Editar
                        </button>
                        {canEditClientRecord(client.id) && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleArchiveClient(client.id, true)}
                            title="Arquivar cliente"
                            style={{ padding: '5px 8px', fontSize: '0.88rem' }}
                          >
                            <i className="bx bx-archive-in"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Empty state */}
                {displayClients.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '56px 24px', textAlign: 'center' }}>
                    <i className="bx bx-buildings" style={{ fontSize: '2.5rem', opacity: 0.2 }}></i>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, opacity: 0.7 }}>
                        {clientSearch || clientStatusFilter !== 'all' ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.84rem', opacity: 0.4 }}>
                        {clientSearch || clientStatusFilter !== 'all'
                          ? 'Tente ajustar a busca ou os filtros de status.'
                          : 'Cadastre o primeiro cliente para iniciar o onboarding e organizar os dados operacionais.'}
                      </p>
                    </div>
                    {!clientSearch && clientStatusFilter === 'all' && (
                      <button type="button" className="btn btn-primary" style={{ marginTop: 4 }} onClick={openCreateClientModal}>
                        <i className="bx bx-user-plus" style={{ marginRight: 6 }}></i>Novo cliente
                      </button>
                    )}
                  </div>
                )}

                {/* Archived clients */}
                {clients.some(c => c.isArchived) && (() => {
                  const archivedList = clients.filter(c => c.isArchived && (() => {
                    const query = clientSearch.trim().toLowerCase()
                    if (!query) return true
                    return [c.name, c.cnpj].filter(Boolean).some(v => String(v).toLowerCase().includes(query))
                  })())
                  if (!archivedList.length) return null
                  return (
                    <details style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
                      <summary style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 24px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, opacity: 0.45, userSelect: 'none', listStyle: 'none' }}>
                        <i className="bx bx-archive" style={{ fontSize: 15 }}></i>
                        Arquivados ({archivedList.length})
                        <i className="bx bx-chevron-down" style={{ marginLeft: 'auto', fontSize: 16 }}></i>
                      </summary>
                      <div style={{ padding: '0 0 8px' }}>
                        {archivedList.map(client => (
                          <div
                            key={client.id}
                            style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', opacity: 0.55 }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="bx bx-building-house" style={{ fontSize: 15, opacity: 0.4 }}></i>}
                              </span>
                              <span>
                                <strong style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>{client.name}</strong>
                                <small style={{ fontSize: '0.72rem', opacity: 0.5 }}>{client.metaAdAccountId || client.cnpj || 'Arquivado'}</small>
                              </span>
                            </span>
                            {canEditClientRecord(client.id) && (
                              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => handleArchiveClient(client.id, false)}>
                                <i className="bx bx-archive-out"></i> Desarquivar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )
                })()}
              </div>
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
