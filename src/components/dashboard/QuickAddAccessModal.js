'use client'
import { useState } from 'react'

const CATEGORIES = [
  { key: 'social',    label: 'Redes Sociais',      icon: 'bxl-instagram',  color: '#e1306c', type: 'access' },
  { key: 'google',    label: 'Google',              icon: 'bxl-google',     color: '#4285f4', type: 'access' },
  { key: 'site',      label: 'Site',                icon: 'bx-globe',       color: '#06b6d4', type: 'access' },
  { key: 'crm',       label: 'CRM',                 icon: 'bx-filter-alt',  color: '#a78bfa', type: 'access' },
  { key: 'custom',    label: 'Personalizado',       icon: 'bx-plus-circle', color: '#26c281', type: 'access' },
  { key: 'location',  label: 'Localização',         icon: 'bx-map-pin',     color: '#f97316', type: 'operational' },
  { key: 'whatsapp',  label: 'WhatsApp Business',   icon: 'bxl-whatsapp',   color: '#25D366', type: 'operational' },
]

const DEFAULT_PLATFORMS = {
  social:   ['Instagram', 'Facebook', 'Meta Business', 'LinkedIn', 'TikTok'],
  google:   ['Google Ads', 'Google Analytics', 'Google Tag Manager', 'Google Meu Negócio', 'Gmail'],
  site:     ['WordPress', 'Hostinger', 'Registro.br', 'Cloudflare', 'Elementor'],
  crm:      ['Agendor', 'RD Station', 'Pipedrive', 'HubSpot', 'Kommo'],
  custom:   [],
  location: [],
  whatsapp: [],
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

const iStyle = (extra) => ({
  background: 'rgba(255,255,255,.06)',
  border: `1px solid ${BORDER}`,
  borderRadius: 9,
  color: TEXT,
  padding: '9px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  ...extra,
})

function buildWaLink(country, ddd, number, message) {
  const digits = `${country || '55'}${ddd || ''}${(number || '').replace(/\D/g, '')}`
  if (!digits || digits === '55') return ''
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

function LocationForm({ meta, setMeta }) {
  const set = (k, v) => setMeta((m) => ({ ...m, [k]: v }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={meta.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Endereço completo (Rua, número)" style={iStyle()} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={meta.city || ''} onChange={(e) => set('city', e.target.value)} placeholder="Cidade" style={iStyle()} />
        <input value={meta.state || ''} onChange={(e) => set('state', e.target.value)} placeholder="Estado (UF)" style={iStyle()} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={meta.zip || ''} onChange={(e) => set('zip', e.target.value)} placeholder="CEP" style={iStyle()} />
        <input value={meta.country || 'Brasil'} onChange={(e) => set('country', e.target.value)} placeholder="País" style={iStyle()} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={meta.lat || ''} onChange={(e) => set('lat', e.target.value)} placeholder="Latitude (opcional)" style={iStyle()} />
        <input value={meta.lng || ''} onChange={(e) => set('lng', e.target.value)} placeholder="Longitude (opcional)" style={iStyle()} />
      </div>
    </div>
  )
}

function WhatsAppForm({ meta, setMeta }) {
  const set = (k, v) => setMeta((m) => ({ ...m, [k]: v }))
  const waLink = buildWaLink(meta.phone_country, meta.phone_ddd, meta.phone_number, meta.default_message)
  const copyLink = () => waLink && navigator.clipboard?.writeText(waLink)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={meta.responsible_name || ''} onChange={(e) => set('responsible_name', e.target.value)} placeholder="Nome do responsável / empresa" style={iStyle()} />
      <div style={{ display: 'grid', gridTemplateColumns: '80px 90px 1fr', gap: 8 }}>
        <input value={meta.phone_country || '55'} onChange={(e) => set('phone_country', e.target.value)} placeholder="+55" style={iStyle()} />
        <input value={meta.phone_ddd || ''} onChange={(e) => set('phone_ddd', e.target.value)} placeholder="DDD" style={iStyle()} />
        <input value={meta.phone_number || ''} onChange={(e) => set('phone_number', e.target.value)} placeholder="Número" style={iStyle()} />
      </div>
      <textarea value={meta.default_message || ''} onChange={(e) => set('default_message', e.target.value)} placeholder="Mensagem padrão (opcional)" rows={2} style={iStyle({ resize: 'vertical', fontFamily: 'inherit' })} />
      {waLink && (
        <div style={{ background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#25D366', wordBreak: 'break-all', flex: 1 }}>{waLink}</span>
          <button type="button" onClick={copyLink} style={{ background: 'rgba(37,211,102,.15)', border: 'none', borderRadius: 6, color: '#25D366', cursor: 'pointer', padding: '4px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            Copiar
          </button>
        </div>
      )}
    </div>
  )
}

function AccessForm({ form, set, category, showIconPicker, setShowIconPicker }) {
  return (
    <>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={form.login} onChange={(e) => set('login', e.target.value)} placeholder="Login / E-mail / Usuário" style={iStyle()} />
        <div style={{ position: 'relative' }}>
          <input value={form.password} onChange={(e) => set('password', e.target.value)} type={form.showPassword ? 'text' : 'password'} placeholder="Senha" style={iStyle({ paddingRight: 38 })} />
          <button type="button" onClick={() => set('showPassword', !form.showPassword)}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, display: 'flex', alignItems: 'center' }}>
            <i className={`bx ${form.showPassword ? 'bx-hide' : 'bx-show'}`} style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
      <input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="Link de acesso (https://...)" style={iStyle()} />
      <select value={form.status} onChange={(e) => set('status', e.target.value)} style={iStyle()}>
        {STATUS_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
      <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observações (2FA, quem tem acesso, etc.)" rows={2} style={iStyle({ resize: 'vertical', fontFamily: 'inherit' })} />
    </>
  )
}

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
  const [meta, setMeta] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const currentCat = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0]
  const isOperational = currentCat.type === 'operational'

  const handleCategoryChange = (key) => {
    const cat = CATEGORIES.find((c) => c.key === key)
    setCategory(key)
    setForm((f) => ({ ...f, platform_name: '', icon: cat.icon, icon_color: cat.color }))
    setMeta({})
    setShowIconPicker(false)
  }

  const getDefaultPlatformName = () => {
    if (category === 'location') return 'Localização da Empresa'
    if (category === 'whatsapp') return 'WhatsApp Business'
    return ''
  }

  const handleSave = async () => {
    if (!clientId) { setError('Cliente não identificado. Feche e tente novamente.'); return }

    const platformName = isOperational ? getDefaultPlatformName() : form.platform_name.trim()
    if (!isOperational && !platformName) { setError('Informe o nome da plataforma.'); return }

    if (category === 'location') {
      const addressQuery = [meta.address, meta.city, meta.state, meta.country].filter(Boolean).join(', ')
      if (addressQuery) meta.maps_link = `https://maps.google.com/maps?q=${encodeURIComponent(addressQuery)}`
    }
    if (category === 'whatsapp') {
      meta.wa_link = buildWaLink(meta.phone_country, meta.phone_ddd, meta.phone_number, meta.default_message)
    }

    setError(null)
    setSaving(true)
    try {
      const body = {
        client_id: clientId,
        category,
        platform_name: platformName,
        icon: currentCat.icon,
        icon_color: currentCat.color,
        status: 'active',
        metadata: isOperational ? meta : undefined,
      }
      if (!isOperational) {
        body.icon = form.icon
        body.icon_color = form.icon_color
        body.login = form.login.trim() || null
        body.password = form.password || null
        body.url = form.url.trim() || null
        body.notes = form.notes.trim() || null
        body.status = form.status
      }

      const res = await fetch('/api/clients/accesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error || 'Erro ao salvar.'); setSaving(false); return }
      setSaved(true)
      onSaved?.(json.access)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({ platform_name: '', icon: currentCat.icon, icon_color: currentCat.color, login: '', password: '', showPassword: false, url: '', notes: '', status: 'active' })
    setMeta({})
    setSaved(false)
  }

  const suggestions = DEFAULT_PLATFORMS[category] || []
  const canSave = isOperational ? true : !!form.platform_name.trim()

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, background: 'linear-gradient(160deg,#0f172a 0%,#0d1f17 100%)', border: '1px solid rgba(38,194,129,0.25)', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,.7)', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(38,194,129,.12)', background: 'rgba(38,194,129,.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(38,194,129,.18)', border: '1px solid rgba(38,194,129,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="bx bx-data" style={{ fontSize: 20, color: G }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>Cadastrar Dado</div>
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
          <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(38,194,129,.18)', border: '1px solid rgba(38,194,129,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bx bx-check-circle" style={{ fontSize: 32, color: G }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Dado cadastrado com sucesso!</div>
              <div style={{ fontSize: 13, color: SUB, marginTop: 6 }}>
                Salvo para <strong style={{ color: G }}>{clientName}</strong> e já disponível em Dados dos Clientes.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={resetForm}
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

            {/* Operational notice */}
            {isOperational && (
              <div style={{ background: `${currentCat.color}11`, border: `1px solid ${currentCat.color}33`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: currentCat.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`bx ${currentCat.icon}`} style={{ fontSize: 15, flexShrink: 0 }} />
                {category === 'location' ? 'Preencha o endereço da empresa para gerar o link do Google Maps.' : 'Preencha os dados do WhatsApp Business para gerar o link wa.me.'}
              </div>
            )}

            {/* Suggestions (access only) */}
            {!isOperational && suggestions.length > 0 && (
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

            {/* Platform name (access only) */}
            {!isOperational && (
              <input value={form.platform_name} onChange={(e) => set('platform_name', e.target.value)} placeholder="Nome da plataforma *" style={iStyle()} />
            )}

            {/* Dynamic form */}
            {category === 'location' && <LocationForm meta={meta} setMeta={setMeta} />}
            {category === 'whatsapp' && <WhatsAppForm meta={meta} setMeta={setMeta} />}
            {!isOperational && <AccessForm form={form} set={set} category={category} showIconPicker={showIconPicker} setShowIconPicker={setShowIconPicker} />}

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#fca5a5', display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="bx bx-error" style={{ fontSize: 15, flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={handleSave} disabled={saving || !canSave || !clientId}
                style={{ flex: 1, background: G, border: 'none', borderRadius: 10, color: '#fff', padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !canSave || !clientId ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <i className={`bx ${saving ? 'bx-loader-alt bx-spin' : 'bx-check'}`} />
                {saving ? 'Salvando...' : 'Salvar'}
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
