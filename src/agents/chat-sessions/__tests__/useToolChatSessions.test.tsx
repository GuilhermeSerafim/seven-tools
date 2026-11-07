import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toolChatSessionService } from '../toolChatSessionService';
import type { PaginatedToolChatSessionResponse, ToolChatMessage, ToolChatSession } from '../types';
import { useToolChatSessions } from '../useToolChatSessions';

vi.mock('../toolChatSessionService', () => ({
  toolChatSessionService: {
    listSessions: vi.fn(),
    createSession: vi.fn(),
    getSession: vi.fn(),
    listMessages: vi.fn(),
    createMessage: vi.fn(),
    patchSession: vi.fn(),
  },
}));

const service = vi.mocked(toolChatSessionService);

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

function session(id: string, title: string): ToolChatSession {
  return {
    id,
    userId: 'u1',
    toolSlug: 'proposta-comercial-smart',
    title,
    metadata: {},
    createdAt: '2026-05-25T10:00:00Z',
    updatedAt: '2026-05-25T10:00:00Z',
  };
}

function paginated(items: ToolChatSession[]): PaginatedToolChatSessionResponse {
  return {
    items,
    total: items.length,
    page: 1,
    perPage: 30,
  };
}

describe('useToolChatSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.listSessions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      perPage: 30,
    });
  });

  it('carrega recentes da ferramenta atual', async () => {
    service.listSessions.mockResolvedValueOnce({
      items: [
        {
          id: 's1',
          userId: 'u1',
          toolSlug: 'proposta-comercial-smart',
          title: 'Aurora',
          metadata: {},
          createdAt: '2026-05-25T10:00:00Z',
          updatedAt: '2026-05-25T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      perPage: 30,
    });

    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    await waitFor(() => expect(result.current.loadingSessions).toBe(false));

    expect(service.listSessions).toHaveBeenCalledWith({
      toolSlug: 'proposta-comercial-smart',
      q: '',
      page: 1,
      perPage: 30,
    });
    expect(result.current.sessions[0].title).toBe('Aurora');
  });

  it('cria sessao nova e define como ativa', async () => {
    service.createSession.mockResolvedValueOnce({
      id: 's2',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Novo chat',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    });
    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    let createdId = '';
    await act(async () => {
      createdId = (await result.current.createNewSession()).id;
    });

    expect(createdId).toBe('s2');
    expect(result.current.activeSession?.id).toBe('s2');
  });

  it('abre sessao e converte mensagens persistidas para ChatMessage', async () => {
    service.getSession.mockResolvedValueOnce({
      id: 's1',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Aurora',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    });
    service.listMessages.mockResolvedValueOnce([
      {
        id: 'm1',
        sessionId: 's1',
        role: 'user',
        content: 'Oi',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);
    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    await act(async () => {
      await result.current.openSession('s1');
    });

    expect(result.current.activeSession?.title).toBe('Aurora');
    expect(result.current.activeMessages[0]).toMatchObject({ id: 'm1', role: 'user', content: 'Oi' });
  });

  it('mantem o resultado da busca mais recente quando refreshes resolvem fora de ordem', async () => {
    const firstSearch = createDeferred<PaginatedToolChatSessionResponse>();
    const secondSearch = createDeferred<PaginatedToolChatSessionResponse>();
    service.listSessions
      .mockResolvedValueOnce(paginated([]))
      .mockReturnValueOnce(firstSearch.promise)
      .mockReturnValueOnce(secondSearch.promise);

    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    await waitFor(() => expect(result.current.loadingSessions).toBe(false));

    act(() => {
      result.current.setSearchQuery('aurora');
    });
    await waitFor(() =>
      expect(service.listSessions).toHaveBeenCalledWith({
        toolSlug: 'proposta-comercial-smart',
        q: 'aurora',
        page: 1,
        perPage: 30,
      }),
    );

    act(() => {
      result.current.setSearchQuery('brisa');
    });
    await waitFor(() =>
      expect(service.listSessions).toHaveBeenCalledWith({
        toolSlug: 'proposta-comercial-smart',
        q: 'brisa',
        page: 1,
        perPage: 30,
      }),
    );

    await act(async () => {
      secondSearch.resolve(paginated([session('s2', 'Brisa')]));
      await secondSearch.promise;
    });

    expect(result.current.sessions[0].title).toBe('Brisa');
    expect(result.current.sessionsError).toBeNull();

    await act(async () => {
      firstSearch.resolve(paginated([session('s1', 'Aurora')]));
      await firstSearch.promise;
    });

    expect(result.current.sessions[0].title).toBe('Brisa');
    expect(result.current.sessionsError).toBeNull();
    expect(result.current.loadingSessions).toBe(false);
  });

  it('mantem a ultima sessao aberta quando openSession resolve fora de ordem', async () => {
    const firstSession = createDeferred<ToolChatSession>();
    const firstMessages = createDeferred<ToolChatMessage[]>();
    const secondSession = createDeferred<ToolChatSession>();
    const secondMessages = createDeferred<ToolChatMessage[]>();

    service.getSession
      .mockReturnValueOnce(firstSession.promise)
      .mockReturnValueOnce(secondSession.promise);
    service.listMessages
      .mockReturnValueOnce(firstMessages.promise)
      .mockReturnValueOnce(secondMessages.promise);

    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    let openFirst!: Promise<unknown>;
    act(() => {
      openFirst = result.current.openSession('s1');
    });
    await waitFor(() =>
      expect(service.getSession).toHaveBeenCalledWith('s1', {
        toolSlug: 'proposta-comercial-smart',
      }),
    );

    let openSecond!: Promise<unknown>;
    act(() => {
      openSecond = result.current.openSession('s2');
    });
    await waitFor(() =>
      expect(service.getSession).toHaveBeenCalledWith('s2', {
        toolSlug: 'proposta-comercial-smart',
      }),
    );

    secondSession.resolve(session('s2', 'Brisa'));
    secondMessages.resolve([
      {
        id: 'm2',
        sessionId: 's2',
        role: 'assistant',
        content: 'Tudo pronto',
        createdAt: '2026-05-25T10:02:00Z',
      },
    ]);
    await act(async () => {
      await openSecond;
    });

    expect(result.current.activeSession?.id).toBe('s2');
    expect(result.current.activeMessages[0]).toMatchObject({ id: 'm2', content: 'Tudo pronto' });

    firstSession.resolve(session('s1', 'Aurora'));
    firstMessages.resolve([
      {
        id: 'm1',
        sessionId: 's1',
        role: 'user',
        content: 'Oi',
        createdAt: '2026-05-25T10:01:00Z',
      },
    ]);
    await act(async () => {
      await openFirst;
    });

    expect(result.current.activeSession?.id).toBe('s2');
    expect(result.current.activeMessages[0]).toMatchObject({ id: 'm2', content: 'Tudo pronto' });
    expect(result.current.loadingMessages).toBe(false);
  });

  it('mantem a nova sessao ativa quando um openSession antigo resolve depois', async () => {
    const oldSession = createDeferred<ToolChatSession>();
    const oldMessages = createDeferred<ToolChatMessage[]>();

    service.getSession.mockReturnValueOnce(oldSession.promise);
    service.listMessages.mockReturnValueOnce(oldMessages.promise);
    service.createSession.mockResolvedValueOnce(session('new', 'Novo chat'));

    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    let openOld!: Promise<unknown>;
    act(() => {
      openOld = result.current.openSession('old');
    });
    await waitFor(() =>
      expect(service.getSession).toHaveBeenCalledWith('old', {
        toolSlug: 'proposta-comercial-smart',
      }),
    );

    await act(async () => {
      await result.current.createNewSession();
    });

    expect(result.current.activeSession?.id).toBe('new');
    expect(result.current.activeMessages).toEqual([]);

    oldSession.resolve(session('old', 'Antigo'));
    oldMessages.resolve([
      {
        id: 'old-message',
        sessionId: 'old',
        role: 'user',
        content: 'Mensagem antiga',
        createdAt: '2026-05-25T10:03:00Z',
      },
    ]);
    await act(async () => {
      await openOld;
    });

    expect(result.current.activeSession?.id).toBe('new');
    expect(result.current.activeMessages).toEqual([]);
    expect(result.current.loadingMessages).toBe(false);
  });

  it('nao restaura sessao antiga depois de limpar a sessao ativa', async () => {
    const oldSession = createDeferred<ToolChatSession>();
    const oldMessages = createDeferred<ToolChatMessage[]>();

    service.getSession.mockReturnValueOnce(oldSession.promise);
    service.listMessages.mockReturnValueOnce(oldMessages.promise);

    const { result } = renderHook(() => useToolChatSessions('proposta-comercial-smart'));

    let openOld!: Promise<unknown>;
    act(() => {
      openOld = result.current.openSession('old');
    });
    await waitFor(() =>
      expect(service.getSession).toHaveBeenCalledWith('old', {
        toolSlug: 'proposta-comercial-smart',
      }),
    );

    act(() => {
      result.current.clearActiveSession();
    });

    expect(result.current.activeSession).toBeNull();
    expect(result.current.activeMessages).toEqual([]);

    oldSession.resolve(session('old', 'Antigo'));
    oldMessages.resolve([
      {
        id: 'old-message',
        sessionId: 'old',
        role: 'user',
        content: 'Mensagem antiga',
        createdAt: '2026-05-25T10:03:00Z',
      },
    ]);
    await act(async () => {
      await openOld;
    });

    expect(result.current.activeSession).toBeNull();
    expect(result.current.activeMessages).toEqual([]);
    expect(result.current.loadingMessages).toBe(false);
  });
});
