# Painel web — Paróquia

Painel administrativo em Next.js (App Router). Serve as telas do painel (`/dashboard`) e toda a API usada pelo app mobile (`/api/*`).

Instruções completas de configuração e uso: **[../docs/configuracao.md](../docs/configuracao.md)** e **[../docs/guia-de-uso.md](../docs/guia-de-uso.md)**.

## Scripts

```bash
npm run dev             # servidor de desenvolvimento (localhost:3000)
npm run build            # build de produção
npm run start             # roda o build de produção
npm run db:migrate       # aplica migrações pendentes (db/migrations)
npm run db:migrate:auth  # cria/atualiza as tabelas do Better Auth
npm run db:seed          # cria conta de nível "desenvolvedor"
npm run db:seed:paroquia    # cria conta de nível "paróquia"
npm run db:seed:comunidade  # cria conta de nível "comunidade"
npm run db:seed:avisos      # avisos de exemplo
npm run db:seed:dizimista   # torna um fiel existente em dizimista
```
