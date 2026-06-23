'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

/* ─── Constants ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  active:       { label: 'Ativo',               color: '#26c281', bg: 'rgba(38,194,129,.15)' },
  pending:      { label: 'Pendente',            color: '#f59e0b', bg: 'rgba(245,158,11,.15)' },
  in_review:    { label: 'Em revisão',          color: '#60a5fa', bg: 'rgba(96,165,250,.15)' },
  outdated:     { label: 'Desatualizado',       color: '#fb923c', bg: 'rgba(251,146,60,.15)' },
  no_access:    { label: 'Sem acesso',          color: '#94a3b8', bg: 'rgba(148,163,184,.15)' },
  needs_update: { label: 'Precisa atualizar',   color: '#f97316', bg: 'rgba(249,115,22,.15)' },
  problem:      { label: 'Com problema',        color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
}

// All categories — access + operational + material
const CATEGORIES = [
  // Accesses (have login/password)
  { key: 'social',    label: 'Redes Sociais',    icon: 'bxl-instagram',   color: '#e1306c', type: 'access' },
  { key: 'google',    label: 'Google',            icon: 'bxl-google',      color: '#4285f4', type: 'access' },
  { key: 'site',      label: 'Site',              icon: 'bx-globe',        color: '#06b6d4', type: 'access' },
  { key: 'crm',       label: 'CRM',               icon: 'bx-filter-alt',   color: '#a78bfa', type: 'access' },
  { key: 'custom',    label: 'Personalizado',     icon: 'bx-plus-circle',  color: '#26c281', type: 'access' },
  // Operational (no login/password)
  { key: 'location',  label: 'Localização',       icon: 'bx-map-pin',      color: '#f97316', type: 'operational' },
  { key: 'whatsapp',  label: 'WhatsApp Business', icon: 'bxl-whatsapp',    color: '#25D366', type: 'operational' },
  // Materials (links/files)
  { key: 'document',  label: 'Documento',         icon: 'bx-file-blank',   color: '#60a5fa', type: 'material' },
  { key: 'link',      label: 'Link Importante',   icon: 'bx-link',         color: '#c084fc', type: 'material' },
  { key: 'sheet',     label: 'Planilha',          icon: 'bx-spreadsheet',  color: '#34d399', type: 'material' },
]

const ACCESS_CATS = CATEGORIES.filter((c) => c.type === 'access')
const OP_CATS     = CATEGORIES.filter((c) => c.type === 'operational')
const MAT_CATS    = CATEGORIES.filter((c) => c.type === 'material')

const DOC_TYPES = ['Contrato', 'Briefing', 'Proposta comercial', 'Documento institucional', 'Manual de marca', 'Apresentação', 'PDF do cliente', 'Termo de aprovação', 'Onboarding', 'Outro']
const LINK_CATS_OPTIONS = ['Site institucional', 'Landing page', 'WhatsApp', 'Formulário', 'Reunião', 'Drive', 'Canva', 'Painel do cliente', 'Proposta', 'Relatório', 'Pasta compartilhada', 'Outro']
const SHEET_TYPES = ['Leads', 'Qualificação', 'Relatórios', 'Indicadores', 'Comercial', 'Mídia', 'Orçamento', 'Campanhas', 'Contatos', 'Outro']

const DEFAULT_PLATFORMS = {
  social:  ['Instagram', 'Facebook', 'Meta Business', 'LinkedIn', 'TikTok'],
  google:  ['Google Ads', 'Google Analytics', 'Google Tag Manager', 'Google Meu Negócio', 'Gmail'],
  site:    ['WordPress', 'Hostinger', 'Registro.br', 'Cloudflare', 'Elementor'],
  crm:     ['Agendor', 'RD Station', 'Pipedrive', 'HubSpot', 'Kommo'],
  custom:  [],
  location:[], whatsapp:[],
}

const ICON_OPTIONS = [
  { icon: 'bx-globe' }, { icon: 'bx-lock-alt' }, { icon: 'bx-cog' }, { icon: 'bxl-whatsapp' },
  { icon: 'bx-desktop' }, { icon: 'bx-data' }, { icon: 'bx-cloud' }, { icon: 'bx-link' },
  { icon: 'bx-folder' }, { icon: 'bx-wrench' }, { icon: 'bx-line-chart' }, { icon: 'bx-code-alt' },
  { icon: 'bx-user' }, { icon: 'bx-key' }, { icon: 'bx-store' }, { icon: 'bx-mail-send' },
  { icon: 'bxl-instagram' }, { icon: 'bxl-facebook' }, { icon: 'bxl-google' }, { icon: 'bxl-wordpress' },
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
  navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800) })
}

function buildWaLink(country, ddd, number, message) {
  const digits = `${country || '55'}${ddd || ''}${(number || '').replace(/\D/g, '')}`
  if (!digits) return ''
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

function buildMapsLink(meta) {
  const q = [meta.address, meta.city, meta.state, meta.country].filter(Boolean).join(', ')
  if (!q) return ''
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}`
}

function calcCompleteness(acc) {
  const fields = [acc.login, acc.has_password, acc.url, acc.notes, acc.platform_name]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / 5) * 100)
}

function primaryIcon(accesses) {
  if (!accesses?.length) return { icon: 'bx-lock-alt', color: '#475569' }
  for (const cat of CATEGORIES) {
    const found = accesses.find((a) => a.category === cat.key)
    if (found) {
      if (cat.key === 'custom' && found.icon) return { icon: found.icon, color: found.icon_color || cat.color }
      return { icon: cat.icon, color: cat.color }
    }
  }
  return { icon: 'bx-lock-alt', color: '#475569' }
}

const iStyle = () => ({
  background: 'rgba(255,255,255,.05)', border: `1px solid ${BORDER}`, borderRadius: 8,
  color: TEXT, padding: '8px 11px', fontSize: 13, width: '100%', outline: 'none', boxSizing: 'border-box',
})
const labelSt = { fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: 3 }
const label2 = { ...labelSt, color: '#4b5563' }

/* ─── PDF Export ─────────────────────────────────────────────────── */
async function exportToPDF({ clients, accessesByClient, revealPasswords, forClientId }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210, margin = 18, contentW = pageW - margin * 2
  let y = margin

  const addPage = () => { doc.addPage(); y = margin; doc.setFillColor(17, 17, 19); doc.rect(0, 0, pageW, 297, 'F') }
  const checkPage = (need = 10) => { if (y + need > 280) addPage() }

  doc.setFillColor(17, 17, 19); doc.rect(0, 0, pageW, 297, 'F')
  doc.setDrawColor(38, 194, 129); doc.setLineWidth(0.5); doc.line(margin, y + 8, margin + contentW, y + 8)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(226, 232, 240)
  doc.text('Relatório de Dados do Cliente', margin, y + 5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(148, 163, 184)
  doc.text(`Exportado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y + 12)
  if (revealPasswords) { doc.setTextColor(239, 68, 68); doc.text('⚠ Documento contém senhas. Guarde com segurança.', margin, y + 17) }
  y += 25

  const targetClients = forClientId ? clients.filter((c) => c.id === forClientId) : clients

  for (const client of targetClients) {
    const accesses = (accessesByClient[client.id] || []).filter((a) => !a.is_archived)
    if (!accesses.length && forClientId) continue
    checkPage(20)
    doc.setFillColor(30, 41, 59); doc.rect(margin, y, contentW, 10, 'F')
    doc.setDrawColor(38, 194, 129); doc.setLineWidth(0.3); doc.rect(margin, y, contentW, 10, 'S')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(38, 194, 129)
    doc.text(client.name || client.id, margin + 4, y + 6.5)
    y += 14

    // Accesses
    const accessItems = accesses.filter((a) => CATEGORIES.find((c) => c.key === a.category)?.type === 'access')
    if (accessItems.length) {
      checkPage(8); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.text('ACESSOS E PLATAFORMAS', margin + 2, y); y += 6
      for (const acc of accessItems) {
        checkPage(28)
        const statusDef = STATUS_CONFIG[acc.status] || STATUS_CONFIG.active
        doc.setFillColor(20, 24, 30); doc.roundedRect(margin, y, contentW, 24, 2, 2, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(226, 232, 240); doc.text(acc.platform_name, margin + 4, y + 5.5)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text(CATEGORIES.find((c) => c.key === acc.category)?.label || '', margin + 4, y + 10)
        const hexColor = statusDef.color.replace('#', '')
        const [r, gr, b] = [0, 2, 4].map((i) => parseInt(hexColor.slice(i, i + 2), 16))
        doc.setFillColor(r, gr, b); doc.roundedRect(pageW - margin - 28, y + 2, 26, 6, 1, 1, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.text(statusDef.label, pageW - margin - 26, y + 5.8)
        let row = y + 14; const col2 = margin + contentW / 2
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
        if (acc.login) { doc.setTextColor(100, 116, 139); doc.text('Login:', margin + 4, row); doc.setTextColor(203, 213, 225); doc.text(acc.login, margin + 14, row) }
        if (acc.has_password) { doc.setTextColor(100, 116, 139); doc.text('Senha:', col2, row); doc.setTextColor(203, 213, 225); doc.text(revealPasswords ? (acc._password || '••••••••') : '••••••••', col2 + 10, row) }
        row += 5
        if (acc.url) { doc.setTextColor(100, 116, 139); doc.text('Link:', margin + 4, row); doc.setTextColor(96, 165, 250); doc.text((acc.url || '').slice(0, 60), margin + 12, row) }
        if (acc.notes) { doc.setTextColor(100, 116, 139); doc.text('Obs.:', col2, row); doc.setTextColor(148, 163, 184); doc.text((acc.notes || '').slice(0, 40), col2 + 10, row) }
        y += 28
      }
    }

    // Location
    const locations = accesses.filter((a) => a.category === 'location')
    if (locations.length) {
      checkPage(8); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.text('LOCALIZAÇÃO', margin + 2, y); y += 6
      for (const loc of locations) {
        checkPage(28); const m = loc.metadata || {}
        doc.setFillColor(20, 24, 30); doc.roundedRect(margin, y, contentW, 26, 2, 2, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(249, 115, 22); doc.text(loc.platform_name, margin + 4, y + 5.5)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(203, 213, 225)
        if (m.address) doc.text(`${m.address}${m.city ? ', ' + m.city : ''}${m.state ? '/' + m.state : ''}`, margin + 4, y + 11)
        if (m.maps_link) { doc.setTextColor(96, 165, 250); doc.text(m.maps_link.slice(0, 70), margin + 4, y + 17) }
        if (loc.notes) { doc.setTextColor(148, 163, 184); doc.text((loc.notes || '').slice(0, 80), margin + 4, y + 23) }
        y += 30
      }
    }

    // WhatsApp
    const whatsapps = accesses.filter((a) => a.category === 'whatsapp')
    if (whatsapps.length) {
      checkPage(8); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.text('WHATSAPP BUSINESS', margin + 2, y); y += 6
      for (const wa of whatsapps) {
        checkPage(26); const m = wa.metadata || {}
        doc.setFillColor(20, 24, 30); doc.roundedRect(margin, y, contentW, 24, 2, 2, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(37, 211, 102); doc.text(wa.platform_name, margin + 4, y + 5.5)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
        if (m.responsible_name) { doc.setTextColor(148, 163, 184); doc.text(`Responsável: ${m.responsible_name}`, margin + 4, y + 11) }
        const phone = `+${m.phone_country || '55'} (${m.phone_ddd || ''}) ${m.phone_number || ''}`
        doc.setTextColor(203, 213, 225); doc.text(phone, margin + 4, y + 16)
        if (m.wa_link) { doc.setTextColor(96, 165, 250); doc.text(m.wa_link.slice(0, 70), margin + 4, y + 21) }
        y += 28
      }
    }

    // Materials (documents, links, sheets)
    const matItems = accesses.filter((a) => ['document', 'link', 'sheet'].includes(a.category))
    if (matItems.length) {
      checkPage(8); doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(148, 163, 184); doc.text('MATERIAIS E ARQUIVOS', margin + 2, y); y += 6
      for (const mat of matItems) {
        checkPage(30); const m = mat.metadata || {}
        const catLabel = { document: 'Documento', link: 'Link', sheet: 'Planilha' }[mat.category] || 'Material'
        const subtype = m.doc_type || m.link_category || m.sheet_type || ''
        const statusDef = STATUS_CONFIG[mat.status] || STATUS_CONFIG.active
        doc.setFillColor(20, 24, 30); doc.roundedRect(margin, y, contentW, 28, 2, 2, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(226, 232, 240); doc.text((mat.metadata?.is_favorite ? '⭐ ' : '') + mat.platform_name, margin + 4, y + 5.5)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184)
        doc.text(`${catLabel}${subtype ? ' · ' + subtype : ''}`, margin + 4, y + 10)
        const hexColor = statusDef.color.replace('#', '')
        const [r, gr, b] = [0, 2, 4].map((i) => parseInt(hexColor.slice(i, i + 2), 16))
        doc.setFillColor(r, gr, b); doc.roundedRect(pageW - margin - 28, y + 2, 26, 6, 1, 1, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255); doc.text(statusDef.label, pageW - margin - 26, y + 5.8)
        if (m.description) { doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(148, 163, 184); doc.text((m.description).slice(0, 80), margin + 4, y + 16) }
        if (mat.url) { doc.setTextColor(96, 165, 250); doc.text(mat.url.slice(0, 80), margin + 4, y + 22) }
        y += 32
      }
    }
    y += 4
  }

  const filename = forClientId
    ? `dados_${(clients.find((c) => c.id === forClientId)?.name || 'cliente').replace(/\s+/g, '_').toLowerCase()}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
    : `dados_clientes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
  doc.save(filename)
}

/* ─── Export Modal ───────────────────────────────────────────────── */
function ExportModal({ onClose, onExport }) {
  const [mode, setMode] = useState('hidden')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bx bx-file-pdf" style={{ fontSize: 22, color: '#ef4444' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Exportar dados do cliente</span>
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
            Atenção: o PDF conterá senhas em texto claro. Compartilhe com segurança.
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => onExport(mode === 'visible')}
            style={{ flex: 1, background: G, border: 'none', borderRadius: 9, color: '#fff', padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <i className="bx bx-download" /> Gerar PDF
          </button>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 9, color: SUB, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Location Form ──────────────────────────────────────────────── */
function LocationForm({ form, onChange }) {
  const meta = form.metadata || {}
  const setMeta = (k, v) => onChange('metadata', { ...meta, [k]: v })

  const mapsLink = buildMapsLink(meta)
  const [showMap, setShowMap] = useState(false)

  // Auto-update maps link when address changes
  useEffect(() => {
    if (mapsLink) onChange('metadata', { ...meta, maps_link: mapsLink })
  }, [meta.address, meta.city, meta.state, meta.country]) // eslint-disable-line

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={form.platform_name} onChange={(e) => onChange('platform_name', e.target.value)} placeholder="Nome da unidade / local *" style={iStyle()} />
      <input value={meta.address || ''} onChange={(e) => setMeta('address', e.target.value)} placeholder="Endereço completo (Rua, número, bairro)" style={iStyle()} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input value={meta.city || ''} onChange={(e) => setMeta('city', e.target.value)} placeholder="Cidade" style={iStyle()} />
        <input value={meta.state || ''} onChange={(e) => setMeta('state', e.target.value)} placeholder="Estado (ex: RS)" style={iStyle()} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input value={meta.zip || ''} onChange={(e) => setMeta('zip', e.target.value)} placeholder="CEP" style={iStyle()} />
        <input value={meta.country || 'Brasil'} onChange={(e) => setMeta('country', e.target.value)} placeholder="País" style={iStyle()} />
      </div>

      {/* Google Maps preview */}
      {mapsLink && (
        <div>
          <button type="button" onClick={() => setShowMap((v) => !v)}
            style={{ background: 'rgba(249,115,22,.12)', border: '1px solid rgba(249,115,22,.3)', borderRadius: 8, color: '#f97316', padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <i className={`bx ${showMap ? 'bx-hide' : 'bx-map'}`} style={{ fontSize: 14 }} />
            {showMap ? 'Ocultar mapa' : 'Ver no mapa'}
          </button>
          {showMap && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <iframe
                title="Google Maps"
                src={`https://maps.google.com/maps?q=${encodeURIComponent([meta.address, meta.city, meta.state, meta.country].filter(Boolean).join(', '))}&output=embed&hl=pt-BR`}
                width="100%" height="220" style={{ border: 'none', display: 'block' }}
                loading="lazy"
              />
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input value={meta.lat || ''} onChange={(e) => setMeta('lat', e.target.value)} placeholder="Latitude (opcional)" style={iStyle()} />
        <input value={meta.lng || ''} onChange={(e) => setMeta('lng', e.target.value)} placeholder="Longitude (opcional)" style={iStyle()} />
      </div>
      <input value={meta.maps_link || ''} onChange={(e) => setMeta('maps_link', e.target.value)} placeholder="Link Google Maps (gerado automaticamente)" style={iStyle()} />
      <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Observações (usar nesse endereço nas campanhas, etc.)" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
    </div>
  )
}

/* ─── WhatsApp Form ──────────────────────────────────────────────── */
function WhatsAppForm({ form, onChange }) {
  const meta = form.metadata || {}
  const setMeta = (k, v) => onChange('metadata', { ...meta, [k]: v })

  // Auto-build wa.me link
  useEffect(() => {
    const link = buildWaLink(meta.phone_country, meta.phone_ddd, meta.phone_number, meta.default_message)
    onChange('metadata', { ...meta, wa_link: link })
  }, [meta.phone_country, meta.phone_ddd, meta.phone_number, meta.default_message]) // eslint-disable-line

  const [copiedLink, setCopiedLink] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={form.platform_name} onChange={(e) => onChange('platform_name', e.target.value)} placeholder="Nome do WhatsApp / Identificação *" style={iStyle()} />
      <input value={meta.responsible_name || ''} onChange={(e) => setMeta('responsible_name', e.target.value)} placeholder="Nome do responsável pelo número" style={iStyle()} />
      <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr', gap: 8 }}>
        <input value={meta.phone_country || '55'} onChange={(e) => setMeta('phone_country', e.target.value)} placeholder="+55" style={iStyle()} />
        <input value={meta.phone_ddd || ''} onChange={(e) => setMeta('phone_ddd', e.target.value)} placeholder="DDD" style={iStyle()} />
        <input value={meta.phone_number || ''} onChange={(e) => setMeta('phone_number', e.target.value)} placeholder="99999-9999" style={iStyle()} />
      </div>

      {/* Auto-generated link */}
      {meta.wa_link && (
        <div style={{ background: 'rgba(37,211,102,.08)', border: '1px solid rgba(37,211,102,.25)', borderRadius: 9, padding: '10px 12px' }}>
          <span style={{ ...labelSt, color: '#25D366', marginBottom: 5 }}>Link gerado automaticamente</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href={meta.wa_link} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meta.wa_link}
            </a>
            <button type="button" onClick={() => copyToClipboard(meta.wa_link, setCopiedLink)}
              style={{ background: copiedLink ? 'rgba(37,211,102,.2)' : 'rgba(255,255,255,.08)', border: 'none', borderRadius: 6, cursor: 'pointer', color: copiedLink ? '#25D366' : SUB, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>
              {copiedLink ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      )}

      <input value={meta.default_message || ''} onChange={(e) => setMeta('default_message', e.target.value)} placeholder="Mensagem inicial (opcional, ex: Olá, vim pelo anúncio)" style={iStyle()} />

      <select value={form.status} onChange={(e) => onChange('status', e.target.value)} style={iStyle()}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Observações (número usado no Meta Ads, recebe leads, etc.)" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
    </div>
  )
}

/* ─── Standard Access Form ───────────────────────────────────────── */
function AccessForm({ form, onChange, category }) {
  const [showIconPicker, setShowIconPicker] = useState(false)
  const suggestions = DEFAULT_PLATFORMS[category] || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {suggestions.length > 0 && (
        <div>
          <span style={{ ...labelSt, marginBottom: 6 }}>Sugestões</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => onChange('platform_name', s)}
                style={{ background: form.platform_name === s ? G + '22' : 'rgba(255,255,255,.05)', border: `1px solid ${form.platform_name === s ? G : 'transparent'}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, color: form.platform_name === s ? G : SUB, cursor: 'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <input value={form.platform_name} onChange={(e) => onChange('platform_name', e.target.value)} placeholder="Nome da plataforma *" style={iStyle()} />

      {category === 'custom' && (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowIconPicker((v) => !v)}
              style={{ background: form.icon_color + '22', border: `1px solid ${form.icon_color}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: form.icon_color, fontSize: 12 }}>
              <i className={`bx ${form.icon}`} style={{ fontSize: 18 }} /> Ícone
            </button>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => onChange('icon_color', c)}
                  style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: form.icon_color === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          {showIconPicker && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 10 }}>
              {ICON_OPTIONS.map((o) => (
                <button key={o.icon} type="button" onClick={() => { onChange('icon', o.icon); setShowIconPicker(false) }}
                  style={{ background: form.icon === o.icon ? form.icon_color + '33' : 'transparent', border: `1px solid ${form.icon === o.icon ? form.icon_color : 'transparent'}`, borderRadius: 7, padding: 6, cursor: 'pointer', color: form.icon === o.icon ? form.icon_color : SUB }}>
                  <i className={`bx ${o.icon}`} style={{ fontSize: 18 }} />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input value={form.login} onChange={(e) => onChange('login', e.target.value)} placeholder="Login / E-mail / Usuário" style={iStyle()} />
        <input value={form.password} onChange={(e) => onChange('password', e.target.value)} type="password" placeholder="Senha" style={iStyle()} />
      </div>
      <input value={form.url} onChange={(e) => onChange('url', e.target.value)} placeholder="Link de acesso (https://...)" style={iStyle()} />
      <select value={form.status} onChange={(e) => onChange('status', e.target.value)} style={iStyle()}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Observações" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
    </div>
  )
}

/* ─── Document Form ──────────────────────────────────────────────── */
function DocumentForm({ form, onChange }) {
  const meta = form.metadata || {}
  const setMeta = (k, v) => onChange('metadata', { ...meta, [k]: v })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={form.platform_name} onChange={(e) => onChange('platform_name', e.target.value)} placeholder="Nome do documento *" style={iStyle()} />
      <select value={meta.doc_type || ''} onChange={(e) => setMeta('doc_type', e.target.value)} style={iStyle()}>
        <option value="">Tipo do documento</option>
        {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input value={form.url} onChange={(e) => onChange('url', e.target.value)} placeholder="Link do documento (Drive, Dropbox, etc.)" style={iStyle()} />
      <textarea value={meta.description || ''} onChange={(e) => setMeta('description', e.target.value)} placeholder="Descrição" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
      <select value={form.status} onChange={(e) => onChange('status', e.target.value)} style={iStyle()}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Observações" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
    </div>
  )
}

/* ─── Link Form ──────────────────────────────────────────────────── */
function LinkForm({ form, onChange }) {
  const meta = form.metadata || {}
  const setMeta = (k, v) => onChange('metadata', { ...meta, [k]: v })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={form.platform_name} onChange={(e) => onChange('platform_name', e.target.value)} placeholder="Nome do link *" style={iStyle()} />
      <input value={form.url} onChange={(e) => onChange('url', e.target.value)} placeholder="URL (https://...)" style={iStyle()} />
      <select value={meta.link_category || ''} onChange={(e) => setMeta('link_category', e.target.value)} style={iStyle()}>
        <option value="">Categoria do link</option>
        {LINK_CATS_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea value={meta.description || ''} onChange={(e) => setMeta('description', e.target.value)} placeholder="Descrição" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
      <select value={form.status} onChange={(e) => onChange('status', e.target.value)} style={iStyle()}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Observações" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
    </div>
  )
}

/* ─── Sheet Form ─────────────────────────────────────────────────── */
function SheetForm({ form, onChange }) {
  const meta = form.metadata || {}
  const setMeta = (k, v) => onChange('metadata', { ...meta, [k]: v })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input value={form.platform_name} onChange={(e) => onChange('platform_name', e.target.value)} placeholder="Nome da planilha *" style={iStyle()} />
      <input value={form.url} onChange={(e) => onChange('url', e.target.value)} placeholder="Link da planilha (Google Sheets, etc.)" style={iStyle()} />
      <select value={meta.sheet_type || ''} onChange={(e) => setMeta('sheet_type', e.target.value)} style={iStyle()}>
        <option value="">Tipo da planilha</option>
        {SHEET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea value={meta.description || ''} onChange={(e) => setMeta('description', e.target.value)} placeholder="Descrição" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
      <select value={form.status} onChange={(e) => onChange('status', e.target.value)} style={iStyle()}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)} placeholder="Observações" rows={2} style={{ ...iStyle(), resize: 'vertical', fontFamily: 'inherit' }} />
    </div>
  )
}

/* ─── Material Card (document / link / sheet) ────────────────────── */
function MaterialCard({ access, onUpdate, onDelete, onArchive }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ platform_name: access.platform_name, url: access.url || '', notes: access.notes || '', status: access.status, metadata: { ...(access.metadata || {}) } })
  const [saving, setSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const cat = CATEGORIES.find((c) => c.key === access.category) || { icon: 'bx-file', color: '#60a5fa', label: 'Material' }
  const status = STATUS_CONFIG[access.status] || STATUS_CONFIG.active
  const meta = access.metadata || {}
  const isFav = !!meta.is_favorite

  const handleSave = async () => {
    setSaving(true)
    await onUpdate({ id: access.id, platform_name: form.platform_name, url: form.url, notes: form.notes, status: form.status, metadata: form.metadata })
    setEditing(false)
    setSaving(false)
  }

  const toggleFav = () => onUpdate({ id: access.id, metadata: { ...meta, is_favorite: !isFav } })

  return (
    <div style={{ background: PANEL, border: `1px solid ${isFav ? cat.color + '55' : BORDER}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bx ${cat.icon}`} style={{ fontSize: 18, color: cat.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: TEXT, display: 'flex', alignItems: 'center', gap: 5 }}>
            {access.platform_name}
            {isFav && <i className="bx bxs-star" style={{ fontSize: 11, color: '#f59e0b' }} />}
          </div>
          <div style={{ fontSize: 11, color: SUB }}>{meta.doc_type || meta.link_category || meta.sheet_type || cat.label}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, background: status.bg, color: status.color, borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>{status.label}</span>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button type="button" onClick={toggleFav} title={isFav ? 'Remover dos favoritos' : 'Favoritar'}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isFav ? '#f59e0b' : SUB, padding: 3 }}>
            <i className={`bx bx${isFav ? 's' : ''}-star`} style={{ fontSize: 13 }} />
          </button>
          <button type="button" onClick={() => setEditing(!editing)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: 3 }}><i className="bx bx-edit" style={{ fontSize: 13 }} /></button>
          <button type="button" onClick={() => onArchive(access.id, !access.is_archived)} title={access.is_archived ? 'Desarquivar' : 'Arquivar'}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: 3 }}>
            <i className={`bx ${access.is_archived ? 'bx-archive-out' : 'bx-archive-in'}`} style={{ fontSize: 13 }} />
          </button>
          <button type="button" onClick={() => { if (window.confirm('Excluir este item permanentemente?')) onDelete(access.id) }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 3 }}>
            <i className="bx bx-trash" style={{ fontSize: 13 }} />
          </button>
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {access.category === 'document' ? <DocumentForm form={form} onChange={onChange} /> :
           access.category === 'link' ? <LinkForm form={form} onChange={onChange} /> :
           <SheetForm form={form} onChange={onChange} />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSave} disabled={saving}
              style={{ background: G, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditing(false)}
              style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: SUB, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {meta.description && <p style={{ margin: 0, fontSize: 12, color: SUB, lineHeight: 1.5 }}>{meta.description}</p>}
          {access.notes && <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5, fontStyle: 'italic' }}>{access.notes}</p>}
          {access.url && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <a href={access.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: cat.color + '18', color: cat.color, border: `1px solid ${cat.color}33`, borderRadius: 7, padding: '5px 10px', textDecoration: 'none', fontWeight: 600 }}>
                <i className="bx bx-link-external" style={{ fontSize: 13 }} /> Abrir
              </a>
              <button type="button" onClick={() => copyToClipboard(access.url, setCopiedLink)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, background: copiedLink ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', color: copiedLink ? G : SUB, border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                <i className={`bx ${copiedLink ? 'bx-check' : 'bx-copy'}`} style={{ fontSize: 13 }} />
                {copiedLink ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
          )}
          <div style={{ fontSize: 10, color: '#334155', borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
            Atualizado em {new Date(access.updated_at).toLocaleDateString('pt-BR')}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Add Modal ──────────────────────────────────────────────────── */
function AddModal({ category: initCat, onClose, onSaved }) {
  const [category, setCategory] = useState(initCat || 'social')
  const catDef = CATEGORIES.find((c) => c.key === category) || CATEGORIES[0]
  const [form, setForm] = useState({ platform_name: '', icon: catDef.icon, icon_color: catDef.color, login: '', password: '', url: '', notes: '', status: 'active', metadata: {} })
  const [saving, setSaving] = useState(false)

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleCatChange = (key) => {
    const cd = CATEGORIES.find((c) => c.key === key) || CATEGORIES[0]
    setCategory(key)
    setForm((f) => ({ ...f, platform_name: '', icon: cd.icon, icon_color: cd.color, metadata: {} }))
  }

  const handleSave = async () => {
    if (!form.platform_name.trim()) return
    setSaving(true)
    const meta = form.metadata || {}
    const enrichedMeta = category === 'location'
      ? { ...meta, maps_link: buildMapsLink(meta) }
      : category === 'whatsapp'
        ? { ...meta, wa_link: buildWaLink(meta.phone_country, meta.phone_ddd, meta.phone_number, meta.default_message) }
        : meta
    await onSaved({ ...form, metadata: enrichedMeta, category })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#18181b', border: `1px solid ${BORDER}`, borderRadius: 16, width: '100%', maxWidth: 560, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Novo dado</span>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: SUB, cursor: 'pointer' }}><i className="bx bx-x" style={{ fontSize: 20 }} /></button>
        </div>

        {/* Category picker */}
        <div>
          <span style={{ ...labelSt, marginBottom: 6 }}>Acessos</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {ACCESS_CATS.map((cat) => (
              <button key={cat.key} type="button" onClick={() => handleCatChange(cat.key)}
                style={{ background: category === cat.key ? cat.color + '22' : 'rgba(255,255,255,.05)', border: `1px solid ${category === cat.key ? cat.color + '88' : 'transparent'}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: category === cat.key ? cat.color : SUB, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className={`bx ${cat.icon}`} style={{ fontSize: 12 }} />
                {cat.label}
              </button>
            ))}
          </div>
          <span style={{ ...labelSt, marginBottom: 6 }}>Operacional</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {OP_CATS.map((cat) => (
              <button key={cat.key} type="button" onClick={() => handleCatChange(cat.key)}
                style={{ background: category === cat.key ? cat.color + '22' : 'rgba(255,255,255,.05)', border: `1px solid ${category === cat.key ? cat.color + '88' : 'transparent'}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: category === cat.key ? cat.color : SUB, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className={`bx ${cat.icon}`} style={{ fontSize: 12 }} />
                {cat.label}
              </button>
            ))}
          </div>
          <span style={{ ...labelSt, marginBottom: 6 }}>Materiais e Arquivos</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {MAT_CATS.map((cat) => (
              <button key={cat.key} type="button" onClick={() => handleCatChange(cat.key)}
                style={{ background: category === cat.key ? cat.color + '22' : 'rgba(255,255,255,.05)', border: `1px solid ${category === cat.key ? cat.color + '88' : 'transparent'}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: category === cat.key ? cat.color : SUB, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className={`bx ${cat.icon}`} style={{ fontSize: 12 }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Favorite toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={!!(form.metadata?.is_favorite)} onChange={(e) => onChange('metadata', { ...(form.metadata || {}), is_favorite: e.target.checked })}
            style={{ accentColor: '#f59e0b', width: 14, height: 14 }} />
          <span style={{ fontSize: 12, color: SUB, display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="bx bxs-star" style={{ color: '#f59e0b', fontSize: 13 }} /> Marcar como favorito / principal
          </span>
        </label>

        {/* Dynamic form */}
        {category === 'location' ? (
          <LocationForm form={form} onChange={onChange} />
        ) : category === 'whatsapp' ? (
          <WhatsAppForm form={form} onChange={onChange} />
        ) : category === 'document' ? (
          <DocumentForm form={form} onChange={onChange} />
        ) : category === 'link' ? (
          <LinkForm form={form} onChange={onChange} />
        ) : category === 'sheet' ? (
          <SheetForm form={form} onChange={onChange} />
        ) : (
          <AccessForm form={form} onChange={onChange} category={category} />
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleSave} disabled={saving || !form.platform_name.trim()}
            style={{ flex: 1, background: G, border: 'none', borderRadius: 9, color: '#fff', padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving || !form.platform_name.trim() ? .6 : 1 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 9, color: SUB, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Location Card ──────────────────────────────────────────────── */
function LocationCard({ access, onUpdate, onDelete }) {
  const m = access.metadata || {}
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ platform_name: access.platform_name, notes: access.notes || '', metadata: { ...m } })
  const [saving, setSaving] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const mapsQuery = [m.address, m.city, m.state].filter(Boolean).join(', ')

  const handleSave = async () => {
    setSaving(true)
    const meta = form.metadata || {}
    const enrichedMeta = { ...meta, maps_link: buildMapsLink(meta) }
    await onUpdate({ id: access.id, platform_name: form.platform_name, notes: form.notes, metadata: enrichedMeta })
    setEditing(false)
    setSaving(false)
  }

  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(249,115,22,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="bx bx-map-pin" style={{ fontSize: 20, color: '#f97316' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{access.platform_name}</div>
          {m.city && <div style={{ fontSize: 11, color: SUB }}>{m.city}{m.state ? `/${m.state}` : ''}</div>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={() => setEditing(!editing)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: 4 }}><i className="bx bx-edit" style={{ fontSize: 14 }} /></button>
          <button type="button" onClick={() => onDelete(access.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><i className="bx bx-trash" style={{ fontSize: 14 }} /></button>
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LocationForm form={form} onChange={onChange} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSave} disabled={saving} style={{ background: G, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: SUB, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          {m.address && <div style={{ fontSize: 12, color: TEXT }}>{m.address}{m.city ? `, ${m.city}` : ''}{m.state ? `/${m.state}` : ''}{m.zip ? ` — CEP ${m.zip}` : ''}</div>}
          {access.notes && <p style={{ margin: 0, fontSize: 12, color: SUB, lineHeight: 1.5 }}>{access.notes}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {m.maps_link && (
              <a href={m.maps_link} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#60a5fa', background: 'rgba(96,165,250,.1)', borderRadius: 7, padding: '4px 10px', textDecoration: 'none' }}>
                <i className="bx bx-map-alt" style={{ fontSize: 13 }} /> Abrir no Maps
              </a>
            )}
            {mapsQuery && (
              <button type="button" onClick={() => setShowMap((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#f97316', background: 'rgba(249,115,22,.1)', borderRadius: 7, padding: '4px 10px', border: 'none', cursor: 'pointer' }}>
                <i className={`bx ${showMap ? 'bx-hide' : 'bx-map'}`} style={{ fontSize: 13 }} /> {showMap ? 'Ocultar mapa' : 'Ver mapa'}
              </button>
            )}
          </div>
          {showMap && mapsQuery && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
              <iframe
                title="mapa"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed&hl=pt-BR`}
                width="100%" height="200" style={{ border: 'none', display: 'block' }} loading="lazy"
              />
            </div>
          )}
          <div style={{ fontSize: 10, color: '#334155', borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
            Atualizado em {new Date(access.updated_at).toLocaleDateString('pt-BR')}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── WhatsApp Card ──────────────────────────────────────────────── */
function WhatsAppCard({ access, onUpdate, onDelete }) {
  const m = access.metadata || {}
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ platform_name: access.platform_name, notes: access.notes || '', status: access.status, metadata: { ...m } })
  const [saving, setSaving] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const status = STATUS_CONFIG[access.status] || STATUS_CONFIG.active
  const phone = `+${m.phone_country || '55'} (${m.phone_ddd || ''}) ${m.phone_number || ''}`

  const handleSave = async () => {
    setSaving(true)
    const meta = form.metadata || {}
    const enrichedMeta = { ...meta, wa_link: buildWaLink(meta.phone_country, meta.phone_ddd, meta.phone_number, meta.default_message) }
    await onUpdate({ id: access.id, platform_name: form.platform_name, notes: form.notes, status: form.status, metadata: enrichedMeta })
    setEditing(false)
    setSaving(false)
  }

  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(37,211,102,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="bxl-whatsapp" style={{ fontSize: 20, color: '#25D366' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{access.platform_name}</div>
          {m.responsible_name && <div style={{ fontSize: 11, color: SUB }}>{m.responsible_name}</div>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, background: status.bg, color: status.color, borderRadius: 20, padding: '2px 8px' }}>{status.label}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" onClick={() => setEditing(!editing)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: 4 }}><i className="bx bx-edit" style={{ fontSize: 14 }} /></button>
          <button type="button" onClick={() => onDelete(access.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><i className="bx bx-trash" style={{ fontSize: 14 }} /></button>
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <WhatsAppForm form={form} onChange={onChange} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSave} disabled={saving} style={{ background: G, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Salvando...' : 'Salvar'}</button>
            <button type="button" onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: SUB, padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>{phone}</div>
          {m.wa_link && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(37,211,102,.06)', borderRadius: 8, padding: '8px 10px' }}>
              <a href={m.wa_link} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#60a5fa', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.wa_link}</a>
              <button type="button" onClick={() => copyToClipboard(m.wa_link, setCopiedLink)}
                style={{ background: copiedLink ? 'rgba(37,211,102,.2)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: copiedLink ? '#25D366' : SUB, padding: '3px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {copiedLink ? '✓ Copiado' : 'Copiar link'}
              </button>
            </div>
          )}
          {m.default_message && <div style={{ fontSize: 11, color: SUB }}><i className="bx bx-chat" style={{ marginRight: 4 }} />Msg: {m.default_message}</div>}
          {access.notes && <p style={{ margin: 0, fontSize: 12, color: SUB, lineHeight: 1.5 }}>{access.notes}</p>}
          <div style={{ fontSize: 10, color: '#334155', borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>Atualizado em {new Date(access.updated_at).toLocaleDateString('pt-BR')}</div>
        </>
      )}
    </div>
  )
}

/* ─── Standard Access Card ───────────────────────────────────────── */
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

  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: access.icon_color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bx ${access.icon}`} style={{ fontSize: 20, color: access.icon_color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: TEXT }}>{access.platform_name}</div>
          <div style={{ fontSize: 11, color: SUB }}>{cat.label}</div>
        </div>
        <select value={access.status} onChange={(e) => onUpdate({ id: access.id, status: e.target.value })}
          style={{ background: status.bg, color: status.color, border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, padding: '3px 10px', cursor: 'pointer', outline: 'none' }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {editing ? (
        <AccessForm form={{ ...access, login: access.login || '', password: '', url: access.url || '', notes: access.notes || '', ...draft }} onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))} category={access.category} />
      ) : (
        <>
          {access.login && (
            <div><span style={labelSt}>Login</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: TEXT, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{access.login}</span>
                <button type="button" onClick={() => copyToClipboard(access.login, setCopiedLogin)}
                  style={{ background: copiedLogin ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: copiedLogin ? G : SUB, padding: '3px 8px', fontSize: 11 }}>
                  <i className={`bx ${copiedLogin ? 'bx-check' : 'bx-copy'}`} />
                </button>
              </div>
            </div>
          )}
          {access.has_password && (
            <div><span style={labelSt}>Senha</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: TEXT, fontSize: 13, fontFamily: showPass ? 'inherit' : 'monospace', letterSpacing: showPass ? 'normal' : 2, flex: 1 }}>{showPass ? (revealedPass ?? '...') : '••••••••••'}</span>
                <button type="button" onClick={handleReveal} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: SUB, padding: '3px 7px' }}>
                  <i className={`bx ${loadingPass ? 'bx-loader-alt bx-spin' : showPass ? 'bx-hide' : 'bx-show'}`} style={{ fontSize: 14 }} />
                </button>
                {showPass && revealedPass && (
                  <button type="button" onClick={() => copyToClipboard(revealedPass, setCopiedPass)}
                    style={{ background: copiedPass ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: copiedPass ? G : SUB, padding: '3px 8px', fontSize: 11 }}>
                    <i className={`bx ${copiedPass ? 'bx-check' : 'bx-copy'}`} />
                  </button>
                )}
              </div>
            </div>
          )}
          {access.url && (
            <div><span style={labelSt}>Link</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <a href={access.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{access.url}</a>
                <button type="button" onClick={() => window.open(access.url, '_blank')} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: SUB, padding: '3px 7px' }}>
                  <i className="bx bx-link-external" style={{ fontSize: 14 }} />
                </button>
                <button type="button" onClick={() => copyToClipboard(access.url, setCopiedLink)}
                  style={{ background: copiedLink ? 'rgba(38,194,129,.15)' : 'rgba(255,255,255,.06)', border: 'none', borderRadius: 6, cursor: 'pointer', color: copiedLink ? G : SUB, padding: '3px 8px', fontSize: 11 }}>
                  <i className={`bx ${copiedLink ? 'bx-check' : 'bx-copy'}`} />
                </button>
              </div>
            </div>
          )}
          {access.notes && <p style={{ margin: 0, color: SUB, fontSize: 12, lineHeight: 1.5 }}>{access.notes}</p>}
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
        <span style={{ fontSize: 10, color: '#475569' }}>{new Date(access.updated_at).toLocaleDateString('pt-BR')}</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {editing ? (
            <>
              <button type="button" onClick={handleSave} disabled={saving} style={{ background: G, border: 'none', borderRadius: 7, color: '#fff', padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{saving ? '...' : 'Salvar'}</button>
              <button type="button" onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 7, color: SUB, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Cancelar</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => onArchive(access.id, !access.is_archived)} title={access.is_archived ? 'Desarquivar' : 'Arquivar'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: '3px 5px' }}><i className={`bx ${access.is_archived ? 'bx-archive-out' : 'bx-archive-in'}`} style={{ fontSize: 14 }} /></button>
              <button type="button" onClick={() => { setDraft({}); setEditing(true) }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: SUB, padding: '3px 5px' }}><i className="bx bx-edit" style={{ fontSize: 14 }} /></button>
              <button type="button" onClick={() => onDelete(access.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '3px 5px' }}><i className="bx bx-trash" style={{ fontSize: 14 }} /></button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Client Panel Card ──────────────────────────────────────────── */
function ClientCard({ client, accesses, onClick }) {
  const active = (accesses || []).filter((a) => !a.is_archived && a.status === 'active').length
  const pending = (accesses || []).filter((a) => !a.is_archived && a.status === 'pending').length
  const problem = (accesses || []).filter((a) => !a.is_archived && (a.status === 'problem' || a.status === 'needs_update')).length
  const total = (accesses || []).filter((a) => !a.is_archived).length
  const completeness = total === 0 ? 0 : Math.round((accesses || []).filter((a) => !a.is_archived).reduce((s, a) => s + calcCompleteness(a), 0) / total)
  const { icon, color: iconColor } = primaryIcon(accesses || [])
  const cardColor = client?.dashboardColor || G
  const hasIssue = problem > 0

  return (
    <button type="button" onClick={onClick}
      style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, cursor: 'pointer', textAlign: 'left', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = cardColor + '66'; e.currentTarget.style.boxShadow = `0 0 20px ${cardColor}22` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${cardColor}, transparent)`, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: iconColor + '22', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className={`bx ${icon}`} style={{ fontSize: 22, color: iconColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client?.name || 'Cliente'}</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{total === 0 ? 'Sem dados cadastrados' : `${total} registro${total > 1 ? 's' : ''}`}</div>
        </div>
        {hasIssue && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 4 }} />}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 11, color: G, fontWeight: 600 }}>{active} ativos</span>
        {pending > 0 && <span style={{ fontSize: 11, color: '#f59e0b' }}>· {pending} pend.</span>}
        {problem > 0 && <span style={{ fontSize: 11, color: '#ef4444' }}>· {problem} prob.</span>}
        {total === 0 && <span style={{ fontSize: 11, color: '#334155' }}>Clique para adicionar</span>}
      </div>
      <div>
        <div style={{ height: 4, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${completeness}%`, background: completeness < 40 ? '#ef4444' : completeness < 70 ? '#f59e0b' : G, borderRadius: 4, transition: 'width .4s' }} />
        </div>
        <div style={{ fontSize: 10, color: completeness < 40 ? '#ef4444' : completeness < 70 ? '#f59e0b' : SUB, marginTop: 5, fontWeight: 600 }}>{completeness}% completo</div>
      </div>
    </button>
  )
}

function AllCard({ totalAccesses, totalClients, problems, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{ background: PANEL, border: `1px solid ${G}44`, borderRadius: 16, padding: 20, cursor: 'pointer', textAlign: 'left', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', overflow: 'hidden' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = G; e.currentTarget.style.boxShadow = `0 0 24px ${G}33` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${G}44`; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${G}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: G + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bx bx-layer" style={{ fontSize: 22, color: G }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: G }}>Todos os Clientes</div>
          <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>{totalClients} clientes · {totalAccesses} registros</div>
        </div>
      </div>
      {problems > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ef4444' }}><i className="bx bx-error" style={{ fontSize: 14 }} />{problems} com problema</div>}
      <div style={{ fontSize: 11, color: SUB }}>Visualize e exporte todos os dados em uma única tela.</div>
    </button>
  )
}

/* ─── Drawer ─────────────────────────────────────────────────────── */
function DetailDrawer({ client, accesses, allClients, allAccessesByClient, isAll, onClose, onAdd, onUpdate, onDelete, onRevealPassword, onArchive, onExport }) {
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const displayAccesses = isAll
    ? Object.entries(allAccessesByClient).flatMap(([cid, list]) => list.map((a) => ({ ...a, _clientName: allClients?.find((c) => c.id === cid)?.name || cid })))
    : (accesses || [])

  const filtered = displayAccesses.filter((a) => {
    if (!showArchived && a.is_archived) return false
    const q = search.toLowerCase()
    const matchSearch = !q || a.platform_name.toLowerCase().includes(q) || (a.login || '').toLowerCase().includes(q) || (a._clientName || '').toLowerCase().includes(q) || (a.metadata?.description || '').toLowerCase().includes(q)
    const matchCat = filterCat === 'all' || filterCat === 'favorites'
      ? (filterCat === 'favorites' ? !!(a.metadata?.is_favorite) : true)
      : a.category === filterCat
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  // Sort: favorites first within each section
  const sortItems = (list) => [...list].sort((a, b) => (b.metadata?.is_favorite ? 1 : 0) - (a.metadata?.is_favorite ? 1 : 0))

  const archivedCount = displayAccesses.filter((a) => a.is_archived).length
  const accessItems = sortItems(filtered.filter((a) => CATEGORIES.find((c) => c.key === a.category)?.type === 'access'))
  const locations = filtered.filter((a) => a.category === 'location')
  const whatsapps = filtered.filter((a) => a.category === 'whatsapp')
  const materials = sortItems(filtered.filter((a) => CATEGORIES.find((c) => c.key === a.category)?.type === 'material'))
  const favCount = displayAccesses.filter((a) => !a.is_archived && a.metadata?.is_favorite).length

  const renderCatSection = (catItems, catKey) => {
    if (catItems.length === 0) return null
    const catDef = CATEGORIES.find((c) => c.key === catKey) || CATEGORIES[0]
    return (
      <div key={catKey} style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px 8px', background: 'rgba(255,255,255,.02)', borderBottom: `1px solid ${BORDER}` }}>
          <i className={`bx ${catDef.icon}`} style={{ fontSize: 14, color: catDef.color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{catDef.label}</span>
          <span style={{ fontSize: 11, color: SUB, background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '1px 7px' }}>{catItems.length}</span>
          {!isAll && <button type="button" onClick={() => setAddModal(catKey)} style={{ marginLeft: 'auto', background: 'transparent', border: `1px dashed ${catDef.color}55`, borderRadius: 6, color: catDef.color, padding: '3px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar</button>}
        </div>
        {catItems.map((acc) => (
          <div key={acc.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${BORDER}` }}>
            {isAll && acc._clientName && <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{acc._clientName}</div>}
            {acc.category === 'location' ? (
              <LocationCard access={acc} onUpdate={onUpdate} onDelete={onDelete} />
            ) : acc.category === 'whatsapp' ? (
              <WhatsAppCard access={acc} onUpdate={onUpdate} onDelete={onDelete} />
            ) : (
              <AccessCard access={acc} onUpdate={onUpdate} onDelete={onDelete} onRevealPassword={onRevealPassword} onArchive={onArchive} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const accessCatKeys = [...new Set(accessItems.map((a) => a.category))]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 860, background: '#0d0d0f', borderLeft: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT }}>{isAll ? 'Todos os Dados' : client?.name || 'Cliente'}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: SUB }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''} {isAll ? 'de todos os clientes' : 'cadastrados'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isAll && (
              <button type="button" onClick={() => setAddModal('social')}
                style={{ background: G, border: 'none', borderRadius: 8, color: '#fff', padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bx bx-plus" /> Novo dado
              </button>
            )}
            <button type="button" onClick={onExport}
              style={{ background: 'rgba(255,255,255,.06)', border: 'none', borderRadius: 8, color: TEXT, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="bx bx-file-pdf" style={{ color: '#ef4444' }} /> Exportar
            </button>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: SUB, cursor: 'pointer', padding: 4 }}><i className="bx bx-x" style={{ fontSize: 22 }} /></button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: SUB, fontSize: 14 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...iStyle(), paddingLeft: 28, padding: '6px 8px 6px 28px' }} />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ ...iStyle(), width: 'auto', padding: '6px 8px' }}>
            <option value="all">Todos os tipos</option>
            {favCount > 0 && <option value="favorites">⭐ Favoritos ({favCount})</option>}
            <optgroup label="Acessos">{ACCESS_CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</optgroup>
            <optgroup label="Operacional">{OP_CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</optgroup>
            <optgroup label="Materiais">{MAT_CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</optgroup>
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

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Access section header */}
          {accessItems.length > 0 && (
            <div style={{ padding: '10px 20px 6px', background: 'rgba(255,255,255,.015)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '.8px' }}>Acessos e Plataformas</span>
            </div>
          )}
          {accessCatKeys.map((catKey) => renderCatSection(accessItems.filter((a) => a.category === catKey), catKey))}

          {/* Operational section header */}
          {(locations.length > 0 || whatsapps.length > 0) && (
            <div style={{ padding: '10px 20px 6px', background: 'rgba(255,255,255,.015)', marginTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '.8px' }}>Informações Operacionais</span>
            </div>
          )}
          {locations.length > 0 && renderCatSection(locations, 'location')}
          {whatsapps.length > 0 && renderCatSection(whatsapps, 'whatsapp')}

          {/* Materials section */}
          {materials.length > 0 && (
            <div style={{ padding: '10px 20px 6px', background: 'rgba(255,255,255,.015)', marginTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '.8px' }}>Materiais e Arquivos</span>
            </div>
          )}
          {materials.length > 0 && MAT_CATS.map((cat) => {
            const catItems = materials.filter((a) => a.category === cat.key)
            if (!catItems.length) return null
            return (
              <div key={cat.key} style={{ marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px 8px', background: 'rgba(255,255,255,.02)', borderBottom: `1px solid ${BORDER}` }}>
                  <i className={`bx ${cat.icon}`} style={{ fontSize: 14, color: cat.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{cat.label}</span>
                  <span style={{ fontSize: 11, color: SUB, background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '1px 7px' }}>{catItems.length}</span>
                  {!isAll && <button type="button" onClick={() => setAddModal(cat.key)} style={{ marginLeft: 'auto', background: 'transparent', border: `1px dashed ${cat.color}55`, borderRadius: 6, color: cat.color, padding: '3px 9px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ Adicionar</button>}
                </div>
                {catItems.map((acc) => (
                  <div key={acc.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${BORDER}` }}>
                    {isAll && acc._clientName && <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>{acc._clientName}</div>}
                    <MaterialCard access={acc} onUpdate={onUpdate} onDelete={onDelete} onArchive={onArchive} />
                  </div>
                ))}
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: SUB }}>
              <i className="bx bx-data" style={{ fontSize: 40, display: 'block', marginBottom: 10, color: '#1e293b' }} />
              <p style={{ margin: 0, fontSize: 14 }}>Nenhum dado encontrado.</p>
              {!isAll && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#334155' }}>Use "Novo dado" para adicionar.</p>}
            </div>
          )}
        </div>
      </div>

      {addModal && (
        <AddModal category={addModal} onClose={() => setAddModal(null)} onSaved={async (payload) => { await onAdd(payload); setAddModal(null) }} />
      )}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function ClientAccessesTab({ clients = [] }) {
  const [accessesByClient, setAccessesByClient] = useState({})
  const [loadingAll, setLoadingAll] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  const loadAll = useCallback(async () => {
    if (!clients.length) { setLoadingAll(false); return }
    setLoadingAll(true)
    try {
      const results = await Promise.all(
        clients.map((c) =>
          fetch(`/api/clients/accesses?client_id=${c.id}&include_archived=true`)
            .then((r) => r.json()).then((j) => ({ clientId: c.id, accesses: j.accesses || [] })).catch(() => ({ clientId: c.id, accesses: [] }))
        )
      )
      const map = {}
      results.forEach(({ clientId, accesses }) => { map[clientId] = accesses })
      setAccessesByClient(map)
    } finally { setLoadingAll(false) }
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
        showToast('Dado cadastrado com sucesso.')
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
          for (const cid of Object.keys(updated)) updated[cid] = updated[cid].map((a) => a.id === json.access.id ? json.access : a)
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
    if (!window.confirm('Excluir este dado permanentemente?')) return
    try {
      await fetch(`/api/clients/accesses?id=${id}`, { method: 'DELETE' })
      setAccessesByClient((prev) => {
        const updated = { ...prev }
        for (const cid of Object.keys(updated)) updated[cid] = updated[cid].filter((a) => a.id !== id)
        return updated
      })
      showToast('Dado removido.')
    } catch (_) { showToast('Erro ao excluir.', 'error') }
  }

  const handleExport = async (revealPasswords) => {
    setShowExportModal(false)
    try {
      let enrichedByClient = { ...accessesByClient }
      if (revealPasswords) {
        const toReveal = Object.entries(accessesByClient).flatMap(([cid, list]) =>
          list.filter((a) => a.has_password && !a.is_archived).map((a) => ({ clientId: cid, id: a.id }))
        )
        await Promise.all(toReveal.map(async ({ clientId, id }) => {
          const res = await fetch(`/api/clients/accesses?client_id=${clientId}&reveal_id=${id}`)
          const { password } = await res.json()
          enrichedByClient = { ...enrichedByClient, [clientId]: enrichedByClient[clientId].map((a) => a.id === id ? { ...a, _password: password } : a) }
        }))
      }
      await exportToPDF({ clients, accessesByClient: enrichedByClient, revealPasswords, forClientId: selectedClientId !== 'all' ? selectedClientId : null })
      showToast('PDF gerado com sucesso.')
    } catch (err) { showToast('Erro ao gerar PDF.', 'error') }
  }

  const filteredClients = clients.filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()))
  const allTotal = Object.values(accessesByClient).flat().filter((a) => !a.is_archived).length
  const allProblems = Object.values(accessesByClient).flat().filter((a) => !a.is_archived && (a.status === 'problem' || a.status === 'needs_update')).length
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : G, color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
          <i className={`bx ${toast.type === 'error' ? 'bx-x-circle' : 'bx-check-circle'}`} style={{ fontSize: 16 }} />
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '22px 24px 16px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: TEXT }}>Dados dos Clientes</h2>
        <p style={{ margin: '4px 0 16px', fontSize: 13, color: SUB }}>Consulte, organize e exporte os dados de cada cliente — acessos, localizações, WhatsApp e mais.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <i className="bx bx-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: SUB, fontSize: 15 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ ...iStyle(), paddingLeft: 32 }} />
          </div>
          <button type="button" onClick={() => setShowExportModal(true)}
            style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 9, color: '#ef4444', padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bx bx-file-pdf" style={{ fontSize: 15 }} /> Exportar dados
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ padding: '20px 24px 32px' }}>
        {loadingAll ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: SUB }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 28, display: 'block', marginBottom: 10 }} />
            Carregando dados...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            <AllCard totalAccesses={allTotal} totalClients={clients.length} problems={allProblems} onClick={() => setSelectedClientId('all')} />
            {filteredClients.map((client) => (
              <ClientCard key={client.id} client={client} accesses={accessesByClient[client.id] || []} onClick={() => setSelectedClientId(client.id)} />
            ))}
            {filteredClients.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: SUB }}>Nenhum cliente encontrado para "{search}"</div>
            )}
          </div>
        )}
      </div>

      {selectedClientId && (
        <DetailDrawer
          client={selectedClient}
          accesses={selectedClientId !== 'all' ? (accessesByClient[selectedClientId] || []) : []}
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

      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} onExport={handleExport} />}
    </div>
  )
}
