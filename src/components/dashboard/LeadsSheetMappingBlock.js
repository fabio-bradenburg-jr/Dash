'use client'

import { useEffect, useMemo, useState } from 'react'

// Aba + mapeamento de colunas da planilha de leads de um cliente. Fica ao lado do campo de link
// (bloco "Planilha de Leads" do cadastro) e alimenta a leitura em /api/google-sheets/leads-analytics
// usada pela aba Funil — ver leadsSheetGid / leadsSheetColumnMap em ClientRecord.
const LEADS_SHEET_MAP_FIELDS = [
  { key: 'name', label: 'Nome' },
  { key: 'phone', label: 'Telefone' },
  { key: 'qualification', label: 'Qualificação' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'Estado' },
  { key: 'date', label: 'Data de chegada' },
  { key: 'counter', label: 'Contabilizador' },
]

function LeadsSheetMappingBlock({ client, onFieldChange, disabled }) {
  const sheetUrl = String(client?.leadsSheetUrl || '').trim()
  const gid = client?.leadsSheetGid || 'all'
  const columnMap = client?.leadsSheetColumnMap || {}
  const headerRow = client?.googleSheetsHeaderRow || 1

  const [tabs, setTabs] = useState([])
  const [tabsLoading, setTabsLoading] = useState(false)
  const [tabsError, setTabsError] = useState('')
  const [headers, setHeaders] = useState([])
  const [detected, setDetected] = useState({})
  const [headersLoading, setHeadersLoading] = useState(false)

  const isAllTabsMode = !gid || gid === 'all'
  const selectedGidSet = useMemo(
    () => (isAllTabsMode ? new Set() : new Set(String(gid).split(',').map((g) => g.trim()).filter(Boolean))),
    [gid, isAllTabsMode]
  )

  const handleSelectAllTabs = () => onFieldChange('leadsSheetGid', 'all')

  const handleToggleTab = (tabGid) => {
    const next = new Set(isAllTabsMode ? tabs.map((tab) => tab.gid) : selectedGidSet)
    if (next.has(tabGid)) next.delete(tabGid)
    else next.add(tabGid)
    if (!next.size || next.size === tabs.length) onFieldChange('leadsSheetGid', 'all')
    else onFieldChange('leadsSheetGid', Array.from(next).join(','))
  }

  useEffect(() => {
    if (!sheetUrl) { setTabs([]); return }
    let cancelled = false
    setTabsLoading(true); setTabsError('')
    fetch(`/api/google-sheets/tabs?url=${encodeURIComponent(sheetUrl)}`)
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (cancelled) return
        if (!ok) throw new Error(json.error || 'Não foi possível buscar as abas da planilha.')
        setTabs(Array.isArray(json.tabs) ? json.tabs : [])
      })
      .catch((error) => { if (!cancelled) { setTabsError(error.message); setTabs([]) } })
      .finally(() => { if (!cancelled) setTabsLoading(false) })
    return () => { cancelled = true }
  }, [sheetUrl])

  useEffect(() => {
    if (!sheetUrl) { setHeaders([]); setDetected({}); return }
    let cancelled = false
    setHeadersLoading(true)
    const params = new URLSearchParams({ url: sheetUrl, gid: gid || 'all', header_row: String(headerRow) })
    fetch(`/api/google-sheets/leads-analytics?${params.toString()}`)
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (cancelled || !ok) return
        setHeaders(Array.isArray(json.headers) ? json.headers : [])
        setDetected(json.detectedColumns || {})
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHeadersLoading(false) })
    return () => { cancelled = true }
  }, [sheetUrl, gid, headerRow])

  if (!sheetUrl) return null

  return (
    <div className="leads-sheet-config">
      <div className="agendor-selection-block">
        <div className="agendor-selection-head">
          <label>Abas da planilha</label>
          <span>
            Escolha quais abas o app deve ler. Marque &quot;Todas as abas&quot; para mesclar tudo, ou selecione
            só as abas que quiser.
            {tabsLoading && <i className="bx bx-loader-alt bx-spin" style={{ marginLeft: 6, opacity: 0.6 }}></i>}
          </span>
        </div>
        <div className="stage-selector agendor-chip-list">
          <label className={'stage-chip ' + (isAllTabsMode ? 'active' : '')}>
            <input type="checkbox" checked={isAllTabsMode} onChange={handleSelectAllTabs} disabled={disabled} />
            <span>Todas as abas (mesclar)</span>
          </label>
          {tabs.map((tab) => {
            const checked = isAllTabsMode || selectedGidSet.has(tab.gid)
            return (
              <label key={tab.gid} className={'stage-chip ' + (checked ? 'active' : '')}>
                <input type="checkbox" checked={checked} onChange={() => handleToggleTab(tab.gid)} disabled={disabled} />
                <span>{tab.name}</span>
              </label>
            )
          })}
          {!tabsLoading && !tabs.length && (
            <div className="stage-empty">
              {tabsError || 'Nenhuma aba encontrada. Verifique se a planilha está compartilhada como "Qualquer pessoa com o link".'}
            </div>
          )}
        </div>
      </div>

      <div className="leads-column-map">
        <div className="leads-column-map-heading">
          <span className="management-hero-kicker" style={{ marginBottom: 0 }}>
            <i className="bx bx-columns" style={{ marginRight: 5 }}></i>Mapeamento de colunas
            {headersLoading && <i className="bx bx-loader-alt bx-spin" style={{ marginLeft: 8, opacity: 0.6 }}></i>}
          </span>
          <p>Escolha qual coluna da planilha corresponde a cada campo. Deixe em &quot;Não mapear&quot; para detectar automaticamente pelo nome da coluna.</p>
        </div>
        <div className="leads-column-map-grid">
          {LEADS_SHEET_MAP_FIELDS.map((field) => {
            const isMapped = Boolean(columnMap[field.key])
            const isAuto = !isMapped && Boolean(detected[field.key])
            return (
              <div key={field.key} className="leads-column-map-field">
                <span className="leads-column-map-field-label">
                  {field.label}
                  {isMapped && <i className="bx bx-check-circle leads-column-map-badge is-mapped" title="Mapeado manualmente"></i>}
                  {isAuto && <i className="bx bx-magic-wand leads-column-map-badge is-auto" title="Detectado automaticamente"></i>}
                </span>
                <div className={'leads-column-map-select-wrap' + (isMapped ? ' is-mapped' : '')}>
                  <select
                    className="client-select-input leads-column-map-select"
                    value={columnMap[field.key] || ''}
                    onChange={(event) => onFieldChange('leadsSheetColumnMap', { ...columnMap, [field.key]: event.target.value })}
                    disabled={disabled || !headers.length}
                  >
                    <option value="">{detected[field.key] ? `Auto: ${detected[field.key]}` : 'Não mapear'}</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                  <i className="bx bx-chevron-down leads-column-map-select-chevron"></i>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LeadsSheetMappingBlock
