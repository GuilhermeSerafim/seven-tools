import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from 'react';

import type { Attachment, ChatMessage } from '../types';
import { pickResponse, type MockDecision } from './mockResponses';

const TICK_MS = 16;
const THINK_MS = 300;
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

type AssistantStreamingOptions = Readonly<{
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
}>;

function scheduleFrame(callback: FrameRequestCallback) {
  if (
    typeof globalThis.requestAnimationFrame === 'function' &&
    typeof globalThis.cancelAnimationFrame === 'function'
  ) {
    return {
      id: globalThis.requestAnimationFrame(callback),
      cancel: (id: number) => globalThis.cancelAnimationFrame(id),
    };
  }

  return {
    id: window.setTimeout(() => callback(performance.now()), TICK_MS),
    cancel: (id: number) => clearTimeout(id),
  };
}

function startAssistantStreaming({
  runId,
  assistantId,
  text,
  runIdRef,
  isStreamingRef,
  assistantIdRef,
  rafRef,
  rafCancelRef,
  setMessages,
  setIsStreaming,
}: AssistantStreamingOptions) {
  const chars = [...text];
  const totalTicks = Math.max(30, Math.min(chars.length, 120));
  let tickIndex = 0;

  const tick = () => {
    if (runId !== runIdRef.current || !isStreamingRef.current) {
      return;
    }

    tickIndex += 1;
    const cursor = Math.min(chars.length, Math.ceil((chars.length * tickIndex) / totalTicks));
    const content = chars.slice(0, cursor).join('');

    setMessages((prev) => updateAssistantContent(prev, assistantId, content));

    if (tickIndex >= totalTicks) {
      isStreamingRef.current = false;
      setIsStreaming(false);
      assistantIdRef.current = null;
      rafRef.current = null;
      rafCancelRef.current = null;
      return;
    }

    const frame = scheduleFrame(tick);
    rafRef.current = frame.id;
    rafCancelRef.current = frame.cancel;
  };

  const frame = scheduleFrame(tick);
  rafRef.current = frame.id;
  rafCancelRef.current = frame.cancel;
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
  const isStreamingRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const runIdRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const rafCancelRef = useRef<((id: number) => void) | null>(null);
  const thinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantIdRef = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) {
      rafCancelRef.current?.(rafRef.current);
      rafRef.current = null;
      rafCancelRef.current = null;
    }
    if (thinkTimeoutRef.current !== null) {
      clearTimeout(thinkTimeoutRef.current);
      thinkTimeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    runIdRef.current += 1;
    isStreamingRef.current = false;
    setMessages((prev) => {
      revokeMessagePreviews(prev);
      messagesRef.current = [];
      return [];
    });
    setIsStreaming(false);
    setLastDecision(null);
    assistantIdRef.current = null;
  }, [clearTimers]);

  const stop = useCallback(() => {
    clearTimers();
    runIdRef.current += 1;
    isStreamingRef.current = false;
    setIsStreaming(false);

    const assistantId = assistantIdRef.current;
    if (assistantId) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId ? { ...message, variant: 'interrupted' } : message,
        ),
      );
    }
    assistantIdRef.current = null;
  }, [clearTimers]);

  const send = useCallback(
    (text: string, attachments: Attachment[]) => {
      if (!text.trim() && attachments.length === 0) {
        return;
      }
      if (isStreamingRef.current) {
        return;
      }

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
      const decision = pickResponse(text, attachments);

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setLastDecision(decision);

      thinkTimeoutRef.current = setTimeout(() => {
        if (runId !== runIdRef.current || !isStreamingRef.current) {
          return;
        }

        const assistantId = uid();
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: 'assistant',
          content: '',
          ...(decision.variant ? { variant: decision.variant } : {}),
          createdAt: Date.now(),
        };

        assistantIdRef.current = assistantId;
        thinkTimeoutRef.current = null;
        setMessages((prev) => [...prev, assistantMessage]);
        startAssistantStreaming({
          runId,
          assistantId,
          text: decision.text,
          runIdRef,
          isStreamingRef,
          assistantIdRef,
          rafRef,
          rafCancelRef,
          setMessages,
          setIsStreaming,
        });
      }, THINK_MS);
    },
    [clearTimers],
  );

  useEffect(
    () => () => {
      clearTimers();
      runIdRef.current += 1;
      isStreamingRef.current = false;
      revokeMessagePreviews(messagesRef.current);
      assistantIdRef.current = null;
    },
    [clearTimers],
  );

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  return { messages, isStreaming, lastDecision, send, stop, reset };
}
