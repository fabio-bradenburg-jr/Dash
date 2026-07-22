'use client'
import { useState, useEffect, useCallback } from 'react'
import CustomSelect from '@/components/dashboard/CustomSelect'
import { PAGE_MODULES, ALL_PAGE_KEYS, pagesByGroup } from '@/lib/access/pages'

const GREEN = '#26c281'

// Modelo "função = páginas": cada função libera um conjunto de páginas do app.
// O catálogo de páginas é a fonte única em src/lib/access/pages.js.
const PAGE_GROUPS = pagesByGroup()

const ICON_OPTIONS = [
  'bx-user', 'bx-shield', 'bx-crown', 'bx-user-check', 'bx-trending-up',
  'bx-dollar', 'bx-cog', 'bx-headphone', 'bx-briefcase', 'bx-star',
  'bx-lock', 'bx-key', 'bx-group', 'bx-buildings', 'bx-laptop',
]

const PRESET_COLORS = [
  '#26c281','#3b82f6','#ef4444','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#7b8794',
]

// ── Shared styles (brandkit Kinetic Emerald) ──────────────────────
const S = {
  panel: { background: 'rgba(28,28,28,0.4)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20 },
  label: { fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'rgba(232,230,228,0.42)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 },
  input: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '9px 11px', color: '#E8E6E4', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' },
  btn: (variant = 'primary') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    border: variant === 'primary' ? 'none' : `1px solid ${variant === 'danger' ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
    background: variant === 'primary' ? GREEN : variant === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
    color: variant === 'primary' ? '#00301c' : variant === 'danger' ? '#ef4444' : 'rgba(232,230,228,0.7)',
    boxShadow: variant === 'primary' ? '0 8px 24px rgba(38,194,129,0.28)' : 'none',
  }),
}

// ── Checkbox ─────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label, indeterminate }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(232,230,228,0.82)' }}>
      <div
        onClick={e => { e.preventDefault(); onChange(!checked) }}
        style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          background: checked ? GREEN : indeterminate ? GREEN + '55' : 'rgba(255,255,255,0.06)',
          border: checked || indeterminate ? 'none' : '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
      >
        {checked && <i className="bx bx-check" style={{ fontSize: 12, color: '#00301c' }} />}
        {!checked && indeterminate && <i className="bx bx-minus" style={{ fontSize: 12, color: '#00301c' }} />}
      </div>
      {label && <span>{label}</span>}
    </label>
  )
}

// ── Permission group ───────────────────────────────────────────────
function PermissionGroup({ module: mod, permissions, selectedKeys, onToggle }) {
  const keys = permissions.map(p => p.key)
  const checkedCount = keys.filter(k => selectedKeys.includes(k)).length
  const allChecked = checkedCount === keys.length
  const someChecked = checkedCount > 0 && !allChecked

  function toggleAll() {
    if (allChecked) {
      onToggle(keys, false)
    } else {
      onToggle(keys, true)
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}
        onClick={toggleAll}
      >
        <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(232,230,228,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{mod}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(232,230,228,0.4)' }}>{checkedCount}/{keys.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, paddingLeft: 4 }}>
        {permissions.map(p => (
          <Checkbox
            key={p.key}
            checked={selectedKeys.includes(p.key)}
            onChange={v => onToggle([p.key], v)}
            label={p.label}
          />
        ))}
      </div>
    </div>
  )
}

// ── Role Modal ────────────────────────────────────────────────────
function RoleModal({ role, onClose, onSaved }) {
  const isEdit = !!role?.id
  const [form, setForm] = useState({
    name: role?.name || '',
    description: role?.description || '',
    color: role?.color || GREEN,
    icon: role?.icon || 'bx-user',
    is_active: role?.is_active !== false,
    pages: role?.pages || [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function togglePerms(keys, value) {
    setForm(prev => {
      const set = new Set(prev.pages)
      keys.forEach(k => value ? set.add(k) : set.delete(k))
      return { ...prev, pages: Array.from(set) }
    })
  }

  function selectAll() { setForm(prev => ({ ...prev, pages: [...ALL_PAGE_KEYS] })) }
  function clearAll() { setForm(prev => ({ ...prev, pages: [] })) }

  async function handleSave() {
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setSaving(true); setError('')
    try {
      const method = isEdit ? 'PUT' : 'POST'
      const body = isEdit ? { id: role.id, ...form } : form
      const res = await fetch('/api/roles', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar')
      onSaved(json.role)
      onClose()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, width: '100%', maxWidth: 680, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', marginTop: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: form.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`bx ${form.icon}`} style={{ fontSize: 16, color: form.color }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#E8E6E4' }}>{isEdit ? 'Editar Função' : 'Nova Função'}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,230,228,0.45)' }}><i className="bx bx-x" style={{ fontSize: 20 }} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Name + Active */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={S.label}>Nome da função *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Gestor de Tráfego" style={S.input} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: form.is_active ? GREEN : 'rgba(232,230,228,0.45)', fontWeight: 600 }}>
              <div
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                style={{ width: 36, height: 20, borderRadius: 999, background: form.is_active ? GREEN : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                <div style={{ position: 'absolute', top: 3, left: form.is_active ? 19 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              {form.is_active ? 'Ativa' : 'Inativa'}
            </label>
          </div>

          {/* Description */}
          <div>
            <label style={S.label}>Descrição</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Descreva as responsabilidades desta função..." rows={2} style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
          </div>

          {/* Color + Icon */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>Cor</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                    style={{ width: 26, height: 26, borderRadius: 6, background: c, border: form.color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                ))}
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                  style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', padding: 0, background: 'none' }} title="Cor personalizada" />
              </div>
            </div>
            <div>
              <label style={S.label}>Ícone</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setForm(p => ({ ...p, icon: ic }))}
                    style={{ width: 30, height: 30, borderRadius: 6, background: form.icon === ic ? form.color + '33' : 'rgba(255,255,255,0.05)', border: form.icon === ic ? `1px solid ${form.color}` : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bx ${ic}`} style={{ fontSize: 14, color: form.icon === ic ? form.color : 'rgba(232,230,228,0.45)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Páginas liberadas — o acesso da função é definido pelas páginas do app */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={S.label}>Páginas liberadas ({form.pages.length}/{ALL_PAGE_KEYS.length})</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={selectAll} style={{ ...S.btn('secondary'), padding: '4px 10px', fontSize: 11 }}>Selecionar todas</button>
                <button type="button" onClick={clearAll} style={{ ...S.btn('secondary'), padding: '4px 10px', fontSize: 11 }}>Limpar</button>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 14px', maxHeight: 340, overflowY: 'auto' }}>
              {PAGE_GROUPS.map(g => (
                <PermissionGroup
                  key={g.name}
                  module={g.name}
                  permissions={g.items}
                  selectedKeys={form.pages}
                  onToggle={togglePerms}
                />
              ))}
            </div>
          </div>

          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button type="button" onClick={onClose} style={S.btn('secondary')}>Cancelar</button>
          <button type="button" onClick={handleSave} disabled={saving} style={S.btn()}>
            {saving && <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 14 }} />}
            {isEdit ? 'Salvar alterações' : 'Criar função'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirmation Modal ──────────────────────────────────────
function DeleteRoleModal({ role, allRoles, onClose, onDeleted }) {
  const [transferTo, setTransferTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const others = allRoles.filter(r => r.id !== role.id)

  async function handleDelete() {
    setSaving(true); setError('')
    try {
      const params = new URLSearchParams({ id: role.id })
      if (transferTo) params.set('transfer_to', transferTo)
      const res = await fetch(`/api/roles?${params}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao excluir')
      onDeleted(role.id)
      onClose()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 200001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#111113', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="bx bx-trash" style={{ fontSize: 18, color: '#ef4444' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#E8E6E4' }}>Excluir função</div>
            <div style={{ fontSize: 13, color: 'rgba(232,230,228,0.45)', marginTop: 2 }}>Esta ação não pode ser desfeita.</div>
          </div>
        </div>

        {role.user_count > 0 ? (
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#fca5a5' }}>
              Existem <strong>{role.user_count}</strong> usuário(s) utilizando a função <strong>&ldquo;{role.name}&rdquo;</strong>.
            </p>
            <label style={S.label}>Transferir usuários para:</label>
            <CustomSelect
              options={[{ value: '', label: 'Selecionar função...' }, ...others.map(r => ({ value: r.id, label: r.name }))]}
              value={transferTo}
              onChange={setTransferTo}
              placeholder="Selecionar função..."
              icon="bx-transfer"
            />
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(232,230,228,0.6)', marginBottom: 14 }}>
            Tem certeza que deseja excluir a função <strong style={{ color: '#E8E6E4' }}>&ldquo;{role.name}&rdquo;</strong>?
          </p>
        )}

        {error && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} style={S.btn('secondary')}>Cancelar</button>
          <button type="button" onClick={handleDelete} disabled={saving || (role.user_count > 0 && !transferTo)} style={S.btn('danger')}>
            {saving && <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 14 }} />}
            Excluir função
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Role Card ──────────────────────────────────────────────────────
function RoleCard({ role, onEdit, onDelete }) {
  const pct = ALL_PAGE_KEYS.length > 0 ? Math.round((role.pages?.length || 0) / ALL_PAGE_KEYS.length * 100) : 0

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${role.color}22`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: role.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bx ${role.icon || 'bx-user'}`} style={{ fontSize: 18, color: role.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#E8E6E4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role.name}</span>
            {!role.is_active && <span style={{ fontSize: 10, background: 'rgba(100,116,139,0.2)', color: 'rgba(232,230,228,0.45)', borderRadius: 4, padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>Inativa</span>}
            {role.is_system && <span style={{ fontSize: 10, background: role.color + '22', color: role.color, borderRadius: 4, padding: '1px 6px', fontWeight: 700, flexShrink: 0 }}>Sistema</span>}
          </div>
          {role.description && <p style={{ fontSize: 11, color: 'rgba(232,230,228,0.45)', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{role.description}</p>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'rgba(232,230,228,0.4)', marginBottom: 3 }}>Páginas — {pct}%</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 999 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: role.color, borderRadius: 999, transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#E8E6E4', lineHeight: 1 }}>{role.user_count || 0}</div>
          <div style={{ fontSize: 10, color: 'rgba(232,230,228,0.4)' }}>usuário(s)</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button type="button" onClick={() => onEdit(role)} style={{ ...S.btn('secondary'), flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}>
          <i className="bx bx-edit-alt" style={{ fontSize: 13 }} /> Editar
        </button>
        {!role.is_system && (
          <button type="button" onClick={() => onDelete(role)} style={{ ...S.btn('danger'), padding: '6px 10px', fontSize: 12 }}>
            <i className="bx bx-trash" style={{ fontSize: 13 }} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main RolesTab ─────────────────────────────────────────────────
export default function RolesTab() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [deletingRole, setDeletingRole] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/roles')
      const json = await res.json()
      setRoles(json.roles || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function handleSaved(role) {
    setRoles(prev => {
      const idx = prev.findIndex(r => r.id === role.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = role; return next }
      return [...prev, role]
    })
  }

  function handleDeleted(id) {
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  const filtered = roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
  const active = filtered.filter(r => r.is_active)
  const inactive = filtered.filter(r => !r.is_active)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#E8E6E4' }}>Funções e Permissões</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(232,230,228,0.45)' }}>Crie funções e escolha quais páginas cada uma libera. Atribua a função ao usuário na aba Usuários.</p>
        </div>
        <button type="button" onClick={() => { setEditingRole(null); setShowModal(true) }} style={S.btn()}>
          <i className="bx bx-plus" style={{ fontSize: 15 }} /> Nova Função
        </button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 12px', marginBottom: 20, maxWidth: 320 }}>
        <i className="bx bx-search" style={{ fontSize: 15, color: 'rgba(232,230,228,0.4)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar função..." style={{ background: 'none', border: 'none', outline: 'none', color: '#E8E6E4', fontSize: 13, flex: 1 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(232,230,228,0.4)' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 28 }} />
          <p style={{ marginTop: 12 }}>Carregando funções...</p>
        </div>
      ) : roles.length === 0 ? (
        <div style={{ ...S.panel, textAlign: 'center', padding: 48 }}>
          <i className="bx bx-user-circle" style={{ fontSize: 36, color: 'rgba(232,230,228,0.3)' }} />
          <p style={{ color: 'rgba(232,230,228,0.4)', marginTop: 12 }}>Nenhuma função cadastrada.</p>
          <button type="button" onClick={() => { setEditingRole(null); setShowModal(true) }} style={{ ...S.btn(), marginTop: 12 }}>
            <i className="bx bx-plus" /> Criar primeira função
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(232,230,228,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Funções ativas — {active.length}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {active.map(r => (
                  <RoleCard key={r.id} role={r}
                    onEdit={role => { setEditingRole(role); setShowModal(true) }}
                    onDelete={role => setDeletingRole(role)}
                  />
                ))}
              </div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(232,230,228,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Funções inativas — {inactive.length}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {inactive.map(r => (
                  <RoleCard key={r.id} role={r}
                    onEdit={role => { setEditingRole(role); setShowModal(true) }}
                    onDelete={role => setDeletingRole(role)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <RoleModal
          role={editingRole}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
      {deletingRole && (
        <DeleteRoleModal
          role={deletingRole}
          allRoles={roles}
          onClose={() => setDeletingRole(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
