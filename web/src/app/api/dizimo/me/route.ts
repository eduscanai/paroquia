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
