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
const GENERIC_ERROR_MESSAGE = 'Não consegui analisar agora. Tenta de novo?';

let messageIdSequence = 0;

function uid() {
  messageIdSequence += 1;
  return `m_${Date.now()}_${messageIdSequence}`;
}

function revokeMessagePreviews(messages: ChatMessage[]) {
  messages.forEach((message) => {
    message.attachments?.forEach((attachment) => {
      if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    });
  });
}

function updateAssistantContent(
  messages: ChatMessage[],
  assistantId: string,
  content: string,
): ChatMessage[] {
  return messages.map((message) =>
    message.id === assistantId ? { ...message, content } : message,
  );
}

function scheduleFrame(callback: FrameRequestCallback) {
  return {
    id: window.setTimeout(() => callback(performance.now()), TICK_MS),
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
  controllerRef: MutableRefObject<AbortController | null>;
  rafRef: MutableRefObject<number | null>;
  rafCancelRef: MutableRefObject<((id: number) => void) | null>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
}

function startAssistantStreaming({
  runId,
  assistantId,
  text,
  runIdRef,
  isStreamingRef,
  assistantIdRef,
  controllerRef,
  rafRef,
  rafCancelRef,
  setMessages,
  setIsStreaming,
}: StreamOptions) {
  const chars = [...text];
  let cursor = 0;

  const finish = () => {
    isStreamingRef.current = false;
    assistantIdRef.current = null;
    controllerRef.current = null;
    rafRef.current = null;
    rafCancelRef.current = null;
    setIsStreaming(false);
  };

  const tick = () => {
    if (runId !== runIdRef.current || !isStreamingRef.current) {
      return;
    }

    cursor += 1;
    if (cursor === 1) {
      setIsStreaming(true);
    }
    const content = chars.slice(0, cursor).join('');

    setMessages((prev) => {
      const nextMessages = updateAssistantContent(prev, assistantId, content);
      return nextMessages;
    });

    if (cursor >= chars.length) {
      finish();
      return;
    }

    const frame = scheduleFrame(tick);
    rafRef.current = frame.id;
    rafCancelRef.current = frame.cancel;
  };

  if (chars.length === 0) {
    finish();
    return;
  }

  const frame = scheduleFrame(tick);
  rafRef.current = frame.id;
  rafCancelRef.current = frame.cancel;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError';
}

function createAbortError() {
  return new DOMException('Chat run cancelled', 'AbortError');
}

export interface AgentContext {
  proposalId?: string;
}

export interface UseAgentChatOptions {
  onUserMessage?: (message: ChatMessage) => Promise<void> | void;
  onAssistantMessage?: (message: ChatMessage) => Promise<void> | void;
}

export interface UseAgentChatResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  send: (text: string, attachments: Attachment[], context?: AgentContext) => void;
  stop: () => void;
  reset: () => void;
  replaceMessages: (nextMessages: ChatMessage[]) => void;
}

export function useAgentChat(
  config: AgentConfig,
  options: UseAgentChatOptions = {},
): UseAgentChatResult {
  const { onUserMessage, onAssistantMessage } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isStreamingRef = useRef(false);
  const runIdRef = useRef(0);
  const assistantIdRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);
  const rafCancelRef = useRef<((id: number) => void) | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStreamingFrame = useCallback(() => {
    if (rafRef.current !== null) {
      rafCancelRef.current?.(rafRef.current);
      rafRef.current = null;
      rafCancelRef.current = null;
    }
    if (responseTimeoutRef.current !== null) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  const abortInFlight = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const updateMessages = useCallback(
    (updater: SetStateAction<ChatMessage[]>) => {
      setMessages((prev) => {
        const nextMessages =
          typeof updater === 'function'
            ? (updater as (prevMessages: ChatMessage[]) => ChatMessage[])(prev)
            : updater;
        messagesRef.current = nextMessages;
        return nextMessages;
      });
    },
    [setMessages],
  );

  const reset = useCallback(() => {
    clearStreamingFrame();
    abortInFlight();
    runIdRef.current += 1;
    isStreamingRef.current = false;
    assistantIdRef.current = null;
    updateMessages((prev) => {
      revokeMessagePreviews(prev);
      return [];
    });
    setIsStreaming(false);
  }, [abortInFlight, clearStreamingFrame, updateMessages]);

  const replaceMessages = useCallback(
    (nextMessages: ChatMessage[]) => {
      clearStreamingFrame();
      abortInFlight();
      runIdRef.current += 1;
      isStreamingRef.current = false;
      assistantIdRef.current = null;
      updateMessages((prev) => {
        revokeMessagePreviews(prev);
        return nextMessages;
      });
      setIsStreaming(false);
    },
    [abortInFlight, clearStreamingFrame, updateMessages],
  );

  const stop = useCallback(() => {
    clearStreamingFrame();
    abortInFlight();
    runIdRef.current += 1;
    isStreamingRef.current = false;
    setIsStreaming(false);

    const assistantId = assistantIdRef.current;
    if (assistantId) {
      updateMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, variant: 'interrupted' } : message,
        ),
      );
    }

    assistantIdRef.current = null;
  }, [abortInFlight, clearStreamingFrame, updateMessages]);

  const send = useCallback(
    (text: string, attachments: Attachment[], context?: AgentContext) => {
      if (!text.trim() && attachments.length === 0) {
        return;
      }

      if (isStreamingRef.current) {
        return;
      }

      clearStreamingFrame();
      abortInFlight();

      const runId = runIdRef.current + 1;
      const controller = new AbortController();
      const userMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text,
        ...(attachments.length > 0 ? { attachments } : {}),
        createdAt: Date.now(),
      };
      const nextHistory = [...messagesRef.current, userMessage];

      runIdRef.current = runId;
      controllerRef.current = controller;
      isStreamingRef.current = true;
      assistantIdRef.current = null;

      updateMessages(nextHistory);
      setIsStreaming(true);

      let settled = false;
      let settledResponse:
        | {
            ok: true;
            text: string;
            payload?: unknown;
          }
        | {
            ok: false;
            error: unknown;
          };

      void Promise.resolve(onUserMessage?.(userMessage))
        .then(() => {
          if (runId !== runIdRef.current || controller.signal.aborted) {
            throw createAbortError();
          }

          return config.adapter.send(
            { text, attachments, context, history: nextHistory },
            controller.signal,
          );
        })
        .then(
          (response) => {
            settled = true;
            settledResponse = { ok: true, text: response.text, payload: response.payload };
          },
          (error: unknown) => {
            settled = true;
            settledResponse = { ok: false, error };
          },
        );

      const consumeAdapterResult = () => {
        if (runId !== runIdRef.current || controller.signal.aborted) {
          responseTimeoutRef.current = null;
          return;
        }

        if (!settled) {
          responseTimeoutRef.current = setTimeout(consumeAdapterResult, TICK_MS);
          return;
        }

        responseTimeoutRef.current = null;

        if (!settledResponse.ok) {
          if (isAbortError(settledResponse.error)) {
            return;
          }

          controllerRef.current = null;
          isStreamingRef.current = false;
          assistantIdRef.current = null;
          setIsStreaming(false);
          updateMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: 'assistant',
              content: GENERIC_ERROR_MESSAGE,
              variant: 'error',
              createdAt: Date.now(),
            },
          ]);
          return;
        }

        const responseChars = [...settledResponse.text];
        const assistantId = uid();
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          ...(settledResponse.payload !== undefined ? { payload: settledResponse.payload } : {}),
          createdAt: Date.now(),
        };
        const persistedAssistantMessage: ChatMessage = {
          ...assistantMessage,
          content: settledResponse.text,
        };

        void Promise.resolve(onAssistantMessage?.(persistedAssistantMessage)).catch(() => undefined);
        assistantIdRef.current = assistantId;
        setIsStreaming(false);
        updateMessages((prev) => {
          return [...prev, assistantMessage];
        });

        if (responseChars.length === 0) {
          isStreamingRef.current = false;
          assistantIdRef.current = null;
          controllerRef.current = null;
          setIsStreaming(false);
          return;
        }

        startAssistantStreaming({
          runId,
          assistantId,
          text: settledResponse.text,
          runIdRef,
          isStreamingRef,
          assistantIdRef,
          controllerRef,
          rafRef,
          rafCancelRef,
          setMessages: updateMessages,
          setIsStreaming,
        });
      };

      responseTimeoutRef.current = setTimeout(consumeAdapterResult, TICK_MS);
    },
    [abortInFlight, clearStreamingFrame, config, onAssistantMessage, onUserMessage, updateMessages],
  );

  useEffect(
    () => () => {
      clearStreamingFrame();
      abortInFlight();
      runIdRef.current += 1;
      isStreamingRef.current = false;
      revokeMessagePreviews(messagesRef.current);
      assistantIdRef.current = null;
    },
    [abortInFlight, clearStreamingFrame],
  );

  return { messages, isStreaming, send, stop, reset, replaceMessages };
}
