-- Hierarquia: paróquia -> comunidades -> avisos/eventos/campanhas.
-- Até agora existia uma paróquia implícita (o app só atendia uma). Isso
-- cria o registro de verdade e liga as comunidades já existentes a ela.
create table if not exists paroquias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text,
  estado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table comunidades add column if not exists paroquia_id uuid references paroquias(id) on delete restrict;

insert into paroquias (nome)
select 'Paróquia Santo Antônio'
where not exists (select 1 from paroquias);

update comunidades
set paroquia_id = (select id from paroquias order by created_at limit 1)
where paroquia_id is null;

alter table comunidades alter column paroquia_id set not null;

create index if not exists comunidades_paroquia_id_idx on comunidades (paroquia_id);
