# SEVEN Tools - Agent Context And Claude Compatibility

## Objetivo

Definir uma arquitetura simples e canonica para orientar agents durante o desenvolvimento do SEVEN Tools, reduzindo a dependencia de leitura manual espalhada entre specs, codigo e knowledge base, sem perder compatibilidade com o Claude Code no fluxo atual do time.

## Problema Atual

Hoje o contexto de desenvolvimento esta distribuido entre varios lugares:

- `seven_tools_api/CLAUDE.md` mistura permissao operacional, resumo do projeto e convencoes
- `seven_tools_front/docs/superpowers/specs/*` guarda decisoes de produto e UX
- `seven_tools_front/src/data/tools.ts` e `seven_tools_front/src/data/modules.ts` mostram o catalogo atual do hub
- `seven_tools_api/knowledge/caloni/*` guarda conhecimento editorial de IA
- o workspace raiz junta frontend, backend e docs, mas nao tem um ponto curto e claro de onboarding para agents

Esse arranjo funciona para quem ja conhece o projeto, mas dificulta a entrada de um agent novo porque:

- nao existe um `AGENTS.md` como ponto de leitura inicial
- o `CLAUDE.md` atual fica concentrado no backend
- parte do contexto de negocio importante nao esta claramente separada do contexto operacional
- o ICP atual existe de forma informal e ainda nao esta documentado como contexto de desenvolvimento

## Decisao Principal

Adotar uma estrutura hibrida com tres camadas:

1. `AGENTS.md` por repositorio como camada principal de onboarding para qualquer agent
2. `CLAUDE.md` por repositorio como camada fina de compatibilidade para Claude Code
3. `docs/context/*` no frontend como fonte canonica de contexto de produto e negocio para desenvolvimento

Essa estrutura foi escolhida porque:

- preserva compatibilidade com Claude Code
- evita transformar `CLAUDE.md` na fonte principal de verdade
- separa instrucoes para agents de contexto de produto
- acompanha a forma como o projeto ja documenta specs e planos no frontend

## Escopo

Esta mudanca deve cobrir:

- introducao de `AGENTS.md` no frontend
- introducao de `AGENTS.md` no backend
- reestruturacao do `CLAUDE.md` do backend para servir como wrapper de compatibilidade
- criacao de `CLAUDE.md` no frontend para compatibilidade
- criacao de uma pasta `docs/context` no frontend com contexto canonico de produto e ICP

## Fora De Escopo

- alterar o comportamento runtime da IA
- mover a knowledge base editorial do Caloni para outro lugar
- mudar schema ou UX da ferramenta de qualificacao de leads
- transformar o ICP atual em regra automatica de produto
- criar integracao entre `docs/context` e prompts de producao

## Estrutura De Arquivos Recomendada

### Frontend

- `seven_tools_front/AGENTS.md`
- `seven_tools_front/CLAUDE.md`
- `seven_tools_front/docs/context/00-product-context.md`
- `seven_tools_front/docs/context/10-icp-seven.md`

### Backend

- `seven_tools_api/AGENTS.md`
- `seven_tools_api/CLAUDE.md`

### Workspace raiz

O workspace raiz deve ter uma camada de roteamento minima porque o Claude Code e aberto a partir desse nivel. Sem arquivos ali, o agent cai num workspace sem contexto.

- `seven_tools/AGENTS.md`
- `seven_tools/CLAUDE.md`

Esses arquivos devem conter apenas ponteiros para os sub-repos (frontend e backend), sem repetir conteudo. O custo de manutencao e praticamente zero porque sao apenas roteadores.

## Fonte Canonica Por Tipo De Informacao

### `AGENTS.md`

Responsavel por:

- explicar o que aquele repositorio contem
- mostrar a stack principal
- apontar quais arquivos ler primeiro
- listar comandos uteis de desenvolvimento e verificacao
- registrar guardrails operacionais
- indicar o que e fonte de verdade dentro do repo

Nao deve:

- repetir specs inteiras
- carregar muito contexto de negocio detalhado
- duplicar knowledge editorial usada em runtime

### `CLAUDE.md`

Responsavel por:

- manter compatibilidade com Claude Code
- apontar explicitamente para `AGENTS.md`
- guardar apenas o que for especifico do fluxo Claude Code

Nao deve:

- competir com `AGENTS.md` como fonte principal
- ser o lugar principal para ICP, visao de produto ou estrutura do hub

### `docs/context/*`

Responsavel por:

- consolidar contexto mais estavel de produto
- registrar ICP de desenvolvimento
- registrar posicionamento e recorte atual do hub
- reduzir dependencia de leitura fragmentada entre specs antigas

Nao deve:

- substituir specs detalhadas de features
- substituir documentacao tecnica de modulo
- ser consumido automaticamente pela IA de producao

## Conteudo Esperado Em Cada Arquivo

### `seven_tools_front/AGENTS.md`

Deve conter:

- visao curta do repo frontend
- stack: Vite, React 18, TypeScript, shadcn/ui, Tailwind
- estrutura principal do app
- catalogo atual de modulos e ferramentas
- ponteiros para `docs/context/00-product-context.md` e `docs/context/10-icp-seven.md`
- ponteiros para specs relevantes em `docs/superpowers/specs`
- comandos de desenvolvimento, teste e build
- guardrails de alteracao em rotas, catalogo e textos de produto

### `seven_tools_api/AGENTS.md`

Deve conter:

- visao curta do repo backend
- stack: FastAPI, SQLAlchemy, Alembic, PostgreSQL, pytest
- estrutura principal de `app/`, `modules/`, `schemas/`, `models/`
- ponteiro para o frontend como casa da visao de produto
- ponteiro para `knowledge/caloni/*` como base editorial runtime
- comandos de servidor, testes e migrations
- guardrails de API, autenticacao, sessao e persistencia

### `seven_tools_front/CLAUDE.md`

Deve ser curto e conter:

- instrucao inicial para ler `AGENTS.md`
- observacoes de compatibilidade do fluxo Claude Code
- eventual bloco pequeno de permissao operacional, se o time realmente precisar manter isso nesse arquivo

### `seven_tools_api/CLAUDE.md`

Deve ser reduzido para:

- instrucao inicial para ler `AGENTS.md`
- permissoes e habitos especificos do fluxo Claude Code que ainda sejam uteis
- referencias para specs e docs canonicos

O bloco atual de resumo do projeto deve sair daqui e ir para `AGENTS.md`.

### `docs/context/00-product-context.md`

Deve concentrar:

- o que e o SEVEN Tools
- quais modulos existem hoje
- quais ferramentas estao ativas ou priorizadas
- como frontend e backend se relacionam
- quais specs recentes sao as mais relevantes
- quais decisoes de produto afetam desenvolvimento no curto prazo

Esse arquivo deve ser lido como contexto de entrada, nao como backlog completo.

### `docs/context/10-icp-seven.md`

Deve concentrar:

- definicao atual do ICP como contexto de desenvolvimento
- data da ultima atualizacao
- fonte do entendimento atual
- status explicito de que o ICP ainda esta em ajuste
- exclusoes e preferencias atuais

Versao inicial recomendada para esse documento:

- foco em empresarios de servicos
- faturamento acima de `R$ 250 mil`
- observacao explicita de que a periodicidade desse faturamento ainda nao esta formalizada no contexto atual
- preferencia por negocios de margem alta
- exclusoes atuais: varejo, ecommerce, agencia, advocacia
- observacao de que o criterio ainda esta sendo calibrado e pode mudar em breve

Como a origem veio de uma conversa informal, o documento deve marcar isso como `contexto bruto consolidado para orientar desenvolvimento`, nao como verdade institucional definitiva.

## Modelo De Navegacao Para Um Agent Novo

O fluxo esperado de leitura deve ser:

1. abrir `AGENTS.md` do repo em que vai atuar
2. se precisar de contexto de negocio, abrir `docs/context/00-product-context.md`
3. se a tarefa tocar ICP, qualificacao ou posicionamento, abrir `docs/context/10-icp-seven.md`
4. so depois abrir specs detalhadas da feature em `docs/superpowers/specs/*`

No Claude Code, o `CLAUDE.md` deve apenas redirecionar para esse fluxo.

## Migracao Do Conteudo Atual

### Backend

O `CLAUDE.md` atual do backend deve ser quebrado em duas partes:

- o que e resumo de projeto e convencao vai para `AGENTS.md`
- o que e permissao ou comportamento especifico do Claude Code fica em `CLAUDE.md`

### Frontend

Como nao existe `CLAUDE.md` versionado no frontend, a nova versao deve nascer enxuta e apontando para `AGENTS.md`.

### Contexto De Produto

Informacao hoje espalhada entre specs, `tools.ts`, `modules.ts` e entendimento informal do time deve ser consolidada em `docs/context`.

## Guardrails

- `AGENTS.md` deve ser curto e operacional
- `CLAUDE.md` nao deve duplicar texto longo de produto
- `docs/context` deve evitar opinioes soltas e registrar apenas contexto util para desenvolvimento
- o ICP deve ser versionado por data e marcado como provisorio quando estiver em ajuste
- nenhuma dessas camadas deve ser tratada como prompt de producao automaticamente

## Abordagens Consideradas

### 1. Centralizar tudo em `CLAUDE.md`

Beneficios:

- compatibilidade imediata com Claude Code
- menos arquivos novos

Riscos:

- Claude vira padrao acidental para todo agent
- mistura contexto de produto com regra operacional
- onboarding continua ruim para outros agents

### 2. Criar apenas `AGENTS.md` por repo

Beneficios:

- melhora onboarding para qualquer agent
- deixa a estrutura mais padronizada

Riscos:

- quebra a expectativa do fluxo Claude Code
- exige adaptar habitos do time de uma vez

### 3. Abordagem escolhida: `AGENTS.md` como principal, `CLAUDE.md` como compatibilidade, `docs/context` como base canonica de contexto

Beneficios:

- melhor equilibrio entre clareza e compatibilidade
- separacao limpa entre instrucao operacional e contexto de produto
- facilita manutencao futura

Riscos:

- introduz mais arquivos
- exige disciplina para manter ponteiros corretos

## Criterios De Sucesso

Esta arquitetura sera considerada correta quando:

- um agent novo conseguir se orientar lendo primeiro `AGENTS.md`
- Claude Code continuar funcional sem depender de um `CLAUDE.md` inflado
- o ICP bruto atual estiver documentado de forma clara e provisoria
- frontend e backend tiverem instrucoes proprias sem perder alinhamento de produto
- a equipe souber qual arquivo atualizar quando mudar contexto de negocio versus regra operacional

## Decisao Final

O SEVEN Tools deve padronizar contexto de desenvolvimento em tres camadas:

- `AGENTS.md` por repositorio como porta de entrada principal para agents
- `CLAUDE.md` por repositorio como camada de compatibilidade com Claude Code
- `docs/context/*` no frontend como fonte canonica de contexto de produto e ICP para desenvolvimento

Essa abordagem melhora onboarding, reduz ambiguidade, preserva o fluxo atual com Claude Code e evita usar um unico arquivo como deposito informal de tudo.
