# SEVEN Tools Frontend

Hub de ferramentas comerciais com IA, concebido para membros do ecossistema SEVEN. A interface em React e TypeScript reúne propostas, diagnóstico comercial e qualificação de leads, integrada a uma [API FastAPI](https://github.com/GuilhermeSerafim/seven-tools-api).

## Ferramentas

| Ferramenta | O que faz |
| --- | --- |
| **Caloni Propostas** | Cria, edita e valida propostas comerciais em um único chat, com rascunhos estruturados, salvamento e avaliação pelos critérios Caloni. |
| **Raio-X Comercial** | Conduz uma conversa sobre a operação e o funil de vendas para organizar possíveis gargalos, causas prováveis e um plano de ações prioritárias. |
| **Radar de Leads** | Qualifica e prioriza oportunidades a partir do perfil de cliente ideal (ICP), pesos e faixas de score, com cadastro de leads, fila de atendimento e apoio por chat. |

A validação Caloni faz parte do fluxo de propostas. As três ferramentas estão no módulo Comercial; Marketing, Operação e Financeiro têm áreas de navegação, ainda sem ferramentas no catálogo.

## Sales Caloni — em desenvolvimento

O **Sales Copilot Caloni** estava em desenvolvimento para apoiar o closer/vendedor durante e após reuniões comerciais. Seu código está em uma branch de desenvolvimento separada, ainda não incorporada à versão principal publicada neste repositório.

- **Estágio alcançado:** interfaces de sessão e revisão pós-call; API autenticada com replay de transcrições, persistência das sessões e transcrições, análise por trechos e processamento assíncrono da revisão, com opção de reprocessamento.
- **Estratégia comercial:** interpretar o estágio da conversa, reconhecer sinais de compra, objeções e lacunas, escolher o próximo movimento e então sugerir uma fala curta. A base Caloni orienta diagnóstico, prioridade, compromisso, construção de valor e encaminhamento do próximo passo.
- **Como foi construído:** frontend React/TypeScript e backend FastAPI com SQLAlchemy/PostgreSQL. A análise combina o contexto da conversa com recortes da base editorial Caloni para orientação durante a reunião e revisão posterior, usando provedores de IA configuráveis.
- **Em aberto:** havia também uma extensão Chrome para leitura de legendas do Google Meet em protótipo. A captura automática e a atualização contínua da interface ainda exigiam integração e validação; não representam uma funcionalidade concluída da versão pública.

## Ritual local

### Pre-requisitos

- Node.js 22+
- Bun 1.x

### Primeira instalacao

```powershell
Copy-Item .env.example .env.local
bun install
```

### Rodar localmente

```powershell
bun run dev
```

O frontend sobe por padrao em `http://localhost:5173` e espera a API em `http://localhost:8000/api/v1`.

### Validacao rapida

```powershell
bun run test
bun run lint
bun run build
```

### Se o `vite` nao for encontrado

```powershell
Remove-Item -Recurse -Force node_modules
bun install
```


## Publicacao do codigo

Este repositorio publica uma copia independente do projeto de equipe SEVEN Tools, com autorizacao para o codigo e as bases comerciais. O historico original de desenvolvimento permanece preservado separadamente.

Configure suas proprias credenciais a partir de `.env.example`. Esta publicacao nao configura deploy nem conecta servicos de producao.

Repositorio complementar: [SEVEN Tools API](https://github.com/GuilhermeSerafim/seven-tools-api).
