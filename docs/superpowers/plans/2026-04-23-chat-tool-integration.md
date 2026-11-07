# Chat Tool Integration Implementation Plan (Fase 1 — Validação Caloni)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir `ToolDetail` em `/tools/:slug` por um chat parametrizado por `AgentRegistry`, com piloto completo da Validação Caloni rodando contra backend real e streaming simulado no front.

**Architecture:** Três camadas: primitivas do chat (`src/agents/chat/`, já existentes), registry (`src/agents/registry.ts`, novo) que mapeia `slug → AgentConfig`, e página parametrizada (`src/pages/ChatToolPage.tsx`, novo) que consulta o registry pra montar a tela. Pílulas do empty state podem prefill, abrir proposal picker ou file picker. Backend é chamado via adapter com `AbortController`; resposta textual streama char-a-char com `requestAnimationFrame`; payload estruturado renderiza inline no bubble via `config.renderResult`.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Testing Library, React Router, shadcn/ui, Tailwind. Foto real do Caloni em `/public/caloni-photo.jpg.jpg`.

**Spec de referência:** `docs/superpowers/specs/2026-04-23-chat-tool-integration-design.md`

---

### Task 1: Migrar `ChatSuggestion` → `Suggestion` com ações tipadas

**Files:**
- Modify: `src/agents/chat/types.ts`
- Modify: `src/agents/chat/ChatEmptyState.tsx`
- Modify: `src/agents/chat/index.ts`
- Modify: `src/agents/chat/__tests__/ChatEmptyState.test.tsx`
- Modify: `src/pages/chat-demo/ChatDemoPure.tsx`
- Modify: `src/pages/chat-demo/ChatDemoPure.test.tsx` (se referenciar SUGGESTIONS)

- [ ] **Step 1: Escrever o teste atualizado para ChatEmptyState**

Substitua `src/agents/chat/__tests__/ChatEmptyState.test.tsx` por:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatEmptyState } from '../ChatEmptyState';
import type { Suggestion } from '../types';

describe('ChatEmptyState', () => {
  it('renderiza nome e missão', () => {
    render(<ChatEmptyState agentName="Caloni" agentMission="Decisor Comercial" />);
    expect(screen.getByText('Caloni')).toBeInTheDocument();
    expect(screen.getByText('Decisor Comercial')).toBeInTheDocument();
  });

  it('renderiza suggestion pills e dispara onPick com a Suggestion inteira', () => {
    const onPick = vi.fn();
    const suggestions: Suggestion[] = [
      { label: 'Diagnóstico', action: { kind: 'prefill', text: 'Diagnostica meu negócio' } },
      { label: 'Proposta salva', action: { kind: 'open-proposal-picker' } },
      { label: 'PDF externo', action: { kind: 'open-file-picker' } },
    ];
    render(<ChatEmptyState agentName="Caloni" suggestions={suggestions} onPick={onPick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Diagnóstico' }));
    expect(onPick).toHaveBeenCalledWith(suggestions[0]);

    fireEvent.click(screen.getByRole('button', { name: 'Proposta salva' }));
    expect(onPick).toHaveBeenCalledWith(suggestions[1]);

    fireEvent.click(screen.getByRole('button', { name: 'PDF externo' }));
    expect(onPick).toHaveBeenCalledWith(suggestions[2]);
  });

  it('sem suggestions: não renderiza lista', () => {
    render(<ChatEmptyState agentName="Caloni" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste pra confirmar que falha**

Run: `npx vitest run src/agents/chat/__tests__/ChatEmptyState.test.tsx`
Expected: FAIL — tipo `Suggestion` não existe ainda; a assinatura de `onPick` ainda recebe string.

- [ ] **Step 3: Adicionar o tipo `Suggestion` em `src/agents/chat/types.ts`**

Adicione ao final de `src/agents/chat/types.ts`:

```ts
export interface Suggestion {
  label: string;
  action:
    | { kind: 'prefill'; text: string }
    | { kind: 'open-proposal-picker' }
    | { kind: 'open-file-picker' };
}
```

- [ ] **Step 4: Atualizar `ChatEmptyState.tsx` pra usar `Suggestion`**

Substitua o conteúdo de `src/agents/chat/ChatEmptyState.tsx` por:

```tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Suggestion } from './types';

export interface ChatEmptyStateProps {
  agentName: string;
  agentMission?: string;
  avatarSrc?: string;
  suggestions?: Suggestion[];
  onPick?: (suggestion: Suggestion) => void;
  className?: string;
}

export function ChatEmptyState({
  agentName,
  agentMission,
  avatarSrc,
  suggestions,
  onPick,
  className,
}: ChatEmptyStateProps) {
  return (
    <div className={cn('flex max-w-[760px] flex-col items-center gap-4 px-6 py-12 text-center', className)}>
      <Avatar className="h-20 w-20 glow-primary-sm">
        {avatarSrc ? <AvatarImage src={avatarSrc} alt={agentName} /> : null}
        <AvatarFallback className="gradient-primary text-2xl text-primary-foreground">
          {agentName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <h1 className="font-display text-2xl font-bold text-foreground">{agentName}</h1>
      {agentMission ? <p className="max-w-md text-sm text-muted-foreground">{agentMission}</p> : null}

      {suggestions && suggestions.length > 0 ? (
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <li key={s.label}>
              <Button variant="outline" size="sm" type="button" onClick={() => onPick?.(s)}>
                {s.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Atualizar exports em `src/agents/chat/index.ts`**

Substitua a linha `export type { ChatEmptyStateProps, ChatSuggestion } from './ChatEmptyState';` por:

```ts
export type { ChatEmptyStateProps } from './ChatEmptyState';
```

E adicione `Suggestion` ao final do arquivo:

```ts
export type { Attachment, AttachmentType, ChatMessage, MessageRole, MessageVariant, Suggestion } from './types';
```

(Substitua a linha existente `export type { Attachment, AttachmentType, ChatMessage, MessageRole, MessageVariant } from './types';` pela linha acima.)

- [ ] **Step 6: Atualizar o demo `ChatDemoPure.tsx` pro novo shape**

Em `src/pages/chat-demo/ChatDemoPure.tsx`, substitua:

```tsx
const SUGGESTIONS = [
  { label: 'Diagnóstico rápido', prompt: 'Faça um diagnóstico do meu negócio' },
  { label: 'Nova proposta', prompt: 'Quero montar uma proposta para um cliente' },
  { label: 'Qualificar lead', prompt: 'Preciso qualificar um lead novo' },
];
```

Por:

```tsx
import type { Suggestion } from '@/agents/chat';

const SUGGESTIONS: Suggestion[] = [
  { label: 'Diagnóstico rápido', action: { kind: 'prefill', text: 'Faça um diagnóstico do meu negócio' } },
  { label: 'Nova proposta', action: { kind: 'prefill', text: 'Quero montar uma proposta para um cliente' } },
  { label: 'Qualificar lead', action: { kind: 'prefill', text: 'Preciso qualificar um lead novo' } },
];
```

E substitua o callback `onPick`:

```tsx
onPick={(prompt) => {
  inputRef.current?.setValue(prompt);
  inputRef.current?.focus();
}}
```

Por:

```tsx
onPick={(suggestion) => {
  if (suggestion.action.kind === 'prefill') {
    inputRef.current?.setValue(suggestion.action.text);
    inputRef.current?.focus();
  }
}}
```

- [ ] **Step 7: Verificar se `ChatDemoPure.test.tsx` precisa de ajuste**

Run: `npx vitest run src/pages/chat-demo/ChatDemoPure.test.tsx`
Expected: se falhar por causa da mudança de shape, ajustar os mocks do teste para o novo formato; se passar, seguir.

- [ ] **Step 8: Rodar todos os testes de chat pra confirmar que passam**

Run: `npx vitest run src/agents/chat src/pages/chat-demo`
Expected: PASS em todos.

- [ ] **Step 9: Commit**

```bash
git add src/agents/chat/types.ts src/agents/chat/ChatEmptyState.tsx src/agents/chat/index.ts src/agents/chat/__tests__/ChatEmptyState.test.tsx src/pages/chat-demo/ChatDemoPure.tsx
git commit -m "refactor(chat): migrate ChatSuggestion to Suggestion with typed actions"
```

---

### Task 2: Adicionar `openFilePicker` com flag `autoSend` ao `PromptInputBoxHandle`

**Files:**
- Modify: `src/components/ui/prompt-input-box.tsx`
- Modify: `src/agents/chat/__tests__/PromptInputBox.test.tsx`

- [ ] **Step 1: Escrever teste para `openFilePicker`**

Adicione ao final do arquivo `src/agents/chat/__tests__/PromptInputBox.test.tsx` (sem remover testes existentes):

```tsx
import { createRef } from 'react';
import type { PromptInputBoxHandle } from '@/components/ui/prompt-input-box';

describe('PromptInputBox.openFilePicker (handle)', () => {
  it('expõe método openFilePicker que dispara click no input file interno', () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    render(<PromptInputBox ref={ref} onSend={onSend} />);

    expect(typeof ref.current?.openFilePicker).toBe('function');

    const hidden = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(hidden, 'click');

    ref.current?.openFilePicker();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('com autoSend=true, ao selecionar arquivo PDF dispara onSend direto sem staging', () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    render(<PromptInputBox ref={ref} onSend={onSend} />);

    ref.current?.openFilePicker({ autoSend: true });

    const hidden = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['conteudo'], 'teste.pdf', { type: 'application/pdf' });
    Object.defineProperty(hidden, 'files', { value: [file], configurable: true });
    fireEvent.change(hidden);

    expect(onSend).toHaveBeenCalledTimes(1);
    const [text, attachments] = onSend.mock.calls[0];
    expect(text).toBe('');
    expect(attachments).toHaveLength(1);
    expect(attachments[0].type).toBe('pdf');
  });

  it('sem autoSend (default), ao selecionar arquivo apenas faz staging como chip', () => {
    const ref = createRef<PromptInputBoxHandle>();
    const onSend = vi.fn();
    render(<PromptInputBox ref={ref} onSend={onSend} />);

    ref.current?.openFilePicker();

    const hidden = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['conteudo'], 'teste.pdf', { type: 'application/pdf' });
    Object.defineProperty(hidden, 'files', { value: [file], configurable: true });
    fireEvent.change(hidden);

    expect(onSend).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/agents/chat/__tests__/PromptInputBox.test.tsx -t openFilePicker`
Expected: FAIL — método `openFilePicker` não existe na handle.

- [ ] **Step 3: Atualizar `PromptInputBoxHandle` e implementação**

Em `src/components/ui/prompt-input-box.tsx`, substitua a interface `PromptInputBoxHandle`:

```ts
export interface PromptInputBoxHandle {
  setValue: (text: string) => void;
  focus: () => void;
  clear: () => void;
  openFilePicker: (options?: { autoSend?: boolean }) => void;
}
```

Em seguida, localize o bloco `useImperativeHandle` e localize o `uploadInputRef` + handler de change do input file. Adicione um state interno `autoSendOnNextFileRef = React.useRef(false)` logo após a declaração de `uploadInputRef`:

```ts
const autoSendOnNextFileRef = React.useRef(false);
```

No `useImperativeHandle`, adicione o método `openFilePicker`:

```ts
React.useImperativeHandle(
  ref,
  () => ({
    setValue: (text: string) => {
      setInput(text);
    },
    focus: () => {
      textareaRef.current?.focus();
    },
    clear: () => {
      clearComposer();
    },
    openFilePicker: (options?: { autoSend?: boolean }) => {
      autoSendOnNextFileRef.current = options?.autoSend === true;
      uploadInputRef.current?.click();
    },
  }),
  [clearComposer]
);
```

Localize o handler existente de `onChange` do input file (procure por `uploadInputRef` no JSX — provavelmente `handleFileChange` ou similar). Dentro dele, após o processamento do arquivo em `Attachment` e antes do `setAttachments([...])` (ou onde quer que o staging aconteça), adicione a lógica de auto-send:

```ts
const attachment: Attachment = /* ... attachment construído normalmente ... */;

if (autoSendOnNextFileRef.current) {
  autoSendOnNextFileRef.current = false;
  if (uploadInputRef.current) uploadInputRef.current.value = "";
  onSend('', [attachment]);
  return;
}

// fluxo existente de staging como chip segue aqui
setAttachments((prev) => [...prev, attachment]);
```

> **Nota:** o handler exato depende do código atual do componente — leia `src/components/ui/prompt-input-box.tsx` em volta do `uploadInputRef` e intercepte o ponto onde um `Attachment` acabou de ser criado a partir do `File`.

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/agents/chat/__tests__/PromptInputBox.test.tsx`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/prompt-input-box.tsx src/agents/chat/__tests__/PromptInputBox.test.tsx
git commit -m "feat(prompt-input): add openFilePicker handle with autoSend option"
```

---

### Task 3: Adicionar campo `payload` ao `ChatMessage`

**Files:**
- Modify: `src/agents/chat/types.ts`

- [ ] **Step 1: Adicionar campo `payload`**

Em `src/agents/chat/types.ts`, atualize a interface `ChatMessage`:

```ts
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: ReactNode;
  attachments?: Attachment[];
  createdAt: number;
  variant?: MessageVariant;
  payload?: unknown;
}
```

- [ ] **Step 2: Rodar type-check pra garantir que não quebrou nada**

Run: `npx tsc --noEmit`
Expected: PASS sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/agents/chat/types.ts
git commit -m "feat(chat-types): add optional payload field to ChatMessage"
```

---

### Task 4: Extrair funções puras de análise do Caloni para `adapter.ts`

**Files:**
- Create: `src/agents/caloni/adapter.ts`
- Create: `src/agents/caloni/__tests__/adapter.test.ts`

- [ ] **Step 1: Escrever os testes do adapter**

Crie `src/agents/caloni/__tests__/adapter.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { caloniAdapter, buildIntroFromResult } from '../adapter';
import calonService, { type CalonAnalysis } from '@/services/calonService';

const MOCK_RESULT: CalonAnalysis = {
  overallScore: 7.8,
  overallLabel: 'Proposta Forte',
  strongPoints: ['Boa estrutura'],
  weakPoints: ['Falta prova social'],
  criteria: [{ name: 'Clareza', score: 8, comment: 'Ok' }],
  suggestions: ['Adicionar casos'],
  analysedAt: Date.now(),
};

describe('caloniAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('com context.proposalId chama analyzeByProposalId e retorna text + payload', async () => {
    vi.spyOn(calonService, 'analyzeByProposalId').mockResolvedValue(MOCK_RESULT);
    const ctrl = new AbortController();

    const res = await caloniAdapter.send(
      { text: '', attachments: [], context: { proposalId: 'p1' } },
      ctrl.signal,
    );

    expect(calonService.analyzeByProposalId).toHaveBeenCalledWith('p1');
    expect(res.payload).toEqual(MOCK_RESULT);
    expect(res.text).toContain('7.8');
    expect(res.text).toContain('Proposta Forte');
  });

  it('com anexo PDF chama analyzeFile e retorna text + payload', async () => {
    vi.spyOn(calonService, 'analyzeFile').mockResolvedValue(MOCK_RESULT);
    const ctrl = new AbortController();
    const file = new File(['x'], 'p.pdf', { type: 'application/pdf' });

    const res = await caloniAdapter.send(
      {
        text: '',
        attachments: [{ id: 'a1', type: 'pdf', file, name: 'p.pdf', sizeBytes: 1 }],
      },
      ctrl.signal,
    );

    expect(calonService.analyzeFile).toHaveBeenCalledWith(file);
    expect(res.payload).toEqual(MOCK_RESULT);
  });

  it('sem proposalId e sem PDF retorna mensagem de recusa sem chamar API', async () => {
    const analyzeSpy = vi.spyOn(calonService, 'analyzeFile');
    const byIdSpy = vi.spyOn(calonService, 'analyzeByProposalId');
    const ctrl = new AbortController();

    const res = await caloniAdapter.send(
      { text: 'olá', attachments: [] },
      ctrl.signal,
    );

    expect(analyzeSpy).not.toHaveBeenCalled();
    expect(byIdSpy).not.toHaveBeenCalled();
    expect(res.payload).toBeUndefined();
    expect(res.text).toMatch(/proposta salva|PDF/i);
  });
});

describe('buildIntroFromResult', () => {
  it('monta frase com score e label', () => {
    const text = buildIntroFromResult(MOCK_RESULT);
    expect(text).toContain('7.8');
    expect(text).toContain('Proposta Forte');
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/agents/caloni/__tests__/adapter.test.ts`
Expected: FAIL — arquivo `adapter.ts` não existe.

- [ ] **Step 3: Criar o adapter**

Crie `src/agents/caloni/adapter.ts`:

```ts
import calonService, { type CalonAnalysis } from '@/services/calonService';
import type { Attachment } from '@/agents/chat';

export interface AgentContext {
  proposalId?: string;
}

export interface AgentInput {
  text: string;
  attachments: Attachment[];
  context?: AgentContext;
}

export interface AgentResponse {
  text: string;
  payload?: unknown;
}

export interface AgentAdapter {
  send: (input: AgentInput, signal: AbortSignal) => Promise<AgentResponse>;
}

export function buildIntroFromResult(result: CalonAnalysis): string {
  const score = result.overallScore.toFixed(1);
  const label = result.overallLabel;
  return `Analisei a proposta. Score: ${score} — ${label}. Vou destacar os pontos principais abaixo.`;
}

export const caloniAdapter: AgentAdapter = {
  async send({ text: _text, attachments, context }, _signal) {
    if (context?.proposalId) {
      const result = await calonService.analyzeByProposalId(context.proposalId);
      return { text: buildIntroFromResult(result), payload: result };
    }

    const pdf = attachments.find((a) => a.type === 'pdf');
    if (pdf) {
      const result = await calonService.analyzeFile(pdf.file);
      return { text: buildIntroFromResult(result), payload: result };
    }

    return {
      text:
        'Pra eu analisar, preciso que você selecione uma proposta salva ou anexe um PDF. Use as opções no início da conversa.',
    };
  },
};
```

> **Observação sobre AbortSignal:** `calonService` hoje não propaga `signal` para `axios`. Nesta fase o `signal` é aceito mas não é forwardado — o `AbortController` do hook cobre o cancelamento do streaming simulado. Propagação real para `axios` pode virar um spec futuro (backend stream).

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/agents/caloni/__tests__/adapter.test.ts`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/agents/caloni/adapter.ts src/agents/caloni/__tests__/adapter.test.ts
git commit -m "feat(caloni): add agent adapter with send over real Caloni service"
```

---

### Task 5: Extrair `useUserProposals` para módulo compartilhado

**Files:**
- Create: `src/pages/tools/shared/useUserProposals.ts`
- Create: `src/pages/tools/shared/__tests__/useUserProposals.test.tsx`

- [ ] **Step 1: Escrever teste de `useUserProposals`**

Crie `src/pages/tools/shared/__tests__/useUserProposals.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserProposals } from '../useUserProposals';
import { proposalService, type Proposal } from '@/services/proposalService';

const MOCK: Proposal[] = [
  {
    id: 'p1',
    userId: 'u1',
    title: 'Cliente X',
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    projectDescription: '',
    scope: '',
    value: '',
    deadline: '',
    notes: '',
    status: 'ready',
    createdAt: '',
    updatedAt: '',
  },
];

describe('useUserProposals', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('com userId válido, busca propostas e expõe loading=false ao final', async () => {
    vi.spyOn(proposalService, 'getAll').mockResolvedValue(MOCK);
    const { result } = renderHook(() => useUserProposals('u1'));

    expect(result.current.proposalsLoading).toBe(true);
    await waitFor(() => expect(result.current.proposalsLoading).toBe(false));
    expect(result.current.proposals).toEqual(MOCK);
  });

  it('sem userId, retorna lista vazia e loading=false imediatamente', async () => {
    const spy = vi.spyOn(proposalService, 'getAll').mockResolvedValue(MOCK);
    const { result } = renderHook(() => useUserProposals(undefined));

    await waitFor(() => expect(result.current.proposalsLoading).toBe(false));
    expect(result.current.proposals).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('ao erro do service, cai pra lista vazia e loading=false', async () => {
    vi.spyOn(proposalService, 'getAll').mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useUserProposals('u1'));

    await waitFor(() => expect(result.current.proposalsLoading).toBe(false));
    expect(result.current.proposals).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/pages/tools/shared/__tests__/useUserProposals.test.tsx`
Expected: FAIL — arquivo `useUserProposals.ts` não existe.

- [ ] **Step 3: Criar o hook (portado de `caloniAnalysisFlow.ts`)**

Crie `src/pages/tools/shared/useUserProposals.ts`:

```ts
import { useEffect, useState } from 'react';
import { proposalService, type Proposal } from '@/services/proposalService';

export function useUserProposals(userId?: string) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProposals([]);
      setProposalsLoading(false);
      return;
    }

    setProposalsLoading(true);
    proposalService
      .getAll(userId)
      .then(setProposals)
      .catch(() => setProposals([]))
      .finally(() => setProposalsLoading(false));
  }, [userId]);

  return { proposals, proposalsLoading };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/pages/tools/shared/__tests__/useUserProposals.test.tsx`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tools/shared/useUserProposals.ts src/pages/tools/shared/__tests__/useUserProposals.test.tsx
git commit -m "feat(tools-shared): extract useUserProposals from caloniAnalysisFlow"
```

---

### Task 6: Criar `AgentRegistry` com config da Validação Caloni e placeholders

**Files:**
- Create: `src/agents/registry.ts`
- Create: `src/agents/__tests__/registry.test.tsx`

- [ ] **Step 1: Escrever o teste do registry**

Crie `src/agents/__tests__/registry.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { agentRegistry } from '../registry';

describe('agentRegistry', () => {
  it('contém config completa para validacao-caloni', () => {
    const cfg = agentRegistry['validacao-caloni'];
    expect(cfg).toBeDefined();
    expect(cfg.id).toBe('caloni-v1');
    expect(cfg.name).toBe('Caloni');
    expect(cfg.subtitle).toBe('Decisor Comercial Assistido');
    expect(cfg.avatarSrc).toBe('/caloni-photo.jpg.jpg');
    expect(cfg.mission).toContain('Calone');
    expect(cfg.suggestions).toHaveLength(2);
    expect(cfg.suggestions[0].action.kind).toBe('open-proposal-picker');
    expect(cfg.suggestions[1].action.kind).toBe('open-file-picker');
    expect(cfg.adapter).toBeDefined();
    expect(cfg.renderResult).toBeDefined();
  });

  it('contém placeholders para as outras 3 ferramentas (Fases 2-4)', () => {
    expect(agentRegistry['proposta-comercial-smart']).toBeDefined();
    expect(agentRegistry['diagnostico-comercial-caloni']).toBeDefined();
    expect(agentRegistry['qualificacao-de-leads']).toBeDefined();
  });

  it('placeholders retornam mensagem de "não migrado" sem chamar backend', async () => {
    const cfg = agentRegistry['proposta-comercial-smart'];
    const ctrl = new AbortController();
    const res = await cfg.adapter.send({ text: 'oi', attachments: [] }, ctrl.signal);
    expect(res.text).toMatch(/não foi migrada|construção|fluxo antigo/i);
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/agents/__tests__/registry.test.tsx`
Expected: FAIL — arquivo `registry.ts` não existe.

- [ ] **Step 3: Criar `src/agents/registry.ts`**

```tsx
import type { ReactNode } from 'react';
import type { Suggestion } from '@/agents/chat';
import { caloniAdapter, type AgentAdapter } from '@/agents/caloni/adapter';
import { CaloniResultCard } from '@/agents/caloni/CaloniResultCard';
import type { CalonAnalysis } from '@/services/calonService';

export interface AgentConfig {
  id: string;
  name: string;
  subtitle: string;
  avatarSrc: string;
  mission: string;
  suggestions: Suggestion[];
  adapter: AgentAdapter;
  renderResult?: (payload: unknown) => ReactNode;
}

const placeholderAdapter = (slug: string): AgentAdapter => ({
  async send() {
    return {
      text:
        'Esta ferramenta ainda não foi migrada para o novo formato de chat. ' +
        `Use o fluxo antigo em /tools/${slug}/app enquanto a migração é concluída.`,
    };
  },
});

export const agentRegistry: Record<string, AgentConfig> = {
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
    renderResult: (payload) => <CaloniResultCard result={payload as CalonAnalysis} />,
  },

  'proposta-comercial-smart': {
    id: 'placeholder-proposta-comercial',
    name: 'Proposta Comercial',
    subtitle: 'Em construção no novo formato',
    avatarSrc: '/caloni-photo.jpg.jpg',
    mission:
      'Esta ferramenta ainda não foi migrada para o chat. Enquanto isso, use o fluxo tradicional.',
    suggestions: [],
    adapter: placeholderAdapter('proposta-comercial-smart'),
  },

  'diagnostico-comercial-caloni': {
    id: 'placeholder-diagnostico',
    name: 'Diagnóstico Comercial',
    subtitle: 'Em construção no novo formato',
    avatarSrc: '/caloni-photo.jpg.jpg',
    mission:
      'Esta ferramenta ainda não foi migrada para o chat. Enquanto isso, use o fluxo tradicional.',
    suggestions: [],
    adapter: placeholderAdapter('diagnostico-comercial-caloni'),
  },

  'qualificacao-de-leads': {
    id: 'placeholder-qualificacao',
    name: 'Qualificação de Leads',
    subtitle: 'Em construção no novo formato',
    avatarSrc: '/caloni-photo.jpg.jpg',
    mission:
      'Esta ferramenta ainda não foi migrada para o chat. Enquanto isso, use o fluxo tradicional.',
    suggestions: [],
    adapter: placeholderAdapter('qualificacao-de-leads'),
  },
};
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/agents/__tests__/registry.test.tsx`
Expected: PASS em todos (o teste depende do `CaloniResultCard` existir na próxima task, mas a importação não é executada em tempo de teste a menos que o registry seja usado — se o teste rodar mesmo assim, seguir; se falhar por import, implemente a Task 7 primeiro e reexecute).

> **Observação:** se os testes do registry falharem por causa do import de `CaloniResultCard`, **troque a ordem**: execute a Task 7 antes de finalizar o step 4 aqui, depois volte e re-rode.

- [ ] **Step 5: Commit**

```bash
git add src/agents/registry.ts src/agents/__tests__/registry.test.tsx
git commit -m "feat(agents): add AgentRegistry with Caloni config and placeholders"
```

---

### Task 7: Criar `CaloniResultCard` (adaptado de `CaloniResultState`, sem container)

**Files:**
- Create: `src/agents/caloni/CaloniResultCard.tsx`
- Create: `src/agents/caloni/__tests__/CaloniResultCard.test.tsx`

- [ ] **Step 1: Escrever o teste do card**

Crie `src/agents/caloni/__tests__/CaloniResultCard.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaloniResultCard } from '../CaloniResultCard';
import type { CalonAnalysis } from '@/services/calonService';

const RESULT: CalonAnalysis = {
  overallScore: 7.8,
  overallLabel: 'Proposta Forte',
  strongPoints: ['Boa abertura'],
  weakPoints: ['Falta prova social'],
  criteria: [{ name: 'Clareza', score: 8, comment: 'Bem estruturada' }],
  suggestions: ['Adicionar cases'],
  analysedAt: Date.now(),
};

describe('CaloniResultCard', () => {
  it('renderiza score, label, critérios, forças, fraquezas e sugestões', () => {
    render(<CaloniResultCard result={RESULT} />);

    expect(screen.getByText('7.8')).toBeInTheDocument();
    expect(screen.getByText('Proposta Forte')).toBeInTheDocument();
    expect(screen.getByText('Clareza')).toBeInTheDocument();
    expect(screen.getByText('Bem estruturada')).toBeInTheDocument();
    expect(screen.getByText('Boa abertura')).toBeInTheDocument();
    expect(screen.getByText('Falta prova social')).toBeInTheDocument();
    expect(screen.getByText('Adicionar cases')).toBeInTheDocument();
  });

  it('não renderiza critérios quando array vazio', () => {
    render(<CaloniResultCard result={{ ...RESULT, criteria: [] }} />);
    expect(screen.queryByText('Critérios de Avaliação')).not.toBeInTheDocument();
  });

  it('não renderiza forças nem fraquezas quando ambos vazios', () => {
    render(<CaloniResultCard result={{ ...RESULT, strongPoints: [], weakPoints: [] }} />);
    expect(screen.queryByText('Pontos Fortes')).not.toBeInTheDocument();
    expect(screen.queryByText('Pontos de Melhoria')).not.toBeInTheDocument();
  });

  it('não renderiza botão de reset (reset é enviar nova mensagem)', () => {
    render(<CaloniResultCard result={RESULT} />);
    expect(screen.queryByRole('button', { name: /nova validação/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/agents/caloni/__tests__/CaloniResultCard.test.tsx`
Expected: FAIL — arquivo `CaloniResultCard.tsx` não existe.

- [ ] **Step 3: Criar `CaloniResultCard.tsx`**

```tsx
import { AlertCircle, CheckCircle2, Lightbulb, Star, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { CalonAnalysis } from '@/services/calonService';

function getScoreColor(score: number): string {
  if (score >= 9) return 'text-emerald-400';
  if (score >= 7) return 'text-primary';
  if (score >= 5) return 'text-amber-400';
  return 'text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 9) return 'bg-emerald-400';
  if (score >= 7) return 'bg-primary';
  if (score >= 5) return 'bg-amber-400';
  return 'bg-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 9) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 7) return 'bg-primary/10 border-primary/20';
  if (score >= 5) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export interface CaloniResultCardProps {
  result: CalonAnalysis;
  className?: string;
}

export function CaloniResultCard({ result, className }: CaloniResultCardProps) {
  return (
    <div className={cn('mt-3 flex flex-col gap-4', className)}>
      <div className={cn('rounded-2xl border p-4', getScoreBg(result.overallScore))}>
        <div className="flex items-baseline gap-2">
          <span className={cn('font-display text-4xl font-extrabold', getScoreColor(result.overallScore))}>
            {result.overallScore.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">/10</span>
        </div>
        <p className={cn('mt-1 text-base font-semibold', getScoreColor(result.overallScore))}>
          {result.overallLabel}
        </p>
      </div>

      {result.criteria.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Star className="h-4 w-4 text-primary" /> Critérios de Avaliação
          </p>
          <div className="space-y-3">
            {result.criteria.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{c.name}</span>
                  <span className={cn('text-sm font-bold tabular-nums', getScoreColor(c.score))}>
                    {c.score.toFixed(1)}
                  </span>
                </div>
                <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-surface">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.score * 10}%` }}
                    transition={{ duration: 0.6 }}
                    className={cn('h-full rounded-full', getScoreBarColor(c.score))}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{c.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(result.strongPoints.length > 0 || result.weakPoints.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {result.strongPoints.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <TrendingUp className="h-4 w-4" /> Pontos Fortes
              </p>
              <ul className="space-y-1.5">
                {result.strongPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.weakPoints.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
                <TrendingDown className="h-4 w-4" /> Pontos de Melhoria
              </p>
              <ul className="space-y-1.5">
                {result.weakPoints.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-foreground/80">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result.suggestions.length > 0 && (
        <div className="rounded-2xl border border-border/30 bg-card p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" /> Sugestões do Caloni
          </p>
          <ol className="space-y-2">
            {result.suggestions.map((s, i) => (
              <li key={s} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/agents/caloni/__tests__/CaloniResultCard.test.tsx`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/agents/caloni/CaloniResultCard.tsx src/agents/caloni/__tests__/CaloniResultCard.test.tsx
git commit -m "feat(caloni): add CaloniResultCard for inline rendering in chat"
```

---

### Task 8: Criar hook `useAgentChat` (streaming simulado + AbortController)

**Files:**
- Create: `src/agents/chat/useAgentChat.ts`
- Create: `src/agents/chat/__tests__/useAgentChat.test.tsx`

- [ ] **Step 1: Escrever o teste do hook**

Crie `src/agents/chat/__tests__/useAgentChat.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAgentChat } from '../useAgentChat';
import type { AgentAdapter } from '@/agents/caloni/adapter';
import type { AgentConfig } from '@/agents/registry';

function makeConfig(adapter: AgentAdapter): AgentConfig {
  return {
    id: 'test',
    name: 'T',
    subtitle: 'Test',
    avatarSrc: '/x.jpg',
    mission: 'test',
    suggestions: [],
    adapter,
  };
}

describe('useAgentChat', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('send adiciona user message e dispara adapter', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'resposta' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('oi', []);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('oi');
    expect(adapter.send).toHaveBeenCalledWith(
      { text: 'oi', attachments: [], context: undefined },
      expect.any(AbortSignal),
    );
  });

  it('após adapter resolver, aparece bubble do assistant e stream começa', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'oi resposta' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('oi', []);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => {
      const assistant = result.current.messages.find((m) => m.role === 'assistant');
      expect(assistant).toBeDefined();
      expect(String(assistant!.content)).toContain('oi resposta');
    });
    expect(result.current.isStreaming).toBe(false);
  });

  it('quando adapter retorna payload, a mensagem do assistant carrega payload', async () => {
    const payload = { score: 7.8 };
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok', payload }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('ir', []);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    await waitFor(() => {
      const assistant = result.current.messages.find((m) => m.role === 'assistant');
      expect(assistant?.payload).toEqual(payload);
    });
  });

  it('send passa context para o adapter', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('x', [], { proposalId: 'p1' });
    });

    expect(adapter.send).toHaveBeenCalledWith(
      expect.objectContaining({ context: { proposalId: 'p1' } }),
      expect.any(AbortSignal),
    );
  });

  it('stop aborta o AbortController e marca mensagem do assistant como interrupted', async () => {
    let capturedSignal: AbortSignal | undefined;
    const adapter: AgentAdapter = {
      send: (input, signal) => {
        capturedSignal = signal;
        return new Promise(() => {});
      },
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('x', []);
    });

    act(() => {
      result.current.stop();
    });

    expect(capturedSignal?.aborted).toBe(true);
    expect(result.current.isStreaming).toBe(false);
  });

  it('reset limpa mensagens e cancela streaming em progresso', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'oi' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('a', []);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/agents/chat/__tests__/useAgentChat.test.tsx`
Expected: FAIL — `useAgentChat.ts` não existe.

- [ ] **Step 3: Implementar o hook**

Crie `src/agents/chat/useAgentChat.ts`:

```ts
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';
import type { Attachment, ChatMessage } from './types';
import type { AgentConfig } from '@/agents/registry';

const TICK_MS = 16;

let messageIdSequence = 0;
function uid() {
  messageIdSequence += 1;
  return `m_${Date.now()}_${messageIdSequence}`;
}

function revokeMessagePreviews(messages: ChatMessage[]) {
  messages.forEach((message) => {
    message.attachments?.forEach((a) => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
  });
}

function updateAssistantContent(
  messages: ChatMessage[],
  assistantId: string,
  content: string,
): ChatMessage[] {
  return messages.map((m) => (m.id === assistantId ? { ...m, content } : m));
}

function scheduleFrame(cb: FrameRequestCallback) {
  if (
    typeof globalThis.requestAnimationFrame === 'function' &&
    typeof globalThis.cancelAnimationFrame === 'function'
  ) {
    return {
      id: globalThis.requestAnimationFrame(cb),
      cancel: (id: number) => globalThis.cancelAnimationFrame(id),
    };
  }
  return {
    id: window.setTimeout(() => cb(performance.now()), TICK_MS),
    cancel: (id: number) => clearTimeout(id),
  };
}

interface StreamOptions {
  runId: number;
  assistantId: string;
  text: string;
  runIdRef: MutableRefObject<number>;
  isStreamingRef: MutableRefObject<boolean>;
  assistantIdRef: MutableRefObject<string | null>;
  rafRef: MutableRefObject<number | null>;
  rafCancelRef: MutableRefObject<((id: number) => void) | null>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
}

function startAssistantStreaming(opts: StreamOptions) {
  const chars = [...opts.text];
  const totalTicks = Math.max(30, Math.min(chars.length, 120));
  let tickIndex = 0;

  const tick = () => {
    if (opts.runId !== opts.runIdRef.current || !opts.isStreamingRef.current) return;
    tickIndex += 1;
    const cursor = Math.min(chars.length, Math.ceil((chars.length * tickIndex) / totalTicks));
    const content = chars.slice(0, cursor).join('');
    opts.setMessages((prev) => updateAssistantContent(prev, opts.assistantId, content));

    if (tickIndex >= totalTicks) {
      opts.isStreamingRef.current = false;
      opts.setIsStreaming(false);
      opts.assistantIdRef.current = null;
      opts.rafRef.current = null;
      opts.rafCancelRef.current = null;
      return;
    }

    const frame = scheduleFrame(tick);
    opts.rafRef.current = frame.id;
    opts.rafCancelRef.current = frame.cancel;
  };

  const frame = scheduleFrame(tick);
  opts.rafRef.current = frame.id;
  opts.rafCancelRef.current = frame.cancel;
}

export interface AgentContext {
  proposalId?: string;
}

export interface UseAgentChatResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  send: (text: string, attachments: Attachment[], context?: AgentContext) => void;
  stop: () => void;
  reset: () => void;
}

export function useAgentChat(config: AgentConfig): UseAgentChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const runIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const rafCancelRef = useRef<((id: number) => void) | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) {
      rafCancelRef.current?.(rafRef.current);
      rafRef.current = null;
      rafCancelRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    abortRef.current?.abort();
    abortRef.current = null;
    runIdRef.current += 1;
    isStreamingRef.current = false;
    setMessages((prev) => {
      revokeMessagePreviews(prev);
      messagesRef.current = [];
      return [];
    });
    setIsStreaming(false);
    assistantIdRef.current = null;
  }, [clearTimers]);

  const stop = useCallback(() => {
    clearTimers();
    abortRef.current?.abort();
    abortRef.current = null;
    runIdRef.current += 1;
    isStreamingRef.current = false;
    setIsStreaming(false);
    const assistantId = assistantIdRef.current;
    if (assistantId) {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, variant: 'interrupted' } : m)),
      );
    }
    assistantIdRef.current = null;
  }, [clearTimers]);

  const send = useCallback(
    (text: string, attachments: Attachment[], context?: AgentContext) => {
      if (!text.trim() && attachments.length === 0) return;
      if (isStreamingRef.current) return;

      clearTimers();
      const runId = runIdRef.current + 1;
      runIdRef.current = runId;
      isStreamingRef.current = true;

      const createdAt = Date.now();
      const userMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text,
        ...(attachments.length > 0 ? { attachments } : {}),
        createdAt,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      config.adapter
        .send({ text, attachments, context }, ctrl.signal)
        .then((response) => {
          if (runId !== runIdRef.current || !isStreamingRef.current) return;

          const assistantId = uid();
          const assistantMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            createdAt: Date.now(),
            ...(response.payload !== undefined ? { payload: response.payload } : {}),
          };
          assistantIdRef.current = assistantId;
          setMessages((prev) => [...prev, assistantMessage]);

          startAssistantStreaming({
            runId,
            assistantId,
            text: response.text,
            runIdRef,
            isStreamingRef,
            assistantIdRef,
            rafRef,
            rafCancelRef,
            setMessages,
            setIsStreaming,
          });
        })
        .catch((err) => {
          if (runId !== runIdRef.current) return;
          isStreamingRef.current = false;
          setIsStreaming(false);
          if (err?.name === 'AbortError') return;
          const errorId = uid();
          setMessages((prev) => [
            ...prev,
            {
              id: errorId,
              role: 'assistant',
              content: 'Não consegui analisar agora. Tenta de novo?',
              variant: 'error',
              createdAt: Date.now(),
            },
          ]);
        });
    },
    [clearTimers, config],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(
    () => () => {
      clearTimers();
      abortRef.current?.abort();
      runIdRef.current += 1;
      isStreamingRef.current = false;
      revokeMessagePreviews(messagesRef.current);
      assistantIdRef.current = null;
    },
    [clearTimers],
  );

  return { messages, isStreaming, send, stop, reset };
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/agents/chat/__tests__/useAgentChat.test.tsx`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/agents/chat/useAgentChat.ts src/agents/chat/__tests__/useAgentChat.test.tsx
git commit -m "feat(chat): add useAgentChat hook with adapter + AbortController"
```

---

### Task 9: Criar `ProposalPickerSheet`

**Files:**
- Create: `src/pages/tools/shared/ProposalPickerSheet.tsx`
- Create: `src/pages/tools/shared/__tests__/ProposalPickerSheet.test.tsx`

- [ ] **Step 1: Escrever o teste do sheet**

Crie `src/pages/tools/shared/__tests__/ProposalPickerSheet.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalPickerSheet } from '../ProposalPickerSheet';
import type { Proposal } from '@/services/proposalService';

const BASE: Omit<Proposal, 'id' | 'title'> = {
  userId: 'u1',
  clientName: '',
  clientCompany: '',
  clientEmail: '',
  clientPhone: '',
  projectDescription: '',
  scope: '',
  value: '',
  deadline: '',
  notes: '',
  status: 'ready',
  createdAt: '',
  updatedAt: '',
};

describe('ProposalPickerSheet', () => {
  it('quando aberto e com propostas, lista os títulos', () => {
    const proposals: Proposal[] = [
      { ...BASE, id: 'p1', title: 'Cliente A' },
      { ...BASE, id: 'p2', title: 'Cliente B' },
    ];
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={() => {}}
        proposals={proposals}
        loading={false}
      />,
    );
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
  });

  it('clicar numa proposta dispara onSelect com ela', () => {
    const onSelect = vi.fn();
    const proposals: Proposal[] = [{ ...BASE, id: 'p1', title: 'Cliente A' }];
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={onSelect}
        proposals={proposals}
        loading={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Cliente A/i }));
    expect(onSelect).toHaveBeenCalledWith(proposals[0]);
  });

  it('quando loading=true, mostra skeleton e não renderiza propostas', () => {
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={() => {}}
        proposals={[]}
        loading
      />,
    );
    expect(screen.getByTestId('proposal-picker-loading')).toBeInTheDocument();
  });

  it('quando não há propostas e loading=false, mostra empty state', () => {
    render(
      <ProposalPickerSheet
        open
        onOpenChange={() => {}}
        onSelect={() => {}}
        proposals={[]}
        loading={false}
      />,
    );
    expect(screen.getByText(/ainda não tem propostas/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/pages/tools/shared/__tests__/ProposalPickerSheet.test.tsx`
Expected: FAIL — `ProposalPickerSheet.tsx` não existe.

- [ ] **Step 3: Criar o componente**

Crie `src/pages/tools/shared/ProposalPickerSheet.tsx`:

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { Proposal } from '@/services/proposalService';

export interface ProposalPickerSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onSelect: (proposal: Proposal) => void;
  proposals: Proposal[];
  loading: boolean;
}

export function ProposalPickerSheet({
  open,
  onOpenChange,
  onSelect,
  proposals,
  loading,
}: ProposalPickerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0">
        <SheetHeader className="border-b border-border/30 p-4">
          <SheetTitle>Selecione uma proposta</SheetTitle>
        </SheetHeader>

        <div className="flex h-full flex-col gap-2 overflow-y-auto p-4">
          {loading ? (
            <div data-testid="proposal-picker-loading" className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Você ainda não tem propostas salvas. Use a outra opção pra enviar um PDF.
            </div>
          ) : (
            proposals.map((p) => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start rounded-2xl p-4 text-left"
                onClick={() => onSelect(p)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-semibold">{p.title}</span>
                  {p.clientName ? (
                    <span className="text-xs text-muted-foreground">{p.clientName}</span>
                  ) : null}
                </div>
              </Button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/pages/tools/shared/__tests__/ProposalPickerSheet.test.tsx`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/pages/tools/shared/ProposalPickerSheet.tsx src/pages/tools/shared/__tests__/ProposalPickerSheet.test.tsx
git commit -m "feat(tools-shared): add ProposalPickerSheet component"
```

---

### Task 10: Criar `ChatToolPage`

**Files:**
- Create: `src/pages/ChatToolPage.tsx`
- Create: `src/pages/__tests__/ChatToolPage.test.tsx`

- [ ] **Step 1: Escrever o teste da página**

Crie `src/pages/__tests__/ChatToolPage.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ChatToolPage from '../ChatToolPage';
import { agentRegistry } from '@/agents/registry';
import calonService, { type CalonAnalysis } from '@/services/calonService';
import { proposalService, type Proposal } from '@/services/proposalService';
import { AuthProvider } from '@/auth/AuthContext';

vi.mock('@/auth/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('@/auth/AuthContext')>('@/auth/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ user: { id: 'u1', email: 'x@y.com' } }),
  };
});

const MOCK_RESULT: CalonAnalysis = {
  overallScore: 7.8,
  overallLabel: 'Proposta Forte',
  strongPoints: ['Boa abertura'],
  weakPoints: ['Falta prova social'],
  criteria: [{ name: 'Clareza', score: 8, comment: 'Ok' }],
  suggestions: ['Adicionar cases'],
  analysedAt: Date.now(),
};

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'p1', userId: 'u1', title: 'Cliente A',
    clientName: 'Ana', clientCompany: '', clientEmail: '', clientPhone: '',
    projectDescription: '', scope: '', value: '', deadline: '', notes: '',
    status: 'ready', createdAt: '', updatedAt: '',
  },
];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/tools/:slug" element={<ChatToolPage />} />
          <Route path="/tools" element={<div>Hub</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ChatToolPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(proposalService, 'getAll').mockResolvedValue(MOCK_PROPOSALS);
    vi.spyOn(calonService, 'analyzeByProposalId').mockResolvedValue(MOCK_RESULT);
    vi.spyOn(calonService, 'analyzeFile').mockResolvedValue(MOCK_RESULT);
  });

  it('slug inexistente redireciona para /tools', () => {
    renderAt('/tools/slug-que-nao-existe');
    expect(screen.getByText('Hub')).toBeInTheDocument();
  });

  it('renderiza header do Caloni e empty state com pílulas', async () => {
    renderAt('/tools/validacao-caloni');
    expect(screen.getAllByText('Caloni').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Validar proposta já salva/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar PDF externo/i })).toBeInTheDocument();
  });

  it('pílula "proposta salva" abre o picker e ao selecionar dispara análise', async () => {
    renderAt('/tools/validacao-caloni');
    fireEvent.click(screen.getByRole('button', { name: /Validar proposta já salva/i }));

    await waitFor(() => {
      expect(screen.getByText('Selecione uma proposta')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cliente A/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Cliente A/i }));

    await waitFor(() => {
      expect(calonService.analyzeByProposalId).toHaveBeenCalledWith('p1');
    });
  });

  it('empty state some após primeira mensagem', async () => {
    renderAt('/tools/validacao-caloni');
    fireEvent.click(screen.getByRole('button', { name: /Validar proposta já salva/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Cliente A/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Cliente A/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Enviar PDF externo/i })).not.toBeInTheDocument();
    });
  });

  it('deep-link ?proposal=ID pré-dispara análise sem interação', async () => {
    renderAt('/tools/validacao-caloni?proposal=p1');
    await waitFor(() => {
      expect(calonService.analyzeByProposalId).toHaveBeenCalledWith('p1');
    });
  });
});
```

- [ ] **Step 2: Rodar teste pra confirmar que falha**

Run: `npx vitest run src/pages/__tests__/ChatToolPage.test.tsx`
Expected: FAIL — `ChatToolPage.tsx` não existe.

- [ ] **Step 3: Criar `ChatToolPage.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AgentHeader,
  ChatEmptyState,
  ChatLayout,
  MessageBubble,
  MessageList,
  type Suggestion,
} from '@/agents/chat';
import { PromptInputBox, type PromptInputBoxHandle } from '@/components/ui/prompt-input-box';
import { useAgentChat } from '@/agents/chat/useAgentChat';
import { agentRegistry } from '@/agents/registry';
import { useAuth } from '@/auth/AuthContext';
import { useUserProposals } from '@/pages/tools/shared/useUserProposals';
import { ProposalPickerSheet } from '@/pages/tools/shared/ProposalPickerSheet';

export default function ChatToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const config = slug ? agentRegistry[slug] : undefined;

  if (!config) return <Navigate to="/tools" replace />;

  const { messages, isStreaming, send, stop } = useAgentChat(config);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<PromptInputBoxHandle>(null);
  const { proposals, proposalsLoading } = useUserProposals(user?.id);

  const consumedDeepLink = useRef<string | null>(null);
  useEffect(() => {
    const proposalId = searchParams.get('proposal');
    if (!proposalId || consumedDeepLink.current === proposalId) return;
    if (config.id !== 'caloni-v1') return;
    consumedDeepLink.current = proposalId;
    send('Analisar proposta selecionada', [], { proposalId });
  }, [searchParams, config.id, send]);

  function handlePick(suggestion: Suggestion) {
    if (isStreaming) return;
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
  const emptyState = useMemo(
    () => (
      <ChatEmptyState
        agentName={config.name}
        avatarSrc={config.avatarSrc}
        agentMission={config.mission}
        suggestions={config.suggestions}
        onPick={handlePick}
      />
    ),
    // deliberately omit handlePick from deps: it's stable via refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config, isStreaming],
  );

  return (
    <ChatLayout mode="pure">
      <AgentHeader
        name={config.name}
        subtitle={config.subtitle}
        avatarSrc={config.avatarSrc}
        status={isStreaming ? 'thinking' : 'online'}
      />

      <MessageList messages={messages} isStreaming={isStreaming} emptyState={emptyState}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role}
            variant={message.variant}
            attachments={message.attachments}
            timestamp={message.createdAt}
            isStreaming={isStreaming && message.role === 'assistant' && message.id === lastMessageId}
          >
            {message.content as React.ReactNode}
            {message.role === 'assistant' && message.payload !== undefined && config.renderResult
              ? config.renderResult(message.payload)
              : null}
          </MessageBubble>
        ))}
      </MessageList>

      <PromptInputBox
        ref={inputRef}
        onSend={(text, attachments) => send(text, attachments)}
        onStop={stop}
        isLoading={isStreaming}
      />

      <ProposalPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(proposal) => {
          setPickerOpen(false);
          send(`Analisar proposta "${proposal.title}"`, [], { proposalId: proposal.id });
        }}
        proposals={proposals}
        loading={proposalsLoading}
      />
    </ChatLayout>
  );
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run src/pages/__tests__/ChatToolPage.test.tsx`
Expected: PASS em todos.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ChatToolPage.tsx src/pages/__tests__/ChatToolPage.test.tsx
git commit -m "feat(pages): add ChatToolPage parametrized by AgentRegistry"
```

---

### Task 11: Religar rota `/tools/:slug` para `ChatToolPage` e remover rota `/tools/validacao-caloni/app`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Substituir `ToolDetail` por `ChatToolPage` na rota `/tools/:slug`**

Em `src/App.tsx`, substitua:

```tsx
const ToolDetail = lazy(() => import("@/pages/ToolDetail.tsx"));
```

Por:

```tsx
const ChatToolPage = lazy(() => import("@/pages/ChatToolPage.tsx"));
```

E substitua:

```tsx
<Route path="/tools/:slug" element={withSuspense(<ToolDetail />)} />
```

Por:

```tsx
<Route path="/tools/:slug" element={withSuspense(<ChatToolPage />)} />
```

- [ ] **Step 2: Remover o bloco de rotas de `/tools/validacao-caloni/app`**

Remova por completo:

```tsx
<Route
  path="/tools/validacao-caloni/app"
  element={withSuspense(<ValidationShell />)}
>
  <Route index element={withSuspense(<ValidationApp />)} />
</Route>
```

E também remova os imports `lazy` de `ValidationShell`, `ValidationApp` e `LegacyValidationRedirect` no topo do arquivo (linhas do estilo `const ValidationShell = lazy(...)`).

- [ ] **Step 3: Rodar build e type-check**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — o build pode ainda importar arquivos antigos referenciados por outros imports; se houver erro por causa disso, siga para a Task 12 (deleção dos arquivos obsoletos) na mesma leva de mudanças ou comente o import momentaneamente.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routes): wire /tools/:slug to ChatToolPage and remove /validacao-caloni/app"
```

---

### Task 12: Deletar arquivos obsoletos

**Files:**
- Delete: `src/pages/ToolDetail.tsx`
- Delete: `src/pages/tools/ValidacaoCaloni/ValidationShell.tsx`
- Delete: `src/pages/tools/ValidacaoCaloni/ValidationApp.tsx`
- Delete: `src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.tsx`
- Delete: `src/features/comercial/caloniInputUi.tsx`
- Delete: `src/features/comercial/caloniAnalysisUi.tsx`
- Delete: `src/features/comercial/caloniAnalysisFlow.ts`

- [ ] **Step 1: Deletar os arquivos**

```bash
rm src/pages/ToolDetail.tsx
rm src/pages/tools/ValidacaoCaloni/ValidationShell.tsx
rm src/pages/tools/ValidacaoCaloni/ValidationApp.tsx
rm src/pages/tools/ValidacaoCaloni/LegacyValidationRedirect.tsx
rm src/features/comercial/caloniInputUi.tsx
rm src/features/comercial/caloniAnalysisUi.tsx
rm src/features/comercial/caloniAnalysisFlow.ts
```

- [ ] **Step 2: Verificar se restou diretório vazio**

Run: `ls src/pages/tools/ValidacaoCaloni/ 2>&1 ; ls src/features/comercial/ 2>&1`
Expected: se `ValidacaoCaloni/` ficar vazio, delete o diretório com `rmdir src/pages/tools/ValidacaoCaloni`. Se `comercial/` ainda tiver arquivos, mantenha.

- [ ] **Step 3: Rodar build e type-check**

Run: `npx tsc --noEmit`
Expected: FAIL se algum arquivo ainda importar dos deletados. Use a saída pra localizar os imports órfãos.

- [ ] **Step 4: Corrigir imports órfãos**

Para cada erro reportado em `tsc`, abra o arquivo mencionado e:
- Se o import era de `caloniInputUi`/`caloniAnalysisUi`: remova o import (os componentes sumiram)
- Se o import era de `useCaloniAnalysisFlow` ou `useUserProposals` de `caloniAnalysisFlow`: troque para `@/pages/tools/shared/useUserProposals` (apenas `useUserProposals`; `useCaloniAnalysisFlow` não tem mais equivalente — se algum consumidor fora da Validação ainda depender dele, é bug de escopo: reportar para o usuário)

Consumidores prováveis a ajustar:
- `src/pages/tools/PropostaComercial/ProposalView.tsx` (botão "Validar" que linkava pra `/tools/validacao-caloni/app?proposal=ID`): ajustar para `/tools/validacao-caloni?proposal=ID`.
- Qualquer arquivo em `src/pages/tools/PropostaComercial/` que faça import de `caloniAnalysisFlow` — migrar para `@/pages/tools/shared/useUserProposals`.

- [ ] **Step 5: Re-rodar testes**

Run: `npm run test`
Expected: PASS em todos os testes existentes e novos.

- [ ] **Step 6: Rodar build final**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: remove obsolete Validacao Caloni forms and landing page"
```

---

### Task 13: Smoke test manual — golden path

**Files:** nenhum (teste manual)

- [ ] **Step 1: Subir o dev server**

Run: `npm run dev`
Expected: Vite servindo em `http://localhost:5173`.

- [ ] **Step 2: Autenticar como usuário de teste**

Abra `http://localhost:5173/login`, autentique. Se não houver usuário de teste com propostas salvas, use uma conta sabidamente populada com dados (ou crie 1 proposta via `/tools/proposta-comercial-smart/app`).

- [ ] **Step 3: Clicar no card "Validação Caloni"**

Navegue via `/hub` ou `/modules/comercial` e clique no card da Validação Caloni.

Expected:
- URL vira `/tools/validacao-caloni`
- Foto do Caloni aparece no header (`/caloni-photo.jpg.jpg`)
- Empty state visível com missão e 2 pílulas

- [ ] **Step 4: Testar pílula "Validar proposta já salva"**

Clique na pílula.

Expected:
- Sheet lateral abre listando propostas
- Ao clicar em uma proposta:
  - Sheet fecha
  - Mensagem do usuário aparece no stream: `Analisar proposta "<título>"`
  - Indicador de thinking aparece
  - Após resposta (≤ 3s com backend normal): bubble do assistant streama texto char-a-char e logo depois o `CaloniResultCard` aparece inline

- [ ] **Step 5: Testar pílula "Enviar PDF externo"**

Clique em "Nova conversa" ou recarregue `/tools/validacao-caloni`. Clique na pílula "PDF externo".

Expected:
- File picker nativo abre
- Ao selecionar um PDF: mensagem do usuário aparece no stream com chip do anexo (sem clicar "enviar" manualmente)
- Assistant responde com texto + card

- [ ] **Step 6: Testar texto livre sem contexto**

Recarregue. Digite "olá" no input e envie.

Expected:
- Bubble do assistant responde com a mensagem de recusa educada ("Pra eu analisar, preciso que você selecione uma proposta salva ou anexe um PDF...")

- [ ] **Step 7: Verificar que demo continua funcional**

Navegue para `http://localhost:5173/chat/demo/pure`.

Expected: demo ainda funciona com suggestions `prefill` (sem regressão).

- [ ] **Step 8: Marcar como concluído se todos os steps acima passaram**

Se algum passo falhar, abrir issue/task específica para o bug encontrado antes de merge.

---

## Self-review

**1. Spec coverage:**

Confirmado:
- Arquitetura (3 camadas): Tasks 6, 8, 10 cobrem registry, hook e página.
- AgentRegistry types: Task 6.
- Config concreta Caloni: Task 6.
- Placeholders das Fases 2-4: Task 6.
- Adapter: Task 4.
- useAgentChat: Task 8.
- Fluxo de pílula (3 tipos): Tasks 1 (Suggestion type) + 10 (handlePick).
- ChatToolPage: Task 10.
- CaloniResultCard: Task 7.
- Mudanças de rotas: Task 11.
- Arquivos deletados: Task 12.
- Testes do adapter, hook e página: Tasks 4, 8, 10.
- Golden path manual: Task 13.
- `openFilePicker` no handle: Task 2.
- `payload` em ChatMessage: Task 3.
- `useUserProposals` extraído: Task 5.
- `ProposalPickerSheet`: Task 9.

**2. Placeholder scan:** nenhum TBD/TODO/"implemente depois" no plano.

**3. Type consistency:**
- `AgentAdapter.send(input, signal)` — consistente entre Task 4 (definição) e Task 8 (uso no hook).
- `AgentConfig` fields (`name/subtitle/avatarSrc/mission/suggestions/adapter/renderResult`) — consistentes entre Task 6 (criação) e Task 10 (consumo).
- `Suggestion.action.kind` (`prefill`/`open-proposal-picker`/`open-file-picker`) — consistentes entre Task 1 (definição), 6 (config), 10 (handler).
- `PromptInputBoxHandle.openFilePicker(options?)` com `{ autoSend }` — consistente entre Task 2 (definição) e Task 10 (uso com `autoSend: true`).
- `AgentContext.proposalId` — consistente entre Task 4 (adapter), 8 (hook), 10 (deep-link e picker).
- `CaloniResultCardProps.result: CalonAnalysis` — consistente entre Task 7 (criação) e Task 6 (renderResult no registry).
- `useUserProposals` retorna `{ proposals, proposalsLoading }` — consistente entre Task 5 (criação) e Task 10 (consumo).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-23-chat-tool-integration.md`.

**Duas opções de execução:**

1. **Subagent-Driven (recomendado)** — Eu disparo um subagent fresco por task, com review automático (spec compliance + code quality) entre cada task. Iteração rápida, qualidade garantida por dois gates.

2. **Inline Execution** — Execução inline nesta sessão, em batches com checkpoints pra você revisar.

Qual das duas?
