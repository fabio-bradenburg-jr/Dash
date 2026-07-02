'use client'

import QuickAddAccessModal from '@/components/dashboard/QuickAddAccessModal'
import { useDashboard } from '@/components/dashboard/DashboardContext'

export default function OnboardingTab() {
  const {
    clients,
    isMaster,
    handleToggleOnboardingTask,
    handleToggleOnboardingTaskNA,
    persistReorder,
    obDragRef,
    obEditingItem,
    setObEditingItem,
    obEditingPhase,
    setObEditingPhase,
    obNewItem,
    setObNewItem,
    obNewPhase,
    setObNewPhase,
    onboardingClientFilter,
    setOnboardingClientFilter,
    onboardingExpandedClient,
    setOnboardingExpandedClient,
    onboardingExpandedPhases,
    setOnboardingExpandedPhases,
    onboardingManageMode,
    setOnboardingManageMode,
    onboardingPhaseDefs,
    setOnboardingPhaseDefs,
    onboardingPhaseDefsLoaded,
    setOnboardingPhaseDefsLoaded,
    onboardingQuickAccess,
    setOnboardingQuickAccess,
    onboardingRecords,
    onboardingSaving,
    onboardingSearch,
    setOnboardingSearch,
    onboardingStatusFilter,
    setOnboardingStatusFilter,
    onboardingView,
    setOnboardingView,
  } = useDashboard()

          const ONBOARDING_PHASES_FALLBACK = [
            {
              id: 'estrutura',
              label: '1. Estrutura inicial',
              icon: 'bx-folder-plus',
              tasks: [
                { id: 'drive_criar', label: 'Criar o Drive do cliente (Assessoria LP - [Nome])' },
                { id: 'drive_pastas', label: 'Criar as pastas padrão: Documentos, Materiais, IDV, Criativos, Reuniões, Script Padrão' },
                { id: 'wpp_criar', label: 'Criar o grupo do WhatsApp (Assessoria LP - [Nome])' },
                { id: 'wpp_equipe_interna', label: 'Adicionar a equipe interna da LP no grupo' },
                { id: 'wpp_gestor', label: 'Adicionar o gestor de tráfego responsável' },
                { id: 'wpp_descricao', label: 'Inserir o link do Drive na descrição do grupo' },
                { id: 'clickup_add', label: 'Adicionar o cliente no ClickUp' },
                { id: 'app_add', label: 'Adicionar o cliente no app da assessoria' },
              ],
            },
            {
              id: 'boas_vindas',
              label: '2. Boas-vindas',
              icon: 'bx-message-rounded-dots',
              tasks: [
                { id: 'msg_boas_vindas', label: 'Enviar a mensagem de boas-vindas no grupo' },
                { id: 'guia_cliente', label: 'Enviar o Guia do Cliente 2026.pdf' },
                { id: 'checklist_cliente', label: 'Enviar checklist inicial ao cliente' },
                { id: 'reuniao_agendar', label: 'Agendar a reunião de integração' },
              ],
            },
            {
              id: 'reuniao',
              label: '3. Reunião de integração',
              icon: 'bx-video',
              tasks: [
                { id: 'reuniao_realizada', label: 'Realizar a reunião de integração' },
                { id: 'acesso_facebook', label: 'Pegar acesso: Facebook' },
                { id: 'acesso_instagram', label: 'Pegar acesso: Instagram' },
                { id: 'acesso_meta_business', label: 'Pegar acesso: Meta Business' },
                { id: 'acesso_conta_anuncios', label: 'Pegar acesso: Conta de anúncios' },
                { id: 'acesso_pagina_fb', label: 'Pegar acesso: Página do Facebook' },
                { id: 'acesso_ig_pro', label: 'Pegar acesso: Instagram profissional' },
                { id: 'acesso_google', label: 'Pegar acesso: Google (se necessário)' },
                { id: 'acesso_site', label: 'Pegar acesso: Site ou landing page (se necessário)' },
                { id: 'acesso_wpp_business', label: 'WhatsApp Business (se necessário)' },
                { id: 'acesso_crm', label: 'Pegar acesso: CRM atual (se existir)' },
              ],
            },
            {
              id: 'pos_reuniao',
              label: '4. Pós-reunião',
              icon: 'bx-check-double',
              tasks: [
                { id: 'clickup_atualizar', label: 'Atualizar ClickUp com resultado da reunião' },
                { id: 'app_atualizar', label: 'Atualizar app da assessoria' },
                { id: 'acessos_registrar', label: 'Registrar acessos coletados e pendentes' },
                { id: 'responsaveis_registrar', label: 'Registrar responsáveis do cliente' },
                { id: 'gestor_informar', label: 'Informar o gestor de tráfego sobre próximos passos' },
                { id: 'previsao_subida', label: 'Confirmar previsão de subida da campanha' },
                { id: 'leo_avisar', label: 'Avisar o Leonardo que a reunião foi realizada' },
              ],
            },
            {
              id: 'organico_gmb',
              label: '5. Google Meu Negócio',
              icon: 'bx-map-pin',
              tasks: [
                { id: 'gmb_acesso', label: 'Coletar acesso ao Google Meu Negócio' },
                { id: 'gmb_fotos', label: 'Ajustar fotos do perfil' },
                { id: 'gmb_horario', label: 'Configurar horário de atendimento' },
                { id: 'gmb_site_redes', label: 'Vincular site e redes sociais' },
                { id: 'gmb_localizacao', label: 'Ajustar localização da empresa' },
                { id: 'gmb_avaliacao', label: 'Enviar link de avaliação para o cliente' },
              ],
            },
            {
              id: 'organico_redes',
              label: '6. Configuração de redes sociais',
              icon: 'bx-share-alt',
              tasks: [
                { id: 'ig_foto', label: 'Instagram: Foto de perfil' },
                { id: 'ig_bio', label: 'Instagram: Bio' },
                { id: 'ig_botoes', label: 'Instagram: Botões de comunicação (contato)' },
                { id: 'ig_fixado', label: 'Instagram: Post fixado' },
                { id: 'fb_foto', label: 'Facebook: Foto de perfil' },
                { id: 'fb_capa', label: 'Facebook: Capa da página' },
                { id: 'fb_wpp_btn', label: 'Facebook: Botão de WhatsApp' },
                { id: 'fb_horario', label: 'Facebook: Horário de atendimento' },
                { id: 'fb_localizacao', label: 'Facebook: Localização' },
                { id: 'fb_sobre', label: 'Facebook: Sobre a empresa' },
                { id: 'fb_acesso_time', label: 'Facebook: Dar acesso para o time' },
                { id: 'fb_acesso_cliente', label: 'Facebook: Dar acesso para o cliente' },
                { id: 'li_foto', label: 'LinkedIn: Foto de perfil' },
                { id: 'li_sobre', label: 'LinkedIn: Sobre a empresa' },
                { id: 'li_contato', label: 'LinkedIn: Botão de contato' },
                { id: 'li_vinculacao', label: 'LinkedIn: Vinculação de redes sociais e site' },
                { id: 'li_acesso_time', label: 'LinkedIn: Dar acesso da página para o time' },
                { id: 'li_acesso_cliente', label: 'LinkedIn: Dar acesso para o cliente' },
                { id: 'wpp_foto', label: 'WhatsApp: Foto de perfil' },
                { id: 'wpp_nome', label: 'WhatsApp: Nome' },
                { id: 'wpp_horario_neg', label: 'WhatsApp: Horário de atendimento' },
                { id: 'wpp_redes', label: 'WhatsApp: Redes sociais' },
                { id: 'wpp_site', label: 'WhatsApp: Site' },
                { id: 'wpp_saudacao', label: 'WhatsApp: Mensagem de saudação' },
              ],
            },
            {
              id: 'fast_traffic_1',
              label: '7. Fast Traffic — Etapa 1',
              deadline: '⏱ Até 10 dias após reunião',
              icon: 'bx-bolt-circle',
              tasks: [
                { id: 'ft1_narrativa_vendas', label: 'Narrativa de vendas' },
                { id: 'ft1_acessos', label: 'Acessos (BM, conta de anúncios, página, Instagram)' },
                { id: 'ft1_wpp_bm', label: 'Configuração WhatsApp Business na conta de anúncios' },
                { id: 'ft1_dominio', label: 'Verificação de domínio' },
                { id: 'ft1_pixel', label: 'Configuração Pixel / API de conversão (se aplicável)' },
                { id: 'ft1_eventos', label: 'Configuração de eventos (Lead, Purchase, etc.) (se aplicável)' },
                { id: 'ft1_tag_google', label: 'Configuração tag Google Ads (se aplicável)' },
                { id: 'ft1_wpp_vinculacao', label: 'Vinculação de WhatsApp no Meta Business Suite' },
              ],
            },
            {
              id: 'fast_traffic_2',
              label: '8. Fast Traffic — Etapa 2',
              deadline: '⏱ Até 10 dias após reunião',
              icon: 'bx-spreadsheet',
              tasks: [
                { id: 'ft2_planilha_leads', label: 'Criar/validar planilha de leads' },
                { id: 'ft2_lista_clientes', label: 'Solicitar lista de clientes' },
                { id: 'ft2_reportei', label: 'Vinculação do Reportei' },
                { id: 'ft2_catalogo', label: 'Solicitação do catálogo de produtos/serviços' },
                { id: 'ft2_info_tecnicas', label: 'Solicitação de informações técnicas' },
                { id: 'ft2_materiais', label: 'Solicitação de materiais' },
              ],
            },
            {
              id: 'fast_traffic_3',
              label: '9. Fast Traffic — Etapa 3',
              deadline: '⏱ Até 10 dias após reunião',
              icon: 'bx-rocket',
              tasks: [
                { id: 'ft3_briefing', label: 'Briefing estratégico completo' },
                { id: 'ft3_negocio', label: 'Análise do negócio (produto, margem, diferencial, curva ABC)' },
                { id: 'ft3_publico', label: 'Análise de público-alvo' },
                { id: 'ft3_concorrentes', label: 'Análise de concorrentes' },
                { id: 'ft3_presenca', label: 'Análise de presença digital atual' },
                { id: 'ft3_site', label: 'Estudo do site / landing page' },
                { id: 'ft3_publicos_frio', label: 'Configuração de públicos frio' },
                { id: 'ft3_lista_plat', label: 'Subir lista na plataforma' },
                { id: 'ft3_copys', label: 'Criação de copys' },
                { id: 'ft3_criativos', label: 'Produção de criativos (design/vídeo)' },
                { id: 'ft3_pagamento', label: 'Definição de forma de pagamento' },
                { id: 'ft3_cartao', label: 'Cadastrar cartão ou alocar verba' },
                { id: 'ft3_campanhas', label: 'Subir campanhas' },
              ],
            },
            {
              id: 'treinamento',
              label: '10. Treinamento & Ativação',
              icon: 'bx-chalkboard',
              tasks: [
                { id: 'trei_comercial', label: 'Treinamento comercial' },
                { id: 'trei_script', label: 'Definição de script de atendimento' },
                { id: 'trei_crm', label: 'Treinamento de CRM' },
                { id: 'trei_prospeccao', label: 'Treinamento de prospecção ativa (se aplicável)' },
              ],
            },
            {
              id: 'pos_onboarding',
              label: '11. Pós-Onboarding & Relacionamento',
              icon: 'bx-heart',
              tasks: [
                { id: 'pos_acompanhamento', label: 'Acompanhamento dos primeiros resultados' },
                { id: 'pos_relatorio', label: 'Envio de primeiro relatório' },
                { id: 'pos_reuniao30', label: 'Reunião de 30 dias (análise + próximos passos)' },
                { id: 'pos_fluxos', label: 'Inclusão em fluxos de relacionamento' },
                { id: 'pos_nps', label: 'Coleta de feedback inicial (NPS onboarding)' },
              ],
            },
          ]
          const ONBOARDING_PHASES = onboardingPhaseDefsLoaded ? onboardingPhaseDefs : ONBOARDING_PHASES_FALLBACK

          const totalTasks = ONBOARDING_PHASES.reduce((sum, p) => sum + p.tasks.length, 0)
          const onboardingClients = clients.filter((c) => {
            const st = String(c?.status || '').trim().toLowerCase()
            return c?.id && st !== 'churn' && st !== 'pausado'
          })
          // General metrics
          const allValidTaskIds = new Set(ONBOARDING_PHASES.flatMap(p => p.tasks.map(t => t.id)))
          const getValidDone = (rec) => (Array.isArray(rec?.completed_tasks) ? rec.completed_tasks : []).filter(id => allValidTaskIds.has(id)).length
          const filteredOnboardingClients = onboardingClients.filter((c) => {
            if (onboardingClientFilter && c.id !== onboardingClientFilter) return false
            if (onboardingSearch && !String(c.name || '').toLowerCase().includes(onboardingSearch.toLowerCase())) return false
            if (onboardingStatusFilter !== 'all') {
              const rec = onboardingRecords.find((r) => r.client_id === c.id)
              const done = getValidDone(rec)
              if (onboardingStatusFilter === 'complete' && done < totalTasks) return false
              if (onboardingStatusFilter === 'in_progress' && (done === 0 || done >= totalTasks)) return false
              if (onboardingStatusFilter === 'not_started' && done > 0) return false
            }
            return true
          })
          const totalClients = onboardingClients.length
          const completedClients = onboardingClients.filter((c) => {
            const rec = onboardingRecords.find((r) => r.client_id === c.id)
            return getValidDone(rec) >= totalTasks
          }).length
          const inProgressClients = onboardingClients.filter((c) => {
            const rec = onboardingRecords.find((r) => r.client_id === c.id)
            const done = getValidDone(rec)
            return done > 0 && done < totalTasks
          }).length
          const notStartedClients = totalClients - completedClients - inProgressClients
          const totalTasksDone = onboardingClients.reduce((sum, c) => {
            const rec = onboardingRecords.find((r) => r.client_id === c.id)
            return sum + Math.min(getValidDone(rec), totalTasks)
          }, 0)
          const overallProgress = totalClients > 0 ? Math.round((totalTasksDone / (totalClients * totalTasks)) * 100) : 0

          return (
            <>
            <section className="weekly-dashboard-panel onboarding-panel">
              <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid rgba(38,194,129,0.12)', background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <span className="management-hero-kicker"><i className="bx bx-list-check" style={{ marginRight: 5 }}></i>Onboarding</span>
                <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>Onboarding de clientes</h2>
                {isMaster && (
                  <button type="button" className="btn btn-secondary" style={{ position: 'absolute', top: 28, right: 28, fontSize: '0.8rem', padding: '5px 12px', zIndex: 2 }} onClick={() => {
                    setOnboardingManageMode(v => !v)
                    if (!onboardingPhaseDefsLoaded) {
                      fetch('/api/onboarding-tasks/definitions?type=onboarding').then(r => r.json()).then(d => { if (d.phases) { setOnboardingPhaseDefs(d.phases); setOnboardingPhaseDefsLoaded(true) } })
                    }
                  }}>{onboardingManageMode ? 'Fechar' : 'Editar tarefas'}</button>
                )}
                <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>Checklist do processo de integração de novos clientes, baseado no playbook operacional.</p>

                {/* Metrics panel */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, margin: '20px 0 4px' }}>
                  {[
                    { icon: 'bx-group', label: 'Total de clientes', value: totalClients, color: '#94a3b8' },
                    { icon: 'bx-check-circle', label: 'Concluídos', value: completedClients, color: '#22c55e' },
                    { icon: 'bx-loader-alt', label: 'Em andamento', value: inProgressClients, color: '#f59e0b' },
                    { icon: 'bx-time', label: 'Não iniciados', value: notStartedClients, color: '#64748b' },
                    { icon: 'bx-task', label: 'Tarefas concluídas', value: `${totalTasksDone}/${totalClients * totalTasks}`, color: '#818cf8' },
                    { icon: 'bx-trending-up', label: 'Progresso geral', value: `${overallProgress}%`, color: overallProgress === 100 ? '#22c55e' : '#26c281' },
                  ].map((m) => (
                    <div key={m.label} className="management-stat-card" style={{ gap: 6 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <i className={`bx ${m.icon}`} style={{ color: m.color, fontSize: 13 }}></i>
                        {m.label}
                      </span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Progress bar geral */}
                <div style={{ margin: '14px 0 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${overallProgress}%`, background: overallProgress === 100 ? '#22c55e' : 'linear-gradient(90deg,#26c281,#22c55e)', borderRadius: 6, transition: 'width 0.4s' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6, whiteSpace: 'nowrap' }}>{overallProgress}% completo</span>
                </div>

                {/* Filter bar */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search input */}
                  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                    <i className="bx bx-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4, pointerEvents: 'none' }}></i>
                    <input
                      type="text"
                      value={onboardingSearch}
                      onChange={(e) => setOnboardingSearch(e.target.value)}
                      placeholder="Buscar cliente..."
                      style={{ width: '100%', padding: '8px 12px 8px 42px', borderRadius: 10, border: '1px solid rgba(129,216,167,0.18)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Status filter chips */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { id: 'all', label: 'Todos', count: onboardingClients.length },
                      { id: 'complete', label: 'Concluídos', count: completedClients },
                      { id: 'in_progress', label: 'Em andamento', count: inProgressClients },
                      { id: 'not_started', label: 'Não iniciados', count: notStartedClients },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOnboardingStatusFilter(f.id)}
                        style={{ padding: '7px 12px', borderRadius: 9, border: `1px solid ${onboardingStatusFilter === f.id ? 'rgba(38,194,129,0.4)' : 'rgba(255,255,255,0.08)'}`, background: onboardingStatusFilter === f.id ? 'rgba(38,194,129,0.15)' : 'transparent', color: onboardingStatusFilter === f.id ? '#26c281' : 'rgba(255,255,255,0.5)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                      >
                        {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
                      </button>
                    ))}
                  </div>
                  {/* Client select (compact) + view toggle */}
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                    <select
                      value={onboardingClientFilter}
                      onChange={(e) => setOnboardingClientFilter(e.target.value)}
                      style={{ padding: '7px 10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', cursor: 'pointer', maxWidth: 140 }}
                    >
                      <option value="">Todos</option>
                      {onboardingClients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 9, padding: 3 }}>
                      {[
                        { id: 'cards', icon: 'bx-grid-alt', label: 'Quadros' },
                        { id: 'list', icon: 'bx-list-ul', label: 'Lista' },
                        { id: 'table', icon: 'bx-table', label: 'Tabela' },
                      ].map((v) => (
                        <button key={v.id} type="button" onClick={() => setOnboardingView(v.id)} title={v.label}
                          style={{ padding: '5px 9px', borderRadius: 7, border: 'none', cursor: 'pointer', background: onboardingView === v.id ? 'rgba(38,194,129,0.2)' : 'transparent', color: onboardingView === v.id ? '#26c281' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s', fontSize: '0.95rem' }}>
                          <i className={`bx ${v.icon}`}></i>
                        </button>
                      ))}
                    </div>
                  </div>
                  {onboardingSaving && <span style={{ fontSize: '0.78rem', opacity: 0.5 }}>Salvando...</span>}
                </div>
              </div>

              {/* ONBOARDING MANAGE PANEL */}
              {onboardingManageMode && isMaster && (
                <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(38,194,129,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}><i className="bx bx-edit" style={{ marginRight: 8, color: '#26c281' }}></i>Editar tarefas de onboarding</h3>
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} onClick={() => setObNewPhase({ label: '' })}><i className="bx bx-plus"></i> Nova fase</button>
                  </div>
                  {obNewPhase && (
                    <div style={{ background: 'rgba(38,194,129,0.08)', border: '1px solid rgba(38,194,129,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="text" className="input-field" placeholder="Nome da fase" value={obNewPhase.label} onChange={e => setObNewPhase(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.85rem', padding: '6px 10px' }} />
                      <button type="button" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 12px' }} disabled={!obNewPhase.label.trim()} onClick={async () => {
                        const res = await fetch('/api/onboarding-tasks/definitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'phase', type: 'onboarding', label: obNewPhase.label.trim(), icon: 'bx-check' }) })
                        const d = await res.json()
                        if (d.phase) { setOnboardingPhaseDefs(prev => [...prev, d.phase]); setObNewPhase(null) }
                      }}>Salvar</button>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }} onClick={() => setObNewPhase(null)}>Cancelar</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {onboardingPhaseDefs.map((phase, phaseIdx) => (
                      <div key={phase.id}
                        draggable
                        onDragStart={() => { obDragRef.current.phaseIdx = phaseIdx }}
                        onDragOver={e => { e.preventDefault(); obDragRef.current.phaseOverIdx = phaseIdx }}
                        onDrop={() => {
                          const from = obDragRef.current.phaseIdx; const to = obDragRef.current.phaseOverIdx
                          if (from === to || from == null || to == null) return
                          setOnboardingPhaseDefs(prev => {
                            const arr = [...prev]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved)
                            persistReorder('phase', arr)
                            return arr
                          })
                          obDragRef.current = {}
                        }}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', cursor: 'grab' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                          <i className="bx bx-dots-vertical-rounded" style={{ fontSize: 18, opacity: 0.3, cursor: 'grab', flexShrink: 0 }}></i>
                          {obEditingPhase?.id === phase.id ? (
                            <>
                              <input type="text" className="input-field" value={obEditingPhase.label} onChange={e => setObEditingPhase(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.85rem', padding: '4px 8px' }} />
                              <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={async () => {
                                const res = await fetch('/api/onboarding-tasks/definitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'phase', id: obEditingPhase.id, label: obEditingPhase.label }) })
                                const d = await res.json()
                                if (d.phase) { setOnboardingPhaseDefs(prev => prev.map(p => p.id === d.phase.id ? { ...p, label: d.phase.label } : p)); setObEditingPhase(null) }
                              }}>Salvar</button>
                              <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setObEditingPhase(null)}>×</button>
                            </>
                          ) : (
                            <>
                              <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 700 }}>{phase.label}</span>
                              <button type="button" className="btn-icon" title="Editar fase" onClick={() => setObEditingPhase({ ...phase })} style={{ color: '#94a3b8' }}><i className="bx bx-edit"></i></button>
                              <button type="button" className="btn-icon" title="Excluir fase" onClick={async () => {
                                if (!confirm(`Excluir fase "${phase.label}" e todas as tarefas?`)) return
                                await fetch(`/api/onboarding-tasks/definitions?id=${phase.id}&entity=phase`, { method: 'DELETE' })
                                setOnboardingPhaseDefs(prev => prev.filter(p => p.id !== phase.id))
                              }} style={{ color: '#f87171' }}><i className="bx bx-trash"></i></button>
                              <button type="button" className="btn-icon" title="Nova tarefa" onClick={() => setObNewItem({ phaseId: phase.id, label: '' })} style={{ color: '#26c281' }}><i className="bx bx-plus"></i></button>
                            </>
                          )}
                        </div>
                        {obNewItem?.phaseId === phase.id && (
                          <div style={{ display: 'flex', gap: 8, padding: '8px 14px', background: 'rgba(38,194,129,0.05)', alignItems: 'center' }}>
                            <input type="text" className="input-field" placeholder="Nome da tarefa" value={obNewItem.label} onChange={e => setObNewItem(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.82rem', padding: '4px 8px' }} />
                            <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} disabled={!obNewItem.label.trim()} onClick={async () => {
                              const res = await fetch('/api/onboarding-tasks/definitions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'item', phase_id: phase.id, label: obNewItem.label.trim() }) })
                              const d = await res.json()
                              if (d.item) { setOnboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: [...(p.tasks || []), d.item] } : p)); setObNewItem(null) }
                            }}>Salvar</button>
                            <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setObNewItem(null)}>×</button>
                          </div>
                        )}
                        <div style={{ padding: '4px 0' }}>
                          {(phase.tasks || []).map((task, taskIdx) => (
                            <div key={task._id || task.id}
                              draggable
                              onDragStart={e => { e.stopPropagation(); obDragRef.current = { taskPhaseId: phase.id, taskIdx } }}
                              onDragOver={e => { e.preventDefault(); e.stopPropagation(); obDragRef.current.taskOverIdx = taskIdx }}
                              onDrop={e => {
                                e.stopPropagation()
                                const { taskPhaseId, taskIdx: from, taskOverIdx: to } = obDragRef.current
                                if (taskPhaseId !== phase.id || from === to || from == null || to == null) return
                                setOnboardingPhaseDefs(prev => prev.map(p => {
                                  if (p.id !== phase.id) return p
                                  const arr = [...p.tasks]; const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved)
                                  persistReorder('item', arr.map(t => ({ id: t._id })))
                                  return { ...p, tasks: arr }
                                }))
                                obDragRef.current = {}
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'grab' }}>
                              <i className="bx bx-dots-vertical-rounded" style={{ fontSize: 16, opacity: 0.25, cursor: 'grab', flexShrink: 0 }}></i>
                              {obEditingItem?._id === task._id ? (
                                <>
                                  <input type="text" className="input-field" value={obEditingItem.label} onChange={e => setObEditingItem(v => ({ ...v, label: e.target.value }))} style={{ flex: 1, fontSize: '0.82rem', padding: '4px 8px' }} />
                                  <button type="button" className="btn btn-primary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={async () => {
                                    const res = await fetch('/api/onboarding-tasks/definitions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'item', id: obEditingItem._id, label: obEditingItem.label }) })
                                    const d = await res.json()
                                    if (d.item) { setOnboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: p.tasks.map(t => t._id === d.item._id ? { ...t, label: d.item.label } : t) } : p)); setObEditingItem(null) }
                                  }}>Salvar</button>
                                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 8px' }} onClick={() => setObEditingItem(null)}>×</button>
                                </>
                              ) : (
                                <>
                                  <span style={{ flex: 1, fontSize: '0.82rem', opacity: 0.8 }}>{task.label}</span>
                                  <button type="button" className="btn-icon" onClick={() => setObEditingItem({ ...task })} style={{ color: '#94a3b8', fontSize: '0.9rem' }}><i className="bx bx-edit"></i></button>
                                  <button type="button" className="btn-icon" onClick={async () => {
                                    if (!confirm(`Excluir "${task.label}"?`)) return
                                    await fetch(`/api/onboarding-tasks/definitions?id=${task._id}&entity=item`, { method: 'DELETE' })
                                    setOnboardingPhaseDefs(prev => prev.map(p => p.id === phase.id ? { ...p, tasks: p.tasks.filter(t => t._id !== task._id) } : p))
                                  }} style={{ color: '#f87171', fontSize: '0.9rem' }}><i className="bx bx-trash"></i></button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TABLE VIEW */}
              {onboardingView === 'table' && (
                <div style={{ padding: '0 28px 28px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(129,216,167,0.12)' }}>
                        <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.5 }}>Cliente</th>
                        {ONBOARDING_PHASES.map((p) => (
                          <th key={p.id} title={p.label} style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.5, minWidth: 60, maxWidth: 80, wordBreak: 'break-word' }}>
                            <i className={`bx ${p.icon}`}></i>
                          </th>
                        ))}
                        <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.5 }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOnboardingClients.map((client) => {
                        const record = onboardingRecords.find((r) => r.client_id === client.id)
                        const allValidIds = new Set(ONBOARDING_PHASES.flatMap(p => p.tasks.map(t => t.id)))
                        const completedTasks = (Array.isArray(record?.completed_tasks) ? record.completed_tasks : []).filter(id => allValidIds.has(id))
                        const progress = totalTasks > 0 ? Math.min(100, Math.round((completedTasks.length / totalTasks) * 100)) : 0
                        return (
                          <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(38,194,129,0.12)', border: '1px solid rgba(38,194,129,0.2)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                  {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: 28, height: 28, objectFit: 'cover' }} /> : <i className="bx bx-building-house" style={{ color: '#26c281', fontSize: 12 }}></i>}
                                </span>
                                {client.name}
                              </div>
                            </td>
                            {ONBOARDING_PHASES.map((phase) => {
                              const phaseDone = phase.tasks.filter((t) => completedTasks.includes(t.id)).length
                              const phaseTotal = phase.tasks.length
                              const allDone = phaseDone === phaseTotal
                              const noneDone = phaseDone === 0
                              return (
                                <td key={phase.id} style={{ textAlign: 'center', padding: '10px 8px' }}>
                                  <span title={`${phaseDone}/${phaseTotal}`} style={{
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    width: 28, height: 28, borderRadius: 8,
                                    background: allDone ? 'rgba(34,197,94,0.18)' : noneDone ? 'rgba(255,255,255,0.04)' : 'rgba(245,158,11,0.15)',
                                    color: allDone ? '#22c55e' : noneDone ? 'rgba(255,255,255,0.2)' : '#f59e0b',
                                    fontSize: '0.72rem', fontWeight: 700,
                                  }}>
                                    {allDone ? <i className="bx bx-check" style={{ fontSize: 14 }}></i> : noneDone ? <i className="bx bx-minus" style={{ fontSize: 12 }}></i> : phaseDone}
                                  </span>
                                </td>
                              )
                            })}
                            <td style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 800, color: progress === 100 ? '#22c55e' : progress > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>{progress}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* LIST VIEW */}
              {onboardingView === 'list' && (
                <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredOnboardingClients.map((client) => {
                    const record = onboardingRecords.find((r) => r.client_id === client.id)
                    const allValidIds = new Set(ONBOARDING_PHASES.flatMap(p => p.tasks.map(t => t.id)))
                    const completedTasks = (Array.isArray(record?.completed_tasks) ? record.completed_tasks : []).filter(id => allValidIds.has(id))
                    const completedCount = completedTasks.length
                    const progress = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setOnboardingExpandedClient(client.id)}
                        style={{ borderRadius: 14, border: '1px solid rgba(129,216,167,0.1)', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', color: 'inherit', width: '100%' }}
                      >
                        <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(38,194,129,0.1)', border: '1px solid rgba(38,194,129,0.18)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {client.logoUrl ? <img src={client.logoUrl} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} /> : <i className="bx bx-building-house" style={{ color: '#26c281', fontSize: 14 }}></i>}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', flex: 1 }}>{client.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 160 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#22c55e' : '#26c281', borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, whiteSpace: 'nowrap' }}>{completedCount}/{totalTasks}</span>
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: progress === 100 ? '#22c55e' : progress > 0 ? '#f59e0b' : 'rgba(255,255,255,0.3)', minWidth: 36, textAlign: 'right' }}>{progress}%</span>
                        <i className="bx bx-chevron-right" style={{ fontSize: 18, opacity: 0.4 }}></i>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* CARDS VIEW */}
              {onboardingView === 'cards' && (
              <div style={{ display: 'grid', gap: 16, padding: '24px 28px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', alignItems: 'start' }}>
                {filteredOnboardingClients.map((client) => {
                  const record = onboardingRecords.find((r) => r.client_id === client.id)
                  const allValidIds = new Set(ONBOARDING_PHASES.flatMap(p => p.tasks.map(t => t.id)))
                  const completedTasks = (Array.isArray(record?.completed_tasks) ? record.completed_tasks : []).filter(id => allValidIds.has(id))
                  const completedCount = completedTasks.length
                  const progress = totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setOnboardingExpandedClient(client.id)}
                      style={{ borderRadius: 18, border: '1px solid rgba(129,216,167,0.14)', background: 'rgba(255,255,255,0.025)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left', color: 'inherit', width: '100%' }}
                    >
                      <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(38,194,129,0.12)', border: '1px solid rgba(38,194,129,0.2)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {client.logoUrl
                          ? <img src={client.logoUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} />
                          : <i className="bx bx-building-house" style={{ color: '#26c281', fontSize: 18 }}></i>
                        }
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.97rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{client.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#22c55e' : '#26c281', borderRadius: 4, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, whiteSpace: 'nowrap' }}>{completedCount}/{totalTasks}</span>
                        </div>
                      </div>
                      <i className="bx bx-chevron-right" style={{ fontSize: 20, opacity: 0.4, flexShrink: 0 }}></i>
                    </button>
                  )
                })}
              </div>
              )}

              {/* ONBOARDING TASK MODAL */}
              {(() => {
                const modalClient = onboardingExpandedClient ? onboardingClients.find((c) => c.id === onboardingExpandedClient) : null
                if (!modalClient) return null
                const record = onboardingRecords.find((r) => r.client_id === modalClient.id)
                const completedTasks = Array.isArray(record?.completed_tasks) ? record.completed_tasks : []
                const naTasks = Array.isArray(record?.na_tasks) ? record.na_tasks : []
                const completedCount = completedTasks.length
                const naCount = naTasks.length
                const effectiveTotal = totalTasks - naCount
                const progress = effectiveTotal > 0 ? Math.round((completedCount / effectiveTotal) * 100) : 100
                return (
                  <div
                    onClick={() => setOnboardingExpandedClient(null)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '100%', maxWidth: 720, borderRadius: 24, background: 'linear-gradient(160deg,#0f172a 0%,#0d1f17 100%)', border: '1px solid rgba(38,194,129,0.2)', boxShadow: '0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(38,194,129,0.06)', overflow: 'hidden', marginBottom: 24 }}
                    >
                      {/* Hero header */}
                      <div style={{ position: 'relative', padding: '28px 28px 22px', background: 'linear-gradient(135deg,rgba(38,194,129,0.1) 0%,rgba(34,197,94,0.04) 100%)', borderBottom: '1px solid rgba(38,194,129,0.12)' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(38,194,129,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                          <span style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(38,194,129,0.15)', border: '1.5px solid rgba(38,194,129,0.35)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 20px rgba(38,194,129,0.2)' }}>
                            {modalClient.logoUrl ? <img src={modalClient.logoUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover' }} /> : <i className="bx bx-building-house" style={{ color: '#26c281', fontSize: 26 }}></i>}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#26c281', marginBottom: 4, opacity: 0.8 }}>Checklist de Onboarding</div>
                            <div style={{ fontWeight: 900, fontSize: '1.35rem', marginBottom: 10, lineHeight: 1.2 }}>{modalClient.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#22c55e' : 'linear-gradient(90deg,#26c281,#4ade80)', borderRadius: 6, transition: 'width 0.4s', boxShadow: progress > 0 ? '0 0 10px rgba(38,194,129,0.4)' : 'none' }} />
                              </div>
                              <span style={{ fontSize: '0.82rem', fontWeight: 900, color: progress === 100 ? '#22c55e' : 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>{progress}%</span>
                            </div>
                            <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}><span style={{ color: '#22c55e', fontWeight: 700 }}>{completedCount}</span> concluídas</span>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}><span style={{ fontWeight: 700 }}>{effectiveTotal - completedCount}</span> pendentes</span>
                              {naCount > 0 && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}><span style={{ color: '#94a3b8', fontWeight: 700 }}>{naCount}</span> n/a</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setOnboardingQuickAccess(true) }}
                              title="Cadastrar acesso para este cliente"
                              style={{ height: 36, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(38,194,129,0.35)', background: 'rgba(38,194,129,0.12)', cursor: 'pointer', color: '#26c281', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}
                            >
                              <i className="bx bx-key" style={{ fontSize: 15 }}></i>
                              <span className="nav-label" style={{ fontSize: 12 }}>+ Dado</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setOnboardingExpandedClient(null)}
                              style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                            >
                              <i className="bx bx-x" style={{ fontSize: 20 }}></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Modal body — phases + tasks */}
                      <div style={{ padding: '20px 28px 28px', maxHeight: '65vh', overflowY: 'auto' }}>
                        {ONBOARDING_PHASES.map((phase, phaseIndex) => {
                          const phaseDone = phase.tasks.filter((t) => completedTasks.includes(t.id)).length
                          const phaseNa = phase.tasks.filter((t) => naTasks.includes(t.id)).length
                          const phaseEffectiveTotal = phase.tasks.length - phaseNa
                          const phaseComplete = phaseEffectiveTotal > 0 ? phaseDone === phaseEffectiveTotal : true
                          const phaseColors = ['#26c281','#6366f1','#f59e0b','#ec4899','#3b82f6','#10b981','#8b5cf6','#f97316','#06b6d4','#84cc16','#ef4444','#a855f7','#14b8a6','#fb923c']
                          const color = phaseColors[phaseIndex % phaseColors.length]
                          const isPhaseOpen = onboardingExpandedPhases.has(phase.id)
                          const togglePhase = () => setOnboardingExpandedPhases((prev) => {
                            const next = new Set(prev)
                            if (next.has(phase.id)) next.delete(phase.id)
                            else next.add(phase.id)
                            return next
                          })
                          return (
                            <div key={phase.id} style={{ marginBottom: 6 }}>
                              {/* Phase header — clickable */}
                              <button
                                type="button"
                                onClick={togglePhase}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: isPhaseOpen ? '12px 12px 0 0' : 12, background: phaseComplete ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${phaseComplete ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderBottom: isPhaseOpen ? 'none' : undefined, cursor: 'pointer', color: 'inherit', textAlign: 'left' }}
                              >
                                <span style={{ width: 30, height: 30, borderRadius: 9, background: `${color}1a`, border: `1.5px solid ${color}40`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                  <i className={`bx ${phase.icon}`} style={{ color, fontSize: 15 }}></i>
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: phaseComplete ? '#22c55e' : 'rgba(255,255,255,0.8)' }}>{phase.label}</div>
                                  {phase.deadline && <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600, marginTop: 1 }}>{phase.deadline}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 60, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${phaseEffectiveTotal > 0 ? (phaseDone / phaseEffectiveTotal) * 100 : 100}%`, background: phaseComplete ? '#22c55e' : color, borderRadius: 3, transition: 'width 0.3s' }} />
                                  </div>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: phaseComplete ? '#22c55e' : 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', minWidth: 32, textAlign: 'right' }}>{phaseDone}/{phaseEffectiveTotal}</span>
                                  {phaseComplete
                                    ? <i className="bx bx-check-circle" style={{ color: '#22c55e', fontSize: 16 }}></i>
                                    : <i className={`bx ${isPhaseOpen ? 'bx-chevron-up' : 'bx-chevron-down'}`} style={{ fontSize: 16, opacity: 0.4 }}></i>
                                  }
                                </div>
                              </button>
                              {/* Tasks — only shown when expanded */}
                              {isPhaseOpen && (
                                <div style={{ paddingLeft: 8, background: 'rgba(255,255,255,0.02)', border: `1px solid ${phaseComplete ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderTop: 'none', borderRadius: '0 0 12px 12px', paddingTop: 4, paddingBottom: 4 }}>
                                  {phase.tasks.map((task) => {
                                    const done = completedTasks.includes(task.id)
                                    const isNa = naTasks.includes(task.id)
                                    return (
                                      <div
                                        key={task.id}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1, borderRadius: 8, transition: 'background 0.12s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleToggleOnboardingTask(modalClient.id, task.id)}
                                          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'transparent', border: 'none', borderRadius: 8, cursor: isNa ? 'default' : 'pointer', color: 'inherit', textAlign: 'left', opacity: isNa ? 0.35 : 1 }}
                                          disabled={isNa}
                                        >
                                          <span style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${done ? color : 'rgba(255,255,255,0.15)'}`, background: done ? color : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.15s', boxShadow: done ? `0 0 8px ${color}60` : 'none' }}>
                                            {done && <i className="bx bx-check" style={{ fontSize: 11, color: '#fff', fontWeight: 900 }}></i>}
                                          </span>
                                          <span style={{ fontSize: '0.85rem', lineHeight: 1.45, textDecoration: done ? 'line-through' : isNa ? 'line-through' : 'none', opacity: done ? 0.4 : 0.85, transition: 'all 0.15s', flex: 1 }}>{task.label}</span>
                                        </button>
                                        <button
                                          type="button"
                                          title={isNa ? 'Clique para remover N/A' : 'Não se aplica'}
                                          onClick={() => handleToggleOnboardingTaskNA(modalClient.id, task.id)}
                                          style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${isNa ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, background: isNa ? 'rgba(239,68,68,0.15)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s', marginRight: 8, color: isNa ? '#ef4444' : 'rgba(255,255,255,0.25)' }}
                                        >
                                          <i className="bx bx-x" style={{ fontSize: 14 }}></i>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </section>
            {onboardingQuickAccess && (() => {
              const modalClient = onboardingExpandedClient ? (clients || []).find((c) => c.id === onboardingExpandedClient) : null
              return (
                <QuickAddAccessModal
                  clientId={modalClient?.id || null}
                  clientName={modalClient?.name || null}
                  onClose={() => setOnboardingQuickAccess(false)}
                  onSaved={() => setOnboardingQuickAccess(false)}
                />
              )
            })()}
            </>
          )
}
