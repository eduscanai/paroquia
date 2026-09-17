import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatarMoeda } from "@/lib/format";

export default function OfertarSucessoScreen() {
  const router = useRouter();
  const { valor, dataPagamento } = useLocalSearchParams<{
    valor: string;
    dataPagamento: string;
  }>();
  const valorNum = Number(valor);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="items-center px-6 py-4">
        <Text className="text-lg font-bold text-foreground">Oferta</Text>
      </View>

      <ScrollView
        contentContainerClassName="items-center gap-2 px-6 pb-10 pt-2"
        showsVerticalScrollIndicator={false}
      >
        <View className="size-20 items-center justify-center rounded-full bg-green-500">
          <Check size={40} strokeWidth={3} color="#FFFFFF" />
        </View>

        <Text className="mt-2 text-center text-3xl font-extrabold text-foreground">
          Oferta recebida
        </Text>
        <Text className="text-center text-base text-muted-foreground">
          Que Deus lhe pague. A paróquia agradece.
        </Text>

        <View className="mt-4 w-full gap-0 rounded-2xl bg-muted/60 px-4">
          <ReciboRow
            label="Valor"
            valor={formatarMoeda(valorNum)}
            valorClassName="text-green-600"
          />
          <ReciboRow label="Pago em" valor={dataPagamento ?? "—"} borda />
          <ReciboRow label="Forma" valor="Pix" borda />
        </View>

        <View className="mt-4 w-full gap-3">
          <Pressable
            onPress={() => router.replace("/avisos")}
            className="h-14 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <Text className="text-base font-bold text-primary-foreground">Voltar ao início</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReciboRow({
  label,
  valor,
  valorClassName,
  borda,
}: {
  label: string;
  valor: string;
  valorClassName?: string;
  borda?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-3.5 ${borda ? "border-t border-muted" : ""}`}
    >
      <Text className="text-base text-muted-foreground">{label}</Text>
      <Text className={`text-base font-bold text-foreground ${valorClassName ?? ""}`}>
        {valor}
      </Text>
    </View>
  );
}
