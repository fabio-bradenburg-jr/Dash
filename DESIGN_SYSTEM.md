# Design System — Dash
## Fonte oficial: Aba Dados (Clientes → tab Dados)

> **REGRA INEGOCIÁVEL:** Antes de criar qualquer componente, verifique se já existe um equivalente na aba Dados. Reutilize sua estrutura, proporções e comportamento. Consistência acima de inovação.

A aba **Dados** (renderizada como `clientRegistryView === 'dados'` em `DashboardShell.js`, junto com o modal de edição de cliente em `isEditClientModalOpen`) é a fonte oficial de identidade visual. Toda nova tela ou componente deve seguir exatamente a linguagem visual observada ali.

---

## Tokens de Cor

```css
/* Backgrounds */
--bg-dark:        #050506
--bg-panel:       #111113
--shell-sidebar:  rgba(8,8,10,0.95)

/* Accent / Brand */
--saas-primary:   #26c281   /* Emerald — botões, borders, kickers, highlights */
--saas-accent:    #4fdf9b   /* Emerald claro — primary token */
--accent-rgb:     38,194,129

/* Texto */
--text-primary:   #f5f5f7
--text-secondary: rgba(245,245,247,0.72)
--text-muted:     rgba(245,245,247,0.44)

/* Bordas */
--border-color:      rgba(255,255,255,0.07)
--border-color-soft: rgba(255,255,255,0.04)   /* linhas de tabela / separadores */
--border-emerald:    rgba(38,194,129,0.12)     /* bordas com identidade */
--border-emerald-md: rgba(38,194,129,0.18)     /* inputs de busca */
--border-emerald-hi: rgba(38,194,129,0.40)     /* filtro ativo */

/* Radii */
--panel-radius:   20px
```

### Cores de estado
| Estado   | Cor principal | Fundo tintado          | Borda                   |
|----------|---------------|------------------------|-------------------------|
| Sucesso  | `#22c55e`     | `rgba(34,197,94,0.08)` | `rgba(34,197,94,0.25)`  |
| Atenção  | `#f59e0b`     | `rgba(245,158,11,0.08)`| `rgba(245,158,11,0.25)` |
| Perigo   | `#ef4444`     | `rgba(239,68,68,0.08)` | `rgba(239,68,68,0.25)`  |
| Info     | `#6366f1`     | `rgba(99,102,241,0.08)`| `rgba(99,102,241,0.2)`  |

---

## Hierarquia de Border Radius

| Elemento                       | Raio       |
|--------------------------------|------------|
| Modal / card principal         | `24px`     |
| Hero de seção / header         | `16–24px`  |
| Stat card / glass-panel        | `12–16px`  |
| Avatar / ícone de client       | `10px`     |
| Input / select / filtro chip   | `9–10px`   |
| Badge / chip / pill / botão    | `9999px`   |
| Barra de progresso             | `6px`      |

---

## Gradientes de Fundo

### Dashboard global (`.dashboard-container::before`)
```css
background:
  radial-gradient(ellipse 90% 55% at 55% -10%, rgba(38,194,129,0.13) 0%, transparent 65%),
  radial-gradient(circle at 18% 10%, rgba(255,255,255,0.025), transparent 22%),
  radial-gradient(circle at 84% 8%, rgba(255,255,255,0.018), transparent 18%),
  radial-gradient(circle at 55% 100%, rgba(255,255,255,0.03), transparent 30%);
```

### Sidebar
```css
background:
  radial-gradient(ellipse 160% 40% at 50% 0%, rgba(38,194,129,0.12) 0%, transparent 60%),
  radial-gradient(circle at top left, rgba(255,255,255,0.03), transparent 28%),
  linear-gradient(180deg, rgba(255,255,255,0.026), rgba(255,255,255,0)),
  var(--shell-sidebar);
```

---

## Padrão de Hero Header — Fonte: Aba Dados

Todo header de seção replica este padrão extraído da aba Dados:

```jsx
// Estrutura JSX padrão
<div style={{
  padding: '28px 28px 20px',
  borderBottom: '1px solid rgba(38,194,129,0.12)',
  background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)',
  position: 'relative',
  overflow: 'hidden',
}}>
  {/* Decoração radial no canto */}
  <div style={{
    position: 'absolute', top: -50, right: -50,
    width: 200, height: 200, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  }} />

  <span className="management-hero-kicker">
    <i className="bx bx-[icon]" style={{ marginRight: 5 }}></i>LABEL
  </span>
  <h2 style={{ margin: '6px 0 4px', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 900 }}>
    Título da seção
  </h2>
  <p style={{ opacity: 0.48, fontSize: '0.88rem', margin: 0 }}>
    Subtítulo descritivo.
  </p>
</div>
```

### CSS base (alternativa com classes)
```css
.section-hero {
  padding: 28px 28px 20px;
  border-bottom: 1px solid rgba(38,194,129,0.12);
  background: linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%);
  position: relative;
  overflow: hidden;
}
.section-hero::after {
  content: '';
  position: absolute;
  top: -50px; right: -50px;
  width: 200px; height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%);
  pointer-events: none;
}
```

### Classes prontas (globals.css)
- `.management-hero` — hero com gradiente emerald
- `.management-header-row` — header com título + botão de ação
- `.management-hero-kicker` — label kicker emerald uppercase

---

## Kicker (Label de Seção)

```css
.kicker {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--saas-primary);
  opacity: 0.85;
  margin-bottom: 6px;
}
```

---

## Cards de Estatística — Fonte: Aba Dados

```jsx
// Grid de stat cards (padrão Dados)
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 12,
  margin: '20px 0 4px',
}}>
  <div className="management-stat-card" style={{ gap: 6 }}>
    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.5 }}>
      <i className="bx bx-[icon]" style={{ color: '#26c281', fontSize: 13 }}></i>
      Label
    </span>
    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#26c281', lineHeight: 1 }}>
      {value}
    </span>
  </div>
</div>
```

```css
/* globals.css — já disponível */
.management-stat-card {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-secondary, rgba(23,25,35,0.8));
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.2s;
}
.management-stat-card:hover { border-color: rgba(255,255,255,0.1); }
.management-stat-card small  { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.45; }
.management-stat-card strong { font-size: 1.55rem; font-weight: 900; color: var(--saas-primary); line-height: 1; }
```

### Card com nuvem radial (padrão completo)
```css
.stat-card-full {
  background:
    radial-gradient(ellipse 140% 65% at 50% -10%, rgba(38,194,129,0.12) 0%, transparent 65%),
    rgba(255,255,255,0.03);
  border: 1px solid rgba(38,194,129,0.18);
  border-radius: 16px;
  padding: 18px 20px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.stat-card-full:hover {
  border-color: rgba(38,194,129,0.32);
  box-shadow: 0 8px 28px rgba(38,194,129,0.09);
}
```

---

## Barra de Filtros — Fonte: Aba Dados

```jsx
<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>

  {/* Input de busca */}
  <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
    <i className="bx bx-search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4, pointerEvents: 'none' }}></i>
    <input
      type="text"
      placeholder="Buscar..."
      style={{
        width: '100%',
        padding: '8px 12px 8px 42px',
        borderRadius: 10,
        border: '1px solid rgba(129,216,167,0.18)',
        background: 'rgba(255,255,255,0.05)',
        color: 'inherit',
        fontSize: '0.88rem',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    />
  </div>

  {/* Chips de filtro */}
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
    {filters.map((f) => (
      <button
        key={f.id}
        type="button"
        onClick={() => setFilter(f.id)}
        style={{
          padding: '7px 12px',
          borderRadius: 9,
          border: `1px solid ${active === f.id ? 'rgba(38,194,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
          background: active === f.id ? 'rgba(38,194,129,0.15)' : 'transparent',
          color: active === f.id ? '#26c281' : 'rgba(255,255,255,0.5)',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
      </button>
    ))}
  </div>
</div>
```

---

## Tabela de Dados — Fonte: Aba Dados

```jsx
{/* Header da tabela */}
<div style={{
  display: 'grid',
  gridTemplateColumns: '1fr 160px 160px 120px 130px', /* ajuste conforme colunas */
  gap: 12,
  padding: '12px 24px 8px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
}}>
  {['Coluna A', 'Coluna B', 'Coluna C'].map(h => (
    <span key={h} style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.35 }}>
      {h}
    </span>
  ))}
</div>

{/* Linha de tabela */}
<div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 160px 160px 120px 130px',
    gap: 12,
    padding: '14px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    alignItems: 'center',
    transition: 'background 0.15s',
  }}
  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
>
  {/* conteúdo das células */}
</div>
```

### Avatar / ícone de item
```jsx
<span style={{
  width: 40, height: 40, borderRadius: 10,
  background: 'rgba(38,194,129,0.12)',
  border: '1px solid rgba(38,194,129,0.25)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, overflow: 'hidden',
}}>
  <i className="bx bx-building-house" style={{ fontSize: 18, color: '#26c281', opacity: 0.8 }}></i>
</span>
```

---

## Modal de Cadastro / Edição — Fonte: Modal Dados

### Estrutura do header do modal
```jsx
<div className="modal-header" style={{
  background: 'linear-gradient(135deg, rgba(38,194,129,0.07) 0%, rgba(38,194,129,0.01) 100%)',
  borderBottom: '1px solid rgba(38,194,129,0.12)',
  padding: '20px 24px 16px',
  position: 'relative',
  overflow: 'hidden',
}}>
  <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 36 }}>
    {/* avatar */}
    <div>
      <span className="management-hero-kicker" style={{ fontSize: '0.68rem', marginBottom: 2 }}>
        <i className="bx bx-edit" style={{ marginRight: 4 }}></i>Editar item
      </span>
      <h3 style={{ margin: '2px 0 3px', fontSize: '1.1rem', fontWeight: 900 }}>Título</h3>
      <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.45 }}>Subtítulo descritivo.</p>
    </div>
  </div>
</div>
```

### Bloco de integração (seção dentro do form)
Usa `.integration-block` + `.integration-heading` + `.integration-icon` (classes já definidas em globals.css):
```jsx
<div className="integration-block">
  <div className="integration-heading">
    <div className="integration-icon" style={{ color: '#26c281', borderColor: 'rgba(38,194,129,0.2)' }}>
      <i className="bx bx-[icon]"></i>
    </div>
    <div>
      <h3>Título do bloco</h3>
      <p>Descrição breve.</p>
    </div>
  </div>
  <div className="input-group">
    <label>Campo</label>
    <input type="text" placeholder="..." />
  </div>
</div>
```

---

## Glass Panel

```css
.glass-panel {
  background: var(--bg-panel);           /* #111113 */
  border: 1px solid var(--border-color); /* rgba(255,255,255,0.07) */
  border-radius: var(--panel-radius);    /* 20px */
}
```

Com identidade emerald:
```css
.management-directory-card {
  border: 1px solid rgba(38,194,129,0.12) !important;
  background: linear-gradient(160deg, rgba(38,194,129,0.03) 0%, transparent 60%), var(--bg-panel) !important;
}
```

---

## Botões

```css
/* Primário */
.btn-primary {
  background: var(--saas-primary);   /* #26c281 */
  color: #003821;
  border-radius: 9999px;
  padding: 9px 18px;
  font-weight: 700;
  font-size: 0.88rem;
  border: none;
}
.btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }

/* Secundário / ghost */
.btn-secondary {
  background: rgba(255,255,255,0.06);
  color: var(--text-primary);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 9999px;
}
.btn-secondary:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.12); }
```

---

## Tipografia de Interface

| Elemento        | Tamanho             | Peso | Observação                            |
|-----------------|---------------------|------|---------------------------------------|
| Kicker          | `0.62rem`           | 700  | uppercase, `letter-spacing: 0.08em`   |
| Título hero     | `clamp(1.4rem,2.5vw,1.9rem)` | 900 | responsivo                  |
| Título modal    | `1.1rem`            | 900  |                                       |
| Subtítulo       | `0.80–0.88rem`      | 400  | `opacity: 0.45–0.48`                  |
| Header tabela   | `0.68rem`           | 700  | uppercase, `opacity: 0.35`            |
| Label stat      | `0.65rem`           | 700  | uppercase, `opacity: 0.45–0.50`       |
| Número stat     | `1.5–1.55rem`       | 900  | `color: var(--saas-primary)`          |
| Body / input    | `0.85–0.90rem`      | 400  |                                       |
| Chip filtro     | `0.78rem`           | 700  |                                       |

---

## Nuvem Radial — Receita

```css
/* Topo centralizado (headers de seção) */
radial-gradient(ellipse 100% 55% at 50% -10%, rgba(38,194,129,0.13) 0%, transparent 60%)

/* Topo esquerdo (hero cards) */
radial-gradient(ellipse 100% 55% at 15% -10%, rgba(38,194,129,0.13) 0%, transparent 60%)

/* Decoração de canto (div absoluta) */
position: absolute; top: -50px; right: -50px;
width: 200px; height: 200px; border-radius: 50%;
background: radial-gradient(circle, rgba(38,194,129,0.08) 0%, transparent 70%);
```

**Intensidades:**
- Headers principais: `0.13–0.14`
- Cards de stat: `0.10–0.12`
- Shells / painéis grandes: `0.06–0.08`

---

## Cards de Estado (danger / warning / success)

```css
.card.danger  { background: radial-gradient(ellipse 140% 65% at 50% -10%, rgba(239,68,68,0.18) 0%, transparent 65%), rgba(239,68,68,0.05); border-color: rgba(239,68,68,0.28); }
.card.warning { background: radial-gradient(ellipse 140% 65% at 50% -10%, rgba(245,158,11,0.18) 0%, transparent 65%), rgba(245,158,11,0.05); border-color: rgba(245,158,11,0.28); }
.card.success { background: radial-gradient(ellipse 140% 65% at 50% -10%, rgba(38,194,129,0.18) 0%, transparent 65%), rgba(38,194,129,0.05); border-color: rgba(38,194,129,0.28); }
/* Barra de cor no topo */
.card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
.card.danger::before  { background: rgba(248,113,113,0.9); }
.card.warning::before { background: rgba(245,158,11,0.9); }
.card.success::before { background: rgba(38,194,129,0.9); }
```

---

## Light Mode

```css
:root[data-ui-mode='light'] .section-hero {
  background: linear-gradient(135deg, rgba(38,194,129,0.05) 0%, rgba(255,255,255,0.97) 100%) !important;
  border-color: rgba(38,194,129,0.2) !important;
}
```

Regra geral: fundo branco/quase-branco, borda emerald levemente mais forte, gradiente escuro some.

---

## Inventário de Componentes Existentes (Não Recriar)

| Componente                   | Classe / local                              | Onde é usado              |
|------------------------------|---------------------------------------------|---------------------------|
| Hero header                  | `.management-hero`, `.management-header-row` | Clientes, Usuários        |
| Stat card                    | `.management-stat-card`                     | Clientes, Onboarding      |
| Kicker label                 | `.management-hero-kicker`                   | Global                    |
| Glass card                   | `.glass-panel`                              | Modais, cards             |
| Bloco de integração          | `.integration-block` + `.integration-heading` + `.integration-icon` | Modal Dados |
| Input group                  | `.input-group`                              | Formulários               |
| Botão primário               | `.btn.btn-primary`                          | Global                    |
| Botão secundário             | `.btn.btn-secondary`                        | Global                    |
| Chip de filtro               | inline style (padrão Dados)                 | Clientes, Campanhas       |
| Linha de tabela com hover    | inline style (padrão Dados)                 | Clientes                  |
| Avatar 40×40 borderRadius 10 | inline style (padrão Dados)                 | Clientes                  |
| Modal overlay                | `.modal-overlay` + `.modal-card`            | Global                    |

---

## Abas e Onde Cada Padrão Foi Aplicado

| Aba                   | Arquivo                          | Classe principal                      |
|-----------------------|----------------------------------|---------------------------------------|
| **Dados (referência)**| `DashboardShell.js` (clientes)   | inline + `.management-stat-card`      |
| Clientes              | `DashboardShell.js` + globals    | `.management-header-row`              |
| Usuários              | `DashboardShell.js` + globals    | `.management-hero`                    |
| Onboarding            | `DashboardShell.js`              | inline + `.management-stat-card`      |
| Controle da Operação  | `globals.css`                    | `.weekly-command-center`              |
| Campanhas / Anúncios  | `DashboardShell.js`              | `.ads-overview-hero`                  |
| Saldos                | `DashboardShell.js`              | `.ad-balance-hero`                    |
| Dash (cliente)        | `DashboardShell.js`              | `.hero-panel`, `.hero-stat`           |
| Social Media          | `EditorialCalendar.js`           | `.editorial-header`                   |
| PAC                   | `PACCalendar.js`                 | `.pac-card`                           |
| Configurações         | `settings/page.tsx`              | `.settings-block-hero`                |
| Notas                 | `ClientNotesPanel.js`            | `.ios-notes-shell`                    |
