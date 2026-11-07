# Radar de Leads Conversacional Hibrido - Design

> Data: 2026-05-27
> Status: aprovado para planejamento
> Escopo: transformar o Radar de Leads (`qualificacao-de-leads`) em uma ferramenta conversacional com historico, IA de interpretacao e score deterministico.

## Objetivo

Finalizar o Radar de Leads como uma experiencia evidente de chat, semelhante ao ChatGPT, para qualificar e priorizar leads a partir de texto livre. O usuario deve criar ou abrir uma conversa, colar dados de um ou varios leads, receber uma fila priorizada com score, faixa, motivo, risco e acao recomendada, e conseguir reabrir o resultado pelo historico sem nova chamada de IA.

## Decisao Principal

O Radar de Leads usa um modelo hibrido:

- IA interpreta texto livre e transforma o input em leads estruturados.
- O motor atual de score calcula nota, faixa e acao recomendada de forma deterministica.
- A resposta final combina resultado auditavel com explicacao comercial no tom do Caloni/SEVEN.

A IA nao decide a nota final. Ela ajuda a entender o texto colado, normalizar campos e redigir explicacoes, riscos e proximas acoes.

## Escopo

Inclui:

- rota de chat para `qualificacao-de-leads`;
- uso de `ToolChatShell` e `ToolChatSidebar`;
- novo chat, recentes, busca e abertura de conversa antiga;
- endpoint conversacional para o Radar de Leads;
- uso do profile `lead_qualification` em `app/modules/ai/knowledge.py`;
- criacao de um ou varios leads a partir de uma mensagem;
- score deterministico usando `app/modules/lead_qualification/scoring.py`;
- payload estruturado persistido no historico;
- card/fila renderizavel no chat;
- testes relevantes de backend e frontend.

Fora de escopo:

- CRM completo;
- importacao de planilhas;
- busca semantica no historico;
- renomear, excluir, favoritar ou compartilhar conversas;
- score decidido apenas por IA;
- alteracoes em `sales-copilot-caloni-core`.

## Experiencia do Usuario

O caminho principal deve ser:

1. Usuario acessa Radar de Leads.
2. Ve sidebar padrao com `Novo chat`, busca e recentes.
3. Cria novo chat ou abre conversa recente.
4. Cola texto livre com dados de um ou varios leads.
5. O assistente interpreta os dados e qualifica os leads.
6. O chat exibe uma fila priorizada com score, faixa, motivo, risco e acao recomendada.
7. O usuario pode continuar a conversa para complementar dados ou qualificar novos leads.
8. Ao reabrir o historico, a fila aparece a partir do payload salvo, sem chamar IA novamente.

Quando faltarem dados essenciais, o assistente deve pedir complemento em vez de criar um mock silencioso. Dados parcialmente inferidos devem ficar explicitos no motivo ou no risco.

## Arquitetura

### Backend

Adicionar um endpoint conversacional:

```text
POST /api/v1/ai/lead-qualification-assistant
```

Responsabilidades:

- receber historico de mensagens do chat;
- carregar conhecimento com `load_caloni_knowledge("lead_qualification")`;
- chamar o provider de IA com tool-calling ou JSON estruturado;
- extrair leads normalizados;
- validar se existe configuracao de qualificacao para a empresa;
- criar leads reais via o service atual de lead qualification;
- calcular score com `score_lead`;
- devolver resposta textual e payload estruturado.

O endpoint deve exigir usuario aprovado, assim como os demais endpoints de IA e lead qualification.

### Motor Deterministico

O score continua no modulo existente:

```text
app/modules/lead_qualification/scoring.py
```

Esse motor permanece como fonte de verdade para:

- `score`;
- `tier`;
- `recommended_action`;
- `scoring_snapshot`.

Se o texto livre trouxer valores fora do formato esperado, a camada conversacional deve normalizar para os campos aceitos ou pedir complemento.

### IA

A IA deve usar os `.md` do profile `lead_qualification`, ja existente:

```python
"lead_qualification": ["00", "10", "11", "13", "20", "21", "31", "33", "40"]
```

Ela deve devolver dados estruturados para cada lead com:

- `contact_name`;
- `company_name`;
- `contact_role`;
- `segment`;
- `company_size`;
- `urgency`;
- `timing`;
- `pain_level`;
- `notes`;
- `qualification_reason`;
- `risk`;
- `recommended_next_step`.

Os campos de entrada que alimentam score devem ser controlados pelo backend. A resposta textual pode ter linguagem consultiva, mas o payload precisa ser estavel para reidratar UI.

## Frontend

Registrar uma config real no `agentRegistry` para `qualificacao-de-leads`, substituindo o placeholder.

Responsabilidades:

- apontar o adapter para `POST /api/v1/ai/lead-qualification-assistant`;
- usar o mesmo `ChatToolPage` e a infra `src/agents/chat-sessions/*`;
- renderizar payload de qualificação em card/fila priorizada;
- manter `Novo chat`, busca, recentes e abrir conversa antiga funcionando pelo shell compartilhado;
- persistir mensagens e payloads usando `/api/v1/tool-chat/*`;
- reabrir historico com cards renderizados sem nova chamada de IA.

O design deve seguir o design system atual. Nao criar sidebar propria.

## Payload Estruturado

O assistant deve persistir um payload renderizavel com formato conceitual:

```json
{
  "kind": "lead_qualification_queue",
  "summary": {
    "total_leads": 2,
    "highest_score": 90,
    "primary_action": "abordar_agora"
  },
  "leads": [
    {
      "lead_id": "...",
      "company_name": "Acme",
      "contact_name": "Joao",
      "contact_role": "Founder",
      "segment": "Tech",
      "company_size": "11-50",
      "urgency": "alta",
      "timing": "30_dias",
      "pain_level": "alta",
      "score": 90,
      "tier": "diamond",
      "recommended_action": "abordar_agora",
      "qualification_reason": "Tem fit com ICP, dor alta e timing curto.",
      "risk": "Validar decisor economico e budget antes da proposta.",
      "recommended_next_step": "Abordar agora com diagnostico comercial objetivo."
    }
  ]
}
```

O payload pode incluir campos extras de auditoria, mas a UI deve depender apenas do contrato acima.

## Persistencia e Historico

A persistencia de conversa usa a infra existente:

```text
/api/v1/tool-chat/*
```

Regras:

- cada conversa usa `tool_slug = qualificacao-de-leads`;
- mensagens de usuario e assistant sao persistidas;
- payload estruturado fica na mensagem assistant;
- `metadata` da sessao pode guardar `lead_ids` quando leads forem criados;
- abrir conversa antiga carrega mensagens e payloads salvos;
- reidratar conversa antiga nao chama o endpoint de IA.

## Compatibilidade

O fluxo manual atual de configuracao, fila, novo lead e detalhe pode continuar existindo como apoio operacional. O caminho principal da ferramenta passa a ser o chat, mas rotas antigas nao devem quebrar.

Nao quebrar:

- login;
- cadastro;
- Caloni Propostas;
- Raio-X Comercial;
- endpoints e telas atuais de lead qualification.

## Tratamento de Erros

Casos obrigatorios:

- sem configuracao de lead qualification: orientar usuario a configurar o metodo antes de qualificar;
- IA indisponivel: exibir erro claro sem criar leads;
- texto insuficiente: pedir complemento com lista curta de campos faltantes;
- lead parcialmente extraido: nao criar lead se faltar campo essencial para o schema atual;
- falha ao persistir mensagem: manter comportamento atual do chat compartilhado;
- falha ao criar um lead em lote: nao ocultar falha; resposta deve indicar quais itens foram criados e quais precisam de ajuste.

## Testes

Backend:

- endpoint exige autenticacao;
- endpoint usa profile `lead_qualification`;
- sem configuracao retorna erro orientado;
- texto interpretado em um lead cria lead real e retorna payload;
- multiplos leads voltam ordenados por score;
- score vem do motor deterministico, nao do valor sugerido pela IA;
- payload contem motivo, risco e proxima acao;
- tool-chat continua persistindo payload.

Frontend:

- `agentRegistry["qualificacao-de-leads"]` deixa de ser placeholder;
- novo chat, recentes e busca aparecem para Radar;
- enviar prompt cria sessao e persiste mensagens;
- payload `lead_qualification_queue` renderiza fila priorizada;
- conversa antiga reabre card salvo sem chamar adapter;
- rota de chat do Radar nao quebra rotas antigas de fila, config, novo lead e detalhe.

## Criterios de Aceite

- Experiencia tipo ChatGPT fica evidente.
- Novo chat funciona.
- Recentes funcionam.
- Busca funciona.
- Usuario consegue colar dados de um ou varios leads.
- Resultado mostra score, faixa, motivo, risco e acao recomendada.
- Resultado aparece como fila priorizada.
- Leads criados usam score deterministico.
- Conversa e payload estruturado persistem no historico.
- Reabrir historico renderiza resultado sem chamar IA.
- Nao ha mock silencioso.
- Nao existe sidebar propria do Radar.
- Login, cadastro, Caloni Propostas e Raio-X Comercial continuam funcionando.
