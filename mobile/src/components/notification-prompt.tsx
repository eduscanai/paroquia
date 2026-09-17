import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bell, Calendar, HandCoins, Megaphone } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

const STORAGE_KEY = "notification-prompt-dismissed";

const BENEFICIOS = [
  {
    icon: Calendar,
    titulo: "A missa que você acompanha",
    descricao: "Um lembrete uma hora antes, só da sua comunidade.",
  },
  {
    icon: HandCoins,
    titulo: "O dia do seu dízimo",
    descricao: "No dia que você escolheu, com o Pix a um toque.",
  },
  {
    icon: Megaphone,
    titulo: "Só o aviso importante",
    descricao: "No máximo dois por semana, e nunca depois das 21h.",
  },
];

export function NotificationPrompt() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((dispensado) => {
      if (!dispensado) {
        const timeout = setTimeout(() => setVisivel(true), 600);
        return () => clearTimeout(timeout);
      }
    });
  }, []);

  function dispensar() {
    setVisivel(false);
    AsyncStorage.setItem(STORAGE_KEY, "true");
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={dispensar}>
      <View className="flex-1 justify-end bg-black/40">
        <Pressable className="absolute inset-0" onPress={dispensar} />

        <View className="gap-5 rounded-t-3xl bg-background px-6 pb-10 pt-3">
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-muted" />
          </View>

          <View className="size-16 items-center justify-center rounded-full bg-accent">
            <Bell size={28} strokeWidth={1.75} color="#7C3AED" />
          </View>

          <View className="gap-2">
            <Text className="text-3xl font-extrabold text-foreground">
              Quer receber os avisos da paróquia?
            </Text>
            <Text className="text-base text-muted-foreground">
              São poucos, e você escolhe quais. Nada de propaganda.
            </Text>
          </View>

          <View className="gap-4">
            {BENEFICIOS.map(({ icon: Icon, titulo, descricao }) => (
              <View key={titulo} className="flex-row items-start gap-4">
                <View className="size-11 items-center justify-center rounded-full bg-accent">
                  <Icon size={20} strokeWidth={1.75} color="#7C3AED" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-bold text-foreground">{titulo}</Text>
                  <Text className="text-sm text-muted-foreground">{descricao}</Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={dispensar}
            className="h-14 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            <Text className="text-base font-bold text-primary-foreground">
              Ativar notificações
            </Text>
          </Pressable>

          <Pressable onPress={dispensar} hitSlop={8}>
            <Text className="text-center text-base font-medium text-muted-foreground">
              Agora não
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
