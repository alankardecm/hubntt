-- Tabela de dashboards salvos do HUB NTT
-- Execute no Supabase Dashboard > SQL Editor

create table if not exists hub_dashboards (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null default 'Dashboard sem título',
  description text,
  widgets jsonb not null default '[]'::jsonb,
  created_by varchar(120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sem RLS (hub interno, sem autenticação por enquanto)
alter table hub_dashboards disable row level security;

-- Trigger para atualizar updated_at automaticamente
create or replace function hub_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists hub_dashboards_updated_at on hub_dashboards;
create trigger hub_dashboards_updated_at
  before update on hub_dashboards
  for each row execute function hub_update_updated_at();
