# SEVEN Tools Frontend

SPA React do hub de ferramentas SEVEN.

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
