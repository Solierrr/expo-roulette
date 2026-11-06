# Expo Roulette

Roleta Solaria em HTML, CSS e JavaScript puro. A aplicação publicada fica em `public/`, sem backend ou build. O diretório `gallery/` herdado do template não participa da publicação.

Execute `npm start` (Node.js 22+) e abra http://localhost:4178. Para outra porta: `node serve.mjs 4180`. Testes: `npm test`.

## Configuração

Edite `public/config.json`; o arquivo é relido antes de cada giro. Os oito segmentos mostram duas cópias de Marca página, Brownie, Byte e Kit Chaveiro. Repetições visuais não multiplicam chances ou cotas.

`releaseStartsAt` é `2026-11-06T11:00:00-03:00`: 6 de novembro de 2026 às 11h de Brasília, sem saldo inicial. Antes das 12h, Byte e Brownie não podem sair. Às 12h libera 1 Byte e 5 Brownies; às 13h, os totais liberados são 2 e 10; às 14h, 3 e 15. Cada hora completa acrescenta mais 1 Byte e 5 Brownies. Prêmios sorteados são descontados, e o saldo não utilizado acumula. O início é fixo: não reinicia por dia nem ao abrir a página.

Byte tem peso `0.12 × saldo disponível`: com um Byte e Brownie disponível, a chance é aproximadamente 0,63%; com cinco Bytes, aproximadamente 3,06%. Brownie tem peso 4. Marca página tem peso 5 e Kit Chaveiro, 10; ambos ilimitados. Sem saldo, um prêmio limitado não pode sair. A liberação permite que saia, sem garantir o resultado. Os segmentos iguais não representam as probabilidades.

`forcedResultId: null` seleciona por pesos. Fixar um id respeita habilitação e saldo. `durationMs` controla a duração, `turns` as voltas e `visualRepeats` as repetições visuais (2).

O consumo persiste em localStorage (`expo-roulette-stock-v2`) neste navegador e origem. Web Locks serializa reservas entre abas. O consumo é salvo antes da animação; recarregar não devolve o prêmio. Limpar dados ou trocar navegador/aparelho/origem cria um histórico separado. O horário vem do dispositivo. Não há saldo global entre aparelhos. Alterar o início do evento exige uma nova chave de armazenamento ou a remoção explícita do estado anterior.

## Visual e assets

Sem cabeçalho, introdução ou rodapé. Centro laranja com apenas `IconRefresh` de `@tabler/icons-react@3.49.0`, a mesma biblioteca do web-app, incorporado ao HTML. Animação de giro, zoom e seta. Movimento reduzido pula as animações. Clique, Tab + Enter ou espaço fora dos botões iniciam o giro.

As dependências de desenvolvimento servem apenas para gerar o ícone com `npm run build:icons`. Para usar a instalação existente: `node scripts/export-icon.mjs /caminho/web-app`. Licenças dos assets em `public/assets/`.

## GitHub Pages

O workflow `.github/workflows/pages.yml` testa as regras e publica `public/` em pushes na `main` ou execução manual. Pull requests só validam. Fonte do Pages: GitHub Actions. Os caminhos são relativos para funcionar em `/expo-roulette/`.

Site: https://solierrr.github.io/expo-roulette/

---

## Referência do template original

Este repositório é o ponto de partida para novos serviços da Solaria. Ao criar um projeto a partir deste template, substitua os textos de exemplo, preencha as configurações da aplicação e mantenha a documentação alinhada ao que o serviço realmente oferece. Use `ARCHITECTURE.md` para registrar a organização do código, `RUNNING.md` para explicar como executar a aplicação e `DEPLOYMENT.md` para descrever seu deploy. O diretório `http/` reúne requisições de exemplo para chamar a API localmente durante o desenvolvimento.

## Estrutura inicial

O molde é completo de propósito. Consulte a [matriz por tipo de repositório](https://github.com/Solierrr/docs-warehouse/blob/main/templates/README.md#matriz-por-tipo) e remova depois, no repositório novo, os arquivos que o seu tipo não usa.

- `http/README.md`: convenções do cliente HTTP local.
- `http/bruno.json`: manifesto da coleção Bruno.
- `http/environments/local.bru`: ambiente local da API, com credenciais vazias.
- `http/`: requisições `.bru` agrupadas em diretórios em inglês (`health/`, `authentication/`, `tasks/`).
- `.dockerignore`: exclui segredos e arquivos locais do contexto de build da imagem.
- `entrypoint.sh`: busca configuração no Infisical em runtime quando Universal Auth está configurado; sem essas credenciais, inicia diretamente o comando da imagem.
- `Makefile`: comandos padrão da organização (`make help`); preencha o bloco "especifico deste repositorio" com os valores da stack, copiando o fragmento de `docs-warehouse/templates/make/`.
- `.env.example`: nomes e valores de exemplo das variáveis necessárias; não inclua credenciais reais.
- `infisical.yaml`: pastas do Infisical que o repositório lê e variáveis do `.env.example` que não vêm do Infisical. Mantenha alinhado com `VAULT_FOLDERS` do `Makefile`, ou remova junto com o workflow `infisical-env-check.yml` se o repositório não usa o Infisical.
- `Dockerfile`: ponto de partida para empacotar a aplicação.

## Ambiente de preview (opcional)

O molde traz uma base de ambiente de preview no GitHub Pages: a pasta `gallery/` (Vite e React, com a casca padrão de `@solaria.network/web-lib/gallery`: cabeçalho, menu com busca, rodapé, tema claro e escuro e idiomas pt-BR, en-US e es-ES), o `gallery.json` da raiz e o workflow `preview.yml`, que chama o workflow reutilizável do repositório `.github`. Quando a pasta `gallery/` não existe, o workflow não faz nada.

Para usar: troque as seções e o conteúdo de `gallery/Gallery.tsx`, ajuste o `repository` ali, o `name` do `gallery.json` (igual ao nome do repositório, com título e descrição nos três idiomas) e habilite o GitHub Pages no modo GitHub Actions (Settings, Pages). O preview é publicado a cada push na `main`, a pull request roda só o typecheck e o build, e o portal de documentação lista e serve o preview em `docs.solarianetwork.site/previews/<repositório>/` depois que o nome entra em `scripts/previews-repos.json` do `worker-docs`. O build usa caminhos relativos para funcionar nos dois endereços. Para um Storybook, use o `preview-storybook.yml` no lugar do `preview-gallery.yml` e `"kind": "storybook"` no `gallery.json`. Para não ter preview, apague `gallery/`, `gallery.json` e `.github/workflows/preview.yml`.

## Cliente HTTP local

Abra `http/` como uma coleção Bruno e edite os arquivos `.bru` para incluir as rotas reais do serviço. Consulte [`http/README.md`](./http/README.md) para instruções e o template canônico em [`docs-warehouse/templates/http/`](https://github.com/Solierrr/docs-warehouse/tree/main/templates/http).

Antes de disponibilizar o repositório, substitua as descrições de exemplo e revise os links e comandos para refletir a stack escolhida.

## Inicialização da imagem no Render

O `entrypoint.sh` recebe o comando da aplicação definido no `CMD` do `Dockerfile`. Se `INFISICAL_CLIENT_ID` e `INFISICAL_CLIENT_SECRET` estiverem presentes em runtime, ele autentica via Universal Auth e inicia esse comando sob `infisical run`; caso contrário, executa-o diretamente com as variáveis já injetadas pela plataforma. O projeto padrão é o workspace Solaria e o ambiente padrão é `qa`; ambos podem ser substituídos por `INFISICAL_PROJECT_ID` e `INFISICAL_ENV`.

Para ativar o caminho Infisical, instale o CLI na imagem runtime e configure as credenciais como variáveis de runtime do Render, nunca como argumentos ou variáveis de build. Quando o Render já fornecer os segredos diretamente, não configure as credenciais Universal Auth e o launcher apenas inicia a aplicação. Use um launcher específico quando o serviço precisar preparar arquivos ou fazer outra transformação antes de iniciar.
