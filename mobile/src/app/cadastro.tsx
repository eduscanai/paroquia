import { Link, useRouter } from "expo-router";
import { Calendar, Eye, EyeOff, Lock, Mail, MapPin, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { authClient } from "@/lib/auth-client";
import { buscarComunidades, cadastrarFiel, type Comunidade } from "@/lib/api";
import { dataBrParaISO, formatarDataDigitada } from "@/lib/format";
import { useCorIcone } from "@/lib/use-cor-icone";

export default function CadastroScreen() {
  const router = useRouter();
  const corIcone = useCorIcone();
  const [showPassword, setShowPassword] = useState(false);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [dataNascimentoBr, setDataNascimentoBr] = useState("");
  const [endereco, setEndereco] = useState("");
  const [comunidadeId, setComunidadeId] = useState<string | null>(null);

  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [carregandoComunidades, setCarregandoComunidades] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarComunidades()
      .then(setComunidades)
      .catch(() => setErro("Não foi possível carregar as comunidades. Confira sua conexão."))
      .finally(() => setCarregandoComunidades(false));
  }, []);

  async function handleCadastro() {
    setErro(null);

    const dataNascimentoISO = dataBrParaISO(dataNascimentoBr);

    if (!nome || !sobrenome || !email || !senha || !dataNascimentoISO || !comunidadeId || !endereco) {
      setErro("Preencha todos os campos com uma data de nascimento válida.");
      return;
    }

    setEnviando(true);

    try {
      const resultado = await cadastrarFiel({
        nome,
        sobrenome,
        email,
        senha,
        dataNascimento: dataNascimentoISO,
        comunidadeId,
        endereco,
      });

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }

      // Garante que o cliente do app guarde a sessão corretamente (o
      // cadastro já loga no servidor, mas o cookie precisa passar pelo
      // pipeline do authClient pra ser persistido no celular).
      await authClient.signIn.email({ email, password: senha });

      router.replace("/avisos");
    } catch {
      setErro("Não foi possível conectar ao servidor. Confira sua conexão.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" showsVerticalScrollIndicator={false}>
        <View className="items-center">
          <Text className="font-serif text-4xl text-foreground">Criar conta</Text>

          <Text className="mt-4 text-center text-base text-muted-foreground">
            É rápido. Seus dados ficam com a{"\n"}paróquia.
          </Text>
        </View>

        <View className="mt-10 gap-5">
          <Campo icon={<User size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="Nome">
            <TextInput
              placeholder="Seu primeiro nome"
              placeholderTextColor="#9CA3AF"
              autoComplete="given-name"
              value={nome}
              onChangeText={setNome}
              className="flex-1 text-base text-foreground"
            />
          </Campo>

          <Campo icon={<User size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="Sobrenome">
            <TextInput
              placeholder="Seu sobrenome"
              placeholderTextColor="#9CA3AF"
              autoComplete="family-name"
              value={sobrenome}
              onChangeText={setSobrenome}
              className="flex-1 text-base text-foreground"
            />
          </Campo>

          <Campo icon={<Mail size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="E-mail">
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
          </Campo>

          <Campo
            icon={<Calendar size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />}
            label="Data de nascimento"
          >
            <TextInput
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={dataNascimentoBr}
              onChangeText={(texto) => setDataNascimentoBr(formatarDataDigitada(texto))}
              maxLength={10}
              className="flex-1 text-base text-foreground"
            />
          </Campo>

          <Campo icon={<MapPin size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="Endereço">
            <TextInput
              placeholder="Rua, número, bairro"
              placeholderTextColor="#9CA3AF"
              autoComplete="street-address"
              value={endereco}
              onChangeText={setEndereco}
              className="flex-1 text-base text-foreground"
            />
          </Campo>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Comunidade</Text>
            {carregandoComunidades ? (
              <ActivityIndicator color="#7C3AED" />
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {comunidades.map((comunidade) => {
                  const selecionada = comunidadeId === comunidade.id;
                  return (
                    <Pressable
                      key={comunidade.id}
                      onPress={() => setComunidadeId(comunidade.id)}
                      className={`h-11 items-center justify-center rounded-full px-4 ${
                        selecionada ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          selecionada ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {comunidade.nomeCurto}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <Campo icon={<Lock size={20} strokeWidth={1.75} color={corIcone.mutedForeground} />} label="Senha">
            <TextInput
              placeholder="Pelo menos 8 caracteres"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
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
          </Campo>

          {erro ? <Text className="text-center text-sm text-red-600">{erro}</Text> : null}

          <Pressable
            onPress={handleCadastro}
            disabled={enviando}
            className="mt-2 h-14 items-center justify-center rounded-full bg-primary active:opacity-90"
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-bold text-primary-foreground">Criar conta</Text>
            )}
          </Pressable>
        </View>

        <View className="mt-6 items-center">
          <Text className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/" className="font-bold text-primary">
              Entrar
            </Link>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Campo({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="h-14 flex-row items-center gap-3 rounded-full bg-muted px-4">
        {icon}
        {children}
      </View>
    </View>
  );
}
