# Redesign Brief — Assessoria LP Dashboard (Kinetic Emerald)

> Documento de handoff para o **Claude Design** remodelar cada tela da plataforma.
> Cada seção traz: **objetivo**, **quem usa**, **o que a tela precisa entregar** e **direção visual específica**.
> A direção visual global (cores, tipografia, curvas, elevação) está no topo e vale para **todas** as telas — não repita, apenas siga.

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
> "Você está redesenhando telas do 'Assessoria LP Dashboard', um hub de performance para agência de marketing. Aplique rigorosamente o design system **Kinetic Emerald** descrito acima (grafite `#131313`, accent emerald `#26C281`, glassmorphism, Plus Jakarta Sans + Inter, cantos 16px em cards e pill em botões, nuvem radial emerald nos headers). Dark-first com light mode. Layout bento 12 colunas, container 1440px, gutter 20px. Priorize densidade informacional legível, hierarquia por contraste e emerald só onde importa. Entregue: layout responsivo, estados (vazio/carregando/erro), e componentes reutilizáveis."

---

## 1. Mapa de telas (sitemap)

**Geral:** Home · Controle da Operação · Configurações
**Sucesso do Cliente:** Clientes (Dados = referência) · Onboarding · Offboarding · Acessos
**Performance:** Dash (Pitch Deck) · Campanhas · Anúncios · Saldos · Relatórios · Planilha de Leads · Funil · Tarefas
**Social Media:** Painel · Calendário Editorial · Planejamentos
**PAC:** Painel · Calendário · Tipos
**Admin / Master:** Usuários · Funções e Permissões · Permissões de Páginas · **Centro de Controle Master (novo)**
**Conta:** **Página de Usuário / Perfil (novo)**
**Institucional / público:** Login · Integração (landing) · Contexto · Produtos · Apresentação de cliente · Privacidade / Termos / Exclusão de dados

Papéis: `master` · `operador` · `visualizador` · `cliente` · `gestor_resultado`.

---

## 2. Prompts por tela

### 2.1 Home (Geral)
**Objetivo:** ponto de entrada pós-login — resume o estado da operação e leva rápido às seções.
**Quem usa:** todos os papéis internos (conteúdo varia por permissão).
**Precisa entregar:** saudação contextual; grid bento de "cards de atalho" (Clientes, Time, Dash, Pitch Deck) com métrica-resumo em cada; bloco de pendências/alertas do dia; feed de atividade recente.
**Visual:** hero com nuvem radial emerald e kicker; cards bento glass com número emerald e microcopy em label uppercase; estado vazio ("nada pendente") elegante, não cinza morto.

### 2.2 Controle da Operação (Weekly Command Center)
**Objetivo:** central semanal — status de cada cliente por semana, o que foi preenchido e o que falta.
**Quem usa:** master, operador, gestor_resultado.
**Precisa entregar:** seletor de período (semana atual/passada/custom/mês); grade de clientes × flags de saúde (entregáveis, financeiro, ROI, health score, CRM, CS, CSAT, NPS, participação, contas ativas); chips de filtro por status (Crítico/Atenção/Saudável/Com resultado/Churn); indicador de preenchimento por semana.
**Visual:** tabela densa padrão "aba Dados" (header uppercase 0.68rem opacity 0.35, linhas com hover `rgba(255,255,255,0.025)`); flags como chips de estado (verde/âmbar/vermelho) com barra de topo colorida; stat cards de resumo no topo.

### 2.3 Configurações (Synthesizer)
**Objetivo:** ajustar integrações, credenciais globais e preferências da plataforma.
**Quem usa:** master (edição); demais leem.
**Precisa entregar:** blocos de integração (Meta, Google Ads, Calendar, Sheets, Drive, ClickUp) com status conectado/desconectado, botões OAuth e teste de conexão; preferências de tema (dark/light), branding white-label, tokens; seção de credenciais mascaradas.
**Visual:** usar `.integration-block` + `.integration-heading` + `.integration-icon`; cada integração é um card glass com ícone circular emerald, badge de status pill e CTA. Header "Synthesizer" com kicker.

### 2.4 Clientes (referência oficial — aba Dados)
**Objetivo:** cadastrar/gerir clientes, grupos, e quem enxerga cada dashboard.
**Quem usa:** master, operador.
**Precisa entregar:** barra de busca + chips de filtro; grid de stat cards (total, ativos, integração, churn); tabela/diretório de clientes com avatar 40×40, colunas (nome, responsáveis, tipo, saúde, integração); **modal de edição** completo (dados, links do cliente — contrato/dashboard/drive/EAP/manual de marca/moodboard, responsáveis — gestor de projetos/tráfego/designer/CS, flags de saúde).
**Visual:** ESTA é a fonte de verdade — manter exatamente. Modal com header gradiente emerald, blocos de integração, avatar circular. Ao redesenhar, refine sem quebrar a linguagem.

### 2.5 Onboarding
**Objetivo:** acompanhar a implementação de novos clientes por trilha (Setup, Inside Sales, Ecom, PDV, Ongoing).
**Quem usa:** master, operador.
**Precisa entregar:** por cliente, checklist/etapas com progresso; filtro por trilha; stat cards de "em onboarding / atrasados / concluídos"; visão de responsável e prazo.
**Visual:** cards de progresso com barra 6px; badges de trilha em chips uppercase; estados de atraso em âmbar/vermelho (card de estado com barra de topo).

### 2.6 Offboarding
**Objetivo:** conduzir saída de cliente (checklist de encerramento, motivo de churn, retomada de acessos).
**Quem usa:** master, operador.
**Precisa entregar:** motivo/categoria de churn; checklist de desligamento (revogar acessos, encerrar contratos, exportar dados); timeline do processo; registro de aprendizado.
**Visual:** tom mais sóbrio; usar cards de estado "danger/warning"; timeline vertical com marcadores emerald.

### 2.7 Acessos
**Objetivo:** gerir quem (usuário) enxerga quais clientes/grupos — ACL por usuário.
**Quem usa:** master.
**Precisa entregar:** matriz usuário × cliente/grupo com toggles; busca; adição rápida de acesso; visão por grupo de clientes.
**Visual:** toggles pill verdes; matriz com header sticky; chips de grupo. Reaproveitar `QuickAddAccessModal`.

### 2.8 Dash / Pitch Deck (Apresentação)
**Objetivo:** leitura executiva de resultados de um cliente — "modo apresentação" para reunião.
**Quem usa:** operador, gestor_resultado, cliente (visualização).
**Precisa entregar:** seletor de cliente + período; hero com KPIs grandes (spend, leads, CPL, ROAS, conversões); gráficos de tendência; blocos de destaque narrativo; visual "impressionar em reunião".
**Visual:** `.hero-panel` + `.hero-stat`; números gigantes emerald; gráficos com paleta consistente (seguir skill dataviz); pouca poluição, muito respiro (section-gap 96px). Deve funcionar em tela cheia/projetor.

### 2.9 Campanhas (Performance — Meta/Google)
**Objetivo:** visão de campanhas ativas e métricas por campanha.
**Quem usa:** operador, gestor_resultado.
**Precisa entregar:** tabela de campanhas com métricas (spend, impressões, alcance, cliques, CTR, CPC, CPM, conversões, CPA, ROAS, frequência); filtro de período (hoje/ontem/7d/30d/mês); seletor de conta de anúncio; toggle de status (ativar/pausar).
**Visual:** `.ads-overview-hero`; tabela densa com colunas numéricas alinhadas à direita; métrica destacada em emerald; chips de plataforma (Meta/Google/TikTok/LinkedIn) com ícone.

### 2.10 Anúncios
**Objetivo:** granularidade a nível de anúncio/criativo com preview.
**Quem usa:** operador.
**Precisa entregar:** grid de criativos com thumbnail, métricas por anúncio, hook rate/thruplay/video views; comparação; preview do criativo.
**Visual:** cards de criativo (thumbnail arredondado 12px, overlay de métricas emerald ao hover); grid bento; badge de formato.

### 2.11 Saldos
**Objetivo:** monitorar saldo/verba das contas de anúncio.
**Quem usa:** master, operador.
**Precisa entregar:** cards por conta com saldo atual, gasto no período, projeção de esgotamento, alerta de saldo baixo; histórico de recargas.
**Visual:** `.ad-balance-hero`; card de estado (danger quando saldo crítico) com barra de topo; número de saldo grande.

### 2.12 Relatórios (manual + automático)
**Objetivo:** gerar/consultar relatórios de performance (semanal/mensal/ciclo) para clientes.
**Quem usa:** operador, gestor_resultado.
**Precisa entregar:** montador de relatório manual (blocos, período, comentários); templates por frequência (semanal/quinzenal/mensal/trimestral/anual/ciclo); exportação/compartilhamento; histórico.
**Visual:** editor em duas colunas (blocos à esquerda, preview à direita); preview segue estética Pitch Deck; botões de export pill.

### 2.13 Planilha de Leads
**Objetivo:** consolidar cadastros/leads com custo por cadastro ao longo do tempo.
**Quem usa:** operador, gestor_resultado.
**Precisa entregar:** tabela de leads (origem, data, status, valor); gráfico de evolução de cadastros × CPL; filtros por período e origem; import/export.
**Visual:** tabela densa + gráfico de linha (dataviz skill, cor emerald para série principal); stat cards de total/CPL médio.

### 2.14 Funil
**Objetivo:** visualizar funil de conversão (Leads → CPL → SQL → vendas).
**Quem usa:** operador, gestor_resultado, cliente.
**Precisa entregar:** funil visual por etapa com taxas de conversão entre estágios; construtor de etapas (funnel-builder); comparação de período.
**Visual:** funil em blocos empilhados com largura proporcional; percentuais de conversão em chips emerald; transições suaves.

### 2.15 Tarefas
**Objetivo:** gestão de tarefas internas por cliente.
**Quem usa:** todos internos.
**Precisa entregar:** 3 modos de visão — **Kanban** (colunas por status: aberto/em andamento/bloqueado/concluído), **Tabela**, **Tickets**; prioridade (sem/baixa/média/alta/urgente); responsável, prazo, cliente; campos customizados; arquivo de tarefas.
**Visual:** Kanban com colunas glass, cards de tarefa com badge de prioridade (cores de estado), avatar de responsável; drag-and-drop com emerald glow no destino; chip de prioridade urgente em vermelho.

### 2.16 Social Media — Painel
**Objetivo:** visão-resumo da operação de conteúdo (o que foi publicado, o que vem).
**Quem usa:** operador (social), gestor_resultado.
**Precisa entregar:** stat cards (posts do mês, aprovados, pendentes, publicados); próximas publicações; status de aprovação por cliente.
**Visual:** `.editorial-header`; cards de status com badges; mini-calendário-resumo.

### 2.17 Social Media — Calendário Editorial
**Objetivo:** planejar e agendar conteúdo em calendário.
**Quem usa:** operador (social).
**Precisa entregar:** calendário mensal/semanal com posts por dia; card de post (formato, legenda, mídia, status de aprovação); fluxo de aprovação; filtro por cliente/canal.
**Visual:** grade de calendário glass; posts como chips coloridos por status; modal de post com preview de mídia e header emerald.

### 2.18 Social Media — Planejamentos
**Objetivo:** planejamento estratégico de conteúdo (temas, campanhas, linhas editoriais).
**Quem usa:** operador (social), gestor_resultado.
**Precisa entregar:** documentos/planos por cliente e período; pilares de conteúdo; metas; anexos.
**Visual:** cards de plano tipo documento; editor rico com estética iOS Notes (`.ios-notes-shell` já existe em Notas).

### 2.19 PAC — Painel / Calendário / Tipos
**Objetivo:** Programa de Aceleração — acompanhamento contínuo com encontros mensais.
**Quem usa:** master, gestor_resultado.
**Precisa entregar:**
- **Painel:** status de cada cliente no programa, próximos encontros, pendências.
- **Calendário:** agendamento de encontros/ciclos (`.pac-card`).
- **Tipos:** configuração dos tipos de encontro/ciclo.
**Visual:** `.pac-card`; timeline de ciclos; cards de encontro com data grande e responsável.

### 2.20 Usuários (Admin)
**Objetivo:** gerir pessoas do time — criar, editar, definir papel, carteira, PDI e metas.
**Quem usa:** master; usuário vê a própria versão (PDI/metas/clientes).
**Precisa entregar:** lista/diretório de usuários com avatar, papel (badge), status; modal de usuário (dados, papel, clientes ligados, PDI, metas); busca e filtro por papel.
**Visual:** `.management-hero`; tabela padrão Dados; badge de papel colorido; modal com header emerald.

### 2.21 Funções e Permissões
**Objetivo:** definir papéis e o que cada um pode fazer.
**Quem usa:** master.
**Precisa entregar:** lista de papéis com matriz de capacidades (gerir usuários/clientes, editar integrações, ver dashboard, usar IA); editor de papel.
**Visual:** matriz de toggles; cada papel um card; ícone de escudo emerald.

### 2.22 Permissões de Páginas
**Objetivo:** conceder/revogar acesso de cada usuário a cada página, por grupo.
**Quem usa:** master.
**Precisa entregar:** seletor de usuário (chips); grupos (Sucesso do Cliente, Performance, Social Media, PAC, Geral) com toggle por página; "selecionar/desselecionar tudo".
**Visual:** já existe base — refinar: chips de usuário, grid de toggles pill verdes por grupo, header com ícone de escudo.

---

## 3. Telas NOVAS (direção do que precisamos)

### 3.1 Página de Usuário / Perfil (self-service)
**Por que:** hoje o usuário não tem um espaço próprio de conta. Precisamos de uma página onde **cada colaborador** gerencie a si mesmo.
**Deve conter:**
- **Cabeçalho de identidade:** avatar (upload), nome, papel (badge), e-mail, desde quando na equipe.
- **Conta & segurança:** trocar senha, sessões ativas, 2FA (futuro), preferências de notificação.
- **Preferências:** tema (dark/light), idioma, densidade da UI.
- **Meu escopo:** clientes/grupos que enxergo (somente leitura para não-master).
- **Meu desenvolvimento (para papéis internos):** PDI, metas do ciclo com progresso, carteira de clientes, histórico de resultados.
- **Integrações pessoais:** conexões OAuth vinculadas à minha conta (Google, Meta) com status e "desconectar".
**Direção visual:** hero de perfil com nuvem radial emerald + avatar circular grande (borda emerald); layout em 2 colunas (identidade/preferências à esquerda, desenvolvimento/escopo à direita) em bento; metas como stat cards com barra de progresso 6px; toggles pill; blocos de segurança com ícone circular emerald. Reutilizar `.management-hero`, `.management-stat-card`, `.integration-block`.

### 3.2 Centro de Controle Master
**Por que:** o master precisa de **um cockpit único** de governança da plataforma, hoje espalhado entre Usuários, Permissões e Configurações.
**Deve conter:**
- **Saúde da plataforma:** nº de workspaces, usuários ativos, clientes, integrações conectadas vs. com erro, uso de IA — em stat cards no topo.
- **Governança de acesso:** atalhos e visão consolidada de Usuários + Funções + Permissões de Páginas (tudo em um lugar, com busca global de "quem tem acesso a quê").
- **Integrações globais:** status de cada conector (Meta/Google/ClickUp) em nível de plataforma, tokens expirando, botão de reautenticar.
- **Auditoria & atividade:** log de ações sensíveis (mudança de papel, revogação de acesso, edição de credencial) com filtro por usuário/período.
- **Configuração white-label:** domínios, branding, tema por workspace (ponte para o layer SaaS).
- **Automação / Cron:** status dos jobs (`/api/cron`), última execução, próximos disparos, disparo manual.
- **Ações destrutivas** protegidas (confirmação dupla): suspender usuário, revogar todos os acessos de alguém, resetar integração.
**Direção visual:** dashboard bento denso mas respirável; topo com faixa de stat cards (nuvem radial 0.12); cards de estado (verde=ok, âmbar=token expirando, vermelho=integração quebrada) com barra de topo colorida; tabela de auditoria padrão Dados; ações destrutivas em botões ghost com borda vermelha e modal de confirmação header vermelho. Emerald para "tudo saudável", nunca para alerta. Deve transmitir **autoridade e controle** — é a tela mais "cockpit" do produto.

---

## 4. Telas institucionais / públicas

### 4.1 Login
**Objetivo:** autenticar (Supabase Auth OAuth/e-mail **e** JWT de plataforma).
**Precisa:** card central glass sobre fundo grafite com nuvem radial emerald; login por e-mail/senha + botão OAuth (Google/Meta); estados de erro inline; link recuperar senha; branding white-label dinâmico por domínio.
**Visual:** minimalista, um único card centralizado, logo no topo, CTA emerald pill, fundo com gradiente radial sutil.

### 4.2 Integração (landing institucional)
**Objetivo:** página de apresentação do método (Planejamento, Processos Comerciais, Potenciais Clientes, PAC, Prestação de Contas).
**Precisa:** hero de marca; grid de pilares com ícone circular emerald; seção de prova/resultados; CTA.
**Visual:** mais "marketing", full-width, seções com section-gap 96px, tipografia display 48px, emerald highlights.

### 4.3 Contexto / Produtos / Apresentação de cliente
- **Contexto:** base de conhecimento/briefing do cliente para IA (client-knowledge). Cards de contexto editáveis, tom documento.
- **Produtos:** catálogo de produtos/ofertas do cliente. Grid de cards de produto com preço/descrição.
- **Apresentação de cliente (`/clientes/[id]/apresentacao`):** versão pública/compartilhável do Pitch Deck — mesmo visual da 2.8, porém read-only e brandável.

### 4.4 Privacidade / Termos / Exclusão de dados
**Objetivo:** páginas legais (compliance Meta/Google).
**Precisa:** layout de documento legível, largura de leitura ~720px, tipografia body-lg, índice lateral. Visual sóbrio, ainda dentro do brandkit (fundo grafite, texto on-surface).

---

## 5. Estados obrigatórios em toda tela
Para cada tela, o Claude Design deve entregar: **vazio** (sem dados, com CTA), **carregando** (skeletons glass com shimmer emerald sutil), **erro** (card danger com retry), **sem permissão** (mensagem elegante, não 403 cru), e **responsivo** (reflow para 1 coluna em mobile, margens 16px, header sticky).
