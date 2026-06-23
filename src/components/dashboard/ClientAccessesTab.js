'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const STATUS_CONFIG = {
  active:       { label: 'Ativo',              color: '#26c281', bg: 'rgba(38,194,129,.15)' },
  pending:      { label: 'Pendente',           color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  no_access:    { label: 'Sem acesso',         color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
  needs_update: { label: 'Precisa atualizar',  color: '#f97316', bg: 'rgba(249,115,22,.15)' },
  problem:      { label: 'Acesso com problema',color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
}

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

const COLOR_OPTIONS = ['#26c281','#3b82f6','#e1306c','#f59e0b','#a78bfa','#06b6d4','#f97316','#ef4444','#64748b','#ec4899']

const G = '#26c281'
const PANEL = '#111113'
const BORDER = 'rgba(148,163,184,.1)'
const TEXT = '#e2e8f0'
const SUB = '#94a3b8'

function copyToClipboard(text, setCopied) {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  })
}

function AccessCard({ access, onUpdate, onDelete, onRevealPassword }) {
  const [showPass, setShowPass] = useState(false)
  const [revealedPass, setRevealedPass] = useState(null)
  const [loadingPass, setLoadingPass] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const status = STATUS_CONFIG[access.status] || STATUS_CONFIG.active
  const cat = CATEGORIES.find((c) => c.key === access.category) || CATEGORIES[4]

  const handleReveal = async () => {
    if (showPass) { setShowPass(false); return }
    if (revealedPass !== null) { setShowPass(true); return }
    setLoadingPass(true)
    const pass = await onRevealPassword(access.id)
    setRevealedPass(pass || '')
    setShowPass(true)
    setLoadingPass(false)
  }

  const handleEdit = () => {
    setDraft({
      platform_name: access.platform_name,
      icon: access.icon,
      icon_color: access.icon_color,
      login: access.login || '',
      password: '',
      url: access.url || '',
      notes: access.notes || '',
      status: access.status,
    })
    setEditing(true)
    setShowIconPicker(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { id: access.id, ...draft }
    if (!draft.password) delete payload.password
    await onUpdate(payload)
    setEditing(false)
    setSaving(false)
    setRevealedPass(null)
    setShowPass(false)
  }

  const handleLoadHistory = async () => {
    if (showHistory) { setShowHistory(false); return }
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/clients/accesses/logs?access_id=${access.id}`)
      const json = await res.json()
      setHistory(json.logs || [])
    } catch (_) {}
    setLoadingHistory(false)
    setShowHistory(true)
  }

  const isIncomplete = !access.login && !access.url

  return (
    <div style={{
      background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: access.icon_color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`bx ${access.icon}`} style={{ fontSize: 20, color: access.icon_color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{access.platform_name}</span>
            {isIncomplete && (
              <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,.12)', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                Acesso incompleto
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: SUB }}>{cat.label}</span>
        </div>
        {/* Status badge */}
        <select
          value={access.status}
          onChange={(e) => onUpdate({ id: access.id, status: e.target.value })}
          style={{
            background: status.bg, color: status.color, border: 'none', borderRadius: 20,
            fontSize: 11, fontWeight: 700, padding: '3px 10px', cursor: 'pointer', outline: 'none',
          }}
        >
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Icon picker trigger */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => setShowIconPicker((v) => !v)}
              style={{ background: draft.icon_color + '22', border: `1px solid ${draft.icon_color}44`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: draft.icon_color, fontSize: 12 }}>
              <i className={`bx ${draft.icon}`} style={{ fontSize: 16 }} />
              Ícone
            </button>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => setDraft((d) => ({ ...d, icon_color: c }))}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: draft.icon_color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          {showIconPicker && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 10 }}>
              {ICON_OPTIONS.map((o) => (
                <button key={o.icon} type="button" title={o.label}
                  onClick={() => { setDraft((d) => ({ ...d, icon: o.icon })); setShowIconPicker(false) }}
                  style={{ background: draft.icon === o.icon ? draft.icon_color + '33' : 'transparent', border: `1px solid ${draft.icon === o.icon ? draft.icon_color : 'transparent'}`, borderRadius: 7, padding: 6, cursor: 'pointer', color: draft.icon === o.icon ? draft.icon_color : SUB }}>
                  <i className={`bx ${o.icon}`} style={{ fontSize: 18 }} />
                </button>
              ))}
            </div>
          )}
          <input value={draft.platform_name} onChange={(e) => setDraft((d) => ({ ...d, platform_name: e.target.value }))}
            placeholder="Nome da plataforma" style={iStyle()} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={draft.login} onChange={(e) => setDraft((d) => ({ ...d, login: e.target.value }))}
              placeholder="Login / E-mail / Usuário" style={iStyle()} />
            <input value={draft.password} onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
              type="password" placeholder="Nova senha (deixe em branco para manter)" style={iStyle()} />
          </div>
          <input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            placeholder="Link de acesso (https://...)" style={iStyle()} />
          <textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            placeholder="Observações (2FA, quem tem acesso, etc.)" rows={3}
            style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSave} disabled={saving}
              style={{ background: G, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: SUB, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {access.login && (
              <Field label="Login" value={access.login} onCopy={() => copyToClipboard(access.login, setCopiedLogin)} copied={copiedLogin} />
            )}
            {access.has_password && (
              <div>
                <span style={labelSt}>Senha</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: TEXT, fontSize: 13, fontFamily: showPass ? 'inherit' : 'monospace', letterSpacing: showPass ? 'normal' : 2, flex: 1 }}>
                    {showPass ? (revealedPass ?? '...') : '••••••••••'}
                  </span>
                  <Btn icon={loadingPass ? 'bx-loader-alt bx-spin' : showPass ? 'bx-hide' : 'bx-show'} title={showPass ? 'Ocultar' : 'Mostrar'} onClick={handleReveal} />
                  {showPass && revealedPass && (
                    <CopyBtn copied={copiedPass} onClick={() => copyToClipboard(revealedPass, setCopiedPass)} />
                  )}
                </div>
              </div>
            )}
            {access.url && (
              <div>
                <span style={labelSt}>Link</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <a href={access.url} target="_blank" rel="noreferrer"
                    style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {access.url}
                  </a>
                  <Btn icon="bx-link-external" title="Abrir" onClick={() => window.open(access.url, '_blank')} />
                  <CopyBtn copied={copiedLink} onClick={() => copyToClipboard(access.url, setCopiedLink)} />
                </div>
              </div>
            )}
            {access.notes && (
              <div>
                <span style={labelSt}>Observações</span>
                <p style={{ color: SUB, fontSize: 12, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{access.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: '#475569' }}>
              Atualizado em {new Date(access.updated_at).toLocaleDateString('pt-BR')}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" onClick={handleLoadHistory} title="Histórico"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: loadingHistory ? G : SUB, padding: '3px 6px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className={`bx ${loadingHistory ? 'bx-loader-alt bx-spin' : 'bx-history'}`} style={{ fontSize: 14 }} />
              </button>
              <button type="button" onClick={handleEdit} title="Editar"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: '3px 6px' }}>
                <i className="bx bx-edit" style={{ fontSize: 14 }} />
              </button>
              <button type="button" onClick={() => onDelete(access.id)} title="Excluir"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '3px 6px' }}>
                <i className="bx bx-trash" style={{ fontSize: 14 }} />
              </button>
            </div>
          </div>

          {showHistory && (
            <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: SUB, textTransform: 'uppercase', letterSpacing: '.5px' }}>Histórico</span>
              {history.length === 0
                ? <span style={{ fontSize: 12, color: '#475569' }}>Nenhum registro ainda.</span>
                : history.map((h) => (
                    <div key={h.id} style={{ fontSize: 11, color: SUB, display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <i className={`bx ${actionIcon(h.action)}`} style={{ fontSize: 12, color: actionColor(h.action), flexShrink: 0 }} />
                      <span style={{ color: TEXT, fontWeight: 600 }}>{actionLabel(h.action)}</span>
                      {h.changed_fields?.length > 0 && <span>— {h.changed_fields.join(', ')}</span>}
                      <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                        {new Date(h.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  ))
              }
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Field({ label, value, onCopy, copied }) {
  return (
    <div>
      <span style={labelSt}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: TEXT, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <CopyBtn copied={copied} onClick={onCopy} />
      </div>
    </div>
  )
}

function Btn({ icon, title, onClick }) {
  return (
    <button type="button" title={title} onClick={onClick}
      style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: SUB, padding: '3px 7px', display: 'flex', alignItems: 'center' }}>
      <i className={`bx ${icon}`} style={{ fontSize: 14 }} />
    </button>
  )
}

function CopyBtn({ copied, onClick }) {
  return (
    <button type="button" title={copied ? 'Copiado!' : 'Copiar'} onClick={onClick}
      style={{ background: copied ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: copied ? G : SUB, padding: '3px 7px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
      <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: 13 }} />
      {copied ? 'Copiado!' : ''}
    </button>
  )
}

const labelSt = { fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 3 }
const iStyle = () => ({ background: 'rgba(255,255,255,.05)', border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, padding: '8px 11px', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box' })

function actionIcon(a) { return { created: 'bx-plus-circle', updated: 'bx-edit', deleted: 'bx-trash', viewed_password: 'bx-show' }[a] || 'bx-circle' }
function actionColor(a) { return { created: G, updated: '#60a5fa', deleted: '#ef4444', viewed_password: '#f59e0b' }[a] || SUB }
function actionLabel(a) { return { created: 'Criado', updated: 'Editado', deleted: 'Excluído', viewed_password: 'Senha visualizada' }[a] || a }

function AddAccessModal({ category, onClose, onSaved }) {
  const [form, setForm] = useState({
    platform_name: '',
    icon: CATEGORIES.find((c) => c.key === category)?.icon || 'bx-globe',
    icon_color: CATEGORIES.find((c) => c.key === category)?.color || G,
    login: '', password: '', url: '', notes: '', status: 'active',
  })
  const [saving, setSaving] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  const suggestions = DEFAULT_PLATFORMS[category] || []

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.platform_name.trim()) return
    setSaving(true)
    await onSaved({ ...form, category })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: `1px solid ${BORDER}`, borderRadius: 16, width: '100%', maxWidth: 520, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Novo acesso</span>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: SUB, cursor: 'pointer' }}>
            <i className="bx bx-x" style={{ fontSize: 20 }} />
          </button>
        </div>

        {suggestions.length > 0 && (
          <div>
            <span style={{ ...labelSt, marginBottom: 6 }}>Sugestões</span>
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

        <input value={form.platform_name} onChange={(e) => set('platform_name', e.target.value)}
          placeholder="Nome da plataforma *" style={iStyle()} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={() => setShowIconPicker((v) => !v)}
            style={{ background: form.icon_color + '22', border: `1px solid ${form.icon_color}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: form.icon_color, fontSize: 12 }}>
            <i className={`bx ${form.icon}`} style={{ fontSize: 18 }} />
            Ícone
          </button>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {COLOR_OPTIONS.map((c) => (
              <button key={c} type="button" onClick={() => set('icon_color', c)}
                style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: form.icon_color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        {showIconPicker && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 10 }}>
            {ICON_OPTIONS.map((o) => (
              <button key={o.icon} type="button" title={o.label}
                onClick={() => { set('icon', o.icon); setShowIconPicker(false) }}
                style={{ background: form.icon === o.icon ? form.icon_color + '33' : 'transparent', border: `1px solid ${form.icon === o.icon ? form.icon_color : 'transparent'}`, borderRadius: 7, padding: 6, cursor: 'pointer', color: form.icon === o.icon ? form.icon_color : SUB }}>
                <i className={`bx ${o.icon}`} style={{ fontSize: 18 }} />
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input value={form.login} onChange={(e) => set('login', e.target.value)}
            placeholder="Login / E-mail / Usuário" style={iStyle()} />
          <input value={form.password} onChange={(e) => set('password', e.target.value)}
            type="password" placeholder="Senha" style={iStyle()} />
        </div>
        <input value={form.url} onChange={(e) => set('url', e.target.value)}
          placeholder="Link de acesso (https://...)" style={iStyle()} />
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
          placeholder="Observações (2FA, responsável, etc.)" rows={3}
          style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />

        <select value={form.status} onChange={(e) => set('status', e.target.value)} style={iStyle()}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleSave} disabled={saving || !form.platform_name.trim()}
            style={{ background: G, border: 'none', borderRadius: 9, color: '#fff', padding: '10px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 1, opacity: saving || !form.platform_name.trim() ? .6 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar acesso'}
          </button>
          <button type="button" onClick={onClose}
            style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 9, color: SUB, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientAccessesTab({ clientId, clientName, clients = [], onSelectClient }) {
  const [accesses, setAccesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [addModal, setAddModal] = useState(null) // category key
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  const loadAccesses = useCallback(async () => {
    if (!clientId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/accesses?client_id=${clientId}`)
      const json = await res.json()
      setAccesses(json.accesses || [])
    } catch (_) {
      setAccesses([])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { loadAccesses() }, [loadAccesses])

  const handleRevealPassword = async (id) => {
    try {
      const res = await fetch(`/api/clients/accesses?client_id=${clientId}&reveal_id=${id}`)
      const json = await res.json()
      return json.password
    } catch { return null }
  }

  const handleAdd = async (payload) => {
    try {
      const res = await fetch('/api/clients/accesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ...payload }),
      })
      const json = await res.json()
      if (json.access) {
        setAccesses((prev) => [...prev, json.access])
        setAddModal(null)
        showToast('Acesso salvo com sucesso.')
      }
    } catch (_) { showToast('Erro ao salvar.', 'error') }
  }

  const handleUpdate = async (payload) => {
    try {
      const res = await fetch('/api/clients/accesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.access) {
        setAccesses((prev) => prev.map((a) => a.id === json.access.id ? json.access : a))
        showToast('Alterações salvas.')
      }
    } catch (_) { showToast('Erro ao atualizar.', 'error') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este acesso?')) return
    try {
      await fetch(`/api/clients/accesses?id=${id}`, { method: 'DELETE' })
      setAccesses((prev) => prev.filter((a) => a.id !== id))
      showToast('Acesso removido.')
    } catch (_) { showToast('Erro ao excluir.', 'error') }
  }

  // Summary counts
  const total = accesses.length
  const active = accesses.filter((a) => a.status === 'active').length
  const pending = accesses.filter((a) => a.status === 'pending').length
  const problem = accesses.filter((a) => a.status === 'problem' || a.status === 'needs_update').length

  // Filtered list
  const filtered = accesses.filter((a) => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.platform_name.toLowerCase().includes(q) || (a.login || '').toLowerCase().includes(q)
    const matchCat = filterCat === 'all' || a.category === filterCat
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  // Group by category
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    items: filtered.filter((a) => a.category === cat.key),
  })).filter((g) => g.items.length > 0 || (filterCat === 'all' || filterCat === g.key))

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : G,
          color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className={`bx ${toast.type === 'error' ? 'bx-x-circle' : 'bx-check-circle'}`} style={{ fontSize: 16 }} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT }}>Acessos e Plataformas</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: SUB }}>
              {clientName ? `${clientName} — organize os acessos em um único lugar seguro.` : 'Selecione um cliente para gerenciar os acessos.'}
            </p>
          </div>
          {clientId && (
            <button type="button" onClick={() => setAddModal('custom')}
              style={{ background: G, border: 'none', borderRadius: 9, color: '#fff', padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <i className="bx bx-plus" style={{ fontSize: 15 }} />
              Novo acesso
            </button>
          )}
        </div>

        {/* Client selector if no client */}
        {!clientId && (
          <select onChange={(e) => { const c = clients.find((x) => x.id === e.target.value); if (c) onSelectClient?.(c) }}
            defaultValue="" style={{ ...iStyle(), maxWidth: 320 }}>
            <option value="" disabled>Selecionar cliente...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {clientId && (
          <>
            {/* Summary cards */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Total', value: total, color: SUB },
                { label: 'Ativos', value: active, color: '#26c281' },
                { label: 'Pendentes', value: pending, color: '#f59e0b' },
                { label: 'Atenção', value: problem, color: '#ef4444' },
              ].map((m) => (
                <div key={m.label} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</span>
                  <span style={{ fontSize: 10, color: SUB, fontWeight: 600 }}>{m.label}</span>
                </div>
              ))}
            </div>

            {/* Search + filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <i className="bx bx-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SUB, fontSize: 15 }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar plataforma, login..." style={{ ...iStyle(), paddingLeft: 32 }} />
              </div>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...iStyle(), width: 'auto' }}>
                <option value="all">Todas as categorias</option>
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...iStyle(), width: 'auto' }}>
                <option value="all">Todos os status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
        {!clientId ? (
          <div style={{ textAlign: 'center', color: SUB, padding: '60px 0', fontSize: 14 }}>
            <i className="bx bx-lock-open-alt" style={{ fontSize: 48, display: 'block', marginBottom: 12, color: '#334155' }} />
            Selecione um cliente para visualizar os acessos.
          </div>
        ) : loading ? (
          <div style={{ color: SUB, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 22, display: 'block', marginBottom: 8 }} />
            Carregando acessos...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {CATEGORIES.map((cat) => {
              const items = filtered.filter((a) => a.category === cat.key)
              if ((filterCat !== 'all' && filterCat !== cat.key) || (items.length === 0 && filterCat !== 'all' && filterCat !== cat.key)) return null
              if (items.length === 0 && (filterCat !== 'all' && filterCat !== cat.key)) return null

              return (
                <div key={cat.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <i className={`bx ${cat.icon}`} style={{ fontSize: 18, color: cat.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cat.label}</span>
                    <span style={{ fontSize: 11, color: SUB, background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '2px 8px' }}>{items.length}</span>
                    <button type="button" onClick={() => setAddModal(cat.key)}
                      style={{ marginLeft: 'auto', background: 'transparent', border: `1px dashed ${cat.color}66`, borderRadius: 7, color: cat.color, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="bx bx-plus" style={{ fontSize: 13 }} />
                      Adicionar
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <div style={{ color: '#334155', fontSize: 12, fontStyle: 'italic', padding: '10px 0 4px 28px' }}>
                      Nenhum acesso cadastrado nesta categoria.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                      {items.map((acc) => (
                        <AccessCard key={acc.id} access={acc}
                          onUpdate={handleUpdate}
                          onDelete={handleDelete}
                          onRevealPassword={handleRevealPassword}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {filtered.length === 0 && accesses.length > 0 && (
              <div style={{ color: SUB, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                Nenhum acesso encontrado para os filtros aplicados.
              </div>
            )}

            {accesses.length === 0 && (
              <div style={{ textAlign: 'center', color: SUB, padding: '50px 0' }}>
                <i className="bx bx-lock-alt" style={{ fontSize: 44, display: 'block', marginBottom: 10, color: '#334155' }} />
                <p style={{ margin: 0, fontSize: 14 }}>Nenhum acesso cadastrado para este cliente.</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#475569' }}>Use os botões "Adicionar" por categoria ou o botão "Novo acesso" no topo.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {addModal && (
        <AddAccessModal
          category={addModal}
          onClose={() => setAddModal(null)}
          onSaved={handleAdd}
        />
      )}
    </div>
  )
}
