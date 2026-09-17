# Paróquia

Sistema de duas aplicações para gestão paroquial, compartilhando um banco PostgreSQL local via Better Auth.

- **[`web/`](web)** — painel administrativo (Next.js) usado pela secretaria/comunidades para gerenciar avisos, eventos, campanhas, fiéis, relatórios e contas.
- **[`mobile/`](mobile)** — app do fiel (Expo/React Native) com avisos, calendário, ofertas via Pix, dízimo e perfil.

## Documentação

- **[docs/configuracao.md](docs/configuracao.md)** — como configurar o banco, as variáveis de ambiente e rodar as duas aplicações localmente.
- **[docs/guia-de-uso.md](docs/guia-de-uso.md)** — como usar o painel e o app, seção por seção.
- **[docs/publicacao-lojas.md](docs/publicacao-lojas.md)** — como gerar o build e publicar na App Store e no Google Play com EAS.
