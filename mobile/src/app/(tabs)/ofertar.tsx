import { useFocusEffect, useRouter } from "expo-router";
import { Check, HandCoins, History } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { buscarCampanhas, type Campanha } from "@/lib/api";
import { formatarMoeda, formatarNumero } from "@/lib/format";
import { useCorIcone } from "@/lib/use-cor-icone";

const VALORES_PRESET = [10, 20, 50, 100];

export default function OfertarScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const [valorPreset, setValorPreset] = useState<number | null>(50);
  const [custoDigitos, setCustoDigitos] = useState("");
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      buscarCampanhas()
        .then((dados) => {
          if (ativo) setCampanhas(dados.filter((campanha) => campanha.ativa));
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
      return () => {
        ativo = false;
      };
    }, []),
  );

  const usandoCustom = custoDigitos.length > 0;
  const valorCustom = custoDigitos ? Number(custoDigitos) / 100 : 0;
  const valorCustomTexto = formatarNumero(valorCustom);
  const valor = usandoCustom ? valorCustom : (valorPreset ?? 0);
  const [destino, setDestino] = useState("geral");

  function selecionarPreset(preset: number) {
    setValorPreset(preset);
    setCustoDigitos("");
  }

  function onChangeCustom(texto: string) {
    const digitos = texto.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    setCustoDigitos(digitos);
  }

  function handleOfertar() {
    if (valor <= 0) return;
    router.push({
      pathname: "/ofertar/pix",
      params: { valor: String(valor), campanhaId: destino === "geral" ? "" : destino },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-6 pb-4 pt-6">
        <Text className="text-4xl font-extrabold text-foreground">Ofertar</Text>
        <Pressable
          onPress={() => router.push("/ofertar/historico")}
          hitSlop={8}
          accessibilityLabel="Minhas ofertas"
        >
          <History size={24} strokeWidth={2} color={corIcone.foreground} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-6 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <Text className="text-base font-bold text-foreground">Quanto você quer ofertar?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3"
          >
            {VALORES_PRESET.map((preset) => {
              const selecionado = !usandoCustom && valorPreset === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => selecionarPreset(preset)}
                  className={`h-12 items-center justify-center rounded-full px-5 ${
                    selecionado ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-base font-bold ${
                      selecionado ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {formatarMoeda(preset)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Outro valor</Text>
          <View className="h-14 flex-row items-center gap-1.5 rounded-full bg-muted px-4">
            <Text
              className={`text-base ${usandoCustom ? "text-foreground" : "text-muted-foreground"}`}
            >
              R$
            </Text>
            <TextInput
              value={valorCustomTexto}
              onChangeText={onChangeCustom}
              selection={{ start: valorCustomTexto.length, end: valorCustomTexto.length }}
              keyboardType="number-pad"
              className={`flex-1 text-base ${usandoCustom ? "text-foreground" : "text-muted-foreground"}`}
            />
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-base font-bold text-foreground">Para onde vai</Text>

          <DestinoCard
            titulo="Onde for mais necessário"
            descricao="A paróquia decide o destino."
            selecionado={destino === "geral"}
            onPress={() => setDestino("geral")}
          />

          {carregando ? <ActivityIndicator color="#7C3AED" /> : null}

          {campanhas.map((campanha) => {
            const percentual = Math.min(
              100,
              Math.round((campanha.arrecadado / campanha.meta) * 100),
            );
            return (
              <DestinoCard
                key={campanha.id}
                titulo={campanha.titulo}
                descricao={campanha.descricao}
                selecionado={destino === campanha.id}
                onPress={() => setDestino(campanha.id)}
              >
                <View className="gap-2">
                  <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percentual}%` }}
                    />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">
                      {formatarMoeda(campanha.arrecadado)} de {formatarMoeda(campanha.meta)}
                    </Text>
                    <Text className="text-sm font-bold text-foreground">{percentual}%</Text>
                  </View>
                </View>
              </DestinoCard>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <Pressable
          onPress={handleOfertar}
          disabled={valor <= 0}
          className="h-14 flex-row items-center justify-center gap-2 rounded-full bg-primary active:opacity-90 disabled:opacity-50"
        >
          <HandCoins size={20} strokeWidth={2} color="#FFFFFF" />
          <Text className="text-base font-bold text-primary-foreground">
            Ofertar {formatarMoeda(Math.max(valor, 0))}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function DestinoCard({
  titulo,
  descricao,
  selecionado,
  onPress,
  children,
}: {
  titulo: string;
  descricao: string;
  selecionado: boolean;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`gap-3 rounded-2xl p-4 ${
        selecionado ? "border-2 border-primary" : "border border-muted"
      }`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-base font-bold text-foreground">{titulo}</Text>
          <Text className="text-sm text-muted-foreground">{descricao}</Text>
        </View>
        {selecionado ? (
          <View className="size-6 items-center justify-center rounded-full bg-primary">
            <Check size={14} strokeWidth={3} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
      {children}
    </Pressable>
  );
}
