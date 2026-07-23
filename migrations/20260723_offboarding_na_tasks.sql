-- Offboarding passa a suportar tarefas "Não se aplica" (N/A), como o onboarding.
-- Seguro para rodar mais de uma vez (idempotente).
alter table public.client_offboarding_checklists
  add column if not exists na_tasks jsonb not null default '[]'::jsonb;
