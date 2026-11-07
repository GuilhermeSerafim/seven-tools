# Validacao Caloni Chat Protagonist Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `/tools/validacao-caloni` into a wider, calmer chat-first workspace where the SEVEN hub recedes, the composer feels anchored, and the Caloni result reads like a guided report instead of a compressed dashboard.

**Architecture:** Keep the existing chat foundation and refine it in place through route-aware chrome, wider chat layout hooks, lighter conversation primitives, and a redesigned `CaloniResultCard`. Scope stays inside the current frontend surface: no new backend contracts, no new data model, and no redesign of the whole hub.

**Tech Stack:** React 18, TypeScript, React Router, TailwindCSS, shadcn/ui, Vitest, React Testing Library.

---

## File Map

- `src/components/layout/Header.tsx`
  - Add a route-aware `chat-focus` variant so the global hub header becomes quieter on `/tools/validacao-caloni`.
- `src/components/layout/Header.test.tsx`
  - Lock the route-specific header variant with a focused regression test.
- `src/agents/chat/ChatLayout.tsx`
  - Expose a way for pure chat pages to widen their inner shell without changing every other chat surface.
- `src/pages/ChatToolPage.tsx`
  - Apply the widened shell, calmer composer framing, and route-specific chat layout wiring.
- `src/pages/__tests__/ChatToolPage.test.tsx`
  - Verify the widened shell and route-level composer sizing survive the refresh.
- `src/agents/chat/AgentHeader.tsx`
  - Turn the agent header into lightweight context instead of a second navbar.
- `src/agents/chat/__tests__/AgentHeader.test.tsx`
  - Protect the new status presentation and inner width hook.
- `src/agents/chat/MessageList.tsx`
  - Widen the conversation column, tune vertical rhythm, and give the "Novas mensagens" FAB a less intrusive position.
- `src/agents/chat/__tests__/MessageList.test.tsx`
  - Protect custom content width and existing scroll behavior.
- `src/agents/chat/MessageBubble.tsx`
  - Reduce the heavy feel of user bubbles and give assistant/report content more readable width and line rhythm.
- `src/agents/chat/__tests__/MessageBubble.test.tsx`
  - Lock the calmer width caps for user and assistant bubbles.
- `src/agents/chat/ChatEmptyState.tsx`
  - Make the first-screen state feel more integrated with the chat surface.
- `src/agents/caloni/CaloniResultCard.tsx`
  - Reframe the analysis into a guided report with clearer section hierarchy and more breathing room.
- `src/agents/caloni/__tests__/CaloniResultCard.test.tsx`
  - Protect the new section structure and conditional rendering.

## Baseline Assumption

This plan assumes the current worktree already contains the approved structural fix for:

- composer breathing room in `src/pages/ChatToolPage.tsx`
- inline-growth autoscroll in `src/agents/chat/MessageList.tsx`

Do not revert those edits while executing this plan. Task 4 re-verifies them together with the new visual changes.

### Task 1: Quiet the hub chrome and widen the route shell

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/layout/Header.test.tsx`
- Modify: `src/agents/chat/ChatLayout.tsx`
- Modify: `src/pages/ChatToolPage.tsx`
- Modify: `src/pages/__tests__/ChatToolPage.test.tsx`

- [ ] **Step 1: Add the failing header and shell tests**

Append this test to `src/components/layout/Header.test.tsx`:

```tsx
  it("uses the chat-focus chrome on Validacao Caloni", () => {
    mockAuth(false);

    render(
      <MemoryRouter initialEntries={["/tools/validacao-caloni"]}>
        <Header />
      </MemoryRouter>,
    );

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("data-variant", "chat-focus");
    expect(banner.className).toContain("bg-background/95");
  });
```

Append this test to `src/pages/__tests__/ChatToolPage.test.tsx`:

```tsx
  it("expande a superficie do chat para a largura ampla aprovada", async () => {
    const { container } = renderAt("/tools/validacao-caloni");

    expect(await screen.findAllByText("Caloni")).not.toHaveLength(0);

    const layoutInner = container.querySelector("[data-layout='pure-inner']");
    expect(layoutInner?.className).toContain("max-w-[1120px]");

    const composerShell = screen.getByTestId("chat-tool-composer-shell");
    expect(composerShell.firstElementChild).toHaveClass("max-w-[960px]");
    expect(composerShell.className).toContain("bg-background/90");
  });
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `npx vitest run src/components/layout/Header.test.tsx src/pages/__tests__/ChatToolPage.test.tsx`

Expected:
- `Header.test.tsx` fails because the header does not expose `data-variant="chat-focus"`
- `ChatToolPage.test.tsx` fails because `pure-inner` is still capped at `760px` and the composer shell is not using the widened values

- [ ] **Step 3: Add a route-aware variant to `Header.tsx`**

Update the imports at the top of `src/components/layout/Header.tsx`:

```tsx
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
```

Then add the route detection inside `Header()` and replace the root `<header>` plus its first inner `<div>` with:

```tsx
  const isChatFocusRoute = location.pathname.startsWith('/tools/validacao-caloni');

  return (
    <header
      data-variant={isChatFocusRoute ? 'chat-focus' : 'default'}
      className={cn(
        'sticky top-0 z-50 w-full border-b backdrop-blur',
        isChatFocusRoute
          ? 'border-border/20 bg-background/95 supports-[backdrop-filter]:bg-background/85'
          : 'border-border/30 glass-strong',
      )}
    >
      <div
        className={cn(
          'container flex items-center justify-between gap-4',
          isChatFocusRoute ? 'h-[4.5rem]' : 'h-20',
        )}
      >
```

Also soften non-active desktop nav links during the chat-focus route by replacing the desktop `className` interpolation with:

```tsx
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary'
                  : isChatFocusRoute
                    ? 'text-muted-foreground/80 hover:bg-muted/40 hover:text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-primary/5',
              )}
```

- [ ] **Step 4: Let `ChatLayout` accept a custom inner width**

Update the `ChatLayoutProps` interface in `src/agents/chat/ChatLayout.tsx`:

```tsx
export interface ChatLayoutProps {
  mode: Mode;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}
```

Then update the pure-mode branch to accept the new prop:

```tsx
export function ChatLayout({ mode, children, className, innerClassName }: ChatLayoutProps) {
  if (mode === 'pure') {
    return (
      <LayoutContext.Provider value="pure">
        <div className={cn('h-[100dvh] min-h-0 bg-background text-foreground', className)}>
          <div
            data-layout="pure-inner"
            className={cn(
              'mx-auto grid h-full min-h-0 w-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)_auto]',
              innerClassName,
            )}
          >
            {children}
          </div>
        </div>
      </LayoutContext.Provider>
    );
  }
```

- [ ] **Step 5: Apply the wider shell in `ChatToolPage.tsx`**

Replace the `ChatLayout` opening tag and the composer wrapper in `src/pages/ChatToolPage.tsx` with:

```tsx
    <ChatLayout
      mode="pure"
      className="h-[calc(100dvh-9rem)] bg-background md:h-[calc(100dvh-4.5rem)]"
      innerClassName="max-w-[1120px]"
    >
```

```tsx
      <div
        data-testid="chat-tool-composer-shell"
        className="border-t border-border/20 bg-background/90 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[960px]">
          <PromptInputBox
            ref={inputRef}
            onSend={(text, attachments) => send(text, attachments)}
            onStop={stop}
            isLoading={isStreaming}
          />
        </div>
      </div>
```

- [ ] **Step 6: Re-run the focused tests**

Run: `npx vitest run src/components/layout/Header.test.tsx src/pages/__tests__/ChatToolPage.test.tsx`

Expected: PASS in both files.

- [ ] **Step 7: Commit the shell and header hierarchy changes**

```bash
git add src/components/layout/Header.tsx src/components/layout/Header.test.tsx src/agents/chat/ChatLayout.tsx src/pages/ChatToolPage.tsx src/pages/__tests__/ChatToolPage.test.tsx
git commit -m "feat(chat-ui): widen validacao caloni shell and quiet hub chrome"
```

---

### Task 2: Refine the conversation surface and message ergonomics

**Files:**
- Modify: `src/agents/chat/AgentHeader.tsx`
- Create: `src/agents/chat/__tests__/AgentHeader.test.tsx`
- Modify: `src/agents/chat/MessageList.tsx`
- Modify: `src/agents/chat/__tests__/MessageList.test.tsx`
- Modify: `src/agents/chat/MessageBubble.tsx`
- Create: `src/agents/chat/__tests__/MessageBubble.test.tsx`
- Modify: `src/agents/chat/ChatEmptyState.tsx`
- Modify: `src/pages/ChatToolPage.tsx`

- [ ] **Step 1: Add the failing tests for the lighter conversation surface**

Create `src/agents/chat/__tests__/AgentHeader.test.tsx` with:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AgentHeader } from '../AgentHeader';

describe('AgentHeader', () => {
  it('renderiza um status discreto e aceita shell interno customizado', () => {
    render(
      <AgentHeader
        name="Caloni"
        subtitle="Decisor Comercial Assistido"
        status="thinking"
        contentClassName="max-w-[960px]"
      />,
    );

    expect(screen.getByText('Analisando')).toBeInTheDocument();
    expect(screen.getByTestId('agent-header-shell').className).toContain('max-w-[960px]');
  });
});
```

Append this test to `src/agents/chat/__tests__/MessageList.test.tsx`:

```tsx
  it('aceita contentClassName para widenizar a coluna da conversa', () => {
    const messages = [msg({ id: '1', role: 'assistant', content: 'oi' })];
    const { container } = render(
      <MessageList messages={messages} contentClassName="max-w-[960px]">
        <MessageBubble role="assistant">oi</MessageBubble>
      </MessageList>,
    );

    expect(container.querySelector("[data-scroll-root] > .max-w-\\[960px\\]")).not.toBeNull();
  });
```

Create `src/agents/chat/__tests__/MessageBubble.test.tsx` with:

```tsx
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';

describe('MessageBubble', () => {
  it('limita a largura da mensagem do usuario para nao virar um bloco dominante', () => {
    render(<MessageBubble role="user">Mensagem do usuario</MessageBubble>);

    expect(screen.getByText('Mensagem do usuario').closest('[data-role="user"]')?.className).toContain(
      'max-w-[min(100%,38rem)]',
    );
  });

  it('da largura confortavel para leitura de respostas do assistant', () => {
    render(<MessageBubble role="assistant">Resposta do assistant</MessageBubble>);

    expect(
      screen.getByText('Resposta do assistant').closest('[data-role="assistant"]')?.className,
    ).toContain('max-w-[58rem]');
  });
});
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run: `npx vitest run src/agents/chat/__tests__/AgentHeader.test.tsx src/agents/chat/__tests__/MessageList.test.tsx src/agents/chat/__tests__/MessageBubble.test.tsx`

Expected:
- `AgentHeader.test.tsx` fails because `contentClassName` and the status label do not exist yet
- `MessageList.test.tsx` fails because `contentClassName` is not a supported prop
- `MessageBubble.test.tsx` fails because the calmer width classes are not present yet

- [ ] **Step 3: Make `AgentHeader` feel like lightweight context**

Update `src/agents/chat/AgentHeader.tsx` to:

```tsx
export interface AgentHeaderProps {
  name: string;
  subtitle?: string;
  avatarSrc?: string;
  status?: 'online' | 'thinking';
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
  contentClassName?: string;
}
```

Replace the component body with:

```tsx
  const statusLabel = status === 'thinking' ? 'Analisando' : status === 'online' ? 'Online' : null;

  return (
    <header className={cn('border-b border-border/20 bg-transparent px-4 py-4 md:px-6', className)}>
      <div
        data-testid="agent-header-shell"
        className={cn('mx-auto flex w-full max-w-[880px] items-center gap-3', contentClassName)}
      >
        {onBack ? (
          <button
            type="button"
            aria-label="Voltar"
            onClick={onBack}
            className="rounded-full p-1 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}

        <Avatar className={cn('h-10 w-10', status === 'thinking' && 'glow-primary-sm')}>
          {avatarSrc ? <AvatarImage src={avatarSrc} alt={name} /> : null}
          <AvatarFallback className="gradient-primary text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <span className="block font-display text-base font-semibold text-foreground">{name}</span>
          {subtitle ? <span className="block text-sm text-muted-foreground">{subtitle}</span> : null}
        </div>

        {statusLabel ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                status === 'thinking' ? 'bg-primary motion-safe:animate-pulse' : 'bg-emerald-400',
              )}
            />
            {statusLabel}
          </span>
        ) : null}

        {rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
      </div>
    </header>
  );
```

- [ ] **Step 4: Give `MessageList` a configurable reading width and quieter FAB**

Update the props in `src/agents/chat/MessageList.tsx`:

```tsx
export interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  emptyState?: ReactNode;
  className?: string;
  contentClassName?: string;
  fabClassName?: string;
}
```

Update the component signature:

```tsx
export function MessageList({
  messages,
  isStreaming = false,
  emptyState,
  className,
  contentClassName,
  fabClassName,
  children,
}: PropsWithChildren<MessageListProps>) {
```

Then replace the scroll wrapper, content wrapper, and FAB class blocks with:

```tsx
      <div
        ref={scrollRef}
        data-scroll-root
        role="log"
        aria-live={isStreaming ? 'off' : 'polite'}
        aria-atomic="false"
        className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
        onScroll={handleScroll}
      >
        <div className={cn('mx-auto flex w-full max-w-[760px] flex-col', contentClassName)}>
```

```tsx
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn('absolute bottom-6 right-4 shadow-sm md:right-8', fabClassName)}
          onClick={scrollToBottom}
        >
          Novas mensagens
        </Button>
```

- [ ] **Step 5: Calm the bubble widths and make the empty state feel integrated**

In `src/agents/chat/MessageBubble.tsx`, replace the `contentClass` block with:

```tsx
  const contentClass = cn(
    'relative',
    role === 'user' &&
      'ml-auto max-w-[min(100%,38rem)] rounded-[28px] rounded-br-md bg-primary px-5 py-4 text-primary-foreground shadow-sm sm:max-w-[min(78%,38rem)]',
    role === 'assistant' && 'max-w-[58rem] text-[15px] leading-7 text-foreground',
    role === 'system' && 'max-w-full text-center text-sm text-muted-foreground',
    variant === 'error' && role !== 'system' && 'rounded-2xl border border-destructive/40 px-4 py-3',
  );
```

In `src/agents/chat/ChatEmptyState.tsx`, replace the root wrapper with:

```tsx
    <div
      className={cn(
        'mx-auto flex w-full max-w-[760px] flex-col items-center gap-5 px-4 py-12 text-center sm:px-6 md:py-16',
        className,
      )}
    >
```

Then in `src/pages/ChatToolPage.tsx`, replace the `AgentHeader` usage, the `emptyState` memo, and `MessageList` opening tag with:

```tsx
      <AgentHeader
        name={config.name}
        subtitle={config.subtitle}
        avatarSrc={config.avatarSrc}
        status={isStreaming ? 'thinking' : 'online'}
        contentClassName="max-w-[960px]"
      />
```

```tsx
  const emptyState = useMemo(
    () => (
      <ChatEmptyState
        agentName={config.name}
        avatarSrc={config.avatarSrc}
        agentMission={config.mission}
        suggestions={config.suggestions}
        onPick={handlePick}
        className="max-w-[960px] px-4 pt-14 pb-10"
      />
    ),
    [config, handlePick],
  );
```

```tsx
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        emptyState={emptyState}
        contentClassName="max-w-[960px]"
        fabClassName="bottom-6 right-4 md:right-8"
      >
```

- [ ] **Step 6: Re-run the focused conversation tests**

Run: `npx vitest run src/agents/chat/__tests__/AgentHeader.test.tsx src/agents/chat/__tests__/MessageList.test.tsx src/agents/chat/__tests__/MessageBubble.test.tsx src/pages/__tests__/ChatToolPage.test.tsx`

Expected: PASS in all four test files.

- [ ] **Step 7: Commit the conversation-surface refinements**

```bash
git add src/agents/chat/AgentHeader.tsx src/agents/chat/__tests__/AgentHeader.test.tsx src/agents/chat/MessageList.tsx src/agents/chat/__tests__/MessageList.test.tsx src/agents/chat/MessageBubble.tsx src/agents/chat/__tests__/MessageBubble.test.tsx src/agents/chat/ChatEmptyState.tsx src/pages/ChatToolPage.tsx
git commit -m "feat(chat-ui): refine chat surface hierarchy and message ergonomics"
```

---

### Task 3: Turn the Caloni output into a guided report

**Files:**
- Modify: `src/agents/caloni/CaloniResultCard.tsx`
- Modify: `src/agents/caloni/__tests__/CaloniResultCard.test.tsx`

- [ ] **Step 1: Add the failing report-structure tests**

Replace `src/agents/caloni/__tests__/CaloniResultCard.test.tsx` with:

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
  it('renderiza o resultado como relatorio guiado', () => {
    render(<CaloniResultCard result={RESULT} />);

    expect(screen.getByText('Leitura geral')).toBeInTheDocument();
    expect(screen.getByText('Criterios observados')).toBeInTheDocument();
    expect(screen.getByText('Pontos fortes')).toBeInTheDocument();
    expect(screen.getByText('Pontos de atencao')).toBeInTheDocument();
    expect(screen.getByText('Proximos ajustes recomendados')).toBeInTheDocument();
    expect(screen.getByText('Boa abertura')).toBeInTheDocument();
    expect(screen.getByText('Adicionar cases')).toBeInTheDocument();
  });

  it('nao renderiza criterios quando array vazio', () => {
    render(<CaloniResultCard result={{ ...RESULT, criteria: [] }} />);
    expect(screen.queryByText('Criterios observados')).not.toBeInTheDocument();
  });

  it('nao renderiza secoes de pontos quando ambos os arrays estao vazios', () => {
    render(<CaloniResultCard result={{ ...RESULT, strongPoints: [], weakPoints: [] }} />);
    expect(screen.queryByText('Pontos fortes')).not.toBeInTheDocument();
    expect(screen.queryByText('Pontos de atencao')).not.toBeInTheDocument();
  });

  it('nao renderiza sugestoes quando array vazio', () => {
    render(<CaloniResultCard result={{ ...RESULT, suggestions: [] }} />);
    expect(screen.queryByText('Proximos ajustes recomendados')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the report test and confirm it fails**

Run: `npx vitest run src/agents/caloni/__tests__/CaloniResultCard.test.tsx`

Expected: FAIL because the component still uses the old section headings and denser card structure.

- [ ] **Step 3: Replace the compressed dashboard layout with a guided report**

Update `src/agents/caloni/CaloniResultCard.tsx` as follows.

First, replace the icon import with:

```tsx
import { AlertCircle, CheckCircle2, Lightbulb, Sparkles, Star, TrendingDown, TrendingUp } from 'lucide-react';
```

Then replace the component body with:

```tsx
export function CaloniResultCard({ result, className }: CaloniResultCardProps) {
  return (
    <section
      data-testid="caloni-guided-report"
      className={cn(
        'mt-4 overflow-hidden rounded-[28px] border border-border/30 bg-card/70 p-5 shadow-sm backdrop-blur sm:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 border-b border-border/20 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Leitura geral
            </span>
            <h3 className="text-2xl font-semibold leading-tight text-foreground">{result.overallLabel}</h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Esta e a visao consolidada da proposta a partir dos criterios do Metodo Caloni.
            </p>
          </div>

          <div className={cn('rounded-3xl border px-5 py-4 text-left sm:min-w-[15rem]', getScoreBg(result.overallScore))}>
            <div className="flex items-end gap-2">
              <span className={cn('font-display text-5xl font-extrabold leading-none', getScoreColor(result.overallScore))}>
                {result.overallScore.toFixed(1)}
              </span>
              <span className="pb-1 text-sm text-muted-foreground">/10</span>
            </div>
            <p className={cn('mt-2 text-base font-semibold', getScoreColor(result.overallScore))}>
              {result.overallLabel}
            </p>
          </div>
        </div>

        {result.criteria.length > 0 ? (
          <section className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 text-primary" /> Criterios observados
            </p>
            <div className="space-y-3">
              {result.criteria.map((criterion) => (
                <article
                  key={criterion.name}
                  className="rounded-2xl border border-border/20 bg-background/40 px-4 py-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">{criterion.name}</span>
                    <span className={cn('text-sm font-bold tabular-nums', getScoreColor(criterion.score))}>
                      {criterion.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${criterion.score * 10}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn('h-full rounded-full', getScoreBarColor(criterion.score))}
                    />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{criterion.comment}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {result.strongPoints.length > 0 || result.weakPoints.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {result.strongPoints.length > 0 ? (
              <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                  <TrendingUp className="h-4 w-4" /> Pontos fortes
                </p>
                <ul className="space-y-2">
                  {result.strongPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm leading-6 text-foreground/85">
                      <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {result.weakPoints.length > 0 ? (
              <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                  <TrendingDown className="h-4 w-4" /> Pontos de atencao
                </p>
                <ul className="space-y-2">
                  {result.weakPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm leading-6 text-foreground/85">
                      <AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-red-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}

        {result.suggestions.length > 0 ? (
          <section className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lightbulb className="h-4 w-4 text-primary" /> Proximos ajustes recomendados
            </p>
            <ol className="space-y-3">
              {result.suggestions.map((suggestion, index) => (
                <li key={suggestion} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  {suggestion}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Re-run the report test**

Run: `npx vitest run src/agents/caloni/__tests__/CaloniResultCard.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the guided-report redesign**

```bash
git add src/agents/caloni/CaloniResultCard.tsx src/agents/caloni/__tests__/CaloniResultCard.test.tsx
git commit -m "feat(caloni-ui): present analysis as a guided report"
```

---

### Task 4: Run the full regression suite and perform manual QA

**Files:** none

- [ ] **Step 1: Run the focused UI regression suite**

Run:

```bash
npx vitest run src/components/layout/Header.test.tsx src/agents/chat/__tests__/AgentHeader.test.tsx src/agents/chat/__tests__/MessageBubble.test.tsx src/agents/chat/__tests__/MessageList.test.tsx src/agents/caloni/__tests__/CaloniResultCard.test.tsx src/pages/__tests__/ChatToolPage.test.tsx
```

Expected: PASS in all six files.

- [ ] **Step 2: Run the type check**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Start the local frontend and open the refreshed route**

Run: `npm run dev`

Expected: Vite prints a local URL. Open the URL it prints and navigate to `/tools/validacao-caloni`.

- [ ] **Step 5: Validate the desktop golden path**

Checklist:

- log in with a local account that can list saved proposals
- open `/tools/validacao-caloni`
- verify the header feels quieter than the default hub pages
- verify the agent header, message column, and composer all align to the same wider reading width
- click `Validar proposta ja salva`, pick a proposal, and verify the result flows into the widened report surface
- scroll up during a longer result and confirm `Novas mensagens` appears only after leaving the bottom
- click the FAB and confirm the list returns to the end cleanly

- [ ] **Step 6: Validate PDF upload and deep-link behavior**

Checklist:

- reload `/tools/validacao-caloni`
- click `Enviar PDF externo pra analisar`
- choose a PDF and confirm auto-send still works
- open `/tools/validacao-caloni?proposal=<id>` and confirm the page still auto-runs the analysis
- open the two legacy URLs and confirm both still redirect to `/tools/validacao-caloni?proposal=...`

- [ ] **Step 7: Validate the narrow viewport**

Checklist:

- switch DevTools to a narrow viewport
- confirm there is no page-level double scroll
- confirm the composer still has bottom breathing room
- confirm no section of the report overflows horizontally

---

## Self-review

**1. Spec coverage**

- Chat-first surface with wider desktop shell: Task 1
- Hub header becomes quieter on this route only: Task 1
- Agent header becomes lightweight context: Task 2
- Composer stays anchored and aligned with the wider surface: Task 1 + Task 4
- Conversation reads calmer, user bubble less dominant, FAB less intrusive: Task 2
- Caloni result becomes a guided report: Task 3
- Scroll behavior and inline growth remain stable: Task 2 tests + Task 4 manual regression
- Desktop-first with narrow-viewport verification: Task 4

No uncovered requirement from the approved spec remains.

**2. Placeholder scan**

- No `TODO`, `TBD`, or "implement later" markers remain.
- Every code-changing step includes concrete code to paste.
- Every verification step includes an exact command or an explicit checklist.

**3. Type consistency**

- `ChatLayout` adds `innerClassName` and that same prop is consumed in `ChatToolPage`.
- `AgentHeader` adds `contentClassName` and the new test plus `ChatToolPage` use the exact same prop name.
- `MessageList` adds `contentClassName` and `fabClassName`; the test and route usage match those names exactly.
- `MessageBubble` width assertions match the exact class strings introduced in the implementation step.
