import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft, QrCode, Settings } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buscarDizimo, type DizimoPerfil, type HistoricoDizimoItem } from "@/lib/api";
import { formatarMoeda } from "@/lib/format";
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

function formatarMesAno(dataISO: string): string {
  const [ano, mes] = dataISO.split("-").map(Number);
  return `${MESES[mes - 1].toLowerCase()} de ${ano}`;
}

export default function DizimoScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const [dizimista, setDizimista] = useState<DizimoPerfil | null>(null);
  const [historico, setHistorico] = useState<HistoricoDizimoItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      buscarDizimo().then((dados) => {
        if (!ativo) return;
        if (!dados) {
          setErro("Você ainda não está cadastrado como dizimista.");
        } else {
          setErro(null);
          setDizimista(dados.dizimista);
          setHistorico(dados.historico);
        }
        setCarregando(false);
      });
      return () => {
        ativo = false;
      };
    }, []),
  );

  const hoje = new Date();
  const mesAtualNum = hoje.getMonth() + 1;
  const anoAtualNum = hoje.getFullYear();
  const itemMesAtual = historico.find(
    (item) => item.mes === mesAtualNum && item.ano === anoAtualNum,
  );
  const mesAtualPago = itemMesAtual?.status === "pago" || itemMesAtual?.status === "isento";
  const historicoAnterior = historico.filter(
    (item) => !(item.mes === mesAtualNum && item.ano === anoAtualNum),
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="w-8"
          accessibilityLabel="Voltar"
        >
          <ArrowLeft size={24} strokeWidth={2} color={corIcone.foreground} />
        </Pressable>
        <Text className="flex-1 text-center text-lg font-bold text-foreground">Meu dízimo</Text>
        <Pressable hitSlop={8} className="w-8 items-end" accessibilityLabel="Configurações">
          <Settings size={22} strokeWidth={2} color={corIcone.foreground} />
        </Pressable>
      </View>

      {carregando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : !dizimista ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-muted-foreground">{erro}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-6 px-6 pb-10 pt-2"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-1 rounded-3xl bg-accent p-5">
            <Text className="text-base text-primary">Dizimista</Text>
            <Text className="text-5xl font-extrabold text-primary">
              {String(dizimista.numero).padStart(3, "0")}
            </Text>
            <Text className="mt-2 text-base text-primary">
              Vence todo dia <Text className="font-bold">{dizimista.diaVencimento}</Text>
              {" · "}
              <Text className="font-bold">{formatarMoeda(dizimista.valorMensal)}</Text>
            </Text>
            <Text className="text-base text-primary/70">
              {dizimista.comunidadeNome} · desde {formatarMesAno(dizimista.dizimistaDesde)}
            </Text>
          </View>

          {!mesAtualPago && (
            <View className="gap-3 rounded-2xl border border-muted p-4">
              <View className="self-start rounded-full bg-orange-100 px-2.5 py-1">
                <Text className="text-xs font-bold text-orange-600">Em aberto</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="gap-0.5">
                  <Text className="text-base font-bold text-foreground">
                    {MESES[mesAtualNum - 1]} de {anoAtualNum}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Vence dia {dizimista.diaVencimento}
                  </Text>
                </View>
                <Text className="text-xl font-extrabold text-foreground">
                  {formatarMoeda(dizimista.valorMensal)}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/dizimo/pagamento",
                    params: {
                      valor: String(dizimista.valorMensal),
                      mes: String(mesAtualNum),
                      ano: String(anoAtualNum),
                    },
                  })
                }
                className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-primary active:opacity-90"
              >
                <QrCode size={18} strokeWidth={2} color="#FFFFFF" />
                <Text className="text-base font-bold text-primary-foreground">Pagar com Pix</Text>
              </Pressable>
              <Text className="text-center text-xs text-muted-foreground">
                Prefere entregar na secretaria? Ela lança para você.
              </Text>
            </View>
          )}

          <View className="gap-0">
            <Text className="text-lg font-bold text-foreground">Histórico</Text>

            {!itemMesAtual && historicoAnterior.length === 0 ? (
              <Text className="py-4 text-sm text-muted-foreground">
                Nenhum pagamento registrado ainda.
              </Text>
            ) : (
              <>
                {itemMesAtual && (
                  <HistoricoRow
                    titulo={`${MESES[mesAtualNum - 1]} de ${anoAtualNum}`}
                    status={itemMesAtual.status}
                    detalhe={detalheStatus(itemMesAtual)}
                    valor={itemMesAtual.valor != null ? formatarMoeda(itemMesAtual.valor) : "—"}
                    borda={historicoAnterior.length > 0}
                  />
                )}
                {historicoAnterior.map((item, index) => (
                  <HistoricoRow
                    key={`${item.mes}-${item.ano}`}
                    titulo={`${MESES[item.mes - 1]} de ${item.ano}`}
                    status={item.status}
                    detalhe={detalheStatus(item)}
                    valor={item.valor != null ? formatarMoeda(item.valor) : "—"}
                    borda={index < historicoAnterior.length - 1}
                  />
                ))}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function detalheStatus(item: HistoricoDizimoItem): string {
  if (item.status === "pago") return `Pago em ${item.pagoEm ?? "—"}`;
  if (item.status === "isento") return "Isento";
  return "Em aberto";
}

function HistoricoRow({
  titulo,
  status,
  detalhe,
  valor,
  borda,
}: {
  titulo: string;
  status: HistoricoDizimoItem["status"];
  detalhe: string;
  valor: string;
  borda: boolean;
}) {
  const cor =
    status === "pago"
      ? "text-green-600"
      : status === "isento"
        ? "text-blue-600"
        : "text-orange-600";

  return (
    <View
      className={`flex-row items-center justify-between py-4 ${borda ? "border-b border-muted" : ""}`}
    >
      <View className="gap-0.5">
        <Text className="text-base font-bold text-foreground">{titulo}</Text>
        <Text className={`text-sm font-medium ${cor}`}>{detalhe}</Text>
      </View>
      <Text className="text-base font-bold text-foreground">{valor}</Text>
    </View>
  );
}
