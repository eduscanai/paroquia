import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { podeGerenciarComunidade } from "@/lib/permissoes";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Todo fiel vê os eventos da paróquia inteira, não só da própria
  // comunidade — mesmo critério já usado para avisos e campanhas.
  const { rows } = await pool.query(
    `select
       e.id,
       e.comunidade_id as "comunidadeId",
       c.sigla as "comunidadeSigla",
       c.nome as "comunidadeNome",
       c.nome_curto as "comunidadeNomeCurto",
       e.titulo,
       to_char(e.data, 'YYYY-MM-DD') as "data",
       to_char(e.hora_inicio, 'HH24:MI') as "horaInicio",
       to_char(e.hora_fim, 'HH24:MI') as "horaFim",
       e.local
     from eventos e
     join comunidades c on c.id = e.comunidade_id
     order by e.data, e.hora_inicio`,
  );

  return NextResponse.json({ eventos: rows });
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
    typeof body.data !== "string" ||
    typeof body.horaInicio !== "string" ||
    typeof body.horaFim !== "string" ||
    typeof body.local !== "string" ||
    !body.titulo.trim() ||
    !body.local.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Campos obrigatórios: comunidadeId, titulo, data, horaInicio, horaFim, local.",
      },
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
      { error: "Sem permissão para criar eventos nesta comunidade." },
      { status: 403 },
    );
  }

  const { rows } = await pool.query(
    `insert into eventos (comunidade_id, autor_id, titulo, data, hora_inicio, hora_fim, local)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [
      body.comunidadeId,
      session.user.id,
      body.titulo,
      body.data,
      body.horaInicio,
      body.horaFim,
      body.local,
    ],
  );

  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
