import api from '@/lib/apiClient';
import type {
  CreateToolChatMessageInput,
  CreateToolChatSessionInput,
  ListToolChatSessionsParams,
  PaginatedToolChatSessionResponse,
  PatchToolChatSessionInput,
  ToolScopedSessionInput,
  ToolChatMessage,
  ToolChatSession,
} from './types';

const PERSISTED_CAMEL_TO_SNAKE: Record<string, string> = {
  draftSummary: 'draft_summary',
  proposalId: 'proposal_id',
  missingRequired: 'missing_required',
};

function normalizePersistedKey(key: string): string {
  return PERSISTED_CAMEL_TO_SNAKE[key] ?? key;
}

function normalizeSessionMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  const normalized = { ...(metadata ?? {}) };
  if (normalized.proposal_id === undefined && typeof normalized.proposalId === 'string') {
    normalized.proposal_id = normalized.proposalId;
  }

  return normalized;
}

function normalizePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || payload instanceof Date || Array.isArray(payload)) {
    return payload;
  }

  return Object.fromEntries(
    Object.entries(payload as Record<string, unknown>).map(([key, value]) => [normalizePersistedKey(key), value]),
  );
}

function normalizeSession(session: ToolChatSession): ToolChatSession {
  return {
    ...session,
    metadata: normalizeSessionMetadata(session.metadata),
  };
}

function normalizeMessage(message: ToolChatMessage): ToolChatMessage {
  return {
    ...message,
    payload: message.payload === undefined ? undefined : normalizePayload(message.payload),
    attachments: message.attachments,
  };
}

function scopedParams(scope?: ToolScopedSessionInput) {
  return scope ? { params: { tool_slug: scope.toolSlug } } : undefined;
}

export const toolChatSessionService = {
  async listSessions({
    toolSlug,
    q,
    page = 1,
    perPage = 30,
  }: ListToolChatSessionsParams): Promise<PaginatedToolChatSessionResponse> {
    const { data } = await api.get<PaginatedToolChatSessionResponse>('/tool-chat/sessions', {
      params: { tool_slug: toolSlug, q, page, per_page: perPage },
    });
    return {
      ...data,
      items: data.items.map(normalizeSession),
    };
  },

  async createSession(input: CreateToolChatSessionInput): Promise<ToolChatSession> {
    const { data } = await api.post<ToolChatSession>('/tool-chat/sessions', {
      toolSlug: input.toolSlug,
      title: input.title,
      metadata: input.metadata ?? {},
    });
    return normalizeSession(data);
  },

  async getSession(
    sessionId: string,
    scope?: ToolScopedSessionInput,
  ): Promise<ToolChatSession> {
    const path = `/tool-chat/sessions/${sessionId}`;
    const { data } = scope
      ? await api.get<ToolChatSession>(path, scopedParams(scope))
      : await api.get<ToolChatSession>(path);
    return normalizeSession(data);
  },

  async patchSession(
    sessionId: string,
    input: PatchToolChatSessionInput,
    scope?: ToolScopedSessionInput,
  ): Promise<ToolChatSession> {
    const path = `/tool-chat/sessions/${sessionId}`;
    const { data } = scope
      ? await api.patch<ToolChatSession>(path, input, scopedParams(scope))
      : await api.patch<ToolChatSession>(path, input);
    return normalizeSession(data);
  },

  async listMessages(
    sessionId: string,
    scope?: ToolScopedSessionInput,
  ): Promise<ToolChatMessage[]> {
    const path = `/tool-chat/sessions/${sessionId}/messages`;
    const { data } = scope
      ? await api.get<ToolChatMessage[]>(path, scopedParams(scope))
      : await api.get<ToolChatMessage[]>(path);
    return data.map(normalizeMessage);
  },

  async createMessage(
    sessionId: string,
    input: CreateToolChatMessageInput,
    scope?: ToolScopedSessionInput,
  ): Promise<ToolChatMessage> {
    const path = `/tool-chat/sessions/${sessionId}/messages`;
    const body = {
      role: input.role,
      content: input.content,
      payload: input.payload,
      attachments: input.attachments,
      variant: input.variant,
    };
    const { data } = scope
      ? await api.post<ToolChatMessage>(path, body, scopedParams(scope))
      : await api.post<ToolChatMessage>(path, body);
    return normalizeMessage(data);
  },
};
