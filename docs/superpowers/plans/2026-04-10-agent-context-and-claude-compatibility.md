# Agent Context & Claude Compatibility — Plano de Implementacao

**Objetivo:** Padronizar o contexto de desenvolvimento do SEVEN Tools em tres camadas (AGENTS.md, CLAUDE.md, docs/context/) para que qualquer agent consiga se orientar sem leitura fragmentada.

**Contexto:** Hoje o CLAUDE.md do backend e o unico ponto de onboarding e mistura permissoes, resumo de projeto e convencoes. O frontend nao tem nenhum arquivo de contexto. Um agent novo precisa ler specs espalhadas para entender o projeto.

**Spec:** `docs/superpowers/specs/2026-04-10-agent-context-and-claude-compatibility-design.md`

## Escopo

### Inclui

- AGENTS.md no frontend, backend e raiz
- CLAUDE.md no frontend e raiz (novos) + reestruturacao do backend (existente)
- docs/context/00-product-context.md e docs/context/10-icp-seven.md no frontend

### Nao inclui

- Mover knowledge base do Caloni
- Alterar comportamento runtime da IA
- Mudar schema, UX ou prompts de producao
- Atualizar worktrees existentes

## Estrutura de Implementacao

### Fase 1 — docs/context (fonte canonica de produto)

Criar primeiro porque os AGENTS.md vao apontar para esses arquivos.

- [ ] Criar `seven_tools_front/docs/context/00-product-context.md`
  - O que e o SEVEN Tools
  - Modulos atuais: Marketing, Comercial, Operacao, Financeiro
  - Ferramentas ativas: Criacao de Proposta, Diagnostico Caloni, Validacao Caloni, Qualificacao de Leads
  - Relacao frontend e backend
  - Specs recentes mais relevantes (listar as 3-4 ultimas)
  - Decisoes de produto que afetam dev no curto prazo
- [ ] Criar `seven_tools_front/docs/context/10-icp-seven.md`
  - ICP: empresarios de servicos, faturamento acima de R$ 250 mil
  - Periodicidade do faturamento: nao formalizada
  - Preferencia: negocios de margem alta
  - Exclusoes: varejo, e-commerce, agencia, advocacia
  - Status: contexto bruto consolidado, em calibracao
  - Data da ultima atualizacao
  - Fonte: conversa informal

### Fase 2 — AGENTS.md (onboarding por repo)

- [ ] Criar `seven_tools_api/AGENTS.md`
  - Visao curta do repo backend
  - Stack: FastAPI, SQLAlchemy, Alembic, PostgreSQL, pytest
  - Estrutura principal: app/, modules/, schemas/, models/
  - Ponteiro para frontend como casa da visao de produto
  - Ponteiro para knowledge/caloni/* como base editorial runtime
  - Comandos: servidor, testes, migrations
  - Guardrails: API, autenticacao, sessao, persistencia, testes sempre com PostgreSQL
- [ ] Criar `seven_tools_front/AGENTS.md`
  - Visao curta do repo frontend
  - Stack: Vite, React 18, TypeScript, shadcn/ui, Tailwind
  - Estrutura principal do app
  - Catalogo atual de modulos e ferramentas (resumo, nao copia de tools.ts)
  - Ponteiros para docs/context/00-product-context.md e docs/context/10-icp-seven.md
  - Ponteiros para specs relevantes em docs/superpowers/specs/
  - Comandos: dev, teste, build
  - Guardrails: rotas, catalogo, textos de produto

### Fase 3 — CLAUDE.md (compatibilidade)

- [ ] Reestruturar `seven_tools_api/CLAUDE.md`
  - Linha 1: instrucao para ler AGENTS.md
  - Manter bloco de permissoes (especifico do Claude Code)
  - Remover resumo do projeto e convencoes (migrados para AGENTS.md)
- [ ] Criar `seven_tools_front/CLAUDE.md`
  - Instrucao para ler AGENTS.md
  - Bloco minimo de permissoes se necessario
- [ ] Criar `seven_tools/AGENTS.md` (raiz)
  - Mapa do workspace: frontend em seven_tools_front/, backend em seven_tools_api/
  - Instrucao: leia o AGENTS.md do repo onde vai atuar
- [ ] Criar `seven_tools/CLAUDE.md` (raiz)
  - Instrucao para ler AGENTS.md
  - Ponteiro para os dois sub-repos

### Fase 4 — Validacao

- [ ] Verificar que todos os ponteiros entre arquivos estao corretos
- [ ] Confirmar que nenhuma informacao util do CLAUDE.md original foi perdida
- [ ] Commit por repo (backend tem git separado)

## Decisoes e Justificativas

| Decisao | Alternativa considerada | Motivo da escolha |
|---------|------------------------|-------------------|
| Criar docs/context/ primeiro | Criar AGENTS.md primeiro | AGENTS.md precisa apontar para docs/context/ — a dependencia e nessa direcao |
| Workspace raiz com arquivos minimos | Sem arquivos na raiz | User abre Claude Code na raiz; sem arquivo ali, agent fica sem contexto |
| Permissoes ficam no CLAUDE.md | Mover para AGENTS.md | Permissoes auto-approve sao especificas do Claude Code, nao genericas para qualquer agent |
| ICP marcado como provisorio | Documentar como definitivo | Origem informal, criterio em calibracao — precisa sinalizar isso explicitamente |
| Ignorar worktrees existentes | Atualizar worktrees | Worktrees sao copias temporarias, vao herdar o novo formato quando recriadas |

## Riscos e Mitigacoes

| Risco | Probabilidade | Mitigacao |
|-------|--------------|-----------|
| docs/context/ ficar desatualizado | Alta | Marcar data de ultima atualizacao no proprio arquivo; revisar quando mudar catalogo |
| Perder info util do CLAUDE.md atual durante migracao | Baixa | Diff antes/depois; o conteudo atual tem apenas 31 linhas, facil de auditar |
| Duplicacao entre AGENTS.md e docs/context/ | Media | AGENTS.md aponta, nao repete. Guardrail explicito nos dois arquivos |

## Criterios de Sucesso

- [ ] Agent novo lendo AGENTS.md consegue saber: o que e o repo, qual a stack, que comandos rodar, e onde buscar contexto de produto
- [ ] Claude Code continua funcional — le CLAUDE.md, segue para AGENTS.md, tem permissoes intactas
- [ ] ICP esta documentado com data, fonte e status provisorio
- [ ] Nenhuma informacao do CLAUDE.md original foi descartada sem destino

## O que NAO fazer

- Nao copiar tools.ts ou modules.ts inteiro para dentro de docs/context/ — resumo e suficiente
- Nao transformar AGENTS.md em documentacao tecnica exaustiva — deve ser lido em menos de 2 minutos
- Nao criar prompts de producao a partir de docs/context/
- Nao atualizar os CLAUDE.md dentro de .worktrees/
