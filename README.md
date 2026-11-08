# SEVEN Tools Frontend

Hub de ferramentas comerciais com IA, concebido para membros do ecossistema SEVEN. A interface em React e TypeScript reúne propostas, diagnóstico comercial e qualificação de leads, integrada a uma [API FastAPI](https://github.com/GuilhermeSerafim/seven-tools-api).

## Contexto de negócio

O SEVEN Tools foi concebido para o ecossistema do SEVEN, clube empresarial fundado por Dennis Nakamura e João Freitas. Em **7 de outubro de 2025**, a PressWorks publicou no Valor Econômico os seguintes números do clube:

| Indicador do clube SEVEN | Dado divulgado |
| --- | --- |
| **Anuidade** | Até **R$ 100 mil** |
| **Demanda por ingresso** | Cerca de **200 empresários na fila de espera** |

Fonte: [PressWorks / Valor Econômico — 07/10/2025](https://valor.globo.com/patrocinado/pressworks/noticia/2025/10/07/seven-o-clube-de-r-100-mil-onde-carater-vale-mais-que-faturamento.ghtml).

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
