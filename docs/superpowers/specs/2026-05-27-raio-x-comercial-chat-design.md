# Spec - Raio-X Comercial em Chat

**Data:** 2026-05-27
**Repos afetados:** `seven_tools_front` + `seven_tools_api`
**Status:** Design aprovado para revisao do usuario
**Branch alvo:** `main` nos dois repos. Nao usar nem alterar `sales-copilot-caloni-core`.

## 1. Contexto

O SEVEN Tools ja tem a infraestrutura de historico conversacional em `/api/v1/tool-chat/*` e no frontend em `src/agents/chat-sessions/*`. Essa infraestrutura entrega novo chat, busca, recentes, abertura de conversa antiga, persistencia de mensagens e persistencia de payloads.

O Raio-X Comercial (`diagnostico-comercial-caloni`) ainda esta preso ao fluxo antigo de formulario em `/tools/diagnostico-comercial-caloni/app`, enquanto o objetivo de produto e adotar uma experiencia tipo ChatGPT: o usuario conversa com o Caloni, aprofunda contexto comercial e recebe orientacao inteligente baseada na knowledge Caloni.

## 2. Decisoes aprovadas

- O Raio-X Comercial passa a ser 100% chat.
- O fluxo antigo de formulario deve sair do produto; nao manter experiencia paralela.
- A rota antiga `/tools/diagnostico-comercial-caloni/app` deve levar para o novo chat, sem renderizar o formulario antigo.
- A experiencia deve parecer um chat de IA real, nao um formulario disfarcado.
- O backend deve usar o profile `diagnostic` em `load_caloni_knowledge("diagnostic")`.
- Nao usar a base completa Caloni quando o recorte `diagnostic` atende o caso.
- O agente nao deve ser puxado para sempre entregar blocos estruturados.
- Diagnostico estruturado pode existir como consolidacao quando fizer sentido, especialmente se o usuario pedir para fechar ou resumir o diagnostico.
- Conversas e eventuais payloads estruturados devem reabrir pelo historico sem chamar a IA novamente.
- Nao criar sidebar propria; usar `ToolChatShell` e `ToolChatSidebar`.
- Nao criar mock silencioso: se a IA falhar, mostrar erro real/estado de indisponibilidade.

## 3. Experiencia esperada

1. Usuario abre o Raio-X Comercial em `/tools/diagnostico-comercial-caloni` ou `/tools/diagnostico-comercial-caloni/app/chat`.
2. A tela ja mostra a experiencia padrao de chat com sidebar, novo chat, busca e recentes.
3. Usuario pode criar novo chat ou abrir conversa recente.
4. Caloni conduz a conversa como um consultor comercial: pergunta, aprofunda, sintetiza, provoca clareza e orienta proximos passos.
5. A proxima resposta depende do historico da conversa, nao de um roteiro fixo de campos.
6. Enquanto faltar contexto, Caloni pergunta de forma natural.
7. Quando houver contexto suficiente, Caloni pode consolidar o diagnostico em texto claro.
8. Se o usuario pedir "fecha um diagnostico", "resume em plano" ou equivalente, Caloni pode entregar uma consolidacao estruturada.
9. Ao reabrir uma conversa, o historico aparece com mensagens e eventuais cards/payloads ja persistidos, sem nova chamada de IA.

## 4. Arquitetura recomendada

Criar um endpoint dedicado ao chat do Raio-X Comercial:

```text
POST /api/v1/ai/commercial-diagnosis-assistant
```

Esse endpoint recebe o historico recente da conversa e retorna uma resposta de assistente:

```ts
{
  reply: string,
  tool_result?: {
    kind: "commercial_diagnosis_report",
    report: CommercialDiagnosisReport
  }
}
```

Na maioria dos turnos, a resposta contem apenas `reply`. O `tool_result` e opcional e deve aparecer apenas quando houver consolidacao real de diagnostico.

Motivo: isso preserva a sensacao de ChatGPT, evita JSON obrigatorio em todo turno e ainda permite salvar um resultado estruturado quando a conversa naturalmente chegar nele.

## 5. Backend

### 5.1 Schemas

Adicionar schemas em `app/modules/ai/schemas.py` ou modulo focado equivalente:

```py
class CommercialDiagnosisMessageIn(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class CommercialDiagnosisAssistantRequest(BaseModel):
    messages: list[CommercialDiagnosisMessageIn]

class CommercialDiagnosisReport(BaseModel):
    cenario: str
    gargalo_principal: str
    etapa_critica_funil: str
    sintomas: list[str]
    causa_provavel: str
    acao_recomendada: str
    plano_prioritario: list[str]

class CommercialDiagnosisReportResult(BaseModel):
    kind: Literal["commercial_diagnosis_report"]
    report: CommercialDiagnosisReport

class CommercialDiagnosisAssistantResponse(BaseModel):
    reply: str
    tool_result: CommercialDiagnosisReportResult | None = None
```

O schema estruturado e intencionalmente menor que o formulario antigo. Ele existe para consolidacao, nao para dirigir cada turno.

### 5.2 Prompt

Criar prompt dedicado, por exemplo `app/modules/ai/prompts/commercial_diagnosis_assistant.py`.

Regras do agente:

- Voce e Caloni, consultor comercial da SEVEN.
- Use a knowledge Caloni `diagnostic` como base de raciocinio.
- Responda em portugues claro, direto e consultivo.
- Aja como chat de IA: converse, aprofunde, sintetize e oriente.
- Faca uma pergunta por vez quando precisar de contexto.
- Nao transforme todo turno em relatorio.
- Nao invente dados do negocio.
- Se houver contexto insuficiente, pergunte.
- Se o usuario pedir uma consolidacao, entregue diagnostico organizado.
- Se emitir payload estruturado, mantenha o texto da resposta util mesmo sem o card.

### 5.3 Chamada de IA

Adicionar servico `commercial_diagnosis_assistant_turn`.

Comportamento:

- Carregar `load_caloni_knowledge("diagnostic")`.
- Enviar system prompt com knowledge + regras do agente.
- Usar historico recente, por exemplo ultimas 20 mensagens.
- Ignorar mensagens `system` vindas do cliente.
- Chamar provider sem `response_format=json_object` por padrao, para preservar conversa natural.
- Se usar tool-calling para `commercial_diagnosis_report`, tratar tool result opcional.
- Tratar erro de provider com os mesmos padroes de status usados pelo `proposal-assistant`.

### 5.4 Endpoint

Adicionar rota autenticada:

```text
POST /api/v1/ai/commercial-diagnosis-assistant
```

Regras:

- Exigir usuario aprovado.
- Exigir header Authorization, como o `proposal-assistant`.
- Retornar 429, 502 e 504 de forma consistente com os demais endpoints de IA.
- Nao persistir conversa nesse endpoint; a persistencia continua no modulo `tool-chat`.

### 5.5 Endpoint legado

`POST /api/v1/ai/diagnose` pode permanecer por compatibilidade tecnica temporaria, mas o frontend do Raio-X nao deve usa-lo mais.

## 6. Frontend

### 6.1 Registry

Trocar o placeholder de `diagnostico-comercial-caloni` em `src/agents/registry.ts` por configuracao real:

- `id: "diagnostico-comercial-caloni"`.
- Nome: `Raio-X Comercial`.
- Subtitle: algo como `Diagnostico comercial com Caloni`.
- Avatar: Caloni.
- Mission: texto curto explicando que o usuario pode conversar sobre operacao comercial, funil, conversao, proposta, objecoes e proximos passos.
- Suggestions consultivas, por exemplo:
  - `Diagnosticar minha operacao comercial`
  - `Entender onde meu funil trava`
  - `Fechar um plano de acao`

### 6.2 Adapter

Criar adapter dedicado, por exemplo:

```text
src/agents/diagnostico/useCommercialDiagnosisChatAdapter.ts
```

Responsabilidades:

- Converter `ChatMessage[]` para payload do backend.
- Enviar mensagens para `/ai/commercial-diagnosis-assistant`.
- Incluir Authorization via token local/`useAuth`, seguindo padrao de proposta.
- Retornar `{ text: data.reply, payload: data.tool_result }`.
- Nao gerar respostas fake quando backend falhar.

### 6.3 Render de resultado opcional

Criar componente leve para `commercial_diagnosis_report`, por exemplo:

```text
src/agents/diagnostico/CommercialDiagnosisReportCard.tsx
```

Esse card deve aparecer somente quando a mensagem persistida tiver payload estruturado.

Campos:

- Cenario.
- Gargalo principal.
- Etapa critica do funil.
- Sintomas.
- Causa provavel.
- Acao recomendada.
- Plano prioritario.

O card nao deve dominar a experiencia nem substituir a conversa. Ele e uma representacao persistivel de uma consolidacao.

### 6.4 Rotas

Remover a experiencia antiga do app:

- `/tools/diagnostico-comercial-caloni` continua abrindo `ChatToolPage`.
- `/tools/diagnostico-comercial-caloni/app/chat` continua abrindo `ChatToolPage`.
- `/tools/diagnostico-comercial-caloni/app` deve redirecionar para `/tools/diagnostico-comercial-caloni/app/chat`.

Arquivos antigos do fluxo de formulario podem ser removidos se ficarem sem uso:

- `src/pages/tools/DiagnosticoComercial/DiagnosticoApp.tsx`
- `src/pages/tools/DiagnosticoComercial/DiagnosticoShell.tsx`
- `src/services/diagnosticoService.ts`, se nenhum outro fluxo usar.

Remover imports e lazy routes associados ao shell antigo.

### 6.5 ChatToolPage

Manter a infra atual:

- `ToolChatShell`.
- `ToolChatSidebar`.
- `useToolChatSessions`.
- Persistencia de mensagem do usuario.
- Persistencia de mensagem do assistant com payload.
- Reabertura via `sessionId`.

Adicionar apenas o minimo de logica especifica para o Raio-X, semelhante ao que ja existe para proposta, mas sem acoplar com propostas.

## 7. Persistencia

A persistencia fica dividida assim:

- Historico: `tool_chat_sessions` e `tool_chat_messages`.
- Texto da IA: `content` da mensagem assistant.
- Diagnostico estruturado opcional: `payload` da mensagem assistant.

Ao reabrir conversa:

- O frontend carrega mensagens via `/tool-chat/sessions/{id}/messages`.
- `persistedMessageToChatMessage` restaura `payload`.
- `renderResult` renderiza o card se `kind === "commercial_diagnosis_report"`.
- Nenhum endpoint de IA e chamado automaticamente so por abrir historico.

## 8. Remocao do fluxo antigo

O fluxo antigo era formulario + endpoint `/ai/diagnose`. Ele nao atende mais a direcao de produto porque:

- parece formulario, nao chat;
- coleta campos fixos;
- gera diagnostico unico;
- nao usa continuidade natural de conversa;
- nao aproveita plenamente `ToolChatShell` e historico conversacional.

A remocao no frontend deve ser completa o suficiente para o usuario nao encontrar a experiencia antiga.

## 9. Testes

### Backend

Adicionar testes em `tests/test_ai.py` ou arquivo dedicado:

- O endpoint `commercial-diagnosis-assistant` usa `load_caloni_knowledge("diagnostic")`.
- O endpoint aceita historico de mensagens e retorna `reply`.
- Mensagens `system` vindas do cliente nao entram como mensagens de provider.
- Erros 401/403 do provider viram 502.
- Erros 429 preservam status 429.
- Timeout vira 504.
- Quando provider retorna tool call de diagnostico estruturado, a resposta inclui `tool_result`.
- Quando nao ha tool call, a resposta e apenas conversacional.

### Frontend

Adicionar/ajustar testes:

- Registry do Raio-X deixa de ser placeholder.
- Adapter chama `/ai/commercial-diagnosis-assistant` com Authorization.
- Chat do Raio-X renderiza sugestoes e shell padrao.
- Enviar primeira mensagem cria sessao `diagnostico-comercial-caloni` antes de persistir mensagens.
- Reabrir sessao antiga renderiza mensagens sem chamar IA.
- Payload `commercial_diagnosis_report` persistido renderiza card.
- `/tools/diagnostico-comercial-caloni/app` nao renderiza formulario antigo e redireciona para o chat.
- Testes existentes de login, cadastro, Caloni Propostas e Radar de Leads continuam passando.

## 10. Criterios de aceite

- Raio-X Comercial tem experiencia evidente de ChatGPT.
- Novo chat funciona.
- Recentes funcionam.
- Busca de conversas funciona.
- Abrir conversa antiga restaura continuidade.
- Conversa usa knowledge Caloni profile `diagnostic`.
- A IA responde de forma conversacional por padrao.
- Diagnostico estruturado nao e obrigatorio em todo turno.
- Quando existir payload estruturado, ele persiste e reabre pelo historico sem chamar IA.
- O fluxo antigo de formulario nao aparece mais para o usuario.
- Nao ha mock silencioso.
- Login, cadastro, Caloni Propostas e Radar de Leads nao quebram.
- `sales-copilot-caloni-core` nao e alterado.

## 11. Fora do escopo

- Busca semantica no conteudo das conversas.
- Renomear chat manualmente.
- Excluir conversas.
- Compartilhar diagnostico por link publico.
- Gerar PDF de diagnostico.
- Criar uma entidade de banco separada para diagnosticos.
- Reescrever a infraestrutura `tool-chat`.
- Migrar Radar de Leads para chat nesta etapa.
- Alterar Caloni Propostas.

## 12. Referencias de implementacao

Arquivos atuais relevantes:

- Front registry: `seven_tools_front/src/agents/registry.ts`
- Front chat page: `seven_tools_front/src/pages/ChatToolPage.tsx`
- Front sessions: `seven_tools_front/src/agents/chat-sessions/*`
- Front rota principal: `seven_tools_front/src/App.tsx`
- Front fluxo antigo do Raio-X: `seven_tools_front/src/pages/tools/DiagnosticoComercial/*`
- Front service antigo: `seven_tools_front/src/services/diagnosticoService.ts`
- Backend AI router: `seven_tools_api/app/modules/ai/router.py`
- Backend AI service: `seven_tools_api/app/modules/ai/service.py`
- Backend AI schemas: `seven_tools_api/app/modules/ai/schemas.py`
- Backend knowledge loader: `seven_tools_api/app/modules/ai/knowledge.py`
- Backend tool chat: `seven_tools_api/app/modules/tool_chat/*`
- Backend tests de IA: `seven_tools_api/tests/test_ai.py`
- Backend tests de chat: `seven_tools_api/tests/test_tool_chat.py`
