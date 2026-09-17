import { Link, useRouter } from "expo-router";
import { Check, Church, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authClient } from "@/lib/auth-client";
import { useCorIcone } from "@/lib/use-cor-icone";

export default function LoginScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [continuarLogado, setContinuarLogado] = useState(true);

  async function handleEntrar() {
    setErro(null);
    setEntrando(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password: senha,
        rememberMe: continuarLogado,
      });

      if (error) {
        setErro("E-mail ou senha incorretos.");
        return;
      }

      router.replace("/avisos");
    } catch {
      setErro("Não foi possível conectar ao servidor. Confira sua conexão.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <View className="items-center">
          <View className="size-20 items-center justify-center rounded-3xl bg-accent">
            <Church size={36} strokeWidth={1.75} color="#7C3AED" />
          </View>

          <Text className="mt-6 font-serif text-5xl text-foreground">Paróquia</Text>

          <Text className="mt-4 text-center text-base text-muted-foreground">
            Entre para acompanhar seu{"\n"}dízimo e seus pedidos.
          </Text>
        </View>

        <View className="mt-10 gap-5">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">E-mail</Text>
            <View className="h-14 flex-row items-center gap-3 rounded-full bg-muted px-4">
              <Mail size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />
              <TextInput
                placeholder="voce@exemplo.com.br"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                className="flex-1 text-base text-foreground"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Senha</Text>
            <View className="h-14 flex-row items-center gap-3 rounded-full bg-muted px-4">
              <Lock size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />
              <TextInput
                placeholder="Sua senha"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                value={senha}
                onChangeText={setSenha}
                className="flex-1 text-base text-foreground"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
                accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />
                ) : (
                  <Eye size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />
                )}
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => setContinuarLogado((v) => !v)}
            className="flex-row items-center gap-2.5 self-start"
            hitSlop={8}
          >
            <View
              className={`size-5 items-center justify-center rounded-md border-2 ${
                continuarLogado ? "border-primary bg-primary" : "border-muted-foreground/40 bg-transparent"
              }`}
            >
              {continuarLogado ? <Check size={13} strokeWidth={3} color="#FFFFFF" /> : null}
            </View>
            <Text className="text-sm text-muted-foreground">Continuar logado</Text>
          </Pressable>

          {erro ? <Text className="text-center text-sm text-red-600">{erro}</Text> : null}

          <Pressable
            onPress={handleEntrar}
            disabled={entrando}
            className="mt-2 h-14 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            {entrando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-primary-foreground">Entrar</Text>
            )}
          </Pressable>
        </View>

        <View className="mt-6 items-center gap-3">
          <Text className="text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-bold text-primary">
              Criar conta
            </Link>
          </Text>
          <Text className="text-sm text-muted-foreground underline">
            Ver os avisos sem entrar
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
