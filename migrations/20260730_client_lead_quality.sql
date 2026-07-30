-- Qualidade dos leads (aba "Geral › Qualidade dos Leads"): registro diário,
-- por cliente e por semana, indicando se os leads do dia foram de boa qualidade.
-- Espelha a estrutura de `client_communication_weeks` (mesma ideia da aba de
-- Comunicação): o app acessa via service-role (rotas /api), que ignora RLS.
-- RLS ligado sem policies => deny por padrão; só o service-role acessa.

create table if not exists public.client_lead_quality_weeks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id text not null,
  week_start date not null,
  days jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, client_id, week_start)
);

create index if not exists idx_clqw_workspace_week
  on public.client_lead_quality_weeks (workspace_id, week_start);
create index if not exists idx_clqw_workspace_client
  on public.client_lead_quality_weeks (workspace_id, client_id);

alter table public.client_lead_quality_weeks enable row level security;
