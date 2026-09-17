-- Esquema principal do app: comunidades (capelas da paróquia), avisos,
-- eventos do calendário, campanhas de arrecadação e dízimo.

create extension if not exists pgcrypto;

-- As "comunidades" são as capelas/igrejas dentro da paróquia (Matriz, Capela
-- São Pedro, etc). Um usuário com role "comunidade" administra uma delas;
-- role "paroquia" administra todas.
create table if not exists comunidades (
  id uuid primary key default gen_random_uuid(),
  sigla text not null unique,
  nome text not null,
  nome_curto text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists avisos (
  id uuid primary key default gen_random_uuid(),
  comunidade_id uuid not null references comunidades(id) on delete restrict,
  autor_id text references "user"(id) on delete set null,
  titulo text not null,
  descricao text not null,
  imagem_url text,
  fixado boolean not null default false,
  publicado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists avisos_comunidade_id_idx on avisos (comunidade_id);
create index if not exists avisos_publicado_em_idx on avisos (publicado_em desc);

create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  comunidade_id uuid not null references comunidades(id) on delete restrict,
  autor_id text references "user"(id) on delete set null,
  titulo text not null,
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  local text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eventos_comunidade_id_idx on eventos (comunidade_id);
create index if not exists eventos_data_idx on eventos (data);

-- Campanhas de arrecadação (mostradas na tela de Ofertar). comunidade_id
-- nulo = campanha da paróquia inteira, não de uma capela específica.
create table if not exists campanhas (
  id uuid primary key default gen_random_uuid(),
  comunidade_id uuid references comunidades(id) on delete set null,
  titulo text not null,
  descricao text not null,
  meta numeric(12,2) not null check (meta > 0),
  arrecadado numeric(12,2) not null default 0 check (arrecadado >= 0),
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campanhas_comunidade_id_idx on campanhas (comunidade_id);

-- Um dizimista por usuário. "numero" é o número de identificação exibido
-- no app (ex: "013"), atribuído sequencialmente.
create table if not exists dizimistas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique references "user"(id) on delete cascade,
  comunidade_id uuid not null references comunidades(id) on delete restrict,
  numero integer generated always as identity,
  dia_vencimento smallint not null check (dia_vencimento between 1 and 28),
  valor_mensal numeric(12,2) not null check (valor_mensal > 0),
  dizimista_desde date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pagamentos_dizimo (
  id uuid primary key default gen_random_uuid(),
  dizimista_id uuid not null references dizimistas(id) on delete cascade,
  mes smallint not null check (mes between 1 and 12),
  ano smallint not null check (ano between 2000 and 2100),
  status text not null check (status in ('pago', 'isento', 'em_aberto')),
  valor numeric(12,2),
  forma_pagamento text,
  pago_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dizimista_id, mes, ano)
);

create index if not exists pagamentos_dizimo_dizimista_id_idx on pagamentos_dizimo (dizimista_id);

-- Ofertas avulsas feitas pela tela de Ofertar (distintas do dízimo mensal
-- recorrente). campanha_id nulo = "onde for mais necessário".
create table if not exists ofertas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  campanha_id uuid references campanhas(id) on delete set null,
  valor numeric(12,2) not null check (valor > 0),
  forma_pagamento text not null default 'pix',
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'expirado')),
  confirmado_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ofertas_user_id_idx on ofertas (user_id);
create index if not exists ofertas_campanha_id_idx on ofertas (campanha_id);

-- Comunidades já conhecidas (as mesmas usadas no mock do app até agora).
insert into comunidades (sigla, nome, nome_curto) values
  ('MA', 'Matriz Santo Antônio', 'Matriz'),
  ('SP', 'Capela São Pedro', 'São Pedro'),
  ('NF', 'N. Sra. de Fátima', 'Fátima'),
  ('SR', 'Santa Rita', 'Santa Rita')
on conflict (sigla) do nothing;
