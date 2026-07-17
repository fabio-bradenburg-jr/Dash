# Prompts por aba — Nova interface (Kinetic Emerald)

> **Objetivo:** construir uma **interface de front-end nova** mantendo **100% das funcionalidades atuais**. Só muda a pele (visual/UX); nenhuma feature pode ser removida.
> **Como usar:** cole o **BLOCO BASE** abaixo no início da conversa com o Claude Design; depois cole **um bloco de aba por vez**. Cada bloco é autossuficiente.
> **Fora de escopo:** a aba **Dash / Pitch Deck** (apresentação de resultados) — **não gerar**.

---

## ⬛ BLOCO BASE — colar sempre antes de qualquer aba

Você vai redesenhar telas do **Assessoria LP Dashboard**, um hub de performance para agência de marketing. Aplique **rigorosamente** o design system **Kinetic Emerald** e **preserve todas as funcionalidades** descritas em cada aba (redesenhar ≠ remover). Consuma as mesmas APIs (mesmos payloads), respeite os mesmos papéis/permissões e os dois fluxos de auth (Supabase Auth + JWT de plataforma).

**Estilo Kinetic Emerald:**
- Corporativo moderno + glassmorphism sobre grafite profundo (chiaroscuro). Emerald só como destaque ("kinetic highlight").
- **Cores:** fundo `#131313` / `#0A0A0A`; painel `#111113`; sidebar `rgba(8,8,10,0.95)`; accent `#26C281`; primary claro `#4fdf9b`; texto `#E5E2E1`; texto secundário `rgba(245,245,247,0.72)`; muted `rgba(245,245,247,0.44)`; card glass `rgba(28,28,28,0.4)` + `blur(12px)`; borda `rgba(255,255,255,0.05–0.07)`; borda identidade `rgba(38,194,129,0.12–0.40)`; estados sucesso `#22c55e` / atenção `#f59e0b` / perigo `#ef4444` / info `#6366f1`.
- **Nuvem radial (assinatura):** `radial-gradient(ellipse 100% 55% at 50% -10%, rgba(38,194,129,0.13) 0%, transparent 60%)` nos headers (0.13), stat cards (0.10–0.12), shells (0.06–0.08).
- **Tipografia:** Plus Jakarta Sans (headlines/body) + Inter (labels UPPERCASE, `letter-spacing 0.05–0.1em`). Título de seção 900 `clamp(1.4rem,2.5vw,1.9rem)`; kicker `0.62rem`/700/uppercase/emerald; número stat `1.5rem`/900/emerald.
- **Curvas:** modal 24px · hero 16–20px · card/stat 12–16px · avatar/ícone 10px · input/chip 9–10px · botão/badge pill 9999px · progress 6px.
- **Elevação:** fundo `#0A0A0A`+radial 5% → card glass 40% + blur 12px + borda 1px branco 5% → hover mais claro ou emerald glow `0 0 30px rgba(38,194,129,0.1)`. Accent-border `3px solid #26C281` no topo de blocos primários.
- **Componentes:** botão primário = pill emerald, texto `#003821`, hover 80%+`translateY(-1px)`; botão ghost = pill transparente borda branco 10%; ícones Boxicons/Material em container circular emerald 10%; chips = label-sm uppercase pill; hero de seção = gradiente `135deg rgba(38,194,129,0.07→0.01)`, borda inferior emerald 12%, decoração radial no canto.
- **Dark-first com light mode.** Layout bento 12 col, container 1440px, gutter 20px, section-gap 96px, margens mobile 16px, header sticky.
- **Referência canônica:** replicar a linguagem da aba **Clientes → Dados** (tabela densa, hero, stat cards, modais). Consistência acima de inovação.

**Toda tela deve entregar os estados:** vazio (com CTA) · carregando (skeleton glass + shimmer emerald) · erro (card danger + retry) · sem permissão (elegante) · responsivo (reflow 1 coluna no mobile).

---

# GERAL

## ▸ PROMPT — Home
Redesenhe a tela **Home**, entrada pós-login que resume a operação e leva às seções.
**Usuários:** todos os papéis internos (conteúdo varia por permissão).
**Funcionalidades a manter:** cards de atalho condicionados por permissão (Clientes com contagem da base, Time/Usuários, etc.); saudação contextual; **sino de notificações** com eventos da plataforma.
**Layout:** grid bento de atalhos, cada card com métrica-resumo e microcopy em label uppercase; bloco de pendências/alertas do dia; feed de atividade recente; central de notificações.
**Visual:** hero com nuvem radial emerald + kicker; cards glass com número emerald; estado vazio elegante.

## ▸ PROMPT — Controle da Operação (Weekly Command Center)
Redesenhe a **central semanal** de status de clientes.
**Usuários:** master, operador, gestor_resultado.
**Funcionalidades a manter:** seletor de período (todo o período / semana atual / passada / personalizada / mês); grade de clientes com as **11 flags de saúde** (entregáveis, financeiro, ROI, health score manual, CRM em uso, CS atendimento, CSAT ≥4, participação >90%, contas de anúncio ativas, NPS ≥7, stakeholder pagador consciente) em Ok/Atenção/Risco/N-A; **classificação automática** (Crítico/Atenção/Saudável/Com resultado/Integração/Churn/Sem dados) com cor e glow; chips de filtro por status; indicador de preenchimento por semana; **Planos de Ação por cliente** (tarefas, responsável, prazo); **espaços/colunas semanais configuráveis** e contexto da operação.
**Layout:** tabela densa (padrão Dados) + faixa de stat cards de resumo por classificação no topo + preenchimento rápido semana a semana + gestor de planos de ação.
**Visual:** header tabela uppercase 0.68rem opacity 0.35, hover `rgba(255,255,255,0.025)`; flags como chips de estado; cada classificação com seu glow.

## ▸ PROMPT — Rotinas
Redesenhe a tela de **rotinas semanais recorrentes por função**.
**Usuários:** operador, gestor_resultado, master.
**Funcionalidades a manter:** grade Segunda→Sexta (Sáb/Dom opcionais) de tarefas-rotina por papel; templates de rotina por função (reunião de alinhamento, revisão de KPIs, acompanhamento de campanhas…); marcação de concluído; atribuição por papel/pessoa.
**Layout:** quadro semanal com colunas por dia (glass), cards de rotina com check emerald e chip de papel.

## ▸ PROMPT — Configurações (Synthesizer)
Redesenhe a tela de **integrações, credenciais e preferências**.
**Usuários:** master edita; demais leem.
**Funcionalidades a manter:** conectores **Meta Ads, Google Ads, Google Calendar, Google Sheets, Google Drive, ClickUp, Monday, RD Station, Agendor** com fluxo OAuth e status de conexão; teste de conexão; preferências de tema (dark/light); branding white-label/tokens; credenciais mascaradas.
**Layout:** blocos de integração (cada um card glass com ícone circular emerald, badge de status pill e CTA conectar/reautenticar); seção de preferências e branding.
**Visual:** header "Synthesizer" com kicker; padrão `.integration-block`.

## ▸ PROMPT — Notas por cliente
Redesenhe o **bloco de notas por cliente**, estilo iOS Notes.
**Usuários:** operador, gestor_resultado, master.
**Funcionalidades a manter:** CRUD de notas por cliente; busca; timestamps; anexos.
**Layout:** duas colunas (lista à esquerda, editor à direita), estética iOS Notes dentro do brandkit escuro, acento emerald sutil.

---

# SUCESSO DO CLIENTE

## ▸ PROMPT — Clientes (referência canônica — aba Dados)
Redesenhe a tela de **cadastro e gestão de clientes**. **Esta é a referência de identidade** — refine sem quebrar a linguagem.
**Usuários:** master, operador.
**Funcionalidades a manter:** busca + chips de filtro; stat cards; diretório com avatar 40×40; **modal de edição completo** com: dados; tipo (Inside Sales / Ecom / PDV); **links** (contrato, dashboard, drive, EAP, manual de marca, moodboard, narrativa de vendas, draw flow); **responsáveis** (gestor de projetos, gestor de tráfego, designer, CS); **flags de saúde**; grupos de clientes; **ACL por usuário e por grupo**; arquivamento de cliente.
**Layout:** diretório/tabela densa + modal com header gradiente emerald, blocos de integração e avatar circular.

## ▸ PROMPT — Onboarding
Redesenhe o **acompanhamento de implementação** de novos clientes.
**Usuários:** master, operador.
**Funcionalidades a manter:** trilhas Setup / Inside Sales / Ecom / PDV / Ongoing; checklist de tarefas por trilha com progresso; responsável e prazo; visão de atrasados/concluídos; stat cards de resumo.
**Layout:** cards de progresso (barra 6px), badges de trilha em chips uppercase, atraso em âmbar/vermelho (card de estado com barra de topo).

## ▸ PROMPT — Offboarding
Redesenhe o **fluxo de saída de cliente**.
**Usuários:** master, operador.
**Funcionalidades a manter:** motivo/categoria de churn; checklist de desligamento (revogar acessos, encerrar contratos, exportar dados); timeline do processo; aprendizado registrado.
**Layout:** tom sóbrio; cards de estado danger/warning; timeline vertical com marcadores emerald.

## ▸ PROMPT — Acessos
Redesenhe o **cofre de acessos, materiais e itens operacionais** do cliente.
**Usuários:** master, operador.
**Funcionalidades a manter:** categorias de **acesso** (Redes Sociais, Google, Site, CRM, Personalizado), **operacionais** (Localização, WhatsApp Business) e **materiais** (Documento, Link Importante, Planilha); armazenamento de login/senha; **status por item** (Ativo, Pendente, Em revisão, Desatualizado, Sem acesso, Precisa atualizar, Com problema); adição rápida; logs de acesso.
**Layout:** grupos por categoria (ícone colorido por tipo); item com badge de status; campo de senha com mostrar/ocultar/copiar; busca; chips de tipo.

---

# PERFORMANCE
> **Nota:** a aba **Dash / Pitch Deck** está **fora de escopo** — não gerar.

## ▸ PROMPT — Campanhas
Redesenhe a tela de **campanhas por cliente** com métricas.
**Usuários:** operador, gestor_resultado.
**Funcionalidades a manter:** **árvore Meta + Google** (campanha → conjunto → anúncio) em modo lista/tree; busca por cliente/campanha/conjunto/anúncio; período (hoje/ontem/7d/30d/mês); toggle ativar/pausar; **25+ métricas** (spend, impressões, alcance, cliques, LPV, add to cart, initiate checkout, CPC, CPM, frequência, CTR, conversões, taxa de conversão, valor de compra, compras, leads, mensagens, video views, video view rate, thruplay, hook rate, CPA, ROAS); **breakdowns** demográficos/posicionamento; **série diária**; **benchmarks de CPR/custo**.
**Layout:** tabela/árvore densa com colunas configuráveis; colunas numéricas à direita; métrica-destaque emerald; chips de plataforma (Meta/Google/TikTok/LinkedIn).

## ▸ PROMPT — Anúncios
Redesenhe a visão **por anúncio/criativo**.
**Usuários:** operador.
**Funcionalidades a manter:** preview e thumbnail de criativo; métricas por anúncio (hook rate, thruplay, video views); comparação.
**Layout:** grid bento de cards de criativo (thumbnail 12px, overlay de métricas emerald no hover, badge de formato).

## ▸ PROMPT — Saldos
Redesenhe o **monitor de saldo das contas de anúncio**.
**Usuários:** master, operador.
**Funcionalidades a manter:** saldo por conta; busca por cliente/conta/cartão; **alerta de saldo automático** por cliente (config de limite + webhook); gasto no período.
**Layout:** cards por conta com saldo grande emerald, gasto no período, projeção de esgotamento, config de alerta, histórico de recargas; card danger quando saldo crítico (barra de topo).

## ▸ PROMPT — Relatórios
Redesenhe o **gerador de relatórios** de performance.
**Usuários:** operador, gestor_resultado.
**Funcionalidades a manter:** **montador manual** com blocos (contexto, KPIs Meta Ads, tabela de campanhas, CRM manual, funil, observações); **preview em tema claro idêntico ao PDF**; frequências semanal/quinzenal/mensal/trimestral/quadrimestral/anual/ciclo; histórico; export/compartilhar.
**Layout:** editor 2 colunas (blocos à esquerda, preview à direita); templates por frequência; botões de export pill. Preview = versão light (PDF).

## ▸ PROMPT — Planilha de Leads
Redesenhe o **consolidado de leads** com qualificação e custo.
**Usuários:** operador, gestor_resultado.
**Funcionalidades a manter:** tabela de leads com **qualificação** (Qualificado, Convertido/venda, Perdido, Sem resposta, Outros); **gráfico de pizza** da distribuição; **evolução de cadastros × CPL** no tempo; filtros por período/origem; import/export (Google Sheets).
**Layout:** tabela densa + gráficos (série principal emerald, paleta distinta na pizza) + stat cards (total, CPL médio, taxa de conversão).

## ▸ PROMPT — Funil
Redesenhe o **funil de conversão** fim a fim.
**Usuários:** operador, gestor_resultado, cliente.
**Funcionalidades a manter:** estágios de **fontes Meta** (impressões, cliques, leads) + **fontes PGL/CRM** (público-alvo, qualificados, convertidos); taxas de conversão entre estágios; **construtor de funil** (definição de etapas/fontes); comparação de período.
**Layout:** blocos empilhados de largura proporcional; % de conversão em chips emerald; cor por estágio.

## ▸ PROMPT — Tarefas
Redesenhe a **gestão de tarefas** interna.
**Usuários:** todos internos (com permissões granulares de tarefas).
**Funcionalidades a manter:** visões **Kanban / Tabela / Tickets**; **prioridades** (Urgente/Alta/Média/Baixa/Sem); **subtarefas, checklists, tarefas recorrentes, automações, templates de tarefa, status templates, campos customizados, comentários, anexos, espaços/spaces com ícones, arquivo de tarefas**; atribuição múltipla; gerenciadores de coluna/status/automação.
**Layout:** Kanban glass com colunas por status; cards com badge de prioridade (cores de estado) e avatar; drag-and-drop com emerald glow no destino; urgente em vermelho. Manter as 3 visões e todos os gerenciadores.

## ▸ PROMPT — IA Orbit (assistente)
Redesenhe o **assistente de IA** da operação.
**Usuários:** papéis com permissão de IA.
**Funcionalidades a manter:** chat "IA Orbit" que responde sobre campanhas, CRM, criativos, clientes e **arquivos vinculados**; histórico de conversas; base de conhecimento do cliente; anexos; streaming.
**Layout:** chat glass; bolha do assistente à esquerda com ícone emerald, do usuário à direita; input pill "Pergunte sobre campanhas, CRM, criativos…"; contexto de cliente em chip; citações de fonte.

---

# COMERCIAL

## ▸ PROMPT — Processo Comercial
Redesenhe/implemente a tela **Comercial → Processo Comercial**, que acompanha o avanço do processo comercial de cada cliente (script, CRM e auditorias).
**Usuários:** master, gestor_resultado, comercial.
**Estrutura da tabela (uma linha por cliente):**
- **Cliente** (nome, vindo do cadastro principal).
- **Script** — status `Implementado` / `Não implementado` / `Não se aplica` + **Data** de implementação.
- **CRM** — status `Implementado` / `Não implementado` / `Não se aplica` / `Outro CRM` + **Data**.
- **Auditorias** — `1ª Auditoria` (e demais) com status `Não realizada` / `Realizada` + **Data**; permitir adicionar novas auditorias.
- **Progresso (%)** — barra calculada a partir das etapas concluídas (0% inicial).
- **Observações** por cliente.
**Layout/visual:** tabela densa no padrão **Clientes → Dados** (hero com kicker, stat cards de resumo, chips de filtro); status como chips de estado (verde = implementado/realizada, âmbar = pendente, muted = não se aplica); barra de progresso emerald; datas em label uppercase.

### Sincronização automática com o cadastro de clientes
A página Comercial → Processo Comercial deve estar totalmente vinculada ao **cadastro principal de clientes**.

**Cliente novo** — sempre que um novo cliente for criado no aplicativo:
- Ele deve ser adicionado automaticamente ao Processo Comercial;
- Não pode ser necessário cadastrá-lo novamente;
- Não devem existir clientes duplicados;
- Ele deve entrar inicialmente na lista de clientes ativos;
- Os campos devem começar com os status padrão definidos;
- O registro deve manter o mesmo **ID** do cadastro principal do cliente.

Status iniciais:
- Script: “Não implementado”;
- CRM: “Não implementado”;
- Auditorias: nenhuma auditoria criada;
- Progresso inicial: 0%.

**Cliente arquivado** — quando um cliente for arquivado no cadastro principal:
- Ele **não** deve ser excluído do Processo Comercial;
- Todo o histórico de scripts, CRM, auditorias, datas e observações deve ser preservado;
- O cliente deve sair da lista principal de ativos;
- Ele deve ser movido automaticamente para uma seção chamada **“Arquivados”**, localizada no final da página.

A seção “Arquivados” deve aparecer como uma **linha expansível** no final da tabela: `Arquivados (quantidade de clientes)`. Ao clicar, expande e mostra os clientes arquivados, mantendo a mesma estrutura de colunas da tabela principal.
Os clientes arquivados devem:
- Aparecer com um visual mais discreto;
- Ter identificação clara de “Arquivado”;
- Permanecer disponíveis para consulta;
- Manter todo o histórico;
- Não entrar nos indicadores principais do dashboard por padrão;
- Poder ser incluídos no dashboard por meio de um filtro;
- Não gerar alertas de pendência ou auditoria atrasada enquanto estiverem arquivados.

**Cliente reativado** — caso um cliente arquivado seja reativado no cadastro principal:
- Ele deve voltar automaticamente para a lista de clientes ativos;
- Sair da seção “Arquivados”;
- Manter todos os dados e históricos anteriores;
- Voltar a ser considerado nos indicadores e alertas;
- Não deve ser criado um novo registro.

**Regras de sincronização:**
- O cadastro principal de clientes é a **fonte oficial** dos dados;
- A sincronização deve acontecer automaticamente;
- Alterações no nome do cliente devem ser refletidas no Processo Comercial;
- O vínculo deve utilizar o **ID único** do cliente, e não apenas o nome;
- A página não deve manter uma lista separada ou desconectada;
- A exclusão definitiva de um cliente não deve apagar seu histórico comercial sem uma confirmação específica;
- Ao carregar a página, verificar se existem clientes ativos ainda não vinculados e adicioná-los automaticamente;
- Clientes arquivados devem sempre permanecer agrupados no final da tabela, nunca misturados aos ativos.

---

# SOCIAL MEDIA

## ▸ PROMPT — Social · Painel
Redesenhe o **resumo da operação de conteúdo**.
**Usuários:** operador (social), gestor_resultado.
**Funcionalidades a manter:** resumo de posts por status; próximas publicações; status de aprovação por cliente.
**Layout:** stat cards (posts do mês, aprovados, pendentes, publicados) + mini-calendário-resumo + cards de status com badges.

## ▸ PROMPT — Social · Calendário Editorial
Redesenhe o **calendário editorial**.
**Usuários:** operador (social).
**Funcionalidades a manter:** posts com **status** (Pendente, Agendado, Publicado, Cancelado); **canais** (Instagram, Facebook, LinkedIn, TikTok, YouTube, X/Twitter); data/hora de agendamento; título, descrição, cliente, mídia; fluxo de aprovação; filtro por cliente/canal.
**Layout:** grade de calendário mês/semana (glass); posts como chips coloridos por status; modal de post com preview de mídia e header emerald.

## ▸ PROMPT — Social · Planejamentos
Redesenhe o **planejamento estratégico de conteúdo**.
**Usuários:** operador (social), gestor_resultado.
**Funcionalidades a manter:** planos por cliente e período; pilares de conteúdo; metas; anexos; notas estilo iOS.
**Layout:** cards de plano tipo documento; editor rico com estética iOS Notes.

---

# PAC (Programa de Aceleração)

## ▸ PROMPT — PAC (Painel · Calendário · Tipos)
Redesenhe o módulo **PAC** de encontros/treinamentos.
**Usuários:** master, gestor_resultado.
**Funcionalidades a manter:** treinamentos com **status** (Agendado, Realizado, Cancelado); **formatos** (Livro, Vídeo, Áudio, Apresentação, Grupo, Certificação, Desktop, Online); tipos configuráveis; notas por encontro. Sub-telas: **Painel** (status por cliente, próximos encontros, pendências), **Calendário** (agendamento de encontros/ciclos), **Tipos** (config de tipos).
**Layout:** `.pac-card`; timeline de ciclos; cards de encontro com data grande, formato e responsável.

---

# CRM & FONTES DE DADOS

## ▸ PROMPT — Fontes de CRM & dados
Redesenhe a área de **fontes de CRM e dados externos**.
**Usuários:** operador, gestor_resultado.
**Funcionalidades a manter:** **RD Station** (pipelines + resumo); **Agendor** (pipelines); **Google Sheets** (leads-analytics, abas); resumos **ClickUp** e **Monday**; status de conexão por fonte.
**Layout:** cards de integração glass com logo/ícone da fonte, badge de status, mini-tabelas de pipeline/estágios, mapeamento de colunas de planilha, deep-link para a fonte.

## ▸ PROMPT — Calendário (Google Calendar)
Redesenhe a **agenda integrada ao Google Calendar**.
**Usuários:** operador, gestor_resultado.
**Funcionalidades a manter:** listar calendários e eventos; CRUD de evento; seletor de calendário; sincronização.
**Layout:** grade mês/semana/dia (glass); eventos como chips; header emerald; estado "conectar Google" quando sem integração.

---

# ADMIN / MASTER

## ▸ PROMPT — Usuários
Redesenhe a **gestão de pessoas do time**.
**Usuários:** master (gestão); cada usuário vê a própria versão.
**Funcionalidades a manter:** CRUD de usuários; papel (badge); **PDI, metas e carteira de clientes** por colaborador; rotinas por papel; busca e filtro por papel.
**Layout:** diretório com avatar; modal (dados, papel, clientes ligados, PDI, metas); tabela padrão Dados; header emerald.

## ▸ PROMPT — Funções e Permissões
Redesenhe o **editor de papéis e capacidades**.
**Usuários:** master.
**Funcionalidades a manter:** catálogo de **permissões granulares** (ex.: `dashboard.view/edit/export`, `tasks.spaces.create/edit/delete`, `tasks.create/edit/delete`, `tasks.templates`, `tasks.automations`, …) por papel; editor de papel.
**Layout:** matriz de toggles; cada papel um card; ícone de escudo emerald.

## ▸ PROMPT — Permissões de Páginas
Redesenhe o **controle de acesso por página**.
**Usuários:** master.
**Funcionalidades a manter:** seletor de usuário (chips); grupos (Sucesso do Cliente, Performance, Social Media, PAC, Geral) com toggle por página; "selecionar/desselecionar tudo".
**Layout:** chips de usuário + grid de toggles pill verdes por grupo + header com ícone de escudo.

## ▸ PROMPT — Centro de Controle Master (NOVO)
Crie um **cockpit único de governança** (hoje espalhado entre Usuários, Permissões e Configurações).
**Usuários:** master.
**Deve conter:** saúde da plataforma (workspaces, usuários ativos, clientes, integrações conectadas vs. com erro, uso de IA em stat cards); governança de acesso consolidada (Usuários + Funções + Permissões com busca "quem acessa o quê"); integrações globais (status, tokens expirando, reautenticar); auditoria (log de ações sensíveis com filtro por usuário/período); white-label (domínios, branding, tema por workspace); automação/cron (status dos jobs, última/próxima execução, disparo manual); ações destrutivas protegidas (suspender usuário, revogar todos os acessos, resetar integração — com confirmação dupla).
**Visual:** bento denso mas respirável; faixa de stat cards (nuvem 0.12); cards de estado (verde=ok, âmbar=token expirando, vermelho=integração quebrada); tabela de auditoria padrão Dados; ações destrutivas em botão ghost borda vermelha + modal header vermelho. Emerald só para "saudável". Transmitir autoridade e controle.

---

# CONTA

## ▸ PROMPT — Página de Usuário / Perfil (NOVO)
Crie a **página de conta self-service** do colaborador.
**Usuários:** qualquer usuário logado.
**Deve conter:** cabeçalho de identidade (avatar upload, nome, papel, e-mail, desde quando); conta & segurança (trocar senha, sessões ativas, 2FA futuro, preferências de notificação); preferências (tema dark/light, idioma, densidade); meu escopo (clientes/grupos que enxergo — read-only p/ não-master); meu desenvolvimento (PDI, metas do ciclo com progresso, carteira, histórico — reaproveitar o que já existe em Usuários); integrações pessoais (Google/Meta vinculadas, status, desconectar).
**Visual:** hero de perfil com nuvem radial emerald + avatar circular grande (borda emerald); 2 colunas bento; metas como stat cards com barra 6px; toggles pill; blocos de segurança com ícone circular emerald.

---

# WHITE-LABEL / PLATAFORMA

## ▸ PROMPT — Camada White-label / SaaS
Redesenhe o **dashboard white-label** para tenants externos (domínio e tema próprios).
**Usuários:** cliente/tenant SaaS, gestor.
**Funcionalidades a manter:** shell próprio; **layout de dashboard customizável** (arrastar-e-soltar); **painel de tema** (presets/branding por tenant); **construtor de funil**; base de conhecimento e **fontes por cliente**; **chat de IA** (com settings); conectores próprios (Meta com token manual, Google Ads, Google Drive files); sincronização; resolução de tenant por domínio.
**Visual:** Kinetic Emerald como **default**, com **tokens sobrescrevíveis por tenant** (accent, logo, fundo). Deixar explícito o que é fixo vs. customizável pelo tenant.

## ▸ PROMPT — Visão Executiva / Platform
Redesenhe a **camada executiva de plataforma** (JWT de plataforma).
**Usuários:** platform users, gestão.
**Funcionalidades a manter:** home executiva e visão executiva; gestão de clientes e tarefas em nível de plataforma; admin de workspaces.
**Layout:** dashboard executivo com KPIs agregados entre clientes/workspaces; ranking/comparativo; drill-down por cliente. Tom "board room", números grandes emerald.

---

# INSTITUCIONAL / PÚBLICO

## ▸ PROMPT — Login (e Registro)
Redesenhe a tela de **autenticação**.
**Funcionalidades a manter:** dois fluxos — **Supabase Auth** (OAuth/e-mail) e **JWT de plataforma**; OAuth Google/Meta; recuperar senha; **registro** (espelho do login); branding white-label por domínio.
**Layout:** card central glass sobre grafite com nuvem radial emerald; logo dinâmico; erros inline; CTA emerald pill.

## ▸ PROMPT — Integração (landing institucional)
Redesenhe a **landing do método**.
**Funcionalidades a manter:** pilares Planejamento Estratégico, Processos Comerciais, Potenciais Clientes, PAC, Prestação de Contas; prova/resultados; CTA.
**Layout:** full-width "marketing"; hero de marca; grid de pilares com ícone circular emerald; section-gap 96px; display 48px; emerald highlights.

## ▸ PROMPT — Contexto / Produtos
Redesenhe as telas de **contexto do cliente** (base de conhecimento p/ IA — cards editáveis, tom documento) e **produtos** (catálogo com grid de cards de produto: nome, preço, descrição).

## ▸ PROMPT — Legais (Privacidade / Termos / Exclusão de dados)
Redesenhe as **páginas legais** de compliance (Meta/Google).
**Layout:** documento legível, largura ~720px, body-lg, índice lateral; sóbrio, dentro do brandkit.

---

## ✅ Checklist final (rodar após o redesenho)
Toda rota de API tem uma tela? (ver Apêndice A do `REDESIGN_BRIEF.md`). Toda funcionalidade de "Funcionalidades a manter" está presente? Papéis/permissões respeitados? Dois fluxos de auth funcionando? White-label temável? Estados (vazio/carregando/erro/sem permissão/responsivo) em todas as telas?
