# Configuração do ambiente

Guia completo pra rodar o sistema localmente: banco de dados, painel web e app mobile.

## Arquitetura

Duas aplicações independentes compartilhando um único banco PostgreSQL, autenticadas com [Better Auth](https://www.better-auth.com/):

- **`web/`** — painel administrativo em Next.js. Serve tanto as telas do painel (`/dashboard`) quanto toda a API (`/api/*`) usada pelo app mobile.
- **`mobile/`** — app do fiel em Expo/React Native, que fala com o painel web via HTTP (nunca acessa o banco diretamente).

```
fiel (Expo Go) ──HTTP──> painel web (Next.js, porta 3000) ──> PostgreSQL local
secretaria (navegador) ──────────────┘
```

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente (ou acessível pela rede)
- Uma conta [Mercado Pago](https://www.mercadopago.com.br/developers) com um Access Token (Pix)
- Para testar o mobile num aparelho físico: o app [Expo Go](https://expo.dev/go) instalado, e o celular na **mesma rede Wi-Fi** do computador
- `npm` (os dois projetos usam `package-lock.json`)

## 1. Banco de dados

Crie um banco vazio (nome livre, ex: `paroquia`):

```bash
createdb paroquia
```

## 2. Painel web (`web/`)

### 2.1. Variáveis de ambiente

Crie `web/.env.local`:

```bash
DATABASE_URL=postgresql://usuario:senha@localhost:5432/paroquia
BETTER_AUTH_SECRET=            # string aleatória longa — gere com `openssl rand -base64 32`
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000   # usado para montar a URL pública de imagens enviadas
MERCADOPAGO_ACCESS_TOKEN=      # token de teste (TEST-...) ou produção, da sua conta Mercado Pago
```

> Pra testar em um celular físico na mesma rede, troque `localhost` pelo IP local da máquina (ex: `192.168.1.68`) em `BETTER_AUTH_URL` e `NEXT_PUBLIC_APP_ORIGIN` — veja a seção do mobile abaixo pra saber como descobrir esse IP.

### 2.2. Instalar e migrar

```bash
cd web
npm install

npm run db:migrate         # aplica db/migrations/*.sql (idempotente — só roda o que falta)
npm run db:migrate:auth    # cria/atualiza as tabelas do Better Auth (user, session, account…)
```

Os dois comandos podem ser rodados de novo a qualquer momento sem duplicar nada — cada um guarda o que já foi aplicado.

### 2.3. Popular dados de exemplo (opcional, mas recomendado pra testar)

```bash
npm run db:seed             # conta nível "desenvolvedor"
npm run db:seed:paroquia    # conta nível "paróquia" (administra todas as comunidades)
npm run db:seed:comunidade  # conta nível "comunidade" (administra uma comunidade só)
npm run db:seed:avisos      # avisos de exemplo
npm run db:seed:dizimista   # torna um fiel existente em dizimista (exige o e-mail já cadastrado)
```

Cada script cria a conta com e-mail/senha padrão definidos no próprio arquivo (`scripts/seed-*.ts`) — dá pra sobrescrever via variável de ambiente antes de rodar, por exemplo:

```bash
SEED_PAROQUIA_EMAIL=voce@exemplo.com SEED_PAROQUIA_PASSWORD=umaSenhaSua npm run db:seed:paroquia
```

Troque as senhas padrão antes de expor esse banco fora da sua máquina — elas são só pra desenvolvimento local.

### 2.4. Rodar

```bash
npm run dev
```

Abre em `http://localhost:3000`. A tela inicial é o login; o painel fica em `/dashboard` depois de autenticado.

## 3. App mobile (`mobile/`)

### 3.1. Descobrir o IP local da máquina

O celular físico não enxerga `localhost` — precisa do IP da máquina na rede Wi-Fi:

```bash
ipconfig getifaddr en0   # macOS, Wi-Fi
```

### 3.2. Variáveis de ambiente

Crie `mobile/.env.local`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.68:3000   # troque pelo IP que você achou acima
```

### 3.3. Instalar e rodar

```bash
cd mobile
npm install
npx expo start
```

Abra o app **Expo Go** no celular (mesma rede Wi-Fi) e escaneie o QR code que aparece no terminal. Se o QR não aparecer (por exemplo, rodando o servidor em segundo plano sem terminal interativo), use "Enter URL manually" no Expo Go com `exp://<seu-ip>:8081`.

> Sempre que o `EXPO_PUBLIC_API_URL` ou o IP da máquina mudar (trocou de rede, por exemplo), reinicie o `expo start` — o valor é lido uma vez no build do bundle JS.

## 4. Papéis de usuário

O sistema tem 4 níveis, definidos no campo `role` de cada conta (tabela `user`, via Better Auth):

| Papel | Acesso |
|---|---|
| `desenvolvedor` | Tudo — todas as comunidades, todas as contas |
| `paroquia` | Todas as comunidades da paróquia |
| `comunidade` | Só a comunidade vinculada à conta (tabela `comunidade_admins`) |
| `fiel` | Só o app mobile — sem acesso ao painel |

Contas de `paroquia`/`comunidade` são criadas pela aba **Contas** do painel (por uma conta `paroquia` ou `desenvolvedor`) — não existe cadastro público pra esses níveis. Contas `fiel` se cadastram pelo próprio app mobile.

## 5. Problemas comuns

- **App mobile não conecta / "não foi possível conectar ao servidor"** — confira se `npm run dev` do painel web está rodando e se `EXPO_PUBLIC_API_URL` aponta pro IP certo (não `localhost`) e pra porta certa (3000).
- **Erros estranhos depois de mexer em `tailwind.config.js` ou `global.css` do mobile** — limpe o cache do Metro: `npx expo start --clear`.
- **Cobrança Pix falha ao criar** — confira se `MERCADOPAGO_ACCESS_TOKEN` está certo e se é um token de teste (`TEST-...`) enquanto a conta Mercado Pago não tiver a homologação de produção aprovada.
