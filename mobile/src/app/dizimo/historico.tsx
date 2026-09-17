import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buscarDizimo, type HistoricoDizimoItem } from "@/lib/api";
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

function detalheStatus(item: HistoricoDizimoItem): string {
  if (item.status === "pago") return `Pago em ${item.pagoEm ?? "—"}`;
  if (item.status === "isento") return "Isento";
  return "Em aberto";
}

export default function HistoricoDizimoScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
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
          setHistorico(dados.historico);
        }
        setCarregando(false);
      });
      return () => {
        ativo = false;
      };
    }, []),
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
        <Text className="flex-1 text-center text-lg font-bold text-foreground">
          Histórico de dízimos
        </Text>
        <View className="w-8" />
      </View>

      {carregando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : erro || historico.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-muted-foreground">
            {erro ?? "Nenhum pagamento registrado ainda."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="px-6 pb-10 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {historico.map((item, index) => (
            <HistoricoRow
              key={`${item.mes}-${item.ano}`}
              titulo={`${MESES[item.mes - 1]} de ${item.ano}`}
              status={item.status}
              detalhe={detalheStatus(item)}
              valor={item.valor != null ? formatarMoeda(item.valor) : "—"}
              borda={index < historico.length - 1}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
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
