import { useFocusEffect, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buscarHistoricoOfertas, type OfertaHistorico } from "@/lib/api";
import { formatarDataHora } from "@/lib/date";
import { formatarMoeda } from "@/lib/format";
import { useCorIcone } from "@/lib/use-cor-icone";

const STATUS_INFO: Record<
  OfertaHistorico["status"],
  { texto: string; cor: string; bg: string }
> = {
  confirmado: { texto: "Confirmada", cor: "text-green-600", bg: "bg-green-100" },
  pendente: { texto: "Pendente", cor: "text-orange-600", bg: "bg-orange-100" },
  expirado: { texto: "Expirada", cor: "text-muted-foreground", bg: "bg-muted" },
};

export default function HistoricoOfertasScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const [ofertas, setOfertas] = useState<OfertaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      buscarHistoricoOfertas()
        .then((dados) => {
          if (ativo) setOfertas(dados);
        })
        .finally(() => {
          if (ativo) setCarregando(false);
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
          Minhas ofertas
        </Text>
        <View className="w-8" />
      </View>

      {carregando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : ofertas.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-muted-foreground">
            Você ainda não fez nenhuma oferta.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-3 px-6 pb-10 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {ofertas.map((oferta) => (
            <OfertaRow key={oferta.id} oferta={oferta} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function OfertaRow({ oferta }: { oferta: OfertaHistorico }) {
  const status = STATUS_INFO[oferta.status];

  return (
    <View className="gap-2 rounded-2xl border border-muted p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-extrabold text-foreground">
          {formatarMoeda(oferta.valor)}
        </Text>
        <View className={`rounded-full px-2.5 py-1 ${status.bg}`}>
          <Text className={`text-xs font-bold ${status.cor}`}>{status.texto}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted-foreground">
        {oferta.campanhaTitulo ?? "Onde for mais necessário"}
      </Text>
      <Text className="text-xs text-muted-foreground">
        {formatarDataHora(new Date(oferta.confirmadoEm ?? oferta.criadoEm))}
      </Text>
    </View>
  );
}
