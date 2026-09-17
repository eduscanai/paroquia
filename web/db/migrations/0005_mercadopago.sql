-- Suporte a cobranças Pix via Mercado Pago para ofertas e dízimo. Cada
-- cobrança criada é rastreada pelo id de pagamento do Mercado Pago, usado
-- depois para consultar o status (o app faz polling, não há webhook aqui —
-- servidor local não tem URL pública alcançável pelo Mercado Pago).

alter table ofertas add column if not exists mp_payment_id text;
create unique index if not exists ofertas_mp_payment_id_idx
  on ofertas (mp_payment_id) where mp_payment_id is not null;

alter table pagamentos_dizimo drop constraint if exists pagamentos_dizimo_status_check;
alter table pagamentos_dizimo add constraint pagamentos_dizimo_status_check
  check (status in ('pago', 'isento', 'em_aberto', 'pendente'));
alter table pagamentos_dizimo add column if not exists mp_payment_id text;
create unique index if not exists pagamentos_dizimo_mp_payment_id_idx
  on pagamentos_dizimo (mp_payment_id) where mp_payment_id is not null;
