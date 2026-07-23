'use client'
import { PAGE_MODULES, ALL_PAGE_KEYS, pagesByGroup } from '@/lib/access/pages'

// Grade de seleção de páginas (acesso por página, direto no usuário).
// selectedKeys: string[]; onToggle(keys: string[], granted: boolean).
const GREEN = '#26c281'
const PAGE_GROUPS = pagesByGroup()

function Checkbox({ checked, onChange, label, indeterminate, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'default' : 'pointer', fontSize: 13, color: 'rgba(232,230,228,0.82)' }}>
      <div
        onClick={(e) => { e.preventDefault(); if (!disabled) onChange(!checked) }}
        style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          background: checked ? GREEN : indeterminate ? GREEN + '55' : 'rgba(255,255,255,0.06)',
          border: checked || indeterminate ? 'none' : '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'default' : 'pointer', transition: 'background 0.15s',
        }}
      >
        {checked && <i className="bx bx-check" style={{ fontSize: 12, color: '#00301c' }} />}
        {!checked && indeterminate && <i className="bx bx-minus" style={{ fontSize: 12, color: '#00301c' }} />}
      </div>
      {label && <span>{label}</span>}
    </label>
  )
}

function Group({ name, items, selectedKeys, onToggle, disabled }) {
  const keys = items.map((p) => p.key)
  const checkedCount = keys.filter((k) => selectedKeys.includes(k)).length
  const allChecked = checkedCount === keys.length
  const someChecked = checkedCount > 0 && !allChecked
  const toggleAll = () => onToggle(keys, !allChecked)

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: disabled ? 'default' : 'pointer' }}
        onClick={() => { if (!disabled) toggleAll() }}
      >
        <Checkbox checked={allChecked} indeterminate={someChecked} onChange={toggleAll} disabled={disabled} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(232,230,228,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{name}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(232,230,228,0.4)' }}>{checkedCount}/{keys.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, paddingLeft: 4 }}>
        {items.map((p) => (
          <Checkbox key={p.key} checked={selectedKeys.includes(p.key)} onChange={(v) => onToggle([p.key], v)} label={p.label} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}

export default function PagePermissionsPicker({ selectedKeys = [], onToggle, disabled = false }) {
  const label = { fontFamily: 'Inter', fontSize: 11, fontWeight: 600, color: 'rgba(232,230,228,0.42)', textTransform: 'uppercase', letterSpacing: '0.1em' }
  const btn = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(232,230,228,0.7)' }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <span style={label}>Páginas liberadas ({selectedKeys.length}/{ALL_PAGE_KEYS.length})</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => onToggle(ALL_PAGE_KEYS, true)} disabled={disabled} style={btn}>Selecionar todas</button>
          <button type="button" onClick={() => onToggle(ALL_PAGE_KEYS, false)} disabled={disabled} style={btn}>Limpar</button>
        </div>
      </div>
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 14px', maxHeight: 340, overflowY: 'auto' }}>
        {PAGE_GROUPS.map((g) => (
          <Group key={g.name} name={g.name} items={g.items} selectedKeys={selectedKeys} onToggle={onToggle} disabled={disabled} />
        ))}
      </div>
    </div>
  )
}
