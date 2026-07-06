# Redesign Brief — Assessoria LP Dashboard (Kinetic Emerald)

> **Objetivo do projeto:** construir uma **interface de front-end nova**, mantendo **100% das funcionalidades que já existem hoje**. Nada de feature pode ser perdida — só muda a pele (visual/UX). Por isso este documento é o **prompt exato**: cada tela lista o que existe hoje e deve continuar existindo.
>
> Documento de handoff para o **Claude Design** remodelar cada tela da plataforma.
> Cada seção traz: **objetivo** · **quem usa** · **Hoje temos** (funcionalidades atuais — não remover) · **o que precisa entregar** · **direção visual**.
> A direção visual global (cores, tipografia, curvas, elevação) está no topo e vale para **todas** as telas.
> O **Apêndice A** (fim do doc) lista todas as rotas/APIs como checklist de cobertura — nenhuma pode ficar órfã de tela.

---

## 0. Direção visual global — colar em todo prompt

**Sistema:** Kinetic Emerald — corporativo moderno + glassmorphism sobre fundo grafite profundo (chiaroscuro). Emerald usado com parcimônia como "kinetic highlight" (CTAs, números, destaques). Sensação: precisão industrial + inteligência data-driven. Sem enfeite decorativo.

### Cores
| Papel | Valor |
|---|---|
| Fundo base | `#131313` / abissal `#0A0A0A` |
| Fundo painel | `#111113` |
| Sidebar | `rgba(8,8,10,0.95)` |
| Accent / brand | `#26C281` (emerald) |
| Primary token (mais brilhante) | `#4fdf9b` |
| Texto primário | `#E5E2E1` / `#f5f5f7` |
| Texto secundário | `rgba(245,245,247,0.72)` |
| Texto muted | `rgba(245,245,247,0.44)` |
| Card glass | `rgba(28,28,28,0.4)` + `backdrop-filter: blur(12px)` |
| Borda padrão | `rgba(255,255,255,0.05–0.07)` |
| Borda com identidade | `rgba(38,194,129,0.12–0.40)` |
| Emerald glow (hover) | `box-shadow: 0 0 30px rgba(38,194,129,0.1)` |
| Sucesso / Atenção / Perigo / Info | `#22c55e` / `#f59e0b` / `#ef4444` / `#6366f1` |

**Nuvem radial (assinatura da marca):** headers usam `radial-gradient(ellipse 100% 55% at 50% -10%, rgba(38,194,129,0.13) 0%, transparent 60%)`. Intensidade: headers `0.13`, stat cards `0.10–0.12`, shells grandes `0.06–0.08`.

### Tipografia
- **Plus Jakarta Sans** — headlines e body.
- **Inter** — labels/metadados UI, sempre UPPERCASE com `letter-spacing 0.05–0.1em` (estética de "tag industrial").
- Escala: display 48/700 → headline-lg 32/700 → headline-md 24/600 → body-lg 18 → body-md 16 → label-md 14/Inter → label-sm 10/700/Inter.
- Títulos de seção: peso **900**, `clamp(1.4rem, 2.5vw, 1.9rem)`.
- Kicker de seção: `0.62rem`, 700, uppercase, `letter-spacing 0.08em`, cor `#26c281`, opacity 0.85.
- Números de destaque (stats): `1.5rem`, peso 900, cor emerald.

### Curvas (border-radius)
| Elemento | Raio |
|---|---|
| Modal / card principal | 24px |
| Hero / card grande | 16–20px |
| Stat card / glass-panel | 12–16px |
| Avatar / ícone de item | 10px |
| Input / select / chip de filtro | 9–10px |
| Botão / badge / pill | 9999px (full) |
| Barra de progresso | 6px |

### Elevação (3 níveis)
1. **Fundo** `#0A0A0A` + gradiente radial emerald 5%.
2. **Cards** glass 40% grafite + blur 12px + borda 1px branco 5%.
3. **Hover/ativo** superfície mais clara **ou** emerald glow.
- Borda superior **accent** `3px solid #26C281` em blocos primários.

### Componentes canônicos (não reinventar)
- **Botão primário:** pill, fundo `#26C281`, texto `#003821`, peso 700, hover 80% opacity + `translateY(-1px)`.
- **Botão ghost:** pill, transparente, borda 1px branco 10%.
- **Ícones:** Material Symbols Outlined / Boxicons em container circular com fundo emerald 10%.
- **Chips/tags:** `label-sm`, UPPERCASE, alto tracking, pill.
- **Hero de seção:** gradiente `135deg rgba(38,194,129,0.07)→0.01`, borda inferior emerald 12%, decoração radial no canto superior direito.
- **Stat card:** padding 12×16, radius 12, fundo `rgba(23,25,35,0.8)`, borda branco 7%, label uppercase 0.65rem, valor 1.5rem/900 emerald.

> **Regra inegociável:** a **aba Dados** (Clientes → tab Dados) é a fonte oficial de identidade. Todo componente novo deve replicar estrutura, proporções e comportamento do que já existe lá. **Consistência acima de inovação.** Suporte a **light mode** (fundo quase-branco, borda emerald mais forte, gradiente escuro some).

### Prompt-base (system) para o Claude Design
> "Você está redesenhando telas do 'Assessoria LP Dashboard', um hub de performance para agência de marketing. Aplique rigorosamente o design system **Kinetic Emerald** (grafite `#131313`, accent emerald `#26C281`, glassmorphism, Plus Jakarta Sans + Inter, cantos 16px em cards e pill em botões, nuvem radial emerald nos headers). Dark-first com light mode. Layout bento 12 colunas, container 1440px, gutter 20px. Priorize densidade informacional legível, hierarquia por contraste e emerald só onde importa. Entregue: layout responsivo, estados (vazio/carregando/erro) e componentes reutilizáveis."

---

## 1. Mapa de telas (sitemap)

**Geral:** Home · Controle da Operação · Rotinas · Configurações
**Sucesso do Cliente:** Clientes (Dados = referência) · Onboarding · Offboarding · Acessos
**Performance:** Dash (Pitch Deck) · Campanhas · Anúncios · Saldos · Relatórios · Planilha de Leads · Funil · Tarefas · IA Orbit (assistente)
**Social Media:** Painel · Calendário Editorial · Planejamentos
**PAC:** Painel · Calendário · Tipos
**Admin / Master:** Usuários · Funções e Permissões · Permissões de Páginas · **Centro de Controle Master (novo)**
**Conta:** **Página de Usuário / Perfil (novo)**
**Institucional / público:** Login · Integração (landing) · Contexto · Produtos · Apresentação de cliente · Privacidade / Termos / Exclusão de dados

**Integrações vivas hoje:** Meta Ads · Google Ads · Google Calendar · Google Sheets · Google Drive · ClickUp · Monday · RD Station.
**Papéis:** `master` · `operador` · `visualizador` · `cliente` · `gestor_resultado`.

---

## 2. Prompts por tela

### 2.1 Home (Geral)
**Objetivo:** ponto de entrada pós-login — resume o estado da operação e leva rápido às seções.
**Quem usa:** todos os papéis internos (conteúdo varia por permissão).
**Hoje temos:** cards de atalho por permissão (Pitch Deck, Clientes, Time/Usuários com contagem da base); saudação contextual; sino de notificações (`NotificationBell`) com eventos da plataforma.
**Precisa entregar:** grid bento de atalhos com métrica-resumo em cada; bloco de pendências/alertas do dia; feed de atividade recente; central de notificações.
**Visual:** hero com nuvem radial emerald e kicker; cards bento glass com número emerald e microcopy label uppercase; estado vazio elegante.

### 2.2 Controle da Operação (Weekly Command Center)
**Objetivo:** central semanal — status de cada cliente por semana, o que foi preenchido e o que falta.
**Quem usa:** master, operador, gestor_resultado.
**Hoje temos:** seletor de período (todo o período / semana atual / semana passada / personalizada / mês); grade de clientes com **flags de saúde** (entregáveis, financeiro, ROI, health score manual, CRM em uso, CS atendimento, CSAT ≥4, participação do cliente >90%, contas de anúncio ativas, NPS ≥7, stakeholder pagador consciente) valoradas em Ok/Atenção/Risco/N-A; classificação automática de saúde do cliente (**Crítico / Atenção / Saudável / Com resultado / Integração / Churn / Sem dados**) com cor e glow; chips de filtro por status; indicador de preenchimento por semana; **Planos de Ação** por cliente (`ActionPlanManager`, `operation/action-plans`); **espaços semanais** configuráveis (`operation/weekly-spaces`, `ActionSpaceSettings`) e contexto da operação (`operation/context`); APIs `client-weekly` / `operation/cards`.
**Precisa entregar:** manter a grade densa + resumo por status + preenchimento rápido semana a semana + gestor de planos de ação (tarefas/responsável/prazo) por cliente + configuração de espaços/colunas semanais.
**Visual:** tabela densa padrão "aba Dados" (header uppercase 0.68rem opacity 0.35, hover `rgba(255,255,255,0.025)`); flags como chips de estado; stat cards de resumo por classificação de saúde (cada cor com seu glow).

### 2.3 Rotinas
**Objetivo:** rotinas semanais recorrentes por função (ex.: Gestor de Resultado).
**Quem usa:** operador, gestor_resultado, master.
**Hoje temos:** grade Segunda→Sexta (com Sáb/Dom opcionais) de tarefas-rotina por papel; templates de rotina pré-definidos por função (reunião de alinhamento, revisão de KPIs, acompanhamento de campanhas etc.).
**Precisa entregar:** editor de rotina por dia da semana; atribuição por papel/pessoa; marcação de concluído.
**Visual:** colunas por dia da semana (glass), cards de rotina com check emerald; chip de papel; layout de "quadro semanal".

### 2.4 Configurações (Synthesizer)
**Objetivo:** ajustar integrações, credenciais globais e preferências da plataforma.
**Quem usa:** master (edição); demais leem.
**Hoje temos:** conectores **Meta Ads, Google Ads, Google Calendar, Google Sheets, Google Drive, ClickUp, Monday, RD Station** com fluxo OAuth e status de conexão; preferências de tema (dark/light); credenciais por env; `settings/page.tsx` com `.settings-block-hero`.
**Precisa entregar:** blocos de integração com status conectado/desconectado, botão OAuth e teste de conexão; branding white-label/tokens; credenciais mascaradas.
**Visual:** `.integration-block` + `.integration-heading` + `.integration-icon`; cada integração é card glass com ícone circular emerald, badge de status pill e CTA. Header "Synthesizer" com kicker.

### 2.5 Clientes (referência oficial — aba Dados)
**Objetivo:** cadastrar/gerir clientes, grupos e quem enxerga cada dashboard.
**Quem usa:** master, operador.
**Hoje temos:** busca + chips de filtro; stat cards; diretório com avatar 40×40; **modal de edição completo** com: dados do cliente; tipo (Inside Sales / Ecom / PDV); **links** (contrato, dashboard, drive, EAP, manual de marca, moodboard, narrativa de vendas, draw flow); **responsáveis** (gestor de projetos, gestor de tráfego, designer, CS/atendimento); **flags de saúde**; grupos de clientes; ACL por usuário e por grupo (`user_client_access`, `user_client_group_access`).
**Precisa entregar:** manter tudo — esta é a fonte de verdade.
**Visual:** ESTA é a referência — manter exatamente. Modal com header gradiente emerald, blocos de integração, avatar circular. Refinar sem quebrar a linguagem.

### 2.6 Onboarding
**Objetivo:** acompanhar a implementação de novos clientes por trilha.
**Quem usa:** master, operador.
**Hoje temos:** trilhas **Setup de implementação / Inside Sales / Ecom / PDV / Ongoing**; definições de tarefas de onboarding por trilha (`onboarding-tasks/definitions`, `client-onboarding`); progresso por cliente; stat cards de resumo.
**Precisa entregar:** checklist/etapas com progresso por trilha; filtro por trilha; responsável e prazo; visão de atrasados/concluídos.
**Visual:** cards de progresso com barra 6px; badges de trilha em chips uppercase; atraso em âmbar/vermelho (card de estado com barra de topo).

### 2.7 Offboarding
**Objetivo:** conduzir a saída de cliente.
**Quem usa:** master, operador.
**Hoje temos:** fluxo de offboarding por cliente (`client-offboarding`); registro de motivo/churn.
**Precisa entregar:** categoria de churn; checklist de desligamento (revogar acessos, encerrar contratos, exportar dados); timeline do processo; aprendizado registrado.
**Visual:** tom sóbrio; cards de estado "danger/warning"; timeline vertical com marcadores emerald.

### 2.8 Acessos
**Objetivo:** cofre de acessos, materiais e itens operacionais de cada cliente.
**Quem usa:** master, operador.
**Hoje temos:** categorias de **acesso** (Redes Sociais, Google, Site, CRM, Personalizado), **operacionais** (Localização, WhatsApp Business) e **materiais** (Documento, Link Importante, Planilha); armazenamento de login/senha; **status por item** (Ativo, Pendente, Em revisão, Desatualizado, Sem acesso, Precisa atualizar, Com problema); adição rápida (`QuickAddAccessModal`).
**Precisa entregar:** organização por categoria com credenciais mascaradas (mostrar/ocultar/copiar); status por item; busca; adição rápida.
**Visual:** grupos por categoria (ícone colorido por tipo); item com badge de status; campo de senha com toggle de visibilidade; chips de tipo.

### 2.9 Dash / Pitch Deck (Apresentação)
**Objetivo:** leitura executiva de resultados de um cliente — "modo apresentação" para reunião.
**Quem usa:** operador, gestor_resultado, cliente (visualização).
**Hoje temos:** seletor de cliente + período; KPIs grandes; `.hero-panel` / `.hero-stat`; base para versão pública compartilhável (`/clientes/[id]/apresentacao`).
**Precisa entregar:** hero com KPIs (spend, leads, CPL, ROAS, conversões); gráficos de tendência; blocos narrativos; funcionar em tela cheia/projetor.
**Visual:** números gigantes emerald; gráficos com paleta consistente (skill dataviz); muito respiro (section-gap 96px).

### 2.10 Campanhas (Performance)
**Objetivo:** visão de campanhas por cliente, com métricas.
**Quem usa:** operador, gestor_resultado.
**Hoje temos:** **árvore Meta + Google** (campanha → conjunto → anúncio) com modo lista/tree; busca por cliente, campanha, conjunto ou anúncio; seletor de período (hoje/ontem/7d/30d/mês); **25+ métricas**: spend, impressões, alcance, cliques, landing page views, add to cart, initiate checkout, CPC, CPM, frequência, CTR, conversões totais, taxa de conversão, valor de compra, compras, leads, mensagens, video views, video view rate, thruplay, hook rate, CPA, ROAS; **breakdowns** demográficos/posicionamento (`meta/breakdowns`); **série diária** (`meta/campaign-daily`) e **benchmarks de CPR/custo** (`cpr-benchmarks`); `meta-fetch.js` com cache/dedupe.
**Precisa entregar:** tabela/árvore densa com métricas configuráveis; toggle ativar/pausar; chips de plataforma.
**Visual:** `.ads-overview-hero`; colunas numéricas alinhadas à direita; métrica-destaque em emerald; chips de plataforma (Meta/Google/TikTok/LinkedIn) com ícone.

### 2.11 Anúncios
**Objetivo:** granularidade a nível de anúncio/criativo com preview.
**Quem usa:** operador.
**Hoje temos:** preview e thumbnail de criativo (`meta/creative-preview`, `creative-thumbnail`); métricas por anúncio (hook rate, thruplay, video views).
**Precisa entregar:** grid de criativos com thumbnail, métricas por anúncio, comparação, preview.
**Visual:** cards de criativo (thumbnail 12px, overlay de métricas emerald ao hover); grid bento; badge de formato.

### 2.12 Saldos
**Objetivo:** monitorar saldo/verba das contas de anúncio.
**Quem usa:** master, operador.
**Hoje temos:** saldo por conta de anúncio (`meta/account-balances`); busca por cliente, conta ou cartão; **alerta de saldo automático** por cliente (`clients/[id]/balance-alert`, webhook `webhooks/balance-alerts`); `.ad-balance-hero`.
**Precisa entregar:** cards por conta com saldo atual, gasto no período, projeção de esgotamento, configuração de limite de alerta por cliente, histórico de recargas.
**Visual:** card de estado (danger quando crítico) com barra de topo; número de saldo grande emerald.

### 2.13 Relatórios
**Objetivo:** gerar/consultar relatórios de performance para clientes.
**Quem usa:** operador, gestor_resultado.
**Hoje temos:** **montador de relatório manual** com blocos: contexto, KPIs Meta Ads, tabela de campanhas, CRM manual, funil e observações; **preview em tema claro idêntico ao PDF**; frequências semanal/quinzenal/mensal/trimestral/quadrimestral/anual/ciclo; `reports/manual`, `reports/[reportId]`.
**Precisa entregar:** editor 2 colunas (blocos à esquerda, preview à direita); templates por frequência; export/compartilhar; histórico.
**Visual:** preview segue estética Pitch Deck (mas versão light = PDF); botões de export pill.

### 2.14 Planilha de Leads
**Objetivo:** consolidar leads/cadastros com qualificação e custo por cadastro.
**Quem usa:** operador, gestor_resultado.
**Hoje temos:** tabela de leads com **qualificação** (Qualificado, Convertido/venda, Perdido, Sem resposta, Outros); **gráfico de pizza** da distribuição de qualificação; evolução de cadastros × CPL ao longo do tempo (`LeadsDashboard`).
**Precisa entregar:** tabela + gráficos + filtros por período/origem; import/export; stat cards (total, CPL médio, taxa de conversão).
**Visual:** tabela densa + linha de evolução (skill dataviz; emerald na série principal, paleta distinta na pizza).

### 2.15 Funil
**Objetivo:** visualizar o funil de conversão fim a fim.
**Quem usa:** operador, gestor_resultado, cliente.
**Hoje temos:** estágios de **fontes Meta** (impressões, cliques, leads) + **fontes PGL/CRM** (público-alvo, qualificados, convertidos); taxas de conversão entre estágios; construtor de funil (`funnel-builder`); reusa a árvore de campanhas.
**Precisa entregar:** funil visual por etapa com taxas entre estágios; construtor de etapas; comparação de período.
**Visual:** blocos empilhados com largura proporcional; % de conversão em chips emerald; cor por estágio.

### 2.16 Tarefas
**Objetivo:** gestão de tarefas internas por cliente/espaço.
**Quem usa:** todos internos.
**Hoje temos:** visões **Kanban / Tabela / Tickets**; **prioridades** (Urgente/Alta/Média/Baixa/Sem); **subtarefas**, **checklists**, **tarefas recorrentes**, **automações**, **templates de tarefa**, **status templates**, **campos customizados**, **comentários**, **anexos**, **espaços/spaces** com ícones, **arquivo de tarefas** (`ArchivedTasksPanel`); atribuição múltipla; `task-views`, `task-templates`, `recurring-tasks`, `automations`, `gr-tasks`.
**Precisa entregar:** manter as 3 visões; Kanban com colunas por status; badge de prioridade; campos customizados; gerenciadores de coluna/status/automação.
**Visual:** Kanban glass, cards com badge de prioridade (cores de estado), avatar de responsável; drag-and-drop com emerald glow no destino; urgente em vermelho.

### 2.17 IA Orbit (assistente)
**Objetivo:** assistente de IA que responde sobre a operação do cliente.
**Quem usa:** papéis com `canUseAi`.
**Hoje temos:** chat "IA Orbit" que responde sobre **campanhas, CRM, criativos, clientes e arquivos vinculados**; histórico de conversas (`assistant_conversations`, `assistant_messages`); base de conhecimento do cliente (`client-knowledge-panel`).
**Precisa entregar:** painel de chat com histórico de conversas, seleção de cliente/contexto, citações de fonte, streaming; anexos.
**Visual:** chat glass; bolha do assistente à esquerda com ícone emerald, do usuário à direita; input pill "Pergunte sobre campanhas, CRM, criativos…"; contexto de cliente em chip.

### 2.18 Social Media — Painel
**Objetivo:** visão-resumo da operação de conteúdo.
**Quem usa:** operador (social), gestor_resultado.
**Hoje temos:** resumo de posts por status; `.editorial-header`.
**Precisa entregar:** stat cards (posts do mês, aprovados, pendentes, publicados); próximas publicações; status de aprovação por cliente.
**Visual:** cards de status com badges; mini-calendário-resumo.

### 2.19 Social Media — Calendário Editorial
**Objetivo:** planejar e agendar conteúdo.
**Quem usa:** operador (social).
**Hoje temos:** posts com **status** (Pendente, Agendado, Publicado, Cancelado); **canais** (Instagram, Facebook, LinkedIn, TikTok, YouTube, X/Twitter); data e hora de agendamento; título, descrição e cliente; `editorial/[postId]`.
**Precisa entregar:** calendário mensal/semanal com posts por dia; card de post (formato, legenda, mídia, status); fluxo de aprovação; filtro por cliente/canal.
**Visual:** grade de calendário glass; posts como chips coloridos por status; modal de post com preview de mídia e header emerald.

### 2.20 Social Media — Planejamentos
**Objetivo:** planejamento estratégico de conteúdo.
**Quem usa:** operador (social), gestor_resultado.
**Hoje temos:** planos por cliente e período; notas estilo iOS (`.ios-notes-shell`).
**Precisa entregar:** documentos/planos com pilares de conteúdo, metas e anexos.
**Visual:** cards de plano tipo documento; editor rico estética iOS Notes.

### 2.21 PAC — Painel / Calendário / Tipos
**Objetivo:** Programa de Aceleração — acompanhamento contínuo com encontros/treinamentos.
**Quem usa:** master, gestor_resultado.
**Hoje temos:** treinamentos com **status** (Agendado, Realizado, Cancelado); **formatos** (Livro, Vídeo, Áudio, Apresentação, Grupo, Certificação, Desktop, Online); tipos configuráveis (`pac/training-types`, `pac/trainings`); notas por encontro; `.pac-card`.
**Precisa entregar:** Painel (status por cliente, próximos encontros, pendências); Calendário (agendamento de encontros/ciclos); Tipos (config de tipos de encontro).
**Visual:** `.pac-card`; timeline de ciclos; cards de encontro com data grande, formato e responsável.

### 2.22 Usuários (Admin)
**Objetivo:** gerir pessoas do time.
**Quem usa:** master; usuário vê a própria versão.
**Hoje temos:** CRUD de usuários; papel (badge); **PDI, metas e carteira de clientes** por colaborador; rotinas por papel; `.management-hero`; `users`, `me`.
**Precisa entregar:** diretório com avatar, papel, status; modal (dados, papel, clientes ligados, PDI, metas); busca e filtro por papel.
**Visual:** tabela padrão Dados; badge de papel colorido; modal com header emerald.

### 2.23 Funções e Permissões
**Objetivo:** definir papéis e capacidades.
**Quem usa:** master.
**Hoje temos:** **catálogo de permissões granulares** (ex.: `dashboard.view/edit/export`, `tasks.spaces.create/edit/delete`, `tasks.create/edit/delete`, `tasks.templates`, `tasks.automations` …) por papel; `RolesTab`, `roles`, `permissions`.
**Precisa entregar:** lista de papéis com matriz de capacidades; editor de papel.
**Visual:** matriz de toggles; cada papel um card; ícone de escudo emerald.

### 2.24 Permissões de Páginas
**Objetivo:** conceder/revogar acesso de cada usuário a cada página.
**Quem usa:** master.
**Hoje temos:** seletor de usuário (chips); grupos (Sucesso do Cliente, Performance, Social Media, PAC, Geral) com toggle por página; "selecionar/desselecionar tudo"; `nav-permissions`.
**Precisa entregar:** refinar o existente — chips de usuário, grid de toggles pill verdes por grupo, header com ícone de escudo.
**Visual:** já existe base — polir hierarquia e responsividade.

### 2.25 Notas por cliente
**Objetivo:** bloco de notas por cliente, estilo iOS Notes.
**Quem usa:** operador, gestor_resultado, master.
**Hoje temos:** notas por cliente com CRUD (`clients/[id]/notes`, `notes`, `ClientNotesPanel`), shell `.ios-notes-shell`.
**Precisa entregar:** lista de notas + editor; busca; timestamps; anexos.
**Visual:** painel duas colunas (lista à esquerda, editor à direita), estética iOS Notes dentro do brandkit escuro; acento emerald sutil.

### 2.26 Calendário (Google Calendar)
**Objetivo:** agenda integrada ao Google Calendar.
**Quem usa:** operador, gestor_resultado.
**Hoje temos:** listagem de calendários e eventos, CRUD de evento (`google-calendar/calendars`, `/events`, `/events/[id]`); página `/calendar`.
**Precisa entregar:** visão mês/semana/dia; criar/editar evento; seletor de calendário; sincronização.
**Visual:** grade de calendário glass; eventos como chips; header emerald; estado de "conectar Google" quando sem integração.

### 2.27 Fontes de CRM & dados (RD Station, Agendor, Sheets, ClickUp, Monday)
**Objetivo:** trazer dados de CRMs e planilhas para dentro do dashboard.
**Quem usa:** operador, gestor_resultado.
**Hoje temos:** **RD Station** (pipelines + resumo — `rd/pipelines`, `rd/summary`); **Agendor** (`saas/agendor/pipelines`); **Google Sheets** (leads-analytics, abas — alimenta Planilha de Leads); resumos **ClickUp** (`clickup/summary`, página `/clickup`) e **Monday** (`monday/summary`, página `/monday`).
**Precisa entregar:** cards de resumo por fonte com status de conexão; pipelines/estágios; mapeamento de colunas de planilha; deep-link para a fonte.
**Visual:** cards de integração glass com logo/ícone da fonte; badge de status; mini-tabelas de pipeline.

### 2.28 Camada White-label / SaaS
**Objetivo:** dashboard white-label para clientes/tenants externos (domínio próprio, tema próprio).
**Quem usa:** cliente/tenant SaaS, gestor.
**Hoje temos:** shell próprio (`saas/dashboard-shell`); **layout de dashboard customizável** (`saas/dashboard-layout`); **theme-panel** (presets de tema/branding — `saas/theme`, `workspace/branding`); **funnel-builder**; **client-knowledge-panel** e **client-sources** (fontes por cliente); **ai-integration-panel** + chat (`saas/ai/chat`, `saas/ai/settings`); conectores próprios (Meta com token manual, Google Ads, Google Drive files); `saas/sync`; resolução de tenant por domínio (`[slug]`, `domain-config`).
**Precisa entregar:** manter a paridade com o dashboard interno mas **temável por tenant** (cores/logo/domínio); editor de layout arrastar-e-soltar; painel de tema; construtor de funil.
**Visual:** mesmo Kinetic Emerald como *default*, porém **tokens sobrescrevíveis por tenant** (accent, logo, fundo). Deixar claro no design o que é fixo vs. o que o tenant customiza.

### 2.29 Visão Executiva / Platform
**Objetivo:** camada de plataforma para usuários de alto nível (JWT de plataforma).
**Quem usa:** platform/SaaS users, gestão.
**Hoje temos:** home executiva e visão executiva (`platform/home`, `platform/executive`); gestão de clientes e tarefas em nível de plataforma (`platform/clients`, `platform/tasks`); admin de workspaces (`admin/workspaces`).
**Precisa entregar:** dashboard executivo com KPIs agregados entre clientes/workspaces; ranking/comparativo; drill-down por cliente.
**Visual:** bento executivo, números grandes emerald, comparativos; tom "board room".

### 2.30 Versão / Changelog & Registro
**Hoje temos:** endpoint de versão (`version`); fluxo de **registro** (`auth/register`) e OAuth Facebook (`auth/facebook`).
**Precisa entregar:** modal/página de changelog (novidades por versão); tela de cadastro alinhada ao Login; arquivamento de cliente (`clients/[id]/archive`) exposto na gestão.
**Visual:** changelog em timeline; registro = espelho do Login.

---

## 3. Telas NOVAS (direção do que precisamos)

### 3.1 Página de Usuário / Perfil (self-service)
**Por que:** hoje não há um espaço próprio de conta; cada colaborador precisa gerenciar a si mesmo.
**Aproveitar do que já existe:** PDI, metas e carteira já existem em Usuários — trazer a versão "eu" para cá.
**Deve conter:** cabeçalho de identidade (avatar upload, nome, papel, e-mail, desde quando); conta & segurança (trocar senha, sessões ativas, 2FA futuro, preferências de notificação); preferências (tema dark/light, idioma, densidade); meu escopo (clientes/grupos que enxergo, read-only p/ não-master); meu desenvolvimento (PDI, metas do ciclo com progresso, carteira, histórico); integrações pessoais (Google/Meta vinculadas à minha conta, com status e "desconectar").
**Direção visual:** hero de perfil com nuvem radial emerald + avatar circular grande (borda emerald); 2 colunas bento; metas como stat cards com barra 6px; toggles pill; blocos de segurança com ícone circular emerald. Reutilizar `.management-hero`, `.management-stat-card`, `.integration-block`.

### 3.2 Centro de Controle Master
**Por que:** o master precisa de um cockpit único de governança, hoje espalhado entre Usuários, Permissões e Configurações.
**Deve conter:** saúde da plataforma (workspaces, usuários ativos, clientes, integrações conectadas vs. com erro, uso de IA em stat cards); governança de acesso consolidada (Usuários + Funções + Permissões de Páginas com busca "quem acessa o quê"); integrações globais (status de cada conector, tokens expirando, reautenticar); auditoria (log de ações sensíveis com filtro por usuário/período); white-label (domínios, branding, tema por workspace — ponte com o layer SaaS); automação/cron (status dos jobs `/api/cron`, última/próxima execução, disparo manual); ações destrutivas protegidas (suspender usuário, revogar todos os acessos, resetar integração).
**Direção visual:** dashboard bento denso mas respirável; topo com faixa de stat cards (nuvem 0.12); cards de estado (verde=ok, âmbar=token expirando, vermelho=integração quebrada) com barra de topo; tabela de auditoria padrão Dados; ações destrutivas em botão ghost com borda vermelha + modal de confirmação header vermelho. Emerald só para "tudo saudável". Transmitir **autoridade e controle** — a tela mais "cockpit" do produto.

---

## 4. Telas institucionais / públicas

### 4.1 Login
**Hoje temos:** dois fluxos — **Supabase Auth** (OAuth/e-mail) e **JWT de plataforma** (cookie); branding white-label por domínio (`[slug]`, `domain-config`).
**Precisa:** card central glass sobre fundo grafite com nuvem radial emerald; e-mail/senha + OAuth (Google/Meta); erros inline; recuperar senha; logo dinâmico por domínio.
**Visual:** minimalista, um único card centralizado, CTA emerald pill, gradiente radial sutil.

### 4.2 Integração (landing institucional)
**Hoje temos:** apresentação do método — Planejamento Estratégico, Processos Comerciais, Potenciais Clientes, PAC, Prestação de Contas.
**Precisa:** hero de marca; grid de pilares com ícone circular emerald; prova/resultados; CTA.
**Visual:** "marketing", full-width, section-gap 96px, display 48px, emerald highlights.

### 4.3 Contexto / Produtos / Apresentação de cliente
- **Contexto:** base de conhecimento/briefing do cliente para a IA (`client-knowledge-panel`). Cards editáveis, tom documento.
- **Produtos:** catálogo de produtos/ofertas do cliente. Grid de cards com preço/descrição.
- **Apresentação de cliente (`/clientes/[id]/apresentacao`):** versão pública/compartilhável do Pitch Deck — mesmo visual da 2.9, porém read-only e brandável.

### 4.4 Privacidade / Termos / Exclusão de dados
**Hoje temos:** páginas legais de compliance (Meta/Google): `privacy`, `terms`, `data-deletion` / `exclusao-de-dados`.
**Precisa:** layout de documento, largura de leitura ~720px, body-lg, índice lateral. Sóbrio, dentro do brandkit.

---

## 5. Estados obrigatórios em toda tela
Para cada tela, entregar: **vazio** (sem dados, com CTA), **carregando** (skeletons glass com shimmer emerald sutil), **erro** (card danger com retry), **sem permissão** (mensagem elegante, não 403 cru) e **responsivo** (reflow 1 coluna em mobile, margens 16px, header sticky).

---

## 6. Regras para NÃO perder funcionalidade (obrigatório)
1. **Paridade total:** toda ação, filtro, coluna, status, campo e modal listado em "Hoje temos" deve existir na nova interface. Redesenhar ≠ remover.
2. **Mesmos contratos de API:** o front novo consome exatamente as mesmas rotas do Apêndice A (mesmos payloads). Só a camada de apresentação muda.
3. **Mesmos papéis e permissões:** respeitar `master/operador/visualizador/cliente/gestor_resultado`, `nav-permissions` (visibilidade por página) e o catálogo de permissões granulares.
4. **Dois fluxos de auth** preservados: Supabase Auth + JWT de plataforma.
5. **White-label:** tokens de tema sobrescrevíveis por tenant/domínio continuam funcionando.
6. **Se algo não tiver tela mapeada**, sinalizar — não descartar.

---

## Apêndice A — Inventário de rotas (checklist de cobertura)

Cada grupo abaixo precisa estar coberto por alguma tela da nova interface.

- **Auth:** `auth/login` · `auth/logout` · `auth/register` · `auth/session` · `auth/preview` · `auth/facebook/*`
- **Perfil/permissões:** `me` · `users` · `users/[id]` · `roles` · `roles/users` · `permissions` · `nav-permissions`
- **Clientes:** `clients/accesses` · `clients/accesses/logs` · `clients/password-spaces` · `clients/[id]/archive` · `clients/[id]/balance-alert` · `clients/[id]/notes(/[noteId])`
- **Onboarding/Offboarding:** `client-onboarding` · `onboarding-tasks/definitions` · `client-offboarding`
- **Operação:** `operation/cards` · `operation/action-plans` · `operation/action-space-settings` · `operation/weekly-spaces` · `operation/context` · `client-weekly`
- **Meta Ads:** `meta/adaccounts` · `meta/campaigns(-overview)` · `meta/ads-overview` · `meta/insights` · `meta/breakdowns` · `meta/campaign-daily` · `meta/structure` · `meta/account-balances` · `meta/creative-preview` · `meta/creative-thumbnail` · `meta/connection` · `meta/auth/*` · `meta/warm` · `cpr-benchmarks`
- **Google Ads:** `google-ads/adaccounts` · `google-ads/summary` · `google-ads/connection` · `google-ads/auth/*`
- **Google Calendar:** `google-calendar/calendars` · `google-calendar/events(/[id])` · `google-calendar/connection` · `google-calendar/auth/*`
- **Google Sheets:** `google-sheets/leads-analytics` · `google-sheets/summary` · `google-sheets/tabs`
- **CRMs:** `rd/pipelines` · `rd/summary` · `saas/agendor/pipelines` · `clickup/summary` · `monday/summary`
- **Tarefas:** `tasks(/[id])` · `tasks/[id]/checklist` · `tasks/[id]/comments` · `tasks/comments` · `tasks/archived` · `tasks/custom-fields(/values)` · `tasks/recurring` · `tasks/spaces(/members)` · `tasks/statuses` · `tasks/status-templates` · `tasks/views` · `tasks/preferences` · `task-templates` · `task-views` · `recurring-tasks` · `automations(/runs)` · `cron/automations` · `gr-tasks(/definitions)`
- **Social/Editorial:** `editorial` · `editorial/[postId]`
- **PAC:** `pac/training-types(/[id])` · `pac/trainings(/[id])` · `pac/trainings/[id]/notes(/[noteId])`
- **Relatórios:** `reports` · `reports/[id]` · `reports/manual(/[id])`
- **Notificações/versão:** `notifications` · `notes` · `version` · `dashboard/state`
- **White-label / SaaS:** `saas/ai/chat` · `saas/ai/settings` · `saas/client-context` · `saas/client-sources` · `saas/clients(/[id])` · `saas/dashboard-layout` · `saas/theme` · `saas/integrations` · `saas/sync` · `saas/meta/*` · `saas/google-ads/*` · `saas/google-drive/*` · `workspace/branding`
- **Platform/Admin:** `platform/home` · `platform/executive` · `platform/clients(/[id])` · `platform/tasks(/[id])` · `admin/workspaces`
- **Webhooks:** `webhooks/balance-alerts`
