# Spec - Validacao Caloni Chat Protagonist UX Refresh

**Data:** 2026-04-24
**Repo:** `seven_tools_front`
**Status:** Design aprovado em conversa, aguardando revisao do arquivo
**Depende de:** `2026-04-22-chat-ui-foundation-design.md`, `2026-04-23-chat-tool-integration-design.md`

## 1. Contexto

A Fase 1 da integracao do chat colocou a rota `/tools/validacao-caloni` em producao local com a nova base conversacional. O fluxo principal ja funciona: login, deep-link com `?proposal=...`, envio de PDF, render inline do resultado do Caloni e compatibilidade com links legados.

O problema agora nao e de capacidade funcional, e sim de superficie de produto. A tela ainda transmite a sensacao de "hub com um chat encaixado" em vez de "ferramenta conversacional principal". Na pratica isso aparece em quatro sintomas:

1. o topo global do hub compete com o agente
2. a altura da tela e o scroll passam uma sensacao de improviso
3. o composer fica visualmente apertado no rodape
4. a analise inline parece mais um dashboard tecnico comprimido do que um relatorio guiado

O objetivo desta spec e ajustar a UX da rota de Validacao Caloni para uma direcao em que o chat e protagonista, mas ainda claramente pertencente ao produto SEVEN.

## 2. Direcao aprovada

Trio de decisoes aprovadas em brainstorming:

1. **Chat mais amplo**: a coluna principal da conversa deve abrir mais no desktop, com menos sensacao de coluna estreita.
2. **Analise como relatorio guiado**: o resultado do Caloni deve privilegiar leitura e hierarquia editorial, nao aparencia de painel tecnico denso.
3. **Chat protagonista**: o hub continua presente, mas com presenca mais discreta nessa rota; o agente e a conversa devem dominar a experiencia.

### Abordagem escolhida

Entre as alternativas discutidas, a escolhida foi a de **superficie focada de chat**:

- nao transformar a tela num clone de ChatGPT
- nao manter a estrutura atual apenas com microcorrecoes
- sim reorganizar a superficie para que o chat seja a area primaria desta ferramenta

Essa abordagem preserva a identidade do SEVEN e resolve os problemas de leitura, scroll e hierarquia sem virar um redesign total do aplicativo.

## 3. Escopo

### Dentro

- Redesign da experiencia visual da rota `/tools/validacao-caloni`
- Ajustes de layout na pagina de chat e, se necessario, em primitivas compartilhadas do chat
- Refinamento da hierarquia entre header global, header do agente, lista de mensagens e composer
- Revisao do comportamento de scroll e do botao `Novas mensagens`
- Reorganizacao visual do resultado inline do Caloni para leitura mais guiada
- Adequacoes de responsividade para manter desktop forte e mobile estavel

### Fora

- Mudancas no backend
- Mudancas de copy editorial do metodo Caloni
- Redesign completo do hub inteiro
- Redesign profundo das outras rotas de chat
- Persistencia de conversas, multi-turno novo ou streaming real

## 4. Objetivos de UX

Ao final, a tela deve comunicar:

- "estou dentro de uma ferramenta conversacional"
- "o agente e o centro desta tela"
- "a analise e uma leitura assistida, nao uma pilha de widgets"
- "so existe um scroll relevante para eu acompanhar a conversa"

### Criterios de sucesso percebido

- o usuario entende rapidamente onde ler e onde agir
- o composer parece assentado, com respiro real no rodape
- a lista de mensagens nao parece disputar espaco com a pagina
- o resultado inline fica mais calmo e facil de escanear
- o botao `Novas mensagens` aparece como ajuda secundaria, nao como remendo visual

## 5. Arquitetura da tela

### 5.1 Superficie principal

A rota `/tools/validacao-caloni` deixa de se comportar como "pagina comum do hub com um painel de chat no miolo" e passa a ser uma **superficie de conversa dedicada**.

Estrutura desejada:

1. **Header global do SEVEN** permanece no topo, mas com menos protagonismo visual nesta rota.
2. **Workspace do chat** ocupa o restante da viewport util.
3. Dentro do workspace, a conversa fica centralizada em uma largura mais ampla do que a atual.
4. O header do agente, a lista de mensagens e o composer compoem uma pilha continua, com a conversa como eixo da tela.

### 5.2 Altura e viewport

O workspace de chat deve usar a altura disponivel **abaixo** do header global, sem tentar ocupar `100dvh` completo de novo.

Regra de layout:

- header global conta como moldura externa
- a superficie do chat calcula sua altura restante
- o scroll principal da experiencia fica confinado a area de mensagens

Isso elimina a sensacao de scroll duplo entre pagina e historico.

### 5.3 Largura

A coluna do chat deve migrar para uma largura mais ampla no desktop.

Direcao:

- sair da sensacao de coluna muito contida
- abrir espaco para o resultado inline respirar
- evitar abrir tanto a ponto de parecer chat generico ou marketing page

Em termos de produto, a referencia e "workspace amplo e calmo", nao "feed de cards" nem "coluna editorial estreita".

## 6. Hierarquia visual

### 6.1 Header global

O header do hub continua existindo para preservar navegacao e identidade, mas precisa recuar nesta rota.

Diretrizes:

- menos peso visual no background e nas bordas
- menor competicao com o header do agente
- a leitura deve naturalmente descer para o chat, sem o topo puxar mais atencao do que a conversa

Nao e necessario esconder a navegacao. O ajuste e de hierarquia, nao de remocao.

### 6.2 Header do agente

O header do agente vira o contexto imediato da experiencia.

Deve mostrar:

- avatar
- nome
- papel do agente
- estado online/thinking

Mas sem parecer uma segunda navbar. O objetivo e ser contexto leve e confiavel, nao um banner pesado.

### 6.3 Composer

O composer precisa parecer uma barra estavel, assentada no rodape da superficie do chat.

Diretrizes:

- ter sua propria faixa visual
- possuir padding superior e inferior consistentes
- manter respiro em relacao ao fim da janela
- nao saltar visualmente quando mensagens entram

O composer deve parecer a ancora da conversa.

## 7. Linguagem visual da conversa

### 7.1 Mensagem do usuario

A mensagem do usuario continua claramente destacada, mas seu papel e de acao disparadora, nao de bloco dominante da tela.

Diretrizes:

- contraste suficiente para diferenciar autoria
- menos sensacao de caixa pesada
- largura controlada para nao virar um bloco laranja enorme em desktop

### 7.2 Resposta do Caloni

A resposta do agente deve virar o foco de leitura.

Diretrizes:

- ritmo vertical mais calmo
- largura de texto confortavel
- separacao clara entre introducao e resultado estruturado
- menos sensacao de "texto solto + card grudado"

### 7.3 Resultado inline

O resultado do Caloni deixa de parecer um painel tecnico comprimido e passa a se apresentar como **relatorio guiado**.

Isso significa:

- score com destaque forte, mas sem dominar sozinho
- criterios com espacamento mais generoso
- comentarios com melhor contraste e linha de leitura
- secoes com hierarquia clara, menos blocos competindo ao mesmo tempo

O objetivo e que o usuario sinta que esta lendo uma avaliacao orientada por especialista.

## 8. Scroll e comportamento

### 8.1 Uma area de scroll relevante

O comportamento correto para esta tela e:

- header global estavel
- header do agente estavel dentro da superficie
- lista de mensagens como area de scroll relevante
- composer estavel no rodape da superficie

Nao deve haver sensacao de que a pagina inteira esta correndo junto com a conversa.

### 8.2 Auto-scroll

O historico deve acompanhar novas mensagens e expansoes inline **somente** quando o usuario estiver no fim da conversa.

Quando o usuario sobe para reler:

- o auto-scroll para
- o botao `Novas mensagens` aparece como suporte discreto

Quando o usuario esta no fim:

- texto do streaming e cards inline crescem sem criar quebra visual
- o fim da conversa continua "preso" no viewport

### 8.3 Botao "Novas mensagens"

O FAB atual continua valido como comportamento, mas precisa parecer menos remendo.

Diretrizes:

- tamanho moderado
- posicao que nao concorra com o composer
- aparicao apenas quando realmente houver distancia do fim
- personalidade secundaria, nao heroica

## 9. Componentes afetados

### 9.1 `ChatToolPage`

Responsavel por:

- definir a moldura da rota de Validacao Caloni
- aplicar a altura correta abaixo do header global
- dar a faixa propria do composer
- controlar a largura e o ritmo geral da superficie

### 9.2 `MessageList`

Responsavel por:

- scroll da conversa
- auto-scroll inteligente
- espacamento entre mensagens
- exibicao do FAB de novas mensagens

Pode exigir pequenos ajustes compartilhados para suportar corretamente crescimento inline da ultima mensagem sem reintroduzir regressao visual.

### 9.3 `CaloniResultCard`

Responsavel por traduzir a analise tecnica em leitura assistida.

Deve ser reavaliado em:

- espacamento
- contraste
- agrupamento de secoes
- densidade visual
- ordem de leitura

### 9.4 `AgentHeader`

Possivelmente recebe apenas ajustes visuais leves para caber melhor na nova hierarquia.

Nao ha necessidade prevista de mudanca estrutural grande no contrato do componente.

## 10. Tratamento de estados

### Estado vazio

Antes da primeira mensagem, a experiencia precisa:

- manter o agente como protagonista
- nao parecer "buraco vazio"
- preparar a transicao para a primeira analise sem salto brusco

### Primeira analise

Ao sair do empty state:

- a transicao para a conversa deve parecer natural
- a primeira resposta do Caloni nao pode colapsar o layout
- o resultado inline deve entrar como continuidade da resposta, nao como bloco alienigena

### Conversa longa

Com mais mensagens:

- o ritmo da lista deve continuar legivel
- o composer deve permanecer estavel
- o comportamento do scroll deve continuar previsivel

## 11. Responsividade

### Desktop

Prioridade principal desta spec.

Objetivo:

- aproveitar melhor a largura
- reduzir a sensacao de aperto
- melhorar a leitura da analise

### Mobile

Nao entra em redesign profundo, mas precisa ficar correto.

Requisitos:

- sem overflow quebrado
- composer com folga suficiente
- scroll previsivel
- sem sobreposicoes incoerentes

O mobile deve acompanhar a nova hierarquia, mas o foco de refinamento visual continua no desktop.

## 12. Erros e resiliencia

O refresh de UX nao muda os contratos funcionais, mas a interface precisa continuar clara em casos de erro:

- erro de analise continua aparecendo como mensagem do assistant em variant de erro
- a tela nao deve "encolher" ou perder estrutura quando ha falha
- o composer deve continuar utilizavel apos erro
- o scroll deve continuar coerente se uma resposta de erro for curta e a anterior for longa

## 13. Testes

### Automatizados

Adicionar ou ajustar testes para garantir:

1. a superficie de chat usa altura relativa ao layout autenticado, nao `100dvh` bruto
2. o composer possui shell proprio com padding inferior consistente
3. o `MessageList` acompanha crescimento inline da ultima mensagem quando o usuario esta no fim
4. o botao `Novas mensagens` continua aparecendo apenas fora do fim da conversa
5. a rota `/tools/validacao-caloni` continua funcional com deep-link, picker e upload apos o refresh visual

### Validacao manual

Checklist:

- login e entrada na rota
- analisar proposta salva
- enviar PDF externo
- acompanhar streaming e resultado inline
- subir no historico e validar comportamento do botao `Novas mensagens`
- desktop em viewport larga
- mobile em viewport estreita

## 14. Riscos e mitigacoes

| Risco | Mitigacao |
|---|---|
| Reduzir demais o header do hub e perder senso de produto | manter navegacao presente, apenas recuando o peso visual |
| Abrir demais a largura e descaracterizar a experiencia | usar largura ampla, mas ainda centralizada e controlada |
| Melhorar a leitura do resultado e criar regressao em scroll | cobrir crescimento inline da ultima mensagem com teste especifico |
| Ajustar layout da rota e quebrar outras telas de chat | concentrar a mudanca primeiro em `ChatToolPage` e so tocar primitivas compartilhadas quando o ganho for claro |

## 15. Resultado esperado

Depois desta iteracao, `/tools/validacao-caloni` deve parecer uma ferramenta conversacional intencional do SEVEN:

- o chat domina a tela
- o hub continua reconhecivel, mas mais silencioso
- a analise do Caloni fica mais facil de ler
- o composer ganha presenca correta
- o scroll deixa de parecer um conflito entre containers

## 16. Proximos passos

Se o spec for aprovado apos revisao do arquivo:

1. criar plano de implementacao focado nesta rota e nos componentes compartilhados estritamente necessarios
2. executar primeiro as correcoes estruturais de layout e scroll
3. depois aplicar o refinamento visual do resultado inline
4. validar novamente em desktop e mobile
