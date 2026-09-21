"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Church,
  FileBarChart,
  HandCoins,
  HandHeart,
  LogOut,
  Megaphone,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";

import { AvisosSection } from "./_components/avisos-section";
import { CampanhasSection } from "./_components/campanhas-section";
import { ContasSection } from "./_components/contas-section";
import { DizimistasSection } from "./_components/dizimistas-section";
import { EventosSection } from "./_components/eventos-section";
import { FieisSection } from "./_components/fieis-section";
import { RelatorioSection } from "./_components/relatorio-section";
import type {
  Aviso,
  Campanha,
  Comunidade,
  Dizimista,
  Evento,
  Fiel,
  RelatorioDizimo,
  RelatorioOferta,
  SemDirecionamento,
} from "./_components/types";

const ABAS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "avisos", label: "Avisos", icon: Megaphone },
  { id: "eventos", label: "Eventos", icon: CalendarDays },
  { id: "fieis", label: "Fiéis", icon: Users },
  { id: "dizimistas", label: "Dizimistas", icon: HandHeart },
  { id: "campanhas", label: "Campanhas", icon: HandCoins },
  { id: "relatorio", label: "Relatório", icon: FileBarChart },
  { id: "contas", label: "Contas", icon: UserPlus },
];

type Aba = (typeof ABAS)[number]["id"];

const NIVEIS_COM_PAINEL = ["comunidade", "paroquia", "desenvolvedor"];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessaoCarregando } = authClient.useSession();
  const role = session?.user?.role;

  const [comunidades, setComunidades] = useState<Comunidade[] | null>(null);
  const [erroComunidade, setErroComunidade] = useState<string | null>(null);
  // Lê a aba pretendida da URL (?aba=...) uma única vez, no carregamento —
  // é assim que as páginas de editar aviso/campanha voltam pra aba certa.
  const [aba, setAba] = useState<Aba>(() => {
    if (typeof window === "undefined") return "avisos";
    const params = new URLSearchParams(window.location.search);
    const valor = params.get("aba");
    return (ABAS.some((item) => item.id === valor) ? valor : "avisos") as Aba;
  });
  const [comunidadeFiltro, setComunidadeFiltro] = useState<string | null>(null);

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [fieis, setFieis] = useState<Fiel[]>([]);
  const [dizimistas, setDizimistas] = useState<Dizimista[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [semDirecionamento, setSemDirecionamento] = useState<SemDirecionamento>({
    total: 0,
    quantidade: 0,
    totalNaoCreditado: 0,
    quantidadeNaoCreditada: 0,
  });
  const [relatorioOfertas, setRelatorioOfertas] = useState<RelatorioOferta[]>([]);
  const [relatorioDizimos, setRelatorioDizimos] = useState<RelatorioDizimo[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);

  const carregarDados = useCallback(async (comunidadeIds: string[]) => {
    setCarregandoDados(true);
    try {
      const [resAvisos, resEventos, resFieis, resDizimistas, resCampanhas, resRelatorio] =
        await Promise.all([
          fetch("/api/avisos"),
          fetch("/api/eventos"),
          fetch("/api/comunidade/fieis"),
          fetch("/api/comunidade/dizimistas"),
          fetch("/api/campanhas"),
          fetch("/api/relatorio"),
        ]);
      const [dadosAvisos, dadosEventos, dadosFieis, dadosDizimistas, dadosCampanhas, dadosRelatorio] =
        await Promise.all([
          resAvisos.json(),
          resEventos.json(),
          resFieis.json(),
          resDizimistas.json(),
          resCampanhas.json(),
          resRelatorio.json(),
        ]);

      setAvisos(
        ((dadosAvisos.avisos ?? []) as Aviso[]).filter((aviso) =>
          comunidadeIds.includes(aviso.comunidadeId),
        ),
      );
      setEventos(
        ((dadosEventos.eventos ?? []) as Evento[]).filter((evento) =>
          comunidadeIds.includes(evento.comunidadeId),
        ),
      );
      setFieis(dadosFieis.fieis ?? []);
      setDizimistas(dadosDizimistas.dizimistas ?? []);
      setCampanhas(
        ((dadosCampanhas.campanhas ?? []) as Campanha[]).filter(
          (campanha) => campanha.comunidadeId === null || comunidadeIds.includes(campanha.comunidadeId),
        ),
      );
      setSemDirecionamento(
        dadosCampanhas.semDirecionamento ?? {
          total: 0,
          quantidade: 0,
          totalNaoCreditado: 0,
          quantidadeNaoCreditada: 0,
        },
      );
      setRelatorioOfertas(dadosRelatorio.ofertas ?? []);
      setRelatorioDizimos(dadosRelatorio.dizimos ?? []);
    } finally {
      setCarregandoDados(false);
    }
  }, []);

  useEffect(() => {
    if (!role || !NIVEIS_COM_PAINEL.includes(role)) return;

    if (role === "comunidade") {
      fetch("/api/comunidade/me")
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            setErroComunidade(data.error ?? "Não foi possível carregar sua comunidade.");
            return;
          }
          setComunidades([data.comunidade]);
          await carregarDados([data.comunidade.id]);
        })
        .catch(() => {
          setErroComunidade("Não foi possível conectar ao servidor.");
        });
      return;
    }

    // paroquia / desenvolvedor: administram todas as comunidades da paróquia.
    fetch("/api/comunidades")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErroComunidade(data.error ?? "Não foi possível carregar as comunidades.");
          return;
        }
        const todas: Comunidade[] = data.comunidades ?? [];
        setComunidades(todas);
        await carregarDados(todas.map((c) => c.id));
      })
      .catch(() => {
        setErroComunidade("Não foi possível conectar ao servidor.");
      });
  }, [role, carregarDados]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  // Filtro de comunidade: uma única seleção no topo estreita os dados em
  // todas as abas ao mesmo tempo — itens sem comunidade (campanha/oferta da
  // paróquia inteira) continuam aparecendo, já que valem pra todo mundo.
  const avisosFiltrados = useMemo(
    () => (comunidadeFiltro ? avisos.filter((a) => a.comunidadeId === comunidadeFiltro) : avisos),
    [avisos, comunidadeFiltro],
  );
  const eventosFiltrados = useMemo(
    () => (comunidadeFiltro ? eventos.filter((e) => e.comunidadeId === comunidadeFiltro) : eventos),
    [eventos, comunidadeFiltro],
  );
  const fieisFiltrados = useMemo(
    () => (comunidadeFiltro ? fieis.filter((f) => f.comunidadeId === comunidadeFiltro) : fieis),
    [fieis, comunidadeFiltro],
  );
  const dizimistasFiltrados = useMemo(
    () =>
      comunidadeFiltro
        ? dizimistas.filter((d) => d.comunidadeId === comunidadeFiltro)
        : dizimistas,
    [dizimistas, comunidadeFiltro],
  );
  const campanhasFiltradas = useMemo(
    () =>
      comunidadeFiltro
        ? campanhas.filter((c) => c.comunidadeId === null || c.comunidadeId === comunidadeFiltro)
        : campanhas,
    [campanhas, comunidadeFiltro],
  );
  const relatorioOfertasFiltradas = useMemo(
    () =>
      comunidadeFiltro
        ? relatorioOfertas.filter((o) => o.comunidadeId === null || o.comunidadeId === comunidadeFiltro)
        : relatorioOfertas,
    [relatorioOfertas, comunidadeFiltro],
  );
  const relatorioDizimosFiltrados = useMemo(
    () =>
      comunidadeFiltro
        ? relatorioDizimos.filter((d) => d.comunidadeId === comunidadeFiltro)
        : relatorioDizimos,
    [relatorioDizimos, comunidadeFiltro],
  );

  const avisosFixados = avisosFiltrados.filter((aviso) => aviso.fixado).length;
  const hojeISO = new Date().toISOString().slice(0, 10);
  const eventosFuturos = eventosFiltrados.filter((evento) => evento.data >= hojeISO).length;
  const campanhasAtivas = campanhasFiltradas.filter((campanha) => campanha.ativa);
  const arrecadadoTotal =
    campanhasAtivas.reduce((soma, c) => soma + c.arrecadado, 0) + semDirecionamento.totalNaoCreditado;
  const metaTotal = campanhasAtivas.reduce((soma, c) => soma + c.meta, 0);

  const tituloEscopo =
    comunidades && comunidades.length === 1 ? comunidades[0].nome : "Toda a paróquia";
  const multiComunidade = (comunidades?.length ?? 0) > 1;
  const temPainel = !!role && NIVEIS_COM_PAINEL.includes(role);

  return (
    <div className="flex min-h-screen">
      {temPainel && comunidades ? (
        <aside className="flex w-60 shrink-0 flex-col border-r bg-white">
          <div className="flex items-center gap-3 px-5 py-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <Church className="size-5 text-primary" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-xl leading-tight text-foreground">Paróquia</p>
              <p className="truncate text-xs text-muted-foreground">{tituloEscopo}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {ABAS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAba(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    aba === item.id
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={18} strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto px-5 py-5">
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              <LogOut />
              Sair
            </Button>
          </div>
        </aside>
      ) : null}

      <main className="min-w-0 flex-1">
        <div className="px-8 py-8 xl:px-12">
          {!temPainel ? (
            <header className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-accent">
                  <Church className="size-5 text-primary" strokeWidth={1.75} />
                </div>
                <p className="font-serif text-2xl leading-tight text-foreground">Paróquia</p>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut />
                Sair
              </Button>
            </header>
          ) : null}

          {sessaoCarregando ? null : !temPainel ? (
            <PainelIndisponivel role={role} />
          ) : erroComunidade ? (
            <p className="text-sm text-destructive">{erroComunidade}</p>
          ) : !comunidades ? null : (
            <div className="flex flex-col gap-8">
              {multiComunidade ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Visualizando
                  </span>
                  <button
                    type="button"
                    onClick={() => setComunidadeFiltro(null)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      comunidadeFiltro === null
                        ? "border-transparent bg-accent text-primary"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Todas
                  </button>
                  {comunidades.map((comunidade) => (
                    <button
                      key={comunidade.id}
                      type="button"
                      onClick={() => setComunidadeFiltro(comunidade.id)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                        comunidadeFiltro === comunidade.id
                          ? "border-transparent bg-accent text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {comunidade.nomeCurto}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  icon={Megaphone}
                  value={carregandoDados ? "—" : `${avisosFixados}/${avisosFiltrados.length}`}
                  label="Avisos fixados"
                />
                <StatCard
                  icon={CalendarDays}
                  value={carregandoDados ? "—" : String(eventosFuturos)}
                  label="Próximos eventos"
                />
                <StatCard
                  icon={Users}
                  value={carregandoDados ? "—" : String(fieisFiltrados.length)}
                  label={fieisFiltrados.length === 1 ? "Fiel cadastrado" : "Fiéis cadastrados"}
                />
                <StatCard
                  icon={HandCoins}
                  value={carregandoDados ? "—" : formatarMoeda(arrecadadoTotal)}
                  label={`Arrecadado · meta ${formatarMoeda(metaTotal)}`}
                />
              </div>

              {aba === "avisos" ? (
                <AvisosSection
                  comunidades={comunidades}
                  avisos={avisosFiltrados}
                  carregando={carregandoDados}
                  onAlterado={() => carregarDados(comunidades.map((c) => c.id))}
                />
              ) : aba === "eventos" ? (
                <EventosSection
                  comunidades={comunidades}
                  eventos={eventosFiltrados}
                  carregando={carregandoDados}
                  onAlterado={() => carregarDados(comunidades.map((c) => c.id))}
                />
              ) : aba === "fieis" ? (
                <FieisSection
                  fieis={fieisFiltrados}
                  carregando={carregandoDados}
                  comunidades={comunidades}
                />
              ) : aba === "dizimistas" ? (
                <DizimistasSection
                  dizimistas={dizimistasFiltrados}
                  carregando={carregandoDados}
                  multiComunidade={multiComunidade}
                />
              ) : aba === "campanhas" ? (
                <CampanhasSection
                  comunidades={comunidades}
                  campanhas={campanhasFiltradas}
                  semDirecionamento={semDirecionamento}
                  carregando={carregandoDados}
                  onAlterado={() => carregarDados(comunidades.map((c) => c.id))}
                />
              ) : aba === "relatorio" ? (
                <RelatorioSection
                  ofertas={relatorioOfertasFiltradas}
                  dizimos={relatorioDizimosFiltrados}
                  carregando={carregandoDados}
                  multiComunidade={multiComunidade}
                />
              ) : (
                <ContasSection comunidades={comunidades} role={role ?? ""} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <Card className="shadow-none ring-1 ring-border">
      <CardContent className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent">
          <Icon className="size-5 text-primary" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold whitespace-nowrap text-foreground">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PainelIndisponivel({ role }: { role: string | undefined }) {
  const mensagem =
    role === "fiel"
      ? "Contas de fiel usam apenas o aplicativo."
      : role
        ? `O painel para o nível "${role}" ainda não foi construído.`
        : "Não foi possível identificar o nível desta conta.";

  return <p className="text-sm text-muted-foreground">{mensagem}</p>;
}
