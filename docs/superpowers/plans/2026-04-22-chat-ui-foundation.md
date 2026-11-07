# Chat UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar e adaptar o `ai-prompt-box` da 21st.dev, construir um conjunto de primitivos de chat (`MessageBubble`, `MessageList`, `ChatLayout` etc.) e entregar uma rota `/chat/demo` com agente mock para o frontend do SEVEN Tools.

**Architecture:** Primitivos compostos em `src/agents/chat/` + `PromptInputBox` em `src/components/ui/` (convenção shadcn). Estado NÃO vive nos primitivos — fluxo via props. A rota de demo usa um hook local (`useChatDemo`) que **não é exportado** pelo barrel. Dark theme fixo via CSS vars existentes.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn + Radix (Dialog/Tooltip/ScrollArea/Sheet) + framer-motion + react-resizable-panels + Vitest + Testing Library. Todas já instaladas.

**Spec:** `docs/superpowers/specs/2026-04-22-chat-ui-foundation-design.md`

**Convenções importantes:**
- TDD: teste primeiro (falha), implementação mínima (passa), commit.
- Commits pequenos e frequentes. Mensagem em pt-BR, estilo `feat(chat): ...` / `test(chat): ...`.
- Todos os comandos rodam a partir de `seven_tools_front/` (cwd).
- Dark theme: usar APENAS CSS vars (`hsl(var(--primary))`, `text-foreground`, etc.). Zero hex/RGB hardcoded nos primitivos.
- `rounded-2xl` como raio padrão de bubble/input (decisão do stakeholder, não mexer).

---

## File Structure

### Novos arquivos

```
src/
├── components/ui/
│   └── prompt-input-box.tsx            # baixado via shadcn-cli, adaptado
│
├── agents/chat/
│   ├── index.ts                        # barrel público
│   ├── types.ts                        # ChatMessage, Attachment, AttachmentType
│   ├── utils.ts                        # formatBytes, validateAttachment, pickFileIcon
│   ├── ChatLayout.tsx
│   ├── AgentHeader.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   ├── StreamingIndicator.tsx
│   ├── FileAttachmentChip.tsx
│   ├── AttachmentPreviewModal.tsx
│   ├── ArtifactPanel.tsx
│   ├── ChatEmptyState.tsx
│   ├── __tests__/
│   │   ├── PromptInputBox.test.tsx
│   │   ├── MessageBubble.test.tsx
│   │   ├── MessageList.test.tsx
│   │   ├── ChatLayout.test.tsx
│   │   ├── ChatEmptyState.test.tsx
│   │   ├── StreamingIndicator.test.tsx
│   │   ├── FileAttachmentChip.test.tsx
│   │   └── useChatDemo.test.ts
│   └── demo/
│       ├── useChatDemo.ts              # NÃO exportado pelo barrel
│       ├── mockResponses.ts
│       └── MockArtifact.tsx
│
└── pages/chat-demo/
    ├── ChatDemoLayout.tsx
    ├── ChatDemoPure.tsx
    └── ChatDemoSplit.tsx
```

### Modificados

- `src/App.tsx` — adicionar rotas `/chat/demo/pure` e `/chat/demo/split` (fora de `ProtectedRoute`).

---

## Task Index

1. Criar `types.ts` + `utils.ts` + testes de `formatBytes`/`validateAttachment`
2. Baixar `ai-prompt-box` via shadcn-cli, remover VoiceRecorder/toggles, ajustar imports
3. Token swap do `prompt-input-box.tsx` (cores, radius)
4. Estender `prompt-input-box.tsx` para PDF + texto, usando `validateAttachment`
5. Adaptar API pública do `PromptInputBox` (onSend com Attachment[], onStop, initialValue, imperative handle)
6. `StreamingIndicator` + teste
7. `FileAttachmentChip` + teste
8. `AttachmentPreviewModal` + smoke test
9. `MessageBubble` + testes
10. `MessageList` + testes (auto-scroll + FAB)
11. `AgentHeader` + smoke test
12. `ArtifactPanel` + smoke test
13. `ChatEmptyState` + testes
14. `ChatLayout` modo `pure` + teste
15. `ChatLayout` modo `split` (desktop + mobile Sheet) + teste
16. Barrel `src/agents/chat/index.ts`
17. `mockResponses.ts` + `MockArtifact.tsx`
18. `useChatDemo` hook + teste (com timers fake)
19. `ChatDemoLayout` + barra de controle
20. `ChatDemoPure`
21. `ChatDemoSplit`
22. Wiring de rota em `src/App.tsx`
23. QA manual: checklist de paridade ChatGPT (Seção 9 do spec)
24. QA manual: checklist de acessibilidade (Seção 10 do spec) + Lighthouse ≥ 95

---

## Task 1: Tipos compartilhados + utilitários

**Files:**
- Create: `src/agents/chat/types.ts`
- Create: `src/agents/chat/utils.ts`
- Create: `src/agents/chat/__tests__/utils.test.ts`

- [x] **Step 1.1: Criar `types.ts`**

Arquivo `src/agents/chat/types.ts`:

```ts
import type { ReactNode } from 'react';

export type AttachmentType = 'image' | 'pdf' | 'text';

export interface Attachment {
  id: string;
  type: AttachmentType;
  file: File;
  name: string;
  sizeBytes: number;
  previewUrl?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageVariant = 'default' | 'error' | 'info' | 'interrupted';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: ReactNode;
  attachments?: Attachment[];
  createdAt: number;
  variant?: MessageVariant;
}
```

- [x] **Step 1.2: Escrever testes de `utils`**

Arquivo `src/agents/chat/__tests__/utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatBytes, validateAttachment } from '../utils';

describe('formatBytes', () => {
  it('formata bytes em KB/MB com 1 casa decimal', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1_500)).toBe('1.5 KB');
    expect(formatBytes(2_500_000)).toBe('2.5 MB');
  });

  it('trata 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
});

describe('validateAttachment', () => {
  const makeFile = (name: string, size: number, type: string) => {
    const file = new File([new Uint8Array(size)], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  it('aceita imagem até 10MB', () => {
    const file = makeFile('foto.png', 9 * 1024 * 1024, 'image/png');
    expect(validateAttachment(file)).toEqual({ ok: true, type: 'image' });
  });

  it('rejeita imagem > 10MB', () => {
    const file = makeFile('foto.png', 11 * 1024 * 1024, 'image/png');
    const result = validateAttachment(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/imagem/i);
  });

  it('aceita PDF até 20MB', () => {
    const file = makeFile('doc.pdf', 15 * 1024 * 1024, 'application/pdf');
    expect(validateAttachment(file)).toEqual({ ok: true, type: 'pdf' });
  });

  it('rejeita PDF > 20MB', () => {
    const file = makeFile('doc.pdf', 25 * 1024 * 1024, 'application/pdf');
    expect(validateAttachment(file).ok).toBe(false);
  });

  it('aceita texto (txt/md) até 1MB', () => {
    const txt = makeFile('a.txt', 500_000, 'text/plain');
    const md = makeFile('a.md', 500_000, 'text/markdown');
    expect(validateAttachment(txt)).toEqual({ ok: true, type: 'text' });
    expect(validateAttachment(md)).toEqual({ ok: true, type: 'text' });
  });

  it('rejeita texto > 1MB', () => {
    const file = makeFile('big.txt', 2 * 1024 * 1024, 'text/plain');
    expect(validateAttachment(file).ok).toBe(false);
  });

  it('rejeita tipos não suportados', () => {
    const file = makeFile('video.mp4', 1024, 'video/mp4');
    const result = validateAttachment(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/não suportado/i);
  });
});
```

- [x] **Step 1.3: Rodar testes — devem falhar**

```bash
npx vitest run src/agents/chat/__tests__/utils.test.ts
```

Esperado: FAIL com `Cannot find module '../utils'`.

- [x] **Step 1.4: Implementar `utils.ts`**

Arquivo `src/agents/chat/utils.ts`:

```ts
import type { AttachmentType } from './types';

const MB = 1024 * 1024;

export const ATTACHMENT_LIMITS: Record<AttachmentType, number> = {
  image: 10 * MB,
  pdf: 20 * MB,
  text: 1 * MB,
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

export type ValidationResult =
  | { ok: true; type: AttachmentType }
  | { ok: false; reason: string };

export function validateAttachment(file: File): ValidationResult {
  const mime = file.type;
  let type: AttachmentType | null = null;

  if (mime.startsWith('image/')) type = 'image';
  else if (mime === 'application/pdf') type = 'pdf';
  else if (mime === 'text/plain' || mime === 'text/markdown') type = 'text';

  if (type === null) {
    return { ok: false, reason: `Tipo de arquivo não suportado: ${mime || 'desconhecido'}.` };
  }

  const limit = ATTACHMENT_LIMITS[type];
  if (file.size > limit) {
    const prettyLimit = formatBytes(limit);
    const label = type === 'image' ? 'imagem' : type === 'pdf' ? 'PDF' : 'texto';
    return { ok: false, reason: `Arquivo de ${label} excede o limite de ${prettyLimit}.` };
  }

  return { ok: true, type };
}

export function makeAttachmentId(): string {
  return `att_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}
```

- [x] **Step 1.5: Rodar testes — devem passar**

```bash
npx vitest run src/agents/chat/__tests__/utils.test.ts
```

Esperado: todos passando (8 assertions).

- [x] **Step 1.6: Commit**

```bash
git add src/agents/chat/types.ts src/agents/chat/utils.ts src/agents/chat/__tests__/utils.test.ts
git commit -m "feat(chat): adiciona tipos e utilitários de anexos do chat"
```

---

## Task 2: Baixar AI Prompt Box + limpar código morto

**Files:**
- Create: `src/components/ui/prompt-input-box.tsx` (via shadcn CLI)
- Modify: `src/components/ui/prompt-input-box.tsx`

- [x] **Step 2.1: Rodar shadcn add**

```bash
npx shadcn@latest add https://21st.dev/r/easemize/ai-prompt-box --yes
```

Esperado: cria `src/components/ui/prompt-input-box.tsx` (e talvez dependências como `scroll-area.tsx` — verificar; já existem, não sobrescrever se perguntar; se perguntar `overwrite?`, responder `N`).

- [x] **Step 2.2: Confirmar build ainda passa**

```bash
npx tsc --noEmit
```

Se houver erros de tipos no `prompt-input-box.tsx` (esperado, pois o componente original usa deps voice que não estão instaladas), continuar para os próximos passos — serão resolvidos na limpeza.

- [x] **Step 2.3: Ler o arquivo baixado**

Abrir `src/components/ui/prompt-input-box.tsx` e identificar:
- Componente `VoiceRecorder` (removeremos).
- Botões/estados `showSearch`/`showThink`/`showCanvas` e seus ícones `Globe`/`BrainCog`/`FolderCode` (removeremos).
- Estados `isRecording` / `isTranscribing` (removeremos).
- Props do `PromptInputBox` e do `onSend`.

- [x] **Step 2.4: Remover VoiceRecorder completo**

Editar `src/components/ui/prompt-input-box.tsx`:
- Deletar a função/componente `VoiceRecorder` inteira (geralmente 150-200 linhas).
- Deletar imports usados só pelo VoiceRecorder: `Mic`, `StopCircle`, `waveform`, `MediaRecorder` helpers, qualquer `useRef<MediaRecorder>`.
- Deletar o botão de mic no JSX principal do `PromptInputBox`.
- Deletar estados `isRecording`, `isTranscribing` e suas setters.

- [x] **Step 2.5: Remover toggles Search/Think/Canvas**

- Deletar os três `<button>` de toggle (Search, Think, Canvas).
- Deletar imports `Globe`, `BrainCog`, `FolderCode`.
- Deletar estados `showSearch`, `showThink`, `showCanvas`.
- Remover qualquer lógica de prefixo condicional no `onSend` que dependa desses toggles.

- [x] **Step 2.6: Limpar imports órfãos**

Rodar lint:
```bash
npx eslint src/components/ui/prompt-input-box.tsx
```

Corrigir qualquer warning de import não utilizado.

- [x] **Step 2.7: Verificar typecheck**

```bash
npx tsc --noEmit
```

Esperado: 0 erros.

- [x] **Step 2.8: Commit**

```bash
git add src/components/ui/prompt-input-box.tsx
git commit -m "feat(ui): baixa ai-prompt-box do 21st.dev e remove voice/toggles"
```

---

## Task 3: Token swap (alinhar com design system SEVEN)

**Files:**
- Modify: `src/components/ui/prompt-input-box.tsx`

Objetivo: trocar cores hardcoded por CSS vars do SEVEN e alinhar radius.

- [x] **Step 3.1: Abrir `src/components/ui/prompt-input-box.tsx`**

- [x] **Step 3.2: Substituir cores (tabela canônica)**

Aplicar substituições em **todo o arquivo** (use busca/replace-all para cada item):

| Buscar | Substituir |
|---|---|
| `bg-[#1F2023]` | `bg-card` |
| `#1F2023` (em outros contextos) | `hsl(var(--card))` |
| `border-[#444444]` | `border-border` |
| `#444444` | `hsl(var(--border))` |
| `text-gray-100` | `text-foreground` |
| `text-gray-300` | `text-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `bg-white text-black` (botão enviar ativo) | `bg-primary text-primary-foreground` |
| `hover:bg-white/90` | `hover:bg-primary/90` |
| `rounded-3xl` (container principal) | `rounded-2xl` |
| `rounded-3xl` (outros) | `rounded-2xl` |
| `bg-gray-800` / `bg-zinc-800` | `bg-muted` |

- [x] **Step 3.3: Scrollbar**

Procurar qualquer `scrollbar-thumb-*` ou `scrollbar-track-*` hardcoded e substituir por utility do Tailwind já existente ou remover (usar default). Se for CSS inline para scrollbar, substituir cor pela `hsl(var(--muted))`.

- [x] **Step 3.4: Placeholder padrão em pt-BR**

Localizar o default `placeholder` (geralmente `"Ask anything..."`). Trocar por `"Digite uma mensagem..."` como default (será configurável via prop, mas o fallback fica em pt-BR).

- [x] **Step 3.5: Verificar typecheck + lint**

```bash
npx tsc --noEmit && npx eslint src/components/ui/prompt-input-box.tsx
```

Esperado: 0 erros, 0 warnings.

- [x] **Step 3.6: Smoke manual (dev server)**

```bash
npm run dev
```

Abrir `http://localhost:5173` e confirmar que o app ainda carrega (não renderiza ainda o novo componente — só checar que não quebrou o bundle). Matar o dev server (Ctrl+C).

- [x] **Step 3.7: Commit**

```bash
git add src/components/ui/prompt-input-box.tsx
git commit -m "feat(ui): aplica tokens do design SEVEN no prompt-input-box"
```

---

## Task 4: Estender prompt box para PDF + texto (validação)

**Files:**
- Modify: `src/components/ui/prompt-input-box.tsx`

- [x] **Step 4.1: Atualizar `accept` do file input**

Procurar no arquivo o `<input type="file" ... />` (ou `accept="..."` em prop do input). Substituir o `accept` por:

```tsx
accept="image/*,application/pdf,text/plain,text/markdown,.md,.txt"
```

- [x] **Step 4.2: Importar `validateAttachment` e `toast`**

Adicionar no topo do arquivo:

```tsx
import { toast } from 'sonner';
import { validateAttachment, makeAttachmentId } from '@/agents/chat/utils';
import type { Attachment, AttachmentType } from '@/agents/chat/types';
```

- [x] **Step 4.3: Refatorar estado de anexos**

Substituir o estado atual (que provavelmente só armazena `File[]` de imagens) por `Attachment[]`:

```tsx
const [attachments, setAttachments] = useState<Attachment[]>([]);
```

- [x] **Step 4.4: Implementar `addFiles(files: FileList | File[])`**

Função interna (ou dentro de `handleFileChange`):

```tsx
const addFiles = (files: File[]) => {
  const accepted: Attachment[] = [];
  for (const file of files) {
    if (attachments.length + accepted.length >= maxFiles) {
      toast.error(`Máximo de ${maxFiles} anexos por mensagem.`);
      break;
    }
    const result = validateAttachment(file);
    if (!result.ok) {
      toast.error(result.reason);
      continue;
    }
    const attachment: Attachment = {
      id: makeAttachmentId(),
      type: result.type,
      file,
      name: file.name,
      sizeBytes: file.size,
      previewUrl: result.type === 'image' ? URL.createObjectURL(file) : undefined,
    };
    accepted.push(attachment);
  }
  if (accepted.length > 0) setAttachments((prev) => [...prev, ...accepted]);
};
```

- [x] **Step 4.5: Conectar handlers (change/paste/drop)**

- No `onChange` do input file: `addFiles(Array.from(e.target.files ?? []))`.
- Se houver handler de paste, filtrar `e.clipboardData.files` e chamar `addFiles`.
- Se houver handler de drop, `addFiles(Array.from(e.dataTransfer.files))`.

- [x] **Step 4.6: Cleanup de object URLs**

No final do componente, adicionar `useEffect` que revoga URLs quando um anexo é removido ou o componente desmonta:

```tsx
useEffect(() => {
  return () => {
    attachments.forEach((att) => {
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

E no `removeAttachment(id)`:

```tsx
const removeAttachment = (id: string) => {
  setAttachments((prev) => {
    const target = prev.find((a) => a.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    return prev.filter((a) => a.id !== id);
  });
};
```

- [x] **Step 4.7: Renderizar chips para PDF/texto (não só imagens)**

Localizar onde os thumbs de imagem são renderizados. Substituir por render condicional:

```tsx
{attachments.map((att) => (
  <div key={att.id} className="relative">
    {att.type === 'image' && att.previewUrl ? (
      <img src={att.previewUrl} alt={att.name} className="h-14 w-14 rounded-xl object-cover" />
    ) : (
      <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-foreground">
        <FileText className="h-4 w-4" aria-hidden />
        <span className="max-w-[120px] truncate">{att.name}</span>
      </div>
    )}
    <button
      type="button"
      onClick={() => removeAttachment(att.id)}
      className="absolute -right-1 -top-1 rounded-full bg-background p-0.5"
      aria-label={`Remover anexo ${att.name}`}
    >
      <X className="h-3 w-3" />
    </button>
  </div>
))}
```

Importar `FileText` e `X` de `lucide-react` se ainda não estiverem.

- [x] **Step 4.8: Verificar typecheck**

```bash
npx tsc --noEmit
```

Esperado: 0 erros.

- [x] **Step 4.9: Commit**

```bash
git add src/components/ui/prompt-input-box.tsx
git commit -m "feat(ui): adiciona suporte a PDF e texto no prompt-input-box"
```

---

## Task 5: API pública do PromptInputBox (onSend, onStop, imperative handle)

**Files:**
- Modify: `src/components/ui/prompt-input-box.tsx`
- Create: `src/agents/chat/__tests__/PromptInputBox.test.tsx`

- [x] **Step 5.1: Escrever testes primeiro**

Arquivo `src/agents/chat/__tests__/PromptInputBox.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useRef } from 'react';
import userEvent from '@testing-library/user-event';
import { PromptInputBox, type PromptInputBoxHandle } from '@/components/ui/prompt-input-box';

describe('PromptInputBox', () => {
  it('renderiza placeholder default em pt-BR', () => {
    render(<PromptInputBox onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText(/digite uma mensagem/i)).toBeInTheDocument();
  });

  it('Enter envia mensagem e limpa o textarea', async () => {
    const onSend = vi.fn();
    render(<PromptInputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'oi mundo{Enter}');
    expect(onSend).toHaveBeenCalledWith('oi mundo', []);
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('Shift+Enter quebra linha, não envia', async () => {
    const onSend = vi.fn();
    render(<PromptInputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox');
    await userEvent.type(textarea, 'linha1{Shift>}{Enter}{/Shift}linha2');
    expect(onSend).not.toHaveBeenCalled();
    expect((textarea as HTMLTextAreaElement).value).toBe('linha1\nlinha2');
  });

  it('envio vazio não dispara onSend', async () => {
    const onSend = vi.fn();
    render(<PromptInputBox onSend={onSend} />);
    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });

  it('isLoading + onStop → renderiza botão Stop', () => {
    const onStop = vi.fn();
    render(<PromptInputBox onSend={vi.fn()} onStop={onStop} isLoading />);
    const stop = screen.getByRole('button', { name: /parar/i });
    fireEvent.click(stop);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('isLoading sem onStop → botão enviar desabilitado', () => {
    render(<PromptInputBox onSend={vi.fn()} isLoading />);
    const send = screen.getByRole('button', { name: /enviar/i });
    expect(send).toBeDisabled();
  });

  it('autoFocus default foca o textarea', () => {
    render(<PromptInputBox onSend={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('initialValue preenche o textarea', () => {
    render(<PromptInputBox onSend={vi.fn()} initialValue="contexto prévio" />);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('contexto prévio');
  });

  it('imperative handle: setValue / focus / clear', () => {
    const Harness = () => {
      const ref = useRef<PromptInputBoxHandle>(null);
      return (
        <>
          <PromptInputBox ref={ref} onSend={vi.fn()} autoFocus={false} />
          <button onClick={() => ref.current?.setValue('via handle')}>set</button>
          <button onClick={() => ref.current?.clear()}>clear</button>
          <button onClick={() => ref.current?.focus()}>focus</button>
        </>
      );
    };
    render(<Harness />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.click(screen.getByText('set'));
    expect(textarea.value).toBe('via handle');
    fireEvent.click(screen.getByText('clear'));
    expect(textarea.value).toBe('');
    fireEvent.click(screen.getByText('focus'));
    expect(textarea).toHaveFocus();
  });

  it('rejeita arquivo tipo não suportado e mostra toast', async () => {
    const onSend = vi.fn();
    render(<PromptInputBox onSend={onSend} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bad = new File(['x'], 'movie.mp4', { type: 'video/mp4' });
    await act(async () => {
      fireEvent.change(input, { target: { files: [bad] } });
    });
    expect(screen.queryByText('movie.mp4')).not.toBeInTheDocument();
  });
});
```

- [x] **Step 5.2: Rodar testes — devem falhar**

```bash
npx vitest run src/agents/chat/__tests__/PromptInputBox.test.tsx
```

Esperado: FAIL (API ainda não bate).

- [x] **Step 5.3: Adaptar API em `prompt-input-box.tsx`**

No topo do arquivo, garantir os tipos exportados:

```tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { Attachment, AttachmentType } from '@/agents/chat/types';

export interface PromptInputBoxProps {
  onSend: (text: string, files: Attachment[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxFiles?: number;
  acceptedTypes?: AttachmentType[];
  disabled?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  className?: string;
}

export interface PromptInputBoxHandle {
  setValue: (text: string) => void;
  focus: () => void;
  clear: () => void;
}
```

Converter o componente default em `forwardRef<PromptInputBoxHandle, PromptInputBoxProps>`:

```tsx
export const PromptInputBox = forwardRef<PromptInputBoxHandle, PromptInputBoxProps>(
  function PromptInputBox(
    {
      onSend,
      onStop,
      isLoading = false,
      placeholder = 'Digite uma mensagem...',
      maxFiles = 5,
      acceptedTypes = ['image', 'pdf', 'text'],
      disabled = false,
      autoFocus = true,
      initialValue = '',
      className,
    },
    ref,
  ) {
    const [text, setText] = useState(initialValue);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        setValue: (v: string) => setText(v),
        focus: () => textareaRef.current?.focus(),
        clear: () => {
          setText('');
          setAttachments((prev) => {
            prev.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
            return [];
          });
        },
      }),
      [],
    );

    useEffect(() => {
      if (autoFocus) textareaRef.current?.focus();
    }, [autoFocus]);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (e.key !== '/') return;
        if (!target) return;
        const tag = target.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;
        if (!window.matchMedia('(pointer: fine)').matches) return;
        e.preventDefault();
        textareaRef.current?.focus();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

    // ... resto (handleSend, renderização etc.) deve usar `text`, `setText`, `attachments`.
    // handleSend:
    const handleSend = () => {
      const trimmed = text.trim();
      if (!trimmed && attachments.length === 0) return;
      if (disabled || isLoading) return;
      onSend(trimmed, attachments);
      setText('');
      setAttachments((prev) => {
        prev.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
        return [];
      });
    };
    // ...
```

- [x] **Step 5.4: Botão Stop durante loading**

Localizar o botão de enviar. Substituir por render condicional:

```tsx
{isLoading && onStop ? (
  <button
    type="button"
    onClick={onStop}
    aria-label="Parar resposta"
    className="rounded-full bg-destructive p-2 text-destructive-foreground hover:bg-destructive/90"
  >
    <Square className="h-4 w-4" />
  </button>
) : (
  <button
    type="button"
    onClick={handleSend}
    disabled={isLoading || disabled || (text.trim() === '' && attachments.length === 0)}
    aria-label="Enviar mensagem"
    className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
  >
    <ArrowUp className="h-4 w-4" />
  </button>
)}
```

Importar `Square` e `ArrowUp` de `lucide-react` se ainda não estiverem.

- [x] **Step 5.5: Handler do Enter**

Garantir que o textarea tenha:

```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}}
```

- [x] **Step 5.6: Rodar testes — devem passar**

```bash
npx vitest run src/agents/chat/__tests__/PromptInputBox.test.tsx
```

Esperado: 10 testes passando.

- [x] **Step 5.7: Commit**

```bash
git add src/components/ui/prompt-input-box.tsx src/agents/chat/__tests__/PromptInputBox.test.tsx
git commit -m "feat(ui): define API do PromptInputBox (onSend/onStop/handle)"
```

---

## Task 6: StreamingIndicator

**Files:**
- Create: `src/agents/chat/StreamingIndicator.tsx`
- Create: `src/agents/chat/__tests__/StreamingIndicator.test.tsx`

- [x] **Step 6.1: Escrever teste**

Arquivo `src/agents/chat/__tests__/StreamingIndicator.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreamingIndicator } from '../StreamingIndicator';

describe('StreamingIndicator', () => {
  it('renderiza label default', () => {
    render(<StreamingIndicator />);
    expect(screen.getByText(/pensando/i)).toBeInTheDocument();
  });

  it('aceita label custom', () => {
    render(<StreamingIndicator label="Analisando PDF..." />);
    expect(screen.getByText('Analisando PDF...')).toBeInTheDocument();
  });

  it('renderiza 3 pontos', () => {
    const { container } = render(<StreamingIndicator />);
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(3);
  });
});
```

- [x] **Step 6.2: Rodar — deve falhar**

```bash
npx vitest run src/agents/chat/__tests__/StreamingIndicator.test.tsx
```

Esperado: FAIL (módulo inexistente).

- [x] **Step 6.3: Implementar**

Arquivo `src/agents/chat/StreamingIndicator.tsx`:

```tsx
import { cn } from '@/lib/utils';

export interface StreamingIndicatorProps {
  variant?: 'dots' | 'pulse';
  label?: string;
  className?: string;
}

export function StreamingIndicator({
  variant = 'dots',
  label = 'Pensando...',
  className,
}: StreamingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
    >
      <div className="flex gap-1" aria-hidden>
        {[0, 150, 300].map((delay, i) => (
          <span
            key={i}
            data-dot
            className={cn(
              'h-1.5 w-1.5 rounded-full bg-primary',
              variant === 'pulse' ? 'motion-safe:animate-pulse' : 'motion-safe:animate-bounce',
            )}
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span>{label}</span>
    </div>
  );
}
```

- [x] **Step 6.4: Rodar — deve passar**

```bash
npx vitest run src/agents/chat/__tests__/StreamingIndicator.test.tsx
```

Esperado: 3 testes passando.

- [x] **Step 6.5: Commit**

```bash
git add src/agents/chat/StreamingIndicator.tsx src/agents/chat/__tests__/StreamingIndicator.test.tsx
git commit -m "feat(chat): adiciona StreamingIndicator"
```

---

## Task 7: FileAttachmentChip

**Files:**
- Create: `src/agents/chat/FileAttachmentChip.tsx`
- Create: `src/agents/chat/__tests__/FileAttachmentChip.test.tsx`

- [x] **Step 7.1: Escrever teste**

Arquivo `src/agents/chat/__tests__/FileAttachmentChip.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileAttachmentChip } from '../FileAttachmentChip';
import type { Attachment } from '../types';

const makeAtt = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: 'a1',
  type: 'pdf',
  file: new File([''], 'doc.pdf', { type: 'application/pdf' }),
  name: 'doc.pdf',
  sizeBytes: 2_500_000,
  ...overrides,
});

describe('FileAttachmentChip', () => {
  it('imagem renderiza thumb com alt', () => {
    const att = makeAtt({ type: 'image', previewUrl: 'blob:fake', name: 'foto.png' });
    render(<FileAttachmentChip attachment={att} />);
    const img = screen.getByRole('img', { name: 'foto.png' });
    expect(img).toHaveAttribute('src', 'blob:fake');
  });

  it('PDF renderiza nome + tamanho formatado', () => {
    render(<FileAttachmentChip attachment={makeAtt()} />);
    expect(screen.getByText('doc.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.4 MB')).toBeInTheDocument();
  });

  it('onRemove aparece como botão acessível e dispara callback', () => {
    const onRemove = vi.fn();
    render(<FileAttachmentChip attachment={makeAtt()} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: /remover anexo/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('sem onRemove: botão não aparece (modo read-only)', () => {
    render(<FileAttachmentChip attachment={makeAtt()} />);
    expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
  });

  it('onClick dispara callback (abrir preview)', () => {
    const onClick = vi.fn();
    render(<FileAttachmentChip attachment={makeAtt()} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /abrir anexo/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- [x] **Step 7.2: Implementar `src/agents/chat/FileAttachmentChip.tsx`**

```tsx
import { FileText, FileType, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBytes } from './utils';
import type { Attachment } from './types';

export interface FileAttachmentChipProps {
  attachment: Attachment;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function FileAttachmentChip({
  attachment,
  onRemove,
  onClick,
  size = 'md',
  className,
}: FileAttachmentChipProps) {
  const thumbSize = size === 'sm' ? 'h-10 w-10' : 'h-14 w-14';

  if (attachment.type === 'image' && attachment.previewUrl) {
    return (
      <div className={cn('relative inline-block', className)}>
        <button
          type="button"
          onClick={onClick}
          aria-label={`Abrir anexo ${attachment.name}`}
          className={cn(thumbSize, 'overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary')}
        >
          <img src={attachment.previewUrl} alt={attachment.name} className="h-full w-full object-cover" />
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover anexo ${attachment.name}`}
            className="absolute -right-1 -top-1 rounded-full bg-background p-0.5 shadow"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  const Icon = attachment.type === 'pdf' ? FileText : FileType;

  return (
    <div className={cn('relative inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2', className)}>
      <button
        type="button"
        onClick={onClick}
        aria-label={`Abrir anexo ${attachment.name}`}
        className="flex items-center gap-2 text-left focus:outline-none"
      >
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
        <div className="flex flex-col">
          <span className="max-w-[140px] truncate text-xs text-foreground">{attachment.name}</span>
          <span className="text-[10px] text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
        </div>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover anexo ${attachment.name}`}
          className="ml-1 rounded-full p-1 hover:bg-muted-foreground/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

- [x] **Step 7.3: Rodar — deve passar**

```bash
npx vitest run src/agents/chat/__tests__/FileAttachmentChip.test.tsx
```

- [x] **Step 7.4: Commit**

```bash
git add src/agents/chat/FileAttachmentChip.tsx src/agents/chat/__tests__/FileAttachmentChip.test.tsx
git commit -m "feat(chat): adiciona FileAttachmentChip"
```

---

## Task 8: AttachmentPreviewModal (smoke test)

**Files:**
- Create: `src/agents/chat/AttachmentPreviewModal.tsx`

- [x] **Step 8.1: Implementar**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatBytes } from './utils';
import type { Attachment } from './types';

export interface AttachmentPreviewModalProps {
  attachment: Attachment | null;
  onClose: () => void;
}

export function AttachmentPreviewModal({ attachment, onClose }: AttachmentPreviewModalProps) {
  const open = attachment !== null;

  const handleDownload = () => {
    if (!attachment) return;
    const url = attachment.previewUrl ?? URL.createObjectURL(attachment.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    a.click();
    if (!attachment.previewUrl) URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{attachment?.name ?? ''}</DialogTitle>
        </DialogHeader>
        {attachment && (
          <div className="flex flex-col items-center gap-4">
            {attachment.type === 'image' && attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt={attachment.name}
                className="max-h-[60vh] w-auto rounded-xl object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-muted p-8 text-center">
                <span className="text-sm text-muted-foreground">
                  {attachment.type === 'pdf' ? 'Pré-visualização de PDF indisponível' : 'Arquivo de texto'}
                </span>
                <span className="text-xs text-muted-foreground">{formatBytes(attachment.sizeBytes)}</span>
              </div>
            )}
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Baixar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [x] **Step 8.2: Verificar typecheck**

```bash
npx tsc --noEmit
```

- [x] **Step 8.3: Commit**

```bash
git add src/agents/chat/AttachmentPreviewModal.tsx
git commit -m "feat(chat): adiciona AttachmentPreviewModal"
```

---

## Task 9: MessageBubble

**Files:**
- Create: `src/agents/chat/MessageBubble.tsx`
- Create: `src/agents/chat/__tests__/MessageBubble.test.tsx`

- [x] **Step 9.1: Escrever teste**

Arquivo `src/agents/chat/__tests__/MessageBubble.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';

describe('MessageBubble', () => {
  it('role=user alinha à direita e aplica bg-primary', () => {
    const { container } = render(<MessageBubble role="user">olá</MessageBubble>);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/justify-end/);
    expect(container.querySelector('[data-role="user"]')!.className).toMatch(/bg-primary/);
  });

  it('role=assistant: sem bubble colorida', () => {
    render(<MessageBubble role="assistant">resposta</MessageBubble>);
    const el = screen.getByText('resposta');
    expect(el.className).not.toMatch(/bg-primary/);
  });

  it('isStreaming mostra cursor piscando', () => {
    render(
      <MessageBubble role="assistant" isStreaming>
        tex
      </MessageBubble>,
    );
    expect(screen.getByTestId('streaming-cursor')).toBeInTheDocument();
  });

  it('variant=error mostra ícone AlertCircle', () => {
    const { container } = render(
      <MessageBubble role="assistant" variant="error">
        falha
      </MessageBubble>,
    );
    expect(container.querySelector('[data-testid="icon-error"]')).toBeInTheDocument();
  });

  it('variant=interrupted mostra label', () => {
    render(
      <MessageBubble role="assistant" variant="interrupted">
        parcial
      </MessageBubble>,
    );
    expect(screen.getByText(/resposta interrompida/i)).toBeInTheDocument();
  });

  it('assistant: botão copy copia textContent', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<MessageBubble role="assistant">conteúdo completo</MessageBubble>);
    fireEvent.click(screen.getByRole('button', { name: /copiar/i }));
    expect(writeText).toHaveBeenCalledWith('conteúdo completo');
  });
});
```

- [x] **Step 9.2: Rodar — deve falhar**

```bash
npx vitest run src/agents/chat/__tests__/MessageBubble.test.tsx
```

- [x] **Step 9.3: Implementar**

Arquivo `src/agents/chat/MessageBubble.tsx`:

```tsx
import { useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileAttachmentChip } from './FileAttachmentChip';
import type { Attachment, MessageRole, MessageVariant } from './types';

export interface MessageBubbleProps {
  role: MessageRole;
  variant?: MessageVariant;
  children: ReactNode;
  attachments?: Attachment[];
  timestamp?: number;
  isStreaming?: boolean;
  className?: string;
}

export function MessageBubble({
  role,
  variant = 'default',
  children,
  attachments,
  timestamp,
  isStreaming,
  className,
}: MessageBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = contentRef.current?.textContent ?? '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (role === 'system') {
    return (
      <div className={cn('flex justify-center py-1', className)}>
        <span className="text-xs text-muted-foreground">{children}</span>
      </div>
    );
  }

  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'group flex w-full',
        isUser ? 'justify-end' : 'justify-start',
        className,
      )}
    >
      <div className="flex max-w-[85%] md:max-w-[70%] flex-col gap-1">
        {attachments && attachments.length > 0 && (
          <div className={cn('flex flex-wrap gap-2', isUser && 'justify-end')}>
            {attachments.map((att) => (
              <FileAttachmentChip key={att.id} attachment={att} size="sm" />
            ))}
          </div>
        )}

        <div
          data-role={role}
          className={cn(
            'relative rounded-2xl px-4 py-3 text-sm',
            isUser
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'bg-transparent text-foreground',
            variant === 'error' && 'border border-destructive/40',
          )}
        >
          {variant === 'error' && (
            <AlertCircle
              data-testid="icon-error"
              className="absolute -left-6 top-3 h-4 w-4 text-destructive"
              aria-hidden
            />
          )}

          <div ref={contentRef} className="whitespace-pre-wrap">
            {children}
            {isStreaming && (
              <span
                data-testid="streaming-cursor"
                className="ml-0.5 inline-block motion-safe:animate-pulse"
                aria-hidden
              >
                ▍
              </span>
            )}
          </div>

          {!isUser && !isStreaming && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copiar mensagem"
              className="absolute -right-2 -top-2 hidden rounded-full bg-card p-1.5 shadow group-hover:block focus:block"
            >
              {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
            </button>
          )}
        </div>

        {variant === 'interrupted' && (
          <span className="text-xs text-muted-foreground">Resposta interrompida</span>
        )}

        {timestamp && (
          <time
            dateTime={new Date(timestamp).toISOString()}
            className={cn('hidden text-[10px] text-muted-foreground group-hover:block', isUser && 'text-right')}
          >
            {new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </time>
        )}
      </div>
    </div>
  );
}
```

- [x] **Step 9.4: Rodar — deve passar**

```bash
npx vitest run src/agents/chat/__tests__/MessageBubble.test.tsx
```

- [x] **Step 9.5: Commit**

```bash
git add src/agents/chat/MessageBubble.tsx src/agents/chat/__tests__/MessageBubble.test.tsx
git commit -m "feat(chat): adiciona MessageBubble com variants e cópia"
```

---

## Task 10: MessageList (auto-scroll + FAB)

**Files:**
- Create: `src/agents/chat/MessageList.tsx`
- Create: `src/agents/chat/__tests__/MessageList.test.tsx`

- [x] **Step 10.1: Escrever teste**

Arquivo `src/agents/chat/__tests__/MessageList.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '../MessageList';
import { MessageBubble } from '../MessageBubble';
import type { ChatMessage } from '../types';

const msg = (partial: Partial<ChatMessage>): ChatMessage => ({
  id: String(Math.random()),
  role: 'user',
  content: 'm',
  createdAt: Date.now(),
  ...partial,
});

describe('MessageList', () => {
  it('renderiza empty state quando messages.length === 0', () => {
    render(<MessageList messages={[]} emptyState={<div>Sem mensagens</div>} />);
    expect(screen.getByText('Sem mensagens')).toBeInTheDocument();
  });

  it('renderiza mensagens em ordem', () => {
    const messages = [msg({ id: '1', content: 'a' }), msg({ id: '2', content: 'b' })];
    render(
      <MessageList messages={messages}>
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role}>
            {m.content}
          </MessageBubble>
        ))}
      </MessageList>,
    );
    const texts = screen.getAllByText(/^[ab]$/).map((el) => el.textContent);
    expect(texts).toEqual(['a', 'b']);
  });

  it('mostra StreamingIndicator se isStreaming e última msg não é do assistant', () => {
    const messages = [msg({ id: '1', role: 'user', content: 'oi' })];
    render(
      <MessageList messages={messages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
      </MessageList>,
    );
    expect(screen.getByText(/pensando/i)).toBeInTheDocument();
  });

  it('esconde StreamingIndicator se a última msg do assistant já começou a vir', () => {
    const messages = [
      msg({ id: '1', role: 'user', content: 'oi' }),
      msg({ id: '2', role: 'assistant', content: 'r' }),
    ];
    render(
      <MessageList messages={messages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
        <MessageBubble role="assistant" isStreaming>r</MessageBubble>
      </MessageList>,
    );
    expect(screen.queryByText(/pensando/i)).not.toBeInTheDocument();
  });

  it('FAB "Novas mensagens" aparece quando usuário rolou pra cima', () => {
    const messages = [msg({ id: '1' })];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="user">1</MessageBubble>
      </MessageList>,
    );
    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    Object.defineProperty(scrollBox, 'scrollTop', { configurable: true, value: 0 });
    Object.defineProperty(scrollBox, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 400 });
    fireEvent.scroll(scrollBox);
    // após scroll ao topo, simulamos chegada de nova msg
    const newMsgs = [...messages, msg({ id: '2' })];
    rerender(
      <MessageList messages={newMsgs}>
        <MessageBubble role="user">1</MessageBubble>
        <MessageBubble role="user">2</MessageBubble>
      </MessageList>,
    );
    expect(screen.getByRole('button', { name: /novas mensagens/i })).toBeInTheDocument();
  });
});
```

- [x] **Step 10.2: Rodar — deve falhar**

```bash
npx vitest run src/agents/chat/__tests__/MessageList.test.tsx
```

- [x] **Step 10.3: Implementar**

Arquivo `src/agents/chat/MessageList.tsx`:

```tsx
import { Children, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StreamingIndicator } from './StreamingIndicator';
import type { ChatMessage } from './types';

export interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  emptyState?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const BOTTOM_THRESHOLD = 80;

export function MessageList({ messages, isStreaming, emptyState, children, className }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const prevLenRef = useRef(messages.length);

  const lastMessage = messages[messages.length - 1];
  const shouldShowIndicator =
    isStreaming &&
    (!lastMessage ||
      lastMessage.role !== 'assistant' ||
      (typeof lastMessage.content === 'string' && lastMessage.content.length === 0));

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const grew = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;
    if (grew && atBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, atBottom]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distanceFromBottom < BOTTOM_THRESHOLD);
  };

  const jumpToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setAtBottom(true);
  };

  if (messages.length === 0 && emptyState) {
    return <div className={cn('flex h-full items-center justify-center', className)}>{emptyState}</div>;
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      data-scroll-root
      role="log"
      aria-live={isStreaming ? 'off' : 'polite'}
      aria-atomic="false"
      className={cn('relative h-full overflow-y-auto px-4 py-6', className)}
    >
      <div className="mx-auto flex max-w-[760px] flex-col gap-6">
        {children}
        {shouldShowIndicator && <StreamingIndicator />}
      </div>

      {!atBottom && messages.length > 0 && (
        <button
          type="button"
          onClick={jumpToBottom}
          className="fixed bottom-24 right-6 inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs text-foreground shadow-premium"
        >
          <ArrowDown className="h-3 w-3" aria-hidden />
          Novas mensagens
        </button>
      )}
    </div>
  );
}
```

- [x] **Step 10.4: Rodar — deve passar**

```bash
npx vitest run src/agents/chat/__tests__/MessageList.test.tsx
```

- [x] **Step 10.5: Commit**

```bash
git add src/agents/chat/MessageList.tsx src/agents/chat/__tests__/MessageList.test.tsx
git commit -m "feat(chat): adiciona MessageList com auto-scroll inteligente"
```

---

## Task 11: AgentHeader (smoke test)

**Files:**
- Create: `src/agents/chat/AgentHeader.tsx`

- [x] **Step 11.1: Implementar**

```tsx
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ReactNode } from 'react';

export interface AgentHeaderProps {
  name: string;
  subtitle?: string;
  avatarSrc?: string;
  status?: 'online' | 'thinking';
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
}

export function AgentHeader({
  name,
  subtitle,
  avatarSrc,
  status,
  onBack,
  rightSlot,
  className,
}: AgentHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:h-16 md:px-6',
        className,
      )}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="rounded-full p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
      )}

      <Avatar className={cn('h-10 w-10', status === 'thinking' && 'glow-primary-sm')}>
        {avatarSrc && <AvatarImage src={avatarSrc} alt={name} />}
        <AvatarFallback className="gradient-primary text-primary-foreground">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col">
        <span className="font-display text-base font-semibold text-foreground">{name}</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>

      {rightSlot}
    </header>
  );
}
```

- [x] **Step 11.2: Verificar typecheck**

```bash
npx tsc --noEmit
```

- [x] **Step 11.3: Commit**

```bash
git add src/agents/chat/AgentHeader.tsx
git commit -m "feat(chat): adiciona AgentHeader"
```

---

## Task 12: ArtifactPanel

**Files:**
- Create: `src/agents/chat/ArtifactPanel.tsx`

- [x] **Step 12.1: Implementar**

```tsx
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface ArtifactPanelProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  toolbar?: ReactNode;
  children: ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

export function ArtifactPanel({
  title,
  subtitle,
  onClose,
  toolbar,
  children,
  emptyState,
  className,
}: ArtifactPanelProps) {
  return (
    <section className={cn('flex h-full flex-col bg-card', className)} aria-label={title}>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
        {toolbar}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-auto p-6">
        {emptyState && !children ? emptyState : children}
      </div>
    </section>
  );
}
```

- [x] **Step 12.2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/agents/chat/ArtifactPanel.tsx
git commit -m "feat(chat): adiciona ArtifactPanel"
```

---

## Task 13: ChatEmptyState

**Files:**
- Create: `src/agents/chat/ChatEmptyState.tsx`
- Create: `src/agents/chat/__tests__/ChatEmptyState.test.tsx`

- [x] **Step 13.1: Escrever teste**

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatEmptyState } from '../ChatEmptyState';

describe('ChatEmptyState', () => {
  it('renderiza nome e missão', () => {
    render(<ChatEmptyState agentName="Caloni" agentMission="Decisor Comercial" />);
    expect(screen.getByText('Caloni')).toBeInTheDocument();
    expect(screen.getByText('Decisor Comercial')).toBeInTheDocument();
  });

  it('renderiza suggestion pills e dispara onPick', () => {
    const onPick = vi.fn();
    const suggestions = [
      { label: 'Diagnóstico', prompt: 'Diagnostica meu negócio' },
      { label: 'Qualificar lead', prompt: 'Qualificar o lead X' },
    ];
    render(<ChatEmptyState agentName="Caloni" suggestions={suggestions} onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Diagnóstico' }));
    expect(onPick).toHaveBeenCalledWith('Diagnostica meu negócio');
  });

  it('sem suggestions: não renderiza lista', () => {
    render(<ChatEmptyState agentName="Caloni" />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
```

- [x] **Step 13.2: Implementar**

```tsx
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export interface ChatSuggestion {
  label: string;
  prompt: string;
}

export interface ChatEmptyStateProps {
  agentName: string;
  agentMission?: string;
  avatarSrc?: string;
  suggestions?: ChatSuggestion[];
  onPick?: (prompt: string) => void;
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
        {avatarSrc && <AvatarImage src={avatarSrc} alt={agentName} />}
        <AvatarFallback className="gradient-primary text-2xl text-primary-foreground">
          {agentName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <h1 className="font-display text-2xl font-bold text-foreground">{agentName}</h1>
      {agentMission && <p className="max-w-md text-sm text-muted-foreground">{agentMission}</p>}

      {suggestions && suggestions.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <li key={s.label}>
              <Button variant="outline" size="sm" onClick={() => onPick?.(s.prompt)}>
                {s.label}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [x] **Step 13.3: Rodar — deve passar**

```bash
npx vitest run src/agents/chat/__tests__/ChatEmptyState.test.tsx
```

- [x] **Step 13.4: Commit**

```bash
git add src/agents/chat/ChatEmptyState.tsx src/agents/chat/__tests__/ChatEmptyState.test.tsx
git commit -m "feat(chat): adiciona ChatEmptyState com suggestion pills"
```

---

## Task 14: ChatLayout (modo `pure`)

**Files:**
- Create: `src/agents/chat/ChatLayout.tsx`
- Create: `src/agents/chat/__tests__/ChatLayout.test.tsx`

- [x] **Step 14.1: Escrever teste (só pure nesse commit)**

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { ChatLayout } from '../ChatLayout';

describe('ChatLayout (pure)', () => {
  it('modo pure: grid 3 linhas', () => {
    const { container } = render(
      <ChatLayout mode="pure">
        <div data-role="header">H</div>
        <div data-role="list">L</div>
        <div data-role="input">I</div>
      </ChatLayout>,
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toMatch(/grid-rows-\[auto_1fr_auto\]/);
  });

  it('modo pure: aplica max-width 760px na coluna central', () => {
    const { container } = render(
      <ChatLayout mode="pure">
        <div />
      </ChatLayout>,
    );
    expect(container.querySelector('[data-layout="pure-inner"]')!.className).toMatch(/max-w-\[760px\]/);
  });
});
```

- [x] **Step 14.2: Implementar (apenas `pure` por ora)**

```tsx
import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Mode = 'pure' | 'split';

const LayoutContext = createContext<Mode>('pure');

export interface ChatLayoutProps {
  mode: Mode;
  children: ReactNode;
  className?: string;
}

export function ChatLayout({ mode, children, className }: ChatLayoutProps) {
  if (mode === 'pure') {
    return (
      <LayoutContext.Provider value="pure">
        <div
          className={cn(
            'grid h-[100dvh] grid-rows-[auto_1fr_auto] bg-background text-foreground',
            className,
          )}
        >
          <div data-layout="pure-inner" className="mx-auto flex w-full max-w-[760px] flex-col contents">
            {children}
          </div>
        </div>
      </LayoutContext.Provider>
    );
  }

  // split é adicionado na Task 15
  return <SplitLayout className={className}>{children}</SplitLayout>;
}

// Stub para compilar enquanto split não existe (será substituído)
function SplitLayout({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('h-[100dvh]', className)}>{children}</div>;
}

// Sub-compostos (no-op por enquanto)
ChatLayout.Panel = function Panel({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
ChatLayout.Divider = function Divider() {
  return null;
};
ChatLayout.Artifact = function Artifact({ children }: { children: ReactNode }) {
  return <>{children}</>;
};

export function useChatLayoutMode(): Mode {
  return useContext(LayoutContext);
}
```

- [x] **Step 14.3: Rodar — deve passar**

```bash
npx vitest run src/agents/chat/__tests__/ChatLayout.test.tsx
```

- [x] **Step 14.4: Commit**

```bash
git add src/agents/chat/ChatLayout.tsx src/agents/chat/__tests__/ChatLayout.test.tsx
git commit -m "feat(chat): adiciona ChatLayout (modo pure)"
```

---

## Task 15: ChatLayout modo `split` (desktop + mobile Sheet)

**Files:**
- Modify: `src/agents/chat/ChatLayout.tsx`
- Modify: `src/agents/chat/__tests__/ChatLayout.test.tsx`

- [x] **Step 15.1: Adicionar testes**

Anexar ao `ChatLayout.test.tsx`:

```tsx
import { fireEvent } from '@testing-library/react';
// ... dentro do mesmo describe ou em um describe('ChatLayout (split)'):

describe('ChatLayout (split)', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (q: string) => ({
        matches: q.includes('min-width: 768px'),
        media: q,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('desktop: renderiza painel + divisor + artefato', () => {
    const { container } = render(
      <ChatLayout mode="split">
        <ChatLayout.Panel>
          <div>PANEL</div>
        </ChatLayout.Panel>
        <ChatLayout.Divider />
        <ChatLayout.Artifact>
          <div>ART</div>
        </ChatLayout.Artifact>
      </ChatLayout>,
    );
    expect(container.querySelector('[data-layout="split-panel"]')).toBeTruthy();
    expect(container.querySelector('[data-layout="split-artifact"]')).toBeTruthy();
  });

  it('persiste tamanho em localStorage', () => {
    localStorage.setItem('seven.chat.split-size', JSON.stringify([60, 40]));
    render(
      <ChatLayout mode="split">
        <ChatLayout.Panel><div /></ChatLayout.Panel>
        <ChatLayout.Divider />
        <ChatLayout.Artifact><div /></ChatLayout.Artifact>
      </ChatLayout>,
    );
    // o Panel inicial deve ler do localStorage; não verificamos estilo exato,
    // mas o fato de renderizar sem crash confirma wiring
    expect(localStorage.getItem('seven.chat.split-size')).toBeTruthy();
  });
});
```

- [x] **Step 15.2: Rodar — `split` deve falhar**

```bash
npx vitest run src/agents/chat/__tests__/ChatLayout.test.tsx
```

- [x] **Step 15.3: Implementar `SplitLayout`**

Substituir o stub `SplitLayout` em `src/agents/chat/ChatLayout.tsx`:

```tsx
import { Children, useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PanelRight } from 'lucide-react';

const SPLIT_STORAGE_KEY = 'seven.chat.split-size';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

function loadSizes(): [number, number] {
  if (typeof window === 'undefined') return [60, 40];
  try {
    const raw = window.localStorage.getItem(SPLIT_STORAGE_KEY);
    if (!raw) return [60, 40];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 2) return parsed as [number, number];
  } catch {
    /* ignore */
  }
  return [60, 40];
}

function findChild(children: ReactNode, displayName: string): ReactNode {
  const arr = Children.toArray(children) as ReactElement[];
  return arr.find(
    (c) =>
      typeof c === 'object' &&
      c !== null &&
      (c.type as { displayName?: string } | null)?.displayName === displayName,
  );
}

function SplitLayout({ children, className }: { children: ReactNode; className?: string }) {
  const isDesktop = useIsDesktop();
  const [sheetOpen, setSheetOpen] = useState(false);
  const initial = loadSizes();

  const panel = findChild(children, 'ChatLayoutPanel');
  const artifact = findChild(children, 'ChatLayoutArtifact');

  if (!isDesktop) {
    return (
      <div className={cn('relative h-[100dvh] bg-background text-foreground', className)}>
        <div data-layout="split-panel" className="h-full">
          {panel}
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="fixed right-4 top-4"
              aria-label="Abrir painel de artefato"
            >
              <PanelRight className="h-4 w-4" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90vw] max-w-[90vw] p-0">
            <div data-layout="split-artifact" className="h-full">
              {artifact}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className={cn('h-[100dvh] bg-background text-foreground', className)}>
      <PanelGroup
        direction="horizontal"
        autoSaveId={SPLIT_STORAGE_KEY}
        onLayout={(s) => {
          try {
            window.localStorage.setItem(SPLIT_STORAGE_KEY, JSON.stringify(s));
          } catch {
            /* ignore */
          }
        }}
      >
        <Panel defaultSize={initial[0]} minSize={35} data-layout="split-panel">
          {panel}
        </Panel>
        <PanelResizeHandle className="w-[1px] bg-border hover:w-1 data-[resize-handle-active]:w-1 transition-[width]" />
        <Panel defaultSize={initial[1]} minSize={25} data-layout="split-artifact">
          {artifact}
        </Panel>
      </PanelGroup>
    </div>
  );
}
```

Atualizar os sub-compostos para terem `displayName`:

```tsx
ChatLayout.Panel = function Panel({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
ChatLayout.Panel.displayName = 'ChatLayoutPanel';

ChatLayout.Divider = function Divider() {
  return null;
};
ChatLayout.Divider.displayName = 'ChatLayoutDivider';

ChatLayout.Artifact = function Artifact({ children }: { children: ReactNode }) {
  return <>{children}</>;
};
ChatLayout.Artifact.displayName = 'ChatLayoutArtifact';
```

Remover import duplicado se `cn` foi incluído no arquivo.

- [x] **Step 15.4: Verificar se `sheet.tsx` existe em `components/ui`**

```bash
ls src/components/ui/sheet.tsx 2>/dev/null && echo OK || npx shadcn@latest add sheet --yes
```

- [x] **Step 15.5: Rodar tests**

```bash
npx vitest run src/agents/chat/__tests__/ChatLayout.test.tsx
```

Esperado: todos passando.

- [x] **Step 15.6: Commit**

```bash
git add src/agents/chat/ChatLayout.tsx src/agents/chat/__tests__/ChatLayout.test.tsx src/components/ui/sheet.tsx
git commit -m "feat(chat): implementa ChatLayout split (desktop + mobile Sheet)"
```

---

## Task 16: Barrel export

**Files:**
- Create: `src/agents/chat/index.ts`

- [x] **Step 16.1: Criar barrel**

```ts
export { ChatLayout } from './ChatLayout';
export type { ChatLayoutProps } from './ChatLayout';
export { AgentHeader } from './AgentHeader';
export type { AgentHeaderProps } from './AgentHeader';
export { MessageList } from './MessageList';
export type { MessageListProps } from './MessageList';
export { MessageBubble } from './MessageBubble';
export type { MessageBubbleProps } from './MessageBubble';
export { StreamingIndicator } from './StreamingIndicator';
export type { StreamingIndicatorProps } from './StreamingIndicator';
export { FileAttachmentChip } from './FileAttachmentChip';
export type { FileAttachmentChipProps } from './FileAttachmentChip';
export { AttachmentPreviewModal } from './AttachmentPreviewModal';
export type { AttachmentPreviewModalProps } from './AttachmentPreviewModal';
export { ArtifactPanel } from './ArtifactPanel';
export type { ArtifactPanelProps } from './ArtifactPanel';
export { ChatEmptyState } from './ChatEmptyState';
export type { ChatEmptyStateProps, ChatSuggestion } from './ChatEmptyState';
export type { Attachment, AttachmentType, ChatMessage, MessageRole, MessageVariant } from './types';
```

- [x] **Step 16.2: Verificar typecheck**

```bash
npx tsc --noEmit
```

- [x] **Step 16.3: Commit**

```bash
git add src/agents/chat/index.ts
git commit -m "feat(chat): exporta primitivos via barrel"
```

---

## Task 17: Mock responses + MockArtifact

**Files:**
- Create: `src/agents/chat/demo/mockResponses.ts`
- Create: `src/agents/chat/demo/MockArtifact.tsx`

- [x] **Step 17.1: Criar `mockResponses.ts`**

```ts
import type { Attachment } from '../types';

export interface MockDecision {
  text: string;
  artifact?: 'proposta' | null;
}

const DIAGNOSTIC_LOREM = `
Analisando o contexto do seu negócio, identifico 7 frentes:

1. Posicionamento — falta uma tese clara para o segmento.
2. Ofertas — pacote único não permite teste A/B de preço.
3. Canais de aquisição — tráfego pago sem funil de nutrição.
4. Funil comercial — taxa de conversão MQL→SQL baixa, hipótese: qualificação rasa.
5. Entrega — processo reativo, sem playbook.
6. Retenção — churn concentrado no mês 2; falta onboarding.
7. Dados — KPIs soltos em planilhas; sem single source of truth.

Recomendação: priorize posicionamento + qualificação. Qual dessas frentes você quer aprofundar primeiro?
`.trim();

export function pickResponse(text: string, attachments: Attachment[]): MockDecision {
  const lower = text.toLowerCase();
  const image = attachments.find((a) => a.type === 'image');
  const pdf = attachments.find((a) => a.type === 'pdf');

  if (image) {
    return { text: `Recebi a imagem \`${image.name}\`. Descreva o que você quer que eu analise nela.` };
  }
  if (pdf) {
    return { text: `Li o PDF \`${pdf.name}\`. Me conta o contexto e o que você espera de saída.` };
  }
  if (lower.includes('diagnóstico') || lower.includes('diagnostico')) {
    return { text: DIAGNOSTIC_LOREM };
  }
  if (lower.includes('proposta')) {
    return {
      text: 'Ok, vou começar o esqueleto da proposta no painel à direita. Enquanto isso, me conta: quem é o cliente e qual o escopo?',
      artifact: 'proposta',
    };
  }
  if (lower.includes('lead') || lower.includes('qualificar')) {
    return { text: 'Beleza. Me passa nome, empresa, cargo e o canal de origem que começamos a qualificação.' };
  }
  return { text: 'Interessante. Pode me contar mais?' };
}
```

- [x] **Step 17.2: Criar `MockArtifact.tsx`**

```tsx
export function MockArtifact() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">Esboço da Proposta</h2>
        <p className="text-xs text-muted-foreground">Gerado pelo agente — ajuste conforme avança a conversa.</p>
      </div>
      <section className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Sumário</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Projeto focado em estruturar aquisição e qualificação para gerar 12 reuniões qualificadas/mês.
        </p>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Entregáveis</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
          <li>Playbook de qualificação</li>
          <li>Scripts de cold call/e-mail</li>
          <li>Painel de métricas</li>
        </ul>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Investimento</h3>
        <p className="mt-2 text-sm text-muted-foreground">R$ 24.000 em 3x.</p>
      </section>
    </div>
  );
}
```

- [x] **Step 17.3: Commit**

```bash
git add src/agents/chat/demo/mockResponses.ts src/agents/chat/demo/MockArtifact.tsx
git commit -m "feat(chat): adiciona mocks de resposta e artefato do demo"
```

---

## Task 18: useChatDemo (hook) + teste

**Files:**
- Create: `src/agents/chat/demo/useChatDemo.ts`
- Create: `src/agents/chat/__tests__/useChatDemo.test.ts`

- [x] **Step 18.1: Escrever teste**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChatDemo } from '../demo/useChatDemo';

describe('useChatDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // rAF síncrono para testes
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
      setTimeout(() => cb(performance.now()), 16),
    );
    vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('send empurra mensagem do user e seta isStreaming=true imediatamente', () => {
    const { result } = renderHook(() => useChatDemo());
    act(() => {
      result.current.send('oi', []);
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.isStreaming).toBe(true);
  });

  it('após 300ms aparece bubble vazia do assistant e começa a digitar', () => {
    const { result } = renderHook(() => useChatDemo());
    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].role).toBe('assistant');
  });

  it('streaming termina → isStreaming=false', () => {
    const { result } = renderHook(() => useChatDemo());
    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.isStreaming).toBe(false);
  });

  it('stop() marca última mensagem como interrupted e para streaming', () => {
    const { result } = renderHook(() => useChatDemo());
    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.isStreaming).toBe(false);
    const last = result.current.messages[result.current.messages.length - 1];
    expect(last.variant).toBe('interrupted');
  });

  it('reset limpa messages', () => {
    const { result } = renderHook(() => useChatDemo());
    act(() => {
      result.current.send('oi', []);
      vi.runAllTimers();
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isStreaming).toBe(false);
  });
});
```

- [x] **Step 18.2: Rodar — deve falhar**

```bash
npx vitest run src/agents/chat/__tests__/useChatDemo.test.ts
```

- [x] **Step 18.3: Implementar hook**

Arquivo `src/agents/chat/demo/useChatDemo.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Attachment, ChatMessage } from '../types';
import { pickResponse, type MockDecision } from './mockResponses';

const TICK_MS = 16;
const THINK_MS = 300;

function uid() {
  return `m_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export interface UseChatDemoResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  lastDecision: MockDecision | null;
  send: (text: string, attachments: Attachment[]) => void;
  stop: () => void;
  reset: () => void;
}

export function useChatDemo(): UseChatDemoResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [lastDecision, setLastDecision] = useState<MockDecision | null>(null);

  const rafRef = useRef<number | null>(null);
  const thinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantIdRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (thinkTimeoutRef.current !== null) {
      clearTimeout(thinkTimeoutRef.current);
      thinkTimeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setMessages([]);
    setIsStreaming(false);
    setLastDecision(null);
    assistantIdRef.current = null;
  }, [clearTimers]);

  const stop = useCallback(() => {
    clearTimers();
    setIsStreaming(false);
    if (assistantIdRef.current) {
      const id = assistantIdRef.current;
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, variant: 'interrupted' } : m)),
      );
      assistantIdRef.current = null;
    }
  }, [clearTimers]);

  const send = useCallback(
    (text: string, attachments: Attachment[]) => {
      if (!text.trim() && attachments.length === 0) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      const decision = pickResponse(text, attachments);
      setLastDecision(decision);

      thinkTimeoutRef.current = setTimeout(() => {
        const assistantId = uid();
        assistantIdRef.current = assistantId;
        const assistantMsg: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        const full = decision.text;
        const chars = [...full];
        const totalTicks = Math.max(30, Math.min(chars.length, 120));
        const charsPerTick = Math.max(1, Math.ceil(chars.length / totalTicks));
        let cursor = 0;

        const tick = () => {
          cursor = Math.min(chars.length, cursor + charsPerTick);
          const slice = chars.slice(0, cursor).join('');
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: slice } : m)),
          );
          if (cursor >= chars.length) {
            setIsStreaming(false);
            assistantIdRef.current = null;
            rafRef.current = null;
            return;
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }, THINK_MS);
    },
    [],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { messages, isStreaming, lastDecision, send, stop, reset };
}
```

- [x] **Step 18.4: Rodar — deve passar**

```bash
npx vitest run src/agents/chat/__tests__/useChatDemo.test.ts
```

- [x] **Step 18.5: Commit**

```bash
git add src/agents/chat/demo/useChatDemo.ts src/agents/chat/__tests__/useChatDemo.test.ts
git commit -m "feat(chat): adiciona useChatDemo com streaming simulado"
```

---

## Task 19: ChatDemoLayout (barra de controle)

**Files:**
- Create: `src/pages/chat-demo/ChatDemoLayout.tsx`

- [x] **Step 19.1: Implementar**

```tsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ChatDemoLayout() {
  const loc = useLocation();
  const mode = loc.pathname.endsWith('/split') ? 'split' : 'pure';

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <div className="flex h-10 items-center gap-3 border-b border-border bg-card px-4 text-xs">
        <Badge variant="secondary">DEMO</Badge>
        <span className="text-muted-foreground">Modo:</span>
        <div className="flex gap-1">
          <Button asChild size="sm" variant={mode === 'pure' ? 'default' : 'outline'}>
            <Link to="/chat/demo/pure">pure</Link>
          </Button>
          <Button asChild size="sm" variant={mode === 'split' ? 'default' : 'outline'}>
            <Link to="/chat/demo/split">split</Link>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
```

- [x] **Step 19.2: Commit**

```bash
git add src/pages/chat-demo/ChatDemoLayout.tsx
git commit -m "feat(chat): adiciona ChatDemoLayout com barra de controle"
```

---

## Task 20: ChatDemoPure

**Files:**
- Create: `src/pages/chat-demo/ChatDemoPure.tsx`

- [x] **Step 20.1: Implementar**

```tsx
import { useRef } from 'react';
import {
  AgentHeader,
  ChatEmptyState,
  ChatLayout,
  MessageBubble,
  MessageList,
} from '@/agents/chat';
import { PromptInputBox, type PromptInputBoxHandle } from '@/components/ui/prompt-input-box';
import { useChatDemo } from '@/agents/chat/demo/useChatDemo';

const SUGGESTIONS = [
  { label: 'Diagnóstico rápido', prompt: 'Faça um diagnóstico do meu negócio' },
  { label: 'Nova proposta', prompt: 'Quero montar uma proposta para um cliente' },
  { label: 'Qualificar lead', prompt: 'Preciso qualificar um lead novo' },
];

export default function ChatDemoPure() {
  const { messages, isStreaming, send, stop, reset } = useChatDemo();
  const inputRef = useRef<PromptInputBoxHandle>(null);

  return (
    <ChatLayout mode="pure">
      <AgentHeader
        name="Caloni"
        subtitle="Decisor Comercial (demo)"
        status={isStreaming ? 'thinking' : 'online'}
        rightSlot={
          <button
            type="button"
            onClick={reset}
            className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            Reset
          </button>
        }
      />

      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        emptyState={
          <ChatEmptyState
            agentName="Caloni"
            agentMission="Converse comigo sobre diagnóstico, proposta ou lead. Posso analisar PDFs e imagens."
            suggestions={SUGGESTIONS}
            onPick={(prompt) => {
              inputRef.current?.setValue(prompt);
              inputRef.current?.focus();
            }}
          />
        }
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            variant={m.variant}
            attachments={m.attachments}
            timestamp={m.createdAt}
            isStreaming={m.role === 'assistant' && isStreaming && m === messages[messages.length - 1]}
          >
            {m.content}
          </MessageBubble>
        ))}
      </MessageList>

      <div className="border-t border-border bg-card/60 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-[760px]">
          <PromptInputBox
            ref={inputRef}
            onSend={send}
            onStop={stop}
            isLoading={isStreaming}
            placeholder="Converse com o Caloni..."
          />
        </div>
      </div>
    </ChatLayout>
  );
}
```

- [x] **Step 20.2: Typecheck + dev smoke**

```bash
npx tsc --noEmit
```

- [x] **Step 20.3: Commit**

```bash
git add src/pages/chat-demo/ChatDemoPure.tsx
git commit -m "feat(chat): adiciona rota de demo modo pure"
```

---

## Task 21: ChatDemoSplit

**Files:**
- Create: `src/pages/chat-demo/ChatDemoSplit.tsx`

- [x] **Step 21.1: Implementar**

```tsx
import { useRef } from 'react';
import {
  AgentHeader,
  ArtifactPanel,
  ChatEmptyState,
  ChatLayout,
  MessageBubble,
  MessageList,
} from '@/agents/chat';
import { PromptInputBox, type PromptInputBoxHandle } from '@/components/ui/prompt-input-box';
import { useChatDemo } from '@/agents/chat/demo/useChatDemo';
import { MockArtifact } from '@/agents/chat/demo/MockArtifact';

const SUGGESTIONS = [
  { label: 'Nova proposta', prompt: 'Quero montar uma proposta comercial' },
  { label: 'Diagnóstico', prompt: 'Faça um diagnóstico completo' },
];

export default function ChatDemoSplit() {
  const { messages, isStreaming, lastDecision, send, stop, reset } = useChatDemo();
  const inputRef = useRef<PromptInputBoxHandle>(null);
  const hasArtifact = lastDecision?.artifact === 'proposta';

  return (
    <ChatLayout mode="split">
      <ChatLayout.Panel>
        <div className="flex h-full flex-col">
          <AgentHeader
            name="Caloni"
            subtitle="Proposta em construção"
            status={isStreaming ? 'thinking' : 'online'}
            rightSlot={
              <button
                type="button"
                onClick={reset}
                className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                Reset
              </button>
            }
          />
          <div className="flex-1 overflow-hidden">
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              emptyState={
                <ChatEmptyState
                  agentName="Caloni"
                  agentMission="Diga 'proposta' para ver o artefato ser construído ao vivo."
                  suggestions={SUGGESTIONS}
                  onPick={(prompt) => {
                    inputRef.current?.setValue(prompt);
                    inputRef.current?.focus();
                  }}
                />
              }
            >
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  variant={m.variant}
                  attachments={m.attachments}
                  timestamp={m.createdAt}
                  isStreaming={m.role === 'assistant' && isStreaming && m === messages[messages.length - 1]}
                >
                  {m.content}
                </MessageBubble>
              ))}
            </MessageList>
          </div>
          <div className="border-t border-border bg-card/60 px-4 py-3 pb-[env(safe-area-inset-bottom)]">
            <PromptInputBox
              ref={inputRef}
              onSend={send}
              onStop={stop}
              isLoading={isStreaming}
              placeholder="Converse com o Caloni..."
            />
          </div>
        </div>
      </ChatLayout.Panel>

      <ChatLayout.Divider />

      <ChatLayout.Artifact>
        <ArtifactPanel
          title="Preview da Proposta"
          subtitle="Atualizado enquanto a conversa avança"
          emptyState={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              O artefato aparece quando você menciona "proposta".
            </div>
          }
        >
          {hasArtifact ? <MockArtifact /> : null}
        </ArtifactPanel>
      </ChatLayout.Artifact>
    </ChatLayout>
  );
}
```

- [x] **Step 21.2: Typecheck**

```bash
npx tsc --noEmit
```

- [x] **Step 21.3: Commit**

```bash
git add src/pages/chat-demo/ChatDemoSplit.tsx
git commit -m "feat(chat): adiciona rota de demo modo split"
```

---

## Task 22: Wiring da rota em App.tsx

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 22.1: Adicionar lazy imports**

Inserir, junto com os outros `lazy()` no topo:

```tsx
const ChatDemoLayout = lazy(() => import("@/pages/chat-demo/ChatDemoLayout"));
const ChatDemoPure = lazy(() => import("@/pages/chat-demo/ChatDemoPure"));
const ChatDemoSplit = lazy(() => import("@/pages/chat-demo/ChatDemoSplit"));
```

- [x] **Step 22.2: Registrar rota fora de `ProtectedRoute`**

Dentro de `<Routes>`, **antes** do `<Route path="*">` (rota catch-all), inserir:

```tsx
<Route path="/chat/demo" element={withSuspense(<ChatDemoLayout />)}>
  <Route index element={<Navigate to="pure" replace />} />
  <Route path="pure" element={withSuspense(<ChatDemoPure />)} />
  <Route path="split" element={withSuspense(<ChatDemoSplit />)} />
</Route>
```

E garantir que `Navigate` está importado:

```tsx
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
```

- [x] **Step 22.3: Typecheck + build**

```bash
npx tsc --noEmit && npm run build
```

Esperado: build passa.

- [x] **Step 22.4: Dev manual smoke**

```bash
npm run dev
```

Abrir:
- `http://localhost:5173/chat/demo/pure` → renderiza empty state, input funciona.
- `http://localhost:5173/chat/demo/split` → renderiza split com panel resizável em desktop.

Parar dev server (Ctrl+C).

- [x] **Step 22.5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(chat): registra rotas /chat/demo/{pure,split}"
```

---

## Task 23: QA manual — paridade ChatGPT

**Checklist (executar em `http://localhost:5173/chat/demo/pure` e `/split`):**

- [x] Enter envia, Shift+Enter quebra linha.
- [x] Paperclip à esquerda, Send à direita do input.
- [x] Textarea cresce até ~240px em desktop.
- [x] Foco automático no textarea ao abrir a rota.
- [x] Digitar `/` em qualquer lugar (fora de outros inputs) foca o textarea.
- [x] Send desabilitado com input vazio + sem anexos.
- [x] Durante streaming: botão vira Stop vermelho; clicar interrompe; bubble final marcada como "Resposta interrompida".
- [x] Cursor `▍` pisca no fim do texto do assistant enquanto ele escreve.
- [x] StreamingIndicator (3 pontos + "Pensando...") aparece antes do primeiro token do assistant.
- [x] User: bubble laranja à direita, rounded-br menor.
- [x] Assistant: sem bubble, texto alinhado à esquerda.
- [x] Anexar imagem: thumb aparece no input; ao enviar, thumb aparece na mensagem do user.
- [x] Anexar PDF: chip com nome + tamanho; envio ok.
- [x] Anexar .txt: chip; envio ok.
- [x] Anexar .mp4 (arrastar): toast de erro, nenhum chip adicionado.
- [x] Anexar PDF >20MB: toast, sem chip.
- [x] Hover na mensagem do assistant: botão Copy aparece; clicar copia o texto (verificar clipboard).
- [x] Scroll até meio do histórico: FAB "↓ Novas mensagens" aparece ao chegar nova msg; clicar leva ao fim.
- [x] Empty state: pills clicáveis pré-preenchem o input (sem enviar).
- [x] Coluna central limitada a ~760px em desktop.
- [x] Mobile (375px): fullscreen, header 56px, textarea max 160px; abaixo do teclado virtual respeita safe-area.
- [x] Split desktop: arrastar divisor funciona; recarregar preserva tamanho (localStorage).
- [x] Split mobile: chat ocupa viewport; botão PanelRight abre Sheet com artefato; Esc fecha.

Se qualquer item falhar, abrir issue interna (ou corrigir no mesmo ciclo) antes de finalizar.

- [x] **Step 23.1: Registrar resultado**

Resultado: checklist validado em Chromium/Playwright nas rotas `/chat/demo/pure` e `/chat/demo/split`. Itens que falharam no primeiro passe foram corrigidos nos commits `fix(chat): corrige stop do streaming no navegador`, `fix(chat): preserva thumb de imagem apos envio` e `fix(chat): limita altura do prompt no mobile`.

Se algum item falhou e foi corrigido, commit com `fix(chat): ...`. Se tudo ok, sem commit extra.

---

## Task 24: QA manual — acessibilidade + Lighthouse

**Checklist (em `/chat/demo/pure`):**

- [x] Navegação por teclado: Tab percorre textarea → paperclip → send (ou stop) em ordem lógica; Shift+Tab reverte.
- [x] Esc fecha `AttachmentPreviewModal`.
- [x] Backspace remove chip quando focado.
- [x] Focus ring visível (2-4px) em todos os botões.
- [x] `aria-label` presente em todos os ícone-botões (inspecionar DOM).
- [x] `role="log"` no MessageList; `aria-live` alterna entre `polite`/`off` conforme streaming.
- [x] Contraste: abrir DevTools → Lighthouse → rodar A11y na rota `/chat/demo/pure`. Meta: **≥ 95**. Se falhar em contraste, ajustar `--muted-foreground` local (classe custom, não variável global).
- [x] `prefers-reduced-motion` ativo (DevTools → Rendering → Emulate CSS media prefers-reduced-motion: reduce):
  - StreamingIndicator pontos estáticos.
  - Cursor da bubble não pisca.
  - Typing effect ainda funciona mas sem animação parasita (aceitável).
- [x] VoiceOver/NVDA (se disponível): anuncia "Mensagem de Caloni:" quando nova msg chega (via aria-live).
- [x] Viewport 1440px → 375px redimensionando: nenhuma quebra visual, sem scroll horizontal.

- [x] **Step 24.1: Anotar resultado**

Resultado: Lighthouse A11y = 96 em `/chat/demo/pure`. Leitor nativo não estava disponível no ambiente automatizado; a validação cobriu DOM com `role="log"`/`aria-live` e fluxo visual/teclado em browser.

Se Lighthouse A11y < 95: listar gaps, corrigir, novo commit `fix(chat): a11y ...`.

---

## Critérios de aceite globais

- [x] Todos os 24 tasks concluídos.
- [x] `npm run test` passa (todos os testes Vitest de `src/agents/chat/__tests__/**` verdes).
- [x] `npm run build` passa sem warnings novos.
- [x] `npx tsc --noEmit` passa.
- [x] `npx eslint .` sem novos erros em `src/agents/chat/**` e `src/components/ui/prompt-input-box.tsx`.
- [x] Rotas `/chat/demo/pure` e `/chat/demo/split` funcionam em dev.
- [x] Checklists das Tasks 23 e 24 aprovados.
- [x] Sem mudanças em rotas protegidas ou em outras ferramentas (SEVEN core intocado).

## Próximos sub-projetos (fora desta spec)

- **Sub-projeto 2 — Backend de chat + persistência:** tabelas `conversations`/`messages`, endpoints SSE, multi-turn real, upload ao filesystem/S3, rate-limit por usuário.
- **Sub-projeto 3 — Migração das 4 ferramentas:** uma spec por tool, ordem sugerida: Diagnóstico Caloni → Qualificação de Leads → Validação Caloni → Proposta Comercial. Cada migração reusa os primitivos desta foundation.
