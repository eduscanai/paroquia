"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatarMoeda } from "@/lib/format";

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function ultimosMeses(qtd: number): { chave: string; label: string }[] {
  const hoje = new Date();
  const meses: { chave: string; label: string }[] = [];
  for (let i = qtd - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    meses.push({
      chave,
      label: `${MESES_CURTOS[data.getMonth()]}/${String(data.getFullYear()).slice(2)}`,
    });
  }
  return meses;
}

function TooltipArrecadacao({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{formatarMoeda(payload[0].value)}</p>
    </div>
  );
}

export function ArrecadacaoChart({
  ofertas,
  dizimos,
}: {
  ofertas: { valor: number; confirmadoEm: string }[];
  dizimos: { valor: number; pagoEm: string }[];
}) {
  const meses = ultimosMeses(6);
  const totalPorMes = new Map(meses.map((m) => [m.chave, 0]));

  for (const oferta of ofertas) {
    const chave = oferta.confirmadoEm.slice(0, 7);
    if (totalPorMes.has(chave)) {
      totalPorMes.set(chave, (totalPorMes.get(chave) ?? 0) + oferta.valor);
    }
  }
  for (const dizimo of dizimos) {
    const chave = dizimo.pagoEm.slice(0, 7);
    if (totalPorMes.has(chave)) {
      totalPorMes.set(chave, (totalPorMes.get(chave) ?? 0) + dizimo.valor);
    }
  }

  const dados = meses.map((m) => ({ mes: m.label, valor: totalPorMes.get(m.chave) ?? 0 }));

  return (
    <div className="rounded-2xl bg-muted/60 p-5">
      <p className="mb-1 text-sm font-bold text-foreground">Arrecadação por mês</p>
      <p className="mb-4 text-xs text-muted-foreground">Ofertas + dízimos confirmados</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="mes"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={72}
            tick={{ fill: "#6B7280", fontSize: 12 }}
            tickFormatter={(v: number) => formatarMoeda(v)}
          />
          <Tooltip cursor={{ fill: "#EDE9FE" }} content={<TooltipArrecadacao />} />
          <Bar dataKey="valor" fill="#7C3AED" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
