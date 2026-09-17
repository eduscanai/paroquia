# Publicar nas lojas (App Store e Google Play)

O app mobile é Expo — o caminho oficial pra build e envio é o **EAS** (Expo Application Services). Esse guia cobre do zero até o app aparecer nas duas lojas.

## O que você precisa ter antes de começar

| Item | Onde conseguir | Custo |
|---|---|---|
| Conta Expo | [expo.dev](https://expo.dev/signup) | grátis |
| Apple Developer Program | [developer.apple.com](https://developer.apple.com/programs/enroll/) | US$ 99/ano |
| Google Play Console | [play.google.com/console](https://play.google.com/console/signup) | US$ 25 (taxa única) |
| Mac com Xcode instalado | só é necessário se você quiser rodar o simulador iOS localmente — o build em si roda nos servidores da EAS, não precisa de Mac pra gerar o `.ipa` |

A aprovação da conta Apple Developer costuma levar de algumas horas a 1-2 dias (empresa exige verificação de CNPJ/D-U-N-S).

## Passo 1 — Identidade do app (obrigatório antes do primeiro build)

Hoje o `mobile/app.json` está com valores de template (`"name": "mobile"`, `"slug": "mobile"`, sem `bundleIdentifier`/`package`). Isso precisa ser decidido **antes** do primeiro build de produção — o identificador de pacote não pode ser trocado depois que o app for enviado pela primeira vez.

Edite `mobile/app.json`:

```json
{
  "expo": {
    "name": "Paróquia Santo Antônio",
    "slug": "paroquia-santo-antonio",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "br.com.suaparoquia.app"
    },
    "android": {
      "package": "br.com.suaparoquia.app"
    }
  }
}
```

- `name` — nome exibido embaixo do ícone.
- `slug` — identificador interno do projeto na Expo (pode ser diferente do `name`).
- `bundleIdentifier` / `package` — convenção de domínio invertido (`br.com.dominio.app`), únicos nas duas lojas. Se a paróquia/desenvolvedora tem um domínio próprio, use-o; senão, qualquer identificador único serve, contanto que não exista ainda nas lojas.

## Passo 2 — Instalar a EAS CLI e logar

```bash
npm install -g eas-cli
eas login
```

## Passo 3 — Vincular o projeto à Expo

```bash
cd mobile
eas init
```

Isso cria um projeto na sua conta Expo e grava o `projectId` em `app.json` (campo `extra.eas.projectId`).

O repositório já vem com um [`mobile/eas.json`](../mobile/eas.json) com os perfis `development`, `preview` e `production` — não precisa rodar `eas build:configure` de novo, só ajustar se quiser perfis extras.

## Passo 4 — Ícones e splash screen

Já estão configurados em `app.json` e prontos (ícone principal em `assets/images/icon.png`, 1024×1024 — tamanho que a Apple exige; ícone adaptativo do Android com camadas separadas de fundo/frente/monocromático). Só troque os arquivos em `assets/images/` se quiser um ícone diferente do atual.

## Passo 5 — Build de produção

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

Na primeira vez, a EAS pergunta como lidar com as credenciais de assinatura (certificado iOS, keystore Android) — responda que quer que a **EAS gerencie automaticamente**, é o caminho mais simples e evita ter que guardar certificados manualmente.

O build roda nos servidores da Expo — acompanhe o progresso no link que aparece no terminal (também disponível em [expo.dev](https://expo.dev)). Uma build de produção leva tipicamente de 10 a 25 minutos.

## Passo 6 — Criar o app nas lojas

### App Store Connect (iOS)

1. Entre em [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Apps** → **+** → **Novo app**.
2. Preencha nome, idioma principal, o `bundleIdentifier` do Passo 1, e um SKU (identificador interno livre, ex: `paroquia-app-001`).

### Google Play Console (Android)

1. Entre em [play.google.com/console](https://play.google.com/console) → **Criar app**.
2. Preencha nome, idioma, tipo (app), gratuito.
3. **Importante**: o primeiro envio do Android precisa ser feito manualmente (a EAS não consegue criar sozinha o primeiro "release" por exigência do próprio Google). Faça o upload manual de um `.aab` (gerado no Passo 5, baixável do link da build) em **Produção → Criar nova versão**, ou use uma faixa de teste interno primeiro. Depois desse primeiro upload, envios seguintes podem ser automatizados com `eas submit`.

## Passo 7 — Enviar o build pra loja

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production   # só a partir do 2º envio, veja acima
```

A EAS pede as credenciais da App Store Connect (pode gerar uma [chave de API](https://appstoreconnect.apple.com/access/api) pra automatizar) e do Google (arquivo JSON de uma conta de serviço do Google Cloud com permissão no Play Console).

## Passo 8 — Ficha da loja

Cada loja exige, antes de aprovar a revisão:

- **Screenshots** — tamanhos específicos por dispositivo (a Apple exige pelo menos os do iPhone de tela maior; o Google pede pelo menos 2 telas do telefone). Tire prints do app rodando (Avisos, Ofertar, Perfil são boas telas pra mostrar).
- **Descrição curta e longa**, categoria (sugestão: *Estilo de vida* ou *Referência*).
- **Política de privacidade** — URL obrigatória nas duas lojas. O app coleta dados pessoais (nome, endereço, data de nascimento) e de pagamento (via Mercado Pago) — a política precisa mencionar isso. Pode ser uma página simples hospedada em qualquer lugar (o próprio site da paróquia, por exemplo).
- **Formulário de segurança de dados** (Google) / **rótulo de privacidade** (Apple) — declaração de quais dados o app coleta e pra quê. Com base no que o app faz hoje: nome, e-mail, endereço, data de nascimento (cadastro), e informação de pagamento (Pix via Mercado Pago).
- **Classificação etária** — questionário padrão das lojas; um app de conteúdo religioso/institucional sem conteúdo sensível normalmente cai na faixa livre.

## Passo 9 — Revisão

- **Apple**: costuma levar de algumas horas a 2-3 dias. Rejeições comuns: login que o revisor não consegue testar (**deixe uma conta de teste funcional nas "Notas para o revisor"** — um `fiel` cadastrado, ou peça pro revisor se cadastrar direto pelo app), metadados incompletos, ícone sem seguir as diretrizes de design da Apple.
- **Google**: geralmente mais rápido no teste interno; a revisão pra produção de um app novo pode levar alguns dias, sobretudo por causa da política de dados sensíveis (dados pessoais + pagamento).

## Atualizações depois do lançamento

- Mudança só de JS/lógica (sem tocar em módulos nativos novos) pode, opcionalmente, usar **EAS Update** (OTA) pra não precisar de uma nova revisão de loja a cada ajuste — não está configurado neste projeto ainda; ver [expo.dev/eas-update](https://docs.expo.dev/eas-update/introduction/) se quiser adicionar.
- Sem OTA configurado (como está hoje), toda mudança — por menor que seja — precisa de `npm version` (bump manual do `version` em `app.json`), novo `eas build` e novo `eas submit`.
