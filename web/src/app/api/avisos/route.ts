import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { podeGerenciarComunidade } from "@/lib/permissoes";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Todo fiel vê os avisos da paróquia inteira, não só da própria
  // comunidade — por isso não filtramos por comunidade aqui.
  const { rows } = await pool.query(
    `select
       a.id,
       a.comunidade_id as "comunidadeId",
       c.nome as "comunidadeNome",
       c.nome_curto as "comunidadeNomeCurto",
       a.titulo,
       a.descricao,
       a.imagem_url as "imagemUrl",
       a.fixado,
       to_char(a.publicado_em, 'YYYY-MM-DD') as "data",
       to_char(a.publicado_em, 'HH24:MI') as "hora"
     from avisos a
     join comunidades c on c.id = a.comunidade_id
     order by a.fixado desc, a.publicado_em desc`,
  );

  return NextResponse.json({ avisos: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.comunidadeId !== "string" ||
    typeof body.titulo !== "string" ||
    typeof body.descricao !== "string" ||
    !body.titulo.trim() ||
    !body.descricao.trim()
  ) {
    return NextResponse.json(
      { error: "Campos obrigatórios: comunidadeId, titulo, descricao." },
      { status: 400 },
    );
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    body.comunidadeId,
  );
  if (!permitido) {
    return NextResponse.json(
      { error: "Sem permissão para publicar avisos nesta comunidade." },
      { status: 403 },
    );
  }

  const { rows } = await pool.query(
    `insert into avisos (comunidade_id, autor_id, titulo, descricao, imagem_url, fixado)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [
      body.comunidadeId,
      session.user.id,
      body.titulo,
      body.descricao,
      body.imagemUrl || null,
      Boolean(body.fixado),
    ],
  );

  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
