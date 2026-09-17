# Guia de uso

Como usar o painel administrativo e o app mobile no dia a dia.

## Painel web — `/dashboard`

O menu lateral muda de acordo com o papel da conta logada (veja [configuração.md](configuracao.md#4-papéis-de-usuário)). Contas `paroquia`/`desenvolvedor` veem um filtro **"Visualizando"** no topo, pra restringir a tela a uma comunidade específica ou ver todas juntas.

### Avisos

Comunicados publicados pra uma comunidade (ou vistos por todo mundo, se a conta administra mais de uma). Suportam imagem, texto e a opção **Fixado** (aparece destacado no topo do feed do fiel). Criar/editar abre uma página própria (`/dashboard/avisos/[id]`), não um popup.

### Eventos

Itens do calendário (missas, reuniões, festas) — título, data, horário de início/fim e local. Aparecem no calendário do app mobile filtrados pela comunidade do fiel.

### Fiéis

Lista de todos os fiéis cadastrados (busca por nome/e-mail, paginada). Clicar num fiel mostra os detalhes completos (endereço, data de nascimento, comunidade, desde quando é membro).

### Campanhas

Metas de arrecadação (ex: "Reforma do telhado da Matriz") mostradas na tela **Ofertar** do app. Cada campanha tem:

- **Meta** e **arrecadado** (atualizado automaticamente a cada Pix confirmado vinculado a ela)
- **Comunidade** — ou `null` pra "toda a paróquia"
- **Priorizada** — só uma campanha por vez pode estar marcada assim (restrito a contas `paroquia`/`desenvolvedor`). Toda oferta feita sem escolher uma campanha específica ("Onde for mais necessário") é creditada automaticamente nela.
- **Doações sem direcionamento** — um card no topo da lista mostra quanto já foi arrecadado dessa forma, e se está sendo credidato em alguma campanha no momento ou não.

### Relatório

Ofertas confirmadas e dízimos pagos, com gráfico de arrecadação por mês e filtros de período — chips rápidos (**Tudo**, **7 dias**, **30 dias**) e um seletor de **Mês / Trimestre / Semestre / Ano** com navegação `‹ Setembro de 2026 ›`, ou um intervalo customizado (dia/mês/ano).

### Contas

Cria contas de nível `comunidade` (secretaria de uma capela específica) ou `paroquia` (secretaria da paróquia inteira) — restrito a quem já tem um desses dois níveis.

## App mobile

### Avisos (aba inicial)

Feed dos avisos da comunidade do fiel, com os fixados destacados no topo. Tocar num aviso abre o detalhe completo, com opção de compartilhar.

### Calendário

Agenda mensal dos eventos da comunidade do fiel — navegação por mês, dias com evento marcados.

### Ofertar

Doação avulsa via Pix. O fiel escolhe um valor (presets ou personalizado) e, opcionalmente, uma campanha específica — ou deixa em **"Onde for mais necessário"**, que cai na campanha priorizada do momento (veja acima). Gera um QR code Pix com expiração de 30 minutos e confirma automaticamente por polling.

### Orações

Reservada na navegação, ainda sem conteúdo implementado.

### Perfil

- **Meu dízimo** — valor mensal, dia de vencimento, pagar o mês atual via Pix
- **Histórico de dízimos** e **Histórico de doações**
- **Minhas informações** — editar nome, sobrenome, endereço, data de nascimento, comunidade
- **Notificações** — preferências (lembretes, avisos, campanhas) e um botão de notificação de teste local
- **Aparência** — tema Claro/Escuro, salvo no aparelho e aplicado em todo o app (barra de navegação inclusa)

## Cadastro de novo fiel

Feito pelo próprio app, na tela de login (link "Criar conta"). Pede nome, sobrenome, e-mail, senha, data de nascimento, comunidade e endereço — sem aprovação manual, a conta já nasce com `role = fiel`.
