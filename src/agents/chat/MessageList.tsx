import { Children, Fragment, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren, ReactNode, UIEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { StreamingIndicator } from './StreamingIndicator';
import type { ChatMessage } from './types';

const BOTTOM_THRESHOLD = 80;
const MAX_PROP_DEPTH = 2;

export interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  emptyState?: ReactNode;
  className?: string;
  contentClassName?: string;
  fabClassName?: string;
}

const hasVisibleContent = (content: ReactNode): boolean => {
  if (content == null || typeof content === 'boolean') {
    return false;
  }

  if (typeof content === 'string') {
    return content.trim().length > 0;
  }

  if (typeof content === 'number') {
    return true;
  }

  if (Array.isArray(content)) {
    return content.some((item) => hasVisibleContent(item));
  }

  if (isValidElement(content)) {
    if (content.type === Fragment) {
      return hasVisibleContent(content.props.children);
    }

    return true;
  }

  return true;
};

const getPropSignature = (value: unknown, depth = 0, seen = new WeakSet<object>()): string => {
  if (value == null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return `text:${value}`;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${typeof value}:${String(value)}`;
  }

  if (typeof value === 'function') {
    return `function:${value.name || 'anonymous'}`;
  }

  if (typeof value === 'symbol') {
    return `symbol:${String(value.description ?? '')}`;
  }

  if (isValidElement(value)) {
    return getNodeSignature(value);
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_PROP_DEPTH) {
      return `array:${value.length}`;
    }

    return `array:[${value.map((item) => getPropSignature(item, depth + 1, seen)).join('|')}]`;
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return 'object:[cycle]';
    }

    seen.add(value);

    if (depth >= MAX_PROP_DEPTH) {
      return `object:${Object.keys(value).sort((left, right) => left.localeCompare(right)).join(',')}`;
    }

    const props = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, propValue]) => `${key}:${getPropSignature(propValue, depth + 1, seen)}`)
      .join('|');

    return `object:{${props}}`;
  }

  return `unknown:${typeof value}`;
};

const getElementPropsSignature = (props: Record<string, unknown>) =>
  Object.entries(props)
    .filter(([key]) => key !== 'children')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${getPropSignature(value)}`)
    .join('|');

const getNodeSignature = (content: ReactNode): string => {
  if (content == null) {
    return 'null';
  }

  if (typeof content === 'boolean') {
    return `boolean:${content}`;
  }

  if (typeof content === 'string') {
    return `text:${content}`;
  }

  if (typeof content === 'number') {
    return `number:${content}`;
  }

  if (Array.isArray(content)) {
    return `array:[${content.map((item) => getNodeSignature(item)).join('|')}]`;
  }

  if (isValidElement(content)) {
    const elementType =
      content.type === Fragment
        ? 'fragment'
        : typeof content.type === 'string'
          ? content.type
          : content.type.displayName ?? content.type.name ?? 'component';

    const propsSignature = getElementPropsSignature(content.props);

    return `element:${elementType}:props:{${propsSignature}}:children:${getNodeSignature(content.props.children)}`;
  }

  return `other:${String(content)}`;
};

export function MessageList({
  messages,
  isStreaming = false,
  emptyState,
  className,
  contentClassName,
  fabClassName,
  children,
}: PropsWithChildren<MessageListProps>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const content = useMemo(() => Children.toArray(children), [children]);
  const lastRenderedChildSignature = useMemo(() => {
    const lastChild = content.at(-1);
    return lastChild ? getNodeSignature(lastChild) : 'empty';
  }, [content]);

  const lastMessage = messages.at(-1);
  const lastMessageSignal = useMemo(() => {
    if (!lastMessage) {
      return 'empty';
    }

    return `${lastMessage.id}:${getNodeSignature(lastMessage.content)}:${lastMessage.role}:${String(lastMessage.variant)}`;
  }, [lastMessage]);

  const shouldShowStreamingIndicator =
    isStreaming &&
    (!lastMessage ||
      lastMessage.role !== 'assistant' ||
      !hasVisibleContent(lastMessage.content));

  const syncAtBottomState = () => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    setAtBottom(distanceFromBottom < BOTTOM_THRESHOLD);
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    if (atBottom) {
      element.scrollTop = element.scrollHeight;
    }
  }, [atBottom, messages.length, lastMessageSignal, shouldShowStreamingIndicator, lastRenderedChildSignature]);

  const handleScroll = (_event: UIEvent<HTMLDivElement>) => {
    syncAtBottomState();
  };

  const scrollToBottom = () => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
    setAtBottom(true);
  };

  if (messages.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      <ScrollArea
        data-testid="message-list-scroll-area"
        className="h-full min-h-0"
        viewportRef={scrollRef}
        viewportProps={{
          'data-scroll-root': true,
          role: 'log',
          'aria-live': isStreaming ? 'off' : 'polite',
          'aria-atomic': 'false',
          onScroll: handleScroll,
        }}
        scrollbarProps={{ 'data-testid': 'message-list-scrollbar' }}
      >
        <div
          className="flex min-h-full flex-col px-4 py-6 sm:px-6 lg:px-8"
        >
          <div
            data-testid="message-list-content"
            className={cn('mx-auto flex w-full max-w-[760px] flex-col', contentClassName)}
          >
            {content.map((child, index) => {
              const current = messages[index];
              const previous = messages[index - 1];
              const spacingClass =
                index === 0 ? '' : previous?.role === current?.role ? 'mt-6' : 'mt-8';

              return (
                <div key={current?.id ?? index} className={spacingClass}>
                  {child}
                </div>
              );
            })}

            {shouldShowStreamingIndicator ? (
              <div className={cn(content.length > 0 && 'mt-8')}>
                <StreamingIndicator />
              </div>
            ) : null}
          </div>
        </div>
      </ScrollArea>

      {!atBottom ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 px-4 sm:px-6 lg:px-8">
          <div className={cn('mx-auto flex w-full max-w-[760px] justify-end', contentClassName)}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={cn('pointer-events-auto shadow-sm', fabClassName)}
              onClick={scrollToBottom}
            >
              Novas mensagens
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
