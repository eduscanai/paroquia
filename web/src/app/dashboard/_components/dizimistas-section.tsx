"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Paginacao } from "./paginacao";
import type { Dizimista } from "./types";
import { usePaginacao } from "./use-paginacao";

const POR_PAGINA = 10;

function StatusBadge({ status }: { status: Dizimista["statusMesAtual"] }) {
  const emDia = status === "pago" || status === "isento";
  const aguardando = status === "pendente";

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        emDia
          ? "bg-green-100 text-green-700"
          : aguardando
            ? "bg-secondary text-secondary-foreground"
            : "bg-orange-100 text-orange-700",
      )}
    >
      {status === "pago"
        ? "Pago este mês"
        : status === "isento"
          ? "Isento"
          : aguardando
            ? "Aguardando confirmação"
            : "Em aberto"}
    </span>
  );
}

export function DizimistasSection({
  dizimistas,
  carregando,
  multiComunidade,
}: {
  dizimistas: Dizimista[];
  carregando: boolean;
  multiComunidade: boolean;
}) {
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<Dizimista | null>(null);

  const dizimistasFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return dizimistas;
    return dizimistas.filter((d) => `${d.nome} ${d.email}`.toLowerCase().includes(termo));
  }, [dizimistas, busca]);

  const { itensPagina, pagina, totalPaginas, total, proxima, anterior } = usePaginacao(
    dizimistasFiltrados,
    POR_PAGINA,
  );

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Dizimistas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {multiComunidade ? "Cadastrados em toda a paróquia" : "Cadastrados nesta comunidade"}
              {" · "}
              {dizimistasFiltrados.length}{" "}
              {dizimistasFiltrados.length === 1 ? "dizimista" : "dizimistas"}
            </p>
          </div>

          {dizimistas.length > 0 ? (
            <div className="relative">
              <Search
                size={16}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="h-10 w-64 rounded-full border-none bg-muted pr-4 pl-10 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
              />
            </div>
          ) : null}
        </div>

        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : dizimistas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dizimista ainda — a pessoa se cadastra pelo próprio app, em Perfil → Meu
            dízimo.
          </p>
        ) : dizimistasFiltrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dizimista encontrado para &quot;{busca}&quot;.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-muted/60">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="pl-5">Nº</TableHead>
                  <TableHead>Nome</TableHead>
                  {multiComunidade ? <TableHead>Comunidade</TableHead> : null}
                  <TableHead>Valor mensal</TableHead>
                  <TableHead>Este mês</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensPagina.map((d) => (
                  <TableRow key={d.id} className="border-border/60">
                    <TableCell className="pl-5 font-mono text-sm text-muted-foreground">
                      {String(d.numero).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal">
                      <div className="flex flex-col">
                        <span>{d.nome}</span>
                        <span className="text-xs text-muted-foreground">{d.email}</span>
                      </div>
                    </TableCell>
                    {multiComunidade ? (
                      <TableCell className="text-muted-foreground">
                        {d.comunidadeNomeCurto}
                      </TableCell>
                    ) : null}
                    <TableCell className="font-medium text-foreground">
                      {formatarMoeda(d.valorMensal)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.statusMesAtual} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetalhe(d)}>
                        Ver mais
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-5 pb-4">
              <Paginacao
                pagina={pagina}
                totalPaginas={totalPaginas}
                total={total}
                porPagina={POR_PAGINA}
                onAnterior={anterior}
                onProxima={proxima}
              />
            </div>
          </div>
        )}
      </section>

      <Sheet open={!!detalhe} onOpenChange={(open) => !open && setDetalhe(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="font-serif text-xl">
              {detalhe ? `Dizimista nº ${String(detalhe.numero).padStart(3, "0")}` : ""}
            </SheetTitle>
          </SheetHeader>

          {detalhe ? (
            <div className="flex flex-col gap-0 px-4">
              <InfoRow label="Nome" valor={detalhe.nome} />
              <InfoRow label="E-mail" valor={detalhe.email} borda />
              <InfoRow label="Comunidade" valor={detalhe.comunidadeNome} borda />
              <InfoRow label="Valor mensal" valor={formatarMoeda(detalhe.valorMensal)} borda />
              <InfoRow label="Dia de vencimento" valor={String(detalhe.diaVencimento)} borda />
              <InfoRow label="Dizimista desde" valor={detalhe.dizimistaDesde} borda />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function InfoRow({ label, valor, borda }: { label: string; valor: string; borda?: boolean }) {
  return (
    <div className={`flex flex-col gap-0.5 py-3.5 ${borda ? "border-t border-muted" : ""}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-base font-medium text-foreground">{valor}</span>
    </div>
  );
}
