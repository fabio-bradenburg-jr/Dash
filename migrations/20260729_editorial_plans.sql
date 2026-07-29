-- Planejamentos editoriais (Social Media): persiste o "pacote" de planejamento
-- no banco para que possa ser aberto em qualquer dispositivo. Antes ficava
-- apenas no localStorage do navegador.
--
-- Contexto: o app acessa via service-role (rotas /api), que ignora RLS.
-- RLS ligado sem policies => deny por padrão; só o service-role acessa.

create table if not exists public.editorial_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  label text not null default '',
  month int,
  year int,
  items jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists editorial_plans_workspace_idx
  on public.editorial_plans (workspace_id, created_at desc);

alter table public.editorial_plans enable row level security;
