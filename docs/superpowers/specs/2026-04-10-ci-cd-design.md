# SEVEN Tools - CI/CD

## Objetivo

Definir um fluxo de CI/CD para a aplicacao SEVEN Tools que preserve o deploy semi automatico ja existente, mas adicione gates de qualidade, separacao clara entre homologacao e producao, e um caminho operacional previsivel para front e back.

## Contexto Atual

- o frontend roda em um repositorio separado e ja possui comandos de `lint`, `test` e `build`
- o backend roda em outro repositorio separado e ja possui testes com `pytest`
- o frontend ja esta preparado para deploy em Vercel
- o backend ja esta preparado para deploy em Render
- o deploy atual e semi automatico, mas ainda sem uma camada formal de CI bloqueando merges problematicos

## Problema a Resolver

Hoje o deploy semi automatico acelera a publicacao, mas sem gates obrigatorios ele tambem aumenta a chance de:

- quebrar producao com regressao simples
- descobrir erro apenas depois do deploy
- misturar codigo em validacao com codigo ja pronto para producao
- perder previsibilidade quando front e back evoluem em ritmos diferentes

## Decisao de Produto

Adotar o `caminho 2`: `CI forte + CD controlado por branch`.

Isso significa:

- manter Vercel e Render como motores de deploy
- adicionar GitHub Actions como camada obrigatoria de CI
- usar `develop` como branch de homologacao
- usar `main` como branch de producao
- impedir merge em `develop` e `main` sem checks obrigatorios

## Escopo da Primeira Fase

Esta fase deve entregar:

- um workflow de CI para o frontend
- um workflow de CI para o backend
- branch protection em `develop` e `main`
- deploy automatico de `develop` para homologacao
- deploy automatico de `main` para producao
- separacao de secrets e banco por ambiente

## Fora de Escopo da Primeira Fase

- pipeline unico coordenando front e back no mesmo job
- promocao automatica de `develop` para `main`
- smoke tests pos deploy obrigatorios
- rollback automatizado
- aprovacoes manuais dentro do provedor de deploy
- E2E obrigatorio no gate inicial

## Estrutura Operacional

O fluxo sera orientado por dois repositorios independentes, cada um com seu proprio pipeline.

- `seven_tools_front`: CI proprio e deploy via Vercel
- `seven_tools_api`: CI proprio e deploy via Render

Os dois repositorios seguem a mesma politica de branches, mas nao dependem de um pipeline cruzado para publicar.

Essa escolha reduz acoplamento operacional e permite que uma alteracao pequena no front nao fique travada por uma execucao irrelevante do back, e vice-versa.

## Fluxo de Branches

As branches operacionais da fase 1 sao:

- `feature/*` para desenvolvimento normal
- `develop` para homologacao
- `main` para producao

Fluxo esperado:

1. trabalho acontece em `feature/*`
2. PR de `feature/*` para `develop`
3. CI obrigatorio valida a mudanca
4. merge em `develop` dispara deploy de homologacao
5. apos validacao funcional, PR de `develop` para `main`
6. CI obrigatorio valida novamente
7. merge em `main` dispara deploy de producao

## CI do Frontend

O workflow do frontend deve rodar em:

- `pull_request` para `develop` e `main`
- `push` em `develop` e `main`

Checks obrigatorios da primeira fase:

- instalar dependencias pelo lockfile atual
- rodar `lint`
- rodar `test`
- rodar `build`

Como o repositorio ja possui `bun.lock`, a primeira versao do CI do frontend deve assumir `Bun` como gerenciador padrao, mantendo coerencia com o estado atual do projeto.

`Playwright` pode permanecer fora do gate inicial ate a suite ficar estavel e barata o suficiente para rodar em todo PR.

## CI do Backend

O workflow do backend deve rodar em:

- `pull_request` para `develop` e `main`
- `push` em `develop` e `main`

Checks obrigatorios da primeira fase:

- instalar dependencias Python
- subir um Postgres efemero no job
- configurar variaveis de ambiente de teste
- aplicar migracoes se a suite depender do schema atualizado
- rodar `pytest`

Se o backend ja depender de uma base pronta para testes de integracao, a pipeline deve tratar isso no proprio job, em vez de confiar em infraestrutura externa compartilhada.

## Ambientes e Deploy

### Frontend

- `develop` publica em homologacao via Preview Deployment do Vercel
- `main` publica em producao via Production Deployment do Vercel

### Backend

- `develop` publica em um servico de staging no Render
- `main` publica em um servico de producao no Render

O backend deve usar recursos separados por ambiente:

- banco de staging separado do banco de producao
- secrets separados por ambiente
- URLs de frontend e backend coerentes entre staging e producao

## Branch Protection

As branches `develop` e `main` devem ser protegidas com estas regras:

- merge apenas por PR
- push direto bloqueado
- status checks obrigatorios
- branch atualizada com a base antes do merge, se necessario

O principio e simples: `sem check verde, sem merge`.

## Tratamento de Falhas

O sistema deve falhar de forma previsivel:

- se o CI falhar, a branch protegida nao recebe merge
- se o deploy de homologacao falhar, a mudanca nao avanca para `main`
- producao so recebe codigo que ja passou por `develop`

Essa estrutura diminui a chance de usar producao como ambiente de descoberta.

## Estrategia de Teste da Fase 1

O gate inicial deve priorizar sinais baratos e confiaveis:

- frontend: `lint`, `test`, `build`
- backend: `pytest` com banco efemero

O objetivo da fase 1 nao e cobertura perfeita. O objetivo e impedir regressao obvia antes do deploy automatico.

## Riscos e Compensacoes

Os principais trade-offs desta decisao sao:

- mais disciplina de branches e PRs
- duas validacoes em mudancas que saem de `develop` para `main`
- necessidade de configurar staging de verdade no backend

Em troca, o time ganha:

- previsibilidade de release
- separacao clara entre homologacao e producao
- menor chance de regressao publicada automaticamente
- pipelines independentes e mais simples de manter

## Resumo da Decisao

A aplicacao deve adotar `CI forte + CD controlado por branch`, com pipelines independentes para frontend e backend, `develop` como homologacao, `main` como producao, checks obrigatorios antes de merge e deploy automatico preservado via Vercel e Render.
