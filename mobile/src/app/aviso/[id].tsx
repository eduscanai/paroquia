import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Church, Pin, Share as ShareIcon } from "lucide-react-native";
import { Image, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PinButton } from "@/components/pin-button";
import { useAvisos } from "@/context/avisos-context";
import { formatarDataRelativa } from "@/lib/date";
import { useCorIcone } from "@/lib/use-cor-icone";

export default function AvisoDetailScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { avisos, togglePin } = useAvisos();
  const aviso = avisos.find((item) => item.id === id);

  if (!aviso) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1" />
      </SafeAreaView>
    );
  }

  async function onShare() {
    if (!aviso) return;
    try {
      await Share.share({ message: `${aviso.titulo}\n\n${aviso.descricao}` });
    } catch {
      // usuário cancelou o compartilhamento
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Voltar">
          <ArrowLeft size={22} strokeWidth={2} color={corIcone.foreground} />
        </Pressable>
        <Text className="text-lg font-bold text-foreground">Aviso</Text>
        <Pressable onPress={onShare} hitSlop={8} accessibilityLabel="Compartilhar">
          <ShareIcon size={20} strokeWidth={2} color={corIcone.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          {aviso.fixado ? (
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
          )}

          <PinButton pinned={aviso.fixado} onToggle={() => togglePin(aviso.id)} />
        </View>

        <Text className="text-3xl font-bold text-foreground">{aviso.titulo}</Text>

        {aviso.imagemUrl ? (
          <Image
            source={{ uri: aviso.imagemUrl }}
            className="aspect-[4/3] w-full rounded-2xl bg-muted"
            resizeMode="cover"
          />
        ) : null}

        <Text className="text-base leading-6 text-foreground/80">{aviso.descricao}</Text>

        <View className="mt-2 h-px bg-muted" />

        <View className="flex-row items-center gap-2">
          <Church size={18} strokeWidth={1.75} color={corIcone.mutedForeground} />
          <Text className="text-sm text-muted-foreground">{aviso.comunidadeNome}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
