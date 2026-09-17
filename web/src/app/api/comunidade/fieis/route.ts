import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

const SELECT_FIEL = `
  select
    u.id,
    u.name as nome,
    u.email,
    f.sobrenome,
    to_char(f.data_nascimento, 'YYYY-MM-DD') as "dataNascimento",
    f.endereco,
    to_char(f.created_at, 'YYYY-MM-DD') as "membroDesde",
    c.id as "comunidadeId",
    c.nome as "comunidadeNome",
    c.nome_curto as "comunidadeNomeCurto"
  from fieis f
  join "user" u on u.id = f.user_id
  join comunidades c on c.id = f.comunidade_id
`;

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (session.user.role === "paroquia" || session.user.role === "desenvolvedor") {
    const { rows } = await pool.query(`${SELECT_FIEL} order by c.nome, u.name`);
    return NextResponse.json({ fieis: rows });
  }

  if (session.user.role !== "comunidade") {
    return NextResponse.json(
      { error: "Esta conta não tem permissão para ver fiéis." },
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

  const { rows } = await pool.query(`${SELECT_FIEL} where f.comunidade_id = $1 order by u.name`, [
    comunidadeRows[0].comunidade_id,
  ]);

  return NextResponse.json({ fieis: rows });
}
