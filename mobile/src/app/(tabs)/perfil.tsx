import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { Bell, ChevronRight, HandCoins, HandHeart, History, IdCard, LogOut } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authClient } from "@/lib/auth-client";
import { buscarPerfilFiel, type PerfilFiel } from "@/lib/api";
import { TEMA_STORAGE_KEY, type Tema } from "@/lib/tema";
import { useCorIcone } from "@/lib/use-cor-icone";

const TEMAS: { id: Tema; label: string }[] = [
  { id: "claro", label: "Claro" },
  { id: "escuro", label: "Escuro" },
];

export default function PerfilScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const tema: Tema = colorScheme === "dark" ? "escuro" : "claro";
  const [perfil, setPerfil] = useState<PerfilFiel | null>(null);
  const [carregando, setCarregando] = useState(true);

  function selecionarTema(novoTema: Tema) {
    setColorScheme(novoTema === "escuro" ? "dark" : "light");
    AsyncStorage.setItem(TEMA_STORAGE_KEY, novoTema);
  }

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      buscarPerfilFiel()
        .then((dados) => {
          if (ativo) setPerfil(dados);
        })
        .finally(() => {
          if (ativo) setCarregando(false);
        });
      return () => {
        ativo = false;
      };
    }, []),
  );

  async function handleSair() {
    await authClient.signOut();
    router.replace("/");
  }

  if (carregando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#7C3AED" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 px-6 pb-10 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-4xl font-extrabold text-foreground">Perfil</Text>

        <View className="flex-row items-center gap-4">
          <View className="size-20 items-center justify-center rounded-full bg-accent">
            <Text className="text-3xl font-extrabold text-primary">
              {perfil?.nome.charAt(0) ?? "?"}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-xl font-bold text-foreground">
              {perfil ? `${perfil.nome} ${perfil.sobrenome}` : "—"}
            </Text>
            <Text className="text-base text-muted-foreground">{perfil?.email}</Text>
            <Text className="text-base font-bold text-primary">
              Fiel da {perfil?.comunidadeNome}
            </Text>
          </View>
        </View>

        <View className="gap-0">
          <View className="h-px bg-muted" />
          <MenuRow
            icon={<HandHeart size={20} strokeWidth={1.75} color="#7C3AED" />}
            titulo="Meu dízimo"
            onPress={() => router.push("/dizimo")}
          />
          <View className="h-px bg-muted" />
          <MenuRow
            icon={<History size={20} strokeWidth={1.75} color="#7C3AED" />}
            titulo="Histórico de dízimos"
            onPress={() => router.push("/dizimo/historico")}
          />
          <View className="h-px bg-muted" />
          <MenuRow
            icon={<HandCoins size={20} strokeWidth={1.75} color="#7C3AED" />}
            titulo="Histórico de doações"
            onPress={() => router.push("/ofertar/historico")}
          />
          <View className="h-px bg-muted" />
          <MenuRow
            icon={<IdCard size={20} strokeWidth={1.75} color="#7C3AED" />}
            titulo="Minhas informações"
            onPress={() => router.push("/perfil/editar")}
          />
          <View className="h-px bg-muted" />
          <MenuRow
            icon={<Bell size={20} strokeWidth={1.75} color="#7C3AED" />}
            titulo="Notificações"
            onPress={() => router.push("/notificacoes")}
          />
          <View className="h-px bg-muted" />
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Aparência</Text>
          <View className="flex-row gap-3">
            {TEMAS.map(({ id, label }) => {
              const selecionado = tema === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => selecionarTema(id)}
                  className={`h-12 items-center justify-center rounded-full px-5 ${
                    selecionado ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <Text
                    className={`text-base font-bold ${
                      selecionado ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleSair}
          className="h-12 w-32 flex-row items-center justify-center gap-2 self-start rounded-full bg-muted active:opacity-80"
        >
          <LogOut size={18} strokeWidth={2} color="#DC2626" />
          <Text className="text-base font-bold text-red-600">Sair</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  titulo,
  subtitulo,
  onPress,
}: {
  icon: React.ReactNode;
  titulo: string;
  subtitulo?: string;
  onPress?: () => void;
}) {
  const corIcone = useCorIcone();

  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-4 py-4 active:opacity-70">
      <View className="size-11 items-center justify-center rounded-full bg-accent">{icon}</View>
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-bold text-foreground">{titulo}</Text>
        {subtitulo ? (
          <Text className="text-sm text-muted-foreground">{subtitulo}</Text>
        ) : null}
      </View>
      <ChevronRight size={20} strokeWidth={2} color={corIcone.mutedForeground} />
    </Pressable>
  );
}
