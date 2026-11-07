import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ChatMessage } from '@/agents/chat/types';
import { toolChatSessionService } from './toolChatSessionService';
import { chatMessageToPersistedInput, persistedMessageToChatMessage } from './types';
import type { ToolChatSession } from './types';

interface UseToolChatSessionsResult {
  sessions: ToolChatSession[];
  activeSession: ToolChatSession | null;
  activeMessages: ChatMessage[];
  loadingSessions: boolean;
  loadingMessages: boolean;
  sessionsError: string | null;
  messagesError: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refreshSessions: () => Promise<void>;
  createNewSession: () => Promise<ToolChatSession>;
  openSession: (sessionId: string) => Promise<ChatMessage[]>;
  persistMessage: (message: ChatMessage) => Promise<void>;
  patchActiveSessionMetadata: (metadata: Record<string, unknown>) => Promise<void>;
  clearActiveSession: () => void;
}

export function useToolChatSessions(toolSlug: string): UseToolChatSessionsResult {
  const [sessions, setSessions] = useState<ToolChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ToolChatSession | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const refreshRequestIdRef = useRef(0);
  const openRequestIdRef = useRef(0);

  const refreshSessions = useCallback(async () => {
    const requestId = refreshRequestIdRef.current + 1;
    refreshRequestIdRef.current = requestId;
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const response = await toolChatSessionService.listSessions({
        toolSlug,
        q: searchQuery,
        page: 1,
        perPage: 30,
      });
      if (refreshRequestIdRef.current !== requestId) {
        return;
      }
      setSessions(response.items);
    } catch {
      if (refreshRequestIdRef.current !== requestId) {
        return;
      }
      setSessionsError('Nao consegui carregar as conversas');
    } finally {
      if (refreshRequestIdRef.current === requestId) {
        setLoadingSessions(false);
      }
    }
  }, [searchQuery, toolSlug]);

  useEffect(() => {
    refreshSessions().catch(() => undefined);
  }, [refreshSessions]);

  const createNewSession = useCallback(async () => {
    const requestId = openRequestIdRef.current + 1;
    openRequestIdRef.current = requestId;
    setLoadingMessages(false);
    setMessagesError(null);
    const created = await toolChatSessionService.createSession({ toolSlug });
    if (openRequestIdRef.current === requestId) {
      setActiveSession(created);
      setActiveMessages([]);
    }
    setSessions((current) => [created, ...current.filter((session) => session.id !== created.id)]);
    return created;
  }, [toolSlug]);

  const openSession = useCallback(async (sessionId: string) => {
    const requestId = openRequestIdRef.current + 1;
    openRequestIdRef.current = requestId;
    setLoadingMessages(true);
    setMessagesError(null);
    try {
      const [session, messages] = await Promise.all([
        toolChatSessionService.getSession(sessionId, { toolSlug }),
        toolChatSessionService.listMessages(sessionId, { toolSlug }),
      ]);
      const chatMessages = messages.map(persistedMessageToChatMessage);
      if (openRequestIdRef.current !== requestId) {
        return chatMessages;
      }
      setActiveSession(session);
      setActiveMessages(chatMessages);
      setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      return chatMessages;
    } catch {
      if (openRequestIdRef.current !== requestId) {
        return [];
      }
      setMessagesError('Nao consegui carregar essa conversa');
      return [];
    } finally {
      if (openRequestIdRef.current === requestId) {
        setLoadingMessages(false);
      }
    }
  }, []);

  const persistMessage = useCallback(
    async (message: ChatMessage) => {
      if (!activeSession) {
        throw new Error('Cannot persist a message without an active session');
      }
      await toolChatSessionService.createMessage(
        activeSession.id,
        chatMessageToPersistedInput(message),
        { toolSlug },
      );
      await refreshSessions();
    },
    [activeSession, refreshSessions],
  );

  const patchActiveSessionMetadata = useCallback(
    async (metadata: Record<string, unknown>) => {
      if (!activeSession) {
        return;
      }
      const updated = await toolChatSessionService.patchSession(
        activeSession.id,
        { metadata },
        { toolSlug },
      );
      setActiveSession(updated);
      setSessions((current) => [updated, ...current.filter((session) => session.id !== updated.id)]);
    },
    [activeSession, toolSlug],
  );

  const clearActiveSession = useCallback(() => {
    openRequestIdRef.current += 1;
    setActiveSession(null);
    setActiveMessages([]);
    setLoadingMessages(false);
    setMessagesError(null);
  }, []);

  return useMemo(
    () => ({
      sessions,
      activeSession,
      activeMessages,
      loadingSessions,
      loadingMessages,
      sessionsError,
      messagesError,
      searchQuery,
      setSearchQuery,
      refreshSessions,
      createNewSession,
      openSession,
      persistMessage,
      patchActiveSessionMetadata,
      clearActiveSession,
    }),
    [
      activeMessages,
      activeSession,
      clearActiveSession,
      createNewSession,
      loadingMessages,
      loadingSessions,
      messagesError,
      openSession,
      patchActiveSessionMetadata,
      persistMessage,
      refreshSessions,
      searchQuery,
      sessions,
      sessionsError,
    ],
  );
}
