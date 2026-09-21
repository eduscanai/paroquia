import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

// "statusMesAtual" reflete o mês corrente (servidor) — null quando ainda não
// existe nenhuma cobrança/pagamento lançado pra esse mês (equivale a "em
// aberto" na prática, só não tem uma linha em pagamentos_dizimo ainda).
const SELECT_DIZIMISTA = `
  select
    d.id,
    d.numero,
    u.name as nome,
    u.email,
    d.dia_vencimento as "diaVencimento",
    d.valor_mensal::float8 as "valorMensal",
    to_char(d.dizimista_desde, 'YYYY-MM-DD') as "dizimistaDesde",
    c.id as "comunidadeId",
    c.nome as "comunidadeNome",
    c.nome_curto as "comunidadeNomeCurto",
    pd.status as "statusMesAtual"
  from dizimistas d
  join "user" u on u.id = d.user_id
  join comunidades c on c.id = d.comunidade_id
  left join pagamentos_dizimo pd
    on pd.dizimista_id = d.id
    and pd.mes = extract(month from current_date)
    and pd.ano = extract(year from current_date)
`;

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (session.user.role === "paroquia" || session.user.role === "desenvolvedor") {
    const { rows } = await pool.query(`${SELECT_DIZIMISTA} order by c.nome, u.name`);
    return NextResponse.json({ dizimistas: rows });
  }

  if (session.user.role !== "comunidade") {
    return NextResponse.json(
      { error: "Esta conta não tem permissão para ver dizimistas." },
      { status: 403 },
    );
  }

  const { rows: comunidadeRows } = await pool.query(
    `select comunidade_id from comunidade_admins where user_id = $1`,
    [session.user.id],
  );
  if (comunidadeRows.length === 0) {
    return NextResponse.json(
      { error: "Conta não vinculada a uma comunidade." },
      { status: 404 },
    );
  }

  const { rows } = await pool.query(
    `${SELECT_DIZIMISTA} where d.comunidade_id = $1 order by u.name`,
    [comunidadeRows[0].comunidade_id],
  );

  return NextResponse.json({ dizimistas: rows });
}
