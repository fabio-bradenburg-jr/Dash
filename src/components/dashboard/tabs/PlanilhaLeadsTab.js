'use client'

import LeadsDashboard from '@/components/dashboard/LeadsDashboard'
import { useDashboard } from '@/components/dashboard/DashboardContext'

function toEmbedUrl(url) {
  const s = String(url || '').trim()
  if (!s) return ''
  if (s.includes('/pubhtml') || s.includes('output=html') || s.includes('/htmlview')) return s
  const match = s.match(/\/spreadsheets\/d\/([^/]+)/)
  if (match) return `https://docs.google.com/spreadsheets/d/${match[1]}/htmlview?rm=minimal`
  return s
}

export default function PlanilhaLeadsTab() {
  const {
    clients,
    selectedSheetClientId,
    setSelectedSheetClientId,
    sheetClientPickerOpen,
    setSheetClientPickerOpen,
    sheetViewMode,
    setSheetViewMode,
    sheetFullscreen,
    setSheetFullscreen,
  } = useDashboard()

  const sheetClients = (clients || []).filter(c => c.leadsSheetUrl && String(c.leadsSheetUrl).trim())
  const activeSheetId = selectedSheetClientId || sheetClients[0]?.id || ''
  const selectedSheetClient = sheetClients.find(c => c.id === activeSheetId) || sheetClients[0] || null

  return (
    <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0, gap: 12 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Planilha de Leads</h2>
          <p style={{ fontSize: '0.78rem', opacity: 0.5, margin: '2px 0 0' }}>Selecione um cliente para carregar o dashboard de leads automaticamente.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Client picker dropdown */}
          {sheetClients.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setSheetClientPickerOpen(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, cursor: 'pointer', color: 'inherit', fontSize: '0.82rem', fontWeight: 600,
                }}
              >
                {selectedSheetClient?.logoUrl ? (
                  <img src={selectedSheetClient.logoUrl} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: 'cover' }} />
                ) : (
                  <span style={{ width: 20, height: 20, borderRadius: 5, background: selectedSheetClient?.dashboardColor || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(selectedSheetClient?.name || '?')[0].toUpperCase()}
                  </span>
                )}
                <span>{selectedSheetClient?.name || 'Selecionar cliente'}</span>
                <i className="bx bx-chevron-down" style={{ fontSize: 14, opacity: 0.6 }} />
              </button>
              {sheetClientPickerOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
                  background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: 6, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 180,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                }}>
                  {sheetClients.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedSheetClientId(c.id); setSheetClientPickerOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                        borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                        background: activeSheetId === c.id ? 'rgba(34,197,94,0.12)' : 'transparent',
                        color: 'inherit', fontSize: '0.82rem', fontWeight: 600,
                        outline: activeSheetId === c.id ? '1px solid rgba(34,197,94,0.3)' : 'none',
                      }}
                    >
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: 22, height: 22, borderRadius: 5, background: c.dashboardColor || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {(c.name || '?')[0].toUpperCase()}
                        </span>
                      )}
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* View mode toggle */}
          {selectedSheetClient && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, gap: 2 }}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'bx-bar-chart-alt-2' },
                { id: 'sheet', label: 'Planilha', icon: 'bx-table' },
              ].map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSheetViewMode(v.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                    borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    background: sheetViewMode === v.id ? 'rgba(38,194,129,0.15)' : 'transparent',
                    color: sheetViewMode === v.id ? '#26c281' : 'rgba(241,241,241,0.5)',
                    outline: sheetViewMode === v.id ? '1px solid rgba(38,194,129,0.35)' : 'none',
                    transition: 'all .15s',
                  }}
                >
                  <i className={`bx ${v.icon}`} style={{ fontSize: 14 }} />
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {sheetClients.length === 0 ? (
        <div className="empty-panel glass-item">
          <i className="bx bx-table" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
          <h3>Nenhuma planilha cadastrada</h3>
          <p>Vá em <strong>Clientes → Integrações</strong> e cole o link do Google Sheets para cada cliente.</p>
        </div>
      ) : (
        <div style={{ minHeight: 0 }}>
            {!selectedSheetClient ? (
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12 }}>
                <i className="bx bx-table" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                <span style={{ opacity: 0.4 }}>Selecione um cliente</span>
              </div>
            ) : sheetViewMode === 'dashboard' ? (
              <LeadsDashboard key={selectedSheetClient.id} client={selectedSheetClient} />
            ) : (
              <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 16, position: 'relative', height: 'calc(100vh - 160px)' }}>
                <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: 6 }}>
                  <a
                    href={selectedSheetClient.leadsSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Abrir no navegador"
                    style={{ background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, backdropFilter: 'blur(6px)', textDecoration: 'none' }}
                  >
                    <i className="bx bx-link-external"></i>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSheetFullscreen(true)}
                    title="Tela cheia"
                    style={{ background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, backdropFilter: 'blur(6px)' }}
                  >
                    <i className="bx bx-fullscreen"></i>
                  </button>
                </div>
                <iframe
                  key={selectedSheetClient.id}
                  src={toEmbedUrl(selectedSheetClient.leadsSheetUrl)}
                  title={`Planilha de leads — ${selectedSheetClient.name}`}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  allow="autoplay"
                />
              </div>
            )}
          </div>
      )}
      {/* Fullscreen overlay for sheet view */}
      {sheetFullscreen && selectedSheetClient && sheetViewMode === 'sheet' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedSheetClient.name} — Planilha de Leads</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={selectedSheetClient.leadsSheetUrl} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, textDecoration: 'none' }}>
                <i className="bx bx-link-external"></i>
              </a>
              <button type="button" onClick={() => setSheetFullscreen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                <i className="bx bx-exit-fullscreen"></i>
              </button>
            </div>
          </div>
          <iframe key={`fs-${selectedSheetClient.id}`} src={toEmbedUrl(selectedSheetClient.leadsSheetUrl)} title={`Planilha — ${selectedSheetClient.name}`} style={{ flex: 1, border: 'none', display: 'block', width: '100%' }} allow="autoplay" />
        </div>
      )}
    </section>
  )
}
