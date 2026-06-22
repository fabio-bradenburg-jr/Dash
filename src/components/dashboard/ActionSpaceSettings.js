'use client'

import { useState, useEffect } from 'react'

const COLORS = ['#26c281', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#64748b']
const VIEWS = [
  { value: 'list', label: 'Lista' },
  { value: 'kanban', label: 'Kanban' },
  { value: 'calendar', label: 'Calendário' },
]

export default function ActionSpaceSettings({ onClose, statusTemplates = [], workspaceUsers = [] }) {
  const [settings, setSettings] = useState({
    default_space_name: 'Plano de Ação',
    default_color: '#26c281',
    default_view: 'list',
    default_assignee_ids: [],
    default_status_template_id: '',
    auto_create_monday: false,
    auto_archive_after_weeks: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/operation/action-space-settings')
      .then(r => r.json())
      .then(json => {
        if (json.settings) {
          setSettings(prev => ({
            ...prev,
            ...json.settings,
            auto_archive_after_weeks: json.settings.auto_archive_after_weeks ?? '',
            default_status_template_id: json.settings.default_status_template_id ?? '',
            default_assignee_ids: json.settings.default_assignee_ids ?? [],
          }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleAssignee = (uid) => {
    setSettings(prev => {
      const ids = prev.default_assignee_ids || []
      return {
        ...prev,
        default_assignee_ids: ids.includes(uid) ? ids.filter(id => id !== uid) : [...ids, uid],
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        ...settings,
        auto_archive_after_weeks: settings.auto_archive_after_weeks ? Number(settings.auto_archive_after_weeks) : null,
        default_status_template_id: settings.default_status_template_id || null,
      }
      await fetch('/api/operation/action-space-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10010, display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const panel = { background: '#111113', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 28 }
  const label = { fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }
  const input = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box', outline: 'none' }

  const weekExample = (() => {
    const now = new Date()
    const mon = new Date(now)
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    const fmt = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${settings.default_space_name || 'Plano de Ação'} - ${fmt(mon)} a ${fmt(sun)}`
  })()

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#e2e8f0' }}>
              <i className="bx bx-cog" style={{ marginRight: 8, color: '#26c281' }} />
              Configurações de Plano de Ação
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Define como os Espaços semanais são criados na Central de Tarefas.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 20 }}>
            <i className="bx bx-x" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 24 }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Space name */}
            <div>
              <span style={label}>Nome padrão do Espaço</span>
              <input
                style={input}
                value={settings.default_space_name}
                onChange={e => setSettings(p => ({ ...p, default_space_name: e.target.value }))}
                placeholder="Ex: Plano de Ação"
              />
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#475569' }}>
                Exemplo: <strong style={{ color: '#94a3b8' }}>{weekExample}</strong>
              </div>
            </div>

            {/* Color */}
            <div>
              <span style={label}>Cor do Espaço</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSettings(p => ({ ...p, default_color: c }))}
                    style={{
                      width: 30, height: 30, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                      outline: settings.default_color === c ? `3px solid ${c}` : '3px solid transparent',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Status template */}
            {statusTemplates.length > 0 && (
              <div>
                <span style={label}>Modelo de Status</span>
                <select
                  style={input}
                  value={settings.default_status_template_id}
                  onChange={e => setSettings(p => ({ ...p, default_status_template_id: e.target.value }))}
                >
                  <option value="">Sem modelo específico</option>
                  {statusTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Default view */}
            <div>
              <span style={label}>Modelo de Visualização</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {VIEWS.map(v => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setSettings(p => ({ ...p, default_view: v.value }))}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${settings.default_view === v.value ? '#26c281' : 'rgba(255,255,255,0.1)'}`,
                      background: settings.default_view === v.value ? 'rgba(38,194,129,0.12)' : 'transparent',
                      color: settings.default_view === v.value ? '#26c281' : '#94a3b8',
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default assignees */}
            {workspaceUsers.length > 0 && (
              <div>
                <span style={label}>Responsáveis Padrão</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {workspaceUsers.map(u => {
                    const selected = (settings.default_assignee_ids || []).includes(u.id)
                    return (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, cursor: 'pointer', background: selected ? 'rgba(38,194,129,0.08)' : 'transparent', border: `1px solid ${selected ? 'rgba(38,194,129,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                        <input type="checkbox" checked={selected} onChange={() => toggleAssignee(u.id)} style={{ accentColor: '#26c281' }} />
                        <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{u.full_name || u.email}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Auto create */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
              <input
                type="checkbox"
                id="auto_monday"
                checked={settings.auto_create_monday}
                onChange={e => setSettings(p => ({ ...p, auto_create_monday: e.target.checked }))}
                style={{ accentColor: '#26c281', width: 16, height: 16 }}
              />
              <label htmlFor="auto_monday" style={{ fontSize: '0.85rem', color: '#e2e8f0', cursor: 'pointer' }}>
                Criar automaticamente toda segunda-feira
              </label>
            </div>

            {/* Auto archive */}
            <div>
              <span style={label}>Arquivar automaticamente após (semanas)</span>
              <input
                type="number"
                style={{ ...input, width: 120 }}
                value={settings.auto_archive_after_weeks}
                onChange={e => setSettings(p => ({ ...p, auto_archive_after_weeks: e.target.value }))}
                placeholder="Ex: 4"
                min="1"
                max="52"
              />
              <div style={{ marginTop: 4, fontSize: '0.75rem', color: '#475569' }}>Deixe em branco para não arquivar.</div>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'none', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#26c281', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saved ? '✓ Salvo' : saving ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
