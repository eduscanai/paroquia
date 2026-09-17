import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { podeGerenciarComunidade } from "@/lib/permissoes";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { rows: eventoRows } = await pool.query(
    `select comunidade_id from eventos where id = $1`,
    [id],
  );
  if (eventoRows.length === 0) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    eventoRows[0].comunidade_id,
  );
  if (!permitido) {
    return NextResponse.json({ error: "Sem permissão para editar este evento." }, { status: 403 });
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [coluna, valor] of [
    ["titulo", body.titulo],
    ["data", body.data],
    ["hora_inicio", body.horaInicio],
    ["hora_fim", body.horaFim],
    ["local", body.local],
  ] as const) {
    if (valor !== undefined) {
      sets.push(`${coluna} = $${i++}`);
      values.push(valor);
    }
  }

  if (sets.length > 0) {
    values.push(id);
    await pool.query(
      `update eventos set ${sets.join(", ")}, updated_at = now() where id = $${i}`,
      values,
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { rows } = await pool.query(`select comunidade_id from eventos where id = $1`, [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    rows[0].comunidade_id,
  );
  if (!permitido) {
    return NextResponse.json({ error: "Sem permissão para excluir este evento." }, { status: 403 });
  }

  await pool.query(`delete from eventos where id = $1`, [id]);
  return NextResponse.json({ success: true });
}
