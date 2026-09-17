# Paróquia

Sistema de duas aplicações para gestão paroquial, compartilhando um banco PostgreSQL local via Better Auth.

- **[`web/`](web)** — painel administrativo (Next.js) usado pela secretaria/comunidades para gerenciar avisos, eventos, campanhas, fiéis, relatórios e contas.
- **[`mobile/`](mobile)** — app do fiel (Expo/React Native) com avisos, calendário, ofertas via Pix, dízimo e perfil.

## Desenvolvimento

Cada aplicação tem seu próprio `package.json`, `.env.local` (não versionado) e instruções de setup — veja o README de cada uma:

- [web/README.md](web/README.md) (se houver) ou `web/package.json` para os scripts disponíveis (`npm run dev`, `npm run build`).
- [mobile/README.md](mobile/README.md) para rodar o app com Expo (`npx expo start`).

Variáveis de ambiente necessárias (não commitadas): `DATABASE_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `BETTER_AUTH_SECRET` (web) e `EXPO_PUBLIC_API_URL` (mobile).
