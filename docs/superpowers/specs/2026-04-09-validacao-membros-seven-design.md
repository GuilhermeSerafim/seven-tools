# SEVEN Tools - Validacao de Membros SEVEN

## Objetivo

Restringir o acesso ao hub e as ferramentas restritas do SEVEN Tools para membros reais do ecossistema SEVEN, sem criar um fluxo de cadastro duro demais para usuarios legitimos.

O erro de negocio mais importante a evitar e `barrar um Seven legitimo`. Por isso, a V1 deve preferir `pendencia para revisao` em vez de `rejeicao automatica`.

## Problema Atual

Hoje qualquer usuario consegue:

- criar conta
- receber o papel padrao de usuario autenticado
- entrar no fluxo protegido sem uma validacao real de pertencimento ao ecossistema SEVEN

O sistema atual autentica identidade basica, mas nao valida se a pessoa pertence a uma empresa do ecossistema.

## Decisao de Produto

A V1 usara uma validacao centralizada pela SEVEN com um atalho de autoaprovacao baseado na carteira de clientes do ClickUp.

O modelo escolhido e:

- empresas conhecidas sao importadas da lista `Carteira de clientes` do ClickUp
- o cadastro mostra essas empresas em um campo pesquisavel
- se o usuario escolher uma empresa conhecida e o e-mail do cadastro bater `exatamente` com o e-mail responsavel vindo do ClickUp para aquela empresa, a conta e aprovada automaticamente
- se nao houver match exato de e-mail, a conta entra em `pending_review`
- se o usuario escolher `Other`, precisa informar `nome da empresa` e `CNPJ`, e a conta entra em `pending_review`
- na V1, `somente a SEVEN` aprova manualmente contas pendentes
- usuarios pendentes podem autenticar, mas veem apenas uma area de `aguardando validacao`

## Abordagens Consideradas

### 1. Revisao manual central para todos os cadastros

Beneficios:

- regra simples
- controle total da SEVEN
- baixa chance de aprovacao automatica indevida

Riscos e desvantagens:

- alto volume operacional
- maior tempo de espera
- mais chance de um Seven legitimo ficar parado em fila

### 2. Aprovacao descentralizada por empresa

Beneficios:

- escala melhor
- reduz o trabalho manual central
- a propria empresa valida seus membros

Riscos e desvantagens:

- maior risco de aprovacao inconsistente
- dependencia de um aprovador externo acompanhar a fila
- mais complexidade de papeis, bootstrap e auditoria

### 3. Abordagem escolhida: ClickUp como base de empresas + SEVEN como aprovador + autoaprovacao por match exato de e-mail

Beneficios:

- reduz o volume manual sem abrir o acesso por simples selecao de empresa
- usa uma base operacional real ja existente
- mantem a SEVEN como guardrail final da V1
- evita bloquear um Seven legitimo quando nao houver match automatico

Riscos e desvantagens:

- depende da qualidade e atualizacao dos dados do ClickUp
- ainda existe fila manual para usuarios sem match exato
- exige sincronizacao de dados para nao depender do ClickUp em tempo real

## Escopo da V1

A V1 deve entregar:

- base local de empresas conhecidas sincronizada a partir do ClickUp
- cadastro com campo pesquisavel de empresa + opcao `Other`
- autoaprovacao por `match exato` de e-mail normalizado
- fluxo de `pending_review`
- tela de aguardando validacao para usuarios pendentes
- aprovacao manual centralizada pela SEVEN
- bloqueio de acesso ao hub e as ferramentas restritas para usuarios nao aprovados
- trilha de auditoria do motivo de aprovacao

## Fora de Escopo da V1

- aprovacao por empresa ou conta pai
- aprovadores delegados fora da SEVEN
- aprovacao automatica por dominio de e-mail
- aprovacao automatica por nome de empresa, nome de socio ou CPF
- escrita de volta no ClickUp
- validacao juridica automatica por CNPJ contra fonte externa

## Fonte de Verdade

### Empresas conhecidas

Na V1, a lista `Carteira de clientes` do ClickUp sera a fonte operacional de empresas conhecidas do ecossistema.

Cada tarefa dessa lista representa uma empresa.

Os dados padronizados relevantes sao:

- titulo da tarefa como `nome da empresa`
- `e-mail`
- `Socio 1`
- `Socio 2`
- `Contrato`
- `status`
- `tags`

Esses dados serao usados para:

- alimentar o campo pesquisavel de empresas
- compor sinais de revisao manual
- permitir autoaprovacao por match exato de e-mail

Importante:

- o ClickUp valida que a `empresa e conhecida pelo ecossistema`
- o ClickUp nao valida sozinho que a `pessoa pertence a empresa`
- `status` e `tags` do ClickUp entram como contexto operacional, nao como bloqueio automatico da V1

### Empresa nova

Quando o usuario escolher `Other`, a empresa informada nao entra automaticamente como empresa ativa.

Ela vira uma solicitacao de nova empresa em revisao manual, junto com o CNPJ informado.

## Modelo Conceitual de Dados

### Companies

A base local de empresas deve manter ao menos:

- `id`
- `name`
- `source` com valores como `clickup` ou `manual`
- `clickup_task_id` quando vier do ClickUp
- `contact_email`
- `partner_1_name`
- `partner_2_name`
- `has_contract`
- `clickup_status`
- `clickup_tags`
- `cnpj` opcional
- `last_synced_at`

### Users

O usuario continua tendo `role` para permissao global da plataforma, mas a elegibilidade de acesso ao ecossistema passa por campos separados.

O usuario deve ter ao menos:

- `validation_status` com estados `pending_review`, `approved` ou `blocked`
- `approval_source` com valores como `manual` ou `clickup_email_match`
- `approved_at`
- `approved_by_user_id` quando a aprovacao for manual
- `company_id` quando vinculado a uma empresa existente

### CompanyRequests

Solicitacoes criadas por `Other` devem registrar ao menos:

- `id`
- `requested_company_name`
- `requested_cnpj`
- `requested_by_user_id`
- `status`
- `created_at`

## Estados de Validacao

### approved

Usuario validado. Pode acessar hub e ferramentas restritas.

### pending_review

Usuario autenticado, mas aguardando validacao da SEVEN. Nao pode acessar hub ou ferramentas restritas.

### blocked

Usuario impedido de prosseguir por decisao manual da SEVEN, usado apenas em casos claros de abuso, fraude ou impossibilidade de validacao.

## Regras de Cadastro

O formulario de cadastro deve ter:

- nome
- e-mail
- senha
- empresa em campo pesquisavel
- opcao `Other`

Regras:

- para empresa existente, o usuario escolhe apenas o `nome da empresa`
- o sistema trabalha internamente com `company_id`
- `CNPJ` nao e exigido quando a empresa ja existe na base
- ao escolher `Other`, o formulario revela `nome da empresa` e `CNPJ`
- o `CNPJ` e obrigatorio no caminho `Other`

## Fluxo Principal

### 1. Sincronizacao do ClickUp

O sistema sincroniza a lista `Carteira de clientes` do ClickUp para uma base local de empresas conhecidas.

O cadastro e a revisao manual consultam a base local, nao a API do ClickUp em tempo real.

### 2. Cadastro com empresa conhecida

Fluxo:

1. o usuario informa nome, e-mail, senha e escolhe uma empresa conhecida
2. o sistema normaliza o e-mail com `trim + lowercase`
3. o sistema compara esse e-mail com o `contact_email` da empresa selecionada
4. se houver match exato, a conta nasce como `approved`
5. se nao houver match exato, a conta nasce como `pending_review`

Guardrails:

- match automatico vale apenas para a `empresa selecionada`
- nao existe aprovacao por dominio
- nao existe aprovacao por semelhanca de nome
- se o e-mail bater com a empresa `errada` do ClickUp e nao com a empresa selecionada, a conta nao autoaprova

### 3. Cadastro com `Other`

Fluxo:

1. o usuario escolhe `Other`
2. o formulario exige `nome da empresa` e `CNPJ`
3. a conta nasce como `pending_review`
4. o sistema cria uma `CompanyRequest`
5. a SEVEN decide se cria uma nova empresa ativa na base local

## Aprovacao Manual pela SEVEN

Na V1, somente a SEVEN aprova manualmente usuarios pendentes.

A fila de revisao deve mostrar sinais suficientes para decisao:

- empresa selecionada
- origem da empresa (`clickup` ou `other`)
- e-mail do usuario
- e-mail de contato vindo do ClickUp
- socios registrados no ClickUp
- status e tags do ClickUp
- existencia de contrato
- CNPJ informado, quando existir
- motivo da pendencia

Ao revisar um cadastro pendente, a SEVEN pode:

- aprovar o usuario
- bloquear o usuario
- no caso de `Other`, aprovar tambem a criacao da nova empresa na base local
- no caso de `Other`, associar o usuario a uma empresa ja existente se a solicitacao for duplicada

## Regras de Acesso

As regras de acesso do produto passam a considerar `autenticacao` e `validacao`.

Regras:

- usuario nao autenticado: vai para login
- usuario autenticado e `approved`: acessa hub e ferramentas restritas
- usuario autenticado e `pending_review`: vai para a pagina de aguardando validacao
- usuario autenticado e `blocked`: ve uma tela de bloqueio ou contato com suporte

O acesso nao deve depender apenas do `role` atual.

## Experiencia do Usuario

### Usuario aprovado automaticamente

- conclui o cadastro
- entra direto no hub
- nao percebe atrito adicional

### Usuario pendente

- conclui o cadastro
- autentica com sucesso
- e redirecionado para uma tela de `aguardando validacao`
- essa tela explica que a conta foi criada e esta em analise pela SEVEN
- essa area nao deve parecer erro tecnico; ela deve comunicar claramente o proximo passo

### Usuario com e-mail ja cadastrado

- nao cria nova conta
- recebe mensagem para entrar ou recuperar acesso

## Guardrails de Produto

- so existe uma conta por e-mail
- autoaprovacao acontece apenas por `match exato` de e-mail normalizado
- selecao de empresa sozinha nunca libera acesso
- `Other` nunca cria empresa ativa automaticamente
- usuarios pendentes nao acessam ferramentas restritas
- toda aprovacao guarda `approval_source`
- toda aprovacao manual guarda quem aprovou e quando

## Tratamento de Excecoes

### Dados do ClickUp desatualizados

Se o e-mail do ClickUp estiver antigo, o usuario nao deve ser rejeitado automaticamente. Ele entra em `pending_review`.

### Empresa conhecida, mas usuario escolheu a errada

Sem match exato de e-mail, a conta fica `pending_review`.

### Empresa digitada em `Other`, mas ja existente

Na revisao manual, a SEVEN pode associar o usuario a uma empresa existente e evitar duplicidade.

### Empresa do ClickUp sem CNPJ

Isso nao impede cadastro ou validacao na V1. O CNPJ passa a ser obrigatorio apenas no caminho `Other`.

## Arquitetura Funcional

### Frontend

Deve haver:

- tela de cadastro com combobox pesquisavel de empresas
- revelacao condicional de campos de `Other`
- tela de aguardando validacao
- guardas de rota que exijam `validation_status = approved`

### Backend

Deve haver:

- persistencia de empresas sincronizadas do ClickUp
- persistencia de `validation_status` e `approval_source`
- endpoint de cadastro adaptado para empresa existente ou `Other`
- endpoint interno para fila de revisao manual
- endpoint interno para aprovar ou bloquear usuarios
- sincronizacao ClickUp -> base local

## Testes Esperados

### Backend

- cria conta `approved` quando ha match exato com o e-mail da empresa selecionada
- cria conta `pending_review` quando a empresa existe, mas o e-mail nao bate
- cria conta `pending_review` + `CompanyRequest` no caminho `Other`
- impede duplicidade de conta por e-mail
- nao autoaprova quando o e-mail bate com outra empresa que nao a selecionada
- aprovar manualmente libera acesso

### Frontend

- cadastro mostra empresas conhecidas
- `Other` revela nome da empresa e CNPJ
- usuario `pending_review` e redirecionado para a tela correta
- usuario `approved` entra no hub
- rotas protegidas exigem autenticacao e validacao

## Resumo da Decisao

A V1 de validacao SEVEN usara o ClickUp como base de empresas conhecidas, autoaprovara apenas usuarios com `match exato` de e-mail com o responsavel da empresa selecionada e enviara todos os demais casos para revisao manual centralizada pela SEVEN. Isso reduz o volume operacional sem liberar acesso apenas pela escolha da empresa e sem barrar automaticamente um Seven legitimo quando o dado de referencia estiver incompleto ou desatualizado.
