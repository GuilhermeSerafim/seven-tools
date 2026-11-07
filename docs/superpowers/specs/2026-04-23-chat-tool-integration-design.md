# Chat Tool Integration — Fase 1 (Piloto Validação Caloni)

**Data:** 2026-04-23
**Escopo:** Fase 1 de 4 — Infraestrutura de integração + piloto Validação Caloni
**Depende de:** `2026-04-22-chat-ui-foundation-design.md` (foundation entregue e merged em `main`)

## Objetivo

Transformar cada tela de ferramenta em uma conversa de chat. Ao clicar num card de ferramenta no módulo, o usuário aterrissa direto no chat do agente correspondente — sem landing descritiva, sem formulário. Esta fase entrega a infraestrutura reutilizável e o piloto completo na Validação Caloni.

## Contexto

O foundation do Chat UI (`2026-04-22-chat-ui-foundation-design.md`) entregou primitivas visuais (`ChatLayout`, `AgentHeader`, `MessageList`, `MessageBubble`, `PromptInputBox`, `ChatEmptyState`, `StreamingIndicator`, `FileAttachmentChip`, `AttachmentPreviewModal`) e um hook de streaming simulado (`useChatDemo`). Tudo roda em `/chat/demo/pure` como referência viva. Modo `split` foi removido em commit posterior — Fase 1 usa exclusivamente `mode="pure"`.

A Validação Caloni hoje é um formulário em `/tools/validacao-caloni/app` (`ValidationShell > ValidationApp`) com dois modos de input (proposta salva vs PDF externo), loading dedicado e tela de resultado com 7 blocos estruturados. Backend real em `/ai/validate-proposal` (JSON) e `/ai/validate-proposal/upload` (multipart). Single-shot, sem streaming no backend.

## Não-objetivos

- Multi-turno / histórico contextualizado entre mensagens
- Persistência de conversa (sair da página zera o chat)
- Tema claro (chat permanece dark, decidido no foundation)
- Mudanças no backend (`seven_tools_api` intocado)
- Streaming real do LLM via SSE (continua fake char-a-char no front)
- Remoção do demo `/chat/demo/pure` (permanece como referência)
- Ferramentas Proposta Comercial, Diagnóstico e Qualificação de Leads (Fases 2-4)

## Arquitetura

Três camadas, separadas por responsabilidade:

1. **Primitivas do chat (`src/agents/chat/`)** — visuais e hook de streaming genérico, agnósticas ao tool. Já existem e não mudam.
2. **Registry (`src/agents/registry.ts`)** — mapa `slug → AgentConfig`. Contrato entre dados da ferramenta e UI do chat. Criado nesta fase.
3. **Página parametrizada (`src/pages/ChatToolPage.tsx`)** — componente único que, dado um slug, consulta o registry e monta a tela. Substitui `ToolDetail` em `/tools/:slug`.

### Fluxo de uma tela

1. Usuário clica no card da ferramenta no módulo Comercial
2. Navega para `/tools/validacao-caloni`
3. `ChatToolPage` resolve `slug → AgentConfig` via registry
4. Renderiza `ChatLayout mode="pure"` com `AgentHeader` (foto+nome) + `ChatEmptyState` (missão + pílulas) + `PromptInputBox`
5. Interação do usuário (pílula, texto ou anexo) dispara `useAgentChat.send()`
6. `useAgentChat` chama `adapter.send()` do config, streama resposta textual char-a-char via `requestAnimationFrame`, anexa `payload` ao `assistantMessage` quando existir
7. `MessageList` renderiza a mensagem; se houver `payload`, invoca `config.renderResult(payload)` inline no bubble do assistant

## AgentRegistry

### Types

```ts
// src/agents/registry.ts
// Campos name/subtitle/avatarSrc mapeiam 1:1 para props do AgentHeader/ChatEmptyState.

export interface AgentConfig {
  id: string;
  name: string;         // → AgentHeader.name, ChatEmptyState.agentName
  subtitle: string;     // → AgentHeader.subtitle
  avatarSrc: string;    // → AgentHeader.avatarSrc, ChatEmptyState.avatarSrc

  mission: string;      // → ChatEmptyState.agentMission
  suggestions: Suggestion[];

  adapter: AgentAdapter;
  renderResult?: (payload: unknown) => ReactNode;
}

export interface Suggestion {
  label: string;
  action:
    | { kind: 'prefill'; text: string }
    | { kind: 'open-proposal-picker' }
    | { kind: 'open-file-picker' };
}

export interface AgentAdapter {
  send: (input: AgentInput, signal: AbortSignal) => Promise<AgentResponse>;
}

export interface AgentInput {
  text: string;
  attachments: Attachment[];
  context?: { proposalId?: string };
}

export interface AgentResponse {
  text: string;
  payload?: unknown;
}

export const agentRegistry: Record<string, AgentConfig>;
```

### Config concreta — Validação Caloni

```ts
'validacao-caloni': {
  id: 'caloni-v1',
  name: 'Caloni',
  subtitle: 'Decisor Comercial Assistido',
  avatarSrc: '/caloni-photo.jpg.jpg',
  mission:
    'Analiso propostas comerciais sob a metodologia Calone e aponto pontos cegos, objeções previsíveis e riscos antes do cliente ver.',
  suggestions: [
    { label: 'Validar proposta já salva', action: { kind: 'open-proposal-picker' } },
    { label: 'Enviar PDF externo pra analisar', action: { kind: 'open-file-picker' } },
  ],
  adapter: caloniAdapter,
  renderResult: (payload) => <CaloniResultCard result={payload as CaloniResult} />,
}
```

### Placeholders das Fases 2-4

Entradas mínimas no registry para `proposta-comercial-smart`, `diagnostico-comercial-caloni`, `qualificacao-de-leads`. O adapter temporário retorna:

```ts
{
  text: 'Esta ferramenta ainda não foi migrada para o novo formato de chat. Use o fluxo antigo em [link /tools/:slug/app].',
}
```

O fluxo antigo dessas 3 ferramentas continua ativo em suas rotas `/tools/:slug/app` (`ProposalShell`, `DiagnosticoShell`, `LeadQualificationShell` intocados). Só o `/tools/:slug` da Validação é dissolvido no chat.

## Adapter da Validação Caloni

```ts
// src/agents/caloni/adapter.ts

export const caloniAdapter: AgentAdapter = {
  async send({ text, attachments, context }, signal) {
    if (context?.proposalId) {
      const result = await analyzeProposalApi(context.proposalId, signal);
      return { text: buildIntroFromResult(result), payload: result };
    }

    const pdf = attachments.find((a) => a.type === 'pdf');
    if (pdf) {
      const result = await analyzeFileApi(pdf.file, signal);
      return { text: buildIntroFromResult(result), payload: result };
    }

    return {
      text:
        'Pra eu analisar, preciso que você selecione uma proposta salva ou anexe um PDF. Use as opções no início da conversa.',
    };
  },
};
```

`analyzeProposalApi` e `analyzeFileApi` são extraídas de `useCaloniAnalysisFlow` para funções puras (sem estado, sem hook). O hook fica removido — seu papel migra para o adapter.

`buildIntroFromResult(result)` compõe uma frase curta de abertura a partir do resultado, algo como:
> "Analisei a proposta. Score: 7.8 — Proposta Forte. Vou destacar os pontos principais abaixo."

Essa frase é o que streama char-a-char no bubble do assistant. O card estruturado (`CaloniResultCard`) é renderizado ao lado/abaixo assim que o streaming termina.

## Hook useAgentChat

Substitui `useChatDemo`. Mesma API pública (`messages`, `isStreaming`, `send`, `stop`, `reset`), com três diferenças:

1. Recebe `AgentConfig` como parâmetro
2. `send()` chama `config.adapter.send(input, signal)` em vez de `pickResponse()` mockado
3. Suporta `AbortController` — `stop()` aborta tanto o streaming simulado quanto a chamada de fetch em andamento

```ts
export function useAgentChat(config: AgentConfig): UseAgentChatResult {
  // mesmo shape do useChatDemo + AbortController interno
}

export interface UseAgentChatResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  send: (text: string, attachments: Attachment[], context?: AgentContext) => void;
  stop: () => void;
  reset: () => void;
}
```

Reaproveita 100% da lógica de streaming rAF char-a-char do `useChatDemo` (`startAssistantStreaming`, `scheduleFrame`, `TICK_MS`, etc).

## Fluxo de pílula

Pílulas vivem no `ChatEmptyState`, aparecem antes da primeira mensagem e somem assim que qualquer mensagem é enviada (por qualquer caminho). Não reaparecem na mesma sessão.

### Três tipos de ação

**`prefill`** — não usado na Fase 1, reservado para Fases 2-4.
```
Clica pílula → PromptInputBoxHandle.setValue(action.text) → foca input
Usuário pode editar o texto ou apenas apertar enviar.
Não há envio automático.
```

**`open-proposal-picker`** — abre `ProposalPickerSheet`.
```
Clica pílula
  → abre <ProposalPickerSheet> (Sheet shadcn, vindo da direita)
  → lista propostas via useUserProposals(user.id)
  → loading: skeleton cards
  → empty: "Você ainda não tem propostas salvas. Use a outra opção pra enviar um PDF."
  → usuário seleciona proposta
    → sheet fecha
    → useAgentChat.send(
        `Analisar proposta "${proposal.title}"`,
        [],
        { proposalId: proposal.id }
      )
    → mensagem do usuário aparece no stream como texto
    → streaming do assistant começa
```

**`open-file-picker`** — dispara file input em modo "auto-send".
```
Clica pílula
  → PromptInputBoxHandle.openFilePicker({ autoSend: true }) (imperativo)
  → OS abre file picker nativo
  → usuário escolhe arquivo.pdf (ou cancela)
    → cancelou: nada acontece
    → escolheu:
      → PromptInputBox internamente dispara seu onSend('', [pdfAttachment])
        em vez de apenas stage no input (porque flag autoSend=true)
      → useAgentChat.send('', [pdfAttachment]) é chamado
      → mensagem do usuário aparece no stream como chip (sem texto)
      → streaming do assistant começa
```

O paperclip clicado manualmente segue o modo padrão (`autoSend=false`): anexa como chip no input, usuário decide quando enviar. Implementação: `PromptInputBoxHandle.openFilePicker(options?: { autoSend?: boolean })` — estado interno do componente guarda o flag até o `change` do input file disparar.

**Regra unificadora:** quando a ação vem de pílula, é direto — não exige clicar "enviar" depois. Paperclip segue diferente: anexar pelo paperclip deixa o chip no input, usuário pode digitar contexto antes de enviar.

## ChatToolPage

Componente único parametrizado por slug:

```tsx
// src/pages/ChatToolPage.tsx

export default function ChatToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const config = agentRegistry[slug ?? ''];

  if (!config) return <Navigate to="/tools" replace />;

  const { messages, isStreaming, send, stop } = useAgentChat(config);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<PromptInputBoxHandle>(null);

  // Deep-link: /tools/validacao-caloni?proposal=ID pré-dispara
  // (consome apenas uma vez por id para não disparar em re-renders)
  const consumedDeepLink = useRef<string | null>(null);
  useEffect(() => {
    const proposalId = searchParams.get('proposal');
    if (!proposalId || consumedDeepLink.current === proposalId) return;
    if (config.id !== 'caloni-v1') return;
    consumedDeepLink.current = proposalId;
    send(`Analisar proposta selecionada`, [], { proposalId });
  }, [searchParams, config.id, send]);

  function handlePick(suggestion: Suggestion) {
    switch (suggestion.action.kind) {
      case 'prefill':
        inputRef.current?.setValue(suggestion.action.text);
        inputRef.current?.focus();
        break;
      case 'open-proposal-picker':
        setPickerOpen(true);
        break;
      case 'open-file-picker':
        inputRef.current?.openFilePicker({ autoSend: true });
        break;
    }
  }

  const lastMessageId = messages.at(-1)?.id;

  return (
    <ChatLayout mode="pure">
      <AgentHeader
        name={config.name}
        subtitle={config.subtitle}
        avatarSrc={config.avatarSrc}
        status={isStreaming ? 'thinking' : 'online'}
      />

      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        emptyState={
          <ChatEmptyState
            agentName={config.name}
            avatarSrc={config.avatarSrc}
            agentMission={config.mission}
            suggestions={config.suggestions}
            onPick={handlePick}
          />
        }
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            variant={message.variant}
            attachments={message.attachments}
            timestamp={message.createdAt}
            isStreaming={isStreaming && message.role === 'assistant' && message.id === lastMessageId}
          >
            {message.content}
            {message.role === 'assistant' && message.payload && config.renderResult
              ? config.renderResult(message.payload)
              : null}
          </MessageBubble>
        ))}
      </MessageList>

      <PromptInputBox
        ref={inputRef}
        onSend={(text, attachments) => send(text, attachments)}
        disabled={isStreaming}
      />

      <ProposalPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(proposal) => {
          setPickerOpen(false);
          send(
            `Analisar proposta "${proposal.title}"`,
            [],
            { proposalId: proposal.id },
          );
        }}
      />
    </ChatLayout>
  );
}
```

## CaloniResultCard

Adaptado de `CaloniResultState`. Principais mudanças:

- Remove container externo (`max-w-2xl`, `container`, `py-8`) — encaixa no frame do `MessageBubble`
- Remove botão "Reset" — reset é enviar nova mensagem
- Remove `AnimatePresence` externo — streaming já gerencia entrada
- Aceita `className` para ajustes visuais no frame do bubble
- Preserva os 7 blocos: score + label, forças, fraquezas, objeções previsíveis, sugestões, risco, decisão

## Mudanças de rotas

### Em `src/App.tsx`

**Removido:**
```tsx
<Route path="/tools/validacao-caloni/app" element={withSuspense(<ValidationShell />)}>
  <Route index element={withSuspense(<ValidationApp />)} />
</Route>
```

**Modificado:**
```tsx
<Route path="/tools/:slug" element={withSuspense(<ChatToolPage />)} />
```
(antes apontava para `ToolDetail`)

Search param `?proposal=ID` em `/tools/validacao-caloni?proposal=ID` continua suportado para deep-links vindos de outras telas (ex: botão "Validar esta proposta" em `ProposalView`).

## Arquivos

### Criados

| Arquivo | Responsabilidade |
|---|---|
| `src/agents/registry.ts` | Mapa `slug → AgentConfig` + types (`AgentConfig`, `Suggestion`, `AgentAdapter`, `AgentInput`, `AgentResponse`) |
| `src/agents/caloni/adapter.ts` | `caloniAdapter: AgentAdapter` + `analyzeProposalApi` + `analyzeFileApi` + `buildIntroFromResult` |
| `src/agents/caloni/CaloniResultCard.tsx` | Card inline dos 7 blocos (adaptado de `CaloniResultState`) |
| `src/agents/chat/useAgentChat.ts` | Hook de orquestração genérico (substitui `useChatDemo` nas páginas de tool) |
| `src/pages/ChatToolPage.tsx` | Página única parametrizada por slug |
| `src/pages/tools/shared/ProposalPickerSheet.tsx` | Sheet com lista de propostas do usuário |

### Modificados

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Rota `/tools/:slug` aponta para `ChatToolPage`; rota `/tools/validacao-caloni/app` deletada |
| `src/agents/chat/ChatEmptyState.tsx` | Tipo `ChatSuggestion` (`{ label, prompt }`) substituído por `Suggestion` (`{ label, action }`) com union discriminada para `prefill` / `open-proposal-picker` / `open-file-picker`. Prop `onPick` passa `Suggestion` inteira em vez do `prompt` string. Atualizar export em `index.ts` |
| `src/agents/chat/types.ts` | `ChatMessage` ganha campo opcional `payload?: unknown` |
| `src/components/ui/prompt-input-box.tsx` | `PromptInputBoxHandle` ganha método `openFilePicker(options?: { autoSend?: boolean }): void` que dispara click no `uploadInputRef` interno. Quando `autoSend=true`, no `change` do input o arquivo é enviado direto via `onSend('', [attachment])` sem staging no chip; quando `false` (default), mantém o fluxo atual (anexa como chip e aguarda usuário enviar) |
| `src/pages/chat-demo/ChatDemoPure.tsx` | Atualiza shape das `SUGGESTIONS` de `{ label, prompt }` para `{ label, action: { kind: 'prefill', text } }` (adaptação ao novo tipo `Suggestion`) |

> **Nota:** `MessageList.tsx` **não** muda. O padrão atual (prop `emptyState` + children para renderizar mensagens) já permite que `ChatToolPage` injete `config.renderResult(message.payload)` dentro do `MessageBubble`. Esse padrão também preserva 100% do demo existente.

### Removidos

| Arquivo | Motivo |
|---|---|
| `src/pages/ToolDetail.tsx` | Substituído por `ChatToolPage` |
| `src/pages/tools/ValidacaoCaloni/ValidationShell.tsx` | Tela de "app" dissolvida no chat |
| `src/pages/tools/ValidacaoCaloni/ValidationApp.tsx` | Mesma razão |
| `src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.tsx` | Redirect legado desnecessário (sem users em produção) |
| `src/features/comercial/caloniInputUi.tsx` | Substituído por `PromptInputBox` + `ProposalPickerSheet` |
| `src/features/comercial/caloniAnalysisUi.tsx` | `CaloniLoadingState` e `CaloniErrorState` removidos; `CaloniResultState` virou `CaloniResultCard` |
| `src/features/comercial/caloniAnalysisFlow.ts` | Lógica migra pro adapter. `useUserProposals` é extraído como util separado em `src/pages/tools/shared/` |

### Intocados (explicitamente)

- `src/agents/chat/ChatLayout.tsx`, `AgentHeader.tsx`, `MessageList.tsx`, `MessageBubble.tsx`, `StreamingIndicator.tsx`, `FileAttachmentChip.tsx`, `AttachmentPreviewModal.tsx`, `ArtifactPanel.tsx`, `utils.ts` (primitivas mantêm superfície pública)
- `src/agents/chat/demo/useChatDemo.ts` e `mockResponses.ts` (demo continua funcional em `/chat/demo/pure`)
- `src/agents/caloni/config.ts` (system prompt intocado)
- `src/data/tools.ts` (fonte de ferramentas intocada)
- `seven_tools_api` (backend intocado)

## Testes

### Adapter (`src/agents/caloni/__tests__/adapter.test.ts`)

- `send` com `context.proposalId` chama `analyzeProposalApi` e retorna `{ text, payload }`
- `send` com PDF em `attachments` chama `analyzeFileApi` e retorna `{ text, payload }`
- `send` sem proposalId e sem PDF retorna mensagem de recusa sem chamar API
- `send` respeita `AbortSignal` — cancelamento interrompe fetch
- `buildIntroFromResult` produz frase curta com score + label

### Hook (`src/agents/chat/__tests__/useAgentChat.test.tsx`)

- `send` adiciona user message e dispara streaming
- Streaming stream char-a-char via rAF
- `stop` aborta streaming e marca mensagem como `interrupted`
- `stop` aborta fetch via `AbortController` quando ainda na fase de "thinking"
- `reset` limpa mensagens e revoga previews de attachments
- Adapter recebe `context` corretamente quando passado via `send`

### Página (`src/pages/__tests__/ChatToolPage.test.tsx`)

- Slug inexistente redireciona para `/tools`
- Pílula `open-proposal-picker` abre `ProposalPickerSheet`
- Pílula `open-file-picker` chama `PromptInputBoxHandle.openFilePicker`
- Pílula `prefill` seta valor no input e foca
- Seleção de proposta fecha sheet e dispara `send` com context
- Deep-link `?proposal=ID` pré-dispara análise ao montar (apenas Caloni)
- Empty state some após primeira mensagem

### Integração manual (golden path)

1. Clicar card "Validação Caloni" em `/modules/comercial` → aterrissa em `/tools/validacao-caloni` com chat visível em ≤ 500ms
2. Clicar pílula "proposta salva" → sheet abre → selecionar → user message aparece → assistant responde em ≤ 3s (backend real)
3. Clicar pílula "PDF externo" → file picker → selecionar PDF → user message com chip → assistant responde
4. Digitar "olá" sem contexto → bot recusa educadamente
5. `/chat/demo/pure` continua funcional (sem regressão)

## Critérios de sucesso

1. Clicar no card "Validação Caloni" no módulo → chat carrega em < 500ms, empty state visível
2. Pílula "proposta salva" → picker → seleção → análise em ≤ 3s
3. Pílula "PDF externo" → file picker → análise em ≤ 3s
4. Texto livre sem contexto → recusa educada com orientação
5. Deep-link `?proposal=ID` pré-dispara análise
6. Zero regressão visual nas primitivas do chat (demo intocado)
7. Todos os testes (unit + integration) passam
8. `npm run build` sem erros de tipo

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Backend demora para responder e usuário fica sem feedback | `useAgentChat` dispara `adapter.send` imediatamente, mantém `isStreaming=true` desde o envio e mostra `StreamingIndicator` ("thinking dots") enquanto aguarda a promise. Só quando a promise resolve o streaming char-a-char começa. UX percebida: bolha do assistant aparece instantaneamente com indicador, depois texto vai se preenchendo |
| Backend retornar erro | Adapter propaga erro → hook captura → mensagem do assistant vira `variant: 'error'` com texto "Não consegui analisar agora. Tenta de novo?". Toast opcional |
| PDF muito grande trava upload | `PromptInputBox` já tem validação de tamanho no foundation. Mensagem de erro inline |
| Usuário clica pílula enquanto já tem streaming | `handlePick` checa `isStreaming` e ignora. Pílulas ficam disabled visualmente durante streaming (mas nesta fase elas já sumiram, então é no-op) |
| `agentRegistry` com slug não registrado | `ChatToolPage` redireciona para `/tools` (fallback seguro) |

## Abertura para Fases 2-4

Cada ferramenta restante ganha um spec próprio seguindo o mesmo padrão:

- Definir `AgentConfig` (nome, título, foto, missão, pílulas)
- Criar `adapter.ts` chamando backend correspondente
- Opcionalmente criar `ResultCard` se a resposta tiver estrutura visual
- Substituir entrada no registry (remove placeholder)
- Remover as rotas antigas `/tools/:slug/app` e seus shells/apps correspondentes

Aprendizados da Fase 1 (UX, performance, edge cases) viram input para as próximas.
