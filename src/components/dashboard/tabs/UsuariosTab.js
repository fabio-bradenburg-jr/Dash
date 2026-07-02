'use client'

import RolesTab from '@/components/dashboard/RolesTab'
import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function UsuariosTab() {
  const {
    isMaster,
    user,
    canAccessTeamTab,
    canEditIntegrations,
    canManageUsers,
    createUserError,
    createdUserInvite,
    setCreatedUserInvite,
    dashboardEligibleClients,
    editUserClientSearch,
    setEditUserClientSearch,
    editUserError,
    filteredUsers,
    getManagedUserAccessibleClientCount,
    handleCreateUser,
    handleDeleteUser,
    handleManagedUserChange,
    handleUpdateUser,
    handleUserClientToggle,
    isCreateUserModalOpen,
    setIsCreateUserModalOpen,
    isEditUserModalOpen,
    setIsEditUserModalOpen,
    navPermissions,
    permSelectedUserId,
    setPermSelectedUserId,
    savingUser,
    selectedManagedUser,
    setSelectedUserId,
    setTeamSubTab,
    teamSubTab,
    toggleNavPermission,
    userForm,
    setUserForm,
    userSearch,
    setUserSearch,
    usersList,
    usersLoading,
  } = useDashboard()

  return (
          canManageUsers ? (
            <section className="clients-layout users-management-layout simple-team-layout">
              <div className="glass-panel management-hero users-intro-card">
                <div className="management-hero-copy" style={{maxWidth:'100%'}}>
                  <span className="management-hero-kicker">Team access</span>
                  <h2>Time e permissões</h2>
                  <p>Cadastre pessoas, escolha quais dashboards cada uma pode acessar e libere ou bloqueie IA e integrações.</p>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                {[
                  { key: 'usuarios', label: 'Usuários', icon: 'bx-group' },
                  { key: 'funcoes', label: 'Funções e Permissões', icon: 'bx-shield' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTeamSubTab(tab.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: teamSubTab === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                      color: teamSubTab === tab.key ? '#e2e8f0' : '#64748b',
                      fontSize: 13, fontWeight: teamSubTab === tab.key ? 700 : 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    <i className={`bx ${tab.icon}`} style={{ fontSize: 14 }} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {teamSubTab === 'funcoes' && (
                <div className="glass-panel" style={{ padding: 24 }}>
                  <RolesTab />
                </div>
              )}

              {teamSubTab === 'usuarios' && <><div className="glass-panel users-toolbar-card management-directory-card simple-team-card">
                <div className="user-picker-head">
                  <div>
                    <span className="management-card-kicker">Cadastro simples</span>
                    <h3>Membros do time</h3>
                    <p>Lista limpa com acesso aos dashboards, IA e integrações. Nada de PDI, operação ou métricas internas.</p>
                  </div>
                  <div className="users-toolbar-actions"><button type="button" className="btn btn-primary" onClick={() => { setCreatedUserInvite(null); setIsCreateUserModalOpen(true) }}><i className="bx bx-user-plus" aria-hidden="true"></i><span>Convidar membro</span></button></div>
                </div>

                <div className="users-search-row"><div className="input-group users-search-field"><label>Buscar membro</label><input type="text" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Nome ou e-mail" /></div></div>

                {usersLoading ? (
                  <div className="empty-panel glass-item"><h3>Carregando time</h3><p>Buscando os acessos salvos no Supabase.</p></div>
                ) : (
                  <div className="simple-client-list simple-team-list" role="table" aria-label="Membros do time">
                    <div className="simple-client-row simple-client-head" role="row"><span>Membro</span><span>Dashboards</span><span>IA</span><span>Integrações</span><span>Ação</span></div>
                    {filteredUsers.map((managedUser) => {
                      const accessCount = getManagedUserAccessibleClientCount(managedUser)
                      const hasAiAccess = (managedUser.ai_access_level || 'team') !== 'none'
                      const hasIntegrationAccess = managedUser.role === 'master' || Boolean(managedUser.can_edit_integrations)
                      const accessLabel = managedUser.role === 'master' ? 'Todos os dashboards' : accessCount > 0 ? accessCount + ' dashboard(s)' : 'Nenhum dashboard'

                      return (
                        <div key={'simple-user-' + managedUser.id} className="simple-client-row" role="row">
                          <div className="simple-client-main"><span className="simple-client-avatar"><i className="bx bx-user"></i></span><div className="simple-team-identity"><strong>{managedUser.full_name || managedUser.email}</strong><small>{managedUser.email}</small></div></div>
                          <span className="simple-client-status-text">{accessLabel}</span>
                          <span className={'integration-status-icon ' + (hasAiAccess ? 'active' : '')} title={hasAiAccess ? 'IA liberada' : 'IA bloqueada'}><i className={'bx ' + (hasAiAccess ? 'bx-brain' : 'bx-lock-alt')}></i></span>
                          <span className={'integration-status-icon ' + (hasIntegrationAccess ? 'active' : '')} title={hasIntegrationAccess ? 'Integrações liberadas' : 'Integrações bloqueadas'}><i className={'bx ' + (hasIntegrationAccess ? 'bx-plug' : 'bx-lock-alt')}></i></span>
                          <button type="button" className="btn btn-secondary" onClick={() => { setSelectedUserId(managedUser.id); setIsEditUserModalOpen(true); setEditUserClientSearch('') }}><i className="bx bx-edit-alt" aria-hidden="true"></i><span>Editar</span></button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!usersLoading && !filteredUsers.length && <div className="empty-panel glass-item users-empty-state compact-empty-state"><h3>Nenhum membro encontrado</h3><p>Ajuste a busca ou crie um novo acesso para o workspace.</p></div>}
              </div>

              {/* Page Permissions Manager */}
              {isMaster && usersList.filter(u => u.role !== 'master').length > 0 && (() => {
                const PAGE_DEFS = [
                  { key: 'clientes', label: 'Clientes', group: 'Sucesso do Cliente' },
                  { key: 'onboarding', label: 'Onboarding', group: 'Sucesso do Cliente' },
                  { key: 'offboarding', label: 'Offboarding', group: 'Sucesso do Cliente' },
                  { key: 'acessos', label: 'Acessos', group: 'Sucesso do Cliente' },
                  { key: 'semanal', label: 'Controle da Operação', group: 'Geral' },
                  { key: 'apresentacao', label: 'Dash', group: 'Performance' },
                  { key: 'campanhas', label: 'Campanhas', group: 'Performance' },
                  { key: 'anuncios', label: 'Anúncios', group: 'Performance' },
                  { key: 'saldos', label: 'Saldos', group: 'Performance' },
                  { key: 'relatorios', label: 'Relatórios', group: 'Performance' },
                  { key: 'planilha-leads', label: 'Planilha de Leads', group: 'Performance' },
                  { key: 'funil', label: 'Funil', group: 'Performance' },
                  { key: 'tarefas', label: 'Tarefas', group: 'Performance' },
                  { key: 'editorial-dash', label: 'Painel', group: 'Social Media' },
                  { key: 'editorial', label: 'Calendário', group: 'Social Media' },
                  { key: 'editorial-plans', label: 'Planejamentos', group: 'Social Media' },
                  { key: 'pac-dash', label: 'Painel', group: 'PAC' },
                  { key: 'pac-calendario', label: 'Calendário', group: 'PAC' },
                  { key: 'pac-tipos', label: 'Tipos', group: 'PAC' },
                  { key: 'settings', label: 'Configurações', group: 'Geral' },
                ]
                const groups = [...new Set(PAGE_DEFS.map(p => p.group))]
                const nonMasterUsers = usersList.filter(u => u.role !== 'master')
                const activePermUserId = permSelectedUserId || nonMasterUsers[0]?.id || ''
                const permUser = nonMasterUsers.find(u => u.id === activePermUserId) || nonMasterUsers[0]

                return (
                  <div className="glass-panel" style={{ marginTop: 24, padding: '20px 24px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700 }}>
                      <i className="bx bx-shield-quarter" style={{ marginRight: 8, color: '#22c55e' }}></i>
                      Permissões de Páginas
                    </h3>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                      {nonMasterUsers.map(u => (
                        <button key={u.id} type="button"
                          onClick={() => setPermSelectedUserId(u.id)}
                          style={{ padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, border: '1.5px solid', cursor: 'pointer',
                            borderColor: activePermUserId === u.id ? '#22c55e' : 'rgba(255,255,255,0.12)',
                            background: activePermUserId === u.id ? 'rgba(34,197,94,0.12)' : 'transparent',
                            color: activePermUserId === u.id ? '#22c55e' : 'inherit' }}>
                          {u.full_name || u.email}
                        </button>
                      ))}
                    </div>
                    {permUser && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 14px' }}
                            onClick={() => PAGE_DEFS.forEach(p => toggleNavPermission(permUser.id, p.key, true))}>
                            <i className="bx bx-check-double" style={{ marginRight: 4 }}></i>Selecionar tudo
                          </button>
                          <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 14px' }}
                            onClick={() => PAGE_DEFS.forEach(p => toggleNavPermission(permUser.id, p.key, false))}>
                            <i className="bx bx-x" style={{ marginRight: 4 }}></i>Desselecionar tudo
                          </button>
                        </div>
                        {groups.map(group => (
                          <div key={group}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{group}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                              {PAGE_DEFS.filter(p => p.group === group).map(page => {
                                const perm = navPermissions.find(p2 => p2.user_id === permUser.id && p2.page_key === page.key)
                                const granted = perm ? perm.granted : false
                                return (
                                  <label key={page.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: `1.5px solid ${granted ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', transition: 'all .15s' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{page.label}</span>
                                    <div style={{ position: 'relative', width: 38, height: 22, flexShrink: 0 }}>
                                      <input type="checkbox" checked={granted} onChange={() => {}} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                                      <span style={{ display: 'block', width: 38, height: 22, borderRadius: 11, background: granted ? '#22c55e' : 'rgba(255,255,255,0.15)', transition: 'background .2s', cursor: 'pointer' }} onClick={e => { e.preventDefault(); toggleNavPermission(permUser.id, page.key, !granted) }}>
                                        <span style={{ display: 'block', width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: granted ? 19 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}></span>
                                      </span>
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}

              {isCreateUserModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateUserModalOpen(false)}><div className="modal-card glass-panel" onClick={(event) => event.stopPropagation()}>
                  <div className="modal-header"><div><h3>Convidar membro</h3><p>Crie um acesso no workspace atual e envie as credenciais temporárias para a pessoa da equipe.</p></div><button type="button" className="modal-close" onClick={() => setIsCreateUserModalOpen(false)} aria-label="Fechar convite de membro"><i className="bx bx-x"></i></button></div>
                  <form onSubmit={handleCreateUser}>
                    {createUserError && <div className="form-alert">{createUserError}</div>}
                    {createdUserInvite && (
                      <div className="form-success">
                        Convite criado para {createdUserInvite.email}. Link: {createdUserInvite.loginUrl} · Senha temporária: {createdUserInvite.temporaryPassword}
                      </div>
                    )}
                    <div className="form-grid user-admin-grid">
                      <div className="input-group"><label>Nome</label><input type="text" value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value, role: 'visualizador' }))} placeholder="Nome completo" /></div>
                      <div className="input-group"><label>E-mail</label><input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value, role: 'visualizador' }))} placeholder="usuario@empresa.com" /></div>
                      <div className="input-group"><label>Senha inicial opcional</label><input type="password" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} placeholder="Gerada automaticamente se ficar vazio" /></div>
                      <div className="input-group"><label>Função</label><select className="client-select-input" value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value }))}><option value="visualizador">Visualizador</option><option value="operador">Operador</option><option value="gestor_resultado">Gestor de Resultado</option><option value="cliente">Cliente</option></select></div>
                      <div className="input-group"><label>IA</label><select className="client-select-input" value={userForm.aiAccessLevel} onChange={(event) => setUserForm((current) => ({ ...current, aiAccessLevel: event.target.value }))}><option value="team">Liberada</option><option value="none">Bloqueada</option></select></div>
                      <div className="input-group"><label>Integrações</label><select className="client-select-input" value={userForm.canEditIntegrations ? 'enabled' : 'disabled'} onChange={(event) => setUserForm((current) => ({ ...current, canEditIntegrations: event.target.value === 'enabled' }))}><option value="disabled">Bloqueadas</option><option value="enabled">Liberadas</option></select></div>
                    </div>
                    <div className="input-group"><label>Dashboards liberados</label><div className="stage-selector">{dashboardEligibleClients.length ? dashboardEligibleClients.map((client) => (<label key={'new-user-' + client.id} className={'stage-chip ' + (userForm.clientIds.includes(client.id) ? 'active' : '')}><input type="checkbox" checked={userForm.clientIds.includes(client.id)} onChange={() => handleUserClientToggle(client.id)} /><span>{client.name}</span></label>)) : <div className="stage-empty">Cadastre clientes antes de liberar dashboards para o time.</div>}</div></div>
                    <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsCreateUserModalOpen(false)}>Fechar</button><button type="submit" className="btn btn-primary" disabled={savingUser}>{savingUser ? 'Criando...' : 'Gerar convite'}</button></div>
                  </form>
                </div></div>
              )}

              {teamSubTab === 'usuarios' && isEditUserModalOpen && selectedManagedUser && (
                <div className="modal-overlay" onClick={() => setIsEditUserModalOpen(false)}><div className="modal-card glass-panel" onClick={(event) => event.stopPropagation()}>
                  <div className="modal-header"><div><h3>Editar membro</h3><p>Atualize nome, dashboards liberados, IA e integrações.</p></div><button type="button" className="modal-close" onClick={() => setIsEditUserModalOpen(false)} aria-label="Fechar edição de membro"><i className="bx bx-x"></i></button></div>
                  {editUserError && <div className="form-alert">{editUserError}</div>}
                  <div className="user-admin-head"><div><strong>{selectedManagedUser.full_name || selectedManagedUser.email}</strong><span>{selectedManagedUser.email}</span></div>{selectedManagedUser.id !== user?.id && <button type="button" className="btn btn-secondary" onClick={() => handleDeleteUser(selectedManagedUser.id)}>Excluir</button>}</div>
                  <div className="form-grid user-admin-grid">
                    <div className="input-group"><label>Nome</label><input type="text" value={selectedManagedUser.full_name || ''} onChange={(event) => handleManagedUserChange(selectedManagedUser.id, (item) => ({ ...item, full_name: event.target.value }))} /></div>
                    {selectedManagedUser.role !== 'master' && <div className="input-group"><label>Função</label><select className="client-select-input" value={selectedManagedUser.role || 'visualizador'} onChange={(event) => handleManagedUserChange(selectedManagedUser.id, (item) => ({ ...item, role: event.target.value }))}><option value="visualizador">Visualizador</option><option value="operador">Operador</option><option value="gestor_resultado">Gestor de Resultado</option><option value="cliente">Cliente</option></select></div>}
                    <div className="input-group"><label>IA</label><select className="client-select-input" value={selectedManagedUser.ai_access_level || (selectedManagedUser.role === 'master' ? 'master' : 'team')} onChange={(event) => handleManagedUserChange(selectedManagedUser.id, (item) => ({ ...item, ai_access_level: event.target.value }))}>{selectedManagedUser.role === 'master' && <option value="master">IA Master</option>}<option value="team">Liberada</option><option value="none">Bloqueada</option></select></div>
                    <div className="input-group"><label>Integrações</label><select className="client-select-input" value={(selectedManagedUser.role === 'master' || selectedManagedUser.can_edit_integrations) ? 'enabled' : 'disabled'} disabled={selectedManagedUser.role === 'master'} onChange={(event) => handleManagedUserChange(selectedManagedUser.id, (item) => ({ ...item, can_edit_integrations: event.target.value === 'enabled' }))}><option value="disabled">Bloqueadas</option><option value="enabled">Liberadas</option></select></div>
                  </div>
                  {selectedManagedUser.role !== 'master' && (() => {
                    const currentAccess = selectedManagedUser.clientAccess || []
                    const selectedCount = dashboardEligibleClients.filter((c) => currentAccess.some((a) => a.client_id === c.id)).length
                    const filteredClients = editUserClientSearch.trim()
                      ? dashboardEligibleClients.filter((c) => c.name.toLowerCase().includes(editUserClientSearch.toLowerCase()))
                      : dashboardEligibleClients
                    return (
                      <div className="client-access-section">
                        <div className="client-access-top">
                          <label>Dashboards liberados</label>
                          <span className="client-access-count">{selectedCount} de {dashboardEligibleClients.length}</span>
                          <div className="client-access-quick">
                            <button type="button" onClick={() => handleManagedUserChange(selectedManagedUser.id, (item) => ({ ...item, clientAccess: dashboardEligibleClients.map((c) => ({ client_id: c.id, can_view: true, can_edit: false })) }))}>Todos</button>
                            <button type="button" onClick={() => handleManagedUserChange(selectedManagedUser.id, (item) => ({ ...item, clientAccess: [] }))}>Nenhum</button>
                          </div>
                        </div>
                        <div className="client-access-search">
                          <i className="bx bx-search"></i>
                          <input type="text" placeholder="Buscar cliente..." value={editUserClientSearch} onChange={(e) => setEditUserClientSearch(e.target.value)} />
                        </div>
                        <div className="client-access-grid">
                          {filteredClients.length ? filteredClients.map((client) => {
                            const hasClient = currentAccess.some((a) => a.client_id === client.id)
                            return (
                              <label key={selectedManagedUser.id + '-' + client.id} className={'client-access-item ' + (hasClient ? 'selected' : '')}>
                                <input type="checkbox" checked={hasClient} onChange={() => handleManagedUserChange(selectedManagedUser.id, (item) => {
                                  const base = item.clientAccess || []
                                  const next = hasClient ? base.filter((a) => a.client_id !== client.id) : [...base, { client_id: client.id, can_view: true, can_edit: false }]
                                  return { ...item, clientAccess: next }
                                })} />
                                <span className="client-access-avatar">{(client.name || '?').charAt(0)}</span>
                                <span className="client-access-name">{client.name}</span>
                                <span className="client-access-check"><i className={'bx ' + (hasClient ? 'bx-check-circle' : 'bx-circle')}></i></span>
                              </label>
                            )
                          }) : (
                            <div className="client-access-empty">
                              {editUserClientSearch ? 'Nenhum cliente encontrado.' : 'Cadastre clientes antes de liberar dashboards para o time.'}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                  <div className="modal-foot"><span className="form-note">Os acessos do time são salvos no Supabase e aplicados no login deste usuário.</span><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsEditUserModalOpen(false)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={() => handleUpdateUser(selectedManagedUser)}>Salvar membro</button></div></div>
                </div></div>
              )}</>}
            </section>
          ) : (
            <section className="clients-layout users-management-layout simple-team-layout"><div className="empty-panel glass-panel"><h3>Acesso do time</h3><p>Seu usuário tem acesso aos dashboards liberados pelo master. Para alterar permissões, fale com o administrador.</p></div></section>
          )
  )
}
