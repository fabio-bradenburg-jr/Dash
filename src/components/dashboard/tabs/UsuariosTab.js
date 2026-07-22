'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import RolesTab from '@/components/dashboard/RolesTab'
import { useDashboard } from '@/components/dashboard/DashboardContext'
import { PAGE_MODULES } from '@/lib/access/pages'

const ROLE_META = {
  master: { label: 'Master', color: '#4fdf9b' },
  admin: { label: 'Admin', color: '#26C281' },
  operador: { label: 'Operador', color: '#3ba3ff' },
  analista: { label: 'Analista', color: '#38bdf8' },
  gestor_resultado: { label: 'Gestor de Resultado', color: '#8b5cf6' },
  visualizador: { label: 'Visualizador', color: '#f59e0b' },
  cliente: { label: 'Cliente', color: '#7b8794' },
}
const STATUS_META = {
  active: { label: 'Ativo', color: '#26C281' },
  invited: { label: 'Convidado', color: '#f59e0b' },
  inactive: { label: 'Inativo', color: '#7b8794' },
}
// Catálogo de páginas (fonte única em src/lib/access/pages.js). A permissão do app é
// por página: liberar a página dá acesso a tudo que ela mostra.
const MODULES = PAGE_MODULES
const AVATAR_POOL = ['linear-gradient(135deg,#26C281,#4fdf9b)', 'linear-gradient(135deg,#3ba3ff,#6366f1)', 'linear-gradient(135deg,#f59e0b,#ef4444)', 'linear-gradient(135deg,#8b5cf6,#3ba3ff)', 'linear-gradient(135deg,#22c55e,#26C281)', 'linear-gradient(135deg,#ec4899,#8b5cf6)']
const hexA = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
const initialsOf = (name) => { const parts = String(name || '').replace(/[^A-Za-zÀ-ÿ ]/g, '').trim().split(/\s+/); return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?' }
const hashIdx = (name) => { let h = 0; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % AVATAR_POOL.length }
const CUSTOM_PERMS_STORAGE = 'nype_custom_perms'

function fmtLastAccess(value) {
  if (!value) return 'Nunca'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsuariosTab() {
  const {
    isMaster,
    user,
    canManageUsers,
    createUserError,
    createdUserInvite,
    setCreatedUserInvite,
    dashboardEligibleClients,
    editUserClientSearch,
    setEditUserClientSearch,
    editUserError,
    getManagedUserAccessibleClientCount,
    handleCreateUser,
    handleManagedUserChange,
    handleUpdateUser,
    handleUserClientToggle,
    isCreateUserModalOpen,
    setIsCreateUserModalOpen,
    isEditUserModalOpen,
    setIsEditUserModalOpen,
    loadUsers,
    loadNavPermissions,
    navPermissions,
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

  const [roleFilter, setRoleFilter] = useState('todos')
  const [menuUserId, setMenuUserId] = useState(null)
  const [toast, setToast] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTargetId, setTransferTargetId] = useState('')
  const [busyAction, setBusyAction] = useState(false)
  const [credentialResult, setCredentialResult] = useState(null)
  const [modalTab, setModalTab] = useState('dados')
  const [activity, setActivity] = useState({ loading: false, entries: [] })
  const [presets, setPresets] = useState([])
  const [rolesList, setRolesList] = useState([])
  const [newPresetName, setNewPresetName] = useState('')
  const [customPerms, setCustomPerms] = useState([])
  const [newCustomLabel, setNewCustomLabel] = useState('')
  const toastTimer = useRef(null)

  const showToast = useCallback((msg, type = 'ok') => {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }, [])
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const copyText = useCallback(async (value, label) => {
    try {
      await navigator.clipboard.writeText(String(value ?? ''))
      showToast(`${label} copiado.`)
    } catch {
      showToast('Não foi possível copiar automaticamente. Copie manualmente.', 'error')
    }
  }, [showToast])

  // Custom permission definitions (localStorage; grants persistem em nav_permissions).
  useEffect(() => {
    try { const raw = localStorage.getItem(CUSTOM_PERMS_STORAGE); if (raw) setCustomPerms(JSON.parse(raw)) } catch { /* ignore */ }
  }, [])
  const persistCustomPerms = (next) => { setCustomPerms(next); try { localStorage.setItem(CUSTOM_PERMS_STORAGE, JSON.stringify(next)) } catch { /* ignore */ } }

  const loadPresets = useCallback(async () => {
    try { const r = await fetch('/api/permission-presets', { cache: 'no-store' }); const d = await r.json(); if (r.ok) setPresets(d.presets || []) } catch { /* ignore */ }
  }, [])
  const loadRoles = useCallback(async () => {
    try { const r = await fetch('/api/roles', { cache: 'no-store' }); const d = await r.json(); if (r.ok) setRolesList((d.roles || []).filter((x) => x.is_active !== false)) } catch { /* ignore */ }
  }, [])
  useEffect(() => { if (canManageUsers) { loadPresets(); loadRoles() } }, [canManageUsers, loadPresets, loadRoles])

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

  // Páginas efetivamente liberadas para o usuário (workspace_nav_permissions).
  const grantedPageKeysOf = (userId) => navPermissions.filter((p) => p.user_id === userId && p.granted).map((p) => p.page_key)
  const sameSet = (a, b) => { const A = new Set(a); const B = new Set(b); if (A.size !== B.size) return false; for (const x of A) if (!B.has(x)) return false; return true }
  // Rótulo de acesso exibido: Master, Cliente, nome da função, ou "Acesso Personalizado"
  // quando as páginas do usuário divergem da função atribuída (ou não há função).
  const accessLabelOf = (u) => {
    const role = String(u?.role || '').toLowerCase()
    if (role === 'master') return { label: 'Master', color: ROLE_META.master.color, custom: false }
    if (role === 'cliente') return { label: 'Cliente', color: ROLE_META.cliente.color, custom: false }
    const ar = u.assignedRole
    const granted = grantedPageKeysOf(u.id)
    const arColor = (ar?.color && /^#/.test(ar.color)) ? ar.color : ROLE_META.visualizador.color
    if (ar) {
      if (sameSet(granted, ar.pages || [])) return { label: ar.name, color: arColor, custom: false }
      return { label: 'Acesso Personalizado', color: '#8b5cf6', custom: true }
    }
    if (granted.length > 0) return { label: 'Acesso Personalizado', color: '#8b5cf6', custom: true }
    return { label: 'Sem acesso', color: '#7b8794', custom: false }
  }
  const statusOf = (u) => (u?.role === 'master' ? 'active' : String(u?.status || 'active'))
  const statusMetaOf = (u) => STATUS_META[statusOf(u)] || STATUS_META.active
  const masterUsers = usersList.filter((u) => u.role === 'master')

  // Stats
  const totalMembers = usersList.length
  const activeCount = usersList.filter((u) => statusOf(u) === 'active').length
  const invitedCount = usersList.filter((u) => statusOf(u) === 'invited').length
  const masterCount = masterUsers.length
  const statDefs = [
    { key: 'total', label: 'Total', value: totalMembers, color: '#26C281', accent: true },
    { key: 'active', label: 'Ativos', value: activeCount, color: '#26C281' },
    { key: 'invited', label: 'Convites pendentes', value: invitedCount, color: '#f59e0b' },
    { key: 'master', label: 'Masters', value: masterCount, color: '#4fdf9b' },
  ]

  // Filters
  const roleChips = [['todos', 'Todos'], ['master', 'Master'], ['admin', 'Admin'], ['analista', 'Analista'], ['visualizador', 'Visualizador']]
  const query = userSearch.trim().toLowerCase()
  const visibleUsers = usersList.filter((u) => {
    const matchesRole = roleFilter === 'todos' || String(u.role || '') === roleFilter
    const matchesSearch = !query || [u.full_name, u.email].filter(Boolean).some((v) => v.toLowerCase().includes(query))
    return matchesRole && matchesSearch
  })

  const openEdit = (userId) => { setSelectedUserId(userId); setIsEditUserModalOpen(true); setEditUserClientSearch(''); setModalTab('dados'); setMenuUserId(null); setCredentialResult(null) }
  const openInvite = (asMaster = false) => {
    setCreatedUserInvite(null)
    setUserForm((c) => ({ ...c, fullName: '', email: '', password: '', role: asMaster ? 'master' : 'visualizador', roleId: '', canEditIntegrations: asMaster, clientIds: [] }))
    setIsCreateUserModalOpen(true)
  }

  // Server actions
  const doCredential = async (userId, action) => {
    setBusyAction(true)
    try {
      const r = await fetch(`/api/users/${userId}/credentials`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha na operação.')
      setCredentialResult({ email: d.email, temporaryPassword: d.temporaryPassword })
      showToast(action === 'resend' ? 'Convite reenviado — nova senha temporária gerada.' : 'Senha redefinida — nova senha temporária gerada.')
      await loadUsers()
    } catch (e) { showToast(e.message, 'error') } finally { setBusyAction(false); setMenuUserId(null) }
  }
  const doStatus = async (u, status) => {
    setBusyAction(true)
    try {
      const r = await fetch(`/api/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: u.full_name || '', role: u.role, canEditIntegrations: u.can_edit_integrations, status,
          clientIds: (u.clientAccess || []).map((a) => a.client_id) }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha ao atualizar status.')
      showToast(status === 'active' ? 'Usuário ativado.' : 'Usuário desativado.')
      await loadUsers()
    } catch (e) { showToast(e.message, 'error') } finally { setBusyAction(false); setMenuUserId(null) }
  }
  const doRemove = async () => {
    if (!removeTarget) return
    setBusyAction(true)
    try {
      const r = await fetch(`/api/users/${removeTarget.id}`, { method: 'DELETE' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha ao remover.')
      showToast('Usuário removido.')
      setRemoveTarget(null)
      await loadUsers()
    } catch (e) { showToast(e.message, 'error') } finally { setBusyAction(false) }
  }
  const doTransfer = async () => {
    if (!transferTargetId) return
    setBusyAction(true)
    try {
      const r = await fetch('/api/users/transfer-master', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: transferTargetId }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Falha ao transferir.')
      showToast('Master transferido com sucesso.')
      setTransferOpen(false); setTransferTargetId('')
      await loadUsers()
    } catch (e) { showToast(e.message, 'error') } finally { setBusyAction(false) }
  }
  const assignFunction = async (userId, roleId) => {
    setBusyAction(true)
    try {
      const body = roleId ? { user_id: userId, role_ids: [roleId], primary_role_id: roleId } : { user_id: userId, role_ids: [] }
      const r = await fetch('/api/roles/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Falha ao atribuir função.')
      showToast(roleId ? 'Função atribuída.' : 'Função removida.')
      await Promise.all([loadUsers(), loadNavPermissions?.()])
    } catch (e) { showToast(e.message, 'error') } finally { setBusyAction(false) }
  }
  const loadActivity = async (userId) => {
    setActivity({ loading: true, entries: [] })
    try { const r = await fetch(`/api/users/${userId}/activity`, { cache: 'no-store' }); const d = await r.json(); setActivity({ loading: false, entries: d.entries || [] }) }
    catch { setActivity({ loading: false, entries: [] }) }
  }
  useEffect(() => { if (isEditUserModalOpen && selectedManagedUser && modalTab === 'atividade') loadActivity(selectedManagedUser.id) }, [isEditUserModalOpen, modalTab, selectedManagedUser])

  // Permissions helpers (for the modal Permissões tab)
  const grantedFor = (userId, key) => { const p = navPermissions.find((x) => x.user_id === userId && x.page_key === key); return p ? p.granted : false }
  const applyPreset = (userId, preset) => { MODULES.concat(customPerms).forEach((m) => toggleNavPermission(userId, m.key, (preset.modules || []).includes(m.key))); showToast(`Predefinição "${preset.name}" aplicada.`) }
  const savePreset = async () => {
    const name = newPresetName.trim(); if (!name || !selectedManagedUser) return
    const modules = MODULES.concat(customPerms).filter((m) => grantedFor(selectedManagedUser.id, m.key)).map((m) => m.key)
    try {
      const r = await fetch('/api/permission-presets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, modules }) })
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Falha ao salvar.')
      setNewPresetName(''); await loadPresets(); showToast('Predefinição salva.')
    } catch (e) { showToast(e.message, 'error') }
  }
  const removePreset = async (id) => {
    try { const r = await fetch(`/api/permission-presets/${id}`, { method: 'DELETE' }); if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Falha.') } await loadPresets(); showToast('Predefinição removida.') }
    catch (e) { showToast(e.message, 'error') }
  }
  const addCustomPerm = () => {
    const label = newCustomLabel.trim(); if (!label) return
    const key = 'custom:' + label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')
    if (customPerms.some((c) => c.key === key)) { setNewCustomLabel(''); return }
    persistCustomPerms([...customPerms, { key, label }]); setNewCustomLabel(''); showToast('Permissão customizada criada.')
  }
  const removeCustomPerm = (key) => persistCustomPerms(customPerms.filter((c) => c.key !== key))

  const thStyle = { fontFamily: 'Inter', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(229,226,225,0.4)', fontWeight: 600 }
  const GRID = '2.2fr 1.1fr 1fr 1fr 1fr 44px'
  const modalTabDefs = [['dados', 'Dados', 'badge'], ['permissoes', 'Permissões', 'lock'], ['atividade', 'Atividade', 'history']]

  return (
    <section className="weekly-dashboard-panel users-management-layout" style={{ background: 'transparent', border: 'none' }}>
      {/* ── HERO ── */}
      <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderTop: '3px solid #26C281', borderRadius: 18, background: 'linear-gradient(135deg,rgba(38,194,129,0.07),rgba(38,194,129,0.01))', padding: '26px 28px' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#26C281', fontWeight: 700, marginBottom: 9 }}>Admin · Time e permissões</div>
            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(1.5rem,2.5vw,1.95rem)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>Usuários</h1>
            <p style={{ margin: '9px 0 0', color: 'rgba(229,226,225,0.62)', fontSize: '0.9rem', maxWidth: '52ch', lineHeight: 1.5 }}>Cadastre pessoas, defina papéis, libere módulos individualmente e acompanhe o acesso de cada membro.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
            {isMaster && (
              <button type="button" onClick={() => openInvite(true)} style={{ height: 42, padding: '0 16px', borderRadius: 99, border: '1px solid rgba(79,223,155,0.4)', background: 'rgba(79,223,155,0.1)', color: '#4fdf9b', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="mi" style={{ fontSize: 19 }}>shield_person</span>Novo Master
              </button>
            )}
            <button type="button" onClick={() => openInvite(false)} style={{ height: 42, padding: '0 18px', borderRadius: 99, border: 'none', background: '#26C281', color: '#04150d', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 24px rgba(38,194,129,0.28)' }}>
              <span className="mi" style={{ fontSize: 19 }}>person_add</span>Convidar usuário
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
        {[{ key: 'usuarios', label: 'Usuários', icon: 'group' }, { key: 'funcoes', label: 'Funções e Permissões', icon: 'shield' }].map((tab) => {
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
        <div style={{ marginTop: 18, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)', padding: 24 }}><RolesTab /></div>
      )}

      {teamSubTab === 'usuarios' && (
        <>
          {/* ── SEARCH + ROLE FILTERS ── */}
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 230, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="mi" style={{ position: 'absolute', left: 14, fontSize: 19, color: 'rgba(229,226,225,0.4)', pointerEvents: 'none' }}>search</span>
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Buscar por nome ou e-mail…" style={{ width: '100%', height: 44, padding: '0 14px 0 42px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: '#E5E2E1', fontFamily: 'inherit', fontSize: '0.88rem', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {roleChips.map(([k, label]) => {
                const active = roleFilter === k
                const count = k === 'todos' ? usersList.length : usersList.filter((u) => u.role === k).length
                const color = k === 'todos' ? '#26C281' : (ROLE_META[k]?.color || '#26C281')
                return (
                  <button key={k} type="button" onClick={() => setRoleFilter(k)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 10, fontFamily: 'Inter', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                      background: active ? hexA(color, 0.15) : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? hexA(color, 0.4) : 'rgba(255,255,255,0.06)'}`, color: active ? color : 'rgba(229,226,225,0.62)' }}>
                    {k !== 'todos' && <span style={{ width: 7, height: 7, borderRadius: 99, background: color }} />}
                    <span>{label}</span><span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.72, fontWeight: 700 }}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── TABLE ── */}
          {usersLoading ? (
            <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', padding: '44px 28px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Carregando time</div>
              <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.86rem', margin: 0 }}>Buscando os acessos salvos no Supabase.</p>
            </div>
          ) : visibleUsers.length > 0 ? (
            <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'visible', background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 14, alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={thStyle}>Membro</div>
                <div style={thStyle}>Papel</div>
                <div style={thStyle}>Módulos</div>
                <div style={thStyle}>Status</div>
                <div style={thStyle}>Último acesso</div>
                <div></div>
              </div>
              {visibleUsers.map((u) => {
                const sm = statusMetaOf(u)
                const acc = accessLabelOf(u)
                const chipColor = acc.color
                const chipLabel = acc.label
                // Permissão por página: internos enxergam todos os clientes; só o papel
                // 'cliente' (login externo) tem acesso restrito por cliente.
                const accessCount = getManagedUserAccessibleClientCount(u)
                const accessLabel = u.role === 'cliente' ? (accessCount > 0 ? `${accessCount} dashboard(s)` : 'Nenhum') : 'Todos'
                const name = u.full_name || u.email
                const isSelf = u.id === user?.id
                const st = statusOf(u)
                return (
                  <div key={'user-' + u.id} onClick={() => openEdit(u.id)}
                    style={{ position: 'relative', display: 'grid', gridTemplateColumns: GRID, gap: 14, alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: AVATAR_POOL[hashIdx(name)], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.82rem', color: '#fff', flex: 'none' }}>{initialsOf(name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontFamily: 'Inter', fontSize: '0.68rem', color: 'rgba(229,226,225,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{u.email}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px 4px 9px', borderRadius: 99, background: hexA(chipColor, 0.13), color: chipColor, border: `1px solid ${hexA(chipColor, 0.3)}`, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: chipColor }} />{chipLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(229,226,225,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{accessLabel}</div>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter', fontSize: '0.66rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px', borderRadius: 99, background: hexA(sm.color, 0.13), color: sm.color, border: `1px solid ${hexA(sm.color, 0.3)}`, whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: sm.color }} />{sm.label}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Inter', fontSize: '0.78rem', color: 'rgba(229,226,225,0.5)' }}>{fmtLastAccess(u.last_access)}</div>
                    <div style={{ textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <button type="button" title="Ações" onClick={() => setMenuUserId(menuUserId === u.id ? null : u.id)} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', background: menuUserId === u.id ? 'rgba(255,255,255,0.08)' : 'transparent', color: 'rgba(229,226,225,0.62)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="mi" style={{ fontSize: 18 }}>more_vert</span>
                      </button>
                      {menuUserId === u.id && (
                        <>
                          <div onClick={() => setMenuUserId(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                          <div style={{ position: 'absolute', top: 38, right: 0, zIndex: 41, width: 214, background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 16px 40px rgba(0,0,0,0.5)', overflow: 'hidden', padding: 5 }}>
                            {[
                              { icon: 'edit', label: 'Editar', onClick: () => openEdit(u.id) },
                              { icon: 'forward_to_inbox', label: 'Reenviar convite', onClick: () => doCredential(u.id, 'resend') },
                              { icon: 'key', label: 'Redefinir senha', onClick: () => doCredential(u.id, 'reset') },
                              st === 'inactive'
                                ? { icon: 'toggle_on', label: 'Ativar', onClick: () => doStatus(u, 'active') }
                                : { icon: 'toggle_off', label: 'Desativar', onClick: () => doStatus(u, 'inactive'), disabled: u.role === 'master' },
                              ...(isMaster && u.role !== 'master' ? [{ icon: 'shield_person', label: 'Transferir Master', onClick: () => { setTransferTargetId(u.id); setTransferOpen(true); setMenuUserId(null) } }] : []),
                              { icon: 'delete', label: 'Remover', danger: true, disabled: isSelf || (u.role === 'master' && masterCount <= 1), onClick: () => { setRemoveTarget(u); setMenuUserId(null) } },
                            ].map((item, i) => (
                              <button key={i} type="button" disabled={busyAction || item.disabled} onClick={item.onClick}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 8, border: 'none', background: 'transparent', cursor: item.disabled ? 'not-allowed' : 'pointer', color: item.disabled ? 'rgba(229,226,225,0.28)' : item.danger ? '#ef4444' : 'rgba(229,226,225,0.85)', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500, textAlign: 'left' }}
                                onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                                <span className="mi" style={{ fontSize: 17 }}>{item.icon}</span>{item.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, background: 'rgba(28,28,28,0.4)', padding: '44px 28px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 99, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}><span className="mi" style={{ fontSize: 28, color: 'rgba(229,226,225,0.4)' }}>group_off</span></div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Nenhum usuário encontrado</div>
              <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.86rem', margin: '0 auto 18px', maxWidth: '40ch' }}>Ajuste a busca/filtro ou convide um novo acesso.</p>
              <button type="button" onClick={() => openInvite(false)} style={{ height: 40, padding: '0 18px', borderRadius: 99, border: 'none', background: '#26C281', color: '#04150d', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}><span className="mi" style={{ fontSize: 18 }}>person_add</span>Convidar usuário</button>
            </div>
          )}
        </>
      )}

      {/* ── CREATE MODAL ── */}
      {isCreateUserModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateUserModalOpen(false)}><div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><div><h3>{userForm.role === 'master' ? 'Novo Master' : 'Convidar usuário'}</h3><p>Crie um acesso e repasse a senha temporária para a pessoa.</p></div><button type="button" className="modal-close" onClick={() => setIsCreateUserModalOpen(false)} aria-label="Fechar"><i className="bx bx-x"></i></button></div>
          <form onSubmit={handleCreateUser}>
            {createUserError && <div className="form-alert">{createUserError}</div>}
            <div className="form-grid user-admin-grid">
              <div className="input-group"><label>Nome</label><input type="text" value={userForm.fullName} onChange={(e) => setUserForm((c) => ({ ...c, fullName: e.target.value }))} placeholder="Nome completo" /></div>
              <div className="input-group"><label>E-mail</label><input type="email" value={userForm.email} onChange={(e) => setUserForm((c) => ({ ...c, email: e.target.value }))} placeholder="usuario@empresa.com" /></div>
              <div className="input-group"><label>Tipo de acesso</label>
                <select className="client-select-input"
                  value={userForm.role === 'master' ? 'master' : userForm.role === 'cliente' ? 'cliente' : 'interno'}
                  onChange={(e) => { const v = e.target.value; setUserForm((c) => ({ ...c, role: v === 'interno' ? 'visualizador' : v, roleId: v === 'interno' ? c.roleId : '' })) }}>
                  {isMaster && <option value="master">Master — acesso total</option>}
                  <option value="interno">Interno — acesso por função/páginas</option>
                  <option value="cliente">Cliente — login externo</option>
                </select>
              </div>
              {userForm.role !== 'master' && userForm.role !== 'cliente' && (
                <div className="input-group"><label>Função</label>
                  <select className="client-select-input" value={userForm.roleId || ''} onChange={(e) => setUserForm((c) => ({ ...c, roleId: e.target.value }))}>
                    <option value="">Sem função (defino depois)</option>
                    {rolesList.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            {/* Permissão por cliente removida: internos enxergam todos os clientes.
                Vínculo de login de cliente (papel 'cliente') é feito em Editar usuário. */}
            <div className="input-group"><label>Acesso</label><div style={{ fontSize: '0.8rem', color: 'rgba(229,226,225,0.55)', lineHeight: 1.5, padding: '4px 2px' }}>A função define as <strong style={{ color: '#4fdf9b' }}>páginas liberadas</strong>. Você pode ajustar páginas específicas depois em Editar usuário → Permissões (isso torna o acesso <strong style={{ color: '#4fdf9b' }}>Personalizado</strong>).</div></div>
            <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsCreateUserModalOpen(false)}>Fechar</button><button type="submit" className="btn btn-primary" disabled={savingUser}>{savingUser ? 'Criando...' : 'Gerar convite'}</button></div>
          </form>
        </div></div>
      )}

      {/* ── POP-UP: DADOS DE ACESSO DO USUÁRIO CONVIDADO ── */}
      {createdUserInvite && (() => {
        const loginUrl = (() => {
          const raw = createdUserInvite.loginUrl || '/login'
          if (/^https?:\/\//i.test(raw)) return raw
          if (typeof window !== 'undefined') return `${window.location.origin}${raw}`
          return raw
        })()
        const fields = [
          { key: 'email', label: 'Login (e-mail)', value: createdUserInvite.email, icon: 'mail' },
          { key: 'password', label: 'Senha temporária', value: createdUserInvite.temporaryPassword, icon: 'key', mono: true },
          { key: 'url', label: 'Link de acesso', value: loginUrl, icon: 'link' },
        ]
        const copyAll = () => copyText(
          `Login: ${createdUserInvite.email}\nSenha: ${createdUserInvite.temporaryPassword}\nAcesse em: ${loginUrl}`,
          'Dados de acesso'
        )
        return (
          <div className="modal-overlay" onClick={() => setCreatedUserInvite(null)}>
            <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: 'rgba(38,194,129,0.14)', border: '1px solid rgba(38,194,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="mi" style={{ fontSize: 24, color: '#4fdf9b' }}>mark_email_read</span>
                  </span>
                  <div>
                    <h3>Acesso criado</h3>
                    <p>Repasse estes dados para <strong style={{ color: '#E5E2E1' }}>{createdUserInvite.email}</strong> fazer o primeiro login.</p>
                  </div>
                </div>
                <button type="button" className="modal-close" onClick={() => setCreatedUserInvite(null)} aria-label="Fechar"><i className="bx bx-x"></i></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {fields.map((field) => (
                  <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="mi" style={{ fontSize: 19, color: 'rgba(229,226,225,0.42)', flexShrink: 0 }}>{field.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Inter', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(229,226,225,0.4)', fontWeight: 600, marginBottom: 3 }}>{field.label}</div>
                      <div style={{ fontSize: field.mono ? '0.95rem' : '0.86rem', fontFamily: field.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'inherit', color: '#E5E2E1', fontWeight: field.mono ? 700 : 500, letterSpacing: field.mono ? '0.02em' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{field.value}</div>
                    </div>
                    <button type="button" onClick={() => copyText(field.value, field.label)} title={`Copiar ${field.label.toLowerCase()}`}
                      style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(229,226,225,0.75)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(38,194,129,0.14)'; e.currentTarget.style.color = '#4fdf9b'; e.currentTarget.style.borderColor = 'rgba(38,194,129,0.3)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(229,226,225,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
                      <span className="mi" style={{ fontSize: 17 }}>content_copy</span>
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 16 }}>
                <span className="mi" style={{ fontSize: 17, color: '#f59e0b', flexShrink: 0, marginTop: 1 }}>info</span>
                <span style={{ fontSize: '0.78rem', color: 'rgba(229,226,225,0.75)', lineHeight: 1.5 }}>Esta senha só aparece agora. Copie antes de fechar — depois é possível gerar uma nova senha em <strong>Editar usuário</strong>.</span>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setCreatedUserInvite(null)}>Fechar</button>
                <button type="button" className="btn btn-primary" onClick={copyAll}><span className="mi" style={{ fontSize: 17, marginRight: 6 }}>content_copy</span>Copiar tudo</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── EDIT MODAL (3 tabs) ── */}
      {isEditUserModalOpen && selectedManagedUser && (
        <div className="modal-overlay" onClick={() => setIsEditUserModalOpen(false)}><div className="modal-card glass-panel modal-card-wide" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><div><h3>{selectedManagedUser.full_name || selectedManagedUser.email}</h3><p>{selectedManagedUser.email}</p></div><button type="button" className="modal-close" onClick={() => setIsEditUserModalOpen(false)} aria-label="Fechar"><i className="bx bx-x"></i></button></div>
          {editUserError && <div className="form-alert">{editUserError}</div>}

          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 18 }}>
            {modalTabDefs.map(([k, label, icon]) => (
              <button key={k} type="button" onClick={() => setModalTab(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 13px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, borderBottom: `2px solid ${modalTab === k ? '#26C281' : 'transparent'}`, color: modalTab === k ? '#E5E2E1' : 'rgba(229,226,225,0.4)' }}>
                <span className="mi" style={{ fontSize: 16 }}>{icon}</span>{label}
              </button>
            ))}
          </div>

          {credentialResult && (
            <div className="form-success" style={{ marginBottom: 14 }}>Senha temporária de {credentialResult.email}: <strong>{credentialResult.temporaryPassword}</strong> — repasse com segurança.</div>
          )}

          {/* DADOS */}
          {modalTab === 'dados' && (
            <>
              {/* Função (forma principal de atribuição) — só para usuários internos */}
              {selectedManagedUser.role !== 'master' && selectedManagedUser.role !== 'cliente' && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(229,226,225,0.4)', fontWeight: 600, marginBottom: 9 }}>Função</div>
                  {rolesList.length ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {rolesList.map((role) => {
                        const active = selectedManagedUser.assignedRole?.id === role.id
                        const color = /^#/.test(role.color || '') ? role.color : '#26C281'
                        return (
                          <button key={role.id} type="button" disabled={busyAction} onClick={() => assignFunction(selectedManagedUser.id, role.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, cursor: busyAction ? 'default' : 'pointer',
                              background: active ? hexA(color, 0.16) : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? hexA(color, 0.5) : 'rgba(255,255,255,0.08)'}`, color: active ? color : 'rgba(229,226,225,0.7)' }}>
                            {role.icon && <i className={`bx ${role.icon}`} style={{ fontSize: 15 }} />}
                            {role.name}
                            {active && <span className="mi" style={{ fontSize: 16 }}>check</span>}
                          </button>
                        )
                      })}
                      <button type="button" disabled={busyAction || !selectedManagedUser.assignedRole} onClick={() => assignFunction(selectedManagedUser.id, null)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '1px dashed rgba(255,255,255,0.14)', color: 'rgba(229,226,225,0.45)' }}>
                        Sem função
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'rgba(229,226,225,0.5)', margin: 0 }}>Nenhuma função criada ainda. Crie funções na aba <strong style={{ color: '#26C281' }}>Funções e Permissões</strong>.</p>
                  )}
                  <p style={{ fontSize: '0.74rem', color: 'rgba(229,226,225,0.4)', margin: '8px 0 0' }}>A função define o nível de acesso do usuário no app. É salva na hora.</p>
                </div>
              )}
              <div className="form-grid user-admin-grid">
                <div className="input-group"><label>Nome</label><input type="text" value={selectedManagedUser.full_name || ''} onChange={(e) => handleManagedUserChange(selectedManagedUser.id, (i) => ({ ...i, full_name: e.target.value }))} /></div>
                <div className="input-group"><label>E-mail</label><input type="email" value={selectedManagedUser.email || ''} disabled /></div>
                {selectedManagedUser.role === 'master' ? (
                  <div className="input-group"><label>Tipo de acesso</label><input type="text" value="Master" disabled /></div>
                ) : (
                  <div className="input-group"><label>Tipo de acesso</label>
                    <select className="client-select-input" value={selectedManagedUser.role === 'cliente' ? 'cliente' : 'interno'} onChange={(e) => handleManagedUserChange(selectedManagedUser.id, (i) => ({ ...i, role: e.target.value === 'cliente' ? 'cliente' : 'visualizador' }))}>
                      <option value="interno">Interno — acesso por função/páginas</option>
                      <option value="cliente">Cliente — login externo</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-foot"><span className="form-note">Salvo no Supabase e aplicado no próximo login do usuário.</span><div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setIsEditUserModalOpen(false)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={() => handleUpdateUser(selectedManagedUser)}>Salvar</button></div></div>
            </>
          )}

          {/* PERMISSÕES */}
          {modalTab === 'permissoes' && (
            <div>
              {selectedManagedUser.role === 'master' ? (
                <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(38,194,129,0.08)', border: '1px solid rgba(38,194,129,0.2)', color: '#4fdf9b', fontSize: '0.9rem', fontWeight: 600 }}>Master tem acesso total a todos os módulos.</div>
              ) : (
                <>
                  {/* Banner: acesso personalizado (páginas divergem da função atribuída) */}
                  {selectedManagedUser.role !== 'cliente' && (() => {
                    const acc = accessLabelOf(selectedManagedUser)
                    if (!acc.custom) return null
                    const ar = selectedManagedUser.assignedRole
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '11px 14px', borderRadius: 12, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
                        <span className="mi" style={{ fontSize: 20, color: '#a78bfa', flexShrink: 0 }}>tune</span>
                        <span style={{ flex: 1, fontSize: '0.82rem', color: 'rgba(229,226,225,0.85)', lineHeight: 1.5 }}>
                          <strong style={{ color: '#c4b5fd' }}>Acesso Personalizado</strong> — as páginas deste usuário foram ajustadas manualmente{ar ? <> e divergem da função <strong>“{ar.name}”</strong></> : ''}.
                        </span>
                        {ar && (
                          <button type="button" disabled={busyAction} onClick={() => assignFunction(selectedManagedUser.id, ar.id)}
                            style={{ flexShrink: 0, height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.14)', color: '#c4b5fd', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 600, cursor: busyAction ? 'default' : 'pointer' }}>
                            Voltar para a função
                          </button>
                        )}
                      </div>
                    )
                  })()}
                  {/* Predefinições */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(229,226,225,0.4)', fontWeight: 600, marginBottom: 9 }}>Predefinições</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {presets.map((p) => (
                        <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 6px 5px 12px', borderRadius: 99, background: 'rgba(38,194,129,0.1)', border: '1px solid rgba(38,194,129,0.25)' }}>
                          <button type="button" onClick={() => applyPreset(selectedManagedUser.id, p)} title="Aplicar" style={{ background: 'none', border: 'none', color: '#26C281', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 600 }}>{p.name}</button>
                          <button type="button" onClick={() => removePreset(p.id)} title="Remover predefinição" style={{ background: 'none', border: 'none', color: 'rgba(229,226,225,0.4)', cursor: 'pointer', display: 'inline-flex' }}><span className="mi" style={{ fontSize: 15 }}>close</span></button>
                        </span>
                      ))}
                      {!presets.length && <span style={{ fontSize: '0.78rem', color: 'rgba(229,226,225,0.35)' }}>Nenhuma predefinição salva ainda.</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="Nome da predefinição…" style={{ flex: 1, maxWidth: 260, height: 36, padding: '0 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#E5E2E1', fontFamily: 'inherit', fontSize: '0.82rem', outline: 'none' }} />
                      <button type="button" onClick={savePreset} disabled={!newPresetName.trim()} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 14px' }}><span className="mi" style={{ fontSize: 15, marginRight: 4, verticalAlign: 'middle' }}>bookmark_add</span>Salvar seleção atual</button>
                    </div>
                  </div>

                  {/* Módulos (permissão por página, agrupados como na sidebar) */}
                  <div style={{ fontFamily: 'Inter', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(229,226,225,0.4)', fontWeight: 600, marginBottom: 9 }}>Páginas liberadas</div>
                  {(() => {
                    const renderToggle = (m) => {
                      const granted = grantedFor(selectedManagedUser.id, m.key)
                      const isCustom = m.key.startsWith('custom:')
                      return (
                        <label key={m.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: `1px solid ${granted ? 'rgba(38,194,129,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{m.label}{isCustom && <span onClick={(e) => { e.preventDefault(); removeCustomPerm(m.key) }} className="mi" style={{ fontSize: 14, color: 'rgba(229,226,225,0.35)', cursor: 'pointer' }}>close</span>}</span>
                          <div style={{ position: 'relative', width: 38, height: 22, flexShrink: 0 }}>
                            <span onClick={(e) => { e.preventDefault(); toggleNavPermission(selectedManagedUser.id, m.key, !granted) }} style={{ display: 'block', width: 38, height: 22, borderRadius: 11, background: granted ? '#26C281' : 'rgba(255,255,255,0.15)', transition: 'background .2s', cursor: 'pointer' }}>
                              <span style={{ display: 'block', width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: granted ? 19 : 3, transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}></span>
                            </span>
                          </div>
                        </label>
                      )
                    }
                    const groups = []
                    MODULES.forEach((m) => {
                      const g = m.group || 'Outros'
                      const found = groups.find((x) => x.name === g)
                      if (found) found.items.push(m)
                      else groups.push({ name: g, items: [m] })
                    })
                    if (customPerms.length) groups.push({ name: 'Customizadas', items: customPerms })
                    return groups.map((g) => (
                      <div key={g.name} style={{ marginBottom: 12 }}>
                        <div style={{ fontFamily: 'Inter', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(38,194,129,0.7)', fontWeight: 700, margin: '0 0 6px 2px' }}>{g.name}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
                          {g.items.map(renderToggle)}
                        </div>
                      </div>
                    ))
                  })()}

                  {/* Permissão customizada */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input value={newCustomLabel} onChange={(e) => setNewCustomLabel(e.target.value)} placeholder="Nova permissão customizada…" style={{ flex: 1, maxWidth: 260, height: 36, padding: '0 12px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#E5E2E1', fontFamily: 'inherit', fontSize: '0.82rem', outline: 'none' }} />
                    <button type="button" onClick={addCustomPerm} disabled={!newCustomLabel.trim()} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '5px 14px' }}><span className="mi" style={{ fontSize: 15, marginRight: 4, verticalAlign: 'middle' }}>add</span>Criar</button>
                  </div>

                  {/* Acesso por cliente: só para logins de cliente (papel 'cliente').
                      Usuários internos enxergam todos os clientes — a permissão é por página. */}
                  {selectedManagedUser.role === 'cliente' && (() => {
                    const currentAccess = selectedManagedUser.clientAccess || []
                    const selectedCount = dashboardEligibleClients.filter((c) => currentAccess.some((a) => a.client_id === c.id)).length
                    const filteredClients = editUserClientSearch.trim()
                      ? dashboardEligibleClients.filter((c) => c.name.toLowerCase().includes(editUserClientSearch.toLowerCase()))
                      : dashboardEligibleClients
                    return (
                      <div className="client-access-section" style={{ marginTop: 20 }}>
                        <div className="client-access-top">
                          <label>Dashboards de clientes</label>
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
                          }) : <div className="client-access-empty">{editUserClientSearch ? 'Nenhum cliente encontrado.' : 'Cadastre clientes antes de liberar dashboards.'}</div>}
                        </div>
                        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-primary" onClick={() => handleUpdateUser(selectedManagedUser)}>Salvar permissões</button>
                        </div>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )}

          {/* ATIVIDADE */}
          {modalTab === 'atividade' && (
            <div>
              {activity.loading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(229,226,225,0.5)', fontSize: '0.86rem' }}>Carregando atividade…</div>
              ) : activity.entries.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activity.entries.map((ev) => (
                    <div key={ev.id} style={{ display: 'flex', gap: 12, padding: '11px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(38,194,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span className="mi" style={{ fontSize: 16, color: '#26C281' }}>bolt</span></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ev.action}</div>
                        <div style={{ fontSize: '0.76rem', color: 'rgba(229,226,225,0.5)', marginTop: 1 }}>{ev.detail}{ev.actor_name ? ` · ${ev.actor_name}` : ''}</div>
                      </div>
                      <div style={{ fontFamily: 'Inter', fontSize: '0.7rem', color: 'rgba(229,226,225,0.35)', whiteSpace: 'nowrap' }}>{new Date(ev.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(229,226,225,0.45)', fontSize: '0.86rem' }}>Nenhuma atividade registrada ainda.</div>
              )}
            </div>
          )}
        </div></div>
      )}

      {/* ── REMOVE CONFIRM ── */}
      {removeTarget && (
        <div className="modal-overlay" onClick={() => setRemoveTarget(null)}><div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
          <div style={{ textAlign: 'center', padding: '8px 6px' }}>
            <div style={{ width: 60, height: 60, borderRadius: 99, background: 'rgba(239,68,68,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><span className="mi" style={{ fontSize: 30, color: '#ef4444' }}>person_remove</span></div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>Remover usuário</h3>
            <p style={{ color: 'rgba(229,226,225,0.62)', fontSize: '0.88rem', margin: '0 auto 22px', maxWidth: '38ch', lineHeight: 1.5 }}>Tem certeza que deseja remover <strong style={{ color: '#E5E2E1' }}>{removeTarget.full_name || removeTarget.email}</strong>? Essa ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setRemoveTarget(null)}>Cancelar</button>
              <button type="button" onClick={doRemove} disabled={busyAction} style={{ height: 40, padding: '0 20px', borderRadius: 99, border: 'none', background: '#ef4444', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>{busyAction ? 'Removendo…' : 'Remover'}</button>
            </div>
          </div>
        </div></div>
      )}

      {/* ── TRANSFER MASTER ── */}
      {transferOpen && (
        <div className="modal-overlay" onClick={() => setTransferOpen(false)}><div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
          <div className="modal-header"><div><h3>Transferir Master</h3><p>O usuário selecionado passa a ser Master. Você é rebaixado a Admin (a conta master principal permanece Master).</p></div><button type="button" className="modal-close" onClick={() => setTransferOpen(false)} aria-label="Fechar"><i className="bx bx-x"></i></button></div>
          <div className="input-group"><label>Novo Master</label>
            <select className="client-select-input" value={transferTargetId} onChange={(e) => setTransferTargetId(e.target.value)}>
              <option value="">Selecione um usuário</option>
              {usersList.filter((u) => u.role !== 'master').map((u) => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setTransferOpen(false)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={doTransfer} disabled={busyAction || !transferTargetId}>{busyAction ? 'Transferindo…' : 'Transferir Master'}</button></div>
        </div></div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderRadius: 12, background: toast.type === 'error' ? 'rgba(45,18,21,0.96)' : 'rgba(10,32,22,0.96)', border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.4)' : 'rgba(38,194,129,0.4)'}`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', maxWidth: 380 }}>
          <span className="mi" style={{ fontSize: 20, color: toast.type === 'error' ? '#ff6b6b' : '#4fdf9b' }}>{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          <span style={{ fontSize: '0.85rem', color: '#E5E2E1', lineHeight: 1.4 }}>{toast.msg}</span>
        </div>
      )}
    </section>
  )
}
