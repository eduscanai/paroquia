import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

async function getUserSession(req: NextRequest) {
  return auth.api.getSession({ headers: req.headers });
}

export async function GET(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { rows } = await pool.query(
    `select
       u.id,
       u.name as nome,
       u.email,
       f.sobrenome,
       f.data_nascimento as "dataNascimento",
       f.endereco,
       c.id as "comunidadeId",
       c.nome as "comunidadeNome",
       c.nome_curto as "comunidadeNomeCurto"
     from "user" u
     join fieis f on f.user_id = u.id
     join comunidades c on c.id = f.comunidade_id
     where u.id = $1`,
    [session.user.id],
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Perfil de fiel não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ fiel: rows[0] });
}

export async function PATCH(req: NextRequest) {
  const session = await getUserSession(req);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { nome, sobrenome, dataNascimento, comunidadeId, endereco } = body as Record<
    string,
    string | undefined
  >;

  if (comunidadeId) {
    const { rows } = await pool.query(`select id from comunidades where id = $1`, [comunidadeId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Comunidade inválida." }, { status: 400 });
    }
  }

  if (nome) {
    await auth.api.updateUser({ headers: req.headers, body: { name: nome } });
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [column, value] of [
    ["sobrenome", sobrenome],
    ["data_nascimento", dataNascimento],
    ["comunidade_id", comunidadeId],
    ["endereco", endereco],
  ] as const) {
    if (value !== undefined) {
      sets.push(`${column} = $${i++}`);
      values.push(value);
    }
  }

  if (sets.length > 0) {
    values.push(session.user.id);
    await pool.query(
      `update fieis set ${sets.join(", ")}, updated_at = now() where user_id = $${i}`,
      values,
    );
  }

  return NextResponse.json({ success: true });
}
