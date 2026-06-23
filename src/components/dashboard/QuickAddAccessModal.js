'use client'
import { useState } from 'react'

const CATEGORIES = [
  { key: 'social',  label: 'Redes Sociais', icon: 'bxl-instagram',  color: '#e1306c' },
  { key: 'google',  label: 'Google',        icon: 'bxl-google',     color: '#4285f4' },
  { key: 'site',    label: 'Site',          icon: 'bx-globe',       color: '#06b6d4' },
  { key: 'crm',     label: 'CRM',           icon: 'bx-filter-alt',  color: '#a78bfa' },
  { key: 'custom',  label: 'Personalizado', icon: 'bx-plus-circle', color: '#26c281' },
]

const DEFAULT_PLATFORMS = {
  social:  ['Instagram', 'Facebook', 'Meta Business', 'LinkedIn', 'TikTok'],
  google:  ['Google Ads', 'Google Analytics', 'Google Tag Manager', 'Google Meu Negócio', 'Gmail'],
  site:    ['WordPress', 'Hostinger', 'Registro.br', 'Cloudflare', 'Elementor'],
  crm:     ['Agendor', 'RD Station', 'Pipedrive', 'HubSpot', 'Kommo'],
  custom:  [],
}

const ICON_OPTIONS = [
  { icon: 'bx-globe',      label: 'Globo' },
  { icon: 'bx-lock-alt',   label: 'Cadeado' },
  { icon: 'bx-cog',        label: 'Engrenagem' },
  { icon: 'bxl-whatsapp',  label: 'WhatsApp' },
  { icon: 'bx-desktop',    label: 'Computador' },
  { icon: 'bx-data',       label: 'Banco de dados' },
  { icon: 'bx-cloud',      label: 'Nuvem' },
  { icon: 'bx-link',       label: 'Link' },
  { icon: 'bx-folder',     label: 'Pasta' },
  { icon: 'bx-wrench',     label: 'Ferramenta' },
  { icon: 'bx-line-chart', label: 'Gráfico' },
  { icon: 'bx-code-alt',   label: 'Código' },
  { icon: 'bx-user',       label: 'Usuário' },
  { icon: 'bx-key',        label: 'Chave' },
  { icon: 'bx-store',      label: 'Loja' },
  { icon: 'bx-mail-send',  label: 'E-mail' },
  { icon: 'bxl-instagram', label: 'Instagram' },
  { icon: 'bxl-facebook',  label: 'Facebook' },
  { icon: 'bxl-google',    label: 'Google' },
  { icon: 'bxl-wordpress', label: 'WordPress' },
]

const STATUS_OPTIONS = [
  { key: 'active',       label: 'Ativo' },
  { key: 'pending',      label: 'Pendente' },
  { key: 'no_access',    label: 'Sem acesso' },
  { key: 'needs_update', label: 'Precisa atualizar' },
  { key: 'problem',      label: 'Acesso com problema' },
]

const COLOR_OPTIONS = ['#26c281','#3b82f6','#e1306c','#f59e0b','#a78bfa','#06b6d4','#f97316','#ef4444','#64748b','#ec4899']

const G = '#26c281'
const BORDER = 'rgba(148,163,184,.12)'
const TEXT = '#e2e8f0'
const SUB = '#94a3b8'

const iStyle = () => ({
  background: 'rgba(255,255,255,.06)',
  border: `1px solid ${BORDER}`,
  borderRadius: 9,
  color: TEXT,
  padding: '9px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
})

export default function QuickAddAccessModal({ clientId, clientName, onClose, onSaved }) {
  const [category, setCategory] = useState('social')
  const [form, setForm] = useState({
    platform_name: '',
    icon: CATEGORIES[0].icon,
    icon_color: CATEGORIES[0].color,
    login: '',
    password: '',
    showPassword: false,
    url: '',
    notes: '',
    status: 'active',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleCategoryChange = (key) => {
    const cat = CATEGORIES.find((c) => c.key === key)
    setCategory(key)
    setForm((f) => ({ ...f, platform_name: '', icon: cat.icon, icon_color: cat.color }))
    setShowIconPicker(false)
  }

  const handleSave = async () => {
    if (!clientId) { setError('Cliente não identificado. Feche e tente novamente.'); return }
    if (!form.platform_name.trim()) { setError('Informe o nome da plataforma.'); return }
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/clients/accesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          category,
          platform_name: form.platform_name.trim(),
          icon: form.icon,
          icon_color: form.icon_color,
          login: form.login.trim() || null,
          password: form.password || null,
          url: form.url.trim() || null,
          notes: form.notes.trim() || null,
          status: form.status,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error || 'Erro ao salvar.'); setSaving(false); return }
      setSaved(true)
      onSaved?.(json.access)
    } catch (e) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const suggestions = DEFAULT_PLATFORMS[category] || []
  const currentCat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0]

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 540, background: 'linear-gradient(160deg,#0f172a 0%,#0d1f17 100%)', border: '1px solid rgba(38,194,129,0.25)', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(38,194,129,.12)', background: 'rgba(38,194,129,.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(38,194,129,.18)', border: '1px solid rgba(38,194,129,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bx bx-key" style={{ fontSize: 20, color: G }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>Cadastrar Acesso</div>
                <div style={{ fontSize: 11, color: SUB, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="bx bx-building-house" style={{ fontSize: 12, color: G }} />
                  <span>Vinculado a: </span>
                  <span style={{ fontWeight: 700, color: G }}>{clientName || clientId}</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose}
              style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, color: SUB, cursor: 'pointer', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="bx bx-x" style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

        {saved ? (
          /* Success state */
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(38,194,129,.18)', border: '1px solid rgba(38,194,129,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bx bx-check-circle" style={{ fontSize: 32, color: G }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Acesso cadastrado com sucesso!</div>
              <div style={{ fontSize: 13, color: SUB, marginTop: 6 }}>
                O acesso foi salvo para <strong style={{ color: G }}>{clientName}</strong> e já está disponível na aba Acessos.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => { setSaved(false); setForm({ platform_name: '', icon: currentCat.icon, icon_color: currentCat.color, login: '', password: '', showPassword: false, url: '', notes: '', status: 'active' }) }}
                style={{ background: 'rgba(38,194,129,.15)', border: '1px solid rgba(38,194,129,.3)', borderRadius: 9, color: G, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Adicionar outro
              </button>
              <button type="button" onClick={onClose}
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 9, color: SUB, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <div style={{ overflowY: 'auto', padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Category tabs */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Categoria</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORIES.map((cat) => (
                  <button key={cat.key} type="button" onClick={() => handleCategoryChange(cat.key)}
                    style={{ background: category === cat.key ? cat.color + '22' : 'rgba(255,255,255,.05)', border: `1px solid ${category === cat.key ? cat.color + '88' : 'transparent'}`, borderRadius: 20, padding: '5px 13px', fontSize: 12, fontWeight: 600, color: category === cat.key ? cat.color : SUB, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`bx ${cat.icon}`} style={{ fontSize: 13 }} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>Sugestões</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => set('platform_name', s)}
                      style={{ background: form.platform_name === s ? G + '22' : 'rgba(255,255,255,.05)', border: `1px solid ${form.platform_name === s ? G : 'transparent'}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, color: form.platform_name === s ? G : SUB, cursor: 'pointer' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Platform name */}
            <input
              value={form.platform_name}
              onChange={(e) => set('platform_name', e.target.value)}
              placeholder={`Nome da plataforma *`}
              style={iStyle()}
            />

            {/* Icon + color (only for custom) */}
            {category === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setShowIconPicker((v) => !v)}
                    style={{ background: form.icon_color + '22', border: `1px solid ${form.icon_color}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: form.icon_color, fontSize: 12 }}>
                    <i className={`bx ${form.icon}`} style={{ fontSize: 17 }} /> Ícone
                  </button>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {COLOR_OPTIONS.map((c) => (
                      <button key={c} type="button" onClick={() => set('icon_color', c)}
                        style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: form.icon_color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
                {showIconPicker && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, background: 'rgba(0,0,0,.3)', borderRadius: 10, padding: 10 }}>
                    {ICON_OPTIONS.map((o) => (
                      <button key={o.icon} type="button" title={o.label} onClick={() => { set('icon', o.icon); setShowIconPicker(false) }}
                        style={{ background: form.icon === o.icon ? form.icon_color + '33' : 'transparent', border: `1px solid ${form.icon === o.icon ? form.icon_color : 'transparent'}`, borderRadius: 7, padding: 6, cursor: 'pointer', color: form.icon === o.icon ? form.icon_color : SUB }}>
                        <i className={`bx ${o.icon}`} style={{ fontSize: 17 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Login + password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input value={form.login} onChange={(e) => set('login', e.target.value)} placeholder="Login / E-mail / Usuário" style={iStyle()} />
              <div style={{ position: 'relative' }}>
                <input
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  type={form.showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  style={{ ...iStyle(), paddingRight: 38 }}
                />
                <button type="button" onClick={() => set('showPassword', !form.showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center' }}>
                  <i className={`bx ${form.showPassword ? 'bx-hide' : 'bx-show'}`} style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>

            {/* URL */}
            <input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="Link de acesso (https://...)" style={iStyle()} />

            {/* Status */}
            <select value={form.status} onChange={(e) => set('status', e.target.value)} style={iStyle()}>
              {STATUS_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>

            {/* Notes */}
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Observações (2FA, quem tem acesso, etc.)"
              rows={2}
              style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }}
            />

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#fca5a5', display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="bx bx-error" style={{ fontSize: 15, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={handleSave} disabled={saving || !form.platform_name.trim() || !clientId}
                style={{ flex: 1, background: G, border: 'none', borderRadius: 10, color: '#fff', padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !form.platform_name.trim() || !clientId ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <i className={`bx ${saving ? 'bx-loader-alt bx-spin' : 'bx-check'}`} />
                {saving ? 'Salvando...' : 'Salvar acesso'}
              </button>
              <button type="button" onClick={onClose}
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, color: SUB, padding: '11px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
