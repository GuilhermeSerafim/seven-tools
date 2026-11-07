import { Children, useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileAttachmentChip } from './FileAttachmentChip';
import type { Attachment, MessageRole, MessageVariant } from './types';

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const boldStart = text.indexOf('**', cursor);

    if (boldStart === -1) {
      nodes.push(text.slice(cursor));
      break;
    }

    const boldEnd = text.indexOf('**', boldStart + 2);

    if (boldEnd === -1) {
      nodes.push(text.slice(cursor));
      break;
    }

    if (boldStart > cursor) {
      nodes.push(text.slice(cursor, boldStart));
    }

    const boldText = text.slice(boldStart + 2, boldEnd);
    nodes.push(<strong key={`bold-${boldStart}`}>{boldText}</strong>);
    cursor = boldEnd + 2;
  }

  return nodes;
}

function renderMarkdownText(text: string): React.ReactNode {
  const blocks: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (!listItems.length) {
      return;
    }

    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {listItems}
      </ul>,
    );
    listItems = [];
  };

  for (const line of text.split('\n')) {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushList();
      continue;
    }

    if (trimmedLine.startsWith('- ')) {
      listItems.push(
        <li key={`item-${blocks.length}-${listItems.length}`}>
          {renderInlineMarkdown(trimmedLine.slice(2))}
        </li>,
      );
      continue;
    }

    flushList();
    blocks.push(
      <p key={`paragraph-${blocks.length}`}>{renderInlineMarkdown(trimmedLine)}</p>,
    );
  }

  flushList();

  return <>{blocks}</>;
}

function renderMessageContent(role: MessageRole, children: React.ReactNode): React.ReactNode {
  if (role !== 'assistant') {
    return children;
  }

  return Children.map(children, (child) =>
    typeof child === 'string' ? renderMarkdownText(child) : child,
  );
}

function getMessageAlignmentClass(role: MessageRole): string {
  if (role === 'user') {
    return 'justify-end';
  }

  return role === 'system' ? 'justify-center' : 'justify-start';
}

function getMessageContentClass(role: MessageRole, variant: MessageVariant): string {
  return cn(
    'relative',
    role === 'user' &&
      'ml-auto max-w-[min(100%,38rem)] rounded-[28px] rounded-br-md bg-primary px-5 py-4 text-primary-foreground shadow-sm sm:max-w-[min(78%,38rem)]',
    role === 'assistant' && 'max-w-[58rem] text-[15px] leading-7 text-foreground',
    role === 'system' && 'max-w-full text-center text-sm text-muted-foreground',
    variant === 'error' && role !== 'system' && 'rounded-2xl border border-destructive/40 px-4 py-3',
  );
}

function getFormattedTimestamp(timestamp: number | undefined): string | null {
  if (typeof timestamp !== 'number') {
    return null;
  }

  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: ptBR,
  });
}

export interface MessageBubbleProps {
  role: MessageRole;
  variant?: MessageVariant;
  children: React.ReactNode;
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
  isStreaming = false,
  className,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [mobileMetaVisible, setMobileMetaVisible] = useState(false);
  const [mobileCopyVisible, setMobileCopyVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const isCoarsePointer = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const revealMobileMeta = () => {
    setMobileMetaVisible(true);
  };

  const revealMobileCopy = () => {
    setMobileMetaVisible(true);
    setMobileCopyVisible(true);
  };

  const handleTouchStart = () => {
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      revealMobileCopy();
      longPressTimerRef.current = null;
    }, 400);
  };

  const handleTouchEnd = () => {
    clearLongPressTimer();
  };

  const handleWrapperPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isCoarsePointer()) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, textarea, [role="button"]')) {
      return;
    }

    revealMobileMeta();
  };

  const handleCopy = async () => {
    const text = contentRef.current?.textContent?.trim();
    if (!text || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, 1500);
  };

  const messageClass = cn(
    'group relative flex w-full',
    getMessageAlignmentClass(role),
  );
  const contentClass = getMessageContentClass(role, variant);
  const formattedTimestamp = getFormattedTimestamp(timestamp);

  const showAssistantControls = role === 'assistant' && !isStreaming;
  const revealMetaClass = cn(
    'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
    mobileMetaVisible && 'opacity-100',
  );

  return (
    <div
      className={cn(messageClass, className)}
      onPointerUp={handleWrapperPointerUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div data-role={role} className={contentClass}>
        {variant === 'error' && (
          <AlertCircle
            className="absolute -left-2 -top-2 h-4 w-4 rounded-full bg-background text-destructive"
            data-testid="icon-error"
            aria-hidden
          />
        )}

        {showAssistantControls && (
          <button
            type="button"
            aria-label="Copiar mensagem"
            onClick={(event) => {
              event.stopPropagation();
              handleCopy().catch(() => undefined);
            }}
            className={cn(
              'absolute -right-2 -top-2 rounded-full border bg-background p-1 text-muted-foreground transition-opacity',
              'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
              'focus-visible:opacity-100 focus-visible:pointer-events-auto',
              mobileCopyVisible && 'opacity-100 pointer-events-auto',
            )}
          >
            {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          </button>
        )}

        <div ref={contentRef} className={role === 'assistant' ? 'space-y-2' : 'whitespace-pre-wrap'}>
          {renderMessageContent(role, children)}
          {isStreaming && (
            <span
              data-testid="streaming-cursor"
              className="ml-0.5 inline-block motion-safe:animate-pulse motion-reduce:animate-none"
              aria-hidden
            >
              ▍
            </span>
          )}
        </div>

        {attachments?.length ? (
          <div className={cn('mt-3 flex flex-wrap gap-2', role === 'user' && 'justify-end')}>
            {attachments.map((attachment) => (
              <FileAttachmentChip key={attachment.id} attachment={attachment} size="sm" />
            ))}
          </div>
        ) : null}

        {variant === 'interrupted' && (
          <div className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resposta interrompida
          </div>
        )}

        {formattedTimestamp ? (
          <time
            dateTime={new Date(timestamp!).toISOString()}
            className={cn(
              'mt-2 block text-xs text-muted-foreground transition-opacity',
              revealMetaClass,
            )}
          >
            {formattedTimestamp}
          </time>
        ) : null}
      </div>
    </div>
  );
}
