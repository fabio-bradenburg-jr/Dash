# Prompt final — pronto pra colar no Claude Design (aba Clientes)

> Cole **tudo abaixo da linha** de uma vez. Para outra aba, troque apenas a seção **② TELA** pelo bloco correspondente em `PROMPTS_POR_ABA.md`.
> **Alvo visual (anexar o print):** piloto navegável em https://claude.ai/code/artifact/3efa7e6a-7e19-474b-a1f9-ea6c8c619406

---

Você é o designer de front-end de uma nova interface para o **Assessoria LP Dashboard**, um hub de performance para uma agência de marketing. Vou te dar (①) o sistema visual fixo, (②) a tela específica com as funcionalidades que **precisam ser mantidas** e (③) o que entregar. Redesenhe a interface **sem remover nenhuma funcionalidade** — só muda a pele (visual/UX). Use como **referência visual o print/artifact anexado** (é exatamente a linguagem esperada).

## ① SISTEMA VISUAL — Kinetic Emerald (fixo, aplicar em tudo)

Corporativo moderno + glassmorphism sobre grafite profundo (chiaroscuro). Emerald só como destaque ("kinetic highlight"), nunca decorativo. Dark-first com light mode.

**Cores:** fundo `#131313` / `#0e0e0e` / abissal `#0A0A0A`; painel `#111113`; sidebar `rgba(8,8,10,0.96)`; accent `#26C281`; primary claro `#4fdf9b`; texto `#E8E6E4`; texto secundário `rgba(232,230,228,0.66)`; muted `rgba(232,230,228,0.40)`; card glass `rgba(28,28,28,0.4)` + `backdrop-filter: blur(12px)`; borda `rgba(255,255,255,0.06)`; borda identidade `rgba(38,194,129,0.12–0.40)`. **Cores semânticas (separadas do accent):** com-resultado `#3ba3ff`, saudável `#22c55e`, atenção `#f59e0b`, crítico `#ef4444`, integração `#8b5cf6`, churn `#7b8794`.

**Nuvem radial (assinatura da marca):** `radial-gradient(ellipse 100% 55% at 55% -10%, rgba(38,194,129,0.13) 0%, transparent 62%)` nos headers; intensidade menor em cards (0.07–0.12) e shells (0.06).

**Tipografia:** Plus Jakarta Sans (títulos/body) + Inter (labels/dados em UPPERCASE, `letter-spacing 0.09–0.14em`). Título de seção peso 800–900 `clamp(1.5rem,2.6vw,1.95rem)`; kicker `0.62rem`/700/uppercase/emerald; número de stat `1.7rem`/800/`tabular-nums`.

**Curvas:** modal 22–24px · hero/painel 18px · card/stat 12–14px · avatar/ícone 10–11px · input/chip 9–10px · botão/badge pill 9999px · progress 6px.

**Elevação:** fundo com radial emerald 5% → card glass + blur 12px + borda 1px branco 6% → hover mais claro ou emerald glow `0 0 30px rgba(38,194,129,0.1)`. Accent-border `3px solid #26C281` no topo de blocos primários.

**Componentes:** botão primário = pill emerald, texto `#00301c`, hover 90%+`translateY(-1px)`; botão ghost = pill transparente borda branco; ícones (Boxicons/Material Symbols) em container circular emerald 10%; chips = label uppercase pill (ativo = fundo emerald 14% + borda 40% + texto `#4fdf9b`); hero = gradiente `135deg rgba(38,194,129,0.06→0.01)` + nuvem radial no canto + borda inferior emerald.

**Layout:** shell com sidebar de navegação por grupos + área principal; bento 12 col, container 1440px, gutter 20px; tabela densa (header uppercase `0.64rem` opacity 0.4, linha com hover `rgba(255,255,255,0.028)`). Responsivo: mobile some a sidebar e colunas secundárias, reflow 1 coluna, margens 16px, header sticky.

**Estados obrigatórios em toda tela:** vazio (com CTA) · carregando (skeleton glass + shimmer emerald) · erro (card danger + retry) · sem permissão (elegante) · responsivo.

## ② TELA — Clientes

**Objetivo:** cadastrar e gerir clientes, organizar grupos e definir quem enxerga cada dashboard. É a **tela de referência** do produto — a linguagem dela deve servir de base para todas as outras.
**Usuários:** master e operador (edição). Papéis sem permissão veem em modo leitura.

**Funcionalidades que PRECISAM ser mantidas:**
- **Busca** por cliente, responsável ou segmento.
- **Chips de filtro por saúde** com contadores: Todos, Crítico, Atenção, Saudável, Com resultado, Integração, Churn.
- **Faixa de stat cards** de resumo (total, com resultado, atenção, crítico, integração) com cor semântica.
- **Diretório/tabela de clientes**, cada linha com: avatar 40×40 (iniciais), nome + segmento, **gestor de tráfego** (avatar + nome), **tipo** (chip: PDV / Inside Sales / Ecom), **badge de saúde** (com glow na cor semântica), **status de integração** (dot verde/vermelho: conectado/desconectado), botão de editar.
- **Modal de edição completo** (abre ao clicar na linha ou em "Novo cliente") com blocos:
  - **Dados do cliente** (nome, segmento, tipo, grupo).
  - **Links** (contrato, dashboard, drive, EAP, manual de marca, moodboard, narrativa de vendas, draw flow).
  - **Responsáveis** (gestor de projetos, gestor de tráfego, designer, CS/atendimento).
  - **Flags de saúde** (toggle Ok/Risco): ROI acima da meta, CSAT ≥4, NPS ≥7, stakeholder consciente, contas de anúncio ativas, CRM em uso, participação >90%.
- **Grupos de clientes** e **ACL** (quem enxerga cada cliente). **Arquivar cliente.**
- A **saúde é derivada** das flags semanais + status (Com resultado/Saudável/Atenção/Crítico/Integração/Churn) — mantenha essa lógica de classificação e cor.

## ③ ENTREGAR
Layout responsivo dark + light da tela Clientes seguindo ① e mantendo tudo de ②; o modal de edição; os cinco estados obrigatórios; e componentes reutilizáveis (hero de seção, stat card, chip de filtro, linha de tabela com avatar, badge de saúde, modal com header emerald) que sirvam de base para as demais telas do produto.
