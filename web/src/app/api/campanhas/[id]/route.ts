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

  const { rows: campanhaRows } = await pool.query(
    `select comunidade_id from campanhas where id = $1`,
    [id],
  );
  if (campanhaRows.length === 0) {
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    campanhaRows[0].comunidade_id,
  );
  if (!permitido) {
    return NextResponse.json({ error: "Sem permissão para editar esta campanha." }, { status: 403 });
  }

  if (
    body.priorizada === true &&
    session.user.role !== "paroquia" &&
    session.user.role !== "desenvolvedor"
  ) {
    return NextResponse.json(
      { error: "Apenas contas de nível paróquia podem priorizar uma campanha." },
      { status: 403 },
    );
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [coluna, valor] of [
    ["titulo", body.titulo],
    ["descricao", body.descricao],
    ["meta", body.meta],
    ["arrecadado", body.arrecadado],
    ["ativa", body.ativa],
    ["priorizada", body.priorizada],
  ] as const) {
    if (valor !== undefined) {
      sets.push(`${coluna} = $${i++}`);
      values.push(valor);
    }
  }

  if (sets.length > 0) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      if (body.priorizada === true) {
        await client.query(`update campanhas set priorizada = false where priorizada = true and id != $1`, [id]);
      }
      values.push(id);
      await client.query(
        `update campanhas set ${sets.join(", ")}, updated_at = now() where id = $${i}`,
        values,
      );
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { rows } = await pool.query(`select comunidade_id from campanhas where id = $1`, [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    rows[0].comunidade_id,
  );
  if (!permitido) {
    return NextResponse.json({ error: "Sem permissão para excluir esta campanha." }, { status: 403 });
  }

  await pool.query(`delete from campanhas where id = $1`, [id]);
  return NextResponse.json({ success: true });
}
