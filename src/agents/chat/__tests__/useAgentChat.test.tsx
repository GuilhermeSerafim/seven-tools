import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAgentChat } from '../useAgentChat';
import type { AgentAdapter } from '@/agents/caloni/adapter';
import type { AgentConfig } from '@/agents/registry';
import type { Attachment } from '../types';

function makeConfig(adapter: AgentAdapter): AgentConfig {
  return {
    id: 'test',
    name: 'T',
    subtitle: 'Test',
    avatarSrc: '/x.jpg',
    mission: 'test',
    suggestions: [],
    adapter,
  };
}

describe('useAgentChat', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('send adiciona user message e dispara adapter', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'resposta' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('oi', []);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[0].content).toBe('oi');

    await act(async () => {
      await Promise.resolve();
    });

    expect(adapter.send).toHaveBeenCalledWith(
      {
        text: 'oi',
        attachments: [],
        context: undefined,
        history: [expect.objectContaining({ role: 'user', content: 'oi' })],
      },
      expect.any(AbortSignal),
    );
  });

  it('apos adapter resolver, aparece bubble do assistant e stream comeca', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'oi resposta' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('oi', []);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    const assistant = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistant).toBeDefined();
    expect(String(assistant!.content)).toBe('');
    expect(result.current.isStreaming).toBe(false);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(String(result.current.messages.find((m) => m.role === 'assistant')!.content)).toContain(
      'oi resposta',
    );
    expect(result.current.isStreaming).toBe(false);
  });

  it('quando adapter retorna payload, a mensagem do assistant carrega payload', async () => {
    const payload = { score: 7.8 };
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok', payload }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('ir', []);
    });
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    const assistant = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistant?.payload).toEqual(payload);
  });

  it('no primeiro tick visivel, assistant recebe o primeiro chunk e isStreaming publico volta a true', async () => {
    let resolveAdapter:
      | ((value: { text: string; payload?: unknown }) => void)
      | undefined;
    const adapter: AgentAdapter = {
      send: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAdapter = resolve;
          }),
      ),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('oi', []);
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      resolveAdapter?.({ text: 'abc' });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    expect(String(result.current.messages.find((m) => m.role === 'assistant')?.content)).toBe('');
    expect(result.current.isStreaming).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    const assistant = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistant).toBeDefined();
    expect(String(assistant?.content)).toBe('a');
    expect(result.current.isStreaming).toBe(true);
  });

  it('bloqueia novo send durante a transicao do assistant vazio mesmo com isStreaming publico false', async () => {
    let resolveAdapter:
      | ((value: { text: string; payload?: unknown }) => void)
      | undefined;
    const adapter: AgentAdapter = {
      send: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAdapter = resolve;
          }),
      ),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('primeira', []);
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      resolveAdapter?.({ text: 'abc' });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    expect(result.current.isStreaming).toBe(false);

    act(() => {
      result.current.send('segunda', []);
    });

    expect(adapter.send).toHaveBeenCalledTimes(1);
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1);
  });

  it('send passa context para o adapter', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('x', [], { proposalId: 'p1' });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(adapter.send).toHaveBeenCalledWith(
      expect.objectContaining({ context: { proposalId: 'p1' } }),
      expect.any(AbortSignal),
    );
  });

  it('stop aborta o AbortController e marca mensagem do assistant como interrupted', async () => {
    let capturedSignal: AbortSignal | undefined;
    let resolveAdapter:
      | ((value: { text: string; payload?: unknown }) => void)
      | undefined;
    const adapter: AgentAdapter = {
      send: (_input, signal) => {
        capturedSignal = signal;
        return new Promise((resolve) => {
          resolveAdapter = resolve;
        });
      },
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('x', []);
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      resolveAdapter?.({ text: 'stream em andamento' });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(32);
    });

    const assistantBeforeStop = result.current.messages.find((m) => m.role === 'assistant');
    expect(assistantBeforeStop).toBeDefined();

    act(() => {
      result.current.stop();
    });

    expect(capturedSignal?.aborted).toBe(true);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages.find((m) => m.role === 'assistant')?.variant).toBe(
      'interrupted',
    );
  });

  it('reset limpa mensagens e cancela streaming em progresso', async () => {
    let resolveAdapter:
      | ((value: { text: string; payload?: unknown }) => void)
      | undefined;
    const adapter: AgentAdapter = {
      send: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAdapter = resolve;
          }),
      ),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.send('a', []);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);

    act(() => {
      resolveAdapter?.({ text: 'resposta tardia' });
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('passa historico completo para o adapter incluindo a mensagem nova', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok' }),
    };
    const { result } = renderHook(() => useAgentChat(makeConfig(adapter)));

    act(() => {
      result.current.replaceMessages([
        { id: 'm0', role: 'assistant', content: 'Oi', createdAt: 1 },
      ]);
    });

    act(() => {
      result.current.send('nova', []);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(adapter.send).toHaveBeenCalledWith(
      expect.objectContaining({
        history: [
          { id: 'm0', role: 'assistant', content: 'Oi', createdAt: 1 },
          expect.objectContaining({ role: 'user', content: 'nova' }),
        ],
      }),
      expect.any(AbortSignal),
    );
  });

  it('persiste mensagem do usuario antes de chamar o adapter', async () => {
    const calls: string[] = [];
    const adapter: AgentAdapter = {
      send: vi.fn().mockImplementation(async () => {
        calls.push('adapter');
        return { text: 'ok' };
      }),
    };
    const onUserMessage = vi.fn().mockImplementation(async () => {
      calls.push('persist-user');
    });
    const { result } = renderHook(() =>
      useAgentChat(makeConfig(adapter), { onUserMessage }),
    );

    act(() => {
      result.current.send('oi', []);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    expect(calls).toEqual(['persist-user', 'adapter']);
  });

  it('nao chama adapter se replaceMessages cancelar enquanto persiste usuario', async () => {
    let resolveUserMessage: (() => void) | undefined;
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok' }),
    };
    const onUserMessage = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUserMessage = resolve;
        }),
    );
    const replacedMessages = [
      { id: 'm1', role: 'assistant' as const, content: 'Histórico salvo', createdAt: 1 },
    ];
    const { result } = renderHook(() =>
      useAgentChat(makeConfig(adapter), { onUserMessage }),
    );

    act(() => {
      result.current.send('oi', []);
    });

    act(() => {
      result.current.replaceMessages(replacedMessages);
    });

    await act(async () => {
      resolveUserMessage?.();
      await Promise.resolve();
    });

    expect(adapter.send).not.toHaveBeenCalled();
    expect(result.current.messages).toEqual(replacedMessages);
  });

  it('persiste assistant com texto final e payload antes do streaming visual', async () => {
    const payload = { kind: 'proposal_draft_patch' };
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'resposta final', payload }),
    };
    const onAssistantMessage = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAgentChat(makeConfig(adapter), { onAssistantMessage }),
    );

    act(() => {
      result.current.send('oi', []);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(16);
    });

    expect(onAssistantMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'assistant',
        content: 'resposta final',
        payload,
      }),
    );
    expect(String(result.current.messages.find((m) => m.role === 'assistant')?.content)).toBe('');
  });

  it('renderiza assistant mesmo se persistencia do assistant falhar', async () => {
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'resposta final' }),
    };
    const onAssistantMessage = vi.fn().mockRejectedValue(new Error('persist failed'));
    const { result } = renderHook(() =>
      useAgentChat(makeConfig(adapter), { onAssistantMessage }),
    );

    act(() => {
      result.current.send('oi', []);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onAssistantMessage).toHaveBeenCalledOnce();
    expect(String(result.current.messages.find((m) => m.role === 'assistant')?.content)).toBe(
      'resposta final',
    );
    expect(result.current.isStreaming).toBe(false);
  });

  it('unmount imediato apos send revoga previews das attachments mais recentes', () => {
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    const attachment: Attachment = {
      id: 'a1',
      type: 'image',
      file: new File(['img'], 'preview.png', { type: 'image/png' }),
      name: 'preview.png',
      sizeBytes: 3,
      previewUrl: 'blob:preview-1',
    };
    const adapter: AgentAdapter = {
      send: vi.fn().mockResolvedValue({ text: 'ok' }),
    };
    const { result, unmount } = renderHook(() => useAgentChat(makeConfig(adapter)));

    try {
      act(() => {
        result.current.send('oi', [attachment]);
        unmount();
      });

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
    } finally {
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: originalRevokeObjectURL,
      });
    }
  });
});
