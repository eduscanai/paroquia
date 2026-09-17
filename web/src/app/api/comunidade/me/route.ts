import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (session.user.role !== "comunidade") {
    return NextResponse.json(
      { error: "Esta conta não é de nível comunidade." },
      { status: 403 },
    );
  }

  const { rows } = await pool.query(
    `select
       c.id,
       c.sigla,
       c.nome,
       c.nome_curto as "nomeCurto"
     from comunidade_admins ca
     join comunidades c on c.id = ca.comunidade_id
     where ca.user_id = $1`,
    [session.user.id],
  );

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Conta não vinculada a uma comunidade." },
      { status: 404 },
    );
  }

  return NextResponse.json({ comunidade: rows[0] });
}
