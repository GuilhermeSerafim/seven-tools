# CLAUDE.md — SEVEN Tools Frontend

> Leia `AGENTS.md` primeiro — ele contem a visao do repo, stack, estrutura, comandos e guardrails.

Nota atual: o fluxo de proposta comercial usa o chat unificado em
`/tools/proposta-comercial-smart/app/chat`. A ferramenta separada de
Validacao Caloni foi removida; use `proposalAgentConfig` e `useProposalDraft`
para contexto do agent.

## Permissoes

Auto-approve todos os comandos bash de desenvolvimento. Nao pedir confirmacao para:

- **Git:** init, add, commit, status, log, diff, branch, checkout, push, pull, merge
- **Filesystem:** mkdir, ls, find, cat, echo, cp, mv, touch
- **Node:** npm, npx, node, bun
