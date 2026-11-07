# Tool Chat Sessions - Design

> Data: 2026-05-25  
> Status: aprovado para planejamento  
> Escopo: infraestrutura compartilhada de historico de conversa para ferramentas do SEVEN Tools

## Objetivo

Criar uma infraestrutura padrao de conversas para as ferramentas do modulo Comercial, com experiencia semelhante ao ChatGPT:

- novo chat funcional;
- pesquisar conversas;
- lista de recentes;
- sidebar lateral padrao;
- conversas separadas por ferramenta;
- mensagens persistidas por sessao.

O objetivo nao e substituir os objetos de negocio ja existentes. Propostas, leads e diagnosticos continuam sendo entidades proprias. A nova camada registra o historico conversacional que levou a esses objetos ou que orbitou ao redor deles.

## Ferramentas Atendidas

O MVP deve atender as tres ferramentas ativas do modulo Comercial:

- Caloni Propostas;
- Raio-X Comercial;
- Radar de Leads.

Cada ferramenta deve enxergar apenas as proprias conversas na sidebar. Nao havera historico global misturando ferramentas no MVP.

## Nao Objetivos

Ficam fora do MVP:

- pastas;
- favoritos ou pin;
- compartilhamento de conversas;
- renomear manualmente;
- exclusao em massa;
- historico global de todas as ferramentas;
- multi-agent na mesma sessao;
- busca semantica ou vetorial;
- analytics avancado de uso.

## Conceitos

### Tool Chat Session

Representa uma conversa criada dentro de uma ferramenta especifica.

Campos conceituais:

- `id`;
- `user_id`;
- `tool_slug`;
- `title`;
- `created_at`;
- `updated_at`;
- `archived_at` opcional;
- `metadata` JSON opcional.

`tool_slug` define a ferramenta dona da conversa. Exemplos:

- `proposta-comercial-smart`;
- `diagnostico-comercial-caloni`;
- `qualificacao-de-leads`.

### Tool Chat Message

Representa uma mensagem dentro de uma sessao.

Campos conceituais:

- `id`;
- `session_id`;
- `role`: `user`, `assistant` ou `system`;
- `content`;
- `payload` JSON opcional;
- `attachments` JSON opcional;
- `variant` opcional;
- `created_at`.

`payload` deve guardar resultados estruturados de tool calls ou cards renderizaveis. Isso permite reabrir uma conversa e reconstruir os cards sem chamar a IA novamente.

### Metadata

`metadata` permite vincular uma conversa a objetos de negocio sem criar acoplamento rigido:

```json
{
  "proposal_id": "...",
  "diagnosis_id": "...",
  "lead_id": "..."
}
```

Cada ferramenta decide quais chaves usa.

## UX Recomendada

### Desktop

Layout:

```text
[Header global SEVEN Tools]

+----------------------+--------------------------------+
| Sidebar da ferramenta| Chat atual                     |
|                      |                                |
| + Novo chat          | Header do agente               |
| Buscar conversas     | Mensagens                      |
|                      | Composer                       |
| Recentes             |                                |
| - Conversa A         |                                |
| - Conversa B         |                                |
| - Conversa C         |                                |
+----------------------+--------------------------------+
```

Diretrizes:

- sidebar fixa a esquerda com largura aproximada de 260 a 300px;
- chat ocupa o restante;
- lista de recentes com scroll proprio;
- item ativo destacado com token de `muted` ou `primary/10`;
- botao `Novo chat` sempre acima da busca;
- busca limitada a ferramenta atual.

### Mobile

No mobile, a sidebar vira `Sheet` lateral:

- botao no topo do chat para abrir historico;
- `Novo chat` no topo do sheet;
- busca logo abaixo;
- lista de recentes com toque confortavel;
- fechar sheet ao abrir uma sessao.

## Design System

A UI deve seguir o padrao atual do SEVEN Tools:

- fundo principal: `bg-background`;
- superficies: `bg-card`, `bg-surface` ou `bg-sidebar`;
- bordas: `border-border/30`;
- acao primaria: `primary`;
- fonte de titulo: `Outfit`;
- fonte de corpo: `Inter`;
- icones Lucide.

Icones sugeridos:

- `Plus` para novo chat;
- `Search` para busca;
- `MessageSquare` para conversa;
- `Clock` para recentes;
- `PanelLeft` para abrir/fechar sidebar;
- `Trash2` apenas em versao futura de exclusao.

O visual deve ser operacional, denso e previsivel. Evitar layouts decorativos, cards aninhados e excesso de gradiente.

## Estados Obrigatorios

A sidebar precisa cobrir:

- loading: skeletons na lista;
- vazio: "Nenhuma conversa ainda";
- erro: "Nao consegui carregar as conversas";
- busca vazia: "Nenhuma conversa encontrada";
- sessao ativa;
- sessao recem-criada;
- sessao sem titulo: exibir "Novo chat".

O chat precisa cobrir:

- conversa vazia com sugestoes da ferramenta;
- carregamento de mensagens ao abrir sessao;
- erro ao carregar mensagens;
- erro ao salvar mensagem sem perder o texto local;
- envio interrompido.

## Comportamento

### Novo Chat

Ao clicar em `Novo chat`:

1. criar uma nova sessao para o `tool_slug` atual;
2. navegar ou atualizar a URL para conter `sessionId`;
3. limpar mensagens locais;
4. chamar o reset especifico da ferramenta, quando existir.

Para Caloni Propostas, isso deve resetar o draft local da proposta. Para outras ferramentas, deve limpar o estado temporario do fluxo.

### Abrir Conversa

Ao abrir uma conversa recente:

1. carregar a sessao;
2. carregar mensagens persistidas;
3. reidratar o chat;
4. reidratar payloads/cards;
5. aplicar estado especifico da ferramenta se houver metadata ou mensagens estruturadas suficientes.

### Enviar Mensagem

Fluxo esperado:

1. garantir que existe uma sessao ativa;
2. persistir a mensagem do usuario;
3. chamar o adapter/agente da ferramenta;
4. persistir a resposta do assistant com `payload`, se existir;
5. atualizar `updated_at` da sessao.

O usuario nao deve perder a mensagem se houver falha ao persistir. O front pode manter a mensagem local e exibir estado de erro.

### Titulo Automatico

MVP:

- se a sessao ainda estiver sem titulo, gerar titulo a partir da primeira mensagem do usuario;
- cortar em tamanho razoavel para sidebar;
- fallback: "Novo chat".

Versao futura:

- titulo gerado por IA ou job assincrono;
- renomear manualmente.

### Pesquisa

MVP:

- busca por `title`;
- busca por `content` fica para V2;
- sempre filtrada por `tool_slug` e usuario autenticado;
- debounce no front.

## Backend

Modulo sugerido:

```text
app/modules/tool_chat/
  router.py
  service.py
```

Modelos sugeridos:

```text
app/models/tool_chat.py
```

Schemas sugeridos:

```text
app/schemas/tool_chat.py
```

Endpoints MVP:

```text
POST   /api/v1/tool-chat/sessions
GET    /api/v1/tool-chat/sessions?tool_slug=...
GET    /api/v1/tool-chat/sessions/{session_id}
PATCH  /api/v1/tool-chat/sessions/{session_id}
GET    /api/v1/tool-chat/sessions/{session_id}/messages
POST   /api/v1/tool-chat/sessions/{session_id}/messages
```

Parametros de listagem:

- `tool_slug` obrigatorio;
- `q` opcional;
- `page` default 1;
- `per_page` default 30, maximo 100.

Regras:

- todas as rotas exigem usuario aprovado;
- usuario so acessa as proprias sessoes;
- `tool_slug` deve ser string conhecida pelo catalogo ou validado por allowlist;
- `payload`, `attachments` e `metadata` sao JSONB;
- `updated_at` da sessao muda ao criar mensagem.

## Frontend

Componentes compartilhados sugeridos:

```text
src/agents/chat-sessions/
  ToolChatShell.tsx
  ToolChatSidebar.tsx
  ToolChatSessionList.tsx
  ToolChatSessionItem.tsx
  ToolChatSearchInput.tsx
  useToolChatSessions.ts
  toolChatSessionService.ts
  types.ts
```

Contrato conceitual:

```ts
interface ToolChatShellProps {
  toolSlug: string;
  activeSessionId?: string;
  onNewChat: () => void;
  children: React.ReactNode;
}
```

`ChatToolPage` deve consumir esse shell, mas a logica especifica de cada ferramenta permanece nos adapters/configs atuais.

## Integracao Com Caloni Propostas

Caloni Propostas deve:

- usar sessoes filtradas por `proposta-comercial-smart`;
- resetar `useProposalDraft` em `Novo chat`;
- persistir mensagens do usuario e assistant;
- persistir `proposal_draft_patch`, `proposal_save_request`, `proposal_update_request`, `proposal_validation_report` e `proposal_open_existing` em `payload`;
- vincular `proposal_id` em `metadata` quando uma proposta for salva ou aberta.

## Integracao Com Raio-X Comercial

Raio-X Comercial deve:

- usar sessoes filtradas por `diagnostico-comercial-caloni`;
- persistir conversa/inputs que levaram ao diagnostico;
- vincular `diagnosis_id` em `metadata` quando houver resultado salvo;
- reutilizar o mesmo sidebar e contratos.

## Integracao Com Radar de Leads

Radar de Leads deve:

- usar sessoes filtradas por `qualificacao-de-leads`;
- manter score deterministico fora da IA;
- persistir mensagens consultivas se o chat consultivo entrar;
- vincular `lead_id` em `metadata` quando a conversa orbitar um lead especifico.

## Criterios de Aceite

1. Dentro de uma ferramenta, a sidebar mostra apenas conversas daquela ferramenta.
2. O usuario consegue criar novo chat.
3. O usuario consegue abrir uma conversa recente.
4. O usuario consegue pesquisar conversas da ferramenta atual.
5. Mensagens de usuario e assistant persistem no backend.
6. Payload/tool_result persiste e reabre renderizando os cards corretos.
7. `Novo chat` reseta o estado temporario da ferramenta atual.
8. Conversas de um usuario nao aparecem para outro usuario.
9. A UI funciona em desktop e mobile.
10. A infra nao cria dependencias especificas de proposta, lead ou diagnostico no nucleo compartilhado.

## Testes

Backend:

- criar sessao autenticada;
- listar sessoes filtradas por `tool_slug`;
- impedir acesso a sessao de outro usuario;
- criar mensagem e atualizar `updated_at`;
- buscar por titulo;
- persistir `payload` e `metadata`.

Frontend:

- sidebar renderiza `Novo chat`, busca e recentes;
- estado vazio;
- busca sem resultados;
- abrir sessao chama callback correto;
- mobile abre sidebar em sheet;
- `ChatToolPage` injeta shell sem quebrar fluxo atual;
- payload reidratado renderiza card existente.

## Plano de MVP

Fase 1:

- modelos, migrations e endpoints backend;
- service/hook frontend;
- sidebar padrao desktop/mobile;
- integrar com Caloni Propostas.

Fase 2:

- adaptar Raio-X Comercial;
- adaptar Radar de Leads.

Fase 3:

- polimentos: excluir conversa, renomear, pins/favoritos, busca em conteudo e atalhos.
