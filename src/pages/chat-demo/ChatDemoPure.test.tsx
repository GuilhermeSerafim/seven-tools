import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ChatDemoPure from './ChatDemoPure';

const chatMock = vi.hoisted(() => ({
  send: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('@/agents/chat/demo/useChatDemo', () => ({
  useChatDemo: () => ({
    messages: [],
    isStreaming: false,
    send: chatMock.send,
    stop: chatMock.stop,
    reset: chatMock.reset,
  }),
}));

class LoadedImage {
  complete = true;
  naturalWidth = 1;
  src = '';
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

describe('ChatDemoPure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Image', LoadedImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the Caloni demo and lets a suggestion fill the composer', async () => {
    const { container } = render(<ChatDemoPure />);

    expect(screen.getByRole('heading', { name: 'Caloni' })).toBeInTheDocument();
    const caloniAvatars = await screen.findAllByRole('img', { name: 'Caloni' });
    expect(caloniAvatars.length).toBeGreaterThanOrEqual(2);
    caloniAvatars.forEach((img) => {
      expect(img).toHaveAttribute('src', '/caloni-photo.jpg.jpg');
    });
    expect(screen.getByText('Decisor Comercial')).toBeInTheDocument();
    expect(screen.queryByText('Decisor Comercial (demo)')).not.toBeInTheDocument();
    expect(screen.queryByText('DEMO')).not.toBeInTheDocument();
    expect(screen.queryByText('Modo:')).not.toBeInTheDocument();
    expect(screen.queryByText('pure')).not.toBeInTheDocument();
    expect(screen.queryByText('split')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Converse comigo sobre diagnóstico, proposta ou lead. Posso analisar PDFs e imagens.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Converse com o Caloni...')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Diagnóstico rápido' }));

    expect(screen.getByPlaceholderText('Converse com o Caloni...')).toHaveValue(
      'Faça um diagnóstico do meu negócio',
    );

    const chatShell = container.querySelector('[data-layout="pure-inner"]')?.parentElement;
    expect(chatShell).not.toBeNull();
    expect(chatShell?.className).toContain('h-[100dvh]');
    expect(chatShell?.className).not.toContain('h-full');
  });

  it('expõe controles de demo e limpa o composer no reset', () => {
    render(<ChatDemoPure />);

    const textarea = screen.getByPlaceholderText('Converse com o Caloni...');

    fireEvent.click(screen.getByRole('button', { name: 'Diagnóstico rápido' }));
    expect(textarea).toHaveValue('Faça um diagnóstico do meu negócio');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(chatMock.reset).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: 'Simular erro' }));
    expect(chatMock.send).toHaveBeenLastCalledWith('simular erro', []);

    const disabledToggle = screen.getByRole('button', { name: 'Alternar disabled' });
    fireEvent.click(disabledToggle);
    expect(disabledToggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeDisabled();

    const manualStreamingToggle = screen.getByRole('button', {
      name: 'Alternar streaming manual',
    });
    fireEvent.click(manualStreamingToggle);
    expect(manualStreamingToggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Parar resposta' }));
    expect(manualStreamingToggle).toHaveAttribute('aria-pressed', 'false');
  });
});
