"use client";

import { useMemo, useState } from "react";

import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

import { ArrecadacaoChart } from "./arrecadacao-chart";
import { Paginacao } from "./paginacao";
import type { RelatorioDizimo, RelatorioOferta } from "./types";
import { usePaginacao } from "./use-paginacao";

const POR_PAGINA = 8;

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function formatarData(dataIso: string): string {
  const data = new Date(dataIso);
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function paraDataInput(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

type TipoPeriodo = "tudo" | "7d" | "30d" | "mes" | "trimestre" | "semestre" | "ano" | "personalizado";

const TIPOS_PERIODO: { id: TipoPeriodo; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "mes", label: "Mês" },
  { id: "trimestre", label: "Trimestre" },
  { id: "semestre", label: "Semestre" },
  { id: "ano", label: "Ano" },
  { id: "personalizado", label: "Personalizado" },
];

const pillClass = (ativo: boolean) =>
  cn(
    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
    ativo
      ? "border-transparent bg-accent text-primary"
      : "border-border text-muted-foreground hover:bg-muted",
  );

const seletorClass =
  "h-9 rounded-full border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

const navBotaoClass =
  "flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

function Navegador({
  label,
  onAnterior,
  onProximo,
}: {
  label: string;
  onAnterior: () => void;
  onProximo: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border px-1.5 py-1">
      <button type="button" onClick={onAnterior} className={navBotaoClass} aria-label="Período anterior">
        ‹
      </button>
      <span className="min-w-[11rem] text-center text-sm font-medium text-foreground">{label}</span>
      <button type="button" onClick={onProximo} className={navBotaoClass} aria-label="Próximo período">
        ›
      </button>
    </div>
  );
}

type DataCompleta = { dia: number; mes: number; ano: number };

function SeletorData({
  valor,
  onChange,
  aria,
}: {
  valor: DataCompleta;
  onChange: (valor: DataCompleta) => void;
  aria: string;
}) {
  const diasNoMes = new Date(valor.ano, valor.mes + 1, 0).getDate();
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 8 }, (_, i) => anoAtual - 6 + i);

  return (
    <div className="flex items-center gap-1" role="group" aria-label={aria}>
      <select
        value={valor.dia}
        onChange={(e) => onChange({ ...valor, dia: Number(e.target.value) })}
        className={seletorClass}
        aria-label={`${aria} - dia`}
      >
        {dias.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        value={valor.mes}
        onChange={(e) => {
          const novoMes = Number(e.target.value);
          const maxDia = new Date(valor.ano, novoMes + 1, 0).getDate();
          onChange({ ...valor, mes: novoMes, dia: Math.min(valor.dia, maxDia) });
        }}
        className={seletorClass}
        aria-label={`${aria} - mês`}
      >
        {MESES.map((m, i) => (
          <option key={m} value={i}>
            {capitalizar(m)}
          </option>
        ))}
      </select>
      <select
        value={valor.ano}
        onChange={(e) => onChange({ ...valor, ano: Number(e.target.value) })}
        className={seletorClass}
        aria-label={`${aria} - ano`}
      >
        {anos.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}

export function RelatorioSection({
  ofertas,
  dizimos,
  carregando,
  multiComunidade,
}: {
  ofertas: RelatorioOferta[];
  dizimos: RelatorioDizimo[];
  carregando: boolean;
  multiComunidade: boolean;
}) {
const hoje = new Date();

  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodo>("tudo");

  const [mesCursor, setMesCursor] = useState(hoje.getMonth());
  const [trimestreCursor, setTrimestreCursor] = useState(Math.floor(hoje.getMonth() / 3));
  const [semestreCursor, setSemestreCursor] = useState(hoje.getMonth() < 6 ? 0 : 1);
  const [anoCursor, setAnoCursor] = useState(hoje.getFullYear());

  const [personalizadoInicio, setPersonalizadoInicio] = useState<DataCompleta>({
    dia: hoje.getDate(),
    mes: hoje.getMonth(),
    ano: hoje.getFullYear(),
  });
  const [personalizadoFim, setPersonalizadoFim] = useState<DataCompleta>({
    dia: hoje.getDate(),
    mes: hoje.getMonth(),
    ano: hoje.getFullYear(),
  });

  function selecionarTipo(tipo: TipoPeriodo) {
    const agora = new Date();
    if (tipo === "mes") {
      setMesCursor(agora.getMonth());
      setAnoCursor(agora.getFullYear());
    } else if (tipo === "trimestre") {
      setTrimestreCursor(Math.floor(agora.getMonth() / 3));
      setAnoCursor(agora.getFullYear());
    } else if (tipo === "semestre") {
      setSemestreCursor(agora.getMonth() < 6 ? 0 : 1);
      setAnoCursor(agora.getFullYear());
    } else if (tipo === "ano") {
      setAnoCursor(agora.getFullYear());
    } else if (tipo === "personalizado") {
      const dataAtual = { dia: agora.getDate(), mes: agora.getMonth(), ano: agora.getFullYear() };
      setPersonalizadoInicio(dataAtual);
      setPersonalizadoFim(dataAtual);
    }
    setTipoPeriodo(tipo);
  }

  function navegarMes(delta: number) {
    let mes = mesCursor + delta;
    let ano = anoCursor;
    if (mes < 0) {
      mes = 11;
      ano -= 1;
    } else if (mes > 11) {
      mes = 0;
      ano += 1;
    }
    setMesCursor(mes);
    setAnoCursor(ano);
  }

  function navegarTrimestre(delta: number) {
    let trimestre = trimestreCursor + delta;
    let ano = anoCursor;
    if (trimestre < 0) {
      trimestre = 3;
      ano -= 1;
    } else if (trimestre > 3) {
      trimestre = 0;
      ano += 1;
    }
    setTrimestreCursor(trimestre);
    setAnoCursor(ano);
  }

  function navegarSemestre(delta: number) {
    let semestre = semestreCursor + delta;
    let ano = anoCursor;
    if (semestre < 0) {
      semestre = 1;
      ano -= 1;
    } else if (semestre > 1) {
      semestre = 0;
      ano += 1;
    }
    setSemestreCursor(semestre);
    setAnoCursor(ano);
  }

  const { dataInicio, dataFim } = useMemo(() => {
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    switch (tipoPeriodo) {
      case "7d": {
        const d = new Date(inicioHoje);
        d.setDate(d.getDate() - 6);
        return { dataInicio: paraDataInput(d), dataFim: paraDataInput(inicioHoje) };
      }
      case "30d": {
        const d = new Date(inicioHoje);
        d.setDate(d.getDate() - 29);
        return { dataInicio: paraDataInput(d), dataFim: paraDataInput(inicioHoje) };
      }
      case "mes": {
        const inicio = new Date(anoCursor, mesCursor, 1);
        const fim = new Date(anoCursor, mesCursor + 1, 0);
        return { dataInicio: paraDataInput(inicio), dataFim: paraDataInput(fim) };
      }
      case "trimestre": {
        const mesInicio = trimestreCursor * 3;
        const inicio = new Date(anoCursor, mesInicio, 1);
        const fim = new Date(anoCursor, mesInicio + 3, 0);
        return { dataInicio: paraDataInput(inicio), dataFim: paraDataInput(fim) };
      }
      case "semestre": {
        const mesInicio = semestreCursor * 6;
        const inicio = new Date(anoCursor, mesInicio, 1);
        const fim = new Date(anoCursor, mesInicio + 6, 0);
        return { dataInicio: paraDataInput(inicio), dataFim: paraDataInput(fim) };
      }
      case "ano": {
        const inicio = new Date(anoCursor, 0, 1);
        const fim = new Date(anoCursor, 11, 31);
        return { dataInicio: paraDataInput(inicio), dataFim: paraDataInput(fim) };
      }
      case "personalizado": {
        const inicio = new Date(
          personalizadoInicio.ano,
          personalizadoInicio.mes,
          personalizadoInicio.dia,
        );
        const fim = new Date(personalizadoFim.ano, personalizadoFim.mes, personalizadoFim.dia);
        return { dataInicio: paraDataInput(inicio), dataFim: paraDataInput(fim) };
      }
      case "tudo":
      default:
        return { dataInicio: "", dataFim: "" };
    }
  }, [tipoPeriodo, mesCursor, trimestreCursor, semestreCursor, anoCursor, personalizadoInicio, personalizadoFim]);

  const ofertasFiltradas = useMemo(
    () =>
      ofertas.filter((o) => {
        const data = o.confirmadoEm.slice(0, 10);
        if (dataInicio && data < dataInicio) return false;
        if (dataFim && data > dataFim) return false;
        return true;
      }),
    [ofertas, dataInicio, dataFim],
  );
  const dizimosFiltrados = useMemo(
    () =>
      dizimos.filter((d) => {
        const data = d.pagoEm.slice(0, 10);
        if (dataInicio && data < dataInicio) return false;
        if (dataFim && data > dataFim) return false;
        return true;
      }),
    [dizimos, dataInicio, dataFim],
  );

  const totalOfertas = ofertasFiltradas.reduce((soma, o) => soma + o.valor, 0);
  const totalDizimos = dizimosFiltrados.reduce((soma, d) => soma + d.valor, 0);

  const paginacaoOfertas = usePaginacao(ofertasFiltradas, POR_PAGINA);
  const paginacaoDizimos = usePaginacao(dizimosFiltrados, POR_PAGINA);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Relatório</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Doações e dízimos confirmados{multiComunidade ? " em toda a paróquia" : ""}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Período
          </span>
          {TIPOS_PERIODO.map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() => selecionarTipo(tipo.id)}
              className={pillClass(tipoPeriodo === tipo.id)}
            >
              {tipo.label}
            </button>
          ))}
        </div>

        {tipoPeriodo === "mes" ? (
          <Navegador
            label={`${capitalizar(MESES[mesCursor])} de ${anoCursor}`}
            onAnterior={() => navegarMes(-1)}
            onProximo={() => navegarMes(1)}
          />
        ) : tipoPeriodo === "trimestre" ? (
          <Navegador
            label={`${trimestreCursor + 1}º trimestre de ${anoCursor}`}
            onAnterior={() => navegarTrimestre(-1)}
            onProximo={() => navegarTrimestre(1)}
          />
        ) : tipoPeriodo === "semestre" ? (
          <Navegador
            label={`${semestreCursor + 1}º semestre de ${anoCursor}`}
            onAnterior={() => navegarSemestre(-1)}
            onProximo={() => navegarSemestre(1)}
          />
        ) : tipoPeriodo === "ano" ? (
          <Navegador
            label={`${anoCursor}`}
            onAnterior={() => setAnoCursor((a) => a - 1)}
            onProximo={() => setAnoCursor((a) => a + 1)}
          />
        ) : tipoPeriodo === "personalizado" ? (
          <div className="flex flex-wrap items-center gap-2">
            <SeletorData valor={personalizadoInicio} onChange={setPersonalizadoInicio} aria="Data inicial" />
            <span className="text-sm text-muted-foreground">até</span>
            <SeletorData valor={personalizadoFim} onChange={setPersonalizadoFim} aria="Data final" />
          </div>
        ) : null}
      </div>

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 p-5">
              <p className="text-sm text-muted-foreground">Ofertas</p>
              <p className="text-2xl font-bold text-foreground">{formatarMoeda(totalOfertas)}</p>
              <p className="text-xs text-muted-foreground">
                {ofertasFiltradas.length} {ofertasFiltradas.length === 1 ? "doação" : "doações"}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-5">
              <p className="text-sm text-muted-foreground">Dízimos</p>
              <p className="text-2xl font-bold text-foreground">{formatarMoeda(totalDizimos)}</p>
              <p className="text-xs text-muted-foreground">
                {dizimosFiltrados.length} {dizimosFiltrados.length === 1 ? "pagamento" : "pagamentos"}
              </p>
            </div>
            <div className="rounded-2xl bg-accent p-5">
              <p className="text-sm text-primary">Total arrecadado</p>
              <p className="text-2xl font-bold text-primary">
                {formatarMoeda(totalOfertas + totalDizimos)}
              </p>
            </div>
          </div>

          <ArrecadacaoChart ofertas={ofertasFiltradas} dizimos={dizimosFiltrados} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-foreground">Ofertas confirmadas</h2>
              {ofertasFiltradas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {ofertas.length === 0
                    ? "Nenhuma doação confirmada ainda."
                    : "Nenhuma doação confirmada nesse período."}
                </p>
              ) : (
                <>
                  <ul className="flex flex-col gap-2">
                    {paginacaoOfertas.itensPagina.map((oferta) => (
                      <li
                        key={oferta.id}
                        className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {oferta.fielNome}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {oferta.campanhaTitulo ?? "Onde for mais necessário"}
                            {multiComunidade && oferta.comunidadeNomeCurto
                              ? ` · ${oferta.comunidadeNomeCurto}`
                              : ""}
                            {" · "}
                            {formatarData(oferta.confirmadoEm)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-green-600">
                          {formatarMoeda(oferta.valor)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <Paginacao
                    pagina={paginacaoOfertas.pagina}
                    totalPaginas={paginacaoOfertas.totalPaginas}
                    total={paginacaoOfertas.total}
                    porPagina={POR_PAGINA}
                    onAnterior={paginacaoOfertas.anterior}
                    onProxima={paginacaoOfertas.proxima}
                  />
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-foreground">Dízimos pagos</h2>
              {dizimosFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {dizimos.length === 0
                    ? "Nenhum dízimo pago ainda."
                    : "Nenhum dízimo pago nesse período."}
                </p>
              ) : (
                <>
                  <ul className="flex flex-col gap-2">
                    {paginacaoDizimos.itensPagina.map((dizimo) => (
                      <li
                        key={dizimo.id}
                        className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {dizimo.fielNome}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {MESES[dizimo.mes - 1]} de {dizimo.ano}
                            {multiComunidade ? ` · ${dizimo.comunidadeNomeCurto}` : ""}
                            {" · "}
                            {formatarData(dizimo.pagoEm)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-green-600">
                          {formatarMoeda(dizimo.valor)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <Paginacao
                    pagina={paginacaoDizimos.pagina}
                    totalPaginas={paginacaoDizimos.totalPaginas}
                    total={paginacaoDizimos.total}
                    porPagina={POR_PAGINA}
                    onAnterior={paginacaoDizimos.anterior}
                    onProxima={paginacaoDizimos.proxima}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
