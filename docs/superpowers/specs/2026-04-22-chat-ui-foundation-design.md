# Spec — Chat UI Foundation (AI Prompt Box + primitivos de chat)

**Data:** 2026-04-22
**Repo:** `seven_tools_front`
**Status:** Design aprovado, pronto para plano de implementação
**Sub-projeto:** 1 de 3 (os outros são "Backend de chat + persistência" e "Migração das 4 ferramentas")

## 1. Contexto e motivação

Hoje o SEVEN Tools é um hub de ferramentas comerciais em que cada tool (Criação de Proposta, Diagnóstico Caloni, Validação Caloni, Qualificação de Leads) tem sua própria tela baseada em forms. O pedido do stakeholder: transformar cada ferramenta numa experiência conversacional — o usuário fala com um agente, anexa arquivos (texto, PDF, imagem), e o agente conduz o trabalho. Visual de "produto de IA" (estilo ChatGPT/Claude), curva de aprendizado curta (convenções iguais ao ChatGPT).

O escopo completo (UX + 4 agentes + multimodal + backend de chat) é grande demais para um único ciclo. Está decomposto em três sub-projetos:

1. **Chat UI Foundation** (esta spec) — primitivos visuais reutilizáveis, AI Prompt Box adaptado, rota de demo com agente mock.
2. **Backend de chat + persistência** — tabelas, SSE streaming, multi-turn, upload real.
3. **Migração das ferramentas** — um por vez, compondo os primitivos.

Sub-projeto 2 só faz sentido depois de 1; sub-projeto 3 depende dos dois.

## 2. Escopo desta spec

### Dentro

- Instalação e **adaptação** do componente `ai-prompt-box` de [`21st.dev/r/easemize/ai-prompt-box`](https://21st.dev/r/easemize/ai-prompt-box) ao design system SEVEN (dark, laranja `hsl(var(--primary))`, Inter/Outfit, radius 0.75rem).
- Conjunto de **primitivos compostos** reutilizáveis vivendo em `src/agents/chat/`:
  - `ChatLayout` (com sub-compostos `Panel`, `Divider`, `Artifact`)
  - `AgentHeader`
  - `MessageList`
  - `MessageBubble`
  - `PromptInputBox` (em `src/components/ui/` por convenção shadcn)
  - `ArtifactPanel`
  - `StreamingIndicator`
  - `FileAttachmentChip`
  - `AttachmentPreviewModal`
  - `ChatEmptyState`
- Suporte a anexos **imagem + PDF + texto** (`.txt`, `.md`) no prompt box, com validação por tipo e tamanho.
- **Dois modos de composição:** `pure` (chat centralizado) e `split` (chat + slot de artefato à direita, redimensionável).
- **Rota `/chat/demo`** (não autenticada) com duas sub-rotas (`/pure` e `/split`) e um agente mock que simula streaming char-a-char via `requestAnimationFrame`.
- **Paridade de interação com ChatGPT** (detalhado na Seção 9) para garantir curva de aprendizado curta.

### Fora

- **Backend de chat**: tabelas `conversations`/`messages`, streaming SSE, multi-turn real, upload ao S3/filesystem — sub-projeto 2.
- **Migração das ferramentas reais** para usar estes primitivos — sub-projeto 3.
- **Voz** (`VoiceRecorder` do AI Prompt Box original) — removida no fork, volta se/quando backend suportar.
- **Toggles Search/Think/Canvas** do componente original — não fazem sentido no contexto SEVEN.
- **Toggle claro/escuro global** — app continua dark fixo (`<html class="dark">` em `index.html`).
- **Renderização Markdown** das mensagens — `MessageBubble.content` aceita `ReactNode`; consumidores futuros passam seu próprio renderer. Foundation não embute.
- **Virtualização** de listas longas — sem virtualization por ora (threads de demo são curtas). Nota técnica registrada para sub-projeto 3 se performance pedir.
- **Sidebar com histórico de threads** (estilo ChatGPT) — SEVEN é "um agente por ferramenta", não lista de conversas.
- **Seletor de modelo** — cada agente tem modelo fixo.

## 3. Arquitetura

### Abordagem

**Primitivos compostos.** Em vez de um componente monolítico `<ChatPage>`, a foundation entrega peças pequenas que a rota compõe. Cada primitivo tem um propósito único e é testável isolado.

**Princípios:**

1. **Dumb primitives** — nenhum primitivo busca dados ou fala com backend. Estado flui via props.
2. **Estado na rota** — no `/chat/demo`, um hook local `useChatDemo` mantém `messages`, `isStreaming`, `attachments`. Esse hook **não é exportado** como API pública — a foundation não prescreve gerenciamento de estado. Sub-projeto 2 define o padrão quando houver backend.
3. **Sem Context Provider nesta foundation** — abstração prematura. Sub-projetos futuros decidem.
4. **`MessageBubble` agnóstico de conteúdo** — aceita `ReactNode` (texto, Markdown renderizado pelo consumidor, cards ricos).
5. **`ArtifactPanel` é slot puro** — foundation não assume forma do artefato (proposta, blocos de diagnóstico, lead card).

### Composição no modo `pure`

```tsx
<ChatLayout mode="pure">
  <AgentHeader name="Caloni" subtitle="Decisor Comercial" />
  <MessageList messages={messages} isStreaming={isStreaming}>
    {messages.map(m => <MessageBubble key={m.id} {...m} />)}
    {isStreaming && <StreamingIndicator />}
  </MessageList>
  <PromptInputBox onSend={send} isLoading={isStreaming} onStop={stop} />
</ChatLayout>
```

### Composição no modo `split`

```tsx
<ChatLayout mode="split">
  <ChatLayout.Panel>
    <AgentHeader ... />
    <MessageList ... />
    <PromptInputBox ... />
  </ChatLayout.Panel>
  <ChatLayout.Divider />
  <ChatLayout.Artifact>
    <ArtifactPanel title="Preview da Proposta">
      {children}
    </ArtifactPanel>
  </ChatLayout.Artifact>
</ChatLayout>
```

### Fluxo de dados (demo)

```
useChatDemo()
  ├─ messages: ChatMessage[]
  ├─ isStreaming: boolean
  ├─ send(text, files) → push user msg, after 300ms começa streaming char-a-char
  ├─ stop() → cancela rAF em andamento, marca mensagem como interrompida
  └─ reset() → limpa messages
```

**Comportamento do `send` no mock:**

1. Push imediato de `MessageBubble role="user"` com texto + chips de anexo.
2. **Imediatamente** `isStreaming=true`. Como a bubble do assistant ainda não existe, `MessageList` renderiza `<StreamingIndicator />` no fim (3 pontos pulsando, label "Pensando...").
3. Após 300ms de pensamento simulado, cria bubble vazia do assistant com `id` e começa o typing via `requestAnimationFrame`. Assim que a bubble do assistant existe com pelo menos 1 char, `MessageList` **esconde o `<StreamingIndicator />`** — o cursor `▍` da própria bubble (`isStreaming=true` na `MessageBubble`) assume o feedback visual.
4. `requestAnimationFrame` digita ~120 ticks total (char-a-char em `fullResponse`), atualizando a bubble via `setMessages(prev => prev.map(...))`.
5. Ao terminar, `isStreaming=false` (hook) e a bubble remove o cursor.
6. Se `stop()` for chamado, o rAF é cancelado, `isStreaming=false`, a última mensagem do assistant recebe `variant='interrupted'`.

**Regra do `MessageList` para quem mostra o feedback:**
- `StreamingIndicator` aparece **só se** `isStreaming=true` **e** a última mensagem não é do assistant (ou é do assistant com content vazio). Caso contrário, o cursor da própria bubble faz o trabalho. Isso evita duplicidade visual.

## 4. Contratos dos primitivos

Tipos compartilhados em `src/agents/chat/types.ts`:

```ts
export type AttachmentType = 'image' | 'pdf' | 'text';

export interface Attachment {
  id: string;
  type: AttachmentType;
  file: File;
  name: string;
  sizeBytes: number;
  previewUrl?: string; // só pra image, via URL.createObjectURL
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: React.ReactNode;
  attachments?: Attachment[];
  createdAt: number; // timestamp em ms
  variant?: 'default' | 'error' | 'info' | 'interrupted';
}
```

### `ChatLayout`

```ts
interface ChatLayoutProps {
  mode: 'pure' | 'split';
  className?: string;
  children: React.ReactNode;
}

// Sub-compostos usados apenas no modo 'split':
ChatLayout.Panel:    React.FC<{ children: React.ReactNode }>;
ChatLayout.Divider:  React.FC<{}>;
ChatLayout.Artifact: React.FC<{ children: React.ReactNode }>;
```

- No `pure`: `grid-rows-[auto_1fr_auto]`, `max-width: 760px` centralizada (aprox. ChatGPT), padding lateral responsivo.
- No `split` (desktop ≥768px): `grid-cols-[minmax(420px,1fr)_auto_minmax(360px,1fr)]`. Tamanho da divisão persiste em `localStorage` sob a chave `seven.chat.split-size`. Resize via handle de 24px (hit area) / 1px (visual) usando `react-resizable-panels`.
- No `split` (<768px): chat ocupa fullscreen, `ArtifactPanel` vira `<Sheet>` lateral abrível por botão no `AgentHeader.rightSlot` (ícone `PanelRight`).

### `AgentHeader`

```ts
interface AgentHeaderProps {
  name: string;                   // "Caloni"
  subtitle?: string;              // "Decisor Comercial"
  avatarSrc?: string;             // fallback: inicial com gradient-primary
  status?: 'online' | 'thinking';
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}
```

- Altura 64px (desktop), 56px (mobile). `bg-card` com `backdrop-blur`, `border-b border-border`.
- Avatar 40px com `glow-primary-sm` quando `status='thinking'`.

### `MessageList`

```ts
interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}
```

- Auto-scroll para o fundo ao adicionar mensagem ou chunk **apenas se** usuário está a <80px do fim. Se rolou para cima, FAB flutuante `<Button variant="secondary" size="sm">↓ Novas mensagens</Button>` aparece no canto inferior direito.
- Spacing: 24px entre mensagens do mesmo role, 32px na transição user↔assistant.
- Sem virtualização. Nota técnica para revisar no sub-projeto 3 se threads > ~200 msgs.
- `role="log" aria-live="polite" aria-atomic="false"`; durante streaming, `aria-live="off"` para não spammar screen readers; volta a `polite` ao concluir.

### `MessageBubble`

```ts
interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  variant?: 'default' | 'error' | 'info' | 'interrupted';
  children: React.ReactNode;
  attachments?: Attachment[];
  timestamp?: number;
  isStreaming?: boolean; // cursor piscando no fim
}
```

- **User:** direita, `bg-primary text-primary-foreground`, `rounded-2xl rounded-br-sm`, `max-width: 70%` (85% em mobile).
- **Assistant:** esquerda, sem bubble (texto em `text-foreground`), avatar 24px apenas na primeira mensagem de uma sequência do mesmo role.
- **System:** centralizado, `text-muted-foreground`, menor.
- **error:** borda `border-destructive/40`, ícone `AlertCircle` no canto.
- **interrupted:** label `text-muted-foreground text-xs` embaixo: "Resposta interrompida".
- **isStreaming:** cursor `▍` com `animate-pulse` no fim do texto.
- Conteúdo string é renderizado com `whitespace-pre-wrap`. Consumer pode passar JSX arbitrário (cards, Markdown renderer, etc.).
- **Hover desktop / long-press mobile:** botão `Copy` no canto superior direito da mensagem do assistant. Copia o `textContent` via `navigator.clipboard.writeText`. Ícone muda para `Check` por 1.5s após cópia.
- **Timestamp:** `<time dateTime={ISO}>` em hover/tap, formato "há 2 min" via `date-fns` (já no repo? verificar — se não, usar `Intl.RelativeTimeFormat`).

### `PromptInputBox`

```ts
interface PromptInputBoxProps {
  onSend: (text: string, files: Attachment[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxFiles?: number;              // default 5
  acceptedTypes?: AttachmentType[]; // default ['image', 'pdf', 'text']
  disabled?: boolean;
  autoFocus?: boolean;            // default true
  initialValue?: string;          // valor inicial do textarea; usado só no primeiro render
  className?: string;
}

// Ref imperativo exposto via forwardRef + useImperativeHandle:
interface PromptInputBoxHandle {
  setValue: (text: string) => void;   // sobrescreve o texto atual
  focus: () => void;
  clear: () => void;                  // limpa texto + anexos
}
```

O `setValue` é o mecanismo que `ChatEmptyState.onPick` usa: a rota tem `ref<PromptInputBoxHandle>`, recebe o prompt clicado na pill, chama `ref.current?.setValue(prompt)` e depois `ref.current?.focus()`.

- Deriva do `ai-prompt-box` da 21st.dev, com modificações (Seção 5).
- **Enter envia**, **Shift+Enter** quebra linha.
- **Foco automático** no mount se `autoFocus !== false`.
- **Atalho `/` global** registra listener em `keydown` que foca o textarea se o foco não está em nenhum outro input (desktop only, detectar via `matchMedia('(pointer: fine)')`).
- Durante `isLoading=true`:
  - Se `onStop` definido: botão vira `Square` ícone, cor `destructive`, ao clicar chama `onStop`.
  - Se `onStop` não definido: botão desabilitado (mantém `ArrowUp`, opacity-50).
- Enviar desabilitado quando texto vazio E anexos vazios.
- Textarea autosize até 240px (160px em mobile).

### `ArtifactPanel`

```ts
interface ArtifactPanelProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}
```

- Header 56px com título + subtitle + toolbar + close.
- Body `overflow-auto`, padding 24px, `bg-card`.

### `StreamingIndicator`

```ts
interface StreamingIndicatorProps {
  variant?: 'dots' | 'pulse';
  label?: string; // default "Pensando..."
}
```

- 3 pontos com `animate-pulse`, delays 0/150/300ms via inline style.
- Se `prefers-reduced-motion`, pontos ficam estáticos.

### `FileAttachmentChip`

```ts
interface FileAttachmentChipProps {
  attachment: Attachment;
  onRemove?: () => void;          // ausência = modo read-only (mensagem)
  onClick?: () => void;
  size?: 'sm' | 'md';
}
```

- Imagem: thumb 64x64 (md) / 40x40 (sm), rounded, com preview via `previewUrl`.
- PDF: ícone `FileText` + nome truncado + tamanho formatado (`1.2 MB`).
- Texto: ícone `FileType` + nome + tamanho.
- X aparece se `onRemove` definido. Keyboard: `Tab` para focar, `Backspace`/`Delete` remove.

### `AttachmentPreviewModal`

```ts
interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}
```

- Usa `<Dialog>` do shadcn. Trap de foco vem do Radix.
- Imagem: zoom + pan básicos, botão "Baixar".
- PDF/texto: chip grande + botão "Baixar" (não renderiza conteúdo — fora do escopo).

### `ChatEmptyState`

```ts
interface ChatEmptyStateProps {
  agentName: string;
  agentMission?: string;
  avatarSrc?: string;
  suggestions?: Array<{ label: string; prompt: string }>;
  onPick?: (prompt: string) => void;
}
```

- Centralizado vertical, até ~60% vh.
- Avatar 80px com `glow-primary-sm`, nome em Outfit 24px bold, missão em Inter 16px `text-muted-foreground`.
- Suggestion pills: `<Button variant="outline" size="sm">` clicáveis; ao clicar, chamam `onPick(prompt)` — a rota pré-preenche o input mas **não envia**.

## 5. Adaptação do AI Prompt Box (21st.dev → SEVEN)

O componente é baixado via `shadcn-cli` e adaptado em um commit único (não fork externo).

### Passos

1. **Instalar dependências faltantes:**
   ```bash
   npm i framer-motion
   ```
   Radix Tooltip e Dialog já estão no repo via shadcn existentes. Confirmar no momento da execução.

2. **Rodar o add:**
   ```bash
   npx shadcn@latest add https://21st.dev/r/easemize/ai-prompt-box
   ```

3. **Remover código morto no mesmo commit:**
   - `VoiceRecorder` (arquivo/export completo).
   - Toggles `Search`/`Think`/`Canvas` (botões, estados, ícones `Globe`/`BrainCog`/`FolderCode`, lógica de prefixo nas mensagens).
   - Imports órfãos.

4. **Token swap** (tabela canônica):

| Original | Substituto |
|---|---|
| `#1F2023` (bg container) | `hsl(var(--card))` |
| `#444444` (border) | `hsl(var(--border))` |
| `text-gray-100` | `text-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| branco (send ativo) | `bg-primary text-primary-foreground` |
| `rounded-3xl` | `rounded-2xl` |
| `shadow-[0_8px_30px_rgba(0,0,0,0.24)]` | manter ou `shadow-premium` (classe existente) |
| scrollbar cinza hardcoded | cor → `hsl(var(--muted))` |

5. **Extensão para PDF + texto:**
   - `accept` do `<input type=file>`: `image/*,application/pdf,text/plain,text/markdown`.
   - Validação por tipo:
     - `image/*` → 10 MB, gera `previewUrl` via `URL.createObjectURL`.
     - `application/pdf` → 20 MB.
     - `text/plain`, `text/markdown` → 1 MB.
   - Rejeição dispara `toast.error(...)` via `sonner` já no repo.
   - Paste/drop expandidos para aceitar os novos mime types.

6. **Cleanup de `object URLs`:** `useEffect` de cleanup revoga `URL.revokeObjectURL(previewUrl)` ao desmontar ou remover anexo.

7. **`prefers-reduced-motion`:** wrappear todas as variants do `framer-motion` em check do media query. Fallback: animação imediata sem easing.

## 6. Theming

- App é dark fixo (`<html class="dark">` em `index.html`). Nenhum toggle nesta foundation.
- Todos os primitivos usam **apenas** CSS variables existentes no `src/index.css` (`--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--border`, etc.). Zero cor hardcoded nos primitivos.
- Classes utilitárias existentes que podem ser reutilizadas: `.glow-primary`, `.glow-primary-sm`, `.shadow-premium`, `.gradient-primary`.
- Se algum contraste específico do chat não passar em WCAG AA (testar), ajustar no `--muted-foreground` escopado (não tocar global).

## 7. Rota de demo e agente mock

### Rotas

Adicionadas em `src/App.tsx`, **fora** de `ProtectedRoute`:

```tsx
<Route path="/chat/demo" element={withSuspense(<ChatDemoLayout />)}>
  <Route index element={<Navigate to="pure" replace />} />
  <Route path="pure" element={withSuspense(<ChatDemoPure />)} />
  <Route path="split" element={withSuspense(<ChatDemoSplit />)} />
</Route>
```

Sem link no Header/BottomNav (dev tool). Build de produção inclui; se quiser esconder, envolver em `import.meta.env.DEV`.

### Agente mock

`src/agents/chat/demo/useChatDemo.ts` mantém `messages`, `isStreaming`. `send` empurra mensagem do user, após 300ms cria bubble vazia do assistant e digita com `requestAnimationFrame` ~120 ticks.

Respostas mock em `src/agents/chat/demo/mockResponses.ts`, decididas por palavras-chave no texto do user:

- Contém anexo imagem → "Recebi a imagem `{filename}`. Descreva..."
- Contém anexo PDF → "Li o PDF `{filename}`. Me conta o contexto..."
- Texto contém "diagnóstico" → resposta ~800 chars simulando os 7 blocos do Caloni (lorem temático).
- Texto contém "proposta" → resposta curta + dispara callback `onArtifact` que a rota `/split` usa para popular o `<ArtifactPanel>` com um mock `{ title, sections }` em `MockArtifact.tsx`.
- Default → eco: "Interessante. Pode me contar mais?"

### Header de controle do demo

Nas rotas `ChatDemoPure`/`ChatDemoSplit`:

- Botões: `Reset`, `Simular erro`, toggle `disabled`, toggle `streaming manual`.
- Badge com modo atual (`pure`/`split`).

## 8. Estrutura de arquivos

```
src/
├── components/
│   └── ui/
│       └── prompt-input-box.tsx
│
├── agents/
│   └── chat/
│       ├── index.ts                 # barrel público
│       ├── types.ts                 # ChatMessage, Attachment, AttachmentType
│       ├── utils.ts                 # formatBytes, pickFileIcon
│       ├── ChatLayout.tsx
│       ├── AgentHeader.tsx
│       ├── MessageList.tsx
│       ├── MessageBubble.tsx
│       ├── StreamingIndicator.tsx
│       ├── FileAttachmentChip.tsx
│       ├── AttachmentPreviewModal.tsx
│       ├── ArtifactPanel.tsx
│       ├── ChatEmptyState.tsx
│       └── demo/
│           ├── useChatDemo.ts
│           ├── mockResponses.ts
│           └── MockArtifact.tsx
│
└── pages/
    └── chat-demo/
        ├── ChatDemoLayout.tsx
        ├── ChatDemoPure.tsx
        └── ChatDemoSplit.tsx
```

**Barrel `src/agents/chat/index.ts`** exporta apenas os primitivos públicos (sem `demo/*`):

```ts
export { ChatLayout } from './ChatLayout';
export { AgentHeader } from './AgentHeader';
export { MessageList } from './MessageList';
export { MessageBubble } from './MessageBubble';
export { StreamingIndicator } from './StreamingIndicator';
export { FileAttachmentChip } from './FileAttachmentChip';
export { AttachmentPreviewModal } from './AttachmentPreviewModal';
export { ArtifactPanel } from './ArtifactPanel';
export { ChatEmptyState } from './ChatEmptyState';
export type { ChatMessage, Attachment, AttachmentType } from './types';
```

## 9. Paridade de interação com ChatGPT

Diretriz: qualquer convenção conhecida do ChatGPT funciona igual no SEVEN Chat. Divergir só quando SEVEN oferece algo novo (ex: modo split).

### Replicado

- Enter envia, Shift+Enter quebra linha.
- Paperclip à esquerda, Send à direita.
- Textarea autosize.
- Foco automático no textarea ao montar.
- `/` foca o input quando o foco não está em outro input (desktop apenas).
- Send desabilitado com input vazio.
- Cursor piscando no fim enquanto streaming.
- `StreamingIndicator` (3 pontos) antes do primeiro token.
- **Botão Stop substitui Send durante streaming** (cor `destructive`, ícone `Square`).
- User direita com bubble; assistant esquerda sem bubble.
- Auto-scroll inteligente.
- FAB "↓ Novas mensagens" quando rolou pra cima.
- Botão Copy em hover/long-press na mensagem do assistant.
- Timestamp em hover/tap.
- Empty state: avatar grande, nome, missão, 3-4 suggestion pills clicáveis.
- Max-width da coluna ~760px.
- Spacing: 24px entre mensagens do mesmo role, 32px na transição.
- Mobile: fullscreen, header reduzido, safe-area-inset-bottom respeitado.

### Divergências conscientes

- Sem sidebar de threads.
- Sem seletor de modelo.
- Sem custom instructions / memory panel.
- Sem voice mode.
- **Adição:** modo `split` com painel de artefato à direita (ChatGPT não tem).

## 10. Acessibilidade

### Requisitos

- **Contraste WCAG AA:** validar todos os pares foreground/background no dark mode. Ajustar `--muted-foreground` escopado se necessário.
- **Landmarks semânticos:** `<header>` para AgentHeader, `<main role="log">` para MessageList, `<footer>` para PromptInputBox.
- **`aria-live`:** `MessageList` com `polite` fora de streaming, `off` durante streaming; volta ao concluir.
- **Focus management:** após envio, foco volta para textarea; `AttachmentPreviewModal` usa trap do Radix Dialog.
- **Teclado:** Tab/Shift+Tab navegam todos os controles; Esc fecha modal/preview; Backspace remove chip focado.
- **`aria-label`** em todo ícone-botão ("Anexar arquivo", "Enviar mensagem", "Remover anexo {name}", "Copiar mensagem").
- **`prefers-reduced-motion`:** desabilita typing effect (cola resposta inteira), fade-in de mensagens, rotação/scale de ícones, pulse do `StreamingIndicator`.
- **Chip de imagem** tem `alt` = nome do arquivo; PDF/texto tem `aria-label` = `"Anexo {tipo}: {name}, {size}"`.

### Aceite manual

- [ ] Navegação por teclado só no `PromptInputBox` (Tab, Shift+Tab, Enter, Esc).
- [ ] VoiceOver/NVDA anuncia mensagens novas corretamente.
- [ ] Redimensionar viewport 1440→375: nada quebra.
- [ ] `prefers-reduced-motion` ativo: sem typing, sem rotações.
- [ ] iOS Safari com teclado virtual: prompt acima do teclado.
- [ ] Lighthouse A11y ≥ 95 na rota `/chat/demo/pure`.

## 11. Responsividade

- **Breakpoint mobile:** `< 768px`.
- **Modo `pure` em mobile:**
  - `AgentHeader` 56px.
  - Padding lateral 12px.
  - Bubble user até 85% width.
  - Textarea max 160px.
  - `pb-[env(safe-area-inset-bottom)]` no container do input.
- **Modo `split` em mobile:**
  - Chat ocupa viewport.
  - `ArtifactPanel` vira `<Sheet>` lateral (90% width) abrível por botão no `AgentHeader.rightSlot`.
- **Chips de anexo em mobile:** `overflow-x-auto` em vez de wrap.
- **Viewport:** usar `dvh` em vez de `vh` para não quebrar com teclado virtual.

## 12. Testes

### Vitest (`src/agents/chat/__tests__/*`)

Um arquivo por primitivo, cobrindo:

- **`PromptInputBox.test.tsx`:**
  - Renderiza com placeholder custom.
  - Enter envia, Shift+Enter quebra linha.
  - Submit vazio não dispara `onSend`.
  - Anexar PDF ≤20MB → chip aparece.
  - Anexar PDF >20MB → `toast.error`, sem chip.
  - Remover chip → estado volta.
  - Autosize cresce até max.
  - `isLoading=true` + `onStop` definido → botão Stop visível; ao clicar, chama `onStop`.
  - `isLoading=true` + sem `onStop` → botão Send desabilitado.
  - `autoFocus=true` (default) foca o textarea no mount.

- **`MessageBubble.test.tsx`:**
  - Cada `role` renderiza alinhamento e estilo corretos.
  - `isStreaming` mostra cursor.
  - `variant='error'` mostra ícone.
  - `variant='interrupted'` mostra label.
  - Copy button copia o `textContent`.
  - Hover revela Copy (desktop).

- **`MessageList.test.tsx`:**
  - Renderiza messages em ordem.
  - `emptyState` aparece quando `messages.length === 0`.
  - Auto-scroll só quando já no fim (simular scroll com `Element.prototype.scrollTo` mockado).
  - FAB "Novas mensagens" aparece quando rolou pra cima e chega mensagem nova.

- **`ChatLayout.test.tsx`:**
  - Modo `pure`: grid 3 linhas.
  - Modo `split`: 3 colunas com divider.
  - Persiste tamanho do split em `localStorage`.
  - Em mobile, `split` colapsa (verificar via `matchMedia` mockado).

- **`ChatEmptyState.test.tsx`:**
  - Renderiza avatar, nome, missão.
  - Suggestions clicáveis chamam `onPick` com o `prompt`.

- **`useChatDemo.test.ts`:**
  - `send` empurra user msg imediatamente e já seta `isStreaming=true`.
  - Durante os primeiros 300ms, ainda não há bubble do assistant (`MessageList` mostra StreamingIndicator).
  - Após 300ms, bubble vazia do assistant aparece; typing começa; cursor da bubble assume (StreamingIndicator some).
  - Streaming digita até terminar; `isStreaming=false` ao final; cursor some da bubble.
  - `stop()` cancela streaming, `isStreaming=false`, última mensagem do assistant marcada com `variant='interrupted'`.
  - `reset()` limpa messages.

### Manuais

Checklist de paridade ChatGPT (Seção 9) + checklist de acessibilidade (Seção 10).

## 13. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| URL do 21st.dev muda ou componente é removido | Código é baixado e commitado; repo é nosso. Breakage futuro não afeta. |
| `framer-motion` (~50kb gzip) aumenta bundle | Aceitável para o SEVEN (já ships React, shadcn, Radix). Alternativa (reescrever animações) é trabalho sem retorno. |
| `react-resizable-panels` pode ter issues em mobile | Modo split em mobile colapsa pra Sheet, não usa resizable. Biblioteca só roda em desktop. |
| Typing effect do mock pode ficar lento em dispositivos fracos | `requestAnimationFrame` respeita device frame rate; `prefers-reduced-motion` cola a resposta instantânea. |
| Desalinhamento entre mock streaming e o que o backend SSE vai entregar no sub-projeto 2 | Mock usa chars; backend vai enviar chunks variáveis. Interface do componente (`isStreaming: boolean` + `content` atualizável) é agnóstica. Adaptação acontece no sub-projeto 2. |
| Foundation entrega componentes, mas sub-projeto 3 descobre que faltou primitivo (ex: `<ThreadList>`) | Aceitável. Cada migração pode propor novos primitivos. A foundation não precisa prever tudo. |

## 14. Critérios de aceite

- [ ] `npx shadcn@latest add ai-prompt-box` executado; código adaptado e commitado.
- [ ] Primitivos listados na Seção 4 existem, tipados, exportados pelo barrel.
- [ ] Rota `/chat/demo/pure` renderiza chat com agente mock; streaming funciona.
- [ ] Rota `/chat/demo/split` renderiza split; `ArtifactPanel` popula quando mensagem contém "proposta".
- [ ] Suggestion pills no empty state pré-preenchem o input (sem enviar).
- [ ] Enter envia, Shift+Enter quebra linha, `/` foca input (desktop).
- [ ] Durante streaming, botão vira Stop; clicar interrompe.
- [ ] Copy em hover/long-press funciona.
- [ ] Anexar imagem, PDF, texto funcionam; validação de tamanho dispara toast em falha.
- [ ] Testes Vitest listados na Seção 12 passam.
- [ ] Lighthouse A11y ≥ 95 na rota demo.
- [ ] Checklist de paridade ChatGPT (Seção 9) e responsividade (Seção 11) completos em QA manual.

## 15. Próximos passos após esta spec

- Plano de implementação via skill `superpowers:writing-plans`.
- Execução do plano (sub-projeto 1).
- Sub-projeto 2 (backend de chat + persistência) ganha sua própria spec quando for iniciado.
- Sub-projeto 3 (migração das ferramentas) — uma spec por ferramenta, decidir ordem no momento (sugestão preliminar: Diagnóstico Caloni primeiro por ser o mais pure-chat).
