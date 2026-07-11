-- Cada função (roles) ganha um nível de acesso base, usado como forma principal
-- de atribuição: ao atribuir a função a um usuário, profiles.role recebe este nível.
alter table public.roles add column if not exists base_role text not null default 'visualizador'
  check (base_role in ('master','admin','operador','analista','gestor_resultado','visualizador','cliente'));

update public.roles set base_role='admin' where is_system and name in ('Administrador','Diretor') and base_role='visualizador';
update public.roles set base_role='operador' where is_system and name in ('Gestor','Operação') and base_role='visualizador';
update public.roles set base_role='analista' where is_system and name in ('Comercial','Financeiro') and base_role='visualizador';
update public.roles set base_role='visualizador' where is_system and name in ('Atendimento');
