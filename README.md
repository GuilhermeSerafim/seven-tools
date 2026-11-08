# SEVEN Tools Frontend

Hub de ferramentas comerciais com IA, concebido para membros do ecossistema SEVEN. A interface em React e TypeScript reúne propostas, diagnóstico comercial e qualificação de leads, integrada a uma [API FastAPI](https://github.com/GuilhermeSerafim/seven-tools-api).

## Ferramentas

| Ferramenta | O que faz |
| --- | --- |
| **Caloni Propostas** | Cria, edita e valida propostas comerciais em um único chat, com rascunhos estruturados, salvamento e avaliação pelos critérios Caloni. |
| **Raio-X Comercial** | Conduz uma conversa sobre a operação e o funil de vendas para organizar possíveis gargalos, causas prováveis e um plano de ações prioritárias. |
| **Radar de Leads** | Qualifica e prioriza oportunidades a partir do perfil de cliente ideal (ICP), pesos e faixas de score, com cadastro de leads, fila de atendimento e apoio por chat. |
| **Sales Caloni** | O **Sales Copilot Caloni** estava em desenvolvimento para apoiar o closer/vendedor durante e após reuniões comerciais. |


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
