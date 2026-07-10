'use client'

import RolesTab from '@/components/dashboard/RolesTab'
import { useDashboard } from '@/components/dashboard/DashboardContext'

const ROLE_META = {
  master: { label: 'Master', color: '#4fdf9b' },
  operador: { label: 'Operador', color: '#3ba3ff' },
  gestor_resultado: { label: 'Gestor de Resultado', color: '#8b5cf6' },
  visualizador: { label: 'Visualizador', color: '#f59e0b' },
  cliente: { label: 'Cliente', color: '#7b8794' },
}
const AVATAR_POOL = ['linear-gradient(135deg,#26C281,#4fdf9b)', 'linear-gradient(135deg,#3ba3ff,#6366f1)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#8b5cf6,#3ba3ff)', 'linear-gradient(135deg,#22c55e,#26C281)', 'linear-gradient(135deg,#ec4899,#8b5cf6)']
const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
const initialsOf = (name) => { const parts = String(name || '').replace(/[^A-Za-zÀ-ÿ ]/g, '').trim().split(/\s+/); return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?' }
const hashIdx = (name) => { let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % AVATAR_POOL.length }

export default function UsuariosTab() {
  const {
    isMaster,
    user,
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
    canManageUsers,
  } = useDashboard()

  const roleMetaOf = (u) => ROLE_META[String(u?.role || '').toLowerCase()] || ROLE_META.visualizador
  const openInvite = () => { setCreatedUserInvite(null); setIsCreateUserModalOpen(true) }

  if (!canManageUsers) {
    return (
      <section className="weekly-dashboard-panel" style={{ background: 'transparent', border: 'none' }}>
        <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', padding: '44px 28px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 99, background: 'rgba(139,92,246,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><span className="mi" style={{ fontSize: 30, color: '#8b5cf6' }}>lock</span></div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>Acesso do time</div>
          <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.9rem', margin: '0 auto', maxWidth: '46ch', lineHeight: 1.55 }}>Seu usuário tem acesso aos dashboards liberados pelo master. Para alterar permissões, fale com um <strong style={{ color: '#E5E2E1' }}>Master</strong>.</p>
        </div>
      </section>
    )
  }

  const totalMembers = usersList.length
  const masterCount = usersList.filter((u) => u.role === 'master').length
  const aiCount = usersList.filter((u) => (u.ai_access_level || 'team') !== 'none').length
  const integrationCount = usersList.filter((u) => u.role === 'master' || u.can_edit_integrations).length
  const statDefs = [
    { key: 'total', label: 'Membros', value: totalMembers, color: '#26C281', accent: true },
    { key: 'master', label: 'Masters', value: masterCount, color: '#4fdf9b' },
    { key: 'ai', label: 'Com IA', value: aiCount, color: '#8b5cf6' },
    { key: 'integr', label: 'Com integrações', value: integrationCount, color: '#3ba3ff' },
  ]
  const thStyle = { fontFamily: 'Inter', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(229,226,225,0.4)', fontWeight: 600 }
  const GRID = '2.4fr 1.3fr 1.2fr 0.5fr 0.5fr 88px'

  return (
    <section className="weekly-dashboard-panel users-management-layout" style={{ background: 'transparent', border: 'none' }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderTop: '3px solid #26C281', borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.07),rgba(38,194,129,0.01))', padding: '26px 28px' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#26C281', fontWeight: 700, marginBottom: 9 }}>Admin · Time e permissões</div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.5vw,1.95rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Usuários</h1>
            <p style={{ margin: '9px 0 0', color: 'rgba(229,226,225,0.62)', fontSize: '0.9rem', maxWidth: '52ch', lineHeight: 1.5 }}>Cadastre pessoas, escolha quais dashboards cada uma acessa e libere ou bloqueie IA e integrações.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
            <button type="button" onClick={openInvite} style={{ height: 42, padding: '0 18px', borderRadius: 99, border: 'none', background: '#26C281', color: '#04150d', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 24px rgba(38,194,129,0.28)' }}>
              <span className="mi" style={{ fontSize: 19 }}>person_add</span>Convidar membro
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
          </div>
        ))}
      </div>

      {/* ── SUB-TABS ── */}
      <div style={{ marginTop: 22, display: 'flex', gap: 8 }}>
        {[
          { key: 'usuarios', label: 'Usuários', icon: 'group' },
          { key: 'funcoes', label: 'Funções e Permissões', icon: 'shield' },
        ].map((tab) => {
          const active = teamSubTab === tab.key
          return (
            <button key={tab.key} type="button" onClick={() => setTeamSubTab(tab.key)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 15px', borderRadius: 10, fontFamily: 'Inter', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                background: active ? 'rgba(38,194,129,0.14)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(38,194,129,0.4)' : 'rgba(255,255,255,0.06)'}`, color: active ? '#26C281' : 'rgba(229,226,225,0.62)' }}>
              <span className="mi" style={{ fontSize: 17 }}>{tab.icon}</span>{tab.label}
            </button>
          )
        })}
      </div>

      {teamSubTab === 'funcoes' && (
        <div style={{ marginTop: 18, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)', padding: 24 }}>
          <RolesTab />
        </div>
      )}

      {teamSubTab === 'usuarios' && (
        <>
          {/* ── SEARCH ── */}
          <div style={{ marginTop: 22, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 230, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="mi" style={{ position: 'absolute', left: 14, fontSize: 19, color: 'rgba(229,226,225,0.4)', pointerEvents: 'none' }}>search</span>
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar por nome ou e-mail…" style={{ width: '100%', height: 44, padding: '0 14px 0 42px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#E5E2E1', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none' }} />
            </div>
          </div>

          {/* ── DIRECTORY TABLE ── */}
          {usersLoading ? (
            <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', padding: '44px 28px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Carregando time</div>
              <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.86rem', margin: 0 }}>Buscando os acessos salvos no Supabase.</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 14, alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={thStyle}>Membro</div>
                <div style={thStyle}>Função</div>
                <div style={thStyle}>Dashboards</div>
                <div style={{ ...thStyle, textAlign: 'center' }}>IA</div>
                <div style={{ ...thStyle, textAlign: 'center' }}>Integr.</div>
                <div></div>
              </div>
              {filteredUsers.map((managedUser) => {
                const rm = roleMetaOf(managedUser)
                const accessCount = getManagedUserAccessibleClientCount(managedUser)
                const hasAiAccess = (managedUser.ai_access_level || 'team') !== 'none'
                const hasIntegrationAccess = managedUser.role === 'master' || Boolean(managedUser.can_edit_integrations)
                const accessLabel = managedUser.role === 'master' ? 'Todos os dashboards' : accessCount > 0 ? `${accessCount} dashboard(s)` : 'Nenhum'
                const name = managedUser.full_name || managedUser.email
                const openEdit = () => { setSelectedUserId(managedUser.id); setIsEditUserModalOpen(true); setEditUserClientSearch('') }
                return (
                  <div key={'user-' + managedUser.id} onClick={openEdit}
                    style={{ display: 'grid', gridTemplateColumns: GRID, gap: 14, alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: AVATAR_POOL[hashIdx(name)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff', flex: 'none' }}>{initialsOf(name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: '0.68rem', color: 'rgba(229,226,225,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{managedUser.email}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px 4px 9px', borderRadius: 99, background: hexA(rm.color, 0.13), color: rm.color, border: `1px solid ${hexA(rm.color, 0.3)}`, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: rm.color, boxShadow: `0 0 8px ${rm.color}` }} />{rm.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(229,226,225,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{accessLabel}</div>
                    <div style={{ textAlign: 'center' }}>
                      <span title={hasAiAccess ? 'IA liberada' : 'IA bloqueada'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: hasAiAccess ? 'rgba(139,92,246,0.13)' : 'rgba(255,255,255,0.04)', color: hasAiAccess ? '#8b5cf6' : 'rgba(229,226,225,0.3)' }}><span className="mi" style={{ fontSize: 16 }}>{hasAiAccess ? 'smart_toy' : 'lock'}</span></span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span title={hasIntegrationAccess ? 'Integrações liberadas' : 'Integrações bloqueadas'} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: hasIntegrationAccess ? 'rgba(38,194,129,0.13)' : 'rgba(255,255,255,0.04)', color: hasIntegrationAccess ? '#26C281' : 'rgba(229,226,225,0.3)' }}><span className="mi" style={{ fontSize: 16 }}>{hasIntegrationAccess ? 'extension' : 'lock'}</span></span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); openEdit() }} title="Editar" style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: 'rgba(229,226,225,0.62)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="mi" style={{ fontSize: 17 }}>edit</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', padding: '44px 28px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 99, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><span className="mi" style={{ fontSize: 28, color: 'rgba(229,226,225,0.4)' }}>group_off</span></div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Nenhum membro encontrado</div>
              <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.86rem', margin: '0 auto 18px', maxWidth: '40ch' }}>Ajuste a busca ou convide um novo acesso para o workspace.</p>
              <button type="button" onClick={openInvite} style={{ height: 40, padding: '0 18px', borderRadius: 99, border: 'none', background: '#26C281', color: '#04150d', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}><span className="mi" style={{ fontSize: 18 }}>person_add</span>Convidar membro</button>
            </div>
          )}

          {/* ── PAGE PERMISSIONS MANAGER ── */}
          {isMaster && usersList.filter((u) => u.role !== 'master').length > 0 && (() => {
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
            const groups = [...new Set(PAGE_DEFS.map((p) => p.group))]
            const nonMasterUsers = usersList.filter((u) => u.role !== 'master')
            const activePermUserId = permSelectedUserId || nonMasterUsers[0]?.id || ''
            const permUser = nonMasterUsers.find((u) => u.id === activePermUserId) || nonMasterUsers[0]

            return (
              <div style={{ marginTop: 24, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)', padding: '20px 24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mi" style={{ fontSize: 20, color: '#26C281' }}>shield</span>Permissões de Páginas
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                  {nonMasterUsers.map((u) => {
                    const active = activePermUserId === u.id
                    return (
                      <button key={u.id} type="button" onClick={() => setPermSelectedUserId(u.id)}
                        style={{ padding: '6px 14px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 600, border: '1px solid', cursor: 'pointer',
                          borderColor: active ? 'rgba(38,194,129,0.4)' : 'rgba(255,255,255,0.1)',
                          background: active ? 'rgba(38,194,129,0.13)' : 'transparent',
                          color: active ? '#26C281' : 'rgba(229,226,225,0.62)' }}>
                        {u.full_name || u.email}
                      </button>
                    )
                  })}
                </div>
                {permUser && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={() => PAGE_DEFS.forEach((p) => toggleNavPermission(permUser.id, p.key, true))}>
                        <span className="mi" style={{ fontSize: 15, marginRight: 4, verticalAlign: 'middle' }}>done_all</span>Selecionar tudo
                      </button>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 14px' }} onClick={() => PAGE_DEFS.forEach((p) => toggleNavPermission(permUser.id, p.key, false))}>
                        <span className="mi" style={{ fontSize: 15, marginRight: 4, verticalAlign: 'middle' }}>close</span>Desselecionar tudo
                      </button>
                    </div>
                    {groups.map((group) => (
                      <div key={group}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{group}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                          {PAGE_DEFS.filter((p) => p.group === group).map((page) => {
                            const perm = navPermissions.find((p2) => p2.user_id === permUser.id && p2.page_key === page.key)
                            const granted = perm ? perm.granted : false
                            return (
                              <label key={page.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: `1px solid ${granted ? 'rgba(38,194,129,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', transition: 'all .15s' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{page.label}</span>
                                <div style={{ position: 'relative', width: 38, height: 22, flexShrink: 0 }}>
                                  <span style={{ display: 'block', width: 38, height: 22, borderRadius: 11, background: granted ? '#26C281' : 'rgba(255,255,255,0.15)', transition: 'background .2s', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); toggleNavPermission(permUser.id, page.key, !granted) }}>
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

          {/* ── CREATE MODAL ── */}
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

          {/* ── EDIT MODAL ── */}
          {isEditUserModalOpen && selectedManagedUser && (
            <div className="modal-overlay" onClick={() => setIsEditUserModalOpen(false)}><div className="modal-card glass-panel" onClick={(event) => event.stopPropagation()}>
              <div className="modal-header"><div><h3>Editar membro</h3><p>Atualize nome, dashboards liberados, IA e integrações.</p></div><button type="button" className="modal-close" onClick={() => setIsEditUserModalOpen(false)} aria-label="Fechar edição de membro"><i className="bx bx-x"></i></button></div>
              {editUserError && <div className="form-alert">{editUserError}</div>}
              <div className="user-admin-head"><div><strong>{selectedManagedUser.full_name || selectedManagedUser.email}</strong><span>{selectedManagedUser.email}</span></div>{selectedManagedUser.id !== user?.id && selectedManagedUser.role !== 'master' && <button type="button" className="btn btn-secondary" onClick={() => handleDeleteUser(selectedManagedUser.id)}>Excluir</button>}</div>
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
          )}
        </>
      )}
    </section>
  )
}
