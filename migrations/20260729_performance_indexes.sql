-- Performance: cobre foreign keys sem índice e remove índice duplicado.
-- Origem: Supabase database linter (unindexed_foreign_keys, duplicate_index).
-- FKs sem índice de cobertura tornam JOINs e DELETEs (cascade) lentos conforme
-- a base cresce. Tabelas são pequenas hoje, então a criação é instantânea.

-- 1) Índices de cobertura para foreign keys.
create index if not exists idx_assistant_conversations_user_id on public.assistant_conversations (user_id);
create index if not exists idx_assistant_messages_user_id on public.assistant_messages (user_id);
create index if not exists idx_automation_actions_automation_id on public.automation_actions (automation_id);
create index if not exists idx_automation_conditions_automation_id on public.automation_conditions (automation_id);
create index if not exists idx_automation_queue_automation_id on public.automation_queue (automation_id);
create index if not exists idx_automation_queue_recurring_id on public.automation_queue (recurring_id);
create index if not exists idx_automation_triggers_automation_id on public.automation_triggers (automation_id);
create index if not exists idx_client_notes_parent_id on public.client_notes (parent_id);
create index if not exists idx_client_onboarding_checklists_created_by on public.client_onboarding_checklists (created_by);
create index if not exists idx_client_onboarding_checklists_updated_by on public.client_onboarding_checklists (updated_by);
create index if not exists idx_client_weekly_snapshots_created_by on public.client_weekly_snapshots (created_by);
create index if not exists idx_client_weekly_snapshots_updated_by on public.client_weekly_snapshots (updated_by);
create index if not exists idx_manual_report_campaigns_report_id on public.manual_report_campaigns (report_id);
create index if not exists idx_onboarding_task_items_phase_id on public.onboarding_task_items (phase_id);
create index if not exists idx_pac_training_notes_created_by on public.pac_training_notes (created_by);
create index if not exists idx_pac_trainings_created_by on public.pac_trainings (created_by);
create index if not exists idx_pac_trainings_training_type_id on public.pac_trainings (training_type_id);
create index if not exists idx_profiles_workspace_id on public.profiles (workspace_id);
create index if not exists idx_recurring_task_occurrences_task_id on public.recurring_task_occurrences (task_id);
create index if not exists idx_recurring_tasks_last_task_id on public.recurring_tasks (last_task_id);
create index if not exists idx_recurring_tasks_template_id on public.recurring_tasks (template_id);
create index if not exists idx_role_permissions_permission_id on public.role_permissions (permission_id);
create index if not exists idx_task_activity_log_actor_id on public.task_activity_log (actor_id);
create index if not exists idx_task_checklist_items_assignee_id on public.task_checklist_items (assignee_id);
create index if not exists idx_task_checklist_items_task_id on public.task_checklist_items (task_id);
create index if not exists idx_task_comments_parent_id on public.task_comments (parent_id);
create index if not exists idx_task_comments_user_id on public.task_comments (user_id);
create index if not exists idx_task_mentions_comment_id on public.task_mentions (comment_id);
create index if not exists idx_task_mentions_task_id on public.task_mentions (task_id);
create index if not exists idx_task_spaces_archived_by on public.task_spaces (archived_by);
create index if not exists idx_task_spaces_owner_id on public.task_spaces (owner_id);
create index if not exists idx_task_spaces_status_template_id on public.task_spaces (status_template_id);
create index if not exists idx_task_spaces_updated_by on public.task_spaces (updated_by);
create index if not exists idx_task_status_items_template_id on public.task_status_items (template_id);
create index if not exists idx_tasks_archived_by on public.tasks (archived_by);
create index if not exists idx_tasks_assignee_id on public.tasks (assignee_id);
create index if not exists idx_tasks_closed_by on public.tasks (closed_by);
create index if not exists idx_tasks_created_by on public.tasks (created_by);
create index if not exists idx_tasks_parent_task_id on public.tasks (parent_task_id);
create index if not exists idx_tasks_recurring_parent_id on public.tasks (recurring_parent_id);
create index if not exists idx_tasks_space_id on public.tasks (space_id);
create index if not exists idx_tasks_status_id on public.tasks (status_id);
create index if not exists idx_tasks_status_item_id on public.tasks (status_item_id);
create index if not exists idx_tasks_week_id on public.tasks (week_id);
create index if not exists idx_user_client_access_workspace_id on public.user_client_access (workspace_id);
-- (workspace_id, group_id) cobre também o FK isolado em workspace_id.
create index if not exists idx_user_client_group_access_workspace_id_group_id on public.user_client_group_access (workspace_id, group_id);
create index if not exists idx_user_permissions_permission_id on public.user_permissions (permission_id);
create index if not exists idx_user_permissions_workspace_id on public.user_permissions (workspace_id);
create index if not exists idx_user_roles_workspace_id on public.user_roles (workspace_id);
create index if not exists idx_user_task_preferences_active_view_id on public.user_task_preferences (active_view_id);
create index if not exists idx_workspace_client_group_members_workspace_id_client_id on public.workspace_client_group_members (workspace_id, client_id);
create index if not exists idx_workspace_nav_permissions_user_id on public.workspace_nav_permissions (user_id);
create index if not exists idx_workspaces_owner_user_id on public.workspaces (owner_user_id);

-- 2) Remove índice duplicado (idêntico a task_comments_task_idx).
drop index if exists public.idx_task_comments_task;
