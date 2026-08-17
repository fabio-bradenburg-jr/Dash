-- Análise de Clientes (aba "Sucesso do Cliente › Análise de Clientes"): registro
-- semanal de performance por cliente (Weekly - GR). Cada linha guarda a análise de
-- um cliente em uma semana específica (week_start), permitindo manter o histórico
-- semana a semana e comparar a evolução do CPL.
--
-- Espelha o padrão de `client_lead_quality_weeks`: o app acessa via service-role
-- (rotas /api), que ignora RLS. RLS ligado sem policies => deny por padrão; só o
-- service-role acessa.

create table if not exists public.client_weekly_analyses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text not null,
  week_start date not null,
  status text,               -- saudavel | atencao | critico | integracao | pausado | null
  resumo text not null default '',
  investimento numeric,
  leads integer,
  cpl numeric,               -- calculado no app (investimento / leads), persistido por conveniência
  planilha text not null default '',
  acao text not null default '',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, client_id, week_start)
);

create index if not exists idx_cwa_workspace_week
  on public.client_weekly_analyses (workspace_id, week_start);
create index if not exists idx_cwa_workspace_client
  on public.client_weekly_analyses (workspace_id, client_id);

alter table public.client_weekly_analyses enable row level security;
