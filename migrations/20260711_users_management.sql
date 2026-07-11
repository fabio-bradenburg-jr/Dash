-- Users management upgrade: novos papéis, status, presets de permissão e log de atividade.
-- Seguro para rodar mais de uma vez (idempotente).

-- 1) Novos papéis: admin e analista (mantém os existentes).
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('master', 'admin', 'operador', 'analista', 'gestor_resultado', 'visualizador', 'cliente'));

-- 2) Status do usuário: ativo / inativo / convidado.
alter table public.profiles
  add column if not exists status text not null default 'active'
  check (status in ('active', 'inactive', 'invited'));

-- 3) Predefinições de permissão (conjuntos de módulos aplicáveis com um clique).
create table if not exists public.workspace_permission_presets (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  id text not null,
  name text not null,
  modules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, id)
);

-- 4) Log de atividade por usuário.
create table if not exists public.user_activity_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid,
  actor_id uuid,
  actor_name text,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_activity_log_user_idx
  on public.user_activity_log (workspace_id, user_id, created_at desc);
