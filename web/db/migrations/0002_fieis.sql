-- Dados de perfil específicos de quem tem role "fiel". Fica numa tabela
-- separada (em vez de additionalFields no user do Better Auth) porque
-- desenvolvedor/paroquia/comunidade não precisam de data de nascimento,
-- endereço etc.
create table if not exists fieis (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique references "user"(id) on delete cascade,
  sobrenome text not null,
  data_nascimento date not null,
  comunidade_id uuid not null references comunidades(id) on delete restrict,
  endereco text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fieis_comunidade_id_idx on fieis (comunidade_id);
