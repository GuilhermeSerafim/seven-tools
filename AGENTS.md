# AGENTS.md — SEVEN Tools Frontend

## O que e este repo

Frontend do SEVEN Tools Hub. SPA que renderiza o hub de ferramentas, consome a API do backend e entrega a interface para os membros do ecossistema SEVEN.

## Stack

- Vite
- React 18
- TypeScript
- shadcn/ui
- TailwindCSS
- Vitest (testes)

## Estrutura principal

```
src/
  main.tsx             # entrada do app
  App.tsx              # rotas principais
  pages/               # paginas: Index, LandingPage, Tools, ToolDetail, ModulePage, etc.
  features/
    comercial/         # feature comercial (propostas, diagnostico, validacao, qualificacao)
  components/
    ui/                # componentes shadcn/ui
    layout/            # header, sidebar, layout base
    home/              # componentes da home
    tools/             # componentes de listagem e detalhe de ferramentas
  data/
    tools.ts           # catalogo de ferramentas (fonte de verdade do catalogo)
    modules.ts         # catalogo de modulos
    types.ts           # tipos compartilhados
  services/            # chamadas a API do backend
  contexts/            # React contexts
  hooks/               # custom hooks
  auth/                # autenticacao no frontend
  agents/              # agents de IA no frontend
docs/
  superpowers/
    specs/             # specs de features e decisoes
    plans/             # planos de implementacao
```

## Catalogo atual

**Modulos:** Marketing, Comercial, Operacao, Financeiro

**Ferramentas ativas (todas em Comercial):**
- Criacao de Proposta (inclui criacao, edicao e validacao via chat)
- Agente de Diagnostico Comercial Caloni
- Qualificacao de Leads

Detalhes em `src/data/tools.ts` e `src/data/modules.ts`.

## Chat comercial unificado

- Rota principal: `/tools/proposta-comercial-smart/app/chat`
- A ferramenta separada de Validacao Caloni foi absorvida pelo chat de proposta.
- `src/agents/proposal/config.ts` exporta `proposalAgentConfig`, registrado em `src/agents/registry.ts`.
- `src/agents/proposal/useProposalDraft.ts` mantem o rascunho local da conversa.
- `src/agents/proposal/useProposalChatAdapter.ts` integra o chat com `POST /api/v1/ai/proposal-assistant`.

## Specs

- Specs de features e decisoes: `docs/superpowers/specs/`

## Comandos

```bash
# dev server
npm run dev

# testes
npm run test

# build
npm run build

# lint
npm run lint
```

## Guardrails

- O catalogo de ferramentas e modulos e definido em `src/data/` — nao criar ferramentas fora desses arquivos
- Alteracoes em rotas devem respeitar a estrutura existente em `App.tsx`
- Textos de produto visiveris ao usuario devem manter o tom do hub (direto, profissional, sem jargao tecnico)
- Melhorias de UX e fluxo devem ser aplicadas em toda a aplicacao, nao so no sub-projeto atual
- Specs detalhadas ficam em `docs/superpowers/specs/`
