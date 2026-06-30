# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Next.js dev server (webpack mode) at http://localhost:3000
npm run build      # Production build (webpack mode)
npm run lint       # Run ESLint
```

There are no automated tests. Validate changes by running the dev server and exercising the feature in the browser.

## Architecture Overview

This is a **Next.js 16 App Router** dashboard called "Assessoria LP Dashboard" (project name: `nype-dashboard`). The app serves as an internal tool for a marketing agency — managing clients, Meta Ads integrations, Google Ads, editorial calendars, task management, AI assistants, and reporting.

### Data stores

| Store | Role |
|---|---|
| **Supabase (Postgres)** | Primary data store. Schema in `supabase_schema.sql`. Tables include `workspaces`, `profiles`, `workspace_clients`, `workspace_meta_connections`, `assistant_conversations`, `assistant_messages`, `user_client_access`, `user_client_group_access`, and more. |
| **SQLite (`data/nype.sqlite`)** | Local fallback for dashboard preferences and client records. Used via Node's built-in `node:sqlite` module in `src/lib/server/dashboard-db.js`. Path overridable with `SQLITE_PATH` env var. |

Two Supabase clients are used:
- `src/lib/supabase/client.js` — browser client
- `src/lib/supabase/server.js` — server client (RSC / route handlers)
- `src/lib/server/supabase-admin.js` — service-role admin client (bypasses RLS)

### Auth & access control

The app supports **two parallel auth flows**:

1. **Supabase Auth** — standard OAuth / email sessions. `UserContext.tsx` picks this up via `supabase.auth.getSession()` and calls `/api/me` to load the profile and access context.
2. **Platform JWT cookie** (`PLATFORM_AUTH_COOKIE`) — a custom JWT issued for platform/SaaS users. `resolveAuthContext()` in `src/lib/server/auth-context.js` handles both flows in route handlers.

Access control logic lives in `src/lib/server/access-control.js`. The key exported function is `getAccessContext(supabase, user, { adminSupabase })`, which returns:

```js
{
  role,              // 'master' | 'operador' | 'visualizador' | 'cliente' | 'gestor_resultado'
  workspaceId,
  canManageUsers,
  canManageClients,
  canEditIntegrations,
  canViewDashboard,
  canUseAi,
  isClientRole,
  viewableClientIds, // per-user ACL for non-master roles
  editableClientIds,
}
```

Every API route handler should call `resolveAuthContext()` (from `src/lib/server/auth-context.js`) rather than rolling its own auth check.

### Route structure

Pages are under `src/app/`. Most feature pages render the `DashboardShell.js` component which contains the sidebar navigation and tab rendering logic. The slug route `src/app/[slug]/page.js` handles white-label workspace domains by resolving the workspace from the host via `src/lib/server/domain-config.ts`.

API routes are under `src/app/api/` and mix `.js` and `.ts` files. Key groups:
- `/api/meta/*` — Meta Ads integration (campaigns, insights, balances, auth OAuth flow)
- `/api/google-ads/*`, `/api/google-calendar/*`, `/api/google-sheets/*` — Google integrations
- `/api/clients/*` — workspace client management
- `/api/tasks/*` — internal task management
- `/api/ai/*` — AI assistant conversations and dashboard insights
- `/api/saas/*` — white-label SaaS tenant APIs
- `/api/platform/*` — platform-level client/task management
- `/api/auth/*` — login, logout, register, session, Facebook/Meta OAuth
- `/api/cron/*` — automation triggers (called on schedule)

### Meta Ads integration

`src/lib/server/meta-fetch.js` is the central wrapper for all Meta API calls. It includes:
- In-memory response cache (`META_RESPONSE_CACHE`) and deduplication of in-flight requests
- Automatic cache write-back to Supabase (`meta_api_cache` table) via `next/server`'s `after()`
- Token invalidation detection and error classification

### SaaS / white-label layer

`src/app/saas/` and `src/components/saas/` implement a white-label dashboard mode. `src/lib/saas/` contains the type definitions, API helpers, auth, and theme presets for this layer. The `/saas` route permanently redirects to `/` (see `next.config.mjs`).

### AI service (Python)

`apps/ai-service/` is a standalone FastAPI microservice (`app/main.py`) exposing `/analyze-client` for client risk/churn analysis. It is not wired into the Next.js build — run it separately.

### Frontend component layers

- `src/components/dashboard/` — main dashboard components (used by all internal users)
- `src/components/saas/` — white-label SaaS panels
- `src/components/ui/` — shadcn/ui primitives (badge, button, card)

`UserContext.tsx` (`src/lib/contexts/`) is the global auth+profile context, accessed via `useUser()`.

### Design system — Brandkit obrigatório

**IMPORTANTE:** Todo trabalho de front-end DEVE seguir o brandkit **Kinetic Emerald** definido em [`Brandkit/DESIGN.md`](Brandkit/DESIGN.md). Leia esse arquivo antes de criar ou alterar qualquer componente, página ou estilo.

Regras inegociáveis do brandkit:

#### Cores
- Background principal: `#131313` / `#0e0e0e`
- Accent / primary brand: `#26C281` (emerald) — usar estrategicamente em CTAs, destaques e "kinetic highlights"
- Primary token (mais brilhante): `#4fdf9b`
- Tipografia primária: `#E5E2E1` (on-surface)
- Cards (glass): `rgba(28, 28, 28, 0.4)` com `backdrop-filter: blur(12px)`
- Borda padrão: `rgba(255,255,255,0.05)` (1px)
- Emerald glow (hover/active): `box-shadow: 0 0 30px rgba(38,194,129,0.1)`
- Status: erro `#FF4B4B`, aviso `#FFB800`

#### Tipografia
- Headlines / body: **Plus Jakarta Sans**
- Labels e metadados UI: **Inter** (uppercase com `letter-spacing: 0.05em` / `0.1em`)
- Escalas: display-lg 48px → headline-lg 32px → headline-md 24px → body-lg 18px → body-md 16px → label-md 14px → label-sm 10px

#### Layout
- Grid: 12 colunas bento, gutter 20px, max-width 1440px
- Padding container: 16px (sm) / 24px (md)
- Gap entre seções: 96px

#### Elevation (layering)
1. **Level 0 — Background:** `#0A0A0A` com gradiente radial emerald a 5% de opacidade
2. **Level 1 — Cards:** glass-morphic `rgba(28,28,28,0.4)` + `blur(12px)` + borda 1px white 5%
3. **Level 2 — Hover/Active:** superfície mais clara ou emerald glow

#### Shapes
- Containers / cards: `border-radius: 1rem` (16px)
- Botões e tags interativas: `border-radius: 9999px` (pill)
- Accent border em blocos primários: `3px solid #26C281` no topo

#### Componentes
- **Botão primário:** pill, fundo `#26C281`, texto `#003821`, hover 80% opacity
- **Botão ghost/secondary:** pill, transparente, borda 1px white 10%
- **Cards (bento boxes):** glass-card com `backdrop-filter`, `border-white-low`, accent-border opcional
- **Ícones:** Material Symbols Outlined em containers circulares com fundo emerald 10% opacity
- **Inputs / Chips:** fundo escuro semi-transparente, borda fina; chips em `label-sm` uppercase

Além do brandkit, `DESIGN_SYSTEM.md` documenta classes CSS reutilizáveis do projeto (`.management-hero`, `.management-stat-card`, `.glass-panel`, `.management-header-row`) — use-as quando aplicável.

### Environment variables

See `.env.example`. Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` — signs platform auth cookies
- `NEXT_PUBLIC_APP_URL`

Optional (integration-specific):
- `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- `GOOGLE_DRIVE_CLIENT_ID/SECRET/REDIRECT_URI`
- `GOOGLE_CALENDAR_CLIENT_ID/SECRET/REDIRECT_URI`
