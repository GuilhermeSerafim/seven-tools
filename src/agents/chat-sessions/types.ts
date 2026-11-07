import type { ChatMessage, MessageRole, MessageVariant } from '@/agents/chat/types';

export interface ToolChatSession {
  id: string;
  userId: string;
  toolSlug: string;
  title: string;
  metadata: Record<string, unknown>;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedToolChatSessionResponse {
  items: ToolChatSession[];
  total: number;
  page: number;
  perPage: number;
}

export interface ToolChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  payload?: unknown;
  attachments?: Array<Record<string, unknown>>;
  variant?: MessageVariant;
  createdAt: string;
}

export interface ListToolChatSessionsParams {
  toolSlug: string;
  q?: string;
  page?: number;
  perPage?: number;
}

export interface CreateToolChatSessionInput {
  toolSlug: string;
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface PatchToolChatSessionInput {
  title?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolScopedSessionInput {
  toolSlug: string;
}

export interface CreateToolChatMessageInput {
  role: MessageRole;
  content: string;
  payload?: unknown;
  attachments?: Array<Record<string, unknown>>;
  variant?: MessageVariant;
}

export function chatMessageToPersistedInput(message: ChatMessage): CreateToolChatMessageInput {
  return {
    role: message.role,
    content: typeof message.content === 'string' ? message.content : String(message.content ?? ''),
    ...(message.payload !== undefined ? { payload: message.payload } : {}),
    ...(message.variant ? { variant: message.variant } : {}),
    ...(message.attachments?.length
      ? {
          attachments: message.attachments.map((attachment) => ({
            id: attachment.id,
            type: attachment.type,
            name: attachment.name,
            sizeBytes: attachment.sizeBytes,
          })),
        }
      : {}),
  };
}

export function persistedMessageToChatMessage(message: ToolChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: new Date(message.createdAt).getTime(),
    ...(message.payload !== undefined ? { payload: message.payload } : {}),
    ...(message.variant ? { variant: message.variant } : {}),
  };
}
