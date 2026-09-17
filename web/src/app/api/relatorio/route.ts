import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

const SELECT_OFERTAS = `
  select
    o.id,
    u.name as "fielNome",
    c.id as "comunidadeId",
    c.nome_curto as "comunidadeNomeCurto",
    o.valor::float8 as valor,
    cam.titulo as "campanhaTitulo",
    to_char(o.confirmado_em, 'YYYY-MM-DD"T"HH24:MI:SS') as "confirmadoEm"
  from ofertas o
  join "user" u on u.id = o.user_id
  left join fieis f on f.user_id = o.user_id
  left join comunidades c on c.id = f.comunidade_id
  left join campanhas cam on cam.id = o.campanha_id
  where o.status = 'confirmado'
`;

const SELECT_DIZIMOS = `
  select
    pd.id,
    u.name as "fielNome",
    c.id as "comunidadeId",
    c.nome_curto as "comunidadeNomeCurto",
    pd.mes,
    pd.ano,
    pd.valor::float8 as valor,
    to_char(pd.pago_em, 'YYYY-MM-DD"T"HH24:MI:SS') as "pagoEm"
  from pagamentos_dizimo pd
  join dizimistas d on d.id = pd.dizimista_id
  join "user" u on u.id = d.user_id
  join comunidades c on c.id = d.comunidade_id
  where pd.status = 'pago'
`;

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let ofertas;
  let dizimos;

  if (session.user.role === "paroquia" || session.user.role === "desenvolvedor") {
    [ofertas, dizimos] = await Promise.all([
      pool.query(`${SELECT_OFERTAS} order by o.confirmado_em desc`),
      pool.query(`${SELECT_DIZIMOS} order by pd.pago_em desc`),
    ]);
  } else if (session.user.role === "comunidade") {
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
    const comunidadeId = comunidadeRows[0].comunidade_id;
    [ofertas, dizimos] = await Promise.all([
      pool.query(`${SELECT_OFERTAS} and c.id = $1 order by o.confirmado_em desc`, [comunidadeId]),
      pool.query(`${SELECT_DIZIMOS} and c.id = $1 order by pd.pago_em desc`, [comunidadeId]),
    ]);
  } else {
    return NextResponse.json(
      { error: "Esta conta não tem permissão para ver o relatório." },
      { status: 403 },
    );
  }

  const totalOfertas = ofertas.rows.reduce((soma, o) => soma + o.valor, 0);
  const totalDizimos = dizimos.rows.reduce((soma, d) => soma + d.valor, 0);

  return NextResponse.json({
    ofertas: ofertas.rows,
    dizimos: dizimos.rows,
    resumo: {
      totalOfertas,
      totalDizimos,
      totalGeral: totalOfertas + totalDizimos,
    },
  });
}
