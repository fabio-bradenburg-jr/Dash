-- Modelo de acesso "função = páginas".
-- Cada função (roles) passa a definir apenas o conjunto de páginas que libera.
-- Ao atribuir a função a um usuário, essas páginas são materializadas em
-- workspace_nav_permissions. Ajustes individuais que divergirem viram "Acesso Personalizado".
-- Seguro para rodar mais de uma vez (idempotente).

alter table public.roles
  add column if not exists pages jsonb not null default '[]'::jsonb;

-- Observação: as colunas roles.base_role, e as tabelas permissions/role_permissions,
-- além de profiles.ai_access_level, permanecem no schema por compatibilidade, mas
-- deixam de ser usadas pela aplicação (o nível de acesso agora é por página).
