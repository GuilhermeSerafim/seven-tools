import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatDemo } from '../demo/useChatDemo';

describe('useChatDemo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    let nextRafId = 1;
    const rafTimers = new Map<number, ReturnType<typeof setTimeout>>();

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const rafId = nextRafId;
      nextRafId += 1;
      const timerId = setTimeout(() => {
        rafTimers.delete(rafId);
        callback(performance.now());
      }, 16);
      rafTimers.set(rafId, timerId);
      return rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', function cancelAnimationFrame(
      this: typeof globalThis,
      id: number,
    ) {
      if (this !== globalThis) {
        throw new TypeError('Illegal invocation');
      }
      const timerId = rafTimers.get(id);
      if (timerId) {
        clearTimeout(timerId);
        rafTimers.delete(id);
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('send empurra mensagem do user e seta isStreaming=true imediatamente', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('oi', []);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.role).toBe('user');
    expect(result.current.isStreaming).toBe(true);
  });

  it('após 300ms aparece bubble vazia do assistant e começa a digitar', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]?.role).toBe('assistant');
  });

  it('streaming termina → isStreaming=false', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it('stop() marca última mensagem como interrupted e para streaming', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    act(() => {
      result.current.stop();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages.at(-1)?.variant).toBe('interrupted');
  });

  it('reset limpa messages', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      vi.runAllTimers();
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.isStreaming).toBe(false);
  });

  it('guarda decisão de artifact para proposta', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('criar proposta', []);
    });

    expect(result.current.lastDecision?.artifact).toBe('proposta');
  });

  it('simula resposta de erro quando solicitado pela demo', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('simular erro', []);
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.messages.at(-1)?.role).toBe('assistant');
    expect(result.current.messages.at(-1)?.variant).toBe('error');
    expect(result.current.messages.at(-1)?.content).toMatch(/erro/i);
  });

  it('stop() durante thinking delay impede bubble stale do assistant', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      result.current.stop();
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.role).toBe('user');
  });

  it('reset() durante thinking delay impede mensagens stale depois dos timers', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('oi', []);
    });
    act(() => {
      result.current.reset();
    });
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.messages).toHaveLength(0);
  });

  it('send() enquanto streaming ignora segunda chamada', () => {
    const { result } = renderHook(() => useChatDemo());

    act(() => {
      result.current.send('primeira', []);
      result.current.send('segunda', []);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.content).toBe('primeira');

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.messages.filter((message) => message.role === 'user')).toHaveLength(1);
    expect(result.current.messages.filter((message) => message.role === 'assistant')).toHaveLength(1);
  });
});
