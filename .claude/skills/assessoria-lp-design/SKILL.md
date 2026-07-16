---
name: assessoria-lp-design
description: >-
  Aplica a identidade visual da Assessoria LP (design system "Kinetic Emerald":
  cores, tipografia, formas, vidro/elevação e componentes) em qualquer tela,
  componente ou material criado para o app/empresa. Use sempre que o pedido for
  criar, redesenhar ou ajustar o visual de algo "para a Assessoria LP", "no nosso
  padrão", "com a nossa identidade", ou quando o contexto for uma nova
  tela/aba/componente interno do dashboard.
---

# Assessoria LP — Design System (Kinetic Emerald)

Ao criar ou ajustar qualquer front-end deste app, siga o brandkit abaixo. As
fontes canônicas no repositório são:

- **`Brandkit/DESIGN.md`** — brandkit completo + referência da tela Clientes.
- **`DESIGN_SYSTEM.md`** — classes CSS reutilizáveis (`.management-hero`,
  `.management-stat-card`, `.glass-panel`, `.management-header-row`, `.btn-primary`,
  `.btn-secondary`).

Leia esses arquivos antes de começar; eles têm precedência sobre este resumo.

## Cores
- Background: `#131313` / `#0e0e0e` (camadas profundas `#0a0a0a`).
- Accent / primary: `#26C281` (emerald). Token brilhante: `#4fdf9b`.
- Botão primário: fundo `#26C281`, texto `#04150d`/`#003821`.
- Tipografia on-surface: `#E5E2E1` (secundária ~72%, terciária ~45%).
- Cards glass: `rgba(28,28,28,0.4–0.55)` + `backdrop-filter: blur(12px)`.
- Borda padrão: `1px solid rgba(255,255,255,0.06)`.
- Emerald glow: `box-shadow: 0 8px 24px rgba(38,194,129,0.28)`.
- Paleta categórica/status: verde `#22c55e`, azul `#3ba3ff`, índigo `#6366f1`,
  roxo `#8b5cf6`, rosa `#ec4899`, âmbar `#f59e0b` (aviso), vermelho `#ef4444`/`#FF4B4B` (erro).

## Tipografia
- Headlines / números: **Plus Jakarta Sans** (400–800), tracking `-0.02em` em títulos.
- Labels / kickers / chips: **Inter**, UPPERCASE, `letter-spacing` 0.08–0.14em.
- Ícones: **Boxicons** (`<i className="bx bx-...">`) dentro de componentes;
  **Material Symbols Outlined** (`<span className="mi">`) na navegação do shell.
  Coloque ícones em containers arredondados com fundo do acento a ~12–16%.

## Formas
- Cards / painéis (bento): `border-radius: 14–18px`.
- Botões e tags interativas: `border-radius: 9999px` (pill).
- Controles (inputs/selects): `8–12px`. Chips/células pequenas: `5–7px`.
- Blocos primários: `border-top: 3px solid #26C281`.

## Layout & elevação
- Grid bento 12 col, max-width `1440px`, container centralizado.
- Hero: `border-top: 3px solid #26C281`, fundo
  `linear-gradient(135deg, rgba(38,194,129,0.08), rgba(38,194,129,0.01))`,
  decoração radial emerald no canto, kicker Inter UPPERCASE emerald com ícone.
- Reutilize componentes/padrões existentes (Funil, Clientes, Rotinas,
  Comunicação) em vez de inventar novos; mantenha responsividade (tabelas largas
  em `overflow-x: auto`).

## Regra de ouro
Toda tela interna deve parecer parte do mesmo sistema: fundo escuro, cards glass,
accent emerald usado com estratégia (CTAs, destaques, status), tipografia Plus
Jakarta Sans + Inter, e ícones em containers com fundo do acento.
