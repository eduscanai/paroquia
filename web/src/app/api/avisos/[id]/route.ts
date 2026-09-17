import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { podeGerenciarComunidade } from "@/lib/permissoes";

const SELECT_AVISO = `
  select
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
  where a.id = $1
`;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { rows } = await pool.query(SELECT_AVISO, [id]);

  if (rows.length === 0) {
    return NextResponse.json({ error: "Aviso não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ aviso: rows[0] });
}

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

  // Só fixar/desfixar: qualquer fiel autenticado pode (comportamento já
  // usado pelo app mobile), sem checar dono da comunidade.
  const somenteFixado = Object.keys(body).every((chave) => chave === "fixado");
  if (somenteFixado) {
    if (typeof body.fixado !== "boolean") {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const { rowCount } = await pool.query(
      `update avisos set fixado = $1, updated_at = now() where id = $2`,
      [body.fixado, id],
    );
    if (rowCount === 0) {
      return NextResponse.json({ error: "Aviso não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  }

  // Edição de conteúdo: exige ser dono da comunidade do aviso (ou paróquia/desenvolvedor).
  const { rows: avisoRows } = await pool.query(`select comunidade_id from avisos where id = $1`, [
    id,
  ]);
  if (avisoRows.length === 0) {
    return NextResponse.json({ error: "Aviso não encontrado." }, { status: 404 });
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    avisoRows[0].comunidade_id,
  );
  if (!permitido) {
    return NextResponse.json({ error: "Sem permissão para editar este aviso." }, { status: 403 });
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [coluna, valor] of [
    ["titulo", body.titulo],
    ["descricao", body.descricao],
    ["imagem_url", body.imagemUrl],
    ["fixado", body.fixado],
  ] as const) {
    if (valor !== undefined) {
      sets.push(`${coluna} = $${i++}`);
      values.push(valor);
    }
  }

  if (sets.length > 0) {
    values.push(id);
    await pool.query(`update avisos set ${sets.join(", ")}, updated_at = now() where id = $${i}`, values);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { rows } = await pool.query(`select comunidade_id from avisos where id = $1`, [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Aviso não encontrado." }, { status: 404 });
  }

  const permitido = await podeGerenciarComunidade(
    session.user.id,
    session.user.role,
    rows[0].comunidade_id,
  );
  if (!permitido) {
    return NextResponse.json({ error: "Sem permissão para excluir este aviso." }, { status: 403 });
  }

  await pool.query(`delete from avisos where id = $1`, [id]);
  return NextResponse.json({ success: true });
}
