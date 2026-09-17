-- Uma campanha pode ser marcada como "priorizada": toda oferta feita sem
-- direcionamento específico ("onde for mais necessário") passa a contar
-- pra meta dela. Só uma campanha pode estar priorizada por vez (garantido
-- por índice único parcial).
alter table campanhas add column if not exists priorizada boolean not null default false;
create unique index if not exists campanhas_priorizada_unica_idx
  on campanhas (priorizada) where priorizada = true;

-- Registra qual campanha efetivamente recebeu o crédito de cada oferta —
-- pode diferir de campanha_id quando a oferta foi sem direcionamento e
-- caiu pra campanha priorizada vigente no momento da confirmação. Fica
-- nulo se a oferta ainda não foi confirmada ou não havia campanha
-- priorizada quando confirmou.
alter table ofertas add column if not exists campanha_credito_id uuid references campanhas(id) on delete set null;
create index if not exists ofertas_campanha_credito_id_idx on ofertas (campanha_credito_id);
