import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { rows: dizimistaRows } = await pool.query(
    `select
       d.id,
       d.numero,
       d.dia_vencimento as "diaVencimento",
       d.valor_mensal::float8 as "valorMensal",
       to_char(d.dizimista_desde, 'YYYY-MM-DD') as "dizimistaDesde",
       c.nome as "comunidadeNome"
     from dizimistas d
     join comunidades c on c.id = d.comunidade_id
     where d.user_id = $1`,
    [session.user.id],
  );

  if (dizimistaRows.length === 0) {
    return NextResponse.json(
      { error: "Esta conta ainda não está cadastrada como dizimista." },
      { status: 404 },
    );
  }

  const dizimista = dizimistaRows[0];

  const { rows: historico } = await pool.query(
    `select
       mes,
       ano,
       status,
       valor::float8 as valor,
       to_char(pago_em, 'YYYY-MM-DD') as "pagoEm"
     from pagamentos_dizimo
     where dizimista_id = $1
     order by ano desc, mes desc`,
    [dizimista.id],
  );

  return NextResponse.json({ dizimista, historico });
}

// O próprio fiel escolhe/atualiza quanto quer contribuir por mês — chamado
// tanto pra virar dizimista pela primeira vez quanto pra mudar o valor
// depois (upsert por user_id, que é único em dizimistas). O dia de
// vencimento não é escolhido pelo fiel: fica fixo em 10 pra quem se
// cadastra por aqui, e continua ajustável só pela secretaria.
const DIA_VENCIMENTO_PADRAO = 10;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const valorMensal = Number(body?.valorMensal);
  if (!(valorMensal > 0)) {
    return NextResponse.json(
      { error: "Informe um valor mensal maior que zero." },
      { status: 400 },
    );
  }

  const { rows: fielRows } = await pool.query(
    `select comunidade_id from fieis where user_id = $1`,
    [session.user.id],
  );
  if (fielRows.length === 0) {
    return NextResponse.json(
      { error: "Só fiéis com cadastro completo podem ser dizimistas." },
      { status: 400 },
    );
  }

  await pool.query(
    `insert into dizimistas (user_id, comunidade_id, dia_vencimento, valor_mensal)
     values ($1, $2, $3, $4)
     on conflict (user_id) do update set valor_mensal = $4, updated_at = now()`,
    [session.user.id, fielRows[0].comunidade_id, DIA_VENCIMENTO_PADRAO, valorMensal],
  );

  return NextResponse.json({ success: true });
}
