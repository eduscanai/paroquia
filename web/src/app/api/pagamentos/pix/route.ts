import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { mpPayment } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || (body.tipo !== "oferta" && body.tipo !== "dizimo")) {
    return NextResponse.json(
      { error: "Campo tipo deve ser 'oferta' ou 'dizimo'." },
      { status: 400 },
    );
  }

  const valor = Number(body.valor);
  if (!(valor > 0)) {
    return NextResponse.json({ error: "Valor precisa ser maior que zero." }, { status: 400 });
  }

  let descricao: string;
  let externalReference: string;
  let dizimistaId: string | null = null;

  if (body.tipo === "dizimo") {
    const mes = Number(body.mes);
    const ano = Number(body.ano);
    if (!(mes >= 1 && mes <= 12) || !(ano >= 2000 && ano <= 2100)) {
      return NextResponse.json({ error: "Campos mes/ano inválidos." }, { status: 400 });
    }

    const { rows } = await pool.query(
      `select id from dizimistas where user_id = $1`,
      [session.user.id],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Esta conta ainda não está cadastrada como dizimista." },
        { status: 400 },
      );
    }
    dizimistaId = rows[0].id;

    const { rows: existentes } = await pool.query(
      `select status from pagamentos_dizimo where dizimista_id = $1 and mes = $2 and ano = $3`,
      [dizimistaId, mes, ano],
    );
    if (existentes.length > 0 && existentes[0].status === "pago") {
      return NextResponse.json({ error: "Este mês já foi pago." }, { status: 400 });
    }

    descricao = `Dízimo ${mes}/${ano}`;
    externalReference = `dizimo:${dizimistaId}:${ano}-${mes}`;
  } else {
    if (body.campanhaId) {
      const { rows } = await pool.query(`select id from campanhas where id = $1`, [
        body.campanhaId,
      ]);
      if (rows.length === 0) {
        return NextResponse.json({ error: "Campanha inválida." }, { status: 400 });
      }
    }

    descricao = "Oferta";
    externalReference = `oferta:${session.user.id}:${Date.now()}`;
  }

  let pagamento;
  try {
    pagamento = await mpPayment.create({
      body: {
        transaction_amount: valor,
        description: descricao,
        payment_method_id: "pix",
        payer: { email: session.user.email },
        external_reference: externalReference,
      },
    });
  } catch (error) {
    console.error("Falha ao criar pagamento no Mercado Pago:", error);
    const mensagem = error instanceof Error ? error.message : String(error);

    if (mensagem.includes("Unauthorized use of live credentials")) {
      return NextResponse.json(
        {
          error:
            "O token do Mercado Pago está certo, mas a conta ainda não concluiu a homologação para produção (formulário na página de credenciais). Até isso ser aprovado, use um Access Token de teste (TEST-...).",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Não foi possível criar a cobrança Pix. Verifique se o MERCADOPAGO_ACCESS_TOKEN em .env.local é válido.",
      },
      { status: 502 },
    );
  }

  const qrCode = pagamento.point_of_interaction?.transaction_data?.qr_code ?? null;
  const qrCodeBase64 = pagamento.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

  if (!qrCode || !pagamento.id) {
    return NextResponse.json(
      { error: "O Mercado Pago não retornou um QR code Pix válido." },
      { status: 502 },
    );
  }

  const mpPaymentId = String(pagamento.id);

  if (body.tipo === "dizimo") {
    const mes = Number(body.mes);
    const ano = Number(body.ano);
    await pool.query(
      `insert into pagamentos_dizimo (dizimista_id, mes, ano, status, valor, forma_pagamento, mp_payment_id)
       values ($1, $2, $3, 'pendente', $4, 'pix', $5)
       on conflict (dizimista_id, mes, ano)
       do update set status = 'pendente', valor = $4, forma_pagamento = 'pix', mp_payment_id = $5, updated_at = now()`,
      [dizimistaId, mes, ano, valor, mpPaymentId],
    );
  } else {
    await pool.query(
      `insert into ofertas (user_id, campanha_id, valor, forma_pagamento, status, mp_payment_id)
       values ($1, $2, $3, 'pix', 'pendente', $4)`,
      [session.user.id, body.campanhaId || null, valor, mpPaymentId],
    );
  }

  return NextResponse.json(
    { id: mpPaymentId, qrCode, qrCodeBase64 },
    { status: 201 },
  );
}
