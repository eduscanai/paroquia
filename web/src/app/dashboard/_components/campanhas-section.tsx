"use client";

import { useRouter } from "next/navigation";
import { Compass, Pencil, Plus, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Paginacao } from "./paginacao";
import type { Campanha, Comunidade, SemDirecionamento } from "./types";
import { usePaginacao } from "./use-paginacao";

const POR_PAGINA = 6;

export function CampanhasSection({
  comunidades,
  campanhas,
  semDirecionamento,
  carregando,
  onAlterado,
}: {
  comunidades: Comunidade[];
  campanhas: Campanha[];
  semDirecionamento: SemDirecionamento;
  carregando: boolean;
  onAlterado: () => void;
}) {
  const router = useRouter();
  const campanhaPriorizada = campanhas.find((c) => c.priorizada) ?? null;

  const { itensPagina, pagina, totalPaginas, total, proxima, anterior } = usePaginacao(
    campanhas,
    POR_PAGINA,
  );

  async function handleExcluir(campanha: Campanha) {
    if (
      !window.confirm(`Excluir a campanha "${campanha.titulo}"? Essa ação não pode ser desfeita.`)
    ) {
      return;
    }

    const res = await fetch(`/api/campanhas/${campanha.id}`, { method: "DELETE" });
    if (res.ok) {
      onAlterado();
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Campanhas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aparecem na tela de Ofertar de{" "}
            {comunidades.length === 1 ? comunidades[0].nomeCurto : "toda a paróquia"}
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/campanhas/novo")}
          className="h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90"
        >
          <Plus />
          Nova campanha
        </Button>
      </div>

      {!carregando ? (
        <div className="flex items-start gap-4 rounded-2xl border border-dashed border-border bg-background p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <Compass size={18} strokeWidth={2} />
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-foreground">Doações sem direcionamento</p>
              <p className="text-sm text-muted-foreground">
                Ofertas feitas escolhendo &ldquo;Onde for mais necessário&rdquo;, sem indicar uma
                campanha específica. Entram no total geral arrecadado da paróquia mesmo assim.{" "}
                {campanhaPriorizada
                  ? `Novas doações desse tipo são creditadas automaticamente em "${campanhaPriorizada.titulo}".`
                  : "Nenhuma campanha está priorizada no momento, então nenhuma tem a meta abatida por elas."}
              </p>
              {semDirecionamento.totalNaoCreditado > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatarMoeda(semDirecionamento.totalNaoCreditado)} (
                  {semDirecionamento.quantidadeNaoCreditada}{" "}
                  {semDirecionamento.quantidadeNaoCreditada === 1 ? "doação" : "doações"}) ainda não
                  contam pra meta de nenhuma campanha.
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                {formatarMoeda(semDirecionamento.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {semDirecionamento.quantidade}{" "}
                {semDirecionamento.quantidade === 1 ? "doação" : "doações"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : campanhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {itensPagina.map((campanha) => {
            const percentual = Math.min(
              100,
              Math.round((campanha.arrecadado / campanha.meta) * 100),
            );
            return (
              <li key={campanha.id} className="flex overflow-hidden rounded-2xl bg-muted/60">
                <div className={cn("w-1", campanha.ativa ? "bg-primary" : "bg-border")} />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {comunidades.length > 1 ? (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                          {campanha.comunidadeNomeCurto ?? "Toda a paróquia"}
                        </span>
                      ) : null}
                      {!campanha.ativa ? (
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                          Inativa
                        </span>
                      ) : null}
                      {campanha.priorizada ? (
                        <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                          <Star size={12} strokeWidth={2} />
                          Priorizada
                        </span>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Editar campanha"
                        onClick={() => router.push(`/dashboard/campanhas/${campanha.id}`)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Excluir campanha"
                        onClick={() => handleExcluir(campanha)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-lg font-bold text-foreground">{campanha.titulo}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {campanha.descricao}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {formatarMoeda(campanha.arrecadado)} de {formatarMoeda(campanha.meta)}
                      </span>
                      <span className="text-sm font-bold text-foreground">{percentual}%</span>
                    </div>
                    {campanha.doacoesSemDirecionamento > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {formatarMoeda(campanha.doacoesSemDirecionamento)} vieram de doações sem
                        direcionamento
                      </p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!carregando && campanhas.length > 0 ? (
        <Paginacao
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={total}
          porPagina={POR_PAGINA}
          onAnterior={anterior}
          onProxima={proxima}
        />
      ) : null}
    </section>
  );
}
