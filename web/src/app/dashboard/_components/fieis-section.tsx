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

import { Paginacao } from "./paginacao";
import type { Comunidade, Fiel } from "./types";
import { usePaginacao } from "./use-paginacao";

const POR_PAGINA = 10;

function iniciais(nome: string, sobrenome: string): string {
  return `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase();
}

export function FieisSection({
  comunidades,
  fieis,
  carregando,
}: {
  comunidades: Comunidade[];
  fieis: Fiel[];
  carregando: boolean;
}) {
  const multi = comunidades.length > 1;
  const [busca, setBusca] = useState("");
  const [detalhe, setDetalhe] = useState<Fiel | null>(null);

  const fieisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return fieis;
    return fieis.filter((fiel) =>
      `${fiel.nome} ${fiel.sobrenome} ${fiel.email}`.toLowerCase().includes(termo),
    );
  }, [fieis, busca]);

  const { itensPagina, pagina, totalPaginas, total, proxima, anterior } = usePaginacao(
    fieisFiltrados,
    POR_PAGINA,
  );

  return (
    <>
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Fiéis</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {multi
                ? "Cadastrados em toda a paróquia"
                : `Cadastrados em ${comunidades[0]?.nomeCurto}`}{" "}
              · {fieisFiltrados.length} {fieisFiltrados.length === 1 ? "pessoa" : "pessoas"}
            </p>
          </div>

          {fieis.length > 0 ? (
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
        ) : fieis.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum fiel cadastrado ainda.</p>
        ) : fieisFiltrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum fiel encontrado para &quot;{busca}&quot;.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-muted/60">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="pl-5">Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Comunidade</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensPagina.map((fiel) => (
                  <TableRow key={fiel.id} className="border-border/60">
                    <TableCell className="pl-5 font-medium whitespace-normal">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                          {iniciais(fiel.nome, fiel.sobrenome)}
                        </div>
                        {fiel.nome} {fiel.sobrenome}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fiel.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {fiel.comunidadeNomeCurto}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetalhe(fiel)}>
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
              {detalhe ? `${detalhe.nome} ${detalhe.sobrenome}` : ""}
            </SheetTitle>
          </SheetHeader>

          {detalhe ? (
            <div className="flex flex-col gap-0 px-4">
              <InfoRow label="E-mail" valor={detalhe.email} />
              <InfoRow label="Comunidade" valor={detalhe.comunidadeNome} borda />
              <InfoRow label="Data de nascimento" valor={detalhe.dataNascimento} borda />
              <InfoRow label="Endereço" valor={detalhe.endereco} borda />
              <InfoRow label="Membro desde" valor={detalhe.membroDesde} borda />
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
