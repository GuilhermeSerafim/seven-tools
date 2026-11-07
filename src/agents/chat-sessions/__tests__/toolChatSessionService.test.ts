import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { ChatMessage } from '@/agents/chat/types';
import { toolChatSessionService } from '../toolChatSessionService';
import { chatMessageToPersistedInput } from '../types';
import api from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedApi = api as unknown as {
  get: Mock;
  post: Mock;
  patch: Mock;
};

describe('toolChatSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista sessoes filtradas por ferramenta e busca', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        items: [{ id: 's1', toolSlug: 'proposta-comercial-smart', title: 'Aurora' }],
        total: 1,
        page: 1,
        perPage: 30,
      },
    });

    const result = await toolChatSessionService.listSessions({
      toolSlug: 'proposta-comercial-smart',
      q: 'aurora',
      page: 1,
      perPage: 30,
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/tool-chat/sessions', {
      params: { tool_slug: 'proposta-comercial-smart', q: 'aurora', page: 1, per_page: 30 },
    });
    expect(result.items).toHaveLength(1);
  });

  it('cria sessao com titulo padrao quando nenhum titulo e informado', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { id: 's1', toolSlug: 'proposta-comercial-smart', title: 'Novo chat' },
    });

    const result = await toolChatSessionService.createSession({
      toolSlug: 'proposta-comercial-smart',
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/tool-chat/sessions', {
      toolSlug: 'proposta-comercial-smart',
      title: undefined,
      metadata: {},
    });
    expect(result.id).toBe('s1');
  });

  it('persiste mensagem com payload serializavel', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: {
        id: 'm1',
        sessionId: 's1',
        role: 'assistant',
        content: 'ok',
        payload: { kind: 'proposal_draft_patch' },
        createdAt: '2026-05-25T10:00:00Z',
      },
    });

    const result = await toolChatSessionService.createMessage('s1', {
      role: 'assistant',
      content: 'ok',
      payload: { kind: 'proposal_draft_patch' },
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/tool-chat/sessions/s1/messages', {
      role: 'assistant',
      content: 'ok',
      payload: { kind: 'proposal_draft_patch' },
      attachments: undefined,
      variant: undefined,
    });
    expect(result.payload).toEqual({ kind: 'proposal_draft_patch' });
  });

  it('escopa abertura e mensagens pela ferramenta atual', async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        data: {
          id: 's1',
          toolSlug: 'diagnostico-comercial-caloni',
          title: 'Diagnostico',
          metadata: {},
          createdAt: '2026-05-25T10:00:00Z',
          updatedAt: '2026-05-25T10:00:00Z',
        },
      })
      .mockResolvedValueOnce({ data: [] });
    mockedApi.post.mockResolvedValueOnce({
      data: {
        id: 'm1',
        sessionId: 's1',
        role: 'user',
        content: 'Diagnosticar',
        createdAt: '2026-05-25T10:01:00Z',
      },
    });

    await toolChatSessionService.getSession('s1', {
      toolSlug: 'diagnostico-comercial-caloni',
    });
    await toolChatSessionService.listMessages('s1', {
      toolSlug: 'diagnostico-comercial-caloni',
    });
    await toolChatSessionService.createMessage(
      's1',
      { role: 'user', content: 'Diagnosticar' },
      { toolSlug: 'diagnostico-comercial-caloni' },
    );

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/tool-chat/sessions/s1', {
      params: { tool_slug: 'diagnostico-comercial-caloni' },
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/tool-chat/sessions/s1/messages', {
      params: { tool_slug: 'diagnostico-comercial-caloni' },
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/tool-chat/sessions/s1/messages',
      {
        role: 'user',
        content: 'Diagnosticar',
        payload: undefined,
        attachments: undefined,
        variant: undefined,
      },
      { params: { tool_slug: 'diagnostico-comercial-caloni' } },
    );
  });

  it('normaliza metadata e payloads persistidos apos camelizacao do apiClient', async () => {
    mockedApi.get
      .mockResolvedValueOnce({
        data: {
          id: 's1',
          toolSlug: 'proposta-comercial-smart',
          title: 'Proposta Aurora',
          metadata: { proposalId: 'p1' },
          createdAt: '2026-05-25T10:00:00Z',
          updatedAt: '2026-05-25T10:00:00Z',
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'm1',
            sessionId: 's1',
            role: 'assistant',
            content: 'ok',
            payload: {
              kind: 'proposal_save_request',
              draftSummary: {
                title: 'Proposta Aurora',
                clientName: 'Maria Aurora',
                projectDescription: 'Auditoria comercial',
              },
              missingRequired: [],
            },
            createdAt: '2026-05-25T10:01:00Z',
          },
          {
            id: 'm2',
            sessionId: 's1',
            role: 'assistant',
            content: 'abrir',
            payload: { kind: 'proposal_open_existing', proposalId: 'p1' },
            createdAt: '2026-05-25T10:02:00Z',
          },
        ],
      });

    const session = await toolChatSessionService.getSession('s1');
    const messages = await toolChatSessionService.listMessages('s1');

    expect(session.metadata.proposal_id).toBe('p1');
    expect(messages[0].payload).toEqual({
      kind: 'proposal_save_request',
      draft_summary: {
        title: 'Proposta Aurora',
        clientName: 'Maria Aurora',
        projectDescription: 'Auditoria comercial',
      },
      missing_required: [],
    });
    expect(messages[1].payload).toEqual({ kind: 'proposal_open_existing', proposal_id: 'p1' });
  });

  it('serializa anexos sem File e previewUrl para persistencia', () => {
    const file = new File(['conteudo'], 'briefing.txt', { type: 'text/plain' });
    const message: ChatMessage = {
      id: 'm1',
      role: 'user',
      content: 'Analise este briefing',
      createdAt: 1771840800000,
      attachments: [
        {
          id: 'a1',
          type: 'text',
          file,
          name: 'briefing.txt',
          sizeBytes: 8,
          previewUrl: 'blob:http://localhost/preview',
        },
      ],
    };

    const result = chatMessageToPersistedInput(message);

    expect(result.attachments).toEqual([
      {
        id: 'a1',
        type: 'text',
        name: 'briefing.txt',
        sizeBytes: 8,
      },
    ]);
    expect(result.attachments?.[0]).not.toHaveProperty('file');
    expect(result.attachments?.[0]).not.toHaveProperty('previewUrl');
  });
});
