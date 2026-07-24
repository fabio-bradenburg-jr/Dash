-- Endurecimento de segurança (RLS + policies + funções). Idempotente onde possível.
-- Contexto: o app acessa o banco via service-role (rotas /api), que ignora RLS;
-- o client do usuário lê apenas profiles/user_client_access/workspace_clients/etc.
-- (que já têm RLS+policies). Logo, trancar as demais tabelas não quebra o app.

-- 1) Liga RLS nas tabelas que estavam expostas ao papel público (anon/authenticated).
--    Sem policies => deny por padrão; só o service-role acessa.
alter table public.action_plans enable row level security;
alter table public.action_space_settings enable row level security;
alter table public.activity_logs enable row level security;
alter table public.automation_actions enable row level security;
alter table public.automation_conditions enable row level security;
alter table public.automation_queue enable row level security;
alter table public.automation_runs enable row level security;
alter table public.automation_triggers enable row level security;
alter table public.automations enable row level security;
alter table public.balance_alert_logs enable row level security;
alter table public.client_access_logs enable row level security;
alter table public.client_accesses enable row level security;
alter table public.client_notes enable row level security;
alter table public.client_password_spaces enable row level security;
alter table public.custom_field_values enable row level security;
alter table public.custom_fields enable row level security;
alter table public.editorial_posts enable row level security;
alter table public.notifications enable row level security;
alter table public.operation_cards enable row level security;
alter table public.operation_weeks enable row level security;
alter table public.permissions enable row level security;
alter table public.recurring_task_occurrences enable row level security;
alter table public.recurring_tasks enable row level security;
alter table public.role_permissions enable row level security;
alter table public.roles enable row level security;
alter table public.saved_reports enable row level security;
alter table public.space_members enable row level security;
alter table public.task_activity_log enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_mentions enable row level security;
alter table public.task_templates enable row level security;
alter table public.task_view_columns enable row level security;
alter table public.task_views enable row level security;
alter table public.task_watchers enable row level security;
alter table public.user_operation_context enable row level security;
alter table public.user_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_task_preferences enable row level security;
alter table public.weekly_action_spaces enable row level security;

-- 2) Remove policies "sempre true" (acesso irrestrito por qualquer authenticated/anon).
drop policy if exists "workspace members can manage manual_report_campaigns" on public.manual_report_campaigns;
drop policy if exists "workspace members can manage manual_reports" on public.manual_reports;
drop policy if exists "authenticated write items" on public.onboarding_task_items;
drop policy if exists "authenticated read items" on public.onboarding_task_items;
drop policy if exists "authenticated write phases" on public.onboarding_task_phases;
drop policy if exists "authenticated read phases" on public.onboarding_task_phases;
drop policy if exists "authenticated_task_checklist_items" on public.task_checklist_items;
drop policy if exists "authenticated_task_comments" on public.task_comments;
drop policy if exists "workspace members can manage task custom field values" on public.task_custom_field_values;
drop policy if exists "spaces_insert" on public.task_spaces;
drop policy if exists "spaces_update" on public.task_spaces;
drop policy if exists "items_all" on public.task_status_items;
drop policy if exists "templates_all" on public.task_status_templates;
drop policy if exists "authenticated_task_statuses" on public.task_statuses;
drop policy if exists "authenticated_tasks" on public.tasks;

-- 3) Fixa o search_path das funções de trigger (evita sequestro de search_path).
alter function public.set_dashboard_updated_at() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.update_onboarding_checklist_updated_at() set search_path = public;
alter function public.set_task_public_id() set search_path = public;

-- 4) Tira o EXECUTE do PUBLIC (inclui anon) das funções SECURITY DEFINER usadas no RLS,
--    mantendo em authenticated/service_role (necessário para avaliar RLS do usuário logado).
do $$
declare fn text;
begin
  foreach fn in array array[
    'public.current_profile_role()',
    'public.current_profile_workspace_id()',
    'public.is_client_manager()',
    'public.is_master_user()',
    'public.is_workspace_member(uuid)'
  ] loop
    execute format('revoke execute on function %s from public', fn);
    execute format('grant execute on function %s to authenticated, service_role', fn);
  end loop;
end $$;
