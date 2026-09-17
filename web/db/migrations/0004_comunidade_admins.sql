-- Vincula uma conta de nível "comunidade" à comunidade que ela administra
-- (1 conta : 1 comunidade), no mesmo padrão da tabela fieis.
create table if not exists comunidade_admins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique references "user"(id) on delete cascade,
  comunidade_id uuid not null references comunidades(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comunidade_admins_comunidade_id_idx on comunidade_admins (comunidade_id);
