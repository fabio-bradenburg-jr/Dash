-- Comentários de tarefas: suporte a edição/exclusão (colunas usadas pela API de menções)
alter table public.task_comments add column if not exists is_deleted boolean not null default false;
alter table public.task_comments add column if not exists edited_at timestamptz;
create index if not exists task_comments_task_idx on public.task_comments (task_id, created_at);
create index if not exists task_activity_log_task_idx on public.task_activity_log (task_id, created_at desc);

-- Modelos de tarefas (containers com tarefa principal + subtarefas)
create table if not exists public.workspace_task_models (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  id text not null,
  name text not null,
  color text not null default '#26c281',
  items jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, id)
);
alter table public.workspace_task_models enable row level security;
