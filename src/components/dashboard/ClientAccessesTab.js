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
const PANEL = '#111113'
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

function calcCompleteness(acc) {
  const fields = [acc.login, acc.has_password, acc.url, acc.notes, acc.platform_name]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / 5) * 100)
}

function primaryIcon(accesses) {
  if (!accesses?.length) return { icon: 'bx-lock-alt', color: '#475569' }
  const order = ['social', 'google', 'site', 'crm', 'custom']
  for (const cat of order) {
    const found = accesses.find((a) => a.category === cat)
    if (found) {
      const catDef = CATEGORIES.find((c) => c.key === cat)
      if (cat === 'custom' && found.icon) return { icon: found.icon, color: found.icon_color || catDef.color }
      return { icon: catDef.icon, color: catDef.color }
    }
  }
  return { icon: 'bx-lock-alt', color: '#475569' }
}

const iStyle = () => ({
  background: 'rgba(255,255,255,.05)', border: `1px solid ${BORDER}`, borderRadius: 8,
  color: TEXT, padding: '8px 11px', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box',
})
const labelSt = { fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 3 }

/* ─── PDF Export ─────────────────────────────────────────────────── */
async function exportToPDF({ clients, accessesByClient, revealPasswords, forClientId }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 18
  const contentW = pageW - margin * 2
  let y = margin

  const addPage = () => { doc.addPage(); y = margin }
  const checkPage = (need = 10) => { if (y + need > 280) addPage() }

  // Header
  doc.setFillColor(17, 17, 19)
  doc.rect(0, 0, pageW, 297, 'F')
  doc.setDrawColor(38, 194, 129)
  doc.setLineWidth(0.5)
  doc.line(margin, y + 8, margin + contentW, y + 8)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(226, 232, 240)
  doc.text('Relatório de Acessos', margin, y + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text(`Exportado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y + 12)
  if (revealPasswords) {
    doc.setTextColor(239, 68, 68)
    doc.text('⚠ Este documento contém senhas. Guarde com segurança.', margin, y + 17)
  }
  y += 25

  const targetClients = forClientId ? clients.filter((c) => c.id === forClientId) : clients

  for (const client of targetClients) {
    const accesses = (accessesByClient[client.id] || []).filter((a) => !a.is_archived)
    if (!accesses.length && forClientId) continue

    checkPage(20)

    // Client section header
    doc.setFillColor(26, 194, 129, 0.1)
    doc.setFillColor(30, 41, 59)
    doc.rect(margin, y, contentW, 10, 'F')
    doc.setDrawColor(38, 194, 129)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, contentW, 10, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(38, 194, 129)
    doc.text(client.name || client.id, margin + 4, y + 6.5)
    y += 14

    if (!accesses.length) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('Nenhum acesso cadastrado.', margin + 4, y)
      y += 8
      continue
    }

    for (const acc of accesses) {
      checkPage(28)

      const statusDef = STATUS_CONFIG[acc.status] || STATUS_CONFIG.active
      const catDef = CATEGORIES.find((c) => c.key === acc.category) || CATEGORIES[4]

      // Access block
      doc.setFillColor(20, 24, 30)
      doc.roundedRect(margin, y, contentW, 24, 2, 2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(226, 232, 240)
      doc.text(`${acc.platform_name}`, margin + 4, y + 5.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(catDef.label, margin + 4, y + 10)

      // Status badge
      const [r, gr, b] = statusDef.color.match(/\d+/g).map(Number)
      doc.setFillColor(r, gr, b)
      doc.roundedRect(pageW - margin - 28, y + 2, 26, 6, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text(statusDef.label, pageW - margin - 26, y + 5.8)

      // Fields
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      let row = y + 14
      const col2 = margin + contentW / 2

      if (acc.login) {
        doc.setTextColor(100, 116, 139)
        doc.text('Login:', margin + 4, row)
        doc.setTextColor(203, 213, 225)
        doc.text(acc.login, margin + 14, row)
      }

      if (acc.has_password) {
        doc.setTextColor(100, 116, 139)
        doc.text('Senha:', col2, row)
        doc.setTextColor(203, 213, 225)
        doc.text(revealPasswords ? (acc._password || '••••••••') : '••••••••', col2 + 10, row)
      }
      row += 5

      if (acc.url) {
        doc.setTextColor(100, 116, 139)
        doc.text('Link:', margin + 4, row)
        doc.setTextColor(96, 165, 250)
        const urlText = acc.url.length > 60 ? acc.url.slice(0, 57) + '...' : acc.url
        doc.text(urlText, margin + 12, row)
      }

      if (acc.notes) {
        doc.setTextColor(100, 116, 139)
        doc.text('Obs.:', col2, row)
        doc.setTextColor(148, 163, 184)
        const noteText = acc.notes.length > 40 ? acc.notes.slice(0, 37) + '...' : acc.notes
        doc.text(noteText, col2 + 10, row)
      }

      y += 28
    }
    y += 4
  }

  const filename = forClientId
    ? `acessos_${(clients.find((c) => c.id === forClientId)?.name || 'cliente').replace(/\s+/g, '_').toLowerCase()}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
    : `acessos_todos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`

  doc.save(filename)
}

/* ─── Export modal ───────────────────────────────────────────────── */
function ExportModal({ onClose, onExport }) {
  const [mode, setMode] = useState('hidden')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bx bx-file-pdf" style={{ fontSize: 22, color: '#ef4444' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Exportar PDF</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: SUB }}>Deseja incluir as senhas no PDF exportado?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { key: 'hidden', label: 'Exportar com senhas ocultas', icon: 'bx-hide', desc: 'Senhas aparecem como ••••••••', safe: true },
            { key: 'visible', label: 'Exportar com senhas visíveis', icon: 'bx-show', desc: 'Cuidado: dados sensíveis no PDF', safe: false },
          ].map((opt) => (
            <button key={opt.key} type="button" onClick={() => setMode(opt.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: mode === opt.key ? (opt.safe ? 'rgba(38,194,129,.12)' : 'rgba(239,68,68,.1)') : 'rgba(255,255,255,.04)', border: `1px solid ${mode === opt.key ? (opt.safe ? G : '#ef4444') : 'transparent'}`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left' }}>
              <i className={`bx ${opt.icon}`} style={{ fontSize: 18, color: mode === opt.key ? (opt.safe ? G : '#ef4444') : SUB, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: opt.safe ? SUB : '#ef4444' }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
        {mode === 'visible' && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#fca5a5', display: 'flex', gap: 8 }}>
            <i className="bx bx-error" style={{ flexShrink: 0, fontSize: 16 }} />
            Atenção: o PDF gerado conterá senhas em texto claro. Guarde e compartilhe com segurança.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => onExport(mode === 'visible')}
            style={{ flex: 1, background: G, border: 'none', borderRadius: 9, color: '#fff', padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <i className="bx bx-download" /> Gerar PDF
          </button>
          <button type="button" onClick={onClose}
            style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 9, color: SUB, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Add Access Modal ───────────────────────────────────────────── */
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
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

/* ─── Access row in detail drawer ────────────────────────────────── */
function AccessRow({ access, onUpdate, onDelete, onRevealPassword, onArchive }) {
  const [showPass, setShowPass] = useState(false)
  const [revealedPass, setRevealedPass] = useState(null)
  const [loadingPass, setLoadingPass] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)

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

  if (editing) {
    return (
      <div style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setShowIconPicker((v) => !v)}
            style={{ background: (draft.icon_color || access.icon_color) + '22', border: `1px solid ${(draft.icon_color || access.icon_color)}44`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: draft.icon_color || access.icon_color, fontSize: 12 }}>
            <i className={`bx ${draft.icon || access.icon}`} style={{ fontSize: 15 }} /> Ícone
          </button>
          {COLOR_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => setDraft((d) => ({ ...d, icon_color: c }))}
              style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: (draft.icon_color || access.icon_color) === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
          ))}
        </div>
        {showIconPicker && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, background: 'rgba(0,0,0,.3)', borderRadius: 8, padding: 8 }}>
            {ICON_OPTIONS.map((o) => (
              <button key={o.icon} type="button" title={o.label} onClick={() => { setDraft((d) => ({ ...d, icon: o.icon })); setShowIconPicker(false) }}
                style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 6, padding: 5, cursor: 'pointer', color: SUB }}>
                <i className={`bx ${o.icon}`} style={{ fontSize: 17 }} />
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input defaultValue={access.platform_name} onChange={(e) => setDraft((d) => ({ ...d, platform_name: e.target.value }))} placeholder="Nome" style={iStyle()} />
          <select defaultValue={access.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} style={iStyle()}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input defaultValue={access.login || ''} onChange={(e) => setDraft((d) => ({ ...d, login: e.target.value }))} placeholder="Login / E-mail" style={iStyle()} />
          <input type="password" onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))} placeholder="Nova senha (em branco = manter)" style={iStyle()} />
        </div>
        <input defaultValue={access.url || ''} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} placeholder="Link (https://...)" style={iStyle()} />
        <textarea defaultValue={access.notes || ''} onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))} rows={2} placeholder="Observações" style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleSave} disabled={saving} style={{ background: G, border: 'none', borderRadius: 7, color: '#fff', padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7, color: SUB, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '38px 1fr 1fr 1fr auto', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>
      {/* Icon */}
      <div style={{ width: 36, height: 36, borderRadius: 9, background: access.icon_color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className={`bx ${access.icon}`} style={{ fontSize: 18, color: access.icon_color }} />
      </div>

      {/* Name + category */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{access.platform_name}</div>
        <div style={{ fontSize: 11, color: SUB }}>{cat.label}</div>
        <span style={{ display: 'inline-block', marginTop: 3, fontSize: 10, fontWeight: 700, background: status.bg, color: status.color, borderRadius: 20, padding: '1px 8px' }}>{status.label}</span>
      </div>

      {/* Login */}
      <div>
        {access.login ? (
          <>
            <span style={{ ...labelSt }}>Login</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{access.login}</span>
              <button type="button" onClick={() => copyToClipboard(access.login, setCopiedLogin)}
                style={{ background: copiedLogin ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 5, cursor: 'pointer', color: copiedLogin ? G : SUB, padding: '2px 6px', fontSize: 10 }}>
                <i className={`bx ${copiedLogin ? 'bx-check' : 'bx-copy'}`} />
              </button>
            </div>
          </>
        ) : <span style={{ fontSize: 12, color: '#334155' }}>—</span>}
      </div>

      {/* Password + link */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {access.has_password && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: TEXT, fontFamily: showPass ? 'inherit' : 'monospace', letterSpacing: showPass ? 'normal' : 2 }}>
              {showPass ? (revealedPass ?? '...') : '••••••'}
            </span>
            <button type="button" onClick={handleReveal}
              style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 5, cursor: 'pointer', color: SUB, padding: '2px 5px', fontSize: 12 }}>
              <i className={`bx ${loadingPass ? 'bx-loader-alt bx-spin' : showPass ? 'bx-hide' : 'bx-show'}`} style={{ fontSize: 12 }} />
            </button>
            {showPass && revealedPass && (
              <button type="button" onClick={() => copyToClipboard(revealedPass, setCopiedPass)}
                style={{ background: copiedPass ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 5, cursor: 'pointer', color: copiedPass ? G : SUB, padding: '2px 6px', fontSize: 10 }}>
                <i className={`bx ${copiedPass ? 'bx-check' : 'bx-copy'}`} />
              </button>
            )}
          </div>
        )}
        {access.url && (
          <a href={access.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 3 }}>
            <i className="bx bx-link-external" style={{ fontSize: 12 }} /> Abrir
          </a>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <button type="button" onClick={() => { setDraft({}); setEditing(true) }} title="Editar"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: 4 }}>
          <i className="bx bx-edit" style={{ fontSize: 14 }} />
        </button>
        <button type="button" onClick={() => onArchive(access.id, !access.is_archived)} title={access.is_archived ? 'Desarquivar' : 'Arquivar'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: 4 }}>
          <i className={`bx ${access.is_archived ? 'bx-archive-out' : 'bx-archive-in'}`} style={{ fontSize: 14 }} />
        </button>
        <button type="button" onClick={() => onDelete(access.id)} title="Excluir"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
          <i className="bx bx-trash" style={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  )
}

/* ─── Client panel card ──────────────────────────────────────────── */
function ClientCard({ client, accesses, onClick, color }) {
  const active = (accesses || []).filter((a) => !a.is_archived && a.status === 'active').length
  const pending = (accesses || []).filter((a) => !a.is_archived && a.status === 'pending').length
  const problem = (accesses || []).filter((a) => !a.is_archived && (a.status === 'problem' || a.status === 'needs_update')).length
  const total = (accesses || []).filter((a) => !a.is_archived).length

  const completeness = total === 0 ? 0 : Math.round(
    (accesses || []).filter((a) => !a.is_archived).reduce((sum, a) => sum + calcCompleteness(a), 0) / total
  )

  const { icon, color: iconColor } = primaryIcon(accesses || [])
  const cardColor = color || client?.dashboardColor || G

  const hasIssue = problem > 0
  const hasPending = pending > 0

  return (
    <button type="button" onClick={onClick}
      style={{
        background: PANEL, border: `1px solid ${BORDER}`,
        borderRadius: 16, padding: '20px', cursor: 'pointer',
        textAlign: 'left', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: `0 0 0 0 ${cardColor}`,
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = cardColor + '66'; e.currentTarget.style.boxShadow = `0 0 20px ${cardColor}22` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}>

      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${cardColor}, transparent)`, borderRadius: '16px 16px 0 0' }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: iconColor + '22', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`bx ${icon}`} style={{ fontSize: 22, color: iconColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client?.name || 'Cliente'}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>
            {total === 0 ? 'Sem acessos cadastrados' : `${total} acesso${total > 1 ? 's' : ''}`}
          </div>
        </div>
        {(hasIssue || hasPending) && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasIssue ? '#ef4444' : '#f59e0b', flexShrink: 0, marginTop: 4 }} />
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>{active} ativos</span>
        {pending > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>· {pending} pend.</span>}
        {problem > 0 && <span style={{ fontSize: 11, color: '#ef4444' }}>· {problem} prob.</span>}
        {total === 0 && <span style={{ fontSize: 11, color: '#334155' }}>Clique para adicionar</span>}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completeness}%`, background: completeness < 40 ? '#ef4444' : completeness < 70 ? '#f59e0b' : G, borderRadius: 4, transition: 'width .4s' }} />
        </div>
        <div style={{ fontSize: 10, color: completeness < 40 ? '#ef4444' : completeness < 70 ? '#f59e0b' : SUB, marginTop: 5, fontWeight: 600 }}>
          {total === 0 ? '0% concluído' : `${completeness}% concluído`}
        </div>
      </div>
    </button>
  )
}

/* ─── "Todos" special card ───────────────────────────────────────── */
function AllCard({ totalAccesses, totalClients, problems, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        background: PANEL, border: `1px solid ${G}44`, borderRadius: 16, padding: '20px',
        cursor: 'pointer', textAlign: 'left', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 14,
        position: 'relative', overflow: 'hidden', gridColumn: 'span 1',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.boxShadow = `0 0 24px ${G}33` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${G}44`; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: G + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bx bx-layer" style={{ fontSize: 22, color: G }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: G }}>Todos os Clientes</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{totalClients} clientes · {totalAccesses} acessos</div>
        </div>
      </div>
      {problems > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ef4444' }}>
          <i className="bx bx-error" style={{ fontSize: 14 }} />
          {problems} acesso{problems > 1 ? 's' : ''} com problema
        </div>
      )}
      <div style={{ fontSize: 11, color: SUB }}>Visualize e exporte todos os acessos em uma única tela.</div>
    </button>
  )
}

/* ─── Detail Drawer ──────────────────────────────────────────────── */
function DetailDrawer({ client, accesses, allClients, allAccessesByClient, isAll, onClose, onAdd, onUpdate, onDelete, onRevealPassword, onArchive, onExport }) {
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const displayAccesses = isAll
    ? Object.entries(allAccessesByClient).flatMap(([cid, list]) =>
        list.map((a) => ({ ...a, _clientName: allClients?.find((c) => c.id === cid)?.name || cid }))
      )
    : (accesses || [])

  const filtered = displayAccesses.filter((a) => {
    if (!showArchived && a.is_archived) return false
    const q = search.toLowerCase()
    const matchSearch = !q || a.platform_name.toLowerCase().includes(q) || (a.login || '').toLowerCase().includes(q) || (a._clientName || '').toLowerCase().includes(q)
    const matchCat = filterCat === 'all' || a.category === filterCat
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  const archivedCount = displayAccesses.filter((a) => a.is_archived).length

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 820, background: '#0d0d0f', borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* Drawer header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT }}>
              {isAll ? 'Todos os Acessos' : client?.name || 'Cliente'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: SUB }}>
              {filtered.length} acesso{filtered.length !== 1 ? 's' : ''} {isAll ? 'de todos os clientes' : 'cadastrados'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isAll && (
              <button type="button" onClick={() => setAddModal('custom')}
                style={{ background: G, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bx bx-plus" /> Novo
              </button>
            )}
            <button type="button" onClick={onExport}
              style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: TEXT, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="bx bx-file-pdf" style={{ color: '#ef4444' }} /> Exportar PDF
            </button>
            <button type="button" onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: SUB, cursor: 'pointer', padding: 4 }}>
              <i className="bx bx-x" style={{ fontSize: 22 }} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: SUB, fontSize: 14 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...iStyle(), paddingLeft: 28, padding: '6px 8px 6px 28px' }} />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...iStyle(), width: 'auto', padding: '6px 8px' }}>
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...iStyle(), width: 'auto', padding: '6px 8px' }}>
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {archivedCount > 0 && (
            <button type="button" onClick={() => setShowArchived((v) => !v)}
              style={{ background: showArchived ? 'rgba(38,194,129,.12)' : 'rgba(255,255,255,.04)', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: showArchived ? G : SUB, cursor: 'pointer' }}>
              <i className={`bx bx-archive${showArchived ? '-out' : ''}`} /> {archivedCount} arq.
            </button>
          )}
        </div>

        {/* Category sections in drawer */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {CATEGORIES.map((cat) => {
            const items = filtered.filter((a) => a.category === cat.key)
            if (items.length === 0) return null
            return (
              <div key={cat.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 8px', background: 'rgba(255,255,255,.02)', borderBottom: `1px solid ${BORDER}` }}>
                  <i className={`bx ${cat.icon}`} style={{ fontSize: 15, color: cat.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{cat.label}</span>
                  <span style={{ fontSize: 11, color: SUB, background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '1px 7px' }}>{items.length}</span>
                  {!isAll && (
                    <button type="button" onClick={() => setAddModal(cat.key)}
                      style={{ marginLeft: 'auto', background: 'transparent', border: `1px dashed ${cat.color}55`, borderRadius: 6, color: cat.color, padding: '3px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      + Adicionar
                    </button>
                  )}
                </div>
                {items.map((acc) => (
                  <div key={acc.id}>
                    {isAll && acc._clientName && (
                      <div style={{ padding: '6px 20px 0', fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>{acc._clientName}</div>
                    )}
                    <AccessRow
                      access={acc}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onRevealPassword={onRevealPassword}
                      onArchive={onArchive}
                    />
                  </div>
                ))}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: SUB }}>
              <i className="bx bx-lock-alt" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: '#1e293b' }} />
              <p style={{ margin: 0, fontSize: 14 }}>Nenhum acesso encontrado.</p>
              {!isAll && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#334155' }}>Use o botão "Novo" para adicionar um acesso.</p>}
            </div>
          )}
        </div>
      </div>

      {addModal && (
        <AddAccessModal category={addModal} onClose={() => setAddModal(null)} onSaved={async (payload) => { await onAdd(payload); setAddModal(null) }} />
      )}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function ClientAccessesTab({ clients = [] }) {
  const [accessesByClient, setAccessesByClient] = useState({})
  const [loadingAll, setLoadingAll] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(null) // null = closed, 'all' = all
  const [showExportModal, setShowExportModal] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  // Load all accesses for all clients at once
  const loadAll = useCallback(async () => {
    if (!clients.length) { setLoadingAll(false); return }
    setLoadingAll(true)
    try {
      const results = await Promise.all(
        clients.map((c) =>
          fetch(`/api/clients/accesses?client_id=${c.id}&include_archived=true`)
            .then((r) => r.json())
            .then((j) => ({ clientId: c.id, accesses: j.accesses || [] }))
            .catch(() => ({ clientId: c.id, accesses: [] }))
        )
      )
      const map = {}
      results.forEach(({ clientId, accesses }) => { map[clientId] = accesses })
      setAccessesByClient(map)
    } finally {
      setLoadingAll(false)
    }
  }, [clients])

  useEffect(() => { loadAll() }, [loadAll])

  const handleRevealPassword = async (id) => {
    try {
      const clientId = selectedClientId && selectedClientId !== 'all' ? selectedClientId
        : Object.entries(accessesByClient).find(([, list]) => list.find((a) => a.id === id))?.[0]
      if (!clientId) return null
      const res = await fetch(`/api/clients/accesses?client_id=${clientId}&reveal_id=${id}`)
      const json = await res.json()
      return json.password
    } catch { return null }
  }

  const handleAdd = async (payload) => {
    const clientId = selectedClientId
    try {
      const res = await fetch('/api/clients/accesses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ...payload }),
      })
      const json = await res.json()
      if (json.access) {
        setAccessesByClient((prev) => ({ ...prev, [clientId]: [...(prev[clientId] || []), json.access] }))
        showToast('Acesso salvo.')
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
        setAccessesByClient((prev) => {
          const updated = { ...prev }
          for (const cid of Object.keys(updated)) {
            updated[cid] = updated[cid].map((a) => a.id === json.access.id ? json.access : a)
          }
          return updated
        })
        showToast('Alterações salvas.')
      }
    } catch (_) { showToast('Erro ao atualizar.', 'error') }
  }

  const handleArchive = async (id, is_archived) => {
    await handleUpdate({ id, is_archived })
    showToast(is_archived ? 'Arquivado.' : 'Desarquivado.')
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este acesso permanentemente?')) return
    try {
      await fetch(`/api/clients/accesses?id=${id}`, { method: 'DELETE' })
      setAccessesByClient((prev) => {
        const updated = { ...prev }
        for (const cid of Object.keys(updated)) {
          updated[cid] = updated[cid].filter((a) => a.id !== id)
        }
        return updated
      })
      showToast('Acesso removido.')
    } catch (_) { showToast('Erro ao excluir.', 'error') }
  }

  const handleExport = async (revealPasswords) => {
    setShowExportModal(false)
    try {
      // If reveal, fetch all passwords
      let enrichedByClient = { ...accessesByClient }
      if (revealPasswords) {
        const toReveal = Object.entries(accessesByClient).flatMap(([cid, list]) =>
          list.filter((a) => a.has_password && !a.is_archived).map((a) => ({ clientId: cid, id: a.id }))
        )
        await Promise.all(toReveal.map(async ({ clientId, id }) => {
          const res = await fetch(`/api/clients/accesses?client_id=${clientId}&reveal_id=${id}`)
          const { password } = await res.json()
          enrichedByClient = {
            ...enrichedByClient,
            [clientId]: enrichedByClient[clientId].map((a) => a.id === id ? { ...a, _password: password } : a),
          }
        }))
      }
      await exportToPDF({
        clients,
        accessesByClient: enrichedByClient,
        revealPasswords,
        forClientId: selectedClientId !== 'all' ? selectedClientId : null,
      })
      showToast('PDF gerado com sucesso.')
    } catch (err) {
      showToast('Erro ao gerar PDF.', 'error')
    }
  }

  // Filtered clients for card grid
  const filteredClients = clients.filter((c) => {
    if (!search) return true
    return c.name?.toLowerCase().includes(search.toLowerCase())
  })

  const allTotal = Object.values(accessesByClient).flat().filter((a) => !a.is_archived).length
  const allProblems = Object.values(accessesByClient).flat().filter((a) => !a.is_archived && (a.status === 'problem' || a.status === 'needs_update')).length

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const selectedAccesses = selectedClientId && selectedClientId !== 'all' ? (accessesByClient[selectedClientId] || []) : []

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : G, color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
          <i className={`bx ${toast.type === 'error' ? 'bx-x-circle' : 'bx-check-circle'}`} style={{ fontSize: 16 }} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '22px 24px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT }}>Acessos dos Clientes</h2>
        <p style={{ margin: '4px 0 16px', fontSize: 13, color: SUB }}>Consulte, organize e exporte os dados de acesso de cada cliente.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SUB, fontSize: 15 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ ...iStyle(), paddingLeft: 32 }} />
          </div>
          <button type="button" onClick={() => setShowExportModal(true)}
            style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 9, color: '#ef4444', padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bx bx-file-pdf" style={{ fontSize: 15 }} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ padding: '20px 24px 32px' }}>
        {loadingAll ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: SUB }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 28, display: 'block', marginBottom: 10 }} />
            Carregando acessos...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {/* Todos card */}
            <AllCard
              totalAccesses={allTotal}
              totalClients={clients.length}
              problems={allProblems}
              onClick={() => setSelectedClientId('all')}
            />

            {/* Client cards */}
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                accesses={accessesByClient[client.id] || []}
                onClick={() => setSelectedClientId(client.id)}
              />
            ))}

            {filteredClients.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: SUB }}>
                Nenhum cliente encontrado para "{search}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedClientId && (
        <DetailDrawer
          client={selectedClient}
          accesses={selectedAccesses}
          allClients={clients}
          allAccessesByClient={accessesByClient}
          isAll={selectedClientId === 'all'}
          onClose={() => setSelectedClientId(null)}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onRevealPassword={handleRevealPassword}
          onArchive={handleArchive}
          onExport={() => setShowExportModal(true)}
        />
      )}

      {/* Export modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} onExport={handleExport} />
      )}
    </div>
  )
}
