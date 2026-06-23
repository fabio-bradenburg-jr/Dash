'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

/* ─── Constants ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  active:       { label: 'Ativo',               color: '#26c281', bg: 'rgba(38,194,129,.15)' },
  pending:      { label: 'Pendente',            color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  no_access:    { label: 'Sem acesso',          color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
  needs_update: { label: 'Precisa atualizar',   color: '#f97316', bg: 'rgba(249,115,22,.15)' },
  problem:      { label: 'Acesso com problema', color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
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
const PANEL = 'var(--bg-panel, #111113)'
const SIDEBAR_BG = 'var(--bg-dark, #0a0a0b)'
const BORDER = 'rgba(148,163,184,.1)'
const TEXT = '#e2e8f0'
const SUB = '#94a3b8'

/* ─── Helpers ────────────────────────────────────────────────────── */
function copyToClipboard(text, setCopied) {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  })
}

const iStyle = () => ({
  background: 'rgba(255,255,255,.05)', border: `1px solid ${BORDER}`, borderRadius: 8,
  color: TEXT, padding: '8px 11px', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box',
})
const labelSt = { fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 3 }

function actionIcon(a) { return { created: 'bx-plus-circle', updated: 'bx-edit', deleted: 'bx-trash', viewed_password: 'bx-show' }[a] || 'bx-circle' }
function actionColor(a) { return { created: G, updated: '#60a5fa', deleted: '#ef4444', viewed_password: '#f59e0b' }[a] || SUB }
function actionLabel(a) { return { created: 'Criado', updated: 'Editado', deleted: 'Excluído', viewed_password: 'Senha visualizada' }[a] || a }

/* ─── Sub-components ─────────────────────────────────────────────── */
function CopyBtn({ copied, onClick }) {
  return (
    <button type="button" title={copied ? 'Copiado!' : 'Copiar'} onClick={onClick}
      style={{ background: copied ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: copied ? G : SUB, padding: '3px 7px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
      <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: 13 }} />
      {copied ? 'Copiado!' : ''}
    </button>
  )
}

function IconBtn({ icon, title, onClick, color }) {
  return (
    <button type="button" title={title} onClick={onClick}
      style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: color || SUB, padding: '3px 7px', display: 'flex', alignItems: 'center' }}>
      <i className={`bx ${icon}`} style={{ fontSize: 14 }} />
    </button>
  )
}

function AccessCard({ access, onUpdate, onDelete, onRevealPassword, onArchive }) {
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
    setDraft({ platform_name: access.platform_name, icon: access.icon, icon_color: access.icon_color, login: access.login || '', password: '', url: access.url || '', notes: access.notes || '', status: access.status })
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
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, opacity: access.is_archived ? 0.6 : 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: access.icon_color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`bx ${access.icon}`} style={{ fontSize: 20, color: access.icon_color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{access.platform_name}</span>
            {isIncomplete && <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,.12)', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>Incompleto</span>}
            {access.is_archived && <span style={{ fontSize: 10, color: SUB, background: 'rgba(148,163,184,.1)', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>Arquivado</span>}
          </div>
          <span style={{ fontSize: 11, color: SUB }}>{cat.label}</span>
        </div>
        <select value={access.status} onChange={(e) => onUpdate({ id: access.id, status: e.target.value })}
          style={{ background: status.bg, color: status.color, border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '3px 10px', cursor: 'pointer', outline: 'none' }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowIconPicker((v) => !v)}
              style={{ background: draft.icon_color + '22', border: `1px solid ${draft.icon_color}44`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: draft.icon_color, fontSize: 12 }}>
              <i className={`bx ${draft.icon}`} style={{ fontSize: 16 }} /> Ícone
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
                <button key={o.icon} type="button" title={o.label} onClick={() => { setDraft((d) => ({ ...d, icon: o.icon })); setShowIconPicker(false) }}
                  style={{ background: draft.icon === o.icon ? draft.icon_color + '33' : 'transparent', border: `1px solid ${draft.icon === o.icon ? draft.icon_color : 'transparent'}`, borderRadius: 7, padding: 6, cursor: 'pointer', color: draft.icon === o.icon ? draft.icon_color : SUB }}>
                  <i className={`bx ${o.icon}`} style={{ fontSize: 18 }} />
                </button>
              ))}
            </div>
          )}
          <input value={draft.platform_name} onChange={(e) => setDraft((d) => ({ ...d, platform_name: e.target.value }))} placeholder="Nome da plataforma" style={iStyle()} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={draft.login} onChange={(e) => setDraft((d) => ({ ...d, login: e.target.value }))} placeholder="Login / E-mail / Usuário" style={iStyle()} />
            <input value={draft.password} onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))} type="password" placeholder="Nova senha (em branco = manter)" style={iStyle()} />
          </div>
          <input value={draft.url} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="Link de acesso (https://...)" style={iStyle()} />
          <textarea value={draft.notes} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} placeholder="Observações (2FA, quem tem acesso, etc.)" rows={3} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSave} disabled={saving} style={{ background: G, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: SUB, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {access.login && (
              <div>
                <span style={labelSt}>Login</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: TEXT, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{access.login}</span>
                  <CopyBtn copied={copiedLogin} onClick={() => copyToClipboard(access.login, setCopiedLogin)} />
                </div>
              </div>
            )}
            {access.has_password && (
              <div>
                <span style={labelSt}>Senha</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: TEXT, fontSize: 13, fontFamily: showPass ? 'inherit' : 'monospace', letterSpacing: showPass ? 'normal' : 2, flex: 1 }}>
                    {showPass ? (revealedPass ?? '...') : '••••••••••'}
                  </span>
                  <IconBtn icon={loadingPass ? 'bx-loader-alt bx-spin' : showPass ? 'bx-hide' : 'bx-show'} title={showPass ? 'Ocultar' : 'Mostrar'} onClick={handleReveal} />
                  {showPass && revealedPass && <CopyBtn copied={copiedPass} onClick={() => copyToClipboard(revealedPass, setCopiedPass)} />}
                </div>
              </div>
            )}
            {access.url && (
              <div>
                <span style={labelSt}>Link</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <a href={access.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{access.url}</a>
                  <IconBtn icon="bx-link-external" title="Abrir" onClick={() => window.open(access.url, '_blank')} />
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginTop: 2 }}>
            <span style={{ fontSize: 10, color: '#475569' }}>
              {new Date(access.updated_at).toLocaleDateString('pt-BR')}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" onClick={handleLoadHistory} title="Histórico"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: loadingHistory ? G : SUB, padding: '3px 6px' }}>
                <i className={`bx ${loadingHistory ? 'bx-loader-alt bx-spin' : 'bx-history'}`} style={{ fontSize: 14 }} />
              </button>
              <button type="button" onClick={() => onArchive(access.id, !access.is_archived)} title={access.is_archived ? 'Desarquivar' : 'Arquivar'}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: '3px 6px' }}>
                <i className={`bx ${access.is_archived ? 'bx-archive-out' : 'bx-archive-in'}`} style={{ fontSize: 14 }} />
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
                    <div key={h.id} style={{ fontSize: 11, color: SUB, display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <i className={`bx ${actionIcon(h.action)}`} style={{ fontSize: 12, color: actionColor(h.action), flexShrink: 0 }} />
                      <span style={{ color: TEXT, fontWeight: 600 }}>{actionLabel(h.action)}</span>
                      {h.changed_fields?.length > 0 && <span>— {h.changed_fields.join(', ')}</span>}
                      <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                        {new Date(h.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
      <div style={{ background: '#18181b', border: `1px solid ${BORDER}`, borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' }}>
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

        <input value={form.platform_name} onChange={(e) => set('platform_name', e.target.value)} placeholder="Nome da plataforma *" style={iStyle()} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setShowIconPicker((v) => !v)}
            style={{ background: form.icon_color + '22', border: `1px solid ${form.icon_color}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: form.icon_color, fontSize: 12 }}>
            <i className={`bx ${form.icon}`} style={{ fontSize: 18 }} /> Ícone
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
              <button key={o.icon} type="button" title={o.label} onClick={() => { set('icon', o.icon); setShowIconPicker(false) }}
                style={{ background: form.icon === o.icon ? form.icon_color + '33' : 'transparent', border: `1px solid ${form.icon === o.icon ? form.icon_color : 'transparent'}`, borderRadius: 7, padding: 6, cursor: 'pointer', color: form.icon === o.icon ? form.icon_color : SUB }}>
                <i className={`bx ${o.icon}`} style={{ fontSize: 18 }} />
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input value={form.login} onChange={(e) => set('login', e.target.value)} placeholder="Login / E-mail / Usuário" style={iStyle()} />
          <input value={form.password} onChange={(e) => set('password', e.target.value)} type="password" placeholder="Senha" style={iStyle()} />
        </div>
        <input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="Link de acesso (https://...)" style={iStyle()} />
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Observações (2FA, responsável, etc.)" rows={3} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
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

/* ─── Space card in sidebar ──────────────────────────────────────── */
function SpaceCard({ space, client, isSelected, onClick }) {
  const { counts } = space
  const hasProblem = counts.problem > 0
  const hasPending = counts.pending > 0
  const initial = (client?.name || '?').charAt(0).toUpperCase()
  const color = client?.dashboardColor || G

  return (
    <button type="button" onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
        background: isSelected ? color + '18' : 'transparent',
        border: isSelected ? `1px solid ${color}44` : '1px solid transparent',
        borderRadius: 10, padding: '9px 10px', cursor: 'pointer', transition: 'all .15s',
      }}>
      {/* Avatar */}
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: color + '28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? TEXT : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {client?.name || space.client_id}
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2 }}>
          {counts.total === 0
            ? <span style={{ fontSize: 10, color: '#334155' }}>Sem acessos</span>
            : <>
                <span style={{ fontSize: 10, color: hasProblem ? '#ef4444' : hasPending ? '#f59e0b' : G, fontWeight: 600 }}>
                  {counts.active} ativos
                </span>
                {hasPending && <span style={{ fontSize: 10, color: '#f59e0b' }}>· {counts.pending} pend.</span>}
                {hasProblem && <span style={{ fontSize: 10, color: '#ef4444' }}>· {counts.problem} prob.</span>}
              </>
          }
        </div>
      </div>
      <span style={{ fontSize: 11, color: '#475569', flexShrink: 0 }}>{counts.total}</span>
    </button>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function ClientAccessesTab({ clientId: initialClientId, clients = [], onSelectClient }) {
  const [spaces, setSpaces] = useState([])
  const [loadingSpaces, setLoadingSpaces] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || null)
  const [accesses, setAccesses] = useState([])
  const [loadingAccesses, setLoadingAccesses] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showArchivedSpaces, setShowArchivedSpaces] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [addModal, setAddModal] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  // Load all spaces
  const loadSpaces = useCallback(async () => {
    setLoadingSpaces(true)
    try {
      const res = await fetch(`/api/clients/password-spaces?include_archived=true`)
      const json = await res.json()
      setSpaces(json.spaces || [])
    } catch (_) {
      setSpaces([])
    } finally {
      setLoadingSpaces(false)
    }
  }, [])

  useEffect(() => { loadSpaces() }, [loadSpaces])

  // Sync initialClientId → ensure space exists → select
  useEffect(() => {
    if (!initialClientId) return
    setSelectedClientId(initialClientId)
    // Ensure space exists for this client
    fetch('/api/clients/password-spaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: initialClientId }),
    }).then(async (r) => {
      const json = await r.json()
      if (json.space) {
        setSpaces((prev) => {
          const exists = prev.find((s) => s.client_id === initialClientId)
          if (exists) return prev
          return [...prev, { ...json.space, counts: { total: 0, active: 0, pending: 0, problem: 0 } }]
        })
      }
    }).catch(() => {})
  }, [initialClientId])

  // Load accesses when selected client changes
  const loadAccesses = useCallback(async () => {
    if (!selectedClientId) return
    setLoadingAccesses(true)
    try {
      const res = await fetch(`/api/clients/accesses?client_id=${selectedClientId}&include_archived=true`)
      const json = await res.json()
      setAccesses(json.accesses || [])
    } catch (_) {
      setAccesses([])
    } finally {
      setLoadingAccesses(false)
    }
  }, [selectedClientId])

  useEffect(() => { loadAccesses() }, [loadAccesses])

  const handleSelectClient = async (clientId) => {
    setSelectedClientId(clientId)
    setSearch('')
    setFilterCat('all')
    setFilterStatus('all')
    onSelectClient?.(clients.find((c) => c.id === clientId))

    // Ensure space exists
    try {
      const res = await fetch('/api/clients/password-spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const json = await res.json()
      if (json.space) {
        setSpaces((prev) => {
          const exists = prev.find((s) => s.client_id === clientId)
          if (exists) return prev
          return [...prev, { ...json.space, counts: { total: 0, active: 0, pending: 0, problem: 0 } }]
        })
      }
    } catch (_) {}
  }

  const handleRevealPassword = async (id) => {
    try {
      const res = await fetch(`/api/clients/accesses?client_id=${selectedClientId}&reveal_id=${id}`)
      const json = await res.json()
      return json.password
    } catch { return null }
  }

  const handleAdd = async (payload) => {
    try {
      const res = await fetch('/api/clients/accesses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: selectedClientId, ...payload }),
      })
      const json = await res.json()
      if (json.access) {
        setAccesses((prev) => [...prev, json.access])
        setAddModal(null)
        showToast('Acesso salvo com sucesso.')
        refreshSpaceCounts(selectedClientId)
      }
    } catch (_) { showToast('Erro ao salvar.', 'error') }
  }

  const handleUpdate = async (payload) => {
    try {
      const res = await fetch('/api/clients/accesses', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.access) {
        setAccesses((prev) => prev.map((a) => a.id === json.access.id ? json.access : a))
        showToast('Alterações salvas.')
        refreshSpaceCounts(selectedClientId)
      }
    } catch (_) { showToast('Erro ao atualizar.', 'error') }
  }

  const handleArchiveAccess = async (id, is_archived) => {
    await handleUpdate({ id, is_archived })
    showToast(is_archived ? 'Acesso arquivado.' : 'Acesso desarquivado.')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este acesso permanentemente?')) return
    try {
      await fetch(`/api/clients/accesses?id=${id}`, { method: 'DELETE' })
      setAccesses((prev) => prev.filter((a) => a.id !== id))
      showToast('Acesso removido.')
      refreshSpaceCounts(selectedClientId)
    } catch (_) { showToast('Erro ao excluir.', 'error') }
  }

  const handleArchiveSpace = async (clientId, is_archived) => {
    try {
      await fetch('/api/clients/password-spaces', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, is_archived }),
      })
      setSpaces((prev) => prev.map((s) => s.client_id === clientId ? { ...s, is_archived } : s))
      showToast(is_archived ? 'Espaço arquivado.' : 'Espaço desarquivado.')
    } catch (_) { showToast('Erro ao arquivar.', 'error') }
  }

  const refreshSpaceCounts = async (clientId) => {
    try {
      const res = await fetch(`/api/clients/password-spaces?include_archived=true`)
      const json = await res.json()
      if (json.spaces) setSpaces(json.spaces)
    } catch (_) {}
  }

  // Clients that don't have a space yet
  const spacedClientIds = new Set(spaces.map((s) => s.client_id))
  const unspacedClients = clients.filter((c) => !spacedClientIds.has(c.id))

  // Displayed spaces
  const visibleSpaces = spaces.filter((s) => !s.is_archived || showArchivedSpaces)
  const archivedCount = spaces.filter((s) => s.is_archived).length

  // Current client info
  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const selectedSpace = spaces.find((s) => s.client_id === selectedClientId)

  // Filtered accesses
  const filtered = accesses.filter((a) => {
    if (!showArchived && a.is_archived) return false
    const q = search.toLowerCase()
    const matchSearch = !q || a.platform_name.toLowerCase().includes(q) || (a.login || '').toLowerCase().includes(q)
    const matchCat = filterCat === 'all' || a.category === filterCat
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const total = accesses.filter((a) => !a.is_archived).length
  const active = accesses.filter((a) => !a.is_archived && a.status === 'active').length
  const pending = accesses.filter((a) => !a.is_archived && a.status === 'pending').length
  const problem = accesses.filter((a) => !a.is_archived && (a.status === 'problem' || a.status === 'needs_update')).length
  const archivedAccesses = accesses.filter((a) => a.is_archived).length

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : G, color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className={`bx ${toast.type === 'error' ? 'bx-x-circle' : 'bx-check-circle'}`} style={{ fontSize: 16 }} />
          {toast.msg}
        </div>
      )}

      {/* ── Left sidebar: spaces ── */}
      <div style={{ width: 240, flexShrink: 0, background: SIDEBAR_BG, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sidebar header */}
        <div style={{ padding: '16px 12px 8px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <i className="bx bx-lock-alt" style={{ color: G, fontSize: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>Espaços de Acesso</span>
          </div>
        </div>

        {/* Space list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
          {loadingSpaces ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: SUB, fontSize: 12 }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 18 }} />
            </div>
          ) : (
            <>
              {visibleSpaces.map((space) => {
                const client = clients.find((c) => c.id === space.client_id)
                return (
                  <div key={space.client_id} style={{ position: 'relative' }}>
                    <SpaceCard space={space} client={client} isSelected={selectedClientId === space.client_id} onClick={() => handleSelectClient(space.client_id)} />
                    {selectedClientId === space.client_id && (
                      <button type="button" onClick={() => handleArchiveSpace(space.client_id, !space.is_archived)}
                        title={space.is_archived ? 'Desarquivar espaço' : 'Arquivar espaço'}
                        style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, opacity: 0.7 }}>
                        <i className={`bx ${space.is_archived ? 'bx-archive-out' : 'bx-archive-in'}`} style={{ fontSize: 13 }} />
                      </button>
                    )}
                  </div>
                )
              })}

              {/* Clients with no space yet */}
              {unspacedClients.map((client) => (
                <button key={client.id} type="button" onClick={() => handleSelectClient(client.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: '1px dashed rgba(148,163,184,.12)', borderRadius: 10, padding: '9px 10px', cursor: 'pointer', marginBottom: 2, opacity: 0.6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: SUB }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                    <div style={{ fontSize: 10, color: '#334155' }}>Clique para ativar</div>
                  </div>
                </button>
              ))}

              {archivedCount > 0 && (
                <button type="button" onClick={() => setShowArchivedSpaces((v) => !v)}
                  style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', color: '#334155', fontSize: 11, padding: '8px 4px', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <i className={`bx bx-chevron-${showArchivedSpaces ? 'down' : 'right'}`} style={{ fontSize: 13 }} />
                  {archivedCount} espaço{archivedCount > 1 ? 's' : ''} arquivado{archivedCount > 1 ? 's' : ''}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Right panel: accesses ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedClientId ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: SUB, gap: 12 }}>
            <i className="bx bx-lock-open-alt" style={{ fontSize: 52, color: '#1e293b' }} />
            <span style={{ fontSize: 14 }}>Selecione um cliente na barra lateral</span>
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: `1px solid ${BORDER}`, paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT }}>{selectedClient?.name || selectedClientId}</h2>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: SUB }}>Acessos e Plataformas</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedSpace?.is_archived && (
                    <button type="button" onClick={() => handleArchiveSpace(selectedClientId, false)}
                      style={{ background: 'rgba(148,163,184,.1)', border: 'none', borderRadius: 8, color: SUB, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <i className="bx bx-archive-out" /> Desarquivar espaço
                    </button>
                  )}
                  <button type="button" onClick={() => setAddModal('custom')}
                    style={{ background: G, border: 'none', borderRadius: 9, color: '#fff', padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className="bx bx-plus" /> Novo acesso
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { label: 'Total', value: total, color: SUB },
                  { label: 'Ativos', value: active, color: G },
                  { label: 'Pendentes', value: pending, color: '#f59e0b' },
                  { label: 'Atenção', value: problem, color: '#ef4444' },
                ].map((m) => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '6px 12px', display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.value}</span>
                    <span style={{ fontSize: 10, color: SUB, fontWeight: 600 }}>{m.label}</span>
                  </div>
                ))}
                {archivedAccesses > 0 && (
                  <button type="button" onClick={() => setShowArchived((v) => !v)}
                    style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '6px 12px', fontSize: 11, color: showArchived ? G : '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <i className={`bx bx-archive${showArchived ? '-out' : ''}`} />
                    {archivedAccesses} arquivado{archivedAccesses > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              {/* Search + filters */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                  <i className="bx bx-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SUB, fontSize: 14 }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...iStyle(), paddingLeft: 30, padding: '7px 10px 7px 30px' }} />
                </div>
                <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...iStyle(), width: 'auto', padding: '7px 10px' }}>
                  <option value="all">Todas</option>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...iStyle(), width: 'auto', padding: '7px 10px' }}>
                  <option value="all">Todos os status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            {/* Accesses grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 24px' }}>
              {loadingAccesses ? (
                <div style={{ color: SUB, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
                  <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 22, display: 'block', marginBottom: 8 }} />
                  Carregando acessos...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {CATEGORIES.map((cat) => {
                    const items = filtered.filter((a) => a.category === cat.key)
                    if (items.length === 0 && filterCat !== 'all' && filterCat !== cat.key) return null
                    if (items.length === 0 && (search || filterStatus !== 'all')) return null

                    return (
                      <div key={cat.key}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <i className={`bx ${cat.icon}`} style={{ fontSize: 17, color: cat.color }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cat.label}</span>
                          <span style={{ fontSize: 11, color: SUB, background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '2px 8px' }}>{items.length}</span>
                          <button type="button" onClick={() => setAddModal(cat.key)}
                            style={{ marginLeft: 'auto', background: 'transparent', border: `1px dashed ${cat.color}55`, borderRadius: 7, color: cat.color, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="bx bx-plus" style={{ fontSize: 12 }} /> Adicionar
                          </button>
                        </div>
                        {items.length === 0 ? (
                          <div style={{ color: '#334155', fontSize: 12, fontStyle: 'italic', paddingLeft: 28, paddingBottom: 4 }}>
                            Nenhum acesso nesta categoria.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                            {items.map((acc) => (
                              <AccessCard key={acc.id} access={acc}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                                onRevealPassword={handleRevealPassword}
                                onArchive={handleArchiveAccess}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {accesses.length === 0 && (
                    <div style={{ textAlign: 'center', color: SUB, padding: '50px 0' }}>
                      <i className="bx bx-lock-alt" style={{ fontSize: 44, display: 'block', marginBottom: 10, color: '#1e293b' }} />
                      <p style={{ margin: 0, fontSize: 14 }}>Nenhum acesso cadastrado.</p>
                      <p style={{ margin: '6px 0 0', fontSize: 12, color: '#475569' }}>Use os botões "Adicionar" por categoria ou "Novo acesso" no topo.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {addModal && (
        <AddAccessModal category={addModal} onClose={() => setAddModal(null)} onSaved={handleAdd} />
      )}
    </div>
  )
}
