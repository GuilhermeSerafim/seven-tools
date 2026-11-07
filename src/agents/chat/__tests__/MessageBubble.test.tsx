import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Attachment } from '../types';

const makeAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: 'att-1',
  type: 'image',
  file: new File(['img'], 'foto.png', { type: 'image/png' }),
  name: 'foto.png',
  sizeBytes: 1234,
  previewUrl: 'blob:preview',
  ...overrides,
});

describe('MessageBubble', () => {
  it('role=user alinha a direita e aplica bg-primary', () => {
    const { container } = render(<MessageBubble role="user">ola</MessageBubble>);
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toMatch(/justify-end/);
    expect(container.querySelector('[data-role="user"]')!.className).toMatch(/bg-primary/);
  });

  it('role=assistant: sem bubble colorida', () => {
    const { container } = render(<MessageBubble role="assistant">resposta</MessageBubble>);
    const el = container.querySelector('[data-role="assistant"]');

    expect(el).not.toBeNull();
    expect(el!.className).not.toMatch(/bg-primary/);
  });

  it('limita a largura da mensagem do usuario para nao virar um bloco dominante', () => {
    render(<MessageBubble role="user">Mensagem do usuario</MessageBubble>);

    expect(screen.getByText('Mensagem do usuario').closest('[data-role="user"]')?.className).toContain(
      'max-w-[min(100%,38rem)]',
    );
  });

  it('da largura confortavel para leitura de respostas do assistant', () => {
    render(<MessageBubble role="assistant">Resposta do assistant</MessageBubble>);

    expect(
      screen.getByText('Resposta do assistant').closest('[data-role="assistant"]')?.className,
    ).toContain('max-w-[58rem]');
  });

  it('isStreaming mostra cursor piscando', () => {
    render(
      <MessageBubble role="assistant" isStreaming>
        tex
      </MessageBubble>,
    );

    expect(screen.getByTestId('streaming-cursor').className).toMatch(/motion-safe:animate-pulse/);
  });

  it('variant=error mostra icone AlertCircle', () => {
    const { container } = render(
      <MessageBubble role="assistant" variant="error">
        falha
      </MessageBubble>,
    );

    expect(container.querySelector('[data-testid="icon-error"]')).toBeInTheDocument();
  });

  it('variant=interrupted mostra label', () => {
    render(
      <MessageBubble role="assistant" variant="interrupted">
        parcial
      </MessageBubble>,
    );

    const content = screen.getByText('parcial');
    const label = screen.getByText(/resposta interrompida/i);

    expect(content.compareDocumentPosition(label)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('assistant: botao copy copia textContent', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<MessageBubble role="assistant">conteudo completo</MessageBubble>);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar mensagem/i }));
    });

    expect(writeText).toHaveBeenCalledWith('conteudo completo');
  });

  it('nao renderiza copy durante streaming', () => {
    render(
      <MessageBubble role="assistant" isStreaming>
        resposta parcial
      </MessageBubble>,
    );

    expect(screen.queryByRole('button', { name: /copiar mensagem/i })).not.toBeInTheDocument();
  });

  it('timestamp fica oculto por padrao tambem para user', () => {
    const { container } = render(
      <MessageBubble role="user" timestamp={Date.now() - 2 * 60 * 1000}>
        ola
      </MessageBubble>,
    );

    expect(container.querySelector('time')?.className).toMatch(/opacity-0/);
  });

  it('attachments do user usam chip sm e ficam alinhados a direita', () => {
    render(
      <MessageBubble role="user" attachments={[makeAttachment()]}>
        ola
      </MessageBubble>,
    );

    const attachmentImage = screen.getByRole('img', { name: 'foto.png' });
    const attachmentsRow = attachmentImage.closest('.mt-3');

    expect(attachmentImage.parentElement?.className).toMatch(/h-10/);
    expect(attachmentsRow?.className).toMatch(/justify-end/);
  });

  it('aplica className customizado no wrapper', () => {
    const { container } = render(
      <MessageBubble role="assistant" className="wrapper-custom">
        resposta
      </MessageBubble>,
    );

    expect((container.firstChild as HTMLElement).className).toMatch(/wrapper-custom/);
  });

  it('tap em coarse pointer revela timestamp, mas nao copy', () => {
    const now = Date.now() - 2 * 60 * 1000;
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    const { container } = render(
      <MessageBubble role="assistant" timestamp={now}>
        resposta
      </MessageBubble>,
    );

    const wrapper = container.firstChild as HTMLElement;
    const time = container.querySelector('time');
    const copyButton = screen.getByRole('button', { name: /copiar mensagem/i });

    fireEvent.click(wrapper);

    expect(time?.className).toMatch(/opacity-100/);
    expect(copyButton.className).toMatch(/opacity-0/);
  });

  it('long press revela copy e timestamp no mobile', () => {
    const now = Date.now() - 2 * 60 * 1000;
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaMock,
    });

    vi.useFakeTimers();

    const { container } = render(
      <MessageBubble role="assistant" timestamp={now}>
        resposta
      </MessageBubble>,
    );

    const wrapper = container.firstChild as HTMLElement;
    const time = container.querySelector('time');
    const copyButton = screen.getByRole('button', { name: /copiar mensagem/i });

    expect(time?.className).toMatch(/opacity-0/);
    expect(copyButton.className).toMatch(/opacity-0/);

    act(() => {
      fireEvent.touchStart(wrapper);
      vi.advanceTimersByTime(450);
    });

    expect(time?.className).toMatch(/opacity-100/);
    expect(copyButton.className).toMatch(/opacity-100/);

    act(() => {
      fireEvent.touchEnd(wrapper);
    });
    vi.useRealTimers();
  });
});
