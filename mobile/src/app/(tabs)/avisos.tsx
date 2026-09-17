import { useFocusEffect, useRouter } from "expo-router";
import { Church, Pin } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FiltroChip } from "@/components/filtro-chip";
import { NotificationPrompt } from "@/components/notification-prompt";
import { PinButton } from "@/components/pin-button";
import { useAvisos } from "@/context/avisos-context";
import { buscarComunidades, type Aviso, type Comunidade } from "@/lib/api";
import { formatarDataRelativa } from "@/lib/date";

export default function AvisosScreen() {
  const { avisos, carregando, togglePin, recarregar } = useAvisos();
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);

  useFocusEffect(
    useCallback(() => {
      buscarComunidades().then(setComunidades);
      recarregar();
    }, [recarregar]),
  );

  const avisosFiltrados = selecionada
    ? avisos.filter((aviso) => aviso.comunidadeId === selecionada)
    : avisos;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <NotificationPrompt />

      <View className="px-6 pb-4 pt-2">
        <Text className="font-serif text-4xl text-foreground">Paróquia</Text>
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

      {carregando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-6 pb-6 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {avisosFiltrados.map((aviso) => (
            <AvisoCard key={aviso.id} aviso={aviso} onTogglePin={() => togglePin(aviso.id)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function AvisoCard({ aviso, onTogglePin }: { aviso: Aviso; onTogglePin: () => void }) {
  const router = useRouter();

  const cabecalho = aviso.fixado ? (
    <View className="flex-row items-center gap-2">
      <View className="flex-row items-center gap-1 rounded-full bg-accent px-2.5 py-1">
        <Pin size={12} strokeWidth={2} color="#7C3AED" />
        <Text className="text-xs font-semibold text-primary">Fixado</Text>
      </View>
      <Text className="text-xs text-muted-foreground">
        · {formatarDataRelativa(aviso.data)} às {aviso.hora}
      </Text>
    </View>
  ) : (
    <Text className="text-xs text-muted-foreground">
      {formatarDataRelativa(aviso.data)} às {aviso.hora}
    </Text>
  );

  if (aviso.imagemUrl) {
    return (
      <Pressable
        onPress={() => router.push(`/aviso/${aviso.id}`)}
        className="overflow-hidden rounded-2xl bg-muted/60 active:opacity-90"
      >
        <Image
          source={{ uri: aviso.imagemUrl }}
          className="aspect-[4/3] w-full bg-muted"
          resizeMode="cover"
        />
        <View className="flex-row">
          <View className="w-1 bg-primary" />
          <View className="flex-1 gap-2 p-4">
            <View className="flex-row items-center justify-between">
              {cabecalho}
              <PinButton pinned={aviso.fixado} onToggle={onTogglePin} size="md" />
            </View>

            <Text className="text-lg font-bold text-foreground">{aviso.titulo}</Text>

            <Text numberOfLines={2} className="text-sm text-muted-foreground">
              {aviso.descricao}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(`/aviso/${aviso.id}`)}
      className="flex-row overflow-hidden rounded-2xl bg-muted/60 active:opacity-80"
    >
      <View className="w-1 bg-primary" />
      <View className="flex-1 gap-2 p-4">
        <View className="flex-row items-center justify-between">
          {cabecalho}
          <PinButton pinned={aviso.fixado} onToggle={onTogglePin} size="md" />
        </View>

        <Text className="text-lg font-bold text-foreground">{aviso.titulo}</Text>

        <Text numberOfLines={2} className="text-sm text-muted-foreground">
          {aviso.descricao}
        </Text>
      </View>
    </Pressable>
  );
}
