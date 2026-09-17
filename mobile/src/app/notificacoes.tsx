import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ArrowLeft, BellOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  type NotificationPreferences,
} from "@/data/notification-preferences";
import { enviarNotificacaoDeTeste } from "@/lib/notifications";
import { useCorIcone } from "@/lib/use-cor-icone";

export default function NotificacoesScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [enviandoTeste, setEnviandoTeste] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATION_PREFERENCES_STORAGE_KEY).then((salvo) => {
      if (salvo) setPrefs(JSON.parse(salvo));
    });
  }, []);

  function atualizarPref(chave: keyof NotificationPreferences, valor: boolean) {
    const novasPrefs = { ...prefs, [chave]: valor };
    setPrefs(novasPrefs);
    AsyncStorage.setItem(NOTIFICATION_PREFERENCES_STORAGE_KEY, JSON.stringify(novasPrefs));
  }

  async function onEnviarTeste() {
    setEnviandoTeste(true);
    const enviada = await enviarNotificacaoDeTeste();
    setEnviandoTeste(false);
    if (!enviada) {
      Alert.alert(
        "Não foi possível enviar",
        "Verifique se as notificações estão ativadas para este app nas configurações do celular. Se estiver testando pelo Expo Go no Android, esse recurso só funciona num build próprio do app.",
      );
    }
  }

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
          Notificações
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerClassName="gap-6 px-6 pb-10 pt-2" showsVerticalScrollIndicator={false}>
        <View className="gap-0">
          <SectionLabel texto="Você escolhe" />

          <ToggleRow
            titulo="Lembrete de missa"
            descricao="Uma hora antes, só da sua comunidade"
            valor={prefs.lembreteMissa}
            onValorChange={(v) => atualizarPref("lembreteMissa", v)}
            borda
          />
          <ToggleRow
            titulo="Lembrete do dízimo"
            descricao="No dia 10, e uma vez se o mês virar em aberto"
            valor={prefs.lembreteDizimo}
            onValorChange={(v) => atualizarPref("lembreteDizimo", v)}
            borda
          />
          <ToggleRow
            titulo="Avisos importantes"
            descricao="Só os fixados. No máximo dois por semana."
            valor={prefs.avisosImportantes}
            onValorChange={(v) => atualizarPref("avisosImportantes", v)}
            borda
          />
          <ToggleRow
            titulo="Campanhas"
            descricao="Quando uma campanha chega na metade ou na meta"
            valor={prefs.campanhas}
            onValorChange={(v) => atualizarPref("campanhas", v)}
          />
        </View>

        <View className="flex-row items-start gap-3 rounded-2xl bg-muted p-4">
          <BellOff size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />
          <Text className="flex-1 text-sm text-muted-foreground">
            Nada toca entre <Text className="font-bold text-foreground">21h</Text> e{" "}
            <Text className="font-bold text-foreground">8h</Text>, fora a confirmação de um
            pagamento que você acabou de fazer.
          </Text>
        </View>

        <Text className="text-sm text-muted-foreground">
          As notificações chegam neste aparelho. Se trocar de celular, ative de novo por aqui.
        </Text>

        <Pressable
          onPress={onEnviarTeste}
          disabled={enviandoTeste}
          className="h-14 items-center justify-center rounded-full bg-muted active:opacity-80"
        >
          <Text className="text-base font-bold text-foreground">
            {enviandoTeste ? "Enviando..." : "Enviar uma notificação de teste"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ texto }: { texto: string }) {
  return (
    <Text className="pb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
      {texto}
    </Text>
  );
}

function ToggleRow({
  titulo,
  descricao,
  valor,
  onValorChange,
  borda,
}: {
  titulo: string;
  descricao: string;
  valor: boolean;
  onValorChange: (valor: boolean) => void;
  borda?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between gap-4 py-4 ${borda ? "border-b border-muted" : ""}`}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-bold text-foreground">{titulo}</Text>
        <Text className="text-sm text-muted-foreground">{descricao}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={onValorChange}
        trackColor={{ false: "#E5E7EB", true: "#7C3AED" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
