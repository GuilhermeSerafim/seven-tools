# Sales Copilot Caloni

## Objetivo

Definir a primeira arquitetura de produto e tecnologia para uma nova ferramenta do modulo Comercial da SEVEN: um copiloto comercial em tempo real treinado no metodo Caloni para apoiar um vendedor durante calls de vendas.

O foco do produto nao e gerar scripts prontos. O foco e interpretar o momento da call, decidir o proximo movimento mais util e so depois sugerir uma fala curta no estilo Caloni.

## Visao do Produto

O `Sales Copilot Caloni` sera um copiloto tatico de reuniao comercial para uso individual. O vendedor abre o Google Meet no Chrome, abre o painel do copilot no Seven em outro monitor e recebe leitura estrategica em quase tempo real durante a call.

O produto deve funcionar como um condutor silencioso. Ele nao deve competir com a conversa, nem virar teleprompter. Sua funcao e ajudar o vendedor a manter a sequencia certa da reuniao:

1. identificar o estagio da reuniao
2. detectar sinais, riscos, objecoes e lacunas do vendedor
3. definir o objetivo do proximo movimento
4. recomendar a intervencao mais adequada
5. so entao sugerir uma fala curta, pergunta ou framing

## Problema a Resolver

Calls comerciais se perdem quando o vendedor explica cedo demais, deixa a prioridade difusa, nao agita a consequencia, nao valida compromisso, aceita objecao superficial ou encerra sem combinado. O resultado e conversa agradavel, porem comercialmente fraca.

O copilot existe para reduzir esse desvio em tempo real e aumentar a chance de avancar para decisao, proposta, fechamento ou proximo passo amarrado.

## Publico Inicial

O primeiro usuario e o vendedor individual olhando apenas para as proprias calls. O produto deve ajudar esse vendedor em dois momentos:

- durante a call, com orientacao tatico-estrategica
- depois da call, com revisao individual da conducao

Visao de gestor, coaching de equipe e analytics multiusuario ficam fora da primeira fase.

## Proposta de Valor

O produto deve se posicionar como `IA estrategica de conducao comercial em tempo real`, e nao como resumidor de call ou gerador de frases.

Seu diferencial central e combinar:

- leitura de contexto em tempo real
- logica de decisao orientada pelo metodo Caloni
- intervencoes curtas, disciplinadas e acionaveis
- revisao pos-call para evolucao do proprio vendedor

## Base Canonica do Copilot

O comportamento do sistema deve respeitar a hierarquia editorial do corpus Caloni. A base canonicamente relevante para este produto fica em:

- `knowledge/caloni/00_identidade_e_principios.md`
- `knowledge/caloni/01_voz_linguagem_e_conducao.md`
- `knowledge/caloni/11_fluxo_decisao_comercial.md`
- `knowledge/caloni/12_estagios_da_reuniao.md`
- `knowledge/caloni/13_sinais_riscos_e_lacunas.md`
- `knowledge/caloni/20_playbook_reuniao_de_vendas.md`
- `knowledge/caloni/21_playbook_objecoes.md`
- `knowledge/caloni/30_biblioteca_objecoes.md`
- `knowledge/caloni/31_biblioteca_perguntas.md`
- `knowledge/caloni/32_biblioteca_intervencoes.md`
- `knowledge/caloni/33_biblioteca_antipadroes.md`
- `knowledge/caloni/41_snippets_e_formulacoes.md`
- `knowledge/caloni/99_indice_de_uso.md`

O uso dessa base deve obedecer a seguinte ordem:

1. identidade e principios
2. leitura de contexto e decisao
3. playbooks operacionais
4. bibliotecas taticas
5. snippets e formulacoes

Se houver conflito entre uma resposta bonita e uma resposta estrategicamente correta, o sistema deve priorizar a resposta estrategicamente correta.

## Jornada do Usuario

### Antes da reuniao

O vendedor entra no modulo Comercial, abre a ferramenta `Sales Copilot Caloni` e inicia uma sessao de call. O sistema deve exibir status da sessao, fonte de captura e modo ativo.

Na fase inicial, a ferramenta deve aceitar transcript manual, replay e ingestao simulada para validar cerebro e UX antes da extensao.

### Durante a reuniao

O vendedor acompanha um painel silencioso em outro monitor. O painel deve mostrar somente a camada essencial:

- estagio atual da reuniao
- leitura principal do momento
- risco ou oportunidade dominante
- objetivo do proximo movimento
- intervencao recomendada
- fala curta opcional

O painel nao deve virar feed de eventos, nem competir com a conversa. Atualizacoes devem acontecer apenas quando houver mudanca relevante de contexto.

### Depois da reuniao

O vendedor deve conseguir revisar a propria call. A revisao pos-call deve incluir:

- transcript completo
- timeline estrategica com momentos-chave
- estagios percorridos
- objecoes detectadas
- sinais de compra
- sinais de fuga
- lacunas de conducao do vendedor
- proximo passo recomendado
- resumo executivo da call

## O Que Mostrar e O Que Nao Mostrar

### Mostrar

- leitura do estagio atual
- principal trava comercial
- proximo movimento recomendado
- fala curta subordinada a decisao
- nivel de risco ou prontidao
- historico resumido de momentos-chave

### Nao mostrar

- transcript inteiro como camada primaria
- multiplas sugestoes simultaneas
- explicacoes longas em tempo real
- alertas a cada frase
- comentario redundante sobre tudo que o lead disser

## Eventos Prioritarios

O sistema deve conseguir detectar, no minimo:

- objecoes explicitas
- hesitacao e inseguranca
- sinais de compra
- fuga de decisao
- silencio improdutivo
- dominancia de fala do vendedor
- explicacao cedo demais
- falta de priorizacao
- compromisso nao testado
- fechamento frouxo
- ausencia de combinado

## Arquitetura Conceitual

O sistema deve ser estruturado em quatro motores principais.

### Event Engine

Responsavel por transformar transcript recente em eventos estruturados.

Entradas:

- blocos recentes da call
- timestamps
- metadados de speaker quando houver
- estado atual resumido

Saidas:

- candidatos de estagio
- sinais do lead
- lacunas do vendedor
- eventos como objecao, buy signal, fuga, risco de call improdutiva

### State Engine

Responsavel pela memoria viva da call. Este e o cerebro operacional do produto.

O estado da call deve manter pelo menos:

- estagio atual
- prioridade central
- ponto A
- ponto B
- urgencia percebida
- compromisso percebido
- objecoes abertas
- sinais de compra
- lacunas do vendedor
- ultima intervencao exibida
- cooldown de sugestao
- risco atual da call

Esse estado nao deve ficar delegado ao LLM. Ele deve ser mantido por regras, heuristicas e atualizacoes estruturadas.

### Decision Engine

Responsavel por escolher o proximo movimento mais util com base na trava dominante da conversa.

Exemplos de objetivos possiveis:

- aprofundar diagnostico
- priorizar
- agitar consequencia
- validar compromisso
- sustentar valor
- isolar inseguranca
- recuperar conducao
- fechar ou amarrar combinado

### Response Engine

Responsavel por converter a decisao em orientacao de interface. A saida deve ser enxuta:

- o que esta acontecendo
- por que isso importa
- qual o proximo movimento
- qual fala curta faz sentido, se fizer

## Regras, Heuristicas e LLM

### Regras

Regras devem controlar:

- transicoes basicas de estagio
- supressao de ruido
- cooldown de alertas
- ausencia de combinado no fim da call
- dominancia de fala
- silencio acima do limiar

### Heuristicas

Heuristicas devem estimar:

- risco da call
- forca de urgencia
- forca de compromisso
- confianca do estagio
- probabilidade de objecao superficial vs inseguranca real

### LLM

LLM deve ser usado para:

- classificar ambiguidade semantica
- identificar leitura estrategica do trecho recente
- sugerir a intervencao curta mais compativel com o metodo
- gerar sintese pos-call

O LLM nao deve ser o cerebro total do produto.

## Uso de Groq e GPT-4o

Os dois modelos devem cumprir papeis separados.

### Groq

Groq deve atender o `live path`.

Usos principais:

- classificacao rapida de eventos em quase tempo real
- leitura estruturada do trecho recente
- deteccao de objecao, risco, sinal de compra e lacuna do vendedor
- sugestao curta ao vivo, quando o objetivo do proximo movimento ja estiver definido

Motivo: menor latencia e melhor adequacao ao loop de alta frequencia.

### GPT-4o

GPT-4o deve atender o `strategic path`.

Usos principais:

- arbitragem de casos mais ambiguos
- leitura mais rica de blocos maiores da call
- resumo executivo pos-call
- revisao individual do vendedor
- coaching e scorecard da call

Motivo: maior qualidade de sintese e melhor leitura estrategica em tarefas menos sensiveis a latencia.

## Configuracao de Ambiente

Como o produto passara a usar dois providers com papeis distintos, a configuracao nao deve continuar genrica em um unico bloco de IA.

Estrutura recomendada de env:

- `GROQ_API_KEY`
- `GROQ_BASE_URL`
- `GROQ_LIVE_MODEL`
- `GROQ_LIVE_TEMPERATURE`
- `GROQ_LIVE_MAX_TOKENS`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_STRATEGIC_MODEL`
- `OPENAI_STRATEGIC_TEMPERATURE`
- `OPENAI_STRATEGIC_MAX_TOKENS`
- `SALES_COPILOT_LIVE_PROVIDER`
- `SALES_COPILOT_POSTCALL_PROVIDER`

Essa separacao deve refletir tambem na camada de codigo, para que live e post-call sejam rotas tecnicas independentes.

## Captura da Reuniao na V1

A primeira versao nao deve usar STT no hot path. A entrada principal sera a legenda nativa do Google Meet.

### Decisao

Criar uma extensao interna do Chrome para o Google Meet.

### Papel da extensao

A extensao nao e a ferramenta principal. Ela e um adapter de captura. Sua responsabilidade e:

- detectar que existe uma call ativa no Google Meet
- ler as legendas da pagina
- organizar trechos com timestamp
- enviar eventos de transcript para a sessao ativa do copilot

### Trade-off

Vantagens:

- menor complexidade inicial
- maior discricao
- menor custo tecnico do MVP
- dispensa STT no loop ao vivo

Riscos:

- dependencia do DOM e do comportamento das legendas do Meet
- manutencao quando o Google alterar a interface
- possibilidade de perda de qualidade em legendas incompletas

## Separacao entre Ferramenta e Extensao

Embora facam parte do mesmo produto, a implementacao deve ser separada em duas trilhas:

### Trilha 1 - Core Tool

- painel web
- sessao de call
- engines de evento, estado, decisao e resposta
- persistencia
- revisao pos-call
- integracao Groq e GPT-4o

### Trilha 2 - Meet Bridge Extension

- extensao do Chrome
- captura de legendas
- pareamento com sessao ativa
- envio de blocos para o backend

A extensao deve ser tratada como parte tecnica separada, nao como a experiencia principal do usuario.

## Arquitetura Inicial Recomendada

### Frontend

Nova ferramenta no modulo Comercial com duas experiencias:

- painel live da call
- revisao pos-call

### Backend

Nova camada de `call session` com:

- ingestao de transcript
- buffer por sessao
- processamento em quase tempo real
- persistencia de transcript e artefatos estrategicos
- roteamento entre Groq e GPT-4o

### Contrato de ingestao

Payload base esperado da extensao ou de fontes simuladas:

```json
{
  "sessionId": "call_123",
  "source": "google_meet_caption",
  "timestamp": "2026-04-10T16:03:21Z",
  "speakerLabel": "unknown",
  "text": "Gostei da proposta, mas preciso pensar com calma"
}
```

## Persistencia

O sistema deve guardar duas camadas por call:

### Camada bruta

- transcript completo
- log de eventos
- snapshots de estado

### Camada estrategica

- resumo executivo
- estagios percorridos
- objecoes detectadas
- sinais de compra
- riscos e oportunidades
- lacunas do vendedor
- intervencoes exibidas
- proximo passo recomendado

Transcript e artefatos devem ter politicas de retencao independentes, com liberdade para o transcript bruto ter ciclo menor do que a camada estrategica.

## Performance

O alvo funcional do produto e entregar utilidade percebida com latencia de `3 a 7 segundos`.

Para isso:

- a captura precisa chegar ao backend em blocos curtos
- o `live path` deve operar com prompts pequenos e saida estruturada
- o painel nao deve rerenderizar por microevento
- o sistema deve publicar apenas mudancas relevantes

## MVP Inteligente

O MVP deve ser dividido em fases.

### Fase 1 - Pos-call e replay

- ingestao manual ou simulada de transcript
- analise completa com base Caloni
- timeline estrategica
- revisao individual do vendedor

### Fase 2 - Quase tempo real

- processamento por blocos curtos
- painel live com estagio, risco, proximo movimento e fala curta
- Groq no loop ao vivo
- GPT-4o no pos-call

### Fase 3 - Tempo real completo

- extensao do Meet conectada ao backend
- call real alimentando a sessao
- atualizacao live estabilizada

## Fora de Escopo Inicial

Ficam fora da primeira fase:

- captura de audio da aba
- STT no hot path
- bot participante
- visao de gestor
- analytics de equipe
- coaching longitudinal entre multiplas calls
- integracao profunda com CRM

## Diferenciacao

O produto nao deve competir por ser uma copia menor de plataformas como Gong ou Cresta. Sua diferenciacao deve ser:

- IA de conducao, nao so de analise
- metodo Caloni como motor de decisao
- foco inicial no vendedor individual
- leitura estrategica antes de formulacao
- painel tatico durante a call e espelho de melhoria depois da call

## Decisao Final

O `Sales Copilot Caloni` deve nascer como uma ferramenta do modulo Comercial focada em conduzir calls ao vivo com disciplina estrategica, operando sobre uma arquitetura hibrida:

- estado e decisao como cerebro principal
- Groq no caminho live
- GPT-4o no caminho estrategico
- core tool implementado antes da extensao
- extensao do Meet tratada como bridge de captura na fase posterior

Essa arquitetura entrega o melhor equilibrio entre velocidade de execucao, aderencia ao metodo Caloni, risco tecnico controlado e capacidade real de evoluir para um copilot comercial em tempo real.
