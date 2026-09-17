import { useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, Church, Clock, MapPin } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FiltroChip } from "@/components/filtro-chip";
import { buscarComunidades, buscarEventos, type Comunidade, type Evento } from "@/lib/api";
import { toISODate } from "@/lib/date";
import { useCorIcone } from "@/lib/use-cor-icone";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DIAS_SEMANA_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DIAS_SEMANA_LONGOS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const DOT_COLORS: Record<string, string> = {
  MA: "#7C3AED",
  SP: "#2563EB",
  NF: "#22C55E",
  SR: "#F59E0B",
};

function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}

function formatarCabecalhoDia(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  return `${DIAS_SEMANA_LONGOS[data.getDay()]}, ${dia}`;
}

type DiaGrade = {
  date: Date;
  isCurrentMonth: boolean;
};

function buildGrade(currentMonth: Date): DiaGrade[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startWeekday);
  // Always render 6 full weeks so the calendar's height stays fixed
  // regardless of how many weeks the current month actually spans.
  const totalCells = 6 * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(date.getDate() + i);
    return { date, isCurrentMonth: date.getMonth() === month };
  });
}

export default function CalendarioScreen() {
  const corIcone = useCorIcone();
  const hoje = useMemo(() => new Date(), []);
  const [mesAtual, setMesAtual] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [diaSelecionado, setDiaSelecionado] = useState(hoje);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      buscarComunidades().then((dados) => {
        if (ativo) setComunidades(dados);
      });
      setCarregando(true);
      buscarEventos()
        .then((dados) => {
          if (ativo) setEventos(dados);
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
      return () => {
        ativo = false;
      };
    }, []),
  );

  const grade = useMemo(() => buildGrade(mesAtual), [mesAtual]);

  const eventosFiltrados = useMemo(
    () =>
      selecionada ? eventos.filter((evento) => evento.comunidadeId === selecionada) : eventos,
    [selecionada, eventos],
  );

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const evento of eventosFiltrados) {
      const lista = map.get(evento.data) ?? [];
      lista.push(evento);
      map.set(evento.data, lista);
    }
    return map;
  }, [eventosFiltrados]);

  const eventosDoMes = useMemo(() => {
    const prefixo = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, "0")}`;
    return eventosFiltrados
      .filter((evento) => evento.data.startsWith(prefixo))
      .slice()
      .sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));
  }, [eventosFiltrados, mesAtual]);

  const eventosDoMesPorDia = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const evento of eventosDoMes) {
      const lista = map.get(evento.data) ?? [];
      lista.push(evento);
      map.set(evento.data, lista);
    }
    return [...map.entries()];
  }, [eventosDoMes]);

  function irParaMesAnterior() {
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() - 1, 1));
  }

  function irParaProximoMes() {
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() + 1, 1));
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-6 pb-4 pt-6">
        <Text className="text-4xl font-extrabold text-foreground">Calendário</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-28 grow-0"
        contentContainerClassName="items-start gap-4 px-6 pb-4"
      >
        <FiltroChip
          label="Todas"
          selected={selecionada === null}
          onPress={() => setSelecionada(null)}
          icon={
            <Church
              size={22}
              strokeWidth={1.75}
              color={selecionada === null ? "#7C3AED" : "#6B7280"}
            />
          }
        />
        {comunidades.map((comunidade) => (
          <FiltroChip
            key={comunidade.id}
            label={comunidade.nomeCurto}
            selected={selecionada === comunidade.id}
            onPress={() => setSelecionada(comunidade.id)}
            sigla={comunidade.sigla}
          />
        ))}
      </ScrollView>

      <View className="px-6">
        <View className="rounded-3xl border border-muted p-4">
          <View className="flex-row items-center justify-between px-1 pb-3">
            <Pressable onPress={irParaMesAnterior} hitSlop={8} accessibilityLabel="Mês anterior">
              <ChevronLeft size={22} strokeWidth={2} color={corIcone.mutedForeground} />
            </Pressable>
            <Text className="text-lg font-bold text-foreground">
              {MESES[mesAtual.getMonth()]} de {mesAtual.getFullYear()}
            </Text>
            <Pressable onPress={irParaProximoMes} hitSlop={8} accessibilityLabel="Próximo mês">
              <ChevronRight size={22} strokeWidth={2} color={corIcone.mutedForeground} />
            </Pressable>
          </View>

          <View className="flex-row">
            {DIAS_SEMANA_CURTOS.map((dia) => (
              <Text
                key={dia}
                className="flex-1 text-center text-xs text-muted-foreground"
              >
                {dia}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {grade.map(({ date, isCurrentMonth }) => {
              const selecionado = isSameDay(date, diaSelecionado);
              const ehHoje = isSameDay(date, hoje);
              const eventosDoDia = eventosPorDia.get(toISODate(date)) ?? [];
              const siglasComEvento = [
                ...new Set(eventosDoDia.map((evento) => evento.comunidadeSigla)),
              ].slice(0, 3);

              return (
                <Pressable
                  key={toISODate(date)}
                  onPress={() => setDiaSelecionado(date)}
                  className="items-center gap-1 py-2"
                  style={{ width: `${100 / 7}%` }}
                >
                  <View
                    className={`size-9 items-center justify-center rounded-full ${
                      selecionado ? "bg-primary" : ""
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        selecionado
                          ? "font-bold text-white"
                          : ehHoje
                            ? "font-bold text-primary"
                            : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                      }`}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  <View className="h-1.5 flex-row items-center gap-0.5">
                    {siglasComEvento.map((sigla) => {
                      const cor = DOT_COLORS[sigla];
                      return (
                        <View
                          key={sigla}
                          className="size-1.5 rounded-full"
                          style={
                            cor
                              ? { backgroundColor: cor }
                              : { borderWidth: 1, borderColor: "#9CA3AF" }
                          }
                        />
                      );
                    })}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-6 pb-10 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-base font-bold text-foreground">
          {MESES[mesAtual.getMonth()]} de {mesAtual.getFullYear()}
          <Text className="text-sm font-normal text-muted-foreground">
            {"  ·  "}
            {eventosDoMes.length}{" "}
            {eventosDoMes.length === 1 ? "compromisso" : "compromissos"}
          </Text>
        </Text>

        {carregando ? (
          <ActivityIndicator color="#7C3AED" />
        ) : eventosDoMes.length === 0 ? (
          <Text className="text-sm text-muted-foreground">Nenhum compromisso neste mês.</Text>
        ) : (
          eventosDoMesPorDia.map(([data, eventosDoDia]) => (
            <View key={data} className="gap-2">
              <Text className="text-sm font-bold text-muted-foreground">
                {formatarCabecalhoDia(data)}
              </Text>
              {eventosDoDia.map((evento) => (
                <View key={evento.id} className="gap-1.5 rounded-2xl border border-muted p-4">
                  <Text className="text-base font-bold text-foreground">{evento.titulo}</Text>
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={14} strokeWidth={1.75} color={corIcone.mutedForeground} />
                      <Text className="text-sm text-muted-foreground">
                        {evento.horaInicio} – {evento.horaFim}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <MapPin size={14} strokeWidth={1.75} color={corIcone.mutedForeground} />
                      <Text className="text-sm text-muted-foreground">{evento.local}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
