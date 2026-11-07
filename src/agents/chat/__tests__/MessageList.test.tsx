import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MessageList } from '../MessageList';
import { MessageBubble } from '../MessageBubble';
import type { ChatMessage } from '../types';

let messageIdSequence = 0;

const msg = (partial: Partial<ChatMessage>): ChatMessage => ({
  id: `test-message-${(messageIdSequence += 1)}`,
  role: 'user',
  content: 'm',
  createdAt: Date.now(),
  ...partial,
});

const MarkdownLike = ({ text }: { text: string }) => <span>{text}</span>;

describe('MessageList', () => {
  it('renderiza empty state quando messages.length === 0', () => {
    render(<MessageList messages={[]} emptyState={<div>Sem mensagens</div>} />);
    expect(screen.getByText('Sem mensagens')).toBeInTheDocument();
  });

  it('renderiza mensagens em ordem', () => {
    const messages = [msg({ id: '1', content: 'a' }), msg({ id: '2', content: 'b' })];

    render(
      <MessageList messages={messages}>
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role}>
            {m.content}
          </MessageBubble>
        ))}
      </MessageList>,
    );

    const texts = screen.getAllByText(/^[ab]$/).map((el) => el.textContent);
    expect(texts).toEqual(['a', 'b']);
  });

  it('mostra StreamingIndicator se isStreaming e ultima msg nao e do assistant', () => {
    const messages = [msg({ id: '1', role: 'user', content: 'oi' })];

    render(
      <MessageList messages={messages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
      </MessageList>,
    );

    expect(screen.getByText(/pensando/i)).toBeInTheDocument();
  });

  it('esconde StreamingIndicator se a ultima msg do assistant ja comecou a vir', () => {
    const messages = [
      msg({ id: '1', role: 'user', content: 'oi' }),
      msg({ id: '2', role: 'assistant', content: 'r' }),
    ];

    render(
      <MessageList messages={messages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
        <MessageBubble role="assistant" isStreaming>
          r
        </MessageBubble>
      </MessageList>,
    );

    expect(screen.queryByText(/pensando/i)).not.toBeInTheDocument();
  });

  it('mostra StreamingIndicator se a ultima msg do assistant ainda esta vazia', () => {
    const messages = [
      msg({ id: '1', role: 'user', content: 'oi' }),
      msg({ id: '2', role: 'assistant', content: '' }),
    ];

    render(
      <MessageList messages={messages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
        <MessageBubble role="assistant" isStreaming>
          {''}
        </MessageBubble>
      </MessageList>,
    );

    expect(screen.getByText(/pensando/i)).toBeInTheDocument();
  });

  it('mantem StreamingIndicator para content vazio em fragment e array', () => {
    const fragmentMessages = [
      msg({ id: '1', role: 'user', content: 'oi' }),
      msg({ id: '2', role: 'assistant', content: <></> }),
    ];

    const { rerender } = render(
      <MessageList messages={fragmentMessages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
        <MessageBubble role="assistant" isStreaming>
          <></>
        </MessageBubble>
      </MessageList>,
    );

    expect(screen.getByText(/pensando/i)).toBeInTheDocument();

    const arrayMessages = [
      msg({ id: '1', role: 'user', content: 'oi' }),
      msg({ id: '2', role: 'assistant', content: [' ', null, false] }),
    ];

    rerender(
      <MessageList messages={arrayMessages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
        <MessageBubble role="assistant" isStreaming>
          {[' ', null, false]}
        </MessageBubble>
      </MessageList>,
    );

    expect(screen.getByText(/pensando/i)).toBeInTheDocument();
  });

  it('desliga aria-live durante streaming', () => {
    const messages = [msg({ id: '1', role: 'user', content: 'oi' })];

    const { container } = render(
      <MessageList messages={messages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
      </MessageList>,
    );

    expect(container.querySelector('[role="log"]')).toHaveAttribute('aria-live', 'off');
  });

  it('FAB "Novas mensagens" aparece quando usuario rolou pra cima', () => {
    const messages = [msg({ id: '1' })];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="user">1</MessageBubble>
      </MessageList>,
    );

    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    Object.defineProperty(scrollBox, 'scrollTop', { configurable: true, writable: true, value: 0 });
    Object.defineProperty(scrollBox, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 400 });

    fireEvent.scroll(scrollBox);

    const newMsgs = [...messages, msg({ id: '2' })];
    rerender(
      <MessageList messages={newMsgs}>
        <MessageBubble role="user">1</MessageBubble>
        <MessageBubble role="user">2</MessageBubble>
      </MessageList>,
    );

    expect(screen.getByRole('button', { name: /novas mensagens/i })).toBeInTheDocument();
  });

  it('considera no fim apenas quando a distancia e menor que 80px', () => {
    const messages = [msg({ id: '1' })];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="user">1</MessageBubble>
      </MessageList>,
    );

    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    Object.defineProperty(scrollBox, 'scrollTop', { configurable: true, writable: true, value: 1520 });
    Object.defineProperty(scrollBox, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 400 });

    fireEvent.scroll(scrollBox);

    rerender(
      <MessageList messages={[...messages, msg({ id: '2' })]}>
        <MessageBubble role="user">1</MessageBubble>
        <MessageBubble role="user">2</MessageBubble>
      </MessageList>,
    );

    expect(screen.getByRole('button', { name: /novas mensagens/i })).toBeInTheDocument();
  });

  it('faz auto-scroll em update incremental da mesma mensagem quando ja esta no fim', () => {
    const messages = [msg({ id: '1', role: 'assistant', content: 'o' })];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="assistant" isStreaming>
          o
        </MessageBubble>
      </MessageList>,
    );

    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    let scrollTopValue = 2000;
    let scrollHeightValue = 2000;

    Object.defineProperty(scrollBox, 'scrollTop', {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
      },
    });
    Object.defineProperty(scrollBox, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeightValue,
    });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 0 });

    scrollHeightValue = 2600;
    rerender(
      <MessageList messages={[msg({ id: '1', role: 'assistant', content: 'oi' })]}>
        <MessageBubble role="assistant" isStreaming>
          oi
        </MessageBubble>
      </MessageList>,
    );

    expect(scrollTopValue).toBe(2600);
  });

  it('embrulha child em fragment com spacing externo sem depender de className', () => {
    const messages = [
      msg({ id: '1', role: 'user', content: 'a' }),
      msg({ id: '2', role: 'assistant', content: 'b' }),
    ];

    const { container } = render(
      <MessageList messages={messages}>
        <>
          <MessageBubble role="user">a</MessageBubble>
        </>
        <>
          <MessageBubble role="assistant">b</MessageBubble>
        </>
      </MessageList>,
    );

    const wrappers = Array.from(
      container.querySelectorAll('[data-testid="message-list-content"] > div'),
    );
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0]).not.toHaveClass('mt-8');
    expect(wrappers[1]).toHaveClass('mt-8');
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  it('esconde StreamingIndicator quando content e JSX self-closing visivel', () => {
    const messages = [
      msg({ id: '1', role: 'user', content: 'oi' }),
      msg({ id: '2', role: 'assistant', content: <MarkdownLike text="resposta" /> }),
    ];

    render(
      <MessageList messages={messages} isStreaming>
        <MessageBubble role="user">oi</MessageBubble>
        <MessageBubble role="assistant" isStreaming>
          <MarkdownLike text="resposta" />
        </MessageBubble>
      </MessageList>,
    );

    expect(screen.queryByText(/pensando/i)).not.toBeInTheDocument();
  });

  it('faz auto-scroll em update por prop de JSX self-closing com mesmo id', () => {
    const messages = [msg({ id: '1', role: 'assistant', content: <MarkdownLike text="o" /> })];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="assistant" isStreaming>
          <MarkdownLike text="o" />
        </MessageBubble>
      </MessageList>,
    );

    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    let scrollTopValue = 2000;
    let scrollHeightValue = 2000;

    Object.defineProperty(scrollBox, 'scrollTop', {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
      },
    });
    Object.defineProperty(scrollBox, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeightValue,
    });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 0 });

    scrollHeightValue = 2600;
    rerender(
      <MessageList messages={[msg({ id: '1', role: 'assistant', content: <MarkdownLike text="oi" /> })]}>
        <MessageBubble role="assistant" isStreaming>
          <MarkdownLike text="oi" />
        </MessageBubble>
      </MessageList>,
    );

    expect(scrollTopValue).toBe(2600);
  });

  it('faz auto-scroll quando a ultima mensagem cresce via children sem mudar o content do model', () => {
    const messages = [msg({ id: '1', role: 'assistant', content: 'oi' })];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="assistant">oi</MessageBubble>
      </MessageList>,
    );

    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    let scrollTopValue = 2000;
    let scrollHeightValue = 2000;

    Object.defineProperty(scrollBox, 'scrollTop', {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
      },
    });
    Object.defineProperty(scrollBox, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeightValue,
    });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 0 });

    scrollHeightValue = 2600;
    rerender(
      <MessageList messages={messages}>
        <MessageBubble role="assistant">
          <>
            oi
            <div>Card inline</div>
          </>
        </MessageBubble>
      </MessageList>,
    );

    expect(scrollTopValue).toBe(2600);
  });

  it('nao faz auto-scroll quando muda um child anterior e o ultimo renderizado fica igual', () => {
    const messages = [
      msg({ id: '1', role: 'assistant', content: 'primeira' }),
      msg({ id: '2', role: 'assistant', content: 'ultima' }),
    ];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="assistant">primeira</MessageBubble>
        <MessageBubble role="assistant">ultima</MessageBubble>
      </MessageList>,
    );

    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    let scrollTopValue = 2000;
    let scrollHeightValue = 2000;

    Object.defineProperty(scrollBox, 'scrollTop', {
      configurable: true,
      get: () => scrollTopValue,
      set: (value: number) => {
        scrollTopValue = value;
      },
    });
    Object.defineProperty(scrollBox, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeightValue,
    });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 0 });

    scrollHeightValue = 2600;
    rerender(
      <MessageList messages={messages}>
        <MessageBubble role="assistant">
          <>
            primeira
            <div>Card inline</div>
          </>
        </MessageBubble>
        <MessageBubble role="assistant">ultima</MessageBubble>
      </MessageList>,
    );

    expect(scrollTopValue).toBe(2000);
  });

  it('aceita contentClassName para widenizar a coluna da conversa', () => {
    const messages = [msg({ id: '1', role: 'assistant', content: 'oi' })];
    const { container } = render(
      <MessageList messages={messages} contentClassName="max-w-[960px]">
        <MessageBubble role="assistant">oi</MessageBubble>
      </MessageList>,
    );

    expect(container.querySelector('[data-testid="message-list-content"].max-w-\\[960px\\]')).not.toBeNull();
  });

  it('usa a scroll area customizada do app para evitar scrollbar nativa no desktop', () => {
    const messages = [msg({ id: '1', role: 'assistant', content: 'oi' })];
    render(
      <MessageList messages={messages}>
        <MessageBubble role="assistant">oi</MessageBubble>
      </MessageList>,
    );

    expect(screen.getByTestId('message-list-scroll-area')).toBeInTheDocument();
    expect(document.querySelector('[data-radix-scroll-area-viewport]')).not.toBeNull();
  });

  it('mantem fabClassName como hook de customizacao no botao', () => {
    const messages = [msg({ id: '1' })];
    const { container, rerender } = render(
      <MessageList messages={messages}>
        <MessageBubble role="user">1</MessageBubble>
      </MessageList>,
    );

    const scrollBox = container.querySelector('[data-scroll-root]') as HTMLElement;
    Object.defineProperty(scrollBox, 'scrollTop', { configurable: true, writable: true, value: 0 });
    Object.defineProperty(scrollBox, 'scrollHeight', { configurable: true, value: 2000 });
    Object.defineProperty(scrollBox, 'clientHeight', { configurable: true, value: 400 });

    fireEvent.scroll(scrollBox);

    rerender(
      <MessageList messages={[...messages, msg({ id: '2' })]} fabClassName="ring-1 ring-primary/30">
        <MessageBubble role="user">1</MessageBubble>
        <MessageBubble role="user">2</MessageBubble>
      </MessageList>,
    );

    expect(screen.getByRole('button', { name: /novas mensagens/i }).className).toContain(
      'ring-1 ring-primary/30',
    );
  });

  it('renderiza markdown simples em mensagens do assistente', () => {
    render(
      <MessageBubble role="assistant">
        {'Aqui esta:\n\n- **Titulo:** Proposta de Auditoria\n- **Valor:** R$ 25.000'}
      </MessageBubble>,
    );

    expect(screen.queryByText(/\*\*Titulo:\*\*/)).not.toBeInTheDocument();
    expect(screen.getByText('Titulo:').tagName).toBe('STRONG');
    expect(screen.getByText('Valor:').tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
