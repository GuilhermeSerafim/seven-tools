import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ToolChatShell } from '../ToolChatShell';
import { ToolChatSidebar } from '../ToolChatSidebar';

const baseProps = {
  sessions: [
    {
      id: 's1',
      userId: 'u1',
      toolSlug: 'proposta-comercial-smart',
      title: 'Proposta Aurora',
      metadata: {},
      createdAt: '2026-05-25T10:00:00Z',
      updatedAt: '2026-05-25T10:00:00Z',
    },
  ],
  activeSessionId: 's1',
  searchQuery: '',
  loading: false,
  error: null,
  onSearchChange: vi.fn(),
  onNewChat: vi.fn(),
  onOpenSession: vi.fn(),
};

describe('ToolChatSidebar', () => {
  it('renderiza novo chat, busca e recentes', () => {
    render(<ToolChatSidebar {...baseProps} />);

    expect(screen.getByRole('button', { name: /novo chat/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /buscar conversas/i })).toBeInTheDocument();
    expect(screen.getByText('Recentes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /proposta aurora/i })).toBeInTheDocument();
  });

  it('aciona callbacks de novo chat e abrir sessao', () => {
    const onNewChat = vi.fn();
    const onOpenSession = vi.fn();

    render(
      <ToolChatSidebar
        {...baseProps}
        onNewChat={onNewChat}
        onOpenSession={onOpenSession}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /novo chat/i }));
    fireEvent.click(screen.getByRole('button', { name: /proposta aurora/i }));

    expect(onNewChat).toHaveBeenCalledTimes(1);
    expect(onOpenSession).toHaveBeenCalledWith('s1');
  });

  it('aciona callback de busca ao digitar', () => {
    const onSearchChange = vi.fn();

    render(<ToolChatSidebar {...baseProps} onSearchChange={onSearchChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: /buscar conversas/i }), {
      target: { value: 'aurora' },
    });

    expect(onSearchChange).toHaveBeenCalledWith('aurora');
  });

  it('mostra estado vazio', () => {
    render(<ToolChatSidebar {...baseProps} sessions={[]} />);

    expect(screen.getByText('Nenhuma conversa ainda')).toBeInTheDocument();
  });

  it('mostra estado de busca sem resultado', () => {
    render(<ToolChatSidebar {...baseProps} sessions={[]} searchQuery="aurora" />);

    expect(screen.getByText('Nenhuma conversa encontrada')).toBeInTheDocument();
  });
});

describe('ToolChatShell', () => {
  const shellProps = {
    sessions: baseProps.sessions,
    activeSessionId: baseProps.activeSessionId,
    searchQuery: '',
    loadingSessions: false,
    sessionsError: null,
    onSearchChange: vi.fn(),
    onNewChat: vi.fn(),
    onOpenSession: vi.fn(),
  };

  it('abre o historico mobile com titulo acessivel', () => {
    render(
      <ToolChatShell {...shellProps}>
        <main>Conteudo do chat</main>
      </ToolChatShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /abrir historico/i }));

    expect(screen.getByRole('dialog', { name: /historico de conversas/i })).toBeInTheDocument();
  });

  it('fecha o historico mobile depois de criar novo chat', async () => {
    const onNewChat = vi.fn();

    render(
      <ToolChatShell {...shellProps} onNewChat={onNewChat}>
        <main>Conteudo do chat</main>
      </ToolChatShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /abrir historico/i }));
    const dialog = screen.getByRole('dialog', { name: /historico de conversas/i });

    fireEvent.click(within(dialog).getByRole('button', { name: /novo chat/i }));

    expect(onNewChat).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /historico de conversas/i })).not.toBeInTheDocument();
    });
  });

  it('fecha o historico mobile depois de abrir sessao', async () => {
    const onOpenSession = vi.fn();

    render(
      <ToolChatShell {...shellProps} onOpenSession={onOpenSession}>
        <main>Conteudo do chat</main>
      </ToolChatShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /abrir historico/i }));
    const dialog = screen.getByRole('dialog', { name: /historico de conversas/i });

    fireEvent.click(within(dialog).getByRole('button', { name: /proposta aurora/i }));

    expect(onOpenSession).toHaveBeenCalledWith('s1');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /historico de conversas/i })).not.toBeInTheDocument();
    });
  });
});
