import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { mpPayment } from "@/lib/mercadopago";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  // Confere se essa cobrança pertence mesmo a quem está perguntando, antes
  // de consultar o Mercado Pago — evita um usuário espiar o pagamento de
  // outro só sabendo o id.
  const { rows: ofertaRows } = await pool.query(
    `select id, status, campanha_id as "campanhaId", valor
     from ofertas where mp_payment_id = $1 and user_id = $2`,
    [id, session.user.id],
  );
  const { rows: dizimoRows } = await pool.query(
    `select pd.id, pd.status
     from pagamentos_dizimo pd
     join dizimistas d on d.id = pd.dizimista_id
     where pd.mp_payment_id = $1 and d.user_id = $2`,
    [id, session.user.id],
  );

  if (ofertaRows.length === 0 && dizimoRows.length === 0) {
    return NextResponse.json({ error: "Cobrança não encontrada." }, { status: 404 });
  }

  let pagamento;
  try {
    pagamento = await mpPayment.get({ id });
  } catch (error) {
    console.error("Falha ao consultar pagamento no Mercado Pago:", error);
    return NextResponse.json(
      { error: "Não foi possível consultar o status no Mercado Pago." },
      { status: 502 },
    );
  }

  const statusMp = pagamento.status;
  const status =
    statusMp === "approved"
      ? "aprovado"
      : statusMp === "rejected" || statusMp === "cancelled"
        ? "recusado"
        : "pendente";

  if (status === "aprovado") {
    if (ofertaRows.length > 0 && ofertaRows[0].status !== "confirmado") {
      // Oferta sem direcionamento ("onde for mais necessário"): credita na
      // campanha priorizada vigente, se houver alguma. campanha_id continua
      // nulo — preserva que o doador não escolheu uma campanha específica.
      let campanhaCreditoId = ofertaRows[0].campanhaId as string | null;
      if (!campanhaCreditoId) {
        const { rows: priorizadaRows } = await pool.query(
          `select id from campanhas where priorizada = true limit 1`,
        );
        campanhaCreditoId = priorizadaRows[0]?.id ?? null;
      }

      await pool.query(
        `update ofertas set status = 'confirmado', confirmado_em = now(), campanha_credito_id = $2 where mp_payment_id = $1`,
        [id, campanhaCreditoId],
      );
      // Reflete a oferta confirmada na meta arrecadada da campanha creditada, se houver.
      if (campanhaCreditoId) {
        await pool.query(
          `update campanhas set arrecadado = arrecadado + $1, updated_at = now() where id = $2`,
          [ofertaRows[0].valor, campanhaCreditoId],
        );
      }
    }
    if (dizimoRows.length > 0 && dizimoRows[0].status !== "pago") {
      await pool.query(
        `update pagamentos_dizimo set status = 'pago', pago_em = now(), updated_at = now() where mp_payment_id = $1`,
        [id],
      );
    }
  }

  return NextResponse.json({ status });
}
