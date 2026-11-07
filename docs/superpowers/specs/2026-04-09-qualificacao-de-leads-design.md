# SEVEN Tools - Qualificacao de Leads

## Objetivo

Criar uma ferramenta dentro do modulo Comercial para transformar leads brutos em uma fila priorizada de acao, permitindo que a empresa configure seu ICP e suas regras de score, enquanto o time comercial cadastra leads manualmente e recebe um resultado operacional claro.

## Posicionamento no Produto

- A ferramenta entra no `modulo Comercial`
- Ela convive com `Proposta Comercial Smart`
- O papel da V1 e ser uma `fila de prioridade comercial`, nao um CRM completo

## Escopo da V1

A V1 deve permitir que uma empresa:

- configure seu ICP
- ajuste pesos dos criterios de score
- ajuste cortes de faixa (`bronze`, `prata`, `ouro`, `diamante`)
- defina a acao recomendada por faixa
- cadastre leads manualmente
- classifique cada lead com base em um formulario padrao da SEVEN
- organize os leads em uma fila operacional unica da empresa
- acompanhe historico e status operacionais dos leads

## Fora de Escopo da V1

- integracoes com CRM
- automacoes comerciais complexas
- construtor livre de formulario
- criacao e remocao de perguntas do formulario
- perfis separados de permissao como gestor, admin ou SDR
- IA generativa como motor principal da nota

## Estrutura Operacional

Todos os usuarios da empresa enxergam a mesma ferramenta e a mesma fila. A distincao entre quem configura mais e quem opera mais existe apenas como persona de uso, nao como permissao do sistema.

As areas principais da ferramenta sao:

- `Configuracao`: ICP, pesos, faixas e acoes
- `Novo lead`: formulario padrao da SEVEN para classificacao manual
- `Fila de prioridade`: lista operacional dos leads classificados
- `Historico / detalhe`: memoria das respostas, classificacao e andamento do lead

## Fluxo Principal

1. A empresa configura o metodo inicial de qualificacao
2. Um lead chega ao time comercial
3. Um usuario cadastra o lead manualmente no formulario padrao
4. O sistema calcula o score com base nas regras configuradas
5. O sistema devolve `score`, `faixa` e `acao recomendada`
6. O lead entra na fila compartilhada da empresa
7. O time move o lead conforme o andamento operacional
8. O historico do lead permanece salvo para consulta

## Modelo de Configuracao

### ICP

Cada empresa pode definir seu proprio ICP base, servindo como referencia para a classificacao dos leads.

Exemplos de dimensoes que o ICP pode cobrir:

- segmento
- porte
- tipo de cliente ideal
- perfil do decisor
- dor principal
- momento de compra

### Score

O score da V1 deve ser baseado em `regras configuraveis`, nao em IA generativa.

O funcionamento esperado:

- o formulario possui perguntas fixas da SEVEN
- cada resposta tem uma pontuacao base
- a empresa ajusta o peso dos criterios
- o sistema calcula um score de `0 a 100`
- o score e convertido em uma faixa
- a faixa dispara uma acao recomendada

Essa abordagem foi escolhida porque:

- e mais simples para V1
- e auditavel
- e mais facil de testar
- e mais facil de explicar para o cliente
- reduz risco de inconsistencia

### Faixas

As faixas padrao da V1 sao:

- `Bronze`
- `Prata`
- `Ouro`
- `Diamante`

A empresa pode ajustar os cortes numericos entre elas.

### Acoes Recomendadas

Cada faixa deve estar associada a uma acao recomendada configuravel pela empresa.

Exemplos:

- `Abordar agora`
- `Nutrir`
- `Revisar manualmente`
- `Descartar`

## Formulario da V1

O formulario da V1 sera `padrao da SEVEN`.

Regras para a primeira versao:

- as perguntas centrais sao fixas
- o cliente nao cria nem remove perguntas
- o cliente ajusta configuracao de score, nao a estrutura do formulario
- existe um campo livre de observacoes sem impacto no score

## Fila Operacional

A fila da V1 sera `unica por empresa`.

Caracteristicas:

- todos os usuarios da empresa veem a mesma fila
- nao ha separacao por perfis de permissao
- o objetivo e manter simplicidade e transparencia na operacao

## Status Operacionais

Os leads devem poder assumir estes status:

- `Novo`
- `Em andamento`
- `Qualificado`
- `Nutrir`
- `Descartado`

## Guardrails de Produto

Para manter a V1 consistente, o sistema deve seguir estas regras:

- a empresa precisa concluir a configuracao minima antes de classificar leads
- nao deve haver hard delete de lead; o caminho operacional e `Descartado`
- cada lead salva um snapshot das respostas e do resultado obtido no momento da classificacao
- mudancas futuras em ICP, pesos, faixas e acoes nao reclassificam automaticamente o historico antigo
- se um lead for editado, o sistema recalcula e salva um novo resultado coerente com a configuracao vigente

## Valor Entregue

A ferramenta entrega valor em tres niveis:

- `Padronizacao`: o time para de qualificar apenas por intuicao
- `Velocidade`: o time sabe com quem falar primeiro
- `Escalabilidade`: a empresa pode lidar melhor com aumento de volume sem perder criterio

## Resumo da V1

Uma ferramenta do modulo Comercial que permite a empresa configurar seu ICP e regras de score, cadastrar leads manualmente e transformar esses leads em uma fila priorizada com `score`, `faixa` e `acao recomendada`, para o time comercial saber com quem falar primeiro.
